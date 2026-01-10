# Hardware Readme

### Example File
- an example .wav file is provided in the hardware directory that can be used for testing as needed.  It is named `voice-sample.wav`

### Setup
- if a Python virtual environment is not already created, one should be created then activated as follows:
```
python -m venv .env
source .env/bin/activate
```
- requirements should then be installed:
```
# navigate to hardware directory if necessary
pip install -r requirements.txt
```

### Microphone Input
- NOTE: the script `mic-input.py` includes constants that make it hardware-specific to the LavMicro USB microphone connected to the Jetson.  Testing on other linux systems will require modification of the `MIC_NAME` constant, and possibly the `SAMPLE_RATE` constant, though the current value of 48000 should work for many USB microphones.  Testing on non-linux systems would require different methods of hardware access, and is not practical.
- once setup steps are done, accessing the microphone can be accomplished by running the script `hardware/src/mic-input.py` as follows:
```
# starting from the hardware directory
cd src
python mic-input.py
```
- running the script will start recording, and recording will continue for 10 seconds.  Duration can be adjusted using the `DURATION` constant in `mic-input.py`
- When recording is completed, a file will be created in the `hardware/src` directory named `mic-input.wav` with the recorded audio
