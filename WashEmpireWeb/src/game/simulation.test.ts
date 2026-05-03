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

import { watchAdForBoost } from './simulation'

describe('watchAdForBoost', () => {
  it('decrements slot count and adds 2.4h of boost', () => {
    const state = createInitialState()
    const next = watchAdForBoost(state)
    expect(next.ads.slotsAvailable).toBe(4)
    expect(next.ads.boostSeconds).toBe(8_640)
    expect(next.ads.totalWatched).toBe(1)
  })

  it('caps boost at 12 hours when stacking', () => {
    let state = createInitialState()
    state = { ...state, ads: { ...state.ads, boostSeconds: 40_000 } }
    const next = watchAdForBoost(state)
    expect(next.ads.boostSeconds).toBe(43_200)
  })

  it('returns the same state when no slots are available', () => {
    let state = createInitialState()
    state = { ...state, ads: { ...state.ads, slotsAvailable: 0 } }
    const next = watchAdForBoost(state)
    expect(next).toBe(state)
  })

  it('does not add instant cash', () => {
    const state = createInitialState()
    const next = watchAdForBoost(state)
    expect(next.cash).toBe(state.cash)
  })
})
