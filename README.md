# AIPET

基于 Live2D 的桌面 AI 陪聊软件 — Electron + React + TypeScript

[![GitHub Release](https://img.shields.io/badge/release-v0.2.0-blue)](https://github.com/drfengyu/AIPET/releases/tag/v0.2.0)

---

## 📦 下载

从 **[GitHub Releases](https://github.com/drfengyu/AIPET/releases/tag/v0.2.0)** 下载最新安装包。

---

## ✨ 功能特性

| 功能 | 说明 |
|------|------|
| 🎮 **Live2D 角色** | 8 个模型，点击交互（摸头/拍肩），动作表情切换 |
| 🤖 **AI 对话** | Cloudflare Workers AI（llama-3.1-8b），IPC 直连 |
| 💬 **聊天界面** | 圆角气泡 + 发言人标签 + 记忆标签条 |
| 🎯 **系统托盘** | 最小化到托盘、右键菜单、后台常驻 |
| 📌 **窗口置顶** | 设置面板/托盘菜单均可切换 |
| 🔊 **语音合成** | TTS 支持中/英/日，含音频可视化 |
| 🔄 **自动更新** | 连接 GitHub Release 检查/下载/安装 |
| ⌨️ **快捷键** | `Ctrl+Shift+A` 唤出窗口 |
| 📊 **角色 HUD** | 心情/精力/记忆 实时状态 + 情绪徽章 |
| 💾 **聊天持久化** | 对话记录重启不丢失 |

---

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
# 启动 Electron（开发）
yarn dev:electron

# 构建
yarn build

# 打包 Windows 目录版（测试用）
npx electron-builder --win --dir

# 打包 Windows 安装版
npx electron-builder --win
```

---

## 🧱 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 18 + TypeScript |
| 构建工具 | Vite 5 |
| Live2D | Pixi.js 6 + pixi-live2d-display + Cubism 4 |
| AI 引擎 | Cloudflare Workers AI (llama-3.1-8b) |
| 桌面壳 | Electron |
| 打包 | electron-builder (NSIS) |
| 语音合成 | Web Speech API |

---

## 📁 项目结构

```
AIPET/
├── src/
│   ├── main/             # Electron 主进程（托盘/窗口/IPC）
│   ├── renderer/         # React 渲染进程
│   │   ├── components/   # UI 组件
│   │   └── services/     # 服务层（AI/TTS）
│   └── agents/           # AI 代理系统
├── public/models/        # Live2D 模型文件
├── docs/                 # 文档
│   ├── guide/            # 用户指南
│   ├── dev/              # 开发参考
│   ├── optimization/     # 性能优化
│   ├── plans/            # 实施计划
│   ├── archive/          # 历史归档
│   └── superpowers/      # 技能文档
├── sketches/             # UI 设计原型
├── build/                # 构建资源（图标等）
└── scripts/              # 工具脚本
```

---

## 📚 文档分类

| 分类 | 说明 | 文档 |
|------|------|------|
| 🧭 **用户指南** | 面向使用者 | [TTS 指南](docs/guide/TTS_GUIDE.md)、[模型指南](docs/guide/MODEL_GUIDE.md)、[打包指南](docs/guide/PACKAGING_GUIDE.md)、[打包速查](docs/guide/PACKAGING_QUICK_REFERENCE.md)、[故障排查](docs/guide/TROUBLESHOOTING.md)、[环境配置](docs/guide/ENVIRONMENT_TROUBLESHOOTING.md)、[Haru TTS](docs/guide/HARU_TTS_GUIDE.md) |
| 🔧 **开发参考** | 面向开发者 | [技术详解](docs/dev/TECHNICAL_DETAILS.md)、[知识总结](docs/dev/KNOWLEDGE_SUMMARY.md)、[API 指南](docs/dev/API_GUIDE.md)、[代理指南](docs/dev/AGENTS_GUIDE.md)、[架构文档](docs/dev/ARCHITECTURE.md)、[项目架构](docs/dev/PROJECT_ARCHITECTURE.md)、[Hermes 使用](docs/dev/HERMES_USAGE_GUIDE.md) |
| ⚡ **性能优化** | 内存优化 | [优化详情](docs/optimization/MEMORY_OPTIMIZATION.md)、[最终方案](docs/optimization/MEMORY_OPTIMIZATION_FINAL.md)、[速查表](docs/optimization/MEMORY_OPTIMIZATION_QUICK_REFERENCE.md) |
| 📋 **实施计划** | 迭代计划 | [`plans/`](docs/plans/) |
| 🗄️ **归档** | 历史报告 | [`archive/`](docs/archive/) |
| 🧪 **Superpowers** | 技能文档 | [`superpowers/`](docs/superpowers/) |
---

## 📄 开源协议

MIT
