// Dexie (IndexedDB) database definition for Gym Tracker.
//
// This is the single source of truth for the client-side schema. All reads
// and writes go through the repo layer in ./repo/*, which builds on the
// tables defined here.

import Dexie from 'dexie';
import type { Table } from 'dexie';
import type {
  Exercise,
  LoggedSet,
  OutboxEntry,
  Routine,
  WorkoutSession,
} from '@shared/types';

export class AppDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  loggedSets!: Table<LoggedSet, string>;
  outbox!: Table<OutboxEntry, string>;

  constructor() {
    super('gym-tracker');

    this.version(1).stores({
      exercises: 'id, muscleGroup, updatedAt, deletedAt',
      routines: 'id, updatedAt, deletedAt',
      workoutSessions: 'id, routineId, startedAt, completedAt, updatedAt, deletedAt',
      loggedSets: 'id, sessionId, exerciseId, updatedAt, deletedAt',
      outbox: 'id, entityType, pushedAt, createdAt',
    });
  }
}

// Singleton instance used throughout the app.
export const db = new AppDB();
