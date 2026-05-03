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

import { advanceAds } from './simulation'

describe('advanceAds', () => {
  function adsWith(overrides: Partial<import('./types').AdState> = {}) {
    return {
      slotsAvailable: 4,
      nextSlotInSeconds: 17_280,
      boostSeconds: 0,
      totalWatched: 0,
      totalRewardedCash: 0,
      ...overrides,
    }
  }

  it('counts the refill timer down', () => {
    const next = advanceAds(adsWith({ slotsAvailable: 4, nextSlotInSeconds: 100 }), 30)
    expect(next.nextSlotInSeconds).toBe(70)
    expect(next.slotsAvailable).toBe(4)
  })

  it('refills one slot and re-arms the timer', () => {
    const next = advanceAds(adsWith({ slotsAvailable: 4, nextSlotInSeconds: 10 }), 20)
    expect(next.slotsAvailable).toBe(5)
    expect(next.nextSlotInSeconds).toBe(17_280) // held at cap
  })

  it('refills multiple slots over a long offline window', () => {
    const next = advanceAds(adsWith({ slotsAvailable: 0, nextSlotInSeconds: 17_280 }), 50_000)
    // 50 000s / 17 280s = ~2.89 → 2 slots refilled, partial timer remaining
    expect(next.slotsAvailable).toBe(2)
    expect(next.nextSlotInSeconds).toBeGreaterThan(0)
    expect(next.nextSlotInSeconds).toBeLessThan(17_280)
  })

  it('caps slot refill at 5', () => {
    const next = advanceAds(adsWith({ slotsAvailable: 3, nextSlotInSeconds: 0 }), 1_000_000)
    expect(next.slotsAvailable).toBe(5)
    expect(next.nextSlotInSeconds).toBe(17_280)
  })

  it('burns boost on real seconds', () => {
    const next = advanceAds(adsWith({ boostSeconds: 100 }), 30)
    expect(next.boostSeconds).toBe(70)
  })

  it('floors boost at 0', () => {
    const next = advanceAds(adsWith({ boostSeconds: 5 }), 30)
    expect(next.boostSeconds).toBe(0)
  })
})

import { expectedHourlyRevenue } from './simulation'

describe('expectedHourlyRevenue', () => {
  it('returns a positive rate for the starting state', () => {
    const state = createInitialState()
    const rate = expectedHourlyRevenue(state)
    expect(rate).toBeGreaterThan(0)
    expect(Number.isFinite(rate)).toBe(true)
  })

  it('grows when bay wand upgrades are added (faster wash → more throughput)', () => {
    const baseline = expectedHourlyRevenue(createInitialState())

    const upgraded = createInitialState()
    upgraded.bays = upgraded.bays.map((bay) => ({
      ...bay,
      upgrades: { ...bay.upgrades, wand: 4 },
    }))
    const upgradedRate = expectedHourlyRevenue(upgraded)

    expect(upgradedRate).toBeGreaterThan(baseline)
  })

  it('grows when soap upgrades are added (higher price)', () => {
    const baseline = expectedHourlyRevenue(createInitialState())

    const upgraded = createInitialState()
    upgraded.bays = upgraded.bays.map((bay) => ({
      ...bay,
      upgrades: { ...bay.upgrades, soap: 4 },
    }))
    const upgradedRate = expectedHourlyRevenue(upgraded)

    expect(upgradedRate).toBeGreaterThan(baseline)
  })
})

import { cashMultiplier } from './simulation'

describe('cashMultiplier', () => {
  it('returns 1 when boost is off', () => {
    const state = createInitialState()
    expect(cashMultiplier(state)).toBe(1)
  })

  it('returns 3 when boost is active', () => {
    let state = createInitialState()
    state = { ...state, ads: { ...state.ads, boostSeconds: 100 } }
    expect(cashMultiplier(state)).toBe(3)
  })
})

import { startGame, advanceGame } from './simulation'

describe('boost multiplier integration', () => {
  it('triples weekRevenue from a settled wash when boost is active', () => {
    let state = startGame(createInitialState(), 'Test Lot')
    state = { ...state, ads: { ...state.ads, boostSeconds: 100 } }

    // Force a car directly into the washing stage on bay 0, then advance enough
    // game time for it to finish.
    const carPayment = { kind: 'quarters' as const, quarters: 20, bills: 0, tokens: 0 } // = $5 base
    state.cars = [{
      id: 'test-car',
      stage: 'washing',
      progress: 0.99,
      variant: 0,
      color: '#fff',
      bayIndex: 0,
      originCityId: 'rustwater',
      waitSeconds: 0,
      payment: carPayment,
      washSeconds: 5,
    }]

    const before = state.weekRevenue
    const next = advanceGame(state, 0.1) // tick should finish the wash
    // base gross = $5 * 2 customers = $10; with 3× boost = $30 → revenue +$30.
    expect(next.weekRevenue - before).toBeCloseTo(30, 1)
  })
})
