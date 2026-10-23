import { DEMO_PROFILE } from './profile'
import type {
  ActionType,
  AgentAction,
  AgentReply,
  CustomerProfile,
  Disposition,
  Stage,
} from './types'

type Awaiting =
  | 'identity_confirm'
  | 'identity_code'
  | 'secure_callback_confirm'
  | 'reason'
  | 'hardship_probe'
  | 'split_interest'
  | 'amount'
  | 'plan_confirm'
  | 'payment_details'
  | 'dispute_date'
  | 'callback_confirm'
  | 'alternative'
  | 'hardship_confirm'
  | 'sensitive_confirm'
  | 'close'
  | 'none'

interface Offer {
  today: number
  rest: number
  date: string
}

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 })

const money = (value: number) => `₹${INR.format(value)}`

const has = (text: string, pattern: RegExp) => pattern.test(text)

const isAffirmative = (text: string) =>
  has(text, /\b(yes|yeah|yep|sure|okay|ok|works|work|fine|correct|speaking|whatsapp|send|go ahead|please do|that helps)\b/i) &&
  !has(text, /\b(no|nope|not really|cannot|can't|won't|don't)\b/i)

const isNegative = (text: string) =>
  has(text, /\b(no|nope|not really|cannot|can't|won't|don't|do not)\b/i) &&
  !has(text, /\bno problem\b/i)

const isChannelPreference = (text: string) =>
  has(text, /\b(do not call|don't call|stop calling)\b/i) &&
  has(text, /\b(at work|at the office|during work|work hours)\b/i) &&
  has(text, /\b(mobile|cell|another number|other number|this number)\b/i)

const isDnc = (text: string) =>
  has(
    text,
    /\b(do not call|don't call|stop calling|stop the calls|remove (my|this) number|dnc|do-not-call|no more calls)\b/i,
  ) && !isChannelPreference(text)

const isWrongParty = (text: string) =>
  has(
    text,
    /\b(wrong number|wrong person|not me|doesn't live here|does not live here|no one by that name|no such person)\b/i,
  )

const isDistress = (text: string) =>
  has(
    text,
    /\b(suicid|kill myself|end my life|self[- ]harm|medical emergency|can't breathe|cannot breathe|chest pain|emergency)\b/i,
  )

const isAbusive = (text: string) =>
  has(text, /\b(fuck|fucking|bastard|idiot|stupid|shut up|moron)\b/i)

function extractAmount(text: string): number | undefined {
  const cleaned = text.replace(/,/g, '')
  const marked = cleaned.match(/(?:₹|rs\.?|inr)\s*(\d+(?:\.\d+)?)\s*(k|thousand)?/i)
  const suffixed = cleaned.match(/\b(\d+(?:\.\d+)?)\s*(k|thousand)\b/i)
  const plain = cleaned.match(/\b(\d{3,6})\b/)
  const match = marked ?? suffixed ?? plain
  if (!match) return undefined
  const base = Number(match[1])
  if (!Number.isFinite(base) || base <= 0) return undefined
  const multiplier = match[2] ? 1000 : 1
  return Math.round(base * multiplier)
}

function extractDate(text: string, profile: CustomerProfile): string {
  const numbered = text.match(/\b(?:on|by|after|before)\s+(?:the\s+)?(\d{1,2})(?:st|nd|rd|th)?\b/i)
  if (numbered) return `${Number(numbered[1])} October`
  const suffixed = text.match(/\b(\d{1,2})(?:st|nd|rd|th)\b/i)
  if (suffixed) return `${Number(suffixed[1])} October`
  const namedMonth = text.match(
    /\b(\d{1,2})\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\b/i,
  )
  if (namedMonth) {
    const month = namedMonth[2].toLowerCase()
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec']
    const canonical = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const index = months.findIndex((entry) => month.startsWith(entry))
    return `${Number(namedMonth[1])} ${canonical[index] ?? 'October'}`
  }
  if (has(text, /\bsalary|payday\b/i)) return profile.nextSalaryDate
  if (has(text, /\btomorrow\b/i)) return 'tomorrow'
  if (has(text, /\btoday\b/i)) return 'today'
  const weekday = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  if (weekday) {
    const label = weekday[1].toLowerCase()
    return `${label.charAt(0).toUpperCase()}${label.slice(1)}`
  }
  return profile.nextSalaryDate
}

function hasExplicitDate(text: string): boolean {
  return has(
    text,
    /\b(?:on|by|after|before)\s+(?:the\s+)?\d{1,2}|\b\d{1,2}(?:st|nd|rd|th)\b|\b\d{1,2}\s*(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)|\btoday\b|\btomorrow\b|\b(?:mon|tue|wed|thu|fri|sat|sun)day\b/i,
  )
}

function extractClock(text: string): string | undefined {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?)\b/i)
  if (!match) return undefined
  const hour = Number(match[1])
  if (hour < 1 || hour > 12) return undefined
  const minutes = match[2] ? `:${match[2]}` : ''
  const meridiem = match[3].toLowerCase().startsWith('p') ? 'pm' : 'am'
  return `${hour}${minutes} ${meridiem}`
}

function callbackDay(current: string): string {
  if (has(current, /\btomorrow\b/i)) return 'tomorrow'
  if (has(current, /\btoday\b/i)) return 'today'
  const date = current.match(/\b(\d{1,2}\s+[A-Z][a-z]+)\b/)
  return date ? `on ${date[1]}` : 'today'
}

function revisedCallbackTime(text: string, current: string, profile: CustomerProfile): string {
  const clock = extractClock(text) ?? extractClock(current) ?? '5 pm'
  if (has(text, /\btomorrow\b/i)) return `${clock} tomorrow`
  if (has(text, /\btoday\b/i)) return `${clock} today`
  if (hasExplicitDate(text)) {
    return `${clock} on ${extractDate(text, profile)}`
  }
  const day = callbackDay(current)
  return `${clock} ${day}`
}

function action(type: ActionType, label: string, detail: string): AgentAction {
  return { type, label, detail }
}

export class CollectionsAgent {
  private readonly profile: CustomerProfile
  private stage: Stage = 'idle'
  private awaiting: Awaiting = 'none'
  private disposition?: Disposition
  private verified = false
  private verifyAttempts = 0
  private abuseCount = 0
  private offer?: Offer
  private callbackTime = '5 pm today'
  private sensitiveTopic: 'waiver' | 'legal' | null = null
  private sensitiveResume: { awaiting: Awaiting; stage: Stage } | null = null

  constructor(profile: CustomerProfile = DEMO_PROFILE) {
    this.profile = profile
  }

  private get lastName(): string {
    return this.profile.name.split(' ').at(-1) ?? this.profile.name
  }

  start(): AgentReply {
    this.stage = 'verify'
    this.awaiting = 'identity_confirm'
    return {
      text: `Namaste, I'm Ananya, Axis Bank's AI assistant. This call is recorded. Am I speaking with ${this.profile.salutation} ${this.lastName}?`,
      actions: [],
      stage: this.stage,
      end: false,
    }
  }

  respond(input: string): AgentReply {
    const text = input.trim()

    if (this.stage === 'closed') {
      return {
        text: 'This call has ended. Thank you.',
        actions: [],
        stage: this.stage,
        disposition: this.disposition,
        end: true,
      }
    }

    if (!text) {
      return this.reply('I missed that. Could you say that again?')
    }

    if (isDistress(text)) return this.priorityHelp()
    if (has(text, /\b(human|representative|real person|agent|supervisor|manager|specialist)\b/i)) {
      return this.humanHandoff()
    }
    if (isDnc(text)) return this.honourDnc()
    if (isChannelPreference(text)) return this.handleChannelPreference()

    const sensitive = this.handleSensitiveQuestion(text)
    if (sensitive) return sensitive

    if (isAbusive(text)) return this.handleAbuse()

    switch (this.awaiting) {
      case 'identity_confirm':
        return this.handleIdentityConfirm(text)
      case 'identity_code':
        return this.handleIdentityCode(text)
      case 'secure_callback_confirm':
        return this.handleSecureCallbackConfirm(text)
      case 'reason':
        return this.handleReason(text)
      case 'hardship_probe':
        return this.handleHardshipProbe(text)
      case 'split_interest':
        return this.handleSplitInterest(text)
      case 'amount':
        return this.handleAmount(text)
      case 'plan_confirm':
        return this.handlePlanConfirm(text)
      case 'payment_details':
        return this.handlePaymentDetails(text)
      case 'dispute_date':
        return this.handleDisputeDate(text)
      case 'callback_confirm':
        return this.handleCallbackConfirm(text)
      case 'alternative':
        return this.handleAlternative(text)
      case 'hardship_confirm':
        return this.handleHardshipConfirm(text)
      case 'sensitive_confirm':
        return this.handleSensitiveConfirm(text)
      case 'close':
        return this.handleClose(text)
      default:
        return this.reply('Could you tell me a little more about what would help?')
    }
  }

  private reply(text: string, actions: AgentAction[] = [], end = false): AgentReply {
    return {
      text,
      actions,
      stage: this.stage,
      disposition: this.disposition,
      end,
    }
  }

  private logDisposition(detail: string): AgentAction {
    return action('log_disposition', 'Disposition written to CRM', detail)
  }

  private finish(text: string, disposition: Disposition, actions: AgentAction[], label: string): AgentReply {
    this.stage =
      disposition === 'hardship' || disposition === 'dispute' || disposition === 'priority_help'
        ? 'handoff'
        : 'closed'
    this.awaiting = 'none'
    this.disposition = disposition
    return this.reply(text, [...actions, this.logDisposition(label)], true)
  }

  private handleIdentityConfirm(text: string): AgentReply {
    if (isWrongParty(text) || isNegative(text)) return this.wrongParty()

    if (has(text, /\b(who is this|what is this|why are you calling|which bank)\b/i)) {
      return this.reply(
        `This is Ananya, Axis Bank's AI assistant, calling about an account with Axis Bank. I haven't shared any account details. Am I speaking with ${this.profile.salutation} ${this.lastName}?`,
      )
    }

    if (isAffirmative(text) || has(text, /\bthis is\b/i)) {
      this.awaiting = 'identity_code'
      return this.reply(
        'Thank you. To protect your account, could you confirm the last four digits of the PAN registered with us?',
      )
    }

    return this.reply(
      `I want to be sure I am speaking with the account holder. Am I speaking with ${this.profile.salutation} ${this.lastName}?`,
    )
  }

  private handleIdentityCode(text: string): AgentReply {
    if (has(text, /\b(don't have|do not have|can't find|cannot find|not with me|don't remember)\b/i)) {
      return this.offerSecureCallback()
    }

    const compact = text.replace(/[\s-]/g, '')
    if (compact.includes(this.profile.panLast4)) {
      this.verified = true
      this.stage = 'disclose'
      this.awaiting = 'reason'
      return this.reply(
        `Thank you. Your EMI of ${money(this.profile.emi)} was due on ${this.profile.dueDate} and is now ${this.profile.dpd} days overdue. I'm calling to help you clear it or find a plan. What's making it difficult to pay?`,
        [action('verify_identity', 'Identity verified', 'PAN last four matched')],
      )
    }

    this.verifyAttempts += 1
    if (this.verifyAttempts < 2) {
      return this.reply(
        "That doesn't match the record. I can try once more. Please confirm the last four digits of your PAN.",
      )
    }

    return this.offerSecureCallback()
  }

  private offerSecureCallback(): AgentReply {
    this.stage = 'handoff'
    this.awaiting = 'secure_callback_confirm'
    return this.reply(
      "I'm not able to verify the account on this call, so I won't discuss any details. I can arrange a secure callback from a human colleague. Would that be okay?",
    )
  }

  private handleSecureCallbackConfirm(text: string): AgentReply {
    if (isAffirmative(text)) {
      return this.finish(
        "Thank you. A colleague will call you back within two working hours. They'll verify the account before discussing anything. Goodbye.",
        'unverified',
        [
          action('schedule_callback', 'Secure callback scheduled', 'Within two working hours'),
          action('warm_transfer', 'Secure handoff queued', 'Verification required before disclosure'),
        ],
        'Unverified — secure callback arranged',
      )
    }

    return this.finish(
      "Understood. I'll end the call here. Thank you.",
      'unverified',
      [],
      'Unverified — call ended without disclosure',
    )
  }

  private wrongParty(): AgentReply {
    return this.finish(
      "I'm sorry to disturb you. I'll update our records and won't share any account details. Thank you.",
      'wrong_party',
      [action('mark_wrong_party', 'Wrong-party flag added', 'Number suppressed from this campaign')],
      'Wrong party — no account details disclosed',
    )
  }

  private honourDnc(): AgentReply {
    return this.finish(
      "Understood. I'm recording your request now and will stop collection calls to this number. You won't need to repeat it. Thank you.",
      'dnc',
      [action('honor_dnc', 'DNC request honoured', 'Voice campaign suppression applied')],
      'Do not call — suppression applied',
    )
  }

  private priorityHelp(): AgentReply {
    return this.finish(
      "I'm really sorry you're going through this. Your safety comes first. I'm pausing collection contact and connecting you with a human now. If you're in immediate danger, please contact local emergency services.",
      'priority_help',
      [
        action('pause_collections', 'Collections paused', 'Priority assistance flow triggered'),
        action('escalate_priority', 'Priority desk alerted', 'Immediate human handoff'),
        action('warm_transfer', 'Warm transfer requested', 'Context passed to trained specialist'),
      ],
      'Priority help — collections paused',
    )
  }

  private humanHandoff(): AgentReply {
    const detail = this.verified ? 'Context passed to a human colleague' : 'Secure verification required first'
    return this.finish(
      this.verified
        ? "Of course. I'll bring in a human colleague who has the context so you don't have to repeat it. Please hold."
        : "Of course. I'll connect you to a human colleague who can verify the account securely. Please hold.",
      'no_commitment',
      [action('warm_transfer', 'Warm transfer requested', detail)],
      'Human handoff requested',
    )
  }

  private handleAbuse(): AgentReply {
    this.abuseCount += 1
    if (this.abuseCount > 1) {
      return this.finish(
        "I'm going to end the call now. We can continue when we can keep the conversation respectful. Thank you.",
        'no_commitment',
        [],
        'Call ended — abusive language',
      )
    }
    return this.reply(
      "I understand this is frustrating, and I want to help. I need us to keep this respectful. Would a callback or a human colleague be easier?",
    )
  }

  private handleSensitiveQuestion(text: string): AgentReply | null {
    if (has(text, /\b(credit score|credit report|cibil|credit bureau)\b/i)) {
      return this.reply(
        "I can't promise a specific credit score outcome. Payments are reported based on the account status, and clearing the overdue amount by the promised date prevents further late reporting.",
      )
    }

    if (has(text, /\b(settlement|waive|waiver|write.?off|reduce the amount|discount)\b/i)) {
      return this.offerSensitiveHandoff('waiver')
    }

    if (has(text, /\b(legal|court|police|arrest|lawyer|notice)\b/i)) {
      return this.offerSensitiveHandoff('legal')
    }

    if (has(text, /\b(otp|cvv|pin|card number|password|net banking password)\b/i)) {
      return this.reply(
        "Please don't share card numbers, CVV, PINs or OTPs with anyone on this call. Axis Bank will never ask for them. I already have the account context I need.",
      )
    }

    return null
  }

  private offerSensitiveHandoff(topic: 'waiver' | 'legal'): AgentReply {
    if (this.awaiting !== 'sensitive_confirm') {
      this.sensitiveResume = { awaiting: this.awaiting, stage: this.stage }
      this.sensitiveTopic = topic
      this.awaiting = 'sensitive_confirm'
    }

    return this.reply(
      topic === 'waiver'
        ? "I can't approve a waiver or settlement on this call, and I can't promise one. A specialist can review whether you're eligible. Would you like a specialist callback?"
        : "I'm not able to discuss legal matters, and I won't make any threats. A specialist can help with that query separately. Would you like a specialist callback?",
    )
  }

  private handleSensitiveConfirm(text: string): AgentReply {
    const topic = this.sensitiveTopic
    const resume = this.sensitiveResume

    if (
      has(text, /\b(pay|payment|link|plan|amount|instal?lment|emi)\b/i) &&
      !has(text, /\b(specialist|callback|human)\b/i)
    ) {
      this.sensitiveTopic = null
      this.sensitiveResume = null
      if (resume) {
        this.stage = resume.stage
        this.awaiting = resume.awaiting
      }
      return this.reply(`Understood. ${this.resumePrompt()}`)
    }

    if (isAffirmative(text)) {
      this.sensitiveTopic = null
      this.sensitiveResume = null
      if (topic === 'waiver') {
        return this.finish(
          "Understood. I've arranged a callback from our hardship specialist within one working day. They'll review the options you may be eligible for. I've paused automated reminders until then. Take care.",
          'hardship',
          [
            action('schedule_callback', 'Specialist callback scheduled', 'Within one working day'),
            action('escalate_hardship', 'Hardship desk assigned', 'Waiver or settlement review requested'),
            action('pause_reminders', 'Automated reminders paused', 'While options are reviewed'),
          ],
          'Sensitive request — hardship specialist callback',
        )
      }
      return this.finish(
        "I've arranged a callback from the team that handles legal queries. They'll contact you separately within one working day. I can't discuss legal matters on this call. Thank you.",
        'no_commitment',
        [
          action('schedule_callback', 'Specialist callback scheduled', 'Within one working day'),
          action('warm_transfer', 'Legal specialist handoff queued', 'No legal discussion on this call'),
        ],
        'Sensitive request — legal specialist callback',
      )
    }

    if (isNegative(text)) {
      this.sensitiveTopic = null
      this.sensitiveResume = null
      if (resume) {
        this.stage = resume.stage
        this.awaiting = resume.awaiting
      } else {
        this.awaiting = 'close'
      }
      return this.reply(`Understood. ${this.resumePrompt()}`)
    }

    return this.reply('Would you like me to arrange the specialist callback?')
  }

  private resumePrompt(): string {
    switch (this.awaiting) {
      case 'plan_confirm':
        return this.offer
          ? this.offer.rest > 0
            ? `Should I send the link for ${money(this.offer.today)} now and set ${money(this.offer.rest)} for ${this.offer.date}?`
            : `Should I send the secure link for ${money(this.offer.today)} now?`
          : 'Shall we continue?'
      case 'alternative':
        return 'Would a different amount, a later date, or a callback be easier?'
      case 'amount':
        return 'How much could you pay today?'
      case 'callback_confirm':
        return `Would ${this.callbackTime} still work for a callback?`
      case 'hardship_confirm':
        return `Would ${this.callbackTime} work for a specialist callback?`
      case 'identity_confirm':
        return `Am I speaking with ${this.profile.salutation} ${this.lastName}?`
      case 'identity_code':
        return 'Could you confirm the last four digits of the PAN registered with us?'
      case 'secure_callback_confirm':
        return 'Would a secure callback from a human colleague be okay?'
      case 'payment_details':
        return 'When did you pay, and was it UPI, net banking, or at a branch?'
      case 'dispute_date':
        return 'Can you confirm the transaction date?'
      case 'close':
        return 'Is there anything else I can help with?'
      case 'reason':
        return "What's making it difficult to pay?"
      default:
        return 'Shall we continue?'
    }
  }

  private handleChannelPreference(): AgentReply {
    this.stage = 'negotiate'
    this.awaiting = 'callback_confirm'
    this.callbackTime = 'after 6 pm today'
    return this.reply(
      "Understood. I'll note not to call this number at work. Would a callback on your mobile after 6 pm today be okay?",
    )
  }

  private handleReason(text: string): AgentReply {
    this.stage = 'discover'

    if (has(text, /\b(already paid|payment (is )?done|paid (it|the|yesterday|last)|cleared (it|the)|made the payment)\b/i)) {
      this.stage = 'discover'
      this.awaiting = 'payment_details'
      return this.reply(
        'Thanks for telling me. When did you pay, and was it UPI, net banking, or at a branch?',
      )
    }

    if (has(text, /\b(dispute|not recognise|not recognize|unauthori[sz]ed|fraud|wrong charge|chargeback|not my (transaction|charge))\b/i)) {
      this.stage = 'discover'
      this.awaiting = 'dispute_date'
      return this.reply(
        "I understand. I'll pause collection activity on the disputed amount and connect you with the disputes team. Can you confirm the transaction date?",
      )
    }

    if (
      has(
        text,
        /\b(lost my job|laid off|job loss|medical|hospital|surgery|bereave|passed away|hardship|no income|can't afford|cannot afford)\b/i,
      )
    ) {
      return this.offerHardship()
    }

    if (has(text, /\b(salary (is )?(delayed|late)|salary.*(not|delay)|waiting for salary|next salary|payday)\b/i)) {
      this.stage = 'negotiate'
      this.awaiting = 'split_interest'
      return this.reply(
        `I understand. Salary timing can make a clean payment hard. Would it help to split it: a part payment today, and the rest on ${this.profile.nextSalaryDate}?`,
      )
    }

    if (has(text, /\b(can't pay|cannot pay|no money|unable to pay|not able to pay|don't have the money|short of funds)\b/i)) {
      this.stage = 'discover'
      this.awaiting = 'hardship_probe'
      return this.reply(
        'I understand. Is this a short-term cash-flow issue, or has something changed with your income?',
      )
    }

    if (has(text, /\b(busy|driving|in a meeting|later|call back|not a good time|bad time)\b/i)) {
      this.stage = 'negotiate'
      this.awaiting = 'callback_confirm'
      this.callbackTime = `${this.profile.bestTime} today`
      return this.reply(
        `Of course. I can call back at a better time. Would ${this.callbackTime} work?`,
      )
    }

    const amount = extractAmount(text)
    if (amount) return this.offerPlan(amount, text)

    if (has(text, /\b(pay|clear|settle|transfer)\b/i)) {
      this.stage = 'negotiate'
      this.awaiting = 'amount'
      return this.reply(
        `I can work with that. Can you clear the full ${money(this.profile.emi)} today, or would a part payment now be easier?`,
      )
    }

    return this.reply(
      "I want to make sure I help with the right thing. Are you able to clear the EMI now, or is something making it difficult?",
    )
  }

  private handleHardshipProbe(text: string): AgentReply {
    if (has(text, /\b(temporary|short.term|cash.?flow|next month|salary)\b/i)) {
      this.stage = 'negotiate'
      this.awaiting = 'callback_confirm'
      this.callbackTime = `${this.profile.nextSalaryDate} at ${this.profile.bestTime}`
      return this.reply(
        `Thank you for clarifying. Would a callback after your next salary, on ${this.callbackTime}, be useful?`,
      )
    }

    if (has(text, /\b(lost my job|laid off|job loss|medical|hospital|no income|long.term)\b/i)) {
      return this.offerHardship()
    }

    this.stage = 'negotiate'
    this.awaiting = 'hardship_confirm'
    return this.reply(
      'Thank you for explaining. The most useful next step may be a specialist who can review your options. Would a callback today at 5 pm work?',
    )
  }

  private offerHardship(): AgentReply {
    this.stage = 'handoff'
    this.awaiting = 'hardship_confirm'
    this.callbackTime = '5 pm today'
    return this.reply(
      "I'm sorry you're going through that. I won't push for a payment today. I can connect you with a specialist who can check EMI restructuring or a suitable plan. Would a callback today at 5 pm work?",
    )
  }

  private handleSplitInterest(text: string): AgentReply {
    const amount = extractAmount(text)
    if (amount) return this.offerPlan(amount, text)

    if (isAffirmative(text)) {
      this.awaiting = 'amount'
      return this.reply(
        'How much can you pay today? Even a part payment keeps the account moving.',
      )
    }

    if (isNegative(text)) {
      this.awaiting = 'amount'
      return this.reply(
        'What would be manageable? I can look at a part payment or a callback after your salary.',
      )
    }

    return this.reply(
      'Would a part payment today, with the rest after your salary, be manageable?',
    )
  }

  private handleAmount(text: string): AgentReply {
    const amount = extractAmount(text)
    if (amount) return this.offerPlan(amount, text)

    if (has(text, /\b(callback|later|salary)\b/i)) {
      this.awaiting = 'callback_confirm'
      this.callbackTime = `${this.profile.nextSalaryDate} at ${this.profile.bestTime}`
      return this.reply(
        `That's okay. Would a callback on ${this.callbackTime} work?`,
      )
    }

    return this.reply('How much could you put down today? A part payment is okay.')
  }

  private offerPlan(amount: number, sourceText: string): AgentReply {
    const emi = this.profile.emi
    this.stage = 'confirm'

    if (amount >= emi) {
      this.offer = { today: emi, rest: 0, date: 'today' }
      this.awaiting = 'plan_confirm'
      return this.reply(
        `That clears the EMI. I can send a secure UPI link for ${money(emi)} now. Would you like it on WhatsApp?`,
      )
    }

    if (amount < 500) {
      this.stage = 'negotiate'
      this.awaiting = 'amount'
      return this.reply(
        `A payment of ${money(amount)} would not reduce the overdue amount meaningfully. Is there a higher amount you could manage today?`,
      )
    }

    const rest = emi - amount
    const date = hasExplicitDate(sourceText)
      ? extractDate(sourceText, this.profile)
      : this.offer?.date ?? extractDate(sourceText, this.profile)
    this.offer = { today: amount, rest, date }
    this.awaiting = 'plan_confirm'
    return this.reply(
      `That works. I can send a secure UPI link for ${money(amount)} now, and set the remaining ${money(rest)} for ${date}. I'll also send a reminder 24 hours before. Would you like the link on WhatsApp?`,
    )
  }

  private handlePlanConfirm(text: string): AgentReply {
    const revisedAmount = extractAmount(text)
    if (revisedAmount && this.offer && revisedAmount !== this.offer.today) {
      return this.offerPlan(revisedAmount, text)
    }

    if (this.offer && hasExplicitDate(text)) {
      const revisedDate = extractDate(text, this.profile)
      if (revisedDate !== this.offer.date) {
        if (this.offer.rest > 0) {
          this.offer = { ...this.offer, date: revisedDate }
          this.awaiting = 'plan_confirm'
          return this.reply(
            `I've updated the remaining ${money(this.offer.rest)} to ${revisedDate}. I'll send the secure UPI link for ${money(this.offer.today)} now and a reminder 24 hours before. Does that work?`,
          )
        }
        this.offer = { today: 0, rest: this.profile.emi, date: revisedDate }
        this.awaiting = 'plan_confirm'
        return this.reply(
          `I can set the full ${money(this.profile.emi)} for ${revisedDate} instead. I'll send a payment link closer to the date. Does that work?`,
        )
      }
    }

    if (isNegative(text)) {
      this.awaiting = 'alternative'
      return this.reply(
        'No problem. Would a different amount today, a later date, or a callback be easier?',
      )
    }

    if (!isAffirmative(text)) {
      return this.reply(
        'Just to confirm: can I send the secure link and set the remaining amount for the date we discussed?',
      )
    }

    if (!this.offer) {
      this.awaiting = 'alternative'
      return this.reply('What would be a manageable plan for you?')
    }

    const { today, rest, date } = this.offer
    this.stage = 'confirm'
    this.awaiting = 'close'
    this.disposition = 'ptp'

    if (rest === 0) {
      return this.reply(
        `Done. I've logged a promise to pay ${money(today)} today and I'm sending the secure UPI link and a WhatsApp confirmation now. Is there anything else I can help with?`,
        [
          action('create_ptp', 'Promise to pay created', `${money(today)} · today`),
          action('send_payment_link', 'Secure UPI link generated', `${money(today)} · WhatsApp`),
          action('send_whatsapp', 'WhatsApp confirmation queued', 'Payment link and reference'),
          this.logDisposition('PTP — full payment today'),
        ],
      )
    }

    if (today === 0) {
      return this.reply(
        `Done. I've set the full ${money(rest)} for ${date} and I'll send a reminder 24 hours before. A payment link will be available closer to the date. Is there anything else I can help with?`,
        [
          action('create_ptp', 'Promise to pay created', `${money(rest)} by ${date}`),
          action('send_whatsapp', 'WhatsApp confirmation queued', `Plan through ${date}`),
          action('schedule_reminder', 'Reminder scheduled', `24 hours before ${date}`),
          this.logDisposition('PTP — full payment on revised date'),
        ],
      )
    }

    return this.reply(
      `Done. I've noted ${money(today)} today and ${money(rest)} by ${date}. I'm sending the secure UPI link and a WhatsApp confirmation now, with a reminder 24 hours before ${date}. Is there anything else I can help with?`,
      [
        action('create_ptp', 'Promise to pay created', `${money(rest)} by ${date}`),
        action('send_payment_link', 'Secure UPI link generated', `${money(today)} · WhatsApp`),
        action('send_whatsapp', 'WhatsApp confirmation queued', `Plan through ${date}`),
        action('schedule_reminder', 'Reminder scheduled', `24 hours before ${date}`),
        this.logDisposition('PTP — part payment plus dated balance'),
      ],
    )
  }

  private handleAlternative(text: string): AgentReply {
    const amount = extractAmount(text)
    if (amount) return this.offerPlan(amount, text)

    if (has(text, /\b(callback|later|salary|call me)\b/i)) {
      this.stage = 'negotiate'
      this.awaiting = 'callback_confirm'
      this.callbackTime = `${this.profile.nextSalaryDate} at ${this.profile.bestTime}`
      return this.reply(
        `Would ${this.callbackTime} work for a callback?`,
      )
    }

    if (has(text, /\b(hardship|lost my job|medical|can't afford|cannot afford)\b/i)) {
      return this.offerHardship()
    }

    this.stage = 'negotiate'
    this.awaiting = 'callback_confirm'
    return this.reply(
      `I don't want to pressure you. Would a callback after your salary, on ${this.profile.nextSalaryDate}, be useful?`,
    )
  }

  private handlePaymentDetails(text: string): AgentReply {
    if (
      has(
        text,
        /\b(not (yet )?paid|haven'?t paid|have not paid|didn'?t pay|did not pay|no payment|not made (the )?payment)\b/i,
      )
    ) {
      this.stage = 'discover'
      this.awaiting = 'reason'
      this.disposition = undefined
      return this.reply(
        "Thank you for clarifying. I'll unpause reminders because no payment has been confirmed yet. What's making it difficult to pay?",
      )
    }

    this.stage = 'confirm'
    this.awaiting = 'close'
    this.disposition = 'paid'
    return this.reply(
      `Thank you. I'll pause reminders while the payment is traced. If it doesn't reflect within 48 hours, reply to the SMS with your payment reference. I'm sending a confirmation on WhatsApp now. Is there anything else I can help with?`,
      [
        action('pause_reminders', 'Reminders paused', 'Payment trace window: 48 hours'),
        action('send_whatsapp', 'Payment confirmation queued', 'Reference request included'),
        this.logDisposition('Already paid — verification requested'),
      ],
    )
  }

  private handleDisputeDate(text: string): AgentReply {
    const date = has(text, /\b\d{1,2}\b/) ? extractDate(text, this.profile) : 'the date you mentioned'
    this.stage = 'confirm'
    this.awaiting = 'close'
    this.disposition = 'dispute'
    return this.reply(
      `Thank you. I've logged a dispute for the transaction on ${date} and paused collection activity on that amount. A disputes specialist will call you within one working day. Please don't share card details with anyone. Is there anything else I can help with?`,
      [
        action('pause_collections', 'Collections paused', 'Disputed amount excluded'),
        action('escalate_dispute', 'Disputes specialist assigned', 'Callback within one working day'),
        action('send_whatsapp', 'Dispute reference queued', 'Reference and next steps'),
        this.logDisposition('Dispute — collections paused'),
      ],
    )
  }

  private handleCallbackConfirm(text: string): AgentReply {
    const revisedTime = extractClock(text) || hasExplicitDate(text)
    if (revisedTime) {
      if (has(text, /\b(doesn'?t|does not|won'?t|will not|not)\s+work\b/i)) {
        return this.reply('What time would be better for the callback?')
      }
      this.callbackTime = revisedCallbackTime(text, this.callbackTime, this.profile)
      return this.scheduleCallback()
    }

    if (isNegative(text) && !isAffirmative(text)) {
      return this.finish(
        "Understood. I'll close the call for now. You can reach us through the number on your card statement. Thank you.",
        'no_commitment',
        [action('pause_reminders', 'Automated reminders paused', 'Customer declined callback')],
        'No commitment — respectful close',
      )
    }

    return this.scheduleCallback()
  }

  private scheduleCallback(): AgentReply {
    const time = this.callbackTime
    return this.finish(
      `Thank you. I've arranged a callback for ${time}. You'll get a confirmation on WhatsApp, and I've paused automated reminders until then. Take care.`,
      'callback',
      [
        action('schedule_callback', 'Callback scheduled', time),
        action('send_whatsapp', 'Callback confirmation queued', time),
        action('pause_reminders', 'Automated reminders paused', 'Until the callback'),
      ],
      `Callback — ${time}`,
    )
  }

  private handleHardshipConfirm(text: string): AgentReply {
    if (extractClock(text) || hasExplicitDate(text)) {
      if (has(text, /\b(doesn'?t|does not|won'?t|will not|not)\s+work\b/i)) {
        return this.reply('What time would be better for the callback?')
      }
      this.callbackTime = revisedCallbackTime(text, this.callbackTime, this.profile)
      return this.scheduleHardshipCallback()
    }

    if (isNegative(text) && !isAffirmative(text)) {
      this.awaiting = 'callback_confirm'
      this.callbackTime = '5 pm tomorrow'
      return this.reply(
        'That’s okay. Would 5 pm tomorrow be easier?',
      )
    }

    return this.scheduleHardshipCallback()
  }

  private scheduleHardshipCallback(): AgentReply {
    return this.finish(
      `Thank you. I've arranged a callback for ${this.callbackTime}. A specialist will review EMI restructuring and other options with you. I've paused automated reminders in the meantime. Take care.`,
      'hardship',
      [
        action('schedule_callback', 'Hardship callback scheduled', this.callbackTime),
        action('escalate_hardship', 'Hardship desk assigned', 'Restructuring review requested'),
        action('pause_reminders', 'Automated reminders paused', 'While options are reviewed'),
        action('send_whatsapp', 'Callback confirmation queued', this.callbackTime),
      ],
      'Hardship — specialist handoff',
    )
  }

  private handleClose(text: string): AgentReply {
    if (has(text, /\b(no need|don'?t need|do not need|not needed|don'?t want)\b/i)) {
      this.stage = 'closed'
      this.awaiting = 'none'
      return this.reply(
        `Understood. Thank you, ${this.profile.salutation} ${this.lastName}. I appreciate your time. Goodbye.`,
        [],
        true,
      )
    }

    if (has(text, /\b(e-?mail)\b/i)) {
      return this.reply(
        "I've added your registered email to the delivery. The plan stays the same. Is there anything else I can help with?",
        [action('send_payment_link', 'Secure link sent by email', 'Registered email address')],
      )
    }

    if (has(text, /\b(pay|payment|link|upi|plan|amount|date|reschedule)\b/i)) {
      this.stage = 'confirm'
      this.awaiting = 'alternative'
      return this.reply('Of course. What would you like to change about the plan?')
    }

    if (
      isNegative(text) ||
      has(text, /\b(that'?s all|that is all|nothing else|no more|thanks|thank you)\b/i)
    ) {
      this.stage = 'closed'
      this.awaiting = 'none'
      return this.reply(
        `Thank you, ${this.profile.salutation} ${this.lastName}. I appreciate your time. Goodbye.`,
        [],
        true,
      )
    }

    this.stage = 'handoff'
    this.awaiting = 'none'
    return this.reply(
      "A human colleague can help with that. I'll arrange a callback so you don't have to repeat the details.",
      [
        action('schedule_callback', 'Follow-up callback scheduled', 'Within one working day'),
        action('warm_transfer', 'Human follow-up queued', 'Context passed to colleague'),
        this.logDisposition('Follow-up requested at close'),
      ],
      true,
    )
  }
}
