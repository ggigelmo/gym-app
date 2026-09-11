import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { exportDB, importInto } from 'dexie-export-import';
import { Link } from 'react-router-dom';
import type { WeightUnit } from '@shared/types';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import ProgressBar from '../../components/ProgressBar';
import Stepper from '../../components/Stepper';
import { db } from '../../db/db';
import { useExercise } from '../../db/repo/exercises';
import { fromKg, toKg } from '../../lib/weight';
import { useMaxLoggedWeight, useProfile, upsertProfile } from '../../db/repo/profile';
import ExercisePickerSheet from '../routines/ExercisePickerSheet';

const WEIGHT_UNITS: WeightUnit[] = ['kg', 'lb'];

const icons = {
  back: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  download: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v13m0 0l-4-4m4 4l4-4M4 20h16" />
    </svg>
  ),
  upload: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V7m0 0l-4 4m4-4l4 4M4 20h16" />
    </svg>
  ),
};

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function UnitToggle({ unit, onChange }: { unit: WeightUnit; onChange: (u: WeightUnit) => void }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {WEIGHT_UNITS.map((u) => (
        <button
          key={u}
          type="button"
          onClick={() => onChange(u)}
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
  );
}

function WeightGoalCard() {
  const profile = useProfile();
  if (!profile) return null;

  const unit = profile.bodyweightUnit;
  const current = profile.bodyweightCurrent;
  const goal = profile.bodyweightGoal;

  const handleUnitChange = (u: WeightUnit) => {
    if (u === unit) return;
    void upsertProfile({
      bodyweightUnit: u,
      bodyweightCurrent:
        current !== undefined ? Math.round(fromKg(toKg(current, unit), u) * 10) / 10 : undefined,
      bodyweightGoal: goal !== undefined ? Math.round(fromKg(toKg(goal, unit), u) * 10) / 10 : undefined,
    });
  };

  const bothSet = current !== undefined && goal !== undefined;
  const delta = bothSet ? Math.abs(goal - current) : undefined;
  const pct = bothSet ? 100 - (delta! / Math.max(goal, current, 1)) * 100 : undefined;

  return (
    <Card className="flex flex-col gap-4">
      <p className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>
        Weight Goal
      </p>
      <div className="grid grid-cols-2 gap-3">
        <Stepper
          label="Current"
          value={current ?? 0}
          onChange={(n) => void upsertProfile({ bodyweightCurrent: n })}
          min={0}
          max={999}
          step={unit === 'kg' ? 0.5 : 1}
          suffix={unit}
        />
        <Stepper
          label="Goal"
          value={goal ?? 0}
          onChange={(n) => void upsertProfile({ bodyweightGoal: n })}
          min={0}
          max={999}
          step={unit === 'kg' ? 0.5 : 1}
          suffix={unit}
        />
      </div>
      <UnitToggle unit={unit} onChange={handleUnitChange} />
      {bothSet ? (
        <div className="flex flex-col gap-1.5">
          <ProgressBar value={pct!} />
          <p
            className="text-[10px] font-bold uppercase tracking-widest"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {delta === 0 ? 'Goal reached' : `${delta}${unit} to go`}
          </p>
        </div>
      ) : (
        <p className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
          Set both a current and goal weight to see progress.
        </p>
      )}
    </Card>
  );
}

function StrengthGoalCard() {
  const profile = useProfile();
  const [pickerOpen, setPickerOpen] = useState(false);
  const exercise = useExercise(profile?.strengthGoalExerciseId);
  const unit = profile?.strengthGoalUnit ?? 'kg';
  const currentBestRaw = useMaxLoggedWeight(profile?.strengthGoalExerciseId, unit);
  // Round only for display — getMaxLoggedWeight can return an ugly
  // floating-point tail after a kg<->lb conversion (e.g. 44.09245243697551).
  const currentBest = currentBestRaw !== undefined ? Math.round(currentBestRaw * 10) / 10 : undefined;

  if (!profile) return null;

  const handleUnitChange = async (u: WeightUnit) => {
    if (u === unit) return;
    const target = profile.strengthGoalWeight;
    let convertedTarget = target;
    if (target !== undefined) {
      convertedTarget = Math.round(fromKg(toKg(target, unit), u) * 10) / 10;
    }
    await upsertProfile({ strengthGoalUnit: u, strengthGoalWeight: convertedTarget });
  };

  const target = profile.strengthGoalWeight;
  const pct =
    target !== undefined && currentBest !== undefined && target > 0
      ? Math.min(100, (currentBest / target) * 100)
      : undefined;

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>
          Strength Goal
        </p>
        {profile.strengthGoalExerciseId && (
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-[10px] font-bold uppercase tracking-widest active:opacity-70"
            style={{ color: 'var(--color-accent)' }}
          >
            Change
          </button>
        )}
      </div>

      {!profile.strengthGoalExerciseId ? (
        <PrimaryButton variant="secondary" onClick={() => setPickerOpen(true)}>
          Choose exercise
        </PrimaryButton>
      ) : (
        <>
          <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
            {exercise?.name ?? '…'}
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Stepper
              label="Target"
              value={target ?? 0}
              onChange={(n) => void upsertProfile({ strengthGoalWeight: n })}
              min={0}
              max={999}
              step={unit === 'kg' ? 1 : 2.5}
              suffix={unit}
            />
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-muted)' }}>
                Current best
              </span>
              <div
                className="flex flex-1 items-center justify-center rounded-lg"
                style={{ background: 'var(--color-bg-sunken)', minHeight: 44 }}
              >
                <span className="text-xl font-semibold" style={{ color: 'var(--color-text)' }}>
                  {currentBest !== undefined ? (
                    <>
                      {currentBest}
                      <span className="ml-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
                        {unit}
                      </span>
                    </>
                  ) : (
                    <span className="text-sm" style={{ color: 'var(--color-text-faint)' }}>
                      Not logged yet
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <UnitToggle unit={unit} onChange={(u) => void handleUnitChange(u)} />

          {pct !== undefined && <ProgressBar value={pct} />}
        </>
      )}

      {pickerOpen && (
        <ExercisePickerSheet
          title="Choose exercise"
          excludeIds={[]}
          onSelect={(ex) => {
            void upsertProfile({ strengthGoalExerciseId: ex.id });
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </Card>
  );
}

/**
 * Goals (weight + strength) plus local backup export/import — the app's one
 * settings-like screen, reached via the gear icon. Replaces the old
 * standalone Backup screen; its export/import cards live on unchanged here.
 */
export default function ProfileScreen() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const blob = await exportDB(db, { prettyJson: true });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gym-tracker-backup-${todayStamp()}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setMessage({ kind: 'success', text: 'Backup exported.' });
    } catch {
      setMessage({ kind: 'error', text: 'Export failed. Please try again.' });
    } finally {
      setBusy(false);
    }
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const confirmed = window.confirm(
      'Importing will overwrite any existing data with matching IDs. Continue?',
    );
    if (!confirmed) return;

    setBusy(true);
    setMessage(null);
    try {
      await importInto(db, file, {
        overwriteValues: true,
        acceptNameDiff: true,
        acceptVersionDiff: true,
      });
      setMessage({ kind: 'success', text: 'Backup imported. Your data has been restored.' });
    } catch {
      setMessage({
        kind: 'error',
        text: "Import failed — the file may not be a valid Gym Tracker backup.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full px-4 py-4">
      <div className="mb-4 flex items-center gap-2">
        <Link
          to="/train"
          aria-label="Back"
          className="flex items-center justify-center rounded-full active:opacity-60"
          style={{ width: 44, height: 44, marginLeft: -10, color: 'var(--color-text)' }}
        >
          <span className="h-6 w-6">{icons.back}</span>
        </Link>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
          Profile
        </h1>
      </div>

      <div className="flex flex-col gap-3">
        <WeightGoalCard />
        <StrengthGoalCard />
      </div>

      <p
        className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wide"
        style={{ color: 'var(--color-text-faint)' }}
      >
        Data
      </p>

      <Card className="mb-3 flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
            aria-hidden="true"
          >
            <span className="h-5 w-5">{icons.download}</span>
          </div>
          <p className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>
            Export backup
          </p>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Save all your exercises, routines, and workout history to a .json file on this device.
        </p>
        <PrimaryButton
          variant="secondary"
          onClick={() => void handleExport()}
          disabled={busy}
          className="mt-1 inline-flex items-center justify-center gap-2"
        >
          <span className="h-5 w-5">{icons.download}</span>
          Export backup
        </PrimaryButton>
      </Card>

      <Card className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl"
            style={{ background: 'var(--color-bg-sunken)', color: 'var(--color-text-muted)' }}
            aria-hidden="true"
          >
            <span className="h-5 w-5">{icons.upload}</span>
          </div>
          <p className="text-[15px] font-bold" style={{ color: 'var(--color-text)' }}>
            Import backup
          </p>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Restore from a previously exported .json file. This overwrites any data with matching
          IDs.
        </p>
        <PrimaryButton
          variant="secondary"
          onClick={handleImportClick}
          disabled={busy}
          className="mt-1 inline-flex items-center justify-center gap-2"
        >
          <span className="h-5 w-5">{icons.upload}</span>
          Import backup
        </PrimaryButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => void handleFileSelected(e)}
        />
      </Card>

      {message && (
        <p
          role="status"
          className="mt-4 px-1 text-sm font-medium"
          style={{ color: message.kind === 'error' ? 'var(--color-danger)' : 'var(--color-accent)' }}
        >
          {message.text}
        </p>
      )}

      <p
        className="mt-6 px-1 text-center text-[10px] font-bold uppercase tracking-widest"
        style={{ color: 'var(--color-text-faint)' }}
      >
        All data stays on this device · Design by{' '}
        <a
          href="https://sleek.design"
          target="_blank"
          rel="noreferrer"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Sleek
        </a>
      </p>
    </div>
  );
}
