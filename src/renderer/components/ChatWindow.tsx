import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatWindowProps {
  onSendMessage?: (message: string) => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onSendMessage }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'SYSTEM ONLINE. NEURAL LINK ESTABLISHED. READY FOR INPUT.',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    onSendMessage?.(inputValue);

    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getAIResponse(inputValue),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 600);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getAIResponse = (userMessage: string): string => {
    const responses = [
      "DATA RECEIVED. PROCESSING NEURAL INPUT...",
      "ANALYZING PATTERN. GENERATING RESPONSE...",
      "QUERY LOGGED. INITIATING COGNITIVE SEQUENCE...",
      "INPUT ACCEPTED. OUTPUT CALCULATED.",
      "NEURAL NETWORK ACTIVE. RESPONSE READY."
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const styles: { [key: string]: React.CSSProperties } = {
    chatWindow: {
      display: 'flex',
      flexDirection: 'column',
      width: '100%',
      height: '100%',
      background: 'rgba(10, 10, 20, 0.95)',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      borderRadius: '2px',
      overflow: 'hidden',
      position: 'relative',
    },
    chatHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 16px',
      background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.15), rgba(255, 0, 255, 0.15))',
      borderBottom: '1px solid rgba(0, 255, 255, 0.4)',
    },
    headerTitle: {
      margin: 0,
      fontSize: '12px',
      letterSpacing: '3px',
      color: '#00ffff',
      textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
    },
    status: {
      fontSize: '10px',
      padding: '4px 12px',
      background: 'rgba(0, 255, 0, 0.2)',
      border: '1px solid #00ff00',
      color: '#00ff00',
      letterSpacing: '2px',
      fontFamily: '"Share Tech Mono", monospace',
    },
    messagesContainer: {
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      scrollbarWidth: 'thin',
      scrollbarColor: '#00ffff transparent',
    },
    messageUser: {
      alignSelf: 'flex-end',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      maxWidth: '85%',
    },
    messageAI: {
      alignSelf: 'flex-start',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      maxWidth: '85%',
    },
    messageBubbleUser: {
      padding: '10px 14px',
      background: 'linear-gradient(135deg, rgba(0, 255, 255, 0.2), rgba(0, 200, 255, 0.15))',
      border: '1px solid rgba(0, 255, 255, 0.5)',
      borderRadius: '2px',
      fontSize: '13px',
      lineHeight: '1.5',
      color: '#e0f0ff',
      letterSpacing: '0.5px',
    },
    messageBubbleAI: {
      padding: '10px 14px',
      background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.15), rgba(200, 0, 255, 0.1))',
      border: '1px solid rgba(255, 0, 255, 0.4)',
      borderRadius: '2px',
      fontSize: '13px',
      lineHeight: '1.5',
      color: '#f0e0ff',
      letterSpacing: '0.5px',
    },
    messageTime: {
      fontSize: '9px',
      color: '#555',
      marginTop: '4px',
      letterSpacing: '1px',
      fontFamily: '"Share Tech Mono", monospace',
    },
    inputArea: {
      display: 'flex',
      padding: '12px 16px',
      borderTop: '1px solid rgba(0, 255, 255, 0.3)',
      background: 'rgba(5, 5, 15, 0.8)',
      gap: '12px',
    },
    messageInput: {
      flex: 1,
      padding: '10px 14px',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(0, 255, 255, 0.4)',
      borderRadius: '2px',
      fontSize: '13px',
      color: '#00ffff',
      outline: 'none',
      fontFamily: '"Share Tech Mono", monospace',
      letterSpacing: '1px',
    },
    messageInputPlaceholder: {
      color: '#444',
    },
    sendButton: {
      padding: '10px 20px',
      background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))',
      border: '1px solid #00ffff',
      color: '#00ffff',
      fontSize: '11px',
      letterSpacing: '2px',
      cursor: 'pointer',
      fontFamily: '"Share Tech Mono", monospace',
      transition: 'all 0.2s ease',
    },
    sendButtonHover: {
      background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))',
      boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
    },
    typingIndicator: {
      display: 'flex',
      gap: '4px',
      padding: '12px 16px',
      background: 'linear-gradient(135deg, rgba(255, 0, 255, 0.15), rgba(200, 0, 255, 0.1))',
      border: '1px solid rgba(255, 0, 255, 0.4)',
      borderRadius: '2px',
      width: 'fit-content',
    },
    typingDot: {
      width: '6px',
      height: '6px',
      background: '#ff00ff',
      borderRadius: '50%',
      animation: 'typing 1.4s infinite ease-in-out',
    },
  };

  return (
    <div style={styles.chatWindow}>
      <div style={styles.chatHeader}>
        <h3 style={styles.headerTitle}>COMMUNICATION_LINK</h3>
        <span style={styles.status}>● ONLINE</span>
      </div>

      <div style={styles.messagesContainer}>
        {messages.map((message) => (
          <div
            key={message.id}
            style={message.sender === 'user' ? styles.messageUser : styles.messageAI}
          >
            <div style={message.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleAI}>
              {message.text}
            </div>
            <div style={styles.messageTime}>
              {message.timestamp.toLocaleTimeString('en-US', { hour12: false })}
            </div>
          </div>
        ))}
        {isTyping && (
          <div style={styles.messageAI}>
            <div style={styles.typingIndicator}>
              <div style={{ ...styles.typingDot, animationDelay: '0s' }} />
              <div style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
              <div style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div style={styles.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="> ENTER TRANSMISSION..."
          style={{ ...styles.messageInput, ...styles.messageInputPlaceholder }}
        />
        <button
          onClick={handleSend}
          style={styles.sendButton}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))';
            e.currentTarget.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'linear-gradient(90deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          TRANSMIT
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
