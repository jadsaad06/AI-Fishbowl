from QUERY_CHAIN.query import rag_chain


welcome_text = (

    "👋 **Welcome to the Portland State CS Chatbot!**\n\n"
    "Ask me anything about the CS program, courses, or resources at PSU.\n\n"
    "**Here are some things you can try asking:**\n"
    "- How many credits are required for the MS in Computer Science?\n"
    "- Who do I contact for academic advising?\n"
    "- What's the deadline to apply for Fall term?\n"
    "- Tell me about the graduate cybersecurity certificate.\n"
    "- Which faculty work in AI?\n"



    "- Enter Q or q to quit."
)



def main():
    print(welcome_text)
    while(True):
        message = input("Enter a prompt: ")
        if message == "q" or message == "Q":
            break
    
        answer = rag_chain.invoke(message)
        print(answer)
        

if __name__ == "__main__":
    main()

