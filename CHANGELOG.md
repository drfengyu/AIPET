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
- **测试页面兼容性**
  - 修复测试页面引用 Cubism 2 运行时的问题
  - 将测试脚本移到独立文件 `test-live2d.js`
- **模型加载问题**
  - 注册 Pixi Ticker 以支持 Live2D 模型
  - 调整模型缩放比例 (0.08) 以适应大尺寸模型
  - 修复 TypeScript 类型错误
  - 修正模型配置使用 Cubism 4 标准格式 (FileReferences)

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

## 2026-05-21 - Windows 应用打包功能

### 新增功能

- ✅ **Windows 安装版打包** (NSIS)
  - 创建开始菜单快捷方式
  - 创建桌面快捷方式
  - 支持自定义安装目录
  - 支持卸载功能

- ✅ **Windows 便携版打包**
  - 单文件运行，无需安装
  - 直接双击即可运行

- ✅ **自动更新功能**
  - 集成 electron-updater
  - 应用启动时自动检查更新
  - 支持从 GitHub Releases 下载更新
  - 应用内一键安装更新

- ✅ **更新检查 UI**
  - 添加"检查更新"按钮
  - 显示更新状态提示

### 技术实现

- 安装 electron-updater 依赖 (v6.8.3)
- 创建自动更新模块 (src/main/updater.ts)
- 配置 electron-builder 打包
- 集成 IPC 通信通道

### 输出文件

- `dist/installer/AIPET Setup 0.1.0.exe` - NSIS 安装版 (299MB)
- `dist/installer/AIPET-Portable-0.1.0.exe` - 便携版 (299MB)

### 已知问题

- 代码签名未启用，Windows 可能显示安全警告
- 需要配置 GitHub Personal Access Token 才能发布更新

### 下一步计划

1. 配置代码签名证书
2. 测试自动更新功能
3. 发布正式版本到 GitHub Releases

---

## 版本格式

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)：

- **主版本号 (MAJOR)**: 不兼容的 API 修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增
- **修订号 (PATCH)**: 向下兼容的问题修正
