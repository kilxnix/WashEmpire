/** Minimal ambient types for the Google IMA HTML5 SDK loaded from CDN. */

export interface ImaSdk {
  AdDisplayContainer: new (
    containerElement: HTMLElement,
    videoElement?: HTMLVideoElement | null,
  ) => ImaAdDisplayContainer
  AdsLoader: new (container: ImaAdDisplayContainer) => ImaAdsLoader
  AdsRequest: new () => ImaAdsRequest
  AdsRenderingSettings: new () => ImaAdsRenderingSettings
  AdsManagerLoadedEvent: { Type: { ADS_MANAGER_LOADED: string } }
  AdErrorEvent: { Type: { AD_ERROR: string } }
  AdEvent: {
    Type: {
      COMPLETE: string
      ALL_ADS_COMPLETED: string
      SKIPPED: string
      USER_CLOSE: string
      CONTENT_PAUSE_REQUESTED: string
      CONTENT_RESUME_REQUESTED: string
      LOADED: string
      STARTED: string
    }
  }
  ViewMode: { NORMAL: number; FULLSCREEN: number }
}

export interface ImaAdDisplayContainer {
  initialize: () => void
  destroy?: () => void
}

export interface ImaAdsLoader {
  addEventListener: (type: string, handler: (event: unknown) => void) => void
  requestAds: (request: ImaAdsRequest) => void
  contentComplete: () => void
  destroy?: () => void
}

export interface ImaAdsRequest {
  adTagUrl: string
  linearAdSlotWidth: number
  linearAdSlotHeight: number
  nonLinearAdSlotWidth: number
  nonLinearAdSlotHeight: number
}

export interface ImaAdsRenderingSettings {
  restoreCustomPlaybackStateOnAdBreakComplete?: boolean
}

export interface ImaAdsManager {
  addEventListener: (type: string, handler: (event: unknown) => void) => void
  init: (width: number, height: number, viewMode: number) => void
  start: () => void
  resize: (width: number, height: number, viewMode: number) => void
  destroy: () => void
  getRemainingTime?: () => number
}

export interface ImaAdsManagerLoadedEvent {
  getAdsManager: (
    videoElement: HTMLVideoElement,
    settings?: ImaAdsRenderingSettings,
  ) => ImaAdsManager
}

export interface ImaAdErrorEvent {
  getError?: () => { toString?: () => string; getMessage?: () => string }
}

declare global {
  interface Window {
    google?: {
      ima?: ImaSdk
    }
  }
}

export {}
