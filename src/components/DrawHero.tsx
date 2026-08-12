import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import type { Draw } from '../types/api'

// The opening beat: what everyone visiting this site actually wants to know first is the
// latest cutoff, not a table. Echoes the logo mark's cutoff-line motif behind the headline
// number - the same "did you clear the line" idea the whole app is built around.
export function DrawHero() {
  const { data, loading } = useApiData<Draw[]>(() => api.draws.latest(1), [])
  const draw = data?.[0]

  if (loading || !draw) return null

  const invitations = Number(draw.drawSize.replace(/,/g, '')).toLocaleString()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white px-6 py-8 dark:border-slate-800 dark:bg-slate-900 sm:px-10 sm:py-12">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-[4.5rem] h-px bg-[repeating-linear-gradient(90deg,currentColor_0_10px,transparent_10px_20px)] text-brand-600/25 dark:text-brand-400/20 sm:top-24"
      />
      <p className="relative font-mono text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
        Latest draw · #{draw.drawNumber} · {draw.date}
      </p>
      <p className="font-display relative mt-3 text-6xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-7xl">
        CRS {draw.crs}
      </p>
      <p className="relative mt-3 max-w-xl text-base text-slate-600 dark:text-slate-400">
        {draw.class} — {invitations} invitations issued
      </p>
    </div>
  )
}
