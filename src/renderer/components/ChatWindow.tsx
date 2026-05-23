import React, { useState, useRef, useEffect } from 'react';
import { getAIResponse, type ChatMessage } from '../services/aiService';
import { speak, stop, isSupported } from '../services/ttsService';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatWindowProps {
  onSendMessage?: (message: string) => void;
  onAIResponse?: (emotion: string) => void;
  ttsEnabled?: boolean;
  ttsVoice?: string;
  ttsRate?: number;
  useMockAI?: boolean;
  aiModel?: string;
  fontSize?: number;
  messageHistory?: number; // max history messages to send as context
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onSendMessage, onAIResponse, ttsEnabled = false, ttsVoice = 'zh-CN', ttsRate = 1.0, useMockAI = false, aiModel, fontSize = 13, messageHistory = 10 }) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    // 从 localStorage 加载聊天记录
    try {
      const saved = localStorage.getItem('aipet-chat-history');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 恢复 Date 对象
        return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
      }
    } catch (_) {}
    // 默认欢迎消息
    return [{
      id: '1',
      text: '系统已就绪，神经网络连接成功。你好！我是AIPET，你的AI助手，有什么可以帮你的吗？',
      sender: 'ai',
      timestamp: new Date()
    }];
  });

  // 聊天记录变化时自动保存
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  useEffect(() => {
    try {
      localStorage.setItem('aipet-chat-history', JSON.stringify(messagesRef.current));
    } catch (_) {}
  }, [messages]);
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

    // 停止当前的语音播放
    stop();

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

    try {
      // 构建消息历史用于上下文（限制条数）
      const historyMessages = messages
        .filter(m => m.text.length > 0)
        .slice(-messageHistory);
      const history: ChatMessage[] = historyMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // 调用 AI 服务（含上下文）
      const aiResponse = await getAIResponse(inputValue, history, useMockAI, aiModel);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      // 通知父组件情绪变化
      if (aiResponse.emotion) {
        onAIResponse?.(aiResponse.emotion);
      }

      // 语音合成
      if (ttsEnabled && isSupported()) {
        speak(aiResponse.text, { voice: ttsVoice, rate: ttsRate }).catch(() => {
          console.log('TTS playback failed');
        });
      }
    } catch (error) {
      console.error('AI response error:', error);

      // 错误时显示默认回复
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: '抱歉，暂时无法连接AI服务。请稍后再试。',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
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
            <div style={{
              ...(message.sender === 'user' ? styles.messageBubbleUser : styles.messageBubbleAI),
              fontSize: fontSize + 'px',
            }}>
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
