import { useEffect, useMemo, useRef, useState } from 'react';
import type { LoggedSet, RoutineExercise, WeightUnit, WorkoutSession } from '@shared/types';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import Stepper from '../../components/Stepper';
import { useExercise, useExercises } from '../../db/repo/exercises';
import { useRoutine } from '../../db/repo/routines';
import { completeSession, logSet, useSessionSets } from '../../db/repo/sessions';
import ExercisePickerSheet from '../routines/ExercisePickerSheet';
import type { SessionSummary } from './types';

interface ActiveSessionScreenProps {
  session: WorkoutSession;
  onFinished: (summary: SessionSummary) => void;
}

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lb'];

/**
 * The active-workout logging UI: one exercise at a time, big Stepper-driven
 * set entry, a big "Log Set" button, and a running list of sets already
 * logged for the current exercise. Routine sessions walk routine.exercises
 * in order; freestyle sessions let the user pick each new exercise "block"
 * from the full exercise library.
 *
 * Resuming after a force-quit works without persisting any extra UI state:
 * on first load it re-derives "where you left off" from the sets already
 * saved to the DB — the first routine exercise that isn't at its target set
 * count yet, or (freestyle) whichever exercise was most recently logged.
 */
export default function ActiveSessionScreen({ session, onFinished }: ActiveSessionScreenProps) {
  const isRoutineSession = session.routineId != null;
  const routine = useRoutine(session.routineId ?? undefined);
  const sets = useSessionSets(session.id);
  const allExercises = useExercises();

  const sortedRoutineExercises = useMemo<RoutineExercise[]>(() => {
    if (!routine) return [];
    return [...routine.exercises].sort((a, b) => a.order - b.order);
  }, [routine]);

  // --- Resume position: computed once, the first time we have enough data ---
  const [routineIndex, setRoutineIndex] = useState(0);
  const routineIndexInitialized = useRef(false);
  useEffect(() => {
    if (routineIndexInitialized.current || !isRoutineSession) return;
    if (sets === undefined || sortedRoutineExercises.length === 0) return;
    const firstIncomplete = sortedRoutineExercises.findIndex((re) => {
      const done = sets.filter((s) => s.exerciseId === re.exerciseId).length;
      return done < re.targetSets;
    });
    setRoutineIndex(firstIncomplete === -1 ? sortedRoutineExercises.length - 1 : firstIncomplete);
    routineIndexInitialized.current = true;
  }, [isRoutineSession, sortedRoutineExercises, sets]);

  const [freestyleExerciseId, setFreestyleExerciseId] = useState<string | null>(null);
  const freestyleInitialized = useRef(false);
  useEffect(() => {
    if (freestyleInitialized.current || isRoutineSession || sets === undefined) return;
    if (sets.length > 0) {
      const mostRecent = sets.reduce((a, b) => (a.createdAt > b.createdAt ? a : b));
      setFreestyleExerciseId(mostRecent.exerciseId);
    }
    freestyleInitialized.current = true;
  }, [isRoutineSession, sets]);

  const [pickerOpen, setPickerOpen] = useState(false);
  const [logging, setLogging] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const currentTarget: RoutineExercise | undefined = isRoutineSession
    ? sortedRoutineExercises[routineIndex]
    : undefined;
  const currentExerciseId: string | undefined = isRoutineSession
    ? currentTarget?.exerciseId
    : (freestyleExerciseId ?? undefined);
  const currentExercise = useExercise(currentExerciseId);

  const setsForCurrent = useMemo<LoggedSet[]>(() => {
    if (!sets || !currentExerciseId) return [];
    return sets.filter((s) => s.exerciseId === currentExerciseId).sort((a, b) => a.setNumber - b.setNumber);
  }, [sets, currentExerciseId]);

  // --- Set-entry fields. Re-seeded only when the current exercise changes:
  // from that exercise's last logged set if it has one (so resuming keeps
  // the same weight/reps), otherwise the routine's target, otherwise a
  // sane default. Deliberately NOT re-run when `sets` changes so logging a
  // set doesn't reset the fields out from under the next one. ---
  const [reps, setReps] = useState(8);
  const [weight, setWeight] = useState(20);
  const [unit, setUnit] = useState<WeightUnit>('kg');

  useEffect(() => {
    if (!currentExerciseId) return;
    const mine = (sets ?? []).filter((s) => s.exerciseId === currentExerciseId);
    if (mine.length > 0) {
      const last = mine.reduce((a, b) => (a.setNumber > b.setNumber ? a : b));
      setReps(last.reps);
      setWeight(last.weight);
      setUnit(last.weightUnit);
    } else if (currentTarget) {
      setReps(currentTarget.targetReps || 8);
      setWeight(currentTarget.targetWeight ?? 20);
      setUnit('kg');
    } else {
      setReps(8);
      setWeight(20);
      setUnit('kg');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentExerciseId]);

  const handleLogSet = async () => {
    if (!currentExerciseId || logging) return;
    setLogging(true);
    try {
      await logSet({
        sessionId: session.id,
        exerciseId: currentExerciseId,
        setNumber: setsForCurrent.length + 1,
        reps,
        weight,
        weightUnit: unit,
      });
    } finally {
      setLogging(false);
    }
  };

  const handleFinish = async () => {
    if (finishing) return;
    setFinishing(true);
    const totalSets = sets?.length ?? 0;
    const durationMs = Date.now() - session.startedAt;
    await completeSession(session.id);
    onFinished({ sessionId: session.id, totalSets, durationMs });
  };

  const exerciseNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const ex of allExercises ?? []) map.set(ex.id, ex.name);
    return map;
  }, [allExercises]);

  // Distinct exercises already touched this session, other than the current
  // one, in the order they were first logged — lets the user jump back to
  // add another set to an earlier block.
  const priorBlocks = useMemo(() => {
    if (!sets) return [];
    const order: string[] = [];
    const counts = new Map<string, number>();
    for (const s of [...sets].sort((a, b) => a.createdAt - b.createdAt)) {
      if (!counts.has(s.exerciseId)) order.push(s.exerciseId);
      counts.set(s.exerciseId, (counts.get(s.exerciseId) ?? 0) + 1);
    }
    return order
      .filter((id) => id !== currentExerciseId)
      .map((id) => ({ exerciseId: id, name: exerciseNameById.get(id) ?? 'Exercise', count: counts.get(id) ?? 0 }));
  }, [sets, exerciseNameById, currentExerciseId]);

  const goToBlock = (exerciseId: string) => {
    if (isRoutineSession) {
      const idx = sortedRoutineExercises.findIndex((re) => re.exerciseId === exerciseId);
      if (idx !== -1) setRoutineIndex(idx);
    } else {
      setFreestyleExerciseId(exerciseId);
    }
  };

  const totalSessionSets = sets?.length ?? 0;
  const canGoPrevRoutine = isRoutineSession && routineIndex > 0;
  const canGoNextRoutine = isRoutineSession && routineIndex < sortedRoutineExercises.length - 1;

  const loading = isRoutineSession ? routine === undefined || sets === undefined : sets === undefined;
  if (loading) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col px-4 py-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
            {isRoutineSession ? (routine?.name ?? 'Routine') : 'Freestyle session'}
          </p>
          {isRoutineSession && sortedRoutineExercises.length > 0 && (
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Exercise {routineIndex + 1} of {sortedRoutineExercises.length}
            </p>
          )}
        </div>
        <span className="shrink-0 text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
          {totalSessionSets} {totalSessionSets === 1 ? 'set' : 'sets'}
        </span>
      </div>

      {!currentExerciseId ? (
        <Card className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-base font-medium" style={{ color: 'var(--color-text)' }}>
            Pick your first exercise
          </p>
          <PrimaryButton onClick={() => setPickerOpen(true)}>Choose exercise</PrimaryButton>
        </Card>
      ) : (
        <Card className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
              {currentExercise?.name ?? '…'}
            </h1>
            {currentTarget && (
              <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                Target: {currentTarget.targetSets} × {currentTarget.targetReps}
                {currentTarget.targetWeight !== undefined ? ` @ ${currentTarget.targetWeight} kg` : ''}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Stepper label="Reps" value={reps} onChange={setReps} min={0} max={999} step={1} />
            <Stepper
              label="Weight"
              value={weight}
              onChange={setWeight}
              min={0}
              max={999}
              step={unit === 'kg' ? 1 : 2.5}
              suffix={unit}
            />
          </div>

          <div className="flex items-center justify-center gap-2">
            {WEIGHT_UNITS.map((u) => (
              <button
                key={u}
                type="button"
                onClick={() => setUnit(u)}
                className="rounded-full px-4 text-sm font-semibold active:opacity-70"
                style={{
                  minHeight: 36,
                  background: unit === u ? 'var(--color-accent-muted)' : 'transparent',
                  color: unit === u ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  border: `1px solid ${unit === u ? 'var(--color-accent)' : 'var(--color-border)'}`,
                }}
              >
                {u}
              </button>
            ))}
          </div>

          <PrimaryButton
            fullWidth
            disabled={logging}
            onClick={() => void handleLogSet()}
            className="text-lg"
            style={{ minHeight: 56 }}
          >
            {logging ? 'Logging…' : `Log Set ${setsForCurrent.length + 1}`}
          </PrimaryButton>

          {setsForCurrent.length > 0 && (
            <div className="flex flex-col gap-1.5 border-t pt-3" style={{ borderColor: 'var(--color-border)' }}>
              {setsForCurrent.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span style={{ color: 'var(--color-text-muted)' }}>Set {s.setNumber}</span>
                  <span className="font-medium tabular-nums" style={{ color: 'var(--color-text)' }}>
                    {s.reps} reps × {s.weight} {s.weightUnit}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      <div className="mt-3 flex gap-2">
        {isRoutineSession ? (
          <>
            <PrimaryButton
              variant="secondary"
              className="flex-1"
              disabled={!canGoPrevRoutine}
              onClick={() => setRoutineIndex((i) => Math.max(0, i - 1))}
            >
              Previous
            </PrimaryButton>
            <PrimaryButton
              variant="secondary"
              className="flex-1"
              disabled={!canGoNextRoutine}
              onClick={() => setRoutineIndex((i) => Math.min(sortedRoutineExercises.length - 1, i + 1))}
            >
              Next Exercise
            </PrimaryButton>
          </>
        ) : (
          currentExerciseId && (
            <PrimaryButton variant="secondary" fullWidth onClick={() => setPickerOpen(true)}>
              Next Exercise
            </PrimaryButton>
          )
        )}
      </div>

      {priorBlocks.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-faint)' }}>
            Earlier this session
          </p>
          <div className="flex flex-col gap-2">
            {priorBlocks.map((block) => (
              <button
                key={block.exerciseId}
                type="button"
                onClick={() => goToBlock(block.exerciseId)}
                className="flex items-center justify-between rounded-lg border px-3 text-left active:opacity-70"
                style={{ minHeight: 44, borderColor: 'var(--color-border)', background: 'var(--color-bg-elevated)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--color-text)' }}>
                  {block.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                  {block.count} {block.count === 1 ? 'set' : 'sets'}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <PrimaryButton variant="secondary" fullWidth disabled={finishing} onClick={() => void handleFinish()}>
          {finishing ? 'Finishing…' : 'Finish Session'}
        </PrimaryButton>
      </div>

      {pickerOpen && (
        <ExercisePickerSheet
          excludeIds={[]}
          onSelect={(exercise) => {
            setFreestyleExerciseId(exercise.id);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
