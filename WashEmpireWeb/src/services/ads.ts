import { AdMob } from '@capacitor-community/admob'
import type { AdMobInitializationOptions, AdMobPlugin } from '@capacitor-community/admob'
import { Capacitor } from '@capacitor/core'

declare global {
  interface Window {
    WashEmpireAdMobConfig?: AdMobConfig
    WashEmpireAds?: {
      showRewardedAd: () => Promise<boolean>
    }
  }
}

export interface AdMobConfig {
  androidAppId: string
  rewardedAdUnitId: string
  isTesting: boolean
}

interface NativeRuntime {
  getPlatform?: () => string
  isNativePlatform?: () => boolean
}

type RewardAdMobPlugin = Pick<
  AdMobPlugin,
  'initialize' | 'prepareRewardVideoAd' | 'showRewardVideoAd'
>
type WebRewardedAdPresenter = () => Promise<boolean>

export const ADMOB_CONFIG: AdMobConfig = {
  androidAppId: 'ca-app-pub-0396642445880935~1557835307',
  rewardedAdUnitId: 'ca-app-pub-0396642445880935/6253769968',
  isTesting: false,
}

let capacitorAdMobInitialized = false
let rewardPreparation: Promise<void> | null = null
let nativeAdMob: RewardAdMobPlugin = AdMob
let nativeRuntime: NativeRuntime = Capacitor
let webRewardedAdPresenter: WebRewardedAdPresenter = showWebRewardedAdModal

const browserWindow = getBrowserWindow()
if (browserWindow) {
  browserWindow.WashEmpireAdMobConfig = ADMOB_CONFIG
}

export async function showRewardedAd(): Promise<boolean> {
  const currentWindow = getBrowserWindow()
  if (!currentWindow) return false

  if (currentWindow.WashEmpireAds?.showRewardedAd) {
    return currentWindow.WashEmpireAds.showRewardedAd()
  }

  if (isNativeAndroidRuntime()) {
    return showCapacitorRewardedAd(nativeAdMob)
  }

  return showLocalFallbackAd()
}

export function resetAdMobBridgeForTests(): void {
  capacitorAdMobInitialized = false
  rewardPreparation = null
  nativeAdMob = AdMob
  nativeRuntime = Capacitor
  webRewardedAdPresenter = showWebRewardedAdModal
}

export function configureAdMobBridgeForTests(adMob: RewardAdMobPlugin, runtime: NativeRuntime): void {
  nativeAdMob = adMob
  nativeRuntime = runtime
}

export function configureWebRewardedAdForTests(presenter: WebRewardedAdPresenter): void {
  webRewardedAdPresenter = presenter
}

async function showCapacitorRewardedAd(adMob: RewardAdMobPlugin): Promise<boolean> {
  try {
    await prepareCapacitorReward(adMob)
    const reward = await adMob.showRewardVideoAd()
    rewardPreparation = null
    void prepareCapacitorReward(adMob).catch(() => undefined)
    return reward.amount > 0
  } catch {
    rewardPreparation = null
    void prepareCapacitorReward(adMob).catch(() => undefined)
    return false
  }
}

async function prepareCapacitorReward(adMob: RewardAdMobPlugin): Promise<void> {
  if (!capacitorAdMobInitialized) {
    await adMob.initialize(adMobInitializationOptions())
    capacitorAdMobInitialized = true
  }

  rewardPreparation ??= adMob
    .prepareRewardVideoAd({
      adId: ADMOB_CONFIG.rewardedAdUnitId,
      isTesting: ADMOB_CONFIG.isTesting,
      immersiveMode: true,
    })
    .then(() => undefined)

  return rewardPreparation
}

async function showLocalFallbackAd(): Promise<boolean> {
  return webRewardedAdPresenter()
}

function showWebRewardedAdModal(): Promise<boolean> {
  const currentWindow = getBrowserWindow()
  const currentDocument = currentWindow?.document

  if (!currentWindow || !currentDocument?.body) return Promise.resolve(false)

  const modalWindow = currentWindow
  const modalDocument = currentDocument

  return new Promise((resolve) => {
    const requiredSeconds = 4
    const overlay = modalDocument.createElement('div')
    const previouslyFocused = modalDocument.activeElement instanceof HTMLElement ? modalDocument.activeElement : null
    let completed = false

    overlay.className = 'wash-ad-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-labelledby', 'wash-ad-title')
    overlay.innerHTML = `
      <section class="wash-ad-modal">
        <header class="wash-ad-header">
          <span class="mini-label">Rewarded sponsor</span>
          <button class="wash-ad-close" type="button" aria-label="Close ad">Close</button>
        </header>
        <div class="wash-ad-creative" aria-live="polite">
          <span class="wash-ad-badge">Local Driver Campaign</span>
          <h2 id="wash-ad-title">Wash Empire Ad Boost</h2>
          <p>Promote your wash to nearby drivers and turn attention into a temporary 3x demand boost.</p>
          <div class="wash-ad-route" aria-hidden="true">
            <i></i><i></i><i></i><i></i>
          </div>
        </div>
        <div class="wash-ad-progress" aria-hidden="true"><i></i></div>
        <footer class="wash-ad-footer">
          <span>Reward unlocks in <strong data-countdown>${requiredSeconds}</strong>s</span>
          <button class="wash-ad-claim" type="button" disabled>Claim Boost</button>
        </footer>
      </section>
    `

    const progress = overlay.querySelector<HTMLElement>('.wash-ad-progress i')
    const countdown = overlay.querySelector<HTMLElement>('[data-countdown]')
    const claimButton = overlay.querySelector<HTMLButtonElement>('.wash-ad-claim')
    const closeButton = overlay.querySelector<HTMLButtonElement>('.wash-ad-close')
    const startedAt = modalWindow.performance?.now() ?? Date.now()
    let interval = 0

    function cleanup(result: boolean) {
      modalWindow.clearInterval(interval)
      modalWindow.removeEventListener('keydown', handleKeydown)
      overlay.remove()
      previouslyFocused?.focus()
      resolve(result)
    }

    function finish() {
      completed = true
      if (claimButton) {
        claimButton.disabled = false
        claimButton.textContent = 'Claim Boost'
        claimButton.focus()
      }
      if (countdown) countdown.textContent = '0'
      if (progress) progress.style.width = '100%'
    }

    function updateProgress() {
      if (completed) return
      const now = modalWindow.performance?.now() ?? Date.now()
      const elapsedSeconds = (now - startedAt) / 1000
      const remaining = Math.max(0, Math.ceil(requiredSeconds - elapsedSeconds))
      if (countdown) countdown.textContent = String(remaining)
      if (progress) progress.style.width = `${Math.min(100, (elapsedSeconds / requiredSeconds) * 100)}%`
      if (elapsedSeconds >= requiredSeconds) finish()
    }

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === 'Escape') cleanup(false)
    }

    modalDocument.body.append(overlay)

    interval = modalWindow.setInterval(updateProgress, 120)
    modalWindow.addEventListener('keydown', handleKeydown)
    closeButton?.addEventListener('click', () => cleanup(false))
    claimButton?.addEventListener('click', () => {
      if (!claimButton.disabled) cleanup(true)
    })

    closeButton?.focus()
    updateProgress()
  })
}

function adMobInitializationOptions(): AdMobInitializationOptions {
  return ADMOB_CONFIG.isTesting ? { initializeForTesting: true } : {}
}

function isNativeAndroidRuntime(): boolean {
  try {
    return (
      nativeRuntime.isNativePlatform?.() === true &&
      nativeRuntime.getPlatform?.() === 'android'
    )
  } catch {
    return false
  }
}

function getBrowserWindow(): Window | undefined {
  return typeof window === 'undefined' ? undefined : window
}
