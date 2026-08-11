import { NewsSection } from './components/NewsSection'
import { DrawsSection } from './components/DrawsSection'
import { SpeechesSection } from './components/SpeechesSection'

function App() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-5xl px-4 py-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">🇨🇦 IRCC News</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Immigration, Refugees and Citizenship Canada — news, Express Entry draws, and speeches.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <NewsSection />
        <DrawsSection />
        <SpeechesSection />
      </main>
    </div>
  )
}

export default App
