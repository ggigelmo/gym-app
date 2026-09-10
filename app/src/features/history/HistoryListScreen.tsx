import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import type { WorkoutSession } from '@shared/types';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useRoutines } from '../../db/repo/routines';
import { useSessionHistory, useSessionSets } from '../../db/repo/sessions';
import { formatDateTime } from './formatters';

const icons = {
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v6h6" />
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
};

/**
 * One history row. Pulls its own set count via useSessionSets so the list
 * screen doesn't have to fetch every session's sets up front — each row
 * resolves independently as its live query settles.
 */
function HistorySessionRow({ session, routineName }: { session: WorkoutSession; routineName: string }) {
  const sets = useSessionSets(session.id);
  const exerciseCount = useMemo(() => {
    if (!sets) return undefined;
    return new Set(sets.map((s) => s.exerciseId)).size;
  }, [sets]);

  const countsLabel =
    sets === undefined
      ? 'Loading…'
      : `${sets.length} ${sets.length === 1 ? 'set' : 'sets'} · ${exerciseCount} ${exerciseCount === 1 ? 'exercise' : 'exercises'}`;

  return (
    <Card as={Link} to={`/history/${session.id}`} className="flex items-center justify-between gap-3 !py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
          {routineName}
        </p>
        <p className="truncate text-sm" style={{ color: 'var(--color-text-muted)' }}>
          {formatDateTime(session.startedAt)}
        </p>
        <p className="truncate text-sm" style={{ color: 'var(--color-text-faint)' }}>
          {countsLabel}
        </p>
      </div>
      <span className="h-5 w-5 shrink-0" style={{ color: 'var(--color-text-faint)' }} aria-hidden="true">
        {icons.chevron}
      </span>
    </Card>
  );
}

/**
 * Past completed sessions, most-recent-first. Each row shows the date,
 * routine name (or "Freestyle" for routine-less sessions) and a set/exercise
 * count, and leads to the read-only session detail view.
 */
export default function HistoryListScreen() {
  const sessions = useSessionHistory();
  const routines = useRoutines();
  const isLoading = sessions === undefined;
  const isEmpty = sessions !== undefined && sessions.length === 0;

  const routineNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const routine of routines ?? []) map.set(routine.id, routine.name);
    return map;
  }, [routines]);

  const routineName = (session: WorkoutSession): string => {
    if (!session.routineId) return 'Freestyle';
    return routineNameById.get(session.routineId) ?? (routines === undefined ? '…' : 'Routine');
  };

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        History
      </h1>

      {isLoading && (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      )}

      {isEmpty && (
        <EmptyState
          icon={icons.history}
          title="No workouts yet"
          subtitle="Finish a training session and it'll show up here."
          action={
            <Link
              to="/train"
              className="inline-flex items-center justify-center rounded-lg px-4 font-semibold active:opacity-70"
              style={{
                minHeight: 44,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-contrast)',
              }}
            >
              Start training
            </Link>
          }
        />
      )}

      {!isLoading && !isEmpty && (
        <div className="flex flex-col gap-2">
          {sessions.map((session) => (
            <HistorySessionRow key={session.id} session={session} routineName={routineName(session)} />
          ))}
        </div>
      )}
    </div>
  );
}
