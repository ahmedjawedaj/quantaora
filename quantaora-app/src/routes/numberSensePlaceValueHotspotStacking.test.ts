import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Number Sense task (docs/reviews/wave14-COMBINED.md P0 #1):
// place value's 4 HotspotButtons are rendered as later JSX siblings of the place-value stage's
// <AbacusStage> (see NumberSenseStage: `{operationId === 'place-value' ? <AbacusStage .../> : ...}`
// followed by `{hotspotPositions.map(... <HotspotButton .../>)}`), which normally means later-DOM
// wins the stacking order. But AbacusStage's own outer wrapper carries an explicit `relative z-10`
// class (so its R3F <Canvas> sits in its own stacking context at z-index 10), while HotspotButton's
// className carries no z-index at all (z-index: auto). Per CSS stacking rules, an element with an
// explicit z-index of N always paints above a sibling with z-index:auto, regardless of DOM order --
// so the abacus canvas visually and pointer-event-wise sits ON TOP of the 4 place-value hotspots,
// intercepting every click/tap before it ever reaches the button underneath. A correct fix needs
// HotspotButton's own stacking to be at or above AbacusStage's z-10 (e.g. a z-20+ class), not merely
// later in the DOM.
//
// Also guards the file's own P1 note: "hotspot selection produces no visible change on the abacus
// model itself (AbacusStage never receives activeHotspotId)" -- NumberSenseStage already tracks
// `activeHotspotId` for every other operation's SVG hotspots, but place value's own
// `<AbacusStage controls={controls} onChangeControls={onChangeControls} xrayActive={xrayActive}
// autoRotate={autoRotate} />` call never threads it through, so AbacusModel/AbacusRod/AbacusBead
// have no way to react to which hotspot (e.g. "hs-hundreds") is currently selected.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why). Expected to
// be RED until this wave's Number Sense sibling fix lands -- that's correct, not a bug in this test
// (see ./mobileSwitcherAffordance.test.ts for the established precedent of writing a test correct
// and letting it stay red until the owning fix lands).
//
// Run with: node --test src/routes/numberSensePlaceValueHotspotStacking.test.ts

const NUMBER_SENSE_LAB_PATH = fileURLToPath(new URL('./NumberSenseLab.tsx', import.meta.url))
const src = readFileSync(NUMBER_SENSE_LAB_PATH, 'utf8')

function extractZIndex(classNameBlock: string): number | null {
  const match = classNameBlock.match(/\bz-\[?(\d+)\]?\b/)
  return match ? Number(match[1]) : null
}

test('NumberSenseLab: AbacusStage still wraps its canvas in an explicit-z-index positioning context (sanity check for the next test)', () => {
  const fnIdx = src.indexOf('function AbacusStage')
  assert.ok(fnIdx !== -1, 'expected an AbacusStage component to still exist in NumberSenseLab.tsx')
  const body = src.slice(fnIdx, src.indexOf('function AbacusRegroupPreview'))
  const outerDivMatch = body.match(/return \(\s*<div className="([^"]*)"/)
  assert.ok(outerDivMatch, "expected AbacusStage's returned JSX to open with a <div className=\"...\">")
  const abacusZ = extractZIndex(outerDivMatch![1])
  assert.ok(abacusZ !== null, 'expected AbacusStage\'s outer wrapper to carry an explicit z-index class')
})

test('NumberSenseLab: HotspotButton renders above (or at least even with) AbacusStage\'s canvas wrapper in stacking order, not with z-index:auto', () => {
  const fnIdx = src.indexOf('function AbacusStage')
  const abacusBody = src.slice(fnIdx, src.indexOf('function AbacusRegroupPreview'))
  const abacusOuterDivMatch = abacusBody.match(/return \(\s*<div className="([^"]*)"/)
  const abacusZ = extractZIndex(abacusOuterDivMatch![1]) ?? 0

  const hotspotFnIdx = src.indexOf('function HotspotButton')
  assert.ok(hotspotFnIdx !== -1, 'expected a HotspotButton component to still exist in NumberSenseLab.tsx')
  const hotspotBody = src.slice(hotspotFnIdx, hotspotFnIdx + 2000)
  const hotspotClassMatch = hotspotBody.match(/className="([^"]*)"/)
  assert.ok(hotspotClassMatch, "expected HotspotButton's <button> to carry a className")
  const hotspotZ = extractZIndex(hotspotClassMatch![1])

  assert.ok(
    hotspotZ !== null && hotspotZ >= abacusZ,
    `expected HotspotButton's className to carry an explicit z-index class >= AbacusStage's own wrapper z-index (${abacusZ}), so the 4 place-value hotspots (hundreds/tens/ones/digit-number) receive pointer events instead of the abacus <Canvas> intercepting every click -- got hotspot z-index: ${hotspotZ ?? '(none / auto)'}. This must hold for both desktop and mobile since HotspotButton's className carries no responsive (sm:/lg:) variants today, i.e. one fix covers both viewports.`,
  )
})

test('NumberSenseLab: selecting a place-value hotspot reaches AbacusStage (activeHotspotId is threaded through), not silently dropped', () => {
  const stageFnIdx = src.indexOf('function NumberSenseStage')
  assert.ok(stageFnIdx !== -1, 'expected a NumberSenseStage component to still exist in NumberSenseLab.tsx')
  const stageBody = src.slice(stageFnIdx, src.indexOf('function AdditionVisual'))

  const abacusCallMatch = stageBody.match(/<AbacusStage\b([\s\S]*?)\/>/)
  assert.ok(abacusCallMatch, 'expected NumberSenseStage to render <AbacusStage ... /> for the place-value operation')
  assert.match(
    abacusCallMatch![1],
    /activeHotspotId=\{activeHotspotId\}/,
    'expected <AbacusStage> to be passed activeHotspotId={activeHotspotId} (mirroring how every other operation\'s SVG hotspots already receive it via HotspotButton) so selecting a place-value hotspot (e.g. "hs-hundreds") can visibly change the abacus model, instead of the click having no effect on the 3D scene at all',
  )
})
