import * as path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';
import { setupAutoUpdater } from './updater';

// 保持全局引用，防止窗口被垃圾回收时自动关闭
let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // 创建浏览器窗口
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // 加载应用的入口文件
  // 在开发环境中，我们使用Vite dev server
  // 在生产环境中，我们加载构建好的HTML文件
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // 当窗口关闭时
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// 当应用准备好时创建窗口
app.whenReady().then(() => {
  setupAutoUpdater();
  createWindow();

  // 在macOS上，即使没有窗口打开，也要保持应用活跃
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

// IPC通信示例
ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('get-live2d-models', async () => {
  // 这里可以返回可用的Live2D模型列表
  return [
    { id: 'model1', name: '角色1', path: '/models/character1.json' },
    { id: 'model2', name: '角色2', path: '/models/character2.json' }
  ];
});
