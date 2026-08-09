import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { AppDataProvider, useAppData } from "./boot/AppDataProvider";
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
    status === "ready" &&
    Boolean(consent?.accepted) &&
    onboardingDone &&
    bootStatus === "ready";
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
      <ShellFrame>
        <LoadingPage
          message={
            status === "authenticating"
              ? "Вход через Telegram…"
              : "Загрузка…"
          }
        />
      </ShellFrame>
    );
  }

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

  if (!consent?.accepted) {
    return (
      <ShellFrame>
        <ConsentPage />
      </ShellFrame>
    );
  }

  if (!onboardingDone) {
    return (
      <ShellFrame>
        <OnboardingPage onContinue={() => setOnboardingDone(true)} />
      </ShellFrame>
    );
  }

  if (bootStatus === "idle" || bootStatus === "loading") {
    return (
      <ShellFrame>
        <LoadingPage message="Готовим студию…" />
      </ShellFrame>
    );
  }

  if (bootStatus === "error") {
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
