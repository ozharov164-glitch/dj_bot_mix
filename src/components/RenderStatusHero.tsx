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
      className={[
        "render-hero",
        isFailed ? "render-hero--danger" : "",
        isDone ? "render-hero--success" : "",
        isRunning ? "render-hero--running" : "",
        isQueued ? "render-hero--queued" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="render-hero__glow render-hero__glow--a" aria-hidden="true" />
      <div className="render-hero__glow render-hero__glow--b" aria-hidden="true" />
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

          {isQueued ? (
            <span className="render-hero__queue">
              <svg
                className="render-hero__queue-ring render-hero__queue-ring--outer"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeDasharray="80 200"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </svg>
              <svg
                className="render-hero__queue-ring render-hero__queue-ring--inner"
                viewBox="0 0 100 100"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  stroke="currentColor"
                  strokeDasharray="140 140"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
              <span className="render-hero__queue-dot" />
            </span>
          ) : null}

          {isDone ? (
            <span className="render-hero__check-wrap">
              <span className="render-hero__check-pulse" />
              <svg
                className="render-hero__check-svg"
                viewBox="0 0 48 48"
                fill="none"
                aria-hidden="true"
              >
                <circle cx="24" cy="24" r="20" className="render-hero__check-ring" />
                <path
                  className="render-hero__check-path"
                  d="M14 25.5 21 32.5 34 17"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          ) : null}

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
