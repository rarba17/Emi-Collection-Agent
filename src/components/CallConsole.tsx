import { useEffect, useRef, useState } from 'react'
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Mic,
  MicOff,
  Play,
  RotateCcw,
  Send,
  ShieldCheck,
  Square,
  Volume2,
  VolumeX,
} from 'lucide-react'
import { SCENARIOS } from '../agent/scenarios'
import type { Stage } from '../agent/types'
import { useVoiceAgent } from '../hooks/useVoiceAgent'

export interface RunRequest {
  slug: string
  nonce: number
}

interface CallConsoleProps {
  runRequest: RunRequest | null
}

const STEPS = ['Verify', 'Understand', 'Resolve', 'Close']

const stageIndex = (stage: Stage) => {
  if (stage === 'verify') return 0
  if (stage === 'disclose' || stage === 'discover') return 1
  if (stage === 'negotiate' || stage === 'confirm') return 2
  if (stage === 'handoff' || stage === 'closed') return 3
  return -1
}

const stageState = (index: number, active: number, idle: boolean) => {
  if (idle) return 'idle'
  if (index < active) return 'complete'
  if (index === active) return 'active'
  return 'upcoming'
}

const formatClock = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
  const remainder = seconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`
}

const statusLabel = (status: string, speakingRole: string) => {
  if (status === 'speaking') return speakingRole === 'customer' ? 'CUSTOMER SPEAKING' : 'ANANYA SPEAKING'
  if (status === 'thinking') return 'PROCESSING'
  if (status === 'listening') return 'LISTENING'
  if (status === 'ready') return 'YOUR TURN'
  if (status === 'closed') return 'CALL ENDED'
  return 'READY'
}

export function CallConsole({ runRequest }: CallConsoleProps) {
  const [selected, setSelected] = useState(SCENARIOS[0].slug)
  const [typed, setTyped] = useState('')
  const transcriptRef = useRef<HTMLDivElement>(null)
  const {
    turns,
    actions,
    stage,
    status,
    mode,
    speakingRole,
    seconds,
    voiceEnabled,
    interim,
    notice,
    start,
    send,
    reset,
    startListening,
    stopListening,
    toggleVoice,
  } = useVoiceAgent()

  useEffect(() => {
    if (!runRequest) return
    setSelected(runRequest.slug)
    void start(runRequest.slug, 'auto')
  }, [runRequest, start])

  useEffect(() => {
    const node = transcriptRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [turns, interim])

  const active = status !== 'idle' && status !== 'closed'
  const idle = status === 'idle'
  const activeStep = stageIndex(stage)
  const primaryAction = [...actions].reverse().find((entry) => entry.type !== 'log_disposition')
  const visibleActions = actions.filter((entry) => entry.type !== 'log_disposition').slice(-4)
  const scenario = SCENARIOS.find((entry) => entry.slug === selected) ?? SCENARIOS[0]

  const runScripted = () => {
    void start(selected, 'auto')
  }

  const runLive = () => {
    void start(selected, 'live')
  }

  const submitTyped = () => {
    if (!typed.trim() || status !== 'ready') return
    void send(typed)
    setTyped('')
  }

  return (
    <section className="console-wrap" id="studio" aria-label="Live call studio">
      <div className="console">
        <div className="console-top">
          <div className="console-top-left">
            <span className={`live-dot ${active ? 'is-live' : ''}`} aria-hidden="true" />
            <span className="mono-label">{idle ? 'TEST CALL / READY' : active ? 'LIVE TEST CALL' : 'CALL RECORDED'}</span>
            <span className="console-timer" aria-label={`Call time ${formatClock(seconds)}`}>
              {formatClock(seconds)}
            </span>
          </div>
          <div className="console-top-right">
            <span className="console-chip">SYNTHETIC ACCOUNT</span>
            <span className="console-chip chip-ghost">vo.1</span>
          </div>
        </div>

        <div className="console-body">
          <div className="console-main">
            <div className="customer-strip">
              <div className="customer-avatar">RM</div>
              <div className="customer-identity">
                <div className="customer-name-row">
                  <h2>Rohan Mehta</h2>
                  <span className="status-tag">12 DPD</span>
                </div>
                <p>Card •• 4412 <span>·</span> EMI ₹7,840 <span>·</span> Salary 27 Oct</p>
              </div>
              <div className="call-state">
                <span className="call-state-label">{statusLabel(status, speakingRole)}</span>
                <div className={`bars ${status === 'speaking' || status === 'listening' ? 'is-active' : ''}`} aria-hidden="true">
                  {Array.from({ length: 16 }).map((_, index) => (
                    <span
                      key={index}
                      style={{
                        animationDelay: `${index * 70}ms`,
                        height: `${20 + ((index * 17) % 36)}%`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="stage-rail" aria-label="Call stage">
              {STEPS.map((step, index) => {
                const state = stageState(index, activeStep, idle)
                return (
                  <div className={`stage-step ${state}`} key={step}>
                    <span className="stage-index">{state === 'complete' ? <Check size={11} /> : `0${index + 1}`}</span>
                    <span>{step}</span>
                  </div>
                )
              })}
            </div>

            <div className="transcript" ref={transcriptRef} aria-live="polite">
              {turns.length === 0 ? (
                <div className="empty-call">
                  <div className="empty-mark">A</div>
                  <p className="mono-label">READY TO LISTEN</p>
                  <h3>Every call starts with a question, not a demand.</h3>
                  <p>
                    Run a scripted scenario to hear the whole call. Or start a live test and speak as Rohan. The
                    conversation, actions and policy checks update as you go.
                  </p>
                  <div className="empty-facts">
                    <span><ShieldCheck size={14} /> Verify first</span>
                    <span><ShieldCheck size={14} /> No card data</span>
                    <span><ShieldCheck size={14} /> DNC respected</span>
                  </div>
                </div>
              ) : (
                turns.map((turn) => (
                  <div className={`turn ${turn.speaker}`} key={turn.id}>
                    <div className={`turn-avatar ${turn.speaker}`}>{turn.speaker === 'agent' ? 'A' : 'RM'}</div>
                    <div className="turn-content">
                      <div className="turn-meta">
                        <span>{turn.speaker === 'agent' ? 'ANANYA · AI' : 'ROHAN · CUSTOMER'}</span>
                        {turn.speaker === 'agent' && <span className="turn-tag">policy on</span>}
                      </div>
                      <p>{turn.text}</p>
                    </div>
                  </div>
                ))
              )}
              {interim && (
                <div className="turn customer is-interim">
                  <div className="turn-avatar customer">RM</div>
                  <div className="turn-content">
                    <div className="turn-meta"><span>ROHAN · LISTENING</span></div>
                    <p>{interim}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="console-interaction">
              {mode === 'live' && status !== 'closed' ? (
                <div className="live-input">
                  <button
                    className={`mic-button ${status === 'listening' ? 'is-listening' : ''}`}
                    type="button"
                    onClick={status === 'listening' ? stopListening : startListening}
                    disabled={status !== 'ready' && status !== 'listening'}
                    aria-label={status === 'listening' ? 'Stop listening' : 'Speak as the customer'}
                  >
                    {status === 'listening' ? <MicOff size={17} /> : <Mic size={17} />}
                  </button>
                  <input
                    value={typed}
                    onChange={(event) => setTyped(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') submitTyped()
                    }}
                    placeholder={status === 'ready' ? 'Speak or type as Rohan…' : 'Ananya is speaking…'}
                    disabled={status !== 'ready'}
                    aria-label="Type the customer's reply"
                  />
                  <button
                    className="send-button"
                    type="button"
                    onClick={submitTyped}
                    disabled={status !== 'ready' || !typed.trim()}
                    aria-label="Send customer reply"
                  >
                    <Send size={16} />
                  </button>
                </div>
              ) : active ? (
                <div className="scripted-strip">
                  <span className="mono-label">{mode === 'auto' ? 'SCRIPTED CALLER' : 'CALL IN PROGRESS'}</span>
                  <p>{mode === 'auto' ? scenario.title : 'Take over with the microphone or a typed reply.'}</p>
                  <button type="button" className="text-button" onClick={reset}>
                    Stop call
                  </button>
                </div>
              ) : status === 'closed' ? (
                <div className="scripted-strip is-closed">
                  <span className="mono-label">NEXT STEP RECORDED</span>
                  <p>{primaryAction?.detail ?? 'Disposition logged.'}</p>
                  <button type="button" className="text-button" onClick={reset}>
                    New call
                  </button>
                </div>
              ) : (
                <div className="scripted-strip">
                  <span className="mono-label">NO CALL YET</span>
                  <p>Choose a scenario below. All calls are synthetic.</p>
                </div>
              )}
              {notice && <p className="console-notice">{notice}</p>}
            </div>

            <div className="console-controls">
              <label className="scenario-select">
                <span className="mono-label">SCENARIO</span>
                <span className="select-shell">
                  <select
                    value={selected}
                    onChange={(event) => setSelected(event.target.value)}
                    disabled={active}
                    aria-label="Choose a test scenario"
                  >
                    {SCENARIOS.map((entry) => (
                      <option value={entry.slug} key={entry.slug}>
                        {entry.index} · {entry.title}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} aria-hidden="true" />
                </span>
              </label>
              <div className="console-buttons">
                <button className="button button-light button-small" type="button" onClick={runScripted} disabled={active}>
                  <Play size={14} /> Run scripted call
                </button>
                <button className="button button-outline-light button-small" type="button" onClick={runLive} disabled={active}>
                  <Mic size={14} /> Live voice test
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={reset}
                  aria-label="Reset call"
                  title="Reset call"
                  disabled={idle}
                >
                  <RotateCcw size={15} />
                </button>
                <button
                  className="icon-button"
                  type="button"
                  onClick={toggleVoice}
                  aria-label={voiceEnabled ? 'Mute agent voice' : 'Unmute agent voice'}
                  title={voiceEnabled ? 'Mute agent voice' : 'Unmute agent voice'}
                >
                  {voiceEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
                </button>
              </div>
            </div>
          </div>

          <aside className="console-aside">
            <div className="aside-section">
              <div className="aside-heading">
                <span className="mono-label">CUSTOMER FILE</span>
                <span className="aside-dot" aria-hidden="true" />
              </div>
              <dl className="file-list">
                <div><dt>Name</dt><dd>Rohan Mehta</dd></div>
                <div><dt>Account</dt><dd>AX-8841</dd></div>
                <div><dt>Overdue</dt><dd>₹7,840</dd></div>
                <div><dt>Due date</dt><dd>11 Oct</dd></div>
                <div><dt>Salary</dt><dd>27 Oct</dd></div>
                <div><dt>Language</dt><dd>English</dd></div>
              </dl>
            </div>

            <div className="aside-section action-section">
              <div className="aside-heading">
                <span className="mono-label">LATEST ACTION</span>
                <span className="action-count">{actions.length.toString().padStart(2, '0')}</span>
              </div>
              {primaryAction ? (
                <div className="primary-action">
                  <div className="action-check"><Check size={13} /></div>
                  <div>
                    <strong>{primaryAction.label}</strong>
                    <p>{primaryAction.detail}</p>
                  </div>
                </div>
              ) : (
                <div className="no-action">
                  <p>No action yet.</p>
                  <span>Every call should end with a payment, a plan, or a clean handoff.</span>
                </div>
              )}
              {visibleActions.length > 0 && (
                <div className="action-log">
                  {visibleActions.map((entry) => (
                    <div className="action-log-row" key={entry.id}>
                      <span className="action-log-dot" />
                      <span>{entry.label}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="disposition-line">
                <span className="mono-label">DISPOSITION</span>
                <span>{actions.some((entry) => entry.type === 'log_disposition') ? 'LOGGED' : 'PENDING'}</span>
              </div>
            </div>

            <div className="aside-section policy-section">
              <div className="aside-heading">
                <span className="mono-label">POLICY GUARDRAILS</span>
                <ShieldCheck size={15} />
              </div>
              <ul className="policy-list">
                <li>Identity before disclosure</li>
                <li>No threats, no score promises</li>
                <li>No card numbers, CVV or OTP</li>
                <li>Hardship stops pressure</li>
                <li>DNC is absolute</li>
              </ul>
              <a className="aside-link" href="#prompt">
                Read the system prompt <ArrowUpRight size={13} />
              </a>
            </div>

            <div className="aside-footnote">
              <Square size={10} />
              <span>Browser voice demo. Synthetic data. No audio leaves this page.</span>
            </div>
          </aside>
        </div>
      </div>
    </section>
  )
}
