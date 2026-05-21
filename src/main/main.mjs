/**
 * AIPET - Electron 主进程 (ES 模块)
 * 使用安全的 Electron 配置
 */

import electron from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';

const { app, BrowserWindow, ipcMain, nativeTheme } = electron;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
