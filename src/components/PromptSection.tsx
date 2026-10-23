import { useState } from 'react'
import { Check, Copy, Download, ExternalLink, ShieldCheck } from 'lucide-react'
import promptText from '../../docs/agent-prompt.md?raw'

const RULES = [
  'Disclose AI + recording before the first question.',
  'Verify identity before any account detail is spoken.',
  'Stop pressure on hardship, dispute or distress.',
  'Honour DNC immediately; no retention script.',
]

const TOOLS = [
  'verify_identity',
  'send_payment_link',
  'create_ptp',
  'schedule_callback',
  'pause_collections',
  'escalate',
  'log_disposition',
]

export function PromptSection() {
  const [copied, setCopied] = useState(false)
  const words = promptText.trim().split(/\s+/).length

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(promptText)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  const download = () => {
    const blob = new Blob([promptText], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = 'ananya-collections-agent-prompt.md'
    anchor.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="prompt-section" id="prompt">
      <div className="page-width">
        <div className="section-head">
          <div>
            <p className="section-kicker">05 / SYSTEM PROMPT</p>
            <h2>The prompt is<br />the policy.</h2>
          </div>
          <div className="section-intro">
            <p>
              A production-oriented system prompt with hard stops, tool contracts and a structured response format.
              The prototype implements the same policy as a deterministic engine so every test is repeatable.
            </p>
          </div>
        </div>

        <div className="prompt-layout">
          <div className="prompt-notes">
            <div className="prompt-note-block">
              <p className="mono-label">FOUR NON-NEGOTIABLES</p>
              <ul className="rule-list">
                {RULES.map((rule) => (
                  <li key={rule}>
                    <ShieldCheck size={15} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="prompt-note-block">
              <p className="mono-label">TOOLS THE AGENT CAN CALL</p>
              <div className="tool-list">
                {TOOLS.map((tool) => (
                  <code key={tool}>{tool}</code>
                ))}
              </div>
            </div>

            <div className="prompt-note-block prompt-context">
              <p className="mono-label">DEPLOYMENT NOTE</p>
              <p>
                In production, the LLM returns the JSON contract shown in the prompt. The orchestrator validates the
                JSON, enforces consent, executes tools and speaks only the <code>say</code> field. The model never has
                direct payment or CRM access.
              </p>
            </div>

            <a className="prompt-repo-link" href="#lab">
              See the policy in the test lab <ExternalLink size={13} />
            </a>
          </div>

          <div className="prompt-panel">
            <div className="prompt-panel-head">
              <div>
                <span className="mono-label">ANANYA_SYSTEM_PROMPT.MD</span>
                <p>{words.toLocaleString('en-IN')} words · v0.1</p>
              </div>
              <div className="prompt-actions">
                <button className="prompt-action" type="button" onClick={copy}>
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
                <button className="prompt-action" type="button" onClick={download}>
                  <Download size={14} /> Download
                </button>
              </div>
            </div>
            <pre className="prompt-code">{promptText}</pre>
            <div className="prompt-panel-foot">
              <span>Structured output + tool calls</span>
              <span>Consent before action</span>
              <span>No PII in logs beyond need</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
