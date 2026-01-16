"""
This is a test for mic_stream.py
Running this file will record mic input from the target index to make a 5-second long wav file titled mic_class_test.wav

Note to find your target index. Run a list_devices.py
- if on windows use the "Windows WASAPI" host API type
"""

import wave
import sys
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent)) # adds parent dir to the Python path so we can import engine. Lets us import from the directory above where engine.py is

from mic_stream import MicrophoneStream

if __name__ == "__main__":
    TARGET_INDEX = 24 
# =====  Update me ^ =====
    
    with MicrophoneStream(index=TARGET_INDEX, chunk_duration_ms=100) as mic:
        print(f"Hardware Detected: {mic.rate}Hz, {mic.channels} Channels")
        print(f"Calculated Chunk Size: {mic.chunk} samples (about 100ms)")
        print("Recording 5 seconds for testing")
        
        frames = []
        total_test_chunks = int(5000 / mic.chunk_duration_ms)   # Calculate how many 100ms chunks fit in 5 seconds
        
        audio_gen = mic.generator()                             # Run it
        for i in range(total_test_chunks):                      # Merge them all
            chunk = next(audio_gen)
            frames.append(chunk)
            print(f"Progress: {i+1}/{total_test_chunks} chunks", end='\r')

        with wave.open("mic_class_test.wav", 'wb') as wf:       # Save to a WAV file w/ all the mic info
            wf.setnchannels(mic.channels)
            wf.setsampwidth(mic.audio_interface.get_sample_size(mic.format))
            wf.setframerate(mic.rate)
            wf.writeframes(b''.join(frames))
            
    print("\nDone!")