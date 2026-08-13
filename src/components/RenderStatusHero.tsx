import {
  memo,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { RenderJobStatus } from "../api/client";
import { RENDER_MORPH_MS, renderMarkKind } from "../lib/render-status";

type RenderStatusHeroProps = {
  status: RenderJobStatus;
  title: string;
  description: string;
  detail?: string | null;
};

const METER_TICKS = 36;
const AURORA_TICKS = 48;
const AURORA_BEADS = 6;

type Snapshot = {
  status: RenderJobStatus;
  title: string;
  description: string;
  detail: string | null;
};

const AuroraMark = memo(function AuroraMark() {
  const uid = useId().replace(/:/g, "");
  const gradId = `aurora-orbit-grad-${uid}`;
  return (
    <span className="render-hero__aurora">
      <span className="render-hero__aurora-bloom" />
      <span className="render-hero__aurora-glass" />
      <span className="render-hero__aurora-mesh" />
      <span className="render-hero__aurora-ripple render-hero__aurora-ripple--1" />
      <span className="render-hero__aurora-ripple render-hero__aurora-ripple--2" />
      <svg
        className="render-hero__aurora-orbit render-hero__aurora-orbit--a"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="45"
          className="render-hero__aurora-rail"
          strokeWidth="1.15"
        />
        <circle
          cx="50"
          cy="50"
          r="45"
          stroke={`url(#${gradId})`}
          strokeDasharray="96 186"
          strokeLinecap="round"
          strokeWidth="1.85"
        />
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="100" y2="100">
            <stop offset="0%" stopColor="#fff" stopOpacity="0.95" />
            <stop offset="55%" stopColor="#ff2d55" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#ff2d55" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <svg
        className="render-hero__aurora-orbit render-hero__aurora-orbit--b"
        viewBox="0 0 100 100"
        fill="none"
        aria-hidden="true"
      >
        <circle
          cx="50"
          cy="50"
          r="36"
          className="render-hero__aurora-rail"
          strokeWidth="0.9"
          opacity="0.7"
        />
        <circle
          cx="50"
          cy="50"
          r="36"
          stroke="currentColor"
          strokeDasharray="72 180"
          strokeLinecap="round"
          strokeWidth="1.35"
          opacity="0.7"
        />
      </svg>
      <span className="render-hero__aurora-ticks" aria-hidden="true">
        {Array.from({ length: AURORA_TICKS }, (_, i) => (
          <span
            key={i}
            className="render-hero__aurora-tick"
            style={
              {
                "--i": String(i),
                "--n": String(AURORA_TICKS),
              } as CSSProperties
            }
          />
        ))}
      </span>
      <span className="render-hero__aurora-core">
        <span className="render-hero__aurora-core-halo" />
        <span className="render-hero__aurora-core-dot" />
      </span>
      <span className="render-hero__aurora-sheen" />
      <span className="render-hero__aurora-beads" aria-hidden="true">
        {Array.from({ length: AURORA_BEADS }, (_, i) => (
          <span
            key={i}
            className="render-hero__aurora-bead"
            style={{ "--i": String(i) } as CSSProperties}
          />
        ))}
      </span>
    </span>
  );
});

const StatusMark = memo(function StatusMark({
  status,
}: {
  status: RenderJobStatus;
}) {
  switch (status) {
    case "RUNNING":
    case "QUEUED":
      return <AuroraMark />;
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
});

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

const ProgressMeter = memo(function ProgressMeter({
  active,
}: {
  active: boolean;
}) {
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
            <span key={i} className="render-hero__meter-tick" />
          ))}
        </span>
        <span className="render-hero__pulse" />
      </div>
    </div>
  );
});

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
  const kind = renderMarkKind(status);

  const currentRef = useRef<Snapshot>({
    status,
    title,
    description,
    detail: detailValue,
  });
  const [leavingMark, setLeavingMark] = useState<RenderJobStatus | null>(null);
  const [leavingCopy, setLeavingCopy] = useState<Snapshot | null>(null);
  const [morphing, setMorphing] = useState(false);

  useEffect(() => {
    const prev = currentRef.current;
    const statusChanged = prev.status !== status;
    currentRef.current = {
      status,
      title,
      description,
      detail: detailValue,
    };
    if (!statusChanged) return;
    if (renderMarkKind(prev.status) !== kind) {
      setLeavingMark(prev.status);
    }
    setLeavingCopy(prev);
    setMorphing(true);
  }, [status, title, description, detailValue, kind]);

  useEffect(() => {
    if (!leavingMark && !leavingCopy) return;
    const timer = window.setTimeout(() => {
      setLeavingMark(null);
      setLeavingCopy(null);
      setMorphing(false);
    }, RENDER_MORPH_MS);
    return () => window.clearTimeout(timer);
  }, [leavingMark, leavingCopy, status]);

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
          {leavingMark ? (
            <div
              key={`leave-${renderMarkKind(leavingMark)}`}
              className="render-hero__mark-layer render-hero__mark-layer--exit"
            >
              <StatusMark status={leavingMark} />
            </div>
          ) : null}
          <div
            key={`enter-${kind}`}
            className="render-hero__mark-layer render-hero__mark-layer--enter"
          >
            <StatusMark status={status} />
          </div>
        </div>

        <div className="render-hero__copy-stack">
          {leavingCopy ? (
            <div
              key={`leave-copy-${leavingCopy.status}-${leavingCopy.title}`}
              className="render-hero__copy render-hero__copy--exit"
              aria-hidden="true"
            >
              <HeroCopy
                title={leavingCopy.title}
                description={leavingCopy.description}
                detail={leavingCopy.detail}
              />
            </div>
          ) : null}
          <div
            key={`enter-copy-${status}-${title}`}
            className="render-hero__copy render-hero__copy--enter"
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
