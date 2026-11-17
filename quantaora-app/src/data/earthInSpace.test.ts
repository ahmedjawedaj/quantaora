import { test } from 'node:test'
import assert from 'node:assert/strict'
import { earthInSpace, earthInSpaceById } from './earthInSpace.ts'

// Data-integrity guard for the Earth In Space branch, mirroring the shape of checks other
// branches' data files get (e.g. moons.ts via moonsGravityComparison.test.ts) — run directly
// under this repo's plain node:test + native TS type-stripping convention.
// Run with: node --test src/data/earthInSpace.test.ts

const VALID_MODES = new Set(['motion', 'seasons', 'phases', 'eclipses', 'tides'])

test('earthInSpace: exactly five components, matching the branch taxonomy interactiveComponents', () => {
  assert.equal(earthInSpace.length, 5)
})

test('earthInSpace: every id is unique and every mode is a recognized EarthSpaceMode', () => {
  const ids = earthInSpace.map((c) => c.id)
  assert.equal(new Set(ids).size, ids.length, 'expected all component ids to be unique')
  for (const c of earthInSpace) {
    assert.ok(VALID_MODES.has(c.mode), `expected a recognized mode for ${c.id}, got ${c.mode}`)
  }
})

test('earthInSpace: every entry has a real subject/branch tag and a non-empty lesson + quiz', () => {
  for (const c of earthInSpace) {
    assert.equal(c.subject, 'space')
    assert.equal(c.branch, 'Earth In Space')
    assert.ok(c.lesson.steps.length > 0, `expected lesson steps for ${c.id}`)
    assert.ok(c.lesson.predictionPrompt.length > 0, `expected a predictionPrompt for ${c.id}`)
    assert.ok(c.quiz.length >= 4, `expected at least 4 quiz questions for ${c.id}`)
  }
})

test('earthInSpace: every quiz question has a valid correctIndex into its own options array', () => {
  for (const c of earthInSpace) {
    for (const q of c.quiz) {
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `expected a valid correctIndex for a question in ${c.id}: "${q.prompt}"`)
    }
  }
})

test('earthInSpace: every compareCandidate resolves to another real component in this same branch', () => {
  for (const c of earthInSpace) {
    assert.ok(c.compareCandidate.length > 0, `expected a compareCandidate for ${c.id}`)
    assert.notEqual(c.compareCandidate, c.id, `expected ${c.id} not to compare against itself`)
    assert.ok(earthInSpaceById[c.compareCandidate], `expected compareCandidate "${c.compareCandidate}" for ${c.id} to resolve to a real component`)
  }
})
