import os
import google.genai as genai
from google.genai import types
from google.genai.errors import ClientError
from dotenv import load_dotenv
import pyaudio

load_dotenv()

RATE = 24000
CHANNELS = 1
FORMAT = pyaudio.paInt16
CHUNK = 2048  #This buffer could be lowered for faster speed, but too low produces audio fuzz

MAX_TIME = 90 #max speaking time in seconds (this includes tts processing time)
BYTES_PER_SECOND = RATE * CHANNELS * 2

#The maximum number of bytes to write based on max seconds
MAX_BYTES = MAX_TIME * BYTES_PER_SECOND

api_key = os.getenv("KEY")   #Gets API key from .env file
if not api_key:
    raise RuntimeError("KEY not found")

client = genai.Client(api_key=api_key)

p = pyaudio.PyAudio()

stream = p.open(
    format=FORMAT,
    channels=CHANNELS,
    rate=RATE,
    output=True,
    frames_per_buffer=CHUNK,
)

def speak_text(text: str):
    style_prompt = f"Read the following in a friendly and professional tone: {text}"
    try:
        response = client.models.generate_content_stream(  #Calls Gemini, and returns in streamable chunks
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

    print("Streaming audio...")

    written_bytes = 0  #How many bytes have been sent to the speaker

    for chunk in response:
        for part in getattr(chunk, "parts", []):
            if hasattr(part, "inline_data") and part.inline_data:
                audio_bytes = part.inline_data.data

                remaining = MAX_BYTES - written_bytes #Checks if number of bytes exceeds time limit (based on bytes per second)
                if remaining <= 0:
                    print("Exceeded time limit")
                    return

                audio_bytes = audio_bytes[:remaining]

                stream.write(audio_bytes)
                written_bytes += len(audio_bytes)

    print("Done Speaking")

if __name__ == "__main__":
    text = input("Enter text: ")

    if text:
        speak_text(text)

    print("Test complete!")