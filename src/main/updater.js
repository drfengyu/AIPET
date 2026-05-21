import { autoUpdater } from 'electron-updater';
import { ipcMain } from 'electron';

export function setupAutoUpdater() {
  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { updateAvailable: result.updateInfo.version !== autoUpdater.currentVersion.version };
    } catch (error) {
      console.error('检查更新失败:', error);
      return { updateAvailable: false, error: error.message };
    }
  });

  // 下载更新
  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error('下载更新失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 安装更新
  ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall();
    return { success: true };
  });

  // 监听更新事件
  autoUpdater.on('update-available', () => {
    console.log('发现新版本');
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('更新已下载');
  });

  autoUpdater.on('error', (error) => {
    console.error('更新错误:', error);
  });
}
