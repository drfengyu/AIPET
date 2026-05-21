import { contextBridge, ipcRenderer } from 'electron';

// 暴露安全的API给渲染进程
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getLive2dModels: () => ipcRenderer.invoke('get-live2d-models'),
  onMessage: (callback: (event: Electron.IpcRendererEvent, message: string) => void) => {
    ipcRenderer.on('message', callback);
  }
});
