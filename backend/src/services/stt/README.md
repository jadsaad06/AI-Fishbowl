# Speech-to-Text (STT) Module

## Overview

This module provides speech-to-text functionality using Google Cloud Speech-to-Text API. It currently supports transcribing audio files with plans to add live microphone transcription in the future.

## Authentication

**Important:** Google Cloud Speech-to-Text (v2, streaming) does **not** support API keys.
It requires OAuth authentication using a **service account**.

This is because streaming STT is a long-running, high-cost API, and Google locks it behind
IAM/OAuth instead of simple API keys.

### Setting Up Authentication

You’ll need a **service account JSON key** from the Google Cloud Console.

Set the following environment variables:

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

## Testing

To test the STT module:

1. Ensure you have set up authentication as described above
2. Navigate to the `stt` directory (Important: make sure you are in the stt directory not the Test directory)
3. Run the test script:
```
python -m Test.test_transcribe
```
4. You should see the transcript of the test audio file printed to the console

## Requirements

- Python 3.13 or lower (not 3.14)
- google-cloud-speech library (added to requirements.txt)
- A valid Google Cloud service account with Speech-to-Text permissions

## Resources

- [Google Cloud Speech-to-Text Documentation](https://docs.cloud.google.com/speech-to-text/docs/reference/rpc/google.cloud.speech.v2)
- [Google OAuth 2.0 for Server-to-Server Applications](https://developers.google.com/identity/protocols/oauth2/service-account)
- [IAM Documentation](https://cloud.google.com/iam/docs)

## Required IAM roles for service account

```
Cloud Speech Client
```