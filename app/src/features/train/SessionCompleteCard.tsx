import { useNavigate } from 'react-router-dom';
import PrimaryButton from '../../components/PrimaryButton';
import type { SessionSummary } from './types';

function formatDuration(ms: number): string {
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
}

interface SessionCompleteCardProps {
  summary: SessionSummary;
  /** Clears the "just finished" state so /train falls through to the normal start screen. */
  onDismiss: () => void;
}

/**
 * Shown right after "Finish Session" instead of navigating away, so the win
 * (sets logged, time spent) is visible for a moment before returning to the
 * start screen or jumping to History.
 */
export default function SessionCompleteCard({ summary, onDismiss }: SessionCompleteCardProps) {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-8 w-8"
        >
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </span>

      <div>
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Session complete!
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {summary.totalSets} {summary.totalSets === 1 ? 'set' : 'sets'} logged · {formatDuration(summary.durationMs)}
        </p>
      </div>

      <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
        <PrimaryButton
          fullWidth
          onClick={() => {
            onDismiss();
            navigate('/history');
          }}
        >
          View History
        </PrimaryButton>
        <PrimaryButton variant="secondary" fullWidth onClick={onDismiss}>
          Back to Train
        </PrimaryButton>
      </div>
    </div>
  );
}
