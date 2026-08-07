import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { ProjectDetailPage } from "./ProjectDetailPage";
import * as api from "../api/client";

vi.mock("../api/client", async () => {
  const actual = await vi.importActual<typeof import("../api/client")>(
    "../api/client",
  );
  return {
    ...actual,
    getProject: vi.fn(),
    getRenderJob: vi.fn(),
    enqueueRender: vi.fn(),
    patchProject: vi.fn(),
    uploadProjectFile: vi.fn(),
    reorderProjectFiles: vi.fn(),
    deleteProjectFile: vi.fn(),
  };
});

vi.mock("../auth/AuthProvider", () => ({
  useAuth: () => ({
    capabilities: {
      stage: 3,
      limits: {
        maxTracksPerProject: 15,
        maxFileSizeBytes: 50_000_000,
        maxProjectSizeBytes: 200_000_000,
        maxOutputDurationSeconds: 600,
        originalRetentionHours: 24,
        allowedInputExtensions: ["mp3", "m4a"],
      },
      effects: ["slow_reverb"],
      transitionStyles: ["safe"],
      outputFormats: ["mp3"],
      policyVersion: "2026-07-30",
      features: { render: true, mixRender: true, payments: false, downloadTokens: true },
    },
  }),
}));

function baseProject(
  overrides: Partial<api.Project> = {},
): api.Project {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    title: "Test project",
    type: "SINGLE_EFFECT",
    status: "READY_TO_RENDER",
    transitionStyle: "safe",
    outputFormat: "mp3",
    singleEffect: "slow_reverb",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    files: [
      {
        id: "22222222-2222-4222-8222-222222222222",
        originalFilename: "track.mp3",
        mimeType: "audio/mpeg",
        sizeBytes: 1024,
        durationSeconds: 2,
        position: 0,
        status: "VALIDATED",
        expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        createdAt: new Date().toISOString(),
      },
    ],
    ...overrides,
  };
}

function baseJob(overrides: Partial<api.RenderJob> = {}): api.RenderJob {
  return {
    id: "33333333-3333-4333-8333-333333333333",
    projectId: "11111111-1111-4111-8111-111111111111",
    jobType: "SINGLE_EFFECT_RENDER",
    status: "QUEUED",
    attempts: 0,
    maxAttempts: 3,
    queuePosition: 1,
    effect: "slow_reverb",
    outputFormat: "mp3",
    transitionStyle: null,
    trackCount: 1,
    errorCode: null,
    errorMessage: null,
    result: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

describe("ProjectDetailPage render UX", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows Обработать when READY_TO_RENDER and render feature is on", async () => {
    vi.mocked(api.getProject).mockResolvedValue(baseProject());
    vi.mocked(api.getRenderJob).mockRejectedValue(
      new api.ApiError("PROJECT_NOT_FOUND", "Проект не найден"),
    );

    render(<ProjectDetailPage projectId={baseProject().id} onBack={() => {}} />);

    expect(
      await screen.findByRole("button", { name: "Обработать" }),
    ).toBeEnabled();
    expect(screen.getByText(/Всё готово к обработке/i)).toBeInTheDocument();
  });

  it("shows queued status copy without download URLs", async () => {
    vi.mocked(api.getProject).mockResolvedValue(
      baseProject({ status: "QUEUED" }),
    );
    vi.mocked(api.getRenderJob).mockResolvedValue(baseJob({ status: "QUEUED" }));

    render(<ProjectDetailPage projectId={baseProject().id} onBack={() => {}} />);

    expect(await screen.findByRole("status")).toBeInTheDocument();
    expect(screen.getByText("Вы в очереди")).toBeInTheDocument();
    expect(document.body.textContent).toMatch(/Вы в очереди/i);
    expect(document.body.textContent).not.toMatch(
      /https?:\/\/|\/v1\/downloads|token=/i,
    );
    expect(
      screen.queryByRole("button", { name: "Обработать" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("tablist", { name: "Карточки" })).toBeInTheDocument();
  });

  it("shows completed status and bot delivery copy without download CTA", async () => {
    vi.mocked(api.getProject).mockResolvedValue(
      baseProject({ status: "COMPLETED" }),
    );
    vi.mocked(api.getRenderJob).mockResolvedValue(
      baseJob({
        status: "COMPLETED",
        result: {
          contentType: "audio/mpeg",
          sizeBytes: 2048,
          durationSeconds: 2,
          expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
        },
      }),
    );

    render(<ProjectDetailPage projectId={baseProject().id} onBack={() => {}} />);

    expect(await screen.findByRole("heading", { name: "Готово" })).toBeInTheDocument();
    expect(screen.getByText(/в чате с ботом/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /Скачать/i }),
    ).not.toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(
      /https?:\/\/|\/v1\/downloads|token=/i,
    );
  });

  it("allows multi-file picker for MIX projects", async () => {
    vi.mocked(api.getProject).mockResolvedValue(
      baseProject({
        type: "MIX",
        singleEffect: null,
        status: "DRAFT",
        files: [],
      }),
    );
    vi.mocked(api.getRenderJob).mockRejectedValue(
      new api.ApiError("PROJECT_NOT_FOUND", "Проект не найден"),
    );

    render(<ProjectDetailPage projectId={baseProject().id} onBack={() => {}} />);

    expect(
      await screen.findByRole("button", { name: "Выбрать файлы" }),
    ).toBeInTheDocument();
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input).not.toBeNull();
    expect(input?.multiple).toBe(true);
  });

  it("keeps single-file picker for SINGLE_EFFECT", async () => {
    vi.mocked(api.getProject).mockResolvedValue(
      baseProject({ status: "DRAFT", files: [] }),
    );
    vi.mocked(api.getRenderJob).mockRejectedValue(
      new api.ApiError("PROJECT_NOT_FOUND", "Проект не найден"),
    );

    render(<ProjectDetailPage projectId={baseProject().id} onBack={() => {}} />);

    expect(
      await screen.findByRole("button", { name: "Выбрать файл" }),
    ).toBeInTheDocument();
    const input = document.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement | null;
    expect(input?.multiple).toBe(false);
  });

  it("shows safe failed message and allows retry button", async () => {
    vi.mocked(api.getProject).mockResolvedValue(
      baseProject({ status: "FAILED" }),
    );
    vi.mocked(api.getRenderJob).mockResolvedValue(
      baseJob({
        status: "FAILED",
        errorCode: "RENDER_FAILED",
        errorMessage: "Не удалось обработать аудио. Попробуйте другой файл",
      }),
    );

    render(<ProjectDetailPage projectId={baseProject().id} onBack={() => {}} />);

    expect(await screen.findByText("Ошибка обработки")).toBeInTheDocument();
    expect(
      screen.getByText(/Не удалось обработать аудио/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Попробовать снова/i }),
    ).toBeEnabled();
  });
});
