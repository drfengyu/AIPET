# Live2D 模型集成文档

## 集成概述

已成功将 Live2D 真实模型集成到项目中，使用 `pixi-live2d-display` 库加载和显示角色动画。

## 技术实现

### 1. 依赖安装

项目已安装以下依赖：
- `pixi.js` ^7.3.2 - WebGL 渲染引擎
- `pixi-live2d-display` ^0.4.0 - Live2D SDK 集成

### 2. 组件更新

#### Live2DViewer.tsx

**主要更新：**
- 导入 `Live2DModel` 从 `pixi-live2d-display`
- 使用 `Live2DModel.from()` 加载真实模型
- 添加模型交互事件处理
- 支持点击触发动画（tap_head, tap_body）

**核心代码：**
```typescript
// 加载真实的Live2D模型
const model = await Live2DModel.from(modelUrl, {
  scale: scale,
});

// 居中模型
model.x = app.screen.width / 2;
model.y = app.screen.height / 2;
model.anchor.set(0.5, 0.5);

// 添加交互
model.interactive = true;
model.on('pointerdown', (event: PIXI.InteractionEvent) => {
  // 点击触发动画
  model.motion('tap_head');
  model.motion('tap_body');
});
```

### 3. 模型文件结构

```
public/models/
├── live2d-model.json      # 模型配置文件
├── moc/moc3/
│   └── sample.moc3        # 模型数据文件
└── textures/
    └── texture_00.png     # 纹理贴图
```

### 4. 模型配置

**live2d-model.json 配置：**
```json
{
  "version": "3.0",
  "model": {
    "name": "Sample Character",
    "file": "moc/moc3/sample.moc3"
  },
  "textures": [
    {
      "file": "textures/texture_00.png",
      "id": 0
    }
  ],
  "motions": {
    "idle": [{ "fade_in": 500, "fade_out": 500 }],
    "tap_body": [{ "fade_in": 200, "fade_out": 200 }],
    "tap_head": [{ "fade_in": 200, "fade_out": 200 }]
  },
  "display": {
    "width": 800,
    "height": 1000
  }
}
```

## 功能特性

### ✅ 已实现功能

1. **模型加载**
   - 自动加载 Live2D 模型文件
   - 支持模型缩放参数
   - 居中显示模型

2. **交互功能**
   - 点击头部触发 `tap_head` 动画
   - 点击身体触发 `tap_body` 动画
   - 支持回调函数通知父组件

3. **视觉效果**
   - 环境光效（青色发光圆圈）
   - 加载状态指示器
   - 错误处理和重试机制

### 🔧 配置参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `modelUrl` | `/models/live2d-model.json` | 模型文件路径 |
| `scale` | `0.25` | 模型缩放比例 |
| `onMotion` | - | 动画触发回调函数 |

## 使用示例

### 基本用法

```tsx
import Live2DViewer from './components/Live2DViewer';

function App() {
  const handleMotion = (motion: string) => {
    console.log('Live2D motion:', motion);
  };

  return (
    <Live2DViewer
      modelUrl="/models/live2d-model.json"
      scale={0.25}
      onMotion={handleMotion}
    />
  );
}
```

### 模型切换

```tsx
const [selectedModel, setSelectedModel] = useState('/models/live2d-model.json');

// 切换模型
setSelectedModel('/models/live2d-model2.json');
```

## 开发服务器

- **本地访问**: http://localhost:5179/
- **网络访问**: http://192.168.6.78:5179/

## 下一步

1. **添加更多模型**
   - 下载更多 Live2D 模型文件
   - 支持模型切换功能

2. **优化性能**
   - 添加模型缓存
   - 优化动画性能

3. **增强交互**
   - 添加更多动画类型
   - 支持拖拽交互

## 注意事项

1. **模型文件格式**
   - 确保模型文件符合 Live2D Cubism 3.0+ 格式
   - 需要包含 `.moc3` 文件和纹理贴图

2. **浏览器兼容性**
   - 需要 WebGL 支持
   - 某些旧浏览器可能不支持

3. **性能优化**
   - 大模型文件可能影响加载速度
   - 建议使用压缩纹理格式
