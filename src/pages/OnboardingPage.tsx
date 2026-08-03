import { useState } from "react";
import { Button } from "../components/Button";
import { useAuth } from "../auth/AuthProvider";
import { PUBLIC_LIMITS } from "../config/public-limits";
import type { LegalDocId } from "../legal/docs";
import { LegalPage } from "./LegalPage";

type OnboardingPageProps = {
  onContinue: () => void;
};

export function OnboardingPage({ onContinue }: OnboardingPageProps) {
  const { capabilities } = useAuth();
  const limits = capabilities?.limits ?? PUBLIC_LIMITS;
  const [legalDoc, setLegalDoc] = useState<LegalDocId | null>(null);

  if (legalDoc) {
    return <LegalPage docId={legalDoc} onBack={() => setLegalDoc(null)} />;
  }

  return (
    <main className="page">
      <header className="hero">
        <div className="brand-block">
          <p className="brand">FADELINE</p>
          <p className="brand-tagline">Дыши музыкой</p>
        </div>
        <h1>Дыши музыкой</h1>
        <p className="lead">
          Соберите офлайн-микс или обработайте один трек — только из файлов,
          которые вы загружаете сами. Мы не предоставляем каталог музыки и не
          используем ИИ для генерации звука.
        </p>
      </header>

      <section className="panel">
        <h2 className="panel__title">Как это работает</h2>
        <ol className="steps">
          <li>Создайте проект: один эффект или микс из нескольких треков.</li>
          <li>Загрузите аудиофайлы, на которые у вас есть права.</li>
          <li>Настройте эффект или стиль переходов.</li>
          <li>Когда проект готов — обработка появится на следующем этапе.</li>
        </ol>
      </section>

      <section className="panel panel--raised">
        <h2 className="panel__title">Ограничения</h2>
        <ul className="limits-list">
          <li>До {limits.maxTracksPerProject} треков в одном миксе</li>
          <li>
            Файл до {Math.round(limits.maxFileSizeBytes / (1024 * 1024))} МБ
          </li>
          <li>
            Суммарный размер проекта до{" "}
            {Math.round(limits.maxProjectSizeBytes / (1024 * 1024))} МБ
          </li>
          <li>
            Длительность результата до{" "}
            {Math.round(limits.maxOutputDurationSeconds / 60)} мин
          </li>
        </ul>
        <p className="muted fine-print">
          Точные лимиты определяет сервер. Здесь — ориентир для интерфейса.
        </p>
      </section>

      <section className="panel">
        <h2 className="panel__title">Документы (черновики)</h2>
        <p className="muted">
          Тексты помечены как черновики и требуют проверки юристом до публичного
          запуска.
        </p>
        <ul className="limits-list">
          <li>
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("terms")}
            >
              Пользовательское соглашение
            </button>
          </li>
          <li>
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("privacy")}
            >
              Политика конфиденциальности
            </button>
          </li>
          <li>
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("copyright")}
            >
              Правообладателям
            </button>
          </li>
          <li>
            <button
              type="button"
              className="link-button"
              onClick={() => setLegalDoc("refunds")}
            >
              Оплата и возвраты
            </button>
          </li>
        </ul>
      </section>

      <Button fullWidth onClick={onContinue}>
        Понятно, к проектам
      </Button>
    </main>
  );
}
