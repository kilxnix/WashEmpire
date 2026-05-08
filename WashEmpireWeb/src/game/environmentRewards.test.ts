import { describe, expect, it } from 'vitest'
import { buyUpgrade, createInitialState, upgradeDefinitions } from './simulation'
import { activeEnvironmentRewards, environmentRewardDefinitions } from './environmentRewards'
import type { UpgradeId } from './types'

describe('environment upgrade rewards', () => {
  it('defines at least one visible scene reward for every lot upgrade', () => {
    const coveredIds = new Set(environmentRewardDefinitions.map((reward) => reward.upgradeId))

    for (const upgrade of upgradeDefinitions) {
      expect(coveredIds.has(upgrade.id)).toBe(true)
    }
  })

  it('turns vacuum island into a visible two-vacuum station', () => {
    const state = buyUpgrade({ ...createInitialState(), cash: 100_000 }, 'vacuumIsland')
    const rewards = activeEnvironmentRewards(state.upgrades)

    expect(rewards).toEqual(
      expect.arrayContaining([
        'vacuum-island-pad',
        'vacuum-post-left',
        'vacuum-post-right',
        'vacuum-hose-left',
        'vacuum-hose-right',
        'vacuum-mat-lines',
      ]),
    )
    expect(rewards).not.toContain('mobile-campaign-billboard')
  })

  it('adds small environmental props for app, staffing, and marketing upgrades', () => {
    let state = { ...createInitialState(), cash: 1_000_000 }
    const ids: UpgradeId[] = ['loyaltyApp', 'manager', 'mobileCampaign']

    for (const id of ids) {
      state = buyUpgrade(state, id)
    }

    expect(activeEnvironmentRewards(state.upgrades)).toEqual(
      expect.arrayContaining([
        'loyalty-window-decal',
        'perk-pickup-sign',
        'office-open-sign',
        'manager-desk-light',
        'mobile-campaign-billboard',
        'phone-ad-placards',
      ]),
    )
  })
})
