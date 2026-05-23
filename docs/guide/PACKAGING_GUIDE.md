# AIPET 安装版打包指南

## 📦 打包类型

项目支持两种 Windows 打包格式：

| 类型 | 说明 | 文件 | 优点 |
|------|------|------|------|
| **NSIS 安装版** | 标准安装程序 | `AIPET-0.1.0.exe` | 专业、可卸载、快捷方式 |
| **便携版** | 免安装版本 | `AIPET-Portable-0.1.0.exe` | 无需安装、即插即用 |

## 🚀 快速打包

### 1. 构建应用
```bash
# 构建前端和主进程
yarn build
```

### 2. 打包安装版
```bash
# 打包 NSIS 安装版（需要网络连接）
npx electron-builder --win

# 或使用 npm 脚本
npm run build
npx electron-builder --win
```

### 3. 打包便携版
```bash
# 打包便携版（需要网络连接）
npx electron-builder --win --portable

# 或同时打包两个版本
npx electron-builder --win --portable
```

### 4. 测试打包（不上传）
```bash
# 打包目录版（快速测试，不需要网络）
npx electron-builder --win --dir
```

## 📋 完整打包流程

### 步骤 1：准备环境
```bash
# 确保依赖已安装
yarn install

# 检查 Node.js 版本
node --version  # 需要 v16+

# 检查 electron-builder
npx electron-builder --version
```

### 步骤 2：构建应用
```bash
# 构建前端（React + Vite）
yarn build

# 输出：dist/renderer/index.html 等

# 构建主进程
npm run build:main

# 输出：dist/main/main.mjs 等
```

### 步骤 3：打包
```bash
# 方式 1：打包 NSIS 安装版
npx electron-builder --win

# 方式 2：打包便携版
npx electron-builder --win --portable

# 方式 3：同时打包两个版本
npx electron-builder --win --portable

# 方式 4：快速测试（不需要网络）
npx electron-builder --win --dir
```

### 步骤 4：验证输出
```bash
# 检查输出文件
ls -la dist/installer/

# 应该看到：
# AIPET-0.1.0.exe          (NSIS 安装版)
# AIPET-Portable-0.1.0.exe (便携版)
```

## 🔧 打包配置详解

### NSIS 安装版配置
```json
{
  "nsis": {
    "oneClick": false,                      // 不使用一键安装
    "allowToChangeInstallationDirectory": true,  // 允许选择安装目录
    "createDesktopShortcut": true,          // 创建桌面快捷方式
    "createStartMenuShortcut": true,        // 创建开始菜单快捷方式
    "shortcutName": "AIPET",                // 快捷方式名称
    "uninstallDisplayName": "AIPET"         // 卸载程序名称
  }
}
```

### 便携版配置
```json
{
  "portable": {
    "artifactName": "${productName}-Portable-${version}.${ext}"
  }
}
```

## 📊 打包输出

### 输出目录
```
dist/installer/
├── AIPET-0.1.0.exe              (NSIS 安装版)
├── AIPET-Portable-0.1.0.exe     (便携版)
└── builder-effective-config.yaml (打包配置)
```

### 文件大小预期
- NSIS 安装版：~150-200MB
- 便携版：~150-200MB

## 🎯 常用命令

### 完整打包流程（一键）
```bash
# 清理 → 构建 → 打包
yarn build && npx electron-builder --win --portable
```

### 仅打包 NSIS 版本
```bash
npx electron-builder --win
```

### 仅打包便携版本
```bash
npx electron-builder --win --portable
```

### 快速测试打包
```bash
npx electron-builder --win --dir
```

### 发布到 GitHub
```bash
npx electron-builder --win --publish always
```

## ⚙️ 环境要求

| 要求 | 版本 |
|------|------|
| Node.js | v16+ |
| npm/yarn | 最新版 |
| Windows | 7+ |
| 网络连接 | 需要（下载依赖） |

## 🔍 故障排查

### 问题 1：缺少 icon.ico
```bash
# 检查图标文件
ls -la build/icon.ico

# 如果缺少，创建一个
# 或使用默认图标
```

### 问题 2：打包失败
```bash
# 清理缓存
rm -rf dist/
rm -rf node_modules/.cache

# 重新安装依赖
yarn install

# 重新构建
yarn build

# 重新打包
npx electron-builder --win
```

### 问题 3：网络连接问题
```bash
# 使用本地打包（不需要网络）
npx electron-builder --win --dir

# 或设置代理
npm config set proxy [proxy-url]
```

### 问题 4：签名问题
```bash
# 跳过代码签名（开发用）
npx electron-builder --win --sign=false
```

## 📝 打包脚本

### 创建打包脚本 (package.json)
```json
{
  "scripts": {
    "build": "vite build && npm run build:main",
    "pack:nsis": "npm run build && npx electron-builder --win",
    "pack:portable": "npm run build && npx electron-builder --win --portable",
    "pack:all": "npm run build && npx electron-builder --win --portable",
    "pack:test": "npm run build && npx electron-builder --win --dir"
  }
}
```

### 使用脚本
```bash
# 打包 NSIS 版本
yarn pack:nsis

# 打包便携版本
yarn pack:portable

# 打包所有版本
yarn pack:all

# 快速测试
yarn pack:test
```

## 🚀 发布流程

### 1. 更新版本号
编辑 `package.json`：
```json
{
  "version": "0.2.0"
}
```

### 2. 构建应用
```bash
yarn build
```

### 3. 打包
```bash
npx electron-builder --win --portable
```

### 4. 测试安装版
- 运行 `AIPET-0.1.0.exe` 测试安装
- 运行 `AIPET-Portable-0.1.0.exe` 测试便携版

### 5. 发布到 GitHub
```bash
# 需要配置 GitHub token
npx electron-builder --win --publish always
```

## 📚 相关文档

- [Electron Builder 文档](https://www.electron.build/)
- [NSIS 配置](https://www.electron.build/configuration/nsis)
- [便携版配置](https://www.electron.build/configuration/portable)

## ✅ 打包检查清单

- [ ] 依赖已安装 (`yarn install`)
- [ ] 应用已构建 (`yarn build`)
- [ ] 图标文件存在 (`build/icon.ico`)
- [ ] 版本号已更新 (`package.json`)
- [ ] 环境变量已配置 (`.env`)
- [ ] 网络连接正常
- [ ] 磁盘空间充足 (>500MB)

## 🎯 推荐打包命令

### 开发测试
```bash
npx electron-builder --win --dir
```

### 发布前测试
```bash
npx electron-builder --win --portable
```

### 正式发布
```bash
npx electron-builder --win --portable --publish always
```

---

**打包指南** | AIPET v0.1.0  
**最后更新：** 2026-05-23
