from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.document_loaders import AsyncHtmlLoader
from langchain_community.document_transformers import BeautifulSoupTransformer
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from bs4 import BeautifulSoup
from urllib.parse import urljoin
import unidecode
import requests
import re
import os
from dotenv import load_dotenv

load_dotenv()




def chunking(documents): 
    """Takes in Documents and splits text into chunks"""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=7000, chunk_overlap=1000)
    chunks = text_splitter.split_documents(documents)
    
    return chunks



def clean_text(text):
    """Replaces unicode characters and strips extra whitespace"""
    text = unidecode.unidecode(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text



def clean_documents(documents):
    """Cleans page_content text of Documents list"""
    for doc in documents:
        doc.page_content = clean_text(doc.page_content)
    return documents



def scrape_articles(links, headers):
    """Scrapes list of links, extracts article text, returns Documents"""
    # Scrape list of links
    loader = AsyncHtmlLoader(links, header_template=headers)
    docs = loader.load()
    # Extract article tag
    transformer = BeautifulSoupTransformer()
    docs_tr = transformer.transform_documents(
        documents=docs, tags_to_extract=["article", "div"]
    )

    clean_documents(docs_tr)
    return docs_tr



def add_documents(vectorstore, chunks, n):
   for i in range(0, len(chunks), n):
       print(f"{i} of {len(chunks)}")
       vectorstore.add_documents(chunks[i:i+n])



def load_db(vectorstore):
    # Gets all the relevent URLs from the CS department landing page,
    # scrapes them, chunks them, then adds them to vector database
    path_name = os.getenv("PATH_NAME")
    print(f"Path name: {path_name}")
    website = f"https://web.cs.pdx.edu"
    headers = {
        'User-Agent' : 'PDXAcademicClient/pdx-cs-ask'
    }

    
    resp = requests.get(website, headers=headers) #From the main CS Dep Landing page
    soup = BeautifulSoup(resp.text,"html.parser") #Initialize an HTML web scraper 

    links = set() # Initialize a set, avoid duplicating links
    for a in soup.find_all('a', href=True): # find all anchor tags, so we loop through each tag to find the link reference
        href = a['href'] #Grab the link
        if path_name in href: #if computer-science is within the string of the href
            full_url = urljoin(website, href) #join the URL base + the href path
            links.add(full_url) #add it to the set of links

    links.add("https://www.pdx.edu/gradschool/graduate-candidate-deadlines")
    links = list(links) #Convert the set to a list of links

    print(links)
    documents = scrape_articles(links, headers) #Scrape the links, we will retrieve a list(Documents) where each doc is a {page_content="html of website", metadata="link to website etc"}
    chunks = chunking(documents) # Chunk each link into specific sizes with overlapping
    add_documents(vectorstore, chunks, 300) #Add documents to the chroma DB

    print("RAG database initialized with the following sources.")
    retriever = vectorstore.as_retriever()
    document_data_sources = set()
    for doc_metadata in retriever.vectorstore.get()['metadatas']:
        document_data_sources.add(doc_metadata['source']) 
    for doc in document_data_sources:
        print(f"  {doc}")




vectorstore = Chroma(
            embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001", task_type="retrieval_query"),
            persist_directory="./.chromadb"
)



load_db(vectorstore)



#This is just a test to query the Chroma RAG DB

results = vectorstore.similarity_search(
    "What is the deadline date for GO-16",
    k=2
)
for res in results:
    print(f"* {res.page_content} [{res.metadata}]")
