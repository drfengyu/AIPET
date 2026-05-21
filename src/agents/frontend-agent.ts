import { Agent } from '@cloudflare/agents';
import type { AgentEnv } from './worker';

export interface FrontendState {
  componentsBuilt: string[];
  currentTask: string | null;
  lintPassed: boolean;
  buildPassed: boolean;
  lastBuildOutput: string | null;
}

export class FrontendAgent extends Agent<AgentEnv, FrontendState> {
  async onStart() {
    if (!this.state) {
      await this.setState({
        componentsBuilt: [],
        currentTask: null,
        lintPassed: false,
        buildPassed: false,
        lastBuildOutput: null,
      });
    }
  }

  async buildComponent(name: string) {
    await this.onStart();
    const state = this.state!;
    state.componentsBuilt.push(name);
    await this.setState(state);
    return { ok: true, component: name };
  }

  async getBuiltComponents() {
    await this.onStart();
    return this.state!.componentsBuilt;
  }

  async setLintPassed(passed: boolean) {
    await this.onStart();
    this.state!.lintPassed = passed;
    await this.setState(this.state!);
    return { ok: true };
  }

  async setBuildPassed(passed: boolean, output?: string) {
    await this.onStart();
    this.state!.buildPassed = passed;
    this.state!.lastBuildOutput = output || null;
    await this.setState(this.state!);
    return { ok: true };
  }

  async getStatus() {
    await this.onStart();
    return this.state!;
  }

  async runDevServer() {
    return {
      command: 'yarn dev:vite',
      url: 'http://localhost:5174',
      expected: 'Vite dev server running on port 5174',
    };
  }
}
