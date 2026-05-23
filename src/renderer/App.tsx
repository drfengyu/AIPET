import React, { useState, useEffect, useCallback } from 'react';
import Live2DViewer from './components/Live2DViewer';
import ChatWindow from './components/ChatWindow';
import SettingsPanel from './components/SettingsPanel';
import AudioVisualizer from './components/AudioVisualizer';
import { getExpressionForEmotion } from './services/aiService';

interface Settings {
  aiModel: string;
  aiTemperature: number;
  useMockAI: boolean;
  modelScale: number;
  autoScale: boolean;
  expressionEnabled: boolean;
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsRate: number;
  fontSize: number;
  messageHistory: number;
  autoReply: boolean;
  theme: string;
  soundEnabled: boolean;
  alwaysOnTop: boolean;
  debugMode: boolean;
}

function App() {
  const [selectedModel, setSelectedModel] = useState('./models/Haru/Haru.model3.json');
  const [showSettings, setShowSettings] = useState(false);
  const [currentExpression, setCurrentExpression] = useState('F01');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [sessionStart] = useState(Date.now());
  const [msgCount, setMsgCount] = useState(0);
  const [memoryTags] = useState(['喜欢科幻电影', '赛博朋克爱好者', '中文母语者']);
  const [latency] = useState(42);

  // HUD state — updated by AI interactions
  const [mood, setMood] = useState(78);
  const [energy, setEnergy] = useState(65);
  const [memory, setMemory] = useState(45);
  const [currentEmotion, setCurrentEmotion] = useState('HAPPY');
  const [isSpeaking, setIsSpeaking] = useState(false);

  // 从 localStorage 加载设置
  useEffect(() => {
    const saved = localStorage.getItem('aipet-settings');
    if (saved) {
      try { setSettings(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // 会话时长格式化
  const sessionTime = () => {
    const elapsed = Math.floor((Date.now() - sessionStart) / 1000);
    const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
    const s = String(elapsed % 60).padStart(2, '0');
    return `${m}:${s}`;
  };
  const [sessionDisplay, setSessionDisplay] = useState('00:00');
  useEffect(() => {
    const timer = setInterval(() => setSessionDisplay(sessionTime()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSendMessage = (_message: string) => {
    // 用户发送消息时能量略微下降
    setEnergy(e => Math.max(20, e - 2));
  };

  const handleMotion = useCallback((_motion: string) => {}, []);

  const handleAIResponse = useCallback((emotion: string) => {
    const expression = getExpressionForEmotion(emotion);
    setCurrentExpression(expression);
    setCurrentEmotion(emotion.toUpperCase());
    setMsgCount(c => c + 1);
    // 交互后情绪和能量改善
    setMood(m => Math.min(100, m + 3));
    setEnergy(e => Math.min(100, e + 1));
    setMemory(m => Math.min(100, m + 1));
  }, []);

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const checkUpdate = async () => {
    const api = (window as any).electronAPI;
    if (!api?.checkForUpdates) {
      alert('更新检查仅在安装版可用。');
      return;
    }
    try {
      const result = await api.checkForUpdates();
      if (result?.updateAvailable) {
        alert('发现新版本，正在下载...');
        const download = await api.downloadUpdate();
        if (download?.success) {
          if (confirm('更新已下载，是否立即安装？')) {
            api.installUpdate();
          }
        }
      } else {
        alert('当前已是最新版本');
      }
    } catch (error) {
      console.error('检查更新失败:', error);
      alert('检查更新失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', background: '#1a1a2e' }}>

      {/* ===== TOP BAR ===== */}
      <header style={s.topBar}>
        <div style={s.topBarLeft}>
          <span style={s.logo}>AIPET</span>
          <span style={s.logoVersion}>v0.2.0</span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginLeft: 20 }}>
            <span style={s.statusItem}>
              <span style={{ ...s.statusDot, background: '#00ff88', boxShadow: '0 0 6px #00ff88' }} />
              在线
            </span>
            <span style={s.statusItem}>⚡ {latency}ms</span>
            <span style={s.statusItem}>记忆 {memory}%</span>
          </div>
        </div>
        <div style={s.topBarRight}>
          <button className="top-btn" onClick={() => {
            if ((window as any).electronAPI?.setAlwaysOnTop) {
              (window as any).electronAPI.setAlwaysOnTop(!settings?.alwaysOnTop);
            }
          }}>
            📌 固定
          </button>
          <button className="top-btn" onClick={checkUpdate}>⟳ 更新</button>
          <button className="top-btn" style={{ borderColor: 'rgba(255,0,255,0.3)', color: 'rgba(255,0,255,0.6)' }} onClick={() => setShowSettings(true)}>
            ⚙ 设置
          </button>
        </div>
      </header>

      {/* ===== MAIN SPLIT ===== */}
      <div style={{ flex: 1, display: 'flex', padding: '0 24px 12px', gap: 24, overflow: 'hidden' }}>

        {/* LEFT: Character Panel */}
        <div style={s.charPanel}>
          <div style={s.charViewport}>
            <Live2DViewer
              modelUrl={selectedModel}
              scale={settings?.modelScale || 1.0}
              onMotion={handleMotion}
              expression={settings?.expressionEnabled ? currentExpression : undefined}
              mood={mood}
              energy={energy}
              memory={memory}
              emotion={currentEmotion}
            />
            {/* Floating particles */}
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
              {[...Array(8)].map((_, i) => (
                <span key={i} style={{
                  position: 'absolute', width: 2, height: 2,
                  background: 'rgba(0,255,255,0.25)', borderRadius: '50%',
                  left: (10 + i * 12) + '%',
                  animation: `float-particle ${8 + i * 2}s linear infinite`,
                  animationDelay: `${i * 0.8}s`,
                }} />
              ))}
            </div>
          {/* 全息环 */}
            <div style={{
              position: 'absolute', width: '78%', height: '78%',
              border: '1px solid rgba(0,255,255,0.05)',
              borderRadius: '50%', top: '11%', left: '11%',
              animation: 'rotate-ring 35s linear infinite',
              pointerEvents: 'none', zIndex: 1,
              boxShadow: '0 0 20px rgba(0,255,255,0.03), inset 0 0 20px rgba(0,255,255,0.02)',
            }} />
            <div style={{
              position: 'absolute', width: '62%', height: '62%',
              border: '1px solid rgba(255,0,255,0.04)',
              borderRadius: '50%', top: '19%', left: '19%',
              animation: 'rotate-ring 25s linear infinite reverse',
              pointerEvents: 'none', zIndex: 1,
              boxShadow: '0 0 16px rgba(255,0,255,0.02), inset 0 0 16px rgba(255,0,255,0.02)',
            }} />
          </div>

          {/* Model Selector */}
          <div style={s.modelStrip}>
            {[
              { id: './models/Haru/Haru.model3.json', name: 'Haru' },
              { id: './models/Hiyori/Hiyori.model3.json', name: 'Hiyori' },
              { id: './models/Mao/Mao.model3.json', name: 'Mao' },
              { id: './models/Mark/Mark.model3.json', name: 'Mark' },
              { id: './models/Natori/Natori.model3.json', name: 'Natori' },
            ].map(m => (
              <button
                key={m.id}
                className="model-pill"
                style={{
                  ...s.modelPill,
                  ...(selectedModel === m.id ? s.modelPillActive : {}),
                }}
                onClick={() => setSelectedModel(m.id)}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT: Chat Panel */}
        <div style={s.chatPanel}>
          <ChatWindow
            onSendMessage={handleSendMessage}
            onAIResponse={handleAIResponse}
            onSpeakingChange={setIsSpeaking}
            ttsEnabled={settings?.ttsEnabled || false}
            ttsVoice={settings?.ttsVoice || 'zh-CN'}
            ttsRate={settings?.ttsRate || 1.0}
            useMockAI={settings?.useMockAI ?? false}
            aiModel={settings?.aiModel}
            fontSize={settings?.fontSize || 13}
            messageHistory={settings?.messageHistory || 10}
            memoryTags={memoryTags}
            latency={latency}
          />
          {/* Bottom Status Bar (inside chat panel) */}
          <div style={s.statusBar}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
              <span style={{ color: 'rgba(0,255,255,0.5)', fontSize: 9, letterSpacing: 1.5 }}>
                ⟐ 运行中
              </span>
              <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 9, letterSpacing: 1 }}>
                ⚡ {latency}ms
              </span>
              {/* Audio visualizer */}
              <AudioVisualizer isSpeaking={isSpeaking} />
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={s.statusText}>会话 {sessionDisplay}</span>
              <span style={s.statusText}>消息 {msgCount}</span>
              <span style={s.statusText}>v0.2.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Overlay */}
      {showSettings && (
        <SettingsPanel
          onClose={() => setShowSettings(false)}
          onSettingsChange={handleSettingsChange}
        />
      )}
    </div>
  );
}

// ===== STYLES =====
const s: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 28px',
    borderBottom: '1px solid rgba(0,255,255,0.08)',
    background: 'rgba(26,26,46,0.9)',
    backdropFilter: 'blur(12px)',
    position: 'relative', zIndex: 100,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  logo: {
    fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 900,
    letterSpacing: 4,
    background: 'linear-gradient(90deg, #00ffff, #ff00ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoVersion: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
    letterSpacing: 1, color: 'rgba(0,255,255,0.3)',
  },
  statusItem: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
    letterSpacing: 1.5, color: 'rgba(255,255,255,0.3)',
  },
  statusDot: { width: 5, height: 5, borderRadius: '50%', display: 'inline-block' },
  topBarRight: { display: 'flex', gap: 6 },
  topBtn: {
    background: 'rgba(0,255,255,0.03)',
    border: '1px solid rgba(0,255,255,0.1)',
    color: 'rgba(0,255,255,0.35)',
    padding: '6px 12px', fontFamily: "'Share Tech Mono', monospace",
    fontSize: 11, letterSpacing: 1.5, cursor: 'pointer',
    transition: 'all 0.2s',
    borderRadius: 4,
  },

  // Character Panel
  charPanel: {
    flex: '1.1', position: 'relative', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, overflow: 'hidden',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    minWidth: 0,
  },
  charViewport: {
    width: '92%', height: '72%', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(0,255,255,0.05)',
    borderRadius: 6, overflow: 'hidden',
  },
  modelStrip: {
    position: 'absolute', bottom: '4%', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: 6, zIndex: 5,
  },
  modelPill: {
    padding: '4px 12px',
    border: '1px solid rgba(0,255,255,0.06)',
    background: 'rgba(0,255,255,0.02)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10, letterSpacing: 1, color: 'rgba(0,255,255,0.2)',
    cursor: 'pointer', transition: 'all 0.2s ease', borderRadius: 4,
  },
  modelPillActive: {
    borderColor: 'rgba(0,255,255,0.3)',
    color: '#00ffff',
    background: 'rgba(0,255,255,0.04)',
    boxShadow: '0 0 6px rgba(0,255,255,0.06)',
  },
  // Chat Panel
  chatPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    borderRadius: 8, overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.07)',
    minWidth: 0,
  },

  // Status Bar
  statusBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 16px',
    borderTop: '1px solid rgba(0,255,255,0.04)',
    background: 'rgba(255,255,255,0.01)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  statusText: {
    color: 'rgba(255,255,255,0.15)', fontSize: 10, letterSpacing: 1,
  },
};

export default App;
