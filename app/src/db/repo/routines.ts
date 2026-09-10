// Repository layer for Routine. Routine.exercises is embedded on the row —
// there is no join table, so it's always read/written as a whole array.

import { useLiveQuery } from 'dexie-react-hooks';
import type { Routine, RoutineExercise } from '@shared/types';
import { db } from '../db';
import { appendOutboxEntry } from '../outbox';

export async function listRoutines(): Promise<Routine[]> {
  const routines = await db.routines.filter((r) => r.deletedAt == null).toArray();
  routines.sort((a, b) => a.name.localeCompare(b.name));
  return routines;
}

export async function getRoutine(id: string): Promise<Routine | undefined> {
  return db.routines.get(id);
}

export async function createRoutine(input: {
  name: string;
  exercises: RoutineExercise[];
}): Promise<Routine> {
  const now = Date.now();
  const routine: Routine = {
    id: crypto.randomUUID(),
    name: input.name,
    exercises: input.exercises,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', db.routines, db.outbox, async () => {
    await db.routines.add(routine);
    await appendOutboxEntry('routine', routine.id, 'create', routine);
  });

  return routine;
}

export async function updateRoutine(
  id: string,
  patch: Partial<Pick<Routine, 'name' | 'exercises'>>,
): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.routines, db.outbox, async () => {
    await db.routines.update(id, { ...patch, updatedAt: now });
    const updated = await db.routines.get(id);
    await appendOutboxEntry('routine', id, 'update', updated ?? { id, ...patch, updatedAt: now });
  });
}

export async function deleteRoutine(id: string): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.routines, db.outbox, async () => {
    await db.routines.update(id, { deletedAt: now, updatedAt: now });
    await appendOutboxEntry('routine', id, 'delete', { id, deletedAt: now, updatedAt: now });
  });
}

export function useRoutines(): Routine[] | undefined {
  return useLiveQuery(async () => listRoutines(), []);
}

export function useRoutine(id: string | undefined): Routine | undefined {
  return useLiveQuery(async () => {
    if (!id) return undefined;
    const routine = await db.routines.get(id);
    return routine?.deletedAt == null ? routine : undefined;
  }, [id]);
}
