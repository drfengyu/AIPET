# AIPET 技术实现详解

> 项目核心功能的技术实现细节、设计思路、代码解读

---

## 一、Live2D 模型渲染

### 1.1 技术选型

```
pixi.js@6.5.8        → WebGL 渲染引擎
pixi-live2d-display  → Live2D 模型加载器（Cubism 4）
live2dcubismcore     → Cubism Core 运行时（纯 JS 版）
```

### 1.2 初始化流程

**`src/renderer/components/Live2DViewer.tsx`：**

```typescript
// 1. 注册 Ticker（必须在首次使用 Live2DModel 之前）
Live2DModel.registerTicker(PIXI.Ticker);

// 2. 创建 PIXI Application（WebGL 上下文）
const app = new PIXI.Application({
  width: containerWidth,
  height: containerHeight,
  backgroundColor: 0x0a0a12,
  antialias: true,
  resolution: window.devicePixelRatio || 1,
  autoDensity: true,
});

// 3. 加载模型（异步加载所有依赖文件）
const model = await Live2DModel.from(modelUrl);

// 4. 添加到舞台
app.stage.addChild(model);
```

**模型加载的内部流程（`Live2DModel.from()`）：**
```
1. Fetch model3.json → 解析模型元数据
2. Fetch .moc3 → 加载骨骼/网格数据（376KB~894KB）
3. Fetch textures (PNG) → 解码并上传 GPU（每张 1~3MB）
4. Fetch motions → 解析动作数据（每个模型 10~27 个）
5. Fetch physics3.json → 物理模拟参数
6. Fetch pose3.json → 姿势参数
7. Cubism Core 初始化内部运行时
8. 首次渲染
```

### 1.3 交互实现

```typescript
// 点击交互（通过 Pixi.js 事件系统）
model.interactive = true;
model.on('pointerdown', (event) => {
  const position = event.data.global;
  const dx = position.x - model.x;
  const dy = position.y - model.y;

  if (Math.abs(dx) < 50 && Math.abs(dy) < 50) {
    // 点击头部区域 → 触发 TapHead 动画
    model.motion('TapHead');
  }
});

// 空闲动画循环（每 8~12 秒随机播放动作）
setInterval(() => {
  const motions = ['Idle', 'TapBody', 'TapHead'];
  const random = motions[Math.floor(Math.random() * motions.length)];
  model.motion(random);
}, 8000 + Math.random() * 4000);
```

### 1.4 性能优化

**模型频繁重载问题：**

```typescript
// ❌ 问题代码 — 每次渲染创建新函数引用
const handleMotion = (_motion: string) => {};

// useEffect 依赖比较：
// [modelUrl, scale, onMotion]
//         ↑ onMotion 每次都是新的 → 模型重建

// ✅ 修复 — useCallback 稳定引用
const handleMotion = useCallback((_motion: string) => {}, []);
```

---

## 二、Electron 主进程架构

### 2.1 进程模型

```
┌─────────────────────────────────────────┐
│            Electron 主进程                │
│  (main.mjs — Node.js 环境)               │
│                                          │
│  ├─ 窗口管理 (BrowserWindow)              │
│  ├─ 系统托盘 (Tray)                      │
│  ├─ IPC 通信 (ipcMain)                   │
│  ├─ 全局快捷键 (globalShortcut)           │
│  └─ 自动更新 (electron-updater)           │
├─────────────────────────────────────────┤
│           渲染进程                         │
│  (React — Chromium 浏览器环境)            │
│                                          │
│  └─ preload.cjs (contextBridge 桥接)     │
│     └─ window.electronAPI 安全暴露        │
└─────────────────────────────────────────┘
```

### 2.2 安全桥接 (preload.cjs)

```typescript
// preload.cjs — 在渲染进程创建前执行
// 使用 contextBridge 安全暴露 API，而非直接启用 nodeIntegration

contextBridge.exposeInMainWorld('electronAPI', {
  // 调用主进程方法
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  setAlwaysOnTop: (value) => ipcRenderer.invoke('set-always-on-top', value),
  
  // 监听主进程事件
  onAlwaysOnTopChanged: (callback) => {
    const handler = (event, value) => callback(value);
    ipcRenderer.on('always-on-top-changed', handler);
    return () => ipcRenderer.removeListener('always-on-top-changed', handler);
  },
});
```

**安全原则：**
- `contextIsolation: true` — 隔离渲染进程和 preload 脚本的上下文
- `nodeIntegration: false` — 禁止渲染进程直接访问 Node.js API
- `sandbox: false` — 必需（Live2D Cubism 需要）
- `webSecurity: false` — 必需（`file://` 协议下 Live2D 加载资源）

### 2.3 系统托盘

```typescript
// main.mjs
function createTray() {
  const trayIcon = nativeImage.createFromPath('build/tray-icon.png');
  tray = new Tray(trayIcon);
  tray.setToolTip('AIPET - Live2D AI Desktop Pet');

  const contextMenu = Menu.buildFromTemplate([
    { label: '显示 AIPET', click: () => mainWindow.show() },
    { label: '窗口置顶', type: 'checkbox', checked: false, click: (item) => {
      mainWindow.setAlwaysOnTop(item.checked);
    }},
    { type: 'separator' },
    { label: '退出', click: () => { app.isQuitting = true; app.quit(); }},
  ]);
  tray.setContextMenu(contextMenu);

  // 最小化时隐藏到托盘
  mainWindow.on('minimize', (event) => {
    event.preventDefault();
    mainWindow.hide();
  });
}
```

### 2.4 全局快捷键

```typescript
// Ctrl+Shift+A 唤出窗口
globalShortcut.register('CommandOrControl+Shift+A', () => {
  if (mainWindow) {
    mainWindow.isVisible() ? mainWindow.focus() : mainWindow.show();
  }
});

// 退出时清理
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
```

---

## 三、AI 对话

### 3.1 通信架构

```
渲染进程                             主进程                      Cloudflare
┌──────────┐   IPC invoke   ┌──────────────────┐   HTTP POST   ┌──────────┐
│  Chat     │ ───────────→  │  ipcMain.handle  │ ───────────→  │ Workers  │
│  Window   │ ←───────────  │  ('ai-chat',     │ ←───────────  │ AI API   │
│           │   return      │   handler)       │   response    │          │
└──────────┘               └──────────────────┘               └──────────┘
```

**为什么通过主进程代理？**
- 避免 CORS 限制（浏览器限制跨域请求）
- API Token 存储在主进程 .env 中，不暴露给渲染进程
- 可统一错误处理和日志

### 3.2 IPC 实现

```typescript
// 渲染进程 (ChatWindow.tsx)
const aiResponse = await (window as any).electronAPI.chatWithAI({
  message: inputValue,
  history: previousMessages,
  model: selectedModel,
});

// 主进程 (main.mjs)
ipcMain.handle('ai-chat', async (event, { message, history, model }) => {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages: [systemPrompt, ...history, userMessage],
      }),
    }
  );
  const data = await response.json();
  return { response: data.result.response };
});
```

### 3.3 情绪系统

AI 回复中提取情绪 → 映射到 Live2D 表情 → 更新 HUD

```typescript
// aiService.ts
const EMOTION_MAP: Record<string, string> = {
  happy: 'F01', sad: 'F02', angry: 'F03',
  surprise: 'F04', neutral: 'F05', thinking: 'F06',
};

// 状态变化链
AI 回复 → 提取情绪 → setCurrentExpression(表情)
                      → setCurrentEmotion(情绪文字)
                      → setMood/Energy/Memory (HUD 数值)
```

---

## 四、UI 组件体系

### 4.1 布局结构

```
App.tsx
├── TopBar (Logo + 状态指示器 + 操作按钮)
├── Main (flex 容器, gap: 24px)
│   ├── CharacterPanel (flex: 1.1)
│   │   ├── Live2DViewer (模型渲染)
│   │   ├── 全息环 (装饰性 CSS)
│   │   ├── 浮动粒子 (CSS animation)
│   │   ├── 角色名 + 状态 (Live2DViewer 内部)
│   │   ├── 情绪徽章 (Live2DViewer 内部)
│   │   ├── HUD 属性条 (Live2DViewer 内部)
│   │   └── 模型选择器 (字符底部)
│   └── ChatPanel (flex: 1)
│       ├── ChatWindow
│       │   ├── 聊天头 (⟡ 神经通道)
│       │   ├── 消息列表 (气泡 + 发言人标签)
│       │   ├── 记忆标签条
│       │   └── 输入区
│       └── 底部状态栏 (ACTIVE + 延迟 + 音频可视化)
└── SettingsPanel (覆盖层)
```

### 4.2 状态管理

```typescript
// App.tsx — 全局状态
const [selectedModel, setSelectedModel] = useState('./models/Haru/Haru.model3.json');
const [showSettings, setShowSettings] = useState(false);
const [currentExpression, setCurrentExpression] = useState('F01');
const [settings, setSettings] = useState<Settings | null>(null);

// HUD 状态
const [mood, setMood] = useState(78);
const [energy, setEnergy] = useState(65);
const [memory, setMemory] = useState(45);
const [currentEmotion, setCurrentEmotion] = useState('HAPPY');
const [isSpeaking, setIsSpeaking] = useState(false);

// 会话统计
const [msgCount, setMsgCount] = useState(0);
const [sessionDisplay, setSessionDisplay] = useState('00:00');
```

所有状态通过 props 向下传递，无全局状态管理库（YAGNI）。

### 4.3 HUD 数据流

```
用户发消息 → handleSendMessage → energy -= 2
  AI 回复 → handleAIResponse  → mood += 3
                                 energy += 1
                                 memory += 1
                                 情绪文字更新
  
Live2DViewer props: mood, energy, memory, emotion
  → 内部渲染心情/精力/记忆 进度条
  → 内部渲染情绪徽章
```

### 4.4 音频可视化

```typescript
// AudioVisualizer.tsx
// 使用 requestAnimationFrame 驱动实时动画
useEffect(() => {
  const animate = () => {
    animRef.current.time += 0.02;
    animRef.current.phase += isSpeaking ? 0.15 : 0.035;

    const newHeights = bars.map((_, i) => {
      // 说话时：快速大幅度跳动
      // 静默时：缓慢小幅度呼吸
      return isSpeaking
        ? 3 + Math.abs(Math.sin(phase + i * 1.8)) * 14
        : 3 + (Math.sin(phase + i * 0.9) + 1) * 3;
    });

    setHeights(newHeights);
    rafRef.current = requestAnimationFrame(animate);
  };

  rafRef.current = requestAnimationFrame(animate);
  return () => cancelAnimationFrame(rafRef.current);
}, [isSpeaking]);
```

---

## 五、构建与部署

### 5.1 Vite 配置

```typescript
// vite.config.ts
export default defineConfig({
  base: './',  // 相对路径，兼容 Electron file:// 协议
  build: {
    outDir: 'dist/renderer',
    emptyOutDir: true,
  },
  publicDir: 'public',
  root: '.',
});
```

**关键点：**
- `base: './'` — 所有资源使用相对路径（Electron 的 `file://` 协议不支持绝对路径）
- 入口是根目录 `./index.html`，不是 `public/index.html`
- `public/` 中的文件会复制到 `dist/renderer/`，不能有同名冲突

### 5.2 构建命令

```bash
# yarn build 实际执行：
vite build              # 前端构建 → dist/renderer/
cp main.mjs dist/main/  # 复制主进程
cp preload.cjs dist/main/
cp updater.js dist/main/
```

### 5.3 electron-builder 配置

```json
{
  "build": {
    "appId": "com.live2d.chat",
    "productName": "AIPET",
    "directories": { "output": "dist/installer" },
    "files": ["dist/main/**/*", "dist/renderer/**/*", "node_modules/**/*"],
    "extraResources": [{ "from": ".env", "to": ".env" }],  // 打包 .env
    "win": {
      "target": [
        { "target": "nsis", "arch": ["x64"] },
        { "target": "portable", "arch": ["x64"] }
      ]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    },
    "publish": { "provider": "github" }  // 自动更新
  }
}
```

---

## 六、自动更新机制

### 6.1 工作流程

```
1. 构建 → electron-builder 生成 latest.yml + Setup.exe
2. 上传到 GitHub Release 作为 assets
3. 用户点击 UPDATE → electron-updater 检查 GitHub Release
4. 对比版本号 → 发现新版本 → 下载 → 安装

latest.yml 内容：
version: 0.2.0
files:
  - url: AIPET-Setup-0.2.0.exe
    sha512: ...
    size: 178560537
path: AIPET-Setup-0.2.0.exe
releaseDate: '2026-05-23T05:40:49.252Z'
```

### 6.2 注意事项

- 自动更新**仅安装版 (NSIS)** 有效，目录版会报错
- `latest.yml`、`.exe.blockmap`、`.exe` 三个文件必须一起上传
- `electron-updater` 使用 ESM 语法，主进程需要用 `await import()` 加载
- 上传已有 asset 需先 DELETE 再 POST（GitHub 不允许覆盖同名文件）

---

## 七、Git 历史清洗

### 7.1 背景

构建产物 `dist/` 在 `dist/` 加入 `.gitignore` 之前已被 commit（44 个提交中包含 3.4GB 的 asar/exe 文件），导致 `git push` 超时（HTTP 408）。

### 7.2 清洗命令

```bash
# 从所有历史提交中移除 dist/ 目录
FILTER_BRANCH_SQUELCH_WARNING=1 \
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch -r dist/' \
  --prune-empty -- --all

# 清理旧引用
git for-each-ref --format='delete %(refname)' refs/original | git update-ref --stdin

# 回收磁盘空间
git reflog expire --expire=now --all
git repack -adf --depth=250 --window=250
git prune --expire=now

# 强制推送
git push origin master --force
```

### 7.3 注意事项

- filter-branch 会重写所有历史，**不可逆**
- 所有基于旧历史的 clone 都需要重新 clone
- 需要 `git stash` 暂存工作区的未提交修改再执行
- 强制推送后通知协作者重新 clone

---

## 八、Vite 开发服务器管理

### 8.1 端口残留问题

频繁重启 Vite 时，旧进程可能未被完全终止，导致：
- 新 Vite 服务器启动失败（端口占用）
- 浏览器连接的是旧服务器（呈现旧代码或空白）

### 8.2 正确处理流程

```bash
# Windows 下可靠的重启方式：
taskkill //F //PID $(netstat -ano | grep ":5174" | awk '{print $5}')
sleep 2
npx vite --port 5174 --strictPort --force
```

### 8.3 验证服务器是否正常工作

```bash
# 检查文件是否正常服务
curl -s http://localhost:5174/src/renderer/App.tsx | wc -l
# 正常应返回 500+ 行

# 浏览器访问
# http://localhost:5174
```

---

## 九、CSS 动画体系

### 9.1 关键帧动画列表

| 动画名 | 用途 | 时长 |
|--------|------|------|
| `scanline` | 扫描线效果（已废弃） | 8s |
| `spin` | 加载旋转 | 1s |
| `pulse-ring` | 全息环脉冲 | 2s |
| `pulse-glow` | 按钮发光脉冲 | 2s |
| `float-particle` | 粒子上升 | 8~16s |
| `msg-in` | 消息入场 | 0.25s |
| `rotate-ring` | 全息环旋转 | 25~35s |
| `dot-bounce` | 打字指示器 | 1.2s |

### 9.2 HUD 进度条动画

```css
/* 属性条宽度变化过渡 */
transition: width 0.5s ease;

/* 发光效果 */
box-shadow: 0 0 8px currentColor;
```

### 9.3 交互过渡

```css
/* 所有按钮统一过渡 */
button {
  transition: all 0.2s ease;
}

/* 悬停：颜色变化 */
button:hover {
  border-color: rgba(0,255,255,0.4);
  color: #00ffff;
}

/* 点击：仅变淡，不位移 */
button:active {
  opacity: 0.85;
}
```

---

## 十、常见错误与调试

| 现象 | 排查步骤 | 常见原因 |
|------|----------|----------|
| Electron 弹窗报错 | 查看错误信息第一行 | `main.mjs` 语法错误 |
| 页面白屏 | 打开 DevTools (F12) 看 Console | Vite 服务器未正确启动 |
| Live2D 不显示 | Console 看模型加载日志 | `live2dcubismcore.js` 未找到 |
| 聊天发不出去 | Network 面板看 API 请求 | Cloudflare Token 未配置 |
| 更新按钮报错 | Console 看错误详情 | 目录版不支持自动更新 |
| 置顶不生效 | 检查 `electronAPI` 是否存在 | 浏览器模式无 Electron API |
