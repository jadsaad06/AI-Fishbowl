# Hardware Readme

## Overview

### mic-input.py
- The `hardware/src/mic-input.py` script simply starts recording audio when the script is started, records audio for 10 seconds (duration can be adjusted via a constant in the script), then exits and saves the audio as a .wav file.

### VAD.py
- The `hardware/src/VAD.py` script is the primary intended method of audio recording.  
- This script uses voice activity detection to determine when speaking starts and stops.  When the script is started, it will wait for audio energy to go above a threshold, then start recording.  
- Recording will continue until there is a short period with no audio above the threshold.  The threshold energy value, and the duration of time to wait until ending recording, are both adjustable via constants in the script, and may need to be adjusted based on factors like background noise, proximity to microphone, and the type of microphone used.
- When the script exits, it saves the recorded audio as a .wav file, `hardware/src/mic-input.wav`.

### Example File
- An example .wav file is provided in the hardware directory that can be used for testing as needed.  It is named `voice-sample.wav`

## Usage

### Setup
- If a Python virtual environment is not already created, one should be created then activated as follows:
```
python -m venv .env
source .env/bin/activate
```
- Requirements should then be installed:
```
# navigate to hardware directory if necessary
pip install -r requirements.txt
```

### Running Microphone Input Scripts
- NOTE: the scripts `mic-input.py` and `VAD.py` include constants that are hardware-specific to the LavMicro USB microphone connected to the Jetson.  Testing on other linux systems will require modification of the `MIC_NAME` constant, and possibly the `SAMPLE_RATE` constant, though the current value of 48000 should work for many USB microphones.  Testing on non-linux systems would require different methods of hardware access, and is not practical.
- Once setup steps are done, accessing the microphone can be accomplished by running either the `hardware/src/mic-input.py` script or the `hardware/src/VAD.py` script as follows:
```
# starting from the hardware directory
cd src
python VAD.py # or: python mic-input.py
```
- When recording is completed, a file will be created in the `hardware/src` directory named `mic-input.wav` with the recorded audio.
- If a previous mic-input.wav file exists, it will be overwritten when a new one is created.
