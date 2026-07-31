import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  deleteProjectFile,
  downloadRenderResult,
  enqueueRender,
  formatBytes,
  getProject,
  getRenderJob,
  patchProject,
  reorderProjectFiles,
  uploadProjectFile,
  type OutputFormat,
  type Project,
  type RenderJob,
  type SingleEffect,
  type TransitionStyle,
} from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import { ProgressBar } from "../components/ProgressBar";
import { TrackList } from "../components/TrackList";
import {
  buildHtmlAccept,
  projectAfterUploadResponse,
  validateClientUploadFilename,
} from "../lib/file-accept";
import {
  canEnqueueRender,
  nextRenderPollDelayMs,
  renderStatusDescription,
  renderStatusTitle,
} from "../lib/render-status";

type ProjectDetailPageProps = {
  projectId: string;
  onBack: () => void;
};

const EFFECT_LABELS: Record<SingleEffect, string> = {
  normalise: "Нормализация громкости",
  speed_pitch: "Скорость и тон",
  slow_reverb: "Замедление + реверб",
  echo: "Эхо",
  eq: "Эквалайзер",
  bass_boost: "Усиление баса",
};

const TRANSITION_LABELS: Record<TransitionStyle, string> = {
  safe: "Безопасный",
  smooth: "Плавный",
  energetic: "Энергичный",
};

const EDITABLE_STATUSES: Project["status"][] = [
  "DRAFT",
  "UPLOADING",
  "READY_TO_RENDER",
  "FAILED",
];

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const { capabilities } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [renderJob, setRenderJob] = useState<RenderJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const limits = capabilities?.limits;
  const maxFileBytes = limits?.maxFileSizeBytes;
  const maxTracks = limits?.maxTracksPerProject ?? 15;
  const renderFeature = capabilities?.features.render === true;
  const mixRenderFeature = capabilities?.features.mixRender === true;
  const allowedExtensions = (
    limits?.allowedInputExtensions ?? [
      "mp3",
      "m4a",
      "wav",
      "flac",
      "ogg",
      "aac",
    ]
  ).map((extension) => extension.replace(/^\./, "").toLowerCase());
  const acceptAttr = buildHtmlAccept(allowedExtensions);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProject(projectId);
      setProject(data);
      try {
        const job = await getRenderJob(projectId);
        setRenderJob(job);
      } catch (err) {
        if (
          err instanceof ApiError &&
          (err.code === "PROJECT_NOT_FOUND" || err.code === "NOT_FOUND")
        ) {
          setRenderJob(null);
        }
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось загрузить проект",
      );
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void load();
  }, [load]);

  // Poll render status with backoff while queued/running; cleanup on unmount.
  useEffect(() => {
    if (!renderJob) return;
    if (renderJob.status !== "QUEUED" && renderJob.status !== "RUNNING") {
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    const tick = async () => {
      if (cancelled) return;
      try {
        const job = await getRenderJob(projectId);
        if (cancelled) return;
        setRenderJob(job);
        if (job.status === "QUEUED" || job.status === "RUNNING") {
          const delay = nextRenderPollDelayMs(attempt);
          attempt += 1;
          timer = setTimeout(() => {
            void tick();
          }, delay);
        } else {
          const refreshed = await getProject(projectId);
          if (!cancelled) setProject(refreshed);
        }
      } catch {
        if (cancelled) return;
        const delay = nextRenderPollDelayMs(attempt);
        attempt += 1;
        timer = setTimeout(() => {
          void tick();
        }, delay);
      }
    };

    timer = setTimeout(() => {
      void tick();
    }, nextRenderPollDelayMs(0));

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, renderJob?.id, renderJob?.status]);

  const editable =
    project !== null && EDITABLE_STATUSES.includes(project.status);

  async function handleSettingsChange(
    patch:
      | { singleEffect: SingleEffect }
      | { transitionStyle: TransitionStyle }
      | { outputFormat: OutputFormat },
  ) {
    if (!project || !editable) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await patchProject(project.id, patch);
      setProject(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось сохранить настройки",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleUpload(file: File) {
    if (!project || !editable) return;

    if (maxFileBytes && file.size > maxFileBytes) {
      setError(
        `Файл слишком большой (макс. ${formatBytes(maxFileBytes)})`,
      );
      return;
    }

    const check = validateClientUploadFilename(file.name, allowedExtensions);
    if (!check.ok) {
      setError(check.message);
      return;
    }

    if (project.files.length >= maxTracks) {
      setError(`Достигнут лимит: ${maxTracks} треков`);
      return;
    }

    if (project.type === "SINGLE_EFFECT" && project.files.length >= 1) {
      setError("Для проекта с одним эффектом нужен только один файл");
      return;
    }

    setUploadName(file.name);
    setUploadProgress(0);
    setError(null);

    try {
      const uploaded = await uploadProjectFile(
        project.id,
        file,
        setUploadProgress,
      );
      setProject(projectAfterUploadResponse(uploaded) as Project);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось загрузить файл",
      );
    } finally {
      setUploadProgress(null);
      setUploadName(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleReorder(fileIds: string[]) {
    if (!project) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await reorderProjectFiles(project.id, fileIds);
      setProject(updated);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось изменить порядок",
      );
    } finally {
      setBusy(false);
    }
  }

  function moveFile(fileId: string, direction: -1 | 1) {
    if (!project) return;
    const ids = project.files.map((f) => f.id);
    const index = ids.indexOf(fileId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= ids.length) return;
    const next = [...ids];
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    void handleReorder(next);
  }

  async function handleDeleteFile(fileId: string) {
    if (!project || !editable) return;
    if (!window.confirm("Удалить этот трек из проекта?")) return;
    setBusy(true);
    setError(null);
    try {
      await deleteProjectFile(project.id, fileId);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось удалить файл",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleRender() {
    if (!project) return;
    setRendering(true);
    setError(null);
    try {
      const job = await enqueueRender(project.id);
      setRenderJob(job);
      const refreshed = await getProject(project.id);
      setProject(refreshed);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось запустить обработку",
      );
    } finally {
      setRendering(false);
    }
  }

  async function handleDownload() {
    if (!renderJob || renderJob.status !== "COMPLETED") return;
    setDownloading(true);
    setError(null);
    try {
      await downloadRenderResult(renderJob.id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Не удалось скачать результат",
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading && !project) {
    return (
      <main className="page">
        <p className="muted">Загрузка проекта…</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="page">
        {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
        <Button onClick={onBack}>← К проектам</Button>
      </main>
    );
  }

  const effects = capabilities?.effects ?? (Object.keys(EFFECT_LABELS) as SingleEffect[]);
  const transitions =
    capabilities?.transitionStyles ??
    (Object.keys(TRANSITION_LABELS) as TransitionStyle[]);
  const formats = capabilities?.outputFormats ?? (["mp3", "aac"] as OutputFormat[]);
  const canRender = canEnqueueRender({
    projectType: project.type,
    projectStatus: project.status,
    renderFeature,
    mixRenderFeature,
  });
  const jobActive =
    renderJob?.status === "QUEUED" || renderJob?.status === "RUNNING";
  const transitionHint =
    project.type === "MIX"
      ? "Переходы: автоматические плавные переходы (без beatmatching)."
      : null;

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <Button variant="ghost" onClick={onBack}>
            ← Проекты
          </Button>
          <h1>{project.title}</h1>
          <p className="muted project-type">
            {project.type === "SINGLE_EFFECT" ? "Один эффект" : "Микс"}
          </p>
        </div>
      </header>

      {error ? <ErrorBanner message={error} /> : null}

      {renderJob ? (
        <section
          className={
            renderJob.status === "COMPLETED"
              ? "panel panel--success"
              : renderJob.status === "FAILED"
                ? "panel panel--danger"
                : "panel"
          }
          role="status"
          aria-live="polite"
        >
          <strong>{renderStatusTitle(renderJob.status)}</strong>
          <p className="muted">
            {renderStatusDescription(renderJob.status, {
              queuePosition: renderJob.queuePosition,
              errorMessage: renderJob.errorMessage,
            })}
          </p>
          {renderJob.status === "COMPLETED" && renderJob.result ? (
            <p className="muted">
              Размер: {formatBytes(renderJob.result.sizeBytes)}. Хранится до{" "}
              {new Date(renderJob.result.expiresAt).toLocaleString("ru-RU")}.
            </p>
          ) : null}
          {renderJob.status === "COMPLETED" ? (
            <Button
              fullWidth
              disabled={downloading}
              onClick={() => void handleDownload()}
            >
              {downloading ? "Скачивание…" : "Скачать результат"}
            </Button>
          ) : null}
        </section>
      ) : project.status === "READY_TO_RENDER" ? (
        <section className="panel panel--success" role="status">
          <strong>Проект готов к обработке</strong>
          <p className="muted">
            Все условия выполнены. Нажмите «Обработать», чтобы поставить задачу
            в очередь.
          </p>
        </section>
      ) : null}

      <section className="panel">
        <h2 className="panel__title">Загрузка</h2>
        <p className="muted">
          {project.type === "SINGLE_EFFECT"
            ? "Загрузите один аудиофайл."
            : `Загрузите от 2 до ${maxTracks} треков для микса.`}
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptAttr}
          className="file-input"
          disabled={!editable || uploadProgress !== null || jobActive}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button
          fullWidth
          disabled={!editable || uploadProgress !== null || jobActive}
          onClick={() => fileInputRef.current?.click()}
        >
          Выбрать файл
        </Button>
        {uploadProgress !== null && uploadName ? (
          <ProgressBar
            value={uploadProgress}
            label={`Загрузка: ${uploadName}`}
          />
        ) : null}
      </section>

      <section className="panel">
        <h2 className="panel__title">Треки</h2>
        <TrackList
          files={project.files}
          editable={editable && !jobActive}
          busy={busy || uploadProgress !== null || jobActive}
          onMoveUp={(id) => moveFile(id, -1)}
          onMoveDown={(id) => moveFile(id, 1)}
          onDelete={(id) => void handleDeleteFile(id)}
        />
      </section>

      <section className="panel">
        <h2 className="panel__title">Настройки</h2>
        {project.type === "SINGLE_EFFECT" ? (
          <label className="field">
            <span className="field__label">Эффект</span>
            <select
              className="field__input"
              value={project.singleEffect ?? "normalise"}
              disabled={!editable || busy || jobActive}
              onChange={(e) =>
                void handleSettingsChange({
                  singleEffect: e.target.value as SingleEffect,
                })
              }
            >
              {effects.map((effect) => (
                <option key={effect} value={effect}>
                  {EFFECT_LABELS[effect]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <label className="field">
            <span className="field__label">Стиль переходов</span>
            <select
              className="field__input"
              value={project.transitionStyle}
              disabled={!editable || busy || jobActive}
              onChange={(e) =>
                void handleSettingsChange({
                  transitionStyle: e.target.value as TransitionStyle,
                })
              }
            >
              {transitions.map((style) => (
                <option key={style} value={style}>
                  {TRANSITION_LABELS[style]}
                </option>
              ))}
            </select>
            <span className="muted field__hint">
              автоматические плавные переходы — без гарантии beatmatching
            </span>
          </label>
        )}

        <label className="field">
          <span className="field__label">Формат результата</span>
          <select
            className="field__input"
            value={project.outputFormat}
            disabled={!editable || busy || jobActive}
            onChange={(e) =>
              void handleSettingsChange({
                outputFormat: e.target.value as OutputFormat,
              })
            }
          >
            {formats.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </section>

      <section className="panel panel--muted">
        {(project.type === "SINGLE_EFFECT" && renderFeature) ||
        (project.type === "MIX" && mixRenderFeature) ? (
          <>
            {transitionHint ? (
              <p className="muted">{transitionHint}</p>
            ) : null}
            <Button
              fullWidth
              disabled={!canRender || rendering || jobActive}
              onClick={() => void handleRender()}
            >
              {rendering || jobActive ? "Обработка…" : "Обработать"}
            </Button>
          </>
        ) : (
          <Button fullWidth disabled title="Обработка пока недоступна">
            Обработка недоступна
          </Button>
        )}
      </section>
    </main>
  );
}
