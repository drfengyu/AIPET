# 情绪日记功能实现方案

> **目标:** AI 自动记录每日对话中的情绪变化，生成日记条目 + 情绪趋势图

**架构:**
- `diaryService.ts` — 情绪记录/日记生成/持久化，独立数据层
- `DiaryPanel.tsx` — 悬浮面板 UI（参照 MemoryPanel 风格），展示日记日历+情绪趋势
- 集成到 `App.tsx` — 顶部栏添加日记按钮，对话中自动记录情绪

**数据流:**
```
ChatWindow 对话 → 检测情绪 → diaryService 记录 → 
Day change → AI 生成每日摘要 → DiaryPanel 展示
```

---

## Task 1: 创建 DiaryService

**Files:** `src/renderer/services/diaryService.ts`

数据模型:
- `EmotionRecord`: 单次对话的情绪记录 { timestamp, emotion, intensity }
- `DiaryEntry`: 每日总结 { date, summary, avgMood, records, keyTopics, wordCount }
- 持久化: localStorage key `aipet-diary`

方法:
- `recordEmotion()` — 记录单次情绪
- `getTodayEntries()` — 获取今日记录
- `getDiaryByDate(date)` — 按日期获取日记
- `generateDailySummary()` — 生成每日摘要（基于当天情绪数据）
- `getMoodTrend(days)` — 近 N 天情绪趋势
- `getAllDates()` — 有日记的日期列表

## Task 2: 创建 DiaryPanel 组件

**Files:** `src/renderer/components/DiaryPanel.tsx`

参照 MemoryPanel 的悬浮面板风格:
- Header: 📓 情绪日记 + 统计
- 日期列表: 按日期显示日记卡片（情绪色条 + 摘要 + 情绪分布表情）
- 情绪趋势: 近7天情绪均值可视化（色块条）
- 详情: 展开后显示当日每条情绪记录的时间线

## Task 3: 集成到 App.tsx

- 顶部栏添加 📓 日记按钮 + 计数 badge
- 每次 AI 回复时记录情绪到 diaryService
- 内存变量记录今日日记统计
- "有日记"提示 tag 传递到 ChatWindow
