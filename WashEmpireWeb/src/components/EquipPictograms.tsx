import type { BayUpgradeId } from '../game/types'

/**
 * Hand-drawn equipment pictograms in the game's own box-art language, so each
 * upgrade tile shows what the thing *is* before the player reads a word.
 */
export function EquipPictogram({ id }: { id: BayUpgradeId }) {
  const Icon = PICTOGRAMS[id]
  return (
    <svg className="equip-pictogram" viewBox="0 0 56 56" role="img" aria-hidden="true">
      <Icon />
    </svg>
  )
}

const PICTOGRAMS: Record<BayUpgradeId, () => React.JSX.Element> = {
  selector: SelectorIcon,
  wand: WandIcon,
  soap: SoapIcon,
  rinse: RinseIcon,
  dryer: DryerIcon,
  vault: VaultIcon,
}

function SelectorIcon() {
  return (
    <>
      <rect x="10" y="8" width="36" height="40" rx="4" fill="#0f172a" />
      <rect x="14" y="12" width="28" height="9" rx="2" fill="#22d3ee" />
      <circle cx="19" cy="31" r="4.4" fill="#ef4444" />
      <circle cx="28" cy="31" r="4.4" fill="#22c55e" />
      <circle cx="37" cy="31" r="4.4" fill="#38bdf8" />
      <circle cx="28" cy="41" r="5" fill="#f97316" />
      <rect x="26.8" y="36.6" width="2.4" height="5" rx="1" fill="#0f172a" />
    </>
  )
}

function WandIcon() {
  return (
    <>
      <rect x="8" y="34" width="16" height="7" rx="2.5" transform="rotate(-38 8 34)" fill="#1d4ed8" />
      <rect x="20" y="20" width="22" height="6" rx="3" transform="rotate(-38 20 24)" fill="#2563eb" />
      <path d="M14 44 Q10 50 14 52 Q18 50 14 44" fill="#38bdf8" />
      <circle cx="44" cy="10" r="2.6" fill="#7dd3fc" />
      <circle cx="49" cy="16" r="2.2" fill="#7dd3fc" />
      <circle cx="47" cy="24" r="1.8" fill="#7dd3fc" />
    </>
  )
}

function SoapIcon() {
  return (
    <>
      <rect x="16" y="18" width="24" height="30" rx="5" fill="#10b981" />
      <rect x="21" y="24" width="14" height="9" rx="2" fill="#065f46" />
      <rect x="24" y="12" width="8" height="7" rx="2" fill="#065f46" />
      <circle cx="16" cy="10" r="4.6" fill="#f8fafc" />
      <circle cx="26" cy="7" r="3.4" fill="#f8fafc" />
      <circle cx="35" cy="9" r="2.6" fill="#f8fafc" />
    </>
  )
}

function RinseIcon() {
  return (
    <>
      <rect x="6" y="12" width="44" height="7" rx="3.5" fill="#0ea5e9" />
      <rect x="13" y="19" width="4" height="5" fill="#0369a1" />
      <rect x="26" y="19" width="4" height="5" fill="#0369a1" />
      <rect x="39" y="19" width="4" height="5" fill="#0369a1" />
      <path d="M15 28 Q12 34 15 36 Q18 34 15 28" fill="#7dd3fc" />
      <path d="M28 32 Q25 38 28 40 Q31 38 28 32" fill="#7dd3fc" />
      <path d="M41 28 Q38 34 41 36 Q44 34 41 28" fill="#7dd3fc" />
      <path d="M21 40 Q18 46 21 48 Q24 46 21 40" fill="#bae6fd" />
      <path d="M35 40 Q32 46 35 48 Q38 46 35 40" fill="#bae6fd" />
    </>
  )
}

function DryerIcon() {
  return (
    <>
      <rect x="8" y="10" width="40" height="9" rx="4" fill="#0f766e" />
      <rect x="13" y="19" width="9" height="8" rx="2" fill="#111827" />
      <rect x="34" y="19" width="9" height="8" rx="2" fill="#111827" />
      <path d="M15 32 h12" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M13 39 h18" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M17 46 h13" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M36 34 h11" stroke="#5eead4" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M38 42 h8" stroke="#99f6e4" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  )
}

function VaultIcon() {
  return (
    <>
      <rect x="10" y="12" width="36" height="34" rx="4" fill="#1f2937" />
      <rect x="14" y="16" width="28" height="26" rx="2" fill="#374151" />
      <circle cx="24" cy="29" r="6.4" fill="#facc15" />
      <circle cx="24" cy="29" r="2.6" fill="#1f2937" />
      <rect x="35" y="20" width="4" height="12" rx="2" fill="#facc15" />
      <rect x="18" y="6" width="20" height="4" rx="2" fill="#22c55e" />
      <circle cx="42" cy="40" r="3.4" fill="#fbbf24" />
    </>
  )
}
