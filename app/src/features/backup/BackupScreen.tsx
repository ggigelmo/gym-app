import { useRef, useState } from 'react';
import type { ChangeEvent } from 'react';
import { exportDB, importInto } from 'dexie-export-import';
import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import PrimaryButton from '../../components/PrimaryButton';
import { db } from '../../db/db';

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

/**
 * Local backup: export the whole IndexedDB to a downloadable .json file, or
 * restore from one. No server involved — this is purely a safety net
 * against clearing browser data / switching devices.
 */
export default function BackupScreen() {
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
    event.target.value = ''; // allow re-selecting the same file later
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
        <h1 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
          Backup
        </h1>
      </div>

      <Card className="mb-3 flex flex-col gap-2">
        <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
          Export backup
        </p>
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
        <p className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
          Import backup
        </p>
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
    </div>
  );
}
