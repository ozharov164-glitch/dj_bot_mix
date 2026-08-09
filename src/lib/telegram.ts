/** Thin Telegram WebApp helpers — fail soft outside Telegram / old clients. */

export type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotificationType = "error" | "success" | "warning";

/** Public bot username (no @) — delivery archive lives in this chat. */
export const FADELINE_BOT_USERNAME = "fadeline_bot";

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
}

/** Expand Mini App chrome — fail soft. Do not auto-request fullscreen on desktop. */
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

  // Inside Mini App WebView, window.open is often blocked — use Telegram APIs.
  try {
    if (typeof webApp?.openTelegramLink === "function") {
      webApp.openTelegramLink(url);
      // Some mobile clients keep the Mini App covering the chat; close so
      // the bot conversation (with the delivered file) becomes visible.
      window.setTimeout(() => {
        try {
          webApp.close?.();
        } catch {
          // ignore
        }
      }, 40);
      return;
    }
  } catch {
    // fall through
  }

  try {
    if (typeof webApp?.openLink === "function") {
      webApp.openLink(url, { try_instant_view: false });
      return;
    }
  } catch {
    // fall through
  }

  // Last resort: same-frame navigation (window.open is blocked in TG WebView).
  try {
    window.location.assign(url);
  } catch {
    window.open(url, "_blank", "noopener,noreferrer");
  }
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
