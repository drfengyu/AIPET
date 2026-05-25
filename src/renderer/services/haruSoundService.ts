/**
 * Haru 模型音色服务
 * 管理 Haru 模型的预录制音色文件，根据语言和情感匹配相应的音频
 */

interface HaruSound {
  name: string;
  path: string;
  languages: string[];
  emotion: string;
  description: string;
}

// Haru 模型的音色库映射
const HARU_SOUNDS: Record<string, HaruSound> = {
  info_04: {
    name: 'haru_Info_04',
    path: '/models/Haru/sounds/haru_Info_04.wav',
    languages: ['zh-CN', 'zh-TW'],
    emotion: 'informative',
    description: '信息性语调 - 适合提供信息和解释',
  },
  info_14: {
    name: 'haru_Info_14',
    path: '/models/Haru/sounds/haru_Info_14.wav',
    languages: ['zh-CN', 'zh-TW'],
    emotion: 'informative',
    description: '信息性语调 - 适合提供信息和解释',
  },
  normal_6: {
    name: 'haru_normal_6',
    path: '/models/Haru/sounds/haru_normal_6.wav',
    languages: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'],
    emotion: 'neutral',
    description: '中性语调 - 通用对话',
  },
  talk_13: {
    name: 'haru_talk_13',
    path: '/models/Haru/sounds/haru_talk_13.wav',
    languages: ['zh-CN', 'zh-TW', 'en-US', 'ja-JP'],
    emotion: 'friendly',
    description: '友好语调 - 亲切对话',
  },
};

// 语言到默认情感的映射
const LANGUAGE_EMOTION_MAP: Record<string, string> = {
  'zh-CN': 'neutral',
  'zh-TW': 'neutral',
  'en-US': 'friendly',
  'ja-JP': 'friendly',
};

// 语言别名映射（处理不同的语言代码格式）
const LANGUAGE_ALIASES: Record<string, string> = {
  'zh': 'zh-CN',
  'zh_CN': 'zh-CN',
  'zh-Hans': 'zh-CN',
  'zh_Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'zh_Hant': 'zh-TW',
  'en': 'en-US',
  'en_US': 'en-US',
  'ja': 'ja-JP',
  'ja_JP': 'ja-JP',
};

/**
 * 规范化语言代码
 */
function normalizeLanguage(language: string): string {
  const normalized = language.replace(/_/g, '-');
  return LANGUAGE_ALIASES[normalized] || normalized;
}

/**
 * 根据语言和情感获取最匹配的 Haru 音色
 */
export function getHaruSoundForLanguage(
  language: string,
  emotion?: string
): HaruSound | null {
  const normalizedLang = normalizeLanguage(language);
  const targetEmotion = emotion || LANGUAGE_EMOTION_MAP[normalizedLang] || 'neutral';

  // 首先尝试找到完全匹配的音色（语言 + 情感）
  for (const sound of Object.values(HARU_SOUNDS)) {
    if (
      sound.languages.includes(normalizedLang) &&
      sound.emotion === targetEmotion
    ) {
      return sound;
    }
  }

  // 如果没有完全匹配，尝试找到支持该语言的任何音色
  for (const sound of Object.values(HARU_SOUNDS)) {
    if (sound.languages.includes(normalizedLang)) {
      return sound;
    }
  }

  // 最后回退到通用音色
  return HARU_SOUNDS.normal_6;
}

/**
 * 播放 Haru 音色
 */
export function playHaruSound(
  soundPath: string,
  volume: number = 1.0
): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      const audio = new Audio(soundPath);
      audio.volume = Math.max(0, Math.min(1, volume));

      audio.onended = () => {
        audio.remove();
        resolve();
      };

      audio.onerror = (error) => {
        // eslint-disable-next-line no-console
        console.error('Haru sound playback error:', error);
        audio.remove();
        reject(error);
      };

      audio.play().catch((error) => {
        // eslint-disable-next-line no-console
        console.error('Failed to play Haru sound:', error);
        audio.remove();
        reject(error);
      });
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating audio element:', error);
      reject(error);
    }
  });
}

/**
 * 停止播放
 */
export function stopHaruSound(): void {
  const audios = document.querySelectorAll('audio');
  audios.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

/**
 * 获取所有可用的 Haru 音色
 */
export function getAllHaruSounds(): HaruSound[] {
  return Object.values(HARU_SOUNDS);
}

/**
 * 获取特定语言支持的 Haru 音色
 */
export function getHaruSoundsForLanguage(language: string): HaruSound[] {
  const normalizedLang = normalizeLanguage(language);
  return Object.values(HARU_SOUNDS).filter((sound) =>
    sound.languages.includes(normalizedLang)
  );
}

/**
 * 获取特定情感的 Haru 音色
 */
export function getHaruSoundsByEmotion(emotion: string): HaruSound[] {
  return Object.values(HARU_SOUNDS).filter((sound) =>
    sound.emotion === emotion
  );
}

/**
 * 获取所有支持的语言列表
 */
export function getSupportedLanguages(): string[] {
  const languages = new Set<string>();
  Object.values(HARU_SOUNDS).forEach(sound => {
    sound.languages.forEach(lang => languages.add(lang));
  });
  return Array.from(languages).sort();
}

/**
 * 检查是否支持指定语言
 */
export function isLanguageSupported(language: string): boolean {
  const normalizedLang = normalizeLanguage(language);
  return getSupportedLanguages().includes(normalizedLang);
}

/**
 * 获取所有可用的情感类型
 */
export function getAvailableEmotions(): string[] {
  const emotions = new Set<string>();
  Object.values(HARU_SOUNDS).forEach(sound => {
    emotions.add(sound.emotion);
  });
  return Array.from(emotions).sort();
}

export default {
  getHaruSoundForLanguage,
  playHaruSound,
  stopHaruSound,
  getAllHaruSounds,
  getHaruSoundsForLanguage,
  getHaruSoundsByEmotion,
  getSupportedLanguages,
  isLanguageSupported,
  getAvailableEmotions,
};
