# LLM + RAG Setup Guide

## Overview

This project contains an **MCP Client, MCP Server, and a RAG Database**.

 **Important:**  
Not all Python files are meant to be executed directly with `python file.py`.

---

## Agent Structure

```
    mcp_stack
        ├──__init__.py this directory is a package for the mcp server and client
        ├──client.py THE NEW ENTRYPOINT FOR AN AGENT
        └──server.py The MCP server

    services/ -- Holds the tts/, stt/ and llm/
        └── llm/
            ├── entrypoint.py -- MAIN ENTRYPOINT FILE
            |
            ├── QUERY_CHAIN/ -- Module for Isolating the mcp_stack/client.py
            │   ├── __init__.py -- To ensure this Directory is a Package and within it are modules
            │   └── query.py -- query module for providing prompt templates, and a small tool for the mcp client.
            |
            ├── RAG_DB/ -- Directory for storing the RAG DB, and to initialize the RAG DB
            │   ├── .chromadb/ -- RAG DB Directory (If you already ran loaddb.py)
            |    └── loaddb.py -- Python Module script to instantiate the RAG DB
            |
            ├── Test/ -- Test directory
            │   ├── __init__.py -- This directory of Test/ is a package holding it's children
            │   └── test_agent.py -- This Python module script should be ran when testing the llm.
            |
            ├── .env -- Real env file to replace .env.example
            ├── .env.example -- example environment
            └── README.md -- README File

```

---

## Requirements

Ensure that you are using 
``
3.11 <= python version <= 3.13.9
``
Anything outside of this range has not been tested yet, and the libraries for this script are not up to date with the constraints in the newer python versions, or the older ones.


## Environment Variables

### 1.  Create `.env`

Copy the example file:

```bash
cp .env.example .env
```

### 2. Required Keys

## 1st .env

Add the following keys to `.env`:

```env
Weather_API_KEY = ""
MCP_SERVER_URL = ""
```



 The `.env` file **must live here**:

```
backend/src/mcp_stack/.env
```



---

## 2nd .env


Add the following keys to `.env`:

```env
PATH_NAME="computer-science"
GOOGLE_API_KEY="YOUR-GOOGLE-AI-API-KEY"
```

 The `.env` file **must live here**:

```
backend/src/services/llm/.env
```

The project uses `python-dotenv`, so environment variables are loaded automatically.

---

## Some scripts cannot be ran directly here's why

### This will FAIL:

```bash
python Test/test_agent.py
```

**Reason:**
- This directory uses **package-based imports**
- Python uses `PYTHONPATH` env variable to determine where imports come from, and that's dependent on which directory you execute the script from.
- Running files directly removes that context due to how the preprocessor for python works. If we ran Test/test_agent.py, the PYTHONPATH would be set to that directory, and since we import mcp_stack/client, the package resolver wouldn't find it, and break.

---

## Correct Way to Run Scripts

### Step 1. Install requirements

from inside:
```bash
backend/
```

Run:
```bash
pip install -r requirements.txt
```

### Step 2. Instantiate the RAG Database
from inside:
```bash
backend/src/services/llm/RAG_DB
```

Run:
```bash
python loaddb.py
```

---

### Step 1. Run the MCP Server

If you want the Agent to have MCP tools, you need to leverage the MCP server:

```bash
In backend/src/mcp_stack

python server.py
```


### Step 2. Run the MCP client as a Server

If you want to run the Agent with your prompts:


```bash
In backend/src/mcp_stack

fastapi dev client.py
```

**Ensure your ```.env``` in mcp_stack env variable has the right url of the mcp server**

Inside of ```localhost:8000/docs``` on your browser, you will be able to query the agent, or you may query it without the help of that path.



# *OPTIONAL*: Take the MCP Client, and Server to the Cloud

## Step 1. Build the MCP Client, and Server as Docker Images

You can either do this locally or on the cloud provider cloudshell:

```bash
In backend/

docker build -f Dockerfile_MCP_Client -t mcp_client .
docker build -f Dockerfile_MCP_Server -t mcp_server .
```

After you have built the images you will then need to upload it to the cloud providers image repository, for example in GCP, it would be Artifacts Registry, create a docker repository.

Next we need to tag the images a certain way:

```bash
docker tag mcp_client REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/mcp_client

docker tag mcp_server REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/mcp_server
```

The next step is to now upload them to the docker cloud repository:

```bash
docker push REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/mcp_client


docker push REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/mcp_server
```

The last step is to then run both the mcp client, and mcp server. The way
we will run these 2 containers is through a serverless platform, an example in terms of a cloud provider would be Cloud run on GCP.

```bash
MCP CLIENT

gcloud run deploy mcp-client \
  --image us-west1-docker.pkg.dev/cloud-karam-karammic/capstone-proj/mcp_client:latest \
  --region us-west1 \
  --allow-unauthenticated \
  --set-env-vars MCP_SERVER_URL=https://mcp-server-xxxxx.a.run.app,PATH_NAME=computer-science,GOOGLE_API_KEY=YOUR_KEY



MCP SERVER

gcloud run deploy mcp-server \
  --image us-west1-docker.pkg.dev/cloud-karam-karammic/capstone-proj/mcp_server:latest \
  --region us-west1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars Weather_API_KEY=YOUR_WEATHER_API_KEY
```





## Vector Store Behavior

The vector database is persisted at:

```
RAG_DB/.chromadb
```

This ensures:
- A single persistent database
- No duplicate DB creation
- Execution location does not affect storage


---

### Vector DB recreated unexpectedly

Ensure:
- `persist_directory` is absolute or project-root relative
- Scripts are executed from the correct package root

---

## Quick Reference

| Task | Command |
|----|----|
Set env keys | Create `.env` |
Run Instantiating RAG DB | `python loaddb.py` |
Run MCP Server | `python server.py`
Run MCP Client | `fastapi dev client.py`

---
