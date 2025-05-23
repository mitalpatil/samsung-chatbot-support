import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Loader2 } from 'lucide-react';
import './ChatWindow.css';

// Mock API function for chatbot
const sendMessage = async (message, language) => {
  try {
    const res = await fetch("http://localhost:5000/api/faq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        question: message,
        lang: language === "HI" ? "hi" : "en"
      })
    });
    const data = await res.json();
    return { response: data.response };
  } catch (error) {
    return { response: " Sorry, something went wrong. Please try again later." };
  }
};

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [recording, setRecording] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const greeting = language === "EN"
      ? "👋 Welcome to Samsung Customer Support! How can I assist you today?"
      : "👋 नमस्कार! सैमसंग कस्टमर सपोर्ट में आपका स्वागत है। मैं आपकी किस प्रकार सहायता कर सकता/सकती हूँ?";
    setMessages([{ from: "bot", text: greeting }]);
  }, [language]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to record audio, send to /api/stt, then process chatbot response
const handleVoiceInput = async () => {
  if (recording) return; // Prevent multiple recordings at once
  setRecording(true);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.start();

    // Stop recording after 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    mediaRecorder.stop();

    const audioBlob = await new Promise(resolve => {
      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunks, { type: 'audio/webm' });
        resolve(blob);
      };
    });

    // Convert audio to WAV format using pydub (this part should be done on the server)
    const formData = new FormData();
    formData.append('audio', audioBlob, 'audio.webm');

    // Send audio blob to STT endpoint
    const sttResponse = await fetch("http://localhost:5000/api/stt", {
      method: "POST",
      body: formData
    });

    const sttResult = await sttResponse.json();

    if (sttResult.text) {
      // Add user message from STT text
      setMessages(prev => [...prev, { from: "user", text: sttResult.text }]);
      setInput(""); // Clear input box (optional)
      
      setLoading(true);
      // Send message to chatbot
      const chatbotReply = await sendMessage(sttResult.text, language);
      setMessages(prev => [...prev, { from: "bot", text: chatbotReply.response }]);

      // Trigger the TTS function to convert the bot's response to speech
      const ttsRes = await fetch("http://localhost:5000/api/tts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: chatbotReply.response,
          lang: language === "HI" ? "hi" : "en"
        })
      });

      // Optionally play the audio response here
      const audioBlob = await ttsRes.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    } else {
      setMessages(prev => [...prev, { from: "bot", text: sttResult.error || "Sorry, I could not understand that." }]);
    }
  } catch (error) {
    console.error("Voice input error:", error);
    setMessages(prev => [...prev, { from: "bot", text: "Error accessing microphone or speech recognition failed." }]);
  } finally {
    setLoading(false);
    setRecording(false);
  }
};


const handleSend = async () => {
  if (!input.trim()) return;

  const userMsg = { from: "user", text: input };
  setMessages(prev => [...prev, userMsg]);
  setInput("");
  setLoading(true);

  try {
    const res = await sendMessage(input, language);
    const botMsg = { from: "bot", text: res.response };
    setMessages(prev => [...prev, botMsg]);

    // Trigger the TTS function to convert the bot's response to speech
    const ttsRes = await fetch("http://localhost:5000/api/tts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        text: res.response,
        lang: language === "HI" ? "hi" : "en"
      })
    });

    // Optionally play the audio response here, if you want immediate playback
    const audioBlob = await ttsRes.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.play();

  } catch (err) {
    const errorMsg = language === "HI" ? "कुछ गलत हो गया। कृपया पुनः प्रयास करें।" : "Error. Try again.";
    setMessages(prev => [...prev, { from: "bot", text: errorMsg }]);
  } finally {
    setLoading(false);
  }
};


  const toggleLanguage = () => {
    setLanguage(prev => (prev === "EN" ? "HI" : "EN"));
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="header-content">
          <h1>Samsung {language === "HI" ? "सहायता" : "Support"}</h1>
          <button className="lang-toggle" onClick={toggleLanguage}>
            {language === "EN" ? "हिंदी" : "EN"}
          </button>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-container ${msg.from}-container`}>
            <div className={`message ${msg.from}`}>
              <div className="message-icon">
                {msg.from === "bot" ? <Bot size={20} /> : <User size={20} />}
              </div>
              <div className="message-content">
                <p>{msg.text}</p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="message-container bot-container">
            <div className="message bot typing">
              <div className="message-icon">
                <Bot size={20} />
              </div>
              <div className="message-content">
                <div className="typing-indicator">
                  <Loader2 className="typing-spinner" size={16} />
                  <p>Typing<span className="dot-1">.</span><span className="dot-2">.</span><span className="dot-3">.</span></p>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <div className="chat-input">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={language === "HI" ? "यहां टाइप करें..." : "Type your message..."}
          disabled={loading || recording}
        />
        <button onClick={handleSend} disabled={loading || recording}>
          <Send size={20} />
        </button>
        <button
          onClick={handleVoiceInput}
          disabled={loading || recording}
          title={recording ? "Recording..." : "Speak"}
          aria-label="Voice input"
        >
          🎤
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
