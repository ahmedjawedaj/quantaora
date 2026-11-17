# Wave 8 QA — Ecology

Date: 2026-08-18
Route: `/app/labs/ecology`
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/ecology/` (64 files: screenshots + console-log.txt + raw page-text dumps)

## Checklist verdicts

**1. Mobile component switcher works for all ecology components — PASS**
Clicked all 11 chips (Community, Consumer, Decomposer, Ecosystem, Habitat, Niche, Organism, Population, Predator, Prey, Producer). Each click highlights the active chip, updates "Component X of 11", changes the 3D scene focus/labels, and swaps all 3 meter readouts to correct component-specific values. Evidence: `mobile-03-switch-0-community.png` ... `mobile-03-switch-10-producer.png` (11 files).

**2. Mushroom growth-stage assets visibly change between stages — PASS**
Confirmed via pixel diff + visual crop comparison that stage 1 ("Young cap") is a stubby dome-shaped mushroom and stage 4 ("Near-mature cap") is a taller mushroom with a flared, spotted cap and slender curved stem — a real geometry change, not a reused static asset, on both viewports. Evidence: `desktop-02-decomposer-stage1.png` vs `desktop-05-decomposer-stage4.png`; `mobile-04-decomposer-stage1.png` vs `mobile-07-decomposer-stage4.png`.

**3. Loading cue shown while assets load (not blank canvas) — PASS with two P2 caveats**
Using a network-route delay (5-6s) on the stage-1 GLB, confirmed the Decomposer hero mushroom shows a non-blank placeholder (small cap-and-stem silhouette, per `DecomposerMushroomFallback`) while its model streams in, then swaps to the full model. Evidence: `desktop-hero-midload-t2s.png` (placeholder) vs `desktop-hero-loaded-t7.5s.png` (loaded). Caveats: placeholder is much smaller than the final model (jarring pop-in), and two background "dressing" GLBs use a `null` Suspense fallback (no cue at all while loading) — see P2 findings.

**4. Displayed values/stats correct and update appropriately — PASS**
Cross-checked on-screen meters against the app's `computeEcosystemState`/`ecosystemReadout` formulas read from source: Ecosystem defaults (sunlight .72, predators .42, decomposers .55, habitatStress .18) computed Energy 59%, Balance 66%, Recycling 64% — matches `desktop-01-initial.png` exactly. Predator view, same defaults, computed Predators 42%, Prey safety 69%, Food found 28% — matches `mobile-03-switch-8-predator.png` exactly. Values also updated correctly on every component switch and growth-stage change.

**5. Panel fit — Desktop PASS, Mobile P1 (cramped, not truly clipped)**
Desktop: ContentNav, DetailPanel, "Tune ecosystem" 4-slider panel, and bottom tray all fit within 1440x900 with no page-level overflow. Mobile: the right-hand info aside (component switcher + "Try a challenge" scenario chips + DetailPanel) is squeezed into only ~138px of visible scroll height (DOM: scrollHeight 348px / clientHeight 138px) between the 56svh canvas and the fixed bottom tray. Nothing permanently unreachable — everything scrolls into view — but the scenario-chip row scrolls past in a thin sliver and is easy to miss. Evidence: `mobile-09-scenario-panel-scrolled.png`, `mobile-scroll-step-0.png` ... `mobile-scroll-step-4.png`. Also the "Tune ecosystem" panel's 4th slider (Habitat stress) sits right at the visible edge with no scroll-affordance hint (`mobile-08-tune-panel-open.png`).

## Console/network errors
Zero `console.error` or `pageerror` events across every interaction (initial loads, all component switches, growth-stage cycling, tune-panel slider drags, scenario challenge flow, throttled/delayed asset loads). Only benign noise: one `THREE.Clock` deprecation notice and repeated headless-Chromium GPU driver warnings. No internal/QA/placeholder language found in rendered UI text.

## Findings

**P0 — none.** App is reachable, no crashes, no genuinely blank/broken canvases under normal load, all core interactions produce a visible effect.

**P1**
1. Mobile 390x844 — the right aside (component switcher + "Try a challenge" scenarios + lesson detail panel) has only ~138px of visible scroll height between the canvas and the fixed bottom tray, so the scenario-challenge chip row is easy to scroll past unnoticed. Evidence: `mobile-09-scenario-panel-scrolled.png`, `mobile-scroll-step-0.png`-`mobile-scroll-step-4.png`.

**P2**
1. Desktop, decomposer hero loading — Suspense fallback placeholder for the mushroom-hero GLB is a tiny, semi-transparent violet blob far smaller than the final loaded model, causing an abrupt size "pop-in"; could read as a rendering glitch rather than a loading cue. Evidence: `desktop-hero-midload-t2s.png` vs `desktop-hero-loaded-t7.5s.png`.
2. Desktop — two low-opacity background "dressing" GLBs (`ecosystem.glb`, `producer.glb`) use a `null` Suspense fallback, so on a slow connection they simply don't appear until loaded (no cue). Low impact — always-dim secondary set-dressing, not focal content. Evidence: `desktop-glbdelay-t1s.png`.
3. Mobile — "Tune ecosystem" panel's 4th slider (Habitat stress) sits at/past the panel's visible edge with no scroll-affordance hint that more controls exist below. Evidence: `mobile-08-tune-panel-open.png`.
4. A sub-second, fully blank canvas (no spinner) appears on first route mount before any content paints — resolves within ~1s even under artificial multi-second asset delay; normal SPA/WebGL first-frame timing, essentially imperceptible in practice. Evidence: `desktop-glbdelay-t0s-justloaded.png` vs `desktop-glbdelay-t1s.png`.

## Files inspected (read-only)
`src/routes/EcologyLab.tsx`, `src/data/generated/ecology.ts`, `src/App.tsx`. No product/source files modified.
