# This script records audio from the device microphone and saves
# it as "mic-output.wav" in the hardware directory

import sounddevice as sd
import soundfile as sf


# Recording parameters
DURATION = 10
SAMPLE_RATE = 16000
MIC_NAME = "LavMicro" #testing the script will require changing this to match the system microphone
FILENAME = "mic-output.wav"


def get_device(mic_name: str) -> int:
    """
    Return the device index of the first input-capable audio device
    whose name contains mic_name (case-insensitive).

    Raises:
        RuntimeError if no matching input device is found.
    """
    mic_name = mic_name.lower()
    matches = []

    # Enumerate hardware devices and look for a match with mic_name
    for index, device in enumerate(sd.query_devices()):
        name = device["name"].lower()
        print(name)
        if mic_name in name and device["max_input_channels"] > 0:
            matches.append((index, device["name"]))

    # Raise error is no device found
    if not matches:
        raise RuntimeError(f"No input device matching '{mic_name}' found")

    # Use the first match is multiple matching devices are found
    if len(matches) > 1:
        print("Warning: multiple matching microphones found:")
        for idx, name in matches:
            print(f"  {idx}: {name}")
        print(f"Using first match: {matches[0][0]}")
    
    return matches[0][0]


def record_audio(device: int, duration: int, samplerate: int, output_filename: str):
    """
    Records for duration number of seconds, and saves the recorded text at output_filename

    Raises:
        RuntimeError if an exception occurs when attempting to record
    """

    try:
        audio = sd.rec(int(duration * samplerate),
                    samplerate = samplerate,
                    channels = 1,
                    dtype = 'float32',
                    device = device)
        sd.wait()
        sf.write(output_filename, audio, samplerate)

    except Exception as e:
        raise RuntimeError(f"error: audio recording failed: {e}") from e



def main():
    device_index = get_device(MIC_NAME)
    record_audio(device=device_index, duration=DURATION, samplerate=SAMPLE_RATE, output_filename=FILENAME)


if __name__ == "__main__":
    main()
