import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api } from '../api/client'
import type { Draw, PoolDistribution } from '../types/api'
import { useMediaQuery } from '../hooks/useMediaQuery'

interface BracketPoint {
  bracket: string
  count: number
  percentage: number
}

const BRACKET_KEYS: Array<{ key: keyof PoolDistribution; label: string; group: 'high' | 'mid' | 'low' }> = [
  { key: '601-1200', label: '601–1200', group: 'high' },
  { key: '501-600', label: '501–600', group: 'high' },
  { key: '491-500', label: '491–500', group: 'mid' },
  { key: '481-490', label: '481–490', group: 'mid' },
  { key: '471-480', label: '471–480', group: 'mid' },
  { key: '461-470', label: '461–470', group: 'mid' },
  { key: '451-460', label: '451–460', group: 'mid' },
  { key: '441-450', label: '441–450', group: 'mid' },
  { key: '431-440', label: '431–440', group: 'mid' },
  { key: '421-430', label: '421–430', group: 'mid' },
  { key: '411-420', label: '411–420', group: 'mid' },
  { key: '401-410', label: '401–410', group: 'mid' },
  { key: '351-400', label: '351–400', group: 'low' },
  { key: '301-350', label: '301–350', group: 'low' },
  { key: '0-300', label: '0–300', group: 'low' },
]

function parseNum(val?: string): number {
  if (!val) return 0
  return Number(val.replace(/,/g, '')) || 0
}

export function PoolDistributionPage() {
  const [draws, setDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>(0)

  const isNarrow = useMediaQuery('(max-width: 639px)')

  useEffect(() => {
    let cancelled = false
    async function loadDraws() {
      try {
        setLoading(true)
        setError(null)
        const res = await api.draws.latest(20)
        if (!cancelled) {
          setDraws(res)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to fetch draw distribution')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadDraws()
    return () => {
      cancelled = true
    }
  }, [])

  const selectedDraw = draws[selectedIndex] || draws[0]

  const poolTotalNum = useMemo(() => {
    if (!selectedDraw) return 0
    const rawTotal = selectedDraw.poolTotal || (selectedDraw as unknown as Record<string, unknown>).dd18 as string
    return parseNum(rawTotal)
  }, [selectedDraw])

  const distData: Record<string, string> = useMemo(() => {
    if (!selectedDraw) return {}
    if (selectedDraw.poolDistribution) {
      return selectedDraw.poolDistribution as Record<string, string>
    }
    const raw = selectedDraw as unknown as Record<string, unknown>
    if (raw.dd18 || raw.dd1) {
      // dd1-dd17 partition into 15 non-overlapping brackets covering 0-1200 - dd3 and dd9 are
      // not part of that partition (see the matching fix in the backend's irccDrawScraper.js)
      // and are intentionally left out here rather than exposed under overlapping labels.
      return {
        '601-1200': (raw.dd1 as string) || '0',
        '501-600': (raw.dd2 as string) || '0',
        '491-500': (raw.dd4 as string) || '0',
        '481-490': (raw.dd5 as string) || '0',
        '471-480': (raw.dd6 as string) || '0',
        '461-470': (raw.dd7 as string) || '0',
        '451-460': (raw.dd8 as string) || '0',
        '441-450': (raw.dd10 as string) || '0',
        '431-440': (raw.dd11 as string) || '0',
        '421-430': (raw.dd12 as string) || '0',
        '411-420': (raw.dd13 as string) || '0',
        '401-410': (raw.dd14 as string) || '0',
        '351-400': (raw.dd15 as string) || '0',
        '301-350': (raw.dd16 as string) || '0',
        '0-300': (raw.dd17 as string) || '0',
      }
    }
    return {}
  }, [selectedDraw])

  const chartData: BracketPoint[] = useMemo(() => {
    if (!distData || Object.keys(distData).length === 0) return []
    return BRACKET_KEYS.map(({ key, label }) => {
      const cnt = parseNum(distData[key])
      const pct = poolTotalNum > 0 ? parseFloat(((cnt / poolTotalNum) * 100).toFixed(1)) : 0
      return {
        bracket: label,
        count: cnt,
        percentage: pct,
      }
    })
  }, [distData, poolTotalNum])

  const highPoolCount = useMemo(() => {
    if (!distData) return 0
    return parseNum(distData['601-1200']) + parseNum(distData['501-600'])
  }, [distData])

  const highMidPoolCount = useMemo(() => {
    if (!distData) return 0
    return parseNum(distData['451-500'])
  }, [distData])

  const midLowPoolCount = useMemo(() => {
    if (!distData) return 0
    return parseNum(distData['401-450'])
  }, [distData])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            📊 Express Entry Candidate Pool Distribution
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Active candidate profile counts broken down by CRS score brackets in the Express Entry pool.
          </p>
        </div>

        {draws.length > 0 && (
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400">Snapshot Draw:</label>
            <select
              value={selectedIndex}
              onChange={(e) => setSelectedIndex(Number(e.target.value))}
              className="min-h-[40px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 font-mono"
            >
              {draws.map((d, i) => (
                <option key={d.drawNumber} value={i}>
                  #{d.drawNumber} ({d.date}) — {d.class}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading candidate pool distribution data...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && selectedDraw && (
        <>
          {/* Overview Banner */}
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50/60 p-6 dark:border-indigo-950/60 dark:bg-indigo-950/20">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Pool Snapshot as of {selectedDraw.poolDistributionAsOn || selectedDraw.date}
                </span>
                <h3 className="mt-1 text-2xl font-black font-mono text-slate-900 dark:text-slate-100">
                  {selectedDraw.poolTotal || poolTotalNum.toLocaleString()} Active Candidates
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                  Recorded during Draw #{selectedDraw.drawNumber} ({selectedDraw.class}) • CRS Cutoff: {selectedDraw.crs}
                </p>
              </div>

              {selectedDraw.url && (
                <a
                  href={selectedDraw.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition-colors"
                >
                  Official IRCC Page ↗
                </a>
              )}
            </div>
          </div>

          {/* Key Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">High Scores (501–1200)</span>
              <p className="mt-1 text-2xl font-bold font-mono text-indigo-600 dark:text-indigo-400">
                {highPoolCount.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {poolTotalNum > 0 ? ((highPoolCount / poolTotalNum) * 100).toFixed(1) : 0}% of total pool
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mid-High Scores (451–500)</span>
              <p className="mt-1 text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                {highMidPoolCount.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {poolTotalNum > 0 ? ((highMidPoolCount / poolTotalNum) * 100).toFixed(1) : 0}% of total pool
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Mid-Low Scores (401–450)</span>
              <p className="mt-1 text-2xl font-bold font-mono text-slate-700 dark:text-slate-300">
                {midLowPoolCount.toLocaleString()}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {poolTotalNum > 0 ? ((midLowPoolCount / poolTotalNum) * 100).toFixed(1) : 0}% of total pool
              </span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Under 400 Scores</span>
              <p className="mt-1 text-2xl font-bold font-mono text-slate-500 dark:text-slate-400">
                {chartData
                  .filter((d) => d.bracket === '351–400' || d.bracket === '301–350' || d.bracket === '0–300')
                  .reduce((acc, curr) => acc + curr.count, 0)
                  .toLocaleString()}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">lower CRS brackets</span>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Candidate Count by CRS Score Bracket
            </h4>
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: isNarrow ? 40 : 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis
                    dataKey="bracket"
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    tick={{ fontSize: 11 }}
                    height={60}
                  />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(value) => {
                      const num = Number(value) || 0
                      return [
                        `${num.toLocaleString()} candidates (${poolTotalNum > 0 ? ((num / poolTotalNum) * 100).toFixed(1) : 0}%)`,
                        'Candidates',
                      ]
                    }}
                    labelStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry) => {
                      let color = '#64748b' // default slate
                      if (entry.bracket === '601–1200' || entry.bracket === '501–600') {
                        color = '#6366f1' // indigo
                      } else if (entry.bracket.startsWith('4')) {
                        color = '#3b82f6' // blue
                      }
                      return <Cell key={entry.bracket} fill={color} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Score Bracket Breakdown Table
            </h4>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">CRS Score Bracket</th>
                    <th className="px-4 py-3 text-right">Active Candidates</th>
                    <th className="px-4 py-3 text-right">% of Pool</th>
                    <th className="px-4 py-3">Pool Share Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {chartData.map((row) => (
                    <tr key={row.bracket} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-sans font-bold text-slate-900 dark:text-slate-100">
                        {row.bracket}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {row.count.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400 font-bold">
                        {row.percentage}%
                      </td>
                      <td className="px-4 py-3">
                        <div className="h-2.5 w-full max-w-xs rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className="h-full rounded-full bg-indigo-500"
                            style={{ width: `${Math.min(100, row.percentage * 3)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
