/**
 * AIPET - 预加载脚本 (CommonJS)
 * 使用 contextBridge 进行安全的 IPC 通信
 */

const { contextBridge, ipcRenderer } = require('electron');

// 安全地暴露 IPC 方法到渲染进程
contextBridge.exposeInMainWorld('electron', {
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
    // 返回取消监听的函数
    return () => ipcRenderer.removeListener(channel, handler);
  },

  // 发送事件到主进程
  sendEvent: (channel, ...args) => {
    ipcRenderer.send(channel, ...args);
  },
});

// 暴露一个用于调试的 API（仅开发环境）
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('debug', {
    log: (...args) => console.log('[Electron Debug]', ...args),
    error: (...args) => console.error('[Electron Debug]', ...args),
  });
}
