import type { Project } from "../api/client";

/** Delivered / expired rows are archive noise — remove from list + server. */
export function isStaleProject(project: Project): boolean {
  return project.status === "COMPLETED" || project.status === "EXPIRED";
}

export function partitionActiveProjects(projects: Project[]): {
  mixes: Project[];
  singles: Project[];
} {
  const active = projects.filter((p) => !isStaleProject(p));
  return {
    mixes: active.filter((p) => p.type === "MIX"),
    singles: active.filter((p) => p.type === "SINGLE_EFFECT"),
  };
}
