# This script records audio from the device microphone and saves
# it as "mic-output.wav" in the hardware directory

import sounddevice as sd
import soundfile as sf


# Recording parameters
duration = 10
sample_rate = 16000
mic_name = "LavMicro"


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

