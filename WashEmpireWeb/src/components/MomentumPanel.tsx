import { BadgeDollarSign, Check, Map, Target, WalletCards, Wrench, Zap } from 'lucide-react'
import type { GameState } from '../game/types'
import {
  activeBayCount,
  activeBays,
  averageCondition,
  bayUpgradeCost,
  bayUpgradeDefinitions,
  bayUpgradeDisplay,
  cashBoxValue,
  cityDefinitions,
  currentCityDefinition,
  currentCityDistrict,
  stallNoun,
  totalCashBox,
  upgradeDefinitions,
  weeklyRushTarget,
} from '../game/simulation'

type MomentumAction = 'collect' | 'upgrades' | 'map' | 'ad'

interface MomentumGoal {
  id: string
  title: string
  detail: string
  progress: number
  action?: MomentumAction
  actionLabel?: string
  /** Overrides the progress>=1 check — affordability goals are never "done" until bought. */
  complete?: boolean
}

interface MomentumPanelProps {
  state: GameState
  adLoading: boolean
  onCollect: () => void
  onOpenUpgrades: () => void
  onOpenCityMap: () => void
  onOpenMarketing: () => void
}

export function MomentumPanel({
  state,
  adLoading,
  onCollect,
  onOpenUpgrades,
  onOpenCityMap,
  onOpenMarketing,
}: MomentumPanelProps) {
  const goals = momentumGoals(state)

  return (
    <section className="hud-cluster momentum-panel" aria-label="Momentum goals">
      <header>
        <div>
          <span className="mini-label">Momentum</span>
          <strong>Next wins</strong>
        </div>
        <Target size={18} />
      </header>
      <div className="momentum-goals">
        {goals.map((goal) => {
          const action = goal.action
          const done = goal.complete ?? goal.progress >= 1

          return (
            <article className={done ? 'complete' : ''} key={goal.id}>
              <div className="momentum-goal-title">
                <span>{done ? <Check size={15} /> : iconForGoal(action)}</span>
                <strong>{goal.title}</strong>
              </div>
              <p>{goal.detail}</p>
              <div className="momentum-meter" aria-hidden="true">
                <i style={{ width: `${Math.min(1, Math.max(0, goal.progress)) * 100}%` }} />
              </div>
              {action && (
                <button
                  type="button"
                  disabled={action === 'ad' && (adLoading || state.ads.slotsAvailable <= 0)}
                  onClick={() => runAction(action, { onCollect, onOpenUpgrades, onOpenCityMap, onOpenMarketing })}
                >
                  {iconForGoal(action)}
                  <span>{goal.actionLabel ?? actionLabel(action)}</span>
                </button>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function momentumGoals(state: GameState): MomentumGoal[] {
  const bays = activeBays(state)
  const due = cashBoxValue(totalCashBox(bays))
  const condition = averageCondition(bays)
  const currentCity = currentCityDefinition(state)
  const currentDistrict = currentCityDistrict(state)
  const goals: MomentumGoal[] = []

  if (state.collectRequired) {
    goals.push({
      id: 'week-closeout',
      title: `Close Week ${state.week}`,
      detail: `${money(due)} waiting in the pay box`,
      progress: 1,
      action: 'collect',
      actionLabel: 'Open Week',
    })
  } else if (due >= 150) {
    goals.push({
      id: 'cash-run',
      title: 'Cash run ready',
      detail: `${money(due)} waiting in the pay box`,
      progress: 1,
      action: 'collect',
      actionLabel: 'Collect',
    })
  } else {
    goals.push({
      id: 'fill-paybox',
      title: 'Fill the pay box',
      detail: `${money(due)} / $300 collected`,
      progress: due / 300,
    })
  }

  const rushTarget = weeklyRushTarget(state)
  goals.push({
    id: 'weekly-rush',
    title: "Serve this week's rush",
    detail: `${state.weekCars} / ${rushTarget} customers washed`,
    progress: state.weekCars / rushTarget,
  })

  // From week 4 the empire ladder is the mid-game direction — keep it visible
  // in the top three instead of buried behind maintenance goals.
  const districtGoal = nextDistrictGoal(state)
  if (districtGoal && state.week >= 4) goals.push(districtGoal)

  if (condition < 0.86) {
    goals.push({
      id: 'wash-condition',
      title: 'Recover curb appeal',
      detail: `${Math.round(condition * 100)}% bay condition`,
      progress: condition,
      action: 'upgrades',
      actionLabel: 'Improve',
    })
  }

  const upgradeGoal = nextUpgradeGoal(state)
  if (upgradeGoal) goals.push(upgradeGoal)

  if (currentDistrict.restoration < 5) {
    goals.push({
      id: 'restore-city',
      title: `Restore ${currentCity.name}`,
      detail: `Restoration ${currentDistrict.restoration} / 5`,
      progress: currentDistrict.restoration / 5,
      action: 'map',
      actionLabel: 'Map',
    })
  }

  if (districtGoal && state.week < 4) goals.push(districtGoal)

  if (state.ads.boostSeconds <= 0 && state.ads.flyerSeconds <= 0 && state.ads.weekendSeconds <= 0 && state.ads.slotsAvailable > 0) {
    goals.push({
      id: 'ad-boost',
      title: 'Run a marketing campaign',
      detail: `${state.ads.slotsAvailable} campaign slots ready — drive traffic to the wash`,
      progress: 1,
      action: 'ad',
      actionLabel: 'Marketing',
    })
  }

  return goals.slice(0, 3)
}

function nextDistrictGoal(state: GameState): MomentumGoal | null {
  const nextCity = cityDefinitions.find(
    (city) => !state.cityMap.districts.find((district) => district.id === city.id)?.owned,
  )
  if (!nextCity) return null

  // Ladder toward the next district: prove the weekly engine first, then save.
  // The revenue milestone is a near-term step instead of a distant price wall.
  const revenueMilestone = Math.max(1000, Math.round(nextCity.purchaseCost / 20 / 100) * 100)
  const bestWeeklyRevenue = Math.max(state.lastReview?.revenue ?? 0, state.weekRevenue)
  const engineProven = bestWeeklyRevenue >= revenueMilestone
  const affordable = state.cash >= nextCity.purchaseCost

  if (!engineProven && state.cash < nextCity.purchaseCost * 0.5) {
    return {
      id: `ladder-${nextCity.id}`,
      title: `Grow toward ${nextCity.name}`,
      detail: `Lift weekly revenue to ${money(revenueMilestone)} — best ${money(bestWeeklyRevenue)}`,
      progress: Math.min(1, bestWeeklyRevenue / revenueMilestone),
      complete: false,
      action: 'upgrades',
      actionLabel: 'Upgrades',
    }
  }

  return {
    id: `unlock-${nextCity.id}`,
    title: `Unlock ${nextCity.name}`,
    detail: affordable
      ? `${money(nextCity.purchaseCost)} — ready to buy`
      : `Saved ${money(state.cash)} of ${money(nextCity.purchaseCost)}`,
    progress: Math.min(1, state.cash / nextCity.purchaseCost),
    complete: false,
    action: 'map',
    actionLabel: 'Map',
  }
}

function nextUpgradeGoal(state: GameState): MomentumGoal | null {
  const activeCount = activeBayCount(state)

  for (let bayIndex = 0; bayIndex < activeCount; bayIndex += 1) {
    const bay = state.bays[bayIndex]
    if (!bay) continue

    const nextBayUpgrade = bayUpgradeDefinitions.find((upgrade) => bay.upgrades[upgrade.id] < upgrade.maxLevel)
    if (!nextBayUpgrade) continue

    const cost = bayUpgradeCost(nextBayUpgrade.id, bay.upgrades[nextBayUpgrade.id], bayIndex)
    const affordable = state.cash >= cost
    const displayName = bayUpgradeDisplay(state, nextBayUpgrade.id).name
    return {
      id: `bay-${bay.id}-${nextBayUpgrade.id}`,
      title: `Upgrade ${stallNoun(state)} ${bay.id}`,
      detail: affordable
        ? `${displayName} — ${money(cost)}, ready to buy`
        : `${displayName} — saved ${money(state.cash)} of ${money(cost)}`,
      progress: Math.min(1, state.cash / cost),
      complete: false,
      action: 'upgrades',
      actionLabel: 'Upgrades',
    }
  }

  const nextLotUpgrade = upgradeDefinitions.find((upgrade) => !state.upgrades[upgrade.id])
  if (!nextLotUpgrade) return null

  const affordable = state.cash >= nextLotUpgrade.cost
  return {
    id: `lot-${nextLotUpgrade.id}`,
    title: nextLotUpgrade.name,
    detail: affordable
      ? `${money(nextLotUpgrade.cost)} — ready to buy`
      : `Saved ${money(state.cash)} of ${money(nextLotUpgrade.cost)}`,
    progress: Math.min(1, state.cash / nextLotUpgrade.cost),
    complete: false,
    action: 'upgrades',
    actionLabel: 'Upgrades',
  }
}

function iconForGoal(action: MomentumAction | undefined) {
  if (action === 'collect') return <WalletCards size={15} />
  if (action === 'map') return <Map size={15} />
  if (action === 'ad') return <BadgeDollarSign size={15} />
  if (action === 'upgrades') return <Wrench size={15} />
  return <Zap size={15} />
}

function actionLabel(action: MomentumAction): string {
  if (action === 'collect') return 'Collect'
  if (action === 'map') return 'Map'
  if (action === 'ad') return 'Boost'
  return 'Upgrades'
}

function runAction(
  action: MomentumAction,
  handlers: {
    onCollect: () => void
    onOpenUpgrades: () => void
    onOpenCityMap: () => void
    onOpenMarketing: () => void
  },
) {
  if (action === 'collect') handlers.onCollect()
  if (action === 'upgrades') handlers.onOpenUpgrades()
  if (action === 'map') handlers.onOpenCityMap()
  if (action === 'ad') handlers.onOpenMarketing()
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}
