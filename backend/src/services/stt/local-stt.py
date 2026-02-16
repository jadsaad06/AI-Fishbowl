import os
import time
import numpy as np
import pyaudio
from google.cloud import speech

# Try importing the local model binding
try:
    from pywhispercpp.model import Model
except ImportError:
    print("Error: pywhispercpp not installed. Run 'pip install pywhispercpp'")
    sys.exit(1)

from mic_stream import MicrophoneStream

class VADAudioStream(MicrophoneStream):
    """
    Wraps the existing MicrophoneStream to yield 'None' when silence is detected.
    This signal tells the main loop to process the buffer.
    """
    def generator(self):
        # Initialize internal VAD counters (re-implementing logic for yielding signals)
        # Note: We rely on the existing VAD logic but need to inject the "None" signal
        iterator = super().generator()
        
        # We need to detect the console output or state change. 
        # Since we can't easily detect the print statement, the cleanest way is to identify the None
        
        return iterator


class HybridTranscriber:
    def __init__(self, model_name="base.en", n_threads=4):
        # 1. Setup Local Whisper (whisper.cpp)
        print(f"Loading local whisper.cpp model: {model_name}...")
        try:
            # n_threads=4 is good for Orin Nano (6 cores total)
            self.local_model = Model(model_name, n_threads=n_threads, print_realtime=False, print_progress=False)
            self.local_available = True
            print("Local model loaded.")
        except Exception as e:
            print(f"Failed to load local model: {e}")
            self.local_available = False

        # 2. Setup Google Cloud Fallback
        try:
            self.google_client = speech.SpeechClient()
            self.google_config = speech.RecognitionConfig(
                encoding=speech.RecognitionConfig.AudioEncoding.LINEAR16,
                sample_rate_hertz=16000,
                language_code="en-US",
            )
            self.google_available = True
        except Exception as e:
            print(f"Warning: Google Cloud not initialized: {e}")
            self.google_available = False

    def transcribe(self, int16_bytes):
        """
        Input: Raw int16 bytes from PyAudio
        Returns: String (transcription)
        """
        text_result = ""

        # Try Local Whisper
        if self.local_available:
            try:
                # Convert Int16 bytes -> Float32 NumPy array (Normalized -1.0 to 1.0)
                # whisper.cpp requires float32 input
                audio_float32 = np.frombuffer(int16_bytes, dtype=np.int16).astype(np.float32) / 32768.0
                
                # Run Inference
                # new_segment_callback is optional, used if you want real-time updates
                segments = self.local_model.transcribe(audio_float32)
                
                # Combine segments
                text_result = " ".join([s.text for s in segments]).strip()
                
                if text_result:
                    print(f" [Local]: {text_result}")
                    return text_result
            except Exception as e:
                print(f" [Local Error]: {e}")

        # Fallback to Google
        if self.google_available:
            print(" [Fallback]: Sending to Google Cloud...")
            try:
                audio = speech.RecognitionAudio(content=int16_bytes)
                response = self.google_client.recognize(config=self.google_config, audio=audio)
                
                for result in response.results:
                    text_result = result.alternatives[0].transcript
                    print(f" [Google]: {text_result}")
                    return text_result
            except Exception as e:
                print(f" [Google Error]: {e}")
        
        return None


def main():
    # CONFIG
    SAMPLE_RATE = 16000
    CHUNK_MS = 30
    
    transcriber = HybridTranscriber(model_name="base.en")
    
    # Initialize your stream (ensure arguments match your class definition)
    with MicrophoneStream(rate=SAMPLE_RATE, chunk_duration_ms=CHUNK_MS, vad_enabled=True) as stream:
        print("Ready. Speak now...")
        
        audio_buffer = bytearray()
        
        for chunk in stream.generator():
            # Handling the special signal for "End of Speech"
            # identifies the yield None that occurs at end of speech
            if chunk is None:
                if len(audio_buffer) > 0:
                    # Send to transcriber
                    transcriber.transcribe(bytes(audio_buffer))
                    # Reset buffer
                    audio_buffer = bytearray()
                continue
            
            # If standard audio chunk
            audio_buffer.extend(chunk)
            

if __name__ == "__main__":
    main()
