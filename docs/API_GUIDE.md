# API 使用指南

## 目录
- [Cloudflare Workers AI](#cloudflare-workers-ai)
- [本地代理服务器](#本地代理服务器)
- [AI 服务接口](#ai-服务接口)
- [环境变量配置](#环境变量配置)

---

## Cloudflare Workers AI

### 概述
Cloudflare Workers AI 是一个云端 AI 服务，提供多种预训练模型。

### 支持的模型
| 模型 | 说明 | 适用场景 |
|------|------|---------|
| `@cf/meta/llama-2-7b-chat-int8` | Llama 2 7B | 通用对话 |
| `@cf/mistral/mistral-7b-instruct-v0.1` | Mistral 7B | 指令跟随 |
| `@cf/thebloke/discolm-german-7b-v0.1-wizard` | Discolm German | 德语对话 |

### API 端点
```
https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/{model}
```

### 请求格式
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are a friendly AI assistant."
    },
    {
      "role": "user",
      "content": "你好！"
    }
  ]
}
```

### 响应格式
```json
{
  "result": {
    "response": "你好！有什么我可以帮助你的吗？"
  },
  "success": true,
  "errors": [],
  "messages": []
}
```

---

## 本地代理服务器

### 启动代理服务器
```bash
# 使用环境变量启动
export VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
export VITE_CLOUDFLARE_API_TOKEN=your_api_token
node src/main/ai-proxy.js
```

### 代理服务器端点

#### 健康检查
```bash
GET http://localhost:3002/health
```

响应：
```json
{"status":"ok","port":3002}
```

#### AI 对话
```bash
POST http://localhost:3002/api/ai/chat
Content-Type: application/json

{
  "message": "你好！"
}
```

响应：
```json
{
  "result": {
    "response": "你好！我是你的AI助手。"
  },
  "success": true
}
```

---

## AI 服务接口

### aiService.ts

#### getAIResponse(message: string)
获取 AI 回复

**参数：**
- `message` - 用户输入的消息

**返回：**
```typescript
interface AIResponse {
  text: string;        // AI 回复文本
  emotion?: string;    // 情绪类型
}
```

**示例：**
```typescript
import { getAIResponse } from './services/aiService';

const response = await getAIResponse('你好！');
console.log(response.text);    // "你好！我是你的AI助手。"
console.log(response.emotion); // "happy"
```

#### getExpressionForEmotion(emotion: string)
根据情绪获取表情名称

**参数：**
- `emotion` - 情绪类型 (happy/sad/angry/surprised/blush/neutral)

**返回：**
- 表情名称 (F01-F06)

**示例：**
```typescript
import { getExpressionForEmotion } from './services/aiService';

const expression = getExpressionForEmotion('happy');
console.log(expression); // "F02"
```

---

## 环境变量配置

### .env 文件

```env
# Cloudflare Workers AI 配置
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id_here
VITE_CLOUDFLARE_API_TOKEN=your_api_token_here

# 开发模式
VITE_USE_MOCK_AI=false  # true=模拟模式, false=真实AI
```

### 获取 API 密钥

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 "Workers & Pages" → "AI"
3. 创建 Workers AI 项目
4. 获取 Account ID 和 API Token

### 安全注意事项

- **不要**将 API 密钥提交到公共仓库
- 使用 `.env` 文件存储敏感信息
- 在 `.gitignore` 中添加 `.env`

---

## 错误处理

### API 错误响应

```typescript
try {
  const response = await getAIResponse(message);
  // 处理成功响应
} catch (error) {
  console.error('AI API error:', error);
  // 降级到模拟回复
}
```

### 常见错误

| 错误 | 原因 | 解决方案 |
|------|------|---------|
| CORS 错误 | 直接访问 Cloudflare API | 使用代理服务器 |
| 401 Unauthorized | API 密钥无效 | 更新 .env 文件 |
| 429 Too Many Requests | 超过免费额度 | 等待或切换模型 |
| Network Error | 网络连接问题 | 检查网络连接 |

---

## 开发环境配置

### 模拟模式

在开发环境中，可以使用模拟模式避免消耗 API 额度：

```env
VITE_USE_MOCK_AI=true
```

模拟模式会返回预设的回复，适合开发和测试。

### 真实 AI 模式

在生产环境或需要真实 AI 回复时：

```env
VITE_USE_MOCK_AI=false
```

确保已配置正确的 API 密钥。

---

## 性能优化

### 缓存策略

1. **消息历史缓存** - 限制消息数量避免内存溢出
2. **模型缓存** - Live2D 模型只加载一次
3. **API 调用优化** - 避免频繁调用 AI API

### 响应时间优化

- 使用较小的模型 (Llama 2 7B)
- 启用缓存减少 API 调用
- 使用本地模拟模式进行开发

---

## 参考资源

- [Cloudflare Workers AI 文档](https://developers.cloudflare.com/workers-ai/)
- [Live2D Cubism SDK](https://www.live2d.com/en/sdk/)
- [Pixi.js 文档](https://pixijs.io/guides/basics/)
