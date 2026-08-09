import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  ApiError,
  authTelegram,
  fetchCapabilities,
  fetchCurrentConsent,
  fetchMe,
  setBearerToken,
  submitConsent as apiSubmitConsent,
  type Capabilities,
  type ConsentState,
  type User,
} from "../api/client";
import {
  isLocalCursorPreview,
  previewAuth,
} from "../dev/local-preview";
import { prepareTelegramViewport } from "../lib/telegram";

export type AuthStatus =
  | "checking"
  | "outside"
  | "authenticating"
  | "ready"
  | "error";

type AuthContextValue = {
  status: AuthStatus;
  colorScheme: "light" | "dark";
  user: User | null;
  capabilities: Capabilities | null;
  consent: ConsentState | null;
  error: string | null;
  retry: () => void;
  acceptConsent: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getInitData(): string {
  return window.Telegram?.WebApp?.initData?.trim() ?? "";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("checking");
  // Telegram may report light|dark; UI stays dark-only and ignores this for theming.
  const [colorScheme, setColorScheme] = useState<"light" | "dark">("dark");
  const [user, setUser] = useState<User | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [consent, setConsent] = useState<ConsentState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const authenticate = useCallback(async () => {
    if (isLocalCursorPreview()) {
      // DEV-only Cursor design preview: no Telegram, no real token, mock session.
      setBearerToken(null);
      setUser(previewAuth.user);
      setCapabilities(previewAuth.capabilities);
      setConsent(previewAuth.consent);
      setError(null);
      setStatus("ready");
      return;
    }

    const initData = getInitData();
    if (!initData) {
      setBearerToken(null);
      setStatus("outside");
      return;
    }

    setStatus("authenticating");
    setError(null);

    try {
      const auth = await authTelegram(initData);
      setBearerToken(auth.token);

      const [me, caps, currentConsent] = await Promise.all([
        fetchMe(),
        fetchCapabilities(),
        fetchCurrentConsent(),
      ]);

      setUser({ id: me.id, username: me.username });
      setCapabilities(caps);
      setConsent(currentConsent.accepted ? currentConsent : me.consent);
      setStatus("ready");
    } catch (err) {
      setBearerToken(null);
      setUser(null);
      setCapabilities(null);
      setConsent(null);
      setError(
        err instanceof ApiError
          ? err.message
          : "Не удалось подключиться к серверу",
      );
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    prepareTelegramViewport();
    const webApp = window.Telegram?.WebApp;
    if (webApp) {
      setColorScheme(webApp.colorScheme ?? "dark");
    }

    void authenticate();
  }, [authenticate, attempt]);

  const retry = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  const acceptConsent = useCallback(async () => {
    const result = await apiSubmitConsent();
    setConsent(result);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      colorScheme,
      user,
      capabilities,
      consent,
      error,
      retry,
      acceptConsent,
    }),
    [
      status,
      colorScheme,
      user,
      capabilities,
      consent,
      error,
      retry,
      acceptConsent,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
