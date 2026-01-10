tts_test.py contains two related functions: text_to_wav() and speak_wav(). text_to_wav() takes text input and sends it to Google's Gemini API. Gemini returns the audio in the form of raw Pulse-Code Modulation (PCM), which placed in an easier to use .wav file ("output.wav") The program then sends output.wav to the speak_wav() function, a function which plays audio from inputed .wav files.

The main function contains a menu with some of the tests I ran the model, testing vocal range and inflection as well a spot to enter custom text. It is important to note that the silence/whitespace test currently causes a TypeError. I intend to fix this soon.

My test were all done using Gemini's default voice models, mainly Aoede, Charon, Despina and Umbriel (the current model). All testing occured in a virtual environement on Windows.

Dependencies: 
python-dotenv
simpleaudio
google-genai

It should be noted that this program requires a Gemini API Key assigned to the variable "KEY" in a .env file. For security purposes, I have not committed my .env file to git, but I have tested it using my own API key, and it appears to be mostly working as intended, outside of edge cases like the silence tests.

Possible next steps: Catch or avoid TypeErrors. Add the ability to receive interruptions, terminating speech early. Investigate ways to track where speech is terminated. Investigate ways to decrease processing time. Work with UI team to determine what outputs are needed for subtitles.