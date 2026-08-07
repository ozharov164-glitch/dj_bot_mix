import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { OptionPicker } from "./OptionPicker";

describe("OptionPicker", () => {
  afterEach(() => {
    cleanup();
  });

  it("opens a compact anchored listbox instead of a native select or sheet", () => {
    const onChange = vi.fn();
    render(
      <OptionPicker
        label="Стиль переходов"
        value="safe"
        options={[
          {
            value: "safe",
            label: "Чистый переход",
            description: "Мягкое сведение",
          },
          {
            value: "punch",
            label: "Резкая смена",
            description: "Короткий стык",
          },
        ]}
        onChange={onChange}
      />,
    );

    expect(document.querySelector("select")).toBeNull();
    expect(document.querySelector(".pick-sheet")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Стиль переходов/i }));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("option", { name: "Резкая смена" }));
    expect(onChange).toHaveBeenCalledWith("punch");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
