import { resolveApiBaseUrl } from "../config/api-url";
import {
  ApiError,
  type ApiErrorBody,
  type AuthResponse,
  type Capabilities,
  type ConsentState,
  type CreateProjectBody,
  type MeResponse,
  type PatchProjectBody,
  type Project,
  type ProjectsListResponse,
  type UploadProjectFileResponse,
} from "./client-types";
import {
  parseApiErrorBody,
  parseAuthResponse,
  parseCapabilities,
  parseConsentState,
  parseMeResponse,
  parseProject,
  parseUploadResponse,
} from "./parsers";

export * from "./client-types";

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

export function getApiBaseUrl(): string {
  return API_BASE;
}

async function parseJsonUnknown(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return undefined;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ApiError("PARSE_ERROR", "Некорректный JSON от сервера");
  }
}

async function handleResponse<T>(
  response: Response,
  parse: (value: unknown) => T,
): Promise<T> {
  if (response.ok) {
    if (response.status === 204) {
      return undefined as T;
    }
    const body = await parseJsonUnknown(response);
    try {
      return parse(body);
    } catch (err) {
      if (err instanceof ApiError) throw err;
      throw new ApiError("PARSE_ERROR", "Некорректный ответ сервера");
    }
  }

  let parsedError: ApiErrorBody | null = null;
  try {
    const body = await parseJsonUnknown(response);
    parsedError = parseApiErrorBody(body);
  } catch {
    // Malformed error JSON must not throw a secondary exception
    parsedError = null;
  }

  throw new ApiError(
    parsedError?.error.code ?? "UNKNOWN",
    parsedError?.error.message ?? "Произошла ошибка",
    parsedError?.error.requestId,
  );
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  parse: (value: unknown) => T = (v) => v as T,
): Promise<T> {
  const headers = new Headers(init.headers);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (bearerToken) {
    headers.set("Authorization", `Bearer ${bearerToken}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
  });

  return handleResponse(response, parse);
}

export function authTelegram(initData: string): Promise<AuthResponse> {
  return apiFetch(
    "/v1/auth/telegram",
    {
      method: "POST",
      body: JSON.stringify({ initData }),
    },
    parseAuthResponse,
  );
}

export function fetchMe(): Promise<MeResponse> {
  return apiFetch("/v1/me", {}, parseMeResponse);
}

export function fetchCapabilities(): Promise<Capabilities> {
  return apiFetch("/v1/capabilities", {}, parseCapabilities);
}

export function fetchCurrentConsent(): Promise<ConsentState> {
  return apiFetch("/v1/consents/current", {}, parseConsentState);
}

export function submitConsent(): Promise<ConsentState> {
  return apiFetch(
    "/v1/consents",
    {
      method: "POST",
      body: JSON.stringify({
        privacyAccepted: true,
        termsAccepted: true,
        rightsConfirmed: true,
      }),
    },
    parseConsentState,
  );
}

export function listProjects(): Promise<ProjectsListResponse> {
  return apiFetch("/v1/projects", {}, (value) => {
    if (typeof value !== "object" || value === null) {
      throw new ApiError("PARSE_ERROR", "Некорректный список проектов");
    }
    const record = value as Record<string, unknown>;
    if (!Array.isArray(record.items)) {
      throw new ApiError("PARSE_ERROR", "Некорректный список проектов");
    }
    let nextCursor: string | null = null;
    if (record.nextCursor === null || record.nextCursor === undefined) {
      nextCursor = null;
    } else if (typeof record.nextCursor === "string") {
      nextCursor = record.nextCursor;
    } else {
      throw new ApiError("PARSE_ERROR", "Некорректный список проектов");
    }
    return {
      items: record.items.map(parseProject),
      nextCursor,
    };
  });
}

export function getProject(projectId: string): Promise<Project> {
  return apiFetch(`/v1/projects/${projectId}`, {}, parseProject);
}

export function createProject(body: CreateProjectBody): Promise<Project> {
  return apiFetch(
    "/v1/projects",
    {
      method: "POST",
      body: JSON.stringify(body),
    },
    parseProject,
  );
}

export function patchProject(
  projectId: string,
  body: PatchProjectBody,
): Promise<Project> {
  return apiFetch(
    `/v1/projects/${projectId}`,
    {
      method: "PATCH",
      body: JSON.stringify(body),
    },
    parseProject,
  );
}

export function deleteProject(projectId: string): Promise<void> {
  return apiFetch(`/v1/projects/${projectId}`, { method: "DELETE" }, () => undefined);
}

export function reorderProjectFiles(
  projectId: string,
  fileIds: string[],
): Promise<Project> {
  return apiFetch(
    `/v1/projects/${projectId}/reorder`,
    {
      method: "POST",
      body: JSON.stringify({ fileIds }),
    },
    parseProject,
  );
}

export function deleteProjectFile(
  projectId: string,
  fileId: string,
): Promise<void> {
  return apiFetch(
    `/v1/projects/${projectId}/files/${fileId}`,
    { method: "DELETE" },
    () => undefined,
  );
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
      let raw: unknown;
      try {
        raw = xhr.responseText ? JSON.parse(xhr.responseText) : undefined;
      } catch {
        reject(new ApiError("PARSE_ERROR", "Некорректный JSON от сервера"));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(parseUploadResponse(raw));
        } catch (err) {
          if (err instanceof ApiError) {
            reject(err);
          } else {
            reject(new ApiError("PARSE_ERROR", "Некорректный ответ загрузки"));
          }
        }
        return;
      }

      const parsedError = parseApiErrorBody(raw);
      reject(
        new ApiError(
          parsedError?.error.code ?? "UNKNOWN",
          parsedError?.error.message ?? "Ошибка загрузки файла",
          parsedError?.error.requestId,
        ),
      );
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
