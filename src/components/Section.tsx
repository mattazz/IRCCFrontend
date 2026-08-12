import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  action?: ReactNode
  loading: boolean
  error: string | null
  isEmpty: boolean
  emptyMessage?: string
  children: ReactNode
}

export function Section({
  title,
  action,
  loading,
  error,
  isEmpty,
  emptyMessage = 'Nothing here yet.',
  children,
}: SectionProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="font-display text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {action}
      </div>

      {loading && <p className="text-sm text-slate-500 dark:text-slate-400">Loading…</p>}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && !error && isEmpty && (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      )}

      {!loading && !error && !isEmpty && children}
    </section>
  )
}
