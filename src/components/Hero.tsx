import { ArrowDown, ArrowUpRight, Phone } from 'lucide-react'
import type { RunRequest } from './CallConsole'
import { CallConsole } from './CallConsole'

interface HeroProps {
  runRequest: RunRequest | null
  onStart: () => void
}

export function Hero({ runRequest, onStart }: HeroProps) {
  return (
    <section className="hero" id="top">
      <div className="page-width hero-grid">
        <div className="hero-copy">
          <div className="eyebrow-row">
            <span className="eyebrow">VOICE COLLECTIONS / 01</span>
            <span className="eyebrow-rule" aria-hidden="true" />
            <span className="eyebrow muted">EARLY-STAGE CARDS</span>
          </div>

          <h1>
            A collections call
            <br />
            that ends with a
            <br />
            <span className="accent-word">next step.</span>
          </h1>

          <p className="hero-lede">
            Ananya is a policy-first voice agent for Axis Bank credit card collections. She verifies before she
            discloses, listens for the real reason, and leaves every call with a payment, a plan, or a clean handoff.
          </p>

          <div className="hero-actions">
            <button className="button button-merlot button-large" type="button" onClick={onStart}>
              <Phone size={16} /> Start a test call
            </button>
            <a className="text-link" href="#prompt">
              Read the system prompt <ArrowDown size={15} />
            </a>
          </div>

          <div className="hero-footnote">
            <span>English + Hindi-ready prompt</span>
            <span className="dot-sep" aria-hidden="true" />
            <span>Guardrails in code</span>
            <span className="dot-sep" aria-hidden="true" />
            <span>
              <a href="#lab">2 recorded calls <ArrowUpRight size={11} /></a>
            </span>
          </div>

          <div className="hero-proof">
            <div>
              <strong>07</strong>
              <span>scripted policy tests</span>
            </div>
            <div>
              <strong>02</strong>
              <span>recorded call samples</span>
            </div>
            <div>
              <strong>00</strong>
              <span>real customer records</span>
            </div>
          </div>
        </div>

        <CallConsole runRequest={runRequest} />
      </div>
    </section>
  )
}
