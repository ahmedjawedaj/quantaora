import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { animals } from './animals.ts'

interface Candidate {
  id: string
  status: string
  targetComponents: string[]
  uid: string
  sourceUrl: string
  license: string
  faceCount: number
}

interface RejectedCandidate {
  id: string
  license: string
  reason: string
}

const manifestPath = join(process.cwd(), '..', 'docs', 'assets', 'biology-animals-sourcing-candidates.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  branchId: string
  candidates: Candidate[]
  rejected: RejectedCandidate[]
}

const animalComponentIds = new Set(animals.map((component) => component.id))

test('animals sourcing manifest has vetted import candidates', () => {
  assert.equal(manifest.branchId, 'animals')
  assert.ok(manifest.candidates.length >= 5)

  for (const candidate of manifest.candidates) {
    assert.equal(candidate.status, 'ready-for-authenticated-download')
    assert.match(candidate.uid, /^[a-f0-9]{32}$/)
    assert.match(candidate.sourceUrl, /^https:\/\/sketchfab\.com\/3d-models\//)
    assert.match(candidate.license, /CC0|Public Domain/i)
    assert.ok(candidate.faceCount > 0)
    assert.ok(candidate.targetComponents.length > 0)
    for (const componentId of candidate.targetComponents) {
      assert.equal(animalComponentIds.has(componentId), true, `${candidate.id} targets unknown component ${componentId}`)
    }
  }
})

test('animals sourcing manifest rejects non-commercial candidates instead of leaving them ambiguous', () => {
  assert.ok(manifest.rejected.length >= 1)
  for (const candidate of manifest.rejected) {
    assert.match(candidate.license, /NonCommercial|BY-NC|NC-/i)
    assert.match(candidate.reason, /Non-commercial/i)
  }
})
