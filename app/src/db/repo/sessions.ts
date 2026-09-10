// Repository layer for WorkoutSession + LoggedSet — the active-workout flow.

import { useLiveQuery } from 'dexie-react-hooks';
import type { LoggedSet, WeightUnit, WorkoutSession } from '@shared/types';
import { db } from '../db';
import { appendOutboxEntry } from '../outbox';

export async function startSession(routineId: string | null): Promise<WorkoutSession> {
  const now = Date.now();
  const session: WorkoutSession = {
    id: crypto.randomUUID(),
    routineId,
    startedAt: now,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', db.workoutSessions, db.outbox, async () => {
    await db.workoutSessions.add(session);
    await appendOutboxEntry('workoutSession', session.id, 'create', session);
  });

  return session;
}

export async function getActiveSession(): Promise<WorkoutSession | undefined> {
  const candidates = await db.workoutSessions
    .filter((s) => s.completedAt == null && s.deletedAt == null)
    .toArray();
  candidates.sort((a, b) => b.startedAt - a.startedAt);
  return candidates[0];
}

export async function completeSession(id: string): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.workoutSessions, db.outbox, async () => {
    await db.workoutSessions.update(id, { completedAt: now, updatedAt: now });
    const updated = await db.workoutSessions.get(id);
    await appendOutboxEntry(
      'workoutSession',
      id,
      'update',
      updated ?? { id, completedAt: now, updatedAt: now },
    );
  });
}

export async function logSet(input: {
  sessionId: string;
  exerciseId: string;
  setNumber: number;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
  rpe?: number;
}): Promise<LoggedSet> {
  const now = Date.now();
  const loggedSet: LoggedSet = {
    id: crypto.randomUUID(),
    sessionId: input.sessionId,
    exerciseId: input.exerciseId,
    setNumber: input.setNumber,
    reps: input.reps,
    weight: input.weight,
    weightUnit: input.weightUnit,
    rpe: input.rpe,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await db.transaction('rw', db.loggedSets, db.outbox, async () => {
    await db.loggedSets.add(loggedSet);
    await appendOutboxEntry('loggedSet', loggedSet.id, 'create', loggedSet);
  });

  return loggedSet;
}

export async function listSessionHistory(): Promise<WorkoutSession[]> {
  const sessions = await db.workoutSessions
    .filter((s) => s.completedAt != null && s.deletedAt == null)
    .toArray();
  sessions.sort((a, b) => b.startedAt - a.startedAt);
  return sessions;
}

export async function getSessionSets(sessionId: string): Promise<LoggedSet[]> {
  const sets = await db.loggedSets
    .where('sessionId')
    .equals(sessionId)
    .filter((s) => s.deletedAt == null)
    .toArray();
  sets.sort((a, b) => a.setNumber - b.setNumber || a.createdAt - b.createdAt);
  return sets;
}

export function useActiveSession(): WorkoutSession | undefined | null {
  return useLiveQuery(async () => {
    const active = await getActiveSession();
    return active ?? null;
  }, []);
}

export function useSessionHistory(): WorkoutSession[] | undefined {
  return useLiveQuery(async () => listSessionHistory(), []);
}

export function useSessionSets(sessionId: string | undefined): LoggedSet[] | undefined {
  return useLiveQuery(async () => {
    if (!sessionId) return [];
    return getSessionSets(sessionId);
  }, [sessionId]);
}
