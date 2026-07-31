import { useState } from "react";
import { ApiError } from "../api/client";
import { useAuth } from "../auth/AuthProvider";
import { Button } from "../components/Button";
import { ErrorBanner } from "../components/ErrorBanner";
import type { LegalDocId } from "../legal/docs";
import { LegalPage } from "./LegalPage";

export function ConsentPage() {
  const { acceptConsent, capabilities } = useAuth();
  const [privacy, setPrivacy] = useState(false);
  const [terms, setTerms] = useState(false);
  const [rights, setRights] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);

  const policyVersion =
    capabilities?.policyVersion ?? "текущая версия политики";

  const canSubmit = privacy && terms && rights && !submitting;

  if (legalDoc) {
    return <LegalPage docId={legalDoc} onBack={() => setLegalDoc(null)} />;
  }

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await acceptConsent();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Не удалось сохранить согласие",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="page">
      <header className="hero">
        <p className="brand">FADELINE</p>
        <h1>Согласие перед началом</h1>
        <p className="lead">
          Перед загрузкой файлов подтвердите, что понимаете правила сервиса.
          Версия политики: {policyVersion}.
        </p>
      </header>

      {error ? <ErrorBanner message={error} /> : null}

      <section className="panel">
        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={privacy}
            onChange={(e) => setPrivacy(e.target.checked)}
          />
          <span>
            Я ознакомился(ась) с{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("privacy")}
            >
              политикой конфиденциальности
            </button>{" "}
            и согласен(на) на обработку данных для работы сервиса.
          </span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={terms}
            onChange={(e) => setTerms(e.target.checked)}
          />
          <span>
            Я принимаю{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("terms")}
            >
              пользовательское соглашение
            </button>{" "}
            и правила использования FADELINE.
          </span>
        </label>

        <label className="checkbox-row">
          <input
            type="checkbox"
            checked={rights}
            onChange={(e) => setRights(e.target.checked)}
          />
          <span>
            Я подтверждаю, что загружаю только файлы, на которые у меня есть
            права или разрешение правообладателя.{" "}
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("copyright")}
            >
              Правообладателям
            </button>
          </span>
        </label>

        <p className="muted fine-print legal-note">
          Отметка в чекбоксе не снимает с вас ответственности за нарушение
          авторских прав и не гарантирует правомерность загруженного контента.
          При жалобе правообладателя доступ к файлу может быть ограничен. Черновики
          документов требуют проверки юристом.
        </p>

        <p className="muted fine-print">
          <button
            type="button"
            className="link-button"
            onClick={() => setLegalDoc("refunds")}
          >
            Оплата и возвраты
          </button>
        </p>
      </section>

      <Button fullWidth disabled={!canSubmit} onClick={() => void handleSubmit()}>
        {submitting ? "Сохранение…" : "Принять и продолжить"}
      </Button>
    </main>
  );
}
