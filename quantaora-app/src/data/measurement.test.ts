import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { HIERARCHY } from './hierarchy.ts'
import { measurement, measurementById } from './measurement.ts'
import { summarizeComponentAssets } from './modelRegistry.ts'

const EXPECTED_IDS = [
  'math-measurement-ruler-length',
  'math-measurement-measuring-tape-perimeter',
  'math-measurement-measuring-cup',
  'math-measurement-kitchen-scale-mass',
  'math-measurement-unit-conversion',
]

const EXPECTED_VISUAL_SHAPES = [
  'measurement-ruler-manipulative',
  'measurement-tape-perimeter',
  'measurement-cup-volume',
  'measurement-kitchen-scale',
  'measurement-unit-conversion',
]

function readSrc(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

test('measurement branch is live and routes through the generic BranchLab path', () => {
  const branch = HIERARCHY.math.branches.find((candidate) => candidate.id === 'measurement')
  assert.ok(branch, 'expected Measurement branch metadata')
  assert.equal(branch.status, 'live')
  assert.equal(branch.componentCount, EXPECTED_IDS.length)
  assert.equal(branch.route, '/app/labs/branch/measurement')
})

test('measurement branch module is registered for generic branch lookup', () => {
  const branchModulesSrc = readSrc('./branchModules.ts')
  assert.match(branchModulesSrc, /import \{ measurement \} from '\.\/measurement'/)
  assert.match(branchModulesSrc, /measurement,/)
})

test('measurement content resolves by id and has the expected component count', () => {
  assert.equal(measurement.length, EXPECTED_IDS.length)
  assert.deepEqual(
    measurement.map((component) => component.id),
    EXPECTED_IDS,
  )

  for (const id of EXPECTED_IDS) {
    assert.equal(measurementById[id]?.id, id, `expected measurementById to resolve ${id}`)
  }
})

test('measurement components have complete lessons, quizzes, hotspots, and compare links', () => {
  for (const component of measurement) {
    assert.equal(component.subject, 'math')
    assert.equal(component.branch, 'Measurement')
    assert.ok(component.summary.length > 0, `expected summary for ${component.id}`)
    assert.ok(component.keyFacts.length >= 5, `expected key facts for ${component.id}`)
    assert.ok(component.hotspots.length >= 3, `expected hotspots for ${component.id}`)
    assert.ok(component.lesson.steps.length >= 4, `expected lesson steps for ${component.id}`)

    const lessonTitles = new Set(component.lesson.steps.map((step) => step.title))
    for (const title of ['Predict', 'Change', 'Observe', 'Explain']) {
      assert.ok(lessonTitles.has(title), `expected ${component.id} lesson to include ${title}`)
    }

    assert.ok(component.lesson.predictionPrompt.length > 0, `expected predictionPrompt for ${component.id}`)
    assert.ok(component.lesson.practiceItem.length > 0, `expected practiceItem for ${component.id}`)
    assert.ok(component.lesson.checkpoint.length > 0, `expected checkpoint for ${component.id}`)
    assert.ok(component.quiz.length >= 4, `expected quiz for ${component.id}`)

    for (const question of component.quiz) {
      assert.ok(question.prompt.length > 0, `expected quiz prompt for ${component.id}`)
      assert.ok(question.options.length >= 4, `expected quiz options for ${component.id}`)
      assert.ok(
        question.correctIndex >= 0 && question.correctIndex < question.options.length,
        `expected valid correctIndex for ${component.id}`,
      )
      assert.ok(question.explanation.length > 0, `expected quiz explanation for ${component.id}`)
      assert.ok(question.misconception.length > 0, `expected quiz misconception for ${component.id}`)
    }

    assert.ok(component.compareCandidate.length > 0, `expected compareCandidate for ${component.id}`)
    assert.notEqual(component.compareCandidate, component.id, `expected ${component.id} not to compare with itself`)
    assert.ok(measurementById[component.compareCandidate], `expected compareCandidate to resolve for ${component.id}`)
    assert.ok(component.compareReason.length > 0, `expected compareReason for ${component.id}`)
  }
})

test('measurement components use branch-authored manipulatives instead of static support GLBs', () => {
  assert.deepEqual(
    measurement.map((component) => component.visual?.shape),
    EXPECTED_VISUAL_SHAPES,
  )

  for (const component of measurement) {
    assert.equal(component.model, '', `expected ${component.id} to render the procedural manipulative`)
    assert.ok(component.visual?.variables?.length, `expected interactive variables for ${component.id}`)
    assert.match(component.visual?.variables?.join(' ') ?? '', /(level|tick|tare|unit|path|length|mass|distance)/)
  }
})

test('measurement copy makes cause and effect readable for each manipulative', () => {
  const requiredWords = new Map([
    ['math-measurement-ruler-length', ['zero', 'tick', 'length']],
    ['math-measurement-measuring-tape-perimeter', ['side', 'add', 'outside']],
    ['math-measurement-measuring-cup', ['line', 'level', 'volume']],
    ['math-measurement-kitchen-scale-mass', ['tare', 'display', 'mass']],
    ['math-measurement-unit-conversion', ['same', 'unit', 'changes']],
  ])

  for (const component of measurement) {
    const text = [
      component.tagline,
      component.summary,
      component.lesson.predictionPrompt,
      component.lesson.practiceItem,
      ...component.lesson.steps.map((step) => step.body),
      ...component.hotspots.flatMap((hotspot) => [hotspot.label, hotspot.description, hotspot.function]),
    ].join(' ').toLowerCase()

    for (const word of requiredWords.get(component.id) ?? []) {
      assert.ok(text.includes(word), `expected ${component.id} copy to include ${word}`)
    }
  }
})

test('measurement asset coverage is useful for the generic lab', () => {
  const summary = summarizeComponentAssets(measurement)
  assert.equal(summary.total, EXPECTED_IDS.length)
  assert.equal(summary.previewMissing, EXPECTED_IDS.length)
  assert.equal(summary.reviewNeeded, 0)
  assert.equal(summary.paidLaunchRisk, 0)
  assert.equal(summary.supportReady, 0)
  assert.equal(summary.status, 'preview-only')
})
