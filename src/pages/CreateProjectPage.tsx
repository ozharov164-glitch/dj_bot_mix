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

type CreateProjectPageProps = {
  onBack: () => void;
  onCreated: (projectId: string) => void;
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
  const transitions =
    capabilities?.transitionStyles ??
    (Object.keys(TRANSITION_LABELS) as TransitionStyle[]);
  const formats = capabilities?.outputFormats ?? (["mp3", "aac"] as OutputFormat[]);

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
        <div>
          <Button variant="ghost" onClick={onBack}>
            ← Назад
          </Button>
          <h1>Новый проект</h1>
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
          />
        </label>

        <fieldset className="field">
          <legend className="field__label">Тип проекта</legend>
          <label className="radio-row">
            <input
              type="radio"
              name="project-type"
              checked={type === "MIX"}
              onChange={() => setType("MIX")}
            />
            <span>
              <strong>Микс</strong> — несколько треков с переходами
            </span>
          </label>
          <label className="radio-row">
            <input
              type="radio"
              name="project-type"
              checked={type === "SINGLE_EFFECT"}
              onChange={() => setType("SINGLE_EFFECT")}
            />
            <span>
              <strong>Один эффект</strong> — обработка одного файла
            </span>
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
        {submitting ? "Создание…" : "Создать проект"}
      </Button>
    </main>
  );
}
