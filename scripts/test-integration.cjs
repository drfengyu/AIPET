/**
 * Full integration test: simulate the complete pet mode flow
 * Creates both main window and pet window to test the IPC handler
 */
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const APP_DIR = path.join(__dirname, '../dist/test-v033/win-unpacked/resources/app/dist');
const MAIN_HTML = path.join(APP_DIR, 'renderer/index.html');
const PRELOAD = path.join(APP_DIR, 'main/preload.cjs');

app.whenReady().then(async () => {
  // Verify files exist
  console.log('=== File checks ===');
  console.log('MAIN_HTML exists:', fs.existsSync(MAIN_HTML));
  console.log('PRELOAD exists:', fs.existsSync(PRELOAD));
  console.log('PET_HTML exists:', fs.existsSync(path.join(APP_DIR, 'renderer/pet.html')));
  console.log('lib exists:', fs.existsSync(path.join(APP_DIR, 'renderer/lib/cubism4.min.js')));

  // Create main window (simulates the real app)
  let petWindow = null;

  // Register the same handlers as main.mjs
  ipcMain.handle('open-pet-mode', (event, modelUrl) => {
    if (petWindow) return true;
    try {
      const petPath = path.join(APP_DIR, 'renderer/pet.html');
      petWindow = new BrowserWindow({
        width: 320, height: 420,
        transparent: true, frame: false,
        resizable: false, alwaysOnTop: true,
        skipTaskbar: true, hasShadow: false,
        webPreferences: {
          contextIsolation: false,
          nodeIntegration: false,
          sandbox: false,
        },
      });

      petWindow.loadFile(petPath, {
        query: { model: modelUrl || './models/Haru/Haru.model3.json' }
      });

      // Capture pet console output
      petWindow.webContents.on('console-message', (e, lvl, msg) => {
        const tag = ['v','i','w','e'][lvl] || '?';
        console.log(`[PET_WIN:${tag}] ${msg}`);
      });

      petWindow.on('closed', () => {
        petWindow = null;
      });

      return true;
    } catch (e) {
      console.log('PET_ERROR:', e.message);
      return false;
    }
  });

  ipcMain.handle('close-pet-mode', () => {
    if (petWindow) petWindow.close();
    return true;
  });

  // Create main window with preload
  const mainWin = new BrowserWindow({
    width: 1200, height: 800,
    webPreferences: {
      contextIsolation: true,
      sandbox: false,
      preload: PRELOAD,
    },
    show: false, // don't show
    backgroundColor: '#1a1a2e',
  });

  console.log('\n=== Loading main window ===');
  await mainWin.loadFile(MAIN_HTML);

  // Wait for page to fully render
  await new Promise(r => setTimeout(r, 3000));

  // Now simulate clicking the pet button - invoke IPC directly
  console.log('\n=== Calling open-pet-mode IPC ===');
  const result = await mainWin.webContents.executeJavaScript(`
    (async () => {
      try {
        const r = await window.electronAPI.openPetMode('./models/Haru/Haru.model3.json');
        return {success: true, result: r};
      } catch(e) {
        return {success: false, error: e.message};
      }
    })()
  `);
  console.log('IPC result:', JSON.stringify(result));

  // Wait for pet window to initialize
  await new Promise(r => setTimeout(r, 5000));

  // Check pet window state via executeJavaScript on ALL windows
  const windows = BrowserWindow.getAllWindows();
  console.log(`\nWindows count: ${windows.length}`);
  
  for (let i = 0; i < windows.length; i++) {
    try {
      const title = await windows[i].webContents.executeJavaScript('document.title');
      const diag = await windows[i].webContents.executeJavaScript(`(function() {
        return {
          PIXI: typeof PIXI !== 'undefined',
          Live2DModel: PIXI && PIXI.live2d ? typeof PIXI.live2d.Live2DModel : 'N/A',
          error: document.getElementById('error')?.textContent || '(none)',
          canvas: document.querySelectorAll('canvas').length,
        };
      })()`);
      console.log(`Window ${i} [${title}]:`, JSON.stringify(diag));
    } catch (e) {
      console.log(`Window ${i}: error - ${e.message}`);
    }
  }

  // Close
  if (petWindow) petWindow.close();
  mainWin.close();
  app.quit();
});
