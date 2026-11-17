import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard: displayPart's no-selection fallback previously mapped every non-"cycle"
// virus inspection mode (whole-virion, cutaway, AND capsid) to 'vi-ha' — the influenza hemagglutinin
// hotspot, which does not exist on the capsid GLB's hotspot set (VIRUS_CAPSID_HOTSPOTS only has
// 'vi-capsid'). Opening capsid mode with nothing selected produced a mislabeled/missing part.
// Static source-text checks only, matching this file's siblings (microbiologyCapsidMode.test.ts,
// microbiologyRetryRemount.test.ts) and this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness).
//
// Run with: node --test src/routes/microbiologyDisplayPartFallback.test.ts

const MICROBIOLOGY_LAB_PATH = fileURLToPath(new URL('./MicrobiologyLab.tsx', import.meta.url))
const src = readFileSync(MICROBIOLOGY_LAB_PATH, 'utf8')

test('MicrobiologyLab: VIRUS_INSPECTION_DEFAULT_PART maps capsid to vi-capsid, not vi-ha', () => {
  const mapMatch = src.match(/const VIRUS_INSPECTION_DEFAULT_PART: Record<VirusInspectionMode, LabPart \| null> = \{([\s\S]*?)\}/)
  assert.ok(mapMatch, 'expected a VIRUS_INSPECTION_DEFAULT_PART mode->part lookup table')
  const body = mapMatch[1]
  assert.match(body, /cycle:\s*null/, 'expected cycle mode to fall through to DEFAULT_PART_BY_MICROBE (no virus-specific default)')
  assert.match(body, /'whole-virion':\s*'vi-ha'/, 'expected whole-virion to default to the shared influenza HA hotspot')
  assert.match(body, /cutaway:\s*'vi-ha'/, 'expected cutaway to default to the shared influenza HA hotspot')
  assert.match(body, /capsid:\s*'vi-capsid'/, 'expected capsid to default to its own vi-capsid hotspot, not vi-ha')
})

test('MicrobiologyLab: displayPart fallback reads through VIRUS_INSPECTION_DEFAULT_PART before DEFAULT_PART_BY_MICROBE', () => {
  assert.match(
    src,
    /const displayPart =\s*\n\s*selectedPart \?\?\s*\n\s*\(activeId === 'virus' \? VIRUS_INSPECTION_DEFAULT_PART\[virusInspectionMode\] : null\) \?\?\s*\n\s*DEFAULT_PART_BY_MICROBE\[activeId\] \?\?\s*\n\s*'ba-wall'/,
    'expected displayPart to resolve selectedPart, then the virus-inspection-mode default, then the per-microbe default, then the ba-wall fallback -- capsid mode must not skip straight to vi-ha',
  )
  assert.doesNotMatch(
    src,
    /activeId === 'virus' && virusInspectionMode !== 'cycle' \? 'vi-ha'/,
    'the old blanket "any non-cycle virus mode -> vi-ha" fallback must be gone -- it incorrectly covered capsid mode too',
  )
})
