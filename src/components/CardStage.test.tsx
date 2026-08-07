import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
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
    expect(screen.queryByText("Статус")).not.toBeInTheDocument();
  });
});
