import { Agent } from '@cloudflare/agents';
import type { AgentEnv } from './worker';

export interface BackendState {
  servicesBuilt: string[];
  currentTask: string | null;
  proxyRunning: boolean;
  electronReady: boolean;
}

export class BackendAgent extends Agent<AgentEnv, BackendState> {
  async onStart() {
    if (!this.state) {
      await this.setState({
        servicesBuilt: [],
        currentTask: null,
        proxyRunning: false,
        electronReady: false,
      });
    }
  }

  async registerService(name: string) {
    await this.onStart();
    const state = this.state!;
    state.servicesBuilt.push(name);
    await this.setState(state);
    return { ok: true, service: name };
  }

  async getServices() {
    await this.onStart();
    return this.state!.servicesBuilt;
  }

  async setProxyRunning(running: boolean) {
    await this.onStart();
    this.state!.proxyRunning = running;
    await this.setState(this.state!);
    return { ok: true };
  }

  async setElectronReady(ready: boolean) {
    await this.onStart();
    this.state!.electronReady = ready;
    await this.setState(this.state!);
    return { ok: true };
  }

  async getStatus() {
    await this.onStart();
    return this.state!;
  }

  async startBackend() {
    return {
      commands: [
        { cmd: 'node src/main/ai-proxy.cjs', description: 'Start AI proxy', background: true },
        { cmd: 'yarn dev:electron', description: 'Start Electron app', background: true },
      ],
      waitFor: ['tcp:5187', 'tcp:5174'],
    };
  }
}
