Overview:

tts_test.py contains two related functions: text_to_wav() and speak_wav(). text_to_wav() takes text input and sends it to Google's Gemini API. Gemini returns the audio in the form of raw Pulse-Code Modulation (PCM), which placed in an easier to use .wav file ("output.wav") The program then sends output.wav to the speak_wav() function, a function which plays audio from inputed .wav files.

The main function contains a menu with some of the tests I ran the model, testing vocal range and inflection as well a spot to enter custom text. It is important to note that the silence/whitespace test currently causes a TypeError. I intend to fix this soon.

Dependencies: 

python-dotenv,
google-genai,
simpleaudio-312compat (basic simpleaudio is incompatable with modern versions of Python)

Testing:

This program requires a Gemini API Key assigned to the variable "KEY" in a .env file (see the env.example file for an example).
After adding the API key, run python .\tts_test.py. This will bring up a menu with some of the tests I used, as well as an option to enter your own text for testing.
All testing was performed in a virtual environment on Windows using Python 3.13.3

Possible next steps: 

Catch or avoid TypeErrors. Add the ability to receive interruptions, terminating speech early. Investigate ways to track where speech is terminated. Investigate ways to decrease processing time. Work with UI team to determine what outputs are needed for subtitles.
