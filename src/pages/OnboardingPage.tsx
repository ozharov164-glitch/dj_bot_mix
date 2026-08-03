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
  const maxMb = Math.round(limits.maxFileSizeBytes / (1024 * 1024));

  if (legalDoc) {
    return <LegalPage docId={legalDoc} onBack={() => setLegalDoc(null)} />;
  }

  return (
    <main className="page">
      <header className="hero hero--centered">
        <div className="brand-block">
          <p className="brand">FADELINE</p>
          <p className="brand-tagline">Дыши музыкой</p>
        </div>
        <h1>
          Ваши треки.
          <br />
          Ваш микс.
        </h1>
        <p className="lead">
          Только ваши файлы. Без каталога музыки и без ИИ-генерации звука.
        </p>
      </header>

      <section className="panel panel--raised">
        <ol className="timeline">
          <li className="timeline__item">
            <span className="timeline__n">1</span>
            <div className="timeline__body">
              <h3>Создайте проект</h3>
              <p>Микс из нескольких треков или обработка одного файла.</p>
            </div>
          </li>
          <li className="timeline__item">
            <span className="timeline__n">2</span>
            <div className="timeline__body">
              <h3>Загрузите файлы</h3>
              <p>Только аудио, на которое у вас есть права.</p>
            </div>
          </li>
          <li className="timeline__item">
            <span className="timeline__n">3</span>
            <div className="timeline__body">
              <h3>Выберите стиль или эффект</h3>
              <p>Переходы для микса или обработка одного трека.</p>
            </div>
          </li>
          <li className="timeline__item timeline__item--accent">
            <span className="timeline__n">4</span>
            <div className="timeline__body">
              <h3>Обработать</h3>
              <p>Готовый файл придёт прямо в чат с ботом.</p>
            </div>
          </li>
        </ol>
      </section>

      <section className="panel">
        <h2 className="panel__title">Ограничения</h2>
        <ul className="limits-list">
          <li>До {limits.maxTracksPerProject} треков в одном миксе</li>
          <li>Файл до {maxMb} МБ</li>
          <li>
            Суммарный размер проекта до{" "}
            {Math.round(limits.maxProjectSizeBytes / (1024 * 1024))} МБ
          </li>
          <li>
            Длительность результата до{" "}
            {Math.round(limits.maxOutputDurationSeconds / 60)} мин
          </li>
        </ul>
      </section>

      <section className="panel">
        <h2 className="panel__title">Документы</h2>
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

      <p className="limits-rule">Файл до {maxMb} МБ</p>
      <Button fullWidth onClick={onContinue}>
        Начать →
      </Button>
    </main>
  );
}
