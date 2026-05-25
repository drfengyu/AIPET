/**
 * AIPET 主题配色
 * 暗色主题，保证清晰可读
 */
export const theme = {
  /** 主背景色 */
  bg: '#1e1e34',
  /** 面板/卡片背景 */
  panel: 'rgba(255,255,255,0.05)',
  /** 面板边框 */
  border: 'rgba(0,200,255,0.12)',
  /** 强调色（青色） */
  accent: 'rgba(0,200,255,0.5)',
  /** 强调色边框 */
  accentBorder: 'rgba(0,200,255,0.2)',

  /** 主文字 */
  text: 'rgba(230,230,250,0.7)',
  /** 次要文字 */
  textDim: 'rgba(230,230,250,0.35)',
  /** 微弱文字 */
  textMuted: 'rgba(230,230,250,0.12)',

  /** 按钮默认 */
  btnBg: 'rgba(0,200,255,0.05)',
  btnBorder: 'rgba(0,200,255,0.15)',
  btnText: 'rgba(0,200,255,0.4)',

  /** 按钮悬停 */
  btnBgHover: 'rgba(0,200,255,0.08)',
  btnBorderHover: 'rgba(0,200,255,0.25)',
  btnTextHover: 'rgba(0,200,255,0.55)',

  /** 输入框 */
  inputBg: 'rgba(255,255,255,0.06)',
  inputBorder: 'rgba(255,255,255,0.1)',
  inputText: '#d0d0e8',

  /** 状态条 */
  statusBar: 'rgba(255,255,255,0.02)',

  /** 渐变光晕 */
  glow: 'radial-gradient(ellipse at 50% 60%, rgba(0,200,255,0.06) 0%, rgba(200,0,255,0.03) 50%, transparent 70%)',

  /** 字体 */
  font: "'Share Tech Mono', 'Microsoft YaHei', 'Noto Sans SC', system-ui, sans-serif",
  fontMono: "'Share Tech Mono', monospace",
} as const;
