import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Microbiology task (docs/reviews/wave14-COMBINED.md P1 #6):
// "Microbiology's 'Try again' button is visually obstructed by the still-open 'Tune microbe' panel
// after a simulated virus GLB failure (both whole-virion and cutaway variants); no cue that the
// panel needs closing first."
//
// A real fix needs the failure to actually reach the route-level `controlsOpen` state that decides
// whether the Tune panel is drawn -- not just be caught locally inside the virus scene, and not
// merely add a visual cue without actually clearing the obstruction, since the report's core
// complaint is that the button is obstructed, not just unclear.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/microbiologyRetryPanelObstruction.test.ts

const MICROBIOLOGY_LAB_PATH = fileURLToPath(new URL('./MicrobiologyLab.tsx', import.meta.url))
const src = readFileSync(MICROBIOLOGY_LAB_PATH, 'utf8')

test('MicrobiologyLab: MicroScene accepts a virus-GLB-error callback that reaches the parent (not swallowed locally)', () => {
  const propsTypeIdx = src.indexOf('type MicroSceneProps')
  assert.ok(propsTypeIdx !== -1, 'expected a MicroSceneProps type to still exist in MicrobiologyLab.tsx')
  const propsTypeBody = src.slice(propsTypeIdx, propsTypeIdx + 1600)
  assert.match(
    propsTypeBody,
    /onVirusGlbError\?\s*:\s*\(\)\s*=>\s*void/,
    'expected MicroSceneProps to declare an onVirusGlbError callback prop',
  )
})

test('MicrobiologyLab: the virus-GLB-error callback is actually threaded down to VirusRealStructureScene\'s onGlbError (not declared and unused)', () => {
  assert.match(
    src,
    /<VirusRealStructureScene\b[\s\S]{0,600}?onGlbError=\{props\.onVirusGlbError\}/,
    'expected <VirusRealStructureScene> to receive onGlbError={props.onVirusGlbError} inside MicroScene\'s render, so a failed whole-virion/cutaway GLB load actually reports up to the route',
  )
})

test('MicrobiologyLab: on a virus GLB failure, the route closes the Tune microbe panel so "Try again" is not obstructed', () => {
  assert.match(
    src,
    /onVirusGlbError=\{\s*\(\)\s*=>\s*setControlsOpen\(false\)\s*\}/,
    'expected the top-level MicroScene usage to wire onVirusGlbError={() => setControlsOpen(false)}, so the Tune microbe panel actually closes out of the failure card\'s way (not just shows a hint while staying open)',
  )
})

test('MicrobiologyLab: the panel remains reachable again afterward (its own open button/toggle still exists, this is not a one-way lockout)', () => {
  assert.match(
    src,
    /Tune microbe/,
    'expected a "Tune microbe" open control to still exist so the panel can be reopened after being auto-closed by a GLB failure',
  )
  // Anchored: setControlsOpen(true) must actually sit in an onClick near the "Tune microbe" label
  // itself, not just exist somewhere unrelated in the file (a stray/dead setControlsOpen(true) call
  // elsewhere would otherwise satisfy a bare presence check while the real button stays broken).
  assert.match(
    src,
    /onClick=\{\(\)\s*=>\s*setControlsOpen\(true\)\}[\s\S]{0,500}?Tune microbe/,
    'expected an onClick={() => setControlsOpen(true)} handler to sit within ~500 chars of (i.e. actually wired to) the "Tune microbe" button, so the panel can genuinely be reopened by that control, not merely have an unrelated setControlsOpen(true) call elsewhere in the file',
  )
})
