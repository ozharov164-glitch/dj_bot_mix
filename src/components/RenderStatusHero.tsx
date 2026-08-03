import type { RenderJobStatus } from "../api/client";

type RenderStatusHeroProps = {
  status: RenderJobStatus;
  title: string;
  description: string;
  detail?: string | null;
};

const BAR_HEIGHTS = [40, 70, 50, 90, 100, 80, 60, 75, 35];

export function RenderStatusHero({
  status,
  title,
  description,
  detail,
}: RenderStatusHeroProps) {
  const isRunning = status === "RUNNING";
  const isQueued = status === "QUEUED";
  const isDone = status === "COMPLETED";
  const isFailed = status === "FAILED";

  return (
    <section
      className={`render-hero${isFailed ? " render-hero--danger" : ""}${isDone ? " render-hero--success" : ""}`}
      role="status"
      aria-live="polite"
    >
      <div className="render-hero__glow" aria-hidden="true" />
      <div className="render-hero__card">
        <div className="render-hero__mark" aria-hidden="true">
          {isRunning ? (
            <>
              <span className="render-hero__ring render-hero__ring--1" />
              <span className="render-hero__ring render-hero__ring--2" />
              <span className="render-hero__ring render-hero__ring--3" />
              <span className="render-hero__arc" />
              <span className="render-hero__particles">
                {Array.from({ length: 8 }, (_, i) => (
                  <span key={i} className="render-hero__particle" />
                ))}
              </span>
              <span className="render-hero__bars">
                {BAR_HEIGHTS.map((h, i) => (
                  <span
                    key={i}
                    className="render-hero__bar"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </span>
            </>
          ) : null}

          {isQueued ? <span className="render-hero__spinner" /> : null}

          {isDone ? <span className="render-hero__check">✓</span> : null}

          {isFailed ? <span className="render-hero__fail">!</span> : null}
        </div>

        <h2 className="render-hero__title">{title}</h2>
        <p className="render-hero__desc">{description}</p>
        {detail ? <p className="render-hero__detail">{detail}</p> : null}

        {isRunning || isQueued ? (
          <div className="render-hero__progress" aria-hidden="true">
            <span className="render-hero__shimmer" />
          </div>
        ) : null}
      </div>
    </section>
  );
}
