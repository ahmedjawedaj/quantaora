import { molecules, moleculeById } from './molecules'
import { planets, planetById } from './planets'
import { scenarios, scenarioById } from './functions'
import { motionLab } from './motionLab'
import { physiologyProcesses, physiologyProcessById } from './generated/human_physiology'
import { cells, cellById } from './cells'
import { stars, starById } from './stars'
import { galaxies, galaxyById } from './galaxies'
import type { ComponentContent } from './types'
import { BRANCH_COMPONENTS } from './branchModules'

// `organs` (human-anatomy's 9 GLB-matched components) is not spread here directly — it's folded
// into BRANCH_COMPONENTS['human-anatomy'] by branchModules.ts, which is the one place that
// resolves the organs-vs-codegen'd-content id overlap. Spreading `organs` again here would
// reintroduce the duplicate-id problem that fix exists to prevent.
/** Every live component across all subjects, in a stable authored order. */
export const ALL_CONTENT: ComponentContent[] = [
  ...cells,
  ...physiologyProcesses,
  ...molecules,
  ...scenarios,
  ...planets,
  ...stars,
  ...galaxies,
  ...Object.values(BRANCH_COMPONENTS).flat(),
  motionLab,
]

const ALL_BY_ID: Record<string, ComponentContent> = {
  ...moleculeById,
  ...planetById,
  ...scenarioById,
  ...physiologyProcessById,
  ...cellById,
  ...starById,
  ...galaxyById,
  ...Object.fromEntries(Object.values(BRANCH_COMPONENTS).flat().map((c) => [c.id, c])),
  [motionLab.id]: motionLab,
}

export function resolveContent(id: string): ComponentContent | null {
  return ALL_BY_ID[id] ?? null
}
