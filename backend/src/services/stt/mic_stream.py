"""
https://people.csail.mit.edu/hubert/pyaudio/docs/
We will be using PyAudio in order to get a stream of audio from
our USB microphone that we can then use with the Google STT API.
"""

import wave
import pyaudio

"""
# These are my mic specs I got from list_devices.py
INDEX = 24       
RATE = 48000                # You can think of this as samples per second. My mic takes 48,000 "snapshots" of sound every 1 second.
CHANNELS = 2     
FORMAT = pyaudio.paInt16    # So I don't fully understand why this was making it break, but this setting stood out. As everything else is default or my mic specs. And this is specific to the audio recording quality. 
CHUNK = 1024                # this is is more samples per buffer. We will be grabbing 1,024 snapshots at a time (this was the default with PyAudio).

p = pyaudio.PyAudio()

# In the last version, we were on output mode, now we are in input mode. 
stream = p.open(
    format=FORMAT,
    channels=CHANNELS,
    rate=RATE,
    input=True,
    input_device_index=INDEX,
    frames_per_buffer=CHUNK
)
"""
# These are my mic specs I got from list_devices.py
INDEX = 24  
FORMAT = pyaudio.paInt16                    # when you see format, think sample quality
CHUNK = 1024                                # this is is more samples per buffer. We will be grabbing 1,024 snapshots at a time (this was the default with PyAudio).

p = pyaudio.PyAudio()

info = p.get_device_info_by_index(INDEX)    # get info from the specific device index
RATE = int(info.get('defaultSampleRate'))   # get the sample rate, my mic is 48,000, which means it takes 48,000 snapshots of audio per second. 
CHANNELS = info.get('maxInputChannels')     # get the number of input channels

stream = p.open(
    format=FORMAT,
    channels=CHANNELS,
    rate=RATE,
    input=True,
    input_device_index=INDEX,
    frames_per_buffer=CHUNK
)

print(f"Starting 5 second recording")

frames = []
for i in range(0, int(RATE / CHUNK * 5)):  # 5 seconds bc 48,000 / 1,024 = 46.875 this means there are roughly 47 chunks in one second of audio and 47 * 5 = 235 chunks in 5 seconds
    data = stream.read(CHUNK, exception_on_overflow=False)
    frames.append(data)

print(f"* Done! Captured {len(frames)} chunks.")



# ------------------ TEMP saving WAV File for testing ------------------
audio_data = b''.join(frames)               # join all chunks


with wave.open("audio_input_test.wav", 'wb') as wf: # write the file
    wf.setnchannels(CHANNELS)
    wf.setsampwidth(p.get_sample_size(FORMAT)) 
    wf.setframerate(RATE)
    wf.writeframes(audio_data)

print("saved test file")
# ---------------------------- END TEMP---------------------------------

# close up everything and stop pyAudio
stream.stop_stream()
stream.close()
p.terminate()