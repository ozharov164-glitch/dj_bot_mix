import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OutsideTelegramPage } from "../pages/OutsideTelegramPage";

describe("OutsideTelegramPage", () => {
  it("renders the outside-Telegram error / development screen", () => {
    const html = renderToStaticMarkup(<OutsideTelegramPage />);
    expect(html).toContain("Только внутри Telegram");
    expect(html).toContain("Режим разработки");
    expect(html).toContain("не показываем форму");
    expect(html).not.toMatch(/<form[\s>]/i);
  });
});
