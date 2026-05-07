import {
  BadgeDollarSign,
  Download,
  Eye,
  FastForward,
  Gauge,
  Map,
  Pause,
  Play,
  RotateCcw,
  Upload,
  WalletCards,
  Wrench,
  Zap,
} from 'lucide-react'
import type { ChangeEvent } from 'react'
import type { GameState, SpeedSetting } from '../game/types'
import {
  activeBayCount,
  activeBays,
  averageCondition,
  activeQueueCount,
  cashBoxValue,
  cityTrafficMultiplier,
  currentCityDefinition,
  currentDayName,
  dayProgress,
  demandMultiplier,
  progressionProgress,
  totalCashBox,
} from '../game/simulation'

interface HudProps {
  state: GameState
  rideAlong: boolean
  onSetSpeed: (speed: SpeedSetting) => void
  onCollect: () => void
  onOpenUpgrades: () => void
  onOpenCityMap: () => void
  onToggleRideAlong: () => void
  onWatchAd: () => void
  onExport: () => void
  onImport: (file: File) => void
  onReset: () => void
  adLoading: boolean
}

export function Hud({
  state,
  rideAlong,
  onSetSpeed,
  onCollect,
  onOpenUpgrades,
  onOpenCityMap,
  onToggleRideAlong,
  onWatchAd,
  onExport,
  onImport,
  onReset,
  adLoading,
}: HudProps) {
  const visibleBays = activeBays(state)
  const visibleBayCount = activeBayCount(state)
  const cashBox = totalCashBox(visibleBays)
  const due = cashBoxValue(cashBox)
  const condition = averageCondition(visibleBays)
  const demand = demandMultiplier(state.upgrades, condition, visibleBays, state.ads, state.employees)
  const progress = progressionProgress(state)
  const collectDisabled = due <= 0 && !state.collectRequired
  const adSlots = state.ads.slotsAvailable
  const adBoostSeconds = state.ads.boostSeconds
  const adNextSlotSeconds = state.ads.nextSlotInSeconds
  const adButtonDisabled = adLoading || adSlots <= 0
  const adBoostActive = adBoostSeconds > 0
  const staffCount = Object.values(state.employees).filter(Boolean).length
  const city = currentCityDefinition(state)
  const conveyor = city.washModel === 'conveyor'
  const queued = activeQueueCount(state)

  function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) onImport(file)
    event.target.value = ''
  }

  return (
    <div className="hud" aria-label="Wash Empire controls">
      <section className="hud-cluster hud-status" aria-label="Lot status">
        <strong>
          {money(state.cash)}
          {adBoostActive && <span className="cash-boost-chip">3x</span>}
        </strong>
        <em>{state.locationName}</em>
        <span>
          Week {state.week} - {currentDayName(state)}
        </span>
        <div className="day-meter">
          <span style={{ width: `${dayProgress(state) * 100}%` }} />
        </div>
      </section>

      <section className="hud-cluster hud-speed" aria-label="Time controls">
        <button
          type="button"
          className={state.speed === 0 ? 'active' : ''}
          title="Pause"
          onClick={() => onSetSpeed(0)}
        >
          <Pause size={18} />
        </button>
        <button
          type="button"
          className={state.speed === 1 ? 'active' : ''}
          title="1x speed"
          onClick={() => onSetSpeed(1)}
        >
          <Play size={17} />
          <span>1x</span>
        </button>
        <button
          type="button"
          className={state.speed === 3 ? 'active' : ''}
          title="3x speed"
          onClick={() => onSetSpeed(3)}
        >
          <FastForward size={17} />
          <span>3x</span>
        </button>
        <button
          type="button"
          className={state.speed === 10 ? 'active' : ''}
          title="10x speed"
          onClick={() => onSetSpeed(10)}
        >
          <Zap size={17} />
          <span>10x</span>
        </button>
      </section>

      <section className="hud-cluster hud-actions" aria-label="Game actions">
        <button type="button" title="Upgrades" onClick={onOpenUpgrades}>
          <Wrench size={18} />
          <span>Upgrades</span>
        </button>
        <button type="button" title="City map" onClick={onOpenCityMap}>
          <Map size={18} />
          <span>Map</span>
        </button>
        {conveyor && (
          <button
            type="button"
            className={rideAlong ? 'active' : ''}
            title="Ride view"
            onClick={onToggleRideAlong}
          >
            <Eye size={18} />
            <span>Ride View</span>
          </button>
        )}
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
        <button type="button" title="Export save" onClick={onExport}>
          <Download size={18} />
        </button>
        <label className="icon-button" title="Import save">
          <Upload size={18} />
          <input type="file" accept="application/json,.json" onChange={handleImport} />
        </label>
        <button type="button" title="Reset demo" onClick={onReset}>
          <RotateCcw size={18} />
        </button>
      </section>

      <section className="hud-cluster hud-paybox" aria-label="Pay box">
        <div>
          <span className="mini-label">Pay box</span>
          <strong>{money(due)}</strong>
        </div>
        <dl>
          <div>
            <dt>Bills</dt>
            <dd>{money(cashBox.bills)}</dd>
          </div>
          <div>
            <dt>Coins</dt>
            <dd>{money(cashBox.coins)}</dd>
          </div>
          <div>
            <dt>Tokens</dt>
            <dd>{money(cashBox.tokens)}</dd>
          </div>
        </dl>
        <button type="button" disabled={collectDisabled} onClick={onCollect}>
          <WalletCards size={18} />
          <span>{collectButtonLabel(state.collectRequired, due)}</span>
        </button>
      </section>

      <section className="hud-cluster hud-metrics" aria-label="Operating metrics">
        <div>
          <Gauge size={17} />
          <span>Demand x{demand.toFixed(2)}</span>
        </div>
        <div>
          <span>Traffic</span>
          <strong>x{cityTrafficMultiplier(state).toFixed(2)}</strong>
        </div>
        <div>
          <span>District</span>
          <strong>{city.name}</strong>
        </div>
        <div>
          <span>Queued</span>
          <strong>{queued}</strong>
        </div>
        <div>
          <span>Drive-bys</span>
          <strong>{state.weekDriveBys}</strong>
        </div>
        <div>
          <span>Condition</span>
          <strong>{Math.round(condition * 100)}%</strong>
        </div>
        <div>
          <span>{conveyor ? 'Lanes' : 'Bays'}</span>
          <strong>{conveyor ? 2 : visibleBayCount}</strong>
        </div>
        <div>
          <span>Cars</span>
          <strong>{state.totalCars}</strong>
        </div>
        <div>
          <span>Progress</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div>
          <span>Staff</span>
          <strong>{staffCount}</strong>
        </div>
        <div>
          <span>Ad Boost</span>
          <strong>{state.ads.boostSeconds > 0 ? formatHm(state.ads.boostSeconds) : 'Off'}</strong>
        </div>
      </section>

      <section className="hud-cluster hud-route" aria-label="Traffic pressure">
        <div>
          <span>Traffic</span>
          <strong>x{cityTrafficMultiplier(state).toFixed(2)}</strong>
        </div>
        <div>
          <span>Queued</span>
          <strong>{queued}</strong>
        </div>
        <div>
          <span>Drive-bys</span>
          <strong>{state.weekDriveBys}</strong>
        </div>
      </section>
    </div>
  )
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

function collectButtonLabel(weekReady: boolean, due: number): string {
  if (due > 0) return weekReady ? 'Collect + Open' : 'Collect'
  if (weekReady) return 'Open Week'
  return 'No Cash'
}

function formatHm(seconds: number): string {
  if (seconds <= 0) return '0m'
  const total = Math.ceil(seconds)
  const hours = Math.floor(total / 3600)
  const mins = Math.ceil((total % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
