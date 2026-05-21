import { Agent } from '@cloudflare/agents';
import type { AgentEnv } from './worker';

export interface DeployState {
  builds: string[];
  releases: string[];
  lastBuildStatus: 'none' | 'success' | 'failure';
  lastPackagePath: string | null;
  lastReleaseVersion: string | null;
}

export class DeployAgent extends Agent<AgentEnv, DeployState> {
  async onStart() {
    if (!this.state) {
      await this.setState({
        builds: [],
        releases: [],
        lastBuildStatus: 'none',
        lastPackagePath: null,
        lastReleaseVersion: null,
      });
    }
  }

  async recordBuild(buildId: string, status: 'success' | 'failure') {
    await this.onStart();
    const state = this.state!;
    state.builds.push(`[${new Date().toISOString()}] ${buildId}: ${status}`);
    state.lastBuildStatus = status;
    await this.setState(state);
    return { ok: true, buildId };
  }

  async recordRelease(version: string) {
    await this.onStart();
    const state = this.state!;
    state.releases.push(`[${new Date().toISOString()}] ${version}`);
    state.lastReleaseVersion = version;
    await this.setState(state);
    return { ok: true, version };
  }

  async recordPackage(path: string) {
    await this.onStart();
    this.state!.lastPackagePath = path;
    await this.setState(this.state!);
    return { ok: true, path };
  }

  async getStatus() {
    await this.onStart();
    return this.state!;
  }

  getBuildCommands() {
    return {
      build: 'yarn build',
      packageWin: 'npx electron-builder --win',
      packagePortable: 'npx electron-builder --win --portable',
      packageTest: 'npx electron-builder --win --dir',
    };
  }

  async runFullPipeline() {
    return {
      steps: [
        { name: 'lint', command: 'yarn lint' },
        { name: 'test', command: 'yarn test' },
        { name: 'build', command: 'yarn build' },
        { name: 'package', command: 'npx electron-builder --win --dir' },
      ],
      parallel: false,
    };
  }
}
