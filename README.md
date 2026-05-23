# AIPET

基于 Live2D 的桌面 AI 陪聊软件 — Electron + React + TypeScript

## 📦 下载

[![GitHub Release](https://img.shields.io/badge/release-v0.1.0-blue)](https://github.com/drfengyu/AIPET/releases/tag/v0.1.0)

从 **[GitHub Releases](https://github.com/drfengyu/AIPET/releases/tag/v0.1.0)** 下载最新安装包。

## 🚀 快速启动（开发）

```bash
# 安装依赖
yarn install

# 启动 Vite 开发服务器
yarn dev:vite
```

浏览器访问 http://localhost:5174/

## 🖥️ 桌面应用

```bash
# 启动 Electron
yarn dev:electron

# 构建打包
yarn build

# 打包 Windows 安装版
npx electron-builder --win --dir
```

## ✨ 功能

- **🎮 Live2D 角色** — 点击交互、模型切换、动作表情
- **🤖 AI 对话** — Cloudflare Workers AI（llama-3.1-8b）
- **💬 聊天界面** — 打字动画、消息流式输出
- **🔊 语音合成** — Edge TTS / Haru TTS

## 🧱 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React + TypeScript + Vite |
| Live2D | Pixi.js + pixi-live2d-display |
| AI | Cloudflare Workers AI |
| 桌面 | Electron |
| 构建 | Vite + electron-builder |

## 📁 项目结构

```
AIPET/
├── src/
│   ├── agents/         # AI 代理系统
│   ├── main/           # Electron 主进程
│   └── renderer/       # React 渲染进程
├── public/models/      # Live2D 模型
├── docs/               # 文档
├── scripts/            # 工具脚本
└── package.json
```

## 📚 文档

文档位于 [`docs/`](docs/) 目录下：

- [项目架构](docs/PROJECT_ARCHITECTURE.md)
- [API 指南](docs/API_GUIDE.md)
- [模型指南](docs/MODEL_GUIDE.md)
- [打包指南](docs/PACKAGING_GUIDE.md)
- [TTS 指南](docs/TTS_GUIDE.md)
- [故障排查](docs/TROUBLESHOOTING.md)
- [环境配置](docs/ENVIRONMENT_TROUBLESHOOTING.md)
- [Hermes 使用](docs/HERMES_USAGE_GUIDE.md)

## 📄 开源协议

MIT
