import os
import wave
os.environ["PYGAME_HIDE_SUPPORT_PROMPT"] = "1" #Stops a default pygame support prompt from appearing
import pygame
import google.genai as genai
from google.genai import types
from google.genai.errors import ClientError
from dotenv import load_dotenv

load_dotenv()

pygame.mixer.init()

api_key = os.getenv("KEY")   #Gets API key from .env file
if not api_key:
    raise RuntimeError("KEY not found")

client = genai.Client(api_key=api_key)

def text_to_wav(text: str):
    style_prompt = f"Read the following in a friendly and professional tone: {text}"
    try:
        response = client.models.generate_content(  #Calls Gemini
            model = "gemini-2.5-flash-preview-tts",
            contents=style_prompt,
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
    except ClientError as e:  #Checks if Gemini accepted text
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

    speak_wav("output.wav")

    print(f"Audio saved to output.wav")

def speak_wav(file: str):
    pygame.mixer.music.load(file)
    pygame.mixer.music.play()

    while pygame.mixer.music.get_busy():
        pygame.time.Clock().tick(30)

    pygame.mixer.music.unload()

if __name__ == "__main__":
    text = input("Enter text: ")

    if text:
        play_obj = text_to_wav(text)

    print("Test complete!")