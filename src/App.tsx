import { useState } from 'react'
import { Header } from './components/Header'
import { Hero } from './components/Hero'
import { TestLab } from './components/TestLab'
import { Recordings } from './components/Recordings'
import { Measure } from './components/Measure'
import { Conversion } from './components/Conversion'
import { PromptSection } from './components/PromptSection'
import { Footer } from './components/Footer'
import type { RunRequest } from './components/CallConsole'

export default function App() {
  const [runRequest, setRunRequest] = useState<RunRequest | null>(null)

  const requestRun = (slug: string) => {
    setRunRequest({ slug, nonce: Date.now() })
    window.setTimeout(() => {
      document.getElementById('studio')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 40)
  }

  return (
    <>
      <Header onStart={() => requestRun('salary-delay')} />
      <main id="main">
        <Hero runRequest={runRequest} onStart={() => requestRun('salary-delay')} />
        <TestLab onRun={requestRun} />
        <Recordings />
        <Measure />
        <Conversion />
        <PromptSection />
      </main>
      <Footer />
    </>
  )
}
