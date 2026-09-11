import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Exercise, LoggedSet } from '@shared/types';
import Card from '../../components/Card';
import { useExercises } from '../../db/repo/exercises';
import { useRoutines } from '../../db/repo/routines';
import { useSessionHistory, useSessionSets } from '../../db/repo/sessions';
import { MUSCLE_GROUP_LABELS } from '../exercises/muscleGroupLabels';
import ExerciseProgress from './ExerciseProgress';
import { formatDateTime, formatDuration } from './formatters';

function formatSet(set: LoggedSet): string {
  const parts = [`${set.reps} reps × ${set.weight} ${set.weightUnit}`];
  if (set.rpe !== undefined) parts.push(`RPE ${set.rpe}`);
  return parts.join('  ·  ');
}

/**
 * Read-only detail view for one completed session: every logged set,
 * grouped by exercise in the order each exercise was first worked, plus an
 * optional per-exercise progress sparkline (max weight across all history).
 * The session itself is looked up from the already-loaded history list
 * rather than a dedicated by-id query, since detail only ever applies to
 * completed sessions that already live in that list.
 */
export default function SessionDetailScreen() {
  const { id } = useParams();
  const sessions = useSessionHistory();
  const sets = useSessionSets(id);
  const exercises = useExercises();
  const routines = useRoutines();
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  const session = sessions?.find((s) => s.id === id);

  const exercisesById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const exercise of exercises ?? []) map.set(exercise.id, exercise);
    return map;
  }, [exercises]);

  const groups = useMemo(() => {
    const map = new Map<string, LoggedSet[]>();
    for (const set of sets ?? []) {
      const list = map.get(set.exerciseId);
      if (list) list.push(set);
      else map.set(set.exerciseId, [set]);
    }
    return Array.from(map.entries());
  }, [sets]);

  const routineName = useMemo(() => {
    if (!session?.routineId) return 'Freestyle';
    return routines?.find((r) => r.id === session.routineId)?.name ?? (routines === undefined ? '…' : 'Routine');
  }, [session, routines]);

  if (sessions === undefined || sets === undefined) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This session no longer exists.
        </p>
      </div>
    );
  }

  const totalSets = sets.length;

  return (
    <div className="px-4 py-4">
      <div className="mb-4">
        <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          {routineName}
        </h1>
        <p
          className="mt-1 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {formatDateTime(session.startedAt)} · {totalSets} {totalSets === 1 ? 'set' : 'sets'}
          {session.completedAt != null
            ? ` · ${formatDuration(session.completedAt - session.startedAt)}`
            : ''}
        </p>
      </div>

      {groups.length === 0 ? (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No sets were logged in this session.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {groups.map(([exerciseId, exerciseSets]) => {
            const exercise = exercisesById.get(exerciseId);
            const isExpanded = expandedExerciseId === exerciseId;
            return (
              <Card key={exerciseId} className="flex flex-col gap-2 !py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                      {exercise?.name ?? 'Unknown exercise'}
                    </p>
                    {exercise && (
                      <p className="text-xs" style={{ color: 'var(--color-text-faint)' }}>
                        {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setExpandedExerciseId(isExpanded ? null : exerciseId)}
                    className="shrink-0 rounded-full px-3 text-[10px] font-black uppercase tracking-widest active:opacity-70"
                    style={{
                      minHeight: 32,
                      color: 'var(--color-accent)',
                      background: 'var(--color-accent-muted)',
                    }}
                  >
                    {isExpanded ? 'Hide progress' : 'Progress'}
                  </button>
                </div>

                <div className="flex flex-col gap-1">
                  {exerciseSets.map((set) => (
                    <div key={set.id} className="flex items-center justify-between text-sm">
                      <span style={{ color: 'var(--color-text-faint)' }}>Set {set.setNumber}</span>
                      <span style={{ color: 'var(--color-text)' }}>{formatSet(set)}</span>
                    </div>
                  ))}
                </div>

                {isExpanded && (
                  <div className="mt-1 border-t pt-2" style={{ borderColor: 'var(--color-border)' }}>
                    <ExerciseProgress exerciseId={exerciseId} />
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
