# AIPET 项目文档

## 项目概述

AIPET 是一个基于 Live2D 的桌面 AI 陪聊软件，使用 Electron + React + TypeScript 构建。

## 项目结构

```
AIPET/
├── src/
│   ├── agents/           # AI 代理系统
│   ├── main/             # Electron 主进程
│   └── renderer/         # React 渲染进程
├── public/               # 静态资源
│   └── models/           # Live2D 模型
├── .claude/              # Claude 配置
└── CLAUDE.md             # 本文档
```

## 技术栈

- **前端**: React + TypeScript + Vite
- **桌面应用**: Electron
- **Live2D**: Pixi.js + pixi-live2d-display
- **AI 代理**: Cloudflare Agents SDK

## 开发命令

```bash
# 启动开发服务器
yarn dev:vite

# 启动 Electron 应用
yarn dev:electron

# 构建应用
yarn build
```

## 打包命令

```bash
# 构建应用
yarn build

# 打包 Windows 目录版（测试用）
npx electron-builder --win --dir

# 打包 Windows 安装版（需要网络连接）
npx electron-builder --win

# 打包 Windows 便携版（需要网络连接）
npx electron-builder --win --portable
```

## 访问地址

- **本地**: http://localhost:5174/
- **网络**: http://192.168.6.78:5174/

## 项目状态

| 模块 | 状态 |
|------|------|
| 技能安装 | ✅ 完成 (Superpowers + Hermes) |
| 代理架构 | ✅ 完成 |
| 依赖安装 | ✅ 完成 |
| 前端界面 | ✅ 完成 |
| Live2D集成 | ✅ 完成 |
| AI对话功能 | ⏳ 准备中 |
| 桌面应用打包 | ⏳ 准备中 |

## 已安装的技能

### Superpowers 技能
- `systematic-debugging` - 系统调试技能 (104.3K 安装量)

### Hermes 技能
- `dogfood` - 探索性 QA 技能 (2.8K 安装量)

## 下一步

1. 集成 AI 对话功能
2. 添加语音合成
3. 打包发布桌面应用
