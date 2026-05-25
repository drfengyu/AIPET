/**
 * 记忆服务 (Memory 2.0)
 * - 从对话中提取事实 (Facts)
 * - localStorage 持久化
 * - 注入到 AI 对话上下文
 */

export interface MemoryFact {
  id: string;
  category: 'personal' | 'preference' | 'topic' | 'emotion' | 'other';
  fact: string;
  source: string;        // 用户说的原文
  extractedFrom: string; // 从哪条消息提取的 (前几句)
  timestamp: number;
  updatedAt: number;
  confidence: number;    // 0-1
}

const STORAGE_KEY = 'aipet-memory-facts';
const MAX_FACTS = 50;

// ===== 持久化 =====

export function loadFacts(): MemoryFact[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('记忆加载失败:', e);
  }
  return [];
}

export function saveFacts(facts: MemoryFact[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(facts.slice(0, MAX_FACTS)));
  } catch (e) {
    console.warn('记忆保存失败:', e);
  }
}

export function addFact(fact: Omit<MemoryFact, 'id' | 'timestamp' | 'updatedAt'>): MemoryFact {
  const facts = loadFacts();
  // 去重：相同 fact 内容不重复添加
  const existing = facts.find(f => f.fact === fact.fact);
  if (existing) {
    existing.updatedAt = Date.now();
    existing.confidence = Math.min(1, existing.confidence + 0.1);
    saveFacts(facts);
    return existing;
  }
  const newFact: MemoryFact = {
    ...fact,
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    timestamp: Date.now(),
    updatedAt: Date.now(),
  };
  facts.push(newFact);
  saveFacts(facts);
  return newFact;
}

export function deleteFact(id: string): void {
  const facts = loadFacts().filter(f => f.id !== id);
  saveFacts(facts);
}

export function clearAllFacts(): void {
  localStorage.removeItem(STORAGE_KEY);
}

// ===== 事实提取 =====

// 中文和英文的提取模式
const PATTERNS: { regex: RegExp; category: MemoryFact['category']; template: string }[] = [
  // 个人基本信息
  { regex: /我(?:叫|是|的名字叫|的名字是)\s*([^\s，。,\\.]{1,10})/i, category: 'personal', template: '名字是{0}' },
  { regex: /我(?:今年|岁数|已经)\s*(\d{1,3})\s*岁/i, category: 'personal', template: '{0}岁' },
  { regex: /我(?:来自|住在|在)\s*([^\s，。,\\.]{2,10})(?:市|省|区|镇|工作|生活|住)/i, category: 'personal', template: '来自{0}' },

  // 偏好 - 喜欢
  { regex: /我(?:喜欢|爱|最爱|热爱|特别[喜欢爱])\s*([^\s，。,\\.]{2,20})/i, category: 'preference', template: '喜欢{0}' },
  { regex: /我(?:最[喜欢爱]的是|很[喜欢爱])\s*([^\s，。,\\.]{2,20})/i, category: 'preference', template: '喜欢{0}' },
  { regex: /我(?:的爱好[是]?|的兴趣[是]?|平时[喜欢爱])\s*([^\s，。,\\.]{2,20})/i, category: 'preference', template: '爱好{0}' },

  // 偏好 - 不喜欢
  { regex: /我(?:不喜欢|讨厌|受不了|烦)\s*([^\s，。,\\.]{2,20})/i, category: 'preference', template: '不喜欢{0}' },
  { regex: /我(?:最讨厌|最烦|很讨厌)\s*([^\s，。,\\.]{2,20})/i, category: 'preference', template: '讨厌{0}' },

  // 工作/学习
  { regex: /我(?:做|从事|是[一名位]?)\s*([^\s，。,\\.]{2,15})(?:工作|职业|行业|的)/i, category: 'personal', template: '从事{0}工作' },
  { regex: /我(?:在学习|在[读上]|读)\s*([^\s，。,\\.]{2,15})(?:专业|方向)?/i, category: 'personal', template: '学习{0}' },

  // 情绪/状态
  { regex: /我(?:最近|今天|现在)?(?:心情|感觉|状态)(?:很|非常|有点|有点|特别)?\s*([^\s，。,\\.]{2,6})/i, category: 'emotion', template: '情绪{0}' },

  // 英文模式
  { regex: /i(?:'m| am)\s*([a-z\s]{2,20})/i, category: 'personal', template: 'user is {0}' },
  { regex: /i (?:like|love|enjoy)\s*([a-z\s]{2,20})/i, category: 'preference', template: 'user likes {0}' },
  { regex: /i (?:don't like|hate|dislike)\s*([a-z\s]{2,20})/i, category: 'preference', template: 'user dislikes {0}' },
  { regex: /my name is\s*([a-z]{2,15})/i, category: 'personal', template: 'user name is {0}' },
  { regex: /i work as\s*([a-z\s]{2,15})/i, category: 'personal', template: 'user works as {0}' },
  { regex: /i (?:study|major in)\s*([a-z\s]{2,20})/i, category: 'personal', template: 'user studies {0}' },
];

/**
 * 从用户消息中提取事实
 */
export function extractFacts(userMessage: string, aiResponse?: string): MemoryFact[] {
  const facts: MemoryFact[] = [];
  const seen = new Set<string>();

  for (const pattern of PATTERNS) {
    const match = userMessage.match(pattern.regex);
    if (match && match[1]) {
      const value = match[1].trim();
      if (value.length < 2 || seen.has(value)) continue;
      seen.add(value);

      const factText = pattern.template.replace('{0}', value);
      facts.push({
        id: '',
        category: pattern.category,
        fact: factText,
        source: userMessage.slice(0, 60),
        extractedFrom: aiResponse || '',
        timestamp: 0,
        updatedAt: 0,
        confidence: 0.7,
      });
    }
  }

  return facts;
}

/**
 * 将记忆格式化为 AI 上下文提示
 */
export function formatFactsForContext(facts: MemoryFact[]): string {
  if (facts.length === 0) return '';
  const lines = facts.map(f => `- ${f.fact}`);
  return '以下是我知道的关于用户的信息:\n' + lines.join('\n');
}

/**
 * 根据用户消息找到相关记忆
 */
export function getRelevantFacts(userMessage: string): MemoryFact[] {
  const facts = loadFacts();
  if (facts.length === 0) return [];

  const keywords = userMessage
    .toLowerCase()
    .split(/[\s，。,\.!！?？、]+/)
    .filter(w => w.length > 1);

  // 按关键词匹配度打分
  const scored = facts.map(fact => {
    const lowFact = fact.fact.toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      if (lowFact.includes(kw)) score += 2;
    }
    // 也匹配来源
    const lowSource = fact.source.toLowerCase();
    for (const kw of keywords) {
      if (lowSource.includes(kw)) score += 1;
    }
    return { fact, score };
  });

  return scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(s => s.fact);
}

/**
 * 获取记忆统计
 */
export function getMemoryStats(): { total: number; byCategory: Record<string, number> } {
  const facts = loadFacts();
  const byCategory: Record<string, number> = {};
  for (const f of facts) {
    byCategory[f.category] = (byCategory[f.category] || 0) + 1;
  }
  return { total: facts.length, byCategory };
}
