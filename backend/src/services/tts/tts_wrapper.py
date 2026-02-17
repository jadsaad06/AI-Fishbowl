import tts_functions
import pathlib
import websockets
import asyncio
import time
import sys

def print_flush(text):
    print(text, flush=True)

def main():
    for line in sys.stdin:
        if "MCP-AGENT-RESPONSE:" in line:
            payload = line.replace("MCP-AGENT-RESPONSE:", "").strip()

            parts = payload.split(":", 1)

            if len(parts) == 2:
                personality_id, text_to_speak = parts
            else: 
                personality_id = "1"
                text_to_speak = payload

            print("PERSONALITY:", personality_id)

            if text_to_speak:
                print_flush("TTS_SPEECH_STARTED")
                try:
                    tts_functions.speak_text(text_to_speak, personality_id)
                except Exception as e:
                    print(f"Error in tts_functions: {e}", file=sys.stderr)
                print_flush("TTS_SPEECH_ENDED")

if __name__ == "__main__":
    main()

# def get_text_from_file():
#     p = pathlib.Path("incoming.txt")
#     if not p.exists():
#         p.write_text("")
#         return None
    
#     raw = p.read_text()
#     if not raw:
#         return None
    
#     text = raw.strip() #Removes whitespace and newlines
#     p.write_text("")
#     return text if text else None

# def run_tts_service(get_text_callback, poll_interval=0.5):
#     print("TTS service running. Press Ctrl+C to stop")
    
#     try:
#         text = get_text_callback

# --------------- Lines 49 to 53, 69-71 = Henry's new code ---------

        # if text:
        #     print(f"TTS_SPEECH_STARTED", flush=True)
        #     print(f"\nSpeaking: {text!r}")
        #     tts_functions.speak_text(text)
        #     print(f"TTS_SPEECH_ENDED", flush=True)
#         if text:
#             print(f"TTS_SPEECH_STARTED", flush=True)
#             print(f"\nSpeaking: {text!r}")
#             tts_test.text_to_wav(text)
#             print(f"TTS_SPEECH_ENDED", flush=True)

#         time.sleep(poll_interval)  #Waits before getting more text

#     except KeyboardInterrupt:
#         print("\nTTS stopped")
    
# # Variables set for receiving multi-paragraph Agent Response from the frontend
# capturing = False
# buffer = []

# if __name__ == "__main__":
#     asyncio.run(main())
#     print("Done")

# print("Hello", flush=True)
# for line in sys.stdin:
#     print("Hello?")
#     if "MCP-AGENT-RESPONSE:" in line:
#         capturing = True
#         buffer.append(line.split("MCP-AGENT-RESPONSE:", 1)[1].lstrip())
#     elif capturing:
#         buffer.append(line)

# tts_input = "".join(buffer).rstrip()
# run_tts_service(tts_input)

# print("Done")
