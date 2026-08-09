import { BrandMark } from "../components/BrandMark";

/**
 * Quiet auth gate — no StudioSplash here.
 * Marketing splash mounts once after Telegram session is ready.
 */
export function LoadingPage({ message }: { message?: string }) {
  return (
    <main className="page page--centered boot-quiet" aria-busy="true">
      <BrandMark variant="compact" showGlyph={false} showTagline={false} />
      <p className="boot-quiet__status">{message ?? "Открываем студию…"}</p>
    </main>
  );
}
