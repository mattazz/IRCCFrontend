import type {
  ClassCode,
  Draw,
  DrawFilterResult,
  HealthResponse,
  NewsItem,
  RollingAverageResult,
  SpeechArticle,
} from '../types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(path, API_BASE_URL)
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value))
    }
  }

  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const body: { error?: string } = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.error ?? res.statusText)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<HealthResponse>('/api/health'),
  news: {
    latest: () => request<NewsItem[]>('/api/v1/news/latest'),
    full: () => request<NewsItem[]>('/api/v1/news/full'),
    byMonth: (month: string) => request<NewsItem[]>(`/api/v1/news/${encodeURIComponent(month)}`),
    search: (keyword: string) => request<NewsItem[]>('/api/v1/news/search', { q: keyword }),
  },
  draws: {
    latest: (count = 5) => request<Draw[]>('/api/v1/draws/latest', { count }),
    all: () => request<Draw[]>('/api/v1/draws/all'),
    filter: (classCode: ClassCode) => request<DrawFilterResult>(`/api/v1/draws/filter/${classCode}`),
    rollingAverage: (classCode: ClassCode) =>
      request<RollingAverageResult>(`/api/v1/draws/rolling-average/${classCode}`),
  },
  speeches: {
    latest: (count = 10) => request<SpeechArticle[]>('/api/v1/speeches/latest', { count }),
  },
}
