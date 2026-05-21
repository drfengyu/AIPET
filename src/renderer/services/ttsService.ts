/**
 * TTS (Text-to-Speech) 服务模块
 * 使用 Web Speech API 实现语音合成
 */

interface TTSConfig {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
}

/**
 * 获取可用的语音列表
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  return window.speechSynthesis.getVoices();
}

/**
 * 检查浏览器是否支持语音合成
 */
export function isSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * 播放文本语音
 */
export function speak(text: string, config: Partial<TTSConfig> = {}): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!isSupported()) {
      console.warn('Speech synthesis not supported');
      resolve();
      return;
    }

    // 停止当前播放
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // 应用配置 - 使用语言代码查找语音
    if (config.voice) {
      const voices = getAvailableVoices();
      // 优先查找完全匹配的语音
      let voice = voices.find(v => v.name === config.voice);
      // 如果没找到，尝试按语言代码查找
      if (!voice) {
        voice = voices.find(v => v.lang === config.voice);
      }
      // 如果还是没找到，使用第一个匹配语言的语音
      if (!voice && config.voice.includes('-')) {
        const langPrefix = config.voice.split('-')[0];
        voice = voices.find(v => v.lang.startsWith(langPrefix));
      }
      if (voice) utterance.voice = voice;
    }
    if (config.rate) utterance.rate = config.rate;
    if (config.pitch) utterance.pitch = config.pitch;
    if (config.volume) utterance.volume = config.volume;

    // 事件处理
    utterance.onend = () => resolve();
    utterance.onerror = (event) => {
      console.error('TTS error:', event);
      reject(event);
    };

    window.speechSynthesis.speak(utterance);
  });
}

/**
 * 停止播放
 */
export function stop(): void {
  window.speechSynthesis.cancel();
}

/**
 * 暂停播放
 */
export function pause(): void {
  window.speechSynthesis.pause();
}

/**
 * 恢复播放
 */
export function resume(): void {
  window.speechSynthesis.resume();
}

/**
 * 获取默认配置
 */
export function getDefaultConfig(): TTSConfig {
  return {
    enabled: true,
    voice: '',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
  };
}

export default {
  getAvailableVoices,
  isSupported,
  speak,
  stop,
  pause,
  resume,
  getDefaultConfig,
};
