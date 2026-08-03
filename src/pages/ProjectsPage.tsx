import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  deleteProject,
  listProjects,
  type Project,
} from "../api/client";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { formatFileCount } from "../lib/plural";

type ProjectsPageProps = {
  onCreate: () => void;
  onOpen: (projectId: string) => void;
};

function projectTypeLabel(type: Project["type"]): string {
  switch (type) {
    case "SINGLE_EFFECT":
      return "Один трек";
    case "MIX":
      return "Микс";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
}

function statusLabel(status: Project["status"]): string {
  switch (status) {
    case "DRAFT":
      return "Черновик";
    case "UPLOADING":
      return "Загрузка";
    case "READY_TO_RENDER":
      return "Готов к обработке";
    case "QUEUED":
      return "В очереди";
    case "ANALYZING":
      return "Анализ";
    case "RENDERING":
      return "Обработка";
    case "COMPLETED":
      return "Готов";
    case "FAILED":
      return "Ошибка";
    case "EXPIRED":
      return "Истёк";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function statusChipClass(status: Project["status"]): string {
  switch (status) {
    case "DRAFT":
      return "status-chip status-chip--draft";
    case "UPLOADING":
      return "status-chip status-chip--uploading";
    case "READY_TO_RENDER":
      return "status-chip status-chip--ready";
    case "QUEUED":
      return "status-chip status-chip--queued";
    case "ANALYZING":
      return "status-chip status-chip--analyzing";
    case "RENDERING":
      return "status-chip status-chip--rendering";
    case "COMPLETED":
      return "status-chip status-chip--completed";
    case "FAILED":
      return "status-chip status-chip--failed";
    case "EXPIRED":
      return "status-chip status-chip--expired";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function ProjectsPage({ onCreate, onOpen }: ProjectsPageProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listProjects();
      setProjects(data.items);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Не удалось загрузить проекты",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleDelete(projectId: string) {
    if (!window.confirm("Удалить проект и все файлы?")) return;
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      setProjects((prev) => prev.filter((p) => p.id !== projectId));
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось удалить проект",
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header__main">
          <div className="brand-block">
            <p className="brand">FADELINE</p>
            <p className="brand-tagline">Дыши музыкой</p>
          </div>
          <h1 className="page-title">Мои проекты</h1>
          <p className="page-subtitle">
            Миксы и эффекты из ваших файлов.
          </p>
        </div>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <p className="muted">Загрузка проектов…</p>
      ) : projects.length === 0 ? (
        <section className="panel panel--empty">
          <div className="empty-icon" aria-hidden="true">
            ♪
          </div>
          <p>Ещё пусто — самое время собрать первый микс</p>
          <p className="muted">
            Или обработайте один трек: громкость, атмосфера, бас.
          </p>
        </section>
      ) : (
        <ul className="project-cards">
          {projects.map((project) => (
            <li key={project.id} className="project-card">
              <button
                type="button"
                className="project-card__open"
                onClick={() => onOpen(project.id)}
              >
                <span
                  className={
                    project.type === "MIX"
                      ? "project-card__mark"
                      : "project-card__mark project-card__mark--effect"
                  }
                  aria-hidden="true"
                >
                  {project.type === "MIX" ? "MIX" : "FX"}
                </span>
                <span className="project-card__body">
                  <span className="project-card__title">{project.title}</span>
                  <span className="project-card__meta-row">
                    <span className="project-card__type">
                      {projectTypeLabel(project.type)}
                    </span>
                    <span className={statusChipClass(project.status)}>
                      {statusLabel(project.status)}
                    </span>
                  </span>
                  <span className="project-card__files">
                    {formatFileCount(project.files.length)}
                  </span>
                </span>
              </button>
              <Button
                variant="icon"
                className="project-card__delete"
                disabled={deletingId === project.id}
                onClick={() => void handleDelete(project.id)}
                aria-label={`Удалить проект ${project.title}`}
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      )}

      <div className="dock dock--mobile-only">
        <Button fullWidth onClick={onCreate}>
          + Новый проект
        </Button>
      </div>
    </main>
  );
}
