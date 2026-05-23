import React, { useState, useRef, useEffect } from 'react';
import { getAIResponse, type ChatMessage } from '../services/aiService';
import { speak, stop, isSupported } from '../services/ttsService';
import { loadFacts, extractFacts, addFact, getRelevantFacts, formatFactsForContext } from '../services/memoryService';
import { loadFacts, extractFacts, addFact, getRelevantFacts, formatFactsForContext } from '../services/memoryService';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

interface ChatWindowProps {
  onSendMessage?: (message: string) => void;
  onAIResponse?: (emotion: string) => void;
  onSpeakingChange?: (speaking: boolean) => void;
  onMemoryChange?: (count: number) => void;
  onOpenMemory?: () => void;
  ttsEnabled?: boolean;
  ttsVoice?: string;
  ttsRate?: number;
  useMockAI?: boolean;
  aiModel?: string;
  fontSize?: number;
  messageHistory?: number;
  memoryTags?: string[];
  memoryCount?: number;
  latency?: number;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  onSendMessage, onAIResponse, onSpeakingChange, onMemoryChange, onOpenMemory,
  ttsEnabled = false, ttsVoice = 'zh-CN', ttsRate = 1.0,
  useMockAI = false, aiModel, fontSize = 14, messageHistory = 10,
  memoryTags = [], memoryCount = 0,
  latency = 0,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('aipet-chat-history');
      if (saved && saved !== '[]') {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) }));
        }
      }
    } catch (e) {
      console.warn('聊天记录加载失败:', e);
    }
    return [{
      id: '1',
      text: '系统已就绪，神经网络连接成功。你好！我是AIPET，你的AI助手，有什么可以帮你的吗？',
      sender: 'ai',
      timestamp: new Date()
    }];
  });

  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  useEffect(() => {
    try {
      localStorage.setItem('aipet-chat-history', JSON.stringify(messagesRef.current));
    } catch (e) {
      console.warn('聊天记录保存失败:', e);
    }
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
      const historyMessages = messages
        .filter(m => m.text.length > 0)
        .slice(-messageHistory);
      const history: ChatMessage[] = historyMessages.map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

      // 注入记忆到 AI 上下文
      const relevantFacts = getRelevantFacts(inputValue);
      const memoryContext = formatFactsForContext(relevantFacts);
      if (memoryContext) {
        history.unshift({ role: 'assistant', content: memoryContext });
      }

      const aiResponse = await getAIResponse(inputValue, history, useMockAI, aiModel);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse.text,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);

      if (aiResponse.emotion) {
        onAIResponse?.(aiResponse.emotion);
      }

      // 从用户消息中提取记忆
      const newFacts = extractFacts(inputValue, aiResponse.text);
      let memoryUpdated = false;
      for (const fact of newFacts) {
        addFact(fact);
        memoryUpdated = true;
      }
      if (memoryUpdated && onMemoryChange) {
        onMemoryChange(loadFacts().length);
      }

      if (ttsEnabled && isSupported()) {
        onSpeakingChange?.(true);
        speak(aiResponse.text, { voice: ttsVoice, rate: ttsRate })
          .catch(() => {})
          .finally(() => onSpeakingChange?.(false));
      }
    } catch (error) {
      console.error('AI response error:', error);
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

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>

      {/* Chat Header */}
      <div style={s.chatHeader}>
        <span style={s.chatTitle}>⟡ 神经通道</span>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          <button className="chat-btn" style={s.memBtn} onClick={onOpenMemory} title="记忆库">
            🧠
            {memoryCount > 0 && <span style={s.memBadge}>{memoryCount > 99 ? '99+' : memoryCount}</span>}
          </button>
          <button className="chat-btn" style={s.chatIconBtn} title="Clear chat" onClick={() => {
            if (confirm('清除所有聊天记录？')) {
              setMessages([]);
              localStorage.removeItem('aipet-chat-history');
            }
          }}>✕</button>
          <button className="chat-btn" style={s.chatIconBtn} title="Voice input">🎤</button>
          <button className="chat-btn" style={s.chatIconBtn} title="Menu">⋯</button>
        </div>
      </div>

      {/* Messages */}
      <div style={s.messagesContainer}>
        {messages.map((msg) => (
          <div key={msg.id} style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
            animation: 'msg-in 0.25s ease',
          }}>
            {/* 发送者标签 */}
            <div style={{
              fontFamily: "'Share Tech Mono', monospace",
              fontSize: 9, letterSpacing: 1,
              color: msg.sender === 'user' ? 'rgba(0,204,255,0.2)' : 'rgba(255,255,255,0.12)',
              marginBottom: 3, paddingLeft: 2,
            }}>
              {msg.sender === 'ai' ? 'AIPET' : '你'} · {formatTime(msg.timestamp)}
            </div>
            <div style={{
              ...s.msgBubble,
              ...(msg.sender === 'user' ? s.msgBubbleUser : s.msgBubbleAI),
              fontSize: fontSize + 'px',
            }}>
              {msg.text}
            </div>
          </div>
        ))}

        {isTyping && (
          <div style={s.messageRow}>
            <div style={s.typingBox}>
              <span style={s.typingDot} />
              <span style={{ ...s.typingDot, animationDelay: '0.15s' }} />
              <span style={{ ...s.typingDot, animationDelay: '0.3s' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Memory Tags */}
      {memoryTags.length > 0 && (
        <div style={s.memoryBar}>
          <span style={s.memoryLabel}>记忆</span>
          <div style={s.memoryItems}>
            {memoryTags.map((tag, i) => (
              <span key={i} style={s.memoryTag}>{tag}</span>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div style={s.inputArea}>
        <div style={s.inputWrap}>
          <button style={s.inputBtn} title="Emoji">😊</button>
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="输入消息..."
            style={s.chatInput}
          />
          <button style={s.inputBtn} title="Voice input">🎤</button>
        </div>
        <button className="send-btn" onClick={handleSend} style={s.sendBtn}>发送</button>
      </div>
    </div>
  );
};

// ===== STYLES =====
const s: Record<string, React.CSSProperties> = {
  chatHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
  },
  chatTitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 11, letterSpacing: 2,
    color: 'rgba(255,255,255,0.25)',
  },
  chatIconBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.1)', fontSize: 11,
    width: 26, height: 26, borderRadius: 4,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', transition: 'all 0.2s',
  },
  memBtn: {
    background: 'rgba(0,255,255,0.02)',
    border: '1px solid rgba(0,255,255,0.06)',
    color: 'rgba(0,255,255,0.2)',
    padding: '2px 6px', fontSize: 12,
    borderRadius: 4, cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: 4,
    position: 'relative' as const,
    transition: 'all 0.2s',
  },
  memBadge: {
    background: 'rgba(0,255,255,0.1)',
    color: 'rgba(0,255,255,0.5)',
    fontSize: 8, padding: '0 4px',
    borderRadius: 6, lineHeight: '14px',
    fontFamily: "'Share Tech Mono', monospace",
    fontWeight: 700,
  },
  messagesContainer: {
    flex: 1, overflowY: 'auto',
    padding: '12px 16px',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  messageRow: {
    display: 'flex', animation: 'msg-in 0.25s ease',
  },
  msgBubble: {
    maxWidth: '80%',
    padding: '10px 14px',
    borderRadius: 12,
    lineHeight: 1.6,
    fontWeight: 300,
    position: 'relative',
  },
  msgBubbleAI: {
    background: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 4,
    color: '#d0d0e8',
  },
  msgBubbleUser: {
    background: 'rgba(0, 204, 255, 0.08)',
    borderBottomRightRadius: 4,
    color: '#c0c0f0',
  },
  msgTime: {
    fontSize: 9, color: 'rgba(255,255,255,0.1)',
    marginTop: 3, fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 0.5,
  },
  typingBox: {
    display: 'flex', gap: 4,
    padding: '8px 14px',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: 10,
  },
  typingDot: {
    width: 5, height: 5,
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '50%',
    animation: 'dot-bounce 1.2s infinite',
  },
  memoryBar: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 16px',
    borderTop: '1px solid rgba(255,255,255,0.04)',
    background: 'rgba(255,255,255,0.01)',
  },
  memoryLabel: {
    fontSize: 10, fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 1, color: 'rgba(255,255,255,0.12)',
    whiteSpace: 'nowrap', textTransform: 'uppercase',
  },
  memoryItems: {
    display: 'flex', gap: 4, overflow: 'hidden', flex: 1,
  },
  memoryTag: {
    fontSize: 10, padding: '2px 8px',
    borderRadius: 8,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    color: 'rgba(255,255,255,0.15)',
    whiteSpace: 'nowrap', fontWeight: 300,
  },
  inputArea: {
    display: 'flex', gap: 8,
    padding: '10px 16px',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    background: 'rgba(255,255,255,0.02)',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1, display: 'flex', alignItems: 'center', gap: 2,
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '0 6px',
    transition: 'border-color 0.2s, background 0.2s',
  },
  chatInput: {
    flex: 1,
    background: 'transparent', border: 'none',
    padding: '9px 4px',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 13, color: '#e0e0ee',
    outline: 'none', fontWeight: 300,
  },
  inputBtn: {
    background: 'transparent', border: 'none',
    color: 'rgba(255,255,255,0.08)',
    width: 26, height: 26, borderRadius: 4,
    cursor: 'pointer', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s',
  },
  sendBtn: {
    background: 'rgba(0,204,255,0.05)',
    border: '1px solid rgba(0,204,255,0.08)',
    color: 'rgba(0,204,255,0.4)',
    padding: '7px 14px',
    borderRadius: 6,
    fontSize: 12, fontWeight: 400,
    cursor: 'pointer',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    letterSpacing: 0.5,
    transition: 'all 0.2s',
  },
};

export default ChatWindow;
