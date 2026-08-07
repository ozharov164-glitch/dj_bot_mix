import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  deleteProjectFile,
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
import { CardStage, type StageCard } from "../components/CardStage";
import { ErrorBanner } from "../components/ErrorBanner";
import { FlowBreadcrumb } from "../components/FlowBreadcrumb";
import { IconArrowLeft, IconSpark, IconUpload } from "../components/icons";
import { OptionPicker } from "../components/OptionPicker";
import { ProgressBar } from "../components/ProgressBar";
import { RenderStatusHero } from "../components/RenderStatusHero";
import { TrackList } from "../components/TrackList";
import { planClientUploads } from "../lib/batch-upload";
import {
  buildHtmlAccept,
  projectAfterUploadResponse,
} from "../lib/file-accept";
import { EFFECT_HINTS, EFFECT_LABELS } from "../lib/effect-catalog";
import { formatFileCount } from "../lib/plural";
import {
  canEnqueueRender,
  nextRenderPollDelayMs,
  renderStatusDescription,
  renderStatusTitle,
} from "../lib/render-status";
import { hapticImpact, hapticNotification } from "../lib/telegram";
import {
  resolveTransitionCatalog,
  transitionEntry,
} from "../lib/transition-catalog";

type ProjectDetailPageProps = {
  projectId: string;
  onBack: () => void;
};

function statusFallback(status: Project["status"]): string {
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
      return "Готово";
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
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const limits = capabilities?.limits;
  const maxFileBytes = limits?.maxFileSizeBytes;
  const maxProjectBytes = limits?.maxProjectSizeBytes;
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

  async function handleUploadFiles(fileList: FileList | null) {
    if (!project || !editable || !fileList || fileList.length === 0) return;

    const currentProjectBytes = project.files.reduce(
      (sum, file) => sum + file.sizeBytes,
      0,
    );
    const plan = planClientUploads({
      selected: Array.from(fileList),
      projectType: project.type,
      currentTrackCount: project.files.length,
      maxTracks,
      maxFileBytes,
      currentProjectBytes,
      maxProjectBytes,
      allowedExtensions,
      formatBytes,
    });

    if (!plan.ok) {
      setError(plan.message);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setError(null);
    let latest: Project = project;

    try {
      for (let index = 0; index < plan.files.length; index += 1) {
        const file = plan.files[index]!;
        const ordinal = index + 1;
        const total = plan.files.length;
        setUploadName(
          total > 1
            ? `${ordinal}/${total} · ${file.name}`
            : file.name,
        );
        setUploadProgress(Math.round((index / total) * 100));

        const uploaded = await uploadProjectFile(
          latest.id,
          file,
          (fileProgress) => {
            const overall = ((index + fileProgress / 100) / total) * 100;
            setUploadProgress(Math.round(overall));
          },
        );
        latest = projectAfterUploadResponse(uploaded) as Project;
        setProject(latest);
      }

      if (plan.warnings.length > 0) {
        setError(plan.warnings.join(" · "));
      }
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
      hapticNotification("success");
    } catch (err) {
      hapticNotification("error");
      setError(
        err instanceof ApiError ? err.message : "Не удалось запустить обработку",
      );
    } finally {
      setRendering(false);
    }
  }

  if (loading && !project) {
    return (
      <main className="page">
        <p className="muted loading-inline">Загрузка проекта…</p>
        <div className="skeleton-block skeleton-shimmer" aria-hidden="true" />
        <div className="skeleton-block skeleton-block--tall skeleton-shimmer" aria-hidden="true" />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="page">
        {error ? <ErrorBanner message={error} onRetry={() => void load()} /> : null}
        <button
          type="button"
          className="back-link"
          onClick={() => {
            hapticImpact("soft");
            onBack();
          }}
        >
          <span className="back-link__chevron" aria-hidden="true">
            <IconArrowLeft size={16} />
          </span>
          К проектам
        </button>
      </main>
    );
  }

  const filesStepState =
    project.files.length > 0 ? ("done" as const) : ("current" as const);
  const renderStepState =
    renderJob?.status === "COMPLETED"
      ? ("done" as const)
      : project.files.length > 0
        ? ("current" as const)
        : ("upcoming" as const);

  const effects = capabilities?.effects ?? (Object.keys(EFFECT_LABELS) as SingleEffect[]);
  const transitionCatalog = resolveTransitionCatalog(capabilities);
  const selectedTransition = transitionEntry(
    transitionCatalog,
    project.transitionStyle,
  );
  const formats = capabilities?.outputFormats ?? (["mp3", "aac"] as OutputFormat[]);
  const canRender = canEnqueueRender({
    projectType: project.type,
    projectStatus: project.status,
    renderFeature,
    mixRenderFeature,
  });
  const jobActive =
    renderJob?.status === "QUEUED" || renderJob?.status === "RUNNING";
  const renderFocus =
    renderJob != null &&
    (renderJob.status === "QUEUED" ||
      renderJob.status === "RUNNING" ||
      renderJob.status === "COMPLETED" ||
      renderJob.status === "FAILED");
  const renderAvailable =
    (project.type === "SINGLE_EFFECT" && renderFeature) ||
    (project.type === "MIX" && mixRenderFeature);

  const effectOrTransitionLabel =
    project.type === "SINGLE_EFFECT"
      ? EFFECT_LABELS[(project.singleEffect ?? "normalise") as SingleEffect]
      : selectedTransition.labelRu;
  const typeLabel = project.type === "SINGLE_EFFECT" ? "Один трек" : "Микс";
  const styleLabel =
    project.type === "SINGLE_EFFECT" ? "Эффект" : "Переходы";

  const stageCards: StageCard[] = [
    {
      id: "settings",
      title: "Как собираем",
      body: (
        <div className="stage-recipe">
          <div className="stage-recipe__hero">
            <span className="stage-recipe__kicker">{styleLabel}</span>
            <strong className="stage-recipe__value">{effectOrTransitionLabel}</strong>
          </div>
          <div className="stage-recipe__grid">
            <div className="stage-recipe__tile">
              <span className="stage-recipe__kicker">Тип</span>
              <strong>{typeLabel}</strong>
            </div>
            <div className="stage-recipe__tile">
              <span className="stage-recipe__kicker">Формат</span>
              <strong>{project.outputFormat.toUpperCase()}</strong>
            </div>
          </div>
          <p className="stage-recipe__foot">
            {formatFileCount(project.files.length)} в проекте
          </p>
        </div>
      ),
    },
    {
      id: "tracks",
      title: "Треки",
      body: (
        <div className="stage-tracks">
          <p className="stage-tracks__count">
            {project.files.length === 0
              ? "Пока пусто"
              : formatFileCount(project.files.length)}
          </p>
          {project.files.length === 0 ? (
            <p className="stage-tracks__empty">Файлы ещё не добавлены</p>
          ) : (
            <ul className="stage-summary">
              {project.files.map((file, i) => (
                <li key={file.id}>
                  <span className="stage-summary__n">{i + 1}</span>
                  <span className="stage-summary__name">
                    {file.originalFilename}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      ),
    },
    {
      id: "delivery",
      title: "Куда придёт",
      body: (
        <div className="stage-delivery">
          <span className="stage-delivery__mark" aria-hidden="true">
            <IconSpark size={22} />
          </span>
          <strong className="stage-delivery__title">
            {renderJob?.status === "COMPLETED"
              ? "Уже в чате с ботом"
              : "Придёт в чат с ботом"}
          </strong>
          <p className="stage-delivery__copy">
            {renderJob?.status === "COMPLETED"
              ? "Откройте вложение в переписке — скачивать из приложения не нужно."
              : "Можно закрыть приложение и подождать. Готовый файл появится во вложении."}
          </p>
        </div>
      ),
    },
  ];

  return (
    <main
      className={`page page--detail${renderFocus ? " page--render-focus" : ""}`}
    >
      <header className="page-header page-header--detail">
        <div className="page-header__main">
          <button
            type="button"
            className="back-link"
            onClick={() => {
              hapticImpact("soft");
              onBack();
            }}
          >
            <span className="back-link__chevron" aria-hidden="true">
              <IconArrowLeft size={16} />
            </span>
            Проекты
          </button>
          <FlowBreadcrumb
            trail={`Проекты → ${project.title}`}
            steps={[
              { id: "params", label: "Параметры", state: "done" },
              { id: "files", label: "Файлы", state: filesStepState },
              { id: "render", label: "Обработка", state: renderStepState },
            ]}
          />
          <h1 className="page-title">{project.title}</h1>
          <p className="project-meta">
            {project.type === "SINGLE_EFFECT" ? "Один трек" : "Микс"}
            {" · "}
            {renderJob
              ? renderStatusTitle(renderJob.status)
              : project.status === "READY_TO_RENDER"
                ? "Готов к обработке"
                : statusFallback(project.status)}
          </p>
        </div>
      </header>

      {error ? <ErrorBanner message={error} /> : null}

      {renderFocus && renderJob ? (
        <div className="detail-focus">
          <RenderStatusHero
            status={renderJob.status}
            title={
              renderJob.status === "RUNNING"
                ? "Собираем файл"
                : renderJob.status === "QUEUED"
                  ? "Вы в очереди"
                  : renderJob.status === "COMPLETED"
                    ? "Готово"
                    : renderStatusTitle(renderJob.status)
            }
            description={renderStatusDescription(renderJob.status, {
              queuePosition: renderJob.queuePosition,
              errorMessage: renderJob.errorMessage,
            })}
            detail={
              renderJob.status === "COMPLETED" && renderJob.result
                ? `Размер: ${formatBytes(renderJob.result.sizeBytes)}`
                : null
            }
          />
          <CardStage cards={stageCards} autoPlay={jobActive} intervalMs={3200} />
          {renderJob.status === "FAILED" && renderAvailable ? (
            <div className="cta-bar cta-bar--symmetric">
              <Button
                fullWidth
                disabled={!canRender || rendering}
                onClick={() => void handleRender()}
              >
                <IconSpark size={18} />
                Попробовать снова
              </Button>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="detail-edit">
          {project.status === "READY_TO_RENDER" ? (
            <section
              className="panel panel--status panel--success panel--symmetric"
              role="status"
            >
              <strong>Всё готово к обработке</strong>
              <p className="muted">
                Нажмите «Обработать» — готовый файл придёт в чат с ботом. Можно
                закрыть приложение и подождать.
              </p>
            </section>
          ) : null}

          <section className="section">
            <h2 className="section__title">Треки</h2>
            <div className="panel panel--raised">
              <p className="muted">
                {project.type === "SINGLE_EFFECT"
                  ? "Загрузите один аудиофайл, на который у вас есть права."
                  : `Можно выбрать сразу несколько файлов — до ${maxTracks} треков в миксе. Только файлы, на которые у вас есть права.`}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptAttr}
                multiple={project.type === "MIX"}
                className="file-input"
                disabled={!editable || uploadProgress !== null || jobActive}
                onChange={(e) => {
                  void handleUploadFiles(e.target.files);
                }}
              />
              <Button
                fullWidth
                variant="secondary"
                disabled={!editable || uploadProgress !== null || jobActive}
                onClick={() => fileInputRef.current?.click()}
              >
                <IconUpload size={18} />
                {project.type === "MIX" ? "Выбрать файлы" : "Выбрать файл"}
              </Button>
              {uploadProgress !== null && uploadName ? (
                <ProgressBar
                  value={uploadProgress}
                  label={`Загрузка: ${uploadName}`}
                />
              ) : null}
              <div className="track-list-wrap">
                <TrackList
                  files={project.files}
                  editable={editable && !jobActive}
                  busy={busy || uploadProgress !== null || jobActive}
                  onMoveUp={(id) => moveFile(id, -1)}
                  onMoveDown={(id) => moveFile(id, 1)}
                  onDelete={(id) => void handleDeleteFile(id)}
                />
              </div>
            </div>
          </section>

          <section className="section">
            <h2 className="section__title">Настройки</h2>
            <div className="panel">
              {project.type === "SINGLE_EFFECT" ? (
                <OptionPicker
                  label="Эффект"
                  value={project.singleEffect ?? "normalise"}
                  disabled={!editable || busy || jobActive}
                  options={effects.map((effect) => ({
                    value: effect,
                    label: EFFECT_LABELS[effect],
                    description: EFFECT_HINTS[effect],
                  }))}
                  onChange={(next) =>
                    void handleSettingsChange({
                      singleEffect: next as SingleEffect,
                    })
                  }
                  footnote={
                    EFFECT_HINTS[
                      (project.singleEffect ?? "normalise") as SingleEffect
                    ]
                  }
                />
              ) : (
                <OptionPicker
                  label="Стиль переходов"
                  value={project.transitionStyle}
                  disabled={!editable || busy || jobActive}
                  options={transitionCatalog.map((entry) => ({
                    value: entry.id,
                    label: entry.labelRu,
                    description: entry.hintRu,
                  }))}
                  onChange={(next) =>
                    void handleSettingsChange({
                      transitionStyle: next as TransitionStyle,
                    })
                  }
                  footnote={selectedTransition.hintRu}
                  hint="Склейка по времени и громкости, а не по темпу треков."
                />
              )}

              <OptionPicker
                label="Формат результата"
                value={project.outputFormat}
                disabled={!editable || busy || jobActive}
                options={formats.map((format) => ({
                  value: format,
                  label: format.toUpperCase(),
                }))}
                onChange={(next) =>
                  void handleSettingsChange({
                    outputFormat: next as OutputFormat,
                  })
                }
              />
            </div>
          </section>

          <section className="section">
            <h2 className="section__title">Обработка</h2>
            <div className="cta-bar cta-bar--symmetric">
              {renderAvailable ? (
                <Button
                  fullWidth
                  disabled={!canRender || rendering || jobActive}
                  onClick={() => void handleRender()}
                >
                  {rendering || jobActive ? (
                    "Обработка…"
                  ) : (
                    <>
                      <IconSpark size={18} />
                      Обработать
                    </>
                  )}
                </Button>
              ) : (
                <Button fullWidth disabled title="Обработка пока недоступна">
                  Обработка недоступна
                </Button>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
