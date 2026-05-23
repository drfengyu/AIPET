# 更新日志

## [0.1.1] - 2026-05-23

### 修复

- **Live2D 模型加载**: 替换 `public/live2dcubismcore.js` 为自包含版本（147KB），不再依赖外部 WASM 文件，解决模型加载卡住问题
- **AI 对话返回值**: 修复 IPC 返回值字段不匹配 (`data.response` → `data.result?.response` 兼容双格式)，解决一直显示"抱歉"的问题

### 新增

- **模型切换**: 设置面板中可选 AI 模型（Llama 3.1 8B、Llama 3.2 3B、Mistral 7B），同步到 Cloudflare API
- **TTS 语音切换**: 语音设置（中文/English/日本語）现在实际生效，传给浏览器语音合成引擎
- **默认问候语**: 首条消息改为中文"系统已就绪..."

### 变更

- AI 默认模型从 `llama-2-7b` 升级到 `llama-3.1-8b-instruct`
- 添加 `live2dcubismcore@1.0.2` 依赖
