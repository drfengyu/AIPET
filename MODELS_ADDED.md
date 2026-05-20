# Live2D 模型扩展文档

## 已添加的模型

### 模型列表

| 模型文件 | 角色名称 | 状态 |
|----------|----------|------|
| `live2d-model.json` | UNIT-01 | ✅ 已存在 |
| `live2d-model2.json` | UNIT-02 | ✅ 已添加 |
| `live2d-model3.json` | UNIT-03 | ✅ 已添加 |
| `live2d-model4.json` | UNIT-04 | ✅ 已添加 |

### 模型配置

所有模型使用相同的 moc3 文件和纹理贴图，但可以通过不同的配置实现不同的外观和行为。

**模型配置示例**:
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

## 前端界面更新

### 模型选择器

App.tsx 已更新，支持 4 个模型切换按钮：

```
UNIT-01 | UNIT-02 | UNIT-03 | UNIT-04
```

### 角色名称显示

Live2DViewer 组件已更新，根据模型 URL 自动显示对应的角色名称：

- `/models/live2d-model.json` → UNIT-01
- `/models/live2d-model2.json` → UNIT-02
- `/models/live2d-model3.json` → UNIT-03
- `/models/live2d-model4.json` → UNIT-04

## 文件结构

```
public/models/
├── live2d-model.json      # UNIT-01
├── live2d-model2.json     # UNIT-02
├── live2d-model3.json     # UNIT-03
├── live2d-model4.json     # UNIT-04
├── moc/moc3/
│   └── sample.moc3        # 模型数据
└── textures/
    └── texture_00.png     # 纹理贴图
```

## 使用方式

### 切换模型

1. 点击模型选择器中的按钮
2. 系统会自动加载对应的模型
3. 角色名称会自动更新

### 交互功能

- **点击头部**：触发 tap_head 动画
- **点击身体**：触发 tap_body 动画

## 下一步

### 添加更多模型

要添加更多模型，需要：

1. **下载模型文件**
   - `.moc3` 文件（模型数据）
   - 纹理贴图文件

2. **创建模型配置**
   - 在 `public/models/` 目录下创建新的 JSON 配置文件
   - 更新模型路径和纹理路径

3. **更新前端界面**
   - 在 App.tsx 中添加新的模型切换按钮
   - 在 Live2DViewer 中添加新的角色名称映射

### 自定义模型

可以为每个模型设置不同的：

- **外观**：使用不同的纹理贴图
- **动画**：添加自定义 motion 文件
- **交互**：自定义点击响应

## 项目状态

| 模块 | 状态 |
|------|------|
| Live2D模型 | ✅ 已添加 4 个模型 |
| 模型切换 | ✅ 已实现 |
| 角色名称显示 | ✅ 已实现 |
| 交互功能 | ✅ 已实现 |

## 访问地址

- **主应用**: http://localhost:5182/
- **测试页面**: http://localhost:5182/test-live2d.html
