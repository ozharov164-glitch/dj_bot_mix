import { describe, expect, it } from "vitest";
import { planClientUploads } from "./batch-upload";

function audio(name: string, size = 1024): File {
  return new File([new Uint8Array(size)], name, { type: "audio/mpeg" });
}

const formatBytes = (n: number) => `${n} B`;

describe("planClientUploads", () => {
  it("takes only the first file for SINGLE_EFFECT", () => {
    const plan = planClientUploads({
      selected: [audio("a.mp3"), audio("b.mp3")],
      projectType: "SINGLE_EFFECT",
      currentTrackCount: 0,
      maxTracks: 15,
      allowedExtensions: ["mp3"],
      formatBytes,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.files.map((f) => f.name)).toEqual(["a.mp3"]);
    expect(plan.warnings[0]).toMatch(/первый файл/i);
  });

  it("accepts multiple MIX files up to remaining slots", () => {
    const plan = planClientUploads({
      selected: [audio("a.mp3"), audio("b.mp3"), audio("c.mp3")],
      projectType: "MIX",
      currentTrackCount: 13,
      maxTracks: 15,
      allowedExtensions: ["mp3"],
      formatBytes,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.files.map((f) => f.name)).toEqual(["a.mp3", "b.mp3"]);
    expect(plan.warnings.some((w) => /лимит/i.test(w))).toBe(true);
  });

  it("skips invalid extensions and keeps valid ones", () => {
    const plan = planClientUploads({
      selected: [audio("ok.mp3"), audio("bad.txt"), audio("also.mp3")],
      projectType: "MIX",
      currentTrackCount: 0,
      maxTracks: 15,
      allowedExtensions: ["mp3"],
      formatBytes,
    });
    expect(plan.ok).toBe(true);
    if (!plan.ok) return;
    expect(plan.files.map((f) => f.name)).toEqual(["ok.mp3", "also.mp3"]);
    expect(plan.warnings[0]).toMatch(/bad\.txt/i);
  });

  it("fails when MIX already at track limit", () => {
    const plan = planClientUploads({
      selected: [audio("a.mp3")],
      projectType: "MIX",
      currentTrackCount: 15,
      maxTracks: 15,
      allowedExtensions: ["mp3"],
      formatBytes,
    });
    expect(plan.ok).toBe(false);
    if (plan.ok) return;
    expect(plan.message).toMatch(/лимит/i);
  });
});
