import { describe, expect, it } from 'vitest'
import { createInitialState } from './simulation'

describe('simulation smoke', () => {
  it('createInitialState returns a fresh state with $20 000', () => {
    const state = createInitialState()
    expect(state.cash).toBe(20000)
    expect(state.gameStarted).toBe(false)
  })
})

describe('createInitialState — new fields', () => {
  it('starts with 5 ad slots and full refill timer', () => {
    const state = createInitialState()
    expect(state.ads.slotsAvailable).toBe(5)
    expect(state.ads.nextSlotInSeconds).toBe(17_280)
    expect(state.ads.boostSeconds).toBe(0)
  })

  it('starts with no pending offline summary', () => {
    const state = createInitialState()
    expect(state.pendingOfflineSummary).toBeNull()
  })

  it('starts with a recent lastTickAt', () => {
    const before = Date.now()
    const state = createInitialState()
    const after = Date.now()
    expect(state.lastTickAt).toBeGreaterThanOrEqual(before)
    expect(state.lastTickAt).toBeLessThanOrEqual(after)
  })
})
