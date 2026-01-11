import asyncio
import sys
from pathlib import Path
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from services.llm.QUERY_CHAIN.query import agent_prompt_template, get_context, welcome_text
from langchain.agents import create_agent
from langchain_mcp_adapters.tools import load_mcp_tools





def grab_agent_final_response(resp) -> str:
    AI_response = resp["messages"][-1] #Retrieve the last or final answer 

    content = AI_response.content # parse the content 

    if isinstance(content, list) and content and isinstance(content[0], dict) and "text" in content[0]: #If the content contains a list then its a structured response, 
        # we only seek for the text, so check if the content has an object at the first index (Gemini text responses are usually from the first index),
        return content[0]["text"]
    else:
        return content
    





async def run_client(*, Test: bool = False, test_prompt : str = ""): # An async function to work with the MCP server 
    backend_src = Path(__file__).resolve().parent
    server_path = backend_src / "server.py" #Resolve the path to where the server is 
    if not server_path.exists():
        raise FileNotFoundError(
            f"Could not find server.py at {server_path}."
        )
    
    server_params = StdioServerParameters( # Create the server cli command to then execute the server 
        command=sys.executable,
        args=["-u", str(server_path)],
        env=None
    )

    async with stdio_client(server_params) as (read, write):  # Establish a new child process and we will execute the server and retrieve read and write streams
        async with ClientSession(read, write) as session: # Create a connection between the server and client
            await session.initialize() # Create the handshake between the server and client

            tools = await load_mcp_tools(session) # Load mcp tools from the server

            MCP_Tools = [] # Hold all the MCP tools
            MCP_Tools.append(get_context)
            for tool in tools:
                MCP_Tools.append(tool)


            agent = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template, tools=MCP_Tools) # Create an agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools

            if Test == True: # If the run_client function is being ran as a test, then invoke the agent once, with the test prompt and return the response
                response = await agent.ainvoke(input={"messages": [{"role": "user", "content": test_prompt}]})  
                return grab_agent_final_response(response)
            




            print(welcome_text)
            while(Test == False):
                message = input("Enter a prompt: ")
                if message == "q" or message == "Q":
                    break
                
                response = await agent.ainvoke(input={"messages": [{"role": "user", "content": message}]}) #asynchronously invoke the agent
                print(grab_agent_final_response(response))
            
            





if __name__ == "__main__":
    asyncio.run(run_client(Test=False, message=""))