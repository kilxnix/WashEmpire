import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import './App.css'
import { CityDrawer } from './components/CityDrawer'
import { Hud } from './components/Hud'
import { MomentumPanel } from './components/MomentumPanel'
import { OfflineReturnPanel } from './components/OfflineReturnPanel'
import { StartMenu } from './components/StartMenu'
import { UpgradeDrawer } from './components/UpgradeDrawer'
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
import { showRewardedAd } from './services/ads'
import type { BayUpgradeId, CityId, EmployeeId, GameState, GraphicsQuality, SpeedSetting, UpgradeId } from './game/types'

const SAVE_KEY = 'wash-empire-browser-save-v1'
const GRAPHICS_SAVE_KEY = 'wash-empire-graphics-quality-v1'
const COACH_KEY = 'wash-empire-coach-v1'
const SIMULATION_STEP_SECONDS = 1 / 20
const GRAPHICS_SEQUENCE: GraphicsQuality[] = ['low', 'balanced', 'high']
const WashScene = lazy(() => import('./components/WashScene').then((module) => ({ default: module.WashScene })))

function App() {
  const [game, setGame] = useState<GameState>(loadSavedGame)
  const [graphicsQuality, setGraphicsQuality] = useState<GraphicsQuality>(loadGraphicsQuality)
  const [titleOpen, setTitleOpen] = useState(true)
  const [upgradesOpen, setUpgradesOpen] = useState(false)
  const [cityOpen, setCityOpen] = useState(false)
  const [rideAlong, setRideAlong] = useState(false)
  const [adLoading, setAdLoading] = useState(false)
  const [collectionToast, setCollectionToast] = useState<CollectionToastState | null>(null)
  const [coachOpen, setCoachOpen] = useState(() => !hasDismissedCoach())
  const [coachProgress, setCoachProgress] = useState({
    collected: false,
    upgraded: false,
    fastSpeed: false,
  })
  const gameRef = useRef(game)
  const titleOpenRef = useRef(titleOpen)

  useEffect(() => {
    gameRef.current = game
  }, [game])

  useEffect(() => {
    titleOpenRef.current = titleOpen
  }, [titleOpen])

  useEffect(() => {
    let frame = 0
    let last = performance.now()

    function tick(now: number) {
      const delta = (now - last) / 1000
      if (titleOpenRef.current) {
        last = now
      } else if (delta >= SIMULATION_STEP_SECONDS) {
        last = now
        setGame((state) => advanceGame(state, delta))
      }
      frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  useEffect(() => {
    const interval = window.setInterval(() => {
      // Persist the sim's lastTickAt as-is. Stamping Date.now() here while the
      // tab is backgrounded erases the offline window before resume reconcile.
      localStorage.setItem(SAVE_KEY, exportGameState(gameRef.current))
    }, 1500)

    return () => window.clearInterval(interval)
  }, [])

  useEffect(() => {
    function flushSave() {
      localStorage.setItem(SAVE_KEY, exportGameState(gameRef.current))
    }

    function handleVisibility() {
      if (document.visibilityState === 'hidden') {
        flushSave()
        return
      }

      if (document.visibilityState === 'visible') {
        setGame((state) => reconcileOffline(state, Date.now()))
      }
    }

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('beforeunload', flushSave)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('beforeunload', flushSave)
    }
  }, [])

  useEffect(() => {
    if (!collectionToast) return
    const timeout = window.setTimeout(() => setCollectionToast(null), 2200)
    return () => window.clearTimeout(timeout)
  }, [collectionToast])

  useEffect(() => {
    localStorage.setItem(GRAPHICS_SAVE_KEY, graphicsQuality)
  }, [graphicsQuality])

  function handleSetSpeed(speed: SpeedSetting) {
    setGame((state) => setSpeed(state, speed))
    if (speed >= 3) {
      setCoachProgress((progress) => ({ ...progress, fastSpeed: true }))
    }
  }

  function handleCollect(options?: { fromWeekReview?: boolean }) {
    const fromWeekReview = options?.fromWeekReview === true
    // While the weekly review is open, only the review button may close the week.
    if (gameRef.current.collectRequired && gameRef.current.lastReview && !fromWeekReview) {
      const panel = document.querySelector<HTMLElement>('[aria-label="Weekly review"]')
      panel?.classList.add('week-review-pulse')
      panel?.focus?.()
      window.setTimeout(() => panel?.classList.remove('week-review-pulse'), 900)
      setCollectionToast({ id: Date.now(), title: 'Close the week review first', amount: 0 })
      return
    }

    const due = cashBoxValue(totalCashBox(gameRef.current.bays))
    const openingWeek = gameRef.current.collectRequired
    setGame((state) => collectPayBox(state))
    setUpgradesOpen(false)
    setCityOpen(false)
    if (due > 0) {
      setCoachProgress((progress) => ({ ...progress, collected: true }))
      setCollectionToast({ id: Date.now(), title: 'Collected', amount: due })
    } else if (openingWeek) {
      setCoachProgress((progress) => ({ ...progress, collected: true }))
      setCollectionToast({ id: Date.now(), title: 'Week opened', amount: 0 })
    }
  }

  function handleWeekReviewCollect() {
    handleCollect({ fromWeekReview: true })
  }

  function openUpgrades() {
    setCityOpen(false)
    setUpgradesOpen(true)
  }

  function openCityMap() {
    setUpgradesOpen(false)
    setCityOpen(true)
  }

  function handleBuy(upgradeId: UpgradeId) {
    setGame((state) => buyUpgrade(state, upgradeId))
    setCoachProgress((progress) => ({ ...progress, upgraded: true }))
  }

  function handleBuyBay(bayIndex: number, upgradeId: BayUpgradeId) {
    setGame((state) => buyBayUpgrade(state, bayIndex, upgradeId))
    setCoachProgress((progress) => ({ ...progress, upgraded: true }))
  }

  function handleHireEmployee(employeeId: EmployeeId) {
    setGame((state) => hireEmployee(state, employeeId))
  }

  function handleBuyCity(cityId: CityId) {
    setGame((state) => buyCityDistrict(state, cityId))
    setRideAlong(false)
    setCityOpen(false)
  }

  function handleRestoreCity(cityId: CityId) {
    setGame((state) => restoreCityDistrict(state, cityId))
  }

  function handleSwitchCity(cityId: CityId) {
    setGame((state) => switchCityDistrict(state, cityId))
    setRideAlong(false)
    setCityOpen(false)
  }

  function dismissCoach() {
    setCoachOpen(false)
    try {
      localStorage.setItem(COACH_KEY, '1')
    } catch {
      // ignore storage failures
    }
  }

  function handleToggleRideAlong() {
    if (!isConveyorCity(gameRef.current)) return
    setRideAlong((enabled) => !enabled)
  }

  function handleStart(locationName: string) {
    setGame((state) => startGame(state, locationName))
    setTitleOpen(false)
  }

  function handleContinue() {
    setTitleOpen(false)
  }

  function handleNewGame(locationName: string) {
    const fresh = startGame(createInitialState(), locationName)
    localStorage.setItem(SAVE_KEY, exportGameState(fresh))
    setGame(fresh)
    setCollectionToast(null)
    setUpgradesOpen(false)
    setCityOpen(false)
    setRideAlong(false)
    setTitleOpen(false)
  }

  async function handleWatchAd() {
    if (adLoading || gameRef.current.ads.slotsAvailable <= 0) return
    setAdLoading(true)
    try {
      if (await showRewardedAd()) {
        setGame((state) => watchAdForBoost(state))
        setCollectionToast({ id: Date.now(), title: 'Ad boost armed', amount: 0 })
      } else {
        setCollectionToast({ id: Date.now(), title: 'No ad reward — try again later', amount: 0 })
      }
    } finally {
      setAdLoading(false)
    }
  }

  function handleCycleGraphics() {
    setGraphicsQuality((quality) => nextGraphicsQuality(quality))
  }

  function handleDismissOfflineSummary() {
    setGame((state) => ({ ...state, pendingOfflineSummary: null }))
  }

  const activeRideAlong = rideAlong && isConveyorCity(game)
  const gameVisible = game.gameStarted && !titleOpen
  const showTitle = titleOpen || !game.gameStarted
  const weekReviewOpen = Boolean(game.collectRequired && game.lastReview)
  // Week review owns the screen: never leave drawers stacked over it.
  const upgradesDrawerOpen = upgradesOpen && !weekReviewOpen
  const cityDrawerOpen = cityOpen && !weekReviewOpen

  const showCoach = coachOpen && gameVisible && !activeRideAlong && !weekReviewOpen

  return (
    <main className={`app-shell${showCoach ? ' coach-active' : ''}`}>
      <Suspense fallback={<SceneLoading />}>
        <WashScene
          state={game}
          onCollect={handleCollect}
          rideAlong={gameVisible && activeRideAlong}
          graphicsQuality={graphicsQuality}
        />
      </Suspense>
      {gameVisible ? (
        <>
          <Hud
            state={game}
            graphicsQuality={graphicsQuality}
            rideAlong={activeRideAlong}
            onSetSpeed={handleSetSpeed}
            onCollect={handleCollect}
            onOpenUpgrades={openUpgrades}
            onOpenCityMap={openCityMap}
            onCycleGraphics={handleCycleGraphics}
            onToggleRideAlong={handleToggleRideAlong}
            onWatchAd={handleWatchAd}
            adLoading={adLoading}
          />
          {!activeRideAlong && !weekReviewOpen && (
            <MomentumPanel
              state={game}
              adLoading={adLoading}
              onCollect={handleCollect}
              onOpenUpgrades={openUpgrades}
              onOpenCityMap={openCityMap}
              onWatchAd={handleWatchAd}
            />
          )}
          {showCoach && (
            <FirstSessionCoach
              state={game}
              progress={coachProgress}
              onDismiss={dismissCoach}
              onSpeedUp={() => handleSetSpeed(10)}
              onOpenUpgrades={openUpgrades}
            />
          )}
        </>
      ) : showTitle ? (
        <StartMenu
          cash={game.cash}
          hasRun={game.gameStarted}
          initialName={game.locationName}
          week={game.week}
          onContinue={handleContinue}
          onNewGame={handleNewGame}
          onStart={handleStart}
        />
      ) : null}
      {collectionToast && (
        <CollectionToast
          key={collectionToast.id}
          amount={collectionToast.amount}
          title={collectionToast.title}
        />
      )}
      {gameVisible && activeRideAlong && (
        <>
          <div className="ride-windshield" aria-hidden="true" />
          <RideAlongOverlay state={game} />
        </>
      )}
      <UpgradeDrawer
        open={upgradesDrawerOpen}
        state={game}
        onBuy={handleBuy}
        onBuyBay={handleBuyBay}
        onHireEmployee={handleHireEmployee}
        onClose={() => setUpgradesOpen(false)}
      />
      <CityDrawer
        open={cityDrawerOpen}
        state={game}
        onBuy={handleBuyCity}
        onRestore={handleRestoreCity}
        onSwitch={handleSwitchCity}
        onClose={() => setCityOpen(false)}
      />
      {weekReviewOpen && (
        <WeekReviewPanel state={game} onCollect={handleWeekReviewCollect} />
      )}
      {game.gameStarted && game.pendingOfflineSummary && (
        <OfflineReturnPanel
          summary={game.pendingOfflineSummary}
          onDismiss={handleDismissOfflineSummary}
        />
      )}
    </main>
  )
}

function SceneLoading() {
  return (
    <div className="scene-loading" aria-label="Loading wash lot">
      <span>Loading wash lot...</span>
    </div>
  )
}

function RideAlongOverlay({ state }: { state: GameState }) {
  const car =
    state.cars.find((item) => item.stage === 'washing') ??
    state.cars.find((item) => item.stage === 'entering') ??
    state.cars.find((item) => item.stage === 'leaving')

  return (
    <section className="ride-overlay" aria-live="polite">
      <span className="mini-label">Ride view</span>
      <strong>{car ? passengerLabel(car.variant) : 'Waiting for a wash'}</strong>
      <span>{car ? rideStageLabel(car.stage) : 'Camera will enter the next customer car.'}</span>
    </section>
  )
}

function passengerLabel(variant: number): string {
  if (variant % 3 === 0) return 'Driver + passenger'
  if (variant % 2 === 0) return 'Solo commuter'
  return 'Regular customer'
}

function rideStageLabel(stage: GameState['cars'][number]['stage']): string {
  if (stage === 'entering') return 'Rolling onto the wash track'
  if (stage === 'washing') return 'Wash cycle in progress'
  if (stage === 'leaving') return 'Drying and exiting'
  return 'Approaching'
}

interface CollectionToastState {
  id: number
  title: string
  amount: number
}

function CollectionToast({ title, amount }: { title: string; amount: number }) {
  return (
    <section className="collection-toast" aria-live="polite">
      <span className="mini-label">{amount > 0 ? title : 'Notice'}</span>
      <strong>{amount > 0 ? `+${money(amount)}` : title}</strong>
    </section>
  )
}

function WeekReviewPanel({ state, onCollect }: { state: GameState; onCollect: () => void }) {
  const review = state.lastReview
  if (!review) return null
  const costsDue = review.costsDue ?? 0
  const closeoutAction =
    review.physicalDue > 0 ? 'Collect, pay costs, open' : costsDue > 0 ? 'Pay costs and open' : 'Open'
  const driveBys = review.driveBys ?? 0
  const served = review.cars
  const passShare = driveBys + served > 0 ? Math.round((driveBys / (driveBys + served)) * 100) : 0
  const earlyWeek = review.week <= 3
  const tip =
    driveBys > served
      ? earlyWeek
        ? 'Normal early on: most road traffic is just passing. Upgrades and faster bays convert more of them.'
        : 'Upgrade wash speed and demand to turn more passing cars into customers.'
      : 'Strong capture this week — keep collecting and reinvesting.'

  return (
    <section className="week-review" aria-label="Weekly review" tabIndex={-1}>
      <span className="mini-label">Week {review.week} review</span>
      <h2>{money(review.profit)} profit</h2>
      <p className="week-review-tip">{tip}</p>
      <dl>
        <div>
          <dt>Wash revenue</dt>
          <dd>{money(review.revenue)}</dd>
        </div>
        <div>
          <dt>Lot overhead</dt>
          <dd>{money(review.costs)}</dd>
        </div>
        <div>
          <dt>{costsDue > 0 ? 'Overhead due' : 'Overhead paid'}</dt>
          <dd>{money(costsDue > 0 ? costsDue : review.costsPaid ?? review.costs)}</dd>
        </div>
        <div>
          <dt>Employee wages</dt>
          <dd>{money(review.employeeWages ?? 0)}</dd>
        </div>
        <div>
          <dt>Cars washed</dt>
          <dd>{served}</dd>
        </div>
        <div>
          <dt>Passing traffic</dt>
          <dd>
            {driveBys}
            {driveBys + served > 0 ? ` (${passShare}%)` : ''}
          </dd>
        </div>
        <div>
          <dt title="Estimated value of cars that did not stop this week">Missed opportunity</dt>
          <dd>{money(review.lostRevenue ?? 0)}</dd>
        </div>
        <div>
          <dt>Auto-collected</dt>
          <dd>{money(review.autoCollected ?? 0)}</dd>
        </div>
        <div>
          <dt>Pay box due</dt>
          <dd>{money(review.physicalDue)}</dd>
        </div>
      </dl>
      <button type="button" onClick={onCollect}>
        {closeoutAction} Week {state.week + 1}
      </button>
    </section>
  )
}

function FirstSessionCoach({
  state,
  progress,
  onDismiss,
  onSpeedUp,
  onOpenUpgrades,
}: {
  state: GameState
  progress: { collected: boolean; upgraded: boolean; fastSpeed: boolean }
  onDismiss: () => void
  onSpeedUp: () => void
  onOpenUpgrades: () => void
}) {
  const hasBayUpgrade =
    progress.upgraded ||
    state.bays.some((bay) => Object.values(bay.upgrades).some((level) => level > 0)) ||
    Object.values(state.upgrades).some(Boolean)
  const speedDone = progress.fastSpeed || state.speed >= 3 || state.resumeSpeed >= 3
  const steps = [
    {
      id: 'speed',
      done: speedDone,
      label: (
        <>
          Hit <strong>10x</strong> so cars arrive faster
        </>
      ),
      action: !speedDone ? { label: 'Set 10x', run: onSpeedUp } : null,
    },
    {
      id: 'collect',
      done: progress.collected || state.week > 1,
      label: (
        <>
          <strong>Collect</strong> the pay box when it fills
        </>
      ),
      action: null,
    },
    {
      id: 'upgrade',
      done: hasBayUpgrade,
      label: (
        <>
          Buy a <strong>bay upgrade</strong> — look for new props on the bay
        </>
      ),
      action: !hasBayUpgrade ? { label: 'Upgrades', run: onOpenUpgrades } : null,
    },
    {
      id: 'week',
      done: state.week > 1,
      label: (
        <>
          At week end, use the <strong>review button</strong> to open the next week
        </>
      ),
      action: null,
    },
  ] as const

  const next = steps.find((step) => !step.done)
  const allDone = !next

  // Auto-dismiss shortly after every first-session step is complete.
  useEffect(() => {
    if (!allDone) return
    const timer = window.setTimeout(() => onDismiss(), 2200)
    return () => window.clearTimeout(timer)
  }, [allDone, onDismiss])

  if (allDone) {
    return (
      <section className="first-coach first-coach-done" aria-label="First session tips">
        <span className="mini-label">Quick start</span>
        <p>You&apos;re rolling — keep collecting and upgrading.</p>
        <div className="first-coach-actions">
          <button type="button" className="first-coach-dismiss" onClick={onDismiss}>
            Dismiss
          </button>
        </div>
      </section>
    )
  }

  return (
    <section className="first-coach" aria-label="First session tips">
      <span className="mini-label">Quick start</span>
      <ol>
        {steps.map((step) => (
          <li key={step.id} className={step.done ? 'done' : step.id === next.id ? 'current' : ''}>
            <span className="first-coach-check" aria-hidden="true">
              {step.done ? '✓' : step.id === next.id ? '→' : '○'}
            </span>
            <span>{step.label}</span>
          </li>
        ))}
      </ol>
      <div className="first-coach-actions">
        {next.action && (
          <button type="button" onClick={next.action.run}>
            {next.action.label}
          </button>
        )}
        <button type="button" className="first-coach-dismiss" onClick={onDismiss}>
          Got it
        </button>
      </div>
    </section>
  )
}

function hasDismissedCoach(): boolean {
  try {
    return localStorage.getItem(COACH_KEY) === '1'
  } catch {
    return false
  }
}

function loadSavedGame(): GameState {
  try {
    const saved = localStorage.getItem(SAVE_KEY)
    if (!saved) return createInitialState()
    const hydrated = hydrateGameState(JSON.parse(saved)) ?? createInitialState()
    return prepareLoadedGame(reconcileOffline(hydrated, Date.now()))
  } catch {
    return createInitialState()
  }
}

function prepareLoadedGame(state: GameState): GameState {
  return {
    ...state,
    cars: [],
    nextCarIn: 1.2,
  }
}

function loadGraphicsQuality(): GraphicsQuality {
  try {
    const saved = localStorage.getItem(GRAPHICS_SAVE_KEY)
    return isGraphicsQuality(saved) ? saved : 'balanced'
  } catch {
    return 'balanced'
  }
}

function nextGraphicsQuality(current: GraphicsQuality): GraphicsQuality {
  const index = GRAPHICS_SEQUENCE.indexOf(current)
  return GRAPHICS_SEQUENCE[(index + 1) % GRAPHICS_SEQUENCE.length]
}

function isGraphicsQuality(value: unknown): value is GraphicsQuality {
  return value === 'low' || value === 'balanced' || value === 'high'
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

export default App
