/// <reference types="vite/client" />

interface ElectronAPI {
  isElectron: boolean;
  isDev: boolean;
  getAppVersion: () => Promise<string>;
  getLive2DModels: () => Promise<string[]>;
  getSystemTheme: () => Promise<string>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  chatWithAI: (message: any) => Promise<any>;
  setAlwaysOnTop: (value: boolean) => Promise<void>;
  getAlwaysOnTop: () => Promise<boolean>;
  onAlwaysOnTopChanged: (callback: (value: boolean) => void) => () => void;
  quitApp: () => Promise<void>;
  openPetMode: (modelUrl: string) => Promise<void>;
  closePetMode: () => Promise<void>;
  dragWindow: (deltaX: number, deltaY: number) => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  checkForUpdates: () => Promise<any>;
  downloadUpdate: () => Promise<void>;
  installUpdate: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: (channel: string, callback: (...args: any[]) => void) => () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sendEvent: (channel: string, ...args: any[]) => void;
  setTransparentMode?: (value: boolean) => Promise<void>;
}

interface Window {
  electronAPI?: ElectronAPI;
}

interface ImportMetaEnv {
  readonly VITE_CLOUDFLARE_ACCOUNT_ID: string;
  readonly VITE_CLOUDFLARE_API_TOKEN: string;
  readonly VITE_USE_MOCK_AI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
