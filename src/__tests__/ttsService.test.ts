/**
 * @jest-environment node
 */

describe('ttsService', () => {
  // Mock window.speechSynthesis for Node environment
  const mockSpeak = jest.fn();
  const mockGetVoices = jest.fn().mockReturnValue([]);
  const mockCancel = jest.fn();
  const mockPause = jest.fn();
  const mockResume = jest.fn();

  beforeAll(() => {
    (global as any).window = {};
    (global as any).window.speechSynthesis = {
      speak: mockSpeak,
      getVoices: mockGetVoices,
      cancel: mockCancel,
      pause: mockPause,
      resume: mockResume,
    };
    (global as any).SpeechSynthesisUtterance = class MockUtterance {
      text: string = '';
      onend: (() => void) | null = null;
      constructor(text: string) {
        this.text = text;
        // Auto-call onend asynchronously to resolve the speak Promise
        setTimeout(() => this.onend?.(), 10);
      }
    };
  });

  beforeEach(() => {
    jest.resetModules();
  });

  it('isSupported returns true when speechSynthesis exists', async () => {
    const { isSupported } = await import('../renderer/services/ttsService');
    expect(isSupported()).toBe(true);
  });

  it('isSupported returns false when speechSynthesis is missing', () => {
    const orig = (global as any).window.speechSynthesis;
    delete (global as any).window.speechSynthesis;
    jest.resetModules();
    const { isSupported } = require('../renderer/services/ttsService');
    expect(isSupported()).toBe(false);
    (global as any).window.speechSynthesis = orig;
  });

  it('getDefaultConfig returns expected config', async () => {
    const { getDefaultConfig } = await import('../renderer/services/ttsService');
    const config = getDefaultConfig();
    expect(config).toHaveProperty('voice');
    expect(config).toHaveProperty('rate');
    expect(config).toHaveProperty('pitch');
    expect(config).toHaveProperty('volume');
    expect(config.rate).toBe(1.0);
    expect(config.volume).toBe(1.0);
  });

  it('speak calls speechSynthesis.speak', async () => {
    const { speak } = await import('../renderer/services/ttsService');
    await speak('test');
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSpeak).toHaveBeenCalled();
  });

  it('stop calls speechSynthesis.cancel', async () => {
    const { stop } = await import('../renderer/services/ttsService');
    stop();
    expect(mockCancel).toHaveBeenCalled();
  });

  it('pause calls speechSynthesis.pause', async () => {
    const { pause } = await import('../renderer/services/ttsService');
    pause();
    expect(mockPause).toHaveBeenCalled();
  });

  it('resume calls speechSynthesis.resume', async () => {
    const { resume } = await import('../renderer/services/ttsService');
    resume();
    expect(mockResume).toHaveBeenCalled();
  });
});
