# AIPET 架构文档

## 项目概述

AIPET 是一个基于 Live2D 的桌面 AI 陪聊软件，使用 Electron + React + TypeScript 构建。

## 技术栈

### 前端
- **React 18** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Pixi.js 6.5.8** - 2D 渲染引擎
- **pixi-live2d-display** - Live2D 集成

### 后端
- **Electron** - 桌面应用框架
- **Express** - AI 代理服务器
- **Cloudflare Workers AI** - AI 服务

### AI 服务
- **Cloudflare Workers AI** - 主要 AI 服务
- **本地模拟模式** - 开发环境备用

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面 (React)                         │
├─────────────────────────────────────────────────────────────┤
│  Live2DViewer  │  ChatWindow  │  SettingsPanel              │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   业务逻辑层 (Services)                      │
├─────────────────────────────────────────────────────────────┤
│  aiService.ts  - AI 对话服务                                │
│  - 调用代理服务器                                           │
│  - 情绪检测                                                │
│  - 表情映射                                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   代理服务器 (Express)                       │
├─────────────────────────────────────────────────────────────┤
│  ai-proxy.js  - 绕过 CORS 限制                              │
│  - 转发请求到 Cloudflare AI                                 │
│  - 端口: 3002                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI 服务 (Cloudflare)                       │
├─────────────────────────────────────────────────────────────┤
│  Workers AI  - Llama 2 / Mistral 模型                       │
│  - 免费额度                                                │
│  - 快速响应                                                │
└─────────────────────────────────────────────────────────────┘
```

## 目录结构

```
AIPET/
├── docs/                      # 文档文件夹
│   ├── ARCHITECTURE.md       # 架构文档
│   ├── TROUBLESHOOTING.md    # 常见问题
│   └── API_GUIDE.md          # API 使用指南
├── src/
│   ├── main/                 # Electron 主进程
│   │   ├── index.ts          # 主进程入口
│   │   ├── preload.ts        # 预加载脚本
│   │   └── ai-proxy.js       # AI 代理服务器
│   ├── renderer/             # React 渲染进程
│   │   ├── components/       # UI 组件
│   │   │   ├── Live2DViewer.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   └── SettingsPanel.tsx
│   │   ├── services/         # 业务服务
│   │   │   └── aiService.ts  # AI 服务
│   │   └── App.tsx           # 主应用组件
│   └── vite-env.d.ts         # Vite 类型定义
├── public/                   # 静态资源
│   └── models/               # Live2D 模型
├── .env                      # 环境变量
├── package.json              # 项目配置
└── vite.config.ts            # Vite 配置
```

## 核心组件

### Live2DViewer
- 负责加载和显示 Live2D 模型
- 处理用户交互（点击、双击）
- 支持表情切换

### ChatWindow
- 聊天界面
- 发送/接收消息
- 显示 AI 回复和情绪

### SettingsPanel
- 应用设置面板
- AI 服务配置
- Live2D 设置
- 语音合成设置

### aiService
- AI 对话服务
- 情绪检测
- 表情映射
- 错误降级

### ai-proxy
- 绕过 CORS 限制
- 转发请求到 Cloudflare AI
- 健康检查

## 数据流

### 对话流程
```
用户输入 → ChatWindow → aiService.getAIResponse() → 代理服务器 → Cloudflare AI → AI 回复
                                                                              ↓
                                                                        情绪检测 → 表情映射 → Live2D 表情切换
```

### 设置流程
```
用户修改设置 → SettingsPanel → localStorage 保存 → 应用设置生效
```

## 配置说明

### 环境变量 (.env)
```env
VITE_CLOUDFLARE_ACCOUNT_ID=your_account_id
VITE_CLOUDFLARE_API_TOKEN=your_api_token
VITE_USE_MOCK_AI=false  # true=模拟模式, false=真实AI
```

### AI 模型
- `@cf/meta/llama-2-7b-chat-int8` - Llama 2 7B
- `@cf/mistral/mistral-7b-instruct-v0.1` - Mistral 7B
- `@cf/thebloke/discolm-german-7b-v0.1-wizard` - Discolm German

## 开发指南

### 启动开发环境
```bash
# 启动代理服务器 (端口 3002)
yarn dev:proxy

# 启动 Vite 开发服务器 (端口 5200)
yarn dev:vite
```

### 访问地址
- 主应用: http://localhost:5200/
- AI 代理: http://localhost:3002/

## 注意事项

1. **CORS 限制**: Cloudflare AI 不支持浏览器直接访问，必须通过代理服务器
2. **API 密钥**: 需要在 Cloudflare Dashboard 获取 API Token
3. **免费额度**: Cloudflare Workers AI 有免费额度限制
4. **开发模式**: 可使用模拟模式避免消耗 API 额度

## 下一步计划

1. 集成语音合成功能
2. 添加更多 AI 模型支持
3. 优化 Live2D 表情系统
4. 打包发布桌面应用
