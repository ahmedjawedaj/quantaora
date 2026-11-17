import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { moonById } from '../../data/moons.ts'

// Regression guard for docs/reviews/wave20-moons.md's P0: at desktop 1440x900, the label-avoidance
// fix in place at the time pushed a "below"-direction hotspot label clear of the bottom caption
// pill by growing its margin, with no awareness of the canvas stage's own `overflow: hidden` clip
// boundary (`[data-lab-stage]`) -- Enceladus's "Tiger Stripes" and "South Polar Geysers" labels got
// pushed entirely past the stage's visible clip boundary (100% invisible), and the two labels
// overlapped each other on top of that.
//
// Wave 21 fixed this by measuring the stage's real clip rect every frame and clamping a
// deterministically-stacked N-label layout inside it (see this file's own prior revision, and
// ./moonsHotspotLabelDeconfliction.test.ts for why that whole N-simultaneous-label design was then
// replaced outright this wave). Wave 23 sidesteps the escape-past-the-clip-boundary failure mode
// differently: instead of trying to fit an arbitrary number of always-on labels inside a shrinking
// safe rectangle, it (a) shows at most ONE selected-hotspot label at a time (far less likely to run
// out of room) and (b) moves the reliable, exact-id way to reach every hotspot -- the accessible
// hotspot list (data-testid="moon-hotspot-list") -- OUTSIDE the clipped stage entirely, so it is
// structurally immune to the "pushed past overflow:hidden" failure mode: it was never inside the
// clipped element in the first place.
//
// This file therefore guards two things: (1) the external hotspot list really does live outside
// `[data-lab-stage]`'s DOM subtree (the actual invariant that makes it immune to the wave20 P0's
// failure mode), with real 44x44-equivalent touch targets per item, and (2) the real Enceladus
// tiger-stripes/south-polar-geysers pair -- the exact wave20-moons.md failing geometry -- is
// reachable through that generic, moon-agnostic list rather than a hardcoded special case.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/components/explorer/moonsHotspotLabelStageBounds.test.ts

const MOONS_LAB_PATH = fileURLToPath(new URL('../../routes/MoonsLab.tsx', import.meta.url))
const moonsLabSrc = readFileSync(MOONS_LAB_PATH, 'utf8')

const MOON_MODEL_PATH = fileURLToPath(new URL('./MoonModel.tsx', import.meta.url))
const moonModelSrc = readFileSync(MOON_MODEL_PATH, 'utf8')

/**
 * Finds the source span `[openIdx, closeIdx)` of the `<div ...>...</div>` block whose opening tag
 * starts at `openIdx`, via depth-balanced matching of `<div ...>` / `</div>` tokens (self-closing
 * `<div .../>` tags don't change depth). Mirrors this repo's existing convention of extracting a
 * source span via balanced-token matching (see moonsHotspotLabelDeconfliction.test.ts's sibling
 * files' brace-matching helpers) applied to JSX tags instead of braces.
 */
function findDivSpan(text: string, openIdx: number): { openIdx: number; closeIdx: number } {
  const tagRe = /<div\b[^>]*>|<\/div>/g
  tagRe.lastIndex = openIdx
  let depth = 0
  let m: RegExpExecArray | null
  while ((m = tagRe.exec(text))) {
    const tok = m[0]
    if (tok === '</div>') {
      depth -= 1
      if (depth === 0) return { openIdx, closeIdx: m.index + tok.length }
    } else if (!/\/>\s*$/.test(tok)) {
      depth += 1
    }
    // self-closing <div .../> leaves depth unchanged
  }
  throw new Error('findDivSpan: no matching closing </div> found -- MoonsLab.tsx\'s data-lab-stage div structure may have changed')
}

test('MoonsLab: the accessible hotspot list (data-testid="moon-hotspot-list") is declared somewhere in MoonsLab.tsx', () => {
  assert.match(
    moonsLabSrc,
    /data-testid=(?:"moon-hotspot-list"|\{"moon-hotspot-list"\})/,
    'expected MoonsLab.tsx to render an external accessible hotspot list container with data-testid="moon-hotspot-list"',
  )
})

test('MoonsLab: the "moon-hotspot-list" is rendered OUTSIDE the [data-lab-stage] div\'s own DOM subtree, so it is never subject to that element\'s overflow:hidden clip -- the actual fix for the wave20-moons.md P0 class of bug', () => {
  const stageOpenIdx = moonsLabSrc.indexOf('data-lab-stage')
  assert.ok(stageOpenIdx !== -1, 'expected a `data-lab-stage` marker to still exist in MoonsLab.tsx')
  // Walk back to the start of that div's opening tag (data-lab-stage is one attribute among several).
  const tagStart = moonsLabSrc.lastIndexOf('<div', stageOpenIdx)
  assert.ok(tagStart !== -1, 'expected the data-lab-stage attribute to sit inside a <div ...> opening tag')

  const { closeIdx } = findDivSpan(moonsLabSrc, tagStart)
  const stageBlock = moonsLabSrc.slice(tagStart, closeIdx)

  assert.doesNotMatch(
    stageBlock,
    /moon-hotspot-list/,
    'expected the "moon-hotspot-list" external list to NOT be nested inside the [data-lab-stage] div -- if it is, it inherits that div\'s overflow:hidden clip and can suffer the exact same off-clip-invisible failure the wave20-moons.md P0 documented',
  )

  const outsideText = moonsLabSrc.slice(0, tagStart) + moonsLabSrc.slice(closeIdx)
  assert.match(
    outsideText,
    /moon-hotspot-list/,
    'expected "moon-hotspot-list" to actually appear somewhere OUTSIDE the [data-lab-stage] block (not simply absent from the file)',
  )
})

test('MoonsLab: each hotspot list item ("moon-hotspot-item-<id>") carries at least a 44px-equivalent minimum touch target on both axes', () => {
  const itemMatch = moonsLabSrc.match(/data-testid=\{[^}]*moon-hotspot-item-[^}]*\}/)
  assert.ok(itemMatch, 'expected a moon-hotspot-item-<id> element in MoonsLab.tsx')
  const idx = itemMatch!.index!
  const windowText = moonsLabSrc.slice(Math.max(0, idx - 400), idx + 400)

  const minHeightOk = /min-h-\[44px\]/.test(windowText) || /\bmin-h-11\b/.test(windowText) || /\bh-11\b/.test(windowText)
  const minWidthOk = /min-w-\[44px\]/.test(windowText) || /\bmin-w-11\b/.test(windowText) || /\bw-11\b/.test(windowText)
  assert.ok(
    minHeightOk,
    `expected a min-h-[44px]/min-h-11/h-11-equivalent class near the moon-hotspot-item element (window: ${JSON.stringify(windowText.slice(0, 200))}...)`,
  )
  assert.ok(
    minWidthOk,
    `expected a min-w-[44px]/min-w-11/w-11-equivalent class near the moon-hotspot-item element (window: ${JSON.stringify(windowText.slice(0, 200))}...)`,
  )
})

test('MoonsLab: the hotspot list is built generically from the active moon\'s own real hotspots (not a hardcoded/special-cased list), so Enceladus\'s real tiger-stripes/south-polar-geysers pair is automatically covered', () => {
  assert.match(
    moonsLabSrc,
    /\.hotspots\.map\(/,
    'expected the hotspot list to be built via a generic `.hotspots.map(...)` over the active moon\'s real hotspot array, not a hardcoded per-moon list -- this is what guarantees the fix applies to every moon, including the real wave20-moons.md Enceladus failure case',
  )

  const enceladus = moonById.enceladus
  assert.ok(enceladus, 'expected an "enceladus" entry in src/data/moons.ts')
  const tiger = enceladus.hotspots.find((h) => h.id === 'tiger-stripes')
  const geyser = enceladus.hotspots.find((h) => h.id === 'south-polar-geysers')
  assert.ok(tiger && tiger.label === 'Tiger Stripes', 'expected src/data/moons.ts to still define the "tiger-stripes" hotspot labeled "Tiger Stripes"')
  assert.ok(geyser && geyser.label === 'South Polar Geysers', 'expected src/data/moons.ts to still define the "south-polar-geysers" hotspot labeled "South Polar Geysers"')
  assert.notStrictEqual(tiger!.id, geyser!.id, 'sanity: the two real wave20-moons.md hotspots must have distinct ids so the list can address each unambiguously')
})

test('MoonModel: the N-label stacking-specific fragments (items.sort by naturalTop / a placedTops array) are gone -- NOTE this deliberately does NOT assert topSafe/bottomSafe/leftSafe/rightSafe safe-rectangle clamping itself is gone, since the single remaining selected-hotspot label still legitimately needs to clamp itself inside the stage bounds (just never negotiate space against a second label any more)', () => {
  for (const needle of ['items.sort((a, b) => a.naturalTop - b.naturalTop)', 'placedTops']) {
    assert.ok(!moonModelSrc.includes(needle), `expected the old N-label stacking fragment ("${needle}") to be gone from MoonModel.tsx`)
  }
})

// ─────────────────────────────── Wave 24: clustering must not leak into the external list ────────
//
// Wave 24 teaches the on-canvas scene to give distinct feedback for whichever hotspot within a
// cluster is actively selected (see moonsHotspotStructuralSelection.test.ts and
// moonsHotspotLabelDeconfliction.test.ts). That clustering concept (`isClustered`/`clusteredIds`)
// belongs entirely to the 3D canvas's own crowding problem -- the external `moon-hotspot-list` this
// file already guards exists specifically because it never needs to know about on-canvas crowding at
// all (plain DOM rows never overlap on screen). This test guards that separation stays intact: the
// list's own item markup must never reference clustering state, so its 44px-equivalent tap targets
// (asserted above) can never be shrunk, hidden, or disabled based on whether a hotspot happens to be
// visually clustered on the canvas right now.

test('MoonsLab: the external hotspot list\'s per-item markup never references on-canvas clustering state (isClustered/clusteredIds/cluster) -- its rendering and 44px tap targets must stay entirely independent of whether a hotspot happens to be visually clustered on the 3D canvas', () => {
  const itemMatch = moonsLabSrc.match(/data-testid=\{[^}]*moon-hotspot-item-[^}]*\}/)
  assert.ok(itemMatch, 'expected a moon-hotspot-item-<id> element in MoonsLab.tsx')
  const mapIdx = moonsLabSrc.lastIndexOf('.hotspots.map(', itemMatch.index)
  assert.ok(mapIdx !== -1, 'expected the hotspot item to be produced inside a `.hotspots.map(...)` call')
  const windowText = moonsLabSrc.slice(mapIdx, itemMatch.index! + 800)
  assert.doesNotMatch(
    windowText,
    /\bisClustered\b|\bclusteredIds\b|\bcluster\b/i,
    `expected the external hotspot list's .map(...) block to be entirely independent of on-canvas clustering state (found a cluster-related reference near the list item: ${JSON.stringify(windowText.slice(0, 200))}...) -- clustering on the 3D canvas must never shrink/hide/disable an item in this list`,
  )
})
