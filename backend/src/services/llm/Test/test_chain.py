from QUERY_CHAIN.query import rag_chain


def test_agent_GO():
    answer = rag_chain.invoke("What is the deadline date for GO-16")
    answer = answer.lower()
    assert answer.find("go-16") != -1
    print(answer)


def test_agent_term():
    answer = rag_chain.invoke("When is the fall term")
    answer = answer.lower()
    assert answer.find("fall term") != -1
    print(answer)
    

def test_agent_doesnt_know():
    answer = rag_chain.invoke("What do you call an elephant that's name is John Doe")
    answer = answer.lower()
    assert answer.find("don't know") != -1
    print(answer)



def main():
    test_agent_GO()
    test_agent_term()
    test_agent_doesnt_know()

main()