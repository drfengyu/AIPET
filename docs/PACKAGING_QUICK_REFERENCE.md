# AIPET 打包快速参考

## 🚀 一键打包

### 打包 NSIS 安装版
```bash
yarn build && npx electron-builder --win
```

### 打包便携版
```bash
yarn build && npx electron-builder --win --portable
```

### 打包所有版本
```bash
yarn build && npx electron-builder --win --portable
```

### 快速测试（不需要网络）
```bash
yarn build && npx electron-builder --win --dir
```

## 📦 输出文件

| 文件 | 说明 |
|------|------|
| `AIPET-0.1.0.exe` | NSIS 安装版 |
| `AIPET-Portable-0.1.0.exe` | 便携版 |

**输出位置：** `dist/installer/`

## 📋 打包步骤

### 1️⃣ 构建应用
```bash
yarn build
```

### 2️⃣ 打包
```bash
# 选择一种方式：

# 方式 A：NSIS 安装版
npx electron-builder --win

# 方式 B：便携版
npx electron-builder --win --portable

# 方式 C：两个版本都打包
npx electron-builder --win --portable

# 方式 D：快速测试
npx electron-builder --win --dir
```

### 3️⃣ 验证
```bash
ls -la dist/installer/
```

## ⚙️ 环境要求

- ✅ Node.js v16+
- ✅ 网络连接（下载依赖）
- ✅ 磁盘空间 >500MB
- ✅ Windows 7+

## 🎯 常用场景

### 开发测试
```bash
npx electron-builder --win --dir
```
**特点：** 快速、不需要网络、输出到 `dist/win-unpacked/`

### 发布前测试
```bash
npx electron-builder --win --portable
```
**特点：** 生成便携版、可直接运行测试

### 正式发布
```bash
npx electron-builder --win --portable
```
**特点：** 生成安装版和便携版、可上传到 GitHub

## 📊 打包时间

| 操作 | 时间 |
|------|------|
| 构建应用 | ~30-60s |
| 打包 NSIS | ~2-5 分钟 |
| 打包便携版 | ~2-5 分钟 |
| 两个版本 | ~4-10 分钟 |

## 🔍 故障排查

### 打包失败
```bash
# 清理缓存
rm -rf dist/ node_modules/.cache

# 重新安装
yarn install

# 重新构建
yarn build

# 重新打包
npx electron-builder --win
```

### 缺少图标
```bash
# 检查图标
ls -la build/icon.ico

# 如果缺少，创建或下载一个
```

### 网络问题
```bash
# 使用本地打包（不需要网络）
npx electron-builder --win --dir
```

## 📝 npm 脚本

在 `package.json` 中添加：

```json
{
  "scripts": {
    "pack:nsis": "yarn build && npx electron-builder --win",
    "pack:portable": "yarn build && npx electron-builder --win --portable",
    "pack:all": "yarn build && npx electron-builder --win --portable",
    "pack:test": "yarn build && npx electron-builder --win --dir"
  }
}
```

使用：
```bash
yarn pack:nsis      # 打包 NSIS
yarn pack:portable  # 打包便携版
yarn pack:all       # 打包所有
yarn pack:test      # 快速测试
```

## 📚 详细文档

完整打包指南：`docs/PACKAGING_GUIDE.md`

---

**快速参考** | AIPET 打包  
**最后更新：** 2026-05-23
