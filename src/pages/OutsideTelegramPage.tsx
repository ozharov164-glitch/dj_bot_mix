export function OutsideTelegramPage() {
  return (
    <main className="page">
      <header className="hero">
        <p className="brand">FADELINE</p>
        <h1>Только внутри Telegram</h1>
        <p className="lead">
          Это Mini App работает только при открытии из Telegram-бота. Здесь нет
          отдельного входа — авторизация происходит через Telegram WebApp.
        </p>
      </header>

      <section className="panel panel--warning">
        <h2 className="panel__title">Режим разработки</h2>
        <p>
          Если вы разрабатываете интерфейс локально, откройте приложение через
          бота в Telegram или используйте тестовый initData в окружении
          Telegram Web.
        </p>
        <p className="muted">
          Мы намеренно не показываем форму «войти» вне Telegram — это защита от
          подмены пользователя.
        </p>
      </section>
    </main>
  );
}
