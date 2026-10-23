import { CollectionsAgent } from './engine'
import { DEMO_PROFILE } from './profile'
import type { AgentAction, CheckResult, ConversationTurn, Scenario, ScenarioResult } from './types'

const UNIVERSAL_FORBIDDEN = [
  /or else|consequences/i,
  /guarantee.*(waiver|approval|credit score)/i,
  /(share|tell me|give me).*(otp|cvv|pin|password)/i,
  /arrest|police complaint|legal action/i,
]

export function runScenario(scenario: Scenario, profile = DEMO_PROFILE): ScenarioResult {
  const agent = new CollectionsAgent(profile)
  const transcript: ConversationTurn[] = []
  const actions: AgentAction[] = []

  let reply = agent.start()
  transcript.push({ speaker: 'agent', text: reply.text })
  actions.push(...reply.actions)

  for (const customerTurn of scenario.turns) {
    if (reply.end) break
    transcript.push({ speaker: 'customer', text: customerTurn })
    reply = agent.respond(customerTurn)
    transcript.push({ speaker: 'agent', text: reply.text })
    actions.push(...reply.actions)
  }

  const agentText = transcript
    .filter((turn) => turn.speaker === 'agent')
    .map((turn) => turn.text)
    .join('\n')

  const forbidden = [...UNIVERSAL_FORBIDDEN, ...(scenario.forbiddenAgentText ?? [])]
  const checks: CheckResult[] = [
    {
      label: `Disposition is ${scenario.expectedDisposition}`,
      pass: reply.disposition === scenario.expectedDisposition,
    },
    ...scenario.requiredActions.map((required) => ({
      label: `Action recorded: ${required}`,
      pass: actions.some((entry) => entry.type === required),
    })),
    {
      label: 'No prohibited language or disclosure',
      pass: forbidden.every((pattern) => !pattern.test(agentText)),
    },
    {
      label: 'Call ends with a recorded next step',
      pass:
        reply.end &&
        actions.some((entry) => entry.type === 'log_disposition' || entry.type === 'mark_wrong_party'),
    },
  ]

  return {
    scenario,
    transcript,
    actions,
    disposition: reply.disposition,
    checks,
    passed: checks.every((check) => check.pass),
  }
}

export function runAllScenarios(scenarios: Scenario[]): ScenarioResult[] {
  return scenarios.map((scenario) => runScenario(scenario))
}
