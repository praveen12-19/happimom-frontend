import React, { useState } from 'react';
import { useTracker } from '../context/TrackerContext';
import '../css/FloatingChatButton.css';

const FloatingChatButton = () => {
  const { isChatOpen, setIsChatOpen, user, pregnancy } = useTracker();
  const userName = user?.name || user?.email?.split('@')[0] || 'Mom';

  const [messages, setMessages] = useState(() => [
    {
      sender: 'bot',
      text: pregnancy
        ? `Hello ${userName}! 🌸 How are you feeling today in Week ${pregnancy.currentWeek}? Feel free to ask any pregnancy questions.`
        : `Hello ${userName}! 🌸 Welcome to HappiMoM. Feel free to ask any pregnancy or wellness questions.`
    }
  ]);
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userText = inputValue;
    setMessages((prev) => [...prev, { sender: 'user', text: userText }]);
    setInputValue('');

    // Instant supportive reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `You are doing wonderfully! Remember to stay hydrated, rest when you feel fatigued, and consult Dr. Jenkins if you experience any sudden cramps or unusual symptoms.`
        }
      ]);
    }, 600);
  };

  return (
    <aside className="floating-chat-container" aria-label="Support Chat">
      {/* Mini Chat Window if opened */}
      {isChatOpen && (
        <div className="chat-window-card" role="dialog" aria-modal="true">
          <div className="chat-window-header">
            <div className="chat-header-info">
              <span className="chat-avatar-badge">💖</span>
              <div>
                <h4 className="chat-header-title">HappiMoM Assistant</h4>
                <span className="chat-status-dot">Online • Always here for you</span>
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => setIsChatOpen(false)}
              aria-label="Close Chat"
            >
              ✕
            </button>
          </div>

          <div className="chat-window-body">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
              >
                <div className={`chat-bubble ${msg.sender === 'user' ? 'user-bubble' : 'bot-bubble'}`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>

          <form className="chat-window-footer" onSubmit={handleSendMessage}>
            <input
              type="text"
              className="chat-input"
              placeholder="Ask a pregnancy question..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              autoFocus
            />
            <button type="submit" className="chat-send-btn" aria-label="Send message">
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating circular pink/red gradient button */}
      <button
        id="floating-chat-trigger"
        className={`floating-chat-btn ${isChatOpen ? 'chat-active' : ''}`}
        onClick={() => setIsChatOpen(!isChatOpen)}
        aria-label="Open HappiMoM Chat Support"
        title="Chat with HappiMoM Assistant"
      >
        <span className="floating-chat-icon">
          {isChatOpen ? '✕' : '💬'}
        </span>
        <span className="chat-pulse-ring" />
      </button>
    </aside>
  );
};

export default FloatingChatButton;
