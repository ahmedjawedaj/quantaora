import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for Wave 8 QA findings (docs/reviews/wave8-*.md): several lab routes'
// component switcher only existed inside the desktop sidebar `<aside>`
// (`hidden ... lg:block`), which is not rendered at all below the `lg` breakpoint -- leaving
// mobile users with no way to switch between components on those routes. The already-fixed
// routes (PlantsLab, GeneticsLab, EcologyLab -- see their Wave 8 reviews, all PASS on this
// point) establish the working pattern: a *second*, mobile-visible switcher (`... lg:hidden`)
// rendering the same component list with working onClick handlers, alongside the desktop-only
// aside, not instead of it.
//
// This is a static source-text heuristic, not a jsdom/viewport-resize render test: the project
// has no React Testing Library / jsdom dependency installed and no responsive-rendering test
// harness (see package.json, and ../routes/BranchLab.test.ts's own comment on why this repo's
// tests are plain node:test + native TS type-stripping rather than a bundler-based runner). The
// heuristic below only checks for the *shape* of the fix (a second, mobile-visible, clickable
// switcher distinct from the desktop-only aside) -- it cannot confirm actual rendered layout.
//
// Run with: node --test src/routes/mobileSwitcherAffordance.test.ts

function routePath(fileName: string): string {
  return fileURLToPath(new URL(`./${fileName}`, import.meta.url))
}

/**
 * True if `source` contains, in addition to the standard desktop-only sidebar aside
 * (`hidden ... lg:block`), a mobile-visible (`lg:hidden`) block that also renders a clickable
 * list of items (i.e. a real switcher: `.map(` over items with an `onClick` handler nearby),
 * not just an unrelated icon/element toggled by breakpoint.
 */
function hasMobileVisibleSwitcher(source: string): boolean {
  const WINDOW = 3000
  let searchFrom = 0
  while (true) {
    const idx = source.indexOf('lg:hidden', searchFrom)
    if (idx === -1) return false
    const window = source.slice(idx, idx + WINDOW)
    if (window.includes('onClick') && window.includes('.map(')) return true
    searchFrom = idx + 'lg:hidden'.length
  }
}

function hasDesktopOnlyAside(source: string): boolean {
  return /hidden[^"]*lg:order-1[^"]*lg:block|hidden[^"]*lg:block[^"]*lg:w-\[260px\]/.test(source)
}

// Routes this wave's mobile-switcher fix targets (per Wave 8 QA + Wave 9 task brief). These are
// expected to be RED until the owning agent's fix lands this wave -- that is expected and
// correct, not a bug in this test (see task brief: "write it correct and let it be red until the
// sibling fix lands").
const TARGET_ROUTES = ['NumberSenseLab.tsx', 'MathManipulativesLab.tsx', 'MicrobiologyLab.tsx', 'PhysicsLab.tsx']

// Routes that already had a working mobile switcher per Wave 8 QA (PASS) -- included as a
// baseline/sanity check so a future regression that silently removes an existing switcher is
// also caught, not just the routes actively being fixed this wave.
const BASELINE_ROUTES = ['PlantsLab.tsx', 'GeneticsLab.tsx', 'EcologyLab.tsx', 'MathLab.tsx']

for (const fileName of [...TARGET_ROUTES, ...BASELINE_ROUTES]) {
  test(`${fileName}: has a mobile-visible (lg:hidden) component switcher alongside the desktop-only aside`, () => {
    const source = readFileSync(routePath(fileName), 'utf8')
    assert.ok(hasDesktopOnlyAside(source), `${fileName}: expected the desktop-only sidebar aside pattern to still be present`)
    assert.ok(
      hasMobileVisibleSwitcher(source),
      `${fileName}: expected a second, mobile-visible (lg:hidden) clickable component switcher distinct from the desktop-only aside (Wave 8 finding: mobile users had no way to switch components on this route)`,
    )
  })
}
