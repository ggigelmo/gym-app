import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Routine } from '@shared/types';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import PrimaryButton from '../../components/PrimaryButton';
import { getRoutine, useRoutines } from '../../db/repo/routines';
import { startSession } from '../../db/repo/sessions';

const icons = {
  bolt: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
    </svg>
  ),
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  ),
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  ),
  clipboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2h6V3M8 10h8M8 14h8M8 18h5" />
    </svg>
  ),
};

/**
 * Shown at /train when there is no in-progress session. Three states:
 *  1. `?routineId=` is present -> a one-tap "Start [Routine]?" confirmation.
 *  2. the user tapped "Start from Routine" -> an inline routine picker.
 *  3. otherwise -> the two big entry CTAs.
 * Starting a session just calls startSession(); TrainScreen's
 * useActiveSession() picks up the change and swaps to the logging UI itself,
 * so nothing here needs to navigate.
 */
export default function StartScreen() {
  const [searchParams, setSearchParams] = useSearchParams();
  const routineId = searchParams.get('routineId');
  const routines = useRoutines();

  // undefined = still checking, null = checked and not found, Routine = found
  const [pendingRoutine, setPendingRoutine] = useState<Routine | null | undefined>(undefined);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!routineId) {
      setPendingRoutine(undefined);
      return;
    }
    let cancelled = false;
    setPendingRoutine(undefined);
    getRoutine(routineId).then((routine) => {
      if (!cancelled) setPendingRoutine(routine && routine.deletedAt == null ? routine : null);
    });
    return () => {
      cancelled = true;
    };
  }, [routineId]);

  const clearRoutineParam = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('routineId');
        return next;
      },
      { replace: true },
    );
  };

  const handleStart = async (id: string | null) => {
    if (starting) return;
    setStarting(true);
    try {
      await startSession(id);
      // useActiveSession() in TrainScreen takes it from here.
    } finally {
      setStarting(false);
    }
  };

  // 1. Confirming a routine passed in via ?routineId=
  if (routineId) {
    if (pendingRoutine === undefined) {
      return (
        <div className="px-4 py-6">
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Loading…
          </p>
        </div>
      );
    }

    if (pendingRoutine) {
      const count = pendingRoutine.exercises.length;
      return (
        <div className="flex min-h-full flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="h-12 w-12" style={{ color: 'var(--color-accent)' }} aria-hidden="true">
            {icons.bolt}
          </span>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
            Start &ldquo;{pendingRoutine.name}&rdquo;?
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {count === 1 ? '1 exercise' : `${count} exercises`}
          </p>
          <div className="mt-3 flex w-full max-w-xs flex-col gap-2">
            <PrimaryButton fullWidth disabled={starting} onClick={() => void handleStart(pendingRoutine.id)}>
              {starting ? 'Starting…' : 'Start session'}
            </PrimaryButton>
            <PrimaryButton variant="secondary" fullWidth disabled={starting} onClick={clearRoutineParam}>
              Cancel
            </PrimaryButton>
          </div>
        </div>
      );
    }
    // pendingRoutine === null: routine no longer exists — fall through to the
    // normal start screen below with a small explanatory note.
  }

  const routineNotFound = routineId != null && pendingRoutine === null;

  // 2. Inline routine picker
  if (pickerOpen) {
    const isLoading = routines === undefined;
    const isEmpty = routines !== undefined && routines.length === 0;
    return (
      <div className="px-4 py-4">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setPickerOpen(false)}
            aria-label="Back"
            className="flex shrink-0 items-center justify-center rounded-lg active:opacity-70"
            style={{ width: 44, height: 44, color: 'var(--color-text)' }}
          >
            <span className="h-5 w-5">{icons.back}</span>
          </button>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
            Choose a routine
          </h1>
        </div>

        {isLoading && (
          <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            Loading…
          </p>
        )}

        {isEmpty && (
          <EmptyState
            icon={icons.clipboard}
            title="No routines yet"
            subtitle="Create one from the Routines tab, or start a freestyle session instead."
          />
        )}

        {!isLoading && !isEmpty && (
          <div className="flex flex-col gap-2">
            {routines.map((routine) => (
              <Card
                key={routine.id}
                as="button"
                type="button"
                disabled={starting}
                onClick={() => void handleStart(routine.id)}
                className="flex w-full items-center justify-between gap-3 !py-3 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-medium" style={{ color: 'var(--color-text)' }}>
                    {routine.name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
                    {routine.exercises.length === 1 ? '1 exercise' : `${routine.exercises.length} exercises`}
                  </p>
                </div>
                <span className="h-5 w-5 shrink-0" style={{ color: 'var(--color-text-faint)' }} aria-hidden="true">
                  {icons.chevron}
                </span>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // 3. Default: two big entry CTAs
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Ready to train?
        </h1>
        {routineNotFound && (
          <p className="mt-2 text-sm" style={{ color: 'var(--color-text-muted)' }}>
            That routine couldn&rsquo;t be found — pick another below.
          </p>
        )}
      </div>
      <div className="flex w-full max-w-xs flex-col gap-3">
        <PrimaryButton fullWidth onClick={() => setPickerOpen(true)}>
          Start from Routine
        </PrimaryButton>
        <PrimaryButton variant="secondary" fullWidth disabled={starting} onClick={() => void handleStart(null)}>
          {starting ? 'Starting…' : 'Freestyle Session'}
        </PrimaryButton>
      </div>
    </div>
  );
}
