Overview:
# Text-to-Speech (TTS) Service

## Overview

The `tts_test.py` file contains two related functions: `text_to_wav()` and `speak_wav()`. 

- **`text_to_wav()`**: This function takes text input and sends it to Google's Gemini API. Gemini returns the audio in the form of raw Pulse-Code Modulation (PCM), which is then saved as an easier-to-use `.wav` file named `output.wav`. The program subsequently sends `output.wav` to the `speak_wav()` function, which plays audio from the specified `.wav` files. Running `tts_test.py` directly allows for text input for testing purposes.

- **`tts_wrapper.py`**: This script actively listens for incoming text (currently from the file `incoming.txt` for testing purposes, but it can be updated to use an API call). Upon receiving text input, it calls `text_to_wav()` from the `tts_test.py` file.

## Testing the Wrapper Function

To test the wrapper function, execute the following command:

```bash
python tts_wrapper.py
```

Then, open the `incoming.txt` file. The wrapper should vocalize any text you input and subsequently clear the file. If a test fails, you may need to clear and save the `incoming.txt` file (using `CTRL + S`) before `tts_wrapper` will recognize it again.

## Voice Models

All tests were conducted using Gemini's default voice models, primarily Aoede, Charon, Despina, and Umbriel (the current model). Testing was performed in a virtual environment on Windows.

## Dependencies

The following dependencies are required:

- `python-dotenv`
- `google-genai`
- `pygame`
- `pathlib`

## Important Note

This program requires a Gemini API Key, which should be assigned to the variable `KEY` in a `.env` file.

## Possible Next Steps

- Add the ability to receive interruptions and terminate speech early.
- Investigate methods to track where speech is terminated.
- Explore ways to decrease processing time.
- Collaborate with the UI team to determine necessary outputs for subtitles.