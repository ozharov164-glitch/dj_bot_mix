import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { RenderJobStatus } from "../api/client";

type RenderStatusHeroProps = {
  status: RenderJobStatus;
  title: string;
  description: string;
  detail?: string | null;
};

const BAR_HEIGHTS = [28, 48, 62, 78, 95, 100, 88, 70, 55, 42, 30];
const METER_TICKS = 36;
const MORPH_MS = 560;

type Snapshot = {
  status: RenderJobStatus;
  title: string;
  description: string;
  detail: string | null;
};

function StatusMark({ status }: { status: RenderJobStatus }) {
  switch (status) {
    case "RUNNING":
      return (
        <span className="render-hero__platter">
          <span className="render-hero__platter-disc" />
          <span className="render-hero__platter-groove" />
          <span className="render-hero__platter-core" />
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
                style={{ "--bar-h": `${h}%` } as CSSProperties}
              />
            ))}
          </span>
        </span>
      );
    case "QUEUED":
      return (
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
      );
    case "COMPLETED":
      return (
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
      );
    case "FAILED":
      return <span className="render-hero__fail">!</span>;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

function HeroCopy({
  title,
  description,
  detail,
}: {
  title: string;
  description: string;
  detail: string | null;
}) {
  return (
    <>
      <h2 className="render-hero__title">{title}</h2>
      <p className="render-hero__desc">{description}</p>
      {detail ? <p className="render-hero__detail">{detail}</p> : null}
    </>
  );
}

function ProgressMeter({ active }: { active: boolean }) {
  return (
    <div
      className={
        active
          ? "render-hero__progress render-hero__progress--active"
          : "render-hero__progress"
      }
      aria-hidden="true"
    >
      <div className="render-hero__progress-track">
        <span className="render-hero__wave" />
        <span className="render-hero__meter">
          {Array.from({ length: METER_TICKS }, (_, i) => (
            <span
              key={i}
              className="render-hero__meter-tick"
              style={{ "--tick": String(i) } as CSSProperties}
            />
          ))}
        </span>
        <span className="render-hero__pulse" />
      </div>
    </div>
  );
}

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
  const detailValue = detail ?? null;
  const progressActive = isRunning || isQueued;

  const currentRef = useRef<Snapshot>({
    status,
    title,
    description,
    detail: detailValue,
  });
  const [leaving, setLeaving] = useState<Snapshot | null>(null);
  const [morphing, setMorphing] = useState(false);

  useEffect(() => {
    const prev = currentRef.current;
    if (prev.status === status) {
      currentRef.current = {
        status,
        title,
        description,
        detail: detailValue,
      };
      return;
    }
    setLeaving(prev);
    setMorphing(true);
    currentRef.current = {
      status,
      title,
      description,
      detail: detailValue,
    };
  }, [status, title, description, detailValue]);

  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => {
      setLeaving(null);
      setMorphing(false);
    }, MORPH_MS);
    return () => window.clearTimeout(timer);
  }, [leaving, status]);

  return (
    <section
      className={[
        "render-hero",
        isFailed ? "render-hero--danger" : "",
        isDone ? "render-hero--success" : "",
        isRunning ? "render-hero--running" : "",
        isQueued ? "render-hero--queued" : "",
        morphing ? "render-hero--morphing" : "",
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
          {leaving ? (
            <div
              key={`leave-${leaving.status}`}
              className="render-hero__mark-layer render-hero__mark-layer--exit"
            >
              <StatusMark status={leaving.status} />
            </div>
          ) : null}
          <div
            key={`enter-${status}`}
            className={[
              "render-hero__mark-layer",
              morphing
                ? "render-hero__mark-layer--enter"
                : "render-hero__mark-layer--settled",
            ].join(" ")}
          >
            <StatusMark status={status} />
          </div>
        </div>

        <div className="render-hero__copy-stack">
          {leaving ? (
            <div
              key={`leave-copy-${leaving.status}`}
              className="render-hero__copy render-hero__copy--exit"
              aria-hidden="true"
            >
              <HeroCopy
                title={leaving.title}
                description={leaving.description}
                detail={leaving.detail}
              />
            </div>
          ) : null}
          <div
            key={`enter-copy-${status}`}
            className={[
              "render-hero__copy",
              morphing
                ? "render-hero__copy--enter"
                : "render-hero__copy--settled",
            ].join(" ")}
          >
            <HeroCopy
              title={title}
              description={description}
              detail={detailValue}
            />
          </div>
        </div>

        <ProgressMeter active={progressActive} />
      </div>
    </section>
  );
}
