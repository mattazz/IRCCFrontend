import type { Draw } from '../types/api'

const CSV_COLUMNS = ['date', 'drawNumber', 'class', 'subclass', 'crs', 'invitations'] as const

/** Quotes a field only if it needs it (contains a comma, quote, or newline), doubling any inner quotes. */
function csvField(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

/**
 * Serializes draws to CSV, one row per draw. Column order matches CSV_COLUMNS;
 * `invitations` is `Draw.drawSize` renamed to match the label used everywhere else
 * in the UI (chart legend, stats panel, draw cards).
 */
export function drawsToCsv(draws: Draw[]): string {
  const header = CSV_COLUMNS.join(',')
  const rows = draws.map((draw) =>
    [draw.date, draw.drawNumber, draw.class, draw.subclass, draw.crs, draw.drawSize].map(csvField).join(','),
  )
  return [header, ...rows].join('\n')
}
