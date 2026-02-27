import pathlib
import websockets
import asyncio
import time
import sys
import tts_functions

def print_flush(text):
    print(text, flush=True)

def main():
    for line in sys.stdin:
        if "MCP-AGENT-RESPONSE:" in line:
            payload = line.replace("MCP-AGENT-RESPONSE:", "").strip()

            parts = payload.split(":", 1)

            if len(parts) == 2:
                personality_id, text_to_speak = parts[0].strip(), parts[1].strip()
            else: 
                personality_id = "1"
                text_to_speak = payload.strip()

            print("PERSONALITY:", personality_id)

            if text_to_speak:
                print_flush("TTS_SPEECH_STARTED")
                try:
                    tts_functions.speak_text(text_to_speak, 1)
                except Exception as e:
                    print(f"Error in tts_functions: {e}", file=sys.stderr)
                    import traceback
                    traceback.print_exc(file=sys.stderr)
                print_flush("TTS_SPEECH_ENDED")

if __name__ == "__main__":
    main()