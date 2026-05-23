# Haru 模型 TTS 集成指南

## 概述

改进后的 TTS 服务现在优先使用 Haru 模型的预录制音色，自动匹配语言选择，提供更自然的语音体验。

## 核心特性

### 1. 智能音色选择
- **优先级**：Haru 预录制音色 > Web Speech API
- **语言匹配**：自动根据选择的语言匹配最合适的音色
- **情感映射**：根据语言自动选择合适的情感语调

### 2. 支持的语言

| 语言 | 代码 | 支持的音色 | 默认情感 |
|------|------|----------|--------|
| 简体中文 | zh-CN | info_04, info_14, normal_6, talk_13 | neutral |
| 繁体中文 | zh-TW | info_04, info_14, normal_6, talk_13 | neutral |
| 英文 | en-US | normal_6, talk_13 | friendly |
| 日文 | ja-JP | normal_6, talk_13 | friendly |

### 3. 可用音色

| 音色 | 文件 | 情感 | 描述 |
|------|------|------|------|
| haru_Info_04 | haru_Info_04.wav | informative | 信息性语调 - 适合提供信息和解释 |
| haru_Info_14 | haru_Info_14.wav | informative | 信息性语调 - 适合提供信息和解释 |
| haru_normal_6 | haru_normal_6.wav | neutral | 中性语调 - 通用对话 |
| haru_talk_13 | haru_talk_13.wav | friendly | 友好语调 - 亲切对话 |

## 使用方法

### 基础用法

```typescript
import ttsService from '@/renderer/services/ttsService';

// 使用默认配置（Haru 模型，中文）
await ttsService.speak('你好，我是 Haru！', {
  model: 'haru',
  language: 'zh-CN',
  volume: 1.0,
});
```

### 指定语言

```typescript
// 英文
await ttsService.speak('Hello, I am Haru!', {
  model: 'haru',
  language: 'en-US',
  volume: 1.0,
});

// 日文
await ttsService.speak('こんにちは、私はハルです！', {
  model: 'haru',
  language: 'ja-JP',
  volume: 1.0,
});
```

### 指定情感

```typescript
import haruSoundService from '@/renderer/services/haruSoundService';

// 获取特定情感的音色
const friendlySound = haruSoundService.getHaruSoundForLanguage('zh-CN', 'friendly');

// 播放指定音色
if (friendlySound) {
  await haruSoundService.playHaruSound(friendlySound.path, 1.0);
}
```

### 完整配置示例

```typescript
const config = {
  model: 'haru',           // 使用 Haru 模型
  language: 'zh-CN',       // 中文
  useHaruSound: true,      // 优先使用 Haru 音色
  volume: 0.8,             // 音量 0-1
  rate: 1.0,               // 语速（Web Speech API 回退时使用）
  pitch: 1.0,              // 音调（Web Speech API 回退时使用）
};

await ttsService.speak('这是一个完整的配置示例', config);
```

## API 参考

### ttsService

#### `speak(text, config): Promise<void>`
播放文本语音，优先使用 Haru 音色。

**参数：**
- `text` (string): 要播放的文本
- `config` (Partial<TTSConfig>): 配置对象
  - `model` (string): 'haru' 使用 Haru 模型
  - `language` (string): 语言代码（zh-CN, en-US, ja-JP 等）
  - `useHaruSound` (boolean): 是否使用 Haru 音色（默认 true）
  - `volume` (number): 音量 0-1（默认 1.0）
  - `rate` (number): 语速（Web Speech API 回退时使用）
  - `pitch` (number): 音调（Web Speech API 回退时使用）

#### `stop(): void`
停止当前播放。

#### `pause(): void`
暂停播放。

#### `resume(): void`
恢复播放。

#### `getHaruSupportedLanguages(): string[]`
获取 Haru 模型支持的所有语言列表。

#### `isHaruLanguageSupported(language): boolean`
检查 Haru 模型是否支持指定语言。

#### `getDefaultConfig(): TTSConfig`
获取默认配置。

### haruSoundService

#### `getHaruSoundForLanguage(language, emotion?): HaruSound | null`
根据语言和情感获取最匹配的 Haru 音色。

#### `playHaruSound(soundPath, volume): Promise<void>`
播放指定的 Haru 音色文件。

#### `stopHaruSound(): void`
停止所有 Haru 音色播放。

#### `getAllHaruSounds(): HaruSound[]`
获取所有可用的 Haru 音色。

#### `getHaruSoundsForLanguage(language): HaruSound[]`
获取特定语言支持的所有 Haru 音色。

#### `getHaruSoundsByEmotion(emotion): HaruSound[]`
获取特定情感的所有 Haru 音色。

#### `getSupportedLanguages(): string[]`
获取所有支持的语言列表。

#### `isLanguageSupported(language): boolean`
检查是否支持指定语言。

#### `getAvailableEmotions(): string[]`
获取所有可用的情感类型。

## 语言代码规范化

服务会自动规范化语言代码，支持多种格式：

```typescript
// 以下格式都会被规范化为 zh-CN
'zh'
'zh-CN'
'zh_CN'
'zh-Hans'
'zh_Hans'

// 以下格式都会被规范化为 zh-TW
'zh-TW'
'zh_TW'
'zh-Hant'
'zh_Hant'

// 以下格式都会被规范化为 en-US
'en'
'en-US'
'en_US'

// 以下格式都会被规范化为 ja-JP
'ja'
'ja-JP'
'ja_JP'
```

## 回退机制

当 Haru 音色不可用时，系统会自动回退到 Web Speech API：

1. **Haru 音色播放失败** → 回退到 Web Speech API
2. **不支持的语言** → 使用 Web Speech API 的语言匹配
3. **浏览器不支持 Speech API** → 静默失败（记录警告）

## 最佳实践

### 1. 始终检查语言支持

```typescript
if (ttsService.isHaruLanguageSupported(userLanguage)) {
  // 使用 Haru 模型
  await ttsService.speak(text, {
    model: 'haru',
    language: userLanguage,
  });
} else {
  // 回退到 Web Speech API
  await ttsService.speak(text, {
    language: userLanguage,
  });
}
```

### 2. 提供语言选择 UI

```typescript
const supportedLanguages = ttsService.getHaruSupportedLanguages();
// 在 UI 中显示支持的语言列表
```

### 3. 处理播放错误

```typescript
try {
  await ttsService.speak(text, {
    model: 'haru',
    language: 'zh-CN',
  });
} catch (error) {
  console.error('TTS 播放失败:', error);
  // 显示用户友好的错误提示
}
```

### 4. 音量控制

```typescript
// 根据用户偏好调整音量
const userVolume = 0.8; // 0-1
await ttsService.speak(text, {
  model: 'haru',
  language: 'zh-CN',
  volume: userVolume,
});
```

## 故障排查

### 问题：Haru 音色无法播放

**解决方案：**
1. 检查 `/public/models/Haru/sounds/` 目录中的音频文件是否存在
2. 检查浏览器控制台是否有 CORS 错误
3. 确保音频文件路径正确

### 问题：语言不被识别

**解决方案：**
1. 使用标准语言代码（如 zh-CN 而不是 zh）
2. 检查 `isHaruLanguageSupported()` 返回值
3. 查看支持的语言列表：`getHaruSupportedLanguages()`

### 问题：音量太小或太大

**解决方案：**
1. 调整 `volume` 参数（0-1 范围）
2. 检查系统音量设置
3. 检查浏览器音量设置

## 扩展指南

### 添加新的 Haru 音色

1. 将新的 `.wav` 文件放入 `/public/models/Haru/sounds/`
2. 在 `haruSoundService.ts` 中的 `HARU_SOUNDS` 对象中添加条目：

```typescript
const HARU_SOUNDS: Record<string, HaruSound> = {
  // ... 现有音色
  new_sound: {
    name: 'haru_new_sound',
    path: '/models/Haru/sounds/haru_new_sound.wav',
    languages: ['zh-CN', 'en-US'],
    emotion: 'excited',
    description: '兴奋语调 - 表达热情',
  },
};
```

### 添加新的语言支持

1. 在 `LANGUAGE_EMOTION_MAP` 中添加语言映射
2. 在 `LANGUAGE_ALIASES` 中添加语言别名
3. 更新现有音色的 `languages` 数组

```typescript
const LANGUAGE_EMOTION_MAP: Record<string, string> = {
  // ... 现有映射
  'ko-KR': 'friendly', // 添加韩文
};

const LANGUAGE_ALIASES: Record<string, string> = {
  // ... 现有别名
  'ko': 'ko-KR',
  'ko_KR': 'ko-KR',
};
```

## 性能考虑

- **Haru 音色**：预录制，加载快，文件大小 ~100-300KB
- **Web Speech API**：实时合成，延迟可能较高，但支持任意文本
- **缓存**：浏览器会自动缓存音频文件

## 浏览器兼容性

| 浏览器 | Haru 音色 | Web Speech API |
|--------|---------|----------------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |
| IE 11 | ❌ | ❌ |
