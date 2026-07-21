import { Check, ChevronDown, Lock, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import { useScrollGuard } from './useScrollGuard'
import type { BayUpgradeId, EmployeeId, GameState, UpgradeId } from '../game/types'
import {
  activeBayCount,
  bayUpgradeCost,
  bayUpgradeDefinitions,
  bayUpgradeDisplay,
  currentCityDefinition,
  employeeDefinitions,
  progressionProgress,
  stallNoun,
  upgradeDefinitions,
} from '../game/simulation'

interface UpgradeDrawerProps {
  open: boolean
  state: GameState
  onBuy: (upgradeId: UpgradeId) => void
  onBuyBay: (bayIndex: number, upgradeId: BayUpgradeId) => void
  onHireEmployee: (employeeId: EmployeeId) => void
  onClose: () => void
}

type SectionId = 'bay' | 'lot' | 'employees'

export function UpgradeDrawer({ open, state, onBuy, onBuyBay, onHireEmployee, onClose }: UpgradeDrawerProps) {
  const [selectedBay, setSelectedBay] = useState(0)
  const [collapsed, setCollapsed] = useState<Record<SectionId, boolean>>({
    bay: false,
    lot: true,
    employees: true,
  })
  const { onScroll, guard } = useScrollGuard()
  const activeCount = activeBayCount(state)
  const selectedIndex = Math.min(selectedBay, activeCount - 1)
  const bayTabs = state.bays.slice(0, activeCount)
  const bay = bayTabs[selectedIndex] ?? state.bays[0]
  const city = currentCityDefinition(state)
  const progress = progressionProgress(state)

  function toggleSection(id: SectionId) {
    setCollapsed((current) => ({ ...current, [id]: !current[id] }))
  }

  return (
    <aside className={`upgrade-drawer ${open ? 'open' : ''}`} aria-hidden={!open} inert={!open}>
      <header>
        <div>
          <span className="mini-label">8-hour runway</span>
          <h2>Upgrades</h2>
        </div>
        <button type="button" title="Close upgrades" onClick={onClose}>
          <X size={18} />
        </button>
      </header>

      <div className="upgrade-progress">
        <span>
          {city.name}: {city.washModel === 'conveyor' ? '2 auto lanes' : `${activeCount} active bays`} — Empire{' '}
          {Math.round(progress * 100)}%
        </span>
        <div>
          <i style={{ width: `${progress * 100}%` }} />
        </div>
      </div>

      <div className="drawer-tabs" role="tablist" aria-label={`${stallNoun(state)} selector`}>
        {bayTabs.map((item, index) => (
          <button
            type="button"
            className={selectedIndex === index ? 'active' : ''}
            key={item.id}
            onClick={() => setSelectedBay(index)}
          >
            {stallNoun(state)} {item.id}
          </button>
        ))}
      </div>

      <div className="upgrade-list" onScroll={onScroll}>
        <SectionHeader
          title={`${stallNoun(state)} ${bay.id} Equipment`}
          open={!collapsed.bay}
          onToggle={() => toggleSection('bay')}
        />
        {!collapsed.bay &&
          bayUpgradeDefinitions.map((upgrade) => {
            const level = bay.upgrades[upgrade.id]
            const maxed = level >= upgrade.maxLevel
            const cost = bayUpgradeCost(upgrade.id, level, selectedIndex)
            const affordable = state.cash >= cost
            const display = bayUpgradeDisplay(state, upgrade.id)

            return (
              <article className={maxed ? 'owned' : ''} key={upgrade.id}>
                <div className="upgrade-icon">{maxed ? <Check size={18} /> : <Wrench size={18} />}</div>
                <div>
                  <div className="upgrade-title-row">
                    <h3>{display.name}</h3>
                    <span className="level-pill">
                      Lv {level}/{upgrade.maxLevel}
                    </span>
                  </div>
                  <p>{upgrade.effect}</p>
                  <span>{display.visual}</span>
                </div>
                <button
                  type="button"
                  disabled={maxed || !affordable}
                  onClick={guard(() => onBuyBay(selectedIndex, upgrade.id))}
                >
                  {maxed ? 'Max' : money(cost)}
                </button>
              </article>
            )
          })}

        <SectionHeader title="Lot Expansion" open={!collapsed.lot} onToggle={() => toggleSection('lot')} />
        {!collapsed.lot &&
          upgradeDefinitions.map((upgrade) => {
            const owned = state.upgrades[upgrade.id]
            const affordable = state.cash >= upgrade.cost
            const locked = !affordable && !owned

            return (
              <article className={owned ? 'owned' : ''} key={upgrade.id}>
                <div className="upgrade-icon">
                  {owned ? <Check size={18} /> : locked ? <Lock size={18} /> : <Wrench size={18} />}
                </div>
                <div>
                  <h3>{upgrade.name}</h3>
                  <p>{upgrade.effect}</p>
                  <span>{upgrade.visual}</span>
                </div>
                <button type="button" disabled={owned || !affordable} onClick={guard(() => onBuy(upgrade.id))}>
                  {owned ? 'Owned' : money(upgrade.cost)}
                </button>
              </article>
            )
          })}

        <SectionHeader title="Employees" open={!collapsed.employees} onToggle={() => toggleSection('employees')} />
        {!collapsed.employees &&
          employeeDefinitions.map((employee) => {
            const hired = state.employees[employee.id]
            const affordable = state.cash >= employee.hireCost

            return (
              <article className={hired ? 'owned' : ''} key={employee.id}>
                <div className="upgrade-icon">{hired ? <Check size={18} /> : <Wrench size={18} />}</div>
                <div>
                  <div className="upgrade-title-row">
                    <h3>{employee.name}</h3>
                    <span className="level-pill">{money(employee.weeklyWage)}/wk</span>
                  </div>
                  <p>{employee.effect}</p>
                  <span>{employee.visual}</span>
                </div>
                <button
                  type="button"
                  disabled={hired || !affordable}
                  onClick={guard(() => onHireEmployee(employee.id))}
                >
                  {hired ? 'Hired' : money(employee.hireCost)}
                </button>
              </article>
            )
          })}
      </div>
    </aside>
  )
}

function SectionHeader({
  title,
  open,
  onToggle,
}: {
  title: string
  open: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      className={`upgrade-section-toggle ${open ? 'open' : ''}`}
      onClick={onToggle}
      aria-expanded={open}
    >
      <span>{title}</span>
      <ChevronDown size={16} aria-hidden="true" />
    </button>
  )
}

function money(value: number): string {
  return `$${Math.round(value).toLocaleString()}`
}
