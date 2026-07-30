type ProgressBarProps = {
  value: number;
  label?: string;
};

export function ProgressBar({ value, label }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="progress" role="progressbar" aria-valuenow={clamped} aria-valuemin={0} aria-valuemax={100}>
      {label ? <p className="progress__label">{label}</p> : null}
      <div className="progress__track">
        <div className="progress__fill" style={{ width: `${clamped}%` }} />
      </div>
      <span className="progress__value">{clamped}%</span>
    </div>
  );
}
