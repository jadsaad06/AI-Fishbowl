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


setup() {
	load_envs
	ensure_defaults


	echo "*****Creating Python virtual environment..."
	python3 -m venv "$VENV"
	source "$VENV/bin/activate"

	echo "*****Installing Python dependencies..."
	pip install -r "$ROOT/backend/requirements.txt"
	pip install -r "$ROOT/hardware/requirements.txt"

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
    load_envs
    ensure_defaults

    if [ ! -d "$VENV" ]; then
        echo "Missing venv at $VENV. Run: $0 setup"
        exit 1
    fi
    source "$VENV/bin/activate"

    # --- WHISPER SERVER LOGIC ---
    SERVER_PID=""

    echo "*****Attempting to start local Whisper STT server."

    cleanup() {
        if [ -n "${SERVER_PID:-}" ]; then
            echo -e "\n*****Stopping Whisper Server (PID: $SERVER_PID)."
            kill "$SERVER_PID" 2>/dev/null || true
        fi
    }
    trap cleanup EXIT

    if [ -f "$WHISPER_BIN" ]; then
        echo "*****Found Whisper binary. Starting local STT server."

        # Log output to file for debugging
        LOG_FILE="$ROOT/whisper_server.log"
        "$WHISPER_BIN" \
            -m "$WHISPER_MODEL" \
            --host 127.0.0.1 --port 8080 > "$LOG_FILE" 2>&1 &

        SERVER_PID=$!

        # Health check: Wait for port 8080 (requires netcat) or just verify process is alive
        local tries=0
        local max_tries=10
        local started=false

        while [ $tries -lt $max_tries ]; do
            if kill -0 $SERVER_PID 2>/dev/null; then
                # Optional: Check if port is actually open using nc (netcat)
                # if nc -z 127.0.0.1 8080; then started=true; break; fi

                # Simple Fallback: Just assume 2 seconds is enough if process didn't die
                if [ $tries -ge 2 ]; then started=true; break; fi
            else
                break
            fi
            sleep 1
            tries=$((tries+1))
        done

        if [ "$started" = true ]; then
             echo "*****Whisper Server active (PID: $SERVER_PID)."
        else
             echo "*****Warning: Whisper Server failed to start. See $LOG_FILE for details."
             SERVER_PID=""
        fi
    else
        echo "*****Whisper binary not found at $WHISPER_BIN"
        echo "*****Skipping local server. App will use Google Cloud STT."
    fi

    # Start Frontend
    (cd "$ROOT/frontend/electron" && npm start)
}


case "${1:-}" in
setup) setup ;;
run) run ;;
*) echo "Usage: $0 {setup|run}" ;;
esac


