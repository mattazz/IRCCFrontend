import { useEffect, useState } from 'react'
import { ApiError } from '../api/client'

interface ApiDataState<T> {
  data: T | null
  error: string | null
  loading: boolean
}

/**
 * Runs `fetcher` whenever `deps` changes, tracking loading/error/data state.
 * Ignores results from a stale run if `deps` changes again before it resolves.
 *
 * Pass `refetchIntervalMs` to also poll on a timer (e.g. to stay in sync with a
 * backend cache that refreshes periodically) without showing the loading state
 * on each poll.
 */
export function useApiData<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  refetchIntervalMs?: number,
): ApiDataState<T> {
  const [state, setState] = useState<ApiDataState<T>>({ data: null, error: null, loading: true })

  useEffect(() => {
    let cancelled = false

    const load = (showLoading: boolean) => {
      if (showLoading) setState({ data: null, error: null, loading: true })

      fetcher()
        .then((data) => {
          if (!cancelled) setState({ data, error: null, loading: false })
        })
        .catch((err: unknown) => {
          if (cancelled) return
          const message = err instanceof ApiError ? err.message : 'Something went wrong'
          setState({ data: null, error: message, loading: false })
        })
    }

    load(true)

    const intervalId = refetchIntervalMs ? setInterval(() => load(false), refetchIntervalMs) : undefined

    return () => {
      cancelled = true
      if (intervalId) clearInterval(intervalId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}
