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
  UserProfile,
  WorkoutSession,
} from '@shared/types';

export class AppDB extends Dexie {
  exercises!: Table<Exercise, string>;
  routines!: Table<Routine, string>;
  workoutSessions!: Table<WorkoutSession, string>;
  loggedSets!: Table<LoggedSet, string>;
  outbox!: Table<OutboxEntry, string>;
  userProfiles!: Table<UserProfile, string>;

  constructor() {
    super('gym-tracker');

    this.version(1).stores({
      exercises: 'id, muscleGroup, updatedAt, deletedAt',
      routines: 'id, updatedAt, deletedAt',
      workoutSessions: 'id, routineId, startedAt, completedAt, updatedAt, deletedAt',
      loggedSets: 'id, sessionId, exerciseId, updatedAt, deletedAt',
      outbox: 'id, entityType, pushedAt, createdAt',
    });

    // v2: add userProfiles (singleton goals table). Existing stores are
    // intentionally left out below — Dexie carries forward any table/index
    // not re-listed in a later version, so omission here means "unchanged,"
    // not "dropped." Only the new table needs declaring.
    this.version(2).stores({
      userProfiles: 'id, updatedAt, deletedAt',
    });
  }
}

// Singleton instance used throughout the app.
export const db = new AppDB();
