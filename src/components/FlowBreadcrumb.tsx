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
  return (
    <div className="flow-crumb">
      {trail ? <p className="flow-crumb__trail">{trail}</p> : null}
      <ol className="flow-crumb__steps" aria-label="Этапы">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flow-crumb__step flow-crumb__step--${step.state}`}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            {index > 0 ? (
              <span className="flow-crumb__connector" aria-hidden="true" />
            ) : null}
            <span className="flow-crumb__dot" aria-hidden="true">
              {step.state === "done" ? (
                <svg viewBox="0 0 16 16" width="10" height="10" fill="none">
                  <path
                    d="M3.5 8.2 6.4 11l6.1-6.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
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
