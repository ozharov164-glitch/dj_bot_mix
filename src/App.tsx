import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { AppDataProvider, useAppData } from "./boot/AppDataProvider";
import { AppDock } from "./components/AppDock";
import { BrandMark } from "./components/BrandMark";
import { ErrorBanner } from "./components/ErrorBanner";
import { PageStage, type NavDirection } from "./components/PageStage";
import {
  StudioSplash,
  studioSplashMinMs,
} from "./components/StudioSplash";
import { isLocalCursorPreview } from "./dev/preview-flag";
import {
  hasCompletedOnboarding,
  markOnboardingCompleted,
} from "./lib/onboarding-storage";
import { hapticImpact, syncTelegramBackButton } from "./lib/telegram";
import { ConsentPage } from "./pages/ConsentPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { OutsideTelegramPage } from "./pages/OutsideTelegramPage";
import { ProjectDetailPage } from "./pages/ProjectDetailPage";
import { ProjectsPage } from "./pages/ProjectsPage";

type Route =
  | { name: "projects" }
  | { name: "create" }
  | { name: "project"; id: string };

/** Mini App is dark-only; Telegram colorScheme must never flip the shell to light. */
const SHELL_CLASS = "shell shell--dark";

function routeKey(route: Route): string {
  switch (route.name) {
    case "projects":
      return "projects";
    case "create":
      return "create";
    case "project":
      return `project:${route.id}`;
    default: {
      const _exhaustive: never = route;
      return _exhaustive;
    }
  }
}

function ShellFrame({
  children,
  withDock = false,
}: {
  children: ReactNode;
  withDock?: boolean;
}) {
  return (
    <div
      className={`${SHELL_CLASS}${withDock ? " shell--with-dock" : ""}`}
      data-testid="mixflow-shell"
    >
      <div className="shell-atmosphere" aria-hidden="true">
        <span className="shell-blob shell-blob--a" />
        <span className="shell-blob shell-blob--b" />
        <span className="shell-blob shell-blob--c" />
      </div>
      {children}
    </div>
  );
}

function AppShell() {
  const { status, consent, error, retry } = useAuth();
  const { bootStatus, bootError, retryBoot, upsertProject } = useAppData();
  const [onboardingDone, setOnboardingDone] = useState(
    () => isLocalCursorPreview() || hasCompletedOnboarding(),
  );
  const [splashDone, setSplashDone] = useState(false);
  /** Absolute deadline — survives auth→ready without restarting the splash. */
  const splashDeadlineRef = useRef<number | null>(null);
  const [route, setRoute] = useState<Route>({ name: "projects" });
  const [direction, setDirection] = useState<NavDirection>("none");

  const navigate = useCallback((next: Route, dir: NavDirection) => {
    setDirection(dir);
    setRoute(next);
    if (dir !== "none") {
      hapticImpact(dir === "forward" ? "light" : "soft");
    }
  }, []);

  const finishOnboarding = useCallback(() => {
    markOnboardingCompleted();
    setOnboardingDone(true);
  }, []);

  const postConsentReady =
    status === "ready" && Boolean(consent?.accepted) && onboardingDone;
  const authPending = status === "checking" || status === "authenticating";

  useEffect(() => {
    // Consent / onboarding interrupt the boot splash — restart after they finish.
    if (status === "ready" && consent && !consent.accepted) {
      splashDeadlineRef.current = null;
      setSplashDone(false);
      return;
    }
    if (status === "ready" && !onboardingDone) {
      splashDeadlineRef.current = null;
      setSplashDone(false);
      return;
    }

    const clockActive = authPending || postConsentReady;
    if (!clockActive) {
      return;
    }

    if (splashDeadlineRef.current == null) {
      splashDeadlineRef.current = performance.now() + studioSplashMinMs();
    }
    const remaining = Math.max(
      0,
      splashDeadlineRef.current - performance.now(),
    );
    const timer = window.setTimeout(() => {
      setSplashDone(true);
    }, remaining);
    return () => window.clearTimeout(timer);
  }, [authPending, postConsentReady, status, consent, onboardingDone]);

  const showChrome =
    postConsentReady && splashDone && bootStatus === "ready";
  const showBack = showChrome && route.name !== "projects";
  const withDock =
    showChrome && (route.name === "projects" || route.name === "create");

  useEffect(() => {
    if (!showBack) {
      return syncTelegramBackButton(false, () => {});
    }
    return syncTelegramBackButton(true, () => {
      navigate({ name: "projects" }, "back");
    });
  }, [showBack, navigate]);

  if (status === "outside") {
    return (
      <ShellFrame>
        <OutsideTelegramPage />
      </ShellFrame>
    );
  }

  if (status === "error") {
    return (
      <ShellFrame>
        <main className="page">
          <header className="hero">
            <BrandMark variant="compact" />
            <h1>Не удалось войти</h1>
            <p className="lead">
              Проверьте соединение и откройте приложение снова из чата с ботом.
            </p>
          </header>
          <ErrorBanner message={error ?? "Неизвестная ошибка"} onRetry={retry} />
        </main>
      </ShellFrame>
    );
  }

  if (status === "ready" && !consent?.accepted) {
    return (
      <ShellFrame>
        <ConsentPage />
      </ShellFrame>
    );
  }

  if (status === "ready" && !onboardingDone) {
    return (
      <ShellFrame>
        <OnboardingPage onContinue={finishOnboarding} />
      </ShellFrame>
    );
  }

  if (bootStatus === "error" && splashDone) {
    return (
      <ShellFrame>
        <main className="page">
          <header className="hero">
            <BrandMark variant="compact" />
            <h1>Не удалось загрузить</h1>
            <p className="lead">
              Проекты и настройки не подтянулись. Попробуйте ещё раз.
            </p>
          </header>
          <ErrorBanner
            message={bootError ?? "Ошибка загрузки"}
            onRetry={retryBoot}
          />
        </main>
      </ShellFrame>
    );
  }

  // One continuous StudioSplash across auth → boot (no remount / restart).
  if (
    authPending ||
    !splashDone ||
    bootStatus === "idle" ||
    bootStatus === "loading"
  ) {
    const splashStatus =
      status === "authenticating"
        ? "Вход через Telegram…"
        : status === "checking"
          ? "Открываем студию…"
          : undefined;
    return (
      <ShellFrame>
        <StudioSplash status={splashStatus} />
      </ShellFrame>
    );
  }

  return (
    <ShellFrame withDock={withDock}>
      <PageStage routeKey={routeKey(route)} direction={direction}>
        {route.name === "projects" ? (
          <ProjectsPage
            onCreate={() => navigate({ name: "create" }, "forward")}
            onOpen={(id) => navigate({ name: "project", id }, "forward")}
          />
        ) : null}
        {route.name === "create" ? (
          <CreateProjectPage
            onBack={() => navigate({ name: "projects" }, "back")}
            onCreated={(project) => {
              upsertProject(project);
              navigate({ name: "project", id: project.id }, "forward");
            }}
          />
        ) : null}
        {route.name === "project" ? (
          <ProjectDetailPage
            projectId={route.id}
            onBack={() => navigate({ name: "projects" }, "back")}
          />
        ) : null}
      </PageStage>

      {withDock ? (
        <AppDock
          active={route.name === "create" ? "create" : "projects"}
          onProjects={() => {
            if (route.name !== "projects") {
              navigate({ name: "projects" }, "back");
            }
          }}
          onCreate={() => {
            if (route.name !== "create") {
              navigate({ name: "create" }, "forward");
            }
          }}
        />
      ) : null}
    </ShellFrame>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppDataProvider>
        <AppShell />
      </AppDataProvider>
    </AuthProvider>
  );
}
