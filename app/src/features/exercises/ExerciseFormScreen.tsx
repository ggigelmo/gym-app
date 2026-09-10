import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { MuscleGroup } from '@shared/types';
import { MUSCLE_GROUPS } from '@shared/types';
import PrimaryButton from '../../components/PrimaryButton';
import { createExercise, deleteExercise, getExercise, updateExercise } from '../../db/repo/exercises';
import { MUSCLE_GROUP_LABELS } from './muscleGroupLabels';

type LoadStatus = 'loading' | 'ready' | 'not-found';

/**
 * Create/edit form for a single exercise. Used for both `/exercises/new`
 * (no :id — starts blank) and `/exercises/:id/edit` (fetches the existing
 * exercise once on mount and pre-fills the form).
 */
export default function ExerciseFormScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup>('other');
  const [notes, setNotes] = useState('');
  const [existingName, setExistingName] = useState('');
  const [status, setStatus] = useState<LoadStatus>(isEditing ? 'loading' : 'ready');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch once on mount for the edit route. A one-shot fetch (not a live
  // query) so the user's own in-progress edits are never clobbered by a
  // background update while they're typing.
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    getExercise(id).then((exercise) => {
      if (cancelled) return;
      if (!exercise || exercise.deletedAt != null) {
        setStatus('not-found');
        return;
      }
      setName(exercise.name);
      setMuscleGroup(exercise.muscleGroup);
      setNotes(exercise.notes ?? '');
      setExistingName(exercise.name);
      setStatus('ready');
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const notFound = status === 'not-found';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const notesValue = notes.trim() || undefined;
      if (isEditing && id) {
        await updateExercise(id, { name: trimmedName, muscleGroup, notes: notesValue });
      } else {
        await createExercise({ name: trimmedName, muscleGroup, notes: notesValue });
      }
      navigate('/exercises');
    } catch {
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    const confirmed = window.confirm(`Delete "${existingName || 'this exercise'}"? This can't be undone.`);
    if (!confirmed) return;
    await deleteExercise(id);
    navigate('/exercises');
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

  if (notFound) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          This exercise no longer exists.
        </p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-xl font-bold" style={{ color: 'var(--color-text)' }}>
        {isEditing ? 'Edit exercise' : 'New exercise'}
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
            placeholder="e.g. Barbell Bench Press"
            autoFocus
            className="rounded-lg border px-3 text-[16px] outline-none"
            style={{
              minHeight: 44,
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Muscle group
          </span>
          <div className="flex flex-wrap gap-2">
            {MUSCLE_GROUPS.map((mg) => {
              const active = muscleGroup === mg;
              return (
                <button
                  key={mg}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setMuscleGroup(mg)}
                  className="rounded-full px-3.5 text-sm font-medium active:opacity-70"
                  style={{
                    minHeight: 40,
                    background: active ? 'var(--color-accent)' : 'var(--color-bg-sunken)',
                    color: active ? 'var(--color-accent-contrast)' : 'var(--color-text-muted)',
                    border: `1px solid ${active ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}
                >
                  {MUSCLE_GROUP_LABELS[mg]}
                </button>
              );
            })}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
            Notes <span style={{ color: 'var(--color-text-faint)' }}>(optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Form cues, machine setting, etc."
            rows={3}
            className="rounded-lg border px-3 py-2 text-[16px] outline-none"
            style={{
              background: 'var(--color-bg-elevated)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-text)',
            }}
          />
        </label>

        {error && (
          <p className="text-sm" style={{ color: 'var(--color-danger)' }}>
            {error}
          </p>
        )}

        <div className="flex flex-col gap-2 pt-1">
          <PrimaryButton type="submit" variant="primary" fullWidth disabled={saving}>
            {saving ? 'Saving…' : 'Save exercise'}
          </PrimaryButton>
          <PrimaryButton type="button" variant="secondary" fullWidth onClick={() => navigate(-1)}>
            Cancel
          </PrimaryButton>
          {isEditing && (
            <PrimaryButton type="button" variant="danger" fullWidth onClick={() => void handleDelete()}>
              Delete exercise
            </PrimaryButton>
          )}
        </div>
      </form>
    </div>
  );
}
