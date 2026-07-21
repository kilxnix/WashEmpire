import { useEffect } from 'react'
import { Megaphone, X } from 'lucide-react'
import type { CampaignId, GameState } from '../game/types'
import { campaignDefinitions } from '../game/simulation'
import { PAID_BUILD } from '../services/ads'

interface MarketingPanelProps {
  open: boolean
  state: GameState
  adLoading: boolean
  onLaunch: (campaignId: CampaignId) => void
  onClose: () => void
}

export function MarketingPanel({ open, state, adLoading, onLaunch, onClose }: MarketingPanelProps) {
  if (!open) return null

  const ads = state.ads
  const active: string[] = []
  if (ads.boostSeconds > 0) active.push(`3x cash ${formatHm(ads.boostSeconds)}`)
  if (ads.flyerSeconds > 0) active.push(`flyers ${formatHm(ads.flyerSeconds)}`)
  if (ads.weekendSeconds > 0) active.push(`weekend ${formatHm(ads.weekendSeconds)}`)

  return (
    <section className="marketing-panel" role="dialog" aria-modal="true" aria-label="Marketing campaigns">
      <header>
        <div>
          <span className="mini-label">Marketing</span>
          <h2>Campaigns</h2>
        </div>
        <button type="button" title="Close marketing" onClick={onClose}>
          <X size={18} />
        </button>
      </header>
      <p className="marketing-slots">
        Slots {ads.slotsAvailable}/5
        {ads.slotsAvailable < 5 ? ` · next in ${formatHm(ads.nextSlotInSeconds)}` : ''}
      </p>
      {active.length > 0 && <p className="marketing-active">Running: {active.join(' · ')}</p>}
      <div className="marketing-list">
        {campaignDefinitions.map((campaign) => {
          const freeViaAd = !PAID_BUILD && campaign.id === 'driver'
          const cost = freeViaAd ? 0 : campaign.cost
          const launchable = state.cash >= cost && ads.slotsAvailable >= campaign.slotCost

          return (
            <article key={campaign.id}>
              <div className="marketing-icon">
                <Megaphone size={17} />
              </div>
              <div>
                <div className="marketing-title-row">
                  <h3>{campaign.name}</h3>
                  <span className="level-pill">
                    {campaign.slotCost} slot{campaign.slotCost > 1 ? 's' : ''}
                  </span>
                </div>
                <p>{campaign.effect}</p>
                <span>{campaign.flavor}</span>
              </div>
              <button
                type="button"
                disabled={!launchable || adLoading}
                onClick={() => onLaunch(campaign.id)}
              >
                {freeViaAd ? (adLoading ? 'Loading…' : 'Watch ad') : money(campaign.cost)}
              </button>
            </article>
          )
        })}
      </div>
    </section>
  )
}

interface CampaignSpot {
  brand: string
  line: string
  sub: string
  bg: string
  ink: string
  accent: string
}

/** In-world ad break — rival brands from the design bible plus your own spot. */
const CAMPAIGN_SPOTS: CampaignSpot[] = [
  {
    brand: 'SUDSCO!',
    line: 'WASH MORE. PAY LESS.',
    sub: 'Some restrictions apply. Many, actually.',
    bg: '#D9A83A',
    ink: '#3a2a10',
    accent: '#7A463A',
  },
  {
    brand: 'Aurora Auto Spa',
    line: 'You deserve quieter water.',
    sub: 'Aurora. Obviously.',
    bg: '#3A4A5A',
    ink: '#E0D8C8',
    accent: '#A8A8A8',
  },
  {
    brand: 'Hydro Holdings',
    line: 'A cleaner tomorrow. Incrementally.',
    sub: 'A subsidiary of Hydro Holdings Holdings.',
    bg: '#5A7A9A',
    ink: '#E8E0D0',
    accent: '#B8B0A8',
  },
  {
    brand: "Pop's Wash & Wax",
    line: 'Since 1962.',
    sub: 'Ask about Tuesdays.',
    bg: '#5A8A8A',
    ink: '#1f2a2a',
    accent: '#D8C8A8',
  },
  {
    brand: 'WASH EMPIRE',
    line: 'Now with more foam.',
    sub: "That's your spot. You paid for it.",
    bg: '#22c7d9',
    ink: '#122531',
    accent: '#facc15',
  },
]

export function CampaignVignette({ spotIndex, onDone }: { spotIndex: number; onDone: () => void }) {
  const spot = CAMPAIGN_SPOTS[Math.abs(spotIndex) % CAMPAIGN_SPOTS.length]

  useEffect(() => {
    const timer = window.setTimeout(onDone, 2600)
    return () => window.clearTimeout(timer)
  }, [onDone])

  return (
    <button
      type="button"
      className="campaign-vignette"
      style={{ background: spot.bg, color: spot.ink }}
      onClick={onDone}
      aria-label="Skip spot"
    >
      <span className="mini-label" style={{ color: spot.accent }}>
        Your ad break is airing
      </span>
      <strong>{spot.brand}</strong>
      <em>{spot.line}</em>
      <span className="campaign-vignette-sub">{spot.sub}</span>
      <span className="campaign-vignette-skip">tap to skip</span>
    </button>
  )
}

function formatHm(seconds: number): string {
  if (seconds <= 0) return '0m'
  const total = Math.ceil(seconds)
  let hours = Math.floor(total / 3600)
  let mins = Math.ceil((total % 3600) / 60)
  if (mins === 60) {
    hours += 1
    mins = 0
  }
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}
