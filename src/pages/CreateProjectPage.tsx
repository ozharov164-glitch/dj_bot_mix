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
import { FlowBreadcrumb } from "../components/FlowBreadcrumb";
import { OptionPicker } from "../components/OptionPicker";
import { IconArrowLeft, IconSpark } from "../components/icons";
import { EFFECT_HINTS, EFFECT_LABELS } from "../lib/effect-catalog";
import { hapticImpact, hapticNotification } from "../lib/telegram";
import {
  resolveTransitionCatalog,
  transitionEntry,
} from "../lib/transition-catalog";

type CreateProjectPageProps = {
  onBack: () => void;
  onCreated: (projectId: string) => void;
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
      hapticNotification("warning");
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
      hapticNotification("success");
      onCreated(project.id);
    } catch (err) {
      hapticNotification("error");
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
            trail="Проекты → Новый проект"
            steps={[
              { id: "create", label: "Параметры", state: "current" },
              { id: "files", label: "Файлы", state: "upcoming" },
              { id: "render", label: "Обработка", state: "upcoming" },
            ]}
          />
          <h1 className="page-title">Новый проект</h1>
          <p className="page-subtitle">
            Выберите тип и настройки — файлы добавите на следующем шаге.
          </p>
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
            placeholder="Например: Тренировка · весна 2026"
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
              onChange={() => {
                hapticImpact("light");
                setType("MIX");
              }}
            />
            <span className="type-option__copy">
              <strong>Микс</strong>
              <span>Несколько треков с плавными переходами</span>
            </span>
            <span className="type-option__mark" aria-hidden="true" />
          </label>
          <label className="type-option">
            <input
              type="radio"
              name="project-type"
              checked={type === "SINGLE_EFFECT"}
              onChange={() => {
                hapticImpact("light");
                setType("SINGLE_EFFECT");
              }}
            />
            <span className="type-option__copy">
              <strong>Один трек</strong>
              <span>Эффект на одном аудиофайле</span>
            </span>
            <span className="type-option__mark" aria-hidden="true" />
          </label>
        </fieldset>

        {type === "SINGLE_EFFECT" ? (
          <OptionPicker
            label="Эффект"
            value={singleEffect}
            options={effects.map((effect) => ({
              value: effect,
              label: EFFECT_LABELS[effect],
              description: EFFECT_HINTS[effect],
            }))}
            onChange={(next) => setSingleEffect(next as SingleEffect)}
            footnote={EFFECT_HINTS[singleEffect]}
          />
        ) : (
          <OptionPicker
            label="Стиль переходов"
            value={transitionStyle}
            options={transitionCatalog.map((entry) => ({
              value: entry.id,
              label: entry.labelRu,
              description: entry.hintRu,
            }))}
            onChange={(next) => setTransitionStyle(next as TransitionStyle)}
            footnote={selectedTransition.hintRu}
            hint="Склейка по времени и громкости, а не по темпу треков."
          />
        )}

        <OptionPicker
          label="Формат результата"
          value={outputFormat}
          options={formats.map((format) => ({
            value: format,
            label: format.toUpperCase(),
          }))}
          onChange={(next) => setOutputFormat(next as OutputFormat)}
        />
      </section>

      <div className="cta-bar">
        <Button
          fullWidth
          disabled={submitting}
          onClick={() => void handleSubmit()}
        >
          {submitting ? (
            "Создаём…"
          ) : (
            <>
              <IconSpark size={18} />
              Создать и добавить файлы
            </>
          )}
        </Button>
      </div>
    </main>
  );
}
