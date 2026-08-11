import { useCallback, useEffect, useState } from 'react'
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
// Matches the backend's MAX_KEYWORD_LENGTH (src/routes/api.js) - a longer query 400s anyway,
// this just stops the user from typing past the limit in the first place.
const MAX_SEARCH_LENGTH = 100
const SEARCH_DEBOUNCE_MS = 350

export function NewsSection() {
  const [selectedMonth, setSelectedMonth] = useState(LATEST)
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // /news/search hits the backend (and the rate limit) on every call, so debounce rather than
  // firing one request per keystroke.
  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(searchInput.trim()), SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timeout)
  }, [searchInput])

  const isSearching = debouncedSearch.length > 0

  // Search takes priority over the month filter rather than combining with it - the backend
  // has no route for "keyword within month", and stacking both would be a confusing UI for a
  // combination that doesn't actually narrow the news feed's ~50-item cache by much anyway.
  const fetcher = useCallback(() => {
    if (isSearching) return api.news.search(debouncedSearch)
    // "Latest" isn't a backend route on its own - /news/latest is locked to the current
    // calendar month server-side, which is too narrow here (an empty result there just means
    // IRCC hasn't posted yet this month, not that the feed is broken). /news/full returns the
    // whole cached feed already sorted newest-first, so slicing the first 10 client-side gives
    // an actual "most recent" view.
    return selectedMonth === LATEST ? api.news.full().then((items) => items.slice(0, 10)) : api.news.byMonth(selectedMonth)
  }, [isSearching, debouncedSearch, selectedMonth])
  const { data, error, loading } = useApiData<NewsItem[]>(fetcher, [isSearching, debouncedSearch, selectedMonth])

  const emptyMessage = isSearching
    ? `No news found for "${debouncedSearch}".`
    : selectedMonth === LATEST
      ? 'No news posted yet.'
      : `No news posted in ${selectedMonth} ${CURRENT_YEAR}.`

  return (
    <Section
      title="News"
      loading={loading}
      error={error}
      isEmpty={(data?.length ?? 0) === 0}
      emptyMessage={emptyMessage}
      action={
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search news…"
            maxLength={MAX_SEARCH_LENGTH}
            className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500"
          />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            disabled={isSearching}
            title={isSearching ? 'Clear the search to filter by month' : undefined}
            className={`rounded-md border px-2 py-1 text-sm ${
              isSearching
                ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-600'
                : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
            }`}
          >
            <option value={LATEST}>Latest 10</option>
            {MONTH_NAMES.map((month) => (
              <option key={month} value={month}>
                {month} {CURRENT_YEAR}
              </option>
            ))}
          </select>
        </div>
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
