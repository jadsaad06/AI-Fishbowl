"""
Simple test script to verify the STT engine is working.
Run this to see live transcriptions printed to the console.
"""
import sys
import requests
import json
from pathlib import Path
sys.path.append(str(Path(__file__).parent.parent)) # adds parent dir to the Python path so we can import engine. Lets us import from the directory above where engine.py is

from engine import transcribe_streaming_v2


    
if __name__ == "__main__":
    print("--------------- STT Engine Test ---------------")
    print("Speak into your microphone. Transcripts will appear below.\n")
    url = "http://127.0.0.1:8000/agent"
    payload = {"user_prompt": ""}
    
    try:
        # transcribe_streaming_v2() is a generator that yields final transcripts
        # This loop will run indefinitely, getting each (highest confidence) transcript as it's returned
        for user_input in transcribe_streaming_v2():
            # user_input contains the completed transcription text
            # This is what would normally be sent to an LLM/agent I'm talking to you, Michelle. 
            print(f"\n[Transcript]: {user_input}")
            print("-" * 50)  # visual separator for style points
            print("\nSending to Agent")
            response = requests.post(url, json=payload)
            print(f"Status Code: {response.status_code}")
            print(f"Response Body: {response.json()}")
            
    except KeyboardInterrupt:
        # User pressed Ctrl+C to stop the test
        print("\n\nTest stopped by user.")
    except Exception as e:
        # Catch any errors from the STT engine
        print(f"\n\nTest failed with error: {e}")