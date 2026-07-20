import { describe, expect, it, vi } from 'vitest'
import { createInitialState } from './simulation'
import type { BayUpgradeId, EmployeeId, GameState, UpgradeId } from './types'

describe('simulation smoke', () => {
  it('createInitialState returns a fresh state with $20 000', () => {
    const state = createInitialState()
    expect(state.cash).toBe(20000)
    expect(state.gameStarted).toBe(false)
  })
})

describe('createInitialState - new fields', () => {
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
    // 50 000s / 17 280s = ~2.89 -> 2 slots refilled, partial timer remaining
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

  it('keeps the starter wash comfortably above weekly fixed costs and early upgrade pacing', () => {
    const expectedStarterWeek = expectedHourlyRevenue(createInitialState()) * (210 / 3600)
    expect(expectedStarterWeek).toBeGreaterThan(1500)
  })

  it('grows when bay wand upgrades are added (faster wash -> more throughput)', () => {
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

import { startGame, advanceGame, collectPayBox } from './simulation'

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
    // base gross = $5 * 2 customers = $10; with 3x boost = $30 -> revenue +$30.
    expect(next.weekRevenue - before).toBeCloseTo(30, 1)
  })
})

describe('weekly closeout economy', () => {
  it('does not drain cash-on-hand before a manual collection is opened', () => {
    let state = startGame(createInitialState(), 'Manual Lot')
    state = {
      ...state,
      cash: 100,
      clockSeconds: 209.99,
      nextCarIn: 999,
      weekRevenue: 1000,
      bays: state.bays.map((bay, index) =>
        index === 0 ? { ...bay, cashBox: { bills: 1000, coins: 0, tokens: 0 } } : bay,
      ),
    }

    const reviewReady = advanceGame(state, 0.2)

    expect(reviewReady.collectRequired).toBe(true)
    expect(reviewReady.cash).toBe(100)
    expect(reviewReady.lastReview!.physicalDue).toBe(1000)
    expect(reviewReady.lastReview!.costsDue).toBe(520)

    const nextWeek = collectPayBox(reviewReady)
    expect(nextWeek.cash).toBe(580)
    expect(nextWeek.week).toBe(2)
  })

  it('lets a hired collector settle weekly costs from the pay boxes automatically', () => {
    let state = startGame(createInitialState(), 'Staffed Lot')
    state = {
      ...state,
      cash: 100,
      clockSeconds: 209.99,
      nextCarIn: 999,
      weekRevenue: 1000,
      employees: { ...state.employees, cashRunner: true },
      bays: state.bays.map((bay, index) =>
        index === 0 ? { ...bay, cashBox: { bills: 1000, coins: 0, tokens: 0 } } : bay,
      ),
    }

    const reviewReady = advanceGame(state, 0.2)

    expect(reviewReady.collectRequired).toBe(true)
    expect(reviewReady.cash).toBe(340)
    expect(reviewReady.lastReview!.autoCollected).toBe(1000)
    expect(reviewReady.lastReview!.costsPaid).toBe(760)
    expect(reviewReady.lastReview!.costsDue).toBe(0)
  })
})

import { reconcileOffline } from './simulation'

describe('reconcileOffline', () => {
  function frozenState() {
    const state = createInitialState()
    return { ...state, lastTickAt: 1_000_000 } // arbitrary fixed ms
  }

  it('ignores elapsed windows under 60 seconds', () => {
    const state = frozenState()
    const next = reconcileOffline(state, state.lastTickAt + 30_000) // 30s later
    expect(next.cash).toBe(state.cash)
    expect(next.pendingOfflineSummary).toBeNull()
    expect(next.lastTickAt).toBe(state.lastTickAt + 30_000)
  })

  it('credits cash for the full unboosted window while offline', () => {
    const state = frozenState()
    const tenHoursLater = state.lastTickAt + 10 * 3600 * 1000
    const next = reconcileOffline(state, tenHoursLater)
    expect(next.cash).toBeGreaterThan(state.cash)
    expect(next.pendingOfflineSummary).not.toBeNull()
    expect(next.pendingOfflineSummary!.unboostedSeconds).toBe(10 * 3600)
    expect(next.pendingOfflineSummary!.boostedSeconds).toBe(0)
  })

  it('credits boosted cash at 3x and uncaps for the boost window', () => {
    let state = frozenState()
    state = { ...state, ads: { ...state.ads, boostSeconds: 6 * 3600 } } // 6h boost banked

    const tenHoursLater = state.lastTickAt + 10 * 3600 * 1000
    const next = reconcileOffline(state, tenHoursLater)

    expect(next.pendingOfflineSummary!.boostedSeconds).toBe(6 * 3600)
    expect(next.pendingOfflineSummary!.unboostedSeconds).toBe(4 * 3600) // remaining 4h, under cap
    expect(next.ads.boostSeconds).toBe(0)
  })

  it('credits the full elapsed time without a hard cap', () => {
    const state = frozenState()
    const fiftyHoursLater = state.lastTickAt + 50 * 3600 * 1000
    const next = reconcileOffline(state, fiftyHoursLater)
    expect(next.pendingOfflineSummary!.elapsedSeconds).toBe(50 * 3600)
    expect(next.pendingOfflineSummary!.unboostedSeconds).toBe(50 * 3600)
  })

  it('clamps negative elapsed time to zero', () => {
    const state = frozenState()
    const earlier = state.lastTickAt - 5_000_000
    const next = reconcileOffline(state, earlier)
    expect(next.cash).toBe(state.cash)
    expect(next.pendingOfflineSummary).toBeNull()
  })

  it('refills slots during long offline windows', () => {
    let state = frozenState()
    state = { ...state, ads: { ...state.ads, slotsAvailable: 0, nextSlotInSeconds: 17_280 } }

    const tenHoursLater = state.lastTickAt + 10 * 3600 * 1000
    const next = reconcileOffline(state, tenHoursLater)
    // 10h / 4.8h = ~2.08 -> 2 slots refilled
    expect(next.ads.slotsAvailable).toBe(2)
    expect(next.pendingOfflineSummary!.slotsRefilled).toBe(2)
  })
})

describe('advanceGame heartbeat', () => {
  it('updates lastTickAt every tick', () => {
    let state = startGame(createInitialState(), 'Heartbeat Lot')
    state = { ...state, lastTickAt: 0 }
    const next = advanceGame(state, 0.05)
    expect(next.lastTickAt).toBeGreaterThan(0)
  })
})

import { hydrateGameState } from './simulation'

describe('hydrateGameState - ad migration', () => {
  it('discards rewardCooldownSeconds and lastReward', () => {
    const old = {
      version: 1,
      ads: { rewardCooldownSeconds: 45, boostSeconds: 60, totalWatched: 3, totalRewardedCash: 500, lastReward: 200 },
    }
    const next = hydrateGameState(old)
    expect(next).not.toBeNull()
    expect((next!.ads as Partial<{ rewardCooldownSeconds: unknown; lastReward: unknown }>).rewardCooldownSeconds).toBeUndefined()
    expect((next!.ads as Partial<{ lastReward: unknown }>).lastReward).toBeUndefined()
    expect(next!.ads.boostSeconds).toBe(60)
    expect(next!.ads.totalWatched).toBe(3)
    expect(next!.ads.totalRewardedCash).toBe(500)
  })

  it('defaults missing slotsAvailable to 5', () => {
    const old = { version: 1, ads: { boostSeconds: 0 } }
    const next = hydrateGameState(old)
    expect(next!.ads.slotsAvailable).toBe(5)
    expect(next!.ads.nextSlotInSeconds).toBe(17_280)
  })

  it('clamps over-cap boostSeconds in old saves', () => {
    const old = { version: 1, ads: { boostSeconds: 999_999 } }
    const next = hydrateGameState(old)
    expect(next!.ads.boostSeconds).toBe(43_200)
  })

  it('defaults lastTickAt to now and pendingOfflineSummary to null', () => {
    const before = Date.now()
    const next = hydrateGameState({ version: 1 })
    const after = Date.now()
    expect(next!.lastTickAt).toBeGreaterThanOrEqual(before)
    expect(next!.lastTickAt).toBeLessThanOrEqual(after)
    expect(next!.pendingOfflineSummary).toBeNull()
  })
})

import {
  activeBayCount,
  bayUpgradeCost,
  bayUpgradeDefinitions,
  buyBayUpgrade,
  buyCityDistrict,
  buyUpgrade,
  cashBoxValue,
  employeeDefinitions,
  hireEmployee,
  setSpeed,
  switchCityDistrict,
  totalCashBox,
  upgradeDefinitions,
} from './simulation'

describe('city bay management', () => {
  it('uses the configured bay count for each travel district', () => {
    let state = startGame(createInitialState(), 'District Test')
    expect(activeBayCount(state)).toBe(3)

    state = { ...state, cash: 1_000_000 }
    state = buyCityDistrict(state, 'harbor')
    expect(state.cityMap.currentCityId).toBe('harbor')
    expect(activeBayCount(state)).toBe(3)

    state = buyCityDistrict(state, 'downtown')
    expect(state.cityMap.currentCityId).toBe('downtown')
    expect(activeBayCount(state)).toBe(2)

    state = buyCityDistrict(state, 'skyway')
    expect(activeBayCount(state)).toBe(3)

    state = buyCityDistrict(state, 'beltline')
    expect(activeBayCount(state)).toBe(2)
  })

  it('does not upgrade inactive future bays in a smaller district', () => {
    let state = startGame(createInitialState(), 'Small Bay Lot')
    state = { ...state, cash: 1_000_000 }
    state = buyCityDistrict(state, 'downtown')

    const hiddenBayLevel = state.bays[2].upgrades.wand
    const blocked = buyBayUpgrade(state, 2, 'wand')
    expect(blocked).toBe(state)
    expect(blocked.bays[2].upgrades.wand).toBe(hiddenBayLevel)

    const upgraded = buyBayUpgrade(state, 1, 'wand')
    expect(upgraded).not.toBe(state)
    expect(upgraded.bays[1].upgrades.wand).toBe(state.bays[1].upgrades.wand + 1)
  })

  it('keeps owned lower-bay cities switchable and manageable', () => {
    let state = startGame(createInitialState(), 'Travel Lot')
    state = { ...state, cash: 1_000_000 }
    state = buyCityDistrict(state, 'harbor')
    state = buyCityDistrict(state, 'downtown')
    state = switchCityDistrict(state, 'rustwater')

    expect(state.cityMap.currentCityId).toBe('rustwater')
    expect(activeBayCount(state)).toBe(3)

    state = switchCityDistrict(state, 'harbor')
    expect(state.cityMap.currentCityId).toBe('harbor')
    expect(activeBayCount(state)).toBe(3)
  })
})

describe('one-hour playtest economy', () => {
  it('supports a busy first hour with frequent upgrades and positive cash flow', () => {
    const random = vi.spyOn(Math, 'random').mockImplementation(seededRandom(12_345))

    try {
      const result = runOneHourStarterPlaytest()

      expect(result.state.cash).toBeGreaterThan(0)
      expect(result.state.week).toBeGreaterThanOrEqual(45)
      expect(result.state.totalCars).toBeGreaterThan(3800)
      expect(result.state.lifetimeRevenue).toBeGreaterThan(150_000)
      expect(result.purchases).toBeGreaterThanOrEqual(45)
      expect(result.purchasedLotUpgrades).toContain('paint')
      expect(result.hiredEmployees).toContain('cashRunner')
    } finally {
      random.mockRestore()
    }
  })
})

type PurchaseStep =
  | { kind: 'bay'; id: BayUpgradeId; target: number }
  | { kind: 'lot'; id: UpgradeId }
  | { kind: 'employee'; id: EmployeeId }

const ONE_HOUR_PURCHASE_PLAN: PurchaseStep[] = [
  { kind: 'bay', id: 'selector', target: 2 },
  { kind: 'bay', id: 'wand', target: 2 },
  { kind: 'bay', id: 'soap', target: 1 },
  { kind: 'bay', id: 'rinse', target: 1 },
  { kind: 'bay', id: 'vault', target: 1 },
  { kind: 'bay', id: 'dryer', target: 1 },
  { kind: 'lot', id: 'paint' },
  { kind: 'lot', id: 'signage' },
  { kind: 'employee', id: 'cashRunner' },
  { kind: 'bay', id: 'selector', target: 4 },
  { kind: 'bay', id: 'wand', target: 4 },
  { kind: 'bay', id: 'soap', target: 3 },
  { kind: 'bay', id: 'rinse', target: 3 },
  { kind: 'bay', id: 'vault', target: 2 },
  { kind: 'bay', id: 'dryer', target: 2 },
  { kind: 'lot', id: 'coinCameras' },
  { kind: 'lot', id: 'vacuumIsland' },
  { kind: 'employee', id: 'bayTech' },
  { kind: 'lot', id: 'securityLights' },
  { kind: 'lot', id: 'cardReader' },
]

function runOneHourStarterPlaytest() {
  let state = setSpeed(startGame(createInitialState(), 'One Hour Lot'), 3)
  state = watchAdForBoost(state)
  let purchases = 0

  for (let realSeconds = 0; realSeconds < 3600; realSeconds += 0.1) {
    if (state.collectRequired || dueCash(state) >= 2500) {
      state = setSpeed(collectPayBox(state), 3)
    }

    let bought = true
    let guard = 0
    while (bought && guard < 100) {
      const next = buyNextOneHourUpgrade(state)
      bought = next !== state
      if (bought) {
        state = next
        purchases += 1
      }
      guard += 1
    }

    state = advanceGame(state, 0.1)
  }

  if (state.collectRequired || dueCash(state) > 0) {
    state = collectPayBox(state)
  }

  return {
    state,
    purchases,
    purchasedLotUpgrades: Object.entries(state.upgrades)
      .filter(([, owned]) => owned)
      .map(([id]) => id),
    hiredEmployees: Object.entries(state.employees)
      .filter(([, hired]) => hired)
      .map(([id]) => id),
  }
}

function buyNextOneHourUpgrade(state: GameState): GameState {
  const cashReserve = 5000

  for (const step of ONE_HOUR_PURCHASE_PLAN) {
    if (step.kind === 'bay') {
      const activeBays = state.bays.slice(0, activeBayCount(state))
      const def = bayUpgradeDefinitions.find((upgrade) => upgrade.id === step.id)
      if (!def) continue

      const candidates = activeBays
        .map((bay, index) => ({ bay, index }))
        .filter(({ bay }) => bay.upgrades[step.id] < Math.min(step.target, def.maxLevel))
        .sort((a, b) => a.bay.upgrades[step.id] - b.bay.upgrades[step.id] || a.index - b.index)

      for (const { bay, index } of candidates) {
        const cost = bayUpgradeCost(step.id, bay.upgrades[step.id], index)
        if (state.cash - cashReserve >= cost) {
          return buyBayUpgrade(state, index, step.id)
        }
      }
    }

    if (step.kind === 'lot') {
      const def = upgradeDefinitions.find((upgrade) => upgrade.id === step.id)
      if (def && !state.upgrades[step.id] && state.cash - cashReserve >= def.cost) {
        return buyUpgrade(state, step.id)
      }
    }

    if (step.kind === 'employee') {
      const def = employeeDefinitions.find((employee) => employee.id === step.id)
      if (def && !state.employees[step.id] && state.cash - cashReserve >= def.hireCost) {
        return hireEmployee(state, step.id)
      }
    }
  }

  return state
}

function dueCash(state: GameState): number {
  return cashBoxValue(totalCashBox(state.bays))
}

function seededRandom(seedStart: number): () => number {
  let seed = seedStart
  return () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
}
