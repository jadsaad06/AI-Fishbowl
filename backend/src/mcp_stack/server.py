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
def Long_Lat_Search(address : str) -> dict: # Mcp tool for getting the geographic location (helpful tool for the actual weather api)
    """
    This tool will allow you to find the geographic location (longitude and latitude) of a specifed address.    
    :param address: The address to find the longitude and latitude
    :type address: str
    :return: This tool will return a dictionary object consisting of 3 keys, STATUS, lng, and lat. This is useful for the Weather Search tool
    :rtype: dict
    """
    base_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={weather_key}" #Geographic location of a certain address api, given a key and address

    resp = s.get(base_url)
    hold = resp.json() #Perform the request, and get the json


    if hold.get("status") != "OK":
        return {"STATUS" : "NOT FOUND"} #If the response object does not exist, or it's not OK (not OK means the location or service is at fault), then we return status was not found
    


    geographic_location = hold["results"][0]["geometry"]["location"] #If the geographic location is retrievable, we then parse the approximate lat, and long given the response json.
    geographic_location["STATUS"] = "FOUND" #Set our own status parameter for found (This is useful to the weather api to determine if we have retrieved geographic coordinates).


    return geographic_location # Return the json

@mcp.tool()
def Weather_Search(geographic_location : dict) -> dict: # Tool for performing weather api calls given geographic location.
    """
    This tool will allow you to invoke a weather search given a geographic location objectl.
    
    :param geographic_location: The Object storing information within it such as lng for longitude, lat for latitude, and the STATUS for whether the tool "Long_Lat_Search" was successful or not
    :type geographic_location: dict
    :return: This will return a string holding all the details of the current weather in the specified geographic location
    :rtype: dict
    """

    if geographic_location["STATUS"] == "NOT FOUND": #If there is no geographic location given the json, we then back out
        return {"STATUS" : "NO INFORMATION"}

    base_url = f"https://weather.googleapis.com/v1/currentConditions:lookup?key={weather_key}&location.latitude={geographic_location['lat']}&location.longitude={geographic_location['lng']}"
    # This is the weather api given the key, and the geographic lat, and long.
    resp = s.get(base_url)

    return resp.json() # We perform the API call then we return its response in json.





if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8005)
