import React, { useState, useEffect } from 'react';

interface SettingsPanelProps {
  onClose: () => void;
  onSettingsChange?: (settings: Settings) => void;
}

interface Settings {
  // AI 服务设置
  aiModel: string;
  aiTemperature: number;
  useMockAI: boolean;

  // Live2D 设置
  modelScale: number;
  autoScale: boolean;
  expressionEnabled: boolean;

  // 语音合成设置
  ttsEnabled: boolean;
  ttsVoice: string;
  ttsRate: number;

  // 聊天设置
  fontSize: number;
  messageHistory: number;
  autoReply: boolean;

  // 外观设置
  theme: string;
  soundEnabled: boolean;
  alwaysOnTop: boolean;
  transparentMode: boolean;

  // 开发者选项
  debugMode: boolean;
}

const DEFAULT_SETTINGS: Settings = {
  // AI 服务设置
  aiModel: '@cf/meta/llama-3.1-8b-instruct',
  aiTemperature: 0.7,
  useMockAI: false,

  // Live2D 设置
  modelScale: 1.0,
  autoScale: true,
  expressionEnabled: true,

  // 语音合成设置
  ttsEnabled: false,
  ttsVoice: 'zh-CN',
  ttsRate: 1.0,

  // 聊天设置
  fontSize: 14,
  messageHistory: 50,
  autoReply: true,

  // 外观设置
  theme: 'cyberpunk',
  soundEnabled: true,
  alwaysOnTop: false,
  transparentMode: false,

  // 开发者选项
  debugMode: false,
};

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onClose, onSettingsChange }) => {
  const [settings, setSettings] = useState<Settings>(() => {
    // 从 localStorage 加载保存的设置
    const saved = localStorage.getItem('aipet-settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('aipet-settings', JSON.stringify(newSettings));
    onSettingsChange?.(newSettings);
  };

  // 重置为默认设置
  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    localStorage.setItem('aipet-settings', JSON.stringify(DEFAULT_SETTINGS));
    onSettingsChange?.(DEFAULT_SETTINGS);
  };

  // 同步 Electron 窗口置顶状态
  useEffect(() => {
    // 加载时读取当前置顶状态
    if (window.electronAPI?.getAlwaysOnTop) {
      window.electronAPI.getAlwaysOnTop().then((v) => {
        if (v !== settings.alwaysOnTop) {
          updateSetting('alwaysOnTop', v);
        }
      });
    }
    // 监听托盘菜单的置顶变化
    const cleanup = window.electronAPI?.onAlwaysOnTopChanged?.((v) => {
      updateSetting('alwaysOnTop', v);
    });
    return () => cleanup?.();
  }, []);


  const styles: { [key: string]: React.CSSProperties } = {
    panel: {
      position: 'fixed',
      top: 0,
      right: 0,
      width: '360px',
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
    settingValue: {
      fontSize: '11px',
      color: '#00ffff',
      marginLeft: '8px',
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
      minWidth: '120px',
    },
    input: {
      width: '80px',
      padding: '6px 10px',
      background: 'rgba(0, 0, 0, 0.5)',
      border: '1px solid rgba(0, 255, 255, 0.4)',
      color: '#00ffff',
      fontSize: '12px',
      fontFamily: '"Share Tech Mono", monospace',
      textAlign: 'center',
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
    sliderContainer: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    resetButton: {
      width: '100%',
      padding: '10px',
      background: 'rgba(255, 0, 100, 0.2)',
      border: '1px solid rgba(255, 0, 100, 0.5)',
      color: '#ff0066',
      fontSize: '11px',
      letterSpacing: '2px',
      cursor: 'pointer',
      marginTop: '20px',
      transition: 'all 0.2s ease',
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
        <h3 style={styles.title}>设置</h3>
        <button style={styles.closeButton} onClick={onClose}>
          关闭
        </button>
      </div>

      {/* AI 服务设置 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>AI 服务</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>AI 模型</span>
          <select
            style={styles.select}
            value={settings.aiModel}
            onChange={(e) => updateSetting('aiModel', e.target.value)}
          >
            <option value="@cf/meta/llama-3.1-8b-instruct">Llama 3.1 8B (推荐)</option>
            <option value="@cf/meta/llama-3.2-3b-instruct">Llama 3.2 3B</option>
            <option value="@cf/mistral/mistral-7b-instruct-v0.1">Mistral 7B</option>
            <option value="@cf/mistral/mistral-7b-instruct-v0.2-lora">Mistral 7B LoRA</option>
          </select>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>创意度</span>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={settings.aiTemperature}
              onChange={(e) => updateSetting('aiTemperature', parseFloat(e.target.value))}
              style={{ ...styles.slider, width: '100px' }}
            />
            <span style={styles.settingValue}>{settings.aiTemperature.toFixed(1)}</span>
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>模拟模式 (开发)</span>
          <div
            style={{ ...styles.toggle, ...(settings.useMockAI ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('useMockAI', !settings.useMockAI)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.useMockAI ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>

      {/* Live2D 设置 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Live2D 设置</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>模型缩放</span>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.modelScale}
              onChange={(e) => updateSetting('modelScale', parseFloat(e.target.value))}
              style={{ ...styles.slider, width: '100px' }}
            />
            <span style={styles.settingValue}>{settings.modelScale.toFixed(1)}x</span>
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>自动缩放</span>
          <div
            style={{ ...styles.toggle, ...(settings.autoScale ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('autoScale', !settings.autoScale)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.autoScale ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>表情切换</span>
          <div
            style={{ ...styles.toggle, ...(settings.expressionEnabled ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('expressionEnabled', !settings.expressionEnabled)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.expressionEnabled ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>

      {/* 语音合成设置 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>语音合成</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>启用 TTS</span>
          <div
            style={{ ...styles.toggle, ...(settings.ttsEnabled ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('ttsEnabled', !settings.ttsEnabled)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.ttsEnabled ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>语音</span>
          <select
            style={styles.select}
            value={settings.ttsVoice}
            onChange={(e) => updateSetting('ttsVoice', e.target.value)}
          >
            <option value="zh-CN">中文 (普通话)</option>
            <option value="zh-TW">中文 (台湾)</option>
            <option value="en-US">English (US)</option>
            <option value="ja-JP">日本語</option>
          </select>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>语速</span>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.1"
              value={settings.ttsRate}
              onChange={(e) => updateSetting('ttsRate', parseFloat(e.target.value))}
              style={{ ...styles.slider, width: '100px' }}
            />
            <span style={styles.settingValue}>{settings.ttsRate.toFixed(1)}x</span>
          </div>
        </div>
      </div>

      {/* 聊天设置 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>聊天设置</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>字体大小</span>
          <div style={styles.sliderContainer}>
            <input
              type="range"
              min="10"
              max="20"
              value={settings.fontSize}
              onChange={(e) => updateSetting('fontSize', parseInt(e.target.value))}
              style={{ ...styles.slider, width: '100px' }}
            />
            <span style={styles.settingValue}>{settings.fontSize}px</span>
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>消息历史</span>
          <input
            type="number"
            style={styles.input}
            value={settings.messageHistory}
            onChange={(e) => updateSetting('messageHistory', parseInt(e.target.value) || 50)}
            min="10"
            max="500"
          />
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>自动回复</span>
          <div
            style={{ ...styles.toggle, ...(settings.autoReply ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('autoReply', !settings.autoReply)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.autoReply ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>

      {/* 外观设置 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>外观设置</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>主题</span>
          <select
            style={styles.select}
            value={settings.theme}
            onChange={(e) => updateSetting('theme', e.target.value)}
          >
            <option value="cyberpunk">赛博朋克</option>
            <option value="minimal">简约</option>
            <option value="dark">暗黑</option>
          </select>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>音效</span>
          <div
            style={{ ...styles.toggle, ...(settings.soundEnabled ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.soundEnabled ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>窗口置顶</span>
          <div
            style={{ ...styles.toggle, ...(settings.alwaysOnTop ? styles.toggleActive : {}) }}
            onClick={() => {
              const newVal = !settings.alwaysOnTop;
              updateSetting('alwaysOnTop', newVal);
              // 同步到 Electron 窗口
              if (window.electronAPI?.setAlwaysOnTop) {
                window.electronAPI.setAlwaysOnTop(newVal);
              }
            }}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.alwaysOnTop ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>浮动模式</span>
          <div
            style={{ ...styles.toggle, ...(settings.transparentMode ? styles.toggleActive : {}) }}
            onClick={() => {
              const newVal = !settings.transparentMode;
              updateSetting('transparentMode', newVal);
              if (window.electronAPI?.setTransparentMode) {
                window.electronAPI.setTransparentMode(newVal);
              }
            }}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.transparentMode ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>

      {/* 开发者选项 */}
      <div style={styles.section}>
        <h4 style={styles.sectionTitle}>开发者选项</h4>
        <div style={styles.settingRow}>
          <span style={styles.settingLabel}>调试模式</span>
          <div
            style={{ ...styles.toggle, ...(settings.debugMode ? styles.toggleActive : {}) }}
            onClick={() => updateSetting('debugMode', !settings.debugMode)}
          >
            <div style={{ ...styles.toggleKnob, ...(settings.debugMode ? styles.toggleKnobActive : {}) }} />
          </div>
        </div>
      </div>

      {/* 重置按钮 */}
      <button style={styles.resetButton} onClick={resetSettings}>
        重置为默认值
      </button>

      <div style={styles.versionInfo}>
        AIPET v0.2.0 // LIVE2D 聊天界面
      </div>
    </div>
  );
};

export default SettingsPanel;
