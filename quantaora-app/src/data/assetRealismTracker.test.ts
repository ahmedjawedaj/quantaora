import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import {
  ASSET_REALISM_WAVE1_TRACKER,
  P1_ASSET_REALISM_BRANCHES,
  assetRealismCoverage,
} from './assetRealismTracker.ts'

test('asset realism tracker covers every P1 realism branch', () => {
  const covered = new Set(ASSET_REALISM_WAVE1_TRACKER.map((target) => target.branchId))

  for (const branchId of P1_ASSET_REALISM_BRANCHES) {
    assert.ok(covered.has(branchId), `expected realism tracker entry for ${branchId}`)
  }
})

test('asset realism tracker keeps done vs remaining states separate', () => {
  const coverage = assetRealismCoverage()
  const byBranch = new Map(coverage.map((entry) => [entry.branchId, entry]))

  assert.ok((byBranch.get('cell-biology')?.upgradedExistingAssets ?? 0) >= 3)
  assert.ok((byBranch.get('cell-biology')?.supportOnly ?? 0) >= 2)
  assert.ok((byBranch.get('health-and-disease')?.upgradedExistingAssets ?? 0) >= 1)
  assert.ok((byBranch.get('health-and-disease')?.supportOnly ?? 0) >= 2)
  assert.ok((byBranch.get('human-physiology')?.supportOnly ?? 0) >= 4)
  assert.ok((byBranch.get('neuroscience')?.supportOnly ?? 0) >= 3)
  assert.ok((byBranch.get('animals')?.readyForAuthenticatedImport ?? 0) >= 1)
  assert.ok((byBranch.get('evolution')?.readyForAuthenticatedImport ?? 0) >= 1)
  assert.ok((byBranch.get('sound')?.supportOnly ?? 0) >= 2)
  assert.ok((byBranch.get('fluids')?.supportOnly ?? 0) >= 3)
  assert.ok((byBranch.get('heat-and-thermodynamics')?.upgradedExistingAssets ?? 0) >= 1)
  assert.ok((byBranch.get('heat-and-thermodynamics')?.supportOnly ?? 0) >= 2)
  assert.ok((byBranch.get('biochemistry-links')?.supportOnly ?? 0) >= 2)
  assert.ok((byBranch.get('biochemistry-foundations')?.supportOnly ?? 0) >= 3)
})

test('all tracked existing assets point at local GLB files', () => {
  for (const target of ASSET_REALISM_WAVE1_TRACKER) {
    if (!target.currentAsset) continue

    assert.ok(
      existsSync(join(process.cwd(), 'public', target.currentAsset.replace(/^\//, ''))),
      `expected tracked asset to exist for ${target.branchId}/${target.componentId}: ${target.currentAsset}`,
    )
  }
})
