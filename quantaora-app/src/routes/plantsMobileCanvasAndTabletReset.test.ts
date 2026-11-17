import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Plants task (docs/reviews/wave14-COMBINED.md P1 #4):
// "mobile: full-bloom flower and tasseled-corn models clipped by the canvas badge overlay while
// the Tune panel is open; root cause is canvas dropping to ~32% of viewport height with the panel
// open (below the 40% bar). Tablet 1024x768: 'Reset' toolbar button ~60% obscured by BottomTray
// with overflow:hidden and no scroll cue."
//
// This is distinct from the existing ./plantsTunePanelOcclusion.test.ts (a Wave 11 regression guard
// for a *different*, already-fixed occlusion issue -- the Tune panel's own sheet height/width). This
// file targets the two specific #4a/#4b findings above instead.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/plantsMobileCanvasAndTabletReset.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const plantsLabSrc = readFileSync(srcPath('./PlantsLab.tsx'), 'utf8')
const bottomTraySrc = readFileSync(srcPath('../components/explorer/BottomTray.tsx'), 'utf8')

test('PlantsLab (#4a): the mobile lab-stage box height, with the Tune panel open, leaves at least a 40svh floor for the canvas once the Tune panel\'s own capped height is subtracted', () => {
  // The lab-stage wrapper's className carries `controlsOpen ? 'h-[NNsvh]' : 'h-[NNsvh]'` -- the
  // *open* branch is what's relevant here (that's when the canvas previously dropped to ~32svh).
  const stageHeightMatch = plantsLabSrc.match(/controlsOpen\s*\?\s*'h-\[(\d+)svh\]'\s*:\s*'h-\[(\d+)svh\]'/)
  assert.ok(stageHeightMatch, 'expected the lab-stage wrapper to carry a `controlsOpen ? \'h-[NNsvh]\' : \'h-[NNsvh]\'` className switch in PlantsLab.tsx')
  const stageHeightOpenSvh = Number(stageHeightMatch![1])

  // TunePanel's own mobile bottom-sheet wrapper carries a max-h-[NNsvh] cap (see the TunePanel
  // function's returned outer <div>). TunePanel's own parameter list is long (one prop per plant
  // control), so anchor on its `return (` rather than the function keyword itself.
  const tunePanelFnIdx = plantsLabSrc.indexOf('function TunePanel')
  assert.ok(tunePanelFnIdx !== -1, 'expected a TunePanel component to still exist in PlantsLab.tsx')
  const tunePanelReturnIdx = plantsLabSrc.indexOf('return (', tunePanelFnIdx)
  assert.ok(tunePanelReturnIdx !== -1, 'expected TunePanel to contain a `return (` statement')
  const tunePanelBody = plantsLabSrc.slice(tunePanelReturnIdx, tunePanelReturnIdx + 500)
  const tunePanelHeightMatch = tunePanelBody.match(/max-h-\[(\d+)svh\]/)
  assert.ok(tunePanelHeightMatch, 'expected TunePanel\'s outer wrapper to cap its mobile height with a max-h-[NNsvh] class')
  const tunePanelMaxSvh = Number(tunePanelHeightMatch![1])

  const remainingCanvasSvh = stageHeightOpenSvh - tunePanelMaxSvh
  assert.ok(
    remainingCanvasSvh >= 40,
    `expected the lab-stage's open-panel height (${stageHeightOpenSvh}svh) minus the Tune panel's own max height (${tunePanelMaxSvh}svh) to leave a canvas floor of at least 40svh (this app's established minimum-canvas-height convention, per NumberSenseLab's own Wave 13 fix) -- got only ${remainingCanvasSvh}svh remaining, which is what let the full-bloom flower / tasseled-corn growth models get clipped against the canvas badge overlay`,
  )
})

test('PlantsLab (#4a): the canvas viewport and the Tune panel are laid out as flex siblings on mobile, not an absolutely-positioned overlay that can draw on top of the canvas regardless of height math', () => {
  // The canvas viewport wrapper (`<div className="relative min-h-0 flex-1">`) must be a real flex
  // sibling of the Tune panel wrapper below it, not have the panel `absolute`-positioned over it
  // (below `lg`) -- an absolute overlay could still visually cover the canvas even if the height
  // arithmetic above looks fine on paper.
  assert.match(
    plantsLabSrc,
    /<div className="relative min-h-0 flex-1">/,
    'expected the canvas viewport to still be its own flex-1 box (not absolutely positioned) so the Tune panel below it can never draw on top of it',
  )
})

test('BottomTray (#4b): every cell keeps a height cap at every breakpoint (no sm:max-h-none escape hatch), so a long blurb can\'t grow the tray tall enough to push the toolbar\'s Reset button off the stage', () => {
  // Check actual className="..." attribute values only -- this file's own comment (explaining the
  // Wave 15 fix) mentions the string `sm:max-h-none` in prose, which a whole-file regex would
  // false-positive on even though that string is not present in any real className today.
  const classNames = [...bottomTraySrc.matchAll(/className="([^"]*)"/g)].map((m) => m[1])
  assert.ok(classNames.length > 0, 'expected BottomTray.tsx to still contain className="..." attributes')
  const anyEscapesHeightCap = classNames.some((c) => /\bsm:max-h-none\b/.test(c))
  assert.ok(
    !anyEscapesHeightCap,
    'expected no real className="..." in BottomTray.tsx to contain `sm:max-h-none` -- that class removes the height cap at sm+ (letting a long whyItMatters paragraph grow the whole tray\'s grid row, starving the canvas stage above it of vertical space at a 1024x768 tablet viewport and pushing CanvasControls\' last toolbar buttons, Reset among them, past the stage\'s bottom edge)',
  )
  const anyHeightCap = classNames.some((c) => /max-h-\[[\d.]+rem\]/.test(c))
  assert.ok(
    anyHeightCap,
    'expected BottomTray.tsx\'s real-world cell to still cap its content height with a max-h-[N.Nrem] class at every breakpoint',
  )
})

test('BottomTray (#4b): the height-capped cell offers a scroll affordance (overflow-y-auto), not overflow:hidden with no way to read the rest of a clipped blurb', () => {
  const capMatch = bottomTraySrc.match(/className="block max-h-\[[\d.]+rem\] ([^"]*)"/)
  assert.ok(capMatch, 'expected to find the height-capped <span> wrapping content.whyItMatters')
  assert.match(
    capMatch![1],
    /overflow-y-auto/,
    'expected the height-capped whyItMatters span to use overflow-y-auto (a real scroll affordance), not overflow-hidden (which silently truncates the text with no way to read the rest)',
  )
})
