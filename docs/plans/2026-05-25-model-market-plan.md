# AIPET 模型市场实现方案

> 目标: 从「本地 5 个固定模型」升级为「云端模型市场 + 本地订阅管理」
> 参考: lobehub/lobe-vidol 市场架构

---

## 整体架构

```
┌─ 模型市场数据源 ────────────────────┐
│ (静态 JSON，托管在 GitHub RAW / CDN) │
│   index.json       → 模型列表       │
│   {id}.json        → 模型详情       │
└───────────────────────────────────┘
        ↓ fetch
┌─ 市场服务层 ──────────────────────┐
│ src/services/marketService.ts      │
│   getModelIndex()                  │
│   getModelDetail(id)               │
└───────────────────────────────────┘
        ↓
┌─ 市场发现页 UI ───────────────────┐
│ MarketPanel.tsx                    │
│   ├─ 模型卡片网格 (封面+名称+分类) │
│   └─ 详情弹窗 (简介+订阅按钮)      │
└───────────────────────────────────┘
        ↓ 订阅
┌─ 订阅存储 ───────────────────────┐
│ localStorage: aipet-market-subs   │
│ 已订阅模型列表                     │
└───────────────────────────────────┘
        ↓
┌─ 模型加载 ───────────────────────┐
│ Live2DViewer 远程加载              │
│ 支持: CDN URL / 本地 public/models │
└───────────────────────────────────┘
```

---

## P0: 基础市场功能

### Task 1: 创建市场数据源

在 `public/market/` 下放置静态 JSON 文件:

**public/market/index.json** — 模型列表:
```json
{
  "models": [
    {
      "id": "haru",
      "name": "Haru",
      "category": "官方",
      "cover": "https://r2.vidol.chat/live2d/Haru/Haru.png",
      "description": "默认角色，活泼可爱的少女",
      "modelUrl": "https://r2.vidol.chat/live2d/Haru/Haru.model3.json",
      "localUrl": "./models/Haru/Haru.model3.json"
    }
  ]
}
```

> 初期数据源直接用 GitHub RAW 或项目内静态文件。
> 后续可迁移到独立 JSON API。

### Task 2: 创建 MarketService

`src/services/marketService.ts`

```typescript
export interface MarketModel {
  id: string;
  name: string;
  category: string;
  cover: string;
  description: string;
  modelUrl: string;     // 远程URL
  localUrl?: string;    // 本地回退
}

// 获取模型列表
export async function getModelIndex(): Promise<MarketModel[]>

// 获取已订阅模型列表 (localStorage)
export function getSubscribedModels(): MarketModel[]

// 订阅/取消订阅
export function subscribeModel(model: MarketModel): void
export function unsubscribeModel(id: string): void

// 检查是否已订阅
export function isSubscribed(id: string): boolean
```

### Task 3: 创建 MarketPanel 组件

`src/components/MarketPanel.tsx`

参照 lobe-vidol 的 DiscoverList 设计:

```
┌──────────────────────────────────────┐
│  📦 模型市场                          │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐   │
│  │图片  │ │图片  │ │图片  │ │图片  │   │
│  │Haru  │ │Hiyori│ │Mao   │ │Mark  │   │
│  │官方   │ │官方   │ │社区   │ │社区   │   │
│  │已订阅 │ │订阅   │ │订阅   │ │订阅   │   │
│  └─────┘ └─────┘ └─────┘ └─────┘   │
│                                      │
│  [点击模型 → 弹出详情]                │
└──────────────────────────────────────┘
```

功能:
- 从 MarketService 获取模型列表
- 卡片网格展示 (封面/名称/分类/订阅状态)
- 搜索/分类筛选
- 点击卡片 → 详情弹窗
- 订阅/取消订阅按钮

### Task 4: 集成到 App.tsx

- 顶部栏加 📦 市场 按钮
- 点击打开 MarketPanel
- 已订阅模型合入模型选择器

### Task 5: 模型远程加载支持

修改 Live2DViewer，当传入 URL 时远程加载:
```typescript
// 判断是远程URL还是本地路径
const isRemote = modelUrl.startsWith('http');
const url = isRemote ? modelUrl : `${basePath}${modelUrl}`;
```

---

## P1: 增强功能

### Task 6: 社区模型提交
- 模型提交表单 (名称/模型URL/封面/描述)
- GitHub Issue / PR 自动收录

### Task 7: 模型分类与搜索
- 分类标签: 官方/社区/游戏/动漫
- 搜索框
- 排序: 热门/最新

### Task 8: 模型自动更新
- 后台检查市场更新
- 有新模型时 badge 提示

---

## 技术要点

### 模型数据源
初期用 `public/market/index.json` 静态文件
后续迁移到独立服务:
```
https://aipet-market.example.com/api/models
```

### 本地存储
```typescript
const STORAGE_KEY = 'aipet-market-subscriptions';
// 存储已订阅模型 ID 列表
// 模型详情在需要时从市场 API 获取
```

### 模型加载
```typescript
// 优先本地 → 远程 fallback
const modelToLoad = isSubscribed(id) 
  ? model.localUrl || model.modelUrl
  : model.modelUrl;
```

### UI 参考
- lobe-vidol 的 DiscoverList → 卡片网格布局
- 封面/名称/分类/订阅状态
- 点击展开详情
- 订阅按钮带动画
