from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from services.llm.QUERY_CHAIN.query import agent_prompt_template_Bob, agent_prompt_template_Jimbo, agent_prompt_template_Bongo, get_context

from langchain.agents import create_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import asyncio



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

    app.state.agent_ready = False # Is the Agent obj ready or not
    app.state.ws_connection_keyboard = None # to denote whether we have 1 persistent ws connection
    stop_agent = asyncio.Event() # Create an event object to alert asyncio tasks that an event occured. 


    async def run_forever():
        
        app.state.conversation = [] # variable to create the context window



        while not stop_agent.is_set():
            try:    
                async with streamable_http_client(f"{mcp_server_url}/mcp") as (read, write, _):  # Grab read and write streams between the server and client
                    async with ClientSession(read, write) as session: # Create a connection between the server and client
                        await session.initialize() # Create the handshake between the server and client

                        tools = await load_mcp_tools(session) # Load mcp tools from the server

                        MCP_Tools = [] # Hold all the MCP tools
                        MCP_Tools.append(get_context)
                        for tool in tools:
                            MCP_Tools.append(tool)


                        app.state.agent_Bob = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_Bob, tools=MCP_Tools) # Create an agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
                        app.state.agent_Jimbo = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_Jimbo, tools=MCP_Tools) # Create an agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
                        app.state.agent_Bongo = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_Bongo, tools=MCP_Tools) # Create an agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools

                        app.state.agent_ready = True # If we made it to this point where we have an agent object set, then the agent is ready.

                        while not stop_agent.is_set(): # While the event object is not set, then we will continuously loop through inside the client session to keep the session alive
                            await session.send_ping() # Send a ping to the MCP server to ensure the MCP server is alive
                            print("ping ok")
                            await asyncio.sleep(60) # Take a 1 minute break interval to avoid flooding


            except Exception as e: # If the session ping was not successful, or some other issue occured, we assume that the MCP server disconnected, and print the error.
                print("MCP Server connection failed, trying again")
                print(e)

            finally: # We finally set the agent to no object since the connection between the MCP server and client is gone, so we don't know what MCP server tools we may have anymore if we consider a new connection.
                app.state.agent_Bob = None
                app.state.agent_Jimbo = None
                app.state.agent_Bongo = None
                app.state.agent_ready = False # The agent will not be ready in the case that the MCP server is disconnected
            
            if not stop_agent.is_set(): # We will try to reconnect to the MCP server every 10 seconds if the event object is not set 
                await asyncio.sleep(10)


    task = asyncio.create_task(run_forever()) # Create an async task for running the MCP Client Agent.
        
    try:
        yield # Once we are reaching the end of the MCP Client lifetime, we will perform the following 

    finally:

        stop_agent.set() # Set the event object
        task.cancel() # Signal to the task to safely exit. 

        try:
            await task # Wait for the task to safely exit
        except Exception as e: # If the task didn't safely exit, then show the exception
            print(f"Task wasn't cleaned up safely: {e}")




app = FastAPI(lifespan=run_client) #Run the fastAPI entrypoint with a starter function that also cleans up




def grab_agent_final_response(resp) -> str:
    AI_response = resp["messages"][-1] #Retrieve the last or final answer 

    content = AI_response.content # parse the content 

    if isinstance(content, list) and content and isinstance(content[0], dict) and "text" in content[0]: #If the content contains a list then its a structured response, 
        # we only seek for the text, so check if the content has an object at the first index (Gemini text responses are usually from the first index),
        return content[0]["text"] 
    else:
        return content #If the content solely has the last response then return it.





@app.websocket("/text_input")
async def ws_text_input(ws : WebSocket):
    await ws.accept()

    current_agent = app.state.agent_Bob

    if app.state.ws_connection_keyboard != None:
        await ws.send_text("There is an on-going connection with the MCP agent, please try again when there is no connections.")
        await ws.close(code=1000)
        return

    app.state.ws_connection_keyboard = ws

    try:
        while True:
            text = await ws.receive_text()
            print(text, flush=True)

            if text == "PERSONALIZATION: 1":
                current_agent = app.state.agent_Bob
            elif text == "PERSONALIZATION: 2":
                current_agent = app.state.agent_Jimbo
            elif text == "PERSONALIZATION: 3":
                current_agent = app.state.agent_Bongo

            else:
                    
                if app.state.agent_ready is False: # If the agent status isn't ready then we won't use the MCP Client (May be due to the MCP server not running), then we will send a message back to the user, and break
                    await ws.send_text("MCP Client is temporarily unavailable, retrying again.")
                    ws.close(code=1000)
                    return

                if current_agent is None: # If the agent itself is not an object, we won't be able to use the agent, so we have to exit, and notify the user that the Agent is not ready yet.
                    await ws.send_text("MCP agent is not ready yet. Try again in a moment.")
                    await ws.close(code=1000)
                    return

                app.state.conversation = app.state.conversation[-6:] #Take the 2 most recent conversations.
                

                app.state.conversation.append({ # Context, adding the user prompt 
                    "role" : "user",
                    "content" : text
                    })


                response = await current_agent.ainvoke({"messages": app.state.conversation}) #asynchronously invoke the agent
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


