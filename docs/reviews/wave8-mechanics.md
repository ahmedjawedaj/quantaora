# Wave 8 QA — Mechanics

Date: 2026-08-18
Route: `/app/labs/motion` (Physics > Mechanics), all 13 components: Acceleration, Displacement, Distance, Force, Friction, Gravity, Mass, Momentum, Normal Force, Position, Speed, Velocity, Weight.
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/mechanics/` (27 files + console-errors.txt + mobile-aside-visible.txt)

## Checklist verdicts

**1. Baseball visual tracks real simulated physics state — PASS**
`TrackedBaseball` in `src/routes/PhysicsLab.tsx` (~line 1211) is positioned at `[sim.position, -0.09, 0.42]`, reading the same `sim.position` value the cart uses — not a separate/decorative animation. Confirmed: pressing Play on Velocity moved the cart from 0.7 m to 2.5 m and the baseball moved the identical distance in lockstep along the gold track line. Evidence: `desktop-velocity-playing-midmotion.png`, `desktop-velocity-playing-midmotion-2.png`.

**2. Measuring tape appears only where relevant — PASS**
`mechanicsMode()` gates `showMeasureTool` to exactly the "motion-measure" group (Position, Distance, Displacement, Speed, Velocity). Verified present for those five, correctly absent (replaced by a plain post prop) for Force, Friction, Gravity, Mass, Momentum, Normal Force, Acceleration, Weight — at both viewports. Evidence: `desktop-distance-tape-present.png` etc. vs `desktop-force-tape-absent.png` etc.; mobile: `mobile-velocity-tape-present.png` vs `mobile-force-tape-absent.png`.

**3. Overlays remain legible / don't overlap or clip — MOSTLY PASS, one P2**
Readout cards, key-facts panel, and "Tune mechanics" slider panel are legible and contained within bounds at both viewports. One nit: when several vector labels render together near the cart during motion (net force / accel / applied force / friction / momentum stack), the "friction" label is bisected by its own arrow and "momentum stack" is partly hidden behind the cart mesh (P2).

**4. 3D scene fits within viewport without clipping — PASS**
Track ellipse, cart, and all props stay fully inside the canvas at both viewports across every component. No geometry cut by canvas bounds.

## Console/network errors
Swept all 13 components at both viewports (incl. Play + slider interaction): zero console errors, zero page errors, zero failed requests. Only benign noise (`THREE.Clock` deprecation, headless-GPU `ReadPixels` perf warnings).

## Findings

**P0 — none found.**

**P1**
1. At mobile 390x844, the component-switcher sidebar (`<aside>` in `PhysicsLab.tsx`, wrapped `hidden lg:block`) is not shown, and there is no alternate mobile control to switch between the 13 mechanics components — a mobile user landing directly on `/app/labs/motion` has no visible way to navigate from the default component (Acceleration) to e.g. Velocity or Distance. Confirmed via `mobile-aside-visible.txt` (`aside visible on mobile: false`). Other mobile components were only reachable by selecting them at desktop width first, then resizing down — not possible for a real mobile user.

**P2**
1. Label overlap during active motion: "friction" label text is crossed by the friction vector arrow, and "momentum stack" label is partially occluded by the cart body when several vector overlays render simultaneously. Minor, still mostly readable. Evidence: `desktop-velocity-playing-midmotion-2.png` (region ~x:55-75%, y:10-35%).
2. Mobile "Tune mechanics" panel (`max-h-[42svh] overflow-y-auto`) is functionally scrollable (confirmed via computed style: scrollHeight 509 vs clientHeight 352) so Slope/Gravity sliders are reachable, but there's no visible scroll affordance (no scrollbar, no fade/chevron cue) — the panel visually looks like it stops after the "Friction" label, which could read as cut off. Evidence: `mobile-velocity-tune-panel-open.png`.

## Bonus verification
Dragging the Applied-force slider via real keyboard input (arrow keys) changed "Applied force" 9 N to 24 N and "Net force" 3.6 N to 18.6 N live in the readout panel — confirms genuine cause/effect wiring, not scripted display values. Evidence: `desktop-force-before-slider-drag.png`, `desktop-force-after-slider-drag.png`.

## Files inspected (read-only)
`src/routes/PhysicsLab.tsx`, `src/data/modelRegistry.ts`, `src/data/generated/mechanics.ts`, `src/components/explorer/ContentNav.tsx`, `src/routes/AppShell.tsx`, `src/App.tsx`, `src/data/hierarchy.ts`. No product/source files modified.
