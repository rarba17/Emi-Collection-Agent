import { describe, expect, it } from 'vitest'
import { runAllScenarios } from '../src/agent/testHarness'
import { SCENARIOS } from '../src/agent/scenarios'

describe('collections agent policy tests', () => {
  it('runs every scripted call without a policy failure', () => {
    const results = runAllScenarios(SCENARIOS)
    const failures = results
      .filter((result) => !result.passed)
      .map((result) => ({
        scenario: result.scenario.slug,
        checks: result.checks.filter((check) => !check.pass),
        transcript: result.transcript,
      }))

    expect(failures).toEqual([])
    expect(results).toHaveLength(7)
  })
})
