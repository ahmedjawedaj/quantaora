import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for docs/reviews/wave22-orbit.md's P1 (restated from this wave's task brief,
// since that report has not landed on disk as this file was written -- see
// ./orbitStatusCardConsolidation.test.ts's own note): dragging the camera and then reselecting a
// body caused the separate Name/Spin/Orbit pills' Spin/Orbit pair to overlap in 20/20
// measurements (5 desktop select->drag->reselect cycles + 15 mobile session points). This
// continues the same drag/reselect regression shape docs/reviews/wave20-orbit.md found earlier
// (that wave's P1: a near-total CERES/SPIN pill containment, 2148px^2, reproduced in 3/3 drag
// cycles) -- the Wave 20 fix (moving the collision pass into a `useFrame` subscriber so it always
// re-measured after that frame's <Html> position update) narrowed the race but did not eliminate
// the underlying problem: ANY declutter scheme built on re-measuring live projected screen
// positions after a drag is fighting a moving target, and Wave 22 found it still loses often
// enough (20/20) to be a real regression, not a rare edge case.
//
// This wave's fix removes the moving target entirely: LabelDeclutter and its whole
// getBoundingClientRect()-based pairwise-push/clamp system are deleted (see
// ./orbitSpinLabelDeclutter.test.ts's deletion guard), and the selected body's Spin/Orbit (plus
// Name) readout moves into ONE consolidated, plain-DOM status card (data-testid=
// "orbit-status-card", see ./orbitStatusCardConsolidation.test.ts for its full shape contract)
// rendered outside the Canvas. Because that card's identity/content is driven directly by React
// state (which body is selected) rather than by measuring where anything currently projects to
// on screen, a camera drag -- which changes projection but not React state -- cannot by
// construction change which body's card is shown, duplicate it, or leave it showing stale/mixed
// content. This file is this wave's version of the drag->reselect regression guard: rather than
// re-running the old per-frame collision math against synthetic post-drag rects (as this file did
// through Wave 20 -- see git history for that version), it verifies the NEW structural property
// that makes the whole regression class impossible: the card is a single, state-driven render
// with no projection-measurement dependency at all. See orbitStatusCardConsolidation.test.ts's
// own "not positioned/updated from any 3D-projection..." test for the sibling check this file's
// identity-focused tests below complement.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why,
// and this file's own Wave 20-era comment, preserved in git history, on why a full drag gesture
// can't be simulated in this suite either).
//
// Run with: node --test src/components/explorer/orbitDragReselectDeclutter.test.ts

const ORBIT_SANDBOX_PATH = fileURLToPath(new URL('./OrbitSandbox.tsx', import.meta.url))
const SPACE_LAB_PATH = fileURLToPath(new URL('../../routes/SpaceLab.tsx', import.meta.url))
const orbitSandboxSrc = readFileSync(ORBIT_SANDBOX_PATH, 'utf8')
const spaceLabSrc = readFileSync(SPACE_LAB_PATH, 'utf8')

const CARD_TESTID = 'data-testid="orbit-status-card"'
const NAME_TESTID = 'data-testid="orbit-status-name"'

/** Locates whichever file currently defines the consolidated status card -- duplicated from
 *  ./orbitStatusCardConsolidation.test.ts on purpose: each test file in this repo's Orbit suite
 *  is self-contained (see e.g. that file's own `openTagContaining`-style helpers vs.
 *  ./orbitSpinLabelDeclutter.test.ts's independent ones), so a future edit to one file's helper
 *  can't silently change another file's assertions. */
function locateStatusCardSource(): { file: string; src: string } {
  if (orbitSandboxSrc.includes(CARD_TESTID)) return { file: 'OrbitSandbox.tsx', src: orbitSandboxSrc }
  if (spaceLabSrc.includes(CARD_TESTID)) return { file: 'SpaceLab.tsx', src: spaceLabSrc }
  throw new Error(
    `expected \`${CARD_TESTID}\` to exist in either OrbitSandbox.tsx or SpaceLab.tsx -- found in neither. Expected RED until the sibling Orbit-source worker's change lands this wave.`,
  )
}

test('orbit-status-card identity: the card is gated on the CURRENT selection (a single conditional keyed off selectedId), not any per-frame/DOM-measured state -- this is what makes a drag (camera-only) unable to change which body\'s card shows', () => {
  const { file, src } = locateStatusCardSource()
  const cardIdx = src.indexOf(CARD_TESTID)
  // Look backward from the card's own testid for the nearest JSX-conditional opening this repo's
  // existing components use for "render only when X" (`{x && (` / `{x != null && (` / `{x ? (`
  // style patterns) -- confirms the card's presence in the DOM is itself a function of component
  // state evaluated at render time, not a runtime effect that could lag behind a state change.
  const before = src.slice(Math.max(0, cardIdx - 400), cardIdx)
  const conditionalGuard = /\{\s*!?[a-zA-Z0-9_.[\]]+\s*(&&|!=\s*null\s*&&|!==\s*null\s*&&|\?)/
  assert.match(
    before,
    conditionalGuard,
    `expected the status card in ${file} to be preceded (within 400 chars) by a JSX conditional guard (e.g. \`{selected && (\` / \`{!selected.isStar && (\` / \`{selectedId && (\`) -- a render-time state check, not a useEffect/useFrame side-effect that could run a frame late relative to a selection change`,
  )
})

test('orbit-status-card identity: the name element renders a live `.name` property read, not a hardcoded or cached string -- so its content always reflects whichever body is CURRENTLY selected', () => {
  const { file, src } = locateStatusCardSource()
  const nameIdx = src.indexOf(NAME_TESTID)
  assert.ok(nameIdx !== -1, `expected ${NAME_TESTID} to exist (see orbitStatusCardConsolidation.test.ts for the fuller shape guard)`)
  const window = src.slice(nameIdx, nameIdx + 400)
  assert.match(
    window,
    /\{[a-zA-Z0-9_?.]+\.name\}/,
    `expected the orbit-status-name element in ${file} to render a JSX expression reading \`.name\` off some live object (e.g. \`{selected.name}\` / \`{selectedBody?.name}\`) within 400 chars of its own testid -- a hardcoded string or a value captured once at an earlier point would not track drag->reselect cycles onto a DIFFERENT body correctly`,
  )
})

test('orbit-status-card identity: no leftover per-frame collision/measurement machinery could still race a drag against this card (LabelDeclutter, labelElsRef, and the old declutter constants are fully gone)', () => {
  // Belt-and-suspenders alongside ./orbitSpinLabelDeclutter.test.ts's own deletion guard: this
  // test exists specifically in the drag->reselect regression file because THIS is the exact
  // mechanism (a `useFrame` re-measuring projected rects after a drag) that produced wave20 and
  // wave22's overlap findings -- confirming its complete absence is the direct fix for this file's
  // own regression, not an incidental cleanup.
  assert.doesNotMatch(orbitSandboxSrc, /function LabelDeclutter\(/, 'expected LabelDeclutter to be fully removed from OrbitSandbox.tsx')
  assert.doesNotMatch(orbitSandboxSrc, /labelElsRef/, 'expected the labelElsRef registration map (which fed the deleted per-frame collision pass) to be fully removed, not merely unused')
})

test('orbit-status-card identity: exactly one card can ever exist in the DOM at a time (single literal render path, not duplicated across files or inside a loop)', () => {
  // Reselecting after a drag must never leave two cards behind (one stale, one fresh) -- provable
  // structurally here the same way orbitStatusCardConsolidation.test.ts's own "exactly one
  // occurrence" test does, restated in this file because it's a direct precondition for "the
  // card's identity stays consistent across a drag->reselect cycle": if more than one render path
  // could produce a card, a drag->reselect cycle could in principle leave more than one mounted.
  const orbitCount = orbitSandboxSrc.split(CARD_TESTID).length - 1
  const spaceLabCount = spaceLabSrc.split(CARD_TESTID).length - 1
  assert.equal(
    orbitCount + spaceLabCount,
    1,
    `expected exactly one literal \`${CARD_TESTID}\` render path across OrbitSandbox.tsx (${orbitCount}) + SpaceLab.tsx (${spaceLabCount})`,
  )
})
