export type SpeedSetting = 0 | 1 | 3 | 10

export type GraphicsQuality = 'low' | 'balanced' | 'high'

export type CarStage = 'approaching' | 'entering' | 'queued' | 'washing' | 'leaving' | 'passing'

export type PaymentKind = 'quarters' | 'tokens' | 'mixed' | 'card' | 'laser'

export type UpgradeId =
  | 'paint'
  | 'signage'
  | 'coinCameras'
  | 'vacuumIsland'
  | 'securityLights'
  | 'cardReader'
  | 'loyaltyApp'
  | 'manager'
  | 'mobileCampaign'
  | 'laserWash'

export type BayUpgradeId = 'selector' | 'wand' | 'soap' | 'rinse' | 'dryer' | 'vault'

export type EmployeeId = 'cashRunner' | 'bayTech' | 'nightManager'

export type CityId = 'rustwater' | 'harbor' | 'downtown' | 'skyway' | 'beltline'

export type WashModel = 'selfServe' | 'conveyor'

export type CityTheme = 'smallTown' | 'harbor' | 'downtown' | 'snow' | 'beltline'

export interface Payment {
  kind: PaymentKind
  quarters: number
  bills: number
  tokens: number
}

export interface Car {
  id: string
  stage: CarStage
  progress: number
  variant: number
  color: string
  bayIndex: number
  originCityId: CityId
  waitSeconds: number
  payment: Payment
  washSeconds: number
}

export interface CashBox {
  bills: number
  coins: number
  tokens: number
}

export interface BayUpgradeLevels {
  selector: number
  wand: number
  soap: number
  rinse: number
  dryer: number
  vault: number
}

export interface BayState {
  id: number
  condition: number
  washesCompleted: number
  cashBox: CashBox
  upgrades: BayUpgradeLevels
}

export interface UpgradeState {
  paint: boolean
  signage: boolean
  coinCameras: boolean
  vacuumIsland: boolean
  securityLights: boolean
  cardReader: boolean
  loyaltyApp: boolean
  manager: boolean
  mobileCampaign: boolean
  laserWash: boolean
}

export type CampaignId = 'flyer' | 'driver' | 'weekend'

export interface AdState {
  slotsAvailable: number
  nextSlotInSeconds: number
  /** Driver campaign: 3x cash while active. */
  boostSeconds: number
  /** Flyer run: demand bump while active. */
  flyerSeconds: number
  /** Wash weekend: demand + queue patience while active. */
  weekendSeconds: number
  totalWatched: number
  totalRewardedCash: number
}

export interface CampaignDefinition {
  id: CampaignId
  name: string
  cost: number
  slotCost: number
  durationSeconds: number
  effect: string
  flavor: string
}

export interface OfflineSummary {
  elapsedSeconds: number
  boostedSeconds: number
  unboostedSeconds: number
  cashEarned: number
  slotsRefilled: number
}

export interface EmployeeState {
  cashRunner: boolean
  bayTech: boolean
  nightManager: boolean
}

export interface CityDistrictState {
  id: CityId
  owned: boolean
  restoration: number
}

export interface CityMapState {
  currentCityId: CityId
  districts: CityDistrictState[]
}

export interface WeekReview {
  week: number
  revenue: number
  costs: number
  costsPaid: number
  costsDue: number
  employeeWages: number
  profit: number
  cars: number
  driveBys: number
  lostRevenue: number
  physicalDue: number
  autoCollected: number
  /** Weekly rush goal captured at closeout, in customers. */
  rushTarget?: number
  /** True when staff settled the closeout and the next week opened without pausing. */
  autoClosed?: boolean
}

export interface GameState {
  version: 1
  gameStarted: boolean
  locationName: string
  cash: number
  week: number
  clockSeconds: number
  speed: SpeedSetting
  /** Last non-zero play speed — restored after weekly review closeout. */
  resumeSpeed: SpeedSetting
  cars: Car[]
  nextCarIn: number
  nextCarId: number
  bays: BayState[]
  upgrades: UpgradeState
  employees: EmployeeState
  ads: AdState
  cityMap: CityMapState
  weekRevenue: number
  lifetimeRevenue: number
  weekCars: number
  totalCars: number
  weekDriveBys: number
  totalDriveBys: number
  weekLostRevenue: number
  lifetimeLostRevenue: number
  collectRequired: boolean
  lastTickAt: number
  pendingOfflineSummary: OfflineSummary | null
  lastReview: WeekReview | null
  /** True once the all-districts celebration has been shown for this run. */
  empireCelebrated: boolean
}

export interface UpgradeDefinition {
  id: UpgradeId
  name: string
  cost: number
  effect: string
  visual: string
}

export interface BayUpgradeDefinition {
  id: BayUpgradeId
  name: string
  maxLevel: number
  baseCost: number
  costMultiplier: number
  effect: string
  visual: string
}

export interface EmployeeDefinition {
  id: EmployeeId
  name: string
  hireCost: number
  weeklyWage: number
  effect: string
  visual: string
}

export interface CityDefinition {
  id: CityId
  name: string
  washModel: WashModel
  theme: CityTheme
  bayCount: number
  purchaseCost: number
  restoreBaseCost: number
  trafficMultiplier: number
  patienceBonus: number
  priceBonus: number
  story: string
  visual: string
}
