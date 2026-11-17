import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Orbit task (Wave 23; see docs/reviews/wave22-orbit.md P1 --
// as of writing this file that report has not landed on disk yet, so this comment restates its
// finding from the task brief instead of quoting the file directly): dragging the camera then
// reselecting a body caused the separate Name/Spin/Orbit <Html>-in-canvas pills to overlap in
// 20/20 measurements (5 desktop select->drag->reselect cycles + 15 mobile session points) --
// LabelDeclutter's per-frame pairwise push-apart + stage-bounds clamp (see the now-deleted
// function this app's own Wave 17/18/20 comments describe) never fully separated the Spin/Orbit
// pair once cumulative drag brought their projected positions close together.
//
// The fix (implemented by a sibling worker this same wave, to the exact contract below) deletes
// LabelDeclutter and its pairwise-push algorithm entirely, and replaces the three separate pills
// for the SELECTED body with one consolidated, plain-DOM status card rendered OUTSIDE the
// Canvas/any Three.js group -- structurally immune to projection-based collision, since it is
// never positioned from a 3D projection in the first place. This file is the primary guard for
// that new contract's shape. ./orbitSpinLabelDeclutter.test.ts guards the OLD system's removal;
// ./orbitDragReselectDeclutter.test.ts guards the specific drag->reselect identity-stability
// regression against the new structure.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
// The card's exact host file (OrbitSandbox.tsx vs. SpaceLab.tsx -- both plausible per the
// contract, which cites SpaceLab.tsx's existing `data-canvas-overlay` pattern as the model) is
// owned by a concurrently-running sibling worker and not known at the time this file was written,
// so every test below locates it dynamically rather than assuming one file.
//
// Run with: node --test src/components/explorer/orbitStatusCardConsolidation.test.ts

const ORBIT_SANDBOX_PATH = fileURLToPath(new URL('./OrbitSandbox.tsx', import.meta.url))
const SPACE_LAB_PATH = fileURLToPath(new URL('../../routes/SpaceLab.tsx', import.meta.url))
const orbitSandboxSrc = readFileSync(ORBIT_SANDBOX_PATH, 'utf8')
const spaceLabSrc = readFileSync(SPACE_LAB_PATH, 'utf8')

const CARD_TESTID = 'data-testid="orbit-status-card"'
const NAME_TESTID = 'data-testid="orbit-status-name"'
const SPIN_TESTID = 'data-testid="orbit-status-spin"'
const ORBIT_TESTID = 'data-testid="orbit-status-orbit"'

/** Locates whichever file currently defines the consolidated status card -- see this file's own
 *  top comment for why this can't be hardcoded to one file. */
function locateStatusCardSource(): { file: string; src: string } {
  if (orbitSandboxSrc.includes(CARD_TESTID)) return { file: 'OrbitSandbox.tsx', src: orbitSandboxSrc }
  if (spaceLabSrc.includes(CARD_TESTID)) return { file: 'SpaceLab.tsx', src: spaceLabSrc }
  throw new Error(
    `expected \`${CARD_TESTID}\` (the new consolidated status card this wave's contract specifies) to exist in either OrbitSandbox.tsx or SpaceLab.tsx -- found in neither. This is expected to be RED until the sibling Orbit-source worker's change lands this wave.`,
  )
}

/** Finds every `<tagAnchor.map(` call's balanced parenthesis range in `src`, starting the search
 *  each time from just past the previous match -- used below to prove the status card is NOT
 *  rendered once per body inside `planets.map(...)` (which would make "at most one card" false by
 *  construction the moment two bodies are ever selected-shaped at once, and would also mean the
 *  card's identity could not be a single source of truth independent of iteration order). */
function allMapCallRanges(src: string, anchor: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = []
  let searchFrom = 0
  for (;;) {
    const start = src.indexOf(anchor, searchFrom)
    if (start === -1) break
    const parenStart = start + anchor.length - 1
    let depth = 0
    let end = -1
    for (let i = parenStart; i < src.length; i += 1) {
      if (src[i] === '(') depth += 1
      else if (src[i] === ')') {
        depth -= 1
        if (depth === 0) {
          end = i
          break
        }
      }
    }
    if (end === -1) break
    ranges.push([start, end])
    searchFrom = end + 1
  }
  return ranges
}

test('orbit-status-card: the new consolidated status card exists, containing name/spin/orbit sub-elements', () => {
  const { file, src } = locateStatusCardSource()
  // Fixed-size lookahead window from the card's own testid, matching this repo's existing
  // convention for "read the real surrounding markup without a full JSX parser" (see
  // orbitDragReselectDeclutter.test.ts's `declutterBody = src.slice(declutterIdx, declutterIdx +
  // 2600)`) -- generous enough to contain three short sub-elements plus a container's own
  // wrapper classes, not so large it risks reaching unrelated later markup.
  const cardIdx = src.indexOf(CARD_TESTID)
  const window = src.slice(cardIdx, cardIdx + 3000)

  assert.ok(
    window.includes(NAME_TESTID),
    `expected \`${NAME_TESTID}\` to appear inside the consolidated status card in ${file} (within 3000 chars of the card's own testid)`,
  )
  assert.ok(
    window.includes(SPIN_TESTID),
    `expected \`${SPIN_TESTID}\` to appear inside the consolidated status card in ${file} (within 3000 chars of the card's own testid)`,
  )
  assert.ok(
    window.includes(ORBIT_TESTID),
    `expected \`${ORBIT_TESTID}\` to appear inside the consolidated status card in ${file} (within 3000 chars of the card's own testid)`,
  )
})

test('orbit-status-card: exactly one occurrence in the codebase (no duplicate render path across OrbitSandbox.tsx / SpaceLab.tsx, no per-body loop)', () => {
  const orbitCount = orbitSandboxSrc.split(CARD_TESTID).length - 1
  const spaceLabCount = spaceLabSrc.split(CARD_TESTID).length - 1
  assert.equal(
    orbitCount + spaceLabCount,
    1,
    `expected exactly one literal \`${CARD_TESTID}\` across OrbitSandbox.tsx (${orbitCount}) + SpaceLab.tsx (${spaceLabCount}) -- more than one render path (or a per-body loop rendering it repeatedly) could produce more than one card in the DOM at once, which the contract explicitly forbids ("never more than one")`,
  )
})

test('orbit-status-card: not rendered inside a `planets.map(...)` per-body loop', () => {
  const { file, src } = locateStatusCardSource()
  const cardIdx = src.indexOf(CARD_TESTID)
  const mapRanges = allMapCallRanges(src, 'planets.map(')
  for (const [start, end] of mapRanges) {
    assert.ok(
      !(cardIdx > start && cardIdx < end),
      `expected the status card (found in ${file} at index ${cardIdx}) to NOT fall inside a \`planets.map(...)\` call spanning [${start}, ${end}] -- the card must render once for the current selection, not once per body, or "at most one card ever" and "identity always matches the selection" both stop being structurally guaranteed`,
    )
  }
})

test('orbit-status-card: rendered outside the <Canvas>/Three.js scene graph entirely', () => {
  const { file, src } = locateStatusCardSource()
  const cardIdx = src.indexOf(CARD_TESTID)

  if (file === 'OrbitSandbox.tsx') {
    const canvasCloseIdx = src.lastIndexOf('</Canvas>')
    assert.ok(canvasCloseIdx !== -1, 'expected OrbitSandbox.tsx to still render a <Canvas>...</Canvas>')
    assert.ok(
      cardIdx > canvasCloseIdx,
      `expected the status card to render AFTER </Canvas>'s closing tag (a sibling of the Canvas inside the stage div, not a descendant of it) -- got card at index ${cardIdx}, </Canvas> closes at ${canvasCloseIdx}`,
    )
  } else {
    // SpaceLab.tsx never itself opens a <Canvas> -- OrbitSandbox.tsx (a separate module) owns
    // the only Canvas in this scene, and SpaceLab.tsx renders <OrbitSandbox ... /> as a plain
    // (self-closing) component invocation with no JSX children. So a card living in SpaceLab.tsx
    // is automatically outside the Canvas/scene graph by file/component boundary; the remaining
    // thing worth checking is that it isn't smuggled in as a value attached to that invocation
    // itself (e.g. injected only as a prop, never actually returned as its own sibling element).
    // (Not asserting SpaceLab.tsx has no literal `<Canvas` text at all -- its own comments are
    // free to reference "the <Canvas>" in prose, as they already do.)
    const invocationOpenIdx = src.indexOf('<OrbitSandbox')
    assert.ok(invocationOpenIdx !== -1, 'expected SpaceLab.tsx to still render <OrbitSandbox ... />')
    let depth = 0
    let selfCloseIdx = -1
    for (let i = invocationOpenIdx; i < src.length; i += 1) {
      const ch = src[i]
      if (ch === '{') depth += 1
      else if (ch === '}') depth -= 1
      else if (ch === '>' && depth === 0) {
        selfCloseIdx = i
        break
      }
    }
    assert.ok(selfCloseIdx !== -1, 'expected a well-formed close for the <OrbitSandbox ... /> invocation')
    assert.ok(
      !(cardIdx > invocationOpenIdx && cardIdx < selfCloseIdx),
      `expected the status card to be a sibling JSX element in SpaceLab.tsx, not embedded inside the <OrbitSandbox ...> invocation's own prop list (spanning [${invocationOpenIdx}, ${selfCloseIdx}])`,
    )
  }
})

test('orbit-status-card: OrbitSandbox.tsx no longer defines LabelDeclutter or its pairwise-push collision machinery', () => {
  assert.doesNotMatch(
    orbitSandboxSrc,
    /function LabelDeclutter\(/,
    'expected `function LabelDeclutter(` to be fully removed -- the consolidated status card is structurally immune to projection collision and needs no runtime declutter pass at all, per this wave\'s contract',
  )
  assert.doesNotMatch(
    orbitSandboxSrc,
    /LABEL_GAP_PX|LABEL_STAGE_PADDING_PX/,
    'expected the old declutter pass\'s LABEL_GAP_PX/LABEL_STAGE_PADDING_PX constants to be removed along with LabelDeclutter itself',
  )
  assert.doesNotMatch(
    orbitSandboxSrc,
    /const overlapX = Math\.min\(aRight, bRight\) - Math\.max\(aLeft, bLeft\)/,
    'expected the old pairwise horizontal-overlap collision math to be removed entirely, not merely unused',
  )
})

test('orbit-status-card: no separate competing Spin/Orbit <Html> pills remain registered for the selected body', () => {
  // These were the two registration keys the deleted LabelDeclutter pass fought to keep apart --
  // see orbitSpinLabelDeclutter.test.ts for the fuller deletion-guard coverage of this same fact.
  assert.doesNotMatch(
    orbitSandboxSrc,
    /registerLabel\(`\$\{body\.id\}:spin`/,
    'expected the separate in-canvas "Spin" pill (registered via registerLabel(`${body.id}:spin`, ...)) to be gone -- its content now lives in the consolidated status card\'s orbit-status-spin element instead',
  )
  assert.doesNotMatch(
    orbitSandboxSrc,
    /registerLabel\(`\$\{body\.id\}:orbit`/,
    'expected the separate in-canvas "Orbit" pill (registered via registerLabel(`${body.id}:orbit`, ...)) to be gone -- its content now lives in the consolidated status card\'s orbit-status-orbit element instead',
  )
})

test('orbit-status-card: not positioned/updated from any 3D-projection or per-frame DOM-measurement machinery', () => {
  const { src } = locateStatusCardSource()
  const cardIdx = src.indexOf(CARD_TESTID)
  const window = src.slice(Math.max(0, cardIdx - 1500), cardIdx + 3000)

  // The whole point of moving this out of the Canvas is that it's plain overlay DOM keyed
  // directly off React state (selectedId / the selected body's data), never off a live camera
  // projection -- so none of the old per-frame measurement/projection vocabulary should appear in
  // its immediate vicinity. This is what makes it "structurally immune" to the wave22-orbit.md
  // drag->reselect drift instead of merely "currently passing" by coincidence.
  const projectionVocabulary = /getBoundingClientRect\(|useFrame\(|stageRef|labelElsRef|positionsRef\.current|camera\.position|dirHat|style\.transform\s*=/
  assert.doesNotMatch(
    window,
    projectionVocabulary,
    'expected the status card\'s own rendering to have no nearby reference to per-frame DOM measurement or 3D camera projection (getBoundingClientRect/useFrame/stageRef/labelElsRef/positionsRef/camera.position/dirHat/style.transform) -- any of those would reintroduce a projection-anchored dependency for the exact drift class this wave\'s fix is meant to eliminate structurally',
  )
})
