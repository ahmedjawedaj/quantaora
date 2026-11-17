import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { evolution } from './evolution.ts'
import { animals } from './animals.ts'
import { healthAndDisease } from './healthAndDisease.ts'
import { neuroscience } from './neuroscience.ts'
import { biochemistryFoundations } from './biochemistryFoundations.ts'
import { HIERARCHY } from './hierarchy.ts'
import { componentAssetResolution } from './modelRegistry.ts'
import { KNOWN_COMPOSITIONS } from '../lib/procedural/types.ts'
import type { ComponentContent } from './types.ts'

const BRANCH_MODULES_PATH = fileURLToPath(new URL('./branchModules.ts', import.meta.url))
const ALL_CONTENT_PATH = fileURLToPath(new URL('./allContent.ts', import.meta.url))
const branchModulesSource = readFileSync(BRANCH_MODULES_PATH, 'utf8')
const allContentSource = readFileSync(ALL_CONTENT_PATH, 'utf8')
const knownShapes = new Set<string>(KNOWN_COMPOSITIONS)
const PROTOTYPE_REVIEW_COMPONENTS = new Set([
  'biology-health-nutrition',
  'biology-neuroscience-brain-regions',
  'biology-neuroscience-senses-signals',
])

const branchData = {
  evolution: {
    name: 'Evolution',
    route: '/app/labs/branch/evolution',
    components: evolution,
    importName: 'evolution',
    moduleName: 'evolution',
  },
  animals: {
    name: 'Animals',
    route: '/app/labs/branch/animals',
    components: animals,
    importName: 'animals',
    moduleName: 'animals',
  },
  'health-and-disease': {
    name: 'Health And Disease',
    route: '/app/labs/branch/health-and-disease',
    components: healthAndDisease,
    importName: 'healthAndDisease',
    moduleName: 'healthAndDisease',
  },
  neuroscience: {
    name: 'Neuroscience',
    route: '/app/labs/branch/neuroscience',
    components: neuroscience,
    importName: 'neuroscience',
    moduleName: 'neuroscience',
  },
  'biochemistry-foundations': {
    name: 'Biochemistry Foundations',
    route: '/app/labs/branch/biochemistry-foundations',
    components: biochemistryFoundations,
    importName: 'biochemistryFoundations',
    moduleName: 'biochemistryFoundations',
  },
} as const

function assertNonEmptyString(value: unknown, message: string) {
  assert.equal(typeof value, 'string', message)
  assert.ok((value as string).trim().length > 0, message)
}

function assertCompleteComponent(component: ComponentContent, branchName: string, branchIds: Set<string>) {
  assertNonEmptyString(component.id, `expected id for ${component.name}`)
  assertNonEmptyString(component.name, `expected name for ${component.id}`)
  assertNonEmptyString(component.scientificName, `expected scientificName for ${component.id}`)
  assert.equal(component.subject, 'biology')
  assert.equal(component.branch, branchName)
  assertNonEmptyString(component.system, `expected system for ${component.id}`)
  assert.equal(typeof component.model, 'string', `expected model field for ${component.id}`)
  const resolution = componentAssetResolution(component)
  assert.equal(resolution.status, 'ready', `expected registered GLB for ${component.id}`)
  assert.ok(resolution.asset, `expected asset metadata for ${component.id}`)
  if (PROTOTYPE_REVIEW_COMPONENTS.has(component.id)) {
    assert.equal(resolution.asset.licenseStatus, 'REVIEW', `expected visible prototype review status for ${component.id}`)
    assert.equal(resolution.asset.replaceBeforePaidLaunch, true, `expected replacement gate for ${component.id}`)
  } else {
    assert.notEqual(resolution.asset.licenseStatus, 'REVIEW', `expected cleared asset for ${component.id}`)
  }
  assert.ok(existsSync(join(process.cwd(), 'public', resolution.asset.url.replace(/^\//, ''))), `expected GLB file to exist for ${component.id}`)
  assertNonEmptyString(component.tagline, `expected tagline for ${component.id}`)
  assertNonEmptyString(component.summary, `expected summary for ${component.id}`)
  assert.ok(component.keyFacts.length >= 4, `expected keyFacts for ${component.id}`)
  for (const fact of component.keyFacts) {
    assertNonEmptyString(fact.label, `expected keyFact label for ${component.id}`)
    assertNonEmptyString(fact.value, `expected keyFact value for ${component.id}`)
  }
  assertNonEmptyString(component.whyItMatters, `expected whyItMatters for ${component.id}`)
  assertNonEmptyString(component.didYouKnow, `expected didYouKnow for ${component.id}`)
  assert.ok(component.belongsTo.length >= 3, `expected belongsTo for ${component.id}`)
  assert.ok(component.conditions.length >= 3, `expected conditions for ${component.id}`)
  assert.ok(component.visual, `expected procedural visual for ${component.id}`)
  assert.ok(knownShapes.has(component.visual!.shape), `expected known procedural shape for ${component.id}: ${component.visual!.shape}`)

  assert.ok(component.hotspots.length >= 3, `expected hotspots for ${component.id}`)
  for (const hotspot of component.hotspots) {
    assertNonEmptyString(hotspot.id, `expected hotspot id for ${component.id}`)
    assertNonEmptyString(hotspot.label, `expected hotspot label for ${component.id}`)
    assert.equal(hotspot.position.length, 3, `expected hotspot position for ${component.id}`)
    assertNonEmptyString(hotspot.color, `expected hotspot color for ${component.id}`)
    assertNonEmptyString(hotspot.description, `expected hotspot description for ${component.id}`)
    assertNonEmptyString(hotspot.function, `expected hotspot function for ${component.id}`)
  }

  assert.deepEqual(component.lesson.steps.map((step) => step.title), ['Predict', 'Change', 'Observe', 'Explain'])
  for (const step of component.lesson.steps) {
    assertNonEmptyString(step.body, `expected lesson body for ${component.id} ${step.title}`)
  }
  assertNonEmptyString(component.lesson.predictionPrompt, `expected predictionPrompt for ${component.id}`)
  assertNonEmptyString(component.lesson.practiceItem, `expected practiceItem for ${component.id}`)
  assertNonEmptyString(component.lesson.checkpoint, `expected checkpoint for ${component.id}`)

  assert.ok(component.quiz.length >= 3, `expected quiz for ${component.id}`)
  for (const question of component.quiz) {
    assertNonEmptyString(question.prompt, `expected quiz prompt for ${component.id}`)
    assert.ok(question.options.length >= 4, `expected quiz options for ${component.id}`)
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length, `expected valid correctIndex for ${component.id}`)
    assertNonEmptyString(question.explanation, `expected quiz explanation for ${component.id}`)
    assertNonEmptyString(question.misconception, `expected quiz misconception for ${component.id}`)
  }

  assertNonEmptyString(component.compareCandidate, `expected compareCandidate for ${component.id}`)
  assert.notEqual(component.compareCandidate, component.id, `expected ${component.id} not to compare against itself`)
  assert.ok(branchIds.has(component.compareCandidate), `expected compare target ${component.compareCandidate} to resolve for ${component.id}`)
  assertNonEmptyString(component.compareReason, `expected compareReason for ${component.id}`)
}

test('remaining biology branches are live on generic BranchLab routes with accurate counts', () => {
  for (const [branchId, data] of Object.entries(branchData)) {
    const branch = HIERARCHY.biology.branches.find((candidate) => candidate.id === branchId)
    assert.ok(branch, `expected hierarchy entry for ${branchId}`)
    assert.equal(branch.status, 'live')
    assert.equal(branch.route, data.route)
    assert.equal(branch.componentCount, data.components.length)
    assert.ok(data.components.length >= 3 && data.components.length <= 5, `expected 3-5 components for ${branchId}`)
  }
})

test('remaining biology branches are registered for branchComponents and resolveContent indexing', () => {
  assert.match(branchModulesSource, /export function branchComponents\(branchId: string\): ComponentContent\[\]/)
  assert.match(allContentSource, /export function resolveContent\(id: string\): ComponentContent \| null/)
  assert.match(allContentSource, /\.\.\.Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)/, 'expected resolveContent index to include BRANCH_COMPONENTS')

  for (const [branchId, data] of Object.entries(branchData)) {
    assert.match(branchModulesSource, new RegExp(`import \\{ ${data.importName} \\} from './${data.moduleName}'`))
    assert.match(branchModulesSource, new RegExp(`'${branchId}': ${data.importName}|\\b${data.importName},`))
  }
})

test('remaining biology branch content is complete and compare links resolve', () => {
  const allIds = new Set<string>()
  for (const data of Object.values(branchData)) {
    for (const component of data.components) {
      assert.equal(allIds.has(component.id), false, `duplicate component id ${component.id}`)
      allIds.add(component.id)
    }
  }

  for (const data of Object.values(branchData)) {
    const branchIds = new Set(data.components.map((component) => component.id))
    for (const component of data.components) {
      assertCompleteComponent(component, data.name, branchIds)
    }
  }
})
