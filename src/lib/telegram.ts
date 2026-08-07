/** Thin Telegram WebApp helpers — fail soft outside Telegram / old clients. */

export type HapticImpactStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
export type HapticNotificationType = "error" | "success" | "warning";

export function getTelegramWebApp(): TelegramWebApp | undefined {
  return window.Telegram?.WebApp;
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
