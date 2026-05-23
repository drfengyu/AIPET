/**
 * 记忆面板 (Memory 2.0)
 * 查看/编辑/删除 AI 记住的事实
 */
import React, { useState, useEffect } from 'react';
import {
  loadFacts, deleteFact, clearAllFacts,
  type MemoryFact, getMemoryStats,
} from '../services/memoryService';

interface MemoryPanelProps {
  onClose: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  personal: '个人信息',
  preference: '偏好',
  topic: '话题',
  emotion: '情绪',
  other: '其他',
};

const CATEGORY_COLORS: Record<string, string> = {
  personal: 'rgba(0,255,200,0.3)',
  preference: 'rgba(0,200,255,0.3)',
  topic: 'rgba(200,100,255,0.3)',
  emotion: 'rgba(255,200,0,0.3)',
  other: 'rgba(255,255,255,0.15)',
};

const MemoryPanel: React.FC<MemoryPanelProps> = ({ onClose }) => {
  const [facts, setFacts] = useState<MemoryFact[]>([]);
  const [search, setSearch] = useState('');
  const [stats, setStats] = useState({ total: 0, byCategory: {} as Record<string, number> });
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const refresh = () => {
    setFacts(loadFacts());
    setStats(getMemoryStats());
  };

  useEffect(() => { refresh(); }, []);

  const handleDelete = (id: string) => {
    deleteFact(id);
    refresh();
  };

  const handleClearAll = () => {
    if (confirm('确定清除所有记忆？此操作不可撤销。')) {
      clearAllFacts();
      refresh();
    }
  };

  const filtered = facts.filter(f => {
    if (filterCategory !== 'all' && f.category !== filterCategory) return false;
    if (search) {
      const q = search.toLowerCase();
      return f.fact.toLowerCase().includes(q) || f.source.toLowerCase().includes(q);
    }
    return true;
  });

  // 按时间倒序
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div style={s.overlay}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <div>
            <span style={s.title}>🧠 记忆库</span>
            <span style={s.subtitle}>{stats.total} 条事实 · {Object.keys(stats.byCategory).length} 类</span>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="chat-btn" onClick={handleClearAll} style={s.dangerBtn}>清空</button>
            <button className="chat-btn" onClick={onClose} style={s.closeBtn}>✕</button>
          </div>
        </div>

        {/* Search + Filter */}
        <div style={s.toolbar}>
          <input
            type="text"
            placeholder="搜索记忆..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={s.searchInput}
          />
          <div style={s.filterRow}>
            <button
              style={{ ...s.filterBtn, ...(filterCategory === 'all' ? s.filterBtnActive : {}) }}
              onClick={() => setFilterCategory('all')}
            >全部</button>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <button
                key={key}
                style={{
                  ...s.filterBtn,
                  ...(filterCategory === key ? { ...s.filterBtnActive, borderColor: CATEGORY_COLORS[key] } : {}),
                }}
                onClick={() => setFilterCategory(key)}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Facts List */}
        <div style={s.list}>
          {filtered.length === 0 ? (
            <div style={s.empty}>
              {search ? '没有匹配的记忆' : `还没有记住任何信息\n和我聊天吧，我会慢慢了解你`}
            </div>
          ) : filtered.map(fact => (
            <div key={fact.id} style={s.factCard}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={s.factText}>{fact.fact}</div>
                  <div style={s.factSource}>来源: "{fact.source.length > 40 ? fact.source.slice(0, 40) + '...' : fact.source}"</div>
                  <div style={s.factMeta}>
                    <span style={{
                      ...s.categoryBadge,
                      borderColor: CATEGORY_COLORS[fact.category] || 'rgba(255,255,255,0.15)',
                      color: CATEGORY_COLORS[fact.category]?.replace('0.3', '0.7') || 'rgba(255,255,255,0.3)',
                    }}>
                      {CATEGORY_LABELS[fact.category] || fact.category}
                    </span>
                    <span style={s.metaItem}>{new Date(fact.timestamp).toLocaleDateString('zh-CN')}</span>
                    <span style={s.metaItem}>置信度 {Math.round(fact.confidence * 100)}%</span>
                  </div>
                </div>
                <button
                  className="chat-btn"
                  onClick={() => handleDelete(fact.id)}
                  style={s.deleteBtn}
                  title="删除此记忆"
                >✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
  },
  panel: {
    width: 500, maxWidth: '90vw', maxHeight: '80vh',
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
  dangerBtn: {
    background: 'rgba(255,50,50,0.05)',
    border: '1px solid rgba(255,50,50,0.15)',
    color: 'rgba(255,50,50,0.4)',
    padding: '4px 10px',
    fontSize: 10, cursor: 'pointer',
    borderRadius: 4,
    fontFamily: "'Share Tech Mono', monospace",
  },
  closeBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.2)',
    width: 26, height: 26, borderRadius: 4,
    fontSize: 11, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  toolbar: {
    padding: '10px 18px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  searchInput: {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 6,
    padding: '7px 12px',
    fontSize: 12, color: '#d0d0e8',
    outline: 'none',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
  },
  filterRow: {
    display: 'flex', gap: 4, flexWrap: 'wrap' as const,
  },
  filterBtn: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.2)',
    padding: '3px 10px', fontSize: 10, cursor: 'pointer',
    borderRadius: 10, letterSpacing: 0.5,
    fontFamily: "'Share Tech Mono', monospace",
    transition: 'all 0.2s',
  },
  filterBtnActive: {
    background: 'rgba(0,255,255,0.04)',
    borderColor: 'rgba(0,255,255,0.2)',
    color: 'rgba(0,255,255,0.5)',
  },
  list: {
    flex: 1, overflowY: 'auto',
    padding: '8px 18px',
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
  factCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 6,
    padding: '10px 12px',
    transition: 'background 0.2s',
  },
  factText: {
    fontSize: 13, color: '#d0d0e8', lineHeight: 1.5, fontWeight: 300,
  },
  factSource: {
    fontSize: 9, color: 'rgba(255,255,255,0.1)',
    marginTop: 4, fontStyle: 'italic',
    fontFamily: "'Share Tech Mono', monospace",
  },
  factMeta: {
    display: 'flex', gap: 8, alignItems: 'center',
    marginTop: 6, flexWrap: 'wrap' as const,
  },
  categoryBadge: {
    fontSize: 9, padding: '1px 6px',
    borderRadius: 6,
    border: '1px solid',
    fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 0.5,
  },
  metaItem: {
    fontSize: 9, color: 'rgba(255,255,255,0.12)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  deleteBtn: {
    background: 'transparent', border: '1px solid rgba(255,50,50,0.1)',
    color: 'rgba(255,50,50,0.2)',
    width: 22, height: 22, borderRadius: 4,
    fontSize: 9, cursor: 'pointer', marginLeft: 8,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'all 0.2s', flexShrink: 0,
  },
};

export default MemoryPanel;
