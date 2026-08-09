import { useMemo, useState } from "react";
import {
  ApiError,
  deleteProject,
  type Project,
} from "../api/client";
import { useAppData } from "../boot/AppDataProvider";
import { Button } from "../components/Button";
import { BrandMark } from "../components/BrandMark";
import { ErrorBanner } from "../components/ErrorBanner";
import {
  IconFxMark,
  IconMixMark,
  IconPlus,
  IconTrash,
} from "../components/icons";
import {
  partitionActiveProjects,
} from "../lib/projects-list";
import { formatFileCount } from "../lib/plural";
import { hapticImpact } from "../lib/telegram";
import djHeader from "../assets/brand/fadeline-dj-silhouette-v6.png";

type ProjectsPageProps = {
  onCreate: () => void;
  onOpen: (projectId: string) => void;
};

export { isStaleProject, partitionActiveProjects } from "../lib/projects-list";

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

function ProjectCard({
  project,
  deleting,
  onOpen,
  onDelete,
}: {
  project: Project;
  deleting: boolean;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <li className="project-card">
      <button
        type="button"
        className="project-card__open"
        onClick={() => {
          hapticImpact("light");
          onOpen(project.id);
        }}
      >
        <span
          className={
            project.type === "MIX"
              ? "project-card__mark"
              : "project-card__mark project-card__mark--effect"
          }
          aria-hidden="true"
        >
          {project.type === "MIX" ? (
            <IconMixMark size={20} />
          ) : (
            <IconFxMark size={20} />
          )}
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
      <div className="project-card__tools">
        <Button
          variant="icon"
          className="btn--icon-danger"
          disabled={deleting}
          onClick={() => onDelete(project.id)}
          aria-label={`Удалить проект ${project.title}`}
        >
          <IconTrash size={15} />
        </Button>
      </div>
    </li>
  );
}

export function ProjectsPage({ onCreate, onOpen }: ProjectsPageProps) {
  const { projects, removeProject } = useAppData();
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { mixes, singles } = useMemo(
    () => partitionActiveProjects(projects),
    [projects],
  );

  async function handleDelete(projectId: string) {
    if (!window.confirm("Удалить проект и все файлы?")) return;
    setDeletingId(projectId);
    try {
      await deleteProject(projectId);
      removeProject(projectId);
      hapticImpact("medium");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось удалить проект",
      );
    } finally {
      setDeletingId(null);
    }
  }

  const hasProjects = mixes.length > 0 || singles.length > 0;

  return (
    <main className="page">
      <header className="page-header page-header--home">
        <div className="page-header__main">
          <div className="home-masthead">
            <div className="home-masthead__copy">
              <BrandMark variant="row" />
              <div className="home-hero">
                <p className="home-hero__eyebrow">Ваша студия</p>
                <h1 className="page-title page-title--home">Мои проекты</h1>
                <p className="page-subtitle">
                  Миксы и эффекты из ваших файлов — результат приходит в чат с
                  ботом.
                </p>
              </div>
            </div>
            <div className="home-masthead__art" aria-hidden="true">
              <span className="home-masthead__glow" />
              <img
                className="home-masthead__dj"
                src={djHeader}
                alt=""
                draggable={false}
              />
            </div>
          </div>
        </div>
      </header>

      {error ? (
        <ErrorBanner message={error} onRetry={() => setError(null)} />
      ) : null}

      {!hasProjects ? (
        <section className="panel panel--empty">
          <div className="empty-icon" aria-hidden="true">
            <IconMixMark size={32} />
          </div>
          <p>Пока пусто — соберите первый микс</p>
          <p className="muted">
            Или обработайте один трек: громкость, атмосфера, бас.
          </p>
          <Button
            fullWidth
            className="empty-cta"
            onClick={() => {
              hapticImpact("medium");
              onCreate();
            }}
          >
            <IconPlus size={18} />
            Создать проект
          </Button>
        </section>
      ) : (
        <div className="project-sections">
          {mixes.length > 0 ? (
            <section className="project-section" aria-label="Миксы">
              <h2 className="project-section__title">Миксы</h2>
              <ul className="project-cards">
                {mixes.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    deleting={deletingId === project.id}
                    onOpen={onOpen}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            </section>
          ) : null}

          {singles.length > 0 ? (
            <section className="project-section" aria-label="Один трек">
              <h2 className="project-section__title">Один трек</h2>
              <ul className="project-cards">
                {singles.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    deleting={deletingId === project.id}
                    onOpen={onOpen}
                    onDelete={(id) => void handleDelete(id)}
                  />
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      )}

      <p className="projects-footnote">
        Готовые файлы приходят в чат с ботом и на сервере не хранятся. Не
        удаляйте переписку с @fadeline_bot — иначе потеряете результаты.
      </p>
    </main>
  );
}
