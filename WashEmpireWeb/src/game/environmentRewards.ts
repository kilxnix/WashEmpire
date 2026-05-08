import type { UpgradeId, UpgradeState } from './types'

export type EnvironmentRewardVisualId =
  | 'fresh-paint-curbs'
  | 'paint-supply-cans'
  | 'lit-road-sign'
  | 'directional-sign-toppers'
  | 'bay-security-cameras'
  | 'camera-warning-decals'
  | 'office-security-monitor'
  | 'vacuum-island-pad'
  | 'vacuum-post-left'
  | 'vacuum-post-right'
  | 'vacuum-hose-left'
  | 'vacuum-hose-right'
  | 'vacuum-mat-lines'
  | 'parking-light-poles'
  | 'security-light-cones'
  | 'bay-light-bars'
  | 'bay-card-readers'
  | 'tap-to-pay-window-decal'
  | 'price-board-card-ready'
  | 'loyalty-window-decal'
  | 'perk-pickup-sign'
  | 'phone-coupon-stand'
  | 'office-open-sign'
  | 'manager-desk-light'
  | 'staff-clipboard'
  | 'mobile-campaign-billboard'
  | 'phone-ad-placards'
  | 'roadside-coupon-banner'
  | 'touch-free-gantry'
  | 'laser-menu-board'
  | 'laser-queue-markings'

export interface EnvironmentRewardDefinition {
  upgradeId: UpgradeId
  visualIds: readonly EnvironmentRewardVisualId[]
}

export const environmentRewardDefinitions: readonly EnvironmentRewardDefinition[] = [
  {
    upgradeId: 'paint',
    visualIds: ['fresh-paint-curbs', 'paint-supply-cans'],
  },
  {
    upgradeId: 'signage',
    visualIds: ['lit-road-sign', 'directional-sign-toppers'],
  },
  {
    upgradeId: 'coinCameras',
    visualIds: ['bay-security-cameras', 'camera-warning-decals', 'office-security-monitor'],
  },
  {
    upgradeId: 'vacuumIsland',
    visualIds: [
      'vacuum-island-pad',
      'vacuum-post-left',
      'vacuum-post-right',
      'vacuum-hose-left',
      'vacuum-hose-right',
      'vacuum-mat-lines',
    ],
  },
  {
    upgradeId: 'securityLights',
    visualIds: ['parking-light-poles', 'security-light-cones', 'bay-light-bars'],
  },
  {
    upgradeId: 'cardReader',
    visualIds: ['bay-card-readers', 'tap-to-pay-window-decal', 'price-board-card-ready'],
  },
  {
    upgradeId: 'loyaltyApp',
    visualIds: ['loyalty-window-decal', 'perk-pickup-sign', 'phone-coupon-stand'],
  },
  {
    upgradeId: 'manager',
    visualIds: ['office-open-sign', 'manager-desk-light', 'staff-clipboard'],
  },
  {
    upgradeId: 'mobileCampaign',
    visualIds: ['mobile-campaign-billboard', 'phone-ad-placards', 'roadside-coupon-banner'],
  },
  {
    upgradeId: 'laserWash',
    visualIds: ['touch-free-gantry', 'laser-menu-board', 'laser-queue-markings'],
  },
]

export function activeEnvironmentRewards(upgrades: UpgradeState): EnvironmentRewardVisualId[] {
  return environmentRewardDefinitions.flatMap((reward) => (upgrades[reward.upgradeId] ? reward.visualIds : []))
}
