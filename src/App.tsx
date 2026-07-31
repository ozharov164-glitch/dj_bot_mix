import { useState } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import { ErrorBanner } from "./components/ErrorBanner";
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

function AppShell() {
  const { status, colorScheme, consent, error, retry } = useAuth();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [route, setRoute] = useState<Route>({ name: "projects" });

  const shellClass = `shell shell--${colorScheme}`;

  if (status === "checking" || status === "authenticating") {
    return (
      <div className={shellClass}>
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
      <div className={shellClass}>
        <OutsideTelegramPage />
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className={shellClass}>
        <main className="page">
          <header className="hero">
            <p className="brand">FADELINE</p>
            <h1>Ошибка входа</h1>
          </header>
          <ErrorBanner message={error ?? "Неизвестная ошибка"} onRetry={retry} />
        </main>
      </div>
    );
  }

  if (!consent?.accepted) {
    return (
      <div className={shellClass}>
        <ConsentPage />
      </div>
    );
  }

  if (!onboardingDone) {
    return (
      <div className={shellClass}>
        <OnboardingPage onContinue={() => setOnboardingDone(true)} />
      </div>
    );
  }

  return (
    <div className={shellClass} data-testid="mixflow-shell">
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
