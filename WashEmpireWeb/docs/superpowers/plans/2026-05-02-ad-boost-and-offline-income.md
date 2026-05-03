# Ad Boost Stocking & Offline Income Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add stockable rewarded ads (5 slots / 24h, +2.4h boost each, 12h cap) and always-on offline cash income (capped without boost, uncapped at 3× while boost is active).

**Architecture:** Pure-functional simulation changes in `src/game/simulation.ts` (cash multiplier, slot refill, offline reconciliation, expected-rate helper). State migration in `hydrateGameState`. Two UI surfaces: a rewritten ad-button block in `Hud.tsx` and a new `OfflineReturnPanel` rendered from `App.tsx`. Heartbeat (`lastTickAt`) plus `visibilitychange`/`beforeunload` saves anchor offline reconciliation on app load.

**Tech Stack:** React 19 + TypeScript + Vite. New: Vitest for economy-logic unit tests (UI surfaces are smoke-tested manually in the dev server).

**Reference spec:** `docs/superpowers/specs/2026-05-02-ad-boost-and-offline-income-design.md`

**Working directory:** `WashEmpireWeb/` (all paths below are relative to this directory unless prefixed with `WashEmpireWeb/`).

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `src/game/types.ts` | Modify | New `AdState` shape; add `OfflineSummary`, `lastTickAt`, `pendingOfflineSummary` to `GameState` |
| `src/game/simulation.ts` | Modify | Constants, `watchAdForBoost`, `cashMultiplier`, `expectedHourlyRevenue`, updated `advanceAds`, `reconcileOffline`, heartbeat in `advanceGame`, `settlePayment` multiplier, `hydrateGameState` migration |
| `src/game/simulation.test.ts` | Create | Unit tests for the pure economy logic above |
| `src/components/Hud.tsx` | Modify | Replace ad button block; add 3× chip on cash readout |
| `src/components/OfflineReturnPanel.tsx` | Create | Welcome-back modal showing offline summary |
| `src/App.tsx` | Modify | Reconcile on load, visibility/unload save, panel render, handler rename |
| `src/App.css` | Modify | Styles for new ad button block, 3× chip, offline panel |
| `vitest.config.ts` | Create | Vitest config |
| `package.json` | Modify | Add vitest dev dep + `test` script |

---

## Task 1: Set up Vitest

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/game/simulation.test.ts` (smoke test only in this task)

- [ ] **Step 1: Install vitest**

Run: `npm install --save-dev vitest`
Expected: vitest added to `devDependencies`.

- [ ] **Step 2: Add the `test` npm script**

In `package.json`, modify the `scripts` block:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest run",
  "test:watch": "vitest"
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

- [ ] **Step 4: Write a smoke test in `src/game/simulation.test.ts`**

```ts
import { describe, expect, it } from 'vitest'
import { createInitialState } from './simulation'

describe('simulation smoke', () => {
  it('createInitialState returns a fresh state with $20 000', () => {
    const state = createInitialState()
    expect(state.cash).toBe(20000)
    expect(state.gameStarted).toBe(false)
  })
})
```

- [ ] **Step 5: Run the smoke test**

Run: `npm test`
Expected: 1 passed; 0 failed.

- [ ] **Step 6: Commit**

```bash
git add WashEmpireWeb/package.json WashEmpireWeb/package-lock.json WashEmpireWeb/vitest.config.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "test: add vitest setup with simulation smoke test"
```

---

## Task 2: Update `AdState` and add new `GameState` fields

**Files:**
- Modify: `src/game/types.ts`

- [ ] **Step 1: Replace `AdState` and add new shapes**

In `src/game/types.ts`, replace the current `AdState` interface (lines 83–89) with the new shape and add `OfflineSummary`:

```ts
export interface AdState {
  slotsAvailable: number
  nextSlotInSeconds: number
  boostSeconds: number
  totalWatched: number
  totalRewardedCash: number
}

export interface OfflineSummary {
  elapsedSeconds: number
  boostedSeconds: number
  unboostedSeconds: number
  cashEarned: number
  slotsRefilled: number
}
```

- [ ] **Step 2: Add the new fields to `GameState`**

In the `GameState` interface (lines 121–147), add these two fields just before `lastReview`:

```ts
  lastTickAt: number
  pendingOfflineSummary: OfflineSummary | null
```

- [ ] **Step 3: Verify the project still type-checks**

Run: `npx tsc -b --noEmit` (ignore errors that mention missing properties — those are downstream of this change and will be resolved in subsequent tasks).
Expected: Errors like "Property 'rewardCooldownSeconds' does not exist on type 'AdState'" in `simulation.ts` and `Hud.tsx`. **These are expected.**

- [ ] **Step 4: Commit**

```bash
git add WashEmpireWeb/src/game/types.ts
git commit -m "refactor(types): rewrite AdState for slot stocking + add OfflineSummary"
```

---

## Task 3: Add constants and update `createInitialState` / `createAdState`

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Replace ad-related constants**

In `src/game/simulation.ts`, find and **delete** the lines:

```ts
const AD_BOOST_SECONDS = 180
const AD_COOLDOWN_SECONDS = 90
```

Add the new constants in the same block:

```ts
const AD_BOOST_PER_WATCH_SECONDS = 8_640
const AD_BOOST_MAX_STACK_SECONDS = 43_200
const AD_BOOST_MULTIPLIER = 3
const AD_SLOTS_MAX = 5
const AD_SLOT_REFILL_SECONDS = 17_280
const OFFLINE_BASELINE_RATE_FRACTION = 0.5
const OFFLINE_UNBOOSTED_CAP_SECONDS = 28_800
const OFFLINE_HARD_CAP_SECONDS = 86_400
const OFFLINE_MIN_RECONCILE_SECONDS = 60
```

- [ ] **Step 2: Update `createAdState`**

Replace the existing `createAdState` function with:

```ts
function createAdState(seed?: Partial<AdState>): AdState {
  return {
    slotsAvailable: clampSlots(seed?.slotsAvailable ?? AD_SLOTS_MAX),
    nextSlotInSeconds: clampNextSlot(seed?.nextSlotInSeconds ?? AD_SLOT_REFILL_SECONDS),
    boostSeconds: clampBoost(seed?.boostSeconds ?? 0),
    totalWatched: seed?.totalWatched ?? 0,
    totalRewardedCash: seed?.totalRewardedCash ?? 0,
  }
}

function clampSlots(value: number): number {
  return Math.min(AD_SLOTS_MAX, Math.max(0, Math.floor(value)))
}

function clampNextSlot(value: number): number {
  return Math.min(AD_SLOT_REFILL_SECONDS, Math.max(0, value))
}

function clampBoost(value: number): number {
  return Math.min(AD_BOOST_MAX_STACK_SECONDS, Math.max(0, value))
}
```

- [ ] **Step 3: Update `createInitialState` to include new `GameState` fields**

In `createInitialState`, add these fields to the returned object before `lastReview`:

```ts
    lastTickAt: Date.now(),
    pendingOfflineSummary: null,
```

- [ ] **Step 4: Write tests for the new defaults**

Append to `src/game/simulation.test.ts`:

```ts
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
```

- [ ] **Step 5: Run tests**

Run: `npm test`
Expected: All tests pass (the existing smoke test plus the 3 new ones). Note: `simulation.ts` may still have unrelated type errors from the `AdState` change — those are addressed in subsequent tasks. The vitest run uses the source as-is, so it should still execute.

If vitest fails to load `simulation.ts` due to references to removed `AD_COOLDOWN_SECONDS`, search for any remaining references and remove them as part of this step. (`claimRewardedAd` still references them — proceed to Task 4 to replace it; if vitest blocks, temporarily comment out the body of `claimRewardedAd` to unblock.)

- [ ] **Step 6: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): introduce ad slot constants and update initial state"
```

---

## Task 4: Replace `claimRewardedAd` with `watchAdForBoost`

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/game/simulation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- watchAdForBoost`
Expected: 4 tests fail with "watchAdForBoost is not a function" (or similar).

- [ ] **Step 3: Replace `claimRewardedAd` with `watchAdForBoost`**

In `src/game/simulation.ts`, **delete** the existing `claimRewardedAd` function (lines 459–474) and the `rewardedAdCash` helper just below it (lines 476–481 — no longer used). Replace with:

```ts
export function watchAdForBoost(input: GameState): GameState {
  if (input.ads.slotsAvailable <= 0) return input

  const state = cloneState(input)
  state.ads = {
    ...state.ads,
    slotsAvailable: state.ads.slotsAvailable - 1,
    boostSeconds: clampBoost(state.ads.boostSeconds + AD_BOOST_PER_WATCH_SECONDS),
    totalWatched: state.ads.totalWatched + 1,
  }
  return state
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- watchAdForBoost`
Expected: All 4 tests pass.

- [ ] **Step 5: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): replace claimRewardedAd with slot-consuming watchAdForBoost"
```

---

## Task 5: Update `advanceAds` for slot refill + boost burn

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/game/simulation.test.ts`:

```ts
import { advanceGame } from './simulation'   // existing import — add if missing
// Note: advanceAds is internal; we test it via advanceGame OR export it.
// For test simplicity, export advanceAds from simulation.ts as part of this task.

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
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- advanceAds`
Expected: All 6 tests fail (advanceAds isn't exported yet, or behaves wrong).

- [ ] **Step 3: Replace `advanceAds`**

In `src/game/simulation.ts`, replace the existing `advanceAds` function with:

```ts
export function advanceAds(ads: AdState, realDeltaSeconds: number): AdState {
  let { slotsAvailable, nextSlotInSeconds, boostSeconds } = ads
  boostSeconds = Math.max(0, boostSeconds - realDeltaSeconds)

  if (slotsAvailable < AD_SLOTS_MAX) {
    nextSlotInSeconds -= realDeltaSeconds
    while (nextSlotInSeconds <= 0 && slotsAvailable < AD_SLOTS_MAX) {
      slotsAvailable += 1
      nextSlotInSeconds += AD_SLOT_REFILL_SECONDS
    }
    if (slotsAvailable === AD_SLOTS_MAX) {
      nextSlotInSeconds = AD_SLOT_REFILL_SECONDS
    }
  }

  return {
    ...ads,
    slotsAvailable,
    nextSlotInSeconds,
    boostSeconds,
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- advanceAds`
Expected: All 6 tests pass.

- [ ] **Step 5: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): trickle-refill ad slots and burn boost on real seconds"
```

---

## Task 6: Add `expectedHourlyRevenue` helper

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/game/simulation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- expectedHourlyRevenue`
Expected: 3 failures with "expectedHourlyRevenue is not a function".

- [ ] **Step 3: Implement `expectedHourlyRevenue`**

Add to `src/game/simulation.ts` (anywhere among the exported helpers):

```ts
export function expectedHourlyRevenue(state: GameState): number {
  if (state.bays.length === 0) return 0

  const spawnPerSec = 1 / spawnInterval(state)

  const avgPrice =
    state.bays.reduce(
      (sum, bay) => sum + bayWashPrice(state.upgrades, bay, marketPriceBonus(state)),
      0,
    ) / state.bays.length

  const avgWandLevel = state.bays.reduce((sum, bay) => sum + bay.upgrades.wand, 0) / state.bays.length
  const avgWashSeconds = Math.max(3.1, BASE_WASH_SECONDS * (1 - avgWandLevel * 0.055))
  const washPerSec = state.bays.length / avgWashSeconds

  // Throughput is bottlenecked by the slower of arrivals and bay capacity.
  const effectivePerSec = Math.min(spawnPerSec, washPerSec)

  return effectivePerSec * avgPrice * 3600 * CUSTOMERS_PER_VISIBLE_CAR
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- expectedHourlyRevenue`
Expected: All 3 tests pass.

- [ ] **Step 5: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): add expectedHourlyRevenue helper for offline rate calc"
```

---

## Task 7: Add `cashMultiplier` and apply in `settlePayment`

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/game/simulation.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `npm test -- cashMultiplier`
Expected: 2 failures with "cashMultiplier is not a function".

- [ ] **Step 3: Implement `cashMultiplier`**

Add to `src/game/simulation.ts`:

```ts
export function cashMultiplier(state: GameState): number {
  return state.ads.boostSeconds > 0 ? AD_BOOST_MULTIPLIER : 1
}
```

- [ ] **Step 4: Apply the multiplier inside `settlePayment`**

Replace the existing `settlePayment` function (around line 823) with:

```ts
function settlePayment(state: GameState, car: Car): void {
  const baseGross = paymentValue(car.payment) * CUSTOMERS_PER_VISIBLE_CAR
  const bay = state.bays[car.bayIndex]
  if (!bay) return

  const mult = cashMultiplier(state)
  const gross = baseGross * mult
  const boostBonus = gross - baseGross

  if (car.payment.kind === 'card') {
    const net = gross * (1 - CARD_FEE_RATE)
    state.cash = roundMoney(state.cash + net)
    state.weekRevenue = roundMoney(state.weekRevenue + gross)
    state.lifetimeRevenue = roundMoney(state.lifetimeRevenue + gross)
    if (boostBonus > 0) {
      state.ads = {
        ...state.ads,
        totalRewardedCash: roundMoney(state.ads.totalRewardedCash + boostBonus),
      }
    }
    finishWash(state, bay)
    return
  }

  const cashFeeRate = cashLeakRate(state, bay)
  bay.cashBox.bills = roundMoney(
    bay.cashBox.bills + car.payment.bills * CUSTOMERS_PER_VISIBLE_CAR * mult * (1 - cashFeeRate),
  )
  bay.cashBox.coins = roundMoney(
    bay.cashBox.coins + car.payment.quarters * 0.25 * CUSTOMERS_PER_VISIBLE_CAR * mult * (1 - cashFeeRate),
  )
  bay.cashBox.tokens = roundMoney(
    bay.cashBox.tokens + car.payment.tokens * CUSTOMERS_PER_VISIBLE_CAR * mult,
  )
  state.weekRevenue = roundMoney(state.weekRevenue + gross)
  state.lifetimeRevenue = roundMoney(state.lifetimeRevenue + gross)
  if (boostBonus > 0) {
    state.ads = {
      ...state.ads,
      totalRewardedCash: roundMoney(state.ads.totalRewardedCash + boostBonus),
    }
  }
  finishWash(state, bay)
}
```

- [ ] **Step 5: Add an integration test verifying boost multiplies a settled payment**

Append to `src/game/simulation.test.ts`:

```ts
import { startGame } from './simulation'

describe('boost multiplier integration', () => {
  it('triples weekRevenue from a settled wash when boost is active', () => {
    let state = startGame(createInitialState(), 'Test Lot')
    state = { ...state, ads: { ...state.ads, boostSeconds: 100 } }
    state = { ...state, speed: 1, gameStarted: true }

    // Force a car directly into the washing stage on bay 0, then advance enough
    // game time for it to finish. Using the public surface keeps this test honest.
    const bay = state.bays[0]
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
    void bay
  })
})
```

- [ ] **Step 6: Run all tests**

Run: `npm test`
Expected: All tests (existing + new) pass.

- [ ] **Step 7: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): apply 3× boost cash multiplier at payment settlement"
```

---

## Task 8: Add `reconcileOffline` and heartbeat in `advanceGame`

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/game/simulation.test.ts`:

```ts
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

  it('credits cash for the unboosted window, capped at 8h', () => {
    const state = frozenState()
    const tenHoursLater = state.lastTickAt + 10 * 3600 * 1000
    const next = reconcileOffline(state, tenHoursLater)
    expect(next.cash).toBeGreaterThan(state.cash)
    expect(next.pendingOfflineSummary).not.toBeNull()
    expect(next.pendingOfflineSummary!.unboostedSeconds).toBe(28_800) // 8h cap
    expect(next.pendingOfflineSummary!.boostedSeconds).toBe(0)
  })

  it('credits boosted cash at 3× and uncaps for the boost window', () => {
    let state = frozenState()
    state = { ...state, ads: { ...state.ads, boostSeconds: 6 * 3600 } } // 6h boost banked

    const tenHoursLater = state.lastTickAt + 10 * 3600 * 1000
    const next = reconcileOffline(state, tenHoursLater)

    expect(next.pendingOfflineSummary!.boostedSeconds).toBe(6 * 3600)
    expect(next.pendingOfflineSummary!.unboostedSeconds).toBe(4 * 3600) // remaining 4h, under cap
    expect(next.ads.boostSeconds).toBe(0)
  })

  it('clamps elapsed time at 24h hard cap', () => {
    const state = frozenState()
    const fiftyHoursLater = state.lastTickAt + 50 * 3600 * 1000
    const next = reconcileOffline(state, fiftyHoursLater)
    expect(next.pendingOfflineSummary!.elapsedSeconds).toBe(86_400)
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
    // 10h / 4.8h = ~2.08 → 2 slots refilled
    expect(next.ads.slotsAvailable).toBe(2)
    expect(next.pendingOfflineSummary!.slotsRefilled).toBe(2)
  })
})

describe('advanceGame heartbeat', () => {
  it('updates lastTickAt every tick', async () => {
    let state = startGame(createInitialState(), 'Heartbeat Lot')
    state.lastTickAt = 0
    const next = advanceGame(state, 0.05)
    expect(next.lastTickAt).toBeGreaterThan(0)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- reconcileOffline advanceGame`
Expected: All new tests fail (`reconcileOffline is not a function`, heartbeat not present).

- [ ] **Step 3: Implement `reconcileOffline`**

Add to `src/game/simulation.ts`:

```ts
export function reconcileOffline(input: GameState, nowMs: number): GameState {
  const elapsedRaw = (nowMs - input.lastTickAt) / 1000

  if (elapsedRaw < OFFLINE_MIN_RECONCILE_SECONDS) {
    return { ...input, lastTickAt: nowMs }
  }

  const elapsed = Math.min(OFFLINE_HARD_CAP_SECONDS, Math.max(0, elapsedRaw))
  const state = cloneState(input)

  const boostBefore = state.ads.boostSeconds
  const slotsBefore = state.ads.slotsAvailable

  state.ads = advanceAds(state.ads, elapsed)

  const boostedT = Math.min(elapsed, boostBefore)
  const unboostedT = Math.min(elapsed - boostedT, OFFLINE_UNBOOSTED_CAP_SECONDS)
  const ratePerSec = (expectedHourlyRevenue(state) * OFFLINE_BASELINE_RATE_FRACTION) / 3600
  const cashEarned = roundMoney(ratePerSec * (boostedT * AD_BOOST_MULTIPLIER + unboostedT))

  state.cash = roundMoney(state.cash + cashEarned)
  state.pendingOfflineSummary = {
    elapsedSeconds: elapsed,
    boostedSeconds: boostedT,
    unboostedSeconds: unboostedT,
    cashEarned,
    slotsRefilled: state.ads.slotsAvailable - slotsBefore,
  }
  state.lastTickAt = nowMs
  return state
}
```

- [ ] **Step 4: Add the heartbeat to `advanceGame`**

The heartbeat must fire on **every** tick, including the paused early-return path — otherwise a player who pauses, lets the tab idle for an hour, and then closes the tab will see inflated offline accrual on reopen.

In `advanceGame`, immediately after the `state.ads = advanceAds(...)` line and **before** the `if (!state.gameStarted || state.collectRequired || state.speed === 0) return state` early-return, insert:

```ts
state.lastTickAt = Date.now()
```

This fires the heartbeat regardless of pause/collect/start state. The visibility/unload listener in `App.tsx` (Task 12) is a backup for browser crashes, but the per-tick heartbeat is the primary mechanism.

- [ ] **Step 5: Run tests**

Run: `npm test -- reconcileOffline advanceGame`
Expected: All tests pass.

- [ ] **Step 6: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): add reconcileOffline + lastTickAt heartbeat"
```

---

## Task 9: Save migration in `hydrateGameState`

**Files:**
- Modify: `src/game/simulation.ts`
- Modify: `src/game/simulation.test.ts`

- [ ] **Step 1: Write the failing tests**

Append to `src/game/simulation.test.ts`:

```ts
import { hydrateGameState } from './simulation'

describe('hydrateGameState — ad migration', () => {
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
```

- [ ] **Step 2: Run tests to confirm they fail**

Run: `npm test -- "hydrateGameState — ad migration"`
Expected: At least one test fails (`createAdState` already does most of this from Task 3, but `lastTickAt` and `pendingOfflineSummary` are not yet wired through `hydrateGameState`).

- [ ] **Step 3: Update `hydrateGameState`**

In `src/game/simulation.ts`, find the return block of `hydrateGameState` and add these two fields:

```ts
    lastTickAt: typeof candidate.lastTickAt === 'number' ? candidate.lastTickAt : Date.now(),
    pendingOfflineSummary: candidate.pendingOfflineSummary ?? null,
```

Also update `normalizeAds` to strip legacy fields explicitly (it already calls `createAdState`, which uses `Partial<AdState>`; legacy fields are silently ignored by spread). Verify by reading the function — no change needed if tests pass.

- [ ] **Step 4: Run tests**

Run: `npm test`
Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add WashEmpireWeb/src/game/simulation.ts WashEmpireWeb/src/game/simulation.test.ts
git commit -m "feat(sim): migrate legacy AdState saves and seed offline fields"
```

---

## Task 10: Build the `OfflineReturnPanel` component

**Files:**
- Create: `src/components/OfflineReturnPanel.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Create the component**

`src/components/OfflineReturnPanel.tsx`:

```tsx
import type { OfflineSummary } from '../game/types'

interface OfflineReturnPanelProps {
  summary: OfflineSummary
  onDismiss: () => void
}

export function OfflineReturnPanel({ summary, onDismiss }: OfflineReturnPanelProps) {
  return (
    <section className="offline-return" aria-label="Offline earnings summary">
      <span className="mini-label">Welcome back</span>
      <h2>+${Math.round(summary.cashEarned).toLocaleString()} earned</h2>
      <p className="offline-elapsed">You were away {formatDuration(summary.elapsedSeconds)}</p>
      <dl>
        <div>
          <dt>Boosted</dt>
          <dd>
            {formatDuration(summary.boostedSeconds)}
            {summary.boostedSeconds > 0 ? <span className="offline-tag">3× rate</span> : null}
          </dd>
        </div>
        <div>
          <dt>Baseline</dt>
          <dd>
            {formatDuration(summary.unboostedSeconds)}
            {summary.unboostedSeconds >= 28_800 ? <span className="offline-tag">capped</span> : null}
          </dd>
        </div>
        <div>
          <dt>Slots refilled</dt>
          <dd>{summary.slotsRefilled}</dd>
        </div>
      </dl>
      <button type="button" onClick={onDismiss}>
        Collect
      </button>
    </section>
  )
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
```

- [ ] **Step 2: Add styles**

Append to `src/App.css`:

```css
.offline-return {
  position: absolute;
  inset: 0;
  margin: auto;
  width: min(360px, calc(100vw - 36px));
  height: fit-content;
  max-height: 80vh;
  padding: 24px 26px;
  border-radius: 14px;
  background: rgba(247, 244, 235, 0.96);
  border: 1px solid rgba(22, 31, 38, 0.18);
  box-shadow: 0 26px 64px rgba(15, 23, 42, 0.32);
  pointer-events: auto;
  z-index: 30;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.offline-return h2 {
  margin: 0;
  font-size: 30px;
  line-height: 1.1;
}

.offline-return .offline-elapsed {
  margin: 0;
  font-size: 14px;
  opacity: 0.78;
}

.offline-return dl {
  margin: 4px 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.offline-return dl > div {
  display: flex;
  justify-content: space-between;
  font-size: 14px;
}

.offline-return dt { font-weight: 600; }
.offline-return dd { margin: 0; display: flex; align-items: center; gap: 8px; }

.offline-tag {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(34, 134, 58, 0.15);
  color: #1f7a36;
}

.offline-return button {
  margin-top: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  border: 1px solid rgba(22, 31, 38, 0.2);
  background: var(--ink);
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 3: Verify the project type-checks**

Run: `npx tsc -b --noEmit`
Expected: Errors only in `Hud.tsx` and `App.tsx` (downstream tasks). The new component has no errors.

- [ ] **Step 4: Commit**

```bash
git add WashEmpireWeb/src/components/OfflineReturnPanel.tsx WashEmpireWeb/src/App.css
git commit -m "feat(ui): add OfflineReturnPanel for welcome-back summary"
```

---

## Task 11: Update `Hud.tsx` ad button + 3× chip

**Files:**
- Modify: `src/components/Hud.tsx`
- Modify: `src/App.css`

- [ ] **Step 1: Update the `HudProps` interface**

In `src/components/Hud.tsx`, change `onClaimAd` to `onWatchAd`:

```ts
  onWatchAd: () => void
```

And update the destructuring in the function signature accordingly: `onClaimAd` → `onWatchAd`.

- [ ] **Step 2: Replace the cooldown calculation**

**Delete** the line:

```ts
const adCooldown = Math.ceil(state.ads.rewardCooldownSeconds)
```

Add:

```ts
const adSlots = state.ads.slotsAvailable
const adBoostSeconds = state.ads.boostSeconds
const adNextSlotSeconds = state.ads.nextSlotInSeconds
const adButtonDisabled = adLoading || adSlots <= 0
const adBoostActive = adBoostSeconds > 0
```

- [ ] **Step 3: Replace the ad button JSX**

Find the existing ad button (the one with `BadgeDollarSign`) and replace it with this block:

```tsx
        <div className="hud-ad" title="Watch a rewarded ad">
          <button
            type="button"
            className="hud-ad-button"
            disabled={adButtonDisabled}
            onClick={onWatchAd}
          >
            <BadgeDollarSign size={18} />
            <span>{adLoading ? 'Ad...' : `Watch Ad (${adSlots}/5)`}</span>
          </button>
          {adBoostActive && (
            <span className="hud-ad-line hud-ad-boost">Boost: {formatHm(adBoostSeconds)}</span>
          )}
          {adSlots < 5 && (
            <span className="hud-ad-line hud-ad-refill">Next slot in {formatHm(adNextSlotSeconds)}</span>
          )}
        </div>
```

- [ ] **Step 4: Add the 3× chip on the cash readout**

Find the `hud-status` section (`<strong>{money(state.cash)}</strong>`) and replace just the `<strong>` line with:

```tsx
        <strong>
          {money(state.cash)}
          {adBoostActive && <span className="cash-boost-chip">3×</span>}
        </strong>
```

- [ ] **Step 5: Add `formatHm` helper**

Below the existing `formatSeconds` helper at the bottom of the file, add:

```ts
function formatHm(seconds: number): string {
  if (seconds <= 0) return '0m'
  const total = Math.ceil(seconds)
  const hours = Math.floor(total / 3600)
  const mins = Math.ceil((total % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
```

- [ ] **Step 6: Remove the obsolete `adButtonLabel` helper**

Delete the entire `adButtonLabel` function at the bottom of the file. It's no longer called.

Also remove the unused `formatSeconds` import/use if the "Ad Boost" entry in `hud-metrics` still references it. Check that section: the line `<strong>{state.ads.boostSeconds > 0 ? formatSeconds(state.ads.boostSeconds) : 'Off'}</strong>` should be updated to use `formatHm` instead. Replace it.

- [ ] **Step 7: Add styles**

Append to `src/App.css`:

```css
.hud-ad {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: stretch;
  min-width: 130px;
}

.hud-ad-button {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 6px;
  border: 1px solid rgba(22, 31, 38, 0.2);
  background: rgba(255, 255, 255, 0.6);
  font-weight: 700;
  cursor: pointer;
}

.hud-ad-button:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.hud-ad-line {
  font-size: 11px;
  line-height: 1.2;
  padding-left: 4px;
}

.hud-ad-boost { color: #1f7a36; font-weight: 700; }
.hud-ad-refill { opacity: 0.7; }

.cash-boost-chip {
  display: inline-block;
  margin-left: 8px;
  padding: 2px 7px;
  font-size: 13px;
  font-weight: 800;
  border-radius: 999px;
  background: rgba(34, 134, 58, 0.18);
  color: #1f7a36;
  vertical-align: middle;
}
```

- [ ] **Step 8: Verify type-check**

Run: `npx tsc -b --noEmit`
Expected: Only errors in `App.tsx` (referencing `onClaimAd` and `claimRewardedAd`).

- [ ] **Step 9: Commit**

```bash
git add WashEmpireWeb/src/components/Hud.tsx WashEmpireWeb/src/App.css
git commit -m "feat(ui): rewrite ad button for slot stocking + add 3× boost chip"
```

---

## Task 12: Wire `App.tsx` (offline reconciliation, visibility save, panel render, handler rename)

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update imports**

In `src/App.tsx`, replace the `claimRewardedAd` import with `watchAdForBoost` and `reconcileOffline`:

```ts
import {
  advanceGame,
  buyBayUpgrade,
  buyCityDistrict,
  buyUpgrade,
  cashBoxValue,
  collectPayBox,
  createInitialState,
  exportGameState,
  hireEmployee,
  hydrateGameState,
  isConveyorCity,
  reconcileOffline,
  restoreCityDistrict,
  setSpeed,
  startGame,
  switchCityDistrict,
  totalCashBox,
  watchAdForBoost,
} from './game/simulation'
```

Add the import for the new panel:

```ts
import { OfflineReturnPanel } from './components/OfflineReturnPanel'
```

- [ ] **Step 2: Reconcile offline time on load**

Replace the `loadSavedGame` function at the bottom with:

```ts
function loadSavedGame(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (!saved) return createInitialState()
    const hydrated = hydrateGameState(JSON.parse(saved)) ?? createInitialState()
    return reconcileOffline(hydrated, Date.now())
  } catch {
    return createInitialState()
  }
}
```

- [ ] **Step 3: Add visibility/unload save listeners**

Add this `useEffect` next to the existing autosave effect:

```ts
  useEffect(() => {
    function flushSave() {
      const snapshot = { ...gameRef.current, lastTickAt: Date.now() }
      localStorage.setItem(SAVE_KEY, exportGameState(snapshot))
    }

    function handleVisibility() {
      if (document.visibilityState === 'hidden') flushSave()
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', flushSave)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', flushSave)
    }
  }, [])
```

- [ ] **Step 4: Rename the ad handler**

Replace `handleClaimAd` with:

```ts
  async function handleWatchAd() {
    if (adLoading || gameRef.current.ads.slotsAvailable <= 0) return
    setAdLoading(true)
    try {
      if (await showRewardedAd()) {
        setGame((state) => watchAdForBoost(state))
      }
    } finally {
      setAdLoading(false)
    }
  }
```

- [ ] **Step 5: Update the `<Hud>` prop**

Change `onClaimAd={handleClaimAd}` to `onWatchAd={handleWatchAd}`.

- [ ] **Step 6: Add the dismiss handler and render the panel**

Below `handleReset`, add:

```ts
  function handleDismissOfflineSummary() {
    setGame((state) => ({ ...state, pendingOfflineSummary: null }))
  }
```

In the JSX, just below the `<WeekReviewPanel>` block, add:

```tsx
      {game.pendingOfflineSummary && (
        <OfflineReturnPanel
          summary={game.pendingOfflineSummary}
          onDismiss={handleDismissOfflineSummary}
        />
      )}
```

- [ ] **Step 7: Verify the project type-checks and builds**

Run: `npx tsc -b --noEmit`
Expected: 0 errors.

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add WashEmpireWeb/src/App.tsx
git commit -m "feat(app): reconcile offline time on load, save on visibility loss, render OfflineReturnPanel"
```

---

## Task 13: Manual verification

**Files:** None modified. Pure smoke testing in the dev server.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Open the printed URL in a browser. Start a new game.

- [ ] **Step 2: Verify the ad button shows correct initial state**

- The HUD ad button should read **"Watch Ad (5/5)"**.
- No "Boost:" line visible.
- No "Next slot in" line visible (slots at cap).
- The cash readout has no `3×` chip.

- [ ] **Step 3: Watch an ad → verify boost activates**

- Click "Watch Ad (5/5)".
- Within ~700ms (the simulated delay), the button should now read **"Watch Ad (4/5)"**.
- A green **"Boost: 2h 24m"** line appears below the button.
- A green **`3×`** chip appears on the cash readout.
- A new line **"Next slot in 4h 48m"** appears under the boost line.

- [ ] **Step 4: Verify the multiplier on a settled wash**

- With game running at 1× and boost active, watch a car finish washing.
- The pay box / cash readout should jump up by ~3× the normal amount.
- Pause the game; verify by waiting for one wash unboosted (let boost expire if needed) — payments are 1/3 of boosted amounts.

- [ ] **Step 5: Test the offline reconciliation**

- Set the boost timer to a known value by watching an ad (≈2.4h).
- Note the current cash and exact `Date.now()` (open DevTools console: `Date.now()`).
- In DevTools console, edit the saved state to fast-forward time:

```js
const save = JSON.parse(localStorage.getItem('wash-empire-browser-save-v1'))
save.state.lastTickAt = Date.now() - 6 * 3600 * 1000   // pretend we left 6h ago
localStorage.setItem('wash-empire-browser-save-v1', JSON.stringify(save))
location.reload()
```

- On reload, the **OfflineReturnPanel** should appear showing:
  - "You were away 6h 0m"
  - A boosted slice (≈2h 24m at 3×) and an unboosted slice (≈3h 36m baseline).
  - "1 ad slot refilled" (since 6h > 4.8h).
  - Cash should have increased by the displayed amount.
- Click "Collect" — panel dismisses, cash and slots remain credited.

- [ ] **Step 6: Test the 24h hard cap**

- Same trick, but set `lastTickAt` to 50 hours ago.
- Panel should show "You were away 24h 0m" (clamped), not 50h.

- [ ] **Step 7: Test the under-60s no-op**

- Hide the tab for 30 seconds, then return. No `OfflineReturnPanel` should appear.

- [ ] **Step 8: Verify slot-cap ad button**

- Burn all 5 slots one after another. Button should disable when at "Watch Ad (0/5)".
- Wait for `Next slot in` countdown to tick down (verify it decreases).

- [ ] **Step 9: Verify save migration from old format**

- In DevTools console, install an "old-shape" save and reload:

```js
const oldSave = {
  savedAt: new Date().toISOString(),
  state: {
    version: 1,
    gameStarted: true,
    locationName: 'Migration Lot',
    cash: 5000,
    week: 2,
    clockSeconds: 30,
    speed: 1,
    cars: [],
    nextCarIn: 1,
    nextCarId: 1,
    bays: [],
    upgrades: {},
    employees: {},
    ads: { rewardCooldownSeconds: 45, boostSeconds: 60, totalWatched: 3, totalRewardedCash: 500, lastReward: 200 },
    cityMap: { currentCityId: 'rustwater', districts: [] },
    weekRevenue: 0,
    lifetimeRevenue: 0,
    weekCars: 0,
    totalCars: 0,
    weekDriveBys: 0,
    totalDriveBys: 0,
    weekLostRevenue: 0,
    lifetimeLostRevenue: 0,
    collectRequired: false,
    lastReview: null,
  },
}
localStorage.setItem('wash-empire-browser-save-v1', JSON.stringify(oldSave))
location.reload()
```

- Game should load with **5/5 slots** and **boost: 1m** (60s preserved).
- No errors in the console.

- [ ] **Step 10: Run lint and build**

Run: `npm run lint && npm run build && npm test`
Expected: Lint clean, build succeeds, all tests pass.

- [ ] **Step 11: Final commit**

If any minor fixups (lint, type) were needed during manual testing, commit them now:

```bash
git add -A
git commit -m "chore: cleanup after manual ad-boost / offline-income verification"
```

If nothing needed fixing, skip this step.

---

## Self-Review Checklist (already applied)

- ✅ Spec coverage: every constant, function, file, and behaviour from the spec maps to a task above.
- ✅ Placeholders: none. Every step shows the actual code or command.
- ✅ Type consistency: `watchAdForBoost`, `reconcileOffline`, `cashMultiplier`, `expectedHourlyRevenue`, `advanceAds`, `OfflineReturnPanel` — names used consistently across tasks 4–12.
- ✅ Migration safety: Task 9 explicitly covers legacy `AdState` with `rewardCooldownSeconds` / `lastReward` and missing `lastTickAt`.
- ✅ UI states: Task 11 covers all four (slots>0/boost on/off and slots=0/boost on/off) plus loading.
- ✅ Manual verification (Task 13) exercises every code path that unit tests can't reach (visibility save, panel render, real-DOM cash chip, save migration).
