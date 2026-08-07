import { useCallback, useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { AppDock } from "./components/AppDock";
import { BrandMark } from "./components/BrandMark";
import { ErrorBanner } from "./components/ErrorBanner";
import { PageStage, type NavDirection } from "./components/PageStage";
import { isLocalCursorPreview } from "./dev/preview-flag";
import { hapticImpact, syncTelegramBackButton } from "./lib/telegram";
import { ConsentPage } from "./pages/ConsentPage";
import { CreateProjectPage } from "./pages/CreateProjectPage";
import { LoadingPage } from "./pages/LoadingPage";
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

function AppShell() {
  const { status, consent, error, retry } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(() =>
    isLocalCursorPreview(),
  );
  const [route, setRoute] = useState<Route>({ name: "projects" });
  const [direction, setDirection] = useState<NavDirection>("none");

  const navigate = useCallback((next: Route, dir: NavDirection) => {
    setDirection(dir);
    setRoute(next);
    if (dir !== "none") {
      hapticImpact(dir === "forward" ? "light" : "soft");
    }
  }, []);

  const showChrome =
    status === "ready" && Boolean(consent?.accepted) && onboardingDone;
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

  if (status === "checking" || status === "authenticating") {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <div className="shell-atmosphere" aria-hidden="true">
          <span className="shell-blob shell-blob--a" />
          <span className="shell-blob shell-blob--b" />
        </div>
        <LoadingPage
          message={
            status === "authenticating"
              ? "Вход через Telegram…"
              : "Загрузка…"
          }
        />
      </div>
    );
  }

  if (status === "outside") {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <div className="shell-atmosphere" aria-hidden="true">
          <span className="shell-blob shell-blob--a" />
          <span className="shell-blob shell-blob--b" />
        </div>
        <OutsideTelegramPage />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <div className="shell-atmosphere" aria-hidden="true">
          <span className="shell-blob shell-blob--a" />
          <span className="shell-blob shell-blob--b" />
        </div>
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
      </div>
    );
  }

  if (!consent?.accepted) {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <div className="shell-atmosphere" aria-hidden="true">
          <span className="shell-blob shell-blob--a" />
          <span className="shell-blob shell-blob--b" />
        </div>
        <ConsentPage />
      </div>
    );
  }

  if (!onboardingDone) {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <div className="shell-atmosphere" aria-hidden="true">
          <span className="shell-blob shell-blob--a" />
          <span className="shell-blob shell-blob--b" />
        </div>
        <OnboardingPage onContinue={() => setOnboardingDone(true)} />
      </div>
    );
  }

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
            onCreated={(id) => navigate({ name: "project", id }, "forward")}
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
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
