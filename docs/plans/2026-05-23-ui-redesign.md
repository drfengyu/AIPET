# AIPET v3.0 UI 重构计划

> **目标:** 将现有赛博朋克 UI 改造为「全息神经界面 × 冰川极简」混合风格
>
> **设计原则:**
> - 角色区沉浸感强（全息环、HUD、粒子）
> - 聊天区简洁干净（圆角气泡、记忆标签）
> - 保留现有 cyan/magenta 配色，降低视觉噪点
> - 动效服务于功能，不为了动效而动效

---

## 任务清单

### Task 1: 全局样式与动画 (index.html)

**Objective:** 更新全局 CSS 关键帧、移除旧动画、添加新动画

**Files:**
- Modify: `public/index.html`

**变更:**
1. 保留: `scanline`, `typing`, `spin`, `pulse-ring`
2. 移除: `glitch`, `flicker` (太花哨)
3. 新增:
   - `@keyframes float-particle` — 粒子上升
   - `@keyframes pulse-glow` — HUD 脉冲发光
   - `@keyframes msg-in` — 消息入场
   - `@keyframes viz-bar` — 音频可视化条

---

### Task 2: App 主布局重构 (App.tsx)

**Objective:** 重写 App.tsx 布局结构，采用左角色+右聊天+底部状态栏

**Files:**
- Modify: `src/renderer/App.tsx`

**新布局:**
```
┌──────────────────────────────────────────┐
│ TOP BAR (Logo + Status Dots + Settings)  │
├─────────────────────┬────────────────────┤
│                     │                    │
│  CHARACTER PANEL    │  CHAT PANEL        │
│  (全息环+HUD+模型)   │  (消息+输入+记忆条) │
│                     │                    │
├─────────────────────┴────────────────────┤
│ BOTTOM STATUS BAR (Latency/MSG/Session)  │
└──────────────────────────────────────────┘
```

**变更:**
1. 删除旧 header (LIVE2D_AI 标题、scanlines 覆盖层)
2. 新增 TopBar 组件内联
3. 调整 character-panel / chat-panel flex 比例
4. 新增底部状态栏组件
5. 保留 SettingsPanel 覆盖层逻辑

---

### Task 3: 角色面板 — HUD 指示器 (Live2DViewer.tsx)

**Objective:** 在 Live2DViewer 中添加全息环、状态 HUD、情绪徽章

**Files:**
- Modify: `src/renderer/components/Live2DViewer.tsx`

**新增元素:**
1. 全息环 (装饰性 CSS 旋转圆环)
2. 粒子背景 (绝对定位的浮动小点)
3. HUD 三栏 (Mood / Energy / Memory 进度条) — 字符底部
4. 情绪徽章 (右上角，如 "◉ HAPPY")
5. 记忆碎片浮窗 (左上角可选)

**Props 新增:**
- `mood: number` (0-100)
- `energy: number` (0-100)
- `memory: number` (0-100)
- `emotion: string` (当前情绪文字)
- `emotionColor: string`

**注意:** 全息环和粒子是纯 CSS，不增加渲染开销

---

### Task 4: 聊天面板改造 (ChatWindow.tsx)

**Objective:** 重新设计聊天窗口 — 圆角气泡、全新输入框、记忆标签条

**Files:**
- Modify: `src/renderer/components/ChatWindow.tsx`

**变更:**
1. 消息气泡: 去掉头像区域，改用圆角气泡 (border-radius: 12px)
   - AI 消息: 左对齐，淡灰背景
   - 用户消息: 右对齐，淡 cyan 背景
2. 底部入场动画 (msg-in)
3. 输入框: 圆角 + 内嵌麦克风/表情按钮
4. 发送按钮: 圆角 pill 样式
5. 记忆标签条: 聊天区底部，显示标签数组 (如 ["科幻", "赛博朋克"])
6. 系统状态 pill: 聊天区右上角 (如 "⟐ ONLINE · 42ms")

**Props 新增:**
- `memoryTags: string[]`
- `latency: number`

---

### Task 5: 底部状态栏 (App.tsx)

**Objective:** 在 App 底部添加系统状态条

**位置:** App.tsx 中，chat-panel 下方 (`<div class="status-bar">`)

**元素:**
- 左侧: 系统状态点 + 延迟 + 音频可视化柱
- 右侧: 会话时长 / 消息数 / 版本号

**数据来源:** 组件内 useState 模拟，后期可对接真实系统监控

---

### Task 6: 构建验证 & 提交

**Objective:** 确保改动编译通过，打包验证

**操作:**
1. `yarn build` — 检查编译
2. 手动检查改动文件完整性
3. `git add` + `git commit`

---

## 执行顺序

```
Task 1 (全局样式) → Task 2 (App布局) → Task 3 (角色HUD) 
→ Task 4 (聊天改造) → Task 5 (状态栏) → Task 6 (验证提交)
```
