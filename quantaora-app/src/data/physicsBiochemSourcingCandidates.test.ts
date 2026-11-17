import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test } from 'node:test'
import { biochemistryFoundations } from './biochemistryFoundations.ts'
import { fluids } from './fluids.ts'
import { heatAndThermodynamics } from './heatAndThermodynamics.ts'
import { sound } from './sound.ts'

interface Candidate {
  id: string
  status: string
  targetComponents: string[]
  uid: string
  sourceUrl: string
  apiUrl: string
  license: string
  licenseRequirements: string
  faceCount: number
  fit: string
  risk: string
}

interface RejectedCandidate {
  id: string
  license: string
  reason: string
}

interface Manifest {
  branchId: string
  subject: string
  candidates: Candidate[]
  rejected: RejectedCandidate[]
}

const manifestCases = [
  {
    branchId: 'sound',
    subject: 'physics',
    path: 'physics-sound-sourcing-candidates.json',
    componentIds: new Set(sound.map((component) => component.id)),
  },
  {
    branchId: 'fluids',
    subject: 'physics',
    path: 'physics-fluids-sourcing-candidates.json',
    componentIds: new Set(fluids.map((component) => component.id)),
  },
  {
    branchId: 'heat-and-thermodynamics',
    subject: 'physics',
    path: 'physics-heat-thermodynamics-sourcing-candidates.json',
    componentIds: new Set(heatAndThermodynamics.map((component) => component.id)),
  },
  {
    branchId: 'biochemistry-foundations',
    subject: 'biology',
    path: 'biology-biochemistry-foundations-sourcing-candidates.json',
    componentIds: new Set(biochemistryFoundations.map((component) => component.id)),
  },
]

function readManifest(path: string) {
  return JSON.parse(readFileSync(join(process.cwd(), '..', 'docs', 'assets', path), 'utf8')) as Manifest
}

for (const manifestCase of manifestCases) {
  test(`${manifestCase.branchId} sourcing manifest has vetted attribution-review candidates`, () => {
    const manifest = readManifest(manifestCase.path)

    assert.equal(manifest.branchId, manifestCase.branchId)
    assert.equal(manifest.subject, manifestCase.subject)
    assert.ok(manifest.candidates.length >= 4)

    for (const candidate of manifest.candidates) {
      assert.match(candidate.status, /ready-for-attribution-review|blocked-unoptimized/)
      assert.match(candidate.uid, /^[a-f0-9]{32}$/)
      assert.match(candidate.sourceUrl, /^https:\/\/sketchfab\.com\/3d-models\//)
      assert.match(candidate.apiUrl, new RegExp(candidate.uid))
      assert.equal(candidate.license, 'CC Attribution')
      assert.match(candidate.licenseRequirements, /Attribution required/)
      assert.ok(candidate.faceCount > 0)
      assert.match(candidate.fit, /object|model|structure|apparatus|molecule|speaker|tuning|thermometer|beaker|burner|membrane|enzyme|graduation|glassware|cylinder|displacement/i)
      assert.match(candidate.risk, /Attribution|required|optimi[sz](?:e|ation)|review|wire|mobile|quality|readability|heavy/i)

      for (const componentId of candidate.targetComponents) {
        assert.equal(manifestCase.componentIds.has(componentId), true, `${candidate.id} targets unknown component ${componentId}`)
      }
    }
  })

  test(`${manifestCase.branchId} sourcing manifest rejects unsafe licenses explicitly`, () => {
    const manifest = readManifest(manifestCase.path)

    assert.ok(manifest.rejected.length >= 1)
    for (const rejected of manifest.rejected) {
      assert.match(rejected.license, /NonCommercial|NoDerivs|BY-NC|BY-SA|BY-ND|Free Standard/i)
      assert.match(rejected.reason, /reject|Non-commercial|not a clean Creative Commons/i)
    }
  })
}
