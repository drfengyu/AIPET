# 项目架构图

## 整体架构

```
AIPET (Electron AI Assistant)
├── Electron 主进程 (src/main/)
├── React 渲染进程 (src/renderer/)
├── AI 代理系统 (src/agents/)
└── 静态资源 (public/)
```

## 目录结构

```
AIPET/
├── .claude/                    # Claude 配置
├── .git/                       # Git 仓库
├── .gitignore                  # Git 忽略文件
├── public/                     # 静态资源
│   ├── index.html              # 主 HTML 文件
│   ├── live2d.min.js           # Live2D 库
│   └── models/                 # Live2D 模型
│       ├── live2d-model.json
│       ├── moc/moc3/sample.moc3
│       └── textures/texture_00.png
├── src/                        # 源代码
│   ├── agents/                 # AI 代理系统
│   │   ├── BackendAgent.ts     # 后端代理
│   │   ├── DeployAgent.ts      # 部署代理
│   │   ├── FrontendAgent.ts    # 前端代理
│   │   ├── ProjectManagerAgent.ts # 项目管理代理
│   │   ├── TestAgent.ts        # 测试代理
│   │   ├── types.ts            # 类型定义
│   │   ├── worker.ts           # 工作线程
│   │   └── index.ts            # 代理入口
│   ├── main/                   # Electron 主进程
│   │   ├── index.ts            # 主进程入口
│   │   └── preload.ts          # 预加载脚本
│   └── renderer/               # Electron 渲染进程
│       ├── index.tsx           # 渲染进程入口
│       ├── App.tsx             # 主应用组件
│       └── components/         # React 组件
│           ├── ChatWindow.tsx  # 聊天窗口
│           └── Live2DViewer.tsx # Live2D 查看器
├── examples/                   # 示例代码
│   └── usage-example.ts
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript 配置
├── vite.config.ts              # Vite 配置
├── wrangler.jsonc              # Cloudflare 配置
└── yarn.lock                   # 依赖锁定
```

## 架构层次

### 1. Electron 层 (主进程)
- **入口**: `src/main/index.ts`
- **职责**: 
  - 创建应用窗口
  - 管理系统托盘
  - 处理原生 API 调用
  - 进程间通信 (IPC)

### 2. React 层 (渲染进程)
- **入口**: `src/renderer/index.tsx`
- **组件**:
  - `App.tsx` - 主应用容器
  - `ChatWindow.tsx` - 聊天界面
  - `Live2DViewer.tsx` - Live2D 虚拟角色展示

### 3. AI 代理系统
- **代理类型**:
  - `BackendAgent` - 后端开发代理
  - `FrontendAgent` - 前端开发代理
  - `DeployAgent` - 部署代理
  - `ProjectManagerAgent` - 项目管理代理
  - `TestAgent` - 测试代理

### 4. 静态资源层
- **Live2D 模型**: 虚拟角色动画资源
- **HTML 模板**: 应用入口页面

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Electron |
| UI 框架 | React + TypeScript |
| 构建工具 | Vite |
| 样式 | CSS/SCSS |
| 类型检查 | TypeScript |
| 包管理 | Yarn |

## 数据流

```
用户操作 → React 组件 → IPC 通信 → Electron 主进程 → AI 代理系统
```

## 关键文件说明

| 文件 | 说明 |
|------|------|
| `package.json` | 项目依赖和脚本配置 |
| `vite.config.ts` | Vite 构建配置 |
| `tsconfig.json` | TypeScript 编译配置 |
| `wrangler.jsonc` | Cloudflare Workers 配置 |
| `start.bat` | Windows 启动脚本

## 扩展点

1. **新增 AI 代理**: 在 `src/agents/` 目录下创建新的代理类
2. **新增 UI 组件**: 在 `src/renderer/components/` 目录下创建组件
3. **新增功能模块**: 在 `src/main/` 或 `src/renderer/` 下添加模块
