import { useCallback, useState } from 'react'
import { api } from '../api/client'
import { useApiData } from '../hooks/useApiData'
import { Section } from './Section'
import { CLASS_CODES, CLASS_NAMES, type ClassCode, type Draw } from '../types/api'

const ALL = 'ALL' as const

export function DrawsSection() {
  const [selectedClass, setSelectedClass] = useState<ClassCode | typeof ALL>(ALL)

  const fetcher = useCallback(
    () => (selectedClass === ALL ? api.draws.latest(10) : api.draws.filter(selectedClass).then((r) => r.draws)),
    [selectedClass],
  )
  const { data, error, loading } = useApiData<Draw[]>(fetcher, [selectedClass])

  return (
    <Section
      title="Express Entry draws"
      loading={loading}
      error={error}
      isEmpty={(data?.length ?? 0) === 0}
      emptyMessage="No draws found for this class."
      action={
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
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-slate-500 dark:text-slate-400">
              <th className="pb-2 pr-4 font-medium">Date</th>
              <th className="pb-2 pr-4 font-medium">Class</th>
              <th className="pb-2 pr-4 font-medium">CRS</th>
              <th className="pb-2 font-medium">Invitations</th>
            </tr>
          </thead>
          <tbody>
            {data?.map((draw) => (
              <tr key={draw.drawNumber} className="border-t border-slate-100 dark:border-slate-800">
                <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{draw.date}</td>
                <td className="py-2 pr-4 text-slate-700 dark:text-slate-300">{draw.class}</td>
                <td className="py-2 pr-4 font-medium text-slate-900 dark:text-slate-100">{draw.crs}</td>
                <td className="py-2 text-slate-700 dark:text-slate-300">{draw.drawSize}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Section>
  )
}
