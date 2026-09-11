import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Exercise, RoutineExercise } from '@shared/types';
import PrimaryButton from '../../components/PrimaryButton';
import Stepper from '../../components/Stepper';
import { useExercises } from '../../db/repo/exercises';
import { createRoutine, deleteRoutine, getRoutine, updateRoutine } from '../../db/repo/routines';
import { MUSCLE_GROUP_LABELS } from '../exercises/muscleGroupLabels';
import ExercisePickerSheet from './ExercisePickerSheet';

type LoadStatus = 'loading' | 'ready' | 'not-found';

const icons = {
  up: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 15l7-7 7 7" />
    </svg>
  ),
  down: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 9l7 7 7-7" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1a2 2 0 0 1-2 1.9H9.7a2 2 0 0 1-2-1.9L7 7" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
};

/**
 * Create/edit form for a routine. Handles both `/routines/new` (blank) and
 * `/routines/:id/edit` (fetches the routine once on mount and pre-fills).
 * The exercise list is edited in place: add via the picker sheet, reorder
 * with up/down buttons, tweak target sets/reps/weight/rest per row, remove
 * with the trash button.
 */
export default function RoutineEditorScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);
  const exercises = useExercises();

  const [name, setName] = useState('');
  const [rows, setRows] = useState<RoutineExercise[]>([]);
  const [existingName, setExistingName] = useState('');
  const [status, setStatus] = useState<LoadStatus>(isEditing ? 'loading' : 'ready');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getRoutine(id).then((routine) => {
      if (cancelled) return;
      if (!routine || routine.deletedAt != null) {
        setStatus('not-found');
        return;
      }
      setName(routine.name);
      setRows([...routine.exercises].sort((a, b) => a.order - b.order));
      setExistingName(routine.name);
      setStatus('ready');
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

  const selectedIds = useMemo(() => rows.map((r) => r.exerciseId), [rows]);

  const updateRow = (index: number, patch: Partial<RoutineExercise>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  };

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  const moveRow = (index: number, direction: -1 | 1) => {
    setRows((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const handleAddExercise = (exercise: Exercise) => {
    setRows((prev) => [
      ...prev,
      {
        exerciseId: exercise.id,
        order: prev.length,
        targetSets: 3,
        targetReps: 10,
      },
    ]);
    setPickerOpen(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    const orderedExercises = rows.map((row, index) => ({ ...row, order: index }));
    try {
      if (isEditing && id) {
        await updateRoutine(id, { name: trimmedName, exercises: orderedExercises });
        navigate(`/routines/${id}`);
      } else {
        const routine = await createRoutine({ name: trimmedName, exercises: orderedExercises });
        navigate(`/routines/${routine.id}`);
      }
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm(`Delete "${existingName || 'this routine'}"? This can't be undone.`);
    if (!confirmed) return;
    await deleteRoutine(id);
    navigate('/routines');
  };

  if (status === 'loading') {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    );
  }

  if (status === 'not-found') {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This routine no longer exists.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
        {isEditing ? 'Edit routine' : 'New routine'}
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Name
          </span>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Push Day"
            autoFocus={!isEditing}
            className="rounded-lg border px-3 text-[16px] outline-none"
            style={{
              minHeight: 44,
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
              Exercises
            </span>
            <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
              {rows.length === 1 ? '1 exercise' : `${rows.length} exercises`}
            </span>
          </div>

          {rows.length === 0 && (
            <div
              className="rounded-xl border border-dashed px-4 py-6 text-center text-sm"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
            >
              No exercises added yet.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {rows.map((row, index) => (
              <RoutineExerciseRow
                key={`${row.exerciseId}-${index}`}
                row={row}
                exercise={exercisesById.get(row.exerciseId)}
                isFirst={index === 0}
                isLast={index === rows.length - 1}
                onChange={(patch) => updateRow(index, patch)}
                onRemove={() => removeRow(index)}
                onMoveUp={() => moveRow(index, -1)}
                onMoveDown={() => moveRow(index, 1)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center justify-center gap-2 rounded-lg border px-4 text-[15px] font-semibold active:opacity-70"
            style={{
              minHeight: 44,
              borderColor: 'var(--color-accent)',
              color: 'var(--color-accent)',
              background: 'transparent',
            }}
          >
            <span className="h-5 w-5" aria-hidden="true">
              {icons.plus}
            </span>
            Add exercise
          </button>
        </div>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <PrimaryButton type="submit" variant="primary" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Save routine'}
          </PrimaryButton>
          <PrimaryButton type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>
            Cancel
          </PrimaryButton>
          {isEditing && (
            <PrimaryButton type="button" variant="danger" fullWidth onClick={() => void handleDelete()}>
              Delete routine
            </PrimaryButton>
          )}
        </div>
      </form>

      {pickerOpen && (
        <ExercisePickerSheet
          excludeIds={selectedIds}
          onSelect={handleAddExercise}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}

interface RoutineExerciseRowProps {
  row: RoutineExercise;
  exercise: Exercise | undefined;
  isFirst: boolean;
  isLast: boolean;
  onChange: (patch: Partial<RoutineExercise>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function RoutineExerciseRow({
  row,
  exercise,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: RoutineExerciseRowProps) {
  const hasWeight = row.targetWeight !== undefined;
  const hasRest = row.restSeconds !== undefined;

  return (
    <div
      className="rounded-xl border p-3"
      style={{ background: 'var(--color-bg-elevated)', borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-start gap-2">
        <div className="flex shrink-0 flex-col gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            aria-label="Move up"
            className="flex items-center justify-center rounded-lg active:opacity-70 disabled:opacity-30"
            style={{ width: 36, height: 36, background: 'var(--color-bg-sunken)', color: 'var(--color-text)' }}
          >
            <span className="h-4 w-4">{icons.up}</span>
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            aria-label="Move down"
            className="flex items-center justify-center rounded-lg active:opacity-70 disabled:opacity-30"
            style={{ width: 36, height: 36, background: 'var(--color-bg-sunken)', color: 'var(--color-text)' }}
          >
            <span className="h-4 w-4">{icons.down}</span>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
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
          onClick={onRemove}
          aria-label={exercise ? `Remove ${exercise.name}` : 'Remove exercise'}
          className="flex shrink-0 items-center justify-center rounded-lg active:opacity-70"
          style={{ width: 44, height: 44, color: 'var(--color-danger)' }}
        >
          <span className="h-5 w-5">{icons.trash}</span>
        </button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stepper
          label="Sets"
          value={row.targetSets}
          onChange={(n) => onChange({ targetSets: n })}
          min={1}
          max={20}
        />
        <Stepper
          label="Reps"
          value={row.targetReps}
          onChange={(n) => onChange({ targetReps: n })}
          min={1}
          max={100}
        />
      </div>

      {(!hasWeight || !hasRest) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {!hasWeight && (
            <button
              type="button"
              onClick={() => onChange({ targetWeight: 20 })}
              className="rounded-full px-3.5 text-sm font-medium active:opacity-70"
              style={{
                minHeight: 36,
                background: 'var(--color-bg-sunken)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              + Target weight
            </button>
          )}
          {!hasRest && (
            <button
              type="button"
              onClick={() => onChange({ restSeconds: 60 })}
              className="rounded-full px-3.5 text-sm font-medium active:opacity-70"
              style={{
                minHeight: 36,
                background: 'var(--color-bg-sunken)',
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
            >
              + Rest timer
            </button>
          )}
        </div>
      )}

      {hasWeight && (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Stepper
              label="Target weight"
              value={row.targetWeight ?? 0}
              onChange={(n) => onChange({ targetWeight: n })}
              min={0}
              step={2.5}
              suffix="kg"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ targetWeight: undefined })}
            aria-label="Remove target weight"
            className="flex shrink-0 items-center justify-center rounded-lg active:opacity-70"
            style={{ width: 44, height: 44, background: 'var(--color-bg-sunken)', color: 'var(--color-text-muted)' }}
          >
            <span className="h-4 w-4">{icons.close}</span>
          </button>
        </div>
      )}

      {hasRest && (
        <div className="mt-3 flex items-end gap-2">
          <div className="flex-1">
            <Stepper
              label="Rest"
              value={row.restSeconds ?? 0}
              onChange={(n) => onChange({ restSeconds: n })}
              min={0}
              step={15}
              suffix="sec"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ restSeconds: undefined })}
            aria-label="Remove rest timer"
            className="flex shrink-0 items-center justify-center rounded-lg active:opacity-70"
            style={{ width: 44, height: 44, background: 'var(--color-bg-sunken)', color: 'var(--color-text-muted)' }}
          >
            <span className="h-4 w-4">{icons.close}</span>
          </button>
        </div>
      )}
    </div>
  );
}
