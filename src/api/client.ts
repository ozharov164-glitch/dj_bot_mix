const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

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
  };
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
  return apiFetch<MeResponse>("/v1/me");
}

export function fetchCapabilities(): Promise<Capabilities> {
  return apiFetch<Capabilities>("/v1/capabilities");
}

export function fetchCurrentConsent(): Promise<ConsentState> {
  return apiFetch<ConsentState>("/v1/consents/current");
}

export function submitConsent(): Promise<ConsentState> {
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
  return apiFetch<ProjectsListResponse>("/v1/projects");
}

export function getProject(projectId: string): Promise<Project> {
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
  return apiFetch<Project>(`/v1/projects/${projectId}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteProject(projectId: string): Promise<void> {
  return apiFetch<void>(`/v1/projects/${projectId}`, {
    method: "DELETE",
  });
}

export function reorderProjectFiles(
  projectId: string,
  fileIds: string[],
): Promise<Project> {
  return apiFetch<Project>(`/v1/projects/${projectId}/reorder`, {
    method: "POST",
    body: JSON.stringify({ fileIds }),
  });
}

export function deleteProjectFile(
  projectId: string,
  fileId: string,
): Promise<void> {
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
