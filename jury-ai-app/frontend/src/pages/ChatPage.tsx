import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  message: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
}

const CHATBOT_API_URL = process.env.REACT_APP_CHATBOT_API_URL || 'http://localhost:8000';

const renderAiMessage = (content: string): React.ReactNode => {
  const lines = content.split('\n');
  return lines.map((line, lineIdx) => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return (
      <React.Fragment key={`line-${lineIdx}`}>
        {parts.map((part, partIdx) => {
          if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
            return <strong key={`part-${lineIdx}-${partIdx}`}>{part.slice(2, -2)}</strong>;
          }
          return <React.Fragment key={`part-${lineIdx}-${partIdx}`}>{part}</React.Fragment>;
        })}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const canUploadKnowledgeBase = user?.role === 'admin' || user?.role === 'lawyer';
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingDB, setUploadingDB] = useState(false);
  const [chatEnabled, setChatEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dbFileInputRef = useRef<HTMLInputElement>(null);
  const [chatHistory, setChatHistory] = useState<ChatSession[]>([
    {
      id: '1',
      title: 'Understanding Patent Process',
      messages: [
        {
          id: '1',
          sender: 'user',
          message: 'Can you explain the patent application process?',
          timestamp: new Date()
        },
        {
          id: '2',
          sender: 'ai',
          message: 'I\'d be happy to explain the patent application process. The process typically involves several key steps:\n\n1. **Patent Search**: First, conduct a thorough search to ensure your invention is novel and not already patented.\n\n2. **Prepare Application**: Draft a detailed patent application including claims, specifications, and drawings.\n\n3. **File Application**: Submit your application to the patent office with required fees.\n\n4. **Examination**: The patent office examines your application for patentability.\n\n5. **Response to Office Actions**: Address any concerns raised by the examiner.\n\n6. **Grant or Rejection**: If approved, your patent is granted; if not, you may appeal or modify.\n\nThe entire process typically takes 1-3 years and can cost $5,000-$15,000 including attorney fees. Would you like me to elaborate on any specific step?',
          timestamp: new Date()
        }
      ],
      createdAt: new Date()
    }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatHistory.length > 0 && !currentChat) {
      setCurrentChat(chatHistory[0]);
    }
  }, [chatHistory, currentChat]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const apiUrl = process.env.REACT_APP_API_URL || '';
        const response = await fetch(`${apiUrl}/auth/settings`);
        if (!response.ok) return;
        const data = await response.json();
        const payload = data?.data || data;
        setChatEnabled(payload?.chatEnabled !== false);
      } catch (error) {
        console.error('Failed to fetch auth settings for chat:', error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Clean up AI response text
  const cleanAIResponse = (text: string): string => {
    if (!text || typeof text !== 'string') return text || '';
    
    // Check if the text looks like a Python dict string representation we got from the backend
    if (text.startsWith("{'response':") || text.includes("'response':")) {
      // Very basic dict string parser for the specific format we see
      try {
        const match = text.match(/['"]response['"]\s*:\s*['"]([\s\S]*?)['"]\s*,\s*['"]sources['"]/);
        if (match && match[1]) {
          text = match[1];
        }
      } catch (e) {
        // ignore
      }
    }
    
    // Clean up escape sequences
    return text
      .replace(/\\n/g, '\n')
      .replace(/\\\\n/g, '\n')
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .trim();
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatEnabled) return;
    if (!message.trim() && !attachedFile) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      message: attachedFile 
        ? `${message.trim() || 'Uploaded file'} [📎 ${attachedFile.name}]`
        : message.trim(),
      timestamp: new Date()
    };

    // Add user message to current chat
    if (currentChat) {
      const updatedChat = {
        ...currentChat,
        messages: [...currentChat.messages, userMessage]
      };
      setCurrentChat(updatedChat);
      updateChatInHistory(updatedChat);
    } else {
      // Create new chat
      const newChat: ChatSession = {
        id: Date.now().toString(),
        title: message.substring(0, 50) + (message.length > 50 ? '...' : ''),
        messages: [userMessage],
        createdAt: new Date()
      };
      setCurrentChat(newChat);
      setChatHistory([newChat, ...chatHistory]);
    }

    setMessage('');
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsTyping(true);

    try {
      // Send question to FastAPI backend
      const formData = new FormData();
      formData.append('question', userMessage.message);
      
      // Add file if attached
      if (attachedFile) {
        formData.append('file', attachedFile);
      }
      
      const response = await fetch(`${CHATBOT_API_URL}/ask/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const data = await response.json();
      
      // Clean the AI response
      const rawAnswer = data.answer || data.response || 'No answer returned.';
      const cleanedAnswer = cleanAIResponse(rawAnswer);
      
      const aiMessage: Message = {
        id: Date.now().toString(),
        sender: 'ai',
        message: cleanedAnswer,
        timestamp: new Date(),
      };

      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          messages: [...currentChat.messages, userMessage, aiMessage],
        };
        setCurrentChat(updatedChat);
        updateChatInHistory(updatedChat);
      }
    } catch (error) {
      console.error('Error fetching AI response:', error);
      // Optionally, add an error message to the chat
    } finally {
      setIsTyping(false);
    }
  };

  const updateChatInHistory = (updatedChat: ChatSession) => {
    setChatHistory(prev => 
      prev.map(chat => chat.id === updatedChat.id ? updatedChat : chat)
    );
  };

  const newChat = () => {
    setCurrentChat(null);
  };

  const loadChat = (chat: ChatSession) => {
    setCurrentChat(chat);
    setSidebarOpen(false);
  };

  const deleteChat = (chatId: string) => {
    setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    if (currentChat?.id === chatId) {
      setCurrentChat(null);
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type (PDF, DOC, DOCX, TXT)
      const allowedTypes = ['application/pdf', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                           'text/plain'];
      if (allowedTypes.includes(file.type)) {
        setAttachedFile(file);
      } else {
        alert('Please upload a PDF, DOC, DOCX, or TXT file');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    }
  };

  const removeAttachment = () => {
    setAttachedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDatabaseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!canUploadKnowledgeBase) {
      alert('Only lawyer or admin can upload documents to the knowledge base.');
      if (dbFileInputRef.current) {
        dbFileInputRef.current.value = '';
      }
      return;
    }

    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDB(true);
    const formData = new FormData();
    
    // Add all selected files
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Please login as admin or lawyer to upload documents');
      }

      const response = await fetch(`${CHATBOT_API_URL}/upload/`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const data = await response.json();
      
      // Show success message with processing info
      alert(
        `✅ Upload Started!\n\n` +
        `${files.length} document(s) queued for processing.\n\n` +
        `Processing happens in the background - you can continue chatting!\n\n` +
        `The AI will have access to these documents once processing completes (usually 1-2 minutes).`
      );
      
      if (dbFileInputRef.current) {
        dbFileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading to database:', error);
      alert('❌ Failed to upload documents. Please try again.');
    } finally {
      setUploadingDB(false);
    }
  };

  return (
    <div className="vh-100 d-flex flex-column">
      {/* Header */}
      <nav className="navbar" style={{ background: 'rgba(15,23,42,0.95)', borderBottom: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
        <div className="container-fluid">
          <div className="d-flex align-items-center">
            <button
              className="btn btn-outline-light me-3"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <i className="fas fa-bars"></i>
            </button>
            <Link className="navbar-brand" to="/">
              <i className="fas fa-balance-scale me-2"></i>
              Jury AI
            </Link>
          </div>
          <div className="d-flex align-items-center">
            <Link to="/" className="btn btn-outline-light home-nav-btn">
              <i className="fas fa-home"></i> Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'd-block' : 'd-none d-lg-block'}`} style={{ width: '300px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: '#e2e8f0', fontSize: 15 }}>
                <i className="fas fa-history me-2" style={{ color: '#5dd0ff' }}></i>
                Chat History
              </h5>
              <button className="btn btn-sm" onClick={newChat} style={{ background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)', color: '#fff', border: 'none', borderRadius: 8, fontSize: 12 }}>
                <i className="fas fa-plus"></i> New
              </button>
            </div>
          </div>
          
          {/* Database Upload Section */}
          <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            <h6 className="mb-2" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              <i className="fas fa-database me-2" style={{ color: '#7c5dff' }}></i>
              Knowledge Base
            </h6>

            {canUploadKnowledgeBase ? (
              <>
                <input
                  type="file"
                  ref={dbFileInputRef}
                  onChange={handleDatabaseUpload}
                  accept=".pdf,.doc,.docx,.txt"
                  multiple
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-sm w-100"
                  onClick={() => dbFileInputRef.current?.click()}
                  disabled={uploadingDB}
                  style={{ border: '1px solid rgba(124,93,255,0.3)', color: '#7c5dff', borderRadius: 8, fontSize: 13, background: 'rgba(124,93,255,0.06)' }}
                >
                  {uploadingDB ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-upload me-2"></i>
                      Upload Documents
                    </>
                  )}
                </button>
                <small className="d-block mt-2" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11 }}>
                  Upload legal documents to expand the AI's knowledge base
                </small>
              </>
            ) : (
              <small className="d-block" style={{ color: 'rgba(255,255,255,0.45)', fontSize: 11 }}>
                Knowledge base uploads are restricted to lawyer and admin accounts.
              </small>
            )}
          </div>
          
          <div className="p-3">
            <h6 style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Recent Chats</h6>
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className="p-2 mb-2 rounded"
                onClick={() => loadChat(chat)}
                style={{
                  cursor: 'pointer',
                  border: currentChat?.id === chat.id ? '1px solid rgba(93,208,255,0.3)' : '1px solid rgba(255,255,255,0.06)',
                  background: currentChat?.id === chat.id ? 'rgba(93,208,255,0.08)' : 'transparent',
                  borderRadius: 10,
                  transition: 'all 0.15s',
                }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <small className="fw-semibold d-block text-truncate" style={{ color: '#e2e8f0', fontSize: 13 }}>
                      {chat.title}
                    </small>
                    <small style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>
                      {chat.messages.length} messages
                    </small>
                  </div>
                  <button
                    className="btn btn-sm ms-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                    style={{ color: 'rgba(248,113,113,0.6)', border: 'none', background: 'transparent', fontSize: 12, padding: '2px 6px' }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-grow-1 d-flex flex-column" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0.005))' }}>
          {/* Chat Messages */}
          <div className="flex-grow-1 overflow-auto p-3">
            {currentChat ? (
              <div>
                <div className="text-center mb-4">
                  <h5 style={{ color: '#e2e8f0' }}>{currentChat.title}</h5>
                  <small style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Started {currentChat.createdAt.toLocaleString()}
                  </small>
                </div>
                
                {currentChat.messages.map((msg, idx) => (
                  <div
                    key={msg.id + '-' + idx}
                    className={`mb-3 d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className="p-3 rounded-3"
                      style={{
                        maxWidth: '75%',
                        background: msg.sender === 'user'
                          ? 'linear-gradient(135deg, #5dd0ff, #7c5dff)'
                          : 'rgba(255,255,255,0.04)',
                        color: msg.sender === 'user' ? '#fff' : '#e2e8f0',
                        border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        boxShadow: msg.sender === 'user'
                          ? '0 8px 24px rgba(93,208,255,0.2)'
                          : '0 4px 16px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center me-2"
                          style={{
                            width: '24px',
                            height: '24px',
                            fontSize: '12px',
                            background: msg.sender === 'user' ? 'rgba(255,255,255,0.2)' : 'linear-gradient(135deg, #5dd0ff, #7c5dff)',
                            color: '#fff',
                          }}
                        >
                          {msg.sender === 'user' ? (
                            <i className="fas fa-user"></i>
                          ) : (
                            <i className="fas fa-robot"></i>
                          )}
                        </div>
                        <small style={{ color: msg.sender === 'user' ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.4)' }}>
                          {msg.sender === 'user' ? 'You' : 'Jury AI'}
                        </small>
                      </div>
                      <div className="chat-message-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {msg.sender === 'ai' ? (
                          <div>{renderAiMessage(msg.message)}</div>
                        ) : (
                          msg.message
                        )}
                      </div>
                      <small className="d-block mt-2" style={{ color: msg.sender === 'user' ? 'rgba(255,255,255,0.55)' : 'rgba(255,255,255,0.3)' }}>
                        {msg.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="mb-3 d-flex justify-content-start">
                    <div className="p-3 rounded-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle d-flex align-items-center justify-content-center me-2"
                             style={{ width: '24px', height: '24px', fontSize: '12px', background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)', color: '#fff' }}>
                          <i className="fas fa-robot"></i>
                        </div>
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>Jury AI is typing...</span>
                        <div className="spinner-border spinner-border-sm ms-2" role="status" style={{ color: '#5dd0ff', width: 16, height: 16 }}></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center h-100 d-flex align-items-center justify-content-center">
                <div>
                  <div style={{ width: 80, height: 80, borderRadius: 20, background: 'rgba(93,208,255,0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                    <i className="fas fa-comments" style={{ fontSize: '2rem', color: '#5dd0ff' }}></i>
                  </div>
                  <h4 style={{ color: '#e2e8f0', fontWeight: 700 }}>Start a Legal Consultation</h4>
                  <p style={{ color: 'rgba(255,255,255,0.4)', maxWidth: 400, margin: '0 auto' }}>Ask me anything about legal matters and I'll help you understand the basics.</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="p-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)' }}>
            {!chatEnabled && (
              <div className="alert alert-warning mb-3" role="alert">
                AI chat is currently disabled by admin settings.
              </div>
            )}
            {/* File attachment preview */}
            {attachedFile && (
              <div className="alert alert-info alert-dismissible fade show mb-2 d-flex align-items-center" role="alert">
                <i className="fas fa-paperclip me-2"></i>
                <span className="flex-grow-1">
                  <strong>{attachedFile.name}</strong>
                  <small className="d-block text-muted">
                    {(attachedFile.size / 1024).toFixed(2)} KB
                  </small>
                </span>
                <button
                  type="button"
                  className="btn-close"
                  onClick={removeAttachment}
                  aria-label="Close"
                ></button>
              </div>
            )}
            
            <form onSubmit={handleSendMessage}>
              <div className="input-group">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileAttach}
                  accept=".pdf,.doc,.docx,.txt"
                  style={{ display: 'none' }}
                />
                <button
                  className="btn"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping || !chatEnabled}
                  title="Attach file"
                  style={{ border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', borderRadius: '12px 0 0 12px', background: 'rgba(255,255,255,0.04)' }}
                >
                  <i className="fas fa-paperclip"></i>
                </button>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ask me anything about legal matters..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isTyping || !chatEnabled}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e2e8f0', borderLeft: 'none', borderRight: 'none' }}
                />
                <button
                  className="btn"
                  type="submit"
                  disabled={(!message.trim() && !attachedFile) || isTyping || !chatEnabled}
                  style={{ background: 'linear-gradient(135deg, #5dd0ff, #7c5dff)', color: '#fff', border: 'none', borderRadius: '0 12px 12px 0', fontWeight: 600 }}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </form>
            <small className="d-block mt-2" style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
              <i className="fas fa-info-circle me-1"></i>
              This AI provides general legal information, not specific legal advice. Consult a lawyer for your specific situation.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
