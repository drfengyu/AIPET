import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ConfigProvider, theme, Button } from 'antd';
import Live2DViewer from './components/Live2DViewer';
import VrmViewer from './components/VrmViewer';
import ChatWindow, { type Message } from './components/ChatWindow';
import SettingsPanel from './components/SettingsPanel';
import MemoryPanel from './components/MemoryPanel';
import AudioVisualizer from './components/AudioVisualizer';
import { getExpressionForEmotion } from './services/aiService';
import { loadFacts, getMemoryStats } from './services/memoryService';
import { loadConfig, saveConfig, IdleTimer, getProactiveMessage, type ProactiveConfig } from './services/proactiveService';
import DiaryPanel from './components/DiaryPanel';
import { recordEmotion, getTodayRecordCount, getTodayAvgMood } from './services/diaryService';
import { detectSystemEvent, getCurrentTimeLabel } from './services/systemEventService';
import ExpressionPanel from './components/ExpressionPanel';
import MarketPanel from './components/MarketPanel';
import { getSubscribedModels, type MarketModel } from './services/marketService';

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
  const [memoryTags, setMemoryTags] = useState<string[]>(() => {
    const facts = loadFacts();
    return facts.slice(0, 5).map(f => f.fact);
  });
  const [memoryCount, setMemoryCount] = useState(() => getMemoryStats().total);
  const [showMemory, setShowMemory] = useState(false);
  const [showDiary, setShowDiary] = useState(false);
  const [showExpression, setShowExpression] = useState(false);
  const [showMarket, setShowMarket] = useState(false);
  const [marketModels, setMarketModels] = useState<MarketModel[]>([]);
  const [modelType, setModelType] = useState<'live2d' | 'vrm'>('live2d');
  const [diaryRecordCount, setDiaryRecordCount] = useState(() => getTodayRecordCount());
  const [latency] = useState(42);

  // 表情/动作触发
  const handleExpressionTrigger = useCallback((data: { expression?: string; motion?: string }) => {
    const id = ++eventIdRef.current;
    setSystemTrigger({ ...data, id });
  }, []);

  // 市场模型选择
  const handleMarketSelect = useCallback((modelUrl: string, _modelName: string) => {
    setSelectedModel(modelUrl);
    // 根据 URL 后缀检测模型类型
    const isVrm = modelUrl.toLowerCase().endsWith('.vrm') || modelUrl.toLowerCase().includes('.vrm?');
    setModelType(isVrm ? 'vrm' : 'live2d');
    setShowMarket(false);
  }, []);

  // 加载已订阅市场模型
  useEffect(() => {
    getSubscribedModels().then(setMarketModels);
  }, [showMarket]);

  // 主动对话
  const [proactiveConfig, setProactiveConfig] = useState<ProactiveConfig>(loadConfig);
  const [_lastActivity, setLastActivity] = useState(Date.now());
  const [proactiveMessages, setProactiveMessages] = useState<Message[]>([]);
  const idleTimerRef = useRef<IdleTimer | null>(null);

  // 初始化闲置计时器
  useEffect(() => {
    const timer = new IdleTimer(() => {
      // 触发主动消息
      const msg = getProactiveMessage();
      setProactiveMessages(prev => [...prev, {
        id: 'proactive-' + Date.now(),
        text: msg,
        sender: 'ai' as const,
        timestamp: new Date(),
        isProactive: true,
      }]);
      // 聊天气泡
      showSpeechBubble(msg);
      // 更新 HUD
      setMood(m => Math.min(100, m + 2));
    }, proactiveConfig.intervalMinutes);
    idleTimerRef.current = timer;
    if (proactiveConfig.enabled) timer.start();
    return () => timer.stop();
  }, [proactiveConfig.intervalMinutes]);

  // 用户活动时重置计时器
  const handleActivity = useCallback(() => {
    setLastActivity(Date.now());
    if (proactiveConfig.enabled && idleTimerRef.current) {
      idleTimerRef.current.reset();
    }
  }, [proactiveConfig.enabled]);

  const [mood, setMood] = useState(78);
  const [energy, setEnergy] = useState(65);
  const [memory, setMemory] = useState(45);
  const [currentEmotion, setCurrentEmotion] = useState('HAPPY');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [petMode, setPetMode] = useState(false);
  // 聊天气泡
  const [speechText, setSpeechText] = useState('');
  const [speechVisible, setSpeechVisible] = useState(false);
  const speechTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showSpeechBubble = useCallback((text: string) => {
    if (speechTimerRef.current) clearTimeout(speechTimerRef.current);
    setSpeechText(text);
    setSpeechVisible(true);
    speechTimerRef.current = setTimeout(() => setSpeechVisible(false), 6000);
    // 桌宠模式也显示气泡
    if (petMode && (window as any).electronAPI?.petSpeech) {
      (window as any).electronAPI.petSpeech(text);
    }
  }, [petMode]);

  // 系统事件
  const [systemTrigger, setSystemTrigger] = useState<{ motion?: string; expression?: string; id: number } | undefined>(undefined);
  const eventIdRef = useRef(0);
  const systemEventCheckedRef = useRef(false);

  // 应用启动问候
  useEffect(() => {
    if (systemEventCheckedRef.current) return;
    systemEventCheckedRef.current = true;
    // 延迟一点等 Live2D 加载完再触发
    const timer = setTimeout(() => {
      const id = ++eventIdRef.current;
      setSystemTrigger({ motion: 'Idle', expression: 'F02', id });
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // 定期检测系统事件 (每 30 秒)
  useEffect(() => {
    const check = () => {
      const result = detectSystemEvent();
      if (!result) return;
      const { event } = result;
      // 触发 Live2D 动作/表情
      const id = ++eventIdRef.current;
      setSystemTrigger({ motion: event.motion, expression: event.expression, id });
      // 如果有消息，添加到主动对话
      if (event.message) {
        setProactiveMessages(prev => [...prev, {
          id: 'sys-' + id,
          text: `⚡ ${event.message}`,
          sender: 'ai' as const,
          timestamp: new Date(),
          isProactive: true,
        }]);
        // 聊天气泡
        showSpeechBubble(event.message);
      }
    };
    // 首次启动时也检查一次
    const initTimer = setTimeout(check, 5000);
    const interval = setInterval(check, 30000);
    return () => { clearTimeout(initTimer); clearInterval(interval); };
  }, []);

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
    // 重置闲置计时器
    handleActivity();
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
    // 记录情绪到日记
    recordEmotion(emotion);
    setDiaryRecordCount(getTodayRecordCount());
  }, []);

  const handleSettingsChange = (newSettings: Settings) => {
    setSettings(newSettings);
  };

  const handleMemoryChange = (count: number) => {
    setMemoryCount(count);
    const facts = loadFacts();
    setMemoryTags(facts.slice(0, 5).map(f => f.fact));
    // 更新 HUD 记忆值
    setMemory(Math.min(100, Math.round((count / 50) * 100)));
  };

  const checkUpdate = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      // console.error('检查更新失败:', error);
      alert('检查更新失败: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#00ccff',
          colorBgContainer: '#1e1e34',
          colorBgElevated: '#252540',
          colorBorder: 'rgba(0,200,255,0.15)',
          colorText: 'rgba(230,230,250,0.7)',
          colorTextSecondary: 'rgba(230,230,250,0.35)',
          borderRadius: 6,
          fontFamily: "'Share Tech Mono', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif",
        },
      }}
    >
    <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100vh', background: '#1e1e34' }}>

      {/* ===== TOP BAR ===== */}
      <header style={s.topBar}>
        <div style={s.topBarLeft}>
          <span style={s.logo}>AIPET</span>
          <span style={s.logoVersion}>v0.4.0</span>
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
          <Button type="text" icon={<span>📌</span>} onClick={() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).electronAPI?.setAlwaysOnTop) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (window as any).electronAPI.setAlwaysOnTop(!settings?.alwaysOnTop);
            }
          }}>
            固定
          </Button>
          <Button type="text" icon={<span>🐾</span>} onClick={async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const api = (window as any).electronAPI;
            if (!petMode && api?.openPetMode) {
              await api.openPetMode(selectedModel);
              setPetMode(true);
            } else if (petMode && api?.closePetMode) {
              await api.closePetMode();
              setPetMode(false);
            }
          }}
            style={petMode ? { borderColor: 'rgba(0,200,255,0.4)', color: '#00ccff' } : {}}
          >
            桌宠
          </Button>
          <Button type="text" icon={<span>⟳</span>} onClick={checkUpdate}>更新</Button>
          <Button type="text" icon={<span>🎭</span>} onClick={() => setShowExpression(true)}
            style={{ color: 'rgba(255,200,0,0.6)' }}
          >
            表情
          </Button>
          <Button type="text" icon={<span>📓</span>} onClick={() => setShowDiary(true)}
            style={{ position: 'relative' } as React.CSSProperties}
          >
            日记
            {diaryRecordCount > 0 && (
              <span style={{
                position: 'absolute', top: -2, right: -2,
                background: 'rgba(0,200,255,0.15)',
                color: 'rgba(0,200,255,0.6)',
                fontSize: 9, padding: '0 5px',
                borderRadius: 8, lineHeight: '16px',
                fontFamily: "'Share Tech Mono', monospace",
              }}>{diaryRecordCount}</span>
            )}
          </Button>
          <Button type="text" icon={<span>📦</span>} onClick={() => setShowMarket(true)}
            style={{ color: 'rgba(100,200,255,0.5)' }}
          >
            市场
          </Button>
          <Button type="text" icon={<span>⚙</span>} onClick={() => setShowSettings(true)}
            style={{ color: 'rgba(200,0,255,0.5)' }}
          >
            设置
          </Button>
        </div>
      </header>

      {/* ===== MAIN SPLIT ===== */}
      <div style={{ flex: 1, display: 'flex', padding: '0 24px 12px', gap: 24, overflow: 'hidden' }}>

        {/* LEFT: Character Panel */}
        <div style={s.charPanel}>
          <div style={s.charViewport}>
            {modelType === 'vrm' ? (
              <VrmViewer
                modelUrl={selectedModel}
                mood={mood}
                energy={energy}
                memory={memory}
                emotion={currentEmotion}
                autoRotate={true}
              />
            ) : (
              <Live2DViewer
                modelUrl={selectedModel}
                scale={settings?.modelScale || 1.0}
                onMotion={handleMotion}
                expression={settings?.expressionEnabled ? currentExpression : undefined}
                systemTrigger={systemTrigger}
                speechText={speechText}
                speechVisible={speechVisible}
                mood={mood}
                energy={energy}
                memory={memory}
                emotion={currentEmotion}
              />
            )}
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
              ...marketModels.filter(m => m.localUrl).map(m => ({ id: m.localUrl!, name: m.name })),
              { id: './models/Haru/Haru.model3.json', name: 'Haru' },
              { id: './models/Hiyori/Hiyori.model3.json', name: 'Hiyori' },
              { id: './models/Mao/Mao.model3.json', name: 'Mao' },
              { id: './models/Mark/Mark.model3.json', name: 'Mark' },
              { id: './models/Natori/Natori.model3.json', name: 'Natori' },
            ].filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i).map(m => (
              <button
                key={m.id}
                className="model-pill"
                style={{
                  ...s.modelPill,
                  ...(selectedModel === m.id ? s.modelPillActive : {}),
                }}
                onClick={() => {
                  setSelectedModel(m.id);
                  setModelType('live2d');
                }}
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
            onMemoryChange={handleMemoryChange}
            onOpenMemory={() => setShowMemory(true)}
            proactiveMessages={proactiveMessages}
            onResetProactive={() => setProactiveMessages([])}
            onSpeech={showSpeechBubble}
            ttsEnabled={settings?.ttsEnabled || false}
            ttsVoice={settings?.ttsVoice || 'zh-CN'}
            ttsRate={settings?.ttsRate || 1.0}
            useMockAI={settings?.useMockAI ?? false}
            aiModel={settings?.aiModel}
            fontSize={settings?.fontSize || 13}
            messageHistory={settings?.messageHistory || 10}
            memoryTags={memoryTags}
            memoryCount={memoryCount}
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
              <span style={s.statusText}>日记 {diaryRecordCount}</span>
              <span style={s.statusText}>v0.4.0</span>
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

      {/* Memory Panel */}
      {showMemory && (
        <MemoryPanel onClose={() => {
          setShowMemory(false);
          // 关闭后刷新记忆显示
          handleMemoryChange(loadFacts().length);
        }} />
      )}

      {/* Diary Panel */}
      {showDiary && (
        <DiaryPanel onClose={() => {
          setShowDiary(false);
          setDiaryRecordCount(getTodayRecordCount());
        }} />
      )}

      {/* Expression Panel */}
      {showExpression && (
        <ExpressionPanel
          onTrigger={handleExpressionTrigger}
          onClose={() => setShowExpression(false)}
        />
      )}

      {/* Market Panel */}
      {showMarket && (
        <MarketPanel
          onClose={() => setShowMarket(false)}
          onSelectModel={handleMarketSelect}
        />
      )}
    </div>
    </ConfigProvider>
  );
}

// ===== STYLES =====
const s: Record<string, React.CSSProperties> = {
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 28px',
    borderBottom: '1px solid rgba(0,200,255,0.08)',
    background: 'rgba(30,30,52,0.9)',
    backdropFilter: 'blur(12px)',
    position: 'relative', zIndex: 100,
  },
  topBarLeft: { display: 'flex', alignItems: 'center', gap: 8 },
  logo: {
    fontFamily: "'Orbitron', monospace", fontSize: 16, fontWeight: 900,
    letterSpacing: 4,
    background: 'linear-gradient(90deg, #00ccff, #cc00ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoVersion: {
    fontFamily: "'Share Tech Mono', monospace", fontSize: 9,
    letterSpacing: 1, color: 'rgba(0,200,255,0.3)',
  },
  statusItem: {
    display: 'flex', alignItems: 'center', gap: 5,
    fontFamily: "'Share Tech Mono', monospace", fontSize: 11,
    letterSpacing: 1.5, color: 'rgba(230,230,250,0.35)',
  },
  statusDot: { width: 5, height: 5, borderRadius: '50%', display: 'inline-block' },
  topBarRight: { display: 'flex', gap: 6 },

  // Character Panel
  charPanel: {
    flex: '1.1', position: 'relative', display: 'flex',
    flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    minWidth: 0,
  },
  charViewport: {
    width: '92%', height: '72%', position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '1px solid rgba(0,200,255,0.06)',
    borderRadius: 6, overflow: 'hidden',
  },
  modelStrip: {
    position: 'absolute', bottom: '4%', left: '50%',
    transform: 'translateX(-50%)',
    display: 'flex', gap: 6, zIndex: 5,
  },
  modelPill: {
    padding: '4px 12px',
    border: '1px solid rgba(0,200,255,0.08)',
    background: 'rgba(0,200,255,0.03)',
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10, letterSpacing: 1, color: 'rgba(0,200,255,0.25)',
    cursor: 'pointer', transition: 'all 0.2s ease', borderRadius: 4,
  },
  modelPillActive: {
    borderColor: 'rgba(0,200,255,0.25)',
    color: '#00ccff',
    background: 'rgba(0,200,255,0.05)',
    boxShadow: '0 0 6px rgba(0,200,255,0.06)',
  },
  // Chat Panel
  chatPanel: {
    flex: 1, display: 'flex', flexDirection: 'column',
    borderRadius: 8, overflow: 'hidden',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    minWidth: 0,
  },

  // Status Bar
  statusBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '6px 16px',
    borderTop: '1px solid rgba(0,200,255,0.05)',
    background: 'rgba(255,255,255,0.02)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  statusText: {
    color: 'rgba(230,230,250,0.18)', fontSize: 10, letterSpacing: 1,
  },
};

export default App;
