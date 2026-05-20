import React, { useState } from 'react';

interface SettingsPanelProps {
  onClose: () => void;
}

interface Settings {
  theme: string;
  soundEnabled: boolean;
  autoReply: boolean;
  fontSize: number;
  language: string;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose }) => {
  const [settings, setSettings] = useState<Settings>({
    theme: 'cyberpunk',
    soundEnabled: true,
    autoReply: true,
    fontSize: 14,
    language: 'zh-CN',
  });

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const styles: { [key: string]: React.CSSProperties } = {
    panel: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '320px',
      height: '100vh',
      background: 'linear-gradient(180deg, rgba(10, 10, 20, 0.98) 0%, rgba(20, 10, 30, 0.98) 100%)',
      borderLeft: '1px solid rgba(0, 255, 255, 0.3)',
      padding: '24px',
      zIndex: 100,
      overflowY: 'auto',
      boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px',
      paddingBottom: '16px',
      borderBottom: '1px solid rgba(0, 255, 255, 0.3)',
    },
    title: {
      fontSize: '14px',
      letterSpacing: '3px',
      color: '#00ffff',
      textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
    },
    closeButton: {
      background: 'transparent',
      border: '1px solid rgba(255, 0, 255, 0.5)',
      color: '#ff00ff',
      padding: '4px 12px',
      cursor: 'pointer',
      fontSize: '11px',
      letterSpacing: '2px',
      transition: 'all 0.2s ease',
    },
    section: {
      marginBottom: '24px',
    },
    sectionTitle: {
      fontSize: '11px',
      letterSpacing: '2px',
      color: '#888',
      marginBottom: '12px',
      textTransform: 'uppercase',
    },
    settingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    },
    settingLabel: {
      fontSize: '12px',
      color: '#ccc',
      letterSpacing: '1px',
    },
    toggle: {
      position: 'relative',
      width: '44px',
      height: '22px',
      background: 'rgba(50, 50, 70, 0.8)',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      borderRadius: '11px',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
    },
    toggleActive: {
      background: 'linear-gradient(90deg, rgba(0, 255, 255, 0.4), rgba(255, 0, 255, 0.4))',
      borderColor: '#00ffff',
      boxShadow: '0 0 10px rgba(0, 255, 255, 0.4)',
    },
    toggleKnob: {
      position: 'absolute',
      top: '2px',
      left: '2px',
      width: '16px',
      height: '16px',
      background: '#00ffff',
      borderRadius: '50%',
      transition: 'all 0.3s ease',
      boxShadow: '0 0 8px rgba(0, 255, 255, 0.6)',
    },
    toggleKnobActive: {
      left: '24px',
      background: '#ff00ff',
      boxShadow: '0 0 8px rgba(255, 0, 255, 0.6)',
    },
    select: {
      padding: '8px 12px',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(0, 255, 255, 0.4)',
      color: '#00ffff',
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      cursor: 'pointer',
      outline: 'none',
    },
    slider: {
      width: '100%',
      height: '4px',
      background: 'rgba(50, 50, 70, 0.8)',
      border: '1px solid rgba(0, 255, 255, 0.3)',
      borderRadius: '2px',
      outline: 'none',
      cursor: 'pointer',
    },
    versionInfo: {
      marginTop: '32px',
      paddingTop: '16px',
      borderTop: '1px solid rgba(0, 255, 255, 0.2)',
      textAlign: 'center',
      fontSize: '10px',
      color: '#666',
      letterSpacing: '2px',
    },
  };

  return (
    <div style={styles.panel}>
      <div style={styles.header}>
        <h3 style={styles.title}>SETTINGS</h3>
        <button style={styles.closeButton} onClick={onClose}>
          CLOSE
        </button>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Appearance</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Theme</span>
          <select
            style={styles.select}
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
          >
            <option value="cyberpunk">Cyberpunk</option>
            <option value="minimal">Minimal</option>
            <option value="dark">Dark</option>
          </select>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Font Size</span>
          <span style={{ ...styles.settingLabel, color: '#00ffff' }}>
            {settings.fontSize}px
          </span>
        </div>
        <input
          type="range"
          min="12"
          max="18"
          value={settings.fontSize}
          onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
          style={styles.slider}
        />
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Audio</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Sound Effects</span>
          <div
            style={{ ...styles.toggle, ...(settings.soundEnabled ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.soundEnabled ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>

      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Chat</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Auto Reply</span>
          <div
            style={{ ...styles.toggle, ...(settings.autoReply ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('autoReply', !settings.autoReply)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.autoReply ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>Language</span>
          <select
            style={styles.select}
            value={settings.language}
            onChange={(e) => updateSetting('language', e.target.value)}
          >
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>
      </div>

      <div style={styles.versionInfo}>
        AIPET v1.0.0 // LIVE2D CHAT INTERFACE
      </div>
    </div>
  );
};

export default SettingsPanel;
