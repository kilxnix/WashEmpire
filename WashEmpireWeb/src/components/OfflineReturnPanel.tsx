import type { OfflineSummary } from '../game/types'

interface OfflineReturnPanelProps {
  summary: OfflineSummary
  onDismiss: () => void
}

export function OfflineReturnPanel({ summary, onDismiss }: OfflineReturnPanelProps) {
  return (
    <section className="offline-return" aria-label="Offline earnings summary">
      <span className="mini-label">Welcome back</span>
      <h2>+${Math.round(summary.cashEarned).toLocaleString()} earned</h2>
      <p className="offline-elapsed">You were away {formatDuration(summary.elapsedSeconds)}</p>
      <dl>
        <div>
          <dt>Boosted</dt>
          <dd>
            {formatDuration(summary.boostedSeconds)}
            {summary.boostedSeconds > 0 ? <span className="offline-tag">3× rate</span> : null}
          </dd>
        </div>
        <div>
          <dt>Baseline</dt>
          <dd>
            {formatDuration(summary.unboostedSeconds)}
            {summary.unboostedSeconds >= 28_800 ? <span className="offline-tag">capped</span> : null}
          </dd>
        </div>
        <div>
          <dt>Slots refilled</dt>
          <dd>{summary.slotsRefilled}</dd>
        </div>
      </dl>
      <button type="button" onClick={onDismiss}>
        Collect
      </button>
    </section>
  )
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0m'
  const total = Math.round(seconds)
  const hours = Math.floor(total / 3600)
  const mins = Math.floor((total % 3600) / 60)
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}
