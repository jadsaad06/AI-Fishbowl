from fastmcp import FastMCP

mcp = FastMCP("ai-fishbowl-mcp")



@mcp.tool() # simple testing tool
def greeting() -> str:
    """Return a simple greeting message."""
    return "This message is from the MCP server!"




if __name__ == "__main__":
    mcp.run()