import { ArrowRight, FlaskConical, ShieldX } from 'lucide-react'
import { DIAGNOSIS, EXPERIMENTS, FIRST_14_DAYS, GUARDRAILS, LEVERS } from '../data/strategy'

export function Conversion() {
  return (
    <section className="scale-section" id="scale">
      <div className="page-width">
        <div className="section-head">
          <div>
            <p className="section-kicker">04 / CONVERSION PLAN</p>
            <h2>10% to 20% is a<br />funnel problem.</h2>
          </div>
          <div className="section-intro">
            <p>
              Not a better closing line. A portfolio of four levers, each tested against a holdout, with compliance
              guardrails that can stop the rollout. Doubling conversion is a 2× lift. It should be earned in steps.
            </p>
          </div>
        </div>

        <div className="denominator-band">
          <div className="denominator-label">
            <span className="mono-label">BEFORE ANY OPTIMISATION</span>
            <span className="denominator-index">01</span>
          </div>
          <div className="denominator-copy">
            <h3>Pin the denominator.</h3>
            <p>
              This plan assumes the 10% is <strong>cash collected within 7 days ÷ verified right-party contacts</strong>.
              If your 10% is promise-to-pay rate, the first fix is payment completion and promise quality, not more
              promises. If it is cash per dial, reachability is the first fix.
            </p>
          </div>
          <div className="denominator-math" aria-label="Possible conversion denominators">
            <span>dials</span>
            <ArrowRight size={13} />
            <span>connects</span>
            <ArrowRight size={13} />
            <span>verified RPCs</span>
            <ArrowRight size={13} />
            <span>cash collected</span>
          </div>
        </div>

        <div className="diagnosis-block">
          <div className="block-heading">
            <p className="mono-label">WHERE I WOULD LOOK FIRST</p>
            <h3>Diagnose before you rewrite.</h3>
          </div>
          <div className="diagnosis-grid">
            {DIAGNOSIS.map((item) => (
              <div className="diagnosis-card" key={item.index}>
                <span className="diagnosis-number">{item.index}</span>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="math-band">
          <div className="math-label">
            <span className="mono-label">MODELLED PATH / CONSERVATIVE RELATIVE LIFTS</span>
            <span className="math-note">Each multiplier must earn its place in a holdout.</span>
          </div>
          <div className="equation" aria-label="10 percent multiplied by 1.15, 1.20, 1.18 and 1.22 equals 19.9 percent">
            <strong className="equation-base">10.0%</strong>
            {['1.15', '1.20', '1.18', '1.22'].map((multiplier) => (
              <span className="equation-factor" key={multiplier}>
                <span>×</span>
                {multiplier}
              </span>
            ))}
            <span className="equation-equals">=</span>
            <strong className="equation-result">19.9%</strong>
          </div>
          <p className="math-copy">
            Reachability, reason matching, payment friction and promise follow-through compound. If two levers fail,
            this is a 15% plan, not a 20% plan. That is the point of testing them separately.
          </p>
        </div>

        <div className="lever-grid">
          {LEVERS.map((lever) => (
            <article className="lever-card" key={lever.index}>
              <div className="lever-top">
                <span className="lever-number">{lever.index}</span>
                <span className="lever-multiplier">{lever.multiplier}</span>
              </div>
              <h3>{lever.title}</h3>
              <span className="lever-subtitle">{lever.subtitle}</span>
              <p>{lever.body}</p>
              <div className="lever-proof">
                <span>PROOF</span>
                {lever.proof}
              </div>
            </article>
          ))}
        </div>

        <div className="experiment-block">
          <div className="block-heading experiment-heading">
            <div>
              <p className="mono-label">EXPERIMENT BACKLOG</p>
              <h3>Test the smallest thing that can move cash.</h3>
            </div>
            <span className="experiment-badge"><FlaskConical size={14} /> Hypothesis-led</span>
          </div>
          <div className="experiment-table">
            <div className="experiment-head">
              <span>Experiment</span>
              <span>Hypothesis</span>
              <span>Design</span>
              <span>Primary metric</span>
              <span>Guardrail</span>
              <span>Window</span>
            </div>
            {EXPERIMENTS.map((experiment) => (
              <div className="experiment-row" key={experiment.name}>
                <div className="experiment-name">
                  <span className="priority-tag">{experiment.priority}</span>
                  <strong>{experiment.name}</strong>
                </div>
                <span>{experiment.hypothesis}</span>
                <span>{experiment.design}</span>
                <span>{experiment.metric}</span>
                <span>{experiment.guardrail}</span>
                <span>{experiment.window}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="scale-closing">
          <div className="timeline-block">
            <p className="mono-label">FIRST 14 DAYS</p>
            <div className="timeline">
              {FIRST_14_DAYS.map((day) => (
                <div className="timeline-item" key={day.days}>
                  <span>{day.days}</span>
                  <h4>{day.title}</h4>
                  <p>{day.body}</p>
                </div>
              ))}
            </div>
          </div>

          <aside className="do-not-block">
            <div className="do-not-head">
              <ShieldX size={17} />
              <span className="mono-label">WHAT I WON'T DO</span>
            </div>
            <ul>
              {[
                'Add more dials and call it growth.',
                'Pressure customers after a clear no.',
                'Threaten legal action or credit score damage.',
                'Offer waivers the bank has not authorised.',
                'Hide that the caller is an AI assistant.',
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>These can lift short-term promises. They destroy cash, trust and the licence to operate.</p>
          </aside>
        </div>

        <div className="scale-guardrail">
          <span className="mono-label">ROLLOUT GATE</span>
          {GUARDRAILS.map((guardrail) => (
            <span className="gate-item" key={guardrail}>{guardrail}</span>
          ))}
        </div>
      </div>
    </section>
  )
}
