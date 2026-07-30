import { Button } from "../components/Button";
import { useAuth } from "../auth/AuthProvider";
import { PUBLIC_LIMITS } from "../config/public-limits";

type OnboardingPageProps = {
  onContinue: () => void;
};

export function OnboardingPage({ onContinue }: OnboardingPageProps) {
  const { capabilities } = useAuth();
  const limits = capabilities?.limits ?? PUBLIC_LIMITS;

  return (
    <main className="page">
      <header className="hero">
        <p className="brand">MixFlow</p>
        <h1>Добро пожаловать</h1>
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

      <section className="panel">
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

      <Button fullWidth onClick={onContinue}>
        Понятно, к проектам
      </Button>
    </main>
  );
}
