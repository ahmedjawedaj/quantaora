import type { ComponentContent } from './types'
import { organs } from './organs'
import { cell_biology } from './generated/cell_biology'
import { human_anatomy as human_anatomy_generated } from './generated/human_anatomy'
import { physiologyProcesses } from './generated/human_physiology'
import { genetics } from './generated/genetics'
import { ecology } from './generated/ecology'
import { plants } from './generated/plants'
import { microbiology } from './generated/microbiology'
import { evolution } from './evolution'
import { animals } from './animals'
import { healthAndDisease } from './healthAndDisease'
import { neuroscience } from './neuroscience'
import { biochemistryFoundations } from './biochemistryFoundations'
import { atoms_and_elements } from './generated/atoms_and_elements'
import { periodic_table } from './generated/periodic_table'
import { molecules_and_bonding } from './generated/molecules_and_bonding'
import { chemical_reactions } from './generated/chemical_reactions'
import { number_and_arithmetic } from './generated/number_and_arithmetic'
import { fractions_and_ratios } from './generated/fractions_and_ratios'
import { algebra } from './generated/algebra'
import { geometry } from './generated/geometry'
import { data_and_statistics } from './generated/data_and_statistics'
import { measurement } from './measurement'
import { energy } from './generated/energy'
import { mechanics } from './generated/mechanics'
import { electricity } from './generated/electricity'
import { lightAndOptics } from './lightAndOptics'
import { magnetism } from './magnetism'
import { waves } from './waves'
import { sound } from './sound'
import { fluids } from './fluids'
import { heatAndThermodynamics } from './heatAndThermodynamics'
import { solar_system } from './generated/solar_system'
import { stars } from './generated/stars'
import { galaxies } from './generated/galaxies'
import { earth_in_space } from './generated/earth_in_space'
import { asteroidsAndComets } from './asteroidsAndComets'
import { spaceExploration } from './spaceExploration'
import { telescopesAndObservation } from './telescopesAndObservation'
import { graphsAndFunctions } from './graphsAndFunctions'
import { trigonometryFoundations } from './trigonometryFoundations'
import { gravityAndOrbits } from './gravityAndOrbits'
import { cosmologyFoundations } from './cosmologyFoundations'
import { statesOfMatter } from './statesOfMatter'
import { acidsAndBases } from './acidsAndBases'
import { solutions } from './solutions'
import { stoichiometryFoundations } from './stoichiometryFoundations'
import { organicChemistryFoundations } from './organicChemistryFoundations'
import { biochemistryLinks } from './biochemistryLinks'
import { calculusFoundations } from './calculusFoundations'
import { modernPhysicsFoundations } from './modernPhysicsFoundations'

// `organs` (src/data/organs.ts) is the flagship /app route's hand-tuned source of truth for 9
// organs — real GLB models with hotspot coordinates matched to that exact mesh. The codegen'd
// `human_anatomy` module covers all 16 authored content/subjects/biology/human-anatomy/
// directories, 7 of which duplicate an id already in `organs` (heart, brain, lungs, liver,
// kidneys, pancreas, skin). Without this filter those 7 ids would exist twice across
// BRANCH_COMPONENTS and silently shadow the GLB-matched organ data wherever content is looked up
// by id (see allContent.ts). `organs` always wins for a shared id; the remaining 9 codegen'd
// components (blood-vessels, bones, ear, eye, large-intestine, muscles, small-intestine, spleen,
// stomach) are genuinely new and are appended so they're reachable via /app/labs/branch/
// human-anatomy instead of being authored-but-orphaned.
const organIds = new Set(organs.map((o) => o.id))
const human_anatomy: ComponentContent[] = [...organs, ...human_anatomy_generated.filter((c) => !organIds.has(c.id))]

/** Maps branch ids (as used in HIERARCHY and routes) to their generated modules. */
export const BRANCH_COMPONENTS: Record<string, ComponentContent[]> = {
  'cell-biology': cell_biology,
  'human-anatomy': human_anatomy,
  'human-physiology': physiologyProcesses,
  genetics,
  evolution,
  ecology,
  plants,
  animals,
  microbiology,
  'health-and-disease': healthAndDisease,
  neuroscience,
  'biochemistry-foundations': biochemistryFoundations,
  'atoms-and-elements': atoms_and_elements,
  'periodic-table': periodic_table,
  'molecules-and-bonding': molecules_and_bonding,
  'chemical-reactions': chemical_reactions,
  'states-of-matter': statesOfMatter,
  'acids-and-bases': acidsAndBases,
  solutions,
  'stoichiometry-foundations': stoichiometryFoundations,
  'organic-chemistry-foundations': organicChemistryFoundations,
  'biochemistry-links': biochemistryLinks,
  'number-and-arithmetic': number_and_arithmetic,
  'fractions-and-ratios': fractions_and_ratios,
  algebra,
  geometry,
  measurement,
  'graphs-and-functions': graphsAndFunctions,
  'data-and-statistics': data_and_statistics,
  'trigonometry-foundations': trigonometryFoundations,
  'calculus-foundations': calculusFoundations,
  energy,
  mechanics,
  electricity,
  'light-and-optics': lightAndOptics,
  magnetism,
  waves,
  sound,
  fluids,
  'heat-and-thermodynamics': heatAndThermodynamics,
  'modern-physics-foundations': modernPhysicsFoundations,
  'solar-system': solar_system,
  stars,
  galaxies,
  'gravity-and-orbits': gravityAndOrbits,
  'asteroids-and-comets': asteroidsAndComets,
  'space-exploration': spaceExploration,
  'cosmology-foundations': cosmologyFoundations,
  'telescopes-and-observation': telescopesAndObservation,
  'earth-in-space': earth_in_space,
}

export function branchComponents(branchId: string): ComponentContent[] {
  return BRANCH_COMPONENTS[branchId] ?? []
}
