"""
Simple test script to verify the STT engine is working.
Run this to see live transcriptions printed to the console.
"""
import sys
from pathlib import Path
import threading

sys.path.append(str(Path(__file__).parent.parent)) # adds parent dir to the Python path so we can import engine. Lets us import from the directory above where engine.py is

from engine import transcribe_streaming_v2, get_current_mic


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
    
    # Start stdin listener as daemon thread (exits when main thread exits)
    listener_thread = threading.Thread(target=stdin_listener, daemon=True)
    listener_thread.start()
    
    try:
        # transcribe_streaming_v2() is a generator that yields final transcripts
        # This loop will run indefinitely, getting each (highest confidence) transcript as it's returned
        for user_input in transcribe_streaming_v2():
            # user_input contains the completed transcription text
            # This is what would normally be sent to an LLM/agent I'm talking to you, Michelle. 
            print(f"\n[Transcript]: {user_input}", flush=True)

            # print("-" * 50)  # visual separator for style points
            # print("\nSending to Agent")
            
            
    except KeyboardInterrupt:
        # User pressed Ctrl+C to stop the test
        print("\n\nTest stopped by user.")
    except Exception as e:
        # Catch any errors from the STT engine
        print(f"\n\nTest failed with error: {e}")