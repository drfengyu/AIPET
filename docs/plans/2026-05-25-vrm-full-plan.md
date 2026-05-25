# VRM 完整实现规划

基于 lobe-vidol 完整架构，逐步创建服务层 → 组件层

## 任务

1. AutoBlink.ts - 直接复制 lobe-vidol
2. AutoLookAt.ts - 直接复制 lobe-vidol
3. ExpressionController.ts - 适配版
4. EmoteController.ts - 适配版
5. VrmModel.ts - 适配版（VRM加载+动画循环）
6. VrmViewer.tsx - 重写（内嵌Viewer场景+渲染器）
