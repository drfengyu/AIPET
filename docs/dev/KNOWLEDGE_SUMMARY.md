# AIPET 项目知识总结

> 开发过程中的技术决策、踩坑记录、最佳实践汇总

---

## 一、技术架构

### 技术选型

| 层 | 选型 | 理由 |
|---|------|------|
| UI 框架 | React 18 + TypeScript | 组件化、类型安全、生态成熟 |
| 构建 | Vite 5 | 快、HMR、TSX 原生支持 |
| 桌面壳 | Electron | 跨平台桌面应用 |
| Live2D | Pixi.js 6 + pixi-live2d-display | 唯一可用的 Live2D Web 渲染方案 |
| AI | Cloudflare Workers AI | 免费额度、无需 GPU、REST API |
| 打包 | electron-builder (NSIS) | Windows 安装包生成 |
| 语音 | Web Speech API | 浏览器内置、零依赖 |

### 项目结构

```
src/
├── main/           # Electron 主进程 (Node.js)
│   ├── main.mjs    # 窗口管理、IPC、托盘、快捷键
│   ├── preload.cjs  # 安全桥接 (contextBridge)
│   └── updater.js  # 自动更新
├── renderer/       # React 渲染进程 (浏览器)
│   ├── App.tsx     # 主布局
│   ├── components/ # UI 组件
│   │   ├── Live2DViewer.tsx    # Live2D 渲染
│   │   ├── ChatWindow.tsx      # 聊天窗口
│   │   ├── SettingsPanel.tsx   # 设置面板
│   │   └── AudioVisualizer.tsx # 音频可视化
│   └── services/   # 服务层
└── agents/         # AI 代理系统
```

---

## 二、关键实现细节

### 2.1 Live2D 集成

- 使用 `pixi-live2d-display/cubism4` 模块
- Cubism Core 通过 `live2dcubismcore` npm 包提供（纯 JS，无 WASM 依赖）
- 模型文件放在 `public/models/` 下，每个模型一个子目录
- 必须注册 ticker: `Live2DModel.registerTicker(PIXI.Ticker)`

**模型加载流程：**
```
model3.json → .moc3 (骨骼) → textures (纹理PNG) → motions (动作) → physics
```

**注意事项：**
- `Live2DModel.from(url)` 是异步的，会加载所有依赖文件
- `sandbox: false` 在 Electron webPreferences 中是必需的
- `webSecurity: false` 在 file:// 协议下是必需的
- 纹理 2048px 可压缩到 1024px，肉眼几乎无差别

### 2.2 Electron 主进程

**IPC 通信模式：**
```
渲染进程 → ipcRenderer.invoke('channel', args)
主进程 → ipcMain.handle('channel', handler)
安全桥接 → contextBridge.exposeInMainWorld('electronAPI', {...})
```

**关键 IPC 通道：**
| 通道 | 方向 | 用途 |
|------|------|------|
| `ai-chat` | 渲染→主 | AI 对话请求 |
| `set-always-on-top` | 渲染→主 | 窗口置顶 |
| `check-for-updates` | 渲染→主 | 检查更新 |
| `quit-app` | 渲染→主 | 退出应用 |

**系统托盘实现：**
- `Tray` + `Menu.buildFromTemplate` 创建右键菜单
- 窗口 `minimize` 事件 → `preventDefault()` + `hide()`
- `app.isQuitting` 标志区分正常退出和隐藏到托盘

**全局快捷键：**
- `globalShortcut.register('CommandOrControl+Shift+A', handler)`
- `will-quit` 事件中 `globalShortcut.unregisterAll()`

### 2.3 自动更新

- 依赖 `electron-updater`
- `publish` 配置指向 GitHub Releases
- 在 `app.whenReady()` 中异步初始化：`await import('./updater.js')`
- 注意：`electron-updater` 使用 `require()` 加载 ES 模块时会失败，必须用动态 `import()`
- 自动更新仅对安装版 (NSIS) 有效，目录版会报错（正常行为）

### 2.4 聊天持久化

- 使用 `localStorage`（key: `aipet-chat-history`）
- 消息对象含 `Date` 类型，序列化/反序列化时需手动转换：
  - 保存：`JSON.stringify(messages)`（Date → ISO string）
  - 加载：`parsed.map(m => ({...m, timestamp: new Date(m.timestamp)}))`
- 注意：Electron 的 localStorage 按 `file://` 路径隔离，重建目录版后旧记录消失
- catch 块不要静默吞错误，至少 `console.warn`

### 2.5 Vite + Electron 构建流程

```
yarn build:
  1. vite build → dist/renderer/ (前端)
  2. cp main.mjs/preload.cjs/updater.js → dist/main/ (后端)
```

**坑：**
- 根目录 `./index.html` 是 Vite 入口，`public/index.html` 会冲突
- Vite 的 `base: './'` 使 Electron 的 `file://` 协议能正常加载资源
- `public/` 下的文件会被 Vite 复制到 `dist/renderer/`
- 旧 Vite 进程不彻底杀死会导致端口占用，新服务器启动失败
- 正确的重启方式：`taskkill` → `sleep 2` → `npx vite --force --strictPort`

### 2.6 React 性能

**模型频繁重载问题：**
```
// ❌ 每次渲染创建新函数 → useEffect 依赖变化 → 模型重建
const handleMotion = (motion: string) => {};

// ✅ useCallback 稳定引用
const handleMotion = useCallback((motion: string) => {}, []);
```

**原则：**
- 作为 prop 传递给子组件的回调函数必须用 `useCallback`
- `useEffect` 的依赖数组要精确，避免不必要的重执行
- 避免在渲染周期中创建新的对象/函数引用

---

## 三、UI 设计规范

### 3.1 配色方案

| 用途 | 色值 | 说明 |
|------|------|------|
| 背景 | `#1a1a2e` | 深蓝紫底 |
| 面板 | `rgba(255,255,255,0.03~0.04)` | 微白透明 |
| 边框 | `rgba(255,255,255,0.07)` | 7% 白线 |
| 主色调 | `#00ffff` (cyan) | 交互元素 |
| 辅色调 | `#ff00ff` (magenta) | 情绪/强调 |
| 成功色 | `#00ff88` | 记忆条 |
| 文字主 | `#d0d0e8` | 正文 |
| 文字弱 | `rgba(255,255,255,0.12~0.25)` | 辅助信息 |

### 3.2 字体

| 用途 | 字体 | 说明 |
|------|------|------|
| Logo | `Orbitron` | 科技感 |
| HUD/状态 | `Share Tech Mono` | 终端等宽 |
| 正文中文 | `Microsoft YaHei` / `Noto Sans SC` | 中文字体 |
| 回退 | `system-ui, sans-serif` | 系统默认 |

### 3.3 圆角规范

| 元素 | 圆角 |
|------|------|
| 面板 (角色/聊天) | 8px |
| 视口 | 6px |
| 按钮 (顶栏/模型) | 4px |
| 输入框 | 10px |
| 发送按钮 | 6px |
| 消息气泡 | 12px (底角 4px) |

### 3.4 间距规范

- 面板间距：24px
- 内边距：16px (标准) / 12px (紧凑)
- 元素间距：8px ~ 12px

### 3.5 交互反馈

- 悬停：边框/文字变色（`0.2s ease`）
- 点击：`opacity: 0.85`
- 避免使用 `filter: brightness()` 和 `transform: scale()` 作为点击反馈（效果粗糙）

---

## 四、踩坑记录

### 4.1 构建部署

| 问题 | 原因 | 解决 |
|------|------|------|
| HTTP 408 push 失败 | Git 历史包含 1.5GB 构建产物 | `filter-branch` 清洗 + force push |
| Electron 启动报错 SyntaxError | `await import` 在非 async 函数中 | `.then(async () => {...})` |
| 渲染进程白屏 | `public/index.html` 覆盖 Vite 构建输出 | 删除 `public/index.html` |
| 页面空白但无报错 | Vite 旧进程残留，新服务器未真正启动 | `taskkill` → `sleep` → `npx vite --strictPort` |
| electron-builder 报错 CANNOT_EXECUTE | 输出目录文件被占用 | 关闭所有 AIPET.exe 进程后重试 |

### 4.2 Live2D

| 问题 | 原因 | 解决 |
|------|------|------|
| 模型加载卡住 | 依赖外部 WASM 文件 | 使用 `live2dcubismcore` npm 包自包含版 |
| 模型频繁重建 | `onMotion` 回调每次渲染新引用 | `useCallback` 稳定引用 |

### 4.3 自动更新

| 问题 | 原因 | 解决 |
|------|------|------|
| 更新检查报错 | `require()` 不能加载 ES 模块 | `await import('./updater.js')` |
| 目录版点更新报错 | electron-updater 需要安装版 | 正常行为，安装版才支持 |

### 4.4 Windows 特定问题

- `taskkill /F /IM` 在 git-bash 中路径 `/` 和命令行标志冲突 → 使用 `//F`
- `netstat -ano` 配合 `awk '{print $5}'` 提取 PID
- `rm -rf` 在文件被占用时失败 → 先 `taskkill` 再删除

---

## 五、开发工作流

### 日常开发

```bash
# 启动 Vite 开发服务器
npx vite --port 5174 --host 0.0.0.0

# 浏览器测试
# http://localhost:5174/

# 构建
yarn build

# 打包目录版
npx electron-builder --win --dir
```

### 端口冲突处理

```bash
# 查找占用进程
netstat -ano | grep ":5174"
# 强制杀死
taskkill //F //PID <PID>
# 等待 2 秒再启动新服务器
```

### 提交规范

```
type: 简短描述

常用 type: feat, fix, refactor, docs, chore
```

---

## 六、后续优化方向

- [ ] 纹理压缩（2048→1024 PNG 减少加载时间）
- [ ] 透明/点击穿透模式（桌宠浮动）
- [ ] 语音输入集成（STT）
- [ ] AI 主动发起对话
- [ ] 聊天搜索功能
- [ ] 表情控制面板
- [ ] 角色等级/亲密度系统
- [ ] 主题切换（多套配色）
- [ ] 单元测试覆盖
- [ ] GitHub Actions CI
