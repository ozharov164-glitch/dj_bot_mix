/**
 * UX-side file extension helpers. Server remains authoritative.
 */

export function normalizeExtension(filenameOrExt: string): string {
  const base = filenameOrExt.includes("/")
    ? filenameOrExt.split("/").pop() ?? filenameOrExt
    : filenameOrExt;
  const name = base.includes("\\") ? (base.split("\\").pop() ?? base) : base;
  const raw = name.includes(".")
    ? (name.split(".").pop() ?? "")
    : name.replace(/^\./, "");
  return raw.trim().toLowerCase();
}

export function isExtensionAllowed(
  filename: string,
  allowedExtensions: readonly string[],
): boolean {
  const ext = normalizeExtension(filename);
  if (!ext) return false;
  const allowed = allowedExtensions.map((e) =>
    e.replace(/^\./, "").toLowerCase(),
  );
  return allowed.includes(ext);
}

export function buildHtmlAccept(
  allowedExtensions: readonly string[],
): string {
  return allowedExtensions
    .map((e) => `.${e.replace(/^\./, "").toLowerCase()}`)
    .join(",");
}

export function validateClientUploadFilename(
  filename: string,
  allowedExtensions: readonly string[],
): { ok: true } | { ok: false; message: string } {
  if (!isExtensionAllowed(filename, allowedExtensions)) {
    const list = allowedExtensions
      .map((e) => `.${e.replace(/^\./, "").toLowerCase()}`)
      .join(", ");
    return {
      ok: false,
      message: `Формат не поддерживается. Допустимо: ${list}`,
    };
  }
  return { ok: true };
}

/** Prefer server-returned project after upload `{ file, project }`. */
export function projectAfterUploadResponse(response: {
  file: unknown;
  project: unknown;
}): unknown {
  if (
    response &&
    typeof response === "object" &&
    "project" in response &&
    response.project
  ) {
    return response.project;
  }
  throw new Error("Некорректный ответ загрузки");
}
