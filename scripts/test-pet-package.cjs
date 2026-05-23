/**
 * Test pet.html in the SAME context as the packaged app
 * Loads pet.html from the packaged build output
 */
const { app, BrowserWindow } = require('electron');
const path = require('path');

const PET_HTML = path.join(__dirname, '../dist/test-v033/win-unpacked/resources/app/dist/renderer/pet.html');
const MODEL_DIR = path.join(__dirname, '../dist/test-v033/win-unpacked/resources/app/dist/renderer/models');

app.whenReady().then(async () => {
  console.log('PET_HTML:', PET_HTML);
  console.log('MODEL_DIR exists:', require('fs').existsSync(MODEL_DIR));
  console.log('MODEL_DIR contents:', require('fs').readdirSync(MODEL_DIR));

  const win = new BrowserWindow({
    width: 320, height: 420,
    transparent: true, frame: false,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  win.webContents.on('console-message', (e, level, msg) => {
    const tag = ['v','i','w','e'][level] || '?';
    if (msg.includes('[Pet]') || level >= 2 || msg.includes('error') || msg.includes('Error')) {
      console.log(`[PET:${tag}] ${msg}`);
    }
  });

  // Check file access before loading
  const fs = require('fs');
  console.log('pet.html exists:', fs.existsSync(PET_HTML));
  console.log('live2dcubismcore.js exists:', fs.existsSync(path.join(path.dirname(PET_HTML), 'live2dcubismcore.js')));
  console.log('pixi.min.js exists:', fs.existsSync(path.join(path.dirname(PET_HTML), 'lib/pixi.min.js')));
  console.log('cubism4.min.js exists:', fs.existsSync(path.join(path.dirname(PET_HTML), 'lib/cubism4.min.js')));
  console.log('Haru model exists:', fs.existsSync(path.join(MODEL_DIR, 'Haru/Haru.model3.json')));

  await win.loadFile(PET_HTML, {
    query: { model: './models/Haru/Haru.model3.json' }
  });

  // Wait for everything to initialize
  await new Promise(r => setTimeout(r, 6000));

  // Check state
  const diag = await win.webContents.executeJavaScript(`(function() {
    return {
      PIXI: typeof PIXI !== 'undefined',
      PIXI_version: PIXI ? PIXI.VERSION : null,
      live2d: !!(PIXI && PIXI.live2d),
      live2d_keys: PIXI && PIXI.live2d ? Object.keys(PIXI.live2d).slice(0,5) : [],
      Live2DModel_type: PIXI && PIXI.live2d ? typeof PIXI.live2d.Live2DModel : 'N/A',
      error: document.getElementById('error')?.textContent || '(none)',
      canvas_count: document.querySelectorAll('canvas').length,
      loading_hidden: document.getElementById('loading')?.style?.display === 'none',
    };
  })()`);
  console.log('\n=== Diagnostics ===');
  console.log(JSON.stringify(diag, null, 2));
  
  app.quit();
});
