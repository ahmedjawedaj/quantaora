# Wave 6 — Live Visual QA: Ecology + Plants labs

Date: 2026-08-18
Scope: `/app/labs/ecology` (`src/routes/EcologyLab.tsx`) and `/app/labs/plants`
(`src/routes/PlantsLab.tsx`), live against `http://127.0.0.1:5174`.
Viewports tested: Desktop 1440x900, Mobile 390x844.
Tooling: ad hoc Playwright (chromium, from cached install) driven via a throwaway script at
`/tmp/wave6-ecology-plants/inspect.mjs` (not committed to the repo). Console/pageerror/requestfailed
listeners attached for the full session.

All screenshots referenced below live under:
`review-screenshots/live-acceptance-2026-08-18-wave6/ecology-plants/<ecology|plants>/<desktop|mobile>/`
Console logs: `.../ecology/console-log.txt` and `.../plants/console-log.txt`.

---

## Ecology (`/app/labs/ecology`)

**Verdict: PASS** (no P0s reproduced; one P1 UX gap on mobile, one P2 transient loading flake)

### Findings

**P1 — Mobile, 390x844: component catalog (left ContentNav) is completely unreachable below the `lg` breakpoint.**
`EcologyLab.tsx` renders the component list (`Community/Consumer/Decomposer/Ecosystem/Habitat/...`)
in an `<aside className="hidden shrink-0 ... lg:block ...">`, which is fully hidden below 1024px
and has no mobile menu/drawer fallback anywhere in `CanvasControls`/`ContentNav`/`BottomTray`. A
mobile learner can only change which ecology component is active by tapping a hotspot inside the
3D canvas itself — there is no on-screen catalog affordance at all on phone widths.
Evidence: `ecology/mobile/01-default.png` (no nav visible; default component is "Ecosystem").

**P2 — Desktop, 1440x900: default-state canvas rendered blank on the very first cold navigation of the browser session (not reproducible on repeat).**
The first run of the inspection script captured `ecology/desktop/01-default.png` as a fully blank
canvas (toolbar/overlay UI present, no 3D content) after a 2s wait post-`load`. Three immediate
repeat trials (fresh browser context each time, same 2s wait, same route) all rendered correctly —
see `ecology/desktop/evidence/default-load-repeat-{1,2,3}-ok.png`. This looks like a one-off
cold-start artifact (first WebGL context/shader compile or first Vite module transform on this dev
server) rather than a reproducible product bug, but it is flagged because a real first-time visitor
could hit the same cold-start window. No console errors were logged during the blank capture.

**No other issues found.** Specifically confirmed:
- Canvas renders non-blank, centered diorama content at both viewports (desktop:
  `ecology/desktop/02-decomposer-selected.png`; mobile: `ecology/mobile/01-default.png`).
- Cause/effect for the mushroom **growth-stage** control (Decomposer component, "Growth stage 1
  of 4" ↔ "4 of 4") is a **visibly distinct GLB swap**, not just a label change: stage 4 shows a
  flatter, spotted toadstool cap with a stem "skirt"/collar; stage 1 shows a smooth, spot-free
  dome cap. Confirmed via pixel diff (non-zero diff bbox inside the mushroom silhouette, not just
  the text label). Evidence: `ecology/desktop/03-decomposer-stage4.png` vs
  `ecology/desktop/04-decomposer-stage1.png`.
- The "Tune ecosystem" sliders (Sunlight, Predator pressure, Decomposer activity, Habitat stress)
  produce immediate, visible Key-Facts number changes (`Decomposers 55%→5%`, `Nutrients 64%→24%`,
  `Predator pressure 42%→90%`) and a visible lighting/scene diff in the strip of canvas still
  exposed above the panel. Evidence: `ecology/desktop/05-tune-panel-open.png` through
  `08-predator-pressure-90pct.png`.
- Toolbar controls (Rotate, Pause, Isolate, Section, Compare, Zoom In/Out, Full, More, Reset) are
  visible and reachable at both viewports; not clipped or obscured.
- No lorem ipsum, TODO strings, or internal component names leaked into visible UI text at either
  viewport.
- No console errors, unhandled rejections, or React error-boundary fallbacks observed in
  `ecology/console-log.txt` (only benign dev-tooling noise: Vite HMR connect messages, a THREE.Clock
  deprecation warning, WebGL "GPU stall due to ReadPixels" perf notices, and harfbuzz font-shaping
  debug lines — none are app errors).

### Coverage statement (Ecology)
Tested: default load (desktop + mobile), Decomposer component selection, mushroom growth-stage
slider at stages 1 and 4 (desktop only — not re-tested on mobile because the component picker is
unreachable there per the P1 above), the 4-slider Tune-ecosystem panel with 3 distinct parameter
states (sunlight 15%, decomposer activity 5%, predator pressure 90%) on desktop, and an abbreviated
Tune-ecosystem pass (sunlight 10%) on mobile. Not tested: the 4 scripted "Try a challenge" scenarios
end-to-end (Drought/Predator boom/Recycling stalls/Habitat loss), the Compare modal, Isolate/X-ray/
Labels/clean-view toggles, Lesson/Quiz modals, and every one of the 10 ecology components
individually (Community, Consumer, Ecosystem, Habitat, Niche, Organism, Population, Predator,
Prey) — only Ecosystem (default) and Decomposer were opened.

---

## Plants (`/app/labs/plants`)

**Verdict: FAIL** (one reproducible P1 that breaks the core cause/effect promise on desktop)

### Findings

**P1 — Desktop, 1440x900: "Tune plant" panel has no height cap on desktop (`lg:max-h-none lg:overflow-visible`) and, for the Seed component, grows tall enough to cover 100% of the 3D canvas, hiding the exact corn-growth-stage model the learner is scrubbing.**
With the Seed component active, opening "Tune plant" and then "Show real corn growth stages (3D)"
produces a panel (toggle + growth-stage slider/labels + description + predict card + 2 compare
buttons + germination slider w/ 4 labels + 3 more range sliders + a light toggle) that is tall
enough to extend from just below the top overlay pill all the way past the bottom of the 1440x900
viewport — the corn model is **never visible** while its growth stage (1 of 4 → 4 of 4) is changed.
Reproduced consistently across all 4 corn stages. Evidence: `plants/desktop/03-corn-growth-shown-stage1.png`,
`04-corn-stage2.png`, `05-corn-stage4-max.png`, `06-corn-stage-push-past-max.png` — in every one of
these the entire canvas area is covered by the panel, with zero 3D content visible.
Root cause (read-only inspection, not modified): `src/routes/PlantsLab.tsx` line ~2070, the Tune
panel wrapper is `className="grid max-h-[42svh] gap-3 overflow-y-auto ... lg:max-h-none lg:overflow-visible"`
— identical pattern exists in `EcologyLab.tsx`, but Ecology's tune panel only ever holds 4 sliders
(its own decomposer growth-stage control lives *outside* and is hidden while the tune panel is
open), so it never grows tall enough to hit this ceiling. Plants nests the growth-stage sub-control
*inside* the same collapsible tune panel as 5+ other controls, so the removed height cap lets it
overflow the whole stage on desktop.

**P1 — Desktop, 1440x900: same overflow also happens for Flower, additionally exposing a second issue — the "bud" (stage 1 of 3) growth-stage model is easy to mistake for blank/broken because it is only a thin bare stem with no visible bud head, and it sits in the exact region the panel now covers.**
With Flower active, "Tune plant" + "Show real flower growth stages (3D)" at stage 1 ("bud") shows
a fully blank gray backdrop above the panel for at least 5.5s (no loading spinner, no error) —
confirmed with an isolated repeat test (`plants/desktop/evidence/flower-bud-stage1-panel-open-blank-after-5.5s.png`).
Manually closing the panel to unobstruct the canvas revealed the model *is* rendering, just as a
bare thin stem with no petals/bud silhouette at this stage (`plants/desktop/evidence/flower-bud-stage1-panel-closed-shows-thin-stem.png`)
— the code already documents this asset limitation ("the file labeled 'stage 1 bud' rendered as a
generic two-blade sprout, not a bud"). Two compounding problems: (1) the panel-covers-canvas bug
above hides this model entirely during normal interaction, and (2) even when visible, the "bud"
stage does not read as a recognizable flower part, weakening the stage-1→stage-3 cause/effect story
compared to Ecology's clearly-distinct mushroom stages. Stage 3 "full bloom" does render a clear,
recognizable bell-shaped purple flower (`plants/desktop/09-flower-full-bloom-stage3.png`).

**P1 — Mobile, 390x844: component catalog is unreachable below `lg`, same as Ecology (shared `ContentNav` pattern), and additionally blocked full coverage of the mobile corn/flower growth-stage flow for this QA pass.**
`PlantsLab.tsx`'s component-picker `<aside>` uses the identical `hidden ... lg:block` class as
Ecology's, with no mobile fallback. Because the default component on load is "Chloroplast" (not
Seed), and Seed/Flower could not be selected on mobile without this nav, growth-stage scrubbing on
mobile for corn/flower stages was **not verifiable this pass** — flagged as a coverage gap, not a
pass/fail verdict on the mobile growth-stage behavior itself. Evidence of the missing nav:
`plants/mobile/01-default.png`.

**Stage-5 / invalid-stage exclusion: correctly excluded, confirmed.**
`growthStageModels.seed` has exactly 4 entries and the slider's `max` attribute reads `3` (0-indexed,
i.e., 4 stages, "4 of 4" max label) — confirmed via DOM attribute read, logged in
`plants/console-log.txt` as `Corn growth stage slider max attr = 3`. Pressing ArrowRight 3x beyond
the max while the slider was focused left the value clamped at `3` (no stage 5 reachable) — logged
as `Corn growth stage slider value after extra ArrowRight presses beyond max = 3 (max=3)`. Same
confirmed for the flower sequence: `growthStageModels.flower` has 3 entries, slider `max="2"`,
post-clamp value stayed at `2`. This matches an explicit code comment (`plants.ts` line ~1782-1784)
stating a 5th corn stage asset was deliberately rejected in an earlier visual review and is not
wired into the data at all — there is no way to reach a "stage 5" through the UI, and no broken/
blank state was produced by trying. Screenshots: `plants/desktop/06-corn-stage-push-past-max.png`,
`plants/desktop/10-flower-stage-push-past-max.png` (both show the panel-overflow P1 above, but the
stage counter itself is correctly pinned at its max and did not error).

**No console errors, unhandled rejections, or React error-boundary fallbacks observed** in
`plants/console-log.txt` for any of the flows above (same benign dev-tooling/WebGL-perf noise as
Ecology). No lorem ipsum/TODO/internal-name text observed in visible UI.

### Other checks performed with no issues
- Chloroplast (default) component canvas renders non-blank, centered content at both viewports;
  Light intensity / CO₂ sliders update the "Sugar output" readout live and are reachable on mobile
  without overflow (`plants/mobile/02-tune-panel-open.png` — sliders + labels fit and are legible,
  panel respects `max-h-[42svh]` since the `lg:` override does not apply on mobile).
- Toolbar controls (Rotate, Pause, Isolate, Section, Compare, Zoom In/Out, Full, More, Reset)
  visible and reachable at both viewports.

### Coverage statement (Plants)
Tested: default load (Chloroplast, desktop + mobile), Seed component tune panel + corn growth
stages 1-4 with push-past-max attempt (desktop only), Flower component tune panel + flower growth
stages (bud/opening confirmed via 1↔3, push-past-max attempt) (desktop only), abbreviated mobile
pass on the default Chloroplast tune panel. **Not tested:** Leaf, Phloem, Root, Stem, Stomata, Xylem
components; the "Bee visits (pollinate)" interaction and seed-formation follow-through; the
well-watered/dry+cold seed presets; the Guided Challenge Observe/Predict/Change/Explain/Check flow
end-to-end; Compare modal; Lesson/Quiz modals; Isolate/X-ray/Labels toggles; and — as noted above —
Seed/Flower growth-stage scrubbing on mobile at all (component nav unreachable at 390px).

---

## Summary

| Route | Verdict | P0 | P1 | P2 |
|---|---|---|---|---|
| Ecology | PASS | 0 | 1 (mobile nav unreachable) | 1 (transient blank-canvas-on-cold-load, non-reproducible) |
| Plants | FAIL | 0 | 3 (desktop tune-panel-covers-canvas for Seed and Flower; mobile nav unreachable) | 0 |

The single most actionable finding is the Plants desktop Tune-panel overflow: it silently defeats
the growth-stage feature's entire visual payoff on the primary desktop viewport tested (1440x900)
for both Seed and Flower, the two components that carry the "real 3D growth stage" interaction this
wave was specifically asked to verify.
