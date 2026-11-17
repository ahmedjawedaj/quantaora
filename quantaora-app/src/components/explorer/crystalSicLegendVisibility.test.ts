import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Crystal task (docs/reviews/wave14-COMBINED.md P1 #2): "Silicon
// Carbide's material-distinguishing color legend renders behind the toolbar at both viewports."
// (The sibling half of that same finding -- the on-canvas caption text wrapping illegibly behind
// the toolbar at desktop -- was already fixed; see ChemistryLab.tsx's own comment above its
// `data-canvas-overlay` caption pill, which now uses `sm:left-20 sm:right-4` to clear the rail. The
// legend is a separate element that comment doesn't mention.)
//
// CrystalViewer.tsx's element legend (only rendered for Silicon Carbide today, the one crystal
// with more than one distinctly colored "-atom" hotspot) used to be positioned `absolute left-3
// top-3 z-10`. CanvasControls.tsx's toolbar rail (`data-canvas-controls`) is `z-30` and sits at
// that same corner: `absolute inset-x-3 top-3 z-30` on mobile (a full-width top row -- directly
// overlapping left-3/top-3) and `sm:left-4 sm:top-4 z-30` on desktop (a left rail starting almost
// exactly where the legend started). Since z-10 < z-30, the legend painted (and sat) BEHIND the
// toolbar at both viewports, making Si vs. C illegible exactly where a learner most needs it (the
// one crystal lacking per-atom-type vertex/material data to recolor the mesh itself -- see
// CrystalViewer.tsx's own header comment on the elementLegend fallback).
//
// A real fix can take either shape: (a) out-stack the toolbar rail (z-index >= 30), or (b)
// reposition the legend clear of the rail's on-screen footprint at every breakpoint (the shape this
// wave's fix actually landed: moved to `right-3 top-20 z-10 sm:right-4 sm:top-4`, clear of the
// rail's left-4/top-4 anchor at both viewports -- see CrystalViewer.tsx's own comment above the
// legend explaining why top-right, not top-left, was chosen). This test accepts either shape.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/components/explorer/crystalSicLegendVisibility.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const crystalViewerSrc = readFileSync(srcPath('./CrystalViewer.tsx'), 'utf8')
const canvasControlsSrc = readFileSync(srcPath('./CanvasControls.tsx'), 'utf8')

function extractZIndex(classNameBlock: string): number | null {
  const match = classNameBlock.match(/\bz-\[?(\d+)\]?\b/)
  return match ? Number(match[1]) : null
}

function extractLegendClassName(source: string): string {
  const anchorIdx = source.indexOf('elementLegend.length > 0 && (')
  assert.ok(anchorIdx !== -1, 'expected CrystalViewer.tsx to still render `{elementLegend.length > 0 && (...)}`')
  // The legend's wrapper <div> may be preceded by a block comment (as it is today, explaining the
  // positioning choice) -- search the next chunk of source for the first <div className="...">
  // rather than anchoring directly on `(\s*<div`.
  const window = source.slice(anchorIdx, anchorIdx + 1200)
  const divMatch = window.match(/<div className="([^"]*)"/)
  assert.ok(divMatch, 'expected to find the legend\'s wrapper <div className="..."> shortly after the elementLegend.length > 0 && ( guard')
  return divMatch[1]
}

function extractRailClassName(): string {
  const railMatch = canvasControlsSrc.match(/data-canvas-controls[\s\S]{0,40}?className="([^"]*)"/)
  assert.ok(railMatch, 'expected the data-canvas-controls rail\'s className to still exist in CanvasControls.tsx')
  return railMatch![1]
}

test('CanvasControls: the toolbar rail is still anchored at left-4/top-4 (sm+) and inset-x-3/top-3 (mobile) -- sanity check for the next test\'s corner-overlap reasoning', () => {
  const railClassName = extractRailClassName()
  assert.match(railClassName, /\binset-x-3\b/, 'expected the toolbar rail to still span inset-x-3 on mobile')
  assert.match(railClassName, /\btop-3\b/, 'expected the toolbar rail to still sit at top-3 on mobile')
  assert.match(railClassName, /sm:left-4\b/, 'expected the toolbar rail to still sit at sm:left-4 on desktop')
  assert.match(railClassName, /sm:top-4\b/, 'expected the toolbar rail to still sit at sm:top-4 on desktop')
})

// Reads a `<prop>-<digits>` utility's value from a token list, e.g. propValue(['top-20'], 'top') -> 20.
// Only exact `prop-N` tokens count (not prop-[N] or prop-N.N) -- this app's real classNames here only
// ever use the plain integer form, and keeping this strict avoids accidentally matching unrelated
// bracket-value utilities.
function propValue(tokens: string[], prop: string): number | null {
  const re = new RegExp(`^${prop}-(\\d+)$`)
  for (const token of tokens) {
    const match = token.match(re)
    if (match) return Number(match[1])
  }
  return null
}

test('CrystalViewer: the Silicon Carbide element legend is not left behind the toolbar rail (either out-stacks it, or is repositioned clear of its footprint) at BOTH the mobile and desktop breakpoints', () => {
  const legendClassName = extractLegendClassName(crystalViewerSrc)
  const railZ = extractZIndex(extractRailClassName()) ?? 30

  const allTokens = legendClassName.split(/\s+/)
  // Mobile (base/unprefixed) utilities only -- `sm:` variants don't apply below that breakpoint.
  const baseTokens = allTokens.filter((t) => !/^[a-z]+:/.test(t))
  // `sm:` utilities, stripped of their prefix, as the values that override same-property base
  // utilities at sm+ (this file's own utilities never mix in md:/lg: variants for this legend).
  const smTokens = allTokens.filter((t) => t.startsWith('sm:')).map((t) => t.slice('sm:'.length))
  const effective = (prop: string) => propValue(smTokens, prop) ?? propValue(baseTokens, prop)

  // Mobile: CanvasControls' rail is a FULL-WIDTH bar at this breakpoint (`inset-x-3 top-3`), per
  // CanvasControls.tsx's own className checked above -- so a purely horizontal shift (right-3
  // instead of left-3) does NOT clear it; the bar spans the whole row regardless of left/right.
  // Only an outright z-index escalation, or a vertical offset that actually moves past the bar's
  // own row (top value > the rail's own top-3), clears it on mobile.
  const mobileZ = propValue(baseTokens, 'z') ?? 0
  const mobileTop = propValue(baseTokens, 'top')
  const mobileClearsRail = mobileZ >= railZ || (mobileTop !== null && mobileTop > 3)

  // Desktop (sm+): the rail is a narrow LEFT column instead (`sm:left-4`, ~3.5rem wide, per
  // CanvasControls.tsx's own sm:w-14) -- so here a horizontal shift (right-anchored instead of
  // left-anchored, or pushed well past the rail's own left+width) is what clears it, not a
  // vertical one.
  const desktopZ = effective('z') ?? 0
  const desktopLeft = effective('left')
  const desktopRight = effective('right')
  const desktopClearsRail =
    desktopZ >= railZ ||
    (desktopRight !== null && desktopLeft === null) ||
    (desktopLeft !== null && desktopLeft >= 16)

  assert.ok(
    mobileClearsRail,
    `expected the SiC element legend to clear the mobile toolbar bar (inset-x-3/top-3, full-width) -- either z-index >= ${railZ} or a top offset > 3 (moved below the bar's own row), got legend className "${legendClassName}". A pure left/right shift on its own is not enough on mobile since the bar spans the entire row.`,
  )
  assert.ok(
    desktopClearsRail,
    `expected the SiC element legend to clear the desktop toolbar rail (sm:left-4, a narrow left column) -- either z-index >= ${railZ}, a right-anchored position with no competing left offset, or a left offset >= 16 (past the rail's own column width), got legend className "${legendClassName}"`,
  )
})
