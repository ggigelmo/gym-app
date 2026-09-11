// Repository layer for UserProfile — a singleton row holding bodyweight and
// strength goals. Follows the same transaction + outbox pattern as every
// other repo module; get-or-create semantics mean callers never see "no row
// yet" as a case distinct from "row with all-empty goal fields."

import { useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import type { UserProfile, WeightUnit } from '@shared/types';
import { db } from '../db';
import { appendOutboxEntry } from '../outbox';
import { fromKg, toKg } from '../../lib/weight';

// Fixed id: there is exactly one profile row, ever (no multi-user concept in
// this app). Deliberately not crypto.randomUUID() like every other entity.
const PROFILE_ID = 'local';

function defaultProfile(now: number): UserProfile {
  return {
    id: PROFILE_ID,
    bodyweightUnit: 'kg',
    strengthGoalUnit: 'kg',
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };
}

/**
 * Returns the singleton profile, creating it with defaults on first access.
 */
export async function getProfile(): Promise<UserProfile> {
  const existing = await db.userProfiles.get(PROFILE_ID);
  if (existing && existing.deletedAt == null) return existing;

  const now = Date.now();
  const profile = defaultProfile(now);

  await db.transaction('rw', db.userProfiles, db.outbox, async () => {
    // Re-check inside the transaction in case another caller created the
    // row between the read above and this write.
    const raceCheck = await db.userProfiles.get(PROFILE_ID);
    if (raceCheck && raceCheck.deletedAt == null) return;
    await db.userProfiles.put(profile);
    await appendOutboxEntry('userProfile', PROFILE_ID, 'create', profile);
  });

  return (await db.userProfiles.get(PROFILE_ID)) ?? profile;
}

/**
 * Patches the singleton profile, creating it first if necessary.
 */
export async function upsertProfile(
  patch: Partial<
    Pick<
      UserProfile,
      | 'bodyweightCurrent'
      | 'bodyweightGoal'
      | 'bodyweightUnit'
      | 'strengthGoalExerciseId'
      | 'strengthGoalWeight'
      | 'strengthGoalUnit'
    >
  >,
): Promise<void> {
  const now = Date.now();

  await db.transaction('rw', db.userProfiles, db.outbox, async () => {
    const existing = await db.userProfiles.get(PROFILE_ID);
    const base = existing ?? defaultProfile(now);
    const updated: UserProfile = { ...base, ...patch, id: PROFILE_ID, updatedAt: now };

    await db.userProfiles.put(updated);
    await appendOutboxEntry('userProfile', PROFILE_ID, existing ? 'update' : 'create', updated);
  });
}

/**
 * Live view of the singleton profile. The live query itself is read-only
 * (Dexie's useLiveQuery forbids write transactions in its querier, since it
 * may re-run reactively) — creating the row on first-ever access happens in
 * a separate effect, outside the query. Once that write lands, the live
 * query's table subscription picks it up automatically.
 */
export function useProfile(): UserProfile | undefined {
  const profile = useLiveQuery(
    () => db.userProfiles.get(PROFILE_ID).then((row) => (row?.deletedAt == null ? row : undefined)),
    [],
  );

  useEffect(() => {
    void getProfile();
  }, []);

  return profile;
}

/**
 * Heaviest weight ever logged for an exercise, across all history, converted
 * to targetUnit. Returns undefined if nothing has been logged for that
 * exercise yet — distinct from 0, which is a legitimate logged weight.
 */
export async function getMaxLoggedWeight(
  exerciseId: string,
  targetUnit: WeightUnit,
): Promise<number | undefined> {
  const sets = await db.loggedSets
    .where('exerciseId')
    .equals(exerciseId)
    .filter((s) => s.deletedAt == null)
    .toArray();
  if (sets.length === 0) return undefined;

  const maxKg = Math.max(...sets.map((s) => toKg(s.weight, s.weightUnit)));
  return fromKg(maxKg, targetUnit);
}

export function useMaxLoggedWeight(
  exerciseId: string | undefined,
  targetUnit: WeightUnit,
): number | undefined {
  return useLiveQuery(async () => {
    if (!exerciseId) return undefined;
    return getMaxLoggedWeight(exerciseId, targetUnit);
  }, [exerciseId, targetUnit]);
}
