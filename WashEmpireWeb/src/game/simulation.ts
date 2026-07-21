import type {
  AdState,
  BayState,
  BayUpgradeDefinition,
  BayUpgradeId,
  BayUpgradeLevels,
  Car,
  CashBox,
  CityDefinition,
  CityDistrictState,
  CityId,
  CityMapState,
  EmployeeDefinition,
  EmployeeId,
  EmployeeState,
  GameState,
  Payment,
  SpeedSetting,
  UpgradeDefinition,
  UpgradeId,
  UpgradeState,
} from './types'

const DAY_SECONDS = 30
const WEEK_SECONDS = DAY_SECONDS * 7
const BAY_COUNT = 4
const CUSTOMERS_PER_VISIBLE_CAR = 2
const BASE_PRICE = 12
const BASE_WASH_SECONDS = 8.8
const BASE_SPAWN_SECONDS = 1.8
const BASE_QUEUE_SECONDS = 9.5
const APPROACH_SECONDS = 7.2
const ENTERING_SECONDS = 3.1
const PASSING_SECONDS = 8.4
const WEEKLY_FIXED_COSTS = 520
const CARD_FEE_RATE = 0.03
const AD_BOOST_PER_WATCH_SECONDS = 8_640
const AD_BOOST_MAX_STACK_SECONDS = 43_200
const AD_BOOST_MULTIPLIER = 3
const AD_SLOTS_MAX = 5
const AD_SLOT_REFILL_SECONDS = 17_280
const OFFLINE_BASELINE_RATE_FRACTION = 0.5
const OFFLINE_MIN_RECONCILE_SECONDS = 60
const DEFAULT_LOCATION_NAME = 'Wash Empire Auto Spa'

const CAR_COLORS = ['#f8fafc', '#dbe4ea', '#b8c3cc', '#334155', '#1f2937', '#8f1d1d']

export const upgradeDefinitions: UpgradeDefinition[] = [
  {
    id: 'paint',
    name: 'Paint Job',
    cost: 3000,
    effect: '+10% lot demand',
    visual: 'Fresh blue exterior trim across the property',
  },
  {
    id: 'signage',
    name: 'New Signage',
    cost: 4500,
    effect: '+10% lot demand',
    visual: 'Lit Wash Empire roadside sign',
  },
  {
    id: 'coinCameras',
    name: 'Coin Box Cameras',
    cost: 8500,
    effect: 'Cash slippage drops from 3% to 1%',
    visual: 'Small cameras watching every bay pay box',
  },
  {
    id: 'vacuumIsland',
    name: 'Vacuum Island',
    cost: 12000,
    effect: '+12% lot demand',
    visual: 'Two vacuum posts beside the office',
  },
  {
    id: 'securityLights',
    name: 'Security Lighting',
    cost: 18000,
    effect: '+8% lot demand, slower condition loss',
    visual: 'Bright evening lighting across the bays',
  },
  {
    id: 'cardReader',
    name: 'Card Readers',
    cost: 24000,
    effect: 'Some customers auto-deposit, 3% fee',
    visual: 'Tap-to-pay readers on every pay box',
  },
  {
    id: 'loyaltyApp',
    name: 'Loyalty App',
    cost: 42000,
    effect: '+18% lot demand',
    visual: 'Mobile coupons and repeat-customer rewards',
  },
  {
    id: 'manager',
    name: 'Part-Time Manager',
    cost: 68000,
    effect: '+10% demand, faster wash flow',
    visual: 'Staffed office during peak hours',
  },
  {
    id: 'mobileCampaign',
    name: 'Mobile Ad Campaign',
    cost: 105000,
    effect: '+22% lot demand, bigger rewarded-ad payouts',
    visual: 'Local mobile placements for Wash Empire',
  },
  {
    id: 'laserWash',
    name: 'Touch-Free Laser Wash',
    cost: 180000,
    effect: 'Late-game premium wash package, +25% lot demand',
    visual: 'Separate gantry expansion, not starter equipment',
  },
]

export const bayUpgradeDefinitions: BayUpgradeDefinition[] = [
  {
    id: 'selector',
    name: 'Selector Dial',
    maxLevel: 6,
    baseCost: 650,
    costMultiplier: 1.78,
    effect: '+2.5% bay demand, faster setup',
    visual: 'Cleaner instructions and color selector buttons',
  },
  {
    id: 'wand',
    name: 'High-Pressure Wand',
    maxLevel: 6,
    baseCost: 900,
    costMultiplier: 1.82,
    effect: 'Shorter washes, less condition loss',
    visual: 'Better gun, hose, and swivel boom',
  },
  {
    id: 'soap',
    name: 'Foam Soap System',
    maxLevel: 6,
    baseCost: 1200,
    costMultiplier: 1.84,
    effect: '+$0.50 wash price, slower condition loss',
    visual: 'Foam tank, lines, and wall kit',
  },
  {
    id: 'rinse',
    name: 'Spot-Free Rinse',
    maxLevel: 6,
    baseCost: 1650,
    costMultiplier: 1.86,
    effect: '+$0.25 wash price, better demand',
    visual: 'Blue rinse rail and cleaner finish',
  },
  {
    id: 'dryer',
    name: 'Air Dryer Boom',
    maxLevel: 6,
    baseCost: 2400,
    costMultiplier: 1.88,
    effect: 'Faster bay turnover, small demand bump',
    visual: 'Exit-side blower arm for this bay',
  },
  {
    id: 'vault',
    name: 'Bill/Token Vault',
    maxLevel: 6,
    baseCost: 1500,
    costMultiplier: 1.8,
    effect: 'More token users, less cash leakage',
    visual: 'Larger pay box and token cassette',
  },
]

export const employeeDefinitions: EmployeeDefinition[] = [
  {
    id: 'cashRunner',
    name: 'Cash Runner',
    hireCost: 1200,
    weeklyWage: 240,
    effect: 'Collects weekly if you do not collect first',
    visual: 'Weekly courier empties the pay boxes before review',
  },
  {
    id: 'bayTech',
    name: 'Bay Technician',
    hireCost: 6200,
    weeklyWage: 480,
    effect: 'Collects weekly and restores bay condition',
    visual: 'Service visit cleans drains, hoses, and foam tanks',
  },
  {
    id: 'nightManager',
    name: 'Night Manager',
    hireCost: 18000,
    weeklyWage: 900,
    effect: 'Collects weekly, trims leakage, +6% demand',
    visual: 'Office staff handles closeout and late customers',
  },
]

export const cityDefinitions: CityDefinition[] = [
  {
    id: 'rustwater',
    name: 'Rustwater Junction',
    washModel: 'selfServe',
    theme: 'smallTown',
    bayCount: 3,
    purchaseCost: 0,
    restoreBaseCost: 4500,
    trafficMultiplier: 1.2,
    patienceBonus: 0.02,
    priceBonus: 0,
    story: 'Your first small-city corner lot, rough but visible from the main road.',
    visual: 'Starter streets, low buildings, slower traffic, and cheap restoration',
  },
  {
    id: 'harbor',
    name: 'Harbor Heights',
    washModel: 'selfServe',
    theme: 'harbor',
    bayCount: 3,
    purchaseCost: 42000,
    restoreBaseCost: 9000,
    trafficMultiplier: 1.28,
    patienceBonus: 0.08,
    priceBonus: 0.35,
    story: 'A run-down wash beside docks, apartments, and delivery routes.',
    visual: 'Canals, warehouse blocks, salt-worn bays, and higher token use',
  },
  {
    id: 'downtown',
    name: 'Neon Downtown',
    washModel: 'selfServe',
    theme: 'downtown',
    bayCount: 2,
    purchaseCost: 115000,
    restoreBaseCost: 18000,
    trafficMultiplier: 1.62,
    patienceBonus: 0.13,
    priceBonus: 0.75,
    story: 'A tiny downtown footprint with huge passing volume.',
    visual: 'Dense towers, lit signs, faster traffic, and premium wash pricing',
  },
  {
    id: 'skyway',
    name: 'Frostpeak Resort Row',
    washModel: 'selfServe',
    theme: 'snow',
    bayCount: 3,
    purchaseCost: 260000,
    restoreBaseCost: 42000,
    trafficMultiplier: 2.05,
    patienceBonus: 0.18,
    priceBonus: 1.25,
    story: 'A neglected snowy resort-route wash where clean cars are part of the trip.',
    visual: 'Snow berms, icy lots, patient travelers, and late-game restoration value',
  },
  {
    id: 'beltline',
    name: 'Beltline Express Tunnel',
    washModel: 'conveyor',
    theme: 'beltline',
    bayCount: 2,
    purchaseCost: 430000,
    restoreBaseCost: 70000,
    trafficMultiplier: 2.45,
    patienceBonus: 0.22,
    priceBonus: 2.25,
    story: 'An abandoned automatic tunnel on the city beltline, built for high-volume commuter washes.',
    visual: 'Conveyor track, tire puller, rotating brushes, foam curtain, and dryer arch',
  },
]

export function createInitialState(): GameState {
  return {
    version: 1,
    gameStarted: false,
    locationName: DEFAULT_LOCATION_NAME,
    cash: 20000,
    week: 1,
    clockSeconds: 0,
    speed: 0,
    resumeSpeed: 1,
    cars: [],
    nextCarIn: 1.2,
    nextCarId: 1,
    bays: createStarterBays(),
    upgrades: createStarterUpgrades(),
    employees: createStarterEmployees(),
    ads: createAdState(),
    cityMap: createStarterCityMap(),
    weekRevenue: 0,
    lifetimeRevenue: 0,
    weekCars: 0,
    totalCars: 0,
    weekDriveBys: 0,
    totalDriveBys: 0,
    weekLostRevenue: 0,
    lifetimeLostRevenue: 0,
    collectRequired: false,
    lastTickAt: Date.now(),
    pendingOfflineSummary: null,
    lastReview: null,
  }
}

export function advanceGame(input: GameState, realDeltaSeconds: number): GameState {
  let state = cloneState(input)
  state.ads = advanceAds(state.ads, realDeltaSeconds)
  state.lastTickAt = Date.now()

  if (!state.gameStarted || state.collectRequired || state.speed === 0) return state

  const deltaSeconds = Math.min(realDeltaSeconds, 0.1) * state.speed
  state.clockSeconds += deltaSeconds
  state = updateCars(state, deltaSeconds)
  state.nextCarIn -= deltaSeconds

  if (state.nextCarIn <= 0) {
    state = handleTrafficArrival(state)
    state.nextCarIn = spawnInterval(state)
  }

  if (state.clockSeconds >= WEEK_SECONDS) {
    const physicalDue = cashBoxValue(totalCashBox(state.bays))
    const autoCollector = hasAutoCollector(state.employees)
    const autoCollected = autoCollector ? physicalDue : 0
    const wageCost = employeeWeeklyWages(state.employees)
    const totalCosts = weeklyCosts(state)
    const costsPaid = autoCollector ? totalCosts : 0
    const costsDue = autoCollector ? 0 : totalCosts

    if (autoCollector) {
      state.cash = roundMoney(Math.max(0, state.cash + autoCollected - totalCosts))
      state.bays = emptyBayCashBoxes(state.bays)
    }
    if (state.employees.bayTech) {
      state.bays = state.bays.map((bay) => ({
        ...bay,
        condition: Math.min(1, bay.condition + 0.12),
      }))
    }

    state.lastReview = {
      week: state.week,
      revenue: roundMoney(state.weekRevenue),
      costs: totalCosts,
      costsPaid,
      costsDue,
      employeeWages: wageCost,
      profit: roundMoney(state.weekRevenue - totalCosts),
      cars: state.weekCars,
      driveBys: state.weekDriveBys,
      lostRevenue: roundMoney(state.weekLostRevenue),
      physicalDue: autoCollected > 0 ? 0 : physicalDue,
      autoCollected,
      rushTarget: weeklyRushTarget(state),
      autoClosed: autoCollector,
    }

    if (autoCollector) {
      // Staff settled the closeout — roll straight into the next week without pausing.
      state.week += 1
      state.clockSeconds = 0
      state.weekRevenue = 0
      state.weekCars = 0
      state.weekDriveBys = 0
      state.weekLostRevenue = 0
    } else {
      state.clockSeconds = WEEK_SECONDS
      state.collectRequired = true
      if (state.speed > 0) {
        state.resumeSpeed = state.speed
      }
      state.speed = 0
    }
  }

  return state
}

export function reconcileOffline(input: GameState, nowMs: number): GameState {
  const elapsedRaw = (nowMs - input.lastTickAt) / 1000

  if (elapsedRaw < OFFLINE_MIN_RECONCILE_SECONDS) {
    return { ...input, lastTickAt: nowMs }
  }

  // Title-screen / never-started saves: advance the clock only.
  // Do not grant cash or burn ad boost before the player opens a wash.
  if (!input.gameStarted) {
    return {
      ...input,
      lastTickAt: nowMs,
      pendingOfflineSummary: null,
    }
  }

  const elapsed = Math.max(0, elapsedRaw)
  const state = cloneState(input)

  const boostBefore = state.ads.boostSeconds
  const slotsBefore = state.ads.slotsAvailable

  const ratePerSec = (expectedHourlyRevenue(state) * OFFLINE_BASELINE_RATE_FRACTION) / 3600

  state.ads = advanceAds(state.ads, elapsed)

  const boostedT = Math.min(elapsed, boostBefore)
  const unboostedT = Math.max(0, elapsed - boostedT)
  const cashEarned = roundMoney(ratePerSec * (boostedT * AD_BOOST_MULTIPLIER + unboostedT))

  state.cash = roundMoney(state.cash + cashEarned)
  state.pendingOfflineSummary = {
    elapsedSeconds: elapsed,
    boostedSeconds: boostedT,
    unboostedSeconds: unboostedT,
    cashEarned,
    slotsRefilled: state.ads.slotsAvailable - slotsBefore,
  }
  state.lastTickAt = nowMs
  return state
}

export function setSpeed(input: GameState, speed: SpeedSetting): GameState {
  if ((!input.gameStarted || input.collectRequired) && speed !== 0) return input
  return {
    ...input,
    speed,
    resumeSpeed: speed > 0 ? speed : input.resumeSpeed,
  }
}

export function startGame(input: GameState, locationName: string): GameState {
  const state = cloneState(input)
  const speed = state.speed === 0 ? 1 : state.speed
  return {
    ...state,
    gameStarted: true,
    locationName: normalizeLocationName(locationName),
    speed,
    resumeSpeed: speed > 0 ? speed : state.resumeSpeed || 1,
  }
}

export function collectPayBox(input: GameState): GameState {
  const state = cloneState(input)
  const collected = cashBoxValue(totalCashBox(state.bays))
  const closeoutCostsDue = state.collectRequired ? state.lastReview?.costsDue ?? state.lastReview?.costs ?? 0 : 0

  state.cash = roundMoney(Math.max(0, state.cash + collected - closeoutCostsDue))
  state.bays = emptyBayCashBoxes(state.bays)

  if (state.collectRequired) {
    state.week += 1
    state.clockSeconds = 0
    // Resume the speed the player was using before week pause (default 1x).
    const resume = state.resumeSpeed > 0 ? state.resumeSpeed : 1
    state.speed = resume
    state.resumeSpeed = resume
    state.weekRevenue = 0
    state.weekCars = 0
    state.weekDriveBys = 0
    state.weekLostRevenue = 0
    state.collectRequired = false
    state.lastReview = null
  }

  return state
}

export function buyUpgrade(input: GameState, upgradeId: UpgradeId): GameState {
  const def = upgradeDefinitions.find((item) => item.id === upgradeId)
  if (!def || input.upgrades[upgradeId] || input.cash < def.cost) return input

  return {
    ...input,
    cash: roundMoney(input.cash - def.cost),
    upgrades: { ...input.upgrades, [upgradeId]: true },
  }
}

export function buyBayUpgrade(input: GameState, bayIndex: number, upgradeId: BayUpgradeId): GameState {
  if (bayIndex < 0 || bayIndex >= activeBayCount(input)) return input

  const state = cloneState(input)
  const bay = state.bays[bayIndex]
  const def = bayUpgradeDefinitions.find((item) => item.id === upgradeId)
  if (!bay || !def) return input

  const currentLevel = bay.upgrades[upgradeId]
  if (currentLevel >= def.maxLevel) return input

  const cost = bayUpgradeCost(upgradeId, currentLevel, bayIndex)
  if (state.cash < cost) return input

  bay.upgrades[upgradeId] = currentLevel + 1
  state.cash = roundMoney(state.cash - cost)
  return state
}

export function hireEmployee(input: GameState, employeeId: EmployeeId): GameState {
  const state = cloneState(input)
  const def = employeeDefinitions.find((employee) => employee.id === employeeId)
  if (!def || state.employees[employeeId] || state.cash < def.hireCost) return input

  state.cash = roundMoney(state.cash - def.hireCost)
  state.employees[employeeId] = true
  return state
}

export function buyCityDistrict(input: GameState, cityId: CityId): GameState {
  const state = cloneState(input)
  const def = cityDefinitions.find((city) => city.id === cityId)
  const district = state.cityMap.districts.find((item) => item.id === cityId)
  if (!def || !district || district.owned || state.cash < def.purchaseCost) return input

  district.owned = true
  district.restoration = 0
  state.cityMap.currentCityId = cityId
  state.cash = roundMoney(state.cash - def.purchaseCost)
  state.cars = []
  state.nextCarIn = 1
  return state
}

export function restoreCityDistrict(input: GameState, cityId: CityId): GameState {
  const state = cloneState(input)
  const district = state.cityMap.districts.find((item) => item.id === cityId)
  const cost = cityRestorationCost(state.cityMap, cityId)
  if (!district || !district.owned || district.restoration >= 5 || state.cash < cost) return input

  district.restoration += 1
  state.cash = roundMoney(state.cash - cost)
  return state
}

export function switchCityDistrict(input: GameState, cityId: CityId): GameState {
  const state = cloneState(input)
  const district = state.cityMap.districts.find((item) => item.id === cityId)
  if (!district?.owned) return input

  state.cityMap.currentCityId = cityId
  state.cars = []
  state.nextCarIn = 1
  return state
}

export function watchAdForBoost(input: GameState): GameState {
  if (input.ads.slotsAvailable <= 0) return input

  const state = cloneState(input)
  state.ads = {
    ...state.ads,
    slotsAvailable: state.ads.slotsAvailable - 1,
    boostSeconds: clampBoost(state.ads.boostSeconds + AD_BOOST_PER_WATCH_SECONDS),
    totalWatched: state.ads.totalWatched + 1,
  }
  return state
}

export function bayUpgradeCost(upgradeId: BayUpgradeId, level: number, bayIndex: number): number {
  const def = bayUpgradeDefinitions.find((item) => item.id === upgradeId)
  if (!def) return 0

  const bayPremium = 1 + bayIndex * 0.08
  return Math.round((def.baseCost * Math.pow(def.costMultiplier, level) * bayPremium) / 50) * 50
}

export function cityRestorationCost(cityMap: CityMapState, cityId: CityId): number {
  const def = cityDefinitions.find((city) => city.id === cityId)
  const district = cityMap.districts.find((item) => item.id === cityId)
  if (!def || !district || district.restoration >= 5) return 0

  return Math.round((def.restoreBaseCost * Math.pow(1.72, district.restoration)) / 50) * 50
}

export function currentCityDefinition(state: GameState): CityDefinition {
  return cityDefinitions.find((city) => city.id === state.cityMap.currentCityId) ?? cityDefinitions[0]
}

export function isConveyorCity(state: GameState): boolean {
  return currentCityDefinition(state).washModel === 'conveyor'
}

export function activeBayCount(state: GameState): number {
  const city = currentCityDefinition(state)
  const configured = city.bayCount || (city.washModel === 'conveyor' ? 2 : state.bays.length)
  return Math.max(1, Math.min(state.bays.length, configured))
}

export function activeBays(state: GameState): BayState[] {
  return state.bays.slice(0, activeBayCount(state))
}

export function currentCityDistrict(state: GameState): CityDistrictState {
  return (
    state.cityMap.districts.find((district) => district.id === state.cityMap.currentCityId) ??
    createStarterCityMap().districts[0]
  )
}

export function activeQueueCount(state: GameState): number {
  return state.cars.filter((car) => car.stage === 'queued').length
}

export function cityTrafficMultiplier(state: GameState): number {
  const district = currentCityDistrict(state)
  const def = currentCityDefinition(state)
  return roundStat(def.trafficMultiplier * (0.86 + district.restoration * 0.045))
}

export function queueAppealChance(state: GameState): number {
  const bays = activeBays(state)
  const demand = demandMultiplier(state.upgrades, averageCondition(bays), bays, state.ads, state.employees)
  const district = currentCityDistrict(state)
  const def = currentCityDefinition(state)
  const attraction =
    0.08 +
    Math.max(0, demand - 1) * 0.34 +
    district.restoration * 0.045 +
    def.patienceBonus +
    (state.upgrades.signage ? 0.07 : 0) +
    (state.upgrades.loyaltyApp ? 0.1 : 0)
  return roundStat(Math.min(0.82, Math.max(0.04, attraction)))
}

export function cashBoxValue(cashBox: CashBox): number {
  return roundMoney(cashBox.bills + cashBox.coins + cashBox.tokens)
}

export function totalCashBox(bays: BayState[]): CashBox {
  return bays.reduce(
    (total, bay) => ({
      bills: roundMoney(total.bills + bay.cashBox.bills),
      coins: roundMoney(total.coins + bay.cashBox.coins),
      tokens: roundMoney(total.tokens + bay.cashBox.tokens),
    }),
    { bills: 0, coins: 0, tokens: 0 },
  )
}

export function averageCondition(bays: BayState[]): number {
  if (bays.length === 0) return 1
  return bays.reduce((sum, bay) => sum + bay.condition, 0) / bays.length
}

export function demandMultiplier(
  upgrades: UpgradeState,
  condition: number,
  bays: BayState[] = [],
  ads?: AdState,
  employees?: EmployeeState,
): number {
  const upgradeDemand =
    (upgrades.paint ? 0.1 : 0) +
    (upgrades.signage ? 0.1 : 0) +
    (upgrades.vacuumIsland ? 0.12 : 0) +
    (upgrades.securityLights ? 0.08 : 0) +
    (upgrades.loyaltyApp ? 0.18 : 0) +
    (upgrades.manager ? 0.1 : 0) +
    (upgrades.mobileCampaign ? 0.22 : 0) +
    (upgrades.laserWash ? 0.25 : 0)
  const staffDemand = employees?.nightManager ? 0.06 : 0
  const bayDemand = bays.length > 0 ? bays.reduce((sum, bay) => sum + bayDemandBonus(bay), 0) / bays.length : 0
  const conditionDemand = 0.72 + Math.max(0, condition) * 0.28
  const adDemand = ads && ads.boostSeconds > 0 ? 0.35 : 0
  return roundStat((1 + upgradeDemand + bayDemand + staffDemand + adDemand) * conditionDemand)
}

export function cashMultiplier(state: GameState): number {
  return state.ads.boostSeconds > 0 ? AD_BOOST_MULTIPLIER : 1
}

export function expectedHourlyRevenue(state: GameState): number {
  const activeBays = activeBayIndexes(state)
    .map((bayIndex) => state.bays[bayIndex])
    .filter((bay): bay is BayState => Boolean(bay))

  if (activeBays.length === 0) return 0

  const spawnPerSec = 1 / spawnInterval(state)
  const priceBonus = marketPriceBonus(state)
  const automatic = isConveyorCity(state)

  const avgPrice =
    activeBays.reduce((sum, bay) => sum + bayWashPrice(state.upgrades, bay, priceBonus), 0) /
    activeBays.length

  const avgWashSeconds =
    activeBays.reduce((sum, bay) => {
      const price = bayWashPrice(state.upgrades, bay, priceBonus)
      const payment: Payment = automatic
        ? { kind: 'card', quarters: 0, bills: price, tokens: 0 }
        : { kind: 'quarters', quarters: Math.round(price * 4), bills: 0, tokens: 0 }
      return sum + washDurationForPayment(payment, state.upgrades, bay, priceBonus, automatic)
    }, 0) / activeBays.length
  const washPerSec = activeBays.length / avgWashSeconds

  // Throughput is bottlenecked by the slower of arrivals and bay capacity.
  const effectivePerSec = Math.min(spawnPerSec, washPerSec)

  return effectivePerSec * avgPrice * 3600 * CUSTOMERS_PER_VISIBLE_CAR
}

export function weeklyRushTarget(state: GameState): number {
  const bays = activeBays(state)
  if (bays.length === 0) return 40

  const automatic = isConveyorCity(state)
  const priceBonus = marketPriceBonus(state)
  const avgWashSeconds =
    bays.reduce((sum, bay) => {
      const price = bayWashPrice(state.upgrades, bay, priceBonus)
      const payment: Payment = automatic
        ? { kind: 'card', quarters: 0, bills: price, tokens: 0 }
        : { kind: 'quarters', quarters: Math.round(price * 4), bills: 0, tokens: 0 }
      return sum + washDurationForPayment(payment, state.upgrades, bay, priceBonus, automatic)
    }, 0) / bays.length

  // A bay is also blocked while a car pulls in and while it clears the stall.
  const cycleSeconds = avgWashSeconds + ENTERING_SECONDS + 2.6
  const arrivalsPerSec = 1 / spawnInterval(state)
  const capacityPerSec = bays.length / cycleSeconds
  const weeklyCustomers = Math.min(arrivalsPerSec, capacityPerSec) * WEEK_SECONDS * CUSTOMERS_PER_VISIBLE_CAR

  // Stretch-but-achievable: ~75% of theoretical throughput, in steps of 5.
  return Math.max(40, Math.round((weeklyCustomers * 0.75) / 5) * 5)
}

export function progressionProgress(state: GameState): number {
  const lotOwned = upgradeDefinitions.filter((upgrade) => state.upgrades[upgrade.id]).length
  const lotTotal = upgradeDefinitions.length
  const staffOwned = employeeDefinitions.filter((employee) => state.employees[employee.id]).length
  const staffTotal = employeeDefinitions.length
  const bays = activeBays(state)
  const bayOwned = bays.reduce(
    (sum, bay) =>
      sum + bayUpgradeDefinitions.reduce((baySum, upgrade) => baySum + bay.upgrades[upgrade.id], 0),
    0,
  )
  const bayTotal = bays.length * bayUpgradeDefinitions.reduce((sum, upgrade) => sum + upgrade.maxLevel, 0)
  const cityOwned = state.cityMap.districts.reduce(
    (sum, district) => sum + (district.owned ? 1 : 0) + district.restoration,
    0,
  )
  const cityTotal = cityDefinitions.length + cityDefinitions.length * 5

  return Math.min(1, (lotOwned + staffOwned + bayOwned + cityOwned) / (lotTotal + staffTotal + bayTotal + cityTotal))
}

export function currentDayName(state: GameState): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days[Math.min(6, Math.floor(state.clockSeconds / DAY_SECONDS))]
}

export function dayProgress(state: GameState): number {
  const dayClock = state.clockSeconds % DAY_SECONDS
  return Math.min(1, dayClock / DAY_SECONDS)
}

export function exportGameState(state: GameState): string {
  return JSON.stringify({ savedAt: new Date().toISOString(), state }, null, 2)
}

export function hydrateGameState(value: unknown): GameState | null {
  if (!isRecord(value)) return null
  const wrapped = 'state' in value && isRecord(value.state) ? value.state : value
  if (wrapped.version !== 1) return null

  const defaults = createInitialState()
  const candidate = wrapped as Partial<GameState> & {
    bay?: BayState
    cashBox?: CashBox
    collection?: unknown
  }
  const migratedUpgrades = normalizeUpgrades(candidate.upgrades as Partial<UpgradeState> | undefined)
  const migratedBays = Array.isArray(candidate.bays)
    ? candidate.bays
    : createStarterBays(candidate.bay, candidate.cashBox)

  return {
    ...defaults,
    ...candidate,
    gameStarted: candidate.gameStarted ?? hasExistingProgress(candidate),
    locationName: normalizeLocationName(candidate.locationName),
    upgrades: migratedUpgrades,
    employees: normalizeEmployees(candidate.employees),
    ads: normalizeAds(candidate.ads),
    cityMap: normalizeCityMap(candidate.cityMap),
    bays: migratedBays.map((bay, index) => normalizeBay(bay, index, candidate.upgrades)),
    cars: Array.isArray(candidate.cars)
      ? candidate.cars
          .map((car) => normalizeCar(car as Partial<Car>))
          .filter((car): car is Car => car !== null)
      : [],
    lifetimeRevenue: candidate.lifetimeRevenue ?? candidate.weekRevenue ?? 0,
    totalDriveBys: candidate.totalDriveBys ?? candidate.weekDriveBys ?? 0,
    weekLostRevenue: candidate.weekLostRevenue ?? 0,
    lifetimeLostRevenue: candidate.lifetimeLostRevenue ?? candidate.weekLostRevenue ?? 0,
    lastTickAt: typeof candidate.lastTickAt === 'number' ? candidate.lastTickAt : Date.now(),
    pendingOfflineSummary: candidate.pendingOfflineSummary ?? null,
    lastReview: candidate.lastReview ?? null,
    resumeSpeed: normalizeResumeSpeed(candidate.resumeSpeed, candidate.speed),
  }
}

function normalizeResumeSpeed(
  resumeSpeed: unknown,
  currentSpeed: unknown,
): SpeedSetting {
  const fromResume = typeof resumeSpeed === 'number' ? resumeSpeed : null
  const fromCurrent = typeof currentSpeed === 'number' && currentSpeed > 0 ? currentSpeed : null
  const value = fromResume && fromResume > 0 ? fromResume : fromCurrent ?? 1
  if (value === 3 || value === 10) return value
  return 1
}

function updateCars(input: GameState, deltaSeconds: number): GameState {
  const state = cloneState(input)
  const cars: Car[] = []

  for (const car of state.cars) {
    const next = { ...car }
    const bay = state.bays[next.bayIndex]

    if (next.stage === 'passing') {
      next.progress = Math.min(1, next.progress + deltaSeconds / PASSING_SECONDS)
    } else if (!bay) {
      continue
    } else if (next.stage === 'approaching') {
      next.progress = Math.min(1, next.progress + deltaSeconds / APPROACH_SECONDS)

      if (next.progress >= 1) {
        if (isBayOpenForQueue(state, next.bayIndex, next.id)) {
          next.stage = 'entering'
          next.progress = 0
          next.waitSeconds = 0
          next.washSeconds = washDurationForPayment(
            next.payment,
            state.upgrades,
            bay,
            marketPriceBonus(state),
            isConveyorCity(state),
          )
        } else {
          next.stage = 'queued'
          next.progress = 0
          next.waitSeconds = queuePatienceSeconds(state)
        }
      }
    } else if (next.stage === 'queued') {
      next.waitSeconds = Math.max(0, next.waitSeconds - deltaSeconds)
      next.progress = Math.min(1, next.progress + deltaSeconds / queuePatienceSeconds(state))

      if (isBayOpenForQueue(state, next.bayIndex, next.id)) {
        next.stage = 'entering'
        next.progress = 0
        next.waitSeconds = 0
        next.washSeconds = washDurationForPayment(
          next.payment,
          state.upgrades,
          bay,
          marketPriceBonus(state),
          isConveyorCity(state),
        )
      } else if (next.waitSeconds <= 0) {
        recordLostCustomer(state, expectedPaymentValue(state, bay))
        next.stage = 'passing'
        next.progress = 0.58
      }
    } else if (next.stage === 'entering') {
      next.progress = Math.min(1, next.progress + deltaSeconds / ENTERING_SECONDS)
      if (next.progress >= 1) {
        next.stage = 'washing'
        next.progress = 0
        next.washSeconds = washDurationForPayment(
          next.payment,
          state.upgrades,
          bay,
          marketPriceBonus(state),
          isConveyorCity(state),
        )
      }
    } else if (next.stage === 'washing') {
      next.progress = Math.min(1, next.progress + deltaSeconds / next.washSeconds)
      if (next.progress >= 1) {
        settlePayment(state, next)
        state.weekCars += CUSTOMERS_PER_VISIBLE_CAR
        state.totalCars += CUSTOMERS_PER_VISIBLE_CAR
        next.stage = 'leaving'
        next.progress = 0
      }
    } else if (next.stage === 'leaving') {
      next.progress = Math.min(1, next.progress + deltaSeconds / 4.2)
    }

    if (
      !(next.stage === 'leaving' && next.progress >= 1) &&
      !(next.stage === 'passing' && next.progress >= 1)
    ) {
      cars.push(next)
    }
  }

  state.cars = cars
  return state
}

function handleTrafficArrival(input: GameState): GameState {
  const state = cloneState(input)
  const openBay = findOpenBayIndex(state)

  if (openBay !== -1) {
    state.cars.push(createCar(state, openBay))
    state.nextCarId += 1
    return state
  }

  const queueBay = findQueueBayIndex(state)
  if (queueBay !== -1 && Math.random() < queueAppealChance(state)) {
    state.cars.push(createCar(state, queueBay))
    state.nextCarId += 1
    return state
  }

  state.cars.push(createPassingCar(state))
  state.nextCarId += 1
  recordLostCustomer(state, expectedPaymentValue(state))
  return state
}

function createCar(state: GameState, bayIndex: number): Car {
  const variant = state.nextCarId % CAR_COLORS.length
  const bay = state.bays[bayIndex]
  const priceBonus = marketPriceBonus(state)
  const payment = createPayment(state.upgrades, bay, priceBonus, isConveyorCity(state))
  return {
    id: `car-${state.nextCarId}`,
    stage: 'approaching',
    progress: 0,
    variant,
    color: CAR_COLORS[variant],
    bayIndex,
    originCityId: state.cityMap.currentCityId,
    waitSeconds: 0,
    payment,
    washSeconds: washDurationForPayment(payment, state.upgrades, bay, priceBonus, isConveyorCity(state)),
  }
}

function createPassingCar(state: GameState): Car {
  const variant = state.nextCarId % CAR_COLORS.length
  const fallbackBay = state.nextCarId % activeBayCount(state)
  return {
    id: `car-${state.nextCarId}`,
    stage: 'passing',
    progress: 0,
    variant,
    color: CAR_COLORS[variant],
    bayIndex: fallbackBay,
    originCityId: state.cityMap.currentCityId,
    waitSeconds: 0,
    payment: { kind: 'quarters', quarters: Math.round(expectedPaymentValue(state) * 4), bills: 0, tokens: 0 },
    washSeconds: BASE_WASH_SECONDS,
  }
}

function createPayment(upgrades: UpgradeState, bay: BayState, priceBonus = 0, automatic = false): Payment {
  const price = bayWashPrice(upgrades, bay, priceBonus)
  const roll = Math.random()
  const cardChance = automatic ? 0.54 : upgrades.cardReader ? 0.34 + bay.upgrades.vault * 0.015 : 0

  if (roll < cardChance) return { kind: 'card', quarters: 0, bills: price, tokens: 0 }
  if ((upgrades.laserWash || automatic) && roll > 0.92) return { kind: 'laser', quarters: 0, bills: 0, tokens: price + 1 }

  const tokenChance = 0.16 + bay.upgrades.vault * 0.025
  if (roll < cardChance + tokenChance) return { kind: 'tokens', quarters: 0, bills: 0, tokens: price }

  if (roll < cardChance + tokenChance + 0.32) {
    const bills = Math.max(1, Math.floor(price / 2))
    return { kind: 'mixed', quarters: Math.round((price - bills) * 4), bills, tokens: 0 }
  }

  return { kind: 'quarters', quarters: Math.round(price * 4), bills: 0, tokens: 0 }
}

function settlePayment(state: GameState, car: Car): void {
  const baseGross = paymentValue(car.payment) * CUSTOMERS_PER_VISIBLE_CAR
  const bay = state.bays[car.bayIndex]
  if (!bay) return

  const mult = cashMultiplier(state)
  const gross = baseGross * mult
  const boostBonus = gross - baseGross

  if (car.payment.kind === 'card') {
    const net = gross * (1 - CARD_FEE_RATE)
    state.cash = roundMoney(state.cash + net)
    state.weekRevenue = roundMoney(state.weekRevenue + gross)
    state.lifetimeRevenue = roundMoney(state.lifetimeRevenue + gross)
    if (boostBonus > 0) {
      state.ads = {
        ...state.ads,
        totalRewardedCash: roundMoney(state.ads.totalRewardedCash + boostBonus),
      }
    }
    finishWash(state, bay)
    return
  }

  const cashFeeRate = cashLeakRate(state, bay)
  bay.cashBox.bills = roundMoney(
    bay.cashBox.bills + car.payment.bills * CUSTOMERS_PER_VISIBLE_CAR * mult * (1 - cashFeeRate),
  )
  bay.cashBox.coins = roundMoney(
    bay.cashBox.coins + car.payment.quarters * 0.25 * CUSTOMERS_PER_VISIBLE_CAR * mult * (1 - cashFeeRate),
  )
  bay.cashBox.tokens = roundMoney(
    bay.cashBox.tokens + car.payment.tokens * CUSTOMERS_PER_VISIBLE_CAR * mult,
  )
  state.weekRevenue = roundMoney(state.weekRevenue + gross)
  state.lifetimeRevenue = roundMoney(state.lifetimeRevenue + gross)
  if (boostBonus > 0) {
    state.ads = {
      ...state.ads,
      totalRewardedCash: roundMoney(state.ads.totalRewardedCash + boostBonus),
    }
  }
  finishWash(state, bay)
}

function finishWash(state: GameState, bay: BayState): void {
  bay.washesCompleted += 1
  bay.condition = Math.max(0.18, bay.condition - conditionDecay(state.upgrades, bay))
}

function washDurationForPayment(
  payment: Payment,
  upgrades: UpgradeState,
  bay: BayState,
  priceBonus = 0,
  automatic = false,
): number {
  if (payment.kind === 'laser') return 5.8
  if (automatic) return Math.max(4.2, 7.4 - bay.upgrades.dryer * 0.32 - bay.upgrades.rinse * 0.18)

  const price = bayWashPrice(upgrades, bay, priceBonus)
  const equivalentQuarters = payment.quarters + payment.tokens * 4 + payment.bills * 4
  const timeShare = Math.min(1.8, Math.max(0.45, equivalentQuarters / (price * 4)))
  const baySpeed =
    1 -
    bay.upgrades.wand * 0.055 -
    bay.upgrades.dryer * 0.035 -
    bay.upgrades.selector * 0.018 -
    (upgrades.manager ? 0.06 : 0)
  return Math.max(3.1, BASE_WASH_SECONDS * timeShare * Math.max(0.56, baySpeed))
}

function paymentValue(payment: Payment): number {
  return roundMoney(payment.bills + payment.tokens + payment.quarters * 0.25)
}

function bayWashPrice(upgrades: UpgradeState, bay: BayState, priceBonus = 0): number {
  const premium =
    bay.upgrades.soap * 0.5 +
    bay.upgrades.rinse * 0.25 +
    bay.upgrades.dryer * 0.1 +
    (upgrades.loyaltyApp ? 0.25 : 0) +
    priceBonus
  return roundMoney(BASE_PRICE + premium)
}

function bayDemandBonus(bay: BayState): number {
  return (
    bay.upgrades.selector * 0.025 +
    bay.upgrades.soap * 0.018 +
    bay.upgrades.rinse * 0.02 +
    bay.upgrades.dryer * 0.012 +
    bay.upgrades.vault * 0.006
  )
}

function cashLeakRate(state: GameState, bay: BayState): number {
  const cameraReduction = state.upgrades.coinCameras ? 0.018 : 0
  const vaultReduction = bay.upgrades.vault * 0.0025
  const managerReduction = state.employees.nightManager ? 0.01 : 0
  return Math.max(0.006, 0.03 - cameraReduction - vaultReduction - managerReduction)
}

function findOpenBayIndex(state: GameState): number {
  return activeBayIndexes(state).find((bayIndex) => isBayOpenForNewArrival(state, bayIndex)) ?? -1
}

function findQueueBayIndex(state: GameState): number {
  return (
    activeBayIndexes(state).find(
      (bayIndex) =>
      !state.cars.some(
        (car) => (car.stage === 'approaching' || car.stage === 'queued') && car.bayIndex === bayIndex,
      ),
    ) ?? -1
  )
}

function activeBayIndexes(state: GameState): number[] {
  const max = activeBayCount(state)
  return state.bays.slice(0, max).map((_, index) => index)
}

function isBayOpenForNewArrival(state: GameState, bayIndex: number): boolean {
  return !state.cars.some(
    (car) =>
      car.bayIndex === bayIndex &&
      (car.stage === 'approaching' ||
        car.stage === 'entering' ||
        car.stage === 'queued' ||
        car.stage === 'washing' ||
        (car.stage === 'leaving' && car.progress < 0.62)),
  )
}

function isBayOpenForQueue(state: GameState, bayIndex: number, carId: string): boolean {
  return !state.cars.some(
    (car) =>
      car.id !== carId &&
      car.bayIndex === bayIndex &&
      (car.stage === 'approaching' ||
        car.stage === 'entering' ||
        car.stage === 'washing' ||
        (car.stage === 'leaving' && car.progress < 0.62)),
  )
}

function spawnInterval(state: GameState): number {
  const bays = activeBays(state)
  return (
    BASE_SPAWN_SECONDS /
    (demandMultiplier(state.upgrades, averageCondition(bays), bays, state.ads, state.employees) *
      cityTrafficMultiplier(state))
  )
}

function queuePatienceSeconds(state: GameState): number {
  const district = currentCityDistrict(state)
  const def = currentCityDefinition(state)
  return BASE_QUEUE_SECONDS + district.restoration * 1.15 + def.patienceBonus * 16
}

function marketPriceBonus(state: GameState): number {
  const district = currentCityDistrict(state)
  const def = currentCityDefinition(state)
  const automaticPremium = def.washModel === 'conveyor' ? 3.5 : 0
  return roundMoney(def.priceBonus + automaticPremium + district.restoration * 0.12)
}

function expectedPaymentValue(state: GameState, bay = state.bays[0]): number {
  return roundMoney(bayWashPrice(state.upgrades, bay, marketPriceBonus(state)) * CUSTOMERS_PER_VISIBLE_CAR)
}

function recordLostCustomer(state: GameState, expectedRevenue: number): void {
  state.weekDriveBys += CUSTOMERS_PER_VISIBLE_CAR
  state.totalDriveBys += CUSTOMERS_PER_VISIBLE_CAR
  state.weekLostRevenue = roundMoney(state.weekLostRevenue + expectedRevenue)
  state.lifetimeLostRevenue = roundMoney(state.lifetimeLostRevenue + expectedRevenue)
}

function conditionDecay(upgrades: UpgradeState, bay: BayState): number {
  const soapMultiplier = 1 - bay.upgrades.soap * 0.045
  const rinseMultiplier = 1 - bay.upgrades.rinse * 0.03
  const wandMultiplier = 1 - bay.upgrades.wand * 0.025
  const lightsMultiplier = upgrades.securityLights ? 0.9 : 1
  return 0.0022 * Math.max(0.55, soapMultiplier * rinseMultiplier * wandMultiplier) * lightsMultiplier
}

function weeklyCosts(state: GameState): number {
  const managerCost = state.upgrades.manager ? 420 : 0
  const laserCost = state.upgrades.laserWash ? 260 : 0
  const conveyorCost = isConveyorCity(state) ? 620 : 0
  // Soft ramp so week 1-3 teach the loop without crushing profit.
  const overhead = Math.round(WEEKLY_FIXED_COSTS * earlyWeekOverheadScale(state.week))
  return overhead + managerCost + laserCost + conveyorCost + employeeWeeklyWages(state.employees)
}

/** Week 1 = 40%, 2 = 60%, 3 = 80%, 4 = 90%, then full lot overhead. */
function earlyWeekOverheadScale(week: number): number {
  if (week <= 1) return 0.4
  if (week === 2) return 0.6
  if (week === 3) return 0.8
  if (week === 4) return 0.9
  return 1
}

function employeeWeeklyWages(employees: EmployeeState): number {
  return employeeDefinitions.reduce(
    (total, employee) => total + (employees[employee.id] ? employee.weeklyWage : 0),
    0,
  )
}

function hasAutoCollector(employees: EmployeeState): boolean {
  return employees.cashRunner || employees.bayTech || employees.nightManager
}

export function advanceAds(ads: AdState, realDeltaSeconds: number): AdState {
  let { slotsAvailable, nextSlotInSeconds, boostSeconds } = ads
  boostSeconds = Math.max(0, boostSeconds - realDeltaSeconds)

  if (slotsAvailable < AD_SLOTS_MAX) {
    nextSlotInSeconds -= realDeltaSeconds
    while (nextSlotInSeconds <= 0 && slotsAvailable < AD_SLOTS_MAX) {
      slotsAvailable += 1
      nextSlotInSeconds += AD_SLOT_REFILL_SECONDS
    }
    if (slotsAvailable === AD_SLOTS_MAX) {
      nextSlotInSeconds = AD_SLOT_REFILL_SECONDS
    }
  }

  return {
    ...ads,
    slotsAvailable,
    nextSlotInSeconds,
    boostSeconds,
  }
}

function createStarterBays(template?: Partial<BayState>, cashBox?: CashBox): BayState[] {
  return Array.from({ length: BAY_COUNT }, (_, index) =>
    normalizeBay(
      {
        id: index + 1,
        condition: template?.condition ?? 1,
        washesCompleted: template?.washesCompleted ?? 0,
        cashBox:
          index === 0
            ? cashBox ?? template?.cashBox ?? { bills: 0, coins: 0, tokens: 0 }
            : { bills: 0, coins: 0, tokens: 0 },
        upgrades: template?.upgrades,
      },
      index,
    ),
  )
}

function createStarterUpgrades(): UpgradeState {
  return {
    paint: false,
    signage: false,
    coinCameras: false,
    vacuumIsland: false,
    securityLights: false,
    cardReader: false,
    loyaltyApp: false,
    manager: false,
    mobileCampaign: false,
    laserWash: false,
  }
}

function createStarterEmployees(): EmployeeState {
  return {
    cashRunner: false,
    bayTech: false,
    nightManager: false,
  }
}

function createStarterBayUpgrades(seed?: Partial<BayUpgradeLevels>): BayUpgradeLevels {
  return {
    selector: seed?.selector ?? 0,
    wand: seed?.wand ?? 0,
    soap: seed?.soap ?? 0,
    rinse: seed?.rinse ?? 0,
    dryer: seed?.dryer ?? 0,
    vault: seed?.vault ?? 0,
  }
}

function createAdState(seed?: Partial<AdState>): AdState {
  return {
    slotsAvailable: clampSlots(seed?.slotsAvailable ?? AD_SLOTS_MAX),
    nextSlotInSeconds: clampNextSlot(seed?.nextSlotInSeconds ?? AD_SLOT_REFILL_SECONDS),
    boostSeconds: clampBoost(seed?.boostSeconds ?? 0),
    totalWatched: seed?.totalWatched ?? 0,
    totalRewardedCash: seed?.totalRewardedCash ?? 0,
  }
}

function clampSlots(value: number): number {
  return Math.min(AD_SLOTS_MAX, Math.max(0, Math.floor(value)))
}

function clampNextSlot(value: number): number {
  return Math.min(AD_SLOT_REFILL_SECONDS, Math.max(0, value))
}

function clampBoost(value: number): number {
  return Math.min(AD_BOOST_MAX_STACK_SECONDS, Math.max(0, value))
}

function createStarterCityMap(seed?: Partial<CityMapState>): CityMapState {
  const seededDistricts = Array.isArray(seed?.districts) ? seed.districts : []
  const districts = cityDefinitions.map((city) => {
    const seeded = seededDistricts.find((district) => district.id === city.id)
    return normalizeCityDistrict(seeded, city.id)
  })
  const current = seed?.currentCityId && districts.some((district) => district.id === seed.currentCityId && district.owned)
    ? seed.currentCityId
    : 'rustwater'

  return {
    currentCityId: current,
    districts,
  }
}

function normalizeUpgrades(upgrades: Partial<UpgradeState> | undefined): UpgradeState {
  const legacy = upgrades as Partial<UpgradeState> & {
    betterDials?: boolean
    highPressureWands?: boolean
    soap?: boolean
    bayLighting?: boolean
  }

  return {
    ...createStarterUpgrades(),
    paint: Boolean(upgrades?.paint),
    signage: Boolean(upgrades?.signage),
    coinCameras: Boolean(upgrades?.coinCameras),
    vacuumIsland: Boolean(upgrades?.vacuumIsland),
    securityLights: Boolean(upgrades?.securityLights || legacy?.bayLighting),
    cardReader: Boolean(upgrades?.cardReader),
    loyaltyApp: Boolean(upgrades?.loyaltyApp),
    manager: Boolean(upgrades?.manager),
    mobileCampaign: Boolean(upgrades?.mobileCampaign),
    laserWash: Boolean(upgrades?.laserWash),
  }
}

function normalizeBay(
  bay: Partial<BayState> | undefined,
  index: number,
  legacyUpgrades?: Partial<UpgradeState>,
): BayState {
  return {
    id: bay?.id ?? index + 1,
    condition: clamp01(bay?.condition ?? 1),
    washesCompleted: bay?.washesCompleted ?? 0,
    cashBox: {
      bills: bay?.cashBox?.bills ?? 0,
      coins: bay?.cashBox?.coins ?? 0,
      tokens: bay?.cashBox?.tokens ?? 0,
    },
    upgrades: normalizeBayUpgrades(bay?.upgrades, legacyUpgrades),
  }
}

function normalizeBayUpgrades(
  bayUpgrades: Partial<BayUpgradeLevels> | undefined,
  legacyUpgrades?: Partial<UpgradeState>,
): BayUpgradeLevels {
  const legacy = legacyUpgrades as Partial<UpgradeState> & {
    betterDials?: boolean
    highPressureWands?: boolean
    soap?: boolean
    bayLighting?: boolean
  }

  return createStarterBayUpgrades({
    selector: clampLevel(bayUpgrades?.selector ?? (legacy?.betterDials ? 1 : 0), 'selector'),
    wand: clampLevel(bayUpgrades?.wand ?? (legacy?.highPressureWands ? 1 : 0), 'wand'),
    soap: clampLevel(bayUpgrades?.soap ?? (legacy?.soap ? 1 : 0), 'soap'),
    rinse: clampLevel(bayUpgrades?.rinse ?? 0, 'rinse'),
    dryer: clampLevel(bayUpgrades?.dryer ?? 0, 'dryer'),
    vault: clampLevel(bayUpgrades?.vault ?? 0, 'vault'),
  })
}

function normalizeAds(ads: Partial<AdState> | undefined): AdState {
  return createAdState(ads)
}

function normalizeCityMap(cityMap: Partial<CityMapState> | undefined): CityMapState {
  return createStarterCityMap(cityMap)
}

function normalizeCityDistrict(
  district: Partial<CityDistrictState> | undefined,
  fallbackId: CityId,
): CityDistrictState {
  const isStarter = fallbackId === 'rustwater'
  return {
    id: fallbackId,
    owned: district?.owned ?? isStarter,
    restoration: Math.min(5, Math.max(0, Math.floor(district?.restoration ?? (isStarter ? 2 : 0)))),
  }
}

function normalizeEmployees(employees: Partial<EmployeeState> | undefined): EmployeeState {
  return {
    ...createStarterEmployees(),
    cashRunner: Boolean(employees?.cashRunner),
    bayTech: Boolean(employees?.bayTech),
    nightManager: Boolean(employees?.nightManager),
  }
}

function normalizeCar(car: Partial<Car>): Car | null {
  if (!car.id || car.bayIndex === undefined || car.bayIndex < 0 || car.bayIndex >= BAY_COUNT) return null
  const stage =
    car.stage === 'approaching' ||
    car.stage === 'leaving' ||
    car.stage === 'washing' ||
    car.stage === 'queued' ||
    car.stage === 'passing'
      ? car.stage
      : 'entering'
  return {
    id: car.id,
    stage,
    progress: Math.min(1, Math.max(0, car.progress ?? 0)),
    variant: car.variant ?? 0,
    color: car.color ?? CAR_COLORS[0],
    bayIndex: car.bayIndex,
    originCityId: car.originCityId ?? 'rustwater',
    waitSeconds: car.waitSeconds ?? (stage === 'queued' ? BASE_QUEUE_SECONDS : 0),
    payment: car.payment ?? { kind: 'quarters', quarters: BASE_PRICE * 4, bills: 0, tokens: 0 },
    washSeconds: car.washSeconds ?? BASE_WASH_SECONDS,
  }
}

function cloneState(state: GameState): GameState {
  return {
    ...state,
    bays: state.bays.map((bay, index) => normalizeBay(bay, index)),
    upgrades: normalizeUpgrades(state.upgrades),
    employees: normalizeEmployees(state.employees),
    ads: normalizeAds(state.ads),
    cityMap: normalizeCityMap(state.cityMap),
    cars: state.cars.map((car) => ({ ...car, payment: { ...car.payment } })),
    lastReview: state.lastReview ? { ...state.lastReview } : null,
  }
}

function clampLevel(value: number, upgradeId: BayUpgradeId): number {
  const maxLevel = bayUpgradeDefinitions.find((upgrade) => upgrade.id === upgradeId)?.maxLevel ?? 0
  return Math.min(maxLevel, Math.max(0, Math.floor(value)))
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value))
}

function emptyBayCashBoxes(bays: BayState[]): BayState[] {
  return bays.map((bay) => ({
    ...bay,
    cashBox: { bills: 0, coins: 0, tokens: 0 },
  }))
}

function normalizeLocationName(locationName: string | undefined): string {
  const trimmed = locationName?.trim() ?? ''
  return trimmed.length > 0 ? trimmed.slice(0, 32) : DEFAULT_LOCATION_NAME
}

function hasExistingProgress(state: Partial<GameState>): boolean {
  return Boolean(
    (state.week ?? 1) > 1 ||
      (state.clockSeconds ?? 0) > 0 ||
      (state.totalCars ?? 0) > 0 ||
      (state.cash ?? 20000) !== 20000 ||
      state.collectRequired,
  )
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

function roundStat(value: number): number {
  return Math.round(value * 1000) / 1000
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
