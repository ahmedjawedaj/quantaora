import { test } from 'node:test'
import assert from 'node:assert/strict'
import { moons, moonById } from './moons.ts'

// Data-integrity guard for the Moons branch, which is a documented, tested exception to the
// content/subjects/** pipeline (see content/taxonomy/space.json's "moons" entry and the
// file-level comment in moons.ts): it is authored directly in this file rather than through
// module.json/lesson.md/quiz.json, so it gets no coverage from scripts/codegen/parity-check.ts.
// This test is that branch's substitute contract, pinning the shape codegen would otherwise
// guarantee. Run with: node --test src/data/moons.test.ts

test('moons: exactly five components, matching hierarchy.ts componentCount', () => {
  assert.equal(moons.length, 5)
})

test('moons: every id is unique and every entry is a real sourced GLB, not procedural', () => {
  const ids = moons.map((m) => m.id)
  assert.equal(new Set(ids).size, ids.length, 'expected all moon ids to be unique')
  for (const m of moons) {
    assert.equal(m.modelType, 'glb', `expected ${m.id} to render a real sourced GLB`)
    assert.ok(m.model.startsWith('/models/sourced/space/'), `expected ${m.id} to point at a sourced space model, got ${m.model}`)
  }
})

test('moons: every entry has a real subject/branch tag and a non-empty lesson + quiz', () => {
  for (const m of moons) {
    assert.equal(m.subject, 'space')
    assert.equal(m.branch, 'Moons')
    assert.ok(m.lesson.steps.length > 0, `expected lesson steps for ${m.id}`)
    assert.ok(m.lesson.predictionPrompt.length > 0, `expected a predictionPrompt for ${m.id}`)
    assert.ok(m.quiz.length >= 4, `expected at least 4 quiz questions for ${m.id}`)
  }
})

test('moons: every quiz question has a valid correctIndex into its own options array', () => {
  for (const m of moons) {
    for (const q of m.quiz) {
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `expected a valid correctIndex for a question in ${m.id}: "${q.prompt}"`)
    }
  }
})

test('moons: every compareCandidate resolves to another real moon in this same branch', () => {
  for (const m of moons) {
    assert.ok(m.compareCandidate.length > 0, `expected a compareCandidate for ${m.id}`)
    assert.notEqual(m.compareCandidate, m.id, `expected ${m.id} not to compare against itself`)
    assert.ok(moonById[m.compareCandidate], `expected compareCandidate "${m.compareCandidate}" for ${m.id} to resolve to a real moon`)
  }
})
