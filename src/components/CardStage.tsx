import { useEffect, useState, type ReactNode } from "react";

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

/**
 * One-at-a-time card stage — crossfade/slide, no stacked overlap.
 */
export function CardStage({
  cards,
  autoPlay = false,
  intervalMs = 3400,
}: CardStageProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const safeIndex = cards.length === 0 ? 0 : index % cards.length;
  const active = cards[safeIndex];

  const cardKey = cards.map((c) => c.id).join("|");

  useEffect(() => {
    setIndex(0);
  }, [cardKey]);

  useEffect(() => {
    if (!autoPlay || cards.length < 2) return;
    const timer = window.setInterval(() => {
      setDirection("next");
      setIndex((prev) => (prev + 1) % cards.length);
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [autoPlay, cards.length, intervalMs, cardKey]);

  if (!active) return null;

  function go(next: number) {
    setDirection(next > safeIndex ? "next" : "prev");
    setIndex(next);
  }

  return (
    <div className="card-stage" aria-roledescription="carousel">
      <div className="card-stage__viewport">
        <article
          key={active.id}
          className={`card-stage__slide card-stage__slide--${direction}`}
          aria-label={`${safeIndex + 1} из ${cards.length}: ${active.title}`}
        >
          <h3 className="card-stage__title">{active.title}</h3>
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
