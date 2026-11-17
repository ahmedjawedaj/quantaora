import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// This file used to guard the OLD per-frame LabelDeclutter pairwise push-apart system (Wave
// 17/18/20 QA fixes: fixed Y/X offsets for Name/Spin/Orbit pills + a `useFrame`-driven collision-
// relaxation pass measuring real `getBoundingClientRect()` geometry). That whole system is being
// DELETED this wave (Wave 23) -- see this component's own file-top comment for the finding that
// motivated it: dragging the camera then reselecting a body produced Spin/Orbit pill overlap in
// 20/20 measurements across desktop and mobile sessions (docs/reviews/wave22-orbit.md P1; not yet
// on disk as this file was written -- see orbitStatusCardConsolidation.test.ts's own note on
// that). The relaxation math never fully separated that specific pair once cumulative drag
// brought their projected positions close together -- a structural limitation of "keep nudging
// projected screen-space rects apart every frame," not a tunable bug in the nudge amounts.
//
// The fix (implemented by a sibling worker this same wave) replaces the three separate
// Name/Spin/Orbit <Html>-in-canvas pills for the SELECTED body with one consolidated, plain-DOM
// status card rendered outside the Canvas -- structurally immune to projection collision, so it
// needs no runtime declutter pass at all. This file is repurposed from a "does the old system
// work correctly" guard into a "the old system is actually gone" deletion guard, since leaving
// the old assertions in place would either (a) fail permanently against code that correctly
// implements the new contract, or (b) silently test dead code that no longer runs. See
// ./orbitStatusCardConsolidation.test.ts for the new contract's own positive-shape guard, and
// ./orbitDragReselectDeclutter.test.ts for the drag->reselect identity-stability regression this
// same wave22-orbit.md finding demands against the new structure.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/components/explorer/orbitSpinLabelDeclutter.test.ts

const ORBIT_SANDBOX_PATH = fileURLToPath(new URL('./OrbitSandbox.tsx', import.meta.url))
const src = readFileSync(ORBIT_SANDBOX_PATH, 'utf8')

test('OrbitSandbox: LabelDeclutter (the deleted per-frame pairwise-push collision component) no longer exists', () => {
  assert.doesNotMatch(
    src,
    /function LabelDeclutter\(/,
    'expected `function LabelDeclutter(` to be fully removed from OrbitSandbox.tsx -- this wave replaces per-frame projection-collision avoidance with a structurally-immune consolidated status card rendered outside the Canvas, so no runtime declutter pass should remain',
  )
  assert.doesNotMatch(
    src,
    /<LabelDeclutter\b/,
    'expected no remaining <LabelDeclutter .../> mount point inside the Canvas/Suspense tree',
  )
})

test('OrbitSandbox: the old pairwise collision-relaxation math (measured-rect overlap + direction-from-centers push) no longer exists', () => {
  assert.doesNotMatch(
    src,
    /const overlapX = Math\.min\(aRight, bRight\) - Math\.max\(aLeft, bLeft\)/,
    'expected the old horizontal-overlap collision math to be removed entirely, not merely unreferenced',
  )
  assert.doesNotMatch(
    src,
    /const overlapY = Math\.min\(aBottom, bBottom\) - Math\.max\(aTop, bTop\)/,
    'expected the old vertical-overlap collision math to be removed entirely, not merely unreferenced',
  )
  assert.doesNotMatch(
    src,
    /const sign = \(aLeft \+ aRight\) \/ 2 <= \(bLeft \+ bRight\) \/ 2 \? -1 : 1/,
    'expected the old measured-center push-direction derivation to be removed entirely',
  )
})

test('OrbitSandbox: the old declutter pass\'s tuning constants (LABEL_GAP_PX, LABEL_STAGE_PADDING_PX) no longer exist', () => {
  assert.doesNotMatch(
    src,
    /const LABEL_GAP_PX = \d+/,
    'expected LABEL_GAP_PX (the old declutter pass\'s minimum-gap constant) to be removed along with the pass itself',
  )
  assert.doesNotMatch(
    src,
    /const LABEL_STAGE_PADDING_PX = \d+/,
    'expected LABEL_STAGE_PADDING_PX (the old declutter pass\'s stage-clamp padding constant) to be removed along with the pass itself',
  )
})

test('OrbitSandbox: the separate, competing Spin and Orbit <Html> pills for the selected body no longer exist (their content now lives in the consolidated status card)', () => {
  assert.doesNotMatch(
    src,
    /registerLabel\(`\$\{body\.id\}:spin`/,
    'expected the old separate "Spin" pill\'s registration key to be gone -- per this wave\'s contract, the selected body\'s spin readout now lives in the consolidated status card\'s orbit-status-spin element (see ./orbitStatusCardConsolidation.test.ts), not a competing in-canvas pill',
  )
  assert.doesNotMatch(
    src,
    /registerLabel\(`\$\{body\.id\}:orbit`/,
    'expected the old separate "Orbit" pill\'s registration key to be gone -- per this wave\'s contract, the selected body\'s orbit readout now lives in the consolidated status card\'s orbit-status-orbit element instead',
  )
})
