import { useCallback } from 'react'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Section } from './Section'

export function SpeechesSection() {
  const fetcher = useCallback(() => api.speeches.latest(5), [])
  const { data, error, loading } = useApiData(fetcher, [])

  return (
    <Section
      title="Latest speeches"
      loading={loading}
      error={error}
      isEmpty={(data?.length ?? 0) === 0}
      emptyMessage="No speeches stored yet."
    >
      <ul className="space-y-3">
        {data?.map((article) => (
          <li key={article._id} className="border-b border-slate-100 pb-3 last:border-none last:pb-0 dark:border-slate-800">
            <a
              href={article.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 hover:underline dark:text-slate-100"
            >
              {article.title}
            </a>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {new Date(article.date).toLocaleDateString('en-US', {
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
