import { downloadBlob } from './download'

// Visual properties Tailwind sets via a class (not an inline/SVG attribute) on chart
// elements - e.g. CartesianGrid's `className="text-slate-200 dark:text-slate-800"` feeding
// `stroke="currentColor"`, or axis ticks' `className="fill-slate-500 dark:fill-slate-400"`.
// A cloned SVG serialized on its own has no access to the page's stylesheet, so these
// resolve to nothing without inlining the *computed* value onto the clone first.
const STYLE_PROPS = [
  'fill',
  'stroke',
  'stroke-width',
  'stroke-dasharray',
  'stroke-opacity',
  'fill-opacity',
  'opacity',
  'color',
  'font-size',
  'font-family',
  'font-weight',
] as const

function collectElements(root: Element): Element[] {
  return [root, ...Array.from(root.querySelectorAll('*'))]
}

/** Copies computed styles from `source`'s elements onto the structurally-identical `clone`, in place. */
function inlineComputedStyles(source: SVGSVGElement, clone: SVGSVGElement): void {
  const sourceEls = collectElements(source)
  const cloneEls = collectElements(clone)
  sourceEls.forEach((sourceEl, i) => {
    const cloneEl = cloneEls[i]
    if (!(cloneEl instanceof SVGElement)) return
    const computed = getComputedStyle(sourceEl)
    for (const prop of STYLE_PROPS) {
      const value = computed.getPropertyValue(prop)
      if (value) cloneEl.style.setProperty(prop, value)
    }
  })
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Failed to load chart SVG as an image'))
    img.src = url
  })
}

/**
 * Rasterizes a Recharts `<svg>` to a PNG and triggers a download. Custom-built rather than
 * a toolbox library (see Decision 1 in docs/DRAW_ANALYSIS_PLAN.md) - Recharts itself has no
 * export feature. Renders at 2x the SVG's on-screen size for a crisp export regardless of
 * the viewing device's pixel ratio.
 */
export async function exportSvgAsPng(svg: SVGSVGElement, filename: string, backgroundColor: string): Promise<void> {
  const { width, height } = svg.getBoundingClientRect()
  const scale = 2

  const clone = svg.cloneNode(true) as SVGSVGElement
  inlineComputedStyles(svg, clone)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))

  const svgBlob = new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' })
  const svgUrl = URL.createObjectURL(svgBlob)

  try {
    const img = await loadImage(svgUrl)

    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')

    ctx.fillStyle = backgroundColor
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

    const pngBlob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
    if (!pngBlob) throw new Error('Failed to encode chart as PNG')
    downloadBlob(pngBlob, filename)
  } finally {
    URL.revokeObjectURL(svgUrl)
  }
}
