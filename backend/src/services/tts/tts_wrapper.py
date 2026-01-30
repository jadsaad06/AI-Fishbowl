import tts_functions
import pathlib
import websockets
import asyncio
import time

async def main():

    while True:
        try:
            async with websockets.connect("ws://localhost:8000/ws") as ws:
                while True:
                    message = await ws.recv()
                    run_tts_service(message)
        except (websockets.exceptions.ConnectionClosedError,
                websockets.exceptions.ConnectionClosedOK,
                OSError) as e:
            print(f"WebSocket disconnected: {e}")

        except Exception as e:
            print(f"Unexpected WS error: {e}")
        
        await asyncio.sleep(10)



def get_text_from_file():
    p = pathlib.Path("incoming.txt")
    if not p.exists():
        p.write_text("")
        return None
    
    raw = p.read_text()
    if not raw:
        return None
    
    text = raw.strip() #Removes whitespace and newlines
    p.write_text("")
    return text if text else None

def run_tts_service(get_text_callback, poll_interval=0.5):
    print("TTS service running. Press Ctrl+C to stop")
    
    try:
        text = get_text_callback

        if text:
            print(f"TTS_SPEECH_STARTED", flush=True)
            print(f"\nSpeaking: {text!r}")
            tts_functions.speak_text(text)
            print(f"TTS_SPEECH_ENDED", flush=True)

        time.sleep(poll_interval)  #Waits before getting more text

    except KeyboardInterrupt:
        print("\nTTS stopped")

if __name__ == "__main__":
    asyncio.run(main())
    print("Done")
