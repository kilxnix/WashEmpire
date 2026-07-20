import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

function readProjectFile(relativePath) {
  return readFileSync(path.join(root, relativePath), 'utf8')
}

function getSection(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  const end = source.indexOf(endMarker, start + startMarker.length)
  if (start === -1 || end === -1) {
    throw new Error(`Could not find section between "${startMarker}" and "${endMarker}".`)
  }

  return source.slice(start, end)
}

function unique(values) {
  return [...new Set(values)]
}

const simulation = readProjectFile('src/game/simulation.ts')
const environmentRewards = readProjectFile('src/game/environmentRewards.ts')
const washScene = readProjectFile('src/components/WashScene.tsx')

const lotUpgradeSection = getSection(
  simulation,
  'export const upgradeDefinitions',
  'export const bayUpgradeDefinitions',
)
const upgradeIds = unique([...lotUpgradeSection.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]))
const coveredUpgradeIds = unique([...environmentRewards.matchAll(/upgradeId:\s*'([^']+)'/g)].map((match) => match[1]))
const bayUpgradeSection = getSection(
  simulation,
  'export const bayUpgradeDefinitions',
  'export const employeeDefinitions',
)
const bayUpgradeIds = unique([...bayUpgradeSection.matchAll(/id:\s*'([^']+)'/g)].map((match) => match[1]))

const visualIdSection = getSection(
  environmentRewards,
  'export type EnvironmentRewardVisualId',
  'export interface EnvironmentRewardDefinition',
)
const visualIds = unique([...visualIdSection.matchAll(/'([^']+)'/g)].map((match) => match[1]))

const missingUpgradeMappings = upgradeIds.filter((id) => !coveredUpgradeIds.includes(id))
const missingSceneVisuals = visualIds.filter((id) => !washScene.includes(id))
const bayVisualMarkers = {
  selector: ['SelectorUpgradeProps', 'selector-upgrade-dial'],
  wand: ['WandUpgradeProps', 'wand-upgrade-hose-reel'],
  soap: ['SoapUpgradeProps', 'soap-tank'],
  rinse: ['RinseUpgradeProps', 'rinse-nozzle'],
  dryer: ['DryerUpgradeProps', 'dryer-air-stream'],
  vault: ['VaultUpgradeProps', 'vault-expanded-cabinet'],
}
const missingBayVisualMappings = bayUpgradeIds.filter((id) => !bayVisualMarkers[id])
const missingBaySceneVisuals = bayUpgradeIds.flatMap((id) => {
  const markers = bayVisualMarkers[id] ?? []
  return markers.filter((marker) => !washScene.includes(marker)).map((marker) => `${id}:${marker}`)
})

if (
  missingUpgradeMappings.length > 0 ||
  missingSceneVisuals.length > 0 ||
  missingBayVisualMappings.length > 0 ||
  missingBaySceneVisuals.length > 0
) {
  console.error('Visual reward audit failed.')

  if (missingUpgradeMappings.length > 0) {
    console.error(`Missing upgrade reward mappings: ${missingUpgradeMappings.join(', ')}`)
  }

  if (missingSceneVisuals.length > 0) {
    console.error(`Missing scene-backed visual ids: ${missingSceneVisuals.join(', ')}`)
  }

  if (missingBayVisualMappings.length > 0) {
    console.error(`Missing bay upgrade visual mappings: ${missingBayVisualMappings.join(', ')}`)
  }

  if (missingBaySceneVisuals.length > 0) {
    console.error(`Missing bay upgrade scene markers: ${missingBaySceneVisuals.join(', ')}`)
  }

  process.exit(1)
}

console.log(
  `Visual reward audit passed: ${upgradeIds.length} lot upgrades map to ${visualIds.length} scene-backed reward props; ${bayUpgradeIds.length} bay upgrades have scene-backed reward props.`,
)
