import { useEffect, useRef, useState } from 'react'
import {
  BadgeDollarSign,
  Eye,
  FastForward,
  Gauge,
  Map,
  Pause,
  Play,
  Volume2,
  VolumeX,
  WalletCards,
  Wrench,
  Zap,
} from 'lucide-react'
import { PAID_BUILD } from '../services/ads'
import type { GameState, GraphicsQuality, SpeedSetting } from '../game/types'
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
  graphicsQuality: GraphicsQuality
  rideAlong: boolean
  soundOn: boolean
  onSetSpeed: (speed: SpeedSetting) => void
  onCollect: () => void
  onOpenUpgrades: () => void
  onOpenCityMap: () => void
  onCycleGraphics: () => void
  onToggleRideAlong: () => void
  onToggleSound: () => void
  onWatchAd: () => void
  adLoading: boolean
}

export function Hud({
  state,
  graphicsQuality,
  rideAlong,
  soundOn,
  onSetSpeed,
  onCollect,
  onOpenUpgrades,
  onOpenCityMap,
  onCycleGraphics,
  onToggleRideAlong,
  onToggleSound,
  onWatchAd,
  adLoading,
}: HudProps) {
  const visibleBays = activeBays(state)
  const visibleBayCount = activeBayCount(state)
  const cashBox = totalCashBox(visibleBays)
  const due = cashBoxValue(cashBox)
  const condition = averageCondition(visibleBays)
  const demand = demandMultiplier(state.upgrades, condition, visibleBays, state.ads, state.employees)
  const progress = progressionProgress(state)
  const reviewOpen = state.collectRequired && Boolean(state.lastReview)
  const collectDisabled = (due <= 0 && !state.collectRequired) || reviewOpen
  const adSlots = state.ads.slotsAvailable
  const adBoostSeconds = state.ads.boostSeconds
  const adNextSlotSeconds = state.ads.nextSlotInSeconds
  const adButtonDisabled = adLoading || adSlots <= 0
  const adBoostActive = adBoostSeconds > 0
  const staffCount = Object.values(state.employees).filter(Boolean).length
  const city = currentCityDefinition(state)
  const conveyor = city.washModel === 'conveyor'
  const queued = activeQueueCount(state)
  const liveCars = state.cars.length
  const weekProgress = dayProgress(state)

  return (
    <div className="hud" aria-label="Wash Empire controls">
      <section className="hud-cluster hud-status" aria-label="Lot status">
        <strong>
          <AnimatedCash value={state.cash} />
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
        <button type="button" title={`Graphics: ${graphicsLabel(graphicsQuality)}`} onClick={onCycleGraphics}>
          <Gauge size={18} />
          <span>{graphicsLabel(graphicsQuality)}</span>
        </button>
        <button type="button" title={soundOn ? 'Sound on' : 'Sound off'} onClick={onToggleSound}>
          {soundOn ? <Volume2 size={18} /> : <VolumeX size={18} />}
          <span>{soundOn ? 'Sound' : 'Muted'}</span>
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
        <div
          className="hud-ad"
          title={
            PAID_BUILD
              ? 'Launch a driver campaign for a temporary 3x cash boost'
              : 'Watch a rewarded ad for a temporary 3x boost'
          }
        >
          <button
            type="button"
            className="hud-ad-button"
            disabled={adButtonDisabled}
            onClick={onWatchAd}
            aria-label={
              adLoading
                ? 'Loading ad'
                : adSlots <= 0
                  ? PAID_BUILD
                    ? 'No campaigns ready'
                    : 'No ad slots available'
                  : PAID_BUILD
                    ? `Launch campaign, ${adSlots} of 5 ready`
                    : `Watch Ad, ${adSlots} of 5 slots`
            }
            title={
              adLoading ? 'Loading ad…' : PAID_BUILD ? `Boost (${adSlots}/5)` : `Watch Ad (${adSlots}/5)`
            }
          >
            <BadgeDollarSign size={18} aria-hidden="true" />
            <span className="hud-ad-label">
              {adLoading ? 'Loading…' : PAID_BUILD ? `Boost (${adSlots}/5)` : `Watch Ad (${adSlots}/5)`}
            </span>
          </button>
          {adBoostActive && (
            <span className="hud-ad-line hud-ad-boost">Boost: {formatHm(adBoostSeconds)}</span>
          )}
          {adSlots < 5 && (
            <span className="hud-ad-line hud-ad-refill">
              Next {PAID_BUILD ? 'campaign' : 'slot'} in {formatHm(adNextSlotSeconds)}
            </span>
          )}
        </div>
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
        <button
          type="button"
          disabled={collectDisabled}
          onClick={onCollect}
          title={reviewOpen ? 'Close the week from the review panel' : undefined}
        >
          <WalletCards size={18} />
          <span>{reviewOpen ? 'See week review' : collectButtonLabel(state.collectRequired, due)}</span>
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
        <div title="Cars that kept driving past this week">
          <span>Passing</span>
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
        <div title="Cars on the lot right now / customers washed all-time">
          <span>Live / All-time</span>
          <strong>
            {liveCars} / {state.totalCars}
          </strong>
        </div>
        <div title="Empire buildout toward multi-district goals">
          <span>Empire</span>
          <strong>{Math.round(progress * 100)}%</strong>
        </div>
        <div title="Day progress this week">
          <span>Week day</span>
          <strong>{Math.round(weekProgress * 100)}%</strong>
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
          <span>Live</span>
          <strong>{liveCars}</strong>
        </div>
        <div>
          <span>Queued</span>
          <strong>{queued}</strong>
        </div>
        <div title="Cars that kept driving past">
          <span>Passing</span>
          <strong>{state.weekDriveBys}</strong>
        </div>
      </section>
    </div>
  )
}

/**
 * Rolls the cash number up over ~600ms on meaningful gains so collections
 * feel like money arriving. Spends and small ticks snap instantly.
 */
function AnimatedCash({ value }: { value: number }) {
  const [display, setDisplay] = useState(value)
  const displayRef = useRef(value)

  useEffect(() => {
    displayRef.current = display
  }, [display])

  useEffect(() => {
    const from = displayRef.current
    const delta = value - from
    if (delta <= 50) {
      setDisplay(value)
      return
    }

    const start = performance.now()
    let raf = 0
    const step = (now: number) => {
      const alpha = Math.min(1, (now - start) / 600)
      const eased = 1 - Math.pow(1 - alpha, 3)
      setDisplay(from + delta * eased)
      if (alpha < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return <>{money(display)}</>
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

function graphicsLabel(quality: GraphicsQuality): string {
  if (quality === 'low') return 'Low'
  if (quality === 'high') return 'High'
  return 'Balanced'
}
