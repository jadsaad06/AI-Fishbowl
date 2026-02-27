import tts_functions
import pathlib
import asyncio

async def main():
    print("Input fish ID number:\n1. Pinto \n2. Jimbo \n3. Bongo \n4. Kiki \n5. Koko\n")
    personality_id = str(input())
    print("Listening for input in incoming.txt... (Ctrl+C to stop)")

    while True:
        try:
            p = pathlib.Path("incoming.txt")
            if not p.exists():
                p.write_text("")
            
            raw = p.read_text()
            if raw:
                text = raw.strip()
                p.write_text("")
                tts_functions.speak_text(text, personality_id)
            
            await asyncio.sleep(0.5)

        except Exception as e:
            print(f"Error: {e}")
            await asyncio.sleep(1)

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nTest stopped")