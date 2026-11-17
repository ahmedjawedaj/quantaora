# Wave 20 QA — Number Sense, mobile "Back to Place Value" navigation

Reviewer: Wave 20 reviewer — number-sense mobile-nav scope (read-only visual QA), Sonnet
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Scope: `NumberSenseLab` at `/app/labs/number-sense`, Place Value component, mobile 390x844, hotspot-detail "Back to Place Value" control.
Method: isolated Playwright (Chromium) from `/tmp/wave20-numbersense-mobile-qa`, fresh `BrowserContext` per run, `page.on('console')` / `page.on('pageerror')` active throughout. Read-only source inspection: `src/routes/NumberSenseLab.tsx` (~lines 653–728: mobile `aside`, sticky "Back to {content.name}" bar, component-switcher pill row), `src/routes/AppShell.tsx` (header), `docs/reviews/wave16-number-sense.md`, `docs/reviews/wave18-number-sense.md`.

Evidence directory: `review-screenshots/wave20-2026-08-18/number-sense-mobile-nav/`.

## Prior finding being re-checked

No `docs/reviews/wave19-number-sense-mobile-nav.md` exists, but an in-source comment in `NumberSenseLab.tsx` (~line 657) describes a "Wave 19 fix" for exactly this requirement: the hotspot-detail "Back to Place Value" control must be visible without scrolling and must not collide with the component switcher or header.

## Overall verdict: 0 P0, 0 P1, 0 P2 — fix holds

## Check 1 — Back control visible without scrolling, no collision (`hs-hundreds`)

**PASS.** Fresh cold load → selected "Place Value" → clicked `hs-hundreds`. With `window.scrollY === 0`:
- Back control ("Back to Place Value"): `{x:0, y:537.6, width:390, height:44, bottom:581.6}`
- Switcher container: `{x:0, y:582.6, width:390, height:107, bottom:689.6}`
- Header: `{x:0, y:0, width:390, height:64}`

In-viewport unscrolled: `0 <= y < 844` and `bottom <= 844` → true. Intersection checks (computed): back-vs-switcher → none (≈1px gap); back-vs-header → none.

Evidence: `01-hundreds-detail-unscrolled.png`.

## Check 2 — Repeat for a second hotspot (`hs-tens`)

**PASS.** Independent fresh load, same flow. Identical measurements (back rect y:537.6–581.6, switcher y:582.6–689.6, header y:0–64). Same result: in-viewport unscrolled, no collision. Confirms consistency across hotspots.

Evidence: `02-tens-detail-unscrolled.png`.

## Check 3 — Tapping "Back to Place Value" returns to overview state

**PASS.** Selected `hs-hundreds` (confirmed `aria-pressed="true"`) → captured hotspot-detail state (`03a-before-back-tap.png`) → tapped back → captured after state (`03b-after-back-tap.png`). DOM verification: no hotspot button has `aria-pressed="true"` after the tap, and the mobile-visible DetailPanel `aside`'s text content matches the pre-hotspot-click overview snapshot verbatim ("...Place Value / A digit's position tells its worth..."). Visually, the "Back to Place Value" bar is gone, replaced by the overview's "Scroll for more" affordance.

Evidence: `03a-before-back-tap.png`, `03b-after-back-tap.png`.

## Console/page errors

**PASS.** Zero `pageerror` events across all 4 sessions. Only benign messages: Vite HMR, React DevTools info, `THREE.Clock` deprecation, GPU-stall driver warnings (self-throttling). No `console.error`.

## Incidental observation (out of scope, not formally verified here)

Screenshots `01`/`02` show a visible colored glow on the corresponding abacus rod when a hotspot is selected (salmon on hundreds, green on tens) — appears consistent with the fix confirmed separately in `wave20-number-sense-visual.md`. Not re-diffed rigorously in this scope; noted only as a cross-reference, not a finding of this report.

## Summary

| # | Check | Verdict |
|---|---|---|
| 1 | Back control visible unscrolled + no collision (hundreds) | PASS |
| 2 | Back control visible unscrolled + no collision (tens) | PASS |
| 3 | Back tap returns to overview state | PASS |
| 4 | Console/page errors | PASS |

**Conclusion:** The scoped regression (back control requiring scroll, or colliding with switcher/header) does not reproduce. The Wave 19 fix holds at runtime for both hotspots tested, and back-navigation correctly returns to the Place Value overview.
