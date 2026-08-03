import { isLocalCursorPreview } from "../dev/preview-flag";
import { resolveApiBaseUrl } from "../config/api-url";

const API_BASE = resolveApiBaseUrl({
  raw: import.meta.env.VITE_API_URL,
  mode: import.meta.env.MODE,
  allowDevApi: import.meta.env.VITE_ALLOW_DEV_API === "true",
});

let bearerToken: string | null = null;

export function setBearerToken(token: string | null): void {
  bearerToken = token;
}

export function getBearerToken(): string | null {
  return bearerToken;
}

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
};

export class ApiError extends Error {
  readonly code: string;
  readonly requestId?: string;

  constructor(code: string, message: string, requestId?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.requestId = requestId;
  }
}

export type ProjectType = "SINGLE_EFFECT" | "MIX";

export type ProjectStatus =
  | "DRAFT"
  | "UPLOADING"
  | "READY_TO_RENDER"
  | "QUEUED"
  | "ANALYZING"
  | "RENDERING"
  | "COMPLETED"
  | "FAILED"
  | "EXPIRED";

export type SingleEffect =
  | "normalise"
  | "speed_pitch"
  | "slow_reverb"
  | "echo"
  | "eq"
  | "bass_boost";

export type TransitionStyle = "safe" | "smooth" | "energetic";
export type OutputFormat = "mp3" | "aac";

export type AudioFileStatus =
  | "PENDING"
  | "UPLOADED"
  | "VALIDATED"
  | "REJECTED"
  | "EXPIRED"
  | "DELETED";

export type AudioFile = {
  id: string;
  originalFilename: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  position: number;
  status: AudioFileStatus;
  expiresAt: string;
  createdAt: string;
};

export type Project = {
  id: string;
  title: string;
  type: ProjectType;
  status: ProjectStatus;
  transitionStyle: TransitionStyle;
  outputFormat: OutputFormat;
  singleEffect: SingleEffect | null;
  createdAt: string;
  updatedAt: string;
  files: AudioFile[];
};

export type User = {
  id: string;
  username: string | null;
};

export type ConsentState =
  | {
      policyVersion: string;
      accepted: false;
      consent: null;
    }
  | {
      policyVersion: string;
      accepted: true;
      consent: {
        id: string;
        policyVersion: string;
        privacyAcceptedAt: string | null;
        termsAcceptedAt: string | null;
        rightsConfirmedAt: string | null;
        createdAt: string;
      };
    };

export type Capabilities = {
  stage: number;
  limits: {
    maxTracksPerProject: number;
    maxFileSizeBytes: number;
    maxProjectSizeBytes: number;
    maxOutputDurationSeconds: number;
    originalRetentionHours: number;
    allowedInputExtensions: string[];
  };
  effects: SingleEffect[];
  transitionStyles: TransitionStyle[];
  outputFormats: OutputFormat[];
  policyVersion: string;
  features: {
    render: boolean;
    payments: boolean;
    mixRender?: boolean;
    downloadTokens?: boolean;
    botNotifications?: boolean;
  };
};

export type RenderJobStatus = "QUEUED" | "RUNNING" | "COMPLETED" | "FAILED";

export type RenderJob = {
  id: string;
  projectId: string;
  jobType: "SINGLE_EFFECT_RENDER" | "MIX_RENDER";
  status: RenderJobStatus;
  attempts: number;
  maxAttempts: number;
  queuePosition: number | null;
  /** Single-effect name, or null for MIX. */
  effect: string | null;
  transitionStyle: "safe" | "smooth" | "energetic" | null;
  trackCount: number | null;
  outputFormat: OutputFormat;
  errorCode: string | null;
  errorMessage: string | null;
  result: null | {
    contentType: string;
    sizeBytes: number;
    durationSeconds: number;
    expiresAt: string;
  };
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
};

export type DownloadTokenResponse = {
  token: string;
  expiresAt: string;
  renderJobId: string;
};

export type AuthResponse = {
  token: string;
  tokenType: "Bearer";
  expiresIn: number;
  expiresAt: string;
  user: User;
};

export type MeResponse = User & {
  consent: ConsentState;
  policyVersion: string;
};

export type ProjectsListResponse = {
  items: Project[];
  nextCursor: string | null;
};

export type UploadProjectFileResponse = {
  file: AudioFile;
  project: Project;
};

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) {
    return undefined as T;
  }
  return JSON.parse(text) as T;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    return parseJson<T>(response);
  }

  let body: ApiErrorBody | undefined;
  try {
    body = await parseJson<ApiErrorBody>(response);
  } catch {
    // ignore malformed error body
  }

  throw new ApiError(
    body?.error.code ?? "UNKNOWN",
    body?.error.message ?? "Произошла ошибка",
    body?.error.requestId,
  );
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  return handleResponse<T>(response);
}

export function authTelegram(initData: string): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/v1/auth/telegram", {
    method: "POST",
    body: JSON.stringify({ initData }),
  });
}

export function fetchMe(): Promise<MeResponse> {
  if (isLocalCursorPreview()) {
    // Dynamic import: local-preview imports types from this module.
    return import("../dev/local-preview").then((m) => m.previewFetchMe());
  }
  return apiFetch<MeResponse>("/v1/me");
}

export function fetchCapabilities(): Promise<Capabilities> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) => m.PREVIEW_CAPABILITIES);
  }
  return apiFetch<Capabilities>("/v1/capabilities");
}

export function fetchCurrentConsent(): Promise<ConsentState> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) => m.PREVIEW_CONSENT);
  }
  return apiFetch<ConsentState>("/v1/consents/current");
}

export function submitConsent(): Promise<ConsentState> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) => m.PREVIEW_CONSENT);
  }
  return apiFetch<ConsentState>("/v1/consents", {
    method: "POST",
    body: JSON.stringify({
      privacyAccepted: true,
      termsAccepted: true,
      rightsConfirmed: true,
    }),
  });
}

export function listProjects(): Promise<ProjectsListResponse> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) => m.previewListProjects());
  }
  return apiFetch<ProjectsListResponse>("/v1/projects");
}

export function getProject(projectId: string): Promise<Project> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewGetProject(projectId),
    );
  }
  return apiFetch<Project>(`/v1/projects/${projectId}`);
}

export type CreateProjectBody = {
  title: string;
  type: ProjectType;
  transitionStyle?: TransitionStyle;
  outputFormat?: OutputFormat;
  singleEffect?: SingleEffect;
};

export function createProject(body: CreateProjectBody): Promise<Project> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewCreateProject(body),
    );
  }
  return apiFetch<Project>("/v1/projects", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export type PatchProjectBody = {
  title?: string;
  transitionStyle?: TransitionStyle;
  outputFormat?: OutputFormat;
  singleEffect?: SingleEffect;
};

export function patchProject(
  projectId: string,
  body: PatchProjectBody,
): Promise<Project> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewPatchProject(projectId, body),
    );
  }
  return apiFetch<Project>(`/v1/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProject(projectId: string): Promise<void> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) => {
      m.previewDeleteProject(projectId);
    });
  }
  return apiFetch<void>(`/v1/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function reorderProjectFiles(
  projectId: string,
  fileIds: string[],
): Promise<Project> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewReorder(projectId, fileIds),
    );
  }
  return apiFetch<Project>(`/v1/projects/${projectId}/reorder`, {
    method: "POST",
    body: JSON.stringify({ fileIds }),
  });
}

export function deleteProjectFile(
  projectId: string,
  fileId: string,
): Promise<void> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) => {
      m.previewDeleteFile(projectId, fileId);
    });
  }
  return apiFetch<void>(`/v1/projects/${projectId}/files/${fileId}`, {
    method: "DELETE",
  });
}

export function uploadProjectFile(
  projectId: string,
  file: File,
  onProgress: (percent: number) => void,
  signal?: AbortSignal,
): Promise<UploadProjectFileResponse> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewUpload(projectId, file, onProgress),
    );
  }
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_BASE}/v1/projects/${projectId}/files`);

    if (bearerToken) {
      xhr.setRequestHeader("Authorization", `Bearer ${bearerToken}`);
    }

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as UploadProjectFileResponse);
        } catch {
          reject(new ApiError("PARSE_ERROR", "Не удалось разобрать ответ сервера"));
        }
        return;
      }

      try {
        const body = JSON.parse(xhr.responseText) as ApiErrorBody;
        reject(
          new ApiError(
            body.error.code,
            body.error.message,
            body.error.requestId,
          ),
        );
      } catch {
        reject(new ApiError("UNKNOWN", "Ошибка загрузки файла"));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new ApiError("NETWORK", "Сетевая ошибка при загрузке"));
    });

    xhr.addEventListener("abort", () => {
      reject(new ApiError("ABORTED", "Загрузка отменена"));
    });

    if (signal) {
      if (signal.aborted) {
        xhr.abort();
        return;
      }
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }

    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null || seconds <= 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function enqueueRender(projectId: string): Promise<RenderJob> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewEnqueueRender(projectId),
    );
  }
  return apiFetch<RenderJob>(`/v1/projects/${projectId}/render`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export function getRenderJob(projectId: string): Promise<RenderJob> {
  if (isLocalCursorPreview()) {
    return import("../dev/local-preview").then((m) =>
      m.previewGetRenderJob(projectId),
    );
  }
  return apiFetch<RenderJob>(`/v1/projects/${projectId}/render`);
}

export function mintDownloadToken(
  renderJobId: string,
): Promise<DownloadTokenResponse> {
  return apiFetch<DownloadTokenResponse>(
    `/v1/render-jobs/${renderJobId}/download-token`,
    { method: "POST" },
  );
}

/**
 * Mint a short-lived token in memory, stream the blob, trigger a browser
 * download. Never persists the token to storage.
 */
export async function downloadRenderResult(renderJobId: string): Promise<void> {
  if (isLocalCursorPreview()) {
    const m = await import("../dev/local-preview");
    await m.previewDownloadRenderResult();
    return;
  }
  const { token } = await mintDownloadToken(renderJobId);
  const response = await fetch(`${API_BASE}/v1/downloads/${token}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!response.ok) {
    throw new ApiError("DOWNLOAD_FAILED", "Не удалось скачать результат");
  }
  const blob = await response.blob();
  const disposition = response.headers.get("Content-Disposition") ?? "";
  const match = /filename="([^"]+)"/i.exec(disposition);
  const filename = match?.[1] ?? "fadeline-result.bin";
  const objectUrl = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    anchor.rel = "noopener";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
