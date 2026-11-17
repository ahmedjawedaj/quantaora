import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Plants/Energy/Number Sense tasks: on mobile, a bottom sheet
// or side panel that scrolls internally (overflow-y-auto + a bounded max-height) still leaves a
// learner with no visible cue that more content sits below the fold unless something -- a
// gradient fade, a "Scroll for more" pill, a chevron -- actually signals it. NumberSenseLab
// already landed this shape this wave (see the "Wave 13 fix" comment above its `detailScrollRef`
// state): a ResizeObserver-driven `detailOverflowing` flag renders a `ChevronDown` + "Scroll for
// more" pill only when the panel is actually scrollable and not already at the bottom. PlantsLab
// and EnergyLab's Tune panels are this wave's targets for the same affordance and, as read at the
// start of this wave, have the scrollable region (`overflow-y-auto` + a height bound) but no
// visible cue at all.
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/viewport-resize harness -- see ./BranchLab.test.ts's own
// comment on why). The Plants/Energy cases below are expected to be RED until those sibling
// agents' fixes land this wave -- that's correct, not a bug in this test (see
// ./mobileSwitcherAffordance.test.ts for the established precedent).
//
// Run with: node --test src/routes/mobileScrollAffordance.test.ts

function routeSrc(fileName: string): string {
  return readFileSync(fileURLToPath(new URL(`./${fileName}`, import.meta.url)), 'utf8')
}

/** A visible scroll-cue marker: a bottom gradient fade (the pattern PhysicsLab.tsx's TunePanel
 *  already uses), an explicit "scroll" hint string, or a chevron/arrow icon paired with overflow
 *  content. Broad on purpose -- this test cares that *some* visible affordance exists, not which
 *  exact shape the sibling agent lands. */
function hasScrollCueMarker(source: string): boolean {
  return (
    /bg-gradient-to-t/.test(source) ||
    /scroll for more/i.test(source) ||
    /ChevronDown/.test(source) ||
    /aria-hidden="true"[\s\S]{0,200}?(?:gradient|chevron)/i.test(source)
  )
}

test('PlantsLab: Tune panel (function TunePanel) has both a bounded scroll region and a visible scroll-cue marker', () => {
  const source = routeSrc('PlantsLab.tsx')
  const fnIdx = source.indexOf('function TunePanel')
  assert.ok(fnIdx !== -1, 'expected a TunePanel component to still exist in PlantsLab.tsx')
  const body = source.slice(fnIdx, fnIdx + 8000)

  assert.match(
    body,
    /overflow-y-auto/,
    'expected PlantsLab.tsx TunePanel to still scroll internally on mobile (overflow-y-auto)',
  )
  assert.ok(
    hasScrollCueMarker(body),
    'expected PlantsLab.tsx TunePanel to render a visible scroll-cue (gradient fade / "scroll for more" text / chevron) so a learner on mobile knows more controls sit below the fold -- matches the pattern already landed in PhysicsLab.tsx\'s TunePanel and NumberSenseLab.tsx\'s DetailPanel affordance this same wave',
  )
})

test('EnergyLab: Tune panel (function TunePanel) has both a scrollable/bounded layout and a visible scroll-cue marker', () => {
  const source = routeSrc('EnergyLab.tsx')
  const fnIdx = source.indexOf('function TunePanel')
  assert.ok(fnIdx !== -1, 'expected a TunePanel component to still exist in EnergyLab.tsx')
  const body = source.slice(fnIdx, fnIdx + 8000)

  assert.match(
    body,
    /overflow-y-auto/,
    'expected EnergyLab.tsx TunePanel to still scroll internally on mobile (overflow-y-auto, per the Wave 10 P1 fix noted in this file)',
  )
  assert.ok(
    hasScrollCueMarker(body),
    'expected EnergyLab.tsx TunePanel (7 sliders) to render a visible scroll-cue so a learner on mobile knows more sliders sit below the fold -- the Wave 10 fix made the panel scrollable but did not add a visible cue',
  )
})

test('NumberSenseLab: the mobile DetailPanel aside has a live overflow-aware scroll-cue (Wave 13 fix)', () => {
  const source = routeSrc('NumberSenseLab.tsx')

  assert.match(
    source,
    /overflow-y-auto/,
    'expected the DetailPanel aside to remain scrollable (min-h-0 flex-1 overflow-y-auto)',
  )
  // The real fix is stateful (a ResizeObserver + scroll listener toggling a boolean), not a
  // static always-on cue -- confirm that shape specifically, not just any gradient div anywhere
  // in the file.
  assert.match(
    source,
    /scrollHeight\s*-\s*\w*\.?clientHeight/,
    'expected NumberSenseLab.tsx to compute real overflow (scrollHeight vs clientHeight) rather than showing a cue unconditionally',
  )
  assert.ok(
    hasScrollCueMarker(source),
    'expected NumberSenseLab.tsx to render a visible scroll-cue element ("Scroll for more" + ChevronDown) tied to that overflow state',
  )
})
