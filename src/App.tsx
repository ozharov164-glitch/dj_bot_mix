import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { BrandMark } from "./components/BrandMark";
import { ErrorBanner } from "./components/ErrorBanner";
import { isLocalCursorPreview } from "./dev/preview-flag";
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

function AppShell() {
  const { status, consent, error, retry } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(() =>
    isLocalCursorPreview(),
  );
  const [route, setRoute] = useState<Route>({ name: "projects" });

  if (status === "checking" || status === "authenticating") {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
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
        <OutsideTelegramPage />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <main className="page">
          <header className="hero">
            <BrandMark variant="compact" />
            <h1>Ошибка входа</h1>
          </header>
          <ErrorBanner message={error ?? "Неизвестная ошибка"} onRetry={retry} />
        </main>
      </div>
    );
  }

  if (!consent?.accepted) {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <ConsentPage />
      </div>
    );
  }

  if (!onboardingDone) {
    return (
      <div className={SHELL_CLASS} data-testid="mixflow-shell">
        <OnboardingPage onContinue={() => setOnboardingDone(true)} />
      </div>
    );
  }

  const withDock = route.name === "projects";

  return (
    <div
      className={`${SHELL_CLASS}${withDock ? " shell--with-dock" : ""}`}
      data-testid="mixflow-shell"
    >
      {route.name === "projects" ? (
        <ProjectsPage
          onCreate={() => setRoute({ name: "create" })}
          onOpen={(id) => setRoute({ name: "project", id })}
        />
      ) : null}
      {route.name === "create" ? (
        <CreateProjectPage
          onBack={() => setRoute({ name: "projects" })}
          onCreated={(id) => setRoute({ name: "project", id })}
        />
      ) : null}
      {route.name === "project" ? (
        <ProjectDetailPage
          projectId={route.id}
          onBack={() => setRoute({ name: "projects" })}
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
