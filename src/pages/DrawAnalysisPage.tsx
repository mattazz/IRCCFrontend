import { useCallback, useMemo, useState } from 'react'
import {
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
import { Section } from '../components/Section'
import { filterDrawsByClass } from '../utils/draws'
import { computeRollingAverage } from '../utils/rollingAverage'
import { CLASS_CODES, CLASS_NAMES, type ClassCode, type Draw } from '../types/api'

type Metric = 'crs' | 'invitations' | 'both'

const CRS_COLOR = '#3b82f6' // blue-500
const INVITATIONS_COLOR = '#10b981' // emerald-500
const ROLLING_AVERAGE_COLOR = '#f59e0b' // amber-500

const METRIC_OPTIONS: { value: Metric; label: string }[] = [
  { value: 'crs', label: 'CRS score' },
  { value: 'invitations', label: 'Invitations' },
  { value: 'both', label: 'Both' },
]

const WINDOW_OPTIONS = [3, 4, 6, 8, 12]

interface ChartPoint {
  date: string
  crs: number
  invitations: number
  drawSize: string
  class: string
  rollingAverage?: number
}

function ChartTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload?.length) return null
  const point = payload[0].payload as ChartPoint

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm shadow-md dark:border-slate-700 dark:bg-slate-800">
      <p className="font-medium text-slate-900 dark:text-slate-100">{point.date}</p>
      <p className="text-slate-500 dark:text-slate-400">{point.class}</p>
      <p className="mt-1 text-slate-700 dark:text-slate-200">
        CRS: <span className="font-semibold">{point.crs}</span>
      </p>
      <p className="text-slate-700 dark:text-slate-200">
        Invitations: <span className="font-semibold">{point.drawSize}</span>
      </p>
      {point.rollingAverage !== undefined && (
        <p className="text-slate-700 dark:text-slate-200">
          Rolling avg: <span className="font-semibold">{point.rollingAverage}</span>
        </p>
      )}
    </div>
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

export function DrawAnalysisPage() {
  const [selectedClass, setSelectedClass] = useState<ClassCode>('CEC')
  const [metric, setMetric] = useState<Metric>('crs')
  const [showRollingAverage, setShowRollingAverage] = useState(false)
  const [rollingWindow, setRollingWindow] = useState(4)

  // Fetched once - the full history doesn't depend on which class/metric is selected;
  // filtering and metric selection happen client-side so switching is instant, no refetch.
  const fetcher = useCallback(() => api.draws.all(), [])
  const { data, error, loading } = useApiData<Draw[]>(fetcher, [])

  const showCrs = metric === 'crs' || metric === 'both'
  const showInvitations = metric === 'invitations' || metric === 'both'
  const rollingAverageActive = showRollingAverage && showCrs

  const filteredDraws = useMemo(() => {
    if (!data) return []
    return filterDrawsByClass(data, selectedClass)
  }, [data, selectedClass])

  const rollingAverageByDate = useMemo(() => {
    if (!rollingAverageActive) return new Map<string, number>()
    const points = computeRollingAverage(filteredDraws, rollingWindow)
    return new Map(points.map((point) => [point.date, point.average]))
  }, [filteredDraws, rollingWindow, rollingAverageActive])

  const chartData: ChartPoint[] = useMemo(
    () =>
      filteredDraws.map((draw) => ({
        date: draw.date,
        crs: Number(draw.crs),
        invitations: Number(draw.drawSize.replace(/,/g, '')),
        drawSize: draw.drawSize,
        class: draw.class,
        rollingAverage: rollingAverageByDate.get(draw.date),
      })),
    [filteredDraws, rollingAverageByDate],
  )

  const stats = useMemo(() => {
    if (chartData.length === 0) return null
    const crsValues = chartData.map((d) => d.crs)
    const invitationsValues = chartData.map((d) => d.invitations)
    return {
      count: chartData.length,
      minCrs: Math.min(...crsValues),
      maxCrs: Math.max(...crsValues),
      avgCrs: Math.round((crsValues.reduce((sum, v) => sum + v, 0) / crsValues.length) * 10) / 10,
      totalInvitations: invitationsValues.reduce((sum, v) => sum + v, 0),
    }
  }, [chartData])

  return (
    <Section
      title={`${CLASS_NAMES[selectedClass]} — ${METRIC_OPTIONS.find((m) => m.value === metric)?.label} trend`}
      loading={loading}
      error={error}
      isEmpty={chartData.length === 0}
      emptyMessage="No draws found for this class."
      action={
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex overflow-hidden rounded-md border border-slate-300 dark:border-slate-700">
            {METRIC_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setMetric(opt.value)}
                className={`px-3 py-1 text-sm transition-colors ${
                  metric === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {showCrs && (
            <label className="flex items-center gap-1.5 text-sm text-slate-700 dark:text-slate-200">
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
              className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {WINDOW_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}-draw window
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value as ClassCode)}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {CLASS_CODES.map((code) => (
              <option key={code} value={code}>
                {CLASS_NAMES[code]}
              </option>
            ))}
          </select>
        </div>
      }
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12 }}
            className="fill-slate-500 dark:fill-slate-400"
            minTickGap={40}
          />

          {showCrs && (
            <YAxis
              yAxisId="crs"
              orientation="left"
              tick={{ fontSize: 12, fill: metric === 'both' ? CRS_COLOR : undefined }}
              className={metric === 'both' ? undefined : 'fill-slate-500 dark:fill-slate-400'}
              domain={['dataMin - 10', 'dataMax + 10']}
              width={48}
              label={metric === 'both' ? { value: 'CRS', angle: -90, position: 'insideLeft', fill: CRS_COLOR, fontSize: 12 } : undefined}
            />
          )}

          {showInvitations && (
            <YAxis
              yAxisId="invitations"
              orientation="right"
              tick={{ fontSize: 12, fill: metric === 'both' ? INVITATIONS_COLOR : undefined }}
              className={metric === 'both' ? undefined : 'fill-slate-500 dark:fill-slate-400'}
              domain={[0, 'dataMax + 500']}
              width={56}
              label={
                metric === 'both'
                  ? { value: 'Invitations', angle: 90, position: 'insideRight', fill: INVITATIONS_COLOR, fontSize: 12 }
                  : undefined
              }
            />
          )}

          <Tooltip content={ChartTooltip} />
          {(metric === 'both' || rollingAverageActive) && <Legend wrapperStyle={{ fontSize: 12 }} />}

          {showCrs && (
            <Line
              yAxisId="crs"
              type="monotone"
              dataKey="crs"
              stroke={CRS_COLOR}
              strokeWidth={2}
              dot={false}
              name="CRS score"
            />
          )}
          {showInvitations && (
            <Line
              yAxisId="invitations"
              type="monotone"
              dataKey="invitations"
              stroke={INVITATIONS_COLOR}
              strokeWidth={2}
              dot={false}
              name="Invitations"
            />
          )}
          {rollingAverageActive && (
            <Line
              yAxisId="crs"
              type="monotone"
              dataKey="rollingAverage"
              stroke={ROLLING_AVERAGE_COLOR}
              strokeWidth={2}
              strokeDasharray="6 3"
              dot={false}
              name={`${rollingWindow}-draw rolling avg`}
              connectNulls
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {stats && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <StatTile label="Draws" value={String(stats.count)} />
          <StatTile label="Min CRS" value={String(stats.minCrs)} />
          <StatTile label="Max CRS" value={String(stats.maxCrs)} />
          <StatTile label="Avg CRS" value={String(stats.avgCrs)} />
          <StatTile label="Total invitations" value={stats.totalInvitations.toLocaleString()} />
        </div>
      )}
    </Section>
  )
}
