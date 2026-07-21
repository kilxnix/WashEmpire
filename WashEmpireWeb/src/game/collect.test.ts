import { describe, expect, it } from 'vitest'
import { advanceGame, collectPayBox, createInitialState, startGame } from './simulation'
import type { GameState } from './types'

function lotWith(payBox: number, overrides: Partial<GameState> = {}): GameState {
  const base = startGame(createInitialState(), 'Collect Lot')
  return {
    ...base,
    cash: 20_000,
    nextCarIn: 9_999,
    bays: base.bays.map((bay, index) =>
      index === 0 ? { ...bay, cashBox: { bills: payBox, coins: 0, tokens: 0 } } : bay,
    ),
    ...overrides,
  }
}

describe('collecting the pay box', () => {
  it('adds the full pay box to cash mid-week', () => {
    const next = collectPayBox(lotWith(500))
    expect(next.cash).toBe(20_500)
    expect(next.bays.every((bay) => bay.cashBox.bills === 0)).toBe(true)
  })

  it('nets the pay box against costs at week close', () => {
    // Week 1 overhead is 40% of $520 = $208.
    const ready = advanceGame(lotWith(500, { clockSeconds: 209.99, weekRevenue: 500 }), 0.2)
    expect(ready.collectRequired).toBe(true)
    expect(ready.lastReview!.costsDue).toBe(208)

    const opened = collectPayBox(ready)
    expect(opened.cash).toBe(20_000 + 500 - 208)
    expect(opened.week).toBe(2)
  })

  it('can leave cash flat or lower when overhead outruns a thin pay box', () => {
    // Week 5 pays full overhead ($520) — a $520 box nets exactly zero.
    const ready = advanceGame(lotWith(520, { week: 5, clockSeconds: 209.99, weekRevenue: 520 }), 0.2)
    expect(ready.lastReview!.costsDue).toBe(520)

    const opened = collectPayBox(ready)
    expect(opened.cash).toBe(20_000)
  })

  it('never double-charges closeout costs on a second collect', () => {
    const ready = advanceGame(lotWith(900, { clockSeconds: 209.99, weekRevenue: 900 }), 0.2)
    const opened = collectPayBox(ready)
    const again = collectPayBox(opened)
    expect(again.cash).toBe(opened.cash)
  })

  it('does not charge the player twice when staff already settled the week', () => {
    const staffed = lotWith(600, {
      clockSeconds: 209.99,
      weekRevenue: 600,
      employees: { cashRunner: true, bayTech: false, nightManager: false },
    })
    // Staff auto-collect $600 and pay $208 overhead + $240 wage.
    const rolled = advanceGame(staffed, 0.2)
    expect(rolled.collectRequired).toBe(false)
    expect(rolled.cash).toBe(20_000 + 600 - 448)

    // A manual collect right after should add nothing — the boxes are empty.
    const manual = collectPayBox(rolled)
    expect(manual.cash).toBe(rolled.cash)
  })
})
