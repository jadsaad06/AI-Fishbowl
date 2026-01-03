from langchain_chroma import Chroma
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
from langchain_google_genai import GoogleGenerativeAI, GoogleGenerativeAIEmbeddings
import re
from dotenv import load_dotenv
from pathlib import Path


load_dotenv()

query_file = Path(__file__).resolve() # Grab the path to this file

llm_dir = query_file.parents[1] #Grab the parent dir of llm

Chroma_dir = llm_dir / "RAG_DB" / ".chromadb" #from llm dir go to RAG_DB and into the chromadb dir

if not Chroma_dir.exists(): # If RAG DB does not exists then exit
    exit("Run python loaddb.py in RAG_DB/")

def format_docs(docs): # Function to format RAG documents that have been queried for similarity.
    output = "\n\n".join(doc.page_content for doc in docs) # String Format each document by separating each document content with 2 new lines
    sources = {doc.metadata['source'] for doc in docs} # Grab each metadata of the documents 
    source_list = "\nSource: ".join(source for source in sources) # Create a String containing "Source: ", for each source in sources
    return output+source_list # Return a literal string of output and source list

# instantiate a chroma vector DB class
vectorstore = Chroma(
        embedding_function=GoogleGenerativeAIEmbeddings(model="models/embedding-001", task_type="retrieval_query"),
        persist_directory= str(Chroma_dir)
)
llm = GoogleGenerativeAI(model="gemini-2.5-flash") #LLM we will use 
retriever = vectorstore.as_retriever() #Instantiate a retriever from the chroma vector DB to perform queries

prompt_template = """You are an assistant for question-answering tasks. Use the following context to answer the question.  Provide the source URLs of the context you used to perform the task and instruct the user to visit them for more information.  If you don't know the answer, just say that you don't know.

Question: {question}

Context: {context}

Answer: """

# create a prompt example from above template
prompt = PromptTemplate(
    input_variables=["question"],
    template=prompt_template
)



# Chain of invocation from entrypoint
rag_chain = (
    {"context": retriever | format_docs, "question": RunnablePassthrough()} 
    | prompt
    | llm
    | StrOutputParser()
)
