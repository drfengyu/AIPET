/**
 * AIPET - Electron 主进程 (ES 模块)
 * 使用安全的 Electron 配置 + 内存优化
 */

import electron from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const { app, BrowserWindow, ipcMain, nativeTheme, Tray, Menu, globalShortcut } = electron;
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 保持全局引用，防止窗口被垃圾回收时自动关闭
let mainWindow = null;
let tray = null;

// ============================================
// 内存优化配置
// ============================================

// 环境变量控制
const DEBUG = process.env.DEBUG === 'true';
const DISABLE_GPU = process.env.DISABLE_GPU === 'true';
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5MB 日志文件大小限制

// 日志轮转类 - 防止日志文件无限增长
class RotatingLogger {
  constructor(filePath, maxSize = MAX_LOG_SIZE) {
    this.filePath = filePath;
    this.maxSize = maxSize;
  }

  log(msg) {
    if (!DEBUG) return; // 非 DEBUG 模式不记录日志
    try {
      // 检查文件大小
      if (fs.existsSync(this.filePath)) {
        const stats = fs.statSync(this.filePath);
        if (stats.size > this.maxSize) {
          // 轮转日志文件
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupPath = `${this.filePath}.${timestamp}`;
          fs.renameSync(this.filePath, backupPath);
          // 删除超过 7 天的备份日志
          this.cleanOldLogs();
        }
      }
      fs.appendFileSync(this.filePath, new Date().toISOString() + ' ' + msg + '\n');
    } catch (_) {}
  }

  cleanOldLogs() {
    try {
      const dir = path.dirname(this.filePath);
      const basename = path.basename(this.filePath);
      const files = fs.readdirSync(dir);
      const now = Date.now();
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      files.forEach(file => {
        if (file.startsWith(basename + '.')) {
          const filePath = path.join(dir, file);
          const stats = fs.statSync(filePath);
          if (now - stats.mtimeMs > sevenDaysMs) {
            fs.unlinkSync(filePath);
          }
        }
      });
    } catch (_) {}
  }
}

// 启动调试日志
const __debugLogFile = path.join(process.env.USERPROFILE || 'C:\\Users\\Administrator', 'aipet-debug.log');
const PHASE_LOG = path.join(process.env.USERPROFILE || 'C:\\Users\\Administrator', 'aipet-phase.log');
const debugLogger = new RotatingLogger(__debugLogFile);
const phaseLogger = new RotatingLogger(PHASE_LOG);

function debugLog(msg) {
  debugLogger.log(msg);
}

function phaseLog(msg) {
  phaseLogger.log(msg);
}

debugLog('STARTUP: module loading begins (DEBUG=' + DEBUG + ', DISABLE_GPU=' + DISABLE_GPU + ')');
phaseLog('start');

// 全局未捕获异常处理
process.on('uncaughtException', (err) => {
  debugLog('UNCAUGHT EXCEPTION: ' + (err?.stack || err?.message || err));
  phaseLog('UNCAUGHT: ' + (err?.message || 'unknown'));
  try {
    const userDataPath = app.getPath('userData');
    fs.appendFileSync(path.join(userDataPath, 'crash.log'), new Date().toISOString() + ' ' + (err?.stack || err?.message || err) + '\n');
  } catch (_) {}
});

process.on('unhandledRejection', (reason) => {
  debugLog('UNHANDLED REJECTION: ' + (reason?.stack || reason));
  phaseLog('UNHANDLED_REJ: ' + (reason?.message || 'unknown'));
});

// GPU 加速配置
// 如果遇到 GPU 驱动问题，设置 DISABLE_GPU=true 环境变量
if (DISABLE_GPU) {
  debugLog('GPU acceleration disabled (DISABLE_GPU=true)');
  app.commandLine.appendSwitch('disable-gpu');
  app.commandLine.appendSwitch('disable-software-rasterizer');
} else {
  debugLog('GPU acceleration enabled (set DISABLE_GPU=true to disable)');
  app.commandLine.appendSwitch('enable-gpu-rasterization');
}

debugLog('imports done, loading .env');
phaseLog('imports_done');

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
        debugLog('Loaded env from: ' + envPath);
        return;
      }
    } catch (e) {
      // ignore
    }
  }
  debugLog('No .env file found');
}

loadEnv();
debugLog('__dirname: ' + __dirname);
debugLog('resourcesPath: ' + (process.resourcesPath || 'undefined'));
phaseLog('env_loaded');

// 安全配置（sandbox=false 以支持 Live2D Cubism WASM 渲染）
const SECURITY_CONFIG = {
  contextIsolation: true,
  sandbox: false,
  nodeIntegration: false,
  webSecurity: false,     // file:// 下 Live2D 需要此设置来加载模型资源
};

debugLog('SECURITY_CONFIG defined');
phaseLog('security_config');

function createWindow() {
  debugLog('createWindow() called');
  phaseLog('createWindow_in');

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
    transparent: true,
    backgroundColor: '#1a1a2e',
    show: true,
  });

  debugLog('BrowserWindow created');
  phaseLog('bw_created');

  // 加载应用的入口文件
  if (process.env.NODE_ENV === 'development') {
    // 开发环境：加载 Vite dev server
    mainWindow.loadURL('http://localhost:5174');

    // 仅在 DEBUG 模式下打开 DevTools（节省内存）
    if (DEBUG) {
      mainWindow.webContents.openDevTools();
      debugLog('Development mode: DevTools opened (DEBUG=true)');
    } else {
      debugLog('Development mode: DevTools closed (set DEBUG=true to enable)');
    }

    debugLog('Development mode: loadURL http://localhost:5174');
  } else {
    // 生产环境：加载构建好的 HTML 文件
    const htmlPath = path.join(__dirname, '../renderer/index.html');
    debugLog('Production mode: loadFile ' + htmlPath);
    phaseLog('loadFile_called');

    // 使用 async loadFile 并捕获错误
    mainWindow.loadFile(htmlPath).then(() => {
      debugLog('loadFile resolved successfully');
      phaseLog('loadFile_done');
    }).catch((err) => {
      debugLog('loadFile rejected: ' + (err?.message || err));
      phaseLog('loadFile_rej:' + (err?.message || 'err'));
    });

    debugLog('loadFile call returned (async)');
    phaseLog('loadFile_async');
  }

  debugLog('createWindow() returning - event loop should run now');
  phaseLog('createWindow_exit');

  // 快速诊断定时器 - 保存 ID 以便清理
  const diagnosticTimers = [];
  if (DEBUG) {
    const intervals = [2, 5, 10, 20];
    intervals.forEach(sec => {
      const timerId = setTimeout(() => {
        phaseLog('alive_' + sec + 's');
        debugLog('>>> ALIVE CHECK at ' + sec + 's');
        try {
          if (mainWindow && mainWindow.webContents) {
            const wc = mainWindow.webContents;
            debugLog('>>> IsLoading:' + wc.isLoading() + ' IsCrashed:' + wc.isCrashed() + ' IsDestroyed:' + wc.isDestroyed());
          }
        } catch (e) {
          debugLog('>>> alive check err: ' + e?.message);
        }
      }, sec * 1000);
      diagnosticTimers.push(timerId);
    });
    debugLog('Diagnostic timers started (DEBUG=true)');
  }

  // 窗口事件处理
  mainWindow.on('closed', () => {
    debugLog('Window closed');
    phaseLog('win_closed');

    // 清理诊断定时器，防止内存泄漏
    diagnosticTimers.forEach(id => clearTimeout(id));
    debugLog('Diagnostic timers cleared');

    mainWindow = null;
  });

  // 最小化时隐藏到托盘（而不是最小化到任务栏）
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
    debugLog('Window minimized to tray');
  });

  mainWindow.on('ready-to-show', () => {
    debugLog('Window ready-to-show');
    phaseLog('win_ready');
  });

  // 监听渲染进程崩溃
  mainWindow.webContents.on('crashed', (event, killed) => {
    debugLog('Renderer crashed! killed=' + killed);
    phaseLog('renderer_crashed:' + killed);
  });

  mainWindow.webContents.on('did-finish-load', () => {
    debugLog('Page did-finish-load');
    phaseLog('page_loaded');
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    debugLog('Page did-fail-load: errorCode=' + errorCode + ' desc=' + errorDescription);
    phaseLog('page_fail:' + errorCode);
  });

  // 阻止导航到外部 URL
  mainWindow.webContents.on('will-navigate', (event) => {
    const url = new URL(event.url);
    if (url.protocol !== 'file:') {
      event.preventDefault();
    }
  });

  // 阻止新窗口打开
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    debugLog('Blocked window open: ' + url);
    return { action: 'deny' };
  });
}

// ============================================
// 系统托盘
// ============================================
function createTray() {
  const iconPath = path.join(__dirname, '../../build/tray-icon.png');
  let trayIcon;
  try {
    trayIcon = electron.nativeImage.createFromPath(iconPath);
    // 缩放为 16x16（系统托盘标准尺寸）
    trayIcon = trayIcon.resize({ width: 16, height: 16 });
  } catch (e) {
    debugLog('Tray icon load failed: ' + e.message);
    // 用 1x1 像素占位
    trayIcon = electron.nativeImage.createEmpty();
  }

  tray = new Tray(trayIcon);
  tray.setToolTip('AIPET - Live2D AI Desktop Pet');

  const contextMenu = Menu.buildFromTemplate([
    {
      label: '显示 AIPET',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    {
      label: '窗口置顶',
      type: 'checkbox',
      checked: false,
      click: (menuItem) => {
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(menuItem.checked);
          mainWindow.webContents.send('always-on-top-changed', menuItem.checked);
        }
      },
    },
    { type: 'separator' },
    {
      label: '退出',
      click: () => {
        app.isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 双击托盘图标显示窗口
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  debugLog('Tray created');
}

// ============================================
// 全局快捷键
// ============================================
function setupShortcuts() {
  // Ctrl+Shift+A 或 Command+Shift+A 唤出窗口
  globalShortcut.register('CommandOrControl+Shift+A', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  });
  debugLog('Global shortcuts registered: Ctrl+Shift+A');
}

// ============================================
// IPC 通信处理
// ============================================

// 窗口置顶
ipcMain.handle('set-always-on-top', (event, value) => {
  if (mainWindow) {
    mainWindow.setAlwaysOnTop(value);
    // 更新托盘菜单的勾选状态
    if (tray) {
      const menu = tray.getContextMenu();
      // 重建菜单（electron 不支持动态更新 checkbox）
      const items = menu.items;
      items[1].checked = value;
      tray.setContextMenu(Menu.buildFromTemplate(items));
    }
    return true;
  }
  return false;
});

ipcMain.handle('get-always-on-top', () => {
  return mainWindow ? mainWindow.isAlwaysOnTop() : false;
});

// 退出应用
ipcMain.handle('quit-app', () => {
  app.isQuitting = true;
  app.quit();
});

// ========== 透明浮动模式 ==========

ipcMain.handle('set-transparent-mode', (event, enabled) => {
  if (!mainWindow) return false;
  try {
    if (enabled) {
      // 保存当前窗口状态
      const bounds = mainWindow.getBounds();
      global._aipet_before_transparent = bounds;
      // 启用点击穿透（透明由 CSS 控制）
      mainWindow.setHasShadow(false);
      mainWindow.setIgnoreMouseEvents(true, { forward: true });
    } else {
      mainWindow.setHasShadow(true);
      mainWindow.setIgnoreMouseEvents(false);
      // 恢复尺寸
      if (global._aipet_before_transparent) {
        const b = global._aipet_before_transparent;
        mainWindow.setBounds(b);
      }
    }
    // 通知渲染进程切换 CSS 背景
    mainWindow.webContents.send('transparent-mode-changed', enabled);
    return true;
  } catch (e) {
    debugLog('set-transparent-mode error: ' + e.message);
    return false;
  }
});

ipcMain.handle('get-transparent-mode', () => {
  if (!mainWindow) return false;
  try {
    return mainWindow.isIgnoreMouseEvents();
  } catch { return false; }
});

ipcMain.handle('drag-window', (event, { deltaX, deltaY }) => {
  if (!mainWindow) return;
  const [x, y] = mainWindow.getPosition();
  mainWindow.setPosition(x + deltaX, y + deltaY);
});

// 应用准备好时创建窗口
app.whenReady().then(async () => {
  debugLog('app.whenReady() fired');
  phaseLog('whenReady');

  app.isQuitting = false;

  createWindow();
  createTray();
  setupShortcuts();

  // 启动自动更新检查
  try {
    const { setupAutoUpdater } = await import('./updater.js');
    setupAutoUpdater();
    debugLog('Auto updater initialized');
  } catch (e) {
    debugLog('Auto updater setup failed (non-critical): ' + (e?.message || e));
  }

  debugLog('after createWindow() - handlers registered, event loop running');
  phaseLog('after_createWindow');

  // 内存监控（仅在 DEBUG 模式）
  if (DEBUG) {
    const memoryInterval = setInterval(() => {
      const memUsage = process.memoryUsage();
      debugLog(`Memory: RSS=${Math.round(memUsage.rss / 1024 / 1024)}MB, Heap=${Math.round(memUsage.heapUsed / 1024 / 1024)}MB/${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`);
    }, 30000); // 每 30 秒输出一次

    // 应用退出时清理
    app.on('will-quit', () => {
      clearInterval(memoryInterval);
    });
  }

  // macOS：即使没有窗口打开，也要保持应用活跃
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// 当所有窗口关闭时退出应用（macOS除外）
app.on('window-all-closed', () => {
  debugLog('window-all-closed fired');
  phaseLog('win_all_closed');
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  debugLog('will-quit fired');
  phaseLog('will_quit');
  // 注销全局快捷键
  globalShortcut.unregisterAll();
  debugLog('Global shortcuts unregistered');
  // 销毁托盘
  if (tray) {
    tray.destroy();
    tray = null;
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
ipcMain.handle('ai-chat', async (event, { message, history = [], model }) => {
  try {
    const accountId = process.env.VITE_CLOUDFLARE_ACCOUNT_ID;
    const apiToken = process.env.VITE_CLOUDFLARE_API_TOKEN;

    if (!accountId || !apiToken) {
      return { error: 'Cloudflare credentials not configured' };
    }

    // 使用传入门模型，否则默认用 llama-3.1-8b
    const modelName = model || '@cf/meta/llama-3.1-8b-instruct';

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

    // 使用 Cloudflare Workers AI REST API 进行对话
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${modelName}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { error: `API request failed: ${response.status} ${errorText}` };
    }

    const data = await response.json();
    return { response: data.result.response };
  } catch (error) {
    return { error: error.message };
  }
});
