declare global {
  interface Window {
    WashEmpireAds?: {
      showRewardedAd: () => Promise<boolean>
    }
  }
}

export async function showRewardedAd(): Promise<boolean> {
  if (window.WashEmpireAds?.showRewardedAd) {
    return window.WashEmpireAds.showRewardedAd()
  }

  await new Promise((resolve) => window.setTimeout(resolve, 650))
  return true
}

