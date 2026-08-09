import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type StageCard = {
  id: string;
  title: string;
  body: ReactNode;
};

type CardStageProps = {
  cards: StageCard[];
  /** Auto-advance while true (queued / running). */
  autoPlay?: boolean;
  intervalMs?: number;
};

const TRANSITION_MS = 560;

function resolveDirection(
  from: number,
  to: number,
  length: number,
): "next" | "prev" {
  if (length < 2) return "next";
  if (from === length - 1 && to === 0) return "next";
  if (from === 0 && to === length - 1) return "prev";
  return to > from ? "next" : "prev";
}

/**
 * One-at-a-time card stage with locked viewport height (tallest card)
 * and opacity crossfade — no layout resize jerks between slides.
 */
export function CardStage({
  cards,
  autoPlay = false,
  intervalMs = 3400,
}: CardStageProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const [exiting, setExiting] = useState<StageCard | null>(null);
  const [animating, setAnimating] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);
  const cardsRef = useRef(cards);
  const animatingRef = useRef(false);
  const measureRef = useRef<HTMLDivElement>(null);

  cardsRef.current = cards;
  animatingRef.current = animating;

  const cardKey = cards.map((c) => c.id).join("|");
  const safeIndex = cards.length === 0 ? 0 : index % cards.length;
  const active = cards[safeIndex];

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    const measure = () => {
      const slides = root.querySelectorAll<HTMLElement>(".card-stage__measure-slide");
      let max = 0;
      for (const slide of slides) {
        max = Math.max(max, slide.offsetHeight);
      }
      if (max > 0) {
        setViewportHeight(max);
      }
    };

    measure();
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    for (const slide of root.querySelectorAll(".card-stage__measure-slide")) {
      ro.observe(slide);
    }
    return () => ro.disconnect();
  }, [cardKey]);

  useEffect(() => {
    setIndex(0);
    setExiting(null);
    setAnimating(false);
  }, [cardKey]);

  useEffect(() => {
    if (!exiting) return;
    const timer = window.setTimeout(() => {
      setExiting(null);
      setAnimating(false);
    }, TRANSITION_MS);
    return () => window.clearTimeout(timer);
  }, [exiting, safeIndex]);

  useEffect(() => {
    if (!autoPlay || cards.length < 2) return;
    const timer = window.setInterval(() => {
      if (animatingRef.current) return;
      const list = cardsRef.current;
      if (list.length < 2) return;
      setIndex((prev) => {
        const from = prev % list.length;
        const next = (from + 1) % list.length;
        const current = list[from];
        if (current) {
          setDirection("next");
          setExiting(current);
          setAnimating(true);
        }
        return next;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [autoPlay, cards.length, intervalMs, cardKey]);

  if (!active) return null;

  function go(next: number) {
    if (next === safeIndex || animatingRef.current) return;
    const current = cardsRef.current[safeIndex];
    if (!current) return;
    setDirection(resolveDirection(safeIndex, next, cardsRef.current.length));
    setExiting(current);
    setAnimating(true);
    setIndex(next);
  }

  const viewportStyle =
    viewportHeight > 0
      ? ({ "--stage-h": `${viewportHeight}px` } as CSSProperties)
      : undefined;

  return (
    <div className="card-stage" aria-roledescription="carousel">
      <div
        ref={measureRef}
        className="card-stage__measure"
        aria-hidden="true"
      >
        {cards.map((card) => (
          <article key={card.id} className="card-stage__measure-slide">
            <p className="card-stage__eyebrow">{card.title}</p>
            <div className="card-stage__body">{card.body}</div>
          </article>
        ))}
      </div>

      <div className="card-stage__viewport" style={viewportStyle}>
        {exiting ? (
          <article
            key={`exit-${exiting.id}`}
            className={`card-stage__slide card-stage__slide--exit-${direction}`}
            aria-hidden="true"
          >
            <p className="card-stage__eyebrow">{exiting.title}</p>
            <div className="card-stage__body">{exiting.body}</div>
          </article>
        ) : null}
        <article
          key={active.id}
          className={[
            "card-stage__slide",
            animating
              ? `card-stage__slide--enter-${direction}`
              : "card-stage__slide--settled",
          ].join(" ")}
          aria-label={`${safeIndex + 1} из ${cards.length}: ${active.title}`}
        >
          <p className="card-stage__eyebrow">{active.title}</p>
          <div className="card-stage__body">{active.body}</div>
        </article>
      </div>

      {cards.length > 1 ? (
        <div className="card-stage__dots" role="tablist" aria-label="Карточки">
          {cards.map((card, i) => (
            <button
              key={card.id}
              type="button"
              role="tab"
              aria-selected={i === safeIndex}
              className={
                i === safeIndex
                  ? "card-stage__dot card-stage__dot--active"
                  : "card-stage__dot"
              }
              onClick={() => go(i)}
              aria-label={card.title}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
