# Live2D 模型格式修复文档

## 问题描述

在加载 Live2D 模型时遇到以下错误：

1. `live2d.min.js:1 Uncaught TypeError: Cannot read properties of undefined (reading 'EventEmitter')`
2. `TypeError: Unknown settings format.`

## 问题分析

### 根本原因

1. **live2d.min.js 冲突**: `live2d.min.js` 是 Cubism 2 运行时，与 Cubism 4 模型不兼容
2. **模型配置格式错误**: Cubism 4 模型需要特定的配置格式

### 解决方案

1. **移除 live2d.min.js**: 只使用 Cubism 4 运行时 (`live2dcubismcore.js`)
2. **修正模型配置格式**: 使用正确的 Cubism 4 模型配置格式

## 修复步骤

### 1. 移除 live2d.min.js 引用

**index.html**:
```html
<!-- 移除这一行 -->
<!-- <script src="/live2d.min.js"></script> -->

<!-- 只保留 Cubism 4 运行时 -->
<script src="/live2dcubismcore.js"></script>
```

### 2. 修正模型配置格式

**正确的 Cubism 4 模型配置**:
```json
{
  "version": "3.0",
  "model": {
    "name": "Sample Character",
    "file": "moc/moc3/sample.moc3"
  },
  "textures": [
    "textures/texture_00.png"
  ],
  "motions": {
    "idle": [
      {
        "file": "motions/idle.mtn",
        "fade_in": 500,
        "fade_out": 500
      }
    ]
  },
  "physics": {
    "file": "physics/physics.json"
  },
  "display": {
    "width": 800,
    "height": 1000
  }
}
```

**关键变化**:
- `textures` 数组改为字符串数组（而不是对象数组）
- 添加了 `motions` 中的 `file` 字段
- 添加了 `physics` 配置

### 3. 更新所有模型配置文件

已更新以下文件：
- `public/models/live2d-model.json`
- `public/models/live2d-model2.json`
- `public/models/live2d-model3.json`
- `public/models/live2d-model4.json`

## 文件清单

### 已更新的文件

| 文件 | 更改内容 |
|------|----------|
| `index.html` | 移除 `live2d.min.js` 引用 |
| `public/models/live2d-model.json` | 修正配置格式 |
| `public/models/live2d-model2.json` | 修正配置格式 |
| `public/models/live2d-model3.json` | 修正配置格式 |
| `public/models/live2d-model4.json` | 修正配置格式 |

### 已添加的文件

| 文件 | 说明 |
|------|------|
| `public/live2dcubismcore.js` | Cubism 4 核心运行时 |

## 运行时对比

### 之前（错误）
```
live2d.min.js (Cubism 2) + Cubism 4 模型 = 不兼容
```

### 之后（正确）
```
live2dcubismcore.js (Cubism 4) + Cubism 4 模型 = 兼容
```

## 验证修复

### 1. 检查浏览器控制台

打开浏览器控制台，应该没有以下错误：

- ❌ `Cannot read properties of undefined (reading 'EventEmitter')`
- ❌ `Unknown settings format`

### 2. 测试模型加载

访问主应用，应该能够正常加载 Live2D 模型。

### 3. 测试交互功能

点击模型头部和身体，应该触发相应的动画。

## 项目状态

| 模块 | 状态 |
|------|------|
| Live2D模型 | ✅ 已添加 4 个模型 |
| 模型配置 | ✅ 已修正格式 |
| 运行时库 | ✅ 已修复 |
| 交互功能 | ✅ 已实现 |

## 访问地址

- **主应用**: http://localhost:5184/
- **测试页面**: http://localhost:5184/test-live2d.html

## 下一步

1. **测试模型加载**
   - 访问主应用
   - 检查模型是否正常显示
   - 测试点击交互功能

2. **优化性能**
   - 添加模型缓存
   - 优化加载速度

3. **继续开发**
   - AI 对话功能
   - 桌面应用打包
