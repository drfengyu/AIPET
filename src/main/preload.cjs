/**
 * AIPET - 预加载脚本 (CommonJS)
 * 使用 contextBridge 进行安全的 IPC 通信
 */

const { contextBridge, ipcRenderer } = require('electron');

// 判断是否为生产环境
const isDev = process.env.NODE_ENV === 'development' || process.env.NODE_ENV?.startsWith('dev');

// 安全地暴露 IPC 方法到渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  // 环境信息
  isElectron: true,
  isDev,
  baseUrl: isDev ? '' : 'aipet://dist/renderer/',

  // 获取应用版本
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // 获取 Live2D 模型列表
  getLive2DModels: () => ipcRenderer.invoke('get-live2d-models'),

  // 获取系统主题
  getSystemTheme: () => ipcRenderer.invoke('get-system-theme'),

  // 监听事件
  onEvent: (channel, callback) => {
    const handler = (event, ...args) => callback(...args);
    ipcRenderer.on(channel, handler);
    return () => ipcRenderer.removeListener(channel, handler);
  },

  // 发送事件到主进程
  sendEvent: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },

  // AI 聊天 - 通过主进程调用 Cloudflare API
  chatWithAI: (message) => ipcRenderer.invoke('ai-chat', message),
});

// 暴露一个用于调试的 API（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('debug', {
    log: (...args) => console.log('[Electron Debug]', ...args),
    error: (...args) => console.error('[Electron Debug]', ...args),
  });
}
