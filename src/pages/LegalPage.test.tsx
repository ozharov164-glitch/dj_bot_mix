import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { LegalPage } from "./LegalPage";
import { LEGAL_DOCS } from "../legal/docs";

describe("LegalPage drafts", () => {
  it("renders draft banner and does not claim liability waiver", () => {
    for (const id of Object.keys(LEGAL_DOCS) as Array<keyof typeof LEGAL_DOCS>) {
      const html = renderToStaticMarkup(
        <LegalPage docId={id} onBack={() => {}} />,
      );
      expect(html).toContain("Черновик");
      expect(html).toContain(LEGAL_DOCS[id].title);
      expect(html).not.toMatch(/полностью снимаем ответственность|not liable for anything/i);
    }
  });
});
