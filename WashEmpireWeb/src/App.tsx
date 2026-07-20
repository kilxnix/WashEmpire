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
      const snapshot = { ...gameRef.current, lastTickAt: Date.now() }
      localStorage.setItem(SAVE_KEY, exportGameState(snapshot))
    }, 1500)

    return () => window.clearInterval(interval)
  }, [])

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
  }

  function handleCollect() {
    const due = cashBoxValue(totalCashBox(gameRef.current.bays))
    const openingWeek = gameRef.current.collectRequired
    setGame((state) => collectPayBox(state))
    if (due > 0) {
      setCollectionToast({ id: Date.now(), title: 'Collected', amount: due })
    } else if (openingWeek) {
      setCollectionToast({ id: Date.now(), title: 'Week opened', amount: 0 })
    }
  }

  function handleBuy(upgradeId: UpgradeId) {
    setGame((state) => buyUpgrade(state, upgradeId))
  }

  function handleBuyBay(bayIndex: number, upgradeId: BayUpgradeId) {
    setGame((state) => buyBayUpgrade(state, bayIndex, upgradeId))
  }

  function handleHireEmployee(employeeId: EmployeeId) {
    setGame((state) => hireEmployee(state, employeeId))
  }

  function handleBuyCity(cityId: CityId) {
    setGame((state) => buyCityDistrict(state, cityId))
    setRideAlong(false)
  }

  function handleRestoreCity(cityId: CityId) {
    setGame((state) => restoreCityDistrict(state, cityId))
  }

  function handleSwitchCity(cityId: CityId) {
    setGame((state) => switchCityDistrict(state, cityId))
    setRideAlong(false)
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

  return (
    <main className="app-shell">
      {gameVisible && (
        <Suspense fallback={<SceneLoading />}>
          <WashScene state={game} onCollect={handleCollect} rideAlong={activeRideAlong} graphicsQuality={graphicsQuality} />
        </Suspense>
      )}
      {gameVisible ? (
        <>
          <Hud
            state={game}
            graphicsQuality={graphicsQuality}
            rideAlong={activeRideAlong}
            onSetSpeed={handleSetSpeed}
            onCollect={handleCollect}
            onOpenUpgrades={() => setUpgradesOpen(true)}
            onOpenCityMap={() => setCityOpen(true)}
            onCycleGraphics={handleCycleGraphics}
            onToggleRideAlong={handleToggleRideAlong}
            onWatchAd={handleWatchAd}
            adLoading={adLoading}
          />
          {!activeRideAlong && !(game.collectRequired && game.lastReview) && (
            <MomentumPanel
              state={game}
              adLoading={adLoading}
              onCollect={handleCollect}
              onOpenUpgrades={() => setUpgradesOpen(true)}
              onOpenCityMap={() => setCityOpen(true)}
              onWatchAd={handleWatchAd}
            />
          )}
        </>
      ) : titleOpen || !game.gameStarted ? (
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
        open={upgradesOpen}
        state={game}
        onBuy={handleBuy}
        onBuyBay={handleBuyBay}
        onHireEmployee={handleHireEmployee}
        onClose={() => setUpgradesOpen(false)}
      />
      <CityDrawer
        open={cityOpen}
        state={game}
        onBuy={handleBuyCity}
        onRestore={handleRestoreCity}
        onSwitch={handleSwitchCity}
        onClose={() => setCityOpen(false)}
      />
      {game.collectRequired && game.lastReview && (
        <WeekReviewPanel state={game} onCollect={handleCollect} />
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
      <span className="mini-label">{title}</span>
      <strong>{amount > 0 ? `+${money(amount)}` : 'Ready'}</strong>
    </section>
  )
}

function WeekReviewPanel({ state, onCollect }: { state: GameState; onCollect: () => void }) {
  const review = state.lastReview
  if (!review) return null
  const costsDue = review.costsDue ?? 0
  const closeoutAction =
    review.physicalDue > 0 ? 'Collect, pay costs, open' : costsDue > 0 ? 'Pay costs and open' : 'Open'

  return (
    <section className="week-review" aria-label="Weekly review">
      <span className="mini-label">Week {review.week} review</span>
      <h2>{money(review.profit)} profit</h2>
      <dl>
        <div>
          <dt>Revenue</dt>
          <dd>{money(review.revenue)}</dd>
        </div>
        <div>
          <dt>Total costs</dt>
          <dd>{money(review.costs)}</dd>
        </div>
        <div>
          <dt>{costsDue > 0 ? 'Costs due' : 'Costs paid'}</dt>
          <dd>{money(costsDue > 0 ? costsDue : review.costsPaid ?? review.costs)}</dd>
        </div>
        <div>
          <dt>Employee wages</dt>
          <dd>{money(review.employeeWages ?? 0)}</dd>
        </div>
        <div>
          <dt>Cars served</dt>
          <dd>{review.cars}</dd>
        </div>
        <div>
          <dt>Drive-bys</dt>
          <dd>{review.driveBys ?? 0}</dd>
        </div>
        <div>
          <dt>Lost sales</dt>
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
