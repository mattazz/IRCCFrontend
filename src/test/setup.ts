import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// vitest.config's `test` block doesn't set `globals: true` (tests import from 'vitest'
// explicitly instead), so React Testing Library's auto-cleanup - which detects a global
// `afterEach` - can't find one. Wire it up explicitly so each test starts from an empty DOM.
afterEach(() => {
  cleanup()
})

// jsdom implements neither API. Recharts' <ResponsiveContainer> measures its wrapper via
// ResizeObserver to size the chart; useMediaQuery (src/hooks/useMediaQuery.ts) reads
// matchMedia. Without these, every component that renders a chart or calls useMediaQuery
// throws in tests before getting anywhere near the assertion.
class ResizeObserverMock implements ResizeObserver {
  callback: ResizeObserverCallback

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback
  }

  observe(target: Element) {
    const entry = { target, contentRect: { width: 800, height: 400 } } as ResizeObserverEntry
    this.callback([entry], this)
  }

  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = ResizeObserverMock

window.matchMedia = (query: string) =>
  ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  }) as unknown as MediaQueryList
