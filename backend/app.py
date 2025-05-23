from flask import Flask, request, jsonify
from flask_cors import CORS
from langchain.schema import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain.chains import RetrievalQA
from langchain_groq import ChatGroq
from langchain.document_loaders import PyPDFLoader
from pydub import AudioSegment
import glob
from dotenv import load_dotenv
import uuid
import json
import os
import pickle
import shutil
import webrtcvad
import wave
import whisper
import tempfile
import speech_recognition as sr
from gtts import gTTS
from pydub.playback import play
from pydub.utils import which

load_dotenv()


app = Flask(__name__)
CORS(app)

AudioSegment.converter = which("ffmpeg")  # path to ffmpeg.exe
AudioSegment.ffprobe = which("ffprobe")

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

def load_document_files(folder_path="docs"):
    docs = []
    for filepath in glob.glob(f"{folder_path}/*.pdf"):
        docs.extend(PyPDFLoader(filepath).load())

    splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=30)
    return splitter.split_documents(docs)

# Load FAISS vectorstore
def get_vectorstore(language="en"):
    embedding = HuggingFaceEmbeddings(model_name="sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2")
    index_path = f"faiss_{language}_index"

    if os.path.exists(index_path):
        with open(index_path, 'rb') as f:
            faiss_index = pickle.load(f, fix_imports=True, encoding="latin1", allow_dangerous_deserialization=True)
        return faiss_index
    else:
        docs = load_document_files("docs")
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
        print("Error:", e) 
        return jsonify({"error": str(e)}), 500
    finally:
        # Automatically delete FAISS index directory (if it exists)
        index_dir = f"faiss_{language}_index"
        shutil.rmtree(index_dir, ignore_errors=True)

### --- Voice Activity Detection Endpoint --- ###
@app.route('/api/vad', methods=['POST'])
def voice_activity_detection():
    audio_file = request.files['audio']
    audio_file_path = tempfile.mktemp(suffix='.wav')
    audio_file.save(audio_file_path)

    # Convert audio to WAV format if necessary
    try:
        audio = AudioSegment.from_file(audio_file_path)
        audio.export(audio_file_path, format="wav")
    except Exception as e:
        return jsonify({"error": "Failed to convert audio file."}), 500

    # Read the audio file
    with wave.open(audio_file_path, 'rb') as wf:
        sample_rate = wf.getframerate()
        num_channels = wf.getnchannels()
        pcm_data = wf.readframes(wf.getnframes())

    # Initialize VAD
    vad = webrtcvad.Vad()
    frame_duration_ms = 30  # Duration of each frame in milliseconds
    frame_size = int(sample_rate * frame_duration_ms / 1000)

    # Process audio frames
    speech_detected = False
    for start in range(0, len(pcm_data), frame_size):
        frame = pcm_data[start:start + frame_size]
        if len(frame) < frame_size:
            break
        is_speech = vad.is_speech(frame, sample_rate)
        if is_speech:
            speech_detected = True
            break

    if speech_detected:
        return jsonify({"status": "success", "message": "Speech detected."})
    else:
        return jsonify({"status": "success", "message": "No speech detected."})

### --- Speech-to-Text Endpoint --- ###
@app.route('/api/stt', methods=['POST'])
def speech_to_text():
    audio_file = request.files["audio"]
    temp_input_path = tempfile.mktemp(suffix=".webm")
    audio_file.save(temp_input_path)

    model = whisper.load_model("base")
    result = model.transcribe(temp_input_path)
    return jsonify({"text": result["text"]})

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    data = request.get_json()
    text = data.get("text", "")
    lang = data.get("lang", "en")

    if not text:
        return jsonify({"error": "Text is required."}), 400

    try:
        tts = gTTS(text=text, lang=lang)
        output_path = tempfile.mktemp(suffix=".mp3")
        tts.save(output_path)

        with open(output_path, 'rb') as f:
            audio_data = f.read()

        return audio_data, 200, {'Content-Type': 'audio/mpeg'}
    except Exception as e:
        return jsonify({"error": str(e)}), 500
       
   
if __name__ == "__main__":
    app.run(debug=True)
