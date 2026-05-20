# 分工规则配置文档

## 概述

本项目已配置自动分工规则，让不同的 AI 代理和技能能够根据任务类型自动分配角色。

## 分工角色

### 1. 前端开发角色

**负责范围**:
- `src/renderer/` - React 渲染进程
- `public/` - 静态资源
- `src/renderer/components/` - React 组件
- `src/renderer/App.tsx` - 主应用组件

**技术栈**:
- React + TypeScript
- Vite 构建工具
- Live2D 集成 (Pixi.js)

**典型任务**:
- 创建/修改 React 组件
- 设计 UI 界面
- 集成 Live2D 模型
- 优化前端性能

### 2. 后端开发角色

**负责范围**:
- `src/main/` - Electron 主进程
- `src/agents/` - AI 代理系统
- `src/main/index.ts` - 主进程入口
- `src/main/preload.ts` - 预加载脚本

**技术栈**:
- Electron 桌面应用
- Node.js + Express
- AI 代理 (Cloudflare Agents)

**典型任务**:
- 实现 Electron 窗口管理
- 开发 AI 代理逻辑
- 集成后端服务
- 处理 IPC 通信

### 3. 测试角色

**负责范围**:
- `src/agents/test-*` - 测试代理
- `*.test.*` - 测试文件
- `src/agents/TestAgent.ts` - 测试代理实现

**技术栈**:
- Jest 测试框架
- 单元测试
- 集成测试

**典型任务**:
- 编写单元测试
- 执行集成测试
- 性能测试
- Bug 检测

### 4. 部署角色

**负责范围**:
- `package.json` - 项目配置
- `vite.config.ts` - Vite 配置
- `electron-builder.json` - 打包配置
- `wrangler.jsonc` - Cloudflare 配置

**技术栈**:
- Electron Builder
- Vite 构建
- Cloudflare Workers

**典型任务**:
- 构建应用
- 打包发布
- 版本管理
- 发布文档

## 自动分工规则

### 文件编辑分工

当执行文件编辑操作时，系统会自动分析文件路径并分配角色：

```json
{
  "PreToolUse": {
    "matcher": "Write|Edit",
    "hooks": [{
      "type": "prompt",
      "prompt": "分析文件路径，判断应该由哪个角色处理..."
    }]
  }
}
```

### 命令执行分工

当执行 Bash 命令时，系统会自动分析命令内容并分配角色：

```json
{
  "PreToolUse": {
    "matcher": "Bash",
    "hooks": [{
      "type": "prompt",
      "prompt": "分析命令，判断应该由哪个角色处理..."
    }]
  }
}
```

## 分工日志

系统会记录所有分工决策到 `.claude/division-log.txt` 文件：

```
分工规则: 文件 src/renderer/App.tsx 已由前端开发角色处理
分工规则: 命令已执行
```

## 使用示例

### 示例 1: 修改前端组件

**用户请求**: "修改聊天窗口组件"

**系统分析**:
- 文件路径: `src/renderer/components/ChatWindow.tsx`
- 属于 `src/renderer/components/` 目录
- 分配角色: **前端开发**

**执行结果**: 前端开发角色处理组件修改

### 示例 2: 运行开发服务器

**用户请求**: "启动开发服务器"

**系统分析**:
- 命令: `yarn dev:vite`
- 属于前端开发命令
- 分配角色: **前端开发**

**执行结果**: 前端开发角色启动 Vite 服务器

### 示例 3: 运行测试

**用户请求**: "运行单元测试"

**系统分析**:
- 命令: `yarn test`
- 属于测试命令
- 分配角色: **测试**

**执行结果**: 测试角色执行测试套件

### 示例 4: 构建应用

**用户请求**: "构建应用"

**系统分析**:
- 命令: `yarn build`
- 属于部署命令
- 分配角色: **部署**

**执行结果**: 部署角色构建应用

## 配置文件

### .claude/settings.json

分工规则配置在 `.claude/settings.json` 文件中：

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "prompt",
            "prompt": "分析文件路径，判断应该由哪个角色处理..."
          }
        ]
      }
    ]
  }
}
```

### 分工日志文件

- **位置**: `.claude/division-log.txt`
- **用途**: 记录所有分工决策
- **格式**: 时间戳 + 角色 + 操作

## 扩展分工规则

### 添加新角色

可以在 `PreToolUse` hooks 中添加新角色的判断逻辑：

```json
{
  "matcher": "Write|Edit",
  "hooks": [
    {
      "type": "prompt",
      "prompt": "分析文件路径，判断角色：\n- 新角色: 负责特定目录\n\n返回 JSON: {\"role\": \"角色名称\", \"reason\": \"判断原因\"}"
    }
  ]
}
```

### 自定义分工逻辑

可以根据项目需求自定义分工逻辑：

1. **按文件扩展名分工**: `.tsx` → 前端, `.ts` → 后端
2. **按目录分工**: `src/renderer/` → 前端, `src/main/` → 后端
3. **按命令类型分工**: `dev:*` → 开发, `build:*` → 部署

## 故障排除

### 分工规则不生效

1. **检查配置文件**: 确保 `.claude/settings.json` 格式正确
2. **检查日志文件**: 查看 `.claude/division-log.txt` 是否有记录
3. **重启 Claude**: 重新加载配置文件

### 分配错误角色

1. **检查判断逻辑**: 确认 prompt 中的判断规则是否正确
2. **更新规则**: 修改 prompt 中的判断条件
3. **测试规则**: 使用测试用例验证规则

## 项目状态

| 模块 | 状态 |
|------|------|
| 技能安装 | ✅ 完成 |
| 代理架构 | ✅ 完成 |
| 依赖安装 | ✅ 完成 |
| 前端界面 | ✅ 完成 |
| Live2D集成 | ✅ 完成 |
| MCP配置 | ✅ 完成 |
| 分工规则 | ✅ 完成 |
| AI对话功能 | ⏳ 准备中 |
| 桌面应用打包 | ⏳ 准备中 |
