// Repository layer for progress/stats aggregations shown on the Progress
// screen: weekly volume, current streak, and this week's completed-workout
// count. All three are read-only aggregations over WorkoutSession +
// LoggedSet — no new schema, no outbox involvement (nothing here mutates).
//
// Week boundaries are local-time, Monday-start, using plain Date math (day
// stepping via setDate(), never raw epoch-ms arithmetic) so this stays
// correct across DST transitions.

import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { listSessionHistory } from './sessions';

/** Midnight (local time) of the Monday that starts the week containing `date`. */
function startOfWeek(date: Date): Date {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ... 6 = Saturday
  const diffToMonday = day === 0 ? -6 : 1 - day; // Sunday rolls back 6 days
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

/** YYYY-MM-DD key in local time — used to bucket by calendar day. */
function dayKey(epochMs: number): string {
  const d = new Date(epochMs);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export interface DailyVolume {
  dayKey: string; // YYYY-MM-DD
  weekday: number; // 0 = Monday .. 6 = Sunday
  setCount: number;
}

/**
 * Sets logged per day for the current week (Monday..Sunday). Sets are
 * bucketed by their parent session's startedAt (not the set's own
 * createdAt) so a late-night session doesn't split across two calendar-day
 * bars. Counts sets from any session that started this week, completed or
 * not — an in-progress session's already-logged sets still count.
 */
export async function getWeeklyVolume(now: Date = new Date()): Promise<DailyVolume[]> {
  const monday = startOfWeek(now);
  const days: DailyVolume[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(d.getDate() + i);
    return { dayKey: dayKey(d.getTime()), weekday: i, setCount: 0 };
  });
  const bucketByDayKey = new Map(days.map((d) => [d.dayKey, d]));

  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const sessionsThisWeek = await db.workoutSessions
    .filter(
      (s) =>
        s.deletedAt == null && s.startedAt >= monday.getTime() && s.startedAt < nextMonday.getTime(),
    )
    .toArray();
  if (sessionsThisWeek.length === 0) return days;

  const sessionDayById = new Map(sessionsThisWeek.map((s) => [s.id, dayKey(s.startedAt)]));
  const sessionIds = sessionsThisWeek.map((s) => s.id);

  const setsThisWeek = await db.loggedSets
    .where('sessionId')
    .anyOf(sessionIds)
    .filter((set) => set.deletedAt == null)
    .toArray();

  for (const set of setsThisWeek) {
    const key = sessionDayById.get(set.sessionId);
    const bucket = key ? bucketByDayKey.get(key) : undefined;
    if (bucket) bucket.setCount += 1;
  }

  return days;
}

/**
 * Consecutive-day streak of completed workouts, walking backward from today.
 * Not having trained yet today does NOT break an existing streak by itself —
 * only a fully-missed prior calendar day does. So: if today has no completed
 * session, step back to yesterday first, then walk backward counting
 * consecutive trained days from there.
 */
export async function getCurrentStreak(now: Date = new Date()): Promise<number> {
  const completedSessions = await db.workoutSessions
    .filter((s) => s.completedAt != null && s.deletedAt == null)
    .toArray();
  if (completedSessions.length === 0) return 0;

  const trainedDays = new Set(completedSessions.map((s) => dayKey(s.startedAt)));

  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = dayKey(cursor.getTime());

  let streak = 0;
  if (!trainedDays.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (trainedDays.has(dayKey(cursor.getTime()))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/** Count of completed workouts with startedAt in the current week (Monday..Sunday). */
export async function getCompletedThisWeekCount(now: Date = new Date()): Promise<number> {
  const monday = startOfWeek(now);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);

  const sessions = await listSessionHistory(); // already completed + non-deleted
  return sessions.filter((s) => s.startedAt >= monday.getTime() && s.startedAt < nextMonday.getTime())
    .length;
}

async function getWeekMinutes(monday: Date, nextMonday: Date): Promise<number> {
  const sessions = await db.workoutSessions
    .filter(
      (s) =>
        s.deletedAt == null &&
        s.completedAt != null &&
        s.startedAt >= monday.getTime() &&
        s.startedAt < nextMonday.getTime(),
    )
    .toArray();
  const totalMs = sessions.reduce((sum, s) => sum + (s.completedAt! - s.startedAt), 0);
  return Math.round(totalMs / 60000);
}

export interface WeeklyMinutes {
  current: number;
  /** % change vs the prior week — undefined if the prior week had 0 minutes (no baseline to compare against). */
  trendPct: number | undefined;
}

/** Total minutes across completed sessions this week, plus the trend vs last week. */
export async function getWeeklyMinutes(now: Date = new Date()): Promise<WeeklyMinutes> {
  const monday = startOfWeek(now);
  const nextMonday = new Date(monday);
  nextMonday.setDate(nextMonday.getDate() + 7);
  const prevMonday = new Date(monday);
  prevMonday.setDate(prevMonday.getDate() - 7);

  const [current, previous] = await Promise.all([
    getWeekMinutes(monday, nextMonday),
    getWeekMinutes(prevMonday, monday),
  ]);

  const trendPct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : undefined;
  return { current, trendPct };
}

export interface ProgressStats {
  weeklyVolume: DailyVolume[];
  currentStreak: number;
  completedThisWeek: number;
  weeklyMinutes: WeeklyMinutes;
}

/** One live-query subscription covering all four stats. */
export function useProgressStats(): ProgressStats | undefined {
  return useLiveQuery(async () => {
    const now = new Date();
    const [weeklyVolume, currentStreak, completedThisWeek, weeklyMinutes] = await Promise.all([
      getWeeklyVolume(now),
      getCurrentStreak(now),
      getCompletedThisWeekCount(now),
      getWeeklyMinutes(now),
    ]);
    return { weeklyVolume, currentStreak, completedThisWeek, weeklyMinutes };
  }, []);
}
