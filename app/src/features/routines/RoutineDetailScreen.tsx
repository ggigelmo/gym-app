import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Exercise, RoutineExercise } from '@shared/types';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { useExercises } from '../../db/repo/exercises';
import { deleteRoutine, getRoutine, useRoutine } from '../../db/repo/routines';
import { MUSCLE_GROUP_LABELS } from '../exercises/muscleGroupLabels';

const icons = {
  edit: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
};

function formatTargets(row: RoutineExercise): string {
  const parts = [`${row.targetSets} × ${row.targetReps}`];
  if (row.targetWeight !== undefined) parts.push(`${row.targetWeight} kg`);
  if (row.restSeconds !== undefined) parts.push(`${row.restSeconds}s rest`);
  return parts.join('  ·  ');
}

/**
 * Read-only view of a routine: its exercises in order with target sets,
 * reps, weight and rest, plus actions to edit, delete, or start a session
 * from it. Uses a one-shot existence check (like the exercise form) so a
 * deleted/invalid id shows "not found" instead of spinning forever, while
 * the live `useRoutine` hook keeps the body in sync with edits.
 */
export default function RoutineDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const routine = useRoutine(id);
  const exercises = useExercises();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRoutine(id).then((r) => {
      if (!cancelled && (!r || r.deletedAt != null)) setNotFound(true);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const exercisesById = useMemo(() => {
    const map = new Map<string, Exercise>();
    for (const exercise of exercises ?? []) map.set(exercise.id, exercise);
    return map;
  }, [exercises]);

  const handleDelete = async () => {
    if (!id || !routine) return;
    const confirmed = window.confirm(`Delete "${routine.name}"? This can't be undone.`);
    if (!confirmed) return;
    await deleteRoutine(id);
    navigate('/routines');
  };

  if (notFound) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This routine no longer exists.
        </p>
      </div>
    );
  }

  if (!routine) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    );
  }

  const sortedExercises = [...routine.exercises].sort((a, b) => a.order - b.order);

  return (
    <div className="px-4 py-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
            {routine.name}
          </h1>
          <p
            className="mt-1 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {sortedExercises.length === 1 ? '1 exercise' : `${sortedExercises.length} exercises`}
          </p>
        </div>
        <Link
          to={`/routines/${routine.id}/edit`}
          aria-label="Edit routine"
          className="flex shrink-0 items-center justify-center rounded-lg border active:opacity-70"
          style={{ width: 44, height: 44, borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
        >
          <span className="h-5 w-5">{icons.edit}</span>
        </Link>
      </div>

      {sortedExercises.length === 0 ? (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This routine has no exercises yet.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {sortedExercises.map((row, index) => {
            const exercise = exercisesById.get(row.exerciseId);
            return (
              <Card key={`${row.exerciseId}-${index}`} className="flex items-center gap-3 !py-3">
                <span
                  className="flex shrink-0 items-center justify-center rounded-full text-sm font-semibold"
                  style={{
                    width: 28,
                    height: 28,
                    background: 'var(--color-bg-sunken)',
                    color: 'var(--color-text-muted)',
                  }}
                  aria-hidden="true"
                >
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                    {exercise?.name ?? 'Unknown exercise'}
                  </p>
                  <p className="truncate text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {formatTargets(row)}
                  </p>
                </div>
                {exercise && (
                  <span
                    className="shrink-0 text-xs font-medium"
                    style={{ color: 'var(--color-text-faint)' }}
                  >
                    {MUSCLE_GROUP_LABELS[exercise.muscleGroup]}
                  </span>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <div
        className="mt-6 flex flex-col gap-2"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <PrimaryButton
          type="button"
          variant="primary"
          fullWidth
          onClick={() => navigate(`/train?routineId=${routine.id}`)}
        >
          Start session
        </PrimaryButton>
        <PrimaryButton type="button" variant="danger" fullWidth onClick={() => void handleDelete()}>
          Delete routine
        </PrimaryButton>
      </div>
    </div>
  );
}
