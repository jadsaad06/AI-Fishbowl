import os
import wave
import time
import simpleaudio as sa   #This must be simpleaudio-312compat
import google.genai as genai
from google.genai import types
from google.genai.errors import ClientError
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("KEY")   #Gets API key from .env file
if not api_key:
    raise RuntimeError("KEY not found")

client = genai.Client(api_key=api_key)

def text_to_wav(text: str):
    try:
        response = client.models.generate_content(  #Calls Gemini
            model = "gemini-2.5-flash-preview-tts",
            contents=text,
            config=types.GenerateContentConfig(
                response_modalities = ["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config = types.PrebuiltVoiceConfig(  #Calls one of Gemini's default voices
                            voice_name="Umbriel"
                        )
                    )
                )
            ),
        )
    except ClientError as e:
        if e.code == 400:
            print(f"Gemini TTS rejected the input text: {text!r}")
            return None
        else:
            raise

    if not hasattr(response, "parts") or response.parts is None:
        print("No Gemini response")
        return None

    audio_bytes = None
    for part in response.parts:   #Extracts audio bytes from Gemini response
        if hasattr(part, "inline_data") and part.inline_data:
            audio_bytes = part.inline_data.data
            break

    if not audio_bytes:
        print("No audio data found in response")
        return None

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
    text = input("Enter text: ")

    if text:
        play_obj = text_to_wav(text)

    print("Test complete!")