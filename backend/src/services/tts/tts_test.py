import os
import wave
import time
import simpleaudio as sa   #This must be simpleaudio-312compat
import google.genai as genai
from google.genai import types
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("KEY")   #Gets API key from .env file
if not api_key:
    raise RuntimeError("KEY not found")

client = genai.Client(api_key=api_key)

def text_to_wav(text: str):
    response = client.models.generate_content(  #Calls Gemini
        model = "gemini-2.5-flash-preview-tts",
        contents=text,
        config=types.GenerateContentConfig(
            response_modalities = ["AUDIO"],
            speech_config=types.SpeechConfig(
                voice_config=types.VoiceConfig(
                    prebuilt_voice_config = types.PrebuiltVoiceConfig(  #Calls one of Gemini's default voices
                        #voice_name="Aoede"
                        #voice_name="Charon"
                        #voice_name="Despina"
                        voice_name="Umbriel"
                    )
                )
            )
        ),
    )

    audio_bytes = None
    for part in response.parts:   #Extracts audio bytes from Gemini response
        if part.inline_data:
            audio_bytes = part.inline_data.data

    if not audio_bytes:
        raise RuntimeError("No audio data found in response")

    with wave.open("output.wav", "wb") as wf:  #Stores Gemini's PCM output to a .wav file
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(24000) 
        wf.writeframes(audio_bytes)

    play_obj = speak_wav("output.wav")

    play_obj.wait_done()

    print(f"Audio saved to output.wav")

def speak_wav(file: str):
    wave_obj = sa.WaveObject.from_wave_file(file)
    play_obj = wave_obj.play()
    return play_obj

if __name__ == "__main__":
    poem_test = "I met a traveller from an antique land who said-'Two vast and trunkless legs of stone Stand in the desert..."
    mistake_test = "I met a traveller from an antique land who said-'Two vast and trunkless legs of stone Stand in the dessert.... - I mean desert! [laughter] Can we get another take?"
    flub_test = "I met a... guy - I mean traveller! [laughter] Can we get another take?"
    sarcastic_test = "[sarcastic] I met a traveller from an antique land who said-'Two vast and trunkless legs of stone Stand in the desert..."
    accent_test = "[American accent] I met a traveller from an antique land who said-[immitating an Australian accent] 'Two vast and trunkless legs of stone Stand in the desert..."
    silent_test = " "
    gibberish_test = "Aasdakh fijoadjuire aodood! Skojnasdiosj jdappid jdadsdii opbgob!"
    number_test = "1. 2. 3. 4. 5. 6. 7."
    custom_test = "Enter your own text here..."

    print("Choose a test:")
    print("1 = poem text")
    print("2 = mistake text / laughter test")
    print("3 = flub test / laughter test")   #Note, the Charon model did not always pass this test. It struggled with laughter
    print("4 = sarcasm test")
    print("5 = Accent switch test")
    print("6 = silent test")
    print("7 = gibberish test")
    print("8 = number test")
    print("9 = custom test")

    choice = input("Enter 1–9: ")

    if choice == "1":
        text = poem_test
    elif choice == "2":
        text = mistake_test
    elif choice == "3":
        text = flub_test
    elif choice == "4":
        text = sarcastic_test
    elif choice == "5":
        text = accent_test
    elif choice == "6":
        text = silent_test
    elif choice == "7":
        text = gibberish_test
    elif choice == "8":
        text = number_test
    elif choice == "9":
        text = input("Enter string: ")
    else:
        print("Invalid choice.")
        text = None

    if text:
        play_obj = text_to_wav(text)

    print("Test complete!")