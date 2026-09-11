import { useState } from 'react';
import { useActiveSession } from '../../db/repo/sessions';
import ActiveSessionScreen from './ActiveSessionScreen';
import SessionCompleteCard from './SessionCompleteCard';
import StartScreen from './StartScreen';
import type { SessionSummary } from './types';

/**
 * Entry point for /train — the highest-frequency screen, used mid-workout,
 * one-handed. Routing between its three states is driven entirely by
 * useActiveSession() (a live Dexie query) plus one bit of local state for
 * the "just finished" confirmation:
 *
 *  - completedSummary set -> confirmation card (checked first so finishing
 *    a session doesn't flash straight to the start screen underneath it)
 *  - activeSession undefined -> still loading from IndexedDB
 *  - activeSession present -> resume it directly (covers force-quit/reopen)
 *  - otherwise -> start screen (routine confirm / picker / freestyle)
 */
export default function TrainScreen() {
  const activeSession = useActiveSession();
  const [completedSummary, setCompletedSummary] = useState<SessionSummary | null>(null);

  if (completedSummary) {
    return <SessionCompleteCard summary={completedSummary} onDismiss={() => setCompletedSummary(null)} />;
  }

  if (activeSession === undefined) {
    return (
      <div className="px-4 py-6">
        <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      </div>
    );
  }

  if (activeSession) {
    return <ActiveSessionScreen session={activeSession} onFinished={setCompletedSummary} />;
  }

  return <StartScreen />;
}
