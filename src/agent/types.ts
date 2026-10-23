export type Speaker = 'agent' | 'customer' | 'system'

export type Stage =
  | 'idle'
  | 'verify'
  | 'disclose'
  | 'discover'
  | 'negotiate'
  | 'confirm'
  | 'handoff'
  | 'closed'

export type Disposition =
  | 'ptp'
  | 'paid'
  | 'hardship'
  | 'dispute'
  | 'wrong_party'
  | 'dnc'
  | 'callback'
  | 'no_commitment'
  | 'unverified'
  | 'priority_help'

export type ActionType =
  | 'verify_identity'
  | 'send_payment_link'
  | 'send_whatsapp'
  | 'create_ptp'
  | 'schedule_reminder'
  | 'schedule_callback'
  | 'pause_reminders'
  | 'pause_collections'
  | 'escalate_hardship'
  | 'escalate_dispute'
  | 'escalate_priority'
  | 'warm_transfer'
  | 'honor_dnc'
  | 'mark_wrong_party'
  | 'log_disposition'

export interface AgentAction {
  type: ActionType
  label: string
  detail: string
}

export interface AgentReply {
  text: string
  actions: AgentAction[]
  stage: Stage
  disposition?: Disposition
  end: boolean
}

export interface ConversationTurn {
  speaker: Speaker
  text: string
}

export interface CustomerProfile {
  accountId: string
  name: string
  salutation: string
  firstName: string
  cardLast4: string
  panLast4: string
  emi: number
  outstanding: number
  dueDate: string
  dpd: number
  nextSalaryDate: string
  phone: string
  language: string
  bestTime: string
}

export interface Scenario {
  slug: string
  index: string
  title: string
  context: string
  description: string
  turns: string[]
  expectedDisposition: Disposition
  expectedLabel: string
  requiredActions: ActionType[]
  forbiddenAgentText?: RegExp[]
  note: string
}

export interface CheckResult {
  label: string
  pass: boolean
}

export interface ScenarioResult {
  scenario: Scenario
  transcript: ConversationTurn[]
  actions: AgentAction[]
  disposition?: Disposition
  checks: CheckResult[]
  passed: boolean
}
