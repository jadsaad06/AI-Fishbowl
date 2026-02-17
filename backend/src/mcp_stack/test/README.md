# Guardrail Tests (`test_guardrails.py`)

This file explains how to run:

- `backend/src/mcp_stack/test/test_guardrails.py`

## 1) Activate the virtual environment

From repo root:

```bash
cd AI-Fishbowl
source .venv/bin/activate
```

If you are already in `backend/src/mcp_stack`:

```bash
source ../../../.venv/bin/activate
```

## 2) Start required backend services

These websocket tests depend on the FastAPI client app, and that app depends on the MCP server.

Terminal A (MCP server, default `8005`):

```bash
cd AI-Fishbowl/backend/src/mcp_stack
python server.py
```

Terminal B (FastAPI websocket app, default `8000`):

```bash
cd AI-Fishbowl/backend/src/mcp_stack
fastapi dev src/mcp_stack/client.py
```

## 3) Run the test file

From `backend/src/mcp_stack`:

```bash
RUN_WS_TESTS=1 pytest -q test/test_guardrails.py
```

## 4) Useful environment variables

- `RUN_WS_TESTS=1`: required, otherwise tests are skipped.
- `FASTAPI_BASE_URL` (default `ws://127.0.0.1:8000`): websocket target.
- `WS_ORIGIN` (default `http://127.0.0.1:8000`): websocket origin header.
- `WS_TIMEOUT` (default `60`): receive timeout in seconds.

Example:

```bash
RUN_WS_TESTS=1 FASTAPI_BASE_URL=ws://127.0.0.1:8000 WS_ORIGIN=http://127.0.0.1:8000 pytest -q test/test_guardrails.py
```

## 5) Troubleshooting

- `ssss` output: tests are skipped because `RUN_WS_TESTS` is not set to `1`.
- `Internal server error while processing request.`: backend failed while handling prompt; check `client.py` server logs.
- `429 RESOURCE_EXHAUSTED`: Gemini quota/rate limit reached. Wait/retry, reduce test volume, or use a model/quota with capacity.
