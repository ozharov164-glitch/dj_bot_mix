/**
 * Resolve and validate public API origin for Vite builds and runtime.
 * VITE_API_URL is a public build-time variable (not a secret).
 */

const BLOCKED_EXAMPLE_ROOTS = new Set([
  "example.com",
  "example.org",
  "example.net",
]);

export type ResolveApiBaseUrlOptions = {
  raw: string | undefined;
  /** Vite mode: development | production | test */
  mode: string;
  /**
   * When true, production builds may use localhost for CI verification only.
   * Must never be set for a Pages production artifact.
   */
  allowDevApi?: boolean;
};

export class ApiUrlConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiUrlConfigError";
  }
}

function isBlockedExampleHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  for (const root of BLOCKED_EXAMPLE_ROOTS) {
    if (host === root || host.endsWith(`.${root}`)) {
      return true;
    }
  }
  return false;
}

function isLoopbackHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "[::1]";
}

/**
 * Fail-closed validator for production / Pages builds.
 */
export function assertProductionApiUrl(raw: string | undefined): string {
  if (raw === undefined || raw.trim() === "") {
    throw new ApiUrlConfigError(
      "VITE_API_URL is required for production builds (HTTPS public API origin)",
    );
  }

  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ApiUrlConfigError("VITE_API_URL must be a valid absolute URL");
  }

  if (url.protocol !== "https:") {
    throw new ApiUrlConfigError("VITE_API_URL must use https: in production");
  }

  if (isLoopbackHost(url.hostname)) {
    throw new ApiUrlConfigError(
      "VITE_API_URL must not point to localhost in production",
    );
  }

  if (isBlockedExampleHost(url.hostname)) {
    throw new ApiUrlConfigError(
      "VITE_API_URL must not use example.com / example.org / example.net placeholders",
    );
  }

  // Origin only — no path/query leakage into API client base
  return url.origin;
}

/**
 * Development: default localhost.
 * Production: require valid HTTPS URL unless allowDevApi (CI only).
 */
export function resolveApiBaseUrl(options: ResolveApiBaseUrlOptions): string {
  const { raw, mode, allowDevApi = false } = options;
  const isProd = mode === "production";

  if (!isProd || allowDevApi) {
    const fallback = "http://localhost:3000";
    const candidate = (raw ?? "").trim() || fallback;
    try {
      const url = new URL(candidate);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        throw new ApiUrlConfigError("VITE_API_URL must be http(s)");
      }
      return url.origin;
    } catch (err) {
      if (err instanceof ApiUrlConfigError) throw err;
      throw new ApiUrlConfigError("VITE_API_URL must be a valid absolute URL");
    }
  }

  return assertProductionApiUrl(raw);
}

/** True when vars look like a deployable production API. */
export function isDeployableProductionApiUrl(raw: string | undefined): boolean {
  try {
    assertProductionApiUrl(raw);
    return true;
  } catch {
    return false;
  }
}
