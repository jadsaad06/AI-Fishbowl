Overview:
# Text-to-Speech (TTS) Service

## Overview

The TTS service receives input from the frontend via `tts_wrapper.py`, which listens for lines with the "MCP-AGENT-RESPONSE:" prefix. It then splits those lines into the personality id and the text. It passes both of these to `tts_functions.py`.

`tts_functions.py` checks if the device uses CUDA (such as the Jetson). If not, it falls back to the CPU. Next, it matches the personality_id to the corresponding voice model. The voices are all from Kyutai's pocket-TTS. The personalities are matched to the voice models as follows:

   Pinto and Koko: 'alba'
   Mimi: 'cosette'
   Bongo: 'marius'
   Kik: 'azelma'

The voice models then generate the speech, which is streamed via PyAudio.

## Testing:

- **'tts_test.py'**: This file is a testing file which listens to incoming.txt instead of the frontend. It is useful for quickly testing changes to the TTS, such as swapping voice models, and for testing the model's limits.

Testing was performed in a virtual environment with Python 3.13.3. Most testing occured on a Windows computer and on the Jetson.

## Dependencies

The following dependencies are required:

- `python-dotenv`
- `pyaudio`
- `numpy`
- `torch`
- `pocket_tts`
- `pathlib` (For tts_test only)
- `asyncio` (For tts_test only)

## Note: 
  The "TTS_SPEECH_STARTED" and "TTS_SPEECH_ENDED" statements in `tts_wrapper.py` are not just for debugging: they are flags used to tell the frontend when to start and stop displaying subtitles. They should not be removed.