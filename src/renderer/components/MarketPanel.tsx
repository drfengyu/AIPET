/**
 * 模型市场面板
 * - 模型卡片网格
 * - 详情弹窗 + 订阅按钮
 * - 搜索/分类筛选
 */
import React, { useState, useEffect } from 'react';
import { Button, Input, Tag, Segmented } from 'antd';
import { CloseOutlined, SearchOutlined, CheckOutlined, PlusOutlined } from '@ant-design/icons';
import {
  getModelIndex, getModelUrl,
  isSubscribed, toggleSubscription,
  type MarketModel,
} from '../services/marketService';

interface MarketPanelProps {
  onClose: () => void;
  onSelectModel: (modelUrl: string, modelName: string) => void;
}

const CATEGORIES = ['全部', '官方', '社区', '游戏', '动漫'];

const MarketPanel: React.FC<MarketPanelProps> = ({ onClose, onSelectModel }) => {
  const [models, setModels] = useState<MarketModel[]>([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [modelType, setModelType] = useState<'all' | 'live2d' | 'vrm'>('all');
  const [selected, setSelected] = useState<MarketModel | null>(null);
  const [subs, setSubs] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('aipet-market-subs') || '[]');
    } catch { return []; }
  });

  useEffect(() => {
    getModelIndex().then(setModels);
  }, []);

  const refreshSubs = () => {
    try {
      setSubs(JSON.parse(localStorage.getItem('aipet-market-subs') || '[]'));
    } catch { setSubs([]); }
  };

  const handleToggle = (id: string) => {
    toggleSubscription(id);
    refreshSubs();
  };

  const handleUse = (model: MarketModel) => {
    onSelectModel(getModelUrl(model), model.name);
    onClose();
  };

  const filtered = models.filter(m => {
    if (modelType !== 'all' && m.type !== modelType) return false;
    if (category !== '全部' && m.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!m.name.toLowerCase().includes(q) && !m.description.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  return (
    <div style={s.overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={s.panel}>
        {/* Header */}
        <div style={s.header}>
          <span style={s.title}>📦 模型市场</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <span style={s.subtitle}>{models.length} 个模型 · {subs.length} 已订阅</span>
            <Button type="text" size="small" icon={<CloseOutlined />} onClick={onClose} />
          </div>
        </div>

        {/* Type Tabs */}
        <div style={{ padding: '8px 16px 0' }}>
          <Segmented
            value={modelType}
            onChange={(v) => setModelType(v as 'all' | 'live2d' | 'vrm')}
            options={[
              { value: 'all', label: '全部' },
              { value: 'live2d', label: '🎨 2D Live2D' },
              { value: 'vrm', label: '🧊 3D VRM' },
            ]}
            size="small"
          />
        </div>

        {/* Search + Category */}
        <div style={s.toolbar}>
          <Input.Search
            placeholder="搜索模型..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
            variant="borderless"
            style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}
          />
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {CATEGORIES.map(cat => (
              <Tag
                key={cat}
                color={category === cat ? 'cyan' : 'default'}
                style={{ cursor: 'pointer', margin: 0 }}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </Tag>
            ))}
          </div>
        </div>

        {/* Model Grid */}
        <div style={s.grid}>
          {filtered.length === 0 ? (
            <div style={s.empty}>没有找到匹配的模型</div>
          ) : filtered.map(model => {
            const subbed = subs.includes(model.id);
            return (
              <div
                key={model.id}
                style={s.card}
                onClick={() => setSelected(model)}
              >
                {/* Cover */}
                <div style={{
                  width: '100%', height: 120,
                  background: model.cover
                    ? `rgba(0,255,255,0.02) url(${model.cover}) center/cover no-repeat`
                    : 'rgba(0,255,255,0.02)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0,
                }}>
                  {!model.cover && <span style={{ fontSize: 32, opacity: 0.2 }}>🎭</span>}
                </div>
                {/* Info */}
                <div style={s.cardInfo}>
                  <div style={s.cardName}>{model.name}</div>
                  <span style={s.cardCat}>{model.category}</span>
                </div>
                <div style={{ display: 'flex', gap: 4, padding: '0 10px 4px', alignItems: 'center' }}>
                  <span style={{
                    fontSize: 8, padding: '1px 5px',
                    borderRadius: 4,
                    background: model.type === 'live2d' ? 'rgba(0,255,255,0.04)' : 'rgba(100,200,255,0.04)',
                    border: model.type === 'live2d' ? '1px solid rgba(0,255,255,0.08)' : '1px solid rgba(100,200,255,0.08)',
                    color: model.type === 'live2d' ? 'rgba(0,255,255,0.2)' : 'rgba(100,200,255,0.2)',
                    fontFamily: "'Share Tech Mono', monospace",
                  }}>
                    {model.type === 'live2d' ? '2D' : '3D'}
                  </span>
                  <span style={{ fontSize: 8, color: model.localUrl ? 'rgba(0,255,0,0.15)' : 'rgba(255,255,255,0.08)' }}>
                    {model.localUrl ? '本地' : '远端'}
                  </span>
                </div>
                {/* Actions */}
                <div style={s.cardActions}>
                  <Button
                    size="small"
                    type="primary"
                    ghost
                    style={{ flex: 1, fontSize: 10, height: 24 }}
                    onClick={(e) => { e.stopPropagation(); handleUse(model); }}
                  >
                    使用
                  </Button>
                  <Button
                    size="small"
                    type={subbed ? 'primary' : 'default'}
                    style={{
                      flex: 1, fontSize: 10, height: 24,
                      opacity: subbed ? 0.7 : 0.5,
                    }}
                    icon={subbed ? <CheckOutlined /> : <PlusOutlined />}
                    onClick={(e) => { e.stopPropagation(); handleToggle(model.id); }}
                  >
                    {subbed ? '已订阅' : '订阅'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div style={s.detailOverlay} onClick={() => setSelected(null)}>
          <div style={s.detailPanel} onClick={e => e.stopPropagation()}>
            <div style={{
              width: '100%', height: 160, flexShrink: 0,
              background: selected.cover
                ? `#0a0a12 url(${selected.cover}) center/cover no-repeat`
                : 'rgba(0,255,255,0.02)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              {!selected.cover && <span style={{ fontSize: 32, opacity: 0.2 }}>🎭</span>}
            </div>
            <div style={s.detailBody}>
              {/* 名称 + 类型 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div style={s.detailName}>{selected.name}</div>
                <span style={{
                  fontSize: 8, padding: '1px 6px', borderRadius: 4,
                  background: selected.type === 'live2d' ? 'rgba(0,255,255,0.06)' : 'rgba(100,200,255,0.06)',
                  border: `1px solid ${selected.type === 'live2d' ? 'rgba(0,255,255,0.1)' : 'rgba(100,200,255,0.1)'}`,
                  color: selected.type === 'live2d' ? 'rgba(0,255,255,0.3)' : 'rgba(100,200,255,0.3)',
                  fontFamily: "'Share Tech Mono', monospace",
                }}>
                  {selected.type === 'live2d' ? '2D Live2D' : '3D VRM'}
                </span>
              </div>
              {/* 标签行 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
                <span style={s.detailTag}>{selected.category}</span>
                {selected.gender && <span style={s.detailTag}>{selected.gender === 'Female' ? '♀ 女性' : '♂ 男性'}</span>}
                {selected.author && <span style={s.detailTag}>👤 {selected.author}</span>}
                {selected.localUrl && <span style={{ ...s.detailTag, color: 'rgba(0,255,0,0.2)', borderColor: 'rgba(0,255,0,0.06)' }}>📦 本地</span>}
              </div>
              {/* 描述 */}
              <p style={s.detailDesc}>{selected.description}</p>
              {/* 问候语 */}
              {selected.greeting && (
                <div style={s.detailMeta}>
                  <span style={s.metaLabel}>💬 问候语</span>
                  <span style={s.metaValue}>"{selected.greeting}"</span>
                </div>
              )}
              {/* TTS */}
              {selected.tts && (
                <div style={s.detailMeta}>
                  <span style={s.metaLabel}>🎤 语音</span>
                  <span style={s.metaValue}>{selected.tts.voice} · {selected.tts.locale}</span>
                </div>
              )}
              {/* AI 模型 */}
              {selected.aiModel && (
                <div style={s.detailMeta}>
                  <span style={s.metaLabel}>🧠 AI 模型</span>
                  <span style={s.metaValue}>{selected.aiModel}</span>
                </div>
              )}
              {/* AI 参数 */}
              {selected.params && (
                <div style={s.detailMeta}>
                  <span style={s.metaLabel}>⚙ 参数</span>
                  <span style={s.metaValue}>
                    temp {selected.params.temperature} · top_p {selected.params.top_p}
                  </span>
                </div>
              )}
              {/* 创建时间 */}
              {selected.createAt && (
                <div style={s.detailMeta}>
                  <span style={s.metaLabel}>📅 上架</span>
                  <span style={s.metaValue}>{selected.createAt}</span>
                </div>
              )}
              {/* 模型来源 */}
              {selected.readme && (
                <div style={s.detailMeta}>
                  <span style={s.metaLabel}>🔗 来源</span>
                  <span style={{ ...s.metaValue, fontSize: 9, wordBreak: 'break-all' }}>{selected.readme}</span>
                </div>
              )}
              {/* 操作按钮 */}
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <Button type="primary" onClick={() => handleUse(selected)}>
                  {selected.type === 'live2d' ? '🎨 切换到此模型' : '🧊 加载 3D 角色'}
                </Button>
                <Button
                  type={subs.includes(selected.id) ? 'primary' : 'default'}
                  ghost={!subs.includes(selected.id)}
                  icon={subs.includes(selected.id) ? <CheckOutlined /> : <PlusOutlined />}
                  onClick={() => handleToggle(selected.id)}
                >
                  {subs.includes(selected.id) ? '已订阅' : '订阅'}
                </Button>
              </div>
              <Button type="text" size="small" icon={<CloseOutlined />}
                onClick={() => setSelected(null)}
                style={{ position: 'absolute', top: 8, right: 8, color: 'rgba(255,255,255,0.2)' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
    );
  }

const s: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed', inset: 0, zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.5)',
    backdropFilter: 'blur(4px)',
  },
  panel: {
    width: 640, maxWidth: '90vw', maxHeight: '80vh',
    background: '#1e1e34',
    border: '1px solid rgba(0,200,255,0.1)',
    borderRadius: 10,
    display: 'flex', flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 0 40px rgba(0,200,255,0.05)',
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '12px 16px',
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
    color: 'rgba(255,255,255,0.12)',
    alignSelf: 'center',
  },
  closeBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.2)',
    width: 26, height: 26, borderRadius: 4,
    fontSize: 11, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  toolbar: {
    padding: '10px 16px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
    display: 'flex', flexDirection: 'column', gap: 8,
  },
  typeRow: {
    display: 'flex', gap: 4,
    padding: '0 16px 8px',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  },
  typeBtn: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.2)',
    padding: '4px 12px', fontSize: 10, cursor: 'pointer',
    borderRadius: 4, letterSpacing: 0.5,
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    transition: 'all 0.2s',
  },
  typeBtnActive: {
    background: 'rgba(0,255,255,0.04)',
    borderColor: 'rgba(0,255,255,0.2)',
    color: 'rgba(0,255,255,0.5)',
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
  catRow: {
    display: 'flex', gap: 4, flexWrap: 'wrap' as const,
  },
  catBtn: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.2)',
    padding: '3px 10px', fontSize: 10, cursor: 'pointer',
    borderRadius: 10, letterSpacing: 0.5,
    fontFamily: "'Share Tech Mono', monospace",
    transition: 'all 0.2s',
  },
  catBtnActive: {
    background: 'rgba(0,255,255,0.04)',
    borderColor: 'rgba(0,255,255,0.2)',
    color: 'rgba(0,255,255,0.5)',
  },
  grid: {
    flex: 1, overflowY: 'auto',
    padding: '12px 16px',
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
    gap: 10,
  },
  empty: {
    gridColumn: '1 / -1',
    textAlign: 'center' as const,
    padding: '40px 20px',
    color: 'rgba(255,255,255,0.12)',
    fontSize: 12,
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
  },
  card: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.04)',
    borderRadius: 8,
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'all 0.15s',
    display: 'flex', flexDirection: 'column',
  },
  cardCover: {
    width: '100%', height: 120,
    background: 'rgba(0,255,255,0.02)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  cardInfo: {
    padding: '8px 10px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  },
  cardName: {
    fontSize: 12, color: '#d0d0e8', fontWeight: 500,
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
  },
  cardCat: {
    fontSize: 9, padding: '1px 6px',
    borderRadius: 6,
    background: 'rgba(0,255,255,0.02)',
    border: '1px solid rgba(0,255,255,0.06)',
    color: 'rgba(0,255,255,0.2)',
    fontFamily: "'Share Tech Mono', monospace",
  },
  cardActions: {
    display: 'flex', gap: 4,
    padding: '0 10px 8px',
  },
  useBtn: {
    flex: 1,
    background: 'rgba(0,255,255,0.04)',
    border: '1px solid rgba(0,255,255,0.08)',
    color: 'rgba(0,255,255,0.4)',
    padding: '4px 0', fontSize: 10,
    borderRadius: 4, cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace",
    transition: 'all 0.15s',
  },
  subBtn: {
    flex: 1,
    border: '1px solid',
    padding: '4px 0', fontSize: 10,
    borderRadius: 4, cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace",
    transition: 'all 0.15s',
  },
  detailOverlay: {
    position: 'fixed', inset: 0, zIndex: 1100,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0,0,0,0.3)',
  },
  detailPanel: {
    width: 380, maxWidth: '90vw', maxHeight: '90vh',
    background: '#1e1e34',
    border: '1px solid rgba(0,200,255,0.1)',
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    display: 'flex', flexDirection: 'column',
  },
  detailCover: {
    width: '100%', height: 160, flexShrink: 0,
    background: 'rgba(0,255,255,0.02)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden',
  },
  detailBody: {
    padding: '14px 16px',
  },
  detailName: {
    fontSize: 15, color: '#e0e0ee', fontWeight: 600,
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    marginBottom: 4,
  },
  detailDesc: {
    fontSize: 11, color: 'rgba(255,255,255,0.2)',
    lineHeight: 1.6, marginTop: 8,
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
  },
  detailTag: {
    fontSize: 9, padding: '1px 7px',
    borderRadius: 4,
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)',
    color: 'rgba(255,255,255,0.15)',
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
  },
  detailMeta: {
    display: 'flex', gap: 6, alignItems: 'flex-start',
    marginTop: 6, paddingTop: 6,
    borderTop: '1px solid rgba(255,255,255,0.03)',
  },
  metaLabel: {
    fontFamily: "'Share Tech Mono', monospace",
    fontSize: 9, letterSpacing: 0.5,
    color: 'rgba(255,255,255,0.1)',
    minWidth: 52, flexShrink: 0,
  },
  metaValue: {
    fontFamily: "'Share Tech Mono', 'Microsoft YaHei', sans-serif",
    fontSize: 10, color: 'rgba(255,255,255,0.2)',
    lineHeight: 1.4,
  },
  detailUseBtn: {
    flex: 1,
    background: 'rgba(0,255,255,0.06)',
    border: '1px solid rgba(0,255,255,0.15)',
    color: 'rgba(0,255,255,0.6)',
    padding: '6px 0', fontSize: 11,
    borderRadius: 4, cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 1,
    transition: 'all 0.15s',
  },
  detailSubBtn: {
    flex: 1,
    border: '1px solid',
    padding: '6px 0', fontSize: 11,
    borderRadius: 4, cursor: 'pointer',
    fontFamily: "'Share Tech Mono', monospace",
    letterSpacing: 1,
    transition: 'all 0.15s',
  },
  detailClose: {
    position: 'absolute', top: 8, right: 8,
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    color: 'rgba(255,255,255,0.3)',
    width: 24, height: 24, borderRadius: 4,
    fontSize: 10, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
};

export default MarketPanel;
