#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV="${ROOT}/.venv"

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
	#(cd "$ROOT/backend/src/mcp_stack" && fastapi dev client.py)
	(cd "$ROOT/frontend/electron" && npm start)
}


case "${1:-}" in
setup) setup ;;
run) run ;;
*) echo "Usage: $0 {setup|run}" ;;
esac
