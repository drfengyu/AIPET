---
title: Hermes Agent 使用指南
date: 2026-05-22
---

# Hermes Agent 使用指南

## 什么是 Hermes Agent？

Hermes Agent 是一个功能强大的 AI 助手，具有工具调用能力。它可以：
- 进行交互式对话
- 调用各种工具和技能
- 管理会话和配置
- 集成多个 AI 模型和提供商
- 支持 WhatsApp、Slack 等多个平台

**版本：** v0.14.0 (2026.5.16)

## 快速开始

### 1. 初始化设置

首次使用需要运行设置向导：

```bash
hermes setup
```

这会引导你配置：
- 选择 AI 模型和提供商
- 配置文本转语音 (TTS)
- 设置终端环境
- 配置网关
- 启用工具和技能
- 配置代理

### 2. 启动交互式聊天

```bash
hermes
```

或者使用更现代的 TUI 界面：

```bash
hermes --tui
```

### 3. 单次查询模式

发送单个问题并获取响应：

```bash
hermes chat -q "你好，请介绍一下自己"
```

## 常用命令

### 聊天相关

| 命令 | 说明 | 示例 |
|------|------|------|
| `hermes` | 启动交互式聊天 | `hermes` |
| `hermes --tui` | 启动现代 TUI 界面 | `hermes --tui` |
| `hermes chat -q "问题"` | 单次查询模式 | `hermes chat -q "今天天气如何"` |
| `hermes -z "问题"` | 一次性模式（仅输出结果） | `hermes -z "计算 2+2"` |
| `hermes -c` | 继续最近的会话 | `hermes -c` |
| `hermes -c "会话名"` | 按名称继续会话 | `hermes -c "项目讨论"` |
| `hermes --resume <ID>` | 按 ID 恢复会话 | `hermes --resume abc123` |

### 模型和提供商

| 命令 | 说明 |
|------|------|
| `hermes model` | 选择默认 AI 模型 |
| `hermes model list` | 列出可用模型 |
| `hermes fallback` | 管理备用提供商 |
| `hermes fallback add` | 添加备用提供商 |
| `hermes fallback remove` | 移除备用提供商 |

### 认证和凭证

| 命令 | 说明 |
|------|------|
| `hermes login` | 使用推理提供商进行身份验证 |
| `hermes logout` | 清除存储的身份验证 |
| `hermes auth list` | 列出所有凭证 |
| `hermes auth add <provider>` | 添加池化凭证 |
| `hermes auth remove <provider>` | 移除凭证 |
| `hermes auth reset <provider>` | 重置提供商状态 |

### 会话管理

| 命令 | 说明 |
|------|------|
| `hermes sessions list` | 列出所有过去的会话 |
| `hermes sessions browse` | 交互式会话选择器 |
| `hermes sessions rename <ID> <名称>` | 重命名会话 |
| `hermes sessions export <ID>` | 导出会话 |
| `hermes sessions delete <ID>` | 删除会话 |
| `hermes sessions prune` | 清理旧会话 |

### 配置管理

| 命令 | 说明 |
|------|------|
| `hermes config` | 查看配置 |
| `hermes config edit` | 在编辑器中编辑配置 |
| `hermes config set <key> <值>` | 设置配置值 |
| `hermes setup` | 运行完整设置向导 |
| `hermes setup --quick` | 快速设置（仅缺失项） |
| `hermes setup --reset` | 重置为默认配置 |

### 技能和工具

| 命令 | 说明 |
|------|------|
| `hermes skills` | 搜索和管理技能 |
| `hermes skills list` | 列出已安装的技能 |
| `hermes skills install <技能>` | 安装技能 |
| `hermes skills remove <技能>` | 移除技能 |
| `hermes tools` | 配置启用的工具 |
| `hermes bundles` | 管理技能包 |

### 日志和调试

| 命令 | 说明 |
|------|------|
| `hermes logs` | 查看最后 50 行日志 |
| `hermes logs -f` | 实时跟踪日志 |
| `hermes logs errors` | 查看错误日志 |
| `hermes logs --since 1h` | 查看最后 1 小时的日志 |
| `hermes doctor` | 检查配置和依赖 |
| `hermes dump` | 转储设置摘要 |
| `hermes debug` | 上传调试报告 |

### 其他命令

| 命令 | 说明 |
|------|------|
| `hermes version` | 显示版本信息 |
| `hermes update` | 更新到最新版本 |
| `hermes uninstall` | 卸载 Hermes Agent |
| `hermes status` | 显示所有组件状态 |
| `hermes dashboard` | 启动 Web UI 仪表板 |
| `hermes cron` | 管理定时任务 |
| `hermes webhook` | 管理 webhook |
| `hermes send` | 发送消息到配置的平台 |

## 高级用法

### 1. 使用特定模型

```bash
# 使用 Claude Sonnet 4.6
hermes chat -q "问题" -m anthropic/claude-sonnet-4.6

# 使用特定提供商
hermes chat -q "问题" --provider openrouter
```

### 2. 启用特定工具集

```bash
# 启用多个工具集
hermes chat -t "github,web-search,code-execution"
```

### 3. 预加载技能

```bash
# 预加载一个或多个技能
hermes -s hermes-agent-dev,github-auth
```

### 4. 在隔离的 Git 工作树中运行

```bash
# 为并行代理运行在隔离的工作树中
hermes --worktree
```

### 5. 自动批准钩子

```bash
# 在 CI/无头运行中自动批准钩子
hermes --accept-hooks
```

### 6. 一次性模式（用于脚本）

```bash
# 仅输出最终响应，适合脚本和管道
hermes -z "计算 2+2"
```

### 7. 启用详细输出

```bash
# 显示详细的调试信息
hermes chat -q "问题" -v
```

### 8. 安静模式

```bash
# 仅输出最终响应，用于编程使用
hermes chat -q "问题" -Q
```

## 配置文件

Hermes 的配置存储在 `~/.hermes/config.yaml` 中。

### 查看配置

```bash
hermes config
```

### 编辑配置

```bash
hermes config edit
```

### 常见配置项

```yaml
# 默认模型
model: anthropic/claude-sonnet-4.6

# 推理提供商
provider: anthropic

# 启用的工具集
toolsets:
  - github
  - web-search
  - code-execution

# 文本转语音配置
tts:
  enabled: true
  provider: elevenlabs

# 钩子配置
hooks_auto_accept: false

# 内存提供商
memory:
  provider: local
```

## 集成平台

### WhatsApp 集成

```bash
# 设置 WhatsApp 集成
hermes whatsapp
```

### Slack 集成

```bash
# 生成 Slack 清单
hermes slack
```

### 消息网关

```bash
# 运行消息网关
hermes gateway

# 安装为后台服务
hermes gateway install
```

## 会话管理

### 查看会话历史

```bash
# 列出所有会话
hermes sessions list

# 交互式浏览会话
hermes sessions browse
```

### 恢复会话

```bash
# 继续最近的会话
hermes -c

# 按名称继续
hermes -c "项目讨论"

# 按 ID 恢复
hermes --resume abc123def456
```

### 管理会话

```bash
# 重命名会话
hermes sessions rename <ID> "新名称"

# 导出会话
hermes sessions export <ID>

# 删除会话
hermes sessions delete <ID>

# 清理旧会话
hermes sessions prune
```

## 故障排查

### 检查状态

```bash
# 检查所有组件状态
hermes status

# 运行诊断
hermes doctor
```

### 查看日志

```bash
# 查看最后 50 行日志
hermes logs

# 实时跟踪日志
hermes logs -f

# 查看错误日志
hermes logs errors

# 查看最后 1 小时的日志
hermes logs --since 1h
```

### 获取帮助

```bash
# 查看特定命令的帮助
hermes <command> --help

# 例如
hermes chat --help
hermes setup --help
```

### 上传调试报告

```bash
# 上传调试信息供支持团队查看
hermes debug share
```

## 环境变量

| 变量 | 说明 |
|------|------|
| `HERMES_INFERENCE_MODEL` | 覆盖默认模型 |
| `HERMES_INFERENCE_PROVIDER` | 覆盖推理提供商 |
| `HERMES_ACCEPT_HOOKS` | 自动批准钩子 |
| `HERMES_HOME` | Hermes 主目录位置 |

## 常见用例

### 1. 代码审查

```bash
hermes chat -q "请审查这段代码：$(cat file.py)"
```

### 2. 文档生成

```bash
hermes -z "为以下函数生成文档：$(cat function.py)"
```

### 3. 错误调试

```bash
hermes chat -q "帮我调试这个错误：$(cat error.log)"
```

### 4. 脚本集成

```bash
#!/bin/bash
result=$(hermes -z "分析这个数据：$data")
echo "分析结果：$result"
```

### 5. 定时任务

```bash
# 设置定时任务
hermes cron add "0 9 * * *" "hermes -z '每日总结'"
```

## 最佳实践

1. **定期更新**
   ```bash
   hermes update
   ```

2. **备份配置**
   ```bash
   hermes backup
   ```

3. **监控日志**
   ```bash
   hermes logs -f
   ```

4. **定期清理会话**
   ```bash
   hermes sessions prune
   ```

5. **使用技能包**
   - 为不同项目创建技能包
   - 快速切换工具集

6. **配置钩子**
   - 在 `config.yaml` 中定义钩子
   - 自动化常见任务

## 获取帮助

- **完整帮助**：`hermes --help`
- **命令帮助**：`hermes <command> --help`
- **查看日志**：`hermes logs`
- **诊断**：`hermes doctor`
- **上传调试**：`hermes debug share`

---

**最后更新：** 2026-05-22  
**Hermes 版本：** v0.14.0  
**维护者：** Claude Code
