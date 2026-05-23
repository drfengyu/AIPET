/**
 * Test: Check if pet.html initializes correctly
 * Launches a window that loads pet.html and reports what happens
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');

app.whenReady().then(async () => {
  const win = new BrowserWindow({
    width: 320,
    height: 420,
    transparent: true,
    frame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // Capture console output
  win.webContents.on('console-message', (event, level, message, line, sourceId) => {
    const tag = ['verbose', 'info', 'warning', 'error'][level] || 'log';
    console.log(`[${tag}] ${message}`);
  });

  // Capture errors
  win.webContents.on('render-process-gone', (event, details) => {
    console.log(`[fatal] Renderer process gone: ${details.reason}`);
  });

  // Load pet.html
  const petPath = path.join(__dirname, '../dist/renderer/pet.html');
  console.log(`Loading: ${petPath}`);
  
  await win.loadFile(petPath, { 
    query: { model: './models/Haru/Haru.model3.json' } 
  });
  
  // Wait for scripts to load and execute
  await new Promise(r => setTimeout(r, 5000));
  
  // Now check what's available in the window
  const result = await win.webContents.executeJavaScript(`
    (function() {
      const info = {};
      info.PIXI_exists = typeof PIXI !== 'undefined';
      info.PIXI_version = PIXI ? PIXI.VERSION : null;
      info.PIXI_keys = PIXI ? Object.keys(PIXI).slice(0, 20) : [];
      info.PIXI_utils_keys = PIXI && PIXI.utils ? Object.keys(PIXI.utils).slice(0, 20) : [];
      info.live2d_exists = PIXI && PIXI.live2d ? true : false;
      info.live2d_keys = PIXI && PIXI.live2d ? Object.keys(PIXI.live2d) : [];
      info.Live2DModel = PIXI && PIXI.live2d ? typeof PIXI.live2d.Live2DModel : 'N/A';
      info.error = document.getElementById('error')?.textContent || 'none';
      info.loading_visible = document.getElementById('loading')?.style?.display !== 'none';
      info.canvas_count = document.querySelectorAll('canvas').length;
      return info;
    })()
  `);
  
  console.log('=== Diagnostics ===');
  console.log(JSON.stringify(result, null, 2));
  
  // Check for errors
  const errorEl = await win.webContents.executeJavaScript(`
    document.getElementById('error')?.textContent || ''
  `);
  if (errorEl) {
    console.log('ERROR DISPLAYED:', errorEl);
  }
  
  app.quit();
});
