import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium ${
    isActive
      ? 'text-slate-900 dark:text-slate-100'
      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
  }`

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🇨🇦 IRCC News</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Immigration, Refugees and Citizenship Canada — news, Express Entry draws, and speeches.
            </p>
          </div>
          <nav className="flex gap-4">
            <NavLink to="/" end className={navLinkClass}>
              Home
            </NavLink>
            <NavLink to="/draws" className={navLinkClass}>
              Draw Analysis
            </NavLink>
            <NavLink to="/faq" className={navLinkClass}>
              FAQ
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">{children}</main>
    </div>
  )
}
