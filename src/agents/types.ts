// AI代理共享类型定义

// 任务类型
export type TaskType = 'frontend' | 'backend' | 'test' | 'deploy' | 'design';

// 任务状态
export type TaskStatus = 'pending' | 'in-progress' | 'completed' | 'failed';

// 任务定义
export interface Task {
  id: string;
  type: TaskType;
  name: string;
  description: string;
  status: TaskStatus;
  assignedTo?: string;
  createdAt: Date;
  completedAt?: Date;
}

// 代理信息
export interface AgentInfo {
  id: string;
  name: string;
  type: string;
  status: 'active' | 'idle' | 'busy';
  currentTask?: string;
}

// 项目状态
export interface ProjectState {
  tasks: Task[];
  agents: AgentInfo[];
  status: 'planning' | 'development' | 'testing' | 'deployment' | 'completed';
  projectName: string;
  createdAt: Date;
}

// 组件定义（前端）
export interface Component {
  id: string;
  name: string;
  type: 'functional' | 'class' | 'hook';
  props?: string[];
  state?: string[];
  content: string;
}

// API定义（后端）
export interface API {
  id: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  handler: string;
  description: string;
}

// 设计定义
export interface Design {
  id: string;
  name: string;
  type: 'ui' | 'ux' | 'layout';
  description: string;
  assets?: string[];
}

// AI模型配置
export interface AIModelConfig {
  id: string;
  name: string;
  provider: 'cloudflare' | 'openai' | 'anthropic';
  model: string;
  config: Record<string, any>;
}

// 数据库配置
export interface DBConfig {
  id: string;
  type: 'sqlite' | 'postgresql' | 'mongodb';
  connection: string;
  tables: string[];
}

// 工作流定义
export interface Workflow {
  id: string;
  name: string;
  steps: WorkflowStep[];
  status: 'pending' | 'running' | 'completed' | 'failed';
}

export interface WorkflowStep {
  id: string;
  name: string;
  agent: string;
  action: string;
  params: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
}

// 响应类型
export interface TaskResult {
  success: boolean;
  taskId: string;
  message?: string;
  data?: any;
}

export interface WorkflowResult {
  success: boolean;
  workflowId: string;
  steps: WorkflowStep[];
}
