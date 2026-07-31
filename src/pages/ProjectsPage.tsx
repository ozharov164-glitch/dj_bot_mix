import { useCallback, useEffect, useState } from "react";
import {
  ApiError,
  deleteProject,
  listProjects,
  type Project,
} from "../api/client";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";

type ProjectsPageProps = {
  onCreate: () => void;
  onOpen: (projectId: string) => void;
};

function projectTypeLabel(type: Project["type"]): string {
  switch (type) {
    case "SINGLE_EFFECT":
      return "Один эффект";
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
        <div>
          <p className="brand">FADELINE</p>
          <h1>Мои проекты</h1>
        </div>
        <Button onClick={onCreate}>Новый</Button>
      </header>

      {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}

      {loading ? (
        <p className="muted">Загрузка проектов…</p>
      ) : projects.length === 0 ? (
        <section className="panel panel--empty">
          <p>Проектов пока нет.</p>
          <p className="muted">
            Создайте проект с одним эффектом или микс из ваших треков.
          </p>
          <Button fullWidth onClick={onCreate}>
            Создать первый проект
          </Button>
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
                <span className="project-card__title">{project.title}</span>
                <span className="project-card__meta">
                  {projectTypeLabel(project.type)} · {statusLabel(project.status)}
                </span>
                <span className="project-card__files">
                  {project.files.length} файл(ов)
                </span>
              </button>
              <Button
                variant="danger"
                disabled={deletingId === project.id}
                onClick={() => void handleDelete(project.id)}
              >
                Удалить
              </Button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
