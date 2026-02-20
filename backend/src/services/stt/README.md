# Speech-to-Text (STT) Module

## Overview

This module provides live speech-to-text using a local whisper.cpp server. Google Cloud Speech-to-Text is an optional fallback if enabled.

**PIPELINE:**
```
Microphone → PyAudio → MicrophoneStream → Whisper.cpp server (/inference) → Final Transcripts
```

## Files

- `mic_stream.py` - Handles microphone input via PyAudio, chunks audio into 100ms segments, optional VAD
- `engine.py` - Streams microphone audio to the local whisper.cpp server (optional Google fallback)
- `list_devices.py` - Helper script to identify your microphone's device index
- `test_mic_stream.py` - Tests microphone input by recording a 5-second WAV file
- `test_transcribe.py` - Tests live transcription by printing transcripts to console

## Authentication

**Only needed if you want the Google fallback.**

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

## Setup

### 0. Start the local whisper.cpp server

Run your whisper.cpp server so it listens on `http://127.0.0.1:8080` with an `/inference` endpoint. If you use a different host or port, update the `server_url` in `engine.py`.

### 1. Find Your Microphone Name (or Index)

Install requirements using `pip install -r requirements.txt` in the src directory.
**Important** If you're on mac, you must install `portaudio` onto your computer or pyaudio will not install.

Run the device listing script to find your microphone:
```bash
python list_devices.py
```

Look for your microphone in the output. **On Windows, use devices with "Windows WASAPI" as the Host API type.**

Example output:
```
Index | Host API             | Channels | Rate       | Name
--------------------------------------------------------------------------------
24    | Windows WASAPI       | 2        | 48000.0    | Microphone (4- fifine Microphone)
```

Note the device name (e.g., `Microphone (4- fifine Microphone)`) or the index number (e.g., `24`).

### 2. Update Microphone Selection

Default selection uses device name matching with `DEFAULT_MIC_NAME = "LavMicro"`.
Update either:
- `engine.py`: `DEFAULT_MIC_NAME = "LavMicro"`
- `Test/test_mic_stream.py`: `TARGET_NAME = "LavMicro"`

If you prefer a fixed index, set `mic_index` explicitly (the name match is ignored when `mic_index` is set).

## 3. Test Your Setup

**Test microphone input:**
```bash
cd Test
python test_mic_stream.py
```
This records 5 seconds and saves to `mic_class_test.wav`.

**Test live transcription:**
```bash
cd Test
python test_transcribe.py
```
Speak into your microphone and watch transcripts appear in real-time.

## Usage

### Integrating with an LLM/Agent

The `transcribe_streaming_v2()` function is a generator that yields final transcripts. With the use of FastAPI we can send these transcripts live to the Agent. 

Here's how to do it:

1. Follow the Instructions in the `llm` directory to run the fastapi wrapped mcp server
2. cd into `stt/Test`
3. `python test_transcribe`

### Voice Activity Detection (VAD)

VAD is enabled by default in `engine.py` and uses a simple energy threshold to filter silence.
Tune it by passing `vad_enabled`, `vad_energy_threshold`, `vad_speech_ms`, or `vad_silence_ms` to `MicrophoneStream`.

## Requirements

- Python 3.13 or lower (not 3.14)
- requests
- A local whisper.cpp server with an `/inference` endpoint
- google-cloud-speech library (optional, only for fallback)
- A valid Google Cloud service account with Speech-to-Text permissions (fallback only)

## Resources

- [Google Cloud Speech-to-Text Documentation](https://docs.cloud.google.com/speech-to-text/docs/reference/rpc/google.cloud.speech.v2)
- [Google OAuth 2.0 for Server-to-Server Applications](https://developers.google.com/identity/protocols/oauth2/service-account)
- [IAM Documentation](https://cloud.google.com/iam/docs)
- [PyAudio Documentation](https://people.csail.mit.edu/hubert/pyaudio/docs/)
- [Audio Stream Optimization](https://docs.cloud.google.com/speech-to-text/docs/v1/optimizing-audio-files-for-speech-to-text)
- [Audio Stream Documentation](https://docs.cloud.google.com/speech-to-text/docs/v1/optimizing-audio-files-for-speech-to-text)
- [STT Best Practices](https://docs.cloud.google.com/speech-to-text/docs/best-practices)

## Required IAM roles for service account

```
Cloud Speech Client
```

## Troubleshooting

**"Audio device not found" or wrong microphone**
- Run `list_devices.py` and update `DEFAULT_MIC_NAME` or `mic_index`
- On Windows, use "Windows WASAPI" devices

**"Connection Refused" to local server**
- Confirm the whisper.cpp server is running and the `/inference` endpoint is reachable
- Update the `server_url` in `engine.py` if you are not using `http://127.0.0.1:8080`

**No transcripts appearing**
- Check your `.env` file has correct credentials
- Verify your service account has "Cloud Speech Client" role
- Make sure you're speaking clearly and there's no excessive background noise
