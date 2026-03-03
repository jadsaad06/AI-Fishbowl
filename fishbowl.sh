#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="${ROOT}/.venv"

WHISPER_ROOT="$HOME/whisper.cpp"
WHISPER_BIN="$WHISPER_ROOT/build/bin/whisper-server"
WHISPER_MODEL="$WHISPER_ROOT/models/ggml-base.en.bin"

TTS_ENV="$ROOT/backend/src/services/tts/.env"
STT_ENV="$ROOT/backend/src/services/stt/.env"
LLM_ENV="$ROOT/backend/src/services/llm/.env"
SCREEN_PID=""
SERVER_PID=""

SYSTEM=$(cat /proc/device-tree/model)
ON_JETSON=0

if [[ "$SYSTEM" == *"Orin Nano"* ]]; then
	echo "Detected Jetson Orin Nano!"
	ON_JETSON=1
else
	echo "Not on Jetson Orin Nano. Case hardware setup will be skipped."
	ON_JETSON=0
fi


load_envs() {
	echo "*****Loading .env files..."
	local env_files=(
		"$TTS_ENV"
		"$STT_ENV"
		"$LLM_ENV"
	)
	local env_file=""

	set -a
	for env_file in "${env_files[@]}"; do
		if [ -f "$env_file" ]; then
			# shellcheck disable=SC1090
			source "$env_file"
		else
			echo "Warning: missing env file: $env_file"
		fi
	done
	set +a
}


ensure_defaults() {
	# Export envs centrally to avoid cwd-dependent load_dotenv()
	export GOOGLE_API_KEY="${GOOGLE_API_KEY:-}"
	export PATH_NAME="${PATH_NAME:-computer-science}"
	export GOOGLE_APPLICATION_CREDENTIALS="${GOOGLE_APPLICATION_CREDENTIALS:-}"
	export GOOGLE_CLOUD_PROJECT="${GOOGLE_CLOUD_PROJECT:-}"
	export KEY="${KEY:-}" # Gemini TTS
}

cleanup_screen() {
	local pid="${SCREEN_PID:-}"
	if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
		kill -INT "$pid" 2>/dev/null || true
		wait "$pid" 2>/dev/null || true
	fi
	SCREEN_PID=""
}

cleanup_led() {
	python "$ROOT/hardware/src/case-hardware/led-off.py"
}

cleanup_server() {
	local pid="${SERVER_PID:-}"
	if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
		echo ""
		echo "*****Stopping Whisper Server (PID: $pid)."
		kill -TERM "$pid" 2>/dev/null || true
		wait "$pid" 2>/dev/null || true
	fi
	SERVER_PID=""
}

cleanup_all() {
	cleanup_screen
	cleanup_server
	cleanup_led
}

setup() {
	load_envs
	ensure_defaults


	echo "*****Creating Python virtual environment..."
	python3 -m venv "$VENV"
	source "$VENV/bin/activate"

	echo "*****Installing Python dependencies..."
	pip install -r "$ROOT/backend/requirements.txt"
	pip install -r "$ROOT/hardware/requirements.txt"
	if [[ $ON_JETSON == 1 ]]; then
		pip install -r "$ROOT/hardware/src/case-hardware/requirements.txt"
		pip install "$HOME/torch-2.5.0a0+872d972e41.nv24.08.17622132-cp310-cp310-linux_aarch64.whl"
	fi

	echo "*****Installing NodeJS dependencies..."
	(cd "$ROOT/frontend/electron" && npm install)

	# Build RAG DB if needed
	echo "*****Checking RAG database..."
	if [ ! -d "$ROOT/backend/src/services/llm/RAG_DB/.chromadb" ]; then
		echo "*****Loading RAG database..."
		(cd "$ROOT/backend/src/services/llm/RAG_DB" && python loaddb.py)
	fi

	echo "*****Setup complete."
}


run() {
	# set up environment
	load_envs
	ensure_defaults
	if [ ! -d "$VENV" ]; then
		echo "Missing venv at $VENV. Run: $0 setup"
		exit 1
	fi
	source "$VENV/bin/activate"

	# traps for actions on program exit
	trap cleanup_all EXIT
	trap 'cleanup_all; exit 130' INT
	trap 'cleanup_all; exit 143' TERM
	trap 'cleanup_all; exit 129' HUP

	# --- WHISPER SERVER LOGIC ---
	SERVER_PID=""
	echo "*****Attempting to start local Whisper STT server."
	if [ -f "$WHISPER_BIN" ] && [ -f "$WHISPER_MODEL" ]; then
		echo "*****Found Whisper binary/model. Starting local STT server."

		# Log output to file for debugging
		local log_file="$ROOT/whisper_server.log"
		"$WHISPER_BIN" \
			-m "$WHISPER_MODEL" \
			--host 127.0.0.1 --port 8080 > "$log_file" 2>&1 &
		SERVER_PID=$!

		# Health check: verify process stays alive briefly.
		local tries=0
		local max_tries=10
		local started=false
		while [ "$tries" -lt "$max_tries" ]; do
			if kill -0 "$SERVER_PID" 2>/dev/null; then
				if [ "$tries" -ge 2 ]; then
					started=true
					break
				fi
			else
				break
			fi
			sleep 1
			tries=$((tries + 1))
		done

		if [ "$started" = true ]; then
			echo "*****Whisper Server active (PID: $SERVER_PID)."
		else
			echo "*****Warning: Whisper Server failed to start. See $log_file for details."
			echo "*****Skipping local server. App will use Google Cloud STT."
			cleanup_server
		fi
	else
		echo "*****Whisper binary/model not found."
		echo "*****Skipping local server. App will use Google Cloud STT."
	fi

	# run case hardware scripts if on Jetson, start program
	if [[ $ON_JETSON == 1 ]]; then
		python "$ROOT/hardware/src/case-hardware/led-color.py"
		python "$ROOT/hardware/src/case-hardware/screen.py" &
		SCREEN_PID=$!
	fi
	(cd "$ROOT/frontend/electron" && npm start)

}


case "${1:-}" in
setup) setup ;;
run) run ;;
*) echo "Usage: $0 {setup|run}" ;;
esac

