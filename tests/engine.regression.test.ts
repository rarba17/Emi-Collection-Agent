import { describe, expect, it } from 'vitest'
import { CollectionsAgent } from '../src/agent/engine'
import type { AgentAction, AgentReply } from '../src/agent/types'

function converse(turns: string[]) {
  const agent = new CollectionsAgent()
  const actions: AgentAction[] = []
  const replies: AgentReply[] = []
  let reply = agent.start()
  replies.push(reply)
  actions.push(...reply.actions)

  for (const turn of turns) {
    reply = agent.respond(turn)
    replies.push(reply)
    actions.push(...reply.actions)
  }

  return { agent, reply, replies, actions }
}

const verified = ['Yes, Rohan speaking.', 'The last four digits of my PAN are 4 8 2 1.']

describe('collections agent regressions', () => {
  it('does not turn a waiver question into a promise-to-pay confirmation', () => {
    const { reply, actions } = converse([
      ...verified,
      'My salary is delayed this month.',
      'I can pay ₹4,000 today and the rest on the 27th.',
      'Can you waive the late fee?',
      'Yes.',
    ])

    expect(reply.disposition).toBe('hardship')
    expect(actions.some((entry) => entry.type === 'create_ptp')).toBe(false)
    expect(actions.some((entry) => entry.type === 'escalate_hardship')).toBe(true)
  })

  it('recalculates the plan when the customer revises the amount', () => {
    const { reply, actions } = converse([
      ...verified,
      'My salary is delayed this month.',
      'I can pay ₹4,000 today and the rest on the 27th.',
      'Yes, but can I pay ₹3,000 instead?',
    ])

    expect(reply.text).toContain('₹3,000')
    expect(reply.text).toContain('₹4,840')
    expect(actions.some((entry) => entry.type === 'create_ptp')).toBe(false)

    const confirmed = converse([
      ...verified,
      'My salary is delayed this month.',
      'I can pay ₹4,000 today and the rest on the 27th.',
      'Yes, but can I pay ₹3,000 instead?',
      'Yes, WhatsApp is fine.',
    ])

    expect(confirmed.reply.disposition).toBe('ptp')
    expect(
      confirmed.actions.some(
        (entry) => entry.type === 'create_ptp' && entry.detail.includes('₹4,840'),
      ),
    ).toBe(true)
    expect(
      confirmed.actions.some(
        (entry) => entry.type === 'send_payment_link' && entry.detail.includes('₹3,000'),
      ),
    ).toBe(true)
  })

  it('reschedules the callback when the customer gives a new time', () => {
    const { reply, actions } = converse([
      ...verified,
      "I can't pay this month.",
      'It is a temporary cash-flow issue, my salary is due.',
      'Actually, 6 pm is better.',
    ])

    expect(reply.disposition).toBe('callback')
    expect(
      actions.some(
        (entry) => entry.type === 'schedule_callback' && entry.detail === '6 pm on 27 October',
      ),
    ).toBe(true)
  })

  it('allows a customer to correct an already-paid claim before the call closes', () => {
    const { reply, actions } = converse([
      ...verified,
      'I already paid yesterday through UPI.',
      "Actually no, I haven't paid yet.",
      'I can pay ₹4,000 today.',
      'Yes, WhatsApp is fine.',
    ])

    expect(reply.disposition).toBe('ptp')
    expect(actions.some((entry) => entry.type === 'create_ptp')).toBe(true)
    expect(
      actions.some(
        (entry) =>
          entry.type === 'log_disposition' && entry.detail.toLowerCase().includes('already paid'),
      ),
    ).toBe(false)
  })

  it('treats a work-hours channel preference as a callback, not a DNC request', () => {
    const { reply, actions } = converse([
      ...verified,
      "Don't call me at work. Call my mobile after 6 pm.",
      'Yes, that works.',
    ])

    expect(reply.disposition).toBe('callback')
    expect(actions.some((entry) => entry.type === 'honor_dnc')).toBe(false)
    expect(actions.some((entry) => entry.type === 'schedule_callback')).toBe(true)
  })

  it('handles a link-delivery change after the plan is confirmed', () => {
    const { reply, actions, replies } = converse([
      ...verified,
      'My salary is delayed this month.',
      'I can pay ₹4,000 today and the rest on the 27th.',
      'Yes, WhatsApp is fine.',
      'Yes, I need the link on email instead.',
    ])

    expect(replies.at(-2)?.end).toBe(false)
    expect(reply.end).toBe(false)
    expect(
      actions.some(
        (entry) => entry.type === 'send_payment_link' && entry.detail.includes('email'),
      ),
    ).toBe(true)
  })
})
