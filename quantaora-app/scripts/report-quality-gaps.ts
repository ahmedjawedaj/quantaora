import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { HIERARCHY } from '../src/data/hierarchy.ts'
import { MODEL_ASSETS, type AssetQualityTier } from '../src/data/modelRegistry.ts'
import type { SubjectId } from '../src/data/types.ts'
import { branchVisualQualityProfile } from '../src/data/visualQualityRubric.ts'

const OUT_PATH = join(process.cwd(), '..', 'docs', 'TODAY-P0-P1-GAP-REPORT.md')

const SUBJECT_LABEL: Record<SubjectId, string> = {
  biology: 'Biology',
  chemistry: 'Chemistry',
  math: 'Math',
  physics: 'Physics',
  space: 'Space',
}

const FLAGSHIP_BRANCHES = new Set([
  'human-anatomy',
  'human-physiology',
  'genetics',
  'ecology',
  'plants',
  'microbiology',
  'atoms-and-elements',
  'periodic-table',
  'molecules-and-bonding',
  'chemical-reactions',
  'number-and-arithmetic',
  'fractions-and-ratios',
  'algebra',
  'geometry',
  'data-and-statistics',
  'electricity',
  'mechanics',
  'energy',
  'solar-system',
  'stars',
  'galaxies',
  'earth-in-space',
])

const P0_ASSET_BRANCHES = new Set([
  'cell-biology',
  'animals',
  'evolution',
  'health-and-disease',
  'neuroscience',
  'biochemistry-foundations',
  'states-of-matter',
  'acids-and-bases',
  'solutions',
  'stoichiometry-foundations',
  'biochemistry-links',
  'light-and-optics',
  'magnetism',
  'waves',
  'sound',
  'fluids',
  'modern-physics-foundations',
  'gravity-and-orbits',
  'asteroids-and-comets',
  'space-exploration',
  'cosmology-foundations',
  'telescopes-and-observation',
])

const P1_DEPTH_TESTS: Record<string, string[]> = {
  'cell-biology': ['src/routes/cellBiologyP1Depth.test.ts'],
  'human-physiology': ['src/routes/physiologyP1Depth.test.ts'],
  genetics: ['src/routes/geneticsP1Depth.test.ts'],
  ecology: ['src/routes/ecologyP1Depth.test.ts'],
  plants: ['src/routes/plantsP1Depth.test.ts'],
  microbiology: ['src/routes/microbiologyP1Depth.test.ts'],
  'atoms-and-elements': ['src/routes/atomsP1Depth.test.ts'],
  'periodic-table': ['src/routes/atomsP1Depth.test.ts'],
  'molecules-and-bonding': ['src/routes/moleculesP1Depth.test.ts'],
  'chemical-reactions': ['src/routes/chemistryQualityCoverage.test.ts'],
  'number-and-arithmetic': ['src/routes/numberSenseP1Depth.test.ts'],
  'fractions-and-ratios': ['src/routes/mathHandsOnCoverageWave.test.ts'],
  algebra: ['src/routes/algebraP1Depth.test.ts'],
  geometry: ['src/routes/mathHandsOnCoverageWave.test.ts'],
  'data-and-statistics': ['src/routes/mathHandsOnCoverageWave.test.ts'],
  measurement: ['src/data/measurement.test.ts'],
  'graphs-and-functions': ['src/data/graphsAndFunctionsControls.test.ts'],
  'trigonometry-foundations': ['src/data/mathSpaceAdvancedBranches.test.ts'],
  'calculus-foundations': ['src/data/foundationBranches.test.ts'],
  electricity: ['src/routes/electricityCircuitInspection.test.ts'],
  mechanics: ['src/routes/mechanicsCriticalMissions.test.ts'],
  energy: ['src/routes/energyP1Depth.test.ts'],
  'solar-system': ['src/routes/spaceMotionP1Depth.test.ts'],
  stars: ['src/routes/spaceObjectsP1Depth.test.ts'],
  galaxies: ['src/routes/spaceObjectsP1Depth.test.ts'],
  moons: ['src/routes/moonsP1Depth.test.ts'],
  'earth-in-space': ['src/routes/spaceMotionP1Depth.test.ts'],
  'organic-chemistry-foundations': ['src/data/foundationBranches.test.ts'],
  evolution: ['src/data/biologyRemainingBranches.test.ts'],
  animals: ['src/data/biologyRemainingBranches.test.ts'],
  'health-and-disease': ['src/data/biologyRemainingBranches.test.ts'],
  neuroscience: ['src/data/biologyRemainingBranches.test.ts'],
  'biochemistry-foundations': ['src/data/biologyRemainingBranches.test.ts'],
  'states-of-matter': ['src/data/chemistryEverydayBranches.test.ts'],
  'acids-and-bases': ['src/data/chemistryEverydayBranches.test.ts'],
  solutions: ['src/data/chemistryEverydayBranches.test.ts'],
  'stoichiometry-foundations': ['src/data/foundationBranches.test.ts'],
  'biochemistry-links': ['src/data/foundationBranches.test.ts'],
  waves: ['src/data/physicsEverydayBranches.test.ts'],
  sound: ['src/data/physicsEverydayBranches.test.ts'],
  'light-and-optics': ['src/data/physicsEverydayBranches.test.ts'],
  magnetism: ['src/data/physicsEverydayBranches.test.ts'],
  fluids: ['src/data/physicsEverydayBranches.test.ts'],
  'heat-and-thermodynamics': ['src/data/physicsEverydayBranches.test.ts'],
  'modern-physics-foundations': ['src/data/foundationBranches.test.ts'],
  'gravity-and-orbits': ['src/data/mathSpaceAdvancedBranches.test.ts'],
  'cosmology-foundations': ['src/data/mathSpaceAdvancedBranches.test.ts'],
  'asteroids-and-comets': ['src/data/asteroidsAndComets.test.ts'],
  'space-exploration': ['src/data/spaceExploration.test.ts'],
  'telescopes-and-observation': ['src/data/telescopesAndObservation.test.ts'],
}

interface BranchAssetCounts {
  hero: number
  support: number
  preview: number
  review: number
  paidRisk: number
}

function emptyCounts(): BranchAssetCounts {
  return { hero: 0, support: 0, preview: 0, review: 0, paidRisk: 0 }
}

function qualityLabel(counts: BranchAssetCounts, componentCount: number, branchId: string) {
  if (FLAGSHIP_BRANCHES.has(branchId) && counts.review === 0 && counts.paidRisk === 0) return 'flagship/interactive'
  if (counts.hero >= componentCount && counts.review === 0 && counts.paidRisk === 0) return 'hero-complete'
  if (counts.hero > 0 || counts.support > 0) return 'asset-partial'
  return 'procedural/preview'
}

function hasP1DepthProof(branchId: string) {
  const tests = P1_DEPTH_TESTS[branchId] ?? []
  return tests.length > 0 && tests.every((testPath) => existsSync(join(process.cwd(), testPath)))
}

function priorityLabel(branchId: string, counts: BranchAssetCounts, componentCount: number, p1DepthProof: boolean) {
  const visualProfile = branchVisualQualityProfile(branchId)
  if (counts.review > 0 || counts.paidRisk > 0) return 'P0 legal'
  if (visualProfile?.replacementPriority === 'P0 legal') return 'P0 legal'
  if (P0_ASSET_BRANCHES.has(branchId) && counts.hero + counts.support < componentCount) return 'P0 asset'
  if (visualProfile?.replacementPriority === 'P1') return 'P1 asset realism'
  if (p1DepthProof) return 'P1 visual QA'
  if (FLAGSHIP_BRANCHES.has(branchId)) return 'P1 deepen'
  return 'P1 polish'
}

const assetCountsByBranch = new Map<string, BranchAssetCounts>()

for (const asset of MODEL_ASSETS) {
  if (!asset.branch) continue
  const counts = assetCountsByBranch.get(asset.branch) ?? emptyCounts()
  const tier: AssetQualityTier = asset.qualityTier
  counts[tier] += asset.componentIds.length
  if (asset.licenseStatus === 'REVIEW') counts.review += asset.componentIds.length
  if (asset.licenseStatus === 'NC-RISK' || asset.replaceBeforePaidLaunch) counts.paidRisk += asset.componentIds.length
  assetCountsByBranch.set(asset.branch, counts)
}

const rows = Object.entries(HIERARCHY).flatMap(([subjectId, subject]) =>
  subject.branches.map((branch) => {
    const counts = assetCountsByBranch.get(branch.id) ?? emptyCounts()
    const covered = counts.hero + counts.support + counts.preview
    const missing = Math.max(0, branch.componentCount - covered)
    const p1DepthProof = hasP1DepthProof(branch.id)
    const visualProfile = branchVisualQualityProfile(branch.id)
    return {
      subjectId: subjectId as SubjectId,
      branchId: branch.id,
      branchName: branch.name,
      route: branch.route ?? '',
      components: branch.componentCount,
      counts,
      missing,
      p1DepthProof,
      visualProfile,
      quality: qualityLabel(counts, branch.componentCount, branch.id),
      priority: priorityLabel(branch.id, counts, branch.componentCount, p1DepthProof),
    }
  }),
)

const priorityOrder = new Map([
  ['P0 legal', 0],
  ['P0 asset', 1],
  ['P1 deepen', 2],
  ['P1 polish', 3],
  ['P1 asset realism', 4],
  ['P1 visual QA', 5],
])

const sortedRows = [...rows].sort((a, b) => {
  const p = (priorityOrder.get(a.priority) ?? 99) - (priorityOrder.get(b.priority) ?? 99)
  if (p !== 0) return p
  return b.missing - a.missing
})

const totals = rows.reduce(
  (acc, row) => {
    acc.components += row.components
    acc.hero += row.counts.hero
    acc.support += row.counts.support
    acc.preview += row.counts.preview
    acc.missing += row.missing
    acc.review += row.counts.review
    acc.paidRisk += row.counts.paidRisk
    acc.p0 += row.priority.startsWith('P0') ? 1 : 0
    acc.p1 += row.priority.startsWith('P1') && row.priority !== 'P1 visual QA' ? 1 : 0
    acc.p1DepthProof += row.p1DepthProof ? 1 : 0
    acc.p1AssetRealism += row.priority === 'P1 asset realism' ? 1 : 0
    return acc
  },
  { components: 0, hero: 0, support: 0, preview: 0, missing: 0, review: 0, paidRisk: 0, p0: 0, p1: 0, p1DepthProof: 0, p1AssetRealism: 0 },
)

const lines = [
  '# Today P0/P1 Gap Report',
  '',
  'Generated by `npm run quality:gaps`. This report is intentionally operational: it identifies where breadth is live but asset/product depth still needs work.',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  `- Branches audited: ${rows.length}`,
  `- Components declared in hierarchy: ${totals.components}`,
  `- Hero component mappings: ${totals.hero}`,
  `- Support component mappings: ${totals.support}`,
  `- Preview component mappings: ${totals.preview}`,
  `- Components without a registered asset mapping: ${totals.missing}`,
  `- REVIEW mappings: ${totals.review}`,
  `- Paid-release-risk mappings: ${totals.paidRisk}`,
  `- Branches with P1 depth proof: ${totals.p1DepthProof}`,
  `- P0 branches: ${totals.p0}`,
  `- P1 branches still needing depth/product work: ${totals.p1}`,
  `- P1 branches needing anatomy-bar asset realism: ${totals.p1AssetRealism}`,
  '',
  '## Execution Order',
  '',
  '| Priority | Subject | Branch | Components | Hero | Support | Missing asset map | Risk | P1 proof | Quality | Route | Visual grade | Replacement target |',
  '| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |',
  ...sortedRows.map((row) => {
    const risk = row.counts.review + row.counts.paidRisk
    return `| ${row.priority} | ${SUBJECT_LABEL[row.subjectId]} | ${row.branchName} | ${row.components} | ${row.counts.hero} | ${row.counts.support} | ${row.missing} | ${risk} | ${row.p1DepthProof ? 'yes' : 'no'} | ${row.quality} | ${row.route || '-'} | ${row.visualProfile?.grade ?? 'ungraded'} | ${row.visualProfile?.sourcingTargets.slice(0, 3).join('; ') ?? '-'} |`
  }),
  '',
  '## How To Use This',
  '',
  '- P0 legal: clear or replace REVIEW/paid-risk assets before any paid launch.',
  '- P0 asset: source/register/wire high-recognizability GLBs or build bespoke flagship scenes.',
  '- P1 deepen: branch is already a flagship or strong simulator; add richer challenges, compare paths, saved missions, and visual QA.',
  '- P1 asset realism: coverage exists, but visuals are below the Human Anatomy quality benchmark and need sourced/artist-grade GLB replacement.',
  '- P1 polish: improve product polish after the P0 asset and flagship work is done.',
  '- P1 visual QA: depth proof exists; next work is browser/screenshot review, visual defects, or asset upgrades.',
  '',
]

mkdirSync(join(process.cwd(), '..', 'docs'), { recursive: true })
writeFileSync(OUT_PATH, `${lines.join('\n')}\n`)
console.log(`Wrote ${OUT_PATH}`)
