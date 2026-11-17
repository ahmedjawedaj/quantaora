import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Math Data task: MathManipulativesLab's `table` component
// (TableManipulative) renders one row per DATA_FIELDS entry (A, B, C, Out) with a +/- control
// pair per row -- the task brief calls out row C's plus/hotspot control specifically as
// overlapped/unclickable, plus the header row ("Row" / "Value" / "Change") not fitting mobile
// widths. Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom pointer-geometry/hit-testing harness -- see
// ./BranchLab.test.ts's own comment on why): these assert the *shape* of a real fix (a real,
// wired, non-inert control per row; some mobile-width accommodation on the header) rather than
// rendering and measuring actual layout.
//
// The header-fit assertion is expected to be RED until the Math Data sibling agent's fix lands
// this wave (no mobile-width accommodation was present as read at the start of this wave) --
// that's correct, not a bug in this test (see ./mobileSwitcherAffordance.test.ts for the
// established precedent of writing a test correct and letting it stay red until the owning fix
// lands). The per-row control-hit-area assertions already pass against current source and guard
// against a regression while the sibling's header-fit fix lands alongside them.
//
// Run with: node --test src/routes/mathTableRowControlHitArea.test.ts

const MATH_LAB_PATH = fileURLToPath(new URL('./MathManipulativesLab.tsx', import.meta.url))
const mathLabSrc = readFileSync(MATH_LAB_PATH, 'utf8')

function tableManipulativeBody(): string {
  const fnIdx = mathLabSrc.indexOf('function TableManipulative')
  assert.ok(fnIdx !== -1, 'expected a TableManipulative component to still exist in MathManipulativesLab.tsx')
  // Generous window: the next top-level `function ` declaration (StatsBarManipulative) starts
  // well within a few thousand characters of this one.
  const nextFnIdx = mathLabSrc.indexOf('\nfunction ', fnIdx + 10)
  return mathLabSrc.slice(fnIdx, nextFnIdx === -1 ? mathLabSrc.length : nextFnIdx)
}

test('DATA_FIELDS includes a "C" row (dataC) -- sanity check for what "row C" refers to', () => {
  assert.match(
    mathLabSrc,
    /\{\s*field:\s*'dataC',\s*label:\s*'C'/,
    'expected DATA_FIELDS to still define a dataC row labeled "C"',
  )
})

test('TableManipulative: every row\'s +/- controls are real, wired, non-inert click targets (not pointer-events-none, no zero-size hit area)', () => {
  const body = tableManipulativeBody()

  assert.doesNotMatch(
    body,
    /pointer-events-none/,
    'expected TableManipulative\'s row controls to never carry pointer-events-none (that would make the +/- buttons, including row C\'s, permanently unclickable)',
  )

  // Both the decrease and increase buttons: real <button> elements, wired to the bump() handler,
  // with an aria-label distinct per row (so row C's controls are individually addressable, not
  // sharing one hit target with another row).
  const decreaseButton = body.match(/<button[^>]*onClick=\{\(\)\s*=>\s*bump\([^)]*-1\)\}[^>]*aria-label=\{`Decrease \$\{entry\.label\}`\}/)
  const increaseButton = body.match(/<button[^>]*onClick=\{\(\)\s*=>\s*bump\([^)]*,\s*1\)\}[^>]*aria-label=\{`Increase \$\{entry\.label\}`\}/)
  assert.ok(decreaseButton, 'expected a Decrease button wired to bump(...) with a per-row aria-label')
  assert.ok(increaseButton, 'expected an Increase button wired to bump(...) with a per-row aria-label')

  // Real, non-zero hit area (Tailwind h-*/w-* sizing on the button itself), not a bare icon glyph
  // with no click padding.
  assert.match(
    body,
    /<button[^>]*onClick=\{\(\)\s*=>\s*bump\([\s\S]{0,80}?\}[^>]*className="[^"]*\bh-7\b[^"]*\bw-7\b/,
    'expected the +/- buttons to carry an explicit non-zero size (h-7 w-7), not rely on inline content alone for their hit area',
  )
})

test('TableManipulative: the header row accommodates narrow mobile viewports (not fixed-width headers with no responsive handling)', () => {
  const body = tableManipulativeBody()
  const theadMatch = body.match(/<thead>[\s\S]*?<\/thead>/)
  assert.ok(theadMatch, 'expected TableManipulative to still render a <thead> with column headers')
  const theadBlock = theadMatch![0]

  // Accept any real accommodation: responsive text sizing/padding on the header cells, a
  // horizontally scrollable wrapper around the table, or headers short enough to not require
  // either (a single short word per <th>, already true today, is NOT sufficient on its own to
  // guarantee 3 columns fit on a ~360px viewport at px-4 padding each -- so this checks for an
  // actual accommodation, not just short text).
  const hasResponsiveHeaderSizing = /<th\b[^>]*className="[^"]*\b(?:text-\[1?[01]px\]|sm:px-|sm:text-)/i.test(theadBlock)
  const hasHorizontalScrollWrapper = /overflow-x-auto/.test(body)
  assert.ok(
    hasResponsiveHeaderSizing || hasHorizontalScrollWrapper,
    'expected TableManipulative\'s header row to carry either responsive header cell sizing/padding (e.g. a smaller mobile text size, or sm:-prefixed padding) or a horizontally-scrollable table wrapper (overflow-x-auto), so the 3-column header fits narrow mobile viewports instead of relying on fixed px-4 padding at every breakpoint',
  )
})
