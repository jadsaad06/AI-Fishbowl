from fastmcp import FastMCP
import requests
from dotenv import load_dotenv
import os
import json

load_dotenv()

weather_key = os.getenv("Weather_API_KEY")  

mcp = FastMCP("ai-fishbowl-mcp")

s = requests.sessions.Session()



@mcp.tool() # simple testing tool
def greeting() -> str:
    """Return a simple greeting message."""
    return "This message is from the MCP server!"


@mcp.tool()
def Long_Lat_Search(address : str) -> str: # Mcp tool for getting the geographic location (helpful tool for the actual weather api)
    """
    This tool will allow you to find the geographic location (longitude and latitude) of a specifed address.    
    :param address: The address to find the longitude and latitude
    :type address: str
    :return: This tool will return a str object consisting of 3 keys, STATUS, lng, and lat. This is useful for the Weather Search tool
    :rtype: str
    """
    base_url = f"https://maps.googleapis.com/maps/api/geocode/json?address={address}&key={weather_key}" #Geographic location of a certain address api, given a key and address

    resp = s.get(base_url)
    hold = resp.json() #Perform the request, and get the json


    if hold.get("status") != "OK":
        return json.dumps({"STATUS" : "NOT FOUND"}) #If the response object does not exist, or it's not OK (not OK means the location or service is at fault), then we return status was not found
    


    geographic_location = hold["results"][0]["geometry"]["location"] #If the geographic location is retrievable, we then parse the approximate lat, and long given the response json.
    geographic_location["STATUS"] = "FOUND" #Set our own status parameter for found (This is useful to the weather api to determine if we have retrieved geographic coordinates).


    return json.dumps(geographic_location) # Return the json

@mcp.tool()
def Weather_Search(lat : float, long : float, status : str) -> str: # Tool for performing weather api calls given geographic location.
    """
    This tool will allow you to invoke a weather search given a geographic location object, status should be either FOUND or NOT FOUND strictly written that format for the checking in the function.
    
    :param geographic_location: The params within this function store such long for longitude, lat for latitude, and the STATUS for whether the tool "Long_Lat_Search" was successful or not
    :type lat, and long are both floats
    :return: This will return a string holding all the details of the current weather in the specified geographic location
    :rtype: str
    """

    if status == "NOT FOUND": #If there is no geographic location given the json, we then back out
        return json.dumps({"STATUS" : "NO INFORMATION"})

    base_url = f"https://weather.googleapis.com/v1/currentConditions:lookup?key={weather_key}&location.latitude={lat}&location.longitude={long}"
    # This is the weather api given the key, and the geographic lat, and long.
    resp = s.get(base_url)

    return json.dumps(resp.json()) # We perform the API call then we return its response in json.


@mcp.tool()
def leetcode_tags() -> str:
    """
    This function will allow you to retrieve all the tags (Algorithms, Methods, and Topics) that can be used for leetcode searches. 

    This function will return a str containing all the strings such as the tags.
    """
    resp = requests.get("https://leetcode-api-pied.vercel.app/tags")
    return json.dumps(resp.json())


@mcp.tool()
def get_stats() -> str:
    """
    This function will give you details about the amount of leetcode problems in database.
    
    :return: This will return a str of the information
    :rtype: str
    """
    resp = requests.get("https://leetcode-api-pied.vercel.app/stats")
    return json.dumps(resp.json())


@mcp.tool()
def random_leetcode(difficulty : str = "", tag : str = "") -> str:
    """
    This function will give you a random leetcode problem given the parameters.
    
    :param difficulty: The difficulty that the user wants, optional it can either be (Easy, Medium, Hard)
    :type difficulty: str
    :param tag: The tag is for the topic of the leetcode problem it's optional and can be one of many different tags.
    :type tag: str
    :return: This will return the problem in a str format
    :rtype: str
    """

    resp = requests.get(f"https://leetcode-api-pied.vercel.app/random?difficulty={difficulty}&tag={tag}")
    return json.dumps(resp.json())


@mcp.tool()
def get_problem_by_tag(tag_slug : str, difficulty : str = "", limit : int = 5, skip : int = 50) -> str:
    """
    This function will get problems based on the tag slug which is a required field, then you have the optional difficulty field, and limit field 5, you can 
    alter this as you decide to respond to the user, ensure that your response wouldn't be huge so keep the answer within 1 - 5 of the amount of problems. This can potentially
    help you give hints to the user for the leetcode problem, or help.


    ALWAYS RANDOMIZE THE SKIP from 1 - 1000 to keep things randomized to get different pages for the leetcode problems.

    :param tag_slug: the topic of the problem this is required
    :type tag_slug: str
    :param difficulty: difficulty that is an optional parameter (Easy, Medium, Hard)
    :type difficulty: str
    :param limit: the limit as to how much problems to return
    :type limit: int
    :param skip: skip how many results to ensure random problems.
    :type skip: int
    """

    resp = requests.get(f"https://leetcode-api-pied.vercel.app/problems/tag/{tag_slug}?difficulty={difficulty}&limit={limit}&skip={skip}")
    print(resp.json())
    print(type(resp.json()))

    return json.dumps(resp.json())


@mcp.tool()
def get_daily_problem() -> str:
    """
    This function will grab a daily leetcode problem for the day.
    """
    resp = requests.get("https://leetcode-api-pied.vercel.app/daily")
    return json.dumps(resp.json())


if __name__ == "__main__":
    mcp.run(transport="http", host="0.0.0.0", port=8005)
