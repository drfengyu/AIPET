/**
 * 情绪日记面板
 * - 查看每日情绪日记
 * - 7天情绪趋势可视化
 * - 情绪记录时间线
 */
import React, { useState, useEffect } from 'react';
import {
  getDiaryByDate, getAllDates, getMoodTrend, getDiaryStats,
  getEmotionEmoji, getEmotionLabel, getMoodColor,
  type DiaryEntry, type MoodTrend,
} from '../services/diaryService';

interface DiaryPanelProps {
  onClose: () => void;
}

const DAY_LABELS: Record<string, string> = {
  '0': '日', '1': '一', '2': '二', '3': '三',
  '4': '四', '5': '五', '6': '六',
};

const DiaryPanel: React.FC<DiaryPanelProps> = ({ onClose }) => {
  const [dates, setDates] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [trend, setTrend] = useState<MoodTrend[]>([]);
  const [stats, setStats] = useState({ totalDays: 0, totalRecords: 0, avgMood: 0 });

  const refresh = () => {
    setDates(getAllDates());
    setTrend(getMoodTrend(7));
    setStats(getDiaryStats());
    // 默认选中今天
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    setSelectedDate(todayStr);
  };

  useEffect(() => { refresh(); }, []);

  const handleSelectDate = (date: string) => {
    setSelectedDate(date);
  };

  const formatDateDisplay = (dateStr: string) => {
    const d = new Date(dateStr + 'T00:00:00');
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayOfWeek = DAY_LABELS[String(d.getDay())] || '';
    const isToday = dateStr === getTodayStr();
    return `${month}月${day}日 ${isToday ? '今天' : `周${dayOfWeek}`}`;
  };

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <span style={s.title}>📓 情绪日记</span>
            <span style={s.subtitle}>
              {stats.totalDays} 天 · {stats.totalRecords} 条记录
            </span>
          </div>
          <button className="chat-btn" onClick={onClose} style={s.closeBtn}>✕</button>
        </div>

        {/* Stats Row */}
        <div style={s.statsRow}>
          <div style={s.statItem}>
            <span style={s.statValue}>{stats.totalDays}</span>
            <span style={s.statLabel}>日记天数</span>
          </div>
          <div style={s.statItem}>
            <span style={s.statValue}>{stats.totalRecords}</span>
            <span style={s.statLabel}>情绪记录</span>
          </div>
          <div style={s.statItem}>
            <span style={{
              ...s.statValue,
              color: getMoodColor(stats.avgMood),
            }}>
              {stats.avgMood > 0 ? stats.avgMood : '--'}
            </span>
            <span style={s.statLabel}>平均情绪</span>
          </div>
        </div>

        {/* Mood Trend - 7 days */}
        {trend.length > 0 && (
          <div style={s.trendSection}>
            <div style={s.sectionLabel}>近 7 天趋势</div>
            <div style={s.trendRow}>
              {trend.map((t) => {
                return (
                  <div
                    key={t.date}
                    style={{
                      ...s.trendBar,
                      height: t.avgMood >= 0 ? Math.max(8, (t.avgMood / 100) * 60) : 4,
                      background: t.avgMood >= 0 ? getMoodColor(t.avgMood) : 'rgba(255,255,255,0.04)',
                      opacity: t.avgMood >= 0 ? 1 : 0.2,
                      cursor: t.avgMood >= 0 ? 'pointer' : 'default',
                    }}
                    onClick={() => t.avgMood >= 0 && handleSelectDate(t.date)}
                    title={`${t.date} ${t.avgMood >= 0 ? getEmotionEmoji(t.dominantEmotion) + t.avgMood + '/100' : '无数据'}`}
                  >
                    <span style={s.trendVal}>{t.avgMood >= 0 ? t.avgMood : ''}</span>
                  </div>
                );
              })}
            </div>
            <div style={s.trendLabels}>
              {trend.map(t => (
                <span key={t.date} style={s.trendLabel}>{t.date.slice(8)}</span>
              ))}
            </div>
          </div>
        )}

        {/* Diary List */}
        <div style={s.list}>
          <div style={s.sectionLabel}>日记</div>
          {dates.length === 0 ? (
            <div style={s.empty}>
              还没有日记\n和我聊天吧，情绪日记会自动生成
            </div>
          ) : (
            dates.map(date => {
              const e = getDiaryByDate(date);
              const isSelected = selectedDate === date;
              if (!e) return null;
              return (
                <div
                  key={date}
                  style={{
                    ...s.diaryCard,
                    borderColor: isSelected ? 'rgba(0,255,255,0.15)' : 'rgba(255,255,255,0.04)',
                    background: isSelected ? 'rgba(0,255,255,0.02)' : 'rgba(255,255,255,0.02)',
                  }}
                  onClick={() => handleSelectDate(date)}
                >
                  <div style={s.diaryHeader}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 18 }}>{getEmotionEmoji(e.records.length > 0 ? getDominantEmotion(e) : 'neutral')}</span>
                      <span style={s.diaryDate}>{formatDateDisplay(date)}</span>
                    </div>
                    <div style={s.diaryMeta}>
                      <span style={s.metaItem}>{e.records.length} 条</span>
                      <span style={s.metaItem}>{e.wordCount} 字</span>
                    </div>
                  </div>

                  {/* Mood bar */}
                  <div style={s.moodBarBg}>
                    <div style={{
                      ...s.moodBarFill,
                      width: `${e.avgMood}%`,
                      background: getMoodColor(e.avgMood),
                    }} />
                  </div>

                  {/* Summary */}
                  <div style={s.diarySummary}>{e.summary}</div>

                  {/* Topics */}
                  {e.keyTopics.length > 0 && (
                    <div style={s.topicRow}>
                      {e.keyTopics.map(topic => (
                        <span key={topic} style={s.topicTag}>{topic}</span>
                      ))}
                    </div>
                  )}

                  {/* Expand: emotion timeline */}
                  {isSelected && e.records.length > 0 && (
                    <div style={s.timeline}>
                      <div style={s.timelineTitle}>情绪时间线</div>
                      {[...e.records].reverse().slice(0, 20).map((rec) => (
                        <div key={rec.id} style={s.timeItem}>
                          <div style={{
                            ...s.timeDot,
                            background: getMoodColor(rec.intensity),
                          }} />
                          <div style={s.timeContent}>
                            <div style={s.timeHeader}>
                              <span style={s.timeEmoji}>{getEmotionEmoji(rec.emotion)}</span>
                              <span style={s.timeLabel}>{getEmotionLabel(rec.emotion)}</span>
                              <span style={s.timeValue}>{rec.intensity}/100</span>
                              <span style={s.timeStamp}>
                                {new Date(rec.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            {rec.context && <div style={s.timeContext}>&ldquo;{rec.context}&rdquo;</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

// ===== 工具函数 =====

function getDominantEmotion(entry: DiaryEntry): string {
  const counts: Record<string, number> = {};
  for (const r of entry.records) {
    counts[r.emotion] = (counts[r.emotion] || 0) + 1;
  }
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
}

function getTodayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ===== Styles =====

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
  },
  panel: {
    width: 520, maxWidth: '90vw', maxHeight: '80vh',
    background: '#1a1a2e',
    border: '1px solid rgba(0,255,255,0.1)',
    borderRadius: 10,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(0,255,255,0.05)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '14px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  title: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 13, letterSpacing: 2,
    color: 'rgba(0,255,255,0.5)',
  },
  subtitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10, letterSpacing: 1,
    color: 'rgba(255,255,255,0.15)',
    marginLeft: 10,
  },
  closeBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.2)',
    width: 26, height: 26, borderRadius: 4,
    fontSize: 11, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  statsRow: {
    display: 'flex', gap: 0,
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  statItem: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 4,
    padding: '12px 0',
    borderRight: '1px solid rgba(255,255,255,0.04)',
  },
  statValue: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 18, fontWeight: 700,
    color: 'rgba(0,255,255,0.6)',
  },
  statLabel: {
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 9, color: 'rgba(255,255,255,0.15)',
    letterSpacing: 1,
  },
  trendSection: {
    padding: '12px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  sectionLabel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 10, letterSpacing: 1,
    color: 'rgba(255,255,255,0.15)',
    marginBottom: 8,
  },
  trendRow: {
    display: 'flex', gap: 4, alignItems: 'flex-end',
    height: 68, padding: '0 2px',
  },
  trendBar: {
    flex: 1, borderRadius: 3,
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    transition: 'all 0.3s',
    minHeight: 4,
    position: 'relative' as const,
  },
  trendVal: {
    fontSize: 8, color: 'rgba(255,255,255,0.15)',
    fontFamily: "'Share Tech Mono', monospace",
    marginBottom: -12,
  },
  trendLabels: {
    display: 'flex', gap: 4, marginTop: 4,
  },
  trendLabel: {
    flex: 1, textAlign: 'center' as const,
    fontSize: 8, color: 'rgba(255,255,255,0.08)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  list: {
    flex: 1, overflowY: 'auto',
    padding: '12px 18px',
    display: 'flex', flexDirection: 'column', gap: 6,
  },
  empty: {
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.12)',
    fontSize: 12, lineHeight: 1.8,
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    whiteSpace: 'pre-line' as const,
  },
  diaryCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 6,
    padding: '10px 12px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  diaryHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 6,
  },
  diaryDate: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 12, color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.5,
  },
  diaryMeta: {
    display: 'flex', gap: 8,
  },
  metaItem: {
    fontSize: 9, color: 'rgba(255,255,255,0.1)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  moodBarBg: {
    height: 3, borderRadius: 2,
    background: 'rgba(255,255,255,0.04)',
    marginBottom: 6, overflow: 'hidden',
  },
  moodBarFill: {
    height: '100%', borderRadius: 2,
    transition: 'width 0.5s ease',
  },
  diarySummary: {
    fontSize: 11, color: 'rgba(255,255,255,0.25)',
    lineHeight: 1.5, fontWeight: 300,
    marginBottom: 6,
  },
  topicRow: {
    display: 'flex', gap: 4, flexWrap: 'wrap' as const,
  },
  topicTag: {
    fontSize: 9, padding: '1px 6px',
    borderRadius: 6,
    background: 'rgba(0,255,255,0.02)',
    border: '1px solid rgba(0,255,255,0.06)',
    color: 'rgba(0,255,255,0.2)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  timeline: {
    marginTop: 8, paddingTop: 8,
    borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  timelineTitle: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: 1,
    color: 'rgba(255,255,255,0.1)',
    marginBottom: 6,
  },
  timeItem: {
    display: 'flex', gap: 8, alignItems: 'flex-start',
    padding: '3px 0',
  },
  timeDot: {
    width: 6, height: 6, borderRadius: '50%',
    marginTop: 5, flexShrink: 0,
  },
  timeContent: {
    flex: 1,
  },
  timeHeader: {
    display: 'flex', gap: 6, alignItems: 'center',
  },
  timeEmoji: {
    fontSize: 11,
  },
  timeLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.2)',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
  },
  timeValue: {
    fontSize: 9, color: 'rgba(255,255,255,0.12)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  timeStamp: {
    fontSize: 9, color: 'rgba(255,255,255,0.08)',
    fontFamily: "'Share Tech Mono', monospace",
    marginLeft: 'auto',
  },
  timeContext: {
    fontSize: 10, color: 'rgba(255,255,255,0.12)',
    fontStyle: 'italic',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    marginTop: 1,
  },
};

export default DiaryPanel;
