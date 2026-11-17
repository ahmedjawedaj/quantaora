import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Distinct regression guard from ./mathTableRowControlHitArea.test.ts, which covers per-row
// +/- hit-area wiring and header-cell mobile-width accommodation. This file covers a different
// invariant: the TableManipulative content sits inside MathStage's fixed-aspect-ratio,
// `overflow-hidden` canvas card (see the `aspect-[16/10] ... overflow-hidden` wrapper around
// every domain's manipulative). On a short/mobile viewport, the table's natural height (header +
// A/B/C/Out rows + Total row + +/- controls) can exceed that fixed box. The Wave 13 fix (see the
// comment above TableManipulative's return in MathManipulativesLab.tsx) made the table's own
// wrapper `h-full` + `overflow-y-auto` so it scrolls *within* that bounded box instead of being
// silently clipped by the ancestor's `overflow-hidden` with no way to reach the rest. This test
// guards that specific pairing (bounded height + internal scroll, no `overflow-hidden` on the
// table's own wrapper) so a future edit can't quietly drop `overflow-y-auto` or `h-full` and
// reintroduce clipped/unreachable rows (e.g. row C or the Total row) on mobile.
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/viewport-resize harness -- see ./BranchLab.test.ts's own
// comment on why).
//
// Run with: node --test src/routes/mathTableScrollContainment.test.ts

const MATH_LAB_PATH = fileURLToPath(new URL('./MathManipulativesLab.tsx', import.meta.url))
const mathLabSrc = readFileSync(MATH_LAB_PATH, 'utf8')

function tableManipulativeBody(): string {
  const fnIdx = mathLabSrc.indexOf('function TableManipulative')
  assert.ok(fnIdx !== -1, 'expected a TableManipulative component to still exist in MathManipulativesLab.tsx')
  const nextFnIdx = mathLabSrc.indexOf('\nfunction ', fnIdx + 10)
  return mathLabSrc.slice(fnIdx, nextFnIdx === -1 ? mathLabSrc.length : nextFnIdx)
}

test('MathStage: the shared canvas card is a fixed-aspect-ratio, overflow-hidden box (sanity check for what TableManipulative scrolls inside of)', () => {
  assert.match(
    mathLabSrc,
    /aspect-\[16\/10\][\s\S]{0,150}overflow-hidden/,
    'expected MathStage\'s outer card to still combine a fixed aspect ratio with overflow-hidden -- if this ever changes, the scroll-containment invariant below would need to change with it',
  )
})

test('TableManipulative: its own content wrapper is h-full + overflow-y-auto (not overflow-hidden), so rows scroll into view instead of being clipped by MathStage\'s fixed-height card', () => {
  const body = tableManipulativeBody()
  const wrapperMatch = body.match(/<div className="([^"]*)"/)
  assert.ok(wrapperMatch, 'expected TableManipulative to render a wrapping <div className="..."> as its outermost element')
  const wrapperClass = wrapperMatch![1]

  assert.match(
    wrapperClass,
    /\boverflow-y-auto\b/,
    'expected the TableManipulative wrapper div to scroll internally (overflow-y-auto) so every row (including row C and the Total row) stays reachable on short/mobile viewports instead of being clipped by MathStage\'s overflow-hidden ancestor',
  )
  assert.doesNotMatch(
    wrapperClass,
    /\boverflow-hidden\b/,
    'expected the wrapper NOT to also carry overflow-hidden -- combined with a fixed-height ancestor that would silently hide rows below the fold with no way to scroll to them',
  )
  assert.match(
    wrapperClass,
    /\bh-full\b/,
    'expected the wrapper to inherit MathStage\'s bounded aspect-ratio height (h-full) -- overflow-y-auto only has an effect if the element itself has a bounded height to scroll within, so this pairing is what actually makes the row-scroll fix work rather than the table simply overflowing the page unclipped and unscrollable',
  )
})
