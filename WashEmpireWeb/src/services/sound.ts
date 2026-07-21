const SOUND_KEY = 'wash-empire-sound-v1'

let audioContext: AudioContext | null = null
let soundEnabled = loadPreference()

export function isSoundEnabled(): boolean {
  return soundEnabled
}

export function setSoundEnabled(enabled: boolean): void {
  soundEnabled = enabled
  try {
    localStorage.setItem(SOUND_KEY, enabled ? '1' : '0')
  } catch {
    // ignore storage failures
  }
}

/** Bright three-note coin jingle for pay box collections. */
export function playCollect(): void {
  const ctx = ensureContext()
  if (!ctx) return
  const notes = [1318.5, 1568, 1975.5, 2637]
  notes.forEach((freq, index) => {
    tone(ctx, {
      frequency: freq,
      type: 'triangle',
      startOffset: index * 0.055,
      duration: 0.16,
      peak: 0.14,
    })
  })
}

/** Short mechanical thunk for equipment and lot purchases. */
export function playPurchase(): void {
  const ctx = ensureContext()
  if (!ctx) return
  tone(ctx, { frequency: 150, sweepTo: 88, type: 'square', duration: 0.13, peak: 0.16 })
  tone(ctx, { frequency: 640, type: 'triangle', startOffset: 0.06, duration: 0.09, peak: 0.08 })
}

/** Two-note confirmation for hires. */
export function playHire(): void {
  const ctx = ensureContext()
  if (!ctx) return
  tone(ctx, { frequency: 523.3, type: 'triangle', duration: 0.12, peak: 0.13 })
  tone(ctx, { frequency: 784, type: 'triangle', startOffset: 0.11, duration: 0.18, peak: 0.13 })
}

/** Rising sweep when a campaign boost arms. */
export function playBoost(): void {
  const ctx = ensureContext()
  if (!ctx) return
  tone(ctx, { frequency: 320, sweepTo: 960, type: 'sawtooth', duration: 0.28, peak: 0.09 })
  tone(ctx, { frequency: 1280, type: 'sine', startOffset: 0.22, duration: 0.16, peak: 0.1 })
}

/** Soft bell when a new week opens. */
export function playWeekOpen(): void {
  const ctx = ensureContext()
  if (!ctx) return
  tone(ctx, { frequency: 880, type: 'sine', duration: 0.34, peak: 0.12 })
  tone(ctx, { frequency: 1760, type: 'sine', duration: 0.26, peak: 0.05 })
}

/** Ascending fanfare for a district purchase. */
export function playDistrict(): void {
  const ctx = ensureContext()
  if (!ctx) return
  const notes = [523.3, 659.3, 784, 1046.5]
  notes.forEach((freq, index) => {
    tone(ctx, {
      frequency: freq,
      type: 'triangle',
      startOffset: index * 0.11,
      duration: index === notes.length - 1 ? 0.42 : 0.16,
      peak: 0.14,
    })
  })
}

/** Full fanfare for completing the empire. */
export function playWin(): void {
  const ctx = ensureContext()
  if (!ctx) return
  const melody = [523.3, 659.3, 784, 1046.5, 784, 1046.5, 1318.5]
  melody.forEach((freq, index) => {
    tone(ctx, {
      frequency: freq,
      type: 'triangle',
      startOffset: index * 0.14,
      duration: index === melody.length - 1 ? 0.7 : 0.2,
      peak: 0.15,
    })
  })
}

interface ToneOptions {
  frequency: number
  type: OscillatorType
  duration: number
  peak: number
  startOffset?: number
  sweepTo?: number
}

function tone(ctx: AudioContext, options: ToneOptions): void {
  try {
    const start = ctx.currentTime + (options.startOffset ?? 0)
    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()

    oscillator.type = options.type
    oscillator.frequency.setValueAtTime(options.frequency, start)
    if (options.sweepTo) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, options.sweepTo), start + options.duration)
    }

    gain.gain.setValueAtTime(0.0001, start)
    gain.gain.exponentialRampToValueAtTime(options.peak, start + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + options.duration)

    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(start)
    oscillator.stop(start + options.duration + 0.05)
  } catch {
    // Never let audio break gameplay.
  }
}

function ensureContext(): AudioContext | null {
  if (!soundEnabled) return null
  if (typeof window === 'undefined' || !('AudioContext' in window)) return null

  try {
    audioContext ??= new AudioContext()
    if (audioContext.state === 'suspended') {
      void audioContext.resume()
    }
    return audioContext
  } catch {
    return null
  }
}

function loadPreference(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== '0'
  } catch {
    return true
  }
}
