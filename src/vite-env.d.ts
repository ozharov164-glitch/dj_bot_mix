/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_BASE_PATH?: string;
  readonly VITE_ALLOW_DEV_API?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "*?raw" {
  const content: string;
  export default content;
}

interface TelegramHapticFeedback {
  impactOccurred?: (
    style: "light" | "medium" | "heavy" | "rigid" | "soft",
  ) => void;
  notificationOccurred?: (type: "error" | "success" | "warning") => void;
  selectionChanged?: () => void;
}

interface TelegramBackButton {
  show?: () => void;
  hide?: () => void;
  onClick?: (cb: () => void) => void;
  offClick?: (cb: () => void) => void;
  isVisible?: boolean;
}

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  initData?: string;
  colorScheme?: "light" | "dark";
  themeParams?: Record<string, string>;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
  close?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  isExpanded?: boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  HapticFeedback?: TelegramHapticFeedback;
  BackButton?: TelegramBackButton;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
