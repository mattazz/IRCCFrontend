// Mirrors the response shapes documented in IRCCBackend's docs/API.md.
// Keep these in sync manually if the backend's response shapes change -
// there's no shared package between the two repos.

export interface NewsItem {
  title: string
  link: string
  pubDate: string
  summary: string
  [key: string]: unknown // other RSS fields are passed through as-is
}

export interface PoolDistribution {
  '601-1200'?: string
  '501-600'?: string
  '451-500'?: string
  '491-500'?: string
  '481-490'?: string
  '471-480'?: string
  '461-470'?: string
  '451-460'?: string
  '401-450'?: string
  '441-450'?: string
  '431-440'?: string
  '421-430'?: string
  '411-420'?: string
  '401-410'?: string
  '351-400'?: string
  '301-350'?: string
  '0-300'?: string
}

export interface Draw {
  date: string
  drawNumber: string
  crs: string
  class: string
  subclass: string
  drawSize: string
  url?: string
  tieBreakingRule?: string
  drawDateTime?: string
  poolDistributionAsOn?: string
  poolTotal?: string
  poolDistribution?: PoolDistribution | null
}

export interface DrawFilterResult {
  classCode: ClassCode
  className: string
  draws: Draw[]
  subclassDraws: Draw[]
}

export interface RollingAveragePoint {
  date: string
  average: number
}

export interface RollingAverageResult {
  classCode: ClassCode
  className: string
  draws: Draw[]
  rollingAverage: RollingAveragePoint[]
}

export interface SpeechArticle {
  _id: string
  title: string
  url: string
  date: string
  summary: string
}

export interface DrawMatchResult {
  userScore: number
  classCode: string
  className: string
  timeframeMonths: number
  totalDraws: number
  qualifyingDrawsCount: number
  matchRatePercentage: number
  chanceLevel: 'High' | 'Moderate' | 'Low' | 'Unlikely'
  latestCutoff: number | null
  averageCutoff: number | null
  minCutoff: number | null
  maxCutoff: number | null
  scoreGapLatest: number | null
  scoreGapAverage: number | null
  percentileRank: number
  recommendations: {
    pointsToLatest: number
    pointsToAverage: number
    pointsTo75thPercentile: number
  }
  draws: Array<Draw & { qualified: boolean; gap: number }>
}

export interface HealthResponse {
  status: string
  database: 'connected' | 'disconnected'
  cache: {
    news: string | null
    draws: string | null
  }
}

// See utils.classFilterMap in the backend - keep this list in sync with it.
export const CLASS_CODES = [
  'CEC',
  'FSW',
  'FST',
  'PNP',
  'FLP',
  'TO',
  'HO',
  'STEM',
  'GEN',
  'TRAN',
  'AGRI',
] as const

export type ClassCode = (typeof CLASS_CODES)[number]

export const CLASS_NAMES: Record<ClassCode, string> = {
  CEC: 'Canadian Experience Class',
  FSW: 'Federal Skilled Worker',
  FST: 'Federal Skilled Trades',
  PNP: 'Provincial Nominee Program',
  FLP: 'French language proficiency',
  TO: 'Trade occupations',
  HO: 'Healthcare occupations',
  STEM: 'STEM occupations',
  GEN: 'General',
  TRAN: 'Transport occupations',
  AGRI: 'Agriculture and agri-food occupations',
}

// Distinct, stable keyword per class used to match a draw's raw `class` text (case-insensitive).
// IRCC has changed the wording/casing/punctuation of these names over time (e.g. "French
// language proficiency (Version 1)" -> "French-Language proficiency 2026-Version 2",
// "Healthcare occupations" -> "Healthcare and Social Services Occupations, 2026-Version 3") -
// a short, distinctive root word survives that kind of drift instead of breaking on it.
export const CLASS_MATCH_KEYWORDS: Record<ClassCode, string> = {
  CEC: 'Canadian Experience Class',
  FSW: 'Federal Skilled Worker',
  FST: 'Federal Skilled Trades',
  PNP: 'Provincial Nominee Program',
  FLP: 'French',
  TO: 'Trade',
  HO: 'Healthcare',
  STEM: 'STEM',
  GEN: 'General',
  TRAN: 'Transport',
  AGRI: 'Agriculture',
}
