Overview:

tts_test.py contains two related functions: text_to_wav() and speak_wav(). text_to_wav() takes text input and sends it to Google's Gemini API. Gemini returns the audio in the form of raw Pulse-Code Modulation (PCM), which placed in an easier to use .wav file ("output.wav") The program then sends output.wav to the speak_wav() function, a function which plays audio from inputed .wav files. Calling tts_test.py directly gives the option input text for testing purposes.

tts_wrapper.py actively listens for incoming text (currently from the file "incoming.txt" for testing purposes, but we should be able to update that to be an API call easily). It then calls text_to_wav() from the tts_test.py file when it receives text input.

To test the wrapper function, run "Python .\tts_wrapper" and open the "incoming.txt" file. The wrapper should speak any text you input, and then clear the file. Note that if a test does fail, you may need to clear and save the incoming.txt file (via CTRL+s) before tts_wrapper will recognize it again. My tests were all done using Gemini's default voice models, mainly Aoede, Charon, Despina and Umbriel (the current model). All testing occured in a virtual environement on Windows.

Dependencies: 

python-dotenv,
google-genai,
pygame,
pathlib

It should be noted that this program requires a Gemini API Key assigned to the variable "KEY" in a .env file.

Possible next steps: Add the ability to receive interruptions, terminating speech early. Investigate ways to track where speech is terminated. Investigate ways to decrease processing time. Work with UI team to determine what outputs are needed for subtitles.