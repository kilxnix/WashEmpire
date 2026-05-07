import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ADMOB_CONFIG,
  configureAdMobBridgeForTests,
  configureWebRewardedAdForTests,
  resetAdMobBridgeForTests,
  showRewardedAd,
} from './ads'

describe('ad reward provider', () => {
  afterEach(() => {
    resetAdMobBridgeForTests()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps the production AdMob ids in one config object', () => {
    expect(ADMOB_CONFIG.androidAppId).toBe('ca-app-pub-0396642445880935~1557835307')
    expect(ADMOB_CONFIG.rewardedAdUnitId).toBe('ca-app-pub-0396642445880935/6253769968')
    expect(ADMOB_CONFIG.isTesting).toBe(false)
  })

  it('prefers a custom native host hook when present', async () => {
    const showRewardedAdFromHost = vi.fn().mockResolvedValue(true)
    stubWindow({
      WashEmpireAds: {
        showRewardedAd: showRewardedAdFromHost,
      },
    })

    await expect(showRewardedAd()).resolves.toBe(true)
    expect(showRewardedAdFromHost).toHaveBeenCalledTimes(1)
  })

  it('uses Capacitor AdMob rewarded video ads when the plugin is available', async () => {
    const initialize = vi.fn().mockResolvedValue(undefined)
    const prepareRewardVideoAd = vi.fn().mockResolvedValue({})
    const showRewardVideoAd = vi.fn().mockResolvedValue({ amount: 1, type: 'boost' })
    stubWindow({})
    configureAdMobBridgeForTests(
      {
        initialize,
        prepareRewardVideoAd,
        showRewardVideoAd,
      },
      {
        getPlatform: () => 'android',
        isNativePlatform: () => true,
      },
    )

    await expect(showRewardedAd()).resolves.toBe(true)
    expect(initialize).toHaveBeenCalledTimes(1)
    expect(prepareRewardVideoAd).toHaveBeenCalledWith({
      adId: ADMOB_CONFIG.rewardedAdUnitId,
      isTesting: false,
      immersiveMode: true,
    })
    expect(showRewardVideoAd).toHaveBeenCalledTimes(1)
  })

  it('fails closed in a native Android runtime without an AdMob bridge', async () => {
    stubWindow({})
    configureAdMobBridgeForTests(
      {
        initialize: vi.fn().mockRejectedValue(new Error('missing plugin')),
        prepareRewardVideoAd: vi.fn().mockRejectedValue(new Error('missing plugin')),
        showRewardVideoAd: vi.fn().mockRejectedValue(new Error('missing plugin')),
      },
      {
        getPlatform: () => 'android',
        isNativePlatform: () => true,
      },
    )

    await expect(showRewardedAd()).resolves.toBe(false)
  })

  it('returns false when the native rewarded ad cannot be shown', async () => {
    stubWindow({})
    configureAdMobBridgeForTests(
      {
        initialize: vi.fn().mockResolvedValue(undefined),
        prepareRewardVideoAd: vi.fn().mockResolvedValue({}),
        showRewardVideoAd: vi.fn().mockRejectedValue(new Error('closed')),
      },
      {
        getPlatform: () => 'android',
        isNativePlatform: () => true,
      },
    )

    await expect(showRewardedAd()).resolves.toBe(false)
  })

  it('shows the web rewarded-ad fallback outside native Android', async () => {
    const showWebRewardedAd = vi.fn().mockResolvedValue(true)
    stubWindow({})
    configureWebRewardedAdForTests(showWebRewardedAd)

    await expect(showRewardedAd()).resolves.toBe(true)
    expect(showWebRewardedAd).toHaveBeenCalledTimes(1)
  })

  it('does not grant a boost when the web fallback is dismissed', async () => {
    const showWebRewardedAd = vi.fn().mockResolvedValue(false)
    stubWindow({})
    configureWebRewardedAdForTests(showWebRewardedAd)

    await expect(showRewardedAd()).resolves.toBe(false)
  })
})

function stubWindow(overrides: Partial<Window>) {
  vi.stubGlobal('window', {
    setTimeout,
    ...overrides,
  })
}
