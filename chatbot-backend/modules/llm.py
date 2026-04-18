
from langchain_core.prompts import PromptTemplate


from langchain.chains import RetrievalQA

 
from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from pydantic import SecretStr
import os
from dotenv import load_dotenv

load_dotenv()
GROQ_API_KEY=os.environ.get("GROQ_API_KEY")
GOOGLE_API_KEY=os.environ.get("GOOGLE_API_KEY")

def get_llm_chain(retriever):
    # Try Groq first, fall back to Google Gemini if the key is invalid/missing
    llm = None
    if GROQ_API_KEY and GROQ_API_KEY.startswith("gsk_"):
        try:
            llm = ChatGroq(
                model="llama-3.3-70b-versatile",
                api_key=SecretStr(GROQ_API_KEY)
            )
        except Exception as e:
            print(f"⚠️ Groq LLM init failed: {e}")

    if llm is None and GOOGLE_API_KEY:
        llm = ChatGoogleGenerativeAI(
            google_api_key=GOOGLE_API_KEY,
            model="gemini-1.5-flash",
            temperature=0.3,
            timeout=120,
        )

    if llm is None:
        raise ValueError("No valid LLM API key found. Set GROQ_API_KEY (gsk_...) or GOOGLE_API_KEY.")

    prompt=PromptTemplate(
        input_variables=["context","question"],
       
        template="""
                You are **JURI AI**, an AI-powered legal assistant built to help users understand Indian laws, startup rules, and contract-related documents.

                Your task is to generate accurate, easy-to-understand legal explanations based **only on the retrieved context**.

               ---

               🔍 **Context**:
               {context}

               🙋‍♂️ **User Question**:
               {question}

               ---

            💬 **Answer Guidelines**:
            - Write in a clear, formal, and respectful tone.  
            - Explain complex legal terms in simple language.  
            - Use short paragraphs or bullet points.  
            - Quote short phrases from the context when explaining (e.g., “The agreement shall remain in effect…”).
            - Base your answer on the context above. If the context doesn't contain enough information, use your own internal knowledge to provide a helpful and accurate answer about Indian law.
            - Mention any **relevant Acts, sections, or authorities**.
            - Do **not** invent or assume fake laws. Use logical legal principles.
            - Do **not** provide binding legal advice.
            - Stay focused on **Indian legal and business frameworks** (e.g., Companies Act 2013, Indian Contract Act 1872, Startup India policies).  
            - End every response with a short **Summary** (1–2 lines).

            ---

            ✅ **Output Format Example**
            **Question:** What is an MoU?

            **Answer:**
            A Memorandum of Understanding (MoU) is a formal agreement that outlines terms and mutual understanding between parties before entering into a legal contract. It defines the scope, responsibilities, and intent of collaboration but is usually **not legally binding** unless specified.

            **Relevant Law:** Indian Contract Act, 1872  
            **Summary:** MoUs record mutual intentions and serve as a foundation for future contracts.

        """
        
    )
    return RetrievalQA.from_chain_type(
    llm=llm,
    chain_type="stuff",
    retriever=retriever,
    chain_type_kwargs={"prompt": prompt},
    return_source_documents=True  
)    




