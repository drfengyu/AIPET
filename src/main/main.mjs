/**
 * AIPET - Electron 主进程 (ES 模块)
 * 使用安全的 Electron 配置
 */

import electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

// 加载 .env 配置文件 (支持打包后的应用)
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '../../.env'),      // 开发环境: 项目根目录
    path.join(process.resourcesPath, '.env'), // 打包后: resources 目录
    path.join(process.cwd(), '.env'),         // 备用: 当前工作目录
  ];

  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        for (const line of content.split('\n')) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) continue;
          const eqIndex = trimmed.indexOf('=');
          if (eqIndex === -1) continue;
          const key = trimmed.slice(0, eqIndex).trim();
          const value = trimmed.slice(eqIndex + 1).trim();
          if (!process.env[key]) {
            process.env[key] = value;
          }
        }
        console.log('Loaded env from:', envPath);
        return;
      }
    } catch (e) {
      // ignore
    }
  }
  console.warn('No .env file found');
}

const { app, BrowserWindow, ipcMain, nativeTheme } = electron;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

loadEnv();

// 保持全局引用，防止窗口被垃圾回收时自动关闭
let mainWindow = null;

// 安全配置
const SECURITY_CONFIG = {
  contextIsolation: true,
  sandbox: true,
  nodeIntegration: false,
  webSecurity: true,
};

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      ...SECURITY_CONFIG,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    // 窗口外观
    titleBarStyle: 'default',
    backgroundColor: '#0a0a0f',
    icon: path.join(__dirname, '../../public/favicon.ico'),
  });

  // 加载应用的入口文件
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：加载 Vite dev server
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    // 生产环境：加载构建好的 HTML 文件
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 窗口事件处理
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 阻止导航到外部 URL
  mainWindow.webContents.on('will-navigate', (event) => {
    const url = new URL(event.url);
    if (url.origin !== 'http://localhost:5174' && url.protocol !== 'file:') {
      event.preventDefault();
    }
  });

  // 阻止新窗口打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    console.log('Blocked window open:', url);
    return { action: 'deny' };
  });
}

// 应用准备好时创建窗口
app.whenReady().then(() => {
  createWindow();

  // macOS：即使没有窗口打开，也要保持应用活跃
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC 通信处理
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-live2d-models', async () => {
  return [
    { id: 'Haru', name: 'Haru', path: '/models/Haru/Haru.model3.json' },
    { id: 'Hiyori', name: 'Hiyori', path: '/models/Hiyori/Hiyori.model3.json' },
    { id: 'Mao', name: 'Mao', path: '/models/Mao/Mao.model3.json' },
  ];
});

ipcMain.handle('get-system-theme', () => {
  return nativeTheme.shouldUseDarkColors ? 'dark' : 'light';
});

// AI 聊天 - 通过主进程直接调用 Cloudflare API (无 CORS 问题，不需要额外代理服务器)
ipcMain.handle('ai-chat', async (event, { message, history = [] }) => {
  try {
    const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.VITE_CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return { error: 'Cloudflare credentials not configured' };
    }

    // 构建消息历史
    const messages = [
      {
        role: 'system',
        content: '你是一个友善的AI助手，运行在赛博朋克风格的Live2D桌面应用中。你的名字是AIPET。请始终用中文回复，语气亲切友好，可以带一些科技感和幽默感。回复要简洁自然，像是朋友间的对话。'
      },
      ...history.map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Cloudflare API error: ${response.status} - ${errorText}` };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('AI chat error:', error);
    return { error: error.message };
  }
});
