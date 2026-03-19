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
                print_flush(f"[DEBUG TTS WRAPPER] Received text ({len(text_to_speak)} chars): {text_to_speak[:100]}...")
                print_flush("TTS_SPEECH_STARTED")
                try:
                    tts_functions.speak_text(text_to_speak, personality_id)
                except Exception as e:
                    print_flush(f"[DEBUG TTS WRAPPER] Exception: {e}")
                    import traceback
                    traceback.print_exc()
                print_flush("TTS_SPEECH_ENDED")

if __name__ == "__main__":
    main()