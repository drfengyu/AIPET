# 更改日志

所有 AIPET 项目的更改都会记录在此文件中。

## [0.1.0] - 2026-05-20

### ✨ 新增

- **项目初始化**
  - 基于 Electron + React + TypeScript 构建桌面应用
  - 集成 Live2D Cubism 4 运行时
  - 添加 4 个 Live2D 模型 (UNIT-01 到 UNIT-04)

### 🔧 修复

- **Live2D 模型格式兼容性**
  - 修复 `Cannot read properties of undefined (reading 'EventEmitter')` 错误
  - 修复 `Unknown settings format` 错误
  - 移除不兼容的 Cubism 2 运行时 (`live2d.min.js`)
  - 修正模型配置格式（textures 数组格式）

### 📦 变更

- **文件结构**
  - 添加 `public/live2dcubismcore.js` - Cubism 4 核心运行时
  - 添加 `public/models/live2d-model.json` - UNIT-01 模型配置
  - 添加 `public/models/live2d-model2.json` - UNIT-02 模型配置
  - 添加 `public/models/live2d-model3.json` - UNIT-03 模型配置
  - 添加 `public/models/live2d-model4.json` - UNIT-04 模型配置

### 🎯 功能

- **交互功能**
  - 点击模型触发交互动作
  - 模型 idle 动画播放

### 📋 项目状态

| 模块 | 状态 |
|------|------|
| Live2D 模型 | ✅ 已添加 4 个模型 |
| 模型配置 | ✅ 已修正格式 |
| 运行时库 | ✅ 已修复兼容性 |
| 交互功能 | ✅ 已实现 |
| AI 对话功能 | ⏳ 准备中 |
| 桌面应用打包 | ⏳ 准备中 |

---

## 版本格式

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正
