import tts_test
import time
import pathlib

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
        while True:     #Loops until Ctrl+C
            text = get_text_callback()

            if text:
                print(f"\nSpeaking: {text!r}")
                tts_test.text_to_wav(text)
            else:
                print(".", end="", flush=True)  #'.' to show activity

            time.sleep(poll_interval)  #Waits before getting more text

    except KeyboardInterrupt:
        print("\nTTS stopped")

if __name__ == "__main__":
    run_tts_service(get_text_from_file)
    print("Done")