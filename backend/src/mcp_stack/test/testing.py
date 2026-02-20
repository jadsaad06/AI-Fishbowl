import asyncio
import websockets


async def main():
    async with websockets.connect("wss://mcp-client-1234567890.us-west1.run.app/text_input") as ws:
        while True:
            hold = await asyncio.to_thread(input, "Hey: ")
            await ws.send(hold)

            try:
                message = await asyncio.wait_for(ws.recv(), 5)
                print(message)
            except TimeoutError:
                pass
            



asyncio.run(main())