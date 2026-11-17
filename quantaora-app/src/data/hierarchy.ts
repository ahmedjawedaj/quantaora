import type { SubjectId } from './types'

/** US grade numbers. Quantaora targets ages 8–16, which maps to grades 3–10.
 *  K–2 is deliberately out of scope: pre-readers need an audio-first product with
 *  far simpler interaction, not 3D hotspot labs and text structure cards. */
export const GRADE_MIN = 3
export const GRADE_MAX = 10

export interface GradeBand {
  id: string
  label: string
  short: string
  min: number
  max: number
}

export const GRADE_BANDS: GradeBand[] = [
  { id: 'lower', label: 'Grades 3–5', short: '3–5', min: 3, max: 5 },
  { id: 'middle', label: 'Grades 6–8', short: '6–8', min: 6, max: 8 },
  { id: 'upper', label: 'Grades 9–10', short: '9–10', min: 9, max: 10 },
]

export interface BranchInfo {
  id: string
  name: string
  /** live = real interactive components exist today. authored-pending = spec-sourced,
   *  ready for content-agent authoring, not yet built. planned = needs SME sourcing first. */
  status: 'live' | 'authored-pending' | 'planned'
  /** Inclusive US grade range this branch is pitched at. */
  gradeMin: number
  gradeMax: number
  componentCount?: number
  /** App route for this branch's lab. Present iff status === 'live'. */
  route?: string
}

export interface SubjectHierarchy {
  id: SubjectId
  name: string
  branches: BranchInfo[]
}

// Transcribed from content/taxonomy/*.json (source: docs/quantaora-product-tech-spec.md §6).
// Keep in sync with that file — it is the single source of truth for the full branch list.
export const HIERARCHY: Record<SubjectId, SubjectHierarchy> = {
  biology: {
    id: 'biology',
    name: 'Biology',
    branches: [
      { id: 'cell-biology', name: 'Cell Biology', status: 'live', componentCount: 8, route: '/app/labs/cells', gradeMin: 6, gradeMax: 8 },
      { id: 'human-anatomy', name: 'Human Anatomy', status: 'live', componentCount: 9, route: '/app', gradeMin: 3, gradeMax: 8 },
      { id: 'human-physiology', name: 'Human Physiology', status: 'live', componentCount: 9, route: '/app/labs/physiology', gradeMin: 6, gradeMax: 10 },
      { id: 'genetics', name: 'Genetics', status: 'live', componentCount: 10, route: '/app/labs/genetics', gradeMin: 7, gradeMax: 10 },
      { id: 'evolution', name: 'Evolution', status: 'live', componentCount: 5, route: '/app/labs/branch/evolution', gradeMin: 7, gradeMax: 10 },
      { id: 'ecology', name: 'Ecology', status: 'live', componentCount: 11, route: '/app/labs/ecology', gradeMin: 4, gradeMax: 8 },
      { id: 'plants', name: 'Plants', status: 'live', componentCount: 9, route: '/app/labs/plants', gradeMin: 3, gradeMax: 8 },
      { id: 'animals', name: 'Animals', status: 'live', componentCount: 5, route: '/app/labs/branch/animals', gradeMin: 3, gradeMax: 5 },
      { id: 'microbiology', name: 'Microbiology', status: 'live', componentCount: 5, route: '/app/labs/microbiology', gradeMin: 7, gradeMax: 10 },
      { id: 'health-and-disease', name: 'Health And Disease', status: 'live', componentCount: 5, route: '/app/labs/branch/health-and-disease', gradeMin: 6, gradeMax: 10 },
      { id: 'neuroscience', name: 'Neuroscience', status: 'live', componentCount: 5, route: '/app/labs/branch/neuroscience', gradeMin: 9, gradeMax: 10 },
      { id: 'biochemistry-foundations', name: 'Biochemistry Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/biochemistry-foundations', gradeMin: 10, gradeMax: 10 },
    ],
  },
  chemistry: {
    id: 'chemistry',
    name: 'Chemistry',
    branches: [
      { id: 'atoms-and-elements', name: 'Atoms And Elements', status: 'live', componentCount: 9, route: '/app/labs/atoms', gradeMin: 6, gradeMax: 8 },
      { id: 'periodic-table', name: 'Periodic Table', status: 'live', componentCount: 10, route: '/app/labs/atoms', gradeMin: 7, gradeMax: 10 },
      { id: 'molecules-and-bonding', name: 'Molecules And Bonding', status: 'live', componentCount: 4, route: '/app/labs/molecules', gradeMin: 7, gradeMax: 10 },
      { id: 'chemical-reactions', name: 'Chemical Reactions', status: 'live', componentCount: 7, route: '/app/labs/reactions', gradeMin: 7, gradeMax: 10 },
      { id: 'states-of-matter', name: 'States Of Matter', status: 'live', componentCount: 5, route: '/app/labs/branch/states-of-matter', gradeMin: 3, gradeMax: 7 },
      { id: 'acids-and-bases', name: 'Acids And Bases', status: 'live', componentCount: 5, route: '/app/labs/branch/acids-and-bases', gradeMin: 7, gradeMax: 10 },
      { id: 'solutions', name: 'Solutions', status: 'live', componentCount: 5, route: '/app/labs/branch/solutions', gradeMin: 7, gradeMax: 10 },
      { id: 'stoichiometry-foundations', name: 'Stoichiometry Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/stoichiometry-foundations', gradeMin: 10, gradeMax: 10 },
      { id: 'organic-chemistry-foundations', name: 'Organic Chemistry Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/organic-chemistry-foundations', gradeMin: 10, gradeMax: 10 },
      { id: 'biochemistry-links', name: 'Biochemistry Links', status: 'live', componentCount: 5, route: '/app/labs/branch/biochemistry-links', gradeMin: 10, gradeMax: 10 },
    ],
  },
  math: {
    id: 'math',
    name: 'Math',
    branches: [
      { id: 'number-and-arithmetic', name: 'Number Sense And Arithmetic', status: 'live', componentCount: 10, route: '/app/labs/number-sense', gradeMin: 3, gradeMax: 5 },
      { id: 'fractions-and-ratios', name: 'Fractions And Ratios', status: 'live', componentCount: 8, route: '/app/labs/math-manipulatives', gradeMin: 3, gradeMax: 7 },
      { id: 'algebra', name: 'Algebra', status: 'live', componentCount: 5, route: '/app/labs/functions', gradeMin: 7, gradeMax: 10 },
      { id: 'geometry', name: 'Geometry', status: 'live', componentCount: 11, route: '/app/labs/math-manipulatives', gradeMin: 6, gradeMax: 10},
      { id: 'measurement', name: 'Measurement', status: 'live', componentCount: 5, route: '/app/labs/branch/measurement', gradeMin: 3, gradeMax: 5 },
      { id: 'graphs-and-functions', name: 'Graphs And Functions', status: 'live', componentCount: 5, route: '/app/labs/branch/graphs-and-functions', gradeMin: 7, gradeMax: 10 },
      { id: 'data-and-statistics', name: 'Data And Statistics', status: 'live', componentCount: 10, route: '/app/labs/math-manipulatives', gradeMin: 4, gradeMax: 10 },
      { id: 'trigonometry-foundations', name: 'Trigonometry Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/trigonometry-foundations', gradeMin: 9, gradeMax: 10 },
      { id: 'calculus-foundations', name: 'Calculus Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/calculus-foundations', gradeMin: 10, gradeMax: 10 },
    ],
  },
  physics: {
    id: 'physics',
    name: 'Physics',
    branches: [
      { id: 'mechanics', name: 'Mechanics', status: 'live', componentCount: 13, route: '/app/labs/motion', gradeMin: 6, gradeMax: 10 },
      { id: 'energy', name: 'Energy', status: 'live', componentCount: 6, route: '/app/labs/energy', gradeMin: 4, gradeMax: 10 },
      { id: 'waves', name: 'Waves', status: 'live', componentCount: 4, route: '/app/labs/branch/waves', gradeMin: 7, gradeMax: 10 },
      { id: 'sound', name: 'Sound', status: 'live', componentCount: 5, route: '/app/labs/branch/sound', gradeMin: 3, gradeMax: 7 },
      { id: 'light-and-optics', name: 'Light And Optics', status: 'live', componentCount: 4, route: '/app/labs/branch/light-and-optics', gradeMin: 4, gradeMax: 8 },
      { id: 'electricity', name: 'Electricity', status: 'live', componentCount: 9, route: '/app/labs/electricity', gradeMin: 6, gradeMax: 10 },
      { id: 'magnetism', name: 'Magnetism', status: 'live', componentCount: 4, route: '/app/labs/branch/magnetism', gradeMin: 4, gradeMax: 8 },
      { id: 'fluids', name: 'Fluids', status: 'live', componentCount: 4, route: '/app/labs/branch/fluids', gradeMin: 9, gradeMax: 10 },
      { id: 'heat-and-thermodynamics', name: 'Heat And Thermodynamics', status: 'live', componentCount: 5, route: '/app/labs/branch/heat-and-thermodynamics', gradeMin: 7, gradeMax: 10 },
      { id: 'modern-physics-foundations', name: 'Modern Physics Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/modern-physics-foundations', gradeMin: 10, gradeMax: 10 },
    ],
  },
  space: {
    id: 'space',
    name: 'Space',
    branches: [
      { id: 'solar-system', name: 'Solar System', status: 'live', componentCount: 8, route: '/app/labs/orbit', gradeMin: 3, gradeMax: 8 },
      { id: 'stars', name: 'Stars', status: 'live', componentCount: 7, route: '/app/labs/stars', gradeMin: 6, gradeMax: 10 },
      { id: 'galaxies', name: 'Galaxies', status: 'live', componentCount: 2, route: '/app/labs/galaxies', gradeMin: 7, gradeMax: 10 },
      { id: 'gravity-and-orbits', name: 'Gravity And Orbits', status: 'live', componentCount: 5, route: '/app/labs/branch/gravity-and-orbits', gradeMin: 7, gradeMax: 10 },
      { id: 'moons', name: 'Moons', status: 'live', componentCount: 5, route: '/app/labs/moons', gradeMin: 3, gradeMax: 7 },
      { id: 'asteroids-and-comets', name: 'Asteroids And Comets', status: 'live', componentCount: 3, route: '/app/labs/branch/asteroids-and-comets', gradeMin: 4, gradeMax: 8 },
      { id: 'space-exploration', name: 'Space Exploration', status: 'live', componentCount: 2, route: '/app/labs/branch/space-exploration', gradeMin: 3, gradeMax: 8 },
      { id: 'cosmology-foundations', name: 'Cosmology Foundations', status: 'live', componentCount: 5, route: '/app/labs/branch/cosmology-foundations', gradeMin: 10, gradeMax: 10 },
      { id: 'telescopes-and-observation', name: 'Telescopes And Observation', status: 'live', componentCount: 4, route: '/app/labs/branch/telescopes-and-observation', gradeMin: 4, gradeMax: 8 },
      { id: 'earth-in-space', name: 'Earth In Space', status: 'live', componentCount: 5, route: '/app/labs/earth-in-space', gradeMin: 3, gradeMax: 7 },
    ],
  },
}

/** True when a branch overlaps the given grade at all. Grade is a viewport, never a gate —
 *  callers use this to sort and default-filter, not to lock content away. */
export function branchMatchesGrade(branch: BranchInfo, grade: number): boolean {
  return grade >= branch.gradeMin && grade <= branch.gradeMax
}

export function bandForGrade(grade: number): GradeBand | undefined {
  return GRADE_BANDS.find((b) => grade >= b.min && grade <= b.max)
}

/** Every live branch across all subjects, with its subject attached — the source of truth
 *  for the Labs index so it can never drift from what's actually routable. */
export function liveBranches(): { subject: SubjectHierarchy; branch: BranchInfo }[] {
  return Object.values(HIERARCHY).flatMap((subject) =>
    subject.branches
      .filter((b) => b.status === 'live' && b.route)
      .map((branch) => ({ subject, branch })),
  )
}
