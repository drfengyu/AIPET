/**
 * AI 服务模块
 * 集成 Cloudflare Workers AI
 */

interface AIResponse {
  text: string;
  thinking?: string;
  emotion?: string;
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
      return {
        text: reply,
        emotion: detectEmotion(message)
      };
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
    return {
      text: reply,
      emotion: detectEmotion(message)
    };
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
 * 检测情绪类型
 */
function detectEmotion(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('开心') || lowerMessage.includes('高兴') || lowerMessage.includes('哈哈')) {
    return 'happy';
  }

  if (lowerMessage.includes('难过') || lowerMessage.includes('伤心') || lowerMessage.includes('哭')) {
    return 'sad';
  }

  if (lowerMessage.includes('生气') || lowerMessage.includes('愤怒')) {
    return 'angry';
  }

  if (lowerMessage.includes('惊讶') || lowerMessage.includes('震惊')) {
    return 'surprised';
  }

  if (lowerMessage.includes('爱') || lowerMessage.includes('喜欢')) {
    return 'blush';
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
