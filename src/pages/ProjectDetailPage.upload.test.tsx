import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProjectDetailPage } from "./ProjectDetailPage";
import * as api from "../api/client";
import type { Project } from "../api/client";

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    capabilities: {
      stage: 2,
      limits: {
        maxTracksPerProject: 15,
        maxFileSizeBytes: 10_000_000,
        maxProjectSizeBytes: 50_000_000,
        maxOutputDurationSeconds: 3600,
        originalRetentionHours: 24,
        allowedInputExtensions: ["mp3", "m4a"],
      },
      effects: ["normalise", "echo"],
      transitionStyles: ["safe"],
      outputFormats: ["mp3"],
      policyVersion: "2026-07-30",
      features: { render: false, payments: false },
    },
  }),
}));

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>(
    "../api/client",
  );
  return {
    ...actual,
    getProject: vi.fn(),
    uploadProjectFile: vi.fn(),
    patchProject: vi.fn(),
    reorderProjectFiles: vi.fn(),
    deleteProjectFile: vi.fn(),
  };
});

function draftProject(overrides: Partial<Project> = {}): Project {
  return {
    id: "p1",
    title: "Тест",
    type: "MIX",
    status: "DRAFT",
    transitionStyle: "safe",
    outputFormat: "mp3",
    singleEffect: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [],
    ...overrides,
  };
}

describe("ProjectDetailPage upload", () => {
  beforeEach(() => {
    vi.mocked(api.getProject).mockReset();
    vi.mocked(api.uploadProjectFile).mockReset();
  });

  it("applies { file, project } from upload mock into UI", async () => {
    const user = userEvent.setup();
    const initial = draftProject({ type: "SINGLE_EFFECT", singleEffect: "normalise" });
    const ready: Project = {
      ...initial,
      status: "READY_TO_RENDER",
      files: [
        {
          id: "f1",
          originalFilename: "song.mp3",
          mimeType: "audio/mpeg",
          sizeBytes: 12,
          durationSeconds: 3,
          position: 0,
          status: "VALIDATED",
          expiresAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        },
      ],
    };
    vi.mocked(api.getProject).mockResolvedValue(initial);
    vi.mocked(api.uploadProjectFile).mockResolvedValue({
      file: ready.files[0]!,
      project: ready,
    });

    render(<ProjectDetailPage projectId="p1" onBack={() => undefined} />);
    await screen.findByRole("heading", { name: "Тест" });

    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1, 2, 3])], "song.MP3", {
      type: "audio/mpeg",
    });
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/готов к обработке/i)).toBeInTheDocument();
    });
    expect(screen.getByText("song.mp3")).toBeInTheDocument();
  });

  it("shows safe error on malformed upload success payload", async () => {
    const user = userEvent.setup();
    const initial = draftProject();
    vi.mocked(api.getProject).mockResolvedValue(initial);
    vi.mocked(api.uploadProjectFile).mockRejectedValue(
      new api.ApiError("PARSE_ERROR", "Некорректный ответ загрузки"),
    );

    const view = render(
      <ProjectDetailPage projectId="p-malformed" onBack={() => undefined} />,
    );
    await screen.findByRole("heading", { name: "Тест" });
    expect(
      view.container.querySelector(".panel--success"),
    ).not.toBeInTheDocument();

    const input = view.container.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File([new Uint8Array([1])], "a.mp3", {
      type: "audio/mpeg",
    });
    await user.upload(input, file);

    expect(
      await view.findByRole("alert"),
    ).toHaveTextContent("Некорректный ответ загрузки");
    expect(
      view.container.querySelector(".panel--success"),
    ).not.toBeInTheDocument();
    view.unmount();
  });
});
