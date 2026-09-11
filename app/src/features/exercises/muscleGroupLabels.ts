import type { MuscleGroup } from '@shared/types';

/** Human-readable label for each MuscleGroup value (all lowercase in the data model). */
export const MUSCLE_GROUP_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  legs: 'Legs',
  shoulders: 'Shoulders',
  arms: 'Arms',
  core: 'Core',
  glutes: 'Glutes',
  cardio: 'Cardio',
  other: 'Other',
};
