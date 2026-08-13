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
import type { ClassCode, Draw, DrawMatchResult } from '../types/api'
import { CLASS_CODES, CLASS_NAMES } from '../types/api'
import { computeDrawMatch } from '../utils/matcher'
import { useMediaQuery } from '../hooks/useMediaQuery'

const TIMEFRAME_OPTIONS = [
  { label: 'Last 6 Months', value: 6 },
  { label: 'Last 12 Months', value: 12 },
  { label: 'Last 24 Months', value: 24 },
  { label: 'All Time', value: 0 },
]

const SCORE_PRESETS = [480, 500, 515, 530, 560]

export function CrsMatcherPage() {
  const [allDraws, setAllDraws] = useState<Draw[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [score, setScore] = useState<number>(510)
  const [selectedClass, setSelectedClass] = useState<ClassCode | ''>('CEC')
  const [timeframeMonths, setTimeframeMonths] = useState<number>(12)

  const isNarrow = useMediaQuery('(max-width: 639px)')

  useEffect(() => {
    let cancelled = false
    async function loadData() {
      try {
        setLoading(true)
        setError(null)
        const draws = await api.draws.all()
        if (!cancelled) {
          setAllDraws(draws)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load draw data')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    loadData()
    return () => {
      cancelled = true
    }
  }, [])

  const matchResult: DrawMatchResult = useMemo(() => {
    return computeDrawMatch(allDraws, score, selectedClass, timeframeMonths)
  }, [allDraws, score, selectedClass, timeframeMonths])

  // Domain for the visual gauge below - spans whichever is wider, the user's score or the
  // cutoff values, with padding, so the score pin and cutoff ticks share one coordinate
  // system. Without this the pin position was computed from a fixed /700 scale that had no
  // relationship to the cutoff markers, so moving the score just slid the whole bar instead
  // of showing where it actually falls relative to the cutoffs.
  const gaugeDomain = useMemo(() => {
    const cutoffValues = [matchResult.minCutoff, matchResult.averageCutoff, matchResult.latestCutoff, matchResult.maxCutoff]
      .filter((v): v is number => v !== null)
    const values = [...cutoffValues, score]
    const rawMin = Math.min(...values)
    const rawMax = Math.max(...values)
    const padding = Math.max(20, (rawMax - rawMin) * 0.15)
    const min = Math.max(0, rawMin - padding)
    const max = rawMax + padding
    return { min, max }
  }, [matchResult.minCutoff, matchResult.averageCutoff, matchResult.latestCutoff, matchResult.maxCutoff, score])

  const toGaugePercent = (value: number) =>
    Math.max(0, Math.min(100, ((value - gaugeDomain.min) / (gaugeDomain.max - gaugeDomain.min)) * 100))

  const scoreAboveAverageCutoff = (matchResult.scoreGapAverage ?? 0) >= 0

  const latestPoolDraw = useMemo(() => {
    return [...allDraws].reverse().find((d) => {
      const rawTotal = d.poolTotal || ((d as unknown as Record<string, unknown>).dd18 as string)
      return rawTotal && Number(rawTotal.replace(/,/g, '')) > 0
    })
  }, [allDraws])

  const poolTotalNum = useMemo(() => {
    if (!latestPoolDraw) return 0
    const raw = latestPoolDraw.poolTotal || ((latestPoolDraw as unknown as Record<string, unknown>).dd18 as string)
    return raw ? Number(raw.replace(/,/g, '')) || 0 : 0
  }, [latestPoolDraw])

  const userBracket = useMemo(() => {
    if (score >= 601) return '601–1200'
    if (score >= 501) return '501–600'
    if (score >= 491) return '491–500'
    if (score >= 481) return '481–490'
    if (score >= 471) return '471–480'
    if (score >= 461) return '461–470'
    if (score >= 451) return '451–460'
    if (score >= 441) return '441–450'
    if (score >= 431) return '431–440'
    if (score >= 421) return '421–430'
    if (score >= 411) return '411–420'
    if (score >= 401) return '401–410'
    if (score >= 351) return '351–400'
    if (score >= 301) return '301–350'
    return '0–300'
  }, [score])

  const poolChartData = useMemo(() => {
    if (!latestPoolDraw) return []
    const dist = (latestPoolDraw.poolDistribution as Record<string, string>) || {}
    const raw = latestPoolDraw as unknown as Record<string, unknown>
    const getVal = (key: string, fallbackKey: string) => {
      const v = dist[key] || (raw[fallbackKey] as string) || '0'
      return Number(v.toString().replace(/,/g, '')) || 0
    }

    const brackets = [
      { label: '601–1200', count: getVal('601-1200', 'dd1') },
      { label: '501–600', count: getVal('501-600', 'dd2') },
      { label: '491–500', count: getVal('491-500', 'dd4') },
      { label: '481–490', count: getVal('481-490', 'dd5') },
      { label: '471–480', count: getVal('471-480', 'dd6') },
      { label: '461–470', count: getVal('461-470', 'dd7') },
      { label: '451–460', count: getVal('451-460', 'dd8') },
      { label: '441–450', count: getVal('441-450', 'dd10') },
      { label: '431–440', count: getVal('431-440', 'dd11') },
      { label: '421–430', count: getVal('421-430', 'dd12') },
      { label: '411–420', count: getVal('411-420', 'dd13') },
      { label: '401–410', count: getVal('401-410', 'dd14') },
      { label: '351–400', count: getVal('351-400', 'dd15') },
      { label: '301–350', count: getVal('301-350', 'dd16') },
      { label: '0–300', count: getVal('0-300', 'dd17') },
    ]

    return brackets.map((b) => ({
      ...b,
      percentage: poolTotalNum > 0 ? parseFloat(((b.count / poolTotalNum) * 100).toFixed(1)) : 0,
      isUserBracket: b.label === userBracket,
    }))
  }, [latestPoolDraw, poolTotalNum, userBracket])

  const candidatesHigherThanUser = useMemo(() => {
    if (!poolChartData.length) return 0
    let higherCount = 0
    for (const b of poolChartData) {
      if (b.label === userBracket) break
      higherCount += b.count
    }
    return higherCount
  }, [poolChartData, userBracket])

  const chanceColorMap = {
    High: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      border: 'border-emerald-200 dark:border-emerald-800',
      text: 'text-emerald-700 dark:text-emerald-300',
      badge: 'bg-emerald-500 text-white',
    },
    Moderate: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      border: 'border-amber-200 dark:border-amber-800',
      text: 'text-amber-700 dark:text-amber-300',
      badge: 'bg-amber-500 text-white',
    },
    Low: {
      bg: 'bg-orange-50 dark:bg-orange-950/40',
      border: 'border-orange-200 dark:border-orange-800',
      text: 'text-orange-700 dark:text-orange-300',
      badge: 'bg-orange-500 text-white',
    },
    Unlikely: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      border: 'border-rose-200 dark:border-rose-800',
      text: 'text-rose-700 dark:text-rose-300',
      badge: 'bg-rose-500 text-white',
    },
  }

  const currentTheme = chanceColorMap[matchResult.chanceLevel]

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="space-y-4">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Express Entry CRS Eligibility Matcher
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Evaluate your Comprehensive Ranking System (CRS) score against historical Express Entry draws, calculate your ITA match probability, and view score gap insights.
          </p>
        </div>

        {/* How it works & How to use guide */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-800/40 text-xs text-slate-700 dark:text-slate-300 space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* How to use */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                How to Use This Tool
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-800 dark:text-slate-200">Enter your CRS score</strong> using the input field, range slider, or quick presets.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Select your target stream</strong> (e.g., Canadian Experience Class, French, STEM, or All Streams).</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Set a timeframe filter</strong> (e.g., Last 12 Months) to analyze your chances against recent trends.</li>
              </ol>
            </div>

            {/* How we compute */}
            <div className="space-y-1.5">
              <h3 className="font-bold text-slate-700 dark:text-slate-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                How We Compute Your Eligibility
              </h3>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400">
                <li><strong className="text-slate-800 dark:text-slate-200">Match Rate:</strong> The percentage of official IRCC draws in your selected window where <code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Your Score ≥ Draw Cutoff</code>.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Score Gaps:</strong> Point differential (<code className="font-mono bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">Your Score - Cutoff</code>) comparing your score to latest, min, max, and average cutoffs.</li>
                <li><strong className="text-slate-800 dark:text-slate-200">Draw Badges:</strong> Every past draw is annotated with <span className="font-semibold text-emerald-600 dark:text-emerald-400">✅ Qualified</span> (received an ITA) or <span className="font-semibold text-rose-600 dark:text-rose-400">❌ Missed</span>.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
          Loading draw data for eligibility calculations...
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          {/* Controls Card */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Score Input & Slider */}
              <div className="space-y-3">
                <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Your Current CRS Score: <span className="text-brand-600 dark:text-brand-400 font-mono text-lg">{score}</span>
                </label>
                {/* On mobile: stack slider and number input vertically */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <input
                    type="range"
                    min="1"
                    max="1200"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="h-2 w-full accent-brand-600 cursor-pointer rounded-lg bg-slate-200 dark:bg-slate-700 sm:flex-1"
                  />
                  <input
                    type="number"
                    min="1"
                    max="1200"
                    value={score}
                    onChange={(e) => setScore(Math.max(1, Math.min(1200, Number(e.target.value) || 1)))}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-center font-mono text-sm font-semibold text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 sm:w-24"
                  />
                </div>
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Quick presets:</span>
                  {SCORE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setScore(preset)}
                      className={`min-h-[40px] rounded-md px-2.5 py-1.5 text-xs font-mono font-medium transition-colors ${
                        score === preset
                          ? 'bg-brand-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Class & Timeframe Selectors */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Target Express Entry Stream:
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value as ClassCode | '')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  >
                    <option value="">All Streams / Categories</option>
                    {CLASS_CODES.map((code) => (
                      <option key={code} value={code}>
                        {code} — {CLASS_NAMES[code]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">
                    Timeframe Filter:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TIMEFRAME_OPTIONS.map((tf) => (
                      <button
                        key={tf.value}
                        type="button"
                        onClick={() => setTimeframeMonths(tf.value)}
                        className={`min-h-[40px] rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                          timeframeMonths === tf.value
                            ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700'
                        }`}
                      >
                        {tf.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Match Verdict Banner */}
          <div className={`rounded-2xl border p-5 sm:p-6 ${currentTheme.bg} ${currentTheme.border}`}>
            {/* Stacks vertically on mobile, side-by-side on sm+ */}
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${currentTheme.badge}`}>
                    {matchResult.chanceLevel} Chance
                  </span>
                  <h3 className={`text-xl font-bold ${currentTheme.text}`}>
                    {matchResult.matchRatePercentage}% Match Rate
                  </h3>
                </div>
                <p className="mt-2 text-sm text-slate-700 dark:text-slate-300">
                  With a score of <span className="font-bold">{score}</span> in{' '}
                  <span className="font-bold">{matchResult.className}</span>, you would have qualified for{' '}
                  <span className="font-bold">{matchResult.qualifyingDrawsCount}</span> out of{' '}
                  <span className="font-bold">{matchResult.totalDraws}</span> draws over the selected timeframe.
                </p>
              </div>

              <div className="flex flex-col sm:items-end sm:text-right">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Latest Cutoff Gap
                </span>
                <span
                  className={`text-2xl font-black font-mono ${
                    (matchResult.scoreGapLatest ?? 0) >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {(matchResult.scoreGapLatest ?? 0) >= 0 ? `+${matchResult.scoreGapLatest}` : matchResult.scoreGapLatest} pts
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Latest draw cutoff: {matchResult.latestCutoff ?? 'N/A'}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">ITA Qualification Rate</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {matchResult.qualifyingDrawsCount} / {matchResult.totalDraws}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">draws met or exceeded score</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Average Cutoff Gap</span>
              <p className={`mt-1 text-2xl font-bold font-mono ${
                (matchResult.scoreGapAverage ?? 0) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {(matchResult.scoreGapAverage ?? 0) >= 0 ? `+${matchResult.scoreGapAverage}` : matchResult.scoreGapAverage} pts
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">vs average cutoff ({matchResult.averageCutoff ?? 'N/A'})</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Percentile Rank</span>
              <p className="mt-1 text-2xl font-bold text-brand-600 dark:text-brand-400 font-mono">
                Top {100 - matchResult.percentileRank}%
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">ahead of {matchResult.percentileRank}% of cutoffs</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Cutoff Range</span>
              <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                {matchResult.minCutoff ?? '-'} — {matchResult.maxCutoff ?? '-'}
              </p>
              <span className="text-xs text-slate-500 dark:text-slate-400">min to max historic cutoffs</span>
            </div>
          </div>

          {/* Visual Score Meter & Recommendations */}
          <div className="grid gap-6 md:grid-cols-3">
            {/* Visual Gauge */}
            <div className="md:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Visual Score Position relative to Cutoffs
              </h4>
              <div className="space-y-6 pt-2">
                {/* Visual Bar */}
                <div className="relative pt-9">
                  {/* Score label - floats above the track so it never covers the cutoff zone/ticks */}
                  <div
                    className="absolute top-0 flex -translate-x-1/2 flex-col items-center transition-all duration-300"
                    style={{ left: `${Math.max(8, Math.min(92, toGaugePercent(score)))}%` }}
                  >
                    <span
                      className={`rounded-md px-2 py-0.5 font-mono text-xs font-bold text-white shadow-xs ${
                        scoreAboveAverageCutoff ? 'bg-emerald-600' : 'bg-brand-600'
                      }`}
                    >
                      You: {score}
                    </span>
                    <div className={`h-3 w-0.5 ${scoreAboveAverageCutoff ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-brand-600 dark:bg-brand-400'}`} />
                  </div>

                  <div className="relative h-6 w-full rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {/* Historic cutoff range - colour overlay spanning min -> max cutoff */}
                    {matchResult.minCutoff !== null && matchResult.maxCutoff !== null && (
                      <div
                        className="absolute top-0 bottom-0 rounded-full bg-sky-500/20 dark:bg-sky-400/20"
                        style={{
                          left: `${toGaugePercent(matchResult.minCutoff)}%`,
                          width: `${toGaugePercent(matchResult.maxCutoff) - toGaugePercent(matchResult.minCutoff)}%`,
                        }}
                        title={`Historic cutoff range: ${matchResult.minCutoff}-${matchResult.maxCutoff}`}
                      />
                    )}
                    {/* Cutoff tick marks - each its own colour so they stay distinguishable even when close together */}
                    {matchResult.minCutoff !== null && (
                      <div
                        className="absolute -top-1 -bottom-1 w-0.5 bg-slate-400 dark:bg-slate-500"
                        style={{ left: `${toGaugePercent(matchResult.minCutoff)}%` }}
                        title={`Minimum cutoff: ${matchResult.minCutoff}`}
                      />
                    )}
                    {matchResult.averageCutoff !== null && (
                      <div
                        className="absolute -top-1 -bottom-1 w-0.5 bg-amber-500 dark:bg-amber-400"
                        style={{ left: `${toGaugePercent(matchResult.averageCutoff)}%` }}
                        title={`Average cutoff: ${matchResult.averageCutoff}`}
                      />
                    )}
                    {matchResult.latestCutoff !== null && (
                      <div
                        className="absolute -top-1 -bottom-1 w-0.5 bg-violet-500 dark:bg-violet-400"
                        style={{ left: `${toGaugePercent(matchResult.latestCutoff)}%` }}
                        title={`Latest cutoff: ${matchResult.latestCutoff}`}
                      />
                    )}
                    {/* Score marker - precise dot on the track, label lives above */}
                    <div
                      className={`absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-xs transition-all duration-300 dark:border-slate-900 ${
                        scoreAboveAverageCutoff ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-brand-600 dark:bg-brand-400'
                      }`}
                      style={{ left: `${toGaugePercent(score)}%` }}
                    />
                  </div>
                </div>

                {/* Benchmark Markers */}
                <div className="grid grid-cols-3 text-center text-xs border-t border-slate-100 pt-3 dark:border-slate-800">
                  <div>
                    <span className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-500" />
                      Minimum Cutoff
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{matchResult.minCutoff ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                      Average Cutoff
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{matchResult.averageCutoff ?? 'N/A'}</span>
                  </div>
                  <div>
                    <span className="flex items-center justify-center gap-1.5 text-slate-400 font-medium">
                      <span className="h-2 w-2 rounded-full bg-violet-500 dark:bg-violet-400" />
                      Latest Cutoff
                    </span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">{matchResult.latestCutoff ?? 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-3">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Actionable Score Guidance
              </h4>
              <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
                {matchResult.recommendations.pointsToLatest > 0 ? (
                  <div className="rounded-lg bg-amber-50 p-3 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    <span className="font-semibold block mb-0.5">➕ Need +{matchResult.recommendations.pointsToLatest} pts for Latest Draw</span>
                    Increasing your score to {matchResult.latestCutoff} would qualify you for the most recent draw.
                  </div>
                ) : (
                  <div className="rounded-lg bg-emerald-50 p-3 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <span className="font-semibold block mb-0.5">✅ Qualified for Latest Draw</span>
                    Your score exceeds the most recent cutoff of {matchResult.latestCutoff}.
                  </div>
                )}

                <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <span className="font-semibold block mb-0.5">💡 Strategy Tip:</span>
                  Consider retaking language tests (IELTS/CELPIP/TEF) for CLB 9+ or pursuing category-based targeted draws (French, STEM, Healthcare) to drastically lower cutoff requirements.
                </div>
              </div>
            </div>
          </div>

          {/* Active Express Entry Candidate Pool Position Chart */}
          {poolChartData.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-2 sm:p-6 sm:space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                <div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>📊</span> Your Position in Active Express Entry Pool
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Snapshot as of {latestPoolDraw?.poolDistributionAsOn || latestPoolDraw?.date} ({poolTotalNum.toLocaleString()} Active Candidates)
                  </p>
                </div>

                <div className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                  Your Score ({score}) is in the <span className="underline font-mono">{userBracket}</span> Bracket
                </div>
              </div>

              {/* Pool Competitiveness Banner */}
              <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-700 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <strong className="text-slate-800 dark:text-slate-200 block text-sm font-mono">
                    {candidatesHigherThanUser.toLocaleString()} candidates in higher score brackets
                  </strong>
                  <span>
                    Only {poolTotalNum > 0 ? ((candidatesHigherThanUser / poolTotalNum) * 100).toFixed(1) : 0}% of active Express Entry profiles score in higher score ranges than your CRS of {score}.
                  </span>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={poolChartData} margin={{ top: 15, right: 10, left: 10, bottom: isNarrow ? 40 : 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis
                      dataKey="label"
                      interval={0}
                      angle={-45}
                      textAnchor="end"
                      tick={{ fontSize: 10 }}
                      height={50}
                    />
                    <YAxis tick={{ fontSize: isNarrow ? 9 : 10 }} />
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
                      {poolChartData.map((entry) => {
                        let fill = '#64748b' // default slate
                        if (entry.isUserBracket) {
                          fill = '#f59e0b' // bright amber for user bracket
                        } else if (entry.label === '601–1200' || entry.label === '501–600') {
                          fill = '#6366f1' // indigo
                        } else if (entry.label.startsWith('4')) {
                          fill = '#3b82f6' // blue
                        }
                        return (
                          <Cell
                            key={entry.label}
                            fill={fill}
                            stroke={entry.isUserBracket ? '#b45309' : undefined}
                            strokeWidth={entry.isUserBracket ? 2 : 0}
                          />
                        )
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-amber-500 border border-amber-600 inline-block" /> 📍 Your Score Bracket ({userBracket})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-indigo-500 inline-block" /> High CRS (501–1200)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-3 w-3 rounded-xs bg-blue-500 inline-block" /> Mid CRS (401–500)
                </span>
              </div>
            </div>
          )}

          {/* Historical Qualification Breakdown Table */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Historical Draws Breakdown ({matchResult.draws.length} Draws)
              </h4>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Sorted newest first
              </span>
            </div>

            {/* ── Desktop table (sm+) ── */}
            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="border-b border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-800 dark:text-slate-300 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Draw #</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Stream / Class</th>
                    <th className="px-4 py-3 text-right">Cutoff CRS</th>
                    <th className="px-4 py-3 text-right">Your Gap</th>
                    <th className="px-4 py-3 text-right">ITAs Issued</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {matchResult.draws.map((d, i) => (
                    <tr key={`${d.drawNumber}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-3 font-sans">
                        {d.qualified ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            ✅ Qualified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                            ❌ Missed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-slate-100">
                        {d.url ? (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                          >
                            #{d.drawNumber} <span className="text-[10px]">↗</span>
                          </a>
                        ) : (
                          `#${d.drawNumber}`
                        )}
                      </td>
                      <td className="px-4 py-3 font-sans text-slate-600 dark:text-slate-400">{d.date}</td>
                      <td className="px-4 py-3 font-sans text-slate-800 dark:text-slate-200">{d.class}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-slate-100">{d.crs}</td>
                      <td className={`px-4 py-3 text-right font-bold ${d.gap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {d.gap >= 0 ? `+${d.gap}` : d.gap}
                      </td>
                      <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-400">{d.drawSize}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ── Mobile card list (below sm) ── */}
            <div className="divide-y divide-slate-100 dark:divide-slate-800 sm:hidden">
              {matchResult.draws.map((d, i) => (
                <div key={`${d.drawNumber}-${i}`} className="py-3 space-y-2">
                  {/* Status badge */}
                  {d.qualified ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      ✅ Qualified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                      ❌ Missed
                    </span>
                  )}
                  {/* Draw # + Date */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {d.url ? (
                        <a
                          href={d.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-800 dark:text-brand-400 dark:hover:text-brand-300"
                        >
                          #{d.drawNumber} <span className="text-[10px]">↗</span>
                        </a>
                      ) : (
                        `#${d.drawNumber}`
                      )}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{d.date}</span>
                  </div>
                  {/* Stream */}
                  <div className="text-sm text-slate-700 dark:text-slate-200">{d.class}</div>
                  {/* CRS gap + ITAs */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100">CRS {d.crs}</span>
                      <span className={`font-mono font-bold ${d.gap >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                        {d.gap >= 0 ? `+${d.gap}` : d.gap} pts
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{d.drawSize} ITAs</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
