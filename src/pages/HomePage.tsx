import { NewsSection } from '../components/NewsSection'
import { DrawsSection } from '../components/DrawsSection'
import { SpeechesSection } from '../components/SpeechesSection'
import { DrawHero } from '../components/DrawHero'

export function HomePage() {
  return (
    <>
      <DrawHero />
      <DrawsSection />
      <NewsSection />
      <SpeechesSection />
    </>
  )
}
