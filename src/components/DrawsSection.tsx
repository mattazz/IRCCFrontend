import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Section } from './Section'
import { CLASS_CODES, CLASS_NAMES, type ClassCode, type Draw } from '../types/api'
import { filterDrawsByClass } from '../utils/draws'

const ALL = 'ALL' as const

function normalizeCategory(name?: string): string {
  if (!name) return ''
  const l = name.toLowerCase()
  if (l.includes('french')) return 'french'
  if (l.includes('canadian experience class') || l.includes('cec')) return 'cec'
  if (l.includes('provincial nominee') || l.includes('pnp')) return 'pnp'
  if (l.includes('transport')) return 'transport'
  if (l.includes('healthcare')) return 'healthcare'
  if (l.includes('stem')) return 'stem'
  if (l.includes('trade')) return 'trades'
  if (l.includes('agriculture') || l.includes('agri-food')) return 'agri'
  if (l.includes('skilled worker') || l.includes('fsw')) return 'fsw'
  return l.replace(/[^a-z0-9]/g, '')
}

function getCrsChange(
  currentDraw: Draw,
  allDrawsSortedDesc: Draw[]
): { diff: number; formatted: string; prevDrawNumber: string; prevCrs: string } | null {
  const currentCrs = Number(currentDraw.crs)
  if (isNaN(currentCrs)) return null

  const currentCategory = normalizeCategory(currentDraw.class)
  const currentIndex = allDrawsSortedDesc.findIndex((d) => d.drawNumber === currentDraw.drawNumber)
  if (currentIndex === -1) return null

  for (let i = currentIndex + 1; i < allDrawsSortedDesc.length; i++) {
    const prevDraw = allDrawsSortedDesc[i]
    if (normalizeCategory(prevDraw.class) === currentCategory) {
      const prevCrs = Number(prevDraw.crs)
      if (!isNaN(prevCrs)) {
        const diff = currentCrs - prevCrs
        return {
          diff,
          formatted: diff > 0 ? `+${diff}` : `${diff}`,
          prevDrawNumber: prevDraw.drawNumber,
          prevCrs: prevDraw.crs,
        }
      }
    }
  }

  return null
}

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
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            <option value={ALL}>All classes</option>
            {CLASS_CODES.map((code) => (
              <option key={code} value={code}>
                {CLASS_NAMES[code]}
              </option>
            ))}
          </select>
          <Link to="/draws" className="whitespace-nowrap text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Full draw analysis →
          </Link>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <th className="pb-2 pr-4 font-medium">Draw #</th>
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Stream / Category</th>
              <th className="pb-2 pr-4 font-medium text-right">Cutoff CRS</th>
              <th className="pb-2 font-medium text-right">Invitations</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {displayedDraws.map((draw) => {
              const change = getCrsChange(draw, sortedAllDraws)
              return (
                <tr key={draw.drawNumber} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40">
                  <td className="py-3 pr-4 font-mono font-semibold text-slate-900 dark:text-slate-100">
                    {draw.url ? (
                      <a
                        href={draw.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
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
    </Section>
  )
}
