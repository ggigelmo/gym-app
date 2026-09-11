import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise, MuscleGroup } from '@shared/types';
import { MUSCLE_GROUPS } from '@shared/types';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { deleteExercise, useExercises } from '../../db/repo/exercises';
import { MUSCLE_GROUP_LABELS } from './muscleGroupLabels';

type FilterValue = 'all' | MuscleGroup;

const icons = {
  dumbbell: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5v11M17.5 6.5v11M2 9.5v5M22 9.5v5M6.5 12h11" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  more: (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.75" />
      <circle cx="12" cy="12" r="1.75" />
      <circle cx="19" cy="12" r="1.75" />
    </svg>
  ),
};

/**
 * Exercise library: list of all exercises, filterable by muscle group and
 * grouped into sections. Tapping a row opens it for editing; the overflow
 * "..." button deletes it (with confirmation). A floating "+" button adds a
 * new exercise.
 */
export default function ExercisesListScreen() {
  const exercises = useExercises();
  const [filter, setFilter] = useState<FilterValue>('all');

  const groups = useMemo(() => {
    if (!exercises) return [];
    const visible =
      filter === 'all' ? exercises : exercises.filter((e) => e.muscleGroup === filter);

    const byGroup = new Map<MuscleGroup, Exercise[]>();
    for (const exercise of visible) {
      const list = byGroup.get(exercise.muscleGroup);
      if (list) list.push(exercise);
      else byGroup.set(exercise.muscleGroup, [exercise]);
    }

    return MUSCLE_GROUPS.filter((mg) => byGroup.has(mg)).map((mg) => ({
      muscleGroup: mg,
      exercises: byGroup.get(mg)!,
    }));
  }, [exercises, filter]);

  const handleDelete = async (exercise: Exercise) => {
    const confirmed = window.confirm(`Delete "${exercise.name}"? This can't be undone.`);
    if (!confirmed) return;
    await deleteExercise(exercise.id);
  };

  const isLoading = exercises === undefined;
  const isEmpty = exercises !== undefined && exercises.length === 0;

  return (
    <div className="relative min-h-full px-4 py-4">
      <h1 className="mb-3 text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
        Exercises
      </h1>

      {!isEmpty && (
        <div
          className="mb-4 flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: 'none' }}
          role="tablist"
          aria-label="Filter by muscle group"
        >
          <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterChip>
          {MUSCLE_GROUPS.map((mg) => (
            <FilterChip key={mg} active={filter === mg} onClick={() => setFilter(mg)}>
              {MUSCLE_GROUP_LABELS[mg]}
            </FilterChip>
          ))}
        </div>
      )}

      {isLoading && (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      )}

      {isEmpty && (
        <EmptyState
          icon={icons.dumbbell}
          title="No exercises yet"
          subtitle="Add your first exercise to start building routines."
          action={
            <Link
              to="/exercises/new"
              className="inline-flex items-center justify-center rounded-lg px-4 font-semibold active:opacity-70"
              style={{
                minHeight: 44,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-contrast)',
              }}
            >
              Add exercise
            </Link>
          }
        />
      )}

      {!isLoading && !isEmpty && groups.length === 0 && (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          No exercises in this muscle group.
        </p>
      )}

      <div className="flex flex-col gap-5">
        {groups.map((group) => (
          <section key={group.muscleGroup}>
            <h2
              className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide"
              style={{ color: 'var(--color-text-faint)' }}
            >
              {MUSCLE_GROUP_LABELS[group.muscleGroup]}
            </h2>
            <div className="flex flex-col gap-2">
              {group.exercises.map((exercise) => (
                <Card
                  key={exercise.id}
                  as={Link}
                  to={`/exercises/${exercise.id}/edit`}
                  className="flex items-center justify-between gap-3 !py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                      {exercise.name}
                    </p>
                    {exercise.notes && (
                      <p className="truncate text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {exercise.notes}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    aria-label={`More options for ${exercise.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      void handleDelete(exercise);
                    }}
                    className="flex shrink-0 items-center justify-center rounded-full active:opacity-60"
                    style={{ width: 44, height: 44, color: 'var(--color-text-faint)' }}
                  >
                    <span className="h-5 w-5">{icons.more}</span>
                  </button>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!isEmpty && (
        <Link
          to="/exercises/new"
          aria-label="Add exercise"
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

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className="shrink-0 rounded-full px-4 text-[10px] font-bold uppercase tracking-widest active:opacity-70"
      style={{
        minHeight: 36,
        background: active ? 'var(--color-accent)' : 'var(--color-bg-elevated)',
        color: active ? 'var(--color-accent-contrast)' : 'var(--color-text)',
        boxShadow: active ? '0 8px 20px -6px rgba(255, 90, 60, 0.4)' : '0 4px 20px rgb(0, 0, 0, 0.03)',
        border: 'none',
      }}
    >
      {children}
    </button>
  );
}
