import { useCallback, useEffect, useRef, useState } from "react";
import {
  ApiError,
  deleteProjectFile,
  formatBytes,
  getProject,
  patchProject,
  reorderProjectFiles,
  uploadProjectFile,
  type OutputFormat,
  type Project,
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
  validateClientUploadFilename,
} from "../lib/file-accept";

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
];

export function ProjectDetailPage({ projectId, onBack }: ProjectDetailPageProps) {
  const { capabilities } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadName, setUploadName] = useState<string | null>(null);

  const limits = capabilities?.limits;
  const maxFileBytes = limits?.maxFileSizeBytes;
  const maxTracks = limits?.maxTracksPerProject ?? 15;
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
      setProject(uploaded.project);
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

      {project.status === "READY_TO_RENDER" ? (
        <section className="panel panel--success" role="status">
          <strong>Проект готов к обработке</strong>
          <p className="muted">
            Все условия выполнены. Обработка аудио будет доступна на следующем
            этапе разработки.
          </p>
        </section>
      ) : null}

      {error ? <ErrorBanner message={error} /> : null}

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
          disabled={!editable || uploadProgress !== null}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleUpload(file);
          }}
        />
        <Button
          fullWidth
          disabled={!editable || uploadProgress !== null}
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
          editable={editable}
          busy={busy || uploadProgress !== null}
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
              disabled={!editable || busy}
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
              disabled={!editable || busy}
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
          </label>
        )}

        <label className="field">
          <span className="field__label">Формат результата</span>
          <select
            className="field__input"
            value={project.outputFormat}
            disabled={!editable || busy}
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
        <Button fullWidth disabled title="Будет доступно на следующем этапе">
          Обработка будет в следующем этапе
        </Button>
      </section>
    </main>
  );
}
