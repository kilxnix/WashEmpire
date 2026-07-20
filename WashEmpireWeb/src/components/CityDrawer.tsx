import { Check, Hammer, Lock, MapPinned, Navigation, X } from 'lucide-react'
import type { CityId, GameState } from '../game/types'
import {
  cityDefinitions,
  cityRestorationCost,
  currentCityDefinition,
  currentCityDistrict,
} from '../game/simulation'

interface CityDrawerProps {
  open: boolean
  state: GameState
  onBuy: (cityId: CityId) => void
  onRestore: (cityId: CityId) => void
  onSwitch: (cityId: CityId) => void
  onClose: () => void
}

export function CityDrawer({ open, state, onBuy, onRestore, onSwitch, onClose }: CityDrawerProps) {
  const currentCity = currentCityDefinition(state)
  const currentDistrict = currentCityDistrict(state)

  return (
    <aside className={`city-drawer ${open ? 'open' : ''}`} aria-hidden={!open}>
      <header>
        <div>
          <span className="mini-label">Floating city map</span>
          <h2>Districts</h2>
        </div>
        <button type="button" title="Close city map" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      <section className="city-current" aria-label="Current district">
        <MapPinned size={20} />
        <div>
          <strong>{currentCity.name}</strong>
          <span>Restoration {currentDistrict.restoration}/5</span>
        </div>
      </section>

      <div className="city-list">
        {cityDefinitions.map((city) => {
          const district = state.cityMap.districts.find((item) => item.id === city.id)
          const owned = Boolean(district?.owned)
          const active = state.cityMap.currentCityId === city.id
          const restoreCost = cityRestorationCost(state.cityMap, city.id)
          const canRestore = owned && (district?.restoration ?? 0) < 5 && state.cash >= restoreCost
          const canBuy = !owned && state.cash >= city.purchaseCost

          return (
            <article className={active ? 'active' : owned ? 'owned' : ''} key={city.id}>
              <div className="upgrade-icon">
                {active ? <Navigation size={18} /> : owned ? <Check size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <div className="upgrade-title-row">
                  <h3>{city.name}</h3>
                  <span className="level-pill">{cityThemeLabel(city.theme)}</span>
                  <span className="level-pill">{city.washModel === 'conveyor' ? 'Auto tunnel' : `${city.bayCount} bays`}</span>
                  <span className="level-pill">Traffic x{city.trafficMultiplier.toFixed(2)}</span>
                </div>
                <p>{city.story}</p>
                <span>{city.visual}</span>
                <div className="restore-meter" aria-label={`${city.name} restoration`}>
                  <i style={{ width: `${((district?.restoration ?? 0) / 5) * 100}%` }} />
                </div>
              </div>
              <div className="city-actions">
                {owned ? (
                  <>
                    <button type="button" disabled={active} onClick={() => onSwitch(city.id)}>
                      {active ? 'Here' : 'Move'}
                    </button>
                    <button
                      type="button"
                      disabled={!canRestore}
                      title={
                        canRestore
                          ? `Improve this district's restoration (level ${(district?.restoration ?? 0) + 1}/5)`
                          : (district?.restoration ?? 0) >= 5
                            ? 'Fully restored'
                            : 'Not enough cash to restore'
                      }
                      onClick={() => onRestore(city.id)}
                    >
                      <Hammer size={15} />
                      <span>
                        {canRestore || (district?.restoration ?? 0) < 5
                          ? `Restore ${money(restoreCost)}`
                          : 'Restored'}
                      </span>
                    </button>
                  </>
                ) : (
                  <button type="button" disabled={!canBuy} title="Buy this district wash" onClick={() => onBuy(city.id)}>
                    Buy {money(city.purchaseCost)}
                  </button>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </aside>
  )
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}

function cityThemeLabel(theme: string): string {
  if (theme === 'smallTown') return 'Small'
  if (theme === 'harbor') return 'Harbor'
  if (theme === 'downtown') return 'City'
  if (theme === 'snow') return 'Snow'
  return 'Auto'
}
