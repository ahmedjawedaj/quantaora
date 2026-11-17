import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { telescopesAndObservation, telescopeAndObservationById } from './telescopesAndObservation.ts'
import { HIERARCHY } from './hierarchy.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const BRANCH_ID = 'telescopes-and-observation'
const BRANCH_NAME = 'Telescopes And Observation'
const branchModulesSource = readFileSync(new URL('./branchModules.ts', import.meta.url), 'utf8')

test('telescopes-and-observation branch is live on the generic BranchLab route', () => {
  const branch = HIERARCHY.space.branches.find((candidate) => candidate.id === BRANCH_ID)
  assert.ok(branch)
  assert.equal(branch.status, 'live')
  assert.equal(branch.route, `/app/labs/branch/${BRANCH_ID}`)
  assert.equal(branch.componentCount, telescopesAndObservation.length)
  assert.ok(telescopesAndObservation.length >= 2 && telescopesAndObservation.length <= 4)
})

test('telescopes-and-observation content is registered, reachable, and complete', () => {
  assert.match(branchModulesSource, /import \{ telescopesAndObservation \} from '\.\/telescopesAndObservation'/)
  assert.match(branchModulesSource, /'telescopes-and-observation': telescopesAndObservation/)

  for (const component of telescopesAndObservation) {
    assert.equal(component.subject, 'space')
    assert.equal(component.branch, BRANCH_NAME)
    assert.ok(component.keyFacts.length >= 5, `expected key facts for ${component.id}`)
    assert.ok(component.hotspots.length >= 4, `expected hotspots for ${component.id}`)
    assert.ok(component.lesson.steps.length >= 5, `expected lesson steps for ${component.id}`)
    const lessonTitles = component.lesson.steps.map((step) => step.title.toLowerCase()).join(' ')
    for (const stage of ['observe', 'predict', 'change', 'explain']) {
      assert.ok(lessonTitles.includes(stage), `expected ${stage} lesson stage for ${component.id}`)
    }
    assert.ok(component.lesson.predictionPrompt.length > 0, `expected prediction prompt for ${component.id}`)
    assert.ok(component.lesson.practiceItem.length > 0, `expected practice item for ${component.id}`)
    assert.ok(component.lesson.checkpoint.length > 0, `expected checkpoint for ${component.id}`)
    assert.ok(component.quiz.length >= 4, `expected quiz for ${component.id}`)
    for (const question of component.quiz) {
      assert.ok(question.options.length >= 4, `expected four options for "${question.prompt}"`)
      assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length)
      assert.ok(question.explanation.length > 0)
      assert.ok(question.misconception.length > 0)
    }
    assert.ok(component.compareCandidate.length > 0, `expected compare candidate for ${component.id}`)
    assert.notEqual(component.compareCandidate, component.id)
    assert.ok(telescopeAndObservationById[component.compareCandidate], `expected compare target for ${component.id}`)
  }
})

test('telescopes-and-observation GLB-backed components resolve to real CLEAR assets', () => {
  const expected = new Map([
    ['space-telescope-hubble', '/models/sourced/space/hubble-telescope.glb'],
    ['space-telescope-jwst', '/models/sourced/space/jwst-telescope.glb'],
    ['space-observatory-wavelength-comparison', '/models/space/authored/wavelength-comparison-authored.glb'],
    ['space-observatory-chandra', '/models/sourced/space/chandra-xray-observatory.glb'],
  ])

  for (const [id, url] of expected) {
    const component = telescopeAndObservationById[id]
    assert.ok(component, `expected ${id} content`)
    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready')
    assert.equal(resolution.asset?.licenseStatus, 'CLEAR')
    assert.equal(resolution.asset?.subject, 'space')
    assert.equal(resolution.asset?.branch, BRANCH_ID)
    assert.equal(resolution.resolvedUrl, url)
    assert.ok(existsSync(join(process.cwd(), 'public', url)), `expected file ${url}`)
  }
})
