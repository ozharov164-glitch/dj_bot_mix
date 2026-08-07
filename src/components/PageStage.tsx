import type { ReactNode } from "react";

export type NavDirection = "forward" | "back" | "none";

type PageStageProps = {
  routeKey: string;
  direction: NavDirection;
  children: ReactNode;
};

/** Remounts on route change so enter animation restarts with direction. */
export function PageStage({ routeKey, direction, children }: PageStageProps) {
  return (
    <div
      key={routeKey}
      className={`page-stage page-stage--${direction}`}
      data-testid="page-stage"
    >
      {children}
    </div>
  );
}
