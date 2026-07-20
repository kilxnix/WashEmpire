import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  ADMOB_CONFIG,
  BROWSER_ADS_CONFIG,
  configureAdMobBridgeForTests,
  configureBrowserImaForTests,
  configureWebRewardedAdForTests,
  resetAdMobBridgeForTests,
  resolveBrowserAdTagUrl,
  showRewardedAd,
} from './ads'
import { GOOGLE_SAMPLE_LINEAR_VAST_TAG } from './imaRewarded'

describe('ad reward provider', () => {
  afterEach(() => {
    resetAdMobBridgeForTests()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('keeps the production AdMob ids in one config object', () => {
    expect(ADMOB_CONFIG.androidAppId).toBe('ca-app-pub-0396642445880935~1557835307')
    expect(ADMOB_CONFIG.rewardedAdUnitId).toBe('ca-app-pub-0396642445880935/6253769968')
  })

  it('defaults browser ads to a VAST tag (sample when unset)', () => {
    expect(BROWSER_ADS_CONFIG.forceLocalFallback).toBe(false)
    expect(resolveBrowserAdTagUrl()).toContain('pubads.g.doubleclick.net')
    expect(resolveBrowserAdTagUrl({ forceLocalFallback: false, imaAdTagUrl: '', useSampleTag: true })).toBe(
      GOOGLE_SAMPLE_LINEAR_VAST_TAG,
    )
    expect(
      resolveBrowserAdTagUrl({
        forceLocalFallback: false,
        imaAdTagUrl: 'https://example.com/vast.xml',
        useSampleTag: false,
      }),
    ).toBe('https://example.com/vast.xml')
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
      isTesting: ADMOB_CONFIG.isTesting,
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

  it('uses Google IMA on browser when not force-local', async () => {
    const showIma = vi.fn().mockResolvedValue(true)
    stubWindow({ location: { hostname: 'play.washempire.example' } as Location })
    configureBrowserImaForTests(showIma)

    await expect(showRewardedAd()).resolves.toBe(true)
    expect(showIma).toHaveBeenCalledTimes(1)
    expect(showIma.mock.calls[0][0]).toContain('http')
  })

  it('does not grant a boost when IMA fails and host is not localhost', async () => {
    const showIma = vi.fn().mockResolvedValue(false)
    const showLocal = vi.fn().mockResolvedValue(true)
    stubWindow({ location: { hostname: 'play.washempire.example' } as Location })
    configureBrowserImaForTests(showIma)
    configureWebRewardedAdForTests(showLocal)

    await expect(showRewardedAd()).resolves.toBe(false)
    expect(showIma).toHaveBeenCalledTimes(1)
    expect(showLocal).not.toHaveBeenCalled()
  })

  it('falls back to the local modal on localhost when IMA fails', async () => {
    const showIma = vi.fn().mockResolvedValue(false)
    const showLocal = vi.fn().mockResolvedValue(true)
    stubWindow({ location: { hostname: 'localhost' } as Location })
    configureBrowserImaForTests(showIma)
    configureWebRewardedAdForTests(showLocal)

    await expect(showRewardedAd()).resolves.toBe(true)
    expect(showIma).toHaveBeenCalledTimes(1)
    expect(showLocal).toHaveBeenCalledTimes(1)
  })

  it('does not grant a boost when the web fallback is dismissed', async () => {
    const showLocal = vi.fn().mockResolvedValue(false)
    stubWindow({ location: { hostname: 'localhost' } as Location })
    configureBrowserImaForTests(async () => false)
    configureWebRewardedAdForTests(showLocal)

    await expect(showRewardedAd()).resolves.toBe(false)
  })
})

function stubWindow(overrides: Partial<Window>) {
  vi.stubGlobal('window', {
    setTimeout,
    clearTimeout,
    location: { hostname: 'localhost' },
    ...overrides,
  })
}
