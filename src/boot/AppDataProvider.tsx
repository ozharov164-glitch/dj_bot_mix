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
  deleteProject,
  listProjects,
  type Project,
} from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { isStaleProject } from "../lib/projects-list";
import { warmChromeAssets } from "./warm-assets";

export type BootStatus = "idle" | "loading" | "ready" | "error";

type AppDataContextValue = {
  bootStatus: BootStatus;
  bootError: string | null;
  projects: Project[];
  refreshProjects: () => Promise<void>;
  removeProject: (projectId: string) => void;
  upsertProject: (project: Project) => void;
  retryBoot: () => void;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

async function fetchActiveProjects(): Promise<Project[]> {
  const data = await listProjects();
  const stale = data.items.filter(isStaleProject);
  const active = data.items.filter((p) => !isStaleProject(p));
  if (stale.length > 0) {
    void Promise.allSettled(stale.map((p) => deleteProject(p.id)));
  }
  return active;
}

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { status: authStatus } = useAuth();
  const [bootStatus, setBootStatus] = useState<BootStatus>("idle");
  const [bootError, setBootError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [bootAttempt, setBootAttempt] = useState(0);

  const bootstrap = useCallback(async () => {
    setBootStatus("loading");
    setBootError(null);
    try {
      const [active] = await Promise.all([
        fetchActiveProjects(),
        warmChromeAssets(),
      ]);
      setProjects(active);
      setBootStatus("ready");
    } catch (err) {
      setBootError(
        err instanceof Error ? err.message : "Не удалось подготовить студию",
      );
      setBootStatus("error");
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "ready") {
      setBootStatus("idle");
      return;
    }
    void bootstrap();
  }, [authStatus, bootAttempt, bootstrap]);

  const refreshProjects = useCallback(async () => {
    const active = await fetchActiveProjects();
    setProjects(active);
  }, []);

  const removeProject = useCallback((projectId: string) => {
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
  }, []);

  const upsertProject = useCallback((project: Project) => {
    setProjects((prev) => {
      const without = prev.filter((p) => p.id !== project.id);
      if (isStaleProject(project)) return without;
      return [project, ...without];
    });
  }, []);

  const retryBoot = useCallback(() => {
    setBootAttempt((n) => n + 1);
  }, []);

  const value = useMemo<AppDataContextValue>(
    () => ({
      bootStatus,
      bootError,
      projects,
      refreshProjects,
      removeProject,
      upsertProject,
      retryBoot,
    }),
    [
      bootStatus,
      bootError,
      projects,
      refreshProjects,
      removeProject,
      upsertProject,
      retryBoot,
    ],
  );

  return (
    <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>
  );
}

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within AppDataProvider");
  }
  return ctx;
}
