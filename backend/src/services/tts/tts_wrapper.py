import tts_test
import time
import pathlib
import websockets
import asyncio
import time
import sys



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
            tts_test.text_to_wav(text)
            print(f"TTS_SPEECH_ENDED", flush=True)

        time.sleep(poll_interval)  #Waits before getting more text

    except KeyboardInterrupt:
        print("\nTTS stopped")
    
# Variables set for receiving multi-paragraph Agent Response from the frontend
capturing = False
buffer = []


print("Hello")
for line in sys.stdin:
    print("Hello?")
    if "MCP-AGENT-RESPONSE:" in line:
        capturing = True
        buffer.append(line.split("MCP-AGENT-RESPONSE:", 1)[1].lstrip())
    elif capturing:
        buffer.append(line)

tts_input = "".join(buffer).rstrip()
run_tts_service(tts_input)

print("Done")