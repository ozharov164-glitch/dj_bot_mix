import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { CardStage } from "./CardStage";

function viewportOf(container: HTMLElement) {
  const viewport = container.querySelector(".card-stage__viewport");
  expect(viewport).not.toBeNull();
  return viewport as HTMLElement;
}

describe("CardStage", () => {
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  it("shows one card and switches without stacking siblings", () => {
    const { container } = render(
      <CardStage
        cards={[
          { id: "a", title: "Статус", body: "В очереди" },
          { id: "b", title: "Треки", body: "2 файла" },
        ]}
      />,
    );

    const viewport = viewportOf(container);
    expect(within(viewport).getByText("Статус")).toBeInTheDocument();
    expect(within(viewport).queryByText("Треки")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: "Треки" }));
    expect(within(viewport).getByText("Треки")).toBeInTheDocument();
    // During crossfade the outgoing slide stays briefly; settle after transition.
    expect(within(viewport).getAllByText("Статус").length).toBeGreaterThanOrEqual(1);
  });

  it("settles to a single visible card after transition", async () => {
    const { container } = render(
      <CardStage
        cards={[
          { id: "a", title: "Статус", body: "В очереди" },
          { id: "b", title: "Треки", body: "2 файла" },
        ]}
      />,
    );

    fireEvent.click(screen.getByRole("tab", { name: "Треки" }));

    const viewport = viewportOf(container);
    await waitFor(() => {
      expect(within(viewport).queryByText("Статус")).not.toBeInTheDocument();
    });
    expect(within(viewport).getByText("Треки")).toBeInTheDocument();
    expect(within(viewport).getByText("2 файла")).toBeInTheDocument();
    expect(within(viewport).queryByText("В очереди")).not.toBeInTheDocument();
  });

  it("sizes viewport to the active card without clipping its content", () => {
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
          { id: "tracks", title: "Треки", body: "2 файла" },
        ]}
      />,
    );

    const viewport = viewportOf(container);
    expect(within(viewport).getByText("Медленный реверб")).toBeVisible();
    expect(within(viewport).getByText("Один трек")).toBeVisible();
    expect(within(viewport).getByText("MP3")).toBeVisible();
    expect(within(viewport).getByText("1 файл в проекте")).toBeVisible();

    const slide = viewport.querySelector(".card-stage__slide");
    expect(slide).not.toBeNull();
    expect(container.querySelector(".card-stage__measure")).not.toBeNull();
    expect(
      container.querySelectorAll(".card-stage__measure-slide"),
    ).toHaveLength(2);
    // jsdom often reports 0 offsetHeight; when measured, CSS var is set in px.
    const stageH = viewport.style.getPropertyValue("--stage-h");
    if (stageH) {
      expect(stageH).toMatch(/px$/);
    }
  });
});
