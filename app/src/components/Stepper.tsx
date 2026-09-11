import { useEffect, useState } from 'react';

interface StepperProps {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  /** Unit shown next to the number, e.g. "kg" or "reps". */
  suffix?: string;
}

function roundToStep(n: number, step: number): number {
  // Avoid float drift (0.1 + 0.2 style errors) when stepping by fractional amounts.
  const precision = step < 1 ? String(step).split('.')[1]?.length ?? 2 : 0;
  return Number(n.toFixed(precision));
}

/**
 * Large +/- stepper for numeric entry (sets, reps, weight). The number
 * itself is a real inputMode="decimal" field, so it's directly editable by
 * tapping — not display-only — while the +/- buttons stay big enough to
 * hit one-handed mid-set.
 */
export default function Stepper({
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  label,
  suffix,
}: StepperProps) {
  const [text, setText] = useState(() => String(value));

  // Keep the text in sync when value changes from outside (e.g. reset).
  useEffect(() => {
    setText(String(value));
  }, [value]);

  const clamp = (n: number) => {
    let v = n;
    if (min !== undefined && v < min) v = min;
    if (max !== undefined && v > max) v = max;
    return v;
  };

  const commitText = (raw: string) => {
    const parsed = Number.parseFloat(raw.replace(',', '.'));
    if (Number.isNaN(parsed)) {
      setText(String(value));
      return;
    }
    const clamped = clamp(parsed);
    setText(String(clamped));
    if (clamped !== value) onChange(clamped);
  };

  const bump = (delta: number) => {
    onChange(clamp(roundToStep(value + delta, step)));
  };

  const atMin = min !== undefined && value <= min;
  const atMax = max !== undefined && value >= max;

  const buttonStyle = {
    width: 44,
    height: 44,
    background: 'var(--color-bg-sunken)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
  };

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {label}
        </span>
      )}
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => bump(-step)}
          disabled={atMin}
          aria-label={label ? `Decrease ${label}` : 'Decrease'}
          className="shrink-0 rounded-lg text-2xl font-medium leading-none active:opacity-70 disabled:opacity-30"
          style={buttonStyle}
        >
          −
        </button>

        <div
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg border px-1 py-1"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}
        >
          {/* Suffix (e.g. "kg") sits below the number rather than beside it —
              inline, it competes with the digits for a ~45px-wide box and
              gets squeezed to nothing for any 2+ digit value. */}
          <input
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={(e) => commitText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
            }}
            aria-label={label}
            className="w-full min-w-0 bg-transparent text-center text-xl font-semibold tabular-nums outline-none"
            style={{ color: 'var(--color-text)' }}
          />
          {suffix && (
            <span
              className="shrink-0 text-[10px] font-bold uppercase leading-none tracking-widest"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {suffix}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => bump(step)}
          disabled={atMax}
          aria-label={label ? `Increase ${label}` : 'Increase'}
          className="shrink-0 rounded-lg text-2xl font-medium leading-none active:opacity-70 disabled:opacity-30"
          style={buttonStyle}
        >
          +
        </button>
      </div>
    </div>
  );
}
