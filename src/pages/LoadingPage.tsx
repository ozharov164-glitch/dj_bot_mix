export function LoadingPage({ message = "Загрузка…" }: { message?: string }) {
  return (
    <main className="page page--centered">
      <div className="spinner" aria-hidden="true" />
      <p className="loading-text">{message}</p>
    </main>
  );
}
