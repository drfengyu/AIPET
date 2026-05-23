# AIPET 内存优化快速参考

## 🚀 快速启动

### 生产模式（推荐）
```powershell
.\scripts\start-optimized.ps1 -Mode prod
```
- 最小化内存占用
- 禁用所有日志
- 启用 GPU 加速

### 开发模式
```powershell
.\scripts\start-optimized.ps1 -Mode dev
```
- 启用所有调试功能
- 打开 DevTools
- 启用内存监控

### 性能测试
```powershell
.\scripts\start-optimized.ps1 -Mode perf
```
- 启用内存监控
- 启用诊断定时器
- 启用 GPU 加速

### GPU 问题修复
```powershell
.\scripts\start-optimized.ps1 -Mode gpu-fix
```
- 禁用 GPU 加速
- 使用软件光栅化

## 📊 性能对比

| 模式 | 内存占用 | CPU 占用 | 日志 | DevTools | GPU |
|------|---------|---------|------|----------|-----|
| prod | ↓ 40-60% | ↓ 50% | ❌ | ❌ | ✅ |
| dev | 基准 | 基准 | ✅ | ✅ | ✅ |
| perf | 基准 | ↓ 50% | ✅ | ❌ | ✅ |
| gpu-fix | ↓ 40% | 基准 | ❌ | ❌ | ❌ |

## 🔧 手动配置

### 环境变量
```powershell
$env:DEBUG = "true"           # 启用日志
$env:DISABLE_GPU = "false"    # 启用 GPU
$env:NODE_ENV = "production"  # 生产环境
yarn dev:electron
```

### 日志文件位置
```
C:\Users\Administrator\aipet-debug.log
C:\Users\Administrator\aipet-phase.log
```

## 📈 内存监控

启用 DEBUG 模式查看内存使用：
```powershell
$env:DEBUG = "true"
yarn dev:electron
```

输出示例：
```
Memory: RSS=250MB, Heap=120MB/180MB
Memory: RSS=255MB, Heap=125MB/180MB
```

## ⚡ 优化效果

| 优化项 | 改进 |
|--------|------|
| 禁用日志 | ↓ 10-20% 内存 |
| 禁用 DevTools | ↓ 30-50% 内存 |
| 启用 GPU | ↓ 50% CPU |
| 日志轮转 | 5MB 限制 |

## 🎯 推荐配置

### 日常使用
```powershell
.\scripts\start-optimized.ps1 -Mode prod
```

### 开发调试
```powershell
.\scripts\start-optimized.ps1 -Mode dev
```

### 性能测试
```powershell
.\scripts\start-optimized.ps1 -Mode perf
```

### GPU 问题
```powershell
.\scripts\start-optimized.ps1 -Mode gpu-fix
```

## 📝 文件位置

- 启动脚本：`scripts/start-optimized.ps1`
- 环境配置：`.env.optimization`
- 主进程：`src/main/main.mjs`
- 详细文档：`docs/MEMORY_OPTIMIZATION_FINAL.md`

---

**快速参考卡片** | AIPET 内存优化
