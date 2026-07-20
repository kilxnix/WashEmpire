import { BadgeDollarSign, Check, Map, Target, WalletCards, Wrench, Zap } from 'lucide-react'
import type { GameState } from '../game/types'
import {
  activeBayCount,
  activeBays,
  averageCondition,
  bayUpgradeCost,
  bayUpgradeDefinitions,
  cashBoxValue,
  cityDefinitions,
  currentCityDefinition,
  currentCityDistrict,
  totalCashBox,
  upgradeDefinitions,
} from '../game/simulation'

type MomentumAction = 'collect' | 'upgrades' | 'map' | 'ad'

interface MomentumGoal {
  id: string
  title: string
  detail: string
  progress: number
  action?: MomentumAction
  actionLabel?: string
}

interface MomentumPanelProps {
  state: GameState
  adLoading: boolean
  onCollect: () => void
  onOpenUpgrades: () => void
  onOpenCityMap: () => void
  onWatchAd: () => void
}

export function MomentumPanel({
  state,
  adLoading,
  onCollect,
  onOpenUpgrades,
  onOpenCityMap,
  onWatchAd,
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

          return (
            <article className={goal.progress >= 1 ? 'complete' : ''} key={goal.id}>
              <div className="momentum-goal-title">
                <span>{goal.progress >= 1 ? <Check size={15} /> : iconForGoal(action)}</span>
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
                  onClick={() => runAction(action, { onCollect, onOpenUpgrades, onOpenCityMap, onWatchAd })}
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

  goals.push({
    id: 'weekly-rush',
    title: "Serve this week's rush",
    detail: `${state.weekCars} / 80 customers washed`,
    progress: state.weekCars / 80,
  })

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

  const nextCity = cityDefinitions.find((city) => !state.cityMap.districts.find((district) => district.id === city.id)?.owned)
  if (nextCity) {
    goals.push({
      id: `unlock-${nextCity.id}`,
      title: `Unlock ${nextCity.name}`,
      detail: `${money(state.cash)} / ${money(nextCity.purchaseCost)}`,
      progress: state.cash / nextCity.purchaseCost,
      action: 'map',
      actionLabel: 'Map',
    })
  }

  if (state.ads.boostSeconds <= 0 && state.ads.slotsAvailable > 0) {
    goals.push({
      id: 'ad-boost',
      title: 'Run a driver campaign',
      detail: `${state.ads.slotsAvailable} ad boosts ready`,
      progress: 1,
      action: 'ad',
      actionLabel: 'Boost',
    })
  }

  return goals.slice(0, 3)
}

function nextUpgradeGoal(state: GameState): MomentumGoal | null {
  const activeCount = activeBayCount(state)

  for (let bayIndex = 0; bayIndex < activeCount; bayIndex += 1) {
    const bay = state.bays[bayIndex]
    if (!bay) continue

    const nextBayUpgrade = bayUpgradeDefinitions.find((upgrade) => bay.upgrades[upgrade.id] < upgrade.maxLevel)
    if (!nextBayUpgrade) continue

    const cost = bayUpgradeCost(nextBayUpgrade.id, bay.upgrades[nextBayUpgrade.id], bayIndex)
    return {
      id: `bay-${bay.id}-${nextBayUpgrade.id}`,
      title: `Upgrade Bay ${bay.id}`,
      detail: `${nextBayUpgrade.name}: ${money(state.cash)} / ${money(cost)}`,
      progress: state.cash / cost,
      action: 'upgrades',
      actionLabel: 'Upgrades',
    }
  }

  const nextLotUpgrade = upgradeDefinitions.find((upgrade) => !state.upgrades[upgrade.id])
  if (!nextLotUpgrade) return null

  return {
    id: `lot-${nextLotUpgrade.id}`,
    title: nextLotUpgrade.name,
    detail: `${money(state.cash)} / ${money(nextLotUpgrade.cost)}`,
    progress: state.cash / nextLotUpgrade.cost,
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
    onWatchAd: () => void
  },
) {
  if (action === 'collect') handlers.onCollect()
  if (action === 'upgrades') handlers.onOpenUpgrades()
  if (action === 'map') handlers.onOpenCityMap()
  if (action === 'ad') handlers.onWatchAd()
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}
