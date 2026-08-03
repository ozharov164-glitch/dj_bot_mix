type BrandMarkProps = {
  /** hero = large centered; compact = small header; row = side-by-side */
  variant?: "hero" | "compact" | "row";
  className?: string;
  showTagline?: boolean;
  /** EQ plate glyph — hide on wordmark-first screens (Stitch onboarding). */
  showGlyph?: boolean;
  animated?: boolean;
};

/** Premium FADELINE mark — SVG waveform glyph + wordmark. No bitmap assets. */
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
          <svg
            className="brand-mark__svg"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              x="1.5"
              y="1.5"
              width="45"
              height="45"
              rx="13"
              className="brand-mark__plate"
            />
            <g className="brand-mark__eq">
              <rect className="brand-mark__bar" x="12" y="20" width="3" height="12" rx="1.5" />
              <rect className="brand-mark__bar" x="18" y="14" width="3" height="20" rx="1.5" />
              <rect className="brand-mark__bar" x="24" y="10" width="3" height="28" rx="1.5" />
              <rect className="brand-mark__bar" x="30" y="15" width="3" height="18" rx="1.5" />
              <rect className="brand-mark__bar" x="36" y="19" width="3" height="14" rx="1.5" />
            </g>
          </svg>
        </div>
      ) : null}
      <div className="brand-mark__text">
        <p className="brand-mark__name">FADELINE</p>
        {showTagline ? (
          <p className="brand-mark__tagline">Дыши музыкой</p>
        ) : null}
      </div>
    </div>
  );
}
