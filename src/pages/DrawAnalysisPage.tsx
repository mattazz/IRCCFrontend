import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  Brush,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from 'recharts'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { useMediaQuery } from '../hooks/useMediaQuery'
import { Section } from '../components/Section'
import { filterDrawsByClass } from '../utils/draws'
import { getCrsChangeForDraw, type CrsChangeInfo } from '../utils/crsChange'
import { computeRollingAverage } from '../utils/rollingAverage'
import { sortByDate, filterByDateRange } from '../utils/dateOrder'
import { drawsToCsv } from '../utils/csv'
import { downloadBlob } from '../utils/download'
import { exportSvgAsPng } from '../utils/chartImage'
import { CLASS_CODES, CLASS_NAMES, type ClassCode, type Draw } from '../types/api'

type Metric = 'crs' | 'invitations' | 'both'
interface ChartRow {
  date: string
  [key: string]: string | number | undefined
}
// Tags each draw with the class code it was matched under (a draw can appear once per
// selected class it matches, if its class field mentions more than one), so cards/colors
// don't need to reverse-engineer a class code from the raw class text.
type TaggedDraw = Draw & { matchedClassCode: ClassCode }

const INVITATIONS_COLOR = '#10b981' // emerald-500

// Matches the backend's draws cache refresh interval (dataCache.js).
const DRAWS_REFETCH_INTERVAL_MS = 15 * 60 * 1000

// One color per class, reused for its line, rolling-average line, and chip. CEC stays blue
// to match the chart's original single-class default.
const CLASS_COLORS: Record<ClassCode, string> = {
  CEC: '#3b82f6', // blue-500
  FSW: '#10b981', // emerald-500
  FST: '#f59e0b', // amber-500
  PNP: '#ef4444', // red-500
  FLP: '#8b5cf6', // violet-500
  TO: '#06b6d4', // cyan-500
  HO: '#ec4899', // pink-500
  STEM: '#84cc16', // lime-500
  GEN: '#f97316', // orange-500
  TRAN: '#6366f1', // indigo-500
  AGRI: '#14b8a6', // teal-500
}

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'crs', label: 'CRS score' },
  { value: 'invitations', label: 'Invitations' },
  { value: 'both', label: 'Both' },
]

const WINDOW_OPTIONS = [3, 4, 6, 8, 12]

function ChartTooltip({ active, payload, label }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const numericEntries = payload.filter((entry) => typeof entry.value === 'number')
  if (numericEntries.length === 0) return null

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-md dark:border-slate-700 dark:bg-slate-800">
      <p className="font-medium text-slate-900 dark:text-slate-100">{label}</p>
      {numericEntries.map((entry) => (
        <p key={String(entry.dataKey)} className="mt-1" style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{entry.value}</span>
        </p>
      ))}
    </div>
  )
}

function ExportButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="min-h-[40px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
    >
      {children}
    </button>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-800/50">
      <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  )
}

function DrawCard({ draw, change }: { draw: TaggedDraw; change: CrsChangeInfo | null }) {
  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between gap-2">
        {draw.url ? (
          <a
            href={draw.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 inline-flex items-center gap-1"
          >
            Draw #{draw.drawNumber} <span className="text-[10px]">↗</span>
          </a>
        ) : (
          <span className="font-semibold text-slate-900 dark:text-slate-100">Draw #{draw.drawNumber}</span>
        )}
        <span
          className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: CLASS_COLORS[draw.matchedClassCode] }}
        >
          {draw.date}
        </span>
      </div>
      <p className="mt-1 font-medium text-slate-700 dark:text-slate-200">{draw.class}</p>
      {draw.subclass && draw.subclass !== draw.class && (
        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">{draw.subclass}</p>
      )}
      <div className="mt-2 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span>
            CRS: <span className="font-semibold text-slate-900 dark:text-slate-100">{draw.crs}</span>
          </span>
          {change && change.diff !== 0 && (
            <span
              className={`font-mono font-bold flex items-center gap-0.5 ${
                change.diff < 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
              title={`CRS change vs previous ${draw.matchedClassCode} draw (#${change.prevDrawNumber}, CRS ${change.prevCrs})`}
            >
              {change.diff < 0 ? '↓' : '↑'}
              {change.formatted} pts
            </span>
          )}
        </div>
        <span>
          Invitations: <span className="font-semibold text-slate-900 dark:text-slate-100">{draw.drawSize}</span>
        </span>
      </div>
    </div>
  )
}

export function DrawAnalysisPage() {
  const [selectedClasses, setSelectedClasses] = useState<ClassCode[]>(['CEC'])
  const [metric, setMetric] = useState<Metric>('crs')
  const [showRollingAverage, setShowRollingAverage] = useState(false)
  const [rollingWindow, setRollingWindow] = useState(4)
  const [brushRange, setBrushRange] = useState<{ startIndex: number; endIndex: number } | null>(null)
  const chartWrapperRef = useRef<HTMLDivElement>(null)
  // Below Tailwind's `sm` breakpoint - trims axis chrome (labels, widths) that would
  // otherwise crowd out the plot area on a phone-width dual-axis chart.
  const isNarrow = useMediaQuery('(max-width: 639px)')

  // Filtering, comparison, and metric selection all happen client-side so switching is
  // instant. Polled at the same cadence as the backend's draws cache refresh so a tab left
  // open picks up new draws without a manual reload.
  const { data, error, loading } = useApiData<Draw[]>(() => api.draws.all(), [], DRAWS_REFETCH_INTERVAL_MS)

  const isMultiClass = selectedClasses.length > 1
  // Comparing invitations (or both metrics) across multiple classes at once would need a
  // second axis per class - not legible. Multi-class comparison is CRS-only.
  const effectiveMetric: Metric = isMultiClass ? 'crs' : metric
  const showCrs = effectiveMetric === 'crs' || effectiveMetric === 'both'
  const showInvitations = !isMultiClass && (effectiveMetric === 'invitations' || effectiveMetric === 'both')
  const rollingAverageActive = showRollingAverage && showCrs

  function toggleClass(cls: ClassCode) {
    setSelectedClasses((prev) => {
      if (prev.includes(cls)) {
        const next = prev.filter((c) => c !== cls)
        return next.length === 0 ? prev : next // always keep at least one selected
      }
      return [...prev, cls]
    })
  }

  // The brush's start/endIndex point into chartData - reset the selection whenever the
  // underlying rows change shape, so a stale index range can't point at the wrong dates.
  useEffect(() => {
    setBrushRange(null)
  }, [selectedClasses, rollingAverageActive, rollingWindow])

  const chartData: ChartRow[] = useMemo(() => {
    if (!data) return []
    const byDate = new Map<string, ChartRow>()
    for (const cls of selectedClasses) {
      const classDraws = filterDrawsByClass(data, cls)
      const rollingByDate = rollingAverageActive
        ? new Map(computeRollingAverage(classDraws, rollingWindow).map((p) => [p.date, p.average]))
        : new Map<string, number>()
      for (const draw of classDraws) {
        const entry = byDate.get(draw.date) ?? { date: draw.date }
        entry[`${cls}_crs`] = Number(draw.crs)
        entry[`${cls}_invitations`] = Number(draw.drawSize.replace(/,/g, ''))
        const rollingValue = rollingByDate.get(draw.date)
        if (rollingValue !== undefined) entry[`${cls}_rollingAverage`] = rollingValue
        byDate.set(draw.date, entry)
      }
    }
    return sortByDate(Array.from(byDate.values()))
  }, [data, selectedClasses, rollingAverageActive, rollingWindow])

  // Flat list of actual draws (not merged-by-date rows) across all selected classes, for the
  // stats panel and detail cards - both want real Draw records, not chart-shaped rows. Tagged
  // with the class code each was matched under (see TaggedDraw) so cards can show the right
  // color without reverse-parsing the raw class text.
  const allDrawsSortedDesc = useMemo(() => {
    if (!data) return []
    return [...data].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime() || Number(b.drawNumber) - Number(a.drawNumber)
    )
  }, [data])

  const allSelectedDraws = useMemo<TaggedDraw[]>(() => {
    if (!data) return []
    return sortByDate(
      selectedClasses.flatMap((cls) => filterDrawsByClass(data, cls).map((draw) => ({ ...draw, matchedClassCode: cls }))),
    )
  }, [data, selectedClasses])

  const visibleDraws = useMemo(() => {
    if (!brushRange || chartData.length === 0) return allSelectedDraws
    const startDate = chartData[brushRange.startIndex]?.date
    const endDate = chartData[brushRange.endIndex]?.date
    if (!startDate || !endDate) return allSelectedDraws
    return filterByDateRange(allSelectedDraws, startDate, endDate)
  }, [allSelectedDraws, brushRange, chartData])

  // De-duplicated by drawNumber: a draw whose class field mentions more than one selected
  // class appears once per match in visibleDraws (intentional, for the cards), but should
  // only count once for stats and exports.
  const uniqueVisibleDraws = useMemo(
    () => Array.from(new Map(visibleDraws.map((d) => [d.drawNumber, d])).values()),
    [visibleDraws],
  )

  const stats = useMemo(() => {
    if (uniqueVisibleDraws.length === 0) return null
    const crsValues = uniqueVisibleDraws.map((d) => Number(d.crs))
    const invitationsValues = uniqueVisibleDraws.map((d) => Number(d.drawSize.replace(/,/g, '')))
    return {
      count: uniqueVisibleDraws.length,
      minCrs: Math.min(...crsValues),
      maxCrs: Math.max(...crsValues),
      avgCrs: Math.round((crsValues.reduce((sum, v) => sum + v, 0) / crsValues.length) * 10) / 10,
      totalInvitations: invitationsValues.reduce((sum, v) => sum + v, 0),
    }
  }, [uniqueVisibleDraws])

  // Shared by both exports, so the filename always reflects what's actually on screen:
  // selected classes, plus the brushed date range when one is active.
  const exportLabel = useMemo(() => {
    const classesPart = selectedClasses.length === CLASS_CODES.length ? 'all-classes' : selectedClasses.join('-')
    const rangePart =
      brushRange && chartData[brushRange.startIndex] && chartData[brushRange.endIndex]
        ? `_${chartData[brushRange.startIndex].date}_to_${chartData[brushRange.endIndex].date}`
        : ''
    return `${classesPart}${rangePart}`
  }, [selectedClasses, brushRange, chartData])

  function handleExportCsv() {
    const csv = drawsToCsv(uniqueVisibleDraws)
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `express-entry-draws_${exportLabel}.csv`)
  }

  async function handleExportPng() {
    const svg = chartWrapperRef.current?.querySelector('svg')
    if (!svg) return
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    await exportSvgAsPng(svg, `express-entry-draws-chart_${exportLabel}.png`, isDark ? '#0f172a' : '#ffffff')
  }

  const titleClasses =
    selectedClasses.length <= 3
      ? selectedClasses.map((c) => CLASS_NAMES[c]).join(', ')
      : `${selectedClasses.length} classes`
  const metricLabel = METRIC_OPTIONS.find((m) => m.value === effectiveMetric)?.label
  const showLegend = isMultiClass || rollingAverageActive || effectiveMetric === 'both'

  return (
    <Section
      title={`${titleClasses} — ${metricLabel} trend`}
      loading={loading}
      error={error}
      isEmpty={chartData.length === 0}
      emptyMessage="No draws found for this selection."
      action={
        <div className="flex flex-col gap-2">
          {/* Metric toggle + rolling average — stacks vertically on mobile */}
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <div className="inline-flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-700">
              {METRIC_OPTIONS.map((opt) => {
                const disabled = isMultiClass && opt.value !== 'crs'
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={disabled}
                    title={disabled ? 'Only available for a single class' : undefined}
                    onClick={() => setMetric(opt.value)}
                    className={`min-h-[40px] px-3 py-2 text-sm transition-colors ${
                      effectiveMetric === opt.value
                        ? 'bg-blue-600 text-white'
                        : disabled
                          ? 'cursor-not-allowed bg-white text-slate-300 dark:bg-slate-800 dark:text-slate-600'
                          : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {showCrs && (
                <label className="flex min-h-[40px] items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={showRollingAverage}
                    onChange={(e) => setShowRollingAverage(e.target.checked)}
                    className="accent-amber-500"
                  />
                  Rolling average
                </label>
              )}

              {rollingAverageActive && (
                <select
                  value={rollingWindow}
                  onChange={(e) => setRollingWindow(Number(e.target.value))}
                  className="min-h-[40px] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                >
                  {WINDOW_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}-draw window
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Class chip strip — scrollable on mobile to avoid wrapping chaos */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 snap-x">
            {CLASS_CODES.map((cls) => {
              const active = selectedClasses.includes(cls)
              return (
                <button
                  key={cls}
                  type="button"
                  title={CLASS_NAMES[cls]}
                  onClick={() => toggleClass(cls)}
                  style={
                    active
                      ? { backgroundColor: CLASS_COLORS[cls], borderColor: CLASS_COLORS[cls], color: 'white' }
                      : undefined
                  }
                  className={
                    active
                      ? 'min-h-[40px] shrink-0 snap-start rounded-full border px-3 py-2 text-xs font-medium transition-colors'
                      : 'min-h-[40px] shrink-0 snap-start rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                  }
                >
                  {cls}
                </button>
              )
            })}
          </div>

          {/* All / Reset — separate row so they don't sit in the scrollable strip */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedClasses([...CLASS_CODES])}
              className="min-h-[40px] rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              All
            </button>
            {isMultiClass && (
              <button
                type="button"
                onClick={() => setSelectedClasses(['CEC'])}
                className="min-h-[40px] rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      }
    >
      <div ref={chartWrapperRef} className="h-72 sm:h-96 md:h-[420px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: isNarrow ? 10 : 12 }}
              className="fill-slate-500 dark:fill-slate-400"
              minTickGap={isNarrow ? 60 : 40}
            />

            {showCrs && (
              <YAxis
                yAxisId="crs"
                orientation="left"
                tick={{ fontSize: isNarrow ? 10 : 12 }}
                className="fill-slate-500 dark:fill-slate-400"
                domain={['dataMin - 10', 'dataMax + 10']}
                width={isNarrow ? 32 : 48}
                label={
                  showLegend && !isNarrow ? { value: 'CRS', angle: -90, position: 'insideLeft', fontSize: 12 } : undefined
                }
              />
            )}

            {showInvitations && (
              <YAxis
                yAxisId="invitations"
                orientation="right"
                tick={{ fontSize: isNarrow ? 10 : 12, fill: effectiveMetric === 'both' ? INVITATIONS_COLOR : undefined }}
                className={effectiveMetric === 'both' ? undefined : 'fill-slate-500 dark:fill-slate-400'}
                domain={[0, 'dataMax + 500']}
                width={isNarrow ? 40 : 56}
                label={
                  effectiveMetric === 'both' && !isNarrow
                    ? { value: 'Invitations', angle: 90, position: 'insideRight', fill: INVITATIONS_COLOR, fontSize: 12 }
                    : undefined
                }
              />
            )}

            <Tooltip content={ChartTooltip} />
            {showLegend && <Legend wrapperStyle={{ fontSize: 12 }} />}

            {showCrs &&
              selectedClasses.map((cls) => (
                <Line
                  key={`${cls}-crs`}
                  yAxisId="crs"
                  type="monotone"
                  dataKey={`${cls}_crs`}
                  stroke={CLASS_COLORS[cls]}
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                  name={isMultiClass ? `${cls} CRS` : 'CRS score'}
                />
              ))}
            {showInvitations && (
              <Line
                yAxisId="invitations"
                type="monotone"
                dataKey={`${selectedClasses[0]}_invitations`}
                stroke={INVITATIONS_COLOR}
                strokeWidth={2}
                dot={false}
                connectNulls
                name="Invitations"
              />
            )}
            {rollingAverageActive &&
              selectedClasses.map((cls) => (
                <Line
                  key={`${cls}-rolling`}
                  yAxisId="crs"
                  type="monotone"
                  dataKey={`${cls}_rollingAverage`}
                  stroke={CLASS_COLORS[cls]}
                  strokeWidth={2}
                  strokeDasharray="6 3"
                  dot={false}
                  connectNulls
                  name={isMultiClass ? `${cls} ${rollingWindow}-draw avg` : `${rollingWindow}-draw rolling avg`}
                />
              ))}

            <Brush
              dataKey="date"
              height={isNarrow ? 24 : 32}
              travellerWidth={isNarrow ? 16 : 12}
              startIndex={brushRange?.startIndex}
              endIndex={brushRange?.endIndex}
              onChange={(range) => {
                if (range.startIndex === undefined || range.endIndex === undefined) return
                setBrushRange({ startIndex: range.startIndex, endIndex: range.endIndex })
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <ExportButton onClick={handleExportCsv}>Export CSV</ExportButton>
        <ExportButton onClick={handleExportPng}>Export PNG</ExportButton>
      </div>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5 [&>*:last-child]:col-span-2 sm:[&>*:last-child]:col-span-1">
          <StatTile label="Draws" value={String(stats.count)} />
          <StatTile label="Min CRS" value={String(stats.minCrs)} />
          <StatTile label="Max CRS" value={String(stats.maxCrs)} />
          <StatTile label="Avg CRS" value={String(stats.avgCrs)} />
          <StatTile label="Total invitations" value={stats.totalInvitations.toLocaleString()} />
        </div>
      )}

      {visibleDraws.length > 0 && (
        <div className="mt-4">
          <h3 className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">
            Draws in range ({visibleDraws.length}){' '}
            {!brushRange && (
              <span className="font-normal text-slate-500 dark:text-slate-400">
                — drag on the chart above to narrow the range
              </span>
            )}
          </h3>
          <div className="grid max-h-[480px] grid-cols-1 gap-3 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {[...visibleDraws].reverse().map((draw) => {
              const change = getCrsChangeForDraw(draw, allDrawsSortedDesc, draw.matchedClassCode)
              return (
                <DrawCard
                  key={`${draw.drawNumber}-${draw.matchedClassCode}`}
                  draw={draw}
                  change={change}
                />
              )
            })}
          </div>
        </div>
      )}
    </Section>
  )
}
