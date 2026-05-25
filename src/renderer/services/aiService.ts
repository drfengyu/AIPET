/**
 * AI 服务模块
 * 集成 Cloudflare Workers AI
 */

interface AIResponse {
  text: string;
  thinking?: string;
  emotion?: string;
  memoryFacts?: string[];
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// 检查是否在 Electron 环境 (有 IPC 桥接)
let isElectron = false;
try {
  isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI?.chatWithAI;
} catch { /* ignore */ }

/**
 * 获取 AI 回复
 * 自动选择通信方式:
 *   Electron → IPC (主进程直调 Cloudflare API，无 CORS，不需要额外服务器)
 *   浏览器   → HTTP 代理服务器 (开发模式)
 *   都失败   → 模拟回复
 */
export async function getAIResponse(
  message: string,
  history: ChatMessage[] = [],
  useMock: boolean = false,
  model?: string  // 新增 model 参数
): Promise<AIResponse> {
  // 如果 useMock 为 true 或消息为空，直接返回模拟回复
  if (useMock || !message.trim()) {
    return getMockResponse(message);
  }

  // Electron 环境: 通过 IPC 调用主进程 (生产环境)
  if (isElectron) {
    try {
      const data = await (window as any).electronAPI.chatWithAI({ message, history, model });
      if (data.error) throw new Error(data.error);
      // 兼容两种返回值格式:
      // - IPC: { response: "..." }
      // - 代理: { result: { response: "..." } }
      const reply = data.response || data.result?.response || '抱歉，我无法理解您的请求。';
      const { text, emotion } = parseAIReply(reply, message);
      return { text, emotion };
    } catch (error) {
      console.error('AI IPC error:', error);
      return getMockResponse(message);
    }
  }

  // 浏览器开发环境: 通过代理服务器 (绕过 CORS)
  try {
    const response = await fetch('http://localhost:3002/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history, model })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const reply = data.response || data.result?.response || '抱歉，我无法理解您的请求。';
    const { text, emotion } = parseAIReply(reply, message);
    return { text, emotion };
  } catch (error) {
    console.error('AI API error:', error);
    return getMockResponse(message);
  }
}

/**
 * 模拟 AI 回复 (开发环境使用)
 */
function getMockResponse(message: string): AIResponse {
  const lowerMessage = message.toLowerCase();

  // 根据关键词返回不同的回复和情绪
  if (lowerMessage.includes('你好') || lowerMessage.includes('hi') || lowerMessage.includes('hello')) {
    return {
      text: '你好！我是你的AI助手。有什么我可以帮助你的吗？',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('名字') || lowerMessage.includes('叫什么')) {
    return {
      text: '我是AIPET，你的Live2D AI伴侣。很高兴认识你！',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('天气') || lowerMessage.includes('今天')) {
    return {
      text: '今天天气不错呢！适合和我聊聊天～',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('心情') || lowerMessage.includes('感觉')) {
    return {
      text: '我感觉很好！和你聊天让我很开心。',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('谢谢') || lowerMessage.includes('感谢')) {
    return {
      text: '不客气！能帮到你我很开心。',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('再见') || lowerMessage.includes('拜拜')) {
    return {
      text: '再见！期待下次和你聊天～',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('笑话') || lowerMessage.includes('搞笑')) {
    return {
      text: '为什么程序员总是把万圣节和圣诞节搞混？因为 Oct 31 == Dec 25！',
      emotion: 'happy'
    };
  }

  if (lowerMessage.includes('爱') || lowerMessage.includes('喜欢')) {
    return {
      text: '我也很喜欢和你聊天呢！你是个很有趣的人。',
      emotion: 'blush'
    };
  }

  // 默认回复
  const defaultResponses = [
    '收到你的消息了！让我想想怎么回复...',
    '嗯嗯，我明白了。继续说吧！',
    '很有趣的话题呢！我还想听听更多。',
    '数据已接收，正在处理中...',
    '你的想法很有意思！',
  ];

  return {
    text: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    emotion: 'neutral'
  };
}

/**
 * 分析对话，提取值得记住的用户信息
 * 返回事实列表，如果没找到返回空数组
 */
export async function analyzeMemory(conversation: string): Promise<string[]> {
  if (isElectron) {
    return [];
  }
  try {
    // 用聊天接口做记忆分析（更稳定）
    const response = await fetch('http://localhost:3002/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: '[记忆分析] 从对话中提取用户特征：\n' + conversation })
    });
    if (!response.ok) return [];
    const data = await response.json();
    const text = data.result?.response || '';
    if (text.trim() === '无' || text.trim() === '' || text.includes('抱歉') || text.includes('无法理解')) return [];
    return text.split('\n')
      .map((line: string) => line.replace(/^-\s*/, '').trim())
      .filter((fact: string) => fact.length > 3 && !fact.includes('无'));
  } catch {
    return [];
  }
}

/**
 * 从 AI 回复中提取情绪标签 【情绪:xxx】
 * 如果 AI 没返回标签，用正则 fallback
 */
function parseAIReply(reply: string, userMessage: string): { text: string; emotion: string } {
  const match = reply.match(/【情绪:(\w+)】/i);
  if (match) {
    const emotion = match[1].toLowerCase();
    // 只接受合法情绪值
    const validEmotions = ['happy', 'sad', 'angry', 'surprised', 'blush', 'neutral'];
    if (validEmotions.includes(emotion)) {
      return {
        text: reply.replace(/【情绪:\w+】/i, '').trim(),
        emotion,
      };
    }
  }
  // fallback: 用正则检测
  return { text: reply, emotion: detectEmotion(userMessage, reply) };
}

/**
 * 检测情绪类型 (正则 fallback)
 */
function detectEmotion(message: string, aiResponse?: string): string {
  const texts = [message, aiResponse || ''].filter(Boolean);

  // 合并所有文本进行检测
  const combined = texts.join(' ').toLowerCase();

  // 分值统计
  const scores: Record<string, number> = {
    happy: 0, sad: 0, angry: 0, surprised: 0, blush: 0, neutral: 0,
  };

  // 正向情绪（开心/高兴/兴奋）
  if (/开心|高兴|哈哈|嘻嘻|快乐|兴奋|美好|棒|赞|太好了|真好|不错不错|心情好|开心的一天|阳光|真好呀|太好了吧|妙啊/i.test(combined)) {
    scores.happy += 3;
  }
  if (/😊|😄|😁|🎉|🌈|🌟/.test(combined)) scores.happy += 3;
  if (/smile|happy|great|wonderful|amazing|fantastic|love it|awesome|lovely|cheer/i.test(combined)) scores.happy += 2;

  // 负面情绪（难过/伤心）
  if (/难过|伤心|哭|哭了|哭泣|悲伤|伤心事|不开心|郁闷|沮丧|心碎|sad|cry|crying|unhappy|depressed/i.test(combined)) {
    scores.sad += 3;
  }
  if (/😢|😭|💔/.test(combined)) scores.sad += 3;

  // 生气
  if (/生气|愤怒|气死|烦死了|烦躁|恼火|讨厌|生气|angry|mad|annoyed|frustrated/i.test(combined)) {
    scores.angry += 3;
  }
  if (/😠|😡|💢/.test(combined)) scores.angry += 3;

  // 惊讶
  if (/惊讶|震惊|没想到|真的吗|不敢相信|惊了|surprised|shocked|amazed|wow|omg|unbelievable/i.test(combined)) {
    scores.surprised += 2;
  }
  if (/😮|😱|😳/.test(combined)) scores.surprised += 2;

  // 害羞/爱慕
  if (/爱|喜欢|可爱|萌|好喜欢|心动|想念|cute|adorable|love|like|sweet|precious|blush/i.test(combined)) {
    scores.blush += 2;
  }
  if (/🥰|😍|❤️|💕|😊/.test(combined)) scores.blush += 2;

  // 选择分值最高的
  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted[0][1] > 0) return sorted[0][0];

  // 仍没匹配到但包含正向词汇 → 开心
  if (/好|不错|可以|行|是|嗯嗯|好的|ok/i.test(combined) && !/不|没|烦|累|困/i.test(combined)) {
    return 'happy';
  }

  return 'neutral';
}

/**
 * 获取可用的表情列表
 */
export function getAvailableEmotions(): string[] {
  return ['neutral', 'happy', 'sad', 'angry', 'surprised', 'blush'];
}

/**
 * 根据情绪选择合适的表情
 */
export function getExpressionForEmotion(emotion: string): string {
  const emotionMap: { [key: string]: string } = {
    'neutral': 'F01',
    'happy': 'F02',
    'sad': 'F03',
    'angry': 'F04',
    'surprised': 'F05',
    'blush': 'F06',
  };

  return emotionMap[emotion] || 'F01';
}

export default {
  getAIResponse,
  getAvailableEmotions,
  getExpressionForEmotion,
};
