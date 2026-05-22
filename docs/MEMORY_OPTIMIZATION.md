# AIPET 内存占用优化指南

## 问题诊断

### 发现的内存泄漏问题

#### 1. **调试日志持续写入** ⚠️ 高优先级
**位置：** `src/main/main.mjs` 第 16-26 行

```javascript
// 问题：每次调用都写入文件，没有大小限制
function debugLog(msg) {
  try {
    fs.appendFileSync(__debugLogFile, new Date().toISOString() + ' ' + msg + '\n');
  } catch (_) {}
}
```

**影响：**
- 日志文件不断增长
- 频繁的磁盘 I/O 操作
- 可能导致磁盘空间不足

**解决方案：**
- 添加日志文件大小限制
- 实现日志轮转（rotation）
- 在生产环境禁用详细日志

#### 2. **定时器没有清理** ⚠️ 中优先级
**位置：** `src/main/main.mjs` 第 161-175 行

```javascript
// 问题：定时器没有被清理，可能导致内存泄漏
const intervals = [2, 5, 10, 20];
intervals.forEach(sec => {
  setTimeout(() => {
    // ... 诊断代码
  }, sec * 1000);
});
```

**影响：**
- 定时器持续运行
- 如果窗口关闭，定时器仍在运行
- 可能导致内存泄漏

**解决方案：**
- 保存定时器 ID
- 在窗口关闭时清理定时器

#### 3. **开发工具持续打开** ⚠️ 中优先级
**位置：** `src/main/main.mjs` 第 136 行

```javascript
// 问题：开发环境中 DevTools 持续打开
mainWindow.webContents.openDevTools();
```

**影响：**
- DevTools 占用大量内存
- 渲染进程内存占用翻倍
- 影响应用性能

**解决方案：**
- 仅在需要时打开 DevTools
- 添加环境变量控制

#### 4. **Live2D 模型加载** ⚠️ 中优先级
**位置：** 渲染进程（React 组件）

**影响：**
- Live2D 模型文件较大
- WASM 运行时占用内存
- 多个模型同时加载

**解决方案：**
- 实现模型缓存
- 按需加载模型
- 卸载不使用的模型

#### 5. **GPU 禁用导致 CPU 占用高** ⚠️ 低优先级
**位置：** `src/main/main.mjs` 第 48-49 行

```javascript
// GPU 禁用可能导致 CPU 占用高
app.commandLine.appendSwitch('disable-gpu');
app.commandLine.appendSwitch('disable-software-rasterizer');
```

**影响：**
- CPU 使用率高
- 渲染性能下降
- 电池消耗快

## 优化方案

### 方案 1：改进日志系统

```javascript
// 实现日志轮转
class RotatingLogger {
  constructor(filePath, maxSize = 5 * 1024 * 1024) { // 5MB
    this.filePath = filePath;
    this.maxSize = maxSize;
  }

  log(msg) {
    try {
      const stats = fs.statSync(this.filePath);
      if (stats.size > this.maxSize) {
        // 轮转日志文件
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        fs.renameSync(this.filePath, `${this.filePath}.${timestamp}`);
      }
      fs.appendFileSync(this.filePath, new Date().toISOString() + ' ' + msg + '\n');
    } catch (_) {}
  }
}

const logger = new RotatingLogger(__debugLogFile);
```

### 方案 2：清理定时器

```javascript
function createWindow() {
  // ... 其他代码 ...

  // 保存定时器 ID
  const timers = [];
  const intervals = [2, 5, 10, 20];
  
  intervals.forEach(sec => {
    const timerId = setTimeout(() => {
      phaseLog('alive_' + sec + 's');
      debugLog('>>> ALIVE CHECK at ' + sec + 's');
      try {
        if (mainWindow && mainWindow.webContents) {
          const wc = mainWindow.webContents;
          debugLog('>>> IsLoading:' + wc.isLoading() + ' IsCrashed:' + wc.isCrashed() + ' IsDestroyed:' + wc.isDestroyed());
        }
      } catch (e) {
        debugLog('>>> alive check err: ' + e?.message);
      }
    }, sec * 1000);
    timers.push(timerId);
  });

  // 窗口关闭时清理定时器
  mainWindow.on('closed', () => {
    debugLog('Window closed');
    phaseLog('win_closed');
    timers.forEach(id => clearTimeout(id));
    mainWindow = null;
  });
}
```

### 方案 3：条件打开 DevTools

```javascript
function createWindow() {
  // ... 其他代码 ...

  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5174');
    
    // 仅在 DEBUG 环境变量设置时打开 DevTools
    if (process.env.DEBUG === 'true') {
      mainWindow.webContents.openDevTools();
    }
    
    debugLog('Development mode: loadURL http://localhost:5174');
  }
}
```

### 方案 4：Live2D 模型缓存

```javascript
// 在 React 组件中实现模型缓存
const modelCache = new Map();

async function loadLive2DModel(modelPath) {
  // 检查缓存
  if (modelCache.has(modelPath)) {
    return modelCache.get(modelPath);
  }

  // 加载模型
  const model = await loadModel(modelPath);
  
  // 缓存模型
  modelCache.set(modelPath, model);
  
  return model;
}

// 卸载不使用的模型
function unloadLive2DModel(modelPath) {
  if (modelCache.has(modelPath)) {
    const model = modelCache.get(modelPath);
    model.destroy(); // 释放资源
    modelCache.delete(modelPath);
  }
}
```

### 方案 5：启用 GPU 加速（可选）

```javascript
// 如果 GPU 驱动稳定，可以启用 GPU 加速
// app.commandLine.appendSwitch('disable-gpu');
// app.commandLine.appendSwitch('disable-software-rasterizer');

// 或者使用更精细的控制
app.commandLine.appendSwitch('enable-gpu-rasterization');
```

## 内存监控

### 添加内存监控

```javascript
// 在主进程中添加内存监控
function monitorMemory() {
  setInterval(() => {
    const memUsage = process.memoryUsage();
    console.log('Memory Usage:');
    console.log(`  RSS: ${Math.round(memUsage.rss / 1024 / 1024)} MB`);
    console.log(`  Heap Total: ${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`);
    console.log(`  Heap Used: ${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`);
    console.log(`  External: ${Math.round(memUsage.external / 1024 / 1024)} MB`);
  }, 10000); // 每 10 秒输出一次
}

if (process.env.NODE_ENV === 'development') {
  monitorMemory();
}
```

### 在渲染进程中监控

```javascript
// React 组件中添加内存监控
useEffect(() => {
  const interval = setInterval(() => {
    if (window.performance && window.performance.memory) {
      const mem = window.performance.memory;
      console.log('Renderer Memory:');
      console.log(`  Used: ${Math.round(mem.usedJSHeapSize / 1024 / 1024)} MB`);
      console.log(`  Limit: ${Math.round(mem.jsHeapSizeLimit / 1024 / 1024)} MB`);
    }
  }, 10000);

  return () => clearInterval(interval);
}, []);
```

## 性能优化检查清单

- [ ] 禁用或限制调试日志
- [ ] 清理未使用的定时器
- [ ] 条件打开 DevTools
- [ ] 实现 Live2D 模型缓存
- [ ] 启用 GPU 加速（如果稳定）
- [ ] 添加内存监控
- [ ] 定期检查内存泄漏
- [ ] 优化渲染性能
- [ ] 减少不必要的重新渲染

## 测试方法

### 1. 使用 Chrome DevTools

```bash
# 在开发环境中打开应用
yarn dev:electron

# 在 DevTools 中：
# - Performance 标签：记录内存使用
# - Memory 标签：检查堆快照
# - Console 标签：查看日志
```

### 2. 使用 Electron 性能分析

```javascript
// 在主进程中
const { performance } = require('perf_hooks');

performance.mark('app-start');
// ... 应用代码 ...
performance.mark('app-end');
performance.measure('app-duration', 'app-start', 'app-end');

const measure = performance.getEntriesByName('app-duration')[0];
console.log(`App startup time: ${measure.duration}ms`);
```

### 3. 使用任务管理器

- 打开 Windows 任务管理器
- 查看 AIPET 进程的内存占用
- 监控 CPU 使用率
- 检查是否有内存泄漏（持续增长）

## 预期改进

| 优化项 | 预期改进 |
|--------|---------|
| 禁用详细日志 | 减少 10-20% 内存占用 |
| 清理定时器 | 减少 5-10% 内存占用 |
| 禁用 DevTools | 减少 30-50% 内存占用 |
| Live2D 缓存 | 减少 20-30% 内存占用 |
| 启用 GPU 加速 | 减少 CPU 占用 50% |

## 参考资源

- [Electron 性能优化](https://www.electronjs.org/docs/tutorial/performance)
- [Chrome DevTools 内存分析](https://developer.chrome.com/docs/devtools/memory-problems/)
- [Node.js 内存管理](https://nodejs.org/en/docs/guides/simple-profiling/)

---

**最后更新：** 2026-05-22  
**维护者：** Claude Code  
**项目：** AIPET
