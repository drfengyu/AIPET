/**
 * 情绪日记服务
 * - 记录每次对话的情绪变化
 * - 按日期生成日记条目
 * - localStorage 持久化
 * - 情绪趋势分析
 */

// ===== 数据类型 =====

export interface EmotionRecord {
  id: string;
  timestamp: number;
  emotion: string;     // 'happy' | 'sad' | 'angry' | 'surprised' | 'blush' | 'neutral'
  intensity: number;   // 0-100
  context: string;     // 触发该情绪的消息摘要
}

export interface DiaryEntry {
  date: string;         // 'YYYY-MM-DD'
  summary: string;
  avgMood: number;      // 0-100 日均情绪
  records: EmotionRecord[];
  keyTopics: string[];
  wordCount: number;    // 当日对话总字数
  createdAt: number;
  updatedAt: number;
}

export interface MoodTrend {
  date: string;
  avgMood: number;
  dominantEmotion: string;
  recordCount: number;
}

// ===== 常量 =====

const STORAGE_KEY_DIARY = 'aipet-diary-entries';
const STORAGE_KEY_RECORDS = 'aipet-emotion-records';

// 情绪 → 数值映射 (用于计算趋势)
const EMOTION_VALUES: Record<string, number> = {
  'blush': 90,
  'happy': 80,
  'surprised': 60,
  'neutral': 50,
  'sad': 30,
  'angry': 20,
};

const EMOTION_EMOJIS: Record<string, string> = {
  'blush': '🥰',
  'happy': '😊',
  'surprised': '😮',
  'neutral': '😐',
  'sad': '😢',
  'angry': '😠',
};

const EMOTION_LABELS: Record<string, string> = {
  'blush': '害羞',
  'happy': '开心',
  'surprised': '惊讶',
  'neutral': '平静',
  'sad': '难过',
  'angry': '生气',
};

// ===== 工具函数 =====

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function now(): number {
  return Date.now();
}

// ===== 持久化 =====

function loadRecords(): EmotionRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_RECORDS);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('情绪记录加载失败:', e);
  }
  return [];
}

function saveRecords(records: EmotionRecord[]): void {
  try {
    // 只保留最近 7 天的记录 (避免无限增长)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const pruned = records.filter(r => r.timestamp > weekAgo);
    localStorage.setItem(STORAGE_KEY_RECORDS, JSON.stringify(pruned));
  } catch (e) {
    console.warn('情绪记录保存失败:', e);
  }
}

function loadDiaryEntries(): DiaryEntry[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY_DIARY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('日记加载失败:', e);
  }
  return [];
}

function saveDiaryEntries(entries: DiaryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_DIARY, JSON.stringify(entries));
  } catch (e) {
    console.warn('日记保存失败:', e);
  }
}

// ===== 情绪记录 =====

let _pendingRecords: EmotionRecord[] = [];

/**
 * 记录一次情绪
 */
export function recordEmotion(
  emotion: string,
  context: string = '',
  intensity?: number
): EmotionRecord {
  const record: EmotionRecord = {
    id: now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: now(),
    emotion: emotion || 'neutral',
    intensity: intensity ?? (EMOTION_VALUES[emotion] || 50),
    context: context.slice(0, 60),
  };

  // 先暂存，在生成日记时批量写入
  _pendingRecords.push(record);

  // 也写入持久存储
  const allRecords = loadRecords();
  allRecords.push(record);
  saveRecords(allRecords);

  return record;
}

/**
 * 获取今日情绪记录
 */
export function getTodayRecords(): EmotionRecord[] {
  const today = getTodayStr();
  return loadRecords().filter(r => {
    const d = new Date(r.timestamp);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    return dateStr === today;
  });
}

/**
 * 获取今日情绪记录数
 */
export function getTodayRecordCount(): number {
  return getTodayRecords().length;
}

/**
 * 获取今日平均情绪值
 */
export function getTodayAvgMood(): number {
  const records = getTodayRecords();
  if (records.length === 0) return 50;
  const sum = records.reduce((acc, r) => acc + r.intensity, 0);
  return Math.round(sum / records.length);
}

/**
 * 获取今日主导情绪
 */
export function getTodayDominantEmotion(): string {
  const records = getTodayRecords();
  if (records.length === 0) return 'neutral';
  const counts: Record<string, number> = {};
  for (const r of records) {
    counts[r.emotion] = (counts[r.emotion] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

// ===== 日记生成 =====

/**
 * 生成或更新今日日记
 */
export function generateDailySummary(customSummary?: string): DiaryEntry {
  const today = getTodayStr();
  const records = getTodayRecords();
  const pending = [..._pendingRecords];
  _pendingRecords = []; // 清空暂存

  // 合并所有记录
  const allRecords = [...records];
  for (const r of pending) {
    if (!allRecords.find(ex => ex.id === r.id)) {
      allRecords.push(r);
    }
  }

  const avgMood = allRecords.length > 0
    ? Math.round(allRecords.reduce((acc, r) => acc + r.intensity, 0) / allRecords.length)
    : 50;

  // 提取关键词（简单的词频统计）
  const topicWords = allRecords
    .map(r => r.context)
    .join(' ')
    .split(/[\s，。！？,.!?\s]+/)
    .filter(w => w.length > 1);
  const wordFreq: Record<string, number> = {};
  for (const w of topicWords) wordFreq[w] = (wordFreq[w] || 0) + 1;
  const keyTopics = Object.entries(wordFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([word]) => word);

  // 今日对话总字数估算
  const wordCount = allRecords.reduce((acc, r) => acc + r.context.length, 0);

  // 生成摘要文本
  const dominantEmo = getTodayDominantEmotion();
  const emoji = EMOTION_EMOJIS[dominantEmo] || '😐';
  const label = EMOTION_LABELS[dominantEmo] || '平静';

  const summary = customSummary || `今天和你聊了 ${allRecords.length} 次，整体情绪 ${label}${emoji}。${getSummarySuffix(avgMood)}`;

  const entries = loadDiaryEntries();
  const existingIdx = entries.findIndex(e => e.date === today);

  const entry: DiaryEntry = {
    date: today,
    summary,
    avgMood,
    records: allRecords,
    keyTopics,
    wordCount,
    createdAt: existingIdx >= 0 ? entries[existingIdx].createdAt : now(),
    updatedAt: now(),
  };

  if (existingIdx >= 0) {
    entries[existingIdx] = entry;
  } else {
    entries.push(entry);
  }

  saveDiaryEntries(entries);
  return entry;
}

function getSummarySuffix(avgMood: number): string {
  if (avgMood >= 80) return '和你聊天总是很开心！';
  if (avgMood >= 65) return '聊得不错，继续保持～';
  if (avgMood >= 45) return '平平淡淡也很好。';
  if (avgMood >= 30) return '今天你似乎有些心事…';
  return '希望明天心情能好起来。';
}

// ===== 查询 =====

/**
 * 获取指定日期的日记
 */
export function getDiaryByDate(date: string): DiaryEntry | null {
  const entries = loadDiaryEntries();
  return entries.find(e => e.date === date) || null;
}

/**
 * 获取今日日记
 */
export function getTodayDiary(): DiaryEntry | null {
  return getDiaryByDate(getTodayStr());
}

/**
 * 获取所有有日记的日期（倒序）
 */
export function getAllDates(): string[] {
  return loadDiaryEntries()
    .map(e => e.date)
    .sort((a, b) => b.localeCompare(a));
}

/**
 * 获取最近 N 天的情绪趋势
 */
export function getMoodTrend(days: number = 7): MoodTrend[] {
  const entries = loadDiaryEntries();
  const result: MoodTrend[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const entry = entries.find(e => e.date === dateStr);

    if (entry) {
      const counts: Record<string, number> = {};
      for (const r of entry.records) {
        counts[r.emotion] = (counts[r.emotion] || 0) + 1;
      }
      const dominant = Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
      result.push({
        date: dateStr,
        avgMood: entry.avgMood,
        dominantEmotion: dominant,
        recordCount: entry.records.length,
      });
    } else {
      result.push({
        date: dateStr,
        avgMood: -1, // 无数据
        dominantEmotion: 'none',
        recordCount: 0,
      });
    }
  }

  return result;
}

/**
 * 获取日记统计
 */
export function getDiaryStats(): { totalDays: number; totalRecords: number; avgMood: number } {
  const entries = loadDiaryEntries();
  if (entries.length === 0) return { totalDays: 0, totalRecords: 0, avgMood: 0 };

  const totalRecords = entries.reduce((acc, e) => acc + e.records.length, 0);
  const avgMood = Math.round(entries.reduce((acc, e) => acc + e.avgMood, 0) / entries.length);

  return {
    totalDays: entries.length,
    totalRecords,
    avgMood,
  };
}

// ===== 格式化 =====

export function getEmotionEmoji(emotion: string): string {
  return EMOTION_EMOJIS[emotion] || '😐';
}

export function getEmotionLabel(emotion: string): string {
  return EMOTION_LABELS[emotion] || '平静';
}

export function getEmotionValue(emotion: string): number {
  return EMOTION_VALUES[emotion] || 50;
}

/**
 * 格式化情绪值到颜色
 */
export function getMoodColor(value: number): string {
  if (value >= 80) return 'rgba(0,255,128,0.6)';   // 绿色
  if (value >= 65) return 'rgba(0,255,200,0.5)';   // 青色
  if (value >= 45) return 'rgba(0,200,255,0.4)';   // 蓝色
  if (value >= 30) return 'rgba(255,200,0,0.5)';   // 黄色
  return 'rgba(255,50,50,0.5)';                     // 红色
}
