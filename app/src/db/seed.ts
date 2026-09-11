// Default exercise library, inserted once when the exercises table is empty.
// Not wired into app startup yet — a later phase calls this from main.tsx /
// App.tsx.

import type { Exercise, MuscleGroup } from '@shared/types';
import { db } from './db';

const DEFAULT_EXERCISES: Array<{ name: string; muscleGroup: MuscleGroup }> = [
  { name: 'Bench Press', muscleGroup: 'chest' },
  { name: 'Incline Dumbbell Press', muscleGroup: 'chest' },
  { name: 'Squat', muscleGroup: 'legs' },
  { name: 'Deadlift', muscleGroup: 'back' },
  { name: 'Overhead Press', muscleGroup: 'shoulders' },
  { name: 'Barbell Row', muscleGroup: 'back' },
  { name: 'Pull-Up', muscleGroup: 'back' },
  { name: 'Lat Pulldown', muscleGroup: 'back' },
  { name: 'Bicep Curl', muscleGroup: 'arms' },
  { name: 'Tricep Pushdown', muscleGroup: 'arms' },
  { name: 'Plank', muscleGroup: 'core' },
  { name: 'Leg Press', muscleGroup: 'legs' },
  { name: 'Lateral Raise', muscleGroup: 'shoulders' },
  { name: 'Romanian Deadlift', muscleGroup: 'legs' },
  { name: 'Hip Thrust', muscleGroup: 'glutes' },
];

export async function seedDefaultExercisesIfEmpty(): Promise<void> {
  const count = await db.exercises.count();
  if (count > 0) return;

  const now = Date.now();
  const exercises: Exercise[] = DEFAULT_EXERCISES.map((e) => ({
    id: crypto.randomUUID(),
    name: e.name,
    muscleGroup: e.muscleGroup,
    isCustom: false,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));

  await db.exercises.bulkAdd(exercises);
}
