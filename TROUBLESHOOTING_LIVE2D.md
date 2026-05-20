# Live2D 集成问题排查文档

## 问题描述

在集成 Live2D 真实模型时遇到以下错误：

1. `Live2D runtime placeholder loaded` - Live2D 运行时占位符已加载
2. `Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/html"` - 模块脚本加载失败
3. `Uncaught ReferenceError: Live2DMotion is not defined` - Live2DMotion 未定义

## 问题分析

### 1. Live2D 运行时库问题

**问题**: `live2d.min.js` 是一个占位符，不是真正的 Live2D 运行时库。

**解决方案**: 从 `pixi-live2d-display` 包中复制真正的 Cubism 4 运行时库。

**文件位置**:
- 源文件: `node_modules/pixi-live2d-display/dist/cubism4.min.js`
- 目标文件: `public/live2d.min.js`

### 2. 模块导入问题

**问题**: `pixi-live2d-display` 有多个导出版本，需要选择正确的版本。

**解决方案**: 使用 Cubism 4 版本导入。

**代码更改**:
```typescript
// 错误的导入方式
import { Live2DModel } from 'pixi-live2d-display';

// 正确的导入方式
import { Live2DModel } from 'pixi-live2d-display/cubism4';
```

### 3. 模型配置问题

**问题**: 模型配置文件中的 motion 文件路径不正确。

**解决方案**: 简化模型配置，移除不存在的 motion 文件引用。

**模型配置更改**:
```json
{
  "motions": {
    "idle": [{ "fade_in": 500, "fade_out": 500 }],
    "tap_body": [{ "fade_in": 200, "fade_out": 200 }],
    "tap_head": [{ "fade_in": 200, "fade_out": 200 }]
  }
}
```

## 修复步骤

### 步骤 1: 更新 Live2DViewer 组件

**文件**: `src/renderer/components/Live2DViewer.tsx`

**更改**:
1. 导入 Cubism 4 版本: `import { Live2DModel } from 'pixi-live2d-display/cubism4';`
2. 使用 `Live2DModel.from()` 加载真实模型
3. 添加错误处理和日志输出

### 步骤 2: 更新模型配置文件

**文件**: `public/models/live2d-model.json`

**更改**: 简化配置，移除不存在的文件引用

### 步骤 3: 更新 Live2D 运行时库

**文件**: `public/live2d.min.js`

**更改**: 从 `node_modules/pixi-live2d-display/dist/cubism4.min.js` 复制

## 测试页面

创建了测试页面 `test-live2d.html` 来验证 Live2D 模型加载：

- 访问地址: http://localhost:5181/test-live2d.html
- 功能: 加载 Live2D 模型并显示交互效果

## 当前状态

### ✅ 已修复的问题

1. Live2D 运行时库已更新为真正的 Cubism 4 版本
2. 模块导入已更正为 Cubism 4 版本
3. 模型配置已简化
4. 添加了错误处理和日志输出

### 🔧 待解决的问题

1. 模型文件可能不完整（缺少 motion 文件）
2. 需要测试模型是否能正确加载和显示

## 文件清单

### 已更新的文件

1. `src/renderer/components/Live2DViewer.tsx` - Live2D 查看器组件
2. `public/models/live2d-model.json` - 模型配置文件
3. `public/live2d.min.js` - Live2D 运行时库

### 新增的文件

1. `test-live2d.html` - Live2D 测试页面
2. `INTEGRATION_LIVE2D.md` - Live2D 集成文档
3. `TROUBLESHOOTING_LIVE2D.md` - 问题排查文档

## 访问地址

- **主应用**: http://localhost:5181/
- **测试页面**: http://localhost:5181/test-live2d.html

## 下一步

1. 测试 Live2D 模型是否能正确加载
2. 如果模型加载失败，检查模型文件格式
3. 添加更多 Live2D 模型支持
