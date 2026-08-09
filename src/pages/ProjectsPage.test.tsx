import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import type { Project } from "../api/client";
import * as api from "../api/client";
import { AppDataProvider } from "../boot/AppDataProvider";
import {
  isStaleProject,
  partitionActiveProjects,
} from "../lib/projects-list";
import { ProjectsPage } from "./ProjectsPage";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>(
    "../api/client",
  );
  return {
    ...actual,
    listProjects: vi.fn(),
    deleteProject: vi.fn(),
  };
});

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    status: "ready",
    colorScheme: "dark",
    user: { id: "u1", username: "test" },
    capabilities: null,
    consent: { accepted: true },
    error: null,
    retry: () => {},
    acceptConsent: async () => {},
  }),
}));

vi.mock("../boot/warm-assets", () => ({
  warmChromeAssets: vi.fn(async () => undefined),
}));

function baseProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Тест",
    type: "MIX",
    status: "DRAFT",
    transitionStyle: "smooth",
    outputFormat: "mp3",
    singleEffect: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
    ...overrides,
  };
}

function renderProjectsPage() {
  return render(
    <AppDataProvider>
      <ProjectsPage onCreate={() => {}} onOpen={() => {}} />
    </AppDataProvider>,
  );
}

describe("project list helpers", () => {
  it("marks completed and expired as stale", () => {
    expect(isStaleProject(baseProject({ status: "COMPLETED" }))).toBe(true);
    expect(isStaleProject(baseProject({ status: "EXPIRED" }))).toBe(true);
    expect(isStaleProject(baseProject({ status: "FAILED" }))).toBe(false);
    expect(isStaleProject(baseProject({ status: "DRAFT" }))).toBe(false);
  });

  it("partitions active projects into mixes and singles", () => {
    const { mixes, singles } = partitionActiveProjects([
      baseProject({
        id: "m1",
        type: "MIX",
        status: "READY_TO_RENDER",
        title: "Микс A",
      }),
      baseProject({
        id: "s1",
        type: "SINGLE_EFFECT",
        status: "DRAFT",
        title: "Трек B",
        singleEffect: "echo",
      }),
      baseProject({ id: "c1", type: "MIX", status: "COMPLETED", title: "Старый" }),
    ]);

    expect(mixes.map((p) => p.id)).toEqual(["m1"]);
    expect(singles.map((p) => p.id)).toEqual(["s1"]);
  });
});

describe("ProjectsPage", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("purges completed projects and shows type sections", async () => {
    vi.mocked(api.listProjects).mockResolvedValue({
      items: [
        baseProject({
          id: "m1",
          type: "MIX",
          status: "READY_TO_RENDER",
          title: "Микс живой",
        }),
        baseProject({
          id: "s1",
          type: "SINGLE_EFFECT",
          status: "DRAFT",
          title: "Один живой",
          singleEffect: "echo",
        }),
        baseProject({
          id: "c1",
          type: "MIX",
          status: "COMPLETED",
          title: "Готовый скрытый",
        }),
      ],
    });
    vi.mocked(api.deleteProject).mockResolvedValue(undefined);

    renderProjectsPage();

    expect(await screen.findByText("Микс живой")).toBeInTheDocument();
    expect(screen.getByText("Один живой")).toBeInTheDocument();
    expect(screen.queryByText("Готовый скрытый")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Миксы" })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Один трек" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/@fadeline_bot/)).toBeInTheDocument();

    await waitFor(() => {
      expect(api.deleteProject).toHaveBeenCalledWith("c1");
    });
  });
});
