import React, { useState } from 'react';
import Live2DViewer from './components/Live2DViewer';
import ChatWindow from './components/ChatWindow';
import SettingsPanel from './components/SettingsPanel';

function App() {
  const [selectedModel, setSelectedModel] = useState('/models/live2d-model.json');
  const [chatHistory, setChatHistory] = useState<string[]>([]);
  const [showSettings, setShowSettings] = useState(false);

  const handleSendMessage = (message: string) => {
    console.log('发送消息:', message);
    setChatHistory(prev => [...prev, message]);
  };

  const handleMotion = (motion: string) => {
    console.log('Live2D动作:', motion);
  };

  return (
    <div style={styles.app}>
      {/* Grid overlay for cyberpunk aesthetic */}
      <div style={styles.gridOverlay} />

      {/* Scanline effect */}
      <div style={styles.scanlines} />

      <header style={styles.appHeader}>
        <div style={styles.headerGlow} />
        <h1 style={styles.title}>
          <span style={styles.titleAccent}>LIVE</span>2D
          <span style={styles.titleSuffix}>_AI</span>
        </h1>
        <p style={styles.subtitle}>NEURAL CHAT INTERFACE v2.0</p>
        <button
          style={styles.settingsButton}
          onClick={() => setShowSettings(true)}
        >
          ⚙ SETTINGS
        </button>
      </header>

      <main style={styles.appMain}>
        <div style={styles.live2dSection}>
          <div style={styles.viewerFrame}>
            <Live2DViewer
              modelUrl={selectedModel}
              scale={0.25}
              onMotion={handleMotion}
            />
          </div>
          <div style={styles.modelSelector}>
            <button
              style={selectedModel === '/models/live2d-model.json' ? styles.modelBtnActive : styles.modelBtn}
              onClick={() => setSelectedModel('/models/live2d-model.json')}
            >
              <span style={styles.btnIndicator} />
              Haru
            </button>
            <button
              style={selectedModel === '/models/live2d-model2.json' ? styles.modelBtnActive : styles.modelBtn}
              onClick={() => setSelectedModel('/models/live2d-model2.json')}
            >
              <span style={styles.btnIndicator} />
              Hiyori
            </button>
            <button
              style={selectedModel === '/models/live2d-model3.json' ? styles.modelBtnActive : styles.modelBtn}
              onClick={() => setSelectedModel('/models/live2d-model3.json')}
            >
              <span style={styles.btnIndicator} />
              Mao
            </button>
            <button
              style={selectedModel === '/models/live2d-model4.json' ? styles.modelBtnActive : styles.modelBtn}
              onClick={() => setSelectedModel('/models/live2d-model4.json')}
            >
              <span style={styles.btnIndicator} />
              Mark
            </button>
          </div>
        </div>

        <div style={styles.chatSection}>
          <ChatWindow onSendMessage={handleSendMessage} />
        </div>
      </main>

      <footer style={styles.appFooter}>
        <div style={styles.footerLine} />
        <p style={styles.footerText}>
          <span style={styles.footerAccent}>AIPET</span> SYSTEM // LIVE2D CHAT INTERFACE // BUILD 2026.05
        </p>
      </footer>

      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  );
}

const styles: { [key: string]: React.CSSProperties } = {
  app: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0f0f1a 100%)',
    fontFamily: '"Share Tech Mono", "Courier New", monospace',
    overflow: 'hidden',
  },
  gridOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: `
      repeating-linear-gradient(
        0deg,
        transparent,
        transparent 2px,
        rgba(0, 255, 255, 0.03) 2px,
        rgba(0, 255, 255, 0.03) 4px
      ),
      repeating-linear-gradient(
        90deg,
        transparent,
        transparent 2px,
        rgba(255, 0, 255, 0.03) 2px,
        rgba(255, 0, 255, 0.03) 4px
      )
    `,
    pointerEvents: 'none',
    zIndex: 1,
  },
  scanlines: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
    backgroundSize: '100% 4px',
    pointerEvents: 'none',
    zIndex: 2,
    animation: 'scanline 8s linear infinite',
  },
  appHeader: {
    position: 'relative',
    textAlign: 'center',
    padding: '24px 20px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.1) 50%, transparent 100%)',
    borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
    zIndex: 10,
  },
  headerGlow: {
    position: 'absolute',
    top: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '300px',
    height: '100%',
    background: 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.15) 0%, transparent 70%)',
    pointerEvents: 'none',
  },
  title: {
    margin: '0 0 8px 0',
    fontSize: '32px',
    letterSpacing: '8px',
    color: '#e0e0e0',
    textShadow: '0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(255, 0, 255, 0.3)',
  },
  titleAccent: {
    color: '#00ffff',
    textShadow: '0 0 10px #00ffff, 0 0 20px #00ffff',
  },
  titleSuffix: {
    color: '#ff00ff',
    fontSize: '20px',
    letterSpacing: '4px',
  },
  subtitle: {
    margin: 0,
    fontSize: '11px',
    letterSpacing: '4px',
    color: '#888',
    textTransform: 'uppercase',
  },
  appMain: {
    flex: 1,
    display: 'flex',
    padding: '24px',
    gap: '24px',
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    position: 'relative',
    zIndex: 10,
  },
  live2dSection: {
    flex: '1 1 420px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    minWidth: '300px',
    maxWidth: '500px',
  },
  viewerFrame: {
    position: 'relative',
    width: '100%',
    height: '500px',
    padding: '4px',
    background: 'linear-gradient(135deg, #00ffff 0%, #ff00ff 100%)',
    borderRadius: '4px',
    boxShadow: '0 0 30px rgba(0, 255, 255, 0.3), 0 0 60px rgba(255, 0, 255, 0.2)',
  },
  modelSelector: {
    display: 'flex',
    gap: '16px',
  },
  modelBtn: {
    padding: '12px 24px',
    background: 'rgba(20, 20, 35, 0.9)',
    border: '1px solid rgba(0, 255, 255, 0.4)',
    color: '#00ffff',
    fontSize: '12px',
    letterSpacing: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    fontFamily: '"Share Tech Mono", monospace',
  },
  modelBtnActive: {
    padding: '12px 24px',
    background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.2), rgba(255, 0, 255, 0.2))',
    border: '1px solid #00ffff',
    color: '#ffffff',
    fontSize: '12px',
    letterSpacing: '2px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all 0.3s ease',
    fontFamily: '"Share Tech Mono", monospace',
    boxShadow: '0 0 15px rgba(0, 255, 255, 0.4)',
  },
  btnIndicator: {
    width: '8px',
    height: '8px',
    background: '#00ffff',
    borderRadius: '50%',
    boxShadow: '0 0 8px #00ffff',
  },
  chatSection: {
    flex: 1,
    height: '500px',
  },
  appFooter: {
    position: 'relative',
    textAlign: 'center',
    padding: '16px 20px',
    background: 'linear-gradient(90deg, transparent 0%, rgba(255, 0, 255, 0.1) 50%, transparent 100%)',
    borderTop: '1px solid rgba(255, 0, 255, 0.3)',
    zIndex: 10,
  },
  footerLine: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: '1px',
    background: 'linear-gradient(90deg, transparent, #ff00ff, transparent)',
  },
  footerText: {
    margin: 0,
    fontSize: '10px',
    letterSpacing: '3px',
    color: '#666',
  },
  footerAccent: {
    color: '#ff00ff',
    textShadow: '0 0 10px rgba(255, 0, 255, 0.5)',
  },
  settingsButton: {
    position: 'absolute',
    right: '20px',
    top: '50%',
    transform: 'translateY(-50%)',
    padding: '8px 16px',
    background: 'transparent',
    border: '1px solid rgba(0, 255, 255, 0.4)',
    color: '#00ffff',
    fontSize: '11px',
    letterSpacing: '2px',
    cursor: 'pointer',
    fontFamily: '"Share Tech Mono", monospace',
    transition: 'all 0.2s ease',
  },
};

export default App;
