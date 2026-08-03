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
        <h1>Ваши треки. Ваш микс.</h1>
        <p className="lead">
          Загружаете файлы сами — мы не даём каталог музыки и не генерируем звук
          нейросетью. Только ваша музыка, аккуратно собранная в один файл.
        </p>
      </header>

      <section className="panel">
        <h2 className="panel__title">Как это работает</h2>
        <ol className="steps">
          <li>Создайте проект: микс или обработка одного трека.</li>
          <li>Загрузите файлы, на которые у вас есть права.</li>
          <li>Выберите стиль переходов или эффект.</li>
          <li>
            Нажмите «Обработать» — готовый файл придёт в чат с ботом.
          </li>
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

      <Button fullWidth onClick={onContinue}>
        Начать
      </Button>
    </main>
  );
}
