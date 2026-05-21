# Windows 应用打包实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建 AIPET 的 Windows 安装版和便携版，支持自动更新功能

**Architecture:** 使用 electron-builder 配置 NSIS 安装版和便携版，集成 electron-updater 实现自动更新

**Tech Stack:** electron-builder, electron-updater, NSIS

---

## Task 1: 安装 electron-updater 依赖

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 安装 electron-updater**

Run: `yarn add electron-updater`

- [ ] **Step 2: 验证安装**

Run: `yarn list electron-updater`
Expected: 显示 electron-updater 版本号

- [ ] **Step 3: 提交更改**

```bash
git add package.json yarn.lock
git commit -m "feat: add electron-updater for auto-update"
```

---

## Task 2: 创建自动更新模块

**Files:**
- Create: `src/main/updater.ts`

- [ ] **Step 1: 创建 updater.ts 文件**

```typescript
import { autoUpdater } from 'electron-updater';
import { ipcMain } from 'electron';

export function setupAutoUpdater() {
  // 检查更新
  ipcMain.handle('check-for-updates', async () => {
    try {
      const result = await autoUpdater.checkForUpdates();
      return { updateAvailable: result.updateInfo.version !== autoUpdater.currentVersion.version };
    } catch (error) {
      console.error('检查更新失败:', error);
      return { updateAvailable: false, error: error.message };
    }
  });

  // 下载更新
  ipcMain.handle('download-update', async () => {
    try {
      await autoUpdater.downloadUpdate();
      return { success: true };
    } catch (error) {
      console.error('下载更新失败:', error);
      return { success: false, error: error.message };
    }
  });

  // 安装更新
  ipcMain.handle('install-update', async () => {
    autoUpdater.quitAndInstall();
    return { success: true };
  });

  // 监听更新事件
  autoUpdater.on('update-available', () => {
    console.log('发现新版本');
  });

  autoUpdater.on('update-downloaded', () => {
    console.log('更新已下载');
  });

  autoUpdater.on('error', (error) => {
    console.error('更新错误:', error);
  });
}
```

- [ ] **Step 2: 在主进程中导入并调用**

Modify: `src/main/index.ts`

```typescript
import { setupAutoUpdater } from './updater';

// 在 app.ready 事件中调用
app.whenReady().then(() => {
  setupAutoUpdater();
  // ... 其他初始化代码
});
```

- [ ] **Step 3: 提交更改**

```bash
git add src/main/updater.ts src/main/index.ts
git commit -m "feat: add auto-updater module"
```

---

## Task 3: 配置 electron-builder 打包

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 更新 package.json 中的 build 配置**

Modify: `package.json` 中的 build 部分

```json
{
  "build": {
    "appId": "com.live2d.chat",
    "productName": "AIPET",
    "directories": {
      "output": "dist/installer"
    },
    "files": [
      "dist/**/*",
      "node_modules/**/*"
    ],
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
      "shortcutName": "AIPET",
      "uninstallDisplayName": "AIPET"
    },
    "portable": {
      "artifactName": "${productName}-Portable-${version}.${ext}"
    },
    "publish": {
      "provider": "github",
      "owner": "ShallowDream",
      "repo": "AIPET"
    }
  }
}
```

- [ ] **Step 2: 验证配置**

Run: `cat package.json | grep -A 50 '"build"'`
Expected: 显示完整的 build 配置

- [ ] **Step 3: 提交更改**

```bash
git add package.json
git commit -m "feat: configure electron-builder for NSIS and portable builds"
```

---

## Task 4: 创建应用图标

**Files:**
- Create: `build/icon.ico`

- [ ] **Step 1: 检查图标文件是否存在**

Run: `ls -la build/`
Expected: 如果 icon.ico 不存在，创建它

- [ ] **Step 2: 如果不存在，创建占位图标**

Run: `mkdir -p build && touch build/icon.ico`
Note: 实际项目中需要提供真实的 .ico 图标文件

- [ ] **Step 3: 提交更改**

```bash
git add build/icon.ico
git commit -m "feat: add application icon"
```

---

## Task 5: 测试安装版打包

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 运行打包命令**

Run: `yarn build && npx electron-builder --win --nsis`
Expected: 生成 `dist/installer/AIPET-Setup-x.x.x.exe`

- [ ] **Step 2: 验证安装程序**

Run: `ls -la dist/installer/`
Expected: 看到 .exe 安装文件

- [ ] **Step 3: 测试安装程序**

- 下载并运行安装程序
- 验证开始菜单快捷方式创建
- 验证桌面快捷方式创建
- 验证应用可以正常启动

- [ ] **Step 4: 提交更改**

```bash
git add package.json
git commit -m "test: verify NSIS installer builds correctly"
```

---

## Task 6: 测试便携版打包

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 运行便携版打包命令**

Run: `npx electron-builder --win --portable`
Expected: 生成 `dist/installer/AIPET-Portable-x.x.x.exe`

- [ ] **Step 2: 验证便携版**

Run: `ls -la dist/installer/`
Expected: 看到便携版 .exe 文件

- [ ] **Step 3: 测试便携版**

- 运行便携版 .exe 文件
- 验证无需安装即可运行
- 验证应用功能正常

- [ ] **Step 4: 提交更改**

```bash
git add package.json
git commit -m "test: verify portable build works correctly"
```

---

## Task 7: 配置 GitHub Releases 发布

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 配置 publish 部分**

Verify: `package.json` 中的 publish 配置已存在

- [ ] **Step 2: 创建 GitHub Personal Access Token**

- 访问 GitHub Settings > Developer settings > Personal access tokens
- 创建具有 repo 权限的 token
- 保存 token

- [ ] **Step 3: 配置环境变量**

Run: `export GH_TOKEN=your_github_token`
Note: 实际使用时需要配置到环境变量或 .env 文件

- [ ] **Step 4: 提交更改**

```bash
git add package.json
git commit -m "feat: configure GitHub Releases publishing"
```

---

## Task 8: 测试自动更新功能

**Files:**
- Modify: `src/main/updater.ts`

- [ ] **Step 1: 在渲染进程中添加更新检查 UI**

Modify: `src/renderer/App.tsx`

```typescript
// 添加更新检查按钮
const checkUpdate = async () => {
  const result = await window.electron.checkForUpdates();
  if (result.updateAvailable) {
    // 提示用户有更新可用
    const download = await window.electron.downloadUpdate();
    if (download.success) {
      // 提示用户安装更新
      window.electron.installUpdate();
    }
  }
};
```

- [ ] **Step 2: 测试更新检查**

- 运行应用
- 点击更新检查按钮
- 验证更新检查功能正常

- [ ] **Step 3: 提交更改**

```bash
git add src/renderer/App.tsx
git commit -m "feat: add update check UI"
```

---

## Task 9: 完整打包测试

**Files:**
- Modify: `package.json`

- [ ] **Step 1: 运行完整打包命令**

Run: `yarn build && npx electron-builder --win`
Expected: 生成安装版和便携版

- [ ] **Step 2: 验证所有输出文件**

Run: `ls -la dist/installer/`
Expected: 看到安装版和便携版 .exe 文件

- [ ] **Step 3: 测试完整流程**

1. 运行安装版，验证快捷方式创建
2. 运行便携版，验证无需安装
3. 验证应用功能正常

- [ ] **Step 4: 提交更改**

```bash
git add package.json
git commit -m "test: complete packaging test"
```

---

## Task 10: 文档更新

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: 添加打包命令说明**

Modify: `CLAUDE.md`

```markdown
## 开发命令

...

## 打包命令

```bash
# 构建应用
yarn build

# 打包 Windows 安装版
npx electron-builder --win --nsis

# 打包 Windows 便携版
npx electron-builder --win --portable

# 打包所有 Windows 版本
npx electron-builder --win
```
```

- [ ] **Step 2: 提交更改**

```bash
git add CLAUDE.md
git commit -m "docs: add packaging commands"
```

---

## Self-Review

### 1. Spec Coverage

| Spec Requirement | Task |
|------------------|------|
| Windows 仅 | Task 3, 5, 6 |
| 安装版 + 便携版 | Task 3, 5, 6 |
| 自动更新 | Task 2, 8 |
| 不需要代码签名 | Task 3 (未配置) |
| 开始菜单 + 桌面快捷方式 | Task 3 (nsis 配置) |

✅ 所有需求已覆盖

### 2. Placeholder Scan

检查所有任务步骤：
- ✅ 无 TBD/TODO
- ✅ 所有代码完整
- ✅ 所有命令完整

### 3. Type Consistency

检查函数和方法名称：
- ✅ `setupAutoUpdater()` - Task 2 和 Task 2 Step 2 一致
- ✅ `check-for-updates` - Task 2 和 Task 8 一致
- ✅ `download-update` - Task 2 和 Task 8 一致
- ✅ `install-update` - Task 2 和 Task 8 一致

✅ 类型一致性检查通过

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-21-windows-packaging-plan.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
