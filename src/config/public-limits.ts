/**
 * UX hints only. The API remains authoritative and enforces every limit.
 * Stage 2 will replace duplication with a versioned capabilities endpoint.
 */
export const PUBLIC_LIMITS = {
  maxTracksPerProject: 15,
  maxFileSizeBytes: 150 * 1024 * 1024,
  maxProjectSizeBytes: 600 * 1024 * 1024,
  maxOutputDurationSeconds: 60 * 60,
} as const;
