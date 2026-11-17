import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for docs/reviews/wave18-number-sense.md's two P1 findings, both scoped to
// this Wave 19 sibling fix in NumberSenseLab.tsx (this file only asserts source text -- it does
// NOT implement the fix, per this wave's worker split):
//
//   1. "Additional finding" -- place-value hotspot selection produced ZERO pixel-level change on
//      the abacus at runtime, confirmed by the reviewer's before/after screenshot diff, even
//      though `highlighted`/`activeHotspotId` were already correctly threaded through props (that
//      wiring is covered by ./numberSensePlaceValueHotspotStacking.test.ts and must stay green).
//      Root cause per the report: every material in this scene is declared `transparent`, so
//      three.js sorts them by distance instead of paint order, and the highlight glow plane's
//      z-offset alone was not a reliable way to guarantee it paints on top. A correct fix must not
//      depend on that default sort order to become visible.
//   2. "Check 3c" -- the hotspot-detail state's only dismiss control ("Back to Place Value",
//      rendered inside DetailPanel) sits below the fold of the aside's default scroll position on
//      mobile (measured clientHeight 138 vs scrollHeight 245+), so a learner cannot see or tap a
//      way out of hotspot-detail view without first discovering an easy-to-miss scroll gesture.
//      A correct fix adds a NEW element that is visible without any scroll.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why, and
// ./numberSensePlaceValueHotspotStacking.test.ts for the established sibling-file precedent).
//
// At the moment this file was written, finding #1's fix had already landed (AbacusRod's glow
// plane carries renderOrder={999} + depthTest={false}, and the rod's own cylinder material tints
// via emissive/emissiveIntensity) -- tests 1-2 below are expected GREEN. Finding #2's mobile
// dismiss control had NOT landed yet -- tests 3-4 below are expected RED until the sibling fix
// lands. That is correct, not a bug in this test (see ./numberSensePlaceValueHotspotStacking.test.ts's
// own comment on this precedent).
//
// Run with: node --test src/routes/numberSenseAbacusHighlightAndMobileDismiss.test.ts

const NUMBER_SENSE_LAB_PATH = fileURLToPath(new URL('./NumberSenseLab.tsx', import.meta.url))
const src = readFileSync(NUMBER_SENSE_LAB_PATH, 'utf8')

function getAbacusRodBody(): string {
  const fnIdx = src.indexOf('function AbacusRod(')
  assert.ok(fnIdx !== -1, 'expected an AbacusRod component to still exist in NumberSenseLab.tsx')
  const nextFnIdx = src.indexOf('function AbacusBead', fnIdx)
  assert.ok(nextFnIdx !== -1, 'expected an AbacusBead component to follow AbacusRod (used as a body boundary)')
  return src.slice(fnIdx, nextFnIdx)
}

test('AbacusRod: the highlighted glow plane carries an explicit renderOrder + depthTest={false}, not just a z-offset relying on default transparent-object sort order', () => {
  const rodBody = getAbacusRodBody()

  const gateIdx = rodBody.indexOf('{highlighted && (')
  assert.ok(
    gateIdx !== -1,
    'expected AbacusRod to still conditionally render a glow element when `highlighted` is true',
  )
  // Scope the check to the highlighted-gated JSX block only, so this doesn't accidentally match
  // an unrelated renderOrder/depthTest elsewhere in the file. Window is generous enough to cover
  // the leading explanatory comment + <mesh>/<planeGeometry>/<meshBasicMaterial> block.
  const gatedBlock = rodBody.slice(gateIdx, gateIdx + 1100)

  assert.match(
    gatedBlock,
    /renderOrder=\{\d+\}/,
    'expected the highlighted glow <mesh> to carry an explicit numeric renderOrder so it paints deterministically on top of its same-z-ish siblings, instead of depending on three.js\'s default distance-based sort of transparent objects -- that default sort is exactly what the wave18 reviewer\'s pixel-diff showed silently producing zero visible pixels (mirrors the renderOrder={999} pattern OrbitSandbox.tsx uses for its Ceres "must never get lost" halo ring)',
  )
  assert.match(
    gatedBlock,
    /depthTest=\{false\}/,
    'expected the highlighted glow material to set depthTest={false} alongside renderOrder, so it is immune to depth-buffer occlusion order as well as paint order -- both properties together (not renderOrder alone) are what make this robust against the sort-order bug the wave18 report described',
  )
})

test('AbacusRod: the rod\'s own base (cylinder) material tints via emissive/emissiveIntensity driven by the `highlighted` prop, as a second guaranteed-visible signal independent of the overlay glow plane', () => {
  const rodBody = getAbacusRodBody()

  // Anchor on the base rod mesh specifically (the cylinderGeometry), not the glow plane's
  // planeGeometry, so this test fails if emissive wiring is only present on the (already
  // separately-tested) overlay plane and not on geometry that was already drawing every frame
  // regardless of highlight state.
  const cylinderIdx = rodBody.indexOf('cylinderGeometry')
  assert.ok(cylinderIdx !== -1, "expected AbacusRod's base mesh to still use a cylinderGeometry")
  const materialBlock = rodBody.slice(cylinderIdx, cylinderIdx + 500)

  assert.match(
    materialBlock,
    /emissive=\{highlighted\s*\?/,
    'expected the rod cylinder\'s material `emissive` prop to be conditionally driven by the `highlighted` prop (e.g. `emissive={highlighted ? glowColor : \'#000000\'}`), not a hardcoded constant color -- this is required to be an independent second visible signal from the overlay glow plane, not just prop-threading (activeHotspotId reaching this component was already correct pre-fix, per numberSensePlaceValueHotspotStacking.test.ts)',
  )
  assert.match(
    materialBlock,
    /emissiveIntensity=\{highlighted\s*\?/,
    'expected emissiveIntensity to likewise be conditionally driven by `highlighted` (0 when off, > 0 when on) -- an emissive color alone with intensity locked at 0 (or a hardcoded non-zero constant) would not actually toggle any visible tint when the hotspot selection changes',
  )
})

/** Slice out the mobile/detail <aside> (ref={detailScrollRef} ... </aside>), scoping every
 *  assertion below to that wrapper so nothing accidentally matches the unrelated left-rail
 *  <aside> (the ContentNav list, ~line 549) or content elsewhere in the file. */
function getDetailAsideSlice(): string {
  const startIdx = src.indexOf('ref={detailScrollRef}')
  assert.ok(startIdx !== -1, 'expected the mobile/detail <aside ref={detailScrollRef}> wrapper to still exist')
  const closeIdx = src.indexOf('</aside>', startIdx)
  assert.ok(closeIdx !== -1, 'expected a matching </aside> closing tag after detailScrollRef')
  return src.slice(startIdx, closeIdx)
}

/** Find every className block inside `text` that includes `lg:hidden`, along with enough
 *  surrounding context to determine what gates it and what its click handler does. Used to
 *  distinguish the (already-existing, decoy) "Scroll for more" hint -- which also carries both
 *  `sticky` and `lg:hidden` but is gated by `detailOverflowing`, not `activeHotspotId`, and has no
 *  click handler -- from the new mobile dismiss control this test is pinning down. */
function findLgHiddenBlocks(text: string) {
  const blocks: { className: string; before: string; after: string }[] = []
  const classRe = /className="([^"]*)"/g
  let m: RegExpExecArray | null
  while ((m = classRe.exec(text))) {
    if (/\blg:hidden\b/.test(m[1])) {
      blocks.push({
        className: m[1],
        before: text.slice(Math.max(0, m.index - 300), m.index),
        after: text.slice(m.index, m.index + 600),
      })
    }
  }
  return blocks
}

function findMobileDismissCandidate(asideSlice: string) {
  return findLgHiddenBlocks(asideSlice).find(
    (b) =>
      /\b(sticky|fixed)\b/.test(b.className) &&
      /activeHotspotId/.test(b.before) &&
      !/detailOverflowing/.test(b.before),
  )
}

test('NumberSenseLab: a NEW mobile-only, non-statically-positioned dismiss control appears in the hotspot-detail <aside>, gated on activeHotspotId (not on detailOverflowing/scroll state)', () => {
  const asideSlice = getDetailAsideSlice()

  // Sanity check: the pre-existing "Scroll for more" hint (gated by `detailOverflowing`, not
  // `activeHotspotId`) is expected to remain present and unaffected -- if this stops matching,
  // something else changed in the aside and the candidate-exclusion logic below may no longer be
  // meaningful.
  assert.match(
    asideSlice,
    /detailOverflowing[\s\S]{0,200}sticky[\s\S]{0,700}Scroll for more/,
    'expected the existing detailOverflowing-gated "Scroll for more" affordance to still be present (this test must not accidentally count that element as satisfying the NEW activeHotspotId-gated dismiss control requirement below)',
  )

  const candidate = findMobileDismissCandidate(asideSlice)
  assert.ok(
    candidate,
    'expected a NEW element inside the hotspot-detail <aside> whose className combines `lg:hidden` with a non-static positioning keyword (`sticky` or `fixed`), gated on `activeHotspotId` being set (not on `detailOverflowing`) -- i.e. visible without any scroll, unlike the existing "Back to Place Value" link inside DetailPanel which is part of the normal scrollable flow and was measured by the wave18 reviewer at y≈668.6, entirely below the aside\'s visible 138px-tall clipped region on mobile (Check 3c, P1). A control gated by `detailOverflowing` (like the pre-existing "Scroll for more" hint) does not satisfy this -- the whole point is it must render regardless of whether content overflows.',
  )
})

test('NumberSenseLab: the new mobile dismiss control clears the active hotspot using the same setActiveHotspotId(null) semantics passed to DetailPanel as onClearHotspot', () => {
  const asideSlice = getDetailAsideSlice()
  const candidate = findMobileDismissCandidate(asideSlice)
  assert.ok(candidate, 'expected the mobile dismiss control from the previous test to exist (re-derived here) before checking its click handler')

  const onClearHotspotMatch = asideSlice.match(/onClearHotspot=\{([^}]+)\}/)
  assert.ok(onClearHotspotMatch, 'expected <DetailPanel> to still be called with an onClearHotspot prop in this aside (used as the reference handler expression)')
  const onClearHotspotExpr = onClearHotspotMatch![1]

  const clearsHotspot =
    /setActiveHotspotId\(null\)/.test(candidate!.after) || candidate!.after.includes(onClearHotspotExpr)

  assert.ok(
    clearsHotspot,
    `expected the new mobile dismiss control's click handler to call setActiveHotspotId(null) directly, or reuse the exact same handler expression already passed to DetailPanel as onClearHotspot ("${onClearHotspotExpr}") -- a control that renders but doesn't actually clear activeHotspotId would be visible without fixing the underlying "no way out of hotspot-detail view without scrolling" usability issue from wave18 Check 3c`,
  )
})
