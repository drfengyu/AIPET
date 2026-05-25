# LobeHub lobe-vidol 市场架构调研

> 调研日期: 2026-05-25
> 来源: https://github.com/lobehub/lobe-vidol

## 一、整体架构

```
┌─ 市场 API ────────────────────────────────────┐
│ https://vidol-market.lobehub.com/agents        │
│   index.json          → 70 个模型列表          │
│   index.zh-CN.json    → 中文版模型列表         │
│   aponia.json         → 单个模型详情           │
└──────────────────────────────────────────────┘
        ↓ fetch + SWR (数据请求+缓存)
┌─ 市场发现页 ──────────────────────────────────┐
│ src/app/discover/page.tsx                     │
│   ├─ DiscoverList   ← 模型卡片网格             │
│   └─ MarketInfo     ← 右侧详情面板 + 订阅按钮  │
└──────────────────────────────────────────────┘
        ↓ 订阅/取消订阅
┌─ Zustand Store ───────────────────────────────┐
│ src/store/market/index.ts                     │
│   persist → localStorage                       │
│   已订阅模型列表 → 角色选择器                   │
└──────────────────────────────────────────────┘
        ↓ 模型切换
┌─ 模型渲染引擎 ────────────────────────────────┐
│ Live2D Cubism SDK (.model3.json)             │
│ VRM 3D (.vrm) ← 市场 70 个模型使用            │
│ 远程加载: https://r2.vidol.chat/...           │
└──────────────────────────────────────────────┘
```

## 二、关键文件

### 2.1 市场 API 服务
`src/services/agent.ts`

```typescript
const AGENT_MARKET_URL = 'https://vidol-market.lobehub.com/agents';

// 获取模型列表
getAgentIndex(locale) → GET /agents/index.{locale}.json
// 获取模型详情
getAgentDetail(id, locale) → GET /agents/{id}.{locale}.json
// 从 GitHub 下载额外模型
downloadGithubAgent(url) → POST /api/agent/download
```

### 2.2 市场数据格式

**index.json** — 模型列表:
```json
{
  "agents": [
    {
      "agentId": "aponia",
      "author": "rdmclin2",
      "homepage": "https://github.com/rdmclin2",
      "createAt": "2024-11-02",
      "meta": {
        "name": "阿波尼亚",
        "avatar": "https://r2.vidol.chat/...avatar.webp",
        "cover": "https://r2.vidol.chat/...cover.webp",
        "category": "Game",
        "description": "她被戒律所束缚..."
      }
    }
  ]
}
```

**{id}.json** — 模型详情:
```json
{
  "agentId": "aponia",
  "author": "rdmclin2",
  "systemRole": "请你扮演游戏<崩坏>中一个叫做阿波尼亚的角色...",
  "greeting": "你来了，我已在此等候多时...",
  "meta": {
    "name": "阿波尼亚",
    "avatar": "https://r2.vidol.chat/...webp",
    "cover": "https://r2.vidol.chat/...webp",
    "description": "...",
    "gender": "Female",
    "model": "https://r2.vidol.chat/...vrm"
  }
}
```

### 2.3 状态管理
`src/store/market/index.ts` — Zustand store
- localStorage Key: `vidol-chat-market-storage`
- Store Name: `VIDOL_MARKET_STORE`
- 分片: `slices/dance.ts` (舞蹈), 可扩展

### 2.4 发现页 UI
`src/app/discover/page.tsx`
- 使用 `useSWR` 请求数据 + 缓存
- 双栏布局: 左列表 + 右详情
- 订阅/取消订阅功能
- 国际化支持 (多语言 index.json)

### 2.5 模型加载
`src/libs/live2d/lappmodel.ts`
- 从 URL fetch arrayBuffer → 加载 Cubism 模型
- `lappdefine.ts` 定义了 ResourcesPath = `https://r2.vidol.chat/live2d/`
- 支持 7 个内置模型: Haru, Hiyori, Mark, Natori, Rice, Mao, Wanko
- 市场模型使用 .vrm (VRM 3D 格式)

## 三、关键设计决策

| 特性 | LobeHub 方案 | 对我们的启发 |
|------|-------------|------------|
| 模型存储 | Cloudflare R2 CDN | 可部署到任意 CDN / GitHub Pages |
| 数据格式 | JSON API，简单 REST | 可静态 JSON 文件托管 |
| 状态管理 | Zustand + persist | 轻量，localStorage 持久化 |
| 请求缓存 | SWR (stale-while-revalidate) | 减少重复请求 |
| 国际化 | locale 后缀切换 index 文件 | 可选的优化 |
| 订阅机制 | 添加到本地 store → 角色列表 | 直接使用 |
| 模型格式 | .vrm (3D) + .model3.json (Live2D) | 我们只支持 Live2D |
