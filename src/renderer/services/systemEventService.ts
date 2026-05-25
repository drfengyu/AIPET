/**
 * 系统事件响应服务
 * - 检测系统状态变化（时间/日期/应用状态）
 * - 返回对应的事件响应（表情/动作/消息）
 * - 内置去重机制
 */

// ===== 类型定义 =====

export interface SystemEvent {
  type: string;
  expression?: string;    // Live2D 表情 ID (F01-F06)
  motion?: string;        // Live2D 动作组 (Idle/TapHead/TapBody/Special)
  message?: string;       // 可选主动消息
  priority: number;       // 优先级 1-10 (高优先覆盖低)
  cooldownMinutes: number;// 冷却时间(分钟)
  label: string;          // 中文描述
}

export interface SystemEventResult {
  event: SystemEvent;
  triggeredAt: number;
  /** 是否是首次触发 */
  isFirst: boolean;
}

// ===== 事件检测 =====

/** 可用的动作组映射 */
export const MOTION_GROUPS = ['Idle', 'TapBody', 'TapHead', 'Special'] as const;

/** 表情 → 中文标签 */
export const EXPRESSION_LABELS: Record<string, string> = {
  'F01': '平静', 'F02': '开心', 'F03': '难过',
  'F04': '生气', 'F05': '惊讶', 'F06': '害羞',
};

// ===== 事件定义 =====

const TIME_EVENTS: SystemEvent[] = [
  // 深夜 (0:00-5:00) — 犯困
  {
    type: 'deep-night',
    expression: 'F03',
    motion: 'TapBody',
    message: '夜深了…还不睡吗？我会担心的。',
    priority: 7,
    cooldownMinutes: 120,
    label: '深夜犯困',
  },
  // 清晨 (6:00-8:00) — 精神
  {
    type: 'morning-peak',
    expression: 'F02',
    motion: 'Idle',
    message: '早上好！今天也要元气满满哦～',
    priority: 6,
    cooldownMinutes: 120,
    label: '清晨问候',
  },
  // 上午 (8:00-11:30) — 活跃
  {
    type: 'morning-active',
    expression: 'F01',
    motion: 'Idle',
    message: undefined,
    priority: 3,
    cooldownMinutes: 180,
    label: '上午活跃',
  },
  // 午餐 (11:30-13:00) — 提醒吃饭
  {
    type: 'meal-noon',
    expression: 'F05',
    motion: 'TapHead',
    message: '中午了，记得好好吃饭哦！',
    priority: 5,
    cooldownMinutes: 120,
    label: '午餐提醒',
  },
  // 下午 (13:00-17:00) — 困倦
  {
    type: 'afternoon-sleepy',
    expression: 'F01',
    motion: 'TapBody',
    message: undefined,
    priority: 2,
    cooldownMinutes: 180,
    label: '午后时光',
  },
  // 晚餐 (17:00-19:00) — 提醒吃饭
  {
    type: 'meal-night',
    expression: 'F02',
    motion: 'TapHead',
    message: '晚饭时间到了，别饿着自己～',
    priority: 5,
    cooldownMinutes: 120,
    label: '晚餐提醒',
  },
  // 晚间 (19:00-22:00) — 放松
  {
    type: 'evening-relax',
    expression: 'F01',
    motion: 'Idle',
    message: '晚上好～今天过得怎么样？',
    priority: 4,
    cooldownMinutes: 120,
    label: '晚间问候',
  },
  // 深夜前 (22:00-23:59) — 提醒休息
  {
    type: 'late-night',
    expression: 'F03',
    motion: 'TapBody',
    message: '不早了，该准备休息了哦。',
    priority: 6,
    cooldownMinutes: 120,
    label: '提醒休息',
  },
];

// ===== 去重存储 =====

const STORAGE_KEY = 'aipet-system-events';

interface CooldownEntry {
  type: string;
  lastTriggered: number;
}

function loadCooldowns(): CooldownEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCooldowns(entries: CooldownEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch { /* ignore */ }
}

function isOnCooldown(type: string, cooldownMinutes: number): boolean {
  const entries = loadCooldowns();
  const entry = entries.find(e => e.type === type);
  if (!entry) return false;
  const elapsed = (Date.now() - entry.lastTriggered) / (1000 * 60);
  return elapsed < cooldownMinutes;
}

function markTriggered(type: string): void {
  const entries = loadCooldowns();
  const idx = entries.findIndex(e => e.type === type);
  const entry: CooldownEntry = { type, lastTriggered: Date.now() };
  if (idx >= 0) {
    entries[idx] = entry;
  } else {
    entries.push(entry);
  }
  saveCooldowns(entries);
}

// ===== 时间检测 =====

function getCurrentHour(): number {
  return new Date().getHours();
}

function getTimeCategory(): string {
  const h = getCurrentHour();
  if (h >= 0 && h < 5) return 'deep-night';
  if (h >= 5 && h < 6) return 'early-morning';
  if (h >= 6 && h < 8) return 'morning-peak';
  if (h >= 8 && h < 11) return 'morning-active';
  if (h >= 11 && h < 13) return 'meal-noon';
  if (h >= 13 && h < 17) return 'afternoon-sleepy';
  if (h >= 17 && h < 19) return 'meal-night';
  if (h >= 19 && h < 22) return 'evening-relax';
  return 'late-night';
}

// ===== 事件检测主函数 =====

/**
 * 检测当前应触发的事件
 * 返回最高优先级且不在冷却中的事件
 */
export function detectSystemEvent(): SystemEventResult | null {
  const timeCat = getTimeCategory();

  // 找匹配的事件定义
  const matched = TIME_EVENTS.find(e => e.type === timeCat);
  if (!matched) return null;

  // 检查冷却
  if (isOnCooldown(matched.type, matched.cooldownMinutes)) {
    return null;
  }

  // 标记已触发
  markTriggered(matched.type);
  return {
    event: matched,
    triggeredAt: Date.now(),
    isFirst: true,
  };
}

/**
 * 强制触发指定事件（用于手动测试或外部调用）
 */
export function forceEvent(type: string): SystemEventResult | null {
  const event = TIME_EVENTS.find(e => e.type === type);
  if (!event) return null;
  markTriggered(type);
  return {
    event,
    triggeredAt: Date.now(),
    isFirst: true,
  };
}

/**
 * 获取下一个事件倒计时（秒）
 */
export function getNextEventSeconds(): number {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // 按时间顺序找下一个切换时间
  const boundaries = [
    { hour: 6, type: 'morning-peak' },
    { hour: 8, type: 'morning-active' },
    { hour: 11, type: 'meal-noon' },
    { hour: 13, type: 'afternoon-sleepy' },
    { hour: 17, type: 'meal-night' },
    { hour: 19, type: 'evening-relax' },
    { hour: 22, type: 'late-night' },
  ];

  for (const b of boundaries) {
    if (currentHour < b.hour || (currentHour === b.hour && currentMinute < 0)) {
      const next = new Date();
      next.setHours(b.hour, 0, 0, 0);
      return Math.floor((next.getTime() - now.getTime()) / 1000);
    }
  }

  // 明天 0 点
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return Math.floor((tomorrow.getTime() - now.getTime()) / 1000);
}

/**
 * 获取当前时间段显示文案
 */
export function getCurrentTimeLabel(): string {
  const cat = getTimeCategory();
  const labels: Record<string, string> = {
    'deep-night': '🌙 深夜',
    'early-morning': '🌅 凌晨',
    'morning-peak': '☀️ 早晨',
    'morning-active': '🌤️ 上午',
    'meal-noon': '🍚 午餐时间',
    'afternoon-sleepy': '🌥️ 下午',
    'meal-night': '🍜 晚餐时间',
    'evening-relax': '🌆 傍晚',
    'late-night': '🌃 深夜',
  };
  return labels[cat] || '🕐';
}

/**
 * 清空所有事件冷却（测试用）
 */
export function clearEventCooldowns(): void {
  localStorage.removeItem(STORAGE_KEY);
}
