# MCP 配置文档

## MCP 简介

MCP (Model Context Protocol) 是一个用于扩展 AI 模型能力的协议，允许 AI 访问外部资源和工具。

## 已配置的 MCP 服务器

### 1. Filesystem Server

**用途**: 访问项目文件系统
**配置**:
```json
{
  "filesystem": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-filesystem", "e:\\Project\\Github\\AIPET"]
  }
}
```

**功能**:
- 读取项目文件
- 写入项目文件
- 列出目录内容
- 搜索文件

### 2. GitHub Server

**用途**: 访问 GitHub 仓库
**配置**:
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_TOKEN": ""
    }
  }
}
```

**功能**:
- 读取仓库信息
- 创建 Pull Request
- 管理 Issues

### 3. SQLite Server

**用途**: 访问聊天数据库
**配置**:
```json
{
  "sqlite": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sqlite", "e:\\Project\\Github\\AIPET\\data\\chat.db"],
    "env": {}
  }
}
```

**功能**:
- 查询聊天记录
- 管理用户数据
- 执行 SQL 查询

### 4. Fetch Server

**用途**: 发送 HTTP 请求
**配置**:
```json
{
  "fetch": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"],
    "env": {}
  }
}
```

**功能**:
- 发送 API 请求
- 获取外部数据
- 测试网络连接

## 配置文件位置

- **项目配置**: `e:\Project\Github\AIPET\.claude\settings.json`
- **全局配置**: `C:\Users\Administrator\.claude\settings.json`

## 使用方式

MCP 服务器会自动启动，AI 可以通过以下方式访问：

1. **文件系统访问**:
   - 读取项目文件
   - 写入项目文件
   - 搜索文件内容

2. **GitHub 访问**:
   - 查看仓库状态
   - 创建 Pull Request
   - 管理 Issues

## 项目文档

- **CLAUDE.md**: 项目主文档
- **ARCHITECTURE.md**: 项目架构图
- **INTEGRATION_LIVE2D.md**: Live2D 集成文档
- **TROUBLESHOOTING_LIVE2D.md**: 问题排查文档

## 下一步

1. 配置 GitHub Token（可选）
2. 测试 MCP 服务器功能
3. 添加更多 MCP 服务器（如数据库、API 等）
