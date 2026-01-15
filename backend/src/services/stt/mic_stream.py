"""
https://people.csail.mit.edu/hubert/pyaudio/docs/
We will be using PyAudio in order to get a stream of audio from
our USB microphone that we can then use with the Google STT API.
"""

"""PyAudio Example: Play a wave file."""

import wave
# import sys        # I shouldn't need this I think
import pyaudio

FILE_PATH = r"D:\Desktop\School Items\PSU Year 3\Capstone - CS-469\AI-Fishbowl\backend\src\services\stt\Test\test_audio.wav"
CHUNK = 1024

with wave.open(FILE_PATH, 'rb') as wf:
    # Instantiate PyAudio and initialize PortAudio system resources (1)
    p = pyaudio.PyAudio()

    # Open stream (2)
    stream = p.open(format=p.get_format_from_width(wf.getsampwidth()),
                    channels=wf.getnchannels(),
                    rate=wf.getframerate(),
                    output=True)

    print(f"Playing: {FILE_PATH}")

    # Play samples from the wave file (3)
    while len(data := wf.readframes(CHUNK)):  # Requires Python 3.8+ for :=
        stream.write(data)

    print("Finished playback.")

    # Close stream (4)
    stream.close()

    # Release PortAudio system resources (5)
    p.terminate()