import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import { CityDrawer } from './components/CityDrawer'
import { Hud } from './components/Hud'
import { CampaignVignette, MarketingPanel } from './components/MarketingPanel'
import { MomentumPanel } from './components/MomentumPanel'
import { OfflineReturnPanel } from './components/OfflineReturnPanel'
import { StartMenu } from './components/StartMenu'
import { UpgradeDrawer } from './components/UpgradeDrawer'
import {
  advanceGame,
  allDistrictsOwned,
  bayUpgradeCost,
  bayUpgradeDefinitions,
  buyBayUpgrade,
  buyCityDistrict,
  buyUpgrade,
  cashBoxValue,
  cityDefinitions,
  collectPayBox,
  createInitialState,
  employeeDefinitions,
  exportGameState,
  hireEmployee,
  hydrateGameState,
  isConveyorCity,
  campaignDefinitions,
  launchCampaign,
  reconcileOffline,
  restoreCityDistrict,
  setSpeed,
  startGame,
  switchCityDistrict,
  totalCashBox,
  upgradeDefinitions,
} from './game/simulation'
import { PAID_BUILD, showRewardedAd } from './services/ads'
import {
  isSoundEnabled,
  playBoost,
  playCollect,
  playDistrict,
  playHire,
  playPurchase,
  playWeekOpen,
  playWin,
  setSoundEnabled,
} from './services/sound'
import type { BayUpgradeId, CampaignId, CityId, EmployeeId, GameState, GraphicsQuality, SpeedSetting, UpgradeId, WeekReview } from './game/types'

const SAVE_KEY = 'wash-empire-browser-save-v1'
const GRAPHICS_SAVE_KEY = 'wash-empire-graphics-quality-v1'
const COACH_KEY = 'wash-empire-coach-v1'
const SIMULATION_STEP_SECONDS = 1 / 20
const GRAPHICS_SEQUENCE: GraphicsQuality[] = ['low', 'balanced', 'high']
const WashScene = lazy(() => import('./components/WashScene').then((module) => ({ default: module.WashScene })))

import type { CollectFx, SceneFocus } from './components/WashScene'

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
  const [dismissedAutoReviewWeek, setDismissedAutoReviewWeek] = useState(0)
  const [sceneFocus, setSceneFocus] = useState<SceneFocus | null>(null)
  const [collectFx, setCollectFx] = useState<CollectFx | null>(null)
  const [soundOn, setSoundOn] = useState(isSoundEnabled)
  const [marketingOpen, setMarketingOpen] = useState(false)
  const [vignetteSpot, setVignetteSpot] = useState<number | null>(null)
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
    if (!collectFx) return
    const timeout = window.setTimeout(() => setCollectFx(null), 1400)
    return () => window.clearTimeout(timeout)
  }, [collectFx])

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
      setCollectionToast({ id: Date.now(), title: 'Close the week review first', amount: null })
      return
    }

    const current = gameRef.current
    const due = cashBoxValue(totalCashBox(current.bays))
    const openingWeek = current.collectRequired
    // At closeout the week's overhead comes straight out of the collection, so
    // report what actually lands in cash — not the gross pull.
    const costsDue = openingWeek ? current.lastReview?.costsDue ?? current.lastReview?.costs ?? 0 : 0
    const net = roundCash(due - costsDue)

    setGame((state) => collectPayBox(state))
    setUpgradesOpen(false)
    setCityOpen(false)

    if (due > 0) {
      setCoachProgress((progress) => ({ ...progress, collected: true }))
      setCollectFx({ id: Date.now(), amount: due })
      playCollect()
    }

    if (openingWeek) {
      setCoachProgress((progress) => ({ ...progress, collected: true }))
      setCollectionToast({
        id: Date.now(),
        title: costsDue > 0 ? `Week ${current.week} closed` : 'Week opened',
        amount: costsDue > 0 ? net : null,
        detail:
          costsDue > 0
            ? `${money(due)} collected − ${money(costsDue)} overhead`
            : undefined,
      })
      playWeekOpen()
    } else if (due > 0) {
      setCollectionToast({ id: Date.now(), title: 'Collected', amount: due })
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
    const current = gameRef.current
    const def = upgradeDefinitions.find((upgrade) => upgrade.id === upgradeId)
    if (def && !current.upgrades[upgradeId] && current.cash >= def.cost) {
      setSceneFocus({ id: Date.now(), kind: 'lot' })
      playPurchase()
    }
    setGame((state) => buyUpgrade(state, upgradeId))
    setCoachProgress((progress) => ({ ...progress, upgraded: true }))
  }

  function handleBuyBay(bayIndex: number, upgradeId: BayUpgradeId) {
    const current = gameRef.current
    const bay = current.bays[bayIndex]
    const def = bayUpgradeDefinitions.find((upgrade) => upgrade.id === upgradeId)
    const level = bay?.upgrades[upgradeId] ?? 0
    if (
      bay &&
      def &&
      level < def.maxLevel &&
      current.cash >= bayUpgradeCost(upgradeId, level, bayIndex)
    ) {
      setSceneFocus({ id: Date.now(), kind: 'bay', bayIndex })
      playPurchase()
    }
    setGame((state) => buyBayUpgrade(state, bayIndex, upgradeId))
    setCoachProgress((progress) => ({ ...progress, upgraded: true }))
  }

  function handleHireEmployee(employeeId: EmployeeId) {
    const current = gameRef.current
    const def = employeeDefinitions.find((employee) => employee.id === employeeId)
    if (def && !current.employees[employeeId] && current.cash >= def.hireCost) {
      playHire()
    }
    setGame((state) => hireEmployee(state, employeeId))
  }

  function handleBuyCity(cityId: CityId) {
    const current = gameRef.current
    const def = cityDefinitions.find((city) => city.id === cityId)
    const district = current.cityMap.districts.find((item) => item.id === cityId)
    if (def && district && !district.owned && current.cash >= def.purchaseCost) {
      // District purchases are the biggest moments in the run — celebrate them.
      setCollectionToast({ id: Date.now(), title: `District unlocked — ${def.name}`, amount: null })
      setSceneFocus({ id: Date.now() + 1, kind: 'lot' })
      playDistrict()
    }
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

  const dismissCoach = useCallback(() => {
    setCoachOpen(false)
    try {
      localStorage.setItem(COACH_KEY, '1')
    } catch {
      // ignore storage failures
    }
  }, [])

  function handleToggleRideAlong() {
    if (!isConveyorCity(gameRef.current)) return
    setRideAlong((enabled) => !enabled)
  }

  function handleStart(locationName: string) {
    setGame((state) => startGame(state, locationName))
    setTitleOpen(false)
  }

  function handleContinue() {
    // Credit time spent idle on the title screen now, so the welcome-back
    // panel appears immediately on entry instead of minutes into play.
    setGame((state) => reconcileOffline(state, Date.now()))
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

  function openMarketing() {
    setUpgradesOpen(false)
    setCityOpen(false)
    setMarketingOpen(true)
  }

  async function handleLaunchCampaign(campaignId: CampaignId) {
    const def = campaignDefinitions.find((campaign) => campaign.id === campaignId)
    if (!def || adLoading) return

    // Free builds gate the flagship campaign behind a rewarded ad instead of cash.
    const freeViaAd = !PAID_BUILD && campaignId === 'driver'
    const current = gameRef.current
    const cost = freeViaAd ? 0 : def.cost
    if (current.ads.slotsAvailable < def.slotCost || current.cash < cost) return

    if (freeViaAd) {
      setAdLoading(true)
      try {
        if (!(await showRewardedAd())) {
          setCollectionToast({ id: Date.now(), title: 'No ad reward — try again later', amount: null })
          return
        }
      } finally {
        setAdLoading(false)
      }
      setGame((state) => launchCampaign(state, campaignId, { waiveCost: true }))
    } else {
      setGame((state) => launchCampaign(state, campaignId))
    }

    setCollectionToast({ id: Date.now(), title: `${def.name} launched`, amount: null })
    if (campaignId === 'flyer') {
      playPurchase()
    } else {
      playBoost()
      // The ad break airs as an in-world skit — instantly skippable.
      setVignetteSpot(Math.floor(Math.random() * 5))
    }
  }

  function handleToggleSound() {
    setSoundOn((current) => {
      setSoundEnabled(!current)
      return !current
    })
  }

  function handleCycleGraphics() {
    setGraphicsQuality((quality) => nextGraphicsQuality(quality))
  }

  function handleDismissOfflineSummary() {
    setGame((state) => ({ ...state, pendingOfflineSummary: null }))
  }

  function handleDismissEmpireComplete() {
    setGame((state) => ({ ...state, empireCelebrated: true }))
  }

  function handleExportSave(): string {
    return exportGameState(gameRef.current)
  }

  function handleImportSave(raw: string): boolean {
    try {
      const hydrated = hydrateGameState(JSON.parse(raw))
      if (!hydrated) return false
      localStorage.setItem(SAVE_KEY, exportGameState(hydrated))
      setGame(prepareLoadedGame(reconcileOffline(hydrated, Date.now())))
      return true
    } catch {
      return false
    }
  }

  const gameVisible = game.gameStarted && !titleOpen
  const showTitle = titleOpen || !game.gameStarted
  const weekReviewOpen = gameVisible && Boolean(game.collectRequired && game.lastReview)
  // The weekly review owns the screen — the ride pauses while it is open.
  const activeRideAlong = rideAlong && isConveyorCity(game) && !weekReviewOpen
  const autoClosedReview = gameVisible && !weekReviewOpen && game.lastReview?.autoClosed ? game.lastReview : null
  const autoClosedReviewWeek = autoClosedReview?.week ?? 0
  const autoReviewVisible = autoClosedReview !== null && autoClosedReviewWeek > dismissedAutoReviewWeek

  useEffect(() => {
    if (autoClosedReviewWeek === 0 || autoClosedReviewWeek <= dismissedAutoReviewWeek) return
    const timer = window.setTimeout(() => setDismissedAutoReviewWeek(autoClosedReviewWeek), 9000)
    return () => window.clearTimeout(timer)
  }, [autoClosedReviewWeek, dismissedAutoReviewWeek])

  // Week review owns the screen: never leave drawers stacked over it.
  const upgradesDrawerOpen = upgradesOpen && !weekReviewOpen
  const cityDrawerOpen = cityOpen && !weekReviewOpen

  const showCoach = coachOpen && gameVisible && !activeRideAlong && !weekReviewOpen
  const empireComplete = gameVisible && !game.empireCelebrated && allDistrictsOwned(game)

  return (
    <main
      className={`app-shell${showCoach ? ' coach-active' : ''}${gameVisible && activeRideAlong ? ' ride-active' : ''}`}
    >
      <Suspense fallback={<SceneLoading />}>
        <WashScene
          state={game}
          onCollect={handleCollect}
          rideAlong={gameVisible && activeRideAlong}
          graphicsQuality={graphicsQuality}
          focus={gameVisible ? sceneFocus : null}
          onFocusDone={() => setSceneFocus(null)}
          collectFx={gameVisible ? collectFx : null}
        />
      </Suspense>
      {gameVisible ? (
        <>
          <Hud
            state={game}
            graphicsQuality={graphicsQuality}
            rideAlong={activeRideAlong}
            soundOn={soundOn}
            onSetSpeed={handleSetSpeed}
            onCollect={handleCollect}
            onOpenUpgrades={openUpgrades}
            onOpenCityMap={openCityMap}
            onCycleGraphics={handleCycleGraphics}
            onToggleRideAlong={handleToggleRideAlong}
            onToggleSound={handleToggleSound}
            onOpenMarketing={openMarketing}
          />
          {!activeRideAlong && !weekReviewOpen && (
            <MomentumPanel
              state={game}
              adLoading={adLoading}
              onCollect={handleCollect}
              onOpenUpgrades={openUpgrades}
              onOpenCityMap={openCityMap}
              onOpenMarketing={openMarketing}
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
          onExportSave={handleExportSave}
          onImportSave={handleImportSave}
        />
      ) : null}
      {collectionToast && (
        <CollectionToast
          key={collectionToast.id}
          id={collectionToast.id}
          amount={collectionToast.amount}
          title={collectionToast.title}
          detail={collectionToast.detail}
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
      <MarketingPanel
        open={marketingOpen && gameVisible && !weekReviewOpen}
        state={game}
        adLoading={adLoading}
        onLaunch={handleLaunchCampaign}
        onClose={() => setMarketingOpen(false)}
      />
      {vignetteSpot !== null && gameVisible && (
        <CampaignVignette spotIndex={vignetteSpot} onDone={() => setVignetteSpot(null)} />
      )}
      {weekReviewOpen && (
        <WeekReviewPanel state={game} onCollect={handleWeekReviewCollect} />
      )}
      {autoReviewVisible && autoClosedReview && (
        <WeekSummaryToast
          review={autoClosedReview}
          onDismiss={() => setDismissedAutoReviewWeek(autoClosedReview.week)}
        />
      )}
      {gameVisible && game.pendingOfflineSummary && (
        <OfflineReturnPanel
          summary={game.pendingOfflineSummary}
          onDismiss={handleDismissOfflineSummary}
        />
      )}
      {empireComplete && <EmpireCompletePanel state={game} onDismiss={handleDismissEmpireComplete} />}
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
  /** null shows the title alone; a number shows a signed cash delta. */
  amount: number | null
  detail?: string
}

function CollectionToast({ title, amount, detail }: CollectionToastState) {
  if (amount === null) {
    return (
      <section className="collection-toast" aria-live="polite">
        <span className="mini-label">Notice</span>
        <strong>{title}</strong>
      </section>
    )
  }

  return (
    <section className={`collection-toast${amount <= 0 ? ' flat' : ''}`} aria-live="polite">
      <span className="mini-label">{title}</span>
      <strong>
        {amount > 0 ? '+' : ''}
        {money(amount)}
      </strong>
      {detail && <span className="collection-toast-detail">{detail}</span>}
    </section>
  )
}

function EmpireCompletePanel({ state, onDismiss }: { state: GameState; onDismiss: () => void }) {
  useEffect(() => {
    playWin()
  }, [])

  return (
    <section className="empire-complete" aria-label="Empire complete" role="dialog" aria-modal="true">
      <span className="mini-label">Empire complete</span>
      <h2>You own the whole map</h2>
      <p className="empire-complete-sub">
        Every district from Rustwater Junction to the Beltline tunnel is yours. The empire keeps earning — push
        restorations, max the equipment, and see how high the weekly take can go.
      </p>
      <dl>
        <div>
          <dt>Weeks in business</dt>
          <dd>{state.week}</dd>
        </div>
        <div>
          <dt>Lifetime revenue</dt>
          <dd>{money(state.lifetimeRevenue)}</dd>
        </div>
        <div>
          <dt>Customers washed</dt>
          <dd>{state.totalCars.toLocaleString()}</dd>
        </div>
        <div>
          <dt>Cash on hand</dt>
          <dd>{money(state.cash)}</dd>
        </div>
      </dl>
      <button type="button" onClick={onDismiss}>
        Keep building
      </button>
    </section>
  )
}

function WeekSummaryToast({ review, onDismiss }: { review: WeekReview; onDismiss: () => void }) {
  const rushMet = review.rushTarget != null && review.cars >= review.rushTarget
  return (
    <section className="week-summary-toast" aria-live="polite">
      <div>
        <span className="mini-label">Week {review.week} closed by staff</span>
        <strong>{money(review.profit)} profit</strong>
        <span className="week-summary-detail">
          Collected {money(review.autoCollected)} · paid {money(review.costsPaid)} costs
          {review.rushTarget != null && (
            <>
              {' · rush '}
              {review.cars}/{review.rushTarget}
              {rushMet ? ' ✓' : ''}
            </>
          )}
        </span>
      </div>
      <button type="button" onClick={onDismiss} aria-label="Dismiss week summary">
        ✕
      </button>
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
          <dd>{money(Math.max(0, review.costs - (review.employeeWages ?? 0)))}</dd>
        </div>
        <div>
          <dt>Employee wages</dt>
          <dd>{money(review.employeeWages ?? 0)}</dd>
        </div>
        <div>
          <dt>{costsDue > 0 ? 'Costs due at closeout' : 'Costs paid'}</dt>
          <dd>{money(costsDue > 0 ? costsDue : review.costsPaid ?? review.costs)}</dd>
        </div>
        <div>
          <dt>Cars washed</dt>
          <dd>{served}</dd>
        </div>
        {review.rushTarget != null && (
          <div>
            <dt>Rush goal</dt>
            <dd>
              {served} / {review.rushTarget}
              {served >= review.rushTarget ? ' ✓' : ''}
            </dd>
          </div>
        )}
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
        <div className="week-review-net">
          <dt>Lands in your cash</dt>
          <dd>
            {review.physicalDue - costsDue > 0 ? '+' : ''}
            {money(review.physicalDue - costsDue)}
          </dd>
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

  // Persist completion immediately (week review can unmount this panel),
  // then auto-hide after a short celebration beat.
  useEffect(() => {
    if (!allDone) return
    try {
      localStorage.setItem(COACH_KEY, '1')
    } catch {
      // ignore
    }
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
  const rounded = Math.round(value)
  return `${rounded < 0 ? '-' : ''}$${Math.abs(rounded).toLocaleString()}`
}

function roundCash(value: number): number {
  return Math.round(value * 100) / 100
}

export default App
