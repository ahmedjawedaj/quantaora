import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the "Capsid (real poliovirus)" virus inspection mode: a third
// VirusRealStructureScene state alongside the existing influenza whole-virion/cutaway modes,
// wiring in the already-registered, already-cleared /models/biology/microbiology/
// virus-polio-capsid-nih-optimized.glb (modelRegistry.ts componentId `virus`, CLEAR/hero) that
// was previously an orphan asset (registered but never rendered by any route).
//
// Static source-text checks only, matching this file's sibling regression tests
// (microbiologyRetryRemount.test.ts, microbiologyRetryPanelObstruction.test.ts) and this repo's
// plain node:test + native TS type-stripping convention (no jsdom/WebGL harness).
//
// Run with: node --test src/routes/microbiologyCapsidMode.test.ts

const MICROBIOLOGY_LAB_PATH = fileURLToPath(new URL('./MicrobiologyLab.tsx', import.meta.url))
const src = readFileSync(MICROBIOLOGY_LAB_PATH, 'utf8')

test('MicrobiologyLab: VIRUS_CAPSID_MODEL_URL points at the registered, license-cleared capsid GLB and is preloaded', () => {
  assert.match(
    src,
    /const VIRUS_CAPSID_MODEL_URL = '\/models\/biology\/microbiology\/virus-polio-capsid-nih-optimized\.glb'/,
    'expected VIRUS_CAPSID_MODEL_URL to point at the exact registered modelRegistry.ts url for the CLEAR/hero poliovirus capsid asset',
  )
  assert.match(
    src,
    /useGLTF\.preload\(VIRUS_CAPSID_MODEL_URL\)/,
    'expected the capsid model to be preloaded, same as the whole-virion/cutaway influenza models',
  )
})

test('MicrobiologyLab: VirusInspectionMode includes "capsid" as a distinct mode from cycle/whole-virion/cutaway', () => {
  assert.match(
    src,
    /type VirusInspectionMode = 'cycle' \| 'whole-virion' \| 'cutaway' \| 'capsid'/,
    'expected VirusInspectionMode to be widened to include "capsid"',
  )
})

test('MicrobiologyLab: VirusRealStructureScene resolves the capsid mode to VIRUS_CAPSID_MODEL_URL and its own hotspot set', () => {
  const urlLineMatch = src.match(/const url = mode === 'cutaway' \? VIRUS_CUTAWAY_MODEL_URL : mode === 'capsid' \? VIRUS_CAPSID_MODEL_URL : VIRUS_WHOLE_MODEL_URL/)
  assert.ok(urlLineMatch, 'expected the mode->url ternary in VirusRealStructureScene to branch on "capsid" to VIRUS_CAPSID_MODEL_URL, not fall through to the influenza whole-virion url')

  const hotspotsLineMatch = src.match(/const hotspots = mode === 'cutaway' \? VIRUS_CUTAWAY_HOTSPOTS : mode === 'capsid' \? VIRUS_CAPSID_HOTSPOTS : VIRUS_WHOLE_HOTSPOTS/)
  assert.ok(hotspotsLineMatch, 'expected the mode->hotspots ternary to branch on "capsid" to its own VIRUS_CAPSID_HOTSPOTS array')
})

test('MicrobiologyLab: VirusGlbModel only enables vertexColors when the geometry actually has a color attribute (capsid GLB ships POSITION only, no COLOR_0)', () => {
  const hasVertexColorIdx = src.indexOf('const hasVertexColor = !!child.geometry?.getAttribute(\'color\')')
  assert.ok(
    hasVertexColorIdx !== -1,
    'expected VirusGlbModel to detect whether the loaded mesh actually has a color attribute before enabling vertexColors -- unconditionally setting vertexColors: true (the old influenza-only behavior) would silently misrender the capsid GLB, which has no COLOR_0 attribute at all',
  )
  const materialBlock = src.slice(hasVertexColorIdx, hasVertexColorIdx + 300)
  assert.match(
    materialBlock,
    /vertexColors: hasVertexColor/,
    'expected the MeshStandardMaterial to key vertexColors off the detected hasVertexColor flag',
  )
  assert.match(
    materialBlock,
    /color: hasVertexColor \? '#ffffff' : VIOLET/,
    'expected a fallback flat color (VIOLET, matching this file\'s existing virus theme color) for GLBs with no vertex color data, so the capsid does not render pure black',
  )
})

test('MicrobiologyLab: PART_META has a vi-capsid entry for the capsid hotspot', () => {
  assert.match(
    src,
    /'vi-capsid': \{ label: '[^']+', color: VIOLET \}/,
    'expected a vi-capsid entry in PART_META so the capsid hotspot has a label/color to render',
  )
})

test('MicrobiologyLab: the Tune panel has a third virus-inspection button that switches to capsid mode', () => {
  assert.match(
    src,
    /onClick=\{\(\) => onSetVirusInspectionMode\('capsid'\)\}[\s\S]{0,500}?Capsid \(real poliovirus\)/,
    'expected a Tune-panel button wired to onSetVirusInspectionMode(\'capsid\') labeled "Capsid (real poliovirus)", alongside the existing whole-virion/cutaway buttons',
  )
})

test('MicrobiologyLab: switching to capsid mode does not render the influenza-specific "Cycle stage" chip', () => {
  assert.match(
    src,
    /\{mode !== 'capsid' && <ChipLabel text=\{`Cycle stage: \$\{currentStage\(VIRUS_STAGES, flowProgress\)\.label\}`\}/,
    'expected the shared VIRUS_STAGES "Cycle stage" chip (which narrates influenza\'s attach/release cycle) to be skipped in capsid mode, since poliovirus is a different organism not part of that narrative',
  )
})
