import { Agent } from '@cloudflare/agents';
import type { AgentEnv } from './worker';

export interface ProjectState {
  phase: 'development' | 'testing' | 'building' | 'deploying' | 'done';
  currentTask: string | null;
  taskQueue: string[];
  completedTasks: string[];
  version: string;
  lastBuildTime: string | null;
  lastDeployTime: string | null;
  errors: string[];
}

export class ProjectManagerAgent extends Agent<AgentEnv, ProjectState> {
  async onStart() {
    if (!this.state) {
      await this.setState({
        phase: 'development',
        currentTask: null,
        taskQueue: [],
        completedTasks: [],
        version: '0.1.0',
        lastBuildTime: null,
        lastDeployTime: null,
        errors: [],
      });
    }
  }

  async registerTask(task: string) {
    await this.onStart();
    const state = this.state!;
    state.taskQueue.push(task);
    await this.setState(state);
    return { ok: true, task };
  }

  async startNextTask() {
    await this.onStart();
    const state = this.state!;
    if (state.taskQueue.length === 0) {
      return { ok: false, reason: 'no tasks in queue' };
    }
    const task = state.taskQueue.shift()!;
    state.currentTask = task;
    await this.setState(state);
    return { ok: true, task };
  }

  async completeTask(task: string) {
    await this.onStart();
    const state = this.state!;
    state.completedTasks.push(task);
    if (state.currentTask === task) state.currentTask = null;
    await this.setState(state);
    return { ok: true, task };
  }

  async reportError(error: string) {
    await this.onStart();
    const state = this.state!;
    state.errors.push(`[${new Date().toISOString()}] ${error}`);
    await this.setState(state);
    return { ok: true };
  }

  async getStatus() {
    await this.onStart();
    return this.state!;
  }

  async setPhase(phase: ProjectState['phase']) {
    await this.onStart();
    const state = this.state!;
    state.phase = phase;
    await this.setState(state);
    return { ok: true, phase };
  }

  async getNextAction(): Promise<string | null> {
    await this.onStart();
    const state = this.state!;
    if (state.taskQueue.length > 0 || state.currentTask) return 'continue';
    switch (state.phase) {
      case 'development': return 'test';
      case 'testing': return 'build';
      case 'building': return 'deploy';
      case 'deploying': return 'release';
      case 'done': return null;
      default: return null;
    }
  }

  async reset() {
    await this.setState({
      phase: 'development',
      currentTask: null,
      taskQueue: [],
      completedTasks: [],
      version: '0.1.0',
      lastBuildTime: null,
      lastDeployTime: null,
      errors: [],
    });
    return { ok: true };
  }
}
