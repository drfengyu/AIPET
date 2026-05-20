import * as PIXI from 'pixi.js';
import { Live2DModel } from 'pixi-live2d-display/cubism4';

async function init() {
  const statusEl = document.getElementById('status');
  const errorEl = document.getElementById('error');
  const canvasEl = document.getElementById('canvas');

  try {
    statusEl.textContent = 'Creating PIXI application...';

    const app = new PIXI.Application({
      width: 400,
      height: 500,
      backgroundColor: 0x0a0a12,
      antialias: true,
    });

    canvasEl.appendChild(app.view);

    statusEl.textContent = 'Loading Live2D model...';

    const model = await Live2DModel.from('/models/live2d-model.json', {
      scale: 0.25,
    });

    console.log('Model loaded:', model);
    console.log('Model size:', model.width, 'x', model.height);

    model.x = app.screen.width / 2;
    model.y = app.screen.height / 2;
    model.anchor.set(0.5, 0.5);

    app.stage.addChild(model);

    model.interactive = true;
    model.on('pointerdown', (event) => {
      const position = event.data.global;
      const dx = position.x - model.x;
      const dy = position.y - model.y;

      if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
        console.log('Click on head');
        try {
          model.motion('tap_head');
        } catch (e) {
          console.log('tap_head motion not available:', e);
        }
      } else if (Math.abs(dx) < 80 && (dy > 50 && dy < 200)) {
        console.log('Click on body');
        try {
          model.motion('tap_body');
        } catch (e) {
          console.log('tap_body motion not available:', e);
        }
      }
    });

    statusEl.textContent = 'Model loaded successfully!';
    statusEl.style.color = '#00ff00';

  } catch (err) {
    console.error('Failed to load model:', err);
    statusEl.textContent = 'Failed to load model';
    statusEl.style.color = '#ff0000';
    errorEl.textContent = err.message || String(err);
  }
}

init();
