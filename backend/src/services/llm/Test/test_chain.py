from mcp_stack.client import run_client
import asyncio




async def test_agent_GO():
    response = await run_client(Test=True, test_prompt="What is the deadline date for GO-16")
    response = response.lower()
    print(response)

    assert response.find("go-16") != -1


async def test_agent_term():
    response = await run_client(Test=True, test_prompt="When is the fall term")
    response = response.lower()
    print(response)

    assert response.find("fall term") != -1
    

async def test_agent_doesnt_know():
    response = await run_client(Test=True, test_prompt="What do you call an elephant that's name is John Doe")
    response = response.lower()
    print(response)

    assert response.find("don't know") != -1



async def calling_routine():
    await test_agent_GO()
    await test_agent_term()
    await test_agent_doesnt_know()


def main():
    asyncio.run(calling_routine())

main()