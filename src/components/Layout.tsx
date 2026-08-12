import { useState, useEffect, useRef, type ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/draws', label: 'Draw Analysis', end: false },
  { to: '/matcher', label: 'CRS Matcher', end: false },
  { to: '/pool', label: 'Pool Breakdown', end: false },
  { to: '/faq', label: 'FAQ', end: false },
]

const desktopLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors ${
    isActive
      ? 'text-brand-600 dark:text-brand-400'
      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
  }`

// The mark: three bars crossing a cutoff line - the score-vs-cutoff comparison every page in
// this app is built around, standing in for a generic flag/maple-leaf mark.
function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <rect width="32" height="32" rx="8" className="fill-brand-600" />
      <rect x="7" y="18" width="4" height="8" rx="1" fill="#F5EFE0" fillOpacity="0.35" />
      <rect x="14" y="12" width="4" height="14" rx="1" fill="#F5EFE0" />
      <rect x="21" y="8" width="4" height="18" rx="1" fill="#F5EFE0" />
      <line x1="4" y1="15" x2="28" y2="15" stroke="#F5EFE0" strokeWidth="1.4" strokeDasharray="2.5 2.5" />
    </svg>
  )
}

export function Layout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const location = useLocation()

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [menuOpen])

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header
        ref={menuRef}
        className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
      >
        {/* Main header row */}
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-3 py-4 sm:px-6 sm:py-6">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <Mark className="h-8 w-8 shrink-0 sm:h-9 sm:w-9" />
            <div className="min-w-0">
              <h1 className="font-display text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 sm:text-2xl">
                IRCC News
              </h1>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 sm:flex" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end} className={desktopLinkClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Mobile hamburger button */}
          <button
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 sm:hidden"
          >
            {menuOpen ? (
              /* X icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              /* Hamburger icon */
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile drawer */}
        {menuOpen && (
          <nav
            className="border-t border-slate-100 dark:border-slate-800 sm:hidden"
            aria-label="Mobile navigation"
          >
            {NAV_LINKS.map(({ to, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex min-h-[48px] items-center border-l-2 px-4 text-sm font-medium transition-colors ${
                    isActive
                      ? 'border-brand-600 bg-brand-50 text-brand-700 dark:bg-brand-950/30 dark:text-brand-400'
                      : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-3 py-6 sm:px-6 sm:py-8">{children}</main>
    </div>
  )
}
