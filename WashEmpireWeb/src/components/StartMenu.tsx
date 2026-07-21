import { HardDriveDownload, Play, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'

interface StartMenuProps {
  cash: number
  hasRun: boolean
  initialName: string
  week: number
  legacy: number
  onContinue: () => void
  onNewGame: (locationName: string) => void
  onStart: (locationName: string) => void
  onExportSave: () => string
  onImportSave: (raw: string) => boolean
}

export function StartMenu({
  cash,
  hasRun,
  initialName,
  week,
  legacy,
  onContinue,
  onNewGame,
  onStart,
  onExportSave,
  onImportSave,
}: StartMenuProps) {
  const [locationName, setLocationName] = useState(initialName)
  const [backupOpen, setBackupOpen] = useState(false)
  const [backupText, setBackupText] = useState('')
  const [backupStatus, setBackupStatus] = useState('')

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (hasRun) {
      onNewGame(locationName)
    } else {
      onStart(locationName)
    }
  }

  function handleExport() {
    const data = onExportSave()
    setBackupText(data)
    setBackupStatus('Save copied below — store it somewhere safe.')
    try {
      void navigator.clipboard?.writeText(data)
      setBackupStatus('Save copied to clipboard and shown below.')
    } catch {
      // Clipboard is best-effort; the textarea still has the data.
    }
  }

  function handleImport() {
    if (!backupText.trim()) {
      setBackupStatus('Paste a backup into the box first.')
      return
    }
    if (onImportSave(backupText)) {
      setBackupStatus('Backup restored — press Continue to play it.')
    } else {
      setBackupStatus('That does not look like a Wash Empire save.')
    }
  }

  return (
    <section className="start-menu" aria-label="Start game">
      <div className="start-menu-brand" aria-hidden="true">
        <span>Self-serve tycoon</span>
        <strong>Build the lot. Fill the pay box. Expand the map.</strong>
      </div>
      <form onSubmit={handleSubmit}>
        <span className="mini-label">{hasRun ? 'Saved location' : 'New location'}</span>
        <h1>Wash Empire</h1>
        {hasRun && (
          <div className="continue-card">
            <div>
              <strong>{initialName}</strong>
              <span>
                Week {week} - {money(cash)}
                {legacy > 0 ? ` · ★ Legacy ${legacy} (+${legacy * 25}%)` : ''}
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
        <button
          type="button"
          className="save-backup-toggle"
          aria-expanded={backupOpen}
          onClick={() => setBackupOpen((open) => !open)}
        >
          <HardDriveDownload size={15} />
          <span>Save backup</span>
        </button>
        {backupOpen && (
          <div className="save-backup" aria-label="Save backup">
            <textarea
              rows={4}
              value={backupText}
              placeholder="Export fills this box — or paste a backup here and press Import."
              onChange={(event) => setBackupText(event.target.value)}
            />
            <div className="save-backup-actions">
              <button type="button" onClick={handleExport}>
                Export
              </button>
              <button type="button" onClick={handleImport}>
                Import
              </button>
            </div>
            {backupStatus && <span className="save-backup-status">{backupStatus}</span>}
          </div>
        )}
      </form>
    </section>
  )
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}
