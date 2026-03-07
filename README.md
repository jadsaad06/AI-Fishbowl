# AI Fishbowl

AI Fishbowl is a voice-first interactive kiosk experience built for the Portland State University Computer Science capstone project. The system listens for speech, routes prompts to personality-based LLM agents, speaks responses aloud, and animates a fish character in an Electron front end.

## Current Repository Layout

- `backend/`: FastAPI + MCP client/server, STT fallback support, TTS integration, and LLM/RAG components
- `frontend/electron/`: Electron kiosk app and Pixi-based animation scenes
- `hardware/`: microphone and VAD scripts, plus case-hardware scripts for Jetson devices
- `fishbowl.sh`: end-to-end setup/run script used for Linux/Jetson workflows

## Architecture (Current)

1. Microphone audio is captured in backend STT scripts.
2. User transcript is sent to the MCP-backed agent service.
3. Agent response is sent to TTS.
4. Electron updates visual scene state and subtitles while audio plays.

## Prerequisites

- Python 3.11-3.13
- Node.js 18+ and npm
- (Optional) whisper.cpp local server for local STT
- (Optional) Jetson dependencies for case-hardware scripts

## Setup

### 1) Install Python dependencies (root)

```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# Linux/macOS
source .venv/bin/activate

pip install -r requirements.txt
```

`requirements.txt` in the repo root now installs combined Python deps from:

- `backend/requirements.txt`
- `hardware/requirements.txt`

Jetson-only case hardware dependencies remain optional at:

- `hardware/src/case-hardware/requirements.txt`

### 2) Install frontend dependencies

```bash
cd frontend/electron
npm install
```

### 3) Configure environment variables

Create `.env` files from the consolidated examples:

- `backend/.env.example` -> `backend/.env`
- `frontend/.env.example` -> `frontend/.env`
- `hardware/.env.example` -> `hardware/.env`

**Important:** Google Cloud Speech-to-Text (v2, streaming) does **not** support API keys.
It requires OAuth authentication using a **service account**.

This is because streaming STT is a long-running, high-cost API, and Google locks it behind IAM/OAuth instead of simple API keys.

### Setting Up Authentication

You’ll need a **service account JSON key** from the Google Cloud Console.

Set the following environment variables in your `.env` file:
```
GOOGLE_APPLICATION_CREDENTIALS="path/to/your-service-account.json"
GOOGLE_CLOUD_PROJECT="your-google-cloud-project-id"
```

For **Local STT Setup** go to hardware/README.md

Notes:

- `backend/.env.example` contains backend variables used by MCP server/client, RAG loading, STT fallback, and TTS runtime device selection.
- `frontend/.env.example` contains frontend variables used by Electron preload/main process.
- `hardware/.env.example` is currently a placeholder because no hardware env vars are required today.

Electron reads `frontend/.env` directly, so no duplicate `frontend/electron/.env` file is required.

## Running

### Full stack (Linux/Jetson workflow)

```bash
./fishbowl.sh setup
./fishbowl.sh run
```

### Run components manually

- Backend MCP server: `python backend/src/mcp_stack/server.py`
- Backend MCP client (FastAPI): `fastapi dev backend/src/mcp_stack/client.py`
- Frontend: `cd frontend/electron && npm start`

## Project Status

Active development. Core pipelines are integrated, and documentation is being updated as modules are stabilized.
