import { useMemo, useState } from 'react';
import type { Exercise, MuscleGroup } from '@shared/types';
import { MUSCLE_GROUPS } from '@shared/types';
import { useExercises } from '../../db/repo/exercises';
import { MUSCLE_GROUP_LABELS } from '../exercises/muscleGroupLabels';

interface ExercisePickerSheetProps {
  /** Exercise ids already in the routine — hidden from the list so nothing gets added twice. */
  excludeIds: string[];
  onSelect: (exercise: Exercise) => void;
  onClose: () => void;
}

/**
 * Full-screen overlay for adding an exercise to a routine. Lists the
 * exercise library (from the existing exercises repo) grouped by muscle
 * group, filtered by a search box and by exercises already selected.
 */
export default function ExercisePickerSheet({ excludeIds, onSelect, onClose }: ExercisePickerSheetProps) {
  const exercises = useExercises();
  const [query, setQuery] = useState('');

  const groups = useMemo(() => {
    if (!exercises) return [];
    const excluded = new Set(excludeIds);
    const q = query.trim().toLowerCase();
    const visible = exercises.filter(
      (e) => !excluded.has(e.id) && (q === '' || e.name.toLowerCase().includes(q)),
    );

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
  }, [exercises, excludeIds, query]);

  const isLoading = exercises === undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'var(--color-bg)' }}
      role="dialog"
      aria-modal="true"
      aria-label="Add exercise"
    >
      <div
        className="flex items-center gap-3 border-b px-4 py-3"
        style={{ borderColor: 'var(--color-border)', paddingTop: 'env(safe-area-inset-top)' }}
      >
        <h2 className="flex-1 text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
          Add exercise
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex shrink-0 items-center justify-center rounded-full active:opacity-60"
          style={{ width: 44, height: 44, color: 'var(--color-text-muted)' }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-6 w-6">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      </div>

      <div className="px-4 py-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exercises"
          autoFocus
          className="w-full rounded-lg border px-3 text-[16px] outline-none"
          style={{
            minHeight: 44,
            background: 'var(--color-bg-elevated)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text)',
          }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-4 pb-6">
        {isLoading && (
          <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Loading…
          </p>
        )}

        {!isLoading && groups.length === 0 && (
          <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {exercises && exercises.length === 0
              ? 'No exercises yet — add some from the Exercises tab first.'
              : 'No matching exercises.'}
          </p>
        )}

        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.muscleGroup}>
              <h3
                className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide"
                style={{ color: 'var(--color-text-faint)' }}
              >
                {MUSCLE_GROUP_LABELS[group.muscleGroup]}
              </h3>
              <div className="flex flex-col gap-2">
                {group.exercises.map((exercise) => (
                  <button
                    key={exercise.id}
                    type="button"
                    onClick={() => onSelect(exercise)}
                    className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left active:opacity-70"
                    style={{
                      minHeight: 44,
                      background: 'var(--color-bg-elevated)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <span className="text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                      {exercise.name}
                    </span>
                    <span className="h-5 w-5 shrink-0" style={{ color: 'var(--color-accent)' }} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
