/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDFLARE_ACCOUNT_ID: string;
  readonly VITE_CLOUDFLARE_API_TOKEN: string;
  readonly VITE_USE_MOCK_AI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
