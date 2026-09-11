interface ProgressBarProps {
  /** 0-100. Caller clamps/derives this — the bar itself just renders it. */
  value: number;
}

/** Thin rounded track + fill, used by the goal cards on the Profile screen. */
export default function ProgressBar({ value }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className="h-1.5 w-full overflow-hidden rounded-full"
      style={{ background: 'var(--color-bg-sunken)' }}
    >
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, background: 'var(--color-accent)' }}
      />
    </div>
  );
}
