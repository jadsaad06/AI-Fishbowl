# LLM + RAG Setup Guide

## Overview

This project contains an **LLM Model and a RAG Database**
There is only **one** entrypoint file, and there is **one** test file in a Test directory.

 **Important:**  
Not all Python files are meant to be executed directly with `python file.py`.

---

## LLM Structure

```

└── llm/
    ├── entrypoint.py -- MAIN ENTRYPOINT FILE
    |
    ├── QUERY_CHAIN/ -- Module for initiating the llm chain
    │   ├── __init__.py -- To ensure this Directory is a Package and within it are modules
    │   └── query.py -- Query chain module
    |
    ├── RAG_DB/ -- Directory for storing the RAG DB, and to initialize the RAG DB
    │   ├── .chromadb/ -- RAG DB Directory (If you already ran loaddb.py)
        └── loaddb.py -- Python Module script to instantiate the RAG DB
    |
    ├── Test/ -- Test directory
    │   ├── __init__.py -- This directory of Test/ is a package holding it's children
    │   └── test_chain.py -- This Python module script should be ran when testing the llm.
    |
    ├── .env -- Real env file to replace .env.example
    ├── .env.example -- example environment
    └── README.md -- README File

```

---

## Requirements

Ensure that you are using 
``
3.12 <= python version <= 3.13.9
``
Anything outside of this range has not been tested yet, and the libraries for this script are not up to date with the constraints in the newer python versions, or the older ones.


## Environment Variables

### 1.  Create `.env`

Copy the example file:

```bash
cp .env.example .env
```

### 2. Required Keys

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
python Test/test_chain.py
```

**Reason:**
- This directory uses **package-based imports**
- Python uses `PYTHONPATH` env variable to determine where imports come from, and that's dependent on which directory you execute the script from.
- Running files directly removes that context due to how the preprocessor for python works. If we ran Test/test_chain.py, the PYTHONPATH would be set to that directory, and since we import QUERY_CHAIN/query.py, the package resolver wouldn't find it, and break.

---

## Correct Way to Run Test Scripts

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

### Option 1. Run Test Script as a Module

From inside:

```
backend/src/services/llm
```

Run:

```bash
python -m Test.test_chain
```

---

### Option 2. Run the Main Entrypoint

If you want to run the full llm + RAG with your prompts:

```bash
python entrypoint.py
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

## Common Errors & Fixes

### `attempted relative import with no known parent package`

Fix:

```bash
In backend/src/service/llm
python -m Test.test_chain  
```

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
Run tests | `python -m Test.test_chain` |
Run llm + RAG | `python entrypoint.py`

---
