/**
 * AI 代理服务器 (CommonJS)
 * 用于绕过 Cloudflare Workers AI 的 CORS 限制
 */

const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 加载 .env 文件（在 Electron 外部运行时）
try {
  const envPath = path.join(__dirname, '../../.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIndex = trimmed.indexOf('=');
      if (eqIndex === -1) continue;
      const key = trimmed.slice(0, eqIndex).trim();
      const value = trimmed.slice(eqIndex + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
} catch (e) { /* ignore */ }

const app = express();
const PORT = 3002;

// 启用 CORS
app.use(cors({
  origin: ['http://localhost:5200', 'http://localhost:5174', 'http://localhost:5193', 'http://localhost:5176', 'http://localhost:5175'],
  credentials: true
}));

// 解析 JSON 请求体
app.use(express.json());

// AI 代理路由
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, model } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.VITE_CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return res.status(500).json({ error: 'Cloudflare credentials not configured' });
    }

    // 使用传入门模型，否则默认用 llama-3.1-8b
    const modelName = model || '@cf/meta/llama-3.1-8b-instruct';

    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`;

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是一个友善的AI助手，运行在赛博朋克风格的Live2D桌面应用中。你的名字是AIPET。请始终用中文回复，语气亲切友好，可以带一些科技感和幽默感。回复要简洁自然，像是朋友间的对话。'
          },
          {
            role: 'user',
            content: message
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('AI Proxy error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', port: PORT });
});

app.listen(PORT, () => {
  console.log(`AI Proxy server running on http://localhost:${PORT}`);
});

module.exports = app;
