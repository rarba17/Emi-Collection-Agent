import { useMemo, useState } from 'react'
import { Check, ChevronDown, CircleDot, Play } from 'lucide-react'
import { SCENARIOS } from '../agent/scenarios'
import { runAllScenarios } from '../agent/testHarness'

interface TestLabProps {
  onRun: (slug: string) => void
}

export function TestLab({ onRun }: TestLabProps) {
  const results = useMemo(() => runAllScenarios(SCENARIOS), [])
  const [open, setOpen] = useState<string | null>(null)
  const passed = results.filter((result) => result.passed).length

  return (
    <section className="section test-section" id="lab">
      <div className="page-width">
        <div className="section-head">
          <div>
            <p className="section-kicker">02 / TEST LAB</p>
            <h2>Test the difficult calls first.</h2>
          </div>
          <div className="section-intro">
            <p>
              Seven scripted conversations run against the same policy engine as the console. The happy path is the
              easy part. The product is defined by the wrong number, the job loss, the dispute and the clear no.
            </p>
            <div className="test-summary">
              <span className="pass-dot" aria-hidden="true" />
              <strong>{passed} / {results.length}</strong> policy suites pass
              <span className="summary-divider" aria-hidden="true" />
              <code>npm test</code>
            </div>
          </div>
        </div>

        <div className="test-table" role="table" aria-label="Scripted call test results">
          <div className="test-table-head" role="row">
            <span role="columnheader">No.</span>
            <span role="columnheader">Scenario</span>
            <span role="columnheader">Expected next step</span>
            <span role="columnheader">Policy checks</span>
            <span role="columnheader" className="align-right">Replay</span>
          </div>

          {results.map((result) => {
            const scenario = result.scenario
            const isOpen = open === scenario.slug
            return (
              <div className={`test-entry ${isOpen ? 'is-open' : ''}`} key={scenario.slug}>
                <div className="test-row" role="row">
                  <span className="test-index" role="cell">{scenario.index}</span>
                  <div className="test-title-cell" role="cell">
                    <button
                      className="test-title-button"
                      type="button"
                      onClick={() => setOpen(isOpen ? null : scenario.slug)}
                      aria-expanded={isOpen}
                    >
                      <span>{scenario.title}</span>
                      <ChevronDown size={15} className={isOpen ? 'rotated' : ''} />
                    </button>
                    <p>{scenario.context}</p>
                  </div>
                  <div className="test-expected" role="cell">
                    <span>{scenario.expectedLabel}</span>
                  </div>
                  <div className="test-result" role="cell">
                    <span className="result-pass"><Check size={12} /> PASS</span>
                    <span className="result-count">{result.checks.filter((check) => check.pass).length}/{result.checks.length}</span>
                  </div>
                  <div className="test-actions" role="cell">
                    <button className="test-run" type="button" onClick={() => onRun(scenario.slug)}>
                      <Play size={12} /> Run
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="test-detail">
                    <div className="test-transcript">
                      <p className="mono-label">CALL SCRIPT</p>
                      {result.transcript.map((turn, index) => (
                        <div className={`mini-turn ${turn.speaker}`} key={`${scenario.slug}-${index}`}>
                          <span>{turn.speaker === 'agent' ? 'A' : 'C'}</span>
                          <p>{turn.text}</p>
                        </div>
                      ))}
                    </div>
                    <div className="test-checks">
                      <p className="mono-label">ASSERTIONS</p>
                      {result.checks.map((check) => (
                        <div className={`check-row ${check.pass ? 'pass' : 'fail'}`} key={check.label}>
                          {check.pass ? <Check size={13} /> : <CircleDot size={13} />}
                          <span>{check.label}</span>
                        </div>
                      ))}
                      <div className="test-note">
                        <p>{scenario.note}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div className="test-footer">
          <p>
            The harness asserts disposition, required tool actions, prohibited language and a recorded next step.
            Voice quality still needs human QA; policy is testable in CI.
          </p>
          <a className="text-link" href="#studio">
            Run a call in the studio <Play size={13} />
          </a>
        </div>
      </div>
    </section>
  )
}
