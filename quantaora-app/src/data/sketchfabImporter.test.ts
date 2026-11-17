import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'

const importerSource = readFileSync(new URL('../../scripts/assets/import-sketchfab-candidate.mjs', import.meta.url), 'utf8')

test('Sketchfab importer defaults output folder from manifest branchId', () => {
  assert.match(importerSource, /manifest\.branchId/)
  assert.match(importerSource, /manifest\.subject/)
  assert.match(importerSource, /sourced\/\$\{subjectSlug\}-\$\{branchSlug\}\/\$\{candidate\.id\}\.glb/)
  assert.ok(!importerSource.includes('outRel ?? `sourced/biology-animals/${candidate.id}.glb`'))
})
