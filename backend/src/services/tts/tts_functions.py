import os
import google.genai as genai
from google.genai import types
from google.genai.errors import ClientError
from dotenv import load_dotenv
import pyaudio
import time

load_dotenv()

RATE = 24000
CHANNELS = 1
FORMAT = pyaudio.paInt16
FRAME_LENGTH = 2048  #This buffer could be lowered for faster speed, but too low produces audio fuzz

MAX_TIME = 90 #max speaking time in seconds (this includes tts processing time)

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
    frames_per_buffer=FRAME_LENGTH,
)

def speak_text(text: str, personality_id: str):
    print("Streaming audio...")
    start_time = time.monotonic() #Starts time before any processing

    voice_name = "Umbriel"

    if personality_id == "1": #Pinto
        voice_name = "Fenrir"
        style_prompt = f"Cute, friendly, and sensative little voice: {text}"

    elif personality_id == "2": #Jimbo
        voice_name = "Enceladus"
        style_prompt = f"Tired, annoyed, and sarcastic tone: {text}"    
    
    elif personality_id == "3": #Bongo
        voice_name = "Umbriel"
        style_prompt = f"Odd, slightly abnormal speech patterns: {text}"

    elif personality_id == "5": #Kiki
        voice_name = "Kore"
        style_prompt = f"Friendly and professional tone: {text}"

    else: #Koko (Default)
        voice_name = "Iapetus"
        style_prompt =f"Friendly and professional tone: {text}"

    print("Current voice model: ", voice_name)
    print("Current style prompt: ", style_prompt)

    try:
        response = client.models.generate_content_stream(  #Calls Gemini, and returns in streamable chunks
            model = "gemini-2.5-flash-preview-tts",
            contents=style_prompt,
            config=types.GenerateContentConfig(
                response_modalities = ["AUDIO"],
                speech_config=types.SpeechConfig(
                    voice_config=types.VoiceConfig(
                        prebuilt_voice_config = types.PrebuiltVoiceConfig(voice_name=voice_name)  #Calls one of Gemini's default voices
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

    for chunk in response: #For each audio chunk recieved from Gemini
        for part in getattr(chunk, "parts", []):
            if hasattr(part, "inline_data") and part.inline_data:
                #stream.write(part.inline_data.data)
                audio_bytes = part.inline_data.data

                #Audio is further divided into our desired frame length
                #so that we can check time, regardless of Gemini's chunk size
                for i in range(0, len(audio_bytes), FRAME_LENGTH):

                    if time.monotonic() - start_time >= MAX_TIME:
                        print("Exceeded time limit")
                        stream.stop_stream()  #Clears audio stream for next input
                        stream.start_stream()
                        return
                    
                    frame = audio_bytes[i:i+FRAME_LENGTH]
                    stream.write(frame)

    print("Done Speaking")

if __name__ == "__main__":
    text = input("Enter text: ")

    if text:
        speak_text(text)

    print("Test complete!")