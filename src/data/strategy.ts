export const METRICS = [
  {
    name: '7-day cash conversion',
    role: 'North star',
    formula: 'Verified RPC accounts with a payment that clears the overdue EMI within 7 days ÷ verified RPC accounts.',
    why: 'Counts money, not promises. The denominator excludes wrong numbers and unverified calls.',
    cadence: 'Daily · weekly cohort',
  },
  {
    name: 'Kept-promise rate',
    role: 'Leading outcome',
    formula: 'Promises paid in full by promise date + 1 day ÷ promises created.',
    why: 'Shows whether the agent is setting realistic promises or just collecting soft yeses.',
    cadence: 'Daily',
  },
  {
    name: 'Right-party contact rate',
    role: 'Funnel',
    formula: 'Verified account holders reached ÷ dial attempts.',
    why: 'A script cannot help a call that never reaches the customer. Cut by list, number health and call time.',
    cadence: 'Daily',
  },
  {
    name: 'Resolution rate',
    role: 'Funnel',
    formula: 'Verified RPCs ending in payment, PTP, plan, or accepted handoff ÷ verified RPCs.',
    why: 'Separates a clean no-commitment close from a call that simply failed to resolve.',
    cadence: 'Daily',
  },
  {
    name: 'Cost per cure',
    role: 'Unit economics',
    formula: 'Fully loaded voice, telephony, payment and human-transfer cost ÷ accounts cured in the cohort.',
    why: 'Prevents “conversion at any cost”. Includes transfers and failed payment links.',
    cadence: 'Weekly',
  },
  {
    name: 'Policy defects',
    role: 'Guardrail',
    formula: 'Calls with a disclosure, DNC, threat, card-data, or misrepresentation defect ÷ 100 calls.',
    why: 'A conversion lift that creates complaints or regulatory exposure is not a lift.',
    cadence: 'Daily automated · weekly human QA',
  },
  {
    name: 'Customer experience',
    role: 'Guardrail',
    formula: 'Complaints, opt-outs, and post-call CSAT by language and segment.',
    why: 'Trust is a leading indicator of future collections performance.',
    cadence: 'Weekly',
  },
  {
    name: 'Latency + containment',
    role: 'Experience',
    formula: 'p50 / p95 turn latency; correct human handoffs ÷ handoffs; drop rate.',
    why: 'Voice quality is conversion. Long pauses and wrong transfers destroy both.',
    cadence: 'Real time · daily',
  },
]

export const MEASUREMENT_STEPS = [
  {
    index: '01',
    title: 'Event ledger, not call notes',
    body: 'Log every turn, intent, consent, tool call, promise date, payment link and disposition against an immutable call_id. Transcripts are evidence; the ledger is the source of truth.',
  },
  {
    index: '02',
    title: 'Match the payment ledger',
    body: 'Join account_id and call date to actual payments. Never count a self-reported payment or a PTP as cash. Reconcile reversals and duplicate payments.',
  },
  {
    index: '03',
    title: 'Keep a holdout',
    body: 'Randomise 5–10% of eligible accounts to standard treatment. Measure incremental cash, not raw lift against last month. For timing tests, use a matched control.',
  },
  {
    index: '04',
    title: 'Read out with guardrails',
    body: 'Use intent-to-treat with 95% confidence intervals. A win must clear conversion, kept-promise and complaint thresholds. Review segment fairness monthly.',
  },
]

export const LEVERS = [
  {
    index: '01',
    title: 'Reach the right person',
    multiplier: '1.15×',
    subtitle: 'RPC hypothesis',
    body: 'Move calls to salary-cycle windows, improve number health and retry cadence, and use a low-disclosure WhatsApp pre-call. Test against a timing holdout.',
    proof: 'Verified RPC rate by hour, number source and attempt number.',
  },
  {
    index: '02',
    title: 'Match the reason',
    multiplier: '1.20×',
    subtitle: 'Resolution hypothesis',
    body: 'Route salary delay, hardship, dispute and forgetfulness into different playbooks. Stop using one negotiation script for four different problems.',
    proof: 'Resolution rate by intent; QA pass rate; human-transfer correctness.',
  },
  {
    index: '03',
    title: 'Remove payment friction',
    multiplier: '1.18×',
    subtitle: 'PTP-to-cash hypothesis',
    body: 'Send the UPI link during the call, support part payment, fall back to WhatsApp, and confirm the payment before the customer hangs up.',
    proof: 'Link-to-payment completion, time to pay, PTP-to-cash within 7 days.',
  },
  {
    index: '04',
    title: 'Keep the promise',
    multiplier: '1.22×',
    subtitle: 'Kept-promise hypothesis',
    body: 'Remind 24 hours before, recover the same day when a promise breaks, and let the customer reschedule without restarting the whole conversation.',
    proof: 'Kept-promise rate, recovery rate after a broken promise, opt-outs.',
  },
]

export const EXPERIMENTS = [
  {
    name: 'In-call UPI + partial pay',
    hypothesis: 'A link in the same call raises PTP-to-cash.',
    design: '50/50 split, stratified by DPD and balance.',
    metric: '7-day cash conversion',
    guardrail: 'Complaints · duplicate payments',
    window: '2 weeks',
    priority: 'Ship first',
  },
  {
    name: 'Salary-cycle sequencing',
    hypothesis: 'Calling near salary credit improves reach and kept promises.',
    design: 'Randomised timing holdout, 4-week run.',
    metric: 'RPC · kept-promise rate',
    guardrail: 'DNC · complaints',
    window: '4 weeks',
    priority: 'High',
  },
  {
    name: 'Reason-matched playbooks',
    hypothesis: 'Separate flows for salary delay, hardship, dispute and already-paid beat one script.',
    design: '4-arm test on verified RPCs.',
    metric: 'Resolution rate',
    guardrail: 'Policy defects · CSAT',
    window: '4 weeks',
    priority: 'High',
  },
  {
    name: 'Promise reminder ladder',
    hypothesis: 'A 24-hour nudge plus same-day recovery increases kept promises.',
    design: '50/50 split on PTP accounts.',
    metric: 'Kept-promise rate',
    guardrail: 'Opt-outs · complaints',
    window: '3 weeks',
    priority: 'Ship first',
  },
  {
    name: 'Warm transfer for high value',
    hypothesis: 'Human handoff beats automation for high-balance hardship cases.',
    design: 'Stepped wedge by team.',
    metric: 'Cash per RPC · cost per cure',
    guardrail: 'Handle time · transfer failure',
    window: '6 weeks',
    priority: 'Later',
  },
]

export const DIAGNOSIS = [
  {
    index: '01',
    title: 'Pin the denominator',
    body: 'The brief says 10%. Is that 10% of dials, connects, verified RPCs, promises, or promises kept? The intervention changes if the leak is reachability versus payment completion.',
  },
  {
    index: '02',
    title: 'Find the biggest leak',
    body: 'Build a four-stage funnel: connect → verify → agree → pay. Do not optimise the script until the payment ledger and the call disposition agree on where the drop happens.',
  },
  {
    index: '03',
    title: 'Listen to 100 calls',
    body: 'Tag the first 30 seconds, the objection, the offer, the close and the payment handoff. Look for repeated repairs: unclear identity check, wrong reason, no link, broken promise follow-up.',
  },
  {
    index: '04',
    title: 'Cut by segment',
    body: 'DPD bucket, balance, language, city tier, salary date, tenure, prior PTP and reason for non-payment. A 20% lift usually hides two segments that are already at 25% and three that are at 4%.',
  },
]

export const FIRST_14_DAYS = [
  {
    days: 'Days 1–3',
    title: 'Instrument',
    body: 'Define conversion. Ship the call event schema and payment-ledger join. Freeze a 5–10% holdout. Publish the first funnel by segment.',
  },
  {
    days: 'Days 4–7',
    title: 'Listen',
    body: 'Review 100 calls with collections and compliance. Fix the top three policy or flow defects. Remove any line that creates pressure or confusion.',
  },
  {
    days: 'Days 8–10',
    title: 'Remove friction',
    body: 'Ship in-call UPI, partial pay and the promise reminder. This is the fastest path to a measurable payment lift, not a prompt rewrite.',
  },
  {
    days: 'Days 11–14',
    title: 'Read out',
    body: 'Check cash, kept promises and guardrails. Kill what did not move. Scale the winning variant into the next segment test.',
  },
]

export const GUARDRAILS = [
  'No increase in complaint rate or DNC misses.',
  'No unverified disclosure to a third party.',
  'No threats, false legal claims, or score promises.',
  'No card data, OTP, CVV or PIN capture.',
  'No uplift that depends on repeated calls after a clear no.',
]
