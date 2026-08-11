export function DrawAnalysisPage() {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Draw analysis</h2>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        The full CRS trend chart and analyst tools land here in Phase 1 — see{' '}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-xs dark:bg-slate-800">
          docs/DRAW_ANALYSIS_PLAN.md
        </code>
        .
      </p>
    </section>
  )
}
