import { validateClientUploadFilename } from "./file-accept";

export type ProjectUploadType = "MIX" | "SINGLE_EFFECT";

export type PlannedClientUploads =
  | { ok: true; files: File[]; warnings: string[] }
  | { ok: false; message: string };

/**
 * Client-side plan for one picker selection. Server remains authoritative.
 */
export function planClientUploads(options: {
  selected: readonly File[];
  projectType: ProjectUploadType;
  currentTrackCount: number;
  maxTracks: number;
  maxFileBytes?: number;
  currentProjectBytes?: number;
  maxProjectBytes?: number;
  allowedExtensions: readonly string[];
  formatBytes: (bytes: number) => string;
}): PlannedClientUploads {
  const {
    selected,
    projectType,
    currentTrackCount,
    maxTracks,
    maxFileBytes,
    currentProjectBytes = 0,
    maxProjectBytes,
    allowedExtensions,
    formatBytes,
  } = options;

  if (selected.length === 0) {
    return { ok: false, message: "Файлы не выбраны" };
  }

  if (projectType === "SINGLE_EFFECT") {
    if (currentTrackCount >= 1) {
      return {
        ok: false,
        message: "Для проекта с одним эффектом нужен только один файл",
      };
    }
    const file = selected[0]!;
    if (maxFileBytes && file.size > maxFileBytes) {
      return {
        ok: false,
        message: `Файл слишком большой (макс. ${formatBytes(maxFileBytes)})`,
      };
    }
    const check = validateClientUploadFilename(file.name, allowedExtensions);
    if (!check.ok) return check;
    if (
      maxProjectBytes !== undefined &&
      currentProjectBytes + file.size > maxProjectBytes
    ) {
      return {
        ok: false,
        message: `Превышен лимит размера проекта (макс. ${formatBytes(maxProjectBytes)})`,
      };
    }
    const warnings =
      selected.length > 1
        ? ["Для одного эффекта взят только первый файл"]
        : [];
    return { ok: true, files: [file], warnings };
  }

  const remainingSlots = maxTracks - currentTrackCount;
  if (remainingSlots <= 0) {
    return { ok: false, message: `Достигнут лимит: ${maxTracks} треков` };
  }

  const files: File[] = [];
  const warnings: string[] = [];
  let plannedBytes = currentProjectBytes;
  let hitTrackLimit = false;

  for (const file of selected) {
    if (files.length >= remainingSlots) {
      hitTrackLimit = true;
      break;
    }

    if (maxFileBytes && file.size > maxFileBytes) {
      warnings.push(
        `${file.name}: слишком большой (макс. ${formatBytes(maxFileBytes)})`,
      );
      continue;
    }

    const check = validateClientUploadFilename(file.name, allowedExtensions);
    if (!check.ok) {
      warnings.push(`${file.name}: формат не поддерживается`);
      continue;
    }

    if (
      maxProjectBytes !== undefined &&
      plannedBytes + file.size > maxProjectBytes
    ) {
      warnings.push(
        `${file.name}: не влезает в лимит проекта (${formatBytes(maxProjectBytes)})`,
      );
      continue;
    }

    files.push(file);
    plannedBytes += file.size;
  }

  if (hitTrackLimit) {
    warnings.push(
      `Загружаем ${files.length} из ${selected.length}: лимит ${maxTracks} треков`,
    );
  }

  if (files.length === 0) {
    return {
      ok: false,
      message: warnings[0] ?? `Достигнут лимит: ${maxTracks} треков`,
    };
  }

  return { ok: true, files, warnings };
}
