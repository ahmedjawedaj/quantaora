import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for Wave 11 Worker 2's task: PlantsLab's "Tune plant" panel occludes the 3D
// canvas at mobile 390x844 (consuming close to full viewport height as a bottom sheet) and at
// narrow-desktop 1024x768 (its fixed lg:w-[22rem] = 352px width leaves almost none of the
// lab-stage column visible once the 260px left aside and 360px right aside are subtracted from a
// 1024px viewport). Follows ../routes/mobileSwitcherAffordance.test.ts's string/regex-against-source
// pattern -- no jsdom/viewport-resize harness in this repo (see that file's own comment, and
// ../routes/BranchLab.test.ts).
//
// Run with: node --test src/routes/plantsTunePanelOcclusion.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const plantsLabSrc = readFileSync(srcPath('./PlantsLab.tsx'), 'utf8')
const canvasControlsSrc = readFileSync(srcPath('../components/explorer/CanvasControls.tsx'), 'utf8')

/** Locates the Tune panel's outer overlay wrapper: the `className={cn(...)}` block that
 *  positions it near the top of the stage (`lg:top-20`) and carries an `lg:w-[...]` panel width.
 *  That combination is unique to this wrapper in the file, so it's a more reliable anchor than
 *  the first `controlsOpen` occurrence (which is the earlier `useState` declaration, not this
 *  wrapper). */
function findTunePanelWrapperClassName(source: string): string {
  const classNameBlocks = source.match(/className=\{cn\(([\s\S]*?)\)\}/g) ?? []
  for (const block of classNameBlocks) {
    if (block.includes('lg:top-20') && /lg:w-\[/.test(block)) {
      const inner = block.match(/className=\{cn\(([\s\S]*?)\)\}/)
      if (inner) return inner[1]
    }
  }
  assert.fail(
    'expected to find the Tune panel wrapper\'s cn(...) className call (identified by lg:top-20 combined with an lg:w-[...] panel width class)',
  )
}

function extractRemUnitPx(classNameBlock: string, prefix: RegExp): number | null {
  const match = classNameBlock.match(prefix)
  if (!match) return null
  const value = Number(match[1])
  return Number.isFinite(value) ? value * 16 : null // Tailwind rem -> px at the standard 16px root
}

function extractAsideWidthPx(source: string, order: 'left' | 'right'): number {
  // Left aside: lg:w-[260px]; right aside: lg:w-[360px] -- both hardcoded pixel arbitrary values
  // in this route (mirrors SpaceLab.tsx's identical 3-column shell). Each side's width sits next
  // to a different anchor (lg:order-1 vs lg:order-3), so each branch below matches its own regex
  // rather than sharing one.
  if (order === 'left') {
    const m = source.match(/lg:order-1[\s\S]{0,120}?lg:w-\[(\d+)px\]|lg:w-\[(\d+)px\][\s\S]{0,120}?lg:order-1/)
    const value = m ? Number(m[1] ?? m[2]) : NaN
    assert.ok(Number.isFinite(value), 'expected to find the left aside\'s lg:w-[...px] width near lg:order-1')
    return value
  }
  const m = source.match(/lg:order-3[\s\S]{0,200}?lg:w-\[(\d+)px\]/)
  const value = m ? Number(m[1]) : NaN
  assert.ok(Number.isFinite(value), 'expected to find the right aside\'s lg:w-[...px] width near lg:order-3')
  return value
}

test('PlantsLab: Tune panel mobile sheet height is bounded well below the full viewport, leaving canvas visible', () => {
  const source = plantsLabSrc
  // TunePanel's own inner content wrapper carries the mobile max-height class (max-h-[NNsvh] or
  // max-h-[NNdvh]) that bounds the bottom sheet -- find it near the TunePanel function body.
  const tunePanelFnIdx = source.indexOf('function TunePanel')
  assert.ok(tunePanelFnIdx !== -1, 'expected a TunePanel component to still exist in PlantsLab.tsx')
  const tunePanelBody = source.slice(tunePanelFnIdx, tunePanelFnIdx + 6000)

  const heightMatch = tunePanelBody.match(/max-h-\[(\d+)(?:svh|dvh|vh)\]/)
  assert.ok(
    heightMatch,
    'expected TunePanel\'s content wrapper to cap its height with a max-h-[NNsvh]/[NNdvh]/[NNvh] class, not grow to the full sheet/viewport height',
  )
  const heightVh = Number(heightMatch![1])
  assert.ok(
    heightVh > 0 && heightVh <= 60,
    `expected the Tune panel's mobile max-height to be bounded well below the full viewport (<= 60svh/dvh) so the canvas above stays visible while the sheet is open; got ${heightVh}`,
  )
})

test('PlantsLab: Tune panel desktop (lg:) width leaves positive remaining canvas space at a 1024px narrow-desktop viewport', () => {
  const NARROW_DESKTOP_VIEWPORT_PX = 1024
  const wrapperClassName = findTunePanelWrapperClassName(plantsLabSrc)

  // Panel width at the lg breakpoint, e.g. `lg:w-[22rem]`.
  const panelWidthPx = extractRemUnitPx(wrapperClassName, /lg:w-\[([\d.]+)rem\]/)
  assert.ok(panelWidthPx !== null, 'expected the Tune panel wrapper to carry an lg:w-[NNrem] width class when open')

  // Panel's right inset at the lg breakpoint, e.g. `lg:right-4` (Tailwind spacing scale: right-4 = 1rem = 16px).
  const rightInsetMatch = wrapperClassName.match(/lg:right-(\d+)\b/)
  const rightInsetPx = rightInsetMatch ? Number(rightInsetMatch[1]) * 4 : 16 // Tailwind spacing unit = 0.25rem = 4px

  const leftAsideWidthPx = extractAsideWidthPx(plantsLabSrc, 'left')
  const rightAsideWidthPx = extractAsideWidthPx(plantsLabSrc, 'right')

  // CanvasControls' floating tool rail width + its left inset, read from the read-only reference
  // file (not owned/edited by this test) -- e.g. `sm:w-14` (3.5rem = 56px) at `sm:left-4` (16px).
  const railWidthMatch = canvasControlsSrc.match(/sm:w-(\d+)\b/)
  assert.ok(railWidthMatch, 'expected CanvasControls.tsx to carry a sm:w-N rail width class')
  const railWidthPx = Number(railWidthMatch![1]) * 4
  const railLeftInsetMatch = canvasControlsSrc.match(/sm:left-(\d+)\b/)
  const railLeftInsetPx = railLeftInsetMatch ? Number(railLeftInsetMatch[1]) * 4 : 16

  const stageWidthPx = NARROW_DESKTOP_VIEWPORT_PX - leftAsideWidthPx - rightAsideWidthPx
  const remainingSpacePx = stageWidthPx - railLeftInsetPx - railWidthPx - panelWidthPx! - rightInsetPx

  assert.ok(
    remainingSpacePx > 0,
    `expected positive remaining canvas space at a ${NARROW_DESKTOP_VIEWPORT_PX}px narrow-desktop viewport once the toolbar rail (${railWidthPx}px + ${railLeftInsetPx}px inset) and the open Tune panel (${panelWidthPx}px + ${rightInsetPx}px inset) are both accounted for within the ${stageWidthPx}px-wide lab stage (viewport minus ${leftAsideWidthPx}px left aside and ${rightAsideWidthPx}px right aside) -- got ${remainingSpacePx}px, i.e. the panel occludes the canvas`,
  )
})
