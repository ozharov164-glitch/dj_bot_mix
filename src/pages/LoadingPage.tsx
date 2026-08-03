import { BrandMark } from "../components/BrandMark";

export function LoadingPage({ message = "Загрузка…" }: { message?: string }) {
  return (
    <main className="page page--centered">
      <BrandMark variant="hero" showTagline={false} />
      <p className="loading-text">{message}</p>
    </main>
  );
}
