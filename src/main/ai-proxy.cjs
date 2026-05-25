const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs');
const path = require('path');

// 加载 .env 文件
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

app.use(cors({
  origin: ['http://localhost:5200', 'http://localhost:5174', 'http://localhost:5193', 'http://localhost:5176', 'http://localhost:5175'],
  credentials: true
}));
app.use(express.json());

// Cloudflare AI 调用封装
async function callCloudflareAI(messages, model) {
  const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.VITE_CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) throw new Error('Cloudflare credentials not configured');
  const modelName = model || '@cf/meta/llama-3.1-8b-instruct';
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`;
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages })
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudflare API ${response.status}: ${errorText.slice(0, 200)}`);
  }
  return response.json();
}

// AI 聊天
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const data = await callCloudflareAI([
      {
        role: 'system',
        content: '你是一个友善的中文AI助手AIPET。回复要简短亲切。在回复末尾用【情绪:xxx】分析用户此刻的情绪。情绪标签只能是：happy(开心)、sad(难过)、angry(生气)、surprised(惊讶)、blush(害羞)、neutral(平静)。例如：用户说"今天被老板骂了"你回复"哎，别太难过啦【情绪:sad】"'
      },
      { role: 'user', content: message }
    ], model);
    res.json(data);
  } catch (error) {
    console.error('AI Chat error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// 记忆分析 — 分析对话中值得记住的用户信息
app.post('/api/ai/analyze-memory', async (req, res) => {
  try {
    const { conversation } = req.body;
    if (!conversation) return res.status(400).json({ error: 'Conversation is required' });
    const data = await callCloudflareAI([
      {
        role: 'system',
        content: '你是一个记忆分析助手。分析下面对话中关于用户的个人信息，提取出值得记住的内容：名字、年龄、职业、爱好、家庭、宠物、重要经历、偏好等。如果找到多条，逐条列出，每行一条用"- "开头。如果没有值得记住的信息，返回"无"。只要用户透露了个人信息就必须提取。例如：用户说"我叫小明，25岁"你应返回"- 用户叫小明\n- 用户25岁"'
      },
      { role: 'user', content: '对话记录：\n' + conversation }
    ]);
    res.json(data);
  } catch (error) {
    console.error('Memory analysis error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

app.listen(PORT, () => {
  process.stderr.write(`AI Proxy running on :${PORT}\n`);
});
