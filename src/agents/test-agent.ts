import { Agent } from '@cloudflare/agents';
import type { AgentEnv } from './worker';

export interface TestState {
  results: TestResult[];
  coverage: number | null;
  passed: number;
  failed: number;
  lastRun: string | null;
}

export interface TestResult {
  name: string;
  passed: boolean;
  duration: string;
  error?: string;
}

export class TestAgent extends Agent<AgentEnv, TestState> {
  async onStart() {
    if (!this.state) {
      await this.setState({
        results: [],
        coverage: null,
        passed: 0,
        failed: 0,
        lastRun: null,
      });
    }
  }

  async recordResult(result: TestResult) {
    await this.onStart();
    const state = this.state!;
    state.results.push(result);
    if (result.passed) state.passed++;
    else state.failed++;
    state.lastRun = new Date().toISOString();
    await this.setState(state);
    return { ok: true };
  }

  async recordCoverage(coverage: number) {
    await this.onStart();
    this.state!.coverage = coverage;
    await this.setState(this.state!);
    return { ok: true };
  }

  async getSummary() {
    await this.onStart();
    const state = this.state!;
    return {
      total: state.passed + state.failed,
      passed: state.passed,
      failed: state.failed,
      coverage: state.coverage,
      lastRun: state.lastRun,
      passRate: state.passed + state.failed > 0
        ? Math.round((state.passed / (state.passed + state.failed)) * 100)
        : 0,
    };
  }

  async getFailedTests() {
    await this.onStart();
    return this.state!.results.filter(r => !r.passed);
  }

  async getStatus() {
    await this.onStart();
    return this.state!;
  }

  async runAllTests() {
    return {
      commands: [
        'yarn test --verbose',
        'npx jest --coverage',
      ],
      expectedToPass: true,
    };
  }

  async clearResults() {
    await this.setState({
      results: [],
      coverage: null,
      passed: 0,
      failed: 0,
      lastRun: null,
    });
    return { ok: true };
  }
}
