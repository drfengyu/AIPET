# 常见问题排查

## 目录
- [CORS 错误](#cors-错误)
- [AI 服务无法连接](#ai-服务无法连接)
- [Live2D 模型加载失败](#live2d-模型加载失败)
- [表情切换不生效](#表情切换不生效)
- [代理服务器启动失败](#代理服务器启动失败)

---

## CORS 错误

### 症状
浏览器控制台显示：
```
Access to fetch at 'https://api.cloudflare.com/...' from origin 'http://localhost:5200' 
has been blocked by CORS policy
```

### 原因
Cloudflare Workers AI API 不支持浏览器直接跨域访问。

### 解决方案
1. 确保代理服务器已启动：
   ```bash
   node src/main/ai-proxy.js
   ```

2. 检查代理服务器端口 (默认 3002)：
   ```bash
   curl http://localhost:3002/health
   ```

3. 确认 aiService.ts 使用代理服务器：
   ```typescript
   PROXY_ENDPOINT: 'http://localhost:3002/api/ai/chat'
   ```

---

## AI 服务无法连接

### 症状
- AI 回复显示"无法连接AI服务"
- 控制台显示 API 错误

### 检查步骤

1. **检查环境变量**
   ```bash
   # 查看 .env 文件
   cat .env
   ```

2. **检查代理服务器日志**
   ```bash
   cat /tmp/proxy.log
   ```

3. **测试代理服务器**
   ```bash
   curl -X POST http://localhost:3002/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message":"你好！"}'
   ```

4. **检查 Cloudflare API 状态**
   - 登录 Cloudflare Dashboard
   - 检查 Workers AI 额度
   - 验证 API Token 有效性

### 解决方案
1. 更新 .env 文件中的 API 密钥
2. 重启代理服务器
3. 切换到模拟模式（开发环境）：
   ```env
   VITE_USE_MOCK_AI=true
   ```

---

## Live2D 模型加载失败

### 症状
- 模型显示为占位符
- 控制台显示模型加载错误

### 检查步骤

1. **检查模型文件是否存在**
   ```bash
   ls public/models/Haru/
   ```

2. **检查模型配置文件**
   ```bash
   curl http://localhost:5200/models/Haru/Haru.model3.json
   ```

3. **检查模型文件可访问性**
   ```bash
   curl -I http://localhost:5200/models/Haru/Haru.moc3
   ```

### 解决方案
1. 确保模型文件在 `public/models/` 目录下
2. 检查模型配置文件格式是否正确
3. 清除浏览器缓存并刷新页面

---

## 表情切换不生效

### 症状
- AI 回复时角色表情没有变化

### 检查步骤

1. **检查设置中的表情切换开关**
   - 打开设置面板
   - 确认"表情切换"已启用

2. **检查模型是否支持表情**
   - 查看模型的 .model3.json 文件
   - 确认包含 Expressions 配置

3. **检查控制台日志**
   - 查看是否有表情切换错误

### 解决方案
1. 在设置中启用"表情切换"
2. 确保模型包含表情文件
3. 检查 aiService.ts 中的表情映射

---

## 代理服务器启动失败

### 症状
- 端口被占用
- 启动时报错

### 检查步骤

1. **检查端口占用**
   ```bash
   netstat -ano | findstr :3002
   ```

2. **检查代理服务器日志**
   ```bash
   cat /tmp/proxy.log
   ```

### 解决方案

1. **更换端口**
   修改 `src/main/ai-proxy.js` 中的 PORT 值

2. **杀死占用端口的进程**
   ```bash
   # Windows
   taskkill /F /PID <进程ID>
   
   # Linux/Mac
   kill -9 <进程ID>
   ```

3. **使用不同端口启动**
   ```bash
   PORT=3003 node src/main/ai-proxy.js
   ```

---

## 其他问题

### 问题：设置不保存
**解决方案**：检查浏览器是否禁用 localStorage

### 问题：模型缩放不生效
**解决方案**：检查设置中的"自动缩放"开关

### 问题：语音合成不工作
**解决方案**：浏览器需要支持 Web Speech API

### 问题：开发服务器端口冲突
**解决方案**：修改 `vite.config.ts` 中的端口号

---

## 获取帮助

如果以上方案无法解决问题，请：
1. 查看浏览器控制台错误信息
2. 检查代理服务器日志
3. 提交 Issue 到 GitHub 仓库
