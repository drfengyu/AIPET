/**
 * AI 主动对话服务
 * - 闲置计时器
 * - 时间段感知（早/中/晚/深夜）
 * - 问候语生成
 */

export interface ProactiveConfig {
  enabled: boolean;
  intervalMinutes: number;  // 闲置多少分钟触发
  timeOfDayEnabled: boolean;
}

const STORAGE_KEY = 'aipet-proactive-config';

const DEFAULT_CONFIG: ProactiveConfig = {
  enabled: true,
  intervalMinutes: 5,
  timeOfDayEnabled: true,
};

// ===== 配置管理 =====

export function loadConfig(): ProactiveConfig {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch { /* ignore parse errors */ }
  return { ...DEFAULT_CONFIG };
}

export function saveConfig(config: ProactiveConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch { /* ignore parse errors */ }
}

// ===== 时间段检测 =====

export type TimeOfDay = 'morning' | 'noon' | 'afternoon' | 'evening' | 'night';

export function getTimeOfDay(): TimeOfDay {
  const h = new Date().getHours();
  if (h >= 5 && h < 9) return 'morning';
  if (h >= 9 && h < 13) return 'noon';
  if (h >= 13 && h < 18) return 'afternoon';
  if (h >= 18 && h < 22) return 'evening';
  return 'night';
}

export function getTimeOfDayLabel(tod: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: '早上',
    noon: '上午',
    afternoon: '下午',
    evening: '晚上',
    night: '深夜',
  };
  return labels[tod];
}

// ===== 问候语生成 =====

const GREETINGS: Record<TimeOfDay, string[]> = {
  morning: [
    '早上好！今天又是美好的一天呢～',
    '早安！昨晚休息得怎么样？',
    '清晨的阳光真不错，你也是！',
    '早～今天有什么计划吗？',
  ],
  noon: [
    '上午好！忙不忙呀～',
    '嘿，上午过得怎么样？',
    '中午了，记得吃午饭哦！',
    '工作再忙也要休息一下～',
  ],
  afternoon: [
    '下午好～要不要和我聊聊天？',
    '午后有点犯困呢，你也是吗？',
    '下午的时光总是过得好快。',
    '来，放松一下，说说话吧～',
  ],
  evening: [
    '晚上好！今天过得开心吗？',
    '夜幕降临了，有没有想聊的话题？',
    '晚饭吃了吗？我在这里陪着你呢。',
    '一天又快要结束了，有什么想分享的吗？',
  ],
  night: [
    '夜深了，还不睡吗？',
    '这么晚还在呢，有什么心事吗？',
    '深夜适合聊聊轻松的话题～',
    '熬夜对身体不好哦，我会担心的。',
  ],
};

const FOLLOW_UPS = [
  '好久没说话了，有点想你～',
  '一直在等你来找我呢。',
  '一个人静静地待了一会儿。',
  '嘿，我还在呢！有什么新鲜事吗？',
  '注意到你已经沉默了一段时间…',
];

export function getProactiveMessage(timeOfDay?: TimeOfDay): string {
  const tod = timeOfDay || getTimeOfDay();

  // 判断是否首次问候（用首次数量权重）
  const pool = GREETINGS[tod];
  const allMessages = [...pool, ...FOLLOW_UPS];
  return allMessages[Math.floor(Math.random() * allMessages.length)];
}

/**
 * 生成带时间前缀的主动消息
 */
export function formatProactiveMessage(baseMessage?: string): string {
  const msg = baseMessage || getProactiveMessage();
  const tod = getTimeOfDay();
  const label = getTimeOfDayLabel(tod);
  return `[${label}] ${msg}`;
}

// ===== 闲置计时器 =====

export class IdleTimer {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private callback: () => void;
  private interval: number;
  private running = false;

  constructor(callback: () => void, intervalMinutes: number) {
    this.callback = callback;
    this.interval = intervalMinutes * 60 * 1000;
  }

  /** 重置计时器（用户活动时调用） */
  reset(): void {
    if (!this.running) return;
    this.clear();
    this.timeoutId = setTimeout(() => {
      this.callback();
      // 触发后重新开始计时
      this.reset();
    }, this.interval);
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.timeoutId = setTimeout(() => {
      this.callback();
      this.reset();
    }, this.interval);
  }

  stop(): void {
    this.running = false;
    this.clear();
  }

  setInterval(minutes: number): void {
    this.interval = minutes * 60 * 1000;
    if (this.running) this.reset();
  }

  private clear(): void {
    if (this.timeoutId !== null) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  isRunning(): boolean { return this.running; }
}
