import { ApiError } from "./client-types";
import type {
  ApiErrorBody,
  AudioFile,
  AuthResponse,
  Capabilities,
  ConsentState,
  MeResponse,
  OutputFormat,
  Project,
  SingleEffect,
  TransitionStyle,
  UploadProjectFileResponse,
} from "./client-types";

export type {
  ApiErrorBody,
  AudioFile,
  AuthResponse,
  Capabilities,
  ConsentState,
  MeResponse,
  Project,
  UploadProjectFileResponse,
  User,
} from "./client-types";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

function fail(message: string): never {
  throw new ApiError("PARSE_ERROR", message);
}

export function parseApiErrorBody(value: unknown): ApiErrorBody | null {
  if (!isRecord(value)) return null;
  const error = value.error;
  if (!isRecord(error)) return null;
  const code = asString(error.code);
  const message = asString(error.message);
  if (!code || !message) return null;
  const requestId = asString(error.requestId) ?? undefined;
  return {
    error: {
      code,
      message,
      ...(requestId !== undefined ? { requestId } : {}),
    },
  };
}

export function parseAuthResponse(value: unknown): AuthResponse {
  if (!isRecord(value)) fail("Некорректный ответ авторизации");
  const token = asString(value.token);
  const tokenType = asString(value.tokenType);
  const expiresIn = asNumber(value.expiresIn);
  const expiresAt = asString(value.expiresAt);
  const user = value.user;
  if (
    !token ||
    tokenType !== "Bearer" ||
    expiresIn === null ||
    !expiresAt ||
    !isRecord(user)
  ) {
    fail("Некорректный ответ авторизации");
  }
  const id = asString(user.id);
  if (!id) fail("Некорректный ответ авторизации");
  const username = user.username === null ? null : asString(user.username);
  if (user.username !== null && username === null) {
    fail("Некорректный ответ авторизации");
  }
  return {
    token,
    tokenType: "Bearer",
    expiresIn,
    expiresAt,
    user: { id, username: username ?? null },
  };
}

export function parseCapabilities(value: unknown): Capabilities {
  if (!isRecord(value)) fail("Некорректный ответ capabilities");
  const limits = value.limits;
  if (!isRecord(limits)) fail("Некорректный ответ capabilities");
  const allowed = limits.allowedInputExtensions;
  if (!Array.isArray(allowed) || !allowed.every((x) => typeof x === "string")) {
    fail("Некорректный ответ capabilities");
  }
  const effects = value.effects;
  const transitionStyles = value.transitionStyles;
  const outputFormats = value.outputFormats;
  const features = value.features;
  if (
    !Array.isArray(effects) ||
    !Array.isArray(transitionStyles) ||
    !Array.isArray(outputFormats) ||
    !isRecord(features)
  ) {
    fail("Некорректный ответ capabilities");
  }
  const policyVersion = asString(value.policyVersion);
  const stage = asNumber(value.stage);
  if (!policyVersion || stage === null) fail("Некорректный ответ capabilities");

  const maxTracksPerProject = asNumber(limits.maxTracksPerProject);
  const maxFileSizeBytes = asNumber(limits.maxFileSizeBytes);
  const maxProjectSizeBytes = asNumber(limits.maxProjectSizeBytes);
  const maxOutputDurationSeconds = asNumber(limits.maxOutputDurationSeconds);
  const originalRetentionHours = asNumber(limits.originalRetentionHours);
  if (
    maxTracksPerProject === null ||
    maxFileSizeBytes === null ||
    maxProjectSizeBytes === null ||
    maxOutputDurationSeconds === null ||
    originalRetentionHours === null
  ) {
    fail("Некорректный ответ capabilities");
  }

  const render = asBoolean(features.render);
  const payments = asBoolean(features.payments);
  if (render === null || payments === null) {
    fail("Некорректный ответ capabilities");
  }

  if (
    !effects.every((x) => typeof x === "string") ||
    !transitionStyles.every((x) => typeof x === "string") ||
    !outputFormats.every((x) => typeof x === "string")
  ) {
    fail("Некорректный ответ capabilities");
  }

  return {
    stage,
    limits: {
      maxTracksPerProject,
      maxFileSizeBytes,
      maxProjectSizeBytes,
      maxOutputDurationSeconds,
      originalRetentionHours,
      allowedInputExtensions: allowed as string[],
    },
    effects: effects as SingleEffect[],
    transitionStyles: transitionStyles as TransitionStyle[],
    outputFormats: outputFormats as OutputFormat[],
    policyVersion,
    features: { render, payments },
  };
}

function parseAudioFile(value: unknown): AudioFile {
  if (!isRecord(value)) fail("Некорректный файл в ответе");
  const id = asString(value.id);
  const originalFilename = asString(value.originalFilename);
  const mimeType = asString(value.mimeType);
  const sizeBytes = asNumber(value.sizeBytes);
  const position = asNumber(value.position);
  const status = asString(value.status);
  const expiresAt = asString(value.expiresAt);
  const createdAt = asString(value.createdAt);
  if (
    !id ||
    !originalFilename ||
    !mimeType ||
    sizeBytes === null ||
    position === null ||
    !status ||
    !expiresAt ||
    !createdAt
  ) {
    fail("Некорректный файл в ответе");
  }
  const durationSeconds =
    value.durationSeconds === null
      ? null
      : asNumber(value.durationSeconds);
  if (value.durationSeconds !== null && durationSeconds === null) {
    fail("Некорректный файл в ответе");
  }
  return {
    id,
    originalFilename,
    mimeType,
    sizeBytes,
    durationSeconds,
    position,
    status: status as AudioFile["status"],
    expiresAt,
    createdAt,
  };
}

export function parseProject(value: unknown): Project {
  if (!isRecord(value)) fail("Некорректный ответ проекта");
  const id = asString(value.id);
  const title = asString(value.title);
  const type = asString(value.type);
  const status = asString(value.status);
  const transitionStyle = asString(value.transitionStyle);
  const outputFormat = asString(value.outputFormat);
  const createdAt = asString(value.createdAt);
  const updatedAt = asString(value.updatedAt);
  if (
    !id ||
    !title ||
    !type ||
    !status ||
    !transitionStyle ||
    !outputFormat ||
    !createdAt ||
    !updatedAt ||
    !Array.isArray(value.files)
  ) {
    fail("Некорректный ответ проекта");
  }
  const singleEffect =
    value.singleEffect === null ? null : asString(value.singleEffect);
  if (value.singleEffect !== null && singleEffect === null) {
    fail("Некорректный ответ проекта");
  }
  return {
    id,
    title,
    type: type as Project["type"],
    status: status as Project["status"],
    transitionStyle: transitionStyle as Project["transitionStyle"],
    outputFormat: outputFormat as Project["outputFormat"],
    singleEffect: singleEffect as Project["singleEffect"],
    createdAt,
    updatedAt,
    files: value.files.map(parseAudioFile),
  };
}

export function parseUploadResponse(value: unknown): UploadProjectFileResponse {
  if (!isRecord(value)) fail("Некорректный ответ загрузки");
  const file = parseAudioFile(value.file);
  const project = parseProject(value.project);
  return { file, project };
}

export function parseConsentState(value: unknown): ConsentState {
  if (!isRecord(value)) fail("Некорректный ответ согласия");
  const policyVersion = asString(value.policyVersion);
  const accepted = asBoolean(value.accepted);
  if (!policyVersion || accepted === null) fail("Некорректный ответ согласия");
  if (!accepted) {
    return { policyVersion, accepted: false, consent: null };
  }
  if (!isRecord(value.consent)) fail("Некорректный ответ согласия");
  const id = asString(value.consent.id);
  const pv = asString(value.consent.policyVersion);
  const createdAt = asString(value.consent.createdAt);
  if (!id || !pv || !createdAt) fail("Некорректный ответ согласия");
  return {
    policyVersion,
    accepted: true,
    consent: {
      id,
      policyVersion: pv,
      privacyAcceptedAt:
        value.consent.privacyAcceptedAt === null
          ? null
          : asString(value.consent.privacyAcceptedAt),
      termsAcceptedAt:
        value.consent.termsAcceptedAt === null
          ? null
          : asString(value.consent.termsAcceptedAt),
      rightsConfirmedAt:
        value.consent.rightsConfirmedAt === null
          ? null
          : asString(value.consent.rightsConfirmedAt),
      createdAt,
    },
  };
}

export function parseMeResponse(value: unknown): MeResponse {
  if (!isRecord(value)) fail("Некорректный ответ профиля");
  const id = asString(value.id);
  const policyVersion = asString(value.policyVersion);
  if (!id || !policyVersion) fail("Некорректный ответ профиля");
  const username = value.username === null ? null : asString(value.username);
  if (value.username !== null && username === null) {
    fail("Некорректный ответ профиля");
  }
  return {
    id,
    username: username ?? null,
    policyVersion,
    consent: parseConsentState(value.consent),
  };
}
