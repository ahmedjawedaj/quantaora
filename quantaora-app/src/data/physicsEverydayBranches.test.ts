import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HIERARCHY } from './hierarchy.ts'
import { waves, wavesById } from './waves.ts'
import { sound, soundById } from './sound.ts'
import { fluids, fluidsById } from './fluids.ts'
import { heatAndThermodynamics, heatAndThermodynamicsById } from './heatAndThermodynamics.ts'
import { componentAssetResolution } from './modelRegistry.ts'
import { KNOWN_COMPOSITIONS } from '../lib/procedural/types.ts'
import type { ComponentContent } from './types.ts'

const branchModulesSource = readFileSync(new URL('./branchModules.ts', import.meta.url), 'utf8')
const allContentSource = readFileSync(new URL('./allContent.ts', import.meta.url), 'utf8')
const knownShapes = new Set<string>(KNOWN_COMPOSITIONS)
const REAL_GLB_COMPONENT_IDS = new Set([
  'physics-sound-vibration',
  'physics-sound-pitch',
  'physics-sound-volume',
  'physics-sound-medium',
  'physics-sound-echo',
  'physics-waves-crest-trough',
  'physics-waves-amplitude',
  'physics-waves-wavelength',
  'physics-waves-frequency',
  'physics-fluids-pressure',
  'physics-fluids-buoyancy',
  'physics-fluids-density',
  'physics-fluids-flow-viscosity',
  'physics-heat-temperature',
  'physics-heat-conduction',
  'physics-heat-convection',
  'physics-heat-radiation',
  'physics-heat-phase-change',
])

const branchData: Record<
  string,
  {
    name: string
    importName: string
    components: ComponentContent[]
    byId: Record<string, ComponentContent>
  }
> = {
  waves: {
    name: 'Waves',
    importName: 'waves',
    components: waves,
    byId: wavesById,
  },
  sound: {
    name: 'Sound',
    importName: 'sound',
    components: sound,
    byId: soundById,
  },
  fluids: {
    name: 'Fluids',
    importName: 'fluids',
    components: fluids,
    byId: fluidsById,
  },
  'heat-and-thermodynamics': {
    name: 'Heat And Thermodynamics',
    importName: 'heatAndThermodynamics',
    components: heatAndThermodynamics,
    byId: heatAndThermodynamicsById,
  },
}

const requiredTextFields = [
  'id',
  'name',
  'scientificName',
  'subject',
  'branch',
  'system',
  'tagline',
  'summary',
  'whyItMatters',
  'didYouKnow',
  'compareCandidate',
  'compareReason',
] as const

test('everyday physics branches are live on generic BranchLab routes', () => {
  for (const [branchId, branch] of Object.entries(branchData)) {
    const metadata = HIERARCHY.physics.branches.find((candidate) => candidate.id === branchId)
    assert.ok(metadata, `expected hierarchy metadata for ${branchId}`)
    assert.equal(metadata.status, 'live')
    assert.equal(metadata.componentCount, branch.components.length)
    assert.equal(metadata.route, `/app/labs/branch/${branchId}`)
    assert.ok(branch.components.length >= 3 && branch.components.length <= 5, `expected 3-5 components for ${branchId}`)
  }
})

test('everyday physics branches are registered for branchComponents and resolveContent', () => {
  assert.match(branchModulesSource, /export function branchComponents\(branchId: string\): ComponentContent\[\]/)
  assert.match(allContentSource, /\.\.\.Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)/, 'expected resolveContent index to include all branch components')
  assert.match(allContentSource, /Object\.fromEntries\(Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)\.map\(\(c\) => \[c\.id, c\]\)\)/, 'expected resolveContent lookup to index branch components by id')

  for (const [branchId, branch] of Object.entries(branchData)) {
    assert.match(branchModulesSource, new RegExp(`import \\{ ${branch.importName} \\} from './${branch.importName}'`))
    if (branchId === branch.importName) {
      assert.match(branchModulesSource, new RegExp(`\\b${branch.importName},`))
    } else {
      assert.match(branchModulesSource, new RegExp(`'${branchId}': ${branch.importName}`))
    }
  }
})

test('everyday physics components have complete content, lessons, quizzes, hotspots, and visuals', () => {
  for (const [branchId, branch] of Object.entries(branchData)) {
    for (const component of branch.components) {
      for (const field of requiredTextFields) {
      assert.equal(typeof component[field], 'string', `expected string ${field} for ${component.id}`)
        assert.ok(component[field].length > 0, `expected populated ${field} for ${component.id}`)
      }

      assert.equal(component.subject, 'physics')
      assert.equal(component.branch, branch.name)
      if (REAL_GLB_COMPONENT_IDS.has(component.id)) {
        const resolution = componentAssetResolution(component)
        assert.equal(resolution.status, 'ready', `expected registered GLB for ${component.id}`)
        assert.ok(resolution.asset, `expected asset metadata for ${component.id}`)
        assert.notEqual(resolution.asset.licenseStatus, 'REVIEW')
      } else {
        assert.equal(component.model, '', `expected ${component.id} to use procedural BranchLab visual instead of an unregistered GLB`)
      }
      assert.ok(component.belongsTo.length >= 3, `expected belongsTo for ${component.id}`)
      assert.ok(component.conditions.length >= 3, `expected conditions for ${component.id}`)
      assert.ok(component.keyFacts.length >= 4, `expected keyFacts for ${component.id}`)
      assert.ok(component.hotspots.length >= 3, `expected hotspots for ${component.id}`)
      assert.ok(component.visual?.shape, `expected procedural visual for ${component.id}`)
      assert.ok(knownShapes.has(component.visual.shape), `expected known visual shape for ${component.id}: ${component.visual.shape}`)

      assert.deepEqual(component.lesson.steps.map((step) => step.title), ['Predict', 'Change', 'Observe', 'Explain'])
      assert.ok(component.lesson.predictionPrompt.length > 0, `expected predictionPrompt for ${component.id}`)
      assert.ok(component.lesson.practiceItem.length > 0, `expected practiceItem for ${component.id}`)
      assert.ok(component.lesson.checkpoint.length > 0, `expected checkpoint for ${component.id}`)

      const lessonText = component.lesson.steps.map((step) => `${step.title} ${step.body}`).join(' ')
      for (const stage of ['Predict', 'Change', 'Observe', 'Explain']) {
        assert.match(lessonText, new RegExp(stage, 'i'), `expected visible ${stage} stage for ${component.id}`)
      }

      assert.ok(component.quiz.length >= 3, `expected quiz for ${component.id}`)
      for (const question of component.quiz) {
        assert.ok(question.prompt.length > 0, `expected quiz prompt for ${component.id}`)
        assert.ok(question.options.length >= 4, `expected quiz options for ${component.id}`)
        assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length, `expected valid correctIndex for ${component.id}`)
        assert.ok(question.explanation.length > 0, `expected quiz explanation for ${component.id}`)
        assert.ok(question.misconception.length > 0, `expected quiz misconception for ${component.id}`)
      }

      assert.notEqual(component.compareCandidate, component.id, `expected ${component.id} not to compare with itself`)
      assert.ok(branch.byId[component.compareCandidate], `expected compareCandidate to resolve inside ${branchId}: ${component.compareCandidate}`)
    }
  }
})

test('everyday physics compare links resolve both directions through branch id maps', () => {
  for (const branch of Object.values(branchData)) {
    for (const component of branch.components) {
      assert.equal(branch.byId[component.id]?.id, component.id)
      assert.equal(branch.byId[component.compareCandidate]?.id, component.compareCandidate)
    }
  }
})

test('heat and thermodynamics components teach visible cause and effect experiments', () => {
  const requiredById: Record<string, string[]> = {
    'physics-heat-temperature': ['thermometer', 'particle', 'warmer', 'cooler'],
    'physics-heat-conduction': ['heater', 'bar', 'contact', 'thermometer'],
    'physics-heat-convection': ['beaker', 'heater', 'rise', 'sink'],
    'physics-heat-radiation': ['lamp', 'distance', 'dark', 'shiny'],
    'physics-heat-phase-change': ['pressure', 'particle', 'plateau', 'solid', 'liquid', 'gas'],
  }

  for (const component of heatAndThermodynamics) {
    const text = [
      component.summary,
      ...component.keyFacts.flatMap((fact) => [fact.label, fact.value]),
      ...component.conditions,
      component.lesson.predictionPrompt,
      component.lesson.practiceItem,
      component.lesson.checkpoint,
      component.visual?.apparatus,
      ...(component.visual?.variables ?? []),
      ...component.hotspots.flatMap((hotspot) => [hotspot.label, hotspot.description, hotspot.function]),
    ].join(' ').toLowerCase()

    assert.ok(
      text.includes('change only') || text.includes('only the') || text.includes('one at a time'),
      `expected controlled-variable wording for ${component.id}`,
    )
    assert.ok(text.includes('visible') || text.includes('watch') || text.includes('shows'), `expected visible apparatus/effect wording for ${component.id}`)
    assert.ok(text.includes('cause') || text.includes('because') || text.includes('so '), `expected cause/effect wording for ${component.id}`)
    assert.ok(
      component.keyFacts.some((fact) => fact.label === 'Apparatus') &&
        component.keyFacts.some((fact) => fact.label === 'Variable') &&
        component.keyFacts.some((fact) => fact.label === 'Visible effect'),
      `expected P1 experiment fact labels for ${component.id}`,
    )

    for (const term of requiredById[component.id] ?? []) {
      assert.match(text, new RegExp(`\\b${term}\\b`), `expected ${component.id} to mention ${term}`)
    }
  }
})
