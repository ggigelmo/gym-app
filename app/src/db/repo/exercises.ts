// Repository layer for Exercise. All reads go through the plain async
// functions or the useLiveQuery-backed hooks; all writes bump updatedAt and
// append an outbox entry in the same transaction.

import { useLiveQuery } from 'dexie-react-hooks';
import type { Exercise, MuscleGroup } from '@shared/types';
import { db } from '../db';
import { appendOutboxEntry } from '../outbox';

export async function listExercises(): Promise<Exercise[]> {
  const exercises = await db.exercises.filter((e) => e.deletedAt == null).toArray();
  exercises.sort((a, b) => a.name.localeCompare(b.name));
  return exercises;
}

export async function getExercise(id: string): Promise<Exercise | undefined> {
  return db.exercises.get(id);
}

export async function createExercise(input: {
  name: string;
  muscleGroup: MuscleGroup;
  notes?: string;
  isCustom?: boolean;
}): Promise<Exercise> {
  const now = Date.now();
  const exercise: Exercise = {
    id: crypto.randomUUID(),
    name: input.name,
    muscleGroup: input.muscleGroup,
    notes: input.notes,
    isCustom: input.isCustom ?? true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', db.exercises, db.outbox, async () => {
    await db.exercises.add(exercise);
    await appendOutboxEntry('exercise', exercise.id, 'create', exercise);
  });

  return exercise;
}

export async function updateExercise(
  id: string,
  patch: Partial<Pick<Exercise, 'name' | 'muscleGroup' | 'notes'>>,
): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.exercises, db.outbox, async () => {
    await db.exercises.update(id, { ...patch, updatedAt: now });
    const updated = await db.exercises.get(id);
    await appendOutboxEntry('exercise', id, 'update', updated ?? { id, ...patch, updatedAt: now });
  });
}

export async function deleteExercise(id: string): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.exercises, db.outbox, async () => {
    await db.exercises.update(id, { deletedAt: now, updatedAt: now });
    await appendOutboxEntry('exercise', id, 'delete', { id, deletedAt: now, updatedAt: now });
  });
}

export function useExercises(): Exercise[] | undefined {
  return useLiveQuery(async () => listExercises(), []);
}

export function useExercise(id: string | undefined): Exercise | undefined {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    const exercise = await db.exercises.get(id);
    return exercise?.deletedAt == null ? exercise : undefined;
  }, [id]);
}
