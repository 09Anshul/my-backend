
// import genAI from "../config/gemini.js";

// export const chatWithAI = async (req, res) => {
//     const { message, history } = req.body; // Receive history from frontend
//     try {
//         const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro-latest" });

//         const chat = model.startChat({
//             history: history || [], // Use history if available, else start fresh
//             generationConfig: {
//                 temperature: 0.7, // Adjust for randomness in responses
//                 maxOutputTokens: 500,
//             },
//         });

//         const result = await chat.sendMessage(message);
//         const responseText = result.response.text();

//         res.json({ response: responseText });
//     } catch (error) {
//         console.error(error);
//         res.status(500).json({ error: error.message });
//     }
// };

import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import "../App.css";
import {
  FaRobot,
  FaUser,
  FaTimes,
  FaTrash,
  FaPaperPlane,
  FaMicrophone,
  FaMicrophoneSlash,
} from "react-icons/fa";
import InstallPWAButton from "./installPWAButton";

const Chatbot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mode, setMode] = useState("normal"); // 👈 Mode state added

  const chatRef = useRef(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    chatRef.current?.scrollTo(0, chatRef.current.scrollHeight);
  }, [messages]);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    }
  };

  const speak = (text) => {
    if (!window.speechSynthesis) return;

    const rawChunks = text.split(/\n+|\.\s+|\?\s+|!\s+/);
    const chunks = rawChunks.flatMap((chunk) => {
      if (chunk.length > 200) {
        return chunk.match(/.{1,180}(\s|$)/g) || [];
      }
      return chunk ? [chunk.trim()] : [];
    });

    let index = 0;

    const speakNext = () => {
      if (index >= chunks.length) return;

      const chunk = chunks[index];
      const utterance = new SpeechSynthesisUtterance(chunk);
      const isHindi = /[\u0900-\u097F]/.test(chunk);
      utterance.lang = isHindi ? "hi-IN" : "en-US";

      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;

      utterance.onend = () => {
        index++;
        speakNext();
      };

      utterance.onerror = (err) => {
        console.error("Speech synthesis error:", err);
        index++;
        speakNext();
      };

      window.speechSynthesis.speak(utterance);
    };

    window.speechSynthesis.cancel();
    speakNext();
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { text: input, sender: "user" }];
    setMessages(newMessages);
    setInput("");
    setIsTyping(true);
    setIsRecording(false);
    recognitionRef.current?.stop();

    const chatHistory = newMessages
      .filter((msg) => msg.sender === "user" || msg.sender === "bot")
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        message: input,
        history: chatHistory,
        mode: mode, // 👈 send mode
      });

      const botMessage = response.data.response;
      setMessages((prev) => [...prev, { text: botMessage, sender: "bot" }]);
      speak(botMessage);
    } catch (error) {
      const fallback = "Oops! Something went wrong.";
      setMessages((prev) => [...prev, { text: fallback, sender: "bot" }]);
      speak(fallback);
    } finally {
      setIsTyping(false);
    }
  };

  const sendVoiceMessage = async (voiceInput) => {
    const newMessages = [...messages, { text: voiceInput, sender: "user" }];
    setMessages(newMessages);
    setIsTyping(true);
    setIsRecording(false);
    recognitionRef.current?.stop();

    const chatHistory = newMessages
      .filter((msg) => msg.sender === "user" || msg.sender === "bot")
      .map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

    try {
      const response = await axios.post("http://localhost:5000/chat", {
        message: voiceInput,
        history: chatHistory,
        mode: mode, // 👈 send mode
      });

      const botMessage = response.data.response;
      setMessages((prev) => [...prev, { text: botMessage, sender: "bot" }]);
      speak(botMessage);
    } catch (error) {
      const fallback = "Oops! Something went wrong.";
      setMessages((prev) => [...prev, { text: fallback, sender: "bot" }]);
      speak(fallback);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    window.speechSynthesis.cancel();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setTimeout(() => {
        sendVoiceMessage(transcript);
      }, 300);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
  }, [messages]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    } else {
      window.speechSynthesis.cancel();
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const toggleMode = () => {
    setMode((prevMode) => (prevMode === "normal" ? "teaching" : "normal"));
  };

  return (
    <div className="container">
      <div className="background blur"></div>

      {!isChatOpen ? (
        <div className="content">
          <InstallPWAButton
            padding="10px 20px"
            background="rgb(173 173 173)"
            color="#fff"
            border="none"
            borderRadius="5px"
            cursor="pointer"
            fontSize="1.2rem"
            fontWeight="bold"
          />
          <h1 className="text">Welcome To AI Assistant</h1>
          <button onClick={() => setIsChatOpen(true)} className="button">
            Open Chat
          </button>
        </div>
      ) : (
        <div className="chatbox">
          <div className="chat-header">
            <span className="chat-title" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <FaRobot style={{ fontSize: "24px" }} className="chat-icon-header" />
              AI Assistant
            </span>
            <div>
              <button onClick={toggleMode} className="clear-btn">
                Mode: {mode === "normal" ? "Normal" : "Teaching"}
              </button>
              <button onClick={clearChat} className="clear-btn">
                <FaTrash /> Clear Chat
              </button>
              <button onClick={() => setIsChatOpen(false)} className="close-btn">
                <FaTimes />
              </button>
            </div>
          </div>

          <div ref={chatRef} className="chat-body">
            {messages.map((msg, index) => (
              <div key={index} className={`message-container ${msg.sender}`}>
                {msg.sender === "bot" && <FaRobot className="chat-icon" />}
                <div className={`message ${msg.sender}`}>{msg.text}</div>
                {msg.sender === "user" && <FaUser className="chat-icon" />}
              </div>
            ))}
            {isTyping && <p className="typing">Thinking...</p>}
            {isRecording && <p className="typing">🎙️ Listening...</p>}
          </div>

          <div className="chat-input">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a message or use mic..."
              rows={1}
              className="chat-textarea"
            />
            <button onClick={toggleRecording} className="mic-btn">
              {isRecording ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            <button onClick={sendMessage} className="send-btn">
              <FaPaperPlane />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
