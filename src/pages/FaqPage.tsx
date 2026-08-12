import { useMemo, useState } from 'react'
import { Section } from '../components/Section'
import { faqRoot, type FaqNode } from '../data/faqContent'

function findTrail(path: string[]): FaqNode[] {
  const trail = [faqRoot]
  let node = faqRoot
  for (const id of path) {
    const next = node.children?.find((c) => c.id === id)
    if (!next) break
    trail.push(next)
    node = next
  }
  return trail
}

export function FaqPage() {
  const [path, setPath] = useState<string[]>([])
  const trail = useMemo(() => findTrail(path), [path])
  const current = trail[trail.length - 1]
  const atRoot = path.length === 0

  return (
    <Section
      title={atRoot ? 'FAQ' : current.label}
      loading={false}
      error={null}
      isEmpty={false}
      action={
        trail.length > 1 && (
          <nav className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400" aria-label="Breadcrumb">
            {trail.map((node, i) => (
              <span key={node.id} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden="true">›</span>}
                {i === trail.length - 1 ? (
                  <span className="text-slate-700 dark:text-slate-300">{i === 0 ? 'FAQ' : node.label}</span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPath(path.slice(0, i))}
                    className="hover:underline hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    {i === 0 ? 'FAQ' : node.label}
                  </button>
                )}
              </span>
            ))}
          </nav>
        )
      }
    >
      <div className="space-y-4">
        {current.prompt && <p className="text-slate-700 dark:text-slate-300">{current.prompt}</p>}

        {current.content?.map((paragraph, i) => (
          <p key={i} className="whitespace-pre-line text-slate-700 dark:text-slate-300">
            {paragraph}
          </p>
        ))}

        {current.link && (
          <a
            href={current.link.url}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            {current.link.label} →
          </a>
        )}

        {current.children && (
          <div className="flex flex-col gap-2">
            {current.children.map((child) => (
              <button
                key={child.id}
                type="button"
                onClick={() => setPath([...path, child.id])}
                className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                {child.label}
              </button>
            ))}
          </div>
        )}

        {!atRoot && (
          <div className="flex flex-wrap gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setPath(path.slice(0, -1))}
              className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              ⏪ Back
            </button>
            <button
              type="button"
              onClick={() => setPath([])}
              className="min-h-[44px] rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              🏠 Main Menu
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}
