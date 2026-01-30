from pathlib import Path
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from services.llm.QUERY_CHAIN.query import agent_prompt_template, get_context

from langchain.agents import create_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from pydantic import BaseModel
from dotenv import load_dotenv
import os


load_dotenv()


mcp_server_url = os.getenv("MCP_SERVER_URL")


class RequestPrompt(BaseModel): # Class for denoting the request that the user will prompt for a post request.
    user_prompt: str




@asynccontextmanager #async context manager initializes the listening server on startup, up until yield, after yield will be on program termination for cleanup
async def run_client(app: FastAPI): # An async function to work with the MCP server.
    """
    Before running the application, connect the mcp client, to the mcp server.
    The app Argument is for building states, 
    """

    async with streamable_http_client(f"{mcp_server_url}/mcp") as (read, write, _):  # Grab read and write streams between the server and client
        async with ClientSession(read, write) as session: # Create a connection between the server and client
            await session.initialize() # Create the handshake between the server and client

            tools = await load_mcp_tools(session) # Load mcp tools from the server

            MCP_Tools = [] # Hold all the MCP tools
            MCP_Tools.append(get_context)
            for tool in tools:
                MCP_Tools.append(tool)


            app.state.agent = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template, tools=MCP_Tools) # Create an agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
            app.state.conversation = [] # variable to create the context window
            app.state.ws_connection = None

            yield

    """AFTER the application is done running, perform a cleanup. (performs nothing)"""




app = FastAPI(lifespan=run_client) #Run the fastAPI entrypoint with a starter function that also cleans up




def grab_agent_final_response(resp) -> str:
    AI_response = resp["messages"][-1] #Retrieve the last or final answer 

    content = AI_response.content # parse the content 

    if isinstance(content, list) and content and isinstance(content[0], dict) and "text" in content[0]: #If the content contains a list then its a structured response, 
        # we only seek for the text, so check if the content has an object at the first index (Gemini text responses are usually from the first index),
        return content[0]["text"] 
    else:
        return content #If the content solely has the last response then return it.


        




@app.websocket("/stt")
async def ws_stt(ws: WebSocket):
    await ws.accept()
    app.state.manager.connect(ws)

    try:
        while True:
            text = await ws.receive_text()

            app.state.conversation = app.state.conversation[-6:] #Take the 2 most recent conversations.


            

            app.state.conversation.append({ # Context, adding the user prompt 
                "role" : "user",
                "content" : text
                })


            response = await app.state.agent.ainvoke({"messages": app.state.conversation}) #asynchronously invoke the agent
            stripped_response = grab_agent_final_response(response)

            await app.state.manager.broadcast(stripped_response)


            app.state.conversation.append({ # Add the agents response to the context window
            "role" : "assistant",
            "content" : stripped_response
            })


    except WebSocketDisconnect:
        app.state.ws_connection_keyboard = None

    except Exception:
        pass













@app.websocket("/text_input")
async def ws_text_input(ws : WebSocket):
    await ws.accept()
    app.state.ws_connection_keyboard = ws

    try:
        while True:
            text = await ws.receive_text()

            app.state.conversation = app.state.conversation[-6:] #Take the 2 most recent conversations.


            

            app.state.conversation.append({ # Context, adding the user prompt 
                "role" : "user",
                "content" : text
                })


            response = await app.state.agent.ainvoke({"messages": app.state.conversation}) #asynchronously invoke the agent
            stripped_response = grab_agent_final_response(response)

            await app.state.ws_connection_keyboard.send_text(stripped_response)
            


            app.state.conversation.append({ # Add the agents response to the context window
            "role" : "assistant",
            "content" : stripped_response
            })


    except WebSocketDisconnect:
        app.state.ws_connection_keyboard = None

    except Exception:
        pass





@app.post("/agent") #This is the path of /agent for a post request to query the agent
async def call_agent(request : RequestPrompt): #The arg is the payload that the user sent

    app.state.conversation = app.state.conversation[-6:] #Take the 2 most recent conversations.


    

    app.state.conversation.append({ # Context, adding the user prompt 
        "role" : "user",
        "content" : request.user_prompt
        })
    
    print("Conversation window Before Prompt")


    print("----------------------")
    print(app.state.conversation)
    print("----------------------")

    

    response = await app.state.agent.ainvoke({"messages": app.state.conversation}) #asynchronously invoke the agent

    stripped_response = grab_agent_final_response(response)

    print(response)
    print("\n")

    print("AGENT_RESPONSE: " + stripped_response, flush=True)

    try:
        await app.state.ws_connection.send_text(stripped_response)
    except Exception:
        pass

    app.state.conversation.append({ # Add the agents response to the context window
        "role" : "assistant",
        "content" : stripped_response
        })
    
    return {"agent_response" : stripped_response} # Return the agents response
