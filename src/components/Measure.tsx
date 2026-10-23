import { ArrowRight, Check, ShieldCheck } from 'lucide-react'
import { MEASUREMENT_STEPS, METRICS } from '../data/strategy'

export function Measure() {
  return (
    <section className="measure-section" id="measure">
      <div className="page-width">
        <div className="section-head section-head-dark">
          <div>
            <p className="section-kicker">03 / SUCCESS MODEL</p>
            <h2>Measure the cure,<br />not the promise.</h2>
          </div>
          <div className="section-intro">
            <p>
              A promise-to-pay is a leading indicator. The scoreboard has to be cash collected, promises kept, and
              customers treated fairly. Otherwise the agent gets very good at hearing yes.
            </p>
            <p className="dark-note">
              The brief gives a 10% live baseline. 20% is the goal, not a forecast. Both numbers need the same
              denominator before anyone optimises them.
            </p>
          </div>
        </div>

        <div className="measure-grid">
          <div className="score-card">
            <p className="mono-label">NORTH STAR / 7-DAY CASH CONVERSION</p>
            <div className="score-numbers">
              <div>
                <strong>10.0<span>%</span></strong>
                <span className="score-caption">given baseline</span>
              </div>
              <ArrowRight className="score-arrow" size={28} aria-hidden="true" />
              <div className="score-target">
                <strong>20.0<span>%</span></strong>
                <span className="score-caption">north star</span>
              </div>
            </div>
            <p className="score-formula">
              Verified RPC accounts with a payment that clears the overdue EMI within 7 days ÷ verified RPC accounts.
            </p>
            <div className="score-rule">
              <ShieldCheck size={15} />
              <span>PTP rate is a diagnostic. It never replaces cash or kept promises.</span>
            </div>
          </div>

          <div className="metric-table">
            <div className="metric-head">
              <span>Metric</span>
              <span>How it is measured</span>
              <span>Cadence</span>
            </div>
            {METRICS.map((metric, index) => (
              <div className={`metric-row ${index === 0 ? 'is-primary' : ''}`} key={metric.name}>
                <div className="metric-name">
                  <span className="metric-role">{metric.role}</span>
                  <strong>{metric.name}</strong>
                </div>
                <div className="metric-definition">
                  <p>{metric.formula}</p>
                  <span>{metric.why}</span>
                </div>
                <span className="metric-cadence">{metric.cadence}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="measurement-loop">
          <p className="mono-label">THE MEASUREMENT LOOP</p>
          <div className="measurement-steps">
            {MEASUREMENT_STEPS.map((step) => (
              <div className="measurement-step" key={step.index}>
                <span className="measurement-index">{step.index}</span>
                <h3>{step.title}</h3>
                <p>{step.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="guardrail-strip">
          <div className="guardrail-title">
            <ShieldCheck size={17} />
            <span>Guardrails before growth</span>
          </div>
          <ul>
            <li><Check size={12} /> Complaint rate does not rise</li>
            <li><Check size={12} /> DNC and opt-outs honoured</li>
            <li><Check size={12} /> No third-party disclosure</li>
            <li><Check size={12} /> No threats or score promises</li>
          </ul>
        </div>
      </div>
    </section>
  )
}
