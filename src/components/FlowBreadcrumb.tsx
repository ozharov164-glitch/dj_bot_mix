import type { CSSProperties } from "react";
import { IconCheck } from "./icons";

type FlowStep = {
  id: string;
  label: string;
  state: "done" | "current" | "upcoming";
};

type FlowBreadcrumbProps = {
  steps: FlowStep[];
  /** Compact trail above the title, e.g. «Проекты → Новый» */
  trail?: string;
};

/** Visual route orientation for multi-step create / project flows. */
export function FlowBreadcrumb({ steps, trail }: FlowBreadcrumbProps) {
  const doneCount = steps.filter((s) => s.state === "done").length;
  const progress =
    steps.length <= 1 ? 0 : Math.min(1, doneCount / (steps.length - 1));

  return (
    <div className="flow-crumb">
      {trail ? <p className="flow-crumb__trail">{trail}</p> : null}
      <ol
        className="flow-crumb__steps"
        aria-label="Этапы"
        style={
          {
            "--flow-progress": String(progress),
            "--flow-cols": String(Math.max(steps.length, 1)),
          } as CSSProperties
        }
      >
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flow-crumb__step flow-crumb__step--${step.state}`}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="flow-crumb__dot" aria-hidden="true">
              {step.state === "done" ? (
                <IconCheck size={12} className="flow-crumb__check" />
              ) : (
                <span className="flow-crumb__n">{index + 1}</span>
              )}
            </span>
            <span className="flow-crumb__label">{step.label}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
