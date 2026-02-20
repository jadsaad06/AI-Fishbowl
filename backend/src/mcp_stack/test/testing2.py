import asyncio, time

locks = {
    "Alice": asyncio.Lock(),
    "Bob": asyncio.Lock(),
    "Charlie": asyncio.Lock(),
}

async def handle_user(user: str, work_seconds: int):
    async with locks[user]:
        
        t = time.strftime("%X")
        print(f"{t} {user} ENTER (own lock)")
        await asyncio.sleep(work_seconds)

        t = time.strftime("%X")
        print(f"{t} {user} EXIT  (own lock)")

async def main():
    await asyncio.gather(
        handle_user("Alice", 3),
        handle_user("Bob", 1),
        handle_user("Charlie", 2),
    )

asyncio.run(main())