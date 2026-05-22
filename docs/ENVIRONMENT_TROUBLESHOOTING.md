---
title: 环境配置故障排查指南
date: 2026-05-22
---

# 环境配置故障排查指南

## 问题概述

本文档记录了 AIPET 项目中遇到的 `hermes` 和 `claude` 命令无法识别的问题，以及完整的诊断和解决方案。

## 问题症状

### Claude 命令无法执行
```powershell
PS> claude --version
claude : 无法将"claude"项识别为 cmdlet、函数、脚本文件或可运行程序的名称。
```

### Hermes 命令无法执行
```powershell
PS> hermes --version
hermes : 无法将"hermes"项识别为 cmdlet、函数、脚本文件或可运行程序的名称。
```

### 项目目录被污染
```
git status 显示：
?? .npm-global/
```

## 根本原因

### 原因 1：npm 全局配置被污染

**问题：** `~/.npmrc` 文件中包含错误的全局前缀配置

```ini
# ~/.npmrc 中的错误配置
prefix=E:/Project/Github/AIPET/.npm-global
```

**影响：**
- 所有全局 npm 包都被安装到项目目录下
- claude CLI 被安装到 `.npm-global` 文件夹
- 系统 PATH 无法找到 claude 命令
- 项目被污染，`.npm-global` 文件夹不应该提交

### 原因 2：hermes 路径不在 PATH 中

**问题：** hermes 是一个 Python 脚本，位于本地目录

```
C:\Users\Administrator\AppData\Local\hermes\hermes-agent\hermes
```

**影响：**
- 这个路径没有被添加到系统 PATH 环境变量
- 终端无法找到 hermes 命令

### 原因 3：hermes 缺少 Python 依赖

**问题：** hermes 作为 Python 项目，依赖没有被安装

```
ModuleNotFoundError: No module named 'dotenv'
```

**影响：**
- 即使命令被识别，也无法正常运行

## 解决方案

### 步骤 1：修复 npm 配置

删除错误的全局前缀设置：

```bash
npm config delete prefix
```

验证配置已修复：

```bash
npm config get prefix
# 应该输出默认位置
```

### 步骤 2：清理项目污染

删除项目目录下的 `.npm-global` 文件夹：

```bash
rm -rf .npm-global
```

### 步骤 3：重新安装 Claude CLI

```bash
npm install -g @anthropic-ai/claude-code
```

验证：

```bash
claude --version
# 输出：2.1.148 (Claude Code)
```

### 步骤 4：配置 Hermes 命令

在 `C:\Users\Administrator\AppData\Roaming\npm\` 目录下创建 `hermes.cmd` 文件：

```batch
@echo off
python "C:\Users\Administrator\AppData\Local\hermes\hermes-agent\hermes" %*
```

**说明：** `C:\Users\Administrator\AppData\Roaming\npm\` 已经在 PATH 中，所以这个包装脚本会被自动识别。

### 步骤 5：安装 Hermes 依赖

```bash
cd C:\Users\Administrator\AppData\Local\hermes\hermes-agent
python -m pip install -e .
```

验证：

```bash
hermes --version
# 输出：Hermes Agent v0.14.0 (2026.5.16)
```

## 验证清单

- [ ] `npm config get prefix` 返回默认位置
- [ ] `.npm-global` 文件夹已删除
- [ ] `claude --version` 正常输出
- [ ] `hermes --version` 正常输出
- [ ] `hermes --help` 显示完整命令列表
- [ ] PowerShell 已重启（修改 PATH 后需要重启）

## 预防措施

### 1. 定期检查 npm 配置

```bash
npm config list
```

### 2. 更新 .gitignore

确保以下内容在 `.gitignore` 中：

```
.npm-global/
node_modules/
dist/
.env
```

### 3. 文档化环境要求

在项目 README 或 CLAUDE.md 中记录：
- Node.js 版本要求
- Python 版本要求
- 必要的全局工具

### 4. 提供一键安装脚本

创建 `scripts/setup-env.sh` 或 `scripts/setup-env.ps1` 来自动化环境配置。

## 常见问题

### Q: 修改 PATH 后命令仍然无法识别？
**A:** 需要重启 PowerShell 或终端，让其重新加载 PATH 环境变量。

### Q: 如何检查 PATH 环境变量？
**A:** 在 PowerShell 中运行：
```powershell
$env:PATH -split ';'
```

### Q: npm 全局包安装在哪里？
**A:** 运行以下命令查看：
```bash
npm config get prefix
```

### Q: 如何卸载全局 npm 包？
**A:** 
```bash
npm uninstall -g @anthropic-ai/claude-code
```

## 相关文档

- [npm 配置文档](https://docs.npmjs.com/cli/v8/commands/npm-config)
- [Windows PATH 环境变量](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/path)
- [Python pip 文档](https://pip.pypa.io/en/stable/reference/pip_install/)

## 更新历史

| 日期 | 版本 | 变更 |
|------|------|------|
| 2026-05-22 | 1.0 | 初始版本，记录 hermes 和 claude 命令问题的诊断和解决方案 |

---

**最后更新：** 2026-05-22  
**维护者：** Claude Code  
**项目：** AIPET
