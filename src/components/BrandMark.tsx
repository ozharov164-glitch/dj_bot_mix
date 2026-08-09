import signalMark from "../assets/brand/fadeline-signal-v1.png";
import wordmark from "../assets/brand/fadeline-wordmark-v1.png";

type BrandMarkProps = {
  /** hero = large centered; compact = small header; row = home lockup */
  variant?: "hero" | "compact" | "row";
  className?: string;
  showTagline?: boolean;
  /** EQ plate glyph — hide on wordmark-first screens (Stitch onboarding). */
  showGlyph?: boolean;
  animated?: boolean;
};

/** Premium FADELINE mark — chrome signal glyph + 3D DJ wordmark raster. */
export function BrandMark({
  variant = "compact",
  className = "",
  showTagline = true,
  showGlyph = true,
  animated = true,
}: BrandMarkProps) {
  const root = [
    "brand-mark",
    `brand-mark--${variant}`,
    showGlyph ? "" : "brand-mark--wordmark",
    animated ? "brand-mark--live" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={root}>
      {showGlyph ? (
        <div className="brand-mark__glyph" aria-hidden="true">
          <span className="brand-mark__glow" />
          <img className="brand-mark__image" src={signalMark} alt="" />
        </div>
      ) : null}
      <div className="brand-mark__text">
        <img
          className="brand-mark__wordmark"
          src={wordmark}
          alt="FADELINE"
          draggable={false}
        />
        {showTagline ? (
          <p className="brand-mark__tagline">Дыши музыкой</p>
        ) : null}
      </div>
    </div>
  );
}
