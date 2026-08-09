/** Thin Telegram WebApp helpers — fail soft outside Telegram / old clients. */

export type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotificationType = "error" | "success" | "warning";

/** Public bot username (no @) — delivery archive lives in this chat. */
export const FADELINE_BOT_USERNAME = "fadeline_bot";

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

/** Expand + fullscreen (desktop/Telegram) — fail soft on older clients. */
export function prepareTelegramViewport(): void {
  const webApp = getTelegramWebApp();
  if (!webApp) return;
  try {
    webApp.ready();
    webApp.expand();
  } catch {
    // ignore
  }
  try {
    webApp.setHeaderColor?.("#07090C");
    webApp.setBackgroundColor?.("#07090C");
  } catch {
    // ignore
  }
  try {
    webApp.disableVerticalSwipes?.();
  } catch {
    // ignore
  }
  try {
    webApp.requestFullscreen?.();
  } catch {
    // ignore — not all clients support Bot API 8 fullscreen
  }
}

export function hapticImpact(style: HapticImpactStyle = "light"): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.impactOccurred?.(style);
  } catch {
    // Older clients / desktop may not support haptics.
  }
}

export function hapticNotification(type: HapticNotificationType): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.notificationOccurred?.(type);
  } catch {
    // ignore
  }
}

export function hapticSelection(): void {
  try {
    getTelegramWebApp()?.HapticFeedback?.selectionChanged?.();
  } catch {
    // ignore
  }
}

/** Open FADELINE bot chat (cannot deep-link to a specific audio message). */
export function openBotChat(): void {
  const url = `https://t.me/${FADELINE_BOT_USERNAME}`;
  const webApp = getTelegramWebApp();
  try {
    if (webApp?.openTelegramLink) {
      webApp.openTelegramLink(url);
      return;
    }
    if (webApp?.openLink) {
      webApp.openLink(url);
      return;
    }
  } catch {
    // fall through
  }
  window.open(url, "_blank", "noopener,noreferrer");
}

/**
 * Show Telegram header BackButton while `visible`, wire `onBack`.
 * Returns cleanup that hides the button and removes the listener.
 */
export function syncTelegramBackButton(
  visible: boolean,
  onBack: () => void,
): () => void {
  const backButton = getTelegramWebApp()?.BackButton;
  if (!backButton) {
    return () => {};
  }

  const handler = () => {
    onBack();
  };

  try {
    backButton.offClick?.(handler);
    if (visible) {
      backButton.onClick?.(handler);
      backButton.show?.();
    } else {
      backButton.hide?.();
    }
  } catch {
    return () => {};
  }

  return () => {
    try {
      backButton.offClick?.(handler);
      backButton.hide?.();
    } catch {
      // ignore
    }
  };
}
