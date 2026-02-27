from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client

from services.llm.QUERY_CHAIN.query import agent_prompt_template_Pinto, agent_prompt_template_Jimbo, agent_prompt_template_Bongo, get_context, agent_prompt_template_koko, agent_prompt_template_kiki
from langchain.chat_models import init_chat_model
from langchain.agents import create_agent
from langchain_mcp_adapters.tools import load_mcp_tools

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from contextlib import asynccontextmanager
from pydantic import BaseModel
from dotenv import load_dotenv
import os
import asyncio
from contextlib import AsyncExitStack
import httpx



load_dotenv()


mcp_servers_url = os.getenv("MCP_SERVERS_URL")

mcp_server_urls = mcp_servers_url.split(",")
for i in range(len(mcp_server_urls)):
    print(mcp_server_urls[i])
SMITHERY_KEY = os.getenv("SMITHERY_KEY")

http_client = httpx.AsyncClient(
    headers={"Authorization" : f"Bearer {SMITHERY_KEY}"},
    timeout=httpx.Timeout(30)
)


class RequestPrompt(BaseModel): # Class for denoting the request that the user will prompt for a post request.
    user_prompt: str




@asynccontextmanager #async context manager initializes the listening server on startup, up until yield, after yield will be on program termination for cleanup
async def run_client(app: FastAPI): # An async function to work with the MCP server.
    """
    Before running the application, connect the mcp client, to the mcp server.
    The app Argument is for building states, 
    """

    app.state.agent_ready = False # Is the Agent obj ready or not
    stop_agent = asyncio.Event() # Create an event object to alert asyncio tasks that an event occured. 
    app.state.ws_sessions = {} #Dict object (hash map) to hold multiple websocket connections. {websocket, curr_agent, conversation}
    app.state.agent_Pinto = None
    app.state.agent_Jimbo = None
    app.state.agent_Bongo = None
    app.state.agent_koko = None
    app.state.agent_kiki = None

    async def run_forever():
        


        while not stop_agent.is_set():
            mcp_sessions = []

            try:    
                 async with AsyncExitStack() as stack:
                    for mcp_url in mcp_server_urls:
                        if "smithery" in mcp_url:
                            read, write, _ = await stack.enter_async_context(streamable_http_client(url=mcp_url, http_client=http_client)) # Add the context manager into the stack, leaving the session open for the context manager function which is asynchronous, and grab read and write streams between the server and client
                        else:
                            read, write, _ = await stack.enter_async_context(streamable_http_client(url=mcp_url)) # Add the context manager into the stack, leaving the session open for the context manager function which is asynchronous, and grab read and write streams between the server and client

                        session = await stack.enter_async_context(ClientSession(read, write)) # Add the context manager into the stack leaving the session open, and create a connection between the server and client

                        await session.initialize() # Create the handshake between the server and client

                        mcp_sessions.append(session)
                    
                    total_mcp_tools = []


                    for s in mcp_sessions:
                        tool = await load_mcp_tools(s) # Load mcp tools from the server
                        total_mcp_tools.extend(tool) # Add to total tools list
                    

                    app.state.agent_Pinto = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_Pinto, tools=total_mcp_tools) # Create a simple answerful agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
                    app.state.agent_Jimbo = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_Jimbo, tools=total_mcp_tools) # Create a mad sarcastic agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
                    app.state.agent_Bongo = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_Bongo, tools=total_mcp_tools) # Create a shy agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
                    app.state.agent_koko = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_koko, tools=[get_context]) # Create a undergraduate advisor agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools
                    app.state.agent_kiki = create_agent(model="google_genai:gemini-2.5-flash", system_prompt=agent_prompt_template_kiki, tools=[get_context]) # Create a graduate advisor agent consisting of the gemini 2.5 flash llm, system prompt, and MCP tools

                    app.state.agent_ready = True # If we made it to this point where we have an agent object set, then the agent is ready.

                    while not stop_agent.is_set(): # While the event object is not set, then we will continuously loop through inside the client session to keep the session alive
                        tasks = []
                        for s in mcp_sessions:
                            tasks.append(asyncio.create_task(s.send_ping()))
                        
                        await asyncio.gather(*tasks) # Send a ping to the MCP server to ensure the MCP server is alive
                        print("ping ok")
                        await asyncio.sleep(60) # Take a 1 minute break interval to avoid flooding

            except Exception as e: # If the session ping was not successful, or some other issue occured, we assume that the MCP server disconnected, and print the error.
                import traceback
                print("MCP Server connection failed, trying again")
                traceback.print_exc()                

            finally: # We finally set the agent to no object since the connection between the MCP server and client is gone, so we don't know what MCP server tools we may have anymore if we consider a new connection.
                app.state.agent_Pinto = None
                app.state.agent_Jimbo = None
                app.state.agent_Bongo = None
                app.state.agent_koko = None
                app.state.agent_kiki = None
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

    oid = id(ws)


    app.state.ws_sessions[oid] = {
        "ws" : ws,
        "conversation" : [],
        "curr_agent" : app.state.agent_Pinto
    }

    



    try:
        while True:
            curr_session = app.state.ws_sessions[oid]
            text = await ws.receive_text()
            print(text, flush=True)

            match text:
                case "PERSONALIZATION: 1":
                    curr_session["curr_agent"] = app.state.agent_Pinto
                    curr_session["conversation"] = []
                    continue
                case "PERSONALIZATION: 2":
                    curr_session["curr_agent"] = app.state.agent_Jimbo
                    curr_session["conversation"] = []
                    continue
                case "PERSONALIZATION: 3":
                    curr_session["curr_agent"] = app.state.agent_Bongo
                    curr_session["conversation"] = []
                    continue
                case "PERSONALIZATION: 4":
                    curr_session["curr_agent"] = app.state.agent_koko
                    curr_session["conversation"] = []
                    continue
                case "PERSONALIZATION: 5":
                    curr_session["curr_agent"] = app.state.agent_kiki
                    curr_session["conversation"] = []
                    continue

            
            if app.state.agent_ready is False: # If the agent status isn't ready then we won't use the MCP Client (May be due to the MCP server not running), then we will send a message back to the user, and break
                await curr_session["ws"].send_text("MCP Client is temporarily unavailable, retrying again.")
                await curr_session["ws"].close(code=1000)
                return

            if curr_session["curr_agent"] is None: # If the agent itself is not an object, we won't be able to use the agent, so we have to exit, and notify the user that the Agent is not ready yet.
                await curr_session["ws"].send_text("MCP agent is not ready yet. Try again in a moment.")
                await curr_session["ws"].close(code=1000)
                return
            

            curr_session["conversation"] = curr_session["conversation"][-6:] #Take the 2 most recent conversations.

            curr_session["conversation"].append({ # Context, adding the user prompt 
                "role" : "user",
                "content" : text
            })


            response = await curr_session["curr_agent"].ainvoke({"messages": curr_session["conversation"]}) #asynchronously invoke the agent
            stripped_response = grab_agent_final_response(response)     


            await curr_session["ws"].send_text(stripped_response)
            


            curr_session["conversation"].append({ # Add the agents response to the context window
            "role" : "assistant",
            "content" : stripped_response
            })


    except WebSocketDisconnect:
        pass
    except Exception:
        pass

    finally:
        app.state.ws_sessions.pop(oid, None)
        print("Removed a user session")



