---
title: 解决 Hermes 和 Claude 命令无法识别的问题
date: 2026-05-22
tags:
  - hermes
  - claude
  - npm
  - 环境配置
  - 故障排查
categories:
  - 开发工具
  - 环境配置
description: 详细记录 hermes 和 claude 命令无法在终端中识别的问题诊断和解决过程
---

## 问题描述

在 AIPET 项目开发过程中，遇到了 PowerShell 终端中 `hermes` 和 `claude` 命令无法识别的问题。

```
PS> hermes --version
hermes : 无法将"hermes"项识别为 cmdlet、函数、脚本文件或可运行程序的名称。

PS> claude --version
claude : 无法将"claude"项识别为 cmdlet、函数、脚本文件或可运行程序的名称。
```

## 根本原因分析

### 问题 1：npm 全局配置被污染

**症状：**
- 项目目录下出现 `.npm-global` 文件夹
- `git status` 显示 `?? .npm-global/`

**根本原因：**
用户的全局 npm 配置文件 `~/.npmrc` 被设置为：
```
prefix=E:/Project/Github/AIPET/.npm-global
```

这导致所有全局 npm 包都被安装到项目目录下，而不是系统全局位置。

**影响：**
- claude CLI 被安装到 `.npm-global` 文件夹
- 系统 PATH 环境变量无法找到 claude 命令
- 项目被污染，不应该提交这个文件夹到版本控制

### 问题 2：hermes 命令路径不在 PATH 中

**症状：**
- hermes 是一个 Python 脚本，位于 `C:\Users\Administrator\AppData\Local\hermes\hermes-agent\hermes`
- 这个路径不在系统 PATH 环境变量中
- 终端无法找到 hermes 命令

**根本原因：**
hermes 作为一个本地开发工具，其可执行文件路径没有被添加到 PATH 环境变量。

### 问题 3：hermes 缺少 Python 依赖

**症状：**
```
ModuleNotFoundError: No module named 'dotenv'
```

**根本原因：**
hermes 作为 Python 项目，需要安装其依赖包，但没有被正确安装。

## 解决方案

### 步骤 1：修复 npm 全局配置

删除 npm 配置中的 `prefix` 设置，恢复到默认的全局位置：

```bash
npm config delete prefix
```

验证配置已修复：
```bash
npm config get prefix
# 应该输出默认位置，如 C:\Users\Administrator\AppData\Roaming\npm
```

### 步骤 2：删除项目污染文件

删除项目目录下的 `.npm-global` 文件夹：

```bash
rm -rf .npm-global
```

### 步骤 3：重新安装 claude CLI

将 claude CLI 重新安装到正确的全局位置：

```bash
npm install -g @anthropic-ai/claude-code
```

验证安装：
```bash
claude --version
# 输出：2.1.148 (Claude Code)
```

### 步骤 4：配置 hermes 命令

创建 hermes 命令包装脚本，使其在任何地方都可用：

在 `C:\Users\Administrator\AppData\Roaming\npm\` 目录下创建 `hermes.cmd` 文件：

```batch
@echo off
python "C:\Users\Administrator\AppData\Local\hermes\hermes-agent\hermes" %*
```

这个目录已经在 PATH 中，所以 hermes 命令现在可以被识别。

### 步骤 5：安装 hermes 依赖

进入 hermes-agent 目录并安装所有依赖：

```bash
cd C:\Users\Administrator\AppData\Local\hermes\hermes-agent
python -m pip install -e .
```

验证安装：
```bash
hermes --version
# 输出：Hermes Agent v0.14.0 (2026.5.16)
```

## 验证结果

| 命令 | 状态 | 输出 |
|------|------|------|
| `claude --version` | ✅ 正常 | 2.1.148 (Claude Code) |
| `hermes --version` | ✅ 正常 | Hermes Agent v0.14.0 (2026.5.16) |
| `hermes --help` | ✅ 正常 | 显示完整的命令列表 |

## 关键要点

1. **npm 配置管理**
   - 不要在项目目录中设置全局 npm 前缀
   - 使用 `npm config list` 检查配置
   - 使用 `npm config delete <key>` 删除不需要的配置

2. **PATH 环境变量**
   - 确保全局命令行工具的路径在 PATH 中
   - 对于本地工具，可以创建包装脚本放在已有的 PATH 位置
   - 修改 PATH 后需要重启终端才能生效

3. **Python 项目依赖**
   - 使用 `pip install -e .` 安装可编辑模式的包
   - 这样可以在开发时直接使用最新的代码
   - 确保所有依赖都被正确安装

4. **版本控制**
   - 不要提交 `.npm-global` 等本地工具目录
   - 在 `.gitignore` 中添加这些目录
   - 保持项目目录的清洁

## 预防措施

为了避免类似问题，建议：

1. **定期检查 npm 配置**
   ```bash
   npm config list
   ```

2. **使用 .gitignore 排除本地文件**
   ```
   .npm-global/
   node_modules/
   dist/
   ```

3. **文档化环境设置**
   - 在 CLAUDE.md 或 README 中记录必要的环境配置
   - 提供一键安装脚本

4. **使用版本管理工具**
   - 使用 nvm 管理 Node.js 版本
   - 使用 pyenv 管理 Python 版本

## 参考资源

- [npm config 文档](https://docs.npmjs.com/cli/v8/commands/npm-config)
- [PATH 环境变量 (Windows)](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/path)
- [Python pip 文档](https://pip.pypa.io/en/stable/reference/pip_install/)

---

**更新时间：** 2026-05-22  
**作者：** Claude Code  
**项目：** AIPET
