import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the mobile QA fix at 390x844: the right-hand aside
// (scenario chips + DetailPanel) is squeezed to ~54px tall by the fixed
// h-[66svh] stage plus BottomTray in a short flex column, which made a graph
// rendered inside that aside technically present but practically unreachable
// (scrollHeight ~401 inside a 54px box, no visible affordance to scroll it).
// The fix moves the mobile line-graph readout into the "Tune algebra" toggle
// panel that already lives inside the tall stage area, so it never depends on
// that squeezed region. Static source-text checks only, matching this repo's
// plain node:test + native TS type-stripping convention (see
// mathTableScrollContainment.test.ts / BranchLab.test.ts for the same
// approach and rationale).
//
// Run with: node --test src/routes/mathMobileGraphAccessibility.test.ts

const MATH_LAB_PATH = fileURLToPath(new URL('./MathLab.tsx', import.meta.url))
const src = readFileSync(MATH_LAB_PATH, 'utf8')

test('the mobile aside no longer renders its own LinearGraph (the squeezed 54px region is not relied on)', () => {
  const asideStart = src.indexOf('Scenario switcher for mobile/tablet')
  assert.ok(asideStart !== -1, 'expected the mobile scenario-switcher block comment to still exist')
  const detailPanelIdx = src.indexOf('<DetailPanel', asideStart)
  assert.ok(detailPanelIdx !== -1, 'expected <DetailPanel to still follow the mobile scenario switcher')
  const mobileAsideRegion = src.slice(asideStart, detailPanelIdx)
  assert.doesNotMatch(
    mobileAsideRegion,
    /<LinearGraph/,
    'the mobile aside (chips + DetailPanel) must not render its own LinearGraph -- that region can be squeezed to ~54px tall and its scroll is not discoverable',
  )
})

test('the stage-level "Tune algebra" panel carries a md:hidden graph + slope readout reachable without depending on the squeezed aside', () => {
  const panelIdx = src.indexOf('data-mobile-graph')
  assert.ok(panelIdx !== -1, 'expected a data-mobile-graph marker inside the controlsOpen panel')
  const panelRegion = src.slice(panelIdx, panelIdx + 700)

  assert.match(panelRegion, /md:hidden/, 'expected the mobile graph block to be scoped to below md (where the stage graph pane is display:none)')
  assert.match(panelRegion, /<LinearGraph/, 'expected the LinearGraph line chart inside the mobile graph block')
  assert.match(panelRegion, /Slope/, 'expected a Slope readout alongside the graph')
})

test('the object stage keeps its full mobile height (h-[66svh]) -- the graph toggle must not shrink the main manipulative', () => {
  assert.match(
    src,
    /data-lab-stage[\s\S]{0,80}h-\[66svh\]/,
    'expected the stage wrapper to still reserve h-[66svh] on mobile so the algebra object stays a usable size',
  )
})

test('equation, current point (x and y), and slope are all present in the controlsOpen readout meters', () => {
  const panelIdx = src.indexOf('data-mobile-graph')
  const controlsPanelStart = src.lastIndexOf('grid max-h-[min(', panelIdx)
  assert.ok(controlsPanelStart !== -1, 'expected the expanded controlsOpen panel wrapper before the mobile graph block')
  const region = src.slice(controlsPanelStart, panelIdx + 700)

  assert.match(region, /label="Equation"/, 'expected an Equation meter')
  assert.match(region, /label=\{base\.xLabel\}/, 'expected a current-x meter')
  assert.match(region, /label=\{base\.yLabel\}/, 'expected a current-y meter')
  assert.match(region, /label="Slope"/, 'expected a Slope meter')
})

test('the controlsOpen panel caps its mobile height below the CanvasControls toolbar (z-30) so the Equation/current-point meters are not painted over', () => {
  const controlsPanelStart = src.lastIndexOf('grid max-h-[min(', src.indexOf('data-mobile-graph'))
  const panelClassEnd = src.indexOf('"', controlsPanelStart + 'grid '.length)
  const panelClass = src.slice(controlsPanelStart, panelClassEnd)

  const mobileMax = panelClass.match(/max-h-\[min\((\d+)svh,(\d+)rem\)\]/)
  assert.ok(mobileMax, 'expected a mobile (non-sm) max-h-[min(<N>svh,<M>rem)] on the controlsOpen panel')
  assert.ok(
    Number(mobileMax[1]) <= 60,
    'the mobile max-height must stay well below the 66svh stage height so the panel cannot grow tall enough to reach behind the top toolbar (verified overlap at 70svh in manual QA at 390x844)',
  )
  assert.match(panelClass, /sm:max-h-\[min\(\d+svh,\d+rem\)\]/, 'expected an sm: override restoring the larger panel height once the toolbar collapses to a narrow left column')
})
