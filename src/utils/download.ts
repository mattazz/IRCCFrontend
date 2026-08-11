/**
 * Triggers a browser download for an in-memory blob. Creates a throwaway
 * object URL + anchor click, then revokes the URL - no library needed for
 * something this small (see Decision 1 in docs/DRAW_ANALYSIS_PLAN.md: custom-built
 * export UI rather than a toolbox dependency).
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}
