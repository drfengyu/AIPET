# AIPET Agents 系统指南

## 概述

AIPET Agents 系统集成了 Superpowers 和 Hermes 技能，用于自动化项目管理和开发流程。

## 已安装的技能

### Superpowers 技能

1. **systematic-debugging** - 系统调试技能
   - 用于调试和故障排除
   - 安装位置: `~\.agents\skills\systematic-debugging`

### Hermes 技能

1. **dogfood** - 探索性 QA 技能
   - 用于 Web 应用的探索性测试
   - 安装位置: `~\.agents\skills\dogfood`

## 代理系统

### ProjectManagerAgent
- 项目管理代理
- 负责任务分配和工作流管理

### FrontendAgent
- 前端开发代理
- 负责 Live2D 集成和界面开发

### BackendAgent
- 后端开发代理
- 负责 AI 服务和 API 开发

### TestAgent
- 测试代理
- 负责单元测试和集成测试

### DeployAgent
- 部署代理
- 负责应用构建和发布

## 使用方法

### 1. 查看已安装的技能

```bash
npx skills list -g
```

### 2. 使用 Superpowers 技能

```bash
# 使用系统调试技能
/superpowers debugging
```

### 3. 使用 Hermes 技能

```bash
# 使用探索性 QA 技能
/hermes dogfood
```

### 4. 运行代理示例

```bash
# 运行代理使用示例
npx ts-node examples/usage-example.ts
```

## 项目结构

```
src/agents/
├── index.ts           # 代理系统入口
├── project-manager.ts # 项目管理代理
├── frontend-agent.ts  # 前端开发代理
├── backend-agent.ts   # 后端开发代理
├── test-agent.ts      # 测试代理
├── deploy-agent.ts    # 部署代理
└── worker.ts          # Cloudflare Workers worker
```

## Cloudflare Workers 部署

### 配置

编辑 `wrangler.jsonc` 文件：

```jsonc
{
  "name": "aipet-agents",
  "main": "src/agents/worker.ts",
  "compatibility_date": "2024-01-01",
  "compatibility_flags": ["nodejs_compat"],
  // ... 其他配置
}
```

### 部署

```bash
# 构建并部署到 Cloudflare Workers
npm run build:agents
```

## API 端点

- `GET /health` - 健康检查
- `GET /api/agents` - 获取代理列表

## 注意事项

1. **权限**: 技能运行时具有完整代理权限，请谨慎使用
2. **安全**: 定期审查已安装的技能
3. **更新**: 使用 `npx skills update` 更新技能

## 相关链接

- [Superpowers 技能](https://skills.sh/obra/superpowers)
- [Hermes 技能](https://skills.sh/nousresearch/hermes-agent)
- [Cloudflare Agents SDK](https://agents-sdk.cloudflare.com/)
