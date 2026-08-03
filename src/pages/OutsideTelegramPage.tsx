import { BrandMark } from "../components/BrandMark";

export function OutsideTelegramPage() {
  return (
    <main className="page">
      <header className="hero">
        <BrandMark variant="hero" />
        <h1>Откройте в Telegram</h1>
        <p className="lead">
          FADELINE работает только из чата с ботом — так мы знаем, что это именно
          вы. Найдите @fadeline_bot и нажмите «Открыть FADELINE».
        </p>
      </header>

      <section className="panel">
        <p className="muted">
          Мы намеренно не показываем форму «войти» вне Telegram — это защита от
          подмены пользователя.
        </p>
        {import.meta.env.DEV ? (
          <p className="muted fine-print">
            Для просмотра дизайна в Cursor:{" "}
            <a className="link-button" href="/?preview=1">
              открыть локальный preview
            </a>
            .
          </p>
        ) : null}
      </section>
    </main>
  );
}
