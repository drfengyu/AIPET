# 语音合成功能指南

## 概述

AIPET 集成了 Web Speech API 实现语音合成功能，支持多语言语音播放。

## 功能特性

### ✅ 已实现功能
1. **语音播放** - AI 回复自动转换为语音
2. **多语言支持** - 中文、英文、日文等
3. **语音选择** - 可选择不同语音引擎
4. **语速调节** - 0.5x - 2.0x 可调
5. **播放控制** - 播放/停止/暂停/恢复

### 🔧 技术实现

#### 1. TTS 服务模块 (`src/renderer/services/ttsService.ts`)

```typescript
// 播放语音
speak(text: string, config?: Partial<TTSConfig>): Promise<void>

// 停止播放
stop(): void

// 暂停播放
pause(): void

// 恢复播放
resume(): void

// 获取可用语音
getAvailableVoices(): SpeechSynthesisVoice[]
```

#### 2. 配置接口

```typescript
interface TTSConfig {
  enabled: boolean;      // 是否启用
  voice: string;         // 语音名称/语言代码
  rate: number;          // 语速 (0.5-2.0)
  pitch: number;         // 音调 (0-2)
  volume: number;        // 音量 (0-1)
}
```

## 使用方法

### 1. 在设置中启用 TTS

1. 打开设置面板 (⚙ SETTINGS)
2. 找到"语音合成"部分
3. 开启"启用 TTS"开关
4. 选择语音和语速

### 2. 自动播放

启用 TTS 后，AI 回复会自动播放语音。

### 3. 手动控制

```typescript
import { speak, stop, pause, resume } from '../services/ttsService';

// 播放语音
await speak('你好！');

// 停止播放
stop();

// 暂停播放
pause();

// 恢复播放
resume();
```

## 浏览器兼容性

| 浏览器 | 支持情况 | 备注 |
|--------|---------|------|
| Chrome | ✅ 完全支持 | 推荐使用 |
| Edge | ✅ 完全支持 | 基于 Chromium |
| Firefox | ⚠️ 部分支持 | 语音列表可能不完整 |
| Safari | ⚠️ 部分支持 | 需要用户交互触发 |
| IE | ❌ 不支持 | 已停止支持 |

## 测试语音功能

### 方法 1: 使用测试页面

打开 `test-tts.html` 文件进行测试：

```bash
# 在浏览器中打开
open test-tts.html
```

### 方法 2: 在应用中测试

1. 启动应用: `yarn dev:vite`
2. 打开设置面板
3. 启用 TTS
4. 发送消息测试语音播放

## 常见问题

### 问题 1: 无声音输出

**可能原因:**
- 浏览器不支持语音合成
- 系统未安装语音引擎
- 音量被静音

**解决方案:**
1. 检查浏览器支持: `console.log('speechSynthesis' in window)`
2. 测试系统音量
3. 尝试不同浏览器

### 问题 2: 语音列表为空

**可能原因:**
- 语音引擎未加载完成
- 系统未安装语音包

**解决方案:**
```typescript
// 等待语音加载完成
window.speechSynthesis.onvoiceschanged = () => {
  const voices = window.speechSynthesis.getVoices();
  console.log('可用语音:', voices);
};
```

### 问题 3: 中文语音不工作

**可能原因:**
- 系统未安装中文语音包
- 浏览器语言设置问题

**解决方案:**
1. 安装系统中文语音包
2. 尝试英文语音测试
3. 检查浏览器语言设置

## 性能优化

1. **语音缓存** - 避免重复加载语音引擎
2. **队列管理** - 处理多个语音请求
3. **错误降级** - 语音失败时静默处理

## 下一步开发

1. **语音选择器** - 动态加载可用语音列表
2. **语音预览** - 选择语音时播放示例
3. **多语音支持** - 不同角色使用不同语音
4. **语音合成设置** - 音调、音量等高级设置

## 参考资源

- [Web Speech API 文档](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis)
- [SpeechSynthesisUtterance](https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesisUtterance)
- [浏览器语音支持](https://caniuse.com/speech-synthesis)
