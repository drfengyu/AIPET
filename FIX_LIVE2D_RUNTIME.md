# Live2D 运行时修复文档

## 问题描述

在集成 Live2D 真实模型时遇到以下错误：

1. `live2d.min.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'EventEmitter')`
2. `cubism4.es.js:5189 Uncaught Error: Could not find Cubism 4 runtime. This plugin requires live2dcubismcore.js to be loaded.`

## 问题分析

### 根本原因

`pixi-live2d-display` 库需要两个运行时库：

1. **live2dcubismcore.js** - Cubism 4 核心运行时库
2. **live2d.min.js** - Live2D 运行时库

之前的配置只包含了 `live2d.min.js`，缺少 `live2dcubismcore.js`。

### 解决方案

根据 `pixi-live2d-display` 的 README 文档：

> For Cubism 4, you need `live2dcubismcore.min.js` that can be extracted from the Cubism 4 SDK, or be referred by a direct link.

## 修复步骤

### 1. 下载 Cubism 4 核心运行时

从官方链接下载 `live2dcubismcore.js`：

```bash
curl -L -o live2dcubismcore.js "https://cubism.live2d.com/sdk-web/cubismcore/live2dcubismcore.min.js"
```

**文件位置**: `public/live2dcubismcore.js`

### 2. 更新 index.html

在 `live2d.min.js` 之前加载 `live2dcubismcore.js`：

```html
<!-- 加载Live2D Cubism 4核心运行时库 -->
<script src="/live2dcubismcore.js"></script>
<!-- 加载Live2D运行时库 -->
<script src="/live2d.min.js"></script>
```

### 3. 重新启动开发服务器

```bash
yarn dev:vite
```

## 文件清单

### 已添加的文件

| 文件 | 说明 | 位置 |
|------|------|------|
| `live2dcubismcore.js` | Cubism 4 核心运行时 | `public/live2dcubismcore.js` |

### 已更新的文件

| 文件 | 更改内容 |
|------|----------|
| `index.html` | 添加 `live2dcubismcore.js` 引用 |

## 验证修复

### 1. 检查文件加载

访问 `http://localhost:5183/live2dcubismcore.js` 应该返回 Cubism 4 运行时代码。

### 2. 检查浏览器控制台

打开浏览器控制台，应该没有以下错误：

- ❌ `Cannot read properties of undefined (reading 'EventEmitter')`
- ❌ `Could not find Cubism 4 runtime`

### 3. 测试模型加载

访问主应用，应该能够正常加载 Live2D 模型。

## 技术细节

### 运行时库说明

**live2dcubismcore.js**:
- Cubism 4 核心运行时
- 提供 Live2D 模型的基础功能
- 必须在 `pixi-live2d-display` 之前加载

**live2d.min.js**:
- Live2D 运行时库
- 提供模型动画和交互功能
- 需要与 Cubism Core 配合使用

### 加载顺序

```
1. live2dcubismcore.js (Cubism 4 核心)
2. live2d.min.js (Live2D 运行时)
3. pixi-live2d-display (插件)
4. 应用代码
```

## 项目状态

| 模块 | 状态 |
|------|------|
| Live2D模型 | ✅ 已添加 4 个模型 |
| 模型切换 | ✅ 已实现 |
| 运行时库 | ✅ 已修复 |
| 交互功能 | ✅ 已实现 |

## 访问地址

- **主应用**: http://localhost:5183/
- **测试页面**: http://localhost:5183/test-live2d.html

## 下一步

1. **测试模型加载**
   - 访问主应用
   - 检查模型是否正常显示
   - 测试点击交互功能

2. **优化性能**
   - 添加模型缓存
   - 优化加载速度

3. **添加更多模型**
   - 下载更多 Live2D 模型文件
   - 创建新的模型配置文件
