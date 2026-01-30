"""
Simple test script to verify the STT engine is working.
Run this to see live transcriptions printed to the console.
"""
import sys
import websockets
import asyncio
from pathlib import Path
import threading


sys.path.append(str(Path(__file__).parent.parent)) # adds parent dir to the Python path so we can import engine. Lets us import from the directory above where engine.py is

from engine import transcribe_streaming_v2

STOP_READING = object()


def start_STT_thread(loop : asyncio.AbstractEventLoop, Transcript_Queue : asyncio.Queue): # Create a function to create a function thread importing the asyncio event loop that is used in main, and the Transcript queue, working with it thread safely.

    def worker():
        try:
            # transcribe_streaming_v2() is a generator that yields final transcripts
            # This loop will run indefinitely, getting each (highest confidence) transcript as it's returned
            for user_input in transcribe_streaming_v2(): # Run the blocking stream
                # user_input contains the completed transcription text
                # This is what would normally be sent to an LLM/agent I'm talking to you, Michelle. 
                loop.call_soon_threadsafe(Transcript_Queue.put_nowait, user_input) # Thread safely queue up for adding the user input transcript into the transcript queue.

        except Exception as e:
            loop.call_soon_threadsafe(Transcript_Queue.put_nowait, e) # If there was an exception we will put that also in the transcript queue for the main thread to handle.

        finally:
            loop.call_soon_threadsafe(Transcript_Queue.put_nowait, STOP_READING) # If the thread is done somehow (in the future work), we will queue up STOP READING object.
    
    threading.Thread(target=worker, daemon=True).start() # Start the thread running the worker function, and keeping the thread as a daemon meaning it won't be the dependable thread for whether a process should terminate or not.


async def stt_websockt():
    Transcript_Queue = asyncio.Queue() # Create a Transcript queue for holding transcriptions of the user (This should be generally 0 - 2 in this queue).
    loop = asyncio.get_running_loop() # Copy the current asynchronous event loop as a reference for the worker thread.
    start_STT_thread(loop, Transcript_Queue) # Run the worker thread.

    try:
        async with websockets.connect("wss://MCP_CLIENT_URL/text_input", ping_interval=None, ping_timeout=None) as ws:

            while True:
                try:
                    # transcribe_streaming_v2() is a generator that yields final transcripts
                    # This loop will run indefinitely, getting each (highest confidence) transcript as it's returned
                        # user_input contains the completed transcription text
                        # This is what would normally be sent to an LLM/agent I'm talking to you, Michelle. 
                    user_input = await Transcript_Queue.get() # Asynchronously wait for a transcript in the transcript queue (if there is none it will pause this thread, and wait for a transcript)

                    if user_input == STOP_READING: # In the future if we decide to stop the STT thread, we can do that accordingly here.
                        return
                    
                    if isinstance(user_input, Exception): # If there was an exception and it was put in the transcription Queue, we will raise that exception.
                        raise user_input

                    print(f"\n[Transcript]: {user_input}")
                    print("-" * 50)  # visual separator for style points
                    print("\nSending to Agent")
                    await ws.send(user_input) # Send the user input to the websocket
                    
                    response = await ws.recv() # Wait for the Agents response from the websocket (always guaranteed)
                    print(response)
                            
                except KeyboardInterrupt:
                    # User pressed Ctrl+C to stop the test
                    print("\n\nTest stopped by user.")
                except Exception as e:
                    # Catch any errors from the STT engine
                    print(f"\n\nTest failed with error: {e}")
                

    except (websockets.exceptions.ConnectionClosedError,
            websockets.exceptions.ConnectionClosedOK,
            OSError) as e:
        print(f"WebSocket disconnected: {e}")

    except Exception as e:
        print(f"Unexpected WS error: {e}")
    
    await asyncio.sleep(10)
    







if __name__ == "__main__":
    print("--------------- STT Engine Test ---------------")
    print("Speak into your microphone. Transcripts will appear below.\n")
    
    
    asyncio.run(stt_websockt())