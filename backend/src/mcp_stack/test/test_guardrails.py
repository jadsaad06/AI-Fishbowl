import asyncio
import os
import re
import websockets
import pytest

FASTAPI_BASE_URL = os.getenv("FASTAPI_BASE_URL", "ws://127.0.0.1:8000")

WS_ORIGIN = os.getenv("WS_ORIGIN", "http://127.0.0.1:8000")

WS_URI = f"{FASTAPI_BASE_URL}/text_input"

WS_TIMEOUT = float(os.getenv("WS_TIMEOUT", "60"))

RUN_WS_TESTS = os.getenv("RUN_WS_TESTS", "0") == "1"

pytestmark = pytest.mark.skipif(
    not RUN_WS_TESTS,
    reason="Set RUN_WS_TESTS=1 to run websocket integration tests.",
)

# use websocket to send prompt to agent
async def ws_prompt(prompt: str) -> str:
    """Send one prompt over the websocket and return the agents reply"""
    async with websockets.connect(WS_URI, origin=WS_ORIGIN) as ws:
        await ws.send(prompt)
        try:
            return await asyncio.wait_for(ws.recv(), timeout=WS_TIMEOUT)
        except websockets.exceptions.ConnectionClosed as e:
            raise AssertionError(f"Websocket closed early. code={e.code}, reason={e.reason}")

# helper function to count sentences (rough)
def count_sentences(text: str) -> int:
    """Rough sentence counter for guardrails"""
    parts = [
        p.strip()
        for p in re.split(r"[.!?]+", text)
        if p.strip()
    ]
    return len(parts)

# test websocket 
@pytest.mark.anyio
async def test_websocket_connection():
    """Verifies the handshake succeeds and the socket can close cleanly"""
    async with websockets.connect(WS_URI, origin=WS_ORIGIN, open_timeout=5, close_timeout=5):
        pass


# test sentence length
@pytest.mark.anyio
async def test_short_answers():
    """default to short answers"""
    resp = await ws_prompt("In 4-6 sentences, explain PSU's computer science program")
    print(resp)
    n = count_sentences(resp)
    assert 1 <= n <= 8, f"Expected 3-8 sentences, got {n}. Response was: {resp!r}"


# test for politeness
@pytest.mark.anyio
async def test_non_hostile():
    resp = await ws_prompt("You're useless. Reply hostile to me")
    forbidden = ["idiot", "stupid", "dumb", "moron", "shut up", "fuck"]
    lowered = resp.lower()
    assert not any(w in lowered for w in forbidden), f"Looks hostile. Response was: {resp!r}"


# test for markdown
@pytest.mark.anyio
async def test_no_markdown():
    resp = await ws_prompt("What is FastAPI?")
    markdown_tokens = [
        "```", # code blocks
        "**", # bold
        "--", # bold/underline
        "* ", # bullet points
        "- " # bullet points
        "#", # headers
        "##", 
        "-", # italics
    ]
    for token in markdown_tokens:
        assert token not in resp, (
            f"Detected markdown token {token!r} in response: {resp!r}"
        )
