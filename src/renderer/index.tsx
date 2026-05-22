import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// 全局异常处理 - 防止 Live2D SoundManager 在 asar + file:// 环境下崩溃渲染进程
if (typeof window !== 'undefined') {
  // 捕获未处理的错误 - 抑制音频相关错误
  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (msg.includes('SoundManager') || msg.includes('Audio') || msg.includes('wav')) {
      console.warn('[GlobalErrorHandler] Suppressed audio/sound error:', msg);
      event.preventDefault();
      return;
    }
  });

  // 捕获未处理的 Promise 拒绝
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason);
    if (msg.includes('SoundManager') || msg.includes('Audio') || msg.includes('wav')) {
      console.warn('[GlobalErrorHandler] Suppressed audio rejection:', msg);
      event.preventDefault();
      return;
    }
  });

  // 在 asar + file:// 环境下，Audio 构造函数抛出异常时会崩溃渲染进程
  // 使用 Object.defineProperty 替换 window.Audio 引用
  const OriginalAudio = window.Audio;
  const PatchedAudio = new Proxy(OriginalAudio, {
    construct(target, args) {
      try {
        return new target(...args);
      } catch (e) {
        console.warn('[PatchedAudio] Audio creation failed, returning placeholder:', args[0]);
        // 返回一个静默的 Audio 元素
        const silent = document.createElement('audio') as HTMLAudioElement;
        silent.volume = 0;
        silent.play = () => Promise.resolve(undefined);
        return silent;
      }
    },
    apply(target, thisArg, args) {
      try {
        return Reflect.apply(target, thisArg, args);
      } catch (e) {
        console.warn('[PatchedAudio] Audio call failed:', args[0]);
        return document.createElement('audio') as HTMLAudioElement;
      }
    },
  });

  try {
    Object.defineProperty(window, 'Audio', {
      value: PatchedAudio,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    console.warn('[GlobalErrorHandler] Could not patch Audio:', e);
  }
}

const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
