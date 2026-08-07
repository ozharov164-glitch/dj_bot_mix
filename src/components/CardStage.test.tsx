import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CardStage } from "./CardStage";

describe("CardStage", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows one card and switches without stacking siblings", () => {
    render(
      <CardStage
        cards={[
          { id: "a", title: "Статус", body: "В очереди" },
          { id: "b", title: "Треки", body: "2 файла" },
        ]}
      />,
    );

    expect(screen.getByText("Статус")).toBeInTheDocument();
    expect(screen.queryByText("Треки")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Треки" }));
    expect(screen.getByText("Треки")).toBeInTheDocument();
    // During crossfade the outgoing slide stays briefly; settle after transition.
    expect(screen.getAllByText("Статус").length).toBeGreaterThanOrEqual(1);
  });

  it("settles to a single visible card after transition", async () => {
    render(
      <CardStage
        cards={[
          { id: "a", title: "Статус", body: "В очереди" },
          { id: "b", title: "Треки", body: "2 файла" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Треки" }));

    await waitFor(() => {
      expect(screen.queryByText("Статус")).not.toBeInTheDocument();
    });
    expect(screen.getByText("Треки")).toBeInTheDocument();
    expect(screen.getByText("2 файла")).toBeInTheDocument();
    expect(screen.queryByText("В очереди")).not.toBeInTheDocument();
  });

  it("grows with content instead of clipping settings rows", () => {
    const { container } = render(
      <CardStage
        cards={[
          {
            id: "settings",
            title: "Как собираем",
            body: (
              <div className="stage-recipe">
                <div className="stage-recipe__hero">
                  <span className="stage-recipe__kicker">Эффект</span>
                  <strong className="stage-recipe__value">Медленный реверб</strong>
                </div>
                <div className="stage-recipe__grid">
                  <div className="stage-recipe__tile">
                    <span className="stage-recipe__kicker">Тип</span>
                    <strong>Один трек</strong>
                  </div>
                  <div className="stage-recipe__tile">
                    <span className="stage-recipe__kicker">Формат</span>
                    <strong>MP3</strong>
                  </div>
                </div>
                <p className="stage-recipe__foot">1 файл в проекте</p>
              </div>
            ),
          },
        ]}
      />,
    );

    expect(screen.getByText("Медленный реверб")).toBeVisible();
    expect(screen.getByText("Один трек")).toBeVisible();
    expect(screen.getByText("MP3")).toBeVisible();
    expect(screen.getByText("1 файл в проекте")).toBeVisible();

    const viewport = container.querySelector(".card-stage__viewport");
    const slide = container.querySelector(".card-stage__slide");
    expect(viewport).not.toBeNull();
    expect(slide).not.toBeNull();
    expect(getComputedStyle(slide!).position).not.toBe("absolute");
  });
});
