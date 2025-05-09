from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import uuid
import json
import os
import pickle
import shutil

load_dotenv()

app = Flask(__name__)
CORS(app)

### --- Complaint Registration Endpoint (UNCHANGED) --- ###
@app.route('/api/complaints', methods=['POST'])
def register_complaint():
    data = request.get_json()
    complaint_id = f"CMP{uuid.uuid4().hex[:6].upper()}"
    data["complaint_id"] = complaint_id

    if not os.path.exists("complaints.json"):
        with open("complaints.json", "w") as f:
            json.dump([], f)

    with open("complaints.json", "r+") as f:
        complaints = json.load(f)
        complaints.append(data)
        f.seek(0)
        json.dump(complaints, f, indent=2)

    return jsonify({"status": "success", "complaint_id": complaint_id})


### --- FAQ RAG Chat Endpoint --- ###
# Load multilingual FAQ data
def load_faq_documents(language="en"):
    with open("faq_data.json", "r", encoding="utf-8") as f:
        faq_list = json.load(f)

    key_q = "question_en" if language == "en" else "question_hi"
    key_a = "answer_en" if language == "en" else "answer_hi"

    docs = [
        Document(page_content=f"{faq[key_q]} {faq[key_a]}")
        for faq in faq_list if key_q in faq and key_a in faq
    ]

    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
    return splitter.split_documents(docs)

# Build or load FAISS vectorstore
def get_vectorstore(language="en"):
    embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    index_path = f"faiss_{language}_index"

    if os.path.exists(index_path):
        # Load FAISS index with dangerous deserialization enabled
        with open(index_path, 'rb') as f:
            faiss_index = pickle.load(f, fix_imports=True, encoding="latin1", allow_dangerous_deserialization=True)
        return faiss_index
    else:
        docs = load_faq_documents(language)
        store = FAISS.from_documents(docs, embedding)
        store.save_local(index_path)
        return store

# Setup QA Chain
def get_qa_chain(language="en"):
    vectorstore = get_vectorstore(language)
    retriever = vectorstore.as_retriever(search_kwargs={"k": 3})
    llm = ChatGroq(api_key=os.getenv("GROQ_API_KEY"), model_name="llama-3.3-70b-versatile", temperature=0)
    return RetrievalQA.from_chain_type(llm=llm, retriever=retriever)

@app.route('/api/faq', methods=['POST'])
def handle_faq():
    data = request.get_json()
    question = data.get("question", "")
    language = data.get("lang", "en")  # 'en' or 'hi'

    if not question:
        return jsonify({"error": "Question is required."}), 400

    try:
        qa_chain = get_qa_chain(language)
        answer = qa_chain.run(question)
        return jsonify({"response": answer})
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        # Automatically delete FAISS index directory (if it exists)
        index_dir = f"faiss_{language}_index"
        shutil.rmtree(index_dir, ignore_errors=True)


if __name__ == "__main__":
    app.run(debug=True)
