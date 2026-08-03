import { useState } from "react";
import {
  ApiError,
  createProject,
  type OutputFormat,
  type ProjectType,
  type SingleEffect,
  type TransitionStyle,
} from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import {
  resolveTransitionCatalog,
  transitionEntry,
} from "../lib/transition-catalog";

type CreateProjectPageProps = {
  onBack: () => void;
  onCreated: (projectId: string) => void;
};

const EFFECT_LABELS: Record<SingleEffect, string> = {
  normalise: "Студийная громкость",
  speed_pitch: "Энергичный темп",
  slow_reverb: "Медленная атмосфера",
  echo: "Эхо-бросок",
  eq: "Клубный EQ",
  bass_boost: "Плотный бас",
};

export function CreateProjectPage({ onBack, onCreated }: CreateProjectPageProps) {
  const { capabilities } = useAuth();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ProjectType>("MIX");
  const [singleEffect, setSingleEffect] = useState<SingleEffect>("normalise");
  const [transitionStyle, setTransitionStyle] = useState<TransitionStyle>("safe");
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("mp3");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const effects = capabilities?.effects ?? (Object.keys(EFFECT_LABELS) as SingleEffect[]);
  const transitionCatalog = resolveTransitionCatalog(capabilities);
  const formats = capabilities?.outputFormats ?? (["mp3", "aac"] as OutputFormat[]);
  const selectedTransition = transitionEntry(transitionCatalog, transitionStyle);

  async function handleSubmit() {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Введите название проекта");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const project = await createProject({
        title: trimmed,
        type,
        outputFormat,
        ...(type === "SINGLE_EFFECT"
          ? { singleEffect }
          : { transitionStyle }),
      });
      onCreated(project.id);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Не удалось создать проект",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div className="page-header__main">
          <button type="button" className="back-link" onClick={onBack}>
            <span className="back-link__chevron" aria-hidden="true">
              ←
            </span>
            Проекты
          </button>
          <h1 className="page-title">Новый проект</h1>
        </div>
      </header>

      {error ? <ErrorBanner message={error} /> : null}

      <section className="panel form">
        <label className="field">
          <span className="field__label">Название</span>
          <input
            className="field__input"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Тренировка весна 2026"
            maxLength={120}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
          />
        </label>

        <fieldset className="field type-options">
          <legend className="field__label">Тип проекта</legend>
          <label className="type-option">
            <input
              type="radio"
              name="project-type"
              checked={type === "MIX"}
              onChange={() => setType("MIX")}
            />
            <span className="type-option__copy">
              <strong>Микс</strong>
              <span>Несколько треков с переходами</span>
            </span>
            <span className="type-option__mark" aria-hidden="true" />
          </label>
          <label className="type-option">
            <input
              type="radio"
              name="project-type"
              checked={type === "SINGLE_EFFECT"}
              onChange={() => setType("SINGLE_EFFECT")}
            />
            <span className="type-option__copy">
              <strong>Один трек</strong>
              <span>Эффект на одном файле</span>
            </span>
            <span className="type-option__mark" aria-hidden="true" />
          </label>
        </fieldset>

        {type === "SINGLE_EFFECT" ? (
          <label className="field">
            <span className="field__label">Эффект</span>
            <select
              className="field__input"
              value={singleEffect}
              onChange={(e) => setSingleEffect(e.target.value as SingleEffect)}
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
              value={transitionStyle}
              onChange={(e) =>
                setTransitionStyle(e.target.value as TransitionStyle)
              }
            >
              {transitionCatalog.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.labelRu}
                </option>
              ))}
            </select>
            <span className="field__hint field__hint--footnote">
              {selectedTransition.hintRu}
            </span>
            <span className="field__hint">
              Склейка по времени и громкости, не по темпу треков.
            </span>
          </label>
        )}

        <label className="field">
          <span className="field__label">Формат результата</span>
          <select
            className="field__input"
            value={outputFormat}
            onChange={(e) => setOutputFormat(e.target.value as OutputFormat)}
          >
            {formats.map((format) => (
              <option key={format} value={format}>
                {format.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
      </section>

      <Button
        fullWidth
        disabled={submitting}
        onClick={() => void handleSubmit()}
      >
        {submitting ? "Создание…" : "Создать проект +"}
      </Button>
    </main>
  );
}
