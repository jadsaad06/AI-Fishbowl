"""
https://docs.cloud.google.com/speech-to-text/docs/streaming-recognize
The is the documentation I am referencing. Note that it supports the
transcription of live audio and audio files.

PIPELINE:
Microphone -> PyAudio -> MicrophoneStream -> get_request_stream() -> Google Cloud STT API -> responses_iterator -> Terminal Output
"""

import os
import sys
import io
import wave
import requests
import numpy as np
from dotenv import load_dotenv
from google.cloud import speech

from mic_stream import MicrophoneStream

load_dotenv()

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")
DEFAULT_MIC_NAME = "LavMicro"
_current_mic = None

class HybridTranscriber:
    def __init__(self, server_url="http://127.0.0.1:8080"):
        self.server_url = f"{server_url}/inference"
        self.google_available = False
        self.target_rate = 16000  # Whisper Server expects 16k wav usually

        # 1. Setup Google Cloud Fallback
        try:
            self.google_client = speech.SpeechClient()
            self.google_config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=self.target_rate,
                language_code="en-US",
            )
            self.google_available = True
        except Exception as e:
            print(f"[Engine] Google Cloud failed: {e}", file=sys.stderr)

    def _convert_to_wav(self, pcm_data, sample_rate):
        """
        Wraps raw PCM bytes into an in-memory WAV file object.
        Required because whisper.cpp server expects a file upload.
        """
        wav_io = io.BytesIO()
        with wave.open(wav_io, "wb") as wav_file:
            wav_file.setnchannels(1)
            wav_file.setsampwidth(2)  # 16-bit
            wav_file.setframerate(sample_rate)
            wav_file.writeframes(pcm_data)
        wav_io.seek(0)
        return wav_io

    def transcribe(self, int16_bytes, mic_rate):
        # 1. Try Local Whisper Server
        try:
            # Prepare WAV file in memory
            # Note: We send the audio at the MIC's native rate.
            # The whisper.cpp server usually handles resampling, but 16k is safest
            wav_file = self._convert_to_wav(int16_bytes, mic_rate)

            files = {
                'file': ('audio.wav', wav_file, 'audio/wav')
            }
            data = {
                'temperature': '0.0',
                'temperature_inc': '0.2',
                'response_format': 'json'
            }

            # Send POST request
            response = requests.post(self.server_url, files=files, data=data, timeout=5)

            if response.status_code == 200:
                result = response.json()
                # The server returns JSON like { "text": "..." }
                text = result.get("text", "").strip()
                if text:
                    # Often whisper.cpp outputs [BLANK_AUDIO] or similar, filter if needed
                    print(f"[Local Server]: {text}", file=sys.stderr)
                    return text
            else:
                print(f"[Local Server] Error {response.status_code}: {response.text}", file=sys.stderr)

        except requests.exceptions.ConnectionError:
            print("[Local Server] Connection Refused. Is ./server running?", file=sys.stderr)
        except Exception as e:
            print(f"[Local Server] Error: {e}", file=sys.stderr)

        # Fallback to Google
        if self.google_available:
            try:

                audio = speech.RecognitionAudio(content=int16_bytes)

                # Update config sample rate to match mic if different
                if self.google_config.sample_rate_hertz != mic_rate:
                    self.google_config.sample_rate_hertz = mic_rate

                response = self.google_client.recognize(config=self.google_config, audio=audio)
                for result in response.results:
                    print(f"[Google]: {result.alternatives[0].transcript}", file=sys.stderr)
                    return result.alternatives[0].transcript
            except Exception as e:
                print(f"[Engine] Google error: {e}", file=sys.stderr)

        return None


def transcribe_streaming_v2(
    mic_index=None,
    mic_name=DEFAULT_MIC_NAME,
    vad_enabled=True,
    vad_keepalive=True,
    vad_keepalive_ms=1000,
):
    global _current_mic

    print("Initializing Hybrid Engine (Server Mode).\n")
    transcriber = HybridTranscriber(server_url="http://127.0.0.1:8080")

    try:
        name_contains = mic_name if mic_index is None else None

        with MicrophoneStream(
            index=mic_index,
            name_contains=name_contains,
            vad_enabled=vad_enabled,
            vad_keepalive=vad_keepalive,
            vad_keepalive_ms=vad_keepalive_ms,
            # removed 'rate' arg to use default mic rate
        ) as mic:
            _current_mic = mic
            print(f"Using: {mic.device_name} | {mic.rate}Hz, {mic.channels} channel(s)")
            print(f"Listening. Press Ctrl+C to stop\n", flush=True)

            audio_buffer = bytearray()

            for chunk in mic.generator():
                if chunk is None:
                    # Silence detected -> Transcribe
                    if len(audio_buffer) > 0:
                        transcript = transcriber.transcribe(bytes(audio_buffer), mic.rate)
                        if transcript:
                            yield transcript

                        audio_buffer = bytearray()
                else:
                    audio_buffer.extend(chunk)

    except KeyboardInterrupt:
        print("\n\n* Stopped listening")
        raise
    except Exception as e:
        print(f"\n\nError: {e}")
        raise

def get_current_mic():
    return _current_mic
