# Wave 10 QA — Genetics lab (`/app/labs/genetics`)

Read-only visual/functional QA. Isolated Chromium (Playwright, `chromium.launchPersistentContext`,
separate profile dirs under `/tmp/wave10-genetics/`), not the shared browser/extension session.
Dev server at `http://127.0.0.1:5174` was reachable throughout; no product files were modified.

Evidence root: `review-screenshots/wave10-2026-08-18/genetics/`

## 1. Repeated fresh loads — blank-canvas race condition

**Method:** 5 consecutive fresh `page.goto()` navigations (desktop 1440x900, cold `launchPersistentContext`,
no cache clearing between runs but each is a full page reload). For each: screenshot ~400ms after the
`load` event ("early" — the race-condition window) and again ~1600ms after ("settled"), plus a canvas
pixel sample (unique-color count over a ~60x60 grid + average RGB) to detect a blank/solid canvas
programmatically, not just visually.

**Result: PASS — did not reproduce in 5/5 attempts.** Every attempt, at both the early and settled
checkpoint, rendered the identical DNA double-helix scene with 106 unique sampled colors (i.e. a fully
painted, non-blank canvas) — see `load-attempts-results.json` for the raw per-attempt data.

Evidence:
- `load-attempt-1-early.png` / `load-attempt-1-settled.png` through `load-attempt-5-early.png` /
  `load-attempt-5-settled.png` (10 screenshots total) — all show the same fully-rendered DNA helix,
  correctly framed, no blank/black/white canvas at either checkpoint.
- `load-attempts-results.json` — machine-readable per-attempt canvas stats (width/height/unique-color
  count/nav time).

A separate console-only rerun (`qa4.js`, 5 more fresh loads) confirmed **zero `pageerror` and zero
`requestfailed` events** across all 5 loads. The only warnings were: `THREE.Clock: This module has
been deprecated. Please use THREE.Timer instead.` (r3f/three internal, first load only) and, on the very
first cold WebGL context only, an ANGLE/GL driver informational message `GPU stall due to ReadPixels …
(this message will no longer repeat)` — a one-time driver notice tied to shader/first-frame compilation,
not a functional error, and it did not recur on attempts 2–5.

**Could not prove:** true production/network conditions (slow 3G, CPU throttling, or a genuinely cold
CDN cache) were not simulated — only fast local dev-server reloads on a warm profile. If the original
"blank canvas" race is timing-sensitive to a slower asset fetch or first-ever paint, this run's 5/5
clean results do not rule it out under those specific conditions. Also worth noting: the code contains
two purpose-built mitigations already in place (`gl={{ preserveDrawingBuffer: true }}` and a
`ResizeObserver`-driven `invalidate()` on the stage — see `GeneticsLab.tsx` lines ~1116–1122 and
~1360–1370, both explicitly commented as Wave 8 fixes for this exact race), which is consistent with
why it did not reproduce here.

## 2. Mobile component switcher (390x844)

**Result: PASS.** The `lg:hidden` chip-row switcher (labelled "Component N of 10") is present and
functional on mobile, distinct from the desktop-only sidebar. Clicked through Mutation, Chromosome,
DNA Replication, Trait, and back to Mutation — each selection correctly rebuilt the 3D scene, updated
the meter row (e.g. `Molecule: Mutation` / `Effect: silent`, `Molecule: Chromosome`), and updated the
detail panel below.

Evidence: `mobile-initial-dna.png`, `mobile-switcher-mutation.png`, `mobile-switcher-chromosome.png`,
`mobile-switcher-dna-replication.png`, `mobile-switcher-trait.png`, `mobile-switcher-final-state.png`,
`zoom-canvas-only-dna-mobile.png`, `zoom-canvas-only-mutation-mobile.png`,
`zoom-canvas-only-chromosome-mobile.png` (canvas-only crops used to double-check top/bottom framing).

**P2 — chip row can leave the just-navigated-from chip partially clipped at the scroll-container edge.**
After navigating through several components, the horizontally-scrolling chip row (`overflow-x-auto`,
no scroll-into-view/centering logic on select) can leave a chip's target only partially inside the
visible strip (e.g. after selecting "Trait", the "Mutation" chip sat mostly scrolled off, showing only
its clipped tail "…tation" — see `mobile-switcher-trait.png`). A real user can still reach it by
swiping the row first; this is not a broken control, just missing auto-centering/scroll-into-view
polish compared to Anatomy Atelier-grade switcher behavior. Confirmed reachable via explicit
`scrollIntoViewIfNeeded()` + click in a follow-up pass — see chip-check/chip-click entries in
`console-log.json` (phase `mobile-switcher-clipping-check`), all succeeded once scrolled into view.

No blank/clipped canvas at 390x844 for any of the 4 components visited; DNA/Mutation/Chromosome all
have generous margin at top/bottom/sides of the canvas in the crops.

## 3. "Tune" panel — frameshift/mutation labels

**Result: PASS.** Opened via the "Tune molecule" button (desktop and mobile). Panel title reads
"TUNE MOLECULE · MUTATION". All labels legible, no clipping, no overflow:
- "Change type" with buttons Substitution / Insertion / Deletion
- "Base position" slider with live numeric readout (e.g. `4`, `5`)
- "New base" A/T/C/G buttons
- Right-side detail panel "Mutation effect" line reads e.g. `substitution at base 4 → silent`,
  `insertion at base 4 → frameshift`, `deletion at base 5 → frameshift` — correct terminology, fully
  spelled out and legible, not truncated.

Evidence: `tune-frameshift-labels-desktop.png`, `tune-frameshift-labels-mobile.png`,
`tune-panel-insertion-selected.png`, `tune-panel-deletion-selected.png`, `tune-panel-text-dump.json`
(full text-content dump of the panel confirming no lorem-ipsum/debug/placeholder strings).

## 4. Mutation/frameshift interaction — sequence length cause/effect

**Result: PASS — clear, legible cause/effect.**
- Baseline (Substitution, default): 12 base-pair rungs, `Effect: silent`.
  See `sequence-before-mutation-substitution.png` / `desktop-mutation-selected.png`.
- Insertion: the rendered helix visibly grows an extra rung (13 shown, magenta-highlighted inserted
  base marker), `Mutation effect: insertion at base 4 → frameshift`, `Effect: frameshift` on the meter.
  See `sequence-after-mutation-insertion.png`, `tune-panel-insertion-selected.png`.
- Deletion: the helix visibly shrinks, and the scene overlays an explicit on-canvas caption
  **"deleted C → strand is now 11 bases"** (gray-highlighted deleted-base marker at the mutation site),
  `Mutation effect: deletion at base 5 → frameshift`. See `sequence-after-mutation-deletion.png`,
  `tune-panel-deletion-selected.png`, `meter-effect-after-deletion.png`.

Insertion lengthens the visible strand, deletion shortens it, and the on-screen effect/meter labels
track the mutation type in real time — a learner can clearly tell their action changed the molecule's
length and the resulting effect category (silent vs. frameshift).

## 5. Console/network errors — full run

Across the entire test session (repeated loads, mobile switcher, Tune-panel interactions, insertion/
deletion triggers): **zero `pageerror` events, zero `requestfailed` events, zero page crashes.**
Full raw log: `console-log.json`.

All console output observed, verbatim by category:
- `debug`: `[vite] connecting...` / `[vite] connected.` (expected dev-server HMR handshake);
  `unsupported GPOS table LookupType 8 format 2` / `unsupported GPOS table LookupType 5 format 1` /
  `unsupported GSUB table LookupType 6 format 2` / `unsupported GSUB table LookupType 6 format 1`
  (font-shaping library debug output, browser-internal, not app-authored, not user-visible).
- `info`: React DevTools install suggestion (standard React dev-mode notice).
- `warning`: `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.`
  (third-party r3f/three internal deprecation notice, first load only); `[.WebGL-…] GL Driver Message
  … GPU stall due to ReadPixels (this message will no longer repeat)` — one-time ANGLE/GPU driver
  notice on first cold WebGL init only, did not recur; `Canvas2D: Multiple readback operations using
  getImageData are faster with the willReadFrequently attribute set to true` — this one is an artifact
  of this QA script's own pixel-sampling instrumentation (drawing the WebGL canvas to an offscreen 2D
  canvas repeatedly to check for blank frames), not something the app itself does; flagged here for
  transparency rather than as a product finding.

None of the above are application errors, and none leak internal/debug text into the rendered UI.

## Summary

| Check | Result |
| --- | --- |
| Repeated fresh loads (5x) — blank canvas race | PASS (0/5 blank; could not force under throttled/cold-cache conditions, not tested) |
| Mobile component switcher (390x844) | PASS, with P2 chip-clipping-at-scroll-edge note |
| Tune panel frameshift/mutation labels legible | PASS |
| Insertion/deletion visibly changes sequence length | PASS |
| Console/network errors | PASS — none observed |

**Findings**
- **P2** — Mobile component switcher chip row (`lg:hidden`, `GeneticsLab.tsx`) does not scroll the
  newly-selected/target chip into full view automatically; after several selections a chip can sit
  partially clipped at the scroll-container's left edge, requiring the user to swipe the row before
  tapping it. Evidence: `mobile-switcher-trait.png`. Not a blocker — the control is reachable, just not
  auto-centered.

No P0 or P1 findings. Genetics lab is stable across 5 repeated fresh loads at desktop viewport, the
mobile switcher and Tune-molecule panel both work and render legibly, and the mutation/frameshift
interaction gives clear, immediate visual feedback on both effect classification and sequence length.
