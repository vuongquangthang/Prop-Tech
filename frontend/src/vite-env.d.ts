/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TROUYTIN_API_BASE_URL?: string;
  readonly VITE_TROUYTIN_INTERNAL_API_KEY?: string;
  readonly VITE_TROUYTIN_WEB_BASE_URL?: string;
  readonly VITE_TROUYTIN_WS_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
