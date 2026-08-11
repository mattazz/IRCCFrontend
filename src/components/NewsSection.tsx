import { useCallback } from 'react'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Section } from './Section'

export function NewsSection() {
  const fetcher = useCallback(() => api.news.latest(), [])
  const { data, error, loading } = useApiData(fetcher, [])

  return (
    <Section
      title="Latest news"
      loading={loading}
      error={error}
      isEmpty={(data?.length ?? 0) === 0}
      emptyMessage="No news posted yet this month."
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
