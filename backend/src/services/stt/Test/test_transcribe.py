"""
Simple test script to verify the STT engine is working.
Run this to see live transcriptions printed to the console.
"""
import sys
import json
from pathlib import Path
import threading

sys.path.append(str(Path(__file__).parent.parent)) # adds parent dir to the Python path so we can import engine. Lets us import from the directory above where engine.py is

from engine import transcribe_streaming_v2, get_current_mic

_FISH_CONFIG_PATH = Path(__file__).parent.parent / "fish_config.json"

def _load_fish_config():
    """Load fish definitions from fish_config.json."""
    with open(_FISH_CONFIG_PATH, "r") as f:
        return json.load(f)

def _check_wake_phrase(transcript, fish_list):
    """
    Check if a transcript starts with a wake phrase for any fish.
    Returns the matching fish dict, or None if no match.
    Matching is case-insensitive and phrase must appear at the start of the transcript.
    """
    t = transcript.strip().lower()
    for fish in fish_list:
        for phrase in fish["wake_phrases"]:
            if t.startswith(phrase):
                return fish
    return None


def stdin_listener():
    """Listen for PAUSE/RESUME commands from parent process."""
    for line in sys.stdin:
        cmd = line.strip().upper()
        mic = get_current_mic()
        if mic:
            if cmd == "PAUSE":
                mic.pause()
            elif cmd == "RESUME":
                mic.resume()

if __name__ == "__main__":
    print("--------------- STT Engine Test ---------------")
    print("Speak into your microphone. Transcripts will appear below.\n")

    fish_list = _load_fish_config()
    print(f"Loaded {len(fish_list)} fish: {[f['name'] for f in fish_list]}\n")

    # Start stdin listener as daemon thread (exits when main thread exits)
    listener_thread = threading.Thread(target=stdin_listener, daemon=True)
    listener_thread.start()
    
    try:
        # transcribe_streaming_v2() is a generator that yields final transcripts
        # This loop will run indefinitely, getting each (highest confidence) transcript as it's returned
        for user_input in transcribe_streaming_v2():
            matched_fish = _check_wake_phrase(user_input, fish_list)

            if matched_fish:
                # Wake phrase detected — signal the frontend to switch persona
                print(f"WAKE:{matched_fish['name']}", flush=True)
            else:
                # Normal transcript — forward to the agent as usual
                print(f"\n[Transcript]: {user_input}", flush=True)

    except KeyboardInterrupt:
        # User pressed Ctrl+C to stop the test
        print("\n\nTest stopped by user.")
    except Exception as e:
        # Catch any errors from the STT engine
        print(f"\n\nTest failed with error: {e}")