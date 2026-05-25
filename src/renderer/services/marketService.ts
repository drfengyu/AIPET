/**
 * 模型市场服务
 * - 获取市场模型列表
 * - 订阅/取消订阅
 * - localStorage 持久化
 */

export interface MarketModel {
  id: string;
  name: string;
  category: string;
  description: string;
  modelUrl: string;
  localUrl?: string;
  cover?: string;
  type: 'live2d' | 'vrm';
  /** VRM 专属字段 */
  author?: string;
  avatar?: string;
  greeting?: string;
  gender?: string;
  readme?: string;
  tts?: {
    engine: string;
    locale: string;
    pitch: number;
    speed: number;
    voice: string;
  };
  aiModel?: string;
  params?: {
    temperature: number;
    top_p: number;
    frequency_penalty: number;
    presence_penalty: number;
  };
  createAt?: string;
}

const STORAGE_KEY = 'aipet-market-subs';
const MARKET_INDEX_URL = '/market/index.json';

// ===== 市场数据 =====

let _cachedModels: MarketModel[] | null = null;

/**
 * 获取市场模型列表
 */
export async function getModelIndex(): Promise<MarketModel[]> {
  if (_cachedModels) return _cachedModels;
  try {
    const resp = await fetch(MARKET_INDEX_URL);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const data = await resp.json();
    _cachedModels = data.models || [];
    return _cachedModels;
  } catch (e) {
    console.warn('市场加载失败:', e);
    return [];
  }
}

/**
 * 获取单个模型详情
 */
export async function getModelDetail(id: string): Promise<MarketModel | null> {
  const models = await getModelIndex();
  return models.find(m => m.id === id) || null;
}

// ===== 订阅管理 =====

function loadSubs(): string[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSubs(ids: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getSubscribedIds(): string[] {
  return loadSubs();
}

export function isSubscribed(id: string): boolean {
  return loadSubs().includes(id);
}

export function subscribeModel(id: string): void {
  const subs = loadSubs();
  if (!subs.includes(id)) {
    subs.push(id);
    saveSubs(subs);
  }
}

export function unsubscribeModel(id: string): void {
  saveSubs(loadSubs().filter(s => s !== id));
}

export function toggleSubscription(id: string): boolean {
  if (isSubscribed(id)) {
    unsubscribeModel(id);
    return false;
  } else {
    subscribeModel(id);
    return true;
  }
}

/**
 * 获取已订阅模型的完整数据
 */
export async function getSubscribedModels(): Promise<MarketModel[]> {
  const ids = loadSubs();
  if (ids.length === 0) return [];
  const all = await getModelIndex();
  return all.filter(m => ids.includes(m.id));
}

/**
 * 获取所有可用模型的 URL（优先本地，远程兜底）
 */
export function getModelUrl(model: MarketModel): string {
  return model.localUrl || model.modelUrl;
}
