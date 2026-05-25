# VRM 3D 模型支持 + 模型市场改造计划

> **目标:** 引入 Three.js + @pixiv/three-vrm 支持 VRM 3D 模型，
> 改造市场为 Live2D + VRM 混合市场，展示 lobe-vidol 的 70+ 远端角色

## 架构

```
App.tsx
  ├─ modelUrl → detectType() → 'live2d' | 'vrm'
  ├─ 'live2d' → Live2DViewer (现有)
  └─ 'vrm' → VrmViewer (新建)
        └─ Three.js canvas + @pixiv/three-vrm

public/market/index.json
  ├─ type: 'live2d' → 本地已有模型
  └─ type: 'vrm' → lobe-vidol 远端模型

MarketPanel.tsx
  ├─ Live2D 标签页（本地管理）
  └─ VRM 标签页（远端市场）
```

## 任务分解

### 任务 1: 安装 Three.js + @pixiv/three-vrm 依赖

### 任务 2: 创建 VrmViewer 组件
- Three.js 渲染器（透明背景）
- VRM 模型加载（@pixiv/three-vrm）
- 自动旋转
- HUD 覆盖层（同 Live2DViewer 风格）

### 任务 3: 更新 marketService + market index
- MarketModel 加 type 字段
- 用 lobe-vidol 真实 VRM 数据替换市场 JSON

### 任务 4: App.tsx 集成
- 根据 URL 自动识别模型类型
- VRM → VrmViewer, Live2D → Live2DViewer

### 任务 5: 构建验证
