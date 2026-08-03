import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { OutsideTelegramPage } from "../pages/OutsideTelegramPage";

describe("OutsideTelegramPage", () => {
  it("renders the outside-Telegram screen without a fake login form", () => {
    const html = renderToStaticMarkup(<OutsideTelegramPage />);
    expect(html).toContain("Откройте в Telegram");
    expect(html).toContain("@fadeline_bot");
    expect(html).toContain("не показываем форму");
    expect(html).not.toContain("Режим разработки");
    expect(html).not.toMatch(/<form[\s>]/i);
  });
});
