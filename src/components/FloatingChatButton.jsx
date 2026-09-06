import React, { useState, useRef, useEffect } from 'react';
import { useTracker } from '../context/TrackerContext';
import { chatWithAI, chatWithAIStream, analyzeSymptom, analyzePrescriptionFile } from '../api/aiApi';
import '../css/FloatingChatButton.css';

const fileToBase64 = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });

// Formats markdown **bold** text and linebreaks cleanly for comfortable reading
const formatAiMessage = (rawText) => {
  if (!rawText) return null;
  const lines = rawText.split('\n');
  return lines.map((line, lIdx) => {
    const segments = line.split(/(\*\*.*?\*\*)/g);
    const formattedLine = segments.map((seg, sIdx) => {
      if (seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) {
        return <strong key={sIdx} className="ai-bold-highlight">{seg.slice(2, -2)}</strong>;
      }
      return seg;
    });

    return (
      <React.Fragment key={lIdx}>
        {formattedLine}
        {lIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const FloatingChatButton = () => {
  const { isChatOpen, setIsChatOpen, user, pregnancy, setIsEmergencyModalOpen } = useTracker();
  const userName = user?.name || user?.email?.split('@')[0] || 'Mom';

  const [activeTopic, setActiveTopic] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isEnlarged, setIsEnlarged] = useState(false);

  const [inputValue, setInputValue] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Press Escape to minimize if in full-page mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isEnlarged) {
        setIsEnlarged(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEnlarged]);

  const scrollToBottom = (behavior = 'smooth') => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior
      });
    }
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior, block: 'end' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom('smooth');
    }, 50);
    return () => clearTimeout(timer);
  }, [messages, isLoading]);

  useEffect(() => {
    if (isChatOpen) {
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (ev) => setFilePreview(ev.target.result);
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setFilePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e, directText = null) => {
    if (e && e.preventDefault) e.preventDefault();
    const textToSend = typeof directText === 'string' ? directText : inputValue;
    if (!textToSend.trim() && !selectedFile) return;

    const userText = textToSend.trim();
    const currentFile = selectedFile;

    // Append user's outgoing message
    if (currentFile) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'user',
          type: 'file_message',
          fileName: currentFile.name,
          text: userText || ''
        }
      ]);
    } else {
      setMessages((prev) => [...prev, { sender: 'user', type: 'text', text: userText }]);
    }

    setInputValue('');
    removeSelectedFile();
    setIsLoading(true);

    try {
      // 1. Convert file to base64 if present
      let fileBase64 = null;
      let fileMimeType = null;
      if (currentFile) {
        fileBase64 = await fileToBase64(currentFile);
        fileMimeType = currentFile.type || 'image/jpeg';
      }

      // 2. Prepare conversation history (strictly last 6 turns: 3 user + 3 assistant)
      const history = messages
        .filter((m) => m.text && (m.sender === 'user' || m.sender === 'bot'))
        .slice(-6)
        .map((m) => ({
          role: m.sender === 'user' ? 'user' : 'model',
          text: m.text
        }));

      // Add new bot message placeholder immediately with empty text
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          type: 'chat_reply',
          text: '',
          isSevere: false
        }
      ]);

      let isFirstChunk = true;
      let accumulatedText = '';

      const onChunk = (chunk) => {
        if (!chunk) return;

        if (isFirstChunk) {
          setIsLoading(false);
          isFirstChunk = false;
        }

        accumulatedText += chunk;
        const isSevere = /emergency|severe pain|heavy bleeding|difficulty breathing|seek emergency/i.test(accumulatedText);

        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].sender === 'bot' && updated[lastIdx].type === 'chat_reply') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: accumulatedText,
              isSevere
            };
          }
          return updated;
        });
        scrollToBottom('smooth');
      };

      // 3. Call conversational AI streaming endpoint (Groq primary for text, Gemini for files)
      const promptToSend = userText || (currentFile ? 'Please analyze this uploaded document or prescription and explain what it means in simple, reassuring terms for an expectant mother.' : '');
      const result = await chatWithAIStream(promptToSend, user?.id, history, fileBase64, fileMimeType, onChunk);

      // Ensure full text is captured if onChunk finished
      if (result?.reply && result.reply !== accumulatedText) {
        const isSevere = /emergency|severe pain|heavy bleeding|difficulty breathing|seek emergency/i.test(result.reply);
        setMessages((prev) => {
          if (prev.length === 0) return prev;
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx].sender === 'bot' && updated[lastIdx].type === 'chat_reply') {
            updated[lastIdx] = {
              ...updated[lastIdx],
              text: result.reply,
              isSevere
            };
          }
          return updated;
        });
      }

      // If user uploaded a receipt, also trigger optional background storage
      if (currentFile) {
        analyzePrescriptionFile(currentFile, user?.id, userText).catch(() => {});
      }

    } catch (err) {
      console.error('AI Assistant Error:', err);
      // Remove empty bot placeholder if it failed before receiving tokens
      setMessages((prev) => {
        const filtered = prev.filter(
          (m, idx) => !(idx === prev.length - 1 && m.sender === 'bot' && m.type === 'chat_reply' && !m.text)
        );
        const isConfigError = err.message?.includes('API key') || err.message?.includes('GEMINI_API_KEY') || err.message?.includes('GROQ_API_KEY');
        return [
          ...filtered,
          {
            sender: 'bot',
            type: 'error',
            isConfigError,
            text: isConfigError
              ? 'Conversational AI requires an API key. Please add GEMINI_API_KEY (free from aistudio.google.com) or GROQ_API_KEY to your Backend/.env file.'
              : err.message || 'Unable to connect to AI assistant right now. Please try again.'
          }
        ];
      });
    } finally {
      setIsLoading(false);
      scrollToBottom('smooth');
    }
  };

  // Optional secondary triage call for users who explicitly want quantitative probability scores
  const handleRunTriage = async (text) => {
    setIsLoading(true);
    try {
      const triage = await analyzeSymptom(text, user?.id);
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          type: 'symptom_result',
          data: triage
        }
      ]);
    } catch (err) {
      console.error('Triage error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (promptText) => {
    handleSendMessage(null, promptText);
  };

  return (
    <aside className={`floating-chat-container ${isEnlarged ? 'is-enlarged-container' : ''}`} aria-label="Support Chat">
      {/* Mini Chat Window if opened */}
      {isChatOpen && (
        <div className={`chat-window-card ${isEnlarged ? 'enlarged' : ''}`} role="dialog" aria-modal="true">
          {/* Header */}
          <div className="chat-window-header">
            <div className="chat-header-info">
              <span className="chat-avatar-badge" title="HappiMoM AI">💖</span>
              <button
                type="button"
                className="chat-enlarge-btn"
                onClick={() => setIsEnlarged((prev) => !prev)}
                title={isEnlarged ? "Collapse to standard size (Esc)" : "Enlarge AI to full page"}
                aria-label={isEnlarged ? "Collapse to standard size" : "Enlarge AI to full page"}
              >
                {isEnlarged ? (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="4 14 10 14 10 20" />
                    <polyline points="20 10 14 10 14 4" />
                    <line x1="14" y1="10" x2="21" y2="3" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                ) : (
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15 3 21 3 21 9" />
                    <polyline points="9 21 3 21 3 15" />
                    <line x1="21" y1="3" x2="14" y2="10" />
                    <line x1="3" y1="21" x2="10" y2="14" />
                  </svg>
                )}
              </button>
              <div>
                <h4 className="chat-header-title">HappiMoM AI Assistant</h4>
                <span className="chat-status-dot">Online</span>
              </div>
            </div>
            <button
              className="chat-close-btn"
              onClick={() => {
                setIsChatOpen(false);
                setIsEnlarged(false);
              }}
              aria-label="Close Chat"
            >
              ✕
            </button>
          </div>

          {/* Active Topic Banner (if available) */}
          {activeTopic && (
            <div className="chat-active-topic-badge" title="Active conversation topic">
              <span className="topic-icon">📌</span>
              <span className="topic-text">Topic: <strong>{activeTopic}</strong></span>
              <button
                type="button"
                className="topic-clear-btn"
                onClick={() => setActiveTopic(null)}
                title="Clear topic"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Messages Body */}
          <div className="chat-window-body" ref={chatBodyRef}>
            {/* Center Empty State to engage moms before chat starts */}
            {messages.length === 0 && (
              <div className="chat-empty-state">
                <div className="empty-state-card">
                  <div className="empty-state-avatar-wrapper">
                    <span className="empty-state-icon">🌸</span>
                    <span className="empty-state-badge-heart">🤱</span>
                  </div>

                  <h3 className="empty-state-title">
                    Hello, {userName}! 💕
                  </h3>
                  
                  <div className="empty-state-tagline">
                    {pregnancy?.currentWeek
                      ? `Week ${pregnancy.currentWeek} • You're doing amazing, Mama!`
                      : 'Always here for your motherhood journey ✨'}
                  </div>

                  <p className="empty-state-desc">
                    Ask me anything about your wellness, baby, or nutrition, or tap a topic below to get started:
                  </p>

                  <div className="empty-state-chips">
                    <button
                      type="button"
                      className="empty-suggestion-chip"
                      onClick={() => handleQuickPrompt('Is feeling exhausted normal right now, and what helps?')}
                    >
                      <span className="chip-icon">😴</span>
                      <span className="chip-text">Feeling tired & low energy</span>
                    </button>
                    <button
                      type="button"
                      className="empty-suggestion-chip"
                      onClick={() => handleQuickPrompt('What healthy foods and snacks should I focus on eating?')}
                    >
                      <span className="chip-icon">🥑</span>
                      <span className="chip-text">Healthy nutrition & foods</span>
                    </button>
                    <button
                      type="button"
                      className="empty-suggestion-chip"
                      onClick={() => handleQuickPrompt('How is my baby growing and developing at this stage?')}
                    >
                      <span className="chip-icon">👶</span>
                      <span className="chip-text">Baby's development</span>
                    </button>
                    <button
                      type="button"
                      className="empty-suggestion-chip"
                      onClick={() => handleQuickPrompt('What are safe, gentle remedies for nausea and morning sickness?')}
                    >
                      <span className="chip-icon">🍵</span>
                      <span className="chip-text">Morning sickness remedies</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-bubble-row ${msg.sender === 'user' ? 'user-row' : 'bot-row'}`}
              >
                {/* 1. Regular User Text Message */}
                {msg.type === 'text' && (
                  <div className="chat-bubble user-bubble">
                    {msg.text}
                  </div>
                )}

                {/* 2. Conversational AI Reply (Groq Stream / Gemini Stream) */}
                {msg.type === 'chat_reply' && msg.text && (
                  <div className="chat-bubble bot-bubble conversational-bubble">
                    <div className="chat-reply-text">{formatAiMessage(msg.text)}</div>
                    
                    {msg.isSevere && (
                      <button
                        type="button"
                        className="ai-emergency-action-btn"
                        style={{ marginTop: '0.5rem', width: '100%' }}
                        onClick={() => setIsEmergencyModalOpen(true)}
                      >
                        🚨 Call Doctor / Emergency Contact
                      </button>
                    )}
                  </div>
                )}

                {/* 3. User Uploaded File Bubble */}
                {msg.type === 'file_message' && (
                  <div className="chat-bubble user-bubble file-user-bubble">
                    <div className="uploaded-file-tag">
                      📎 <strong>{msg.fileName}</strong>
                    </div>
                    {msg.text && <p className="file-caption">{msg.text}</p>}
                  </div>
                )}

                {/* 4. Optional Secondary Symptom Triage Result Card (facebook/bart-large-mnli) */}
                {msg.type === 'symptom_result' && (
                  <div className="chat-ai-result-card symptom-card">
                    <div className="ai-card-header">
                      <span className="ai-badge-label">Quantitative Symptom Triage</span>
                      <span className={`ai-risk-tag risk-${msg.data.riskLevel?.toLowerCase()}`}>
                        {msg.data.riskLevel === 'HIGH' && '🔴 Emergency Warning'}
                        {msg.data.riskLevel === 'MODERATE' && '🟡 Needs Attention'}
                        {msg.data.riskLevel === 'LOW' && '🟢 Common Symptom'}
                      </span>
                    </div>

                    <div className="ai-top-prediction">
                      <h5 className="top-label-title">{msg.data.topLabel}</h5>
                      <span className="confidence-pill">{msg.data.topPercentage} Match</span>
                    </div>

                    <p className="ai-advice-text">{msg.data.advice}</p>

                    {/* Confidence score breakdown */}
                    <div className="ai-scores-container">
                      <span className="scores-subtitle">Classification Breakdown:</span>
                      {msg.data.scores?.map((sc, sIdx) => (
                        <div key={sIdx} className="score-row">
                          <span className="score-label">{sc.label}</span>
                          <div className="score-bar-wrapper">
                            <div
                              className={`score-bar-fill fill-${sIdx === 0 ? msg.data.riskLevel?.toLowerCase() : 'neutral'}`}
                              style={{ width: `${Math.max(5, Math.round(sc.score * 100))}%` }}
                            />
                          </div>
                          <span className="score-percentage">{sc.percentage}</span>
                        </div>
                      ))}
                    </div>

                    {msg.data.riskLevel === 'HIGH' && (
                      <button
                        type="button"
                        className="ai-emergency-action-btn"
                        onClick={() => setIsEmergencyModalOpen(true)}
                      >
                        🚨 Call Doctor / Emergency Contact
                      </button>
                    )}

                    <div className="ai-disclaimer-box">
                      <span className="disclaimer-icon">ℹ️</span>
                      <span>{msg.data.disclaimer}</span>
                    </div>
                  </div>
                )}

                {/* 5. Error Notice */}
                {msg.type === 'error' && (
                  <div className="chat-ai-result-card error-card">
                    <div className="error-header">⚠️ AI Notice</div>
                    <p className="error-text">{msg.text}</p>
                    {msg.isConfigError && (
                      <div className="config-hint-box" style={{ marginTop: '0.4rem' }}>
                        <code>Backend/.env -&gt; GEMINI_API_KEY=... or GROQ_API_KEY=...</code>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="chat-bubble-row bot-row">
                <div className="chat-bubble bot-bubble ai-loading-bubble">
                  <span className="ai-spinner-dot" />
                  <span className="ai-spinner-dot" />
                  <span className="ai-spinner-dot" />
                  <span className="loading-label">
                    {selectedFile
                      ? 'HappiMoM is reading your document...'
                      : 'HappiMoM Assistant is typing...'}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Selected File Preview Bar (When user attaches a receipt) */}
          {selectedFile && (
            <div className="selected-file-bar">
              {filePreview ? (
                <img src={filePreview} alt="Receipt preview" className="file-mini-thumb" />
              ) : (
                <span className="file-generic-icon">📄</span>
              )}
              <span className="file-name-text" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <button
                type="button"
                className="remove-file-btn"
                onClick={removeSelectedFile}
                title="Remove file"
              >
                ✕
              </button>
            </div>
          )}

          {/* Chat Footer Input Form */}
          <form className="chat-window-footer" onSubmit={handleSendMessage}>
            {/* Hidden File Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* 📎 Attachment Button */}
            <button
              type="button"
              className={`chat-attach-btn ${selectedFile ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current?.click()}
              title="Attach prescription / medical document"
              aria-label="Attach prescription file"
            >
              📎
            </button>

            <input
              type="text"
              className="chat-input"
              placeholder={
                selectedFile
                  ? 'Add notes or click send to analyze document...'
                  : 'Ask question, chat, describe symptoms, or attach file...'
              }
              value={inputValue}
              onChange={(e) => {
                setInputValue(e.target.value);
                scrollToBottom('smooth');
              }}
              onFocus={() => scrollToBottom('smooth')}
              disabled={isLoading}
              autoFocus
            />

            <button
              type="submit"
              className="chat-send-btn"
              disabled={isLoading || (!inputValue.trim() && !selectedFile)}
              aria-label="Send message"
            >
              ➤
            </button>
          </form>
        </div>
      )}

      {/* Floating circular pink/red gradient button (hidden when enlarged) */}
      {!isEnlarged && (
        <button
          id="floating-chat-trigger"
          className={`floating-chat-btn ${isChatOpen ? 'chat-active' : ''}`}
          onClick={() => setIsChatOpen(!isChatOpen)}
          aria-label="Open HappiMoM Chat Support"
          title="Chat with HappiMoM AI Assistant"
        >
          <span className="floating-chat-icon">
            {isChatOpen ? '✕' : '💬'}
          </span>
          <span className="chat-pulse-ring" />
        </button>
      )}
    </aside>
  );
};

export default FloatingChatButton;
