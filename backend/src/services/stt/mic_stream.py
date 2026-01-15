"""
https://people.csail.mit.edu/hubert/pyaudio/docs/
We will be using PyAudio in order to get a stream of audio from
our USB microphone that we can then use with the Google STT API.

https://docs.cloud.google.com/speech-to-text/docs/v1/optimizing-audio-files-for-speech-to-text
^TLDR use 16-bit formatting or paInt16

https://docs.cloud.google.com/speech-to-text/docs/best-practices
^TLDR use a 100-millisecond frame size
"""

import pyaudio
import wave

class MicrophoneStream:
    def __init__(self, index, chunk_duration_ms=100):   # chunk_duration_ms is in milliseconds (100ms recommended by Google)
        self.index = index
        self.chunk_duration_ms = chunk_duration_ms
        self.format = pyaudio.paInt16                   # Recommended by Google
        
        self.audio_interface = pyaudio.PyAudio()        # Initialize PyAudio
        
        # Pull hardware specs of mic by index
        info = self.audio_interface.get_device_info_by_index(self.index)
        self.rate = int(info.get('defaultSampleRate'))
        self.channels = int(info.get('maxInputChannels'))
        
        # Calculate chunk size based on chunk duration (ms)
        self.chunk = int(self.rate * (self.chunk_duration_ms / 1000))   # Rate (samples/sec) * (ms / 1000) = samples per chunk
        
        self.stream = None

    def __enter__(self):
        self.stream = self.audio_interface.open(    # Open the stream
            format=self.format,
            channels=self.channels,
            rate=self.rate,
            input=True,
            input_device_index=self.index,
            frames_per_buffer=self.chunk,
        )
        return self

    def __exit__(self, type, value, traceback):   # Close the stream
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.audio_interface.terminate()

    def generator(self):   # Infinite loop to get audio chunks for STT 
        while True:
            # you need exception_on_overflow=False for live Windows/Mac streams
            data = self.stream.read(self.chunk, exception_on_overflow=False)
            if not data:    # If no data is comes through, break the loop
                break
            yield data

if __name__ == "__main__":
    TARGET_INDEX = 24 
    
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