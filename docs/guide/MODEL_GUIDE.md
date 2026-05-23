# Live2D 模型使用指南

## 目录
- [模型文件结构](#模型文件结构)
- [模型配置说明](#模型配置说明)
- [动作类型](#动作类型)
- [表情系统](#表情系统)
- [添加新模型](#添加新模型)

---

## 模型文件结构

### 目录结构
```
public/models/
├── Haru/                    # Haru 模型
│   ├── Haru.moc3           # 模型文件
│   ├── Haru.model3.json    # 模型配置
│   ├── Haru.physics3.json  # 物理效果
│   ├── Haru.pose3.json     # 姿势数据
│   ├── Haru.2048/          # 纹理贴图
│   │   ├── texture_00.png
│   │   └── texture_01.png
│   ├── motions/            # 动作文件
│   │   ├── haru_g_idle.motion3.json
│   │   ├── haru_g_m01.motion3.json
│   │   └── ...
│   └── expressions/        # 表情文件
│       ├── F01.exp3.json
│       └── ...
├── Hiyori/                 # Hiyori 模型
├── Mao/                    # Mao 模型
└── ...                     # 其他模型
```

### 必需文件
- `.moc3` - 模型核心文件
- `.model3.json` - 模型配置文件
- `.physics3.json` - 物理效果配置
- `texture_*.png` - 纹理贴图
- `*.motion3.json` - 动作文件

---

## 模型配置说明

### Haru.model3.json 示例
```json
{
  "Version": 3,
  "FileReferences": {
    "Moc": "Haru.moc3",
    "Textures": [
      "Haru.2048/texture_00.png",
      "Haru.2048/texture_01.png"
    ],
    "Physics": "Haru.physics3.json",
    "Pose": "Haru.pose3.json",
    "Motions": {
      "Idle": [
        {
          "File": "motions/haru_g_idle.motion3.json",
          "FadeInTime": 0.5,
          "FadeOutTime": 0.5
        }
      ],
      "TapHead": [
        {
          "File": "motions/haru_g_m01.motion3.json",
          "FadeInTime": 0.3,
          "FadeOutTime": 0.3
        }
      ],
      "TapBody": [
        {
          "File": "motions/haru_g_m26.motion3.json",
          "FadeInTime": 0.5,
          "FadeOutTime": 0.5
        }
      ],
      "Special": [
        {
          "File": "motions/haru_g_m10.motion3.json",
          "FadeInTime": 0.5,
          "FadeOutTime": 0.5
        }
      ]
    }
  },
  "Groups": [
    {
      "Target": "Parameter",
      "Name": "EyeBlink",
      "Ids": [
        "ParamEyeLOpen",
        "ParamEyeROpen"
      ]
    }
  ],
  "HitAreas": [
    {
      "Id": "HitArea",
      "Name": "Head"
    },
    {
      "Id": "HitArea2",
      "Name": "Body"
    }
  ]
}
```

### 配置项说明

| 配置项 | 说明 |
|--------|------|
| `Moc` | 模型核心文件路径 |
| `Textures` | 纹理贴图数组 |
| `Physics` | 物理效果配置文件 |
| `Pose` | 姿势数据文件 |
| `Motions` | 动作配置 |
| `Groups` | 参数组（如眨眼） |
| `HitAreas` | 点击区域定义 |

---

## 动作类型

### Idle (空闲)
- 角色默认状态
- 循环播放
- 示例：`haru_g_idle.motion3.json`

### TapHead (点击头部)
- 用户点击头部时触发
- 快速过渡 (FadeInTime: 0.3)
- 示例：`haru_g_m01.motion3.json`

### TapBody (点击身体)
- 用户点击身体时触发
- 平滑过渡 (FadeInTime: 0.5)
- 示例：`haru_g_m26.motion3.json`

### Special (特殊动作)
- 双击触发
- 特殊效果动画
- 示例：`haru_g_m10.motion3.json`

### 动作配置参数

```json
{
  "File": "motions/haru_g_idle.motion3.json",
  "FadeInTime": 0.5,    // 淡入时间 (秒)
  "FadeOutTime": 0.5,   // 淡出时间 (秒)
  "Sound": "sounds/..." // 可选：音效文件
}
```

---

## 表情系统

### 表情配置

在 `.model3.json` 中添加 Expressions：

```json
"Expressions": [
  {
    "Name": "F01",
    "File": "expressions/F01.exp3.json"
  },
  {
    "Name": "F02",
    "File": "expressions/F02.exp3.json"
  }
]
```

### 表情映射

| 情绪 | 表情名称 | 说明 |
|------|---------|------|
| neutral | F01 | 中性表情 |
| happy | F02 | 开心表情 |
| sad | F03 | 伤心表情 |
| angry | F04 | 生气表情 |
| surprised | F05 | 惊讶表情 |
| blush | F06 | 害羞表情 |

### 在代码中使用表情

```typescript
// aiService.ts
export function getExpressionForEmotion(emotion: string): string {
  const emotionMap: { [key: string]: string } = {
    'neutral': 'F01',
    'happy': 'F02',
    'sad': 'F03',
    'angry': 'F04',
    'surprised': 'F05',
    'blush': 'F06',
  };
  return emotionMap[emotion] || 'F01';
}

// Live2DViewer.tsx
model.expression(expression);
```

---

## 添加新模型

### 步骤 1: 准备模型文件

将模型文件放入 `public/models/模型名/` 目录：

```
public/models/NewModel/
├── NewModel.moc3
├── NewModel.model3.json
├── NewModel.physics3.json
├── NewModel.2048/
│   └── texture_00.png
├── motions/
│   └── *.motion3.json
└── expressions/
    └── *.exp3.json
```

### 步骤 2: 配置模型

编辑 `NewModel.model3.json`，确保包含：

1. **Motions** 配置 (Idle, TapHead, TapBody, Special)
2. **HitAreas** 定义 (Head, Body)
3. **Expressions** 配置 (可选)

### 步骤 3: 更新应用代码

在 `Live2DViewer.tsx` 中添加模型映射：

```typescript
const modelMap: { [key: string]: string } = {
  '/models/Haru/Haru.model3.json': 'Haru',
  '/models/Hiyori/Hiyori.model3.json': 'Hiyori',
  '/models/NewModel/NewModel.model3.json': 'NewModel',  // 添加新模型
};
```

在 `App.tsx` 中添加模型选择按钮：

```tsx
<button
  style={selectedModel === '/models/NewModel/NewModel.model3.json' ? styles.modelBtnActive : styles.modelBtn}
  onClick={() => setSelectedModel('/models/NewModel/NewModel.model3.json')}
>
  <span style={styles.btnIndicator} />
  NewModel
</button>
```

### 步骤 4: 测试模型

1. 启动开发服务器
2. 在浏览器中打开应用
3. 选择新模型
4. 测试点击交互和表情切换

---

## 模型优化建议

### 性能优化

1. **纹理压缩**
   - 使用 WebP 格式减少文件大小
   - 合并纹理贴图减少 HTTP 请求

2. **动作文件优化**
   - 合并相似动作
   - 减少关键帧数量

3. **物理效果**
   - 根据需要启用/禁用物理效果
   - 简化物理配置

### 兼容性

- 确保模型使用 Cubism 4 格式
- 测试不同浏览器兼容性
- 验证移动端性能

---

## 常见问题

### 模型加载失败

**原因**：
- 文件路径错误
- 缺少必需文件
- 格式不兼容

**解决方案**：
1. 检查文件路径是否正确
2. 确认所有必需文件存在
3. 验证模型格式为 Cubism 4

### 动作不播放

**原因**：
- 动作名称拼写错误
- 动作文件路径错误
- 模型不支持该动作

**解决方案**：
1. 检查动作名称拼写
2. 验证动作文件路径
3. 确认模型配置包含该动作

### 表情不切换

**原因**：
- 表情文件未配置
- 表情名称映射错误
- 模型不支持表情

**解决方案**：
1. 检查 Expressions 配置
2. 验证表情映射表
3. 确认模型支持表情系统

---

## 参考资源

- [Live2D 官方文档](https://www.live2d.com/en/)
- [Cubism SDK 文档](https://docs.live2d.com/cubism-sdk-manual/)
- [pixi-live2d-display 文档](https://github.com/avgjs/pixi-live2d-display)
