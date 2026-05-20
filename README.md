# Live2D Chat App

基于Live2D的桌面AI陪聊软件

## 🚀 快速启动

### 方法1：使用启动脚本（推荐）
```bash
# 双击运行
start.bat
```

### 方法2：手动启动
```bash
# 启动Vite开发服务器
npx vite

# 然后在浏览器中访问
http://localhost:5174/index.html
```

### 方法3：使用yarn
```bash
# 安装依赖（如果还没安装）
yarn install

# 启动开发服务器
yarn dev:vite

# 然后在浏览器中访问
http://localhost:5174/index.html
```

## 📱 访问地址

- **本地访问**: http://localhost:5174/index.html
- **网络访问**: http://192.168.6.78:5174/index.html

## 🎯 应用功能

### Live2D展示
- ✅ Live2D角色模型加载
- ✅ 点击交互（头部、身体）
- ✅ 模型切换

### AI聊天
- ✅ 聊天界面
- ✅ 消息发送/接收
- ✅ 打字动画效果

## 📁 项目结构

```
AIPET/
├── src/
│   ├── agents/           # AI代理架构
│   ├── main/             # Electron主进程
│   ├── renderer/         # React前端
│   │   ├── components/   # 组件
│   │   │   ├── Live2DViewer.tsx
│   │   │   └── ChatWindow.tsx
│   │   ├── App.tsx
│   │   └── index.tsx
│   └── shared/           # 共享类型
├── public/               # 静态资源
│   └── models/           # Live2D模型
├── package.json
├── vite.config.ts
└── start.bat             # 启动脚本
```

## 🔧 技术栈

- **前端**: React + TypeScript + Vite
- **Live2D**: Pixi.js + pixi-live2d-display
- **AI代理**: Cloudflare Agents SDK
- **桌面应用**: Electron

## 📝 注意事项

1. **Live2D模型**: 当前使用占位符模型，需要下载真实模型文件
2. **AI对话**: 当前使用模拟回复，需要集成AI服务
3. **Electron**: 由于网络问题，Electron二进制文件未下载完成

## 🎯 下一步

1. 下载Live2D模型文件到 `public/models/`
2. 集成AI对话服务（Cloudflare Workers AI）
3. 添加语音合成功能
4. 打包发布桌面应用

---

*版本: 1.0.0*
*最后更新: 2026/05/20*
