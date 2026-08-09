import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";

/**
 * Marketing beats — short enough to read on mobile, long enough to land.
 * No EN studio jargon (BPM / EQ / crossfade).
 */
const STUDIO_BEATS = [
  {
    title: "Диджей уже за пультом",
    sub: "Прогревает дорожки и ловит настроение сета",
  },
  {
    title: "Только ваши треки",
    sub: "Без каталогов и чужой музыки — только то, что загрузите вы",
  },
  {
    title: "Собираем живой микс",
    sub: "Мягкие стыки, плотный бас и чистая громкость",
  },
  {
    title: "Настраиваем сведение",
    sub: "Софт уже крутит ваши файлы под студийный характер",
  },
  {
    title: "Результат — в чат с ботом",
    sub: "Готовый файл придёт во вложении. Можно просто ждать",
  },
  {
    title: "Дышите музыкой",
    sub: "FADELINE почти готова · скоро откроем студию",
  },
] as const;

/** Time each beat stays on screen — must stay readable. */
const BEAT_MS = 1650;

function prefersReducedMotion(): boolean {
  try {
    return (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  } catch {
    return false;
  }
}

type StudioSplashProps = {
  /** Optional status under the rotating line (auth / retry). */
  status?: string;
};

export function StudioSplash({ status }: StudioSplashProps) {
  const [beatIndex, setBeatIndex] = useState(0);
  const beat = STUDIO_BEATS[beatIndex];

  useEffect(() => {
    if (prefersReducedMotion()) return;

    const id = window.setInterval(() => {
      setBeatIndex((i) => (i + 1) % STUDIO_BEATS.length);
    }, BEAT_MS);
    return () => window.clearInterval(id);
  }, []);

  return (
    <main className="page page--centered studio-splash" aria-busy="true">
      <BrandMark variant="compact" showGlyph={false} showTagline={false} />

      <p className="studio-splash__eyebrow">Живая студия</p>

      <div className="dj-stage" aria-hidden="true">
        <span className="dj-stage__glow dj-stage__glow--a" />
        <span className="dj-stage__glow dj-stage__glow--b" />

        <div className="dj-figure">
          <span className="dj-figure__head" />
          <span className="dj-figure__cans" />
          <span className="dj-figure__body" />
        </div>

        <div className="dj-deck">
          <div className="dj-deck__platter dj-deck__platter--left">
            <span className="dj-deck__vinyl">
              <span className="dj-deck__groove" />
              <span className="dj-deck__label" />
            </span>
            <span className="dj-deck__arm" />
          </div>

          <div className="dj-deck__mixer">
            <div className="dj-deck__eq">
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
              <i />
            </div>
            <div className="dj-deck__faders">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="dj-deck__pads">
              <b />
              <b />
              <b />
              <b />
            </div>
          </div>

          <div className="dj-deck__platter dj-deck__platter--right">
            <span className="dj-deck__vinyl">
              <span className="dj-deck__groove" />
              <span className="dj-deck__label" />
            </span>
            <span className="dj-deck__arm" />
          </div>
        </div>
      </div>

      <div className="studio-splash__copy" key={beatIndex}>
        <p className="studio-splash__title">{beat.title}</p>
        <p className="studio-splash__sub">{beat.sub}</p>
      </div>

      <div
        className="studio-splash__dots"
        aria-hidden="true"
      >
        {STUDIO_BEATS.map((_, i) => (
          <span
            key={STUDIO_BEATS[i].title}
            className={
              i === beatIndex
                ? "studio-splash__dot studio-splash__dot--on"
                : "studio-splash__dot"
            }
          />
        ))}
      </div>

      {status ? <p className="studio-splash__status">{status}</p> : null}

      <div className="studio-splash__meter" aria-hidden="true">
        <span className="studio-splash__meter-fill" />
      </div>
    </main>
  );
}

/**
 * Full marketing beat (~6 lines × 1.65s) so copy is readable end-to-end.
 * Keep in sync with STUDIO_BEATS length × BEAT_MS.
 */
export const STUDIO_SPLASH_MIN_MS = 7800;

export function studioSplashMinMs(): number {
  return prefersReducedMotion() ? 600 : STUDIO_SPLASH_MIN_MS;
}
