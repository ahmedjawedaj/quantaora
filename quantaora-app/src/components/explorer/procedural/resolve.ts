/**
 * L3 — branch-aware procedural resolver (docs/PROCEDURAL-VISUALS.md).
 *
 * Precedence: authored `visual.shape` (L2) → branch default (L3) → subject fallback
 * (the historical per-subject solid). The resolver returns a shape id; GenericModel
 * renders the composition when known, else falls back to the subject solid so nothing
 * ever renders blank.
 */
import type { ProceduralVisual } from '@/lib/procedural/types'
import type { SubjectId } from '@/data/types'

/** Branch defaults so nothing in any branch renders a generic subject solid. */
const BRANCH_DEFAULTS: Record<string, Record<string, string>> = {
  math: {
    geometry: 'quad-prism',
    'number-and-arithmetic': 'place-value-blocks',
    'fractions-and-ratios': 'fraction-bar',
    algebra: 'expression-tiles',
    'data-and-statistics': 'bar-chart-3bars',
  },
  physics: {
    mechanics: 'force-push',
    energy: 'kinetic-roller',
    electricity: 'battery-cell',
  },
  chemistry: {
    'atoms-and-elements': 'atom-shells',
    'molecules-and-bonding': 'molecule-balls',
    'chemical-reactions': 'reaction-flow',
    'periodic-table': 'element-tile',
  },
  biology: {
    'cell-biology': 'cell-sphere',
    ecology: 'producer-plant',
    genetics: 'dna-helix',
    'human-anatomy': 'bone-joint',
    'human-physiology': 'blood-loop',
    microbiology: 'bacteria-rod',
    plants: 'leaf-veins',
  },
  space: {
    galaxies: 'orbit-loop',
    'solar-system': 'orbit-loop',
    stars: 'main-star',
  },
}

export function resolveProceduralShape(
  visual: ProceduralVisual | undefined,
  subject: SubjectId,
  branch: string,
): string | undefined {
  if (visual?.shape) return visual.shape
  return BRANCH_DEFAULTS[subject]?.[branch]
}