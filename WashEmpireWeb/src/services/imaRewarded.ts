import type {
  ImaAdDisplayContainer,
  ImaAdsLoader,
  ImaAdsManager,
  ImaAdsManagerLoadedEvent,
  ImaAdErrorEvent,
  ImaSdk,
} from './imaTypes'

/** Public Google sample linear VAST tag — used when no production tag is set. */
export const GOOGLE_SAMPLE_LINEAR_VAST_TAG =
  'https://pubads.g.doubleclick.net/gampad/ads?' +
  'iu=/21775744923/external/single_ad_samples&sz=640x480&' +
  'cust_params=sample_ct%3Dlinear&ciu_szs=300x250%2C728x90&gdfp_req=1&' +
  'output=vast&unviewed_position_start=1&env=vp&impl=s&correlator='

const IMA_SDK_SRC = 'https://imasdk.googleapis.com/js/sdkloader/ima3.js'
const IMA_LOAD_TIMEOUT_MS = 12_000
const AD_REQUEST_TIMEOUT_MS = 20_000

let imaLoadPromise: Promise<ImaSdk> | null = null

export interface ImaRewardedOptions {
  adTagUrl: string
  /** Optional timeout for the full ad session. */
  timeoutMs?: number
}

/**
 * Play a single linear VAST ad via Google IMA and resolve true only if the
 * creative completed (not skipped / errored / closed early).
 */
export async function showImaRewardedAd(options: ImaRewardedOptions): Promise<boolean> {
  const currentWindow = typeof window === 'undefined' ? undefined : window
  const currentDocument = currentWindow?.document
  if (!currentWindow || !currentDocument?.body) return false

  const adTagUrl = options.adTagUrl.trim()
  if (!adTagUrl) return false

  let ima: ImaSdk
  try {
    ima = await loadImaSdk(currentWindow)
  } catch {
    return false
  }

  return new Promise<boolean>((resolve) => {
    let settled = false
    let earnedReward = false
    let adsManager: ImaAdsManager | null = null
    let adsLoader: ImaAdsLoader | null = null
    let adDisplayContainer: ImaAdDisplayContainer | null = null
    let resizeHandler: (() => void) | null = null
    let requestTimer = 0
    let sessionTimer = 0

    const overlay = currentDocument.createElement('div')
    overlay.className = 'wash-ad-overlay wash-ima-overlay'
    overlay.setAttribute('role', 'dialog')
    overlay.setAttribute('aria-modal', 'true')
    overlay.setAttribute('aria-label', 'Rewarded video ad')
    overlay.innerHTML = `
      <section class="wash-ima-player">
        <header class="wash-ad-header">
          <span class="mini-label">Rewarded campaign</span>
          <button class="wash-ad-close" type="button" aria-label="Close ad">Close</button>
        </header>
        <div class="wash-ima-stage">
          <video class="wash-ima-video" playsinline muted></video>
          <div class="wash-ima-ad-container"></div>
          <p class="wash-ima-status" data-status>Loading ad…</p>
        </div>
        <footer class="wash-ad-footer">
          <span data-hint>Watch the full ad to unlock Ad Boost</span>
        </footer>
      </section>
    `

    const stage = overlay.querySelector<HTMLElement>('.wash-ima-stage')
    const video = overlay.querySelector<HTMLVideoElement>('.wash-ima-video')
    const adContainer = overlay.querySelector<HTMLElement>('.wash-ima-ad-container')
    const status = overlay.querySelector<HTMLElement>('[data-status]')
    const closeButton = overlay.querySelector<HTMLButtonElement>('.wash-ad-close')
    const hint = overlay.querySelector<HTMLElement>('[data-hint]')

    if (!stage || !video || !adContainer || !status || !closeButton) {
      resolve(false)
      return
    }

    function cleanup(result: boolean) {
      if (settled) return
      settled = true
      if (requestTimer) currentWindow!.clearTimeout(requestTimer)
      if (sessionTimer) currentWindow!.clearTimeout(sessionTimer)
      if (resizeHandler) currentWindow!.removeEventListener('resize', resizeHandler)
      try {
        adsManager?.destroy()
      } catch {
        // ignore teardown races
      }
      try {
        adsLoader?.destroy?.()
      } catch {
        // ignore
      }
      try {
        adDisplayContainer?.destroy?.()
      } catch {
        // ignore
      }
      overlay.remove()
      resolve(result)
    }

    function setStatus(message: string) {
      status!.textContent = message
    }

    function onFatalError(message: string) {
      setStatus(message)
      if (hint) hint.textContent = 'No boost granted'
      currentWindow!.setTimeout(() => cleanup(false), 700)
    }

    closeButton.addEventListener('click', () => cleanup(false))
    currentDocument.body.append(overlay)

    try {
      adDisplayContainer = new ima.AdDisplayContainer(adContainer, video)
      // Must run from user gesture for mobile autoplay policies.
      adDisplayContainer.initialize()

      adsLoader = new ima.AdsLoader(adDisplayContainer)
      adsLoader.addEventListener(ima.AdsManagerLoadedEvent.Type.ADS_MANAGER_LOADED, (event) => {
        const loaded = event as ImaAdsManagerLoadedEvent
        const settings = new ima.AdsRenderingSettings()
        settings.restoreCustomPlaybackStateOnAdBreakComplete = true
        adsManager = loaded.getAdsManager(video, settings)

        adsManager.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, (errorEvent) => {
          const err = errorEvent as ImaAdErrorEvent
          const message =
            err.getError?.()?.getMessage?.() ?? err.getError?.()?.toString?.() ?? 'Ad error'
          onFatalError(message)
        })

        adsManager.addEventListener(ima.AdEvent.Type.LOADED, () => {
          setStatus('Ad ready')
          status!.hidden = true
        })

        adsManager.addEventListener(ima.AdEvent.Type.STARTED, () => {
          setStatus('Playing…')
          status!.hidden = true
          if (hint) hint.textContent = 'Stay until the end to claim Ad Boost'
        })

        adsManager.addEventListener(ima.AdEvent.Type.COMPLETE, () => {
          earnedReward = true
          if (hint) hint.textContent = 'Reward unlocked'
        })

        adsManager.addEventListener(ima.AdEvent.Type.SKIPPED, () => {
          earnedReward = false
          cleanup(false)
        })

        adsManager.addEventListener(ima.AdEvent.Type.USER_CLOSE, () => {
          cleanup(earnedReward)
        })

        adsManager.addEventListener(ima.AdEvent.Type.ALL_ADS_COMPLETED, () => {
          cleanup(earnedReward)
        })

        const width = Math.max(320, stage.clientWidth || currentWindow!.innerWidth)
        const height = Math.max(180, stage.clientHeight || Math.round(width * 0.5625))

        try {
          adsManager.init(width, height, ima.ViewMode.NORMAL)
          adsManager.start()
        } catch {
          onFatalError('Could not start ad playback')
          return
        }

        resizeHandler = () => {
          if (!adsManager) return
          const nextWidth = Math.max(320, stage.clientWidth || currentWindow!.innerWidth)
          const nextHeight = Math.max(180, stage.clientHeight || Math.round(nextWidth * 0.5625))
          adsManager.resize(nextWidth, nextHeight, ima.ViewMode.NORMAL)
        }
        currentWindow!.addEventListener('resize', resizeHandler)
      })

      adsLoader.addEventListener(ima.AdErrorEvent.Type.AD_ERROR, (errorEvent) => {
        const err = errorEvent as ImaAdErrorEvent
        const message =
          err.getError?.()?.getMessage?.() ?? err.getError?.()?.toString?.() ?? 'No fill'
        onFatalError(message)
      })

      const request = new ima.AdsRequest()
      // Append correlator for cache-busting when using sample tags.
      request.adTagUrl = adTagUrl.includes('correlator=')
        ? `${adTagUrl}${Date.now()}`
        : adTagUrl.includes('?')
          ? `${adTagUrl}&correlator=${Date.now()}`
          : `${adTagUrl}?correlator=${Date.now()}`
      request.linearAdSlotWidth = Math.max(320, stage.clientWidth || 640)
      request.linearAdSlotHeight = Math.max(180, stage.clientHeight || 360)
      request.nonLinearAdSlotWidth = request.linearAdSlotWidth
      request.nonLinearAdSlotHeight = 150

      requestTimer = currentWindow.setTimeout(() => {
        onFatalError('Ad request timed out')
      }, AD_REQUEST_TIMEOUT_MS)

      adsLoader.requestAds(request)

      const sessionMs = options.timeoutMs ?? 120_000
      sessionTimer = currentWindow.setTimeout(() => {
        cleanup(earnedReward)
      }, sessionMs)
    } catch {
      cleanup(false)
    }
  })
}

export function loadImaSdk(targetWindow: Window = window): Promise<ImaSdk> {
  if (targetWindow.google?.ima) {
    return Promise.resolve(targetWindow.google.ima)
  }

  if (imaLoadPromise) return imaLoadPromise

  imaLoadPromise = new Promise<ImaSdk>((resolve, reject) => {
    const existing = targetWindow.document.querySelector<HTMLScriptElement>(`script[src="${IMA_SDK_SRC}"]`)
    if (existing && targetWindow.google?.ima) {
      resolve(targetWindow.google.ima)
      return
    }

    const script = existing ?? targetWindow.document.createElement('script')
    let settled = false
    const timer = targetWindow.setTimeout(() => {
      if (settled) return
      settled = true
      imaLoadPromise = null
      reject(new Error('IMA SDK load timed out'))
    }, IMA_LOAD_TIMEOUT_MS)

    function succeed() {
      if (settled) return
      if (!targetWindow.google?.ima) {
        fail(new Error('IMA SDK missing after load'))
        return
      }
      settled = true
      targetWindow.clearTimeout(timer)
      resolve(targetWindow.google.ima)
    }

    function fail(error: Error) {
      if (settled) return
      settled = true
      targetWindow.clearTimeout(timer)
      imaLoadPromise = null
      reject(error)
    }

    script.addEventListener('load', succeed)
    script.addEventListener('error', () => fail(new Error('IMA SDK failed to load')))

    if (!existing) {
      script.src = IMA_SDK_SRC
      script.async = true
      targetWindow.document.head.append(script)
    } else if (targetWindow.google?.ima) {
      succeed()
    }
  })

  return imaLoadPromise
}

export function resetImaLoaderForTests(): void {
  imaLoadPromise = null
}
