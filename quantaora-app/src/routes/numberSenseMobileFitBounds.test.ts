import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Number Sense task (docs/reviews/wave16-number-sense.md /
// review-screenshots/wave16-2026-08-18/smoke/number-sense-mobile.png,
// review-screenshots/wave14-2026-08-18/number-sense/number-sense-abacus-mobile.png): at the
// shared 40svh mobile stage height, place value's soroban box (sized by aspect-[16/10] off the
// full stage width) computes taller than the vertical room left after the pt-20/pb-32 toolbar and
// bottom-overlay clearance, so it visually crowds/overlaps both the top toolbar and the bottom
// Meter/Tune-numbers overlay. The other 9 operations render inside an SVG viewBox that already
// scales cleanly within 40svh, so only place-value needs a taller mobile stage.
//
// Two-part fix (see NumberSenseLab.tsx's own Wave 17 comments at the `data-lab-stage` wrapper and
// at the place-value visual box): (1) place-value gets its own larger `h-[56svh]` mobile stage
// height instead of the shared `h-[40svh]`, and (2) a belt-and-suspenders `max-h-[calc(100%-1.5rem)]`
// clamp on the visual box itself guarantees a visible top/bottom margin even if 56svh is imprecise
// for a given device's real dynamic-viewport height. Both are scoped to place-value only (and to
// mobile only, via `sm:max-h-none` / the `lg:h-auto` override elsewhere) so the other 9 operations
// and the desktop layout are unaffected.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/numberSenseMobileFitBounds.test.ts

const NUMBER_SENSE_LAB_PATH = fileURLToPath(new URL('./NumberSenseLab.tsx', import.meta.url))
const src = readFileSync(NUMBER_SENSE_LAB_PATH, 'utf8')

function extractSvhHeight(classExpr: string): number {
  const match = classExpr.match(/h-\[(\d+)svh\]/)
  assert.ok(match, `expected to find an h-[<N>svh] class in: ${classExpr}`)
  return Number(match![1])
}

test('NumberSenseLab: the mobile lab-stage height is a componentId-conditional expression (not a single fixed value for every operation)', () => {
  const dataLabStageIdx = src.indexOf('data-lab-stage')
  assert.ok(dataLabStageIdx !== -1, 'expected a data-lab-stage wrapper to still exist in NumberSenseLab.tsx')
  const wrapperBlock = src.slice(dataLabStageIdx, dataLabStageIdx + 1400)

  const ternaryMatch = wrapperBlock.match(/componentId === 'place-value' \? '([^']+)' : '([^']+)'/)
  assert.ok(
    ternaryMatch,
    "expected the lab-stage wrapper's className to conditionally branch on `componentId === 'place-value'` for its mobile stage height, not use one fixed height for every operation",
  )
})

test('NumberSenseLab: place-value gets a distinctly LARGER mobile stage height than the other 9 operations', () => {
  const dataLabStageIdx = src.indexOf('data-lab-stage')
  const wrapperBlock = src.slice(dataLabStageIdx, dataLabStageIdx + 1400)
  const ternaryMatch = wrapperBlock.match(/componentId === 'place-value' \? '([^']+)' : '([^']+)'/)
  assert.ok(ternaryMatch, 'expected the place-value-conditional mobile stage height ternary to still exist')

  const placeValueHeight = extractSvhHeight(ternaryMatch![1])
  const otherOperationsHeight = extractSvhHeight(ternaryMatch![2])

  assert.ok(
    placeValueHeight > otherOperationsHeight,
    `expected place-value's mobile stage height (${placeValueHeight}svh) to be larger than the other operations' shared mobile stage height (${otherOperationsHeight}svh) -- place-value's soroban box (aspect-[16/10] off full stage width) computes taller than the other operations' SVG-viewBox content, so an equal height crowds/overlaps place-value against the top toolbar and bottom meter overlay on mobile`,
  )
})

test('NumberSenseLab: the place-value visual box carries a max-height clamp on mobile (guaranteeing top/bottom margin even if the stage-height allowance is imprecise), reset at a larger breakpoint', () => {
  const stageFnIdx = src.indexOf('function NumberSenseStage')
  assert.ok(stageFnIdx !== -1, 'expected a NumberSenseStage component to still exist in NumberSenseLab.tsx')
  const stageEnd = src.indexOf('function AdditionVisual')
  const stageBody = src.slice(stageFnIdx, stageEnd !== -1 ? stageEnd : stageFnIdx + 6000)

  const clampMatch = stageBody.match(/operationId === 'place-value' && '(max-h-\[[^\]]+\][^']*)'/)
  assert.ok(
    clampMatch,
    "expected the place-value visual box's className to conditionally add a max-h-[...] clamp when operationId === 'place-value', not rely solely on the parent stage's own height allowance",
  )
  assert.match(
    clampMatch![1],
    /sm:max-h-none|lg:max-h-none|md:max-h-none/,
    'expected the mobile max-height clamp to be reset at a larger breakpoint (e.g. sm:max-h-none), so desktop framing (where this box already fits fine) is unaffected',
  )
})
