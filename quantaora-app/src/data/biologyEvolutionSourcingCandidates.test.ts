import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { evolution } from './evolution.ts'

interface Candidate {
  id: string
  status: string
  targetComponents: string[]
  uid: string
  sourceUrl: string
  apiUrl: string
  license: string
  faceCount: number
  fit: string
  risk: string
}

interface RejectedCandidate {
  id: string
  license: string
  reason: string
}

const manifestPath = join(process.cwd(), '..', 'docs', 'assets', 'biology-evolution-sourcing-candidates.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  branchId: string
  candidates: Candidate[]
  rejected: RejectedCandidate[]
}

const evolutionComponentIds = new Set(evolution.map((component) => component.id))

test('evolution sourcing manifest has vetted import candidates', () => {
  assert.equal(manifest.branchId, 'evolution')
  assert.ok(manifest.candidates.length >= 5)

  for (const candidate of manifest.candidates) {
    assert.equal(candidate.status, 'ready-for-authenticated-download')
    assert.match(candidate.uid, /^[a-f0-9]{32}$/)
    assert.match(candidate.sourceUrl, /^https:\/\/sketchfab\.com\/3d-models\//)
    assert.match(candidate.apiUrl, new RegExp(candidate.uid))
    assert.match(candidate.license, /CC0|Public Domain/i)
    assert.ok(candidate.faceCount > 0)
    assert.match(candidate.fit, /fossil|adaptation|body|trait|comparison/i)
    assert.match(candidate.risk, /optimi[sz]e|framing|quality|mobile|scale/i)

    for (const componentId of candidate.targetComponents) {
      assert.equal(evolutionComponentIds.has(componentId), true, `${candidate.id} targets unknown component ${componentId}`)
    }
  }
})

test('evolution sourcing manifest prioritizes fossil evidence and common ancestry', () => {
  const fossilTargets = manifest.candidates.filter((candidate) =>
    candidate.targetComponents.includes('biology-evolution-fossil-evidence'),
  )
  const ancestryTargets = manifest.candidates.filter((candidate) =>
    candidate.targetComponents.includes('biology-evolution-common-ancestry'),
  )

  assert.ok(fossilTargets.length >= 3, 'expected several fossil-ready candidates for fossil evidence')
  assert.ok(ancestryTargets.length >= 4, 'expected comparison candidates for common ancestry')
})

test('evolution sourcing manifest rejects non-commercial candidates explicitly', () => {
  assert.ok(manifest.rejected.length >= 1)
  for (const candidate of manifest.rejected) {
    assert.match(candidate.license, /NonCommercial|BY-NC|NC-/i)
    assert.match(candidate.reason, /Non-commercial/i)
  }
})
