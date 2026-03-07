# Hardware README

## Overview

### `mic-input.py`
- `hardware/src/mic-input.py` records for a fixed duration, then exits and saves a `.wav` file.

### `VAD.py`
- `hardware/src/VAD.py` is the primary recording path.
- It uses voice activity detection (VAD) to start/stop capture based on audio energy.
- Output is written to `hardware/src/mic-output.wav`.

### Example File
- `hardware/voice-sample.wav` can be used for testing.

## Setup

```bash
# from repo root
python -m venv .venv

# Linux/macOS
source .venv/bin/activate

# Windows PowerShell
.venv\Scripts\Activate.ps1

pip install -r requirements.txt
```

## Configure Hardware Environment

Create `hardware/.env` from `hardware/.env.example`.

The hardware env file now supports optional Whisper server overrides used by `fishbowl.sh`:

- `WHISPER_ROOT`
- `WHISPER_BIN`
- `WHISPER_MODEL`

If they are not set, defaults are used:

- `WHISPER_ROOT=$HOME/whisper.cpp`
- `WHISPER_BIN=$WHISPER_ROOT/build/bin/whisper-server`
- `WHISPER_MODEL=$WHISPER_ROOT/models/ggml-base.en.bin`

Note: `hardware/src/VAD.py` and `hardware/src/mic-input.py` currently use in-file constants for `MIC_NAME`, sample rate, and VAD thresholds. They do not read these values from `.env`.

## Whisper Model Setup (whisper.cpp)

The runtime expects a local `whisper.cpp` server binary and model file.

### 1) Build whisper.cpp server

```bash
git clone https://github.com/ggml-org/whisper.cpp.git ~/whisper.cpp
cd ~/whisper.cpp
cmake -B build
cmake --build build -j
```

### 2) Download a model

```bash
cd ~/whisper.cpp
./models/download-ggml-model.sh base.en
```

This creates the default model file:
`~/whisper.cpp/models/ggml-base.en.bin`

### 3) Verify expected files exist

```bash
ls ~/whisper.cpp/build/bin/whisper-server
ls ~/whisper.cpp/models/ggml-base.en.bin
```

### 4) Run Fishbowl

From repo root:

```bash
./fishbowl.sh setup
./fishbowl.sh run
```

During startup, the script tries to launch the local Whisper server.  
If not found, STT falls back to Google Cloud STT (when backend credentials are configured in `backend/.env`).

## Running Hardware-Only Microphone Scripts

```bash
cd hardware/src
python VAD.py
# or
python mic-input.py
```

Notes:
- `MIC_NAME` and `SAMPLE_RATE` constants may need adjustment per device.
- On non-Linux systems, microphone/device handling may differ.
- `mic-output.wav` is overwritten on each run.
