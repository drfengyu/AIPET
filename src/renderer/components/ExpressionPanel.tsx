/**
 * 表情动作面板
 * - 手动触发 Live2D 表情切换
 * - 手动触发 Live2D 动作动画
 */
import React from 'react';

interface ExpressionPanelProps {
  onTrigger: (data: { expression?: string; motion?: string }) => void;
  onClose: () => void;
}

const EXPRESSIONS = [
  { id: 'F01', emoji: '😐', label: '平静' },
  { id: 'F02', emoji: '😊', label: '开心' },
  { id: 'F03', emoji: '😢', label: '难过' },
  { id: 'F04', emoji: '😠', label: '生气' },
  { id: 'F05', emoji: '😮', label: '惊讶' },
  { id: 'F06', emoji: '🥰', label: '害羞' },
];

const MOTIONS = [
  { id: 'Idle', icon: '🔄', label: '空闲' },
  { id: 'TapHead', icon: '👋', label: '摸头' },
  { id: 'TapBody', icon: '✋', label: '拍肩' },
  { id: 'Special', icon: '✨', label: '特殊' },
];

const ExpressionPanel: React.FC<ExpressionPanelProps> = ({ onTrigger, onClose }) => {
  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <span style={s.title}>🎭 表情动作</span>
          <button className="chat-btn" onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Expressions */}
        <div style={s.section}>
          <div style={s.sectionLabel}>表情</div>
          <div style={s.grid}>
            {EXPRESSIONS.map(exp => (
              <button
                key={exp.id}
                className="chat-btn"
                style={s.expBtn}
                onClick={() => { onTrigger({ expression: exp.id }); onClose(); }}
                title={exp.label}
              >
                <span style={s.expEmoji}>{exp.emoji}</span>
                <span style={s.expLabel}>{exp.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Motions */}
        <div style={s.section}>
          <div style={s.sectionLabel}>动作</div>
          <div style={s.grid}>
            {MOTIONS.map(motion => (
              <button
                key={motion.id}
                className="chat-btn"
                style={s.motionBtn}
                onClick={() => { onTrigger({ motion: motion.id }); onClose(); }}
                title={motion.label}
              >
                <span style={s.motionIcon}>{motion.icon}</span>
                <span style={s.expLabel}>{motion.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 900,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
  },
  panel: {
    width: 280,
    background: '#1a1a2e',
    border: '1px solid rgba(0,255,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    boxShadow: '0 0 30px rgba(0,255,255,0.05)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 12, letterSpacing: 1.5,
    color: 'rgba(0,255,255,0.5)',
  },
  closeBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.2)',
    width: 24, height: 24, borderRadius: 4,
    fontSize: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  section: {
    padding: '10px 14px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sectionLabel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: 1,
    color: 'rgba(255,255,255,0.12)',
    marginBottom: 8,
  },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
  },
  expBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '8px 4px',
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    transition: 'all 0.15s',
  },
  expEmoji: {
    fontSize: 20, lineHeight: 1.2,
  },
  expLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.2)',
    letterSpacing: 0.5,
  },
  motionBtn: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '8px 4px',
    background: 'rgba(0,255,255,0.02)',
    border: '1px solid rgba(0,255,255,0.06)',
    borderRadius: 6,
    cursor: 'pointer',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    transition: 'all 0.15s',
  },
  motionIcon: {
    fontSize: 18, lineHeight: 1.2,
  },
};

export default ExpressionPanel;
