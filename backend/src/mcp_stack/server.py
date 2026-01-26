from fastmcp import FastMCP
import requests
from dotenv import load_dotenv
import os


load_dotenv()

weather_key = os.getenv("Weather_API_KEY")  

mcp = FastMCP("ai-fishbowl-mcp")

s = requests.sessions.Session()



@mcp.tool() # simple testing tool
def greeting() -> str:
    """Return a simple greeting message."""
    return "This message is from the MCP server!"


@mcp.tool()
def Long_Lat_Search(address : str) -> dict:
    """
    This tool will allow you to find the geographic location (longitude and latitude) of a specifed address.    
    :param address: The address to find the longitude and latitude
    :type address: str
    :return: This tool will return a dictionary object consisting of 3 keys, STATUS, lng, and lat. This is useful for the Weather Search tool
    :rtype: dict
    """
    base_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={weather_key}"

    resp = s.get(base_url)
    hold = resp.json()


    if hold.get("status") != "OK":
        return {"STATUS" : "NOT FOUND"}
    


    geographic_location = hold["results"][0]["geometry"]["location"]
    geographic_location["STATUS"] = "FOUND"


    return geographic_location

@mcp.tool()
def Weather_Search(geographic_location : dict) -> str:
    """
    This tool will allow you to invoke a weather search given a geographic location objectl.
    
    :param geographic_location: The Object storing information within it such as lng for longitude, lat for latitude, and the STATUS for whether the tool "Long_Lat_Search" was successful or not
    :type geographic_location: dict
    :return: This will return a string holding all the details of the current weather in the specified geographic location
    :rtype: str
    """

    if geographic_location["STATUS"] == "NOT FOUND":
        return "Not coordinates to find weather details"

    base_url = f"https://weather.googleapis.com/v1/currentConditions:lookup?key={weather_key}&location.latitude={geographic_location["lat"]}&location.longitude={geographic_location["lng"]}"
    resp = s.get(base_url)

    return resp.text.strip()





if __name__ == "__main__":
    mcp.run()
