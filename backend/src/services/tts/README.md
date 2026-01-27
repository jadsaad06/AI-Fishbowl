Overview:
# Text-to-Speech (TTS) Service

## Overview

The `tts_functions.py` file contains two related functions: `text_to_wav()` and `speak_wav()`. 

- **`text_to_wav()`**: This function takes text input and sends it to Google's Gemini API. Gemini returns the audio in the form of raw Pulse-Code Modulation (PCM), which is then saved as an easier-to-use `.wav` file named `output.wav`. The program subsequently sends `output.wav` to the `speak_wav()` function, which plays audio from the specified `.wav` files. Running `tts_test.py` directly allows for text input for testing purposes.

- **`tts_wrapper.py`**: This script actively listens for incoming text from the local host websocket. Upon receiving text input, it calls `text_to_wav()` from the `tts_functions.py` file.

## Testing the Wrapper Function

- **'tts_test.py'**: This file behaves in a similarly to the tts_wrapper function, however, instead of listening to the websocket, it listens to the text file "incoming.txt". To test the foundational tts, run tts_test.py, and edit incoming.txt with your desired input.

To test the wrapper function, start a FastAPI server using loaddb.py in backend/src/services/llm. In a second terminal run:

```bash
python tts_wrapper.py
```

Then, input some text into the local host. The LLM should respond, and send the response to the wrapper, which will vocalize the text.

## Voice Models

Testing was performed in a virtual environment on Windows with Python 3.13.3. Most testing was performed with the current voice model, Umbriel, although limited testing was done with other voice models.

## Dependencies

The following dependencies are required:

- `python-dotenv`
- `google-genai`
- `pygame`
- `pathlib`
- `websockets`
- `asyncio`

## Important Note

This program requires a Gemini API Key, which should be assigned to the variable `KEY` in a `.env` file.

## Possible Next Steps

- Add the ability to receive interruptions and terminate speech early.
- Investigate methods to track where speech is terminated.
- Explore ways to decrease processing time.
- Collaborate with the UI team to determine necessary outputs for subtitles.