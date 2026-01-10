import asyncio
import sys
from pathlib import Path

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run_client():
    backend_src = Path(__file__).resolve().parent
    server_path = backend_src / "server.py"
    if not server_path.exists():
        raise FileNotFoundError(
            f"Could not find server.py at {server_path}."
        )
    
    server_params = StdioServerParameters(
        command=sys.executable,
        args=["-u", str(server_path)],
        env=None
    )

    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()

            tools = await session.list_tools()
            tool_names = [t.name for t in tools.tools]
            print(f"Available tools: {tool_names}")

            result = await session.call_tool("greeting", arguments={})
            print("greeting() result:", result)


if __name__ == "__main__":
    asyncio.run(run_client())