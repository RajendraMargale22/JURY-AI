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

const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentChat, setCurrentChat] = useState<ChatSession | null>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [uploadingDB, setUploadingDB] = useState(false);
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
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Clean up AI response text
  const cleanAIResponse = (text: string): string => {
    // Remove dictionary-like formatting
    if (typeof text === 'string') {
      // Remove {'response': '...'} wrapper if present
      if (text.startsWith("{'response':") || text.startsWith('{"response":')) {
        try {
          // Try to parse as JSON first
          const parsed = JSON.parse(text.replace(/'/g, '"'));
          return parsed.response || parsed.answer || text;
        } catch {
          // If parsing fails, use regex to extract response value
          const match = text.match(/['"]response['"]\s*:\s*['"](.+?)['"]\s*,?\s*['"]sources['"]/);
          if (match && match[1]) {
            return match[1]
              .replace(/\\n\\n/g, '\n\n')
              .replace(/\\n/g, '\n')
              .replace(/\*\*/g, '')
              .trim();
          }
        }
      }
      // Clean up escape sequences
      return text
        .replace(/\\n\\n/g, '\n\n')
        .replace(/\\n/g, '\n')
        .trim();
    }
    return text;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
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
      
      const response = await fetch('http://localhost:8000/ask/', {
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
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingDB(true);
    const formData = new FormData();
    
    // Add all selected files
    Array.from(files).forEach(file => {
      formData.append('files', file);
    });

    try {
      const response = await fetch('http://localhost:8000/upload/', {
        method: 'POST',
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
      <nav className="navbar navbar-dark bg-dark">
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
            <Link to="/" className="btn btn-outline-light">
              <i className="fas fa-home"></i> Home
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex-grow-1 d-flex overflow-hidden">
        {/* Sidebar */}
        <div className={`bg-light border-end ${sidebarOpen ? 'd-block' : 'd-none d-lg-block'}`} style={{ width: '300px' }}>
          <div className="p-3 border-bottom">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Chat History
              </h5>
              <button className="btn btn-sm btn-primary" onClick={newChat}>
                <i className="fas fa-plus"></i> New
              </button>
            </div>
          </div>
          
          {/* Database Upload Section */}
          <div className="p-3 border-bottom bg-white">
            <h6 className="text-muted mb-2">
              <i className="fas fa-database me-2"></i>
              Knowledge Base
            </h6>
            <input
              type="file"
              ref={dbFileInputRef}
              onChange={handleDatabaseUpload}
              accept=".pdf,.doc,.docx,.txt"
              multiple
              style={{ display: 'none' }}
            />
            <button
              className="btn btn-sm btn-outline-success w-100"
              onClick={() => dbFileInputRef.current?.click()}
              disabled={uploadingDB}
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
            <small className="text-muted d-block mt-2">
              Upload legal documents to expand the AI's knowledge base
            </small>
          </div>
          
          <div className="p-3">
            <h6 className="text-muted">Recent Chats</h6>
            {chatHistory.map((chat) => (
              <div
                key={chat.id}
                className={`p-2 mb-2 rounded cursor-pointer border ${
                  currentChat?.id === chat.id ? 'border-primary bg-primary bg-opacity-10' : 'border-light'
                }`}
                onClick={() => loadChat(chat)}
                style={{ cursor: 'pointer' }}
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <small className="fw-semibold d-block text-truncate">
                      {chat.title}
                    </small>
                    <small className="text-muted">
                      {chat.messages.length} messages
                    </small>
                  </div>
                  <button
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-grow-1 d-flex flex-column">
          {/* Chat Messages */}
          <div className="flex-grow-1 overflow-auto p-3">
            {currentChat ? (
              <div>
                <div className="text-center mb-4">
                  <h5>{currentChat.title}</h5>
                  <small className="text-muted">
                    Started {currentChat.createdAt.toLocaleString()}
                  </small>
                </div>
                
                {currentChat.messages.map((msg, idx) => (
                  <div
                    key={msg.id + '-' + idx}
                    className={`mb-3 d-flex ${msg.sender === 'user' ? 'justify-content-end' : 'justify-content-start'}`}
                  >
                    <div
                      className={`p-3 rounded-3 max-w-75 ${
                        msg.sender === 'user'
                          ? 'bg-primary text-white'
                          : 'bg-light border'
                      }`}
                      style={{ maxWidth: '75%' }}
                    >
                      <div className="d-flex align-items-center mb-2">
                        <div
                          className={`rounded-circle d-flex align-items-center justify-content-center me-2 ${
                            msg.sender === 'user' ? 'bg-white text-primary' : 'bg-primary text-white'
                          }`}
                          style={{ width: '24px', height: '24px', fontSize: '12px' }}
                        >
                          {msg.sender === 'user' ? (
                            <i className="fas fa-user"></i>
                          ) : (
                            <i className="fas fa-robot"></i>
                          )}
                        </div>
                        <small className={msg.sender === 'user' ? 'text-white-50' : 'text-muted'}>
                          {msg.sender === 'user' ? 'You' : 'Jury AI'}
                        </small>
                      </div>
                      <div className="chat-message-content" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                        {msg.sender === 'ai' ? (
                          <div dangerouslySetInnerHTML={{
                            __html: msg.message
                              .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                              .replace(/\n\n/g, '<br/><br/>')
                              .replace(/\n/g, '<br/>')
                          }} />
                        ) : (
                          msg.message
                        )}
                      </div>
                      <small className={`d-block mt-2 ${msg.sender === 'user' ? 'text-white-50' : 'text-muted'}`}>
                        {msg.timestamp.toLocaleTimeString()}
                      </small>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="mb-3 d-flex justify-content-start">
                    <div className="bg-light border p-3 rounded-3">
                      <div className="d-flex align-items-center">
                        <div className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2"
                             style={{ width: '24px', height: '24px', fontSize: '12px' }}>
                          <i className="fas fa-robot"></i>
                        </div>
                        <span className="text-muted">Jury AI is typing...</span>
                        <div className="spinner-border spinner-border-sm ms-2" role="status"></div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center h-100 d-flex align-items-center justify-content-center">
                <div>
                  <i className="fas fa-comments text-muted mb-3" style={{ fontSize: '4rem' }}></i>
                  <h4 className="text-muted">Start a Legal Consultation</h4>
                  <p className="text-muted">Ask me anything about legal matters and I'll help you understand the basics.</p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <div className="border-top p-3">
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
                  className="btn btn-outline-secondary"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isTyping}
                  title="Attach file"
                >
                  <i className="fas fa-paperclip"></i>
                </button>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ask me anything about legal matters..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={isTyping}
                />
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={(!message.trim() && !attachedFile) || isTyping}
                >
                  <i className="fas fa-paper-plane"></i>
                </button>
              </div>
            </form>
            <small className="text-muted d-block mt-2">
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
