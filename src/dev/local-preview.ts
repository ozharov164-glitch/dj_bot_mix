import type {
  AudioFile,
  Capabilities,
  ConsentState,
  CreateProjectBody,
  MeResponse,
  OutputFormat,
  PatchProjectBody,
  Project,
  ProjectsListResponse,
  RenderJob,
  TransitionStyle,
  UploadProjectFileResponse,
  User,
} from "../api/client";
import { ApiError } from "../api/client";
import { PUBLIC_LIMITS } from "../config/public-limits";
import { TRANSITION_STYLE_FALLBACK } from "../lib/transition-catalog";
import { isLocalCursorPreview } from "./preview-flag";

export { isLocalCursorPreview };

const nowIso = () => new Date().toISOString();

const PREVIEW_USER: User = {
  id: "00000000-0000-4000-8000-000000000001",
  username: "cursor_preview",
};

export const PREVIEW_CAPABILITIES: Capabilities = {
  stage: 4,
  limits: {
    maxTracksPerProject: PUBLIC_LIMITS.maxTracksPerProject,
    maxFileSizeBytes: PUBLIC_LIMITS.maxFileSizeBytes,
    maxProjectSizeBytes: PUBLIC_LIMITS.maxProjectSizeBytes,
    maxOutputDurationSeconds: PUBLIC_LIMITS.maxOutputDurationSeconds,
    originalRetentionHours: 24,
    allowedInputExtensions: ["mp3", "m4a", "wav", "flac", "ogg", "aac"],
  },
  effects: [
    "normalise",
    "speed_pitch",
    "slow_reverb",
    "echo",
    "eq",
    "bass_boost",
  ],
  transitionStyles: [
    "variety",
    "safe",
    "smooth",
    "energetic",
    "echo_out",
    "dark_fade",
    "punch",
  ],
  transitionStyleCatalog: TRANSITION_STYLE_FALLBACK,
  outputFormats: ["mp3", "aac"],
  policyVersion: "preview-local",
  features: {
    render: true,
    mixRender: true,
    payments: false,
    downloadTokens: true,
    botNotifications: false,
  },
};

export const PREVIEW_CONSENT: ConsentState = {
  policyVersion: "preview-local",
  accepted: true,
  consent: {
    id: "00000000-0000-4000-8000-0000000000c1",
    policyVersion: "preview-local",
    privacyAcceptedAt: nowIso(),
    termsAcceptedAt: nowIso(),
    rightsConfirmedAt: nowIso(),
    createdAt: nowIso(),
  },
};

function seedProjects(): Project[] {
  const createdAt = nowIso();
  return [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "Тренировка · микс",
      type: "MIX",
      status: "READY_TO_RENDER",
      transitionStyle: "smooth",
      outputFormat: "mp3",
      singleEffect: null,
      createdAt,
      updatedAt: createdAt,
      files: [
        makeFile("a1", "intro.mp3", 0, 4_200_000, 128),
        makeFile("a2", "drop.mp3", 1, 5_100_000, 176),
      ],
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      title: "Один трек · реверб",
      type: "SINGLE_EFFECT",
      status: "DRAFT",
      transitionStyle: "safe",
      outputFormat: "mp3",
      singleEffect: "slow_reverb",
      createdAt,
      updatedAt: createdAt,
      files: [makeFile("b1", "vocal.wav", 0, 12_000_000, 210)],
    },
  ];
}

function makeFile(
  id: string,
  name: string,
  position: number,
  sizeBytes: number,
  durationSeconds: number,
): AudioFile {
  return {
    id,
    originalFilename: name,
    mimeType: name.endsWith(".wav") ? "audio/wav" : "audio/mpeg",
    sizeBytes,
    durationSeconds,
    position,
    status: "VALIDATED",
    expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
    createdAt: nowIso(),
  };
}

let projects = seedProjects();
const jobs = new Map<string, RenderJob>();

function findProject(id: string): Project {
  const project = projects.find((p) => p.id === id);
  if (!project) {
    throw new ApiError("PROJECT_NOT_FOUND", "Проект не найден");
  }
  return project;
}

function replaceProject(next: Project): Project {
  projects = projects.map((p) => (p.id === next.id ? next : p));
  return next;
}

export const previewAuth = {
  user: PREVIEW_USER,
  capabilities: PREVIEW_CAPABILITIES,
  consent: PREVIEW_CONSENT,
};

export function previewFetchMe(): MeResponse {
  return {
    ...PREVIEW_USER,
    consent: PREVIEW_CONSENT,
    policyVersion: PREVIEW_CONSENT.policyVersion,
  };
}

export function previewListProjects(): ProjectsListResponse {
  return { items: [...projects], nextCursor: null };
}

export function previewGetProject(projectId: string): Project {
  return structuredClone(findProject(projectId));
}

export function previewCreateProject(body: CreateProjectBody): Project {
  const createdAt = nowIso();
  const project: Project = {
    id: crypto.randomUUID(),
    title: body.title,
    type: body.type,
    status: "DRAFT",
    transitionStyle: body.transitionStyle ?? "safe",
    outputFormat: body.outputFormat ?? "mp3",
    singleEffect: body.type === "SINGLE_EFFECT" ? (body.singleEffect ?? "normalise") : null,
    createdAt,
    updatedAt: createdAt,
    files: [],
  };
  projects = [project, ...projects];
  return structuredClone(project);
}

export function previewPatchProject(
  projectId: string,
  body: PatchProjectBody,
): Project {
  const current = findProject(projectId);
  const next: Project = {
    ...current,
    ...body,
    singleEffect:
      body.singleEffect !== undefined ? body.singleEffect : current.singleEffect,
    transitionStyle:
      (body.transitionStyle as TransitionStyle | undefined) ??
      current.transitionStyle,
    outputFormat:
      (body.outputFormat as OutputFormat | undefined) ?? current.outputFormat,
    updatedAt: nowIso(),
  };
  return structuredClone(replaceProject(next));
}

export function previewDeleteProject(projectId: string): void {
  findProject(projectId);
  projects = projects.filter((p) => p.id !== projectId);
  jobs.delete(projectId);
}

export function previewReorder(
  projectId: string,
  fileIds: string[],
): Project {
  const current = findProject(projectId);
  const byId = new Map(current.files.map((f) => [f.id, f]));
  const files = fileIds.map((id, index) => {
    const file = byId.get(id);
    if (!file) throw new ApiError("FILE_NOT_FOUND", "Файл не найден");
    return { ...file, position: index };
  });
  return structuredClone(
    replaceProject({ ...current, files, updatedAt: nowIso() }),
  );
}

export function previewDeleteFile(projectId: string, fileId: string): void {
  const current = findProject(projectId);
  const files = current.files
    .filter((f) => f.id !== fileId)
    .map((f, index) => ({ ...f, position: index }));
  replaceProject({ ...current, files, updatedAt: nowIso() });
}

export async function previewUpload(
  projectId: string,
  file: File,
  onProgress: (percent: number) => void,
): Promise<UploadProjectFileResponse> {
  const current = findProject(projectId);
  for (const step of [12, 38, 67, 91, 100]) {
    await new Promise((r) => setTimeout(r, 40));
    onProgress(step);
  }
  const audio: AudioFile = makeFile(
    crypto.randomUUID(),
    file.name || "track.mp3",
    current.files.length,
    file.size || 1_024_000,
    120,
  );
  const next: Project = {
    ...current,
    status: current.type === "MIX" && current.files.length + 1 >= 2
      ? "READY_TO_RENDER"
      : current.type === "SINGLE_EFFECT"
        ? "READY_TO_RENDER"
        : current.status,
    files: [...current.files, audio],
    updatedAt: nowIso(),
  };
  const project = replaceProject(next);
  return { file: audio, project: structuredClone(project) };
}

export function previewEnqueueRender(projectId: string): RenderJob {
  const project = findProject(projectId);
  const job: RenderJob = {
    id: crypto.randomUUID(),
    projectId,
    jobType: project.type === "MIX" ? "MIX_RENDER" : "SINGLE_EFFECT_RENDER",
    status: "QUEUED",
    attempts: 1,
    maxAttempts: 3,
    queuePosition: 1,
    effect: project.singleEffect,
    transitionStyle: project.type === "MIX" ? project.transitionStyle : null,
    trackCount: project.files.length,
    outputFormat: project.outputFormat,
    errorCode: null,
    errorMessage: null,
    result: null,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    startedAt: null,
    completedAt: null,
  };
  jobs.set(projectId, job);
  replaceProject({ ...project, status: "QUEUED", updatedAt: nowIso() });

  window.setTimeout(() => {
    const running: RenderJob = {
      ...job,
      status: "RUNNING",
      queuePosition: null,
      startedAt: nowIso(),
      updatedAt: nowIso(),
    };
    jobs.set(projectId, running);
    const p = projects.find((x) => x.id === projectId);
    if (p) replaceProject({ ...p, status: "RENDERING", updatedAt: nowIso() });
  }, 600);

  window.setTimeout(() => {
    const completed: RenderJob = {
      ...job,
      status: "COMPLETED",
      queuePosition: null,
      startedAt: job.startedAt ?? nowIso(),
      completedAt: nowIso(),
      updatedAt: nowIso(),
      result: {
        contentType: "audio/mpeg",
        sizeBytes: 2_400_000,
        durationSeconds: 240,
        expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
      },
    };
    jobs.set(projectId, completed);
    const p = projects.find((x) => x.id === projectId);
    if (p) replaceProject({ ...p, status: "COMPLETED", updatedAt: nowIso() });
  }, 1800);

  return structuredClone(job);
}

export function previewGetRenderJob(projectId: string): RenderJob {
  const job = jobs.get(projectId);
  if (!job) {
    throw new ApiError("PROJECT_NOT_FOUND", "Проект не найден");
  }
  return structuredClone(job);
}

export async function previewDownloadRenderResult(): Promise<void> {
  // Design preview: no real blob download.
  return;
}
