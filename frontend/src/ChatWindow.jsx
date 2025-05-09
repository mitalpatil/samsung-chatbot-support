import React, { useState, useEffect, useRef } from "react";
import { Bot, User, Send, Loader2 } from 'lucide-react';
import './ChatWindow.css';

// Mock API function
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


const suggestions = {
  EN: [
    { label: "Explore FAQs", action: "explore_faqs" },
    { label: "Register Complaint", action: "register_complaint" },
    { label: "Check Warranty", action: "check_warranty" }
  ],
  HI: [
    { label: "सामान्य प्रश्न देखें", action: "explore_faqs" },
    { label: "शिकायत दर्ज करें", action: "register_complaint" },
    { label: "वारंटी जांचें", action: "check_warranty" }
  ]
};

const commonFAQs = {
  EN: [
    "Apps not working on my TV",
    "TV starting in Safe Mode",
    "Wi-Fi issues on old Samsung TV"
  ],
  HI: [
    "मेरे टीवी पर ऐप्स काम नहीं कर रहे",
    "टीवी सेफ मोड में शुरू हो रहा है",
    "पुराने सैमसंग टीवी पर वाई-फाई समस्या"
  ]
};

const SamsungLogo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="samsung-logo">
    <path d="M19.8 10.7C19.7 10 19.1 9.4 18.3 9.3V7.5C18.3 7.2 18.1 7 17.8 7H6.2C5.9 7 5.7 7.2 5.7 7.5V9.3C4.9 9.4 4.3 10 4.2 10.7C4.1 11.5 4.7 12.2 5.5 12.3V16.5C5.5 16.8 5.7 17 6 17H18C18.3 17 18.5 16.8 18.5 16.5V12.3C19.3 12.2 19.9 11.5 19.8 10.7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M15 13H9C8.4 13 8 12.6 8 12V10C8 9.4 8.4 9 9 9H15C15.6 9 16 9.4 16 10V12C16 12.6 15.6 13 15 13Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

const ChatWindow = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showFAQOptions, setShowFAQOptions] = useState(false);
  const [registerComplaint, setRegisterComplaint] = useState(false);
  const [language, setLanguage] = useState("EN");
  const [complaintData, setComplaintData] = useState({
    name: "", city: "", state: "", address: "", pincode: "", product: "",briefComplaint: "" 
  });
  
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
  }, [messages, showFAQOptions, registerComplaint]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { from: "user", text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await sendMessage(input, language);
      const botMsg = { from: "bot", text: res.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [...prev, { from: "bot", text: "Error. Try again." }]);
    }
    setLoading(false);
  };

  const handleSuggestion = (action) => {
    if (action === "explore_faqs") {
      setShowFAQOptions(true);
      setRegisterComplaint(false);
    } else if (action === "register_complaint") {
      setRegisterComplaint(true);
      setShowFAQOptions(false);
    } else if (action === "check_warranty") {
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: language === "HI" ? "कृपया अपना उत्पाद मॉडल नंबर और खरीदारी की तारीख दर्ज करें।" : "Please enter your product model number and purchase date." }
      ]);
      setShowFAQOptions(false);
      setRegisterComplaint(false);
    }
  };

  const handleFAQSelection = (faq) => {
    setMessages((prev) => [...prev, { from: "user", text: faq }]);
    setShowFAQOptions(false);
    setInput(faq);
    handleSend();
  };

  const handleComplaintSubmit = async () => {
  const { name, city, state, address, pincode, product, briefComplaint } = complaintData;

  if (!name || !city || !state || !address || !pincode || !product || !briefComplaint) {
    setMessages(prev => [
      ...prev,
      { from: "bot", text: language === "HI" ? "कृपया सभी फ़ील्ड भरें।" : "Please fill out all fields before submitting." }
    ]);
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/complaints", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(complaintData)
    });

    const result = await response.json();

    setMessages(prev => [
      ...prev,
      {
        from: "user",
        text: `Name: ${name}, City: ${city}, State: ${state}, Address: ${address}, PIN: ${pincode}, Product: ${product}, Brief Complaint: ${briefComplaint}`
      },
      {
        from: "bot",
        text: language === "HI"
          ? `धन्यवाद। आपकी शिकायत दर्ज हो चुकी है। शिकायत ID: ${result.complaint_id}`
          : `Thank you. Your complaint has been registered. Complaint ID: ${result.complaint_id}`
      }
    ]);

    setComplaintData({ name: "", city: "", state: "", address: "", pincode: "", product: "", briefComplaint: "" });
    setRegisterComplaint(false);

  } catch (error) {
    setMessages(prev => [
      ...prev,
      { from: "bot", text: language === "HI" ? "कुछ गलत हो गया। कृपया पुनः प्रयास करें।" : "Something went wrong. Please try again." }
    ]);
  }
};



  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "EN" ? "HI" : "EN"));
  };

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="header-content">
          <div className="header-logo">
            <SamsungLogo />
            <h1>Samsung {language === "HI" ? "सहायता" : "Support"}</h1>
          </div>
          <button className="lang-toggle" onClick={toggleLanguage}>
            {language === "EN" ? "हिंदी" : "EN"}
          </button>
        </div>
      </div>

      <div className="suggestions-container">
        <div className="suggestions">
          {suggestions[language].map((s, i) => (
            <button key={i} className="suggestion-button" onClick={() => handleSuggestion(s.action)}>
              {s.label}
            </button>
          ))}
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

      {showFAQOptions && (
        <div className="faq-options">
          <h3>{language === "HI" ? "एक सामान्य प्रश्न चुनें:" : "Select a common FAQ:"}</h3>
          <div className="faq-options-list">
            {commonFAQs[language].map((faq, i) => (
              <button key={i} className="faq-option" onClick={() => handleFAQSelection(faq)}>
                {faq}
              </button>
            ))}
          </div>
        </div>
      )}

      {registerComplaint && (
  <div className="complaint-form">
    <h3>{language === "HI" ? "शिकायत दर्ज करें" : "Register Complaint"}</h3>

    <input
      type="text"
      className="complaint-input"
      placeholder={language === "HI" ? "पूरा नाम" : "Full Name"}
      value={complaintData.name}
      onChange={(e) => setComplaintData({ ...complaintData, name: e.target.value })}
    />
    <input
      type="text"
      className="complaint-input"
      placeholder={language === "HI" ? "शहर" : "City"}
      value={complaintData.city}
      onChange={(e) => setComplaintData({ ...complaintData, city: e.target.value })}
    />
    <input
      type="text"
      className="complaint-input"
      placeholder={language === "HI" ? "राज्य" : "State"}
      value={complaintData.state}
      onChange={(e) => setComplaintData({ ...complaintData, state: e.target.value })}
    />
    <input
      type="text"
      className="complaint-input"
      placeholder={language === "HI" ? "पता" : "Address"}
      value={complaintData.address}
      onChange={(e) => setComplaintData({ ...complaintData, address: e.target.value })}
    />
    <input
      type="text"
      className="complaint-input"
      placeholder={language === "HI" ? "पिनकोड" : "PIN Code"}
      value={complaintData.pincode}
      onChange={(e) => setComplaintData({ ...complaintData, pincode: e.target.value })}
    />
    <input
      type="text"
      className="complaint-input"
      placeholder={language === "HI" ? "उत्पाद मॉडल नंबर" : "Product Model Number"}
      value={complaintData.product}
      onChange={(e) => setComplaintData({ ...complaintData, product: e.target.value })}
    />
    <textarea
      className="complaint-input"
      placeholder={language === "HI" ? "अपनी शिकायत संक्षेप में लिखें" : "Write your complaint briefly"}
      value={complaintData.briefComplaint}
      onChange={(e) => setComplaintData({ ...complaintData, briefComplaint: e.target.value })}
    />

    <div className="complaint-buttons">
      <button className="submit-complaint-btn" onClick={handleComplaintSubmit}>
        {language === "HI" ? "सबमिट करें" : "Submit"}
      </button>
      <button className="back-btn" onClick={() => setRegisterComplaint(false)}>
        {language === "HI" ? "वापस जाएं" : "Back to Chat"}
      </button>
    </div>
  </div>
)}


      <div className="chat-input-container">
        <input
          type="text"
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder={language === "HI" ? "अपना संदेश लिखें..." : "Type your message..."}
        />
        <button className="send-button" onClick={handleSend}>
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;