/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_ALLOW_DEV_API?: string;
  readonly VITE_BASE_PATH?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData?: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
