import { Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

interface StartMenuProps {
  cash: number
  hasRun: boolean
  initialName: string
  week: number
  onContinue: () => void
  onNewGame: (locationName: string) => void
  onStart: (locationName: string) => void
}

export function StartMenu({
  cash,
  hasRun,
  initialName,
  week,
  onContinue,
  onNewGame,
  onStart,
}: StartMenuProps) {
  const [locationName, setLocationName] = useState(initialName)

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (hasRun) {
      onNewGame(locationName)
    } else {
      onStart(locationName)
    }
  }

  return (
    <section className="start-menu" aria-label="Start game">
      <form onSubmit={handleSubmit}>
        <span className="mini-label">{hasRun ? 'Saved location' : 'New location'}</span>
        <h1>Wash Empire</h1>
        {hasRun && (
          <div className="continue-card">
            <div>
              <strong>{initialName}</strong>
              <span>
                Week {week} - {money(cash)}
              </span>
            </div>
            <button type="button" onClick={onContinue}>
              <Play size={18} />
              <span>Continue</span>
            </button>
          </div>
        )}
        <label>
          <span>{hasRun ? 'New location name' : 'Location name'}</span>
          <input
            maxLength={32}
            value={locationName}
            onChange={(event) => setLocationName(event.target.value)}
            placeholder="Wash Empire Auto Spa"
          />
        </label>
        <button type="submit">
          {hasRun ? <RotateCcw size={18} /> : <Play size={18} />}
          <span>{hasRun ? 'Start New' : 'Open Wash'}</span>
        </button>
      </form>
    </section>
  )
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}
