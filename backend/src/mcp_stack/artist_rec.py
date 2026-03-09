import os
from dotenv import load_dotenv
import requests

load_dotenv()

LAST_CLIENT_ID = os.getenv('LASTFM_API_KEY')
LAST_SECRET = os.getenv('LASTFM_SHARED_SECRET')
 
def get_top_albums(artist_name):
    url = "http://ws.audioscrobbler.com/2.0/"
    params = {
        'method': 'artist.gettopalbums',
        'artist': artist_name,
        'api_key': LAST_CLIENT_ID,
        'format' : 'json',
        'limit' : 5
    }

    headers = {'user-agent':'DataFetcher/1.0 (sambriz@pdx.edu)'}
    response = requests.get(url,params=params,headers=headers)
    return response.json()

def get_similar(artist_name):
    url = "http://ws.audioscrobbler.com/2.0/"
    params = {
        'method': 'artist.getsimilar',
        'limit': 3,
        'artist' : artist_name,
        'api_key' : LAST_CLIENT_ID,
        'format': 'json'
    }
    #headers = {'user-agent':'DataFetcher/1.0 (sambriz@pdx.edu)'}
    response = requests.get(url=url,params=params)
    return response.json()

data = get_similar('Drake')
artists = data['similarartists']['artist']

clean_names = [artist['name'] for artist in artists]
print(clean_names)
