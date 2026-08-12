import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Section } from './Section'
import { CLASS_CODES, CLASS_NAMES, type ClassCode, type Draw } from '../types/api'
import { filterDrawsByClass } from '../utils/draws'
import { getCrsChangeForDraw } from '../utils/crsChange'

const ALL = 'ALL' as const

export function DrawsSection() {
  const [selectedClass, setSelectedClass] = useState<ClassCode | typeof ALL>(ALL)

  const fetcher = useCallback(() => api.draws.all(), [])
  const { data: rawDraws, error, loading } = useApiData<Draw[]>(fetcher, [])

  const sortedAllDraws = useMemo(() => {
    if (!rawDraws) return []
    return [...rawDraws].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || Number(b.drawNumber) - Number(a.drawNumber)
    )
  }, [rawDraws])

  const displayedDraws = useMemo(() => {
    if (!sortedAllDraws.length) return []
    if (selectedClass === ALL) {
      return sortedAllDraws.slice(0, 10)
    }
    return filterDrawsByClass(sortedAllDraws, selectedClass).slice(0, 10)
  }, [sortedAllDraws, selectedClass])

  return (
    <Section
      title="Express Entry draws"
      loading={loading}
      error={error}
      isEmpty={displayedDraws.length === 0}
      emptyMessage="No draws found for this class."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value as ClassCode | typeof ALL)}
            className="min-h-[40px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={ALL}>All classes</option>
            {CLASS_CODES.map((code) => (
              <option key={code} value={code}>
                {CLASS_NAMES[code]}
              </option>
            ))}
          </select>
          <Link to="/draws" className="whitespace-nowrap text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Full draw analysis →
          </Link>
        </div>
      }
    >
      {/* ── Desktop table (hidden on mobile) ── */}
      <div className="hidden overflow-x-auto sm:block">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500 dark:border-slate-800 dark:text-slate-400">
              <th className="pb-2 pr-4 font-medium">Draw #</th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Stream / Category</th>
              <th className="pb-2 pr-4 text-right font-medium">Cutoff CRS</th>
              <th className="pb-2 text-right font-medium">Invitations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedDraws.map((draw) => {
              const change = getCrsChangeForDraw(draw, sortedAllDraws)
              return (
                <tr key={draw.drawNumber} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {draw.url ? (
                      <a
                        href={draw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                      >
                        #{draw.drawNumber} <span className="text-xs">↗</span>
                      </a>
                    ) : (
                      `#${draw.drawNumber}`
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    <div>{draw.date}</div>
                    {draw.tieBreakingRule && (
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5" title="Tie-breaking rule cutoff">
                        Tie-breaker: {draw.tieBreakingRule.split(' at ')[0]}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-slate-800 dark:text-slate-200">
                    <div className="font-semibold">{draw.class}</div>
                    {draw.subclass && draw.subclass !== draw.class && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-md line-clamp-1">
                        {draw.subclass}
                      </div>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-right font-mono text-slate-900 dark:text-slate-100">
                    <div className="font-bold text-base">{draw.crs}</div>
                    {change && change.diff !== 0 ? (
                      <div
                        className={`text-[11px] font-bold flex items-center justify-end gap-1 mt-0.5 ${
                          change.diff < 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                        title={`CRS change vs previous ${draw.class} draw (#${change.prevDrawNumber}, CRS ${change.prevCrs})`}
                      >
                        <span>{change.diff < 0 ? '↓' : '↑'}</span>
                        <span>{change.formatted} pts</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-400 dark:text-slate-600 mt-0.5 font-sans">—</div>
                    )}
                  </td>
                  <td className="py-3 text-right font-mono text-slate-700 dark:text-slate-300">{draw.drawSize}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mobile card list (hidden on sm+) ── */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
        {displayedDraws.map((draw) => {
          const change = getCrsChangeForDraw(draw, sortedAllDraws)
          return (
            <div key={draw.drawNumber} className="py-3">
              {/* Row 1: Draw # + Date */}
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                  {draw.url ? (
                    <a
                      href={draw.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                    >
                      #{draw.drawNumber} <span className="text-xs">↗</span>
                    </a>
                  ) : (
                    `#${draw.drawNumber}`
                  )}
                </span>
                <span className="text-sm text-slate-500 dark:text-slate-400">{draw.date}</span>
              </div>

              {/* Row 2: Stream */}
              <div className="mt-1 text-sm font-medium text-slate-800 dark:text-slate-200">
                {draw.class}
              </div>
              {draw.subclass && draw.subclass !== draw.class && (
                <div className="text-xs text-slate-500 dark:text-slate-400">{draw.subclass}</div>
              )}

              {/* Row 3: CRS + Invitations */}
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-slate-100">
                    CRS {draw.crs}
                  </span>
                  {change && change.diff !== 0 && (
                    <span
                      className={`text-xs font-bold font-mono flex items-center gap-0.5 ${
                        change.diff < 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                      title={`CRS change vs previous ${draw.class} draw (#${change.prevDrawNumber}, CRS ${change.prevCrs})`}
                    >
                      {change.diff < 0 ? '↓' : '↑'}{change.formatted} pts
                    </span>
                  )}
                </div>
                <span className="text-sm font-mono text-slate-600 dark:text-slate-300">
                  {draw.drawSize} ITAs
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}
