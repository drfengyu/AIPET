# AIPET Windows 应用打包设计文档

**日期**: 2026-05-21
**作者**: Claude
**状态**: 待审查

---

## 1. 需求概述

### 1.1 目标
为 AIPET 桌面应用创建 Windows 平台的安装版和便携版，支持自动更新功能。

### 1.2 需求总结

| 需求项 | 配置 |
|--------|------|
| 目标平台 | Windows 仅 |
| 打包类型 | 安装版 (.exe) + 便携版 (.exe) |
| 自动更新 | ✅ 需要 |
| 代码签名 | ❌ 不需要 |
| 快捷方式 | 开始菜单 + 桌面快捷方式 |

---

## 2. 架构设计

### 2.1 打包配置 (electron-builder)

#### 安装版 (NSIS)
- 使用 NSIS 制作安装程序
- 创建开始菜单快捷方式
- 创建桌面快捷方式
- 支持卸载

#### 便携版
- 单文件 .exe
- 无需安装
- 直接运行

### 2.2 自动更新机制

使用 `electron-updater`:
- 应用启动时自动检查更新
- 后台下载新版本
- 用户确认后安装

---

## 3. 组件设计

### 3.1 electron-builder 配置

修改 `package.json` 中的 build 配置：

```json
{
  "build": {
    "appId": "com.live2d.chat",
    "productName": "AIPET",
    "win": {
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ],
      "icon": "build/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "AIPET"
    }
  }
}
```

### 3.2 自动更新模块

创建 `src/main/updater.ts`:
- 检查 GitHub Releases
- 下载新版本
- 提示用户更新

### 3.3 更新配置

在 `package.json` 中添加 publish 配置：
```json
{
  "publish": {
    "provider": "github",
    "owner": "your-username",
    "repo": "AIPET"
  }
}
```

---

## 4. 目录结构

```
dist/
├── main/           # Electron 主进程
├── renderer/       # React 渲染进程
├── installer/      # 安装程序 (AIPET-Setup-x.x.x.exe)
└── portable/       # 便携版 (AIPET-Portable-x.x.x.exe)
```

---

## 5. 数据流

```
用户下载安装程序
    ↓
运行安装程序
    ↓
创建开始菜单快捷方式
    ↓
创建桌面快捷方式
    ↓
应用启动
    ↓
检查更新 (electron-updater)
    ↓
有更新? → 下载并安装
    ↓
无更新 → 正常运行
```

---

## 6. 错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| 网络错误 | 提示用户检查网络连接 |
| 下载失败 | 提示重试 |
| 安装失败 | 提示用户手动安装 |
| 更新检查失败 | 静默失败，不影响主功能 |

---

## 7. 测试计划

1. ✅ 测试安装程序创建快捷方式
2. ✅ 测试便携版运行
3. ✅ 测试自动更新功能
4. ✅ 测试卸载功能

---

## 8. 实现步骤

1. 修改 `package.json` 中的 electron-builder 配置
2. 创建自动更新模块 `src/main/updater.ts`
3. 配置 GitHub Releases 发布
4. 测试安装版和便携版
5. 测试自动更新功能
6. 发布正式版本

---

## 9. 依赖项

- `electron-builder`: ^24.9.1 (已安装)
- `electron-updater`: 需要安装
- `build/icon.ico`: 需要创建图标文件

---

## 10. 注意事项

1. 代码签名未启用，用户可能看到安全警告
2. 自动更新依赖 GitHub Releases
3. 需要确保 `dist/main/main.mjs` 存在
4. 需要确保 `dist/renderer/` 目录完整
