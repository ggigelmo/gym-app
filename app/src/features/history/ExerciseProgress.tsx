import { useLiveQuery } from 'dexie-react-hooks';
import type { WeightUnit } from '@shared/types';
import { db } from '../../db/db';

const LB_TO_KG = 0.45359237;

function toKg(weight: number, unit: WeightUnit): number {
  return unit === 'lb' ? weight * LB_TO_KG : weight;
}

interface ProgressPoint {
  date: number;
  maxWeight: number;
  unit: WeightUnit;
}

/**
 * Best (max) weight logged for one exercise, one point per session,
 * oldest-first. Reads Dexie directly (read-only, no outbox involved) since
 * this cross-session aggregation doesn't fit the per-session repo helpers.
 */
function useExerciseProgress(exerciseId: string): ProgressPoint[] | undefined {
  return useLiveQuery(async () => {
    const sets = await db.loggedSets
      .where('exerciseId')
      .equals(exerciseId)
      .filter((s) => s.deletedAt == null)
      .toArray();
    if (sets.length === 0) return [];

    const bestBySession = new Map<string, { weight: number; unit: WeightUnit }>();
    for (const set of sets) {
      const current = bestBySession.get(set.sessionId);
      if (!current || set.weight > current.weight) {
        bestBySession.set(set.sessionId, { weight: set.weight, unit: set.weightUnit });
      }
    }

    const sessionIds = Array.from(bestBySession.keys());
    const sessions = await db.workoutSessions.bulkGet(sessionIds);

    const points: ProgressPoint[] = [];
    sessionIds.forEach((sessionId, i) => {
      const session = sessions[i];
      const best = bestBySession.get(sessionId);
      if (session?.completedAt != null && best) {
        points.push({ date: session.startedAt, maxWeight: best.weight, unit: best.unit });
      }
    });
    points.sort((a, b) => a.date - b.date);
    return points;
  }, [exerciseId]);
}

function Sparkline({ points }: { points: ProgressPoint[] }) {
  const width = 100;
  const height = 24;
  const pad = 2;

  const kgValues = points.map((p) => toKg(p.maxWeight, p.unit));
  const min = Math.min(...kgValues);
  const max = Math.max(...kgValues);
  const range = max - min || 1;
  const stepX = points.length > 1 ? (width - pad * 2) / (points.length - 1) : 0;

  const coords = kgValues.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-6 w-full" preserveAspectRatio="none" aria-hidden="true">
      <polyline
        points={coords.join(' ')}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Lightweight per-exercise progress panel: max weight logged per session
 * across all history, plotted as a plain-SVG sparkline (oldest to newest).
 * Renders nothing while loading or if there isn't enough history to plot.
 */
export default function ExerciseProgress({ exerciseId }: { exerciseId: string }) {
  const points = useExerciseProgress(exerciseId);

  if (!points || points.length < 2) {
    return (
      <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
        {points === undefined ? 'Loading…' : 'Not enough history yet to chart progress.'}
      </p>
    );
  }

  const first = points[0];
  const last = points[points.length - 1];

  return (
    <div className="flex flex-col gap-1.5">
      <Sparkline points={points} />
      <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
        {first.maxWeight}{first.unit} → {last.maxWeight}{last.unit} over {points.length} sessions
      </p>
    </div>
  );
}
