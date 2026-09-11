// Shared data model. Imported by the app now, and intended to be imported by
// a future Cloudflare Worker sync layer without changes (see worker/README.md).

export interface SyncMeta {
  id: string; // crypto.randomUUID() — never autoincrement, so IDs never collide across devices
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms, bumped on every mutation — used for last-write-wins sync later
  deletedAt: number | null; // soft delete (tombstone) instead of hard delete
}

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'glutes'
  | 'cardio'
  | 'other';

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest',
  'back',
  'legs',
  'shoulders',
  'arms',
  'core',
  'glutes',
  'cardio',
  'other',
];

export interface Exercise extends SyncMeta {
  name: string;
  muscleGroup: MuscleGroup;
  notes?: string;
  isCustom: boolean; // false for seeded defaults, true for user-added
}

export interface RoutineExercise {
  exerciseId: string; // -> Exercise.id
  order: number;
  targetSets: number;
  targetReps: number;
  targetWeight?: number;
  restSeconds?: number;
}

export interface Routine extends SyncMeta {
  name: string;
  exercises: RoutineExercise[]; // embedded — always read/written as a unit
}

export interface WorkoutSession extends SyncMeta {
  routineId: string | null; // null = freestyle session
  startedAt: number;
  completedAt: number | null; // null while in progress (supports resuming)
  notes?: string;
}

export type WeightUnit = 'kg' | 'lb';

export interface LoggedSet extends SyncMeta {
  sessionId: string; // -> WorkoutSession.id
  exerciseId: string; // -> Exercise.id
  setNumber: number;
  reps: number;
  weight: number;
  weightUnit: WeightUnit;
  rpe?: number;
}

// Singleton profile/goals row — there is exactly one of these, ever (see
// PROFILE_ID in db/repo/profile.ts). Extends SyncMeta for consistency with
// every other entity even though there's only one row.
export interface UserProfile extends SyncMeta {
  bodyweightCurrent?: number;
  bodyweightGoal?: number;
  bodyweightUnit: WeightUnit;
  strengthGoalExerciseId?: string; // -> Exercise.id
  strengthGoalWeight?: number;
  strengthGoalUnit: WeightUnit;
}

export type OutboxEntityType =
  | 'exercise'
  | 'routine'
  | 'workoutSession'
  | 'loggedSet'
  | 'userProfile';
export type OutboxOp = 'create' | 'update' | 'delete';

// Inert until a sync layer exists. Every write goes through the repository
// layer, which appends here too, so nothing changes when sync is added later.
export interface OutboxEntry {
  id: string;
  entityType: OutboxEntityType;
  entityId: string;
  op: OutboxOp;
  payload: unknown;
  createdAt: number;
  pushedAt: number | null;
}
