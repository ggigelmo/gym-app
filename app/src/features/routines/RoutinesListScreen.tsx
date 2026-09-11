import { Link } from 'react-router-dom';
import type { Routine } from '@shared/types';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useRoutines } from '../../db/repo/routines';

const icons = {
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2h6V3M8 10h8M8 14h8M8 18h5" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
};

function exerciseCountLabel(routine: Routine): string {
  const count = routine.exercises.length;
  return count === 1 ? '1 exercise' : `${count} exercises`;
}

/**
 * Routine library: every saved routine as a tappable row (name + exercise
 * count) leading to its detail view. A floating "+" button starts a new one.
 */
export default function RoutinesListScreen() {
  const routines = useRoutines();
  const isLoading = routines === undefined;
  const isEmpty = routines !== undefined && routines.length === 0;

  return (
    <div className="relative min-h-full px-4 py-4">
      <h1 className="mb-4 text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
        Routines
      </h1>

      {isLoading && (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      )}

      {isEmpty && (
        <EmptyState
          icon={icons.clipboard}
          title="No routines yet"
          subtitle="Build a routine to plan out sets, reps and exercises for your workouts."
          action={
            <Link
              to="/routines/new"
              className="inline-flex items-center justify-center rounded-lg px-4 font-semibold active:opacity-70"
              style={{
                minHeight: 44,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-contrast)',
              }}
            >
              Create routine
            </Link>
          }
        />
      )}

      {!isLoading && !isEmpty && (
        <div className="flex flex-col gap-2">
          {routines.map((routine) => (
            <Card
              key={routine.id}
              as={Link}
              to={`/routines/${routine.id}`}
              className="flex items-center gap-4 !py-3"
            >
              <div
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                aria-hidden="true"
              >
                <iconify-icon icon="ph:barbell-fill" className="text-2xl" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>
                  {routine.name}
                </p>
                <p
                  className="truncate text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {exerciseCountLabel(routine)}
                </p>
              </div>
              <span className="h-5 w-5 shrink-0" style={{ color: 'var(--color-text-faint)' }} aria-hidden="true">
                {icons.chevron}
              </span>
            </Card>
          ))}
        </div>
      )}

      {!isEmpty && (
        <Link
          to="/routines/new"
          aria-label="Create routine"
          className="fixed z-30 flex items-center justify-center rounded-full shadow-lg active:opacity-80"
          style={{
            width: 56,
            height: 56,
            right: 16,
            bottom: `calc(64px + 16px + env(safe-area-inset-bottom))`,
            background: 'var(--color-accent)',
            color: 'var(--color-accent-contrast)',
          }}
        >
          <span className="h-6 w-6">{icons.plus}</span>
        </Link>
      )}
    </div>
  );
}
