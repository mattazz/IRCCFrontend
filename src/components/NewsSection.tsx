import { useCallback, useState } from 'react'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Section } from './Section'
import type { NewsItem } from '../types/api'

const LATEST = 'LATEST'
const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
// Backend's /news/:month only ever matches the current year (see rssParser.filterItemsByMonth
// in IRCCBackend) - there's no way to ask for a past year's articles, so the dropdown labels
// make that scope explicit rather than implying a full history.
const CURRENT_YEAR = new Date().getFullYear()

export function NewsSection() {
  const [selectedMonth, setSelectedMonth] = useState(LATEST)

  // "Latest" isn't a backend route on its own - /news/latest is locked to the current
  // calendar month server-side, which is too narrow here (see docs/DRAW_ANALYSIS_PLAN.md-style
  // investigation: an empty result there just means IRCC hasn't posted yet this month, not that
  // the feed is broken). /news/full returns the whole cached feed already sorted newest-first,
  // so slicing the first 10 client-side gives an actual "most recent" view.
  const fetcher = useCallback(
    () => (selectedMonth === LATEST ? api.news.full().then((items) => items.slice(0, 10)) : api.news.byMonth(selectedMonth)),
    [selectedMonth],
  )
  const { data, error, loading } = useApiData<NewsItem[]>(fetcher, [selectedMonth])

  return (
    <Section
      title="News"
      loading={loading}
      error={error}
      isEmpty={(data?.length ?? 0) === 0}
      emptyMessage={selectedMonth === LATEST ? 'No news posted yet.' : `No news posted in ${selectedMonth} ${CURRENT_YEAR}.`}
      action={
        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value={LATEST}>Latest 10</option>
          {MONTH_NAMES.map((month) => (
            <option key={month} value={month}>
              {month} {CURRENT_YEAR}
            </option>
          ))}
        </select>
      }
    >
      <ul className="space-y-3">
        {data?.map((item) => (
          <li key={item.link} className="border-b border-slate-100 pb-3 last:border-none last:pb-0 dark:border-slate-800">
            <a
              href={item.link}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 hover:underline dark:text-slate-100"
            >
              {item.title}
            </a>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {new Date(item.pubDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </li>
        ))}
      </ul>
    </Section>
  )
}
