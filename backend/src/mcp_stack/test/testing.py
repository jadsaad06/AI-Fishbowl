import asyncio
import websockets


async def main():
    async with websockets.connect("ws://localhost:8000/text_input") as ws:
        while True:
            hold = await asyncio.to_thread(input, "Hey: ")
            await ws.send(hold)

            try:
                message = await asyncio.wait_for(ws.recv(), 5)
                print(message)
            except TimeoutError:
                pass
            



asyncio.run(main())