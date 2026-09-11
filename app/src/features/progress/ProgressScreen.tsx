import { Link } from 'react-router-dom';
import Card from '../../components/Card';
import EmptyState from '../../components/EmptyState';
import { useProgressStats } from '../../db/repo/progress';

const WEEKDAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

const icons = {
  trendUp: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  ),
};

/**
 * Weekly minutes (with trend vs last week), streak, this-week workout count,
 * and a Monday-Sunday sets-per-day bar chart — all derived live from real
 * WorkoutSession/LoggedSet data via useProgressStats(), no invented numbers.
 */
export default function ProgressScreen() {
  const stats = useProgressStats();
  const isLoading = stats === undefined;
  const isEmpty =
    stats !== undefined &&
    stats.currentStreak === 0 &&
    stats.completedThisWeek === 0 &&
    stats.weeklyMinutes.current === 0 &&
    stats.weeklyVolume.every((d) => d.setCount === 0);

  const maxSets = stats ? Math.max(...stats.weeklyVolume.map((d) => d.setCount), 1) : 1;
  const nonZeroSetCounts = stats ? stats.weeklyVolume.map((d) => d.setCount).filter((n) => n > 0) : [];
  const avgNonZero =
    nonZeroSetCounts.length > 0 ? nonZeroSetCounts.reduce((a, b) => a + b, 0) / nonZeroSetCounts.length : 0;
  const peakPct =
    nonZeroSetCounts.length >= 2 && avgNonZero > 0
      ? Math.round(((maxSets - avgNonZero) / avgNonZero) * 100)
      : undefined;

  return (
    <div className="px-4 py-4">
      <h1 className="mb-4 text-3xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
        Progress
      </h1>

      {isLoading && (
        <p className="px-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
          Loading…
        </p>
      )}

      {isEmpty && (
        <EmptyState
          icon={icons.trendUp}
          title="No progress yet"
          subtitle="Finish a workout this week to start tracking your streak and volume."
          action={
            <Link
              to="/train"
              className="inline-flex items-center justify-center rounded-lg px-4 font-semibold active:opacity-70"
              style={{
                minHeight: 44,
                background: 'var(--color-accent)',
                color: 'var(--color-accent-contrast)',
              }}
            >
              Start training
            </Link>
          }
        />
      )}

      {stats && !isEmpty && (
        <div className="flex flex-col gap-3">
          <div
            className="relative overflow-hidden rounded-xl p-6 shadow-xl"
            style={{
              background: 'var(--color-accent)',
              color: 'var(--color-accent-contrast)',
              boxShadow: '0 20px 50px -20px rgba(255, 90, 60, 0.5)',
            }}
          >
            <iconify-icon
              icon="ph:trend-up-fill"
              className="pointer-events-none absolute"
              style={{ top: -24, right: -24, fontSize: '9rem', opacity: 0.12 }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Weekly Minutes</p>
              <p className="mt-1 text-6xl font-black tracking-tight">{stats.weeklyMinutes.current}</p>
              {stats.weeklyMinutes.trendPct !== undefined && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold">
                  <span
                    className="flex items-center gap-1 rounded-lg px-2 py-1"
                    style={{ background: 'rgba(255,255,255,0.2)' }}
                  >
                    <iconify-icon
                      icon={stats.weeklyMinutes.trendPct >= 0 ? 'ph:arrow-up-right-bold' : 'ph:arrow-down-right-bold'}
                    />
                    {Math.abs(stats.weeklyMinutes.trendPct)}%
                  </span>
                  <span className="opacity-80">vs last week</span>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="flex flex-col gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                aria-hidden="true"
              >
                <iconify-icon icon="ph:flame-fill" className="text-xl" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {stats.currentStreak}
                </p>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  day streak
                </p>
              </div>
            </Card>
            <Card className="flex flex-col gap-2">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
                aria-hidden="true"
              >
                <iconify-icon icon="ph:calendar-check-fill" className="text-xl" />
              </div>
              <div>
                <p className="text-2xl font-black tracking-tight" style={{ color: 'var(--color-text)' }}>
                  {stats.completedThisWeek}
                </p>
                <p
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  this week
                </p>
              </div>
            </Card>
          </div>

          <Card className="flex flex-col gap-3">
            <div className="flex items-end justify-between">
              <p
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Weekly volume <span style={{ color: 'var(--color-text-faint)' }}>Sets</span>
              </p>
              {peakPct !== undefined && peakPct > 0 && (
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: 'var(--color-accent)' }}
                >
                  +{peakPct}% Peak
                </span>
              )}
            </div>
            <div className="flex items-end justify-between gap-2" style={{ height: 120 }}>
              {stats.weeklyVolume.map((d) => {
                const pct = (d.setCount / maxSets) * 100;
                const isPeak = d.setCount > 0 && d.setCount === maxSets;
                return (
                  <div
                    key={d.dayKey}
                    className="flex flex-1 flex-col items-center gap-1.5"
                    aria-label={`${WEEKDAY_LETTERS[d.weekday]}: ${d.setCount} ${d.setCount === 1 ? 'set' : 'sets'}`}
                  >
                    <div className="flex w-full flex-1 items-end justify-center">
                      <div
                        className="w-full rounded-md"
                        style={{
                          height: `${pct}%`,
                          minHeight: d.setCount > 0 ? 4 : 2,
                          background:
                            d.setCount > 0
                              ? `color-mix(in srgb, var(--color-accent) ${isPeak ? 100 : Math.max(35, pct)}%, transparent)`
                              : 'var(--color-bg-sunken)',
                        }}
                      />
                    </div>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: 'var(--color-text-faint)' }}
                    >
                      {WEEKDAY_LETTERS[d.weekday]}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
