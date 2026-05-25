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

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, model } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.VITE_CLOUDFLARE_API_TOKEN;
    if (!accountId || !apiToken) return res.status(500).json({ error: 'Cloudflare credentials not configured' });
    const modelName = model || '@cf/meta/llama-3.1-8b-instruct';
    const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`;
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [
          {
            role: 'system',
            content: '你是一个友善的中文AI助手AIPET。回复要简短亲切。在回复末尾用【情绪:xxx】分析用户此刻的情绪。情绪标签只能是：happy(开心)、sad(难过)、angry(生气)、surprised(惊讶)、blush(害羞)、neutral(平静)。例如：用户说"今天被老板骂了"你回复"哎，别太难过啦【情绪:sad】"'
          },
          { role: 'user', content: message }
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

app.get('/health', (req, res) => res.json({ status: 'ok', port: PORT }));

app.listen(PORT, () => {
  // Log to stderr so it doesn't interfere with pipe
  process.stderr.write(`AI Proxy running on :${PORT}\n`);
});
