# Speech-to-Text (STT) Module

## Overview

This module provides live speech-to-text functionality using Google Cloud Speech-to-Text API v2. It streams audio from your microphone to Google's API and returns real-time transcriptions.

**PIPELINE:**
```
Microphone → PyAudio → MicrophoneStream → Google Cloud STT API → Final Transcripts
```

## Files

- `mic_stream.py` - Handles microphone input via PyAudio, chunks audio into 100ms segments
- `engine.py` - Connects to Google Cloud STT API and streams microphone audio for transcription
- `list_devices.py` - Helper script to identify your microphone's device index
- `test_mic_stream.py` - Tests microphone input by recording a 5-second WAV file
- `test_transcribe.py` - Tests live transcription by printing transcripts to console

## Authentication

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

## Usage

### Transcribing Audio Files

```python
from engine import transcribe_streaming_v2

# Path to your audio file (WAV format recommended)
audio_file_path = "path/to/your/audio/file.wav"

# Get transcription responses
responses = transcribe_streaming_v2(audio_file_path)

# Combine all transcription segments into a single string
# Each response may contain multiple results, and each result may have alternatives
full_transcript = ""
for response in responses:
    for result in response.results:
        if result.alternatives:
            full_transcript += result.alternatives[0].transcript + " " # We take the highest confidence alternative (index 0) from each result and concatenate them

print(full_transcript)
```

### Response Format

The `transcribe_streaming_v2` function returns a list of `StreamingRecognizeResponse` objects from the Google Cloud Speech-to-Text API. Each response contains:

- Metadata about the recognition request
- Results with transcribed text and confidence scores
- Language detection information

## Setup

### 1. Find Your Microphone Index

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

Note the index number (e.g., `24`).

### 2. Update Microphone Index

Update the `mic_index` parameter in:
- `engine.py` (line 26): `def transcribe_streaming_v2(mic_index=24):`
- `test_mic_stream.py` (line 17): `TARGET_INDEX = 24`

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

The `transcribe_streaming_v2()` function is a generator that yields final transcripts. Here's how to integrate it:
```python
from engine import transcribe_streaming_v2

# Your LLM/agent code
for user_input in transcribe_streaming_v2():
    # user_input contains the completed transcription text
    llm_response = your_llm_function(user_input)
    print(f"Agent: {llm_response}")
```
Note that `test_transcribe.py` has an example of this

The generator will:
- Continuously listen to the microphone
- Yield each final transcript when speech pauses
- Run indefinitely until interrupted (Ctrl+C)

## Requirements

- Python 3.13 or lower (not 3.14)
- google-cloud-speech library (added to requirements.txt)
- A valid Google Cloud service account with Speech-to-Text permissions

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
- Run `list_devices.py` and update your `mic_index`
- On Windows, use "Windows WASAPI" devices

**No transcripts appearing**
- Check your `.env` file has correct credentials
- Verify your service account has "Cloud Speech Client" role
- Make sure you're speaking clearly and there's no excessive background noise