# Wave 14 QA — Cross-lab GLB failure (Genetics DNA, Microbiology virus, Math cup)

Reviewer: Wave 14 reviewer #10 (read-only visual QA)
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Method: isolated Playwright (chromium, 1440x900) launched from `/tmp/wave14-cross-lab-glb-failure-qa`,
one browser context per lab/GLB variant, `page.route()` used to `route.abort('failed')` on the
specific GLB URL only (all other requests passed through unmodified), console/pageerror listeners
attached, DOM-mount check via
`page.evaluate(() => ({ rootLen: document.getElementById('root')?.innerHTML.length ?? -1, bodyText: document.body.innerText.length }))`.
Mobile viewport not covered (out of scope per task instructions — "skip mobile unless time allows").

All three labs/four GLB requests tested. Overall: no P0s found. All three GLB failures are caught
by a local error boundary, the app stays mounted, an accessible fallback is shown, and the user can
still navigate away. One real P1 was found in Microbiology (see below): the retry control is
present in the DOM but not clickable while the panel that triggered the failed load stays open.

---

## a. Genetics DNA — `/app/labs/genetics`

GLB tested: `/models/biology/genetics/dna-b-form-double-helix-nih.glb`

**Verdict: PASS (graceful degradation confirmed).**

Important scoping note: the DNA lab's **default** view on load is the fully procedural "schematic"
helix, which does not call `useGLTF` at all — so simply loading the route with the GLB aborted does
NOT exercise the boundary (screenshot `genetics-dna-glb-failure-desktop.png` shows the schematic
view rendering fine and is not evidence of graceful GLB handling by itself; VIEW is default
"schematic" regardless of GLB reachability). To actually exercise the GLB path I opened "Tune
molecule" and clicked "Real structure (PDB 1BNA)", which mounts `RealDnaHelixModel` (the real
`useGLTF` call site).

- With the GLB aborted and "Real structure" selected:
  - `page.on('pageerror')`: `Error: Could not load /models/biology/genetics/dna-b-form-double-helix-nih.glb: Failed to fetch`
  - Console warning (caught, not fatal): `[GeneticsLab] DNA model failed to load. Error: Could not load /models/biology/genetics/dna-b-form-double-helix-nih.glb: Failed to fetch`
  - DOM check: `rootLen: 64606`, `bodyText: 2543` — app stayed fully mounted, no blank/crash.
  - Accessible fallback: `role="alert"` element with text **"This 3D DNA model couldn't load. Try again"**, rendered centered in the canvas via `<Html center>`, not obscured by any panel (the "Tune molecule" panel sits in the top area of the canvas, well clear of the centered alert).
  - Retry control reachable: `button:has-text("Try again")` clicked successfully (not obstructed).
  - Nav-away: clicking a top-nav link successfully navigated to `/app` and rendered a different, fully working page (Explore/onboarding view with Human Anatomy Heart lab mid-load) — app was not stuck.
- Evidence:
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/genetics-dna-glb-failure-desktop.png` (default schematic view, GLB not yet requested — included per task naming convention, annotated above as not itself proof of the boundary)
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/genetics-dna-tune-panel-open.png` (Tune molecule panel open, before toggling to real structure)
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/genetics-dna-real-structure-glb-failure-desktop.png` **(the actual failure state — clean "This 3D DNA model couldn't load. / Try again" card, fully visible, canvas otherwise intact, rest of UI/panels unaffected)**
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/genetics-dna-after-nav-away.png` (proof the app is not stuck — successfully navigated to a different, working route afterward)

No findings for Genetics DNA. This is the cleanest of the three: fallback card is fully visible and unobstructed, retry works, nav-away works.

---

## b. Microbiology virus — `/app/labs/microbiology`

Two GLBs tested separately (fresh context each): whole virion and cutaway.

### b1. Whole virion — `/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb`

**Verdict: CONDITIONAL PASS — degrades gracefully, but one real P1.**

Default active system on load is "Bacteria", and default "Inspect" mode for Virus is "Infection
cycle (schematic)" (procedural, no GLB). To exercise the GLB path: selected "Virus" in the left
rail, opened "Tune microbe", clicked "Whole virion (real influenza)".

- `page.on('pageerror')`: `Error: Could not load /models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb: Failed to fetch`
- Console warning (caught): `[MicrobiologyLab] Virus model failed to load. Error: Could not load .../virus-influenza-whole-nih.glb: Failed to fetch`
- DOM check: `rootLen: 53737`, `bodyText: 2369` — app stayed mounted, no blank/crash.
- Accessible fallback: `role="alert"` element present with text **"This 3D virus model couldn't load. Try again"**.
- **P1 finding:** With the "Tune microbe" panel left open (the natural state right after a user picks "Whole virion" from that same panel), the panel visually **covers the top of the error card and entirely covers the "Try again" button**. `page.locator('[role="alert"]').allTextContents()` still returns the text (DOM present), but an explicit click attempt on `button:has-text("Try again")` **times out after 4s (element not interactable / not visible for click)** while the panel is open. Only after clicking the panel's own close button (`aria-label="Hide microbe controls"`) does "Try again" become visible and clickable (confirmed: click succeeds once panel is closed). A learner who just switched to "Whole virion" and sees the load fail has no way to tell there's a retry button, or to click it, without first discovering they need to close the Tune microbe panel — the panel itself gives no visual cue that something is hidden behind it.
  - Severity: **P1** (significant — the recovery affordance is unreachable in the state a real user would actually be in after triggering the failure; not a full block since closing the panel — with no on-screen instruction to do so — does restore the control).
- Nav-away: confirmed working (navigated to `/app`, rendered fine, not stuck).
- Evidence:
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/microbiology-virus-whole-glb-failure-desktop.png` (panel open — "Try again" hidden behind "TUNE MICROBE · VIRUS" panel, only top edge of the alert card peeking out above/below the panel)
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/microbiology-virus-whole-glb-failure-panel-closed-desktop.png` (panel closed — full alert card and "Try again" button visible and reachable)

### b2. Cutaway — `/models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb`

**Verdict: CONDITIONAL PASS — same behavior/finding as whole virion (b1).**

Same flow (Virus → Tune microbe → "Cutaway (real influenza)").

- `page.on('pageerror')`: `Error: Could not load /models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb: Failed to fetch`
- Console warning (caught): `[MicrobiologyLab] Virus model failed to load. Error: Could not load .../virus-influenza-pathogenar-cutaway-nih.glb: Failed to fetch`
- DOM check: `rootLen: 53757`, `bodyText: 2461` — app stayed mounted.
- Accessible fallback present: `role="alert"` text "This 3D virus model couldn't load. Try again" (same GlbErrorBoundary instance as b1, keyed by `${url}-${retryKey}`, so switching whole↔cutaway remounts it correctly — confirmed both variants independently trigger their own fallback rather than showing a stale one).
- Same P1 applies here by inspection: this fallback renders through the identical `<GlbErrorBoundary>`/panel layout as the whole-virion case (same `Tune microbe` panel occupies the same screen region), so the same obscured/unreachable "Try again" issue is expected to reproduce; not independently re-verified with a click-timeout test for this specific variant (see Unproven section) — flagged as the same P1, not a new one.
- Nav-away: not independently re-tested for this variant (already proven for b1 and for math cup with the identical nav pattern); not re-run here to stay within scope.
- Evidence:
  - `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/microbiology-virus-cutaway-glb-failure-desktop.png`

---

## c. Math cup — `/app/labs/math-manipulatives`

GLB tested: `/models/sourced/math-wave2/measuring-cup-milkandbanana.glb`

**Verdict: PASS (graceful degradation confirmed, no obstruction issue).**

Default active component on load is "Angle" (Geometry domain); the cup panel only mounts for the
fraction ids `decimal, denominator, equivalent-fraction, fraction, numerator, percent`. Selected
"Fraction" in the left rail to reach it.

- `page.on('pageerror')`: `Error: Could not load /models/sourced/math-wave2/measuring-cup-milkandbanana.glb: Failed to fetch`
- Console warning (caught): `[MathManipulativesLab] Measuring cup model failed to load. Error: Could not load .../measuring-cup-milkandbanana.glb: Failed to fetch`
- DOM check: `rootLen: 93440`, `bodyText: 2793` — app stayed fully mounted, rest of the lab (fraction tiles, numerator/denominator readout, key-facts panel) rendered normally alongside the failed cup.
- Accessible fallback: `role="alert"` text **"This 3D measuring cup model couldn't load. Try again"**, shown inside its own small dedicated "Drag to fill the cup" panel — fully visible, not obscured by any other UI.
- Retry control reachable: `button:has-text("Try again")` clicked successfully.
- Nav-away: confirmed working (navigated to `/app`, rendered fine, not stuck).
- Evidence: `review-screenshots/wave14-2026-08-18/cross-lab-glb-failure/math-cup-glb-failure-desktop.png`

No findings for Math cup. Cleanest of the three alongside Genetics DNA — the small self-contained
panel means the fallback card never competes for space with any other overlay.

---

## Summary table

| Lab / variant | GLB aborted | App stayed mounted | Accessible fallback shown | Retry reachable | Nav-away works | Verdict |
|---|---|---|---|---|---|---|
| Genetics DNA (real structure) | `dna-b-form-double-helix-nih.glb` | Yes (rootLen 64606) | Yes, `role="alert"` | Yes | Yes | PASS |
| Microbiology virus — whole | `virus-influenza-whole-nih.glb` | Yes (rootLen 53737) | Yes, `role="alert"` (DOM) | **No while Tune microbe panel open; Yes once closed** | Yes | CONDITIONAL PASS (P1) |
| Microbiology virus — cutaway | `virus-influenza-pathogenar-cutaway-nih.glb` | Yes (rootLen 53757) | Yes, `role="alert"` (DOM) | Not independently click-tested (same P1 expected) | Not independently re-tested | CONDITIONAL PASS (P1, by inspection) |
| Math cup | `measuring-cup-milkandbanana.glb` | Yes (rootLen 93440) | Yes, `role="alert"` | Yes | Yes | PASS |

## Findings by severity

- **P0:** none.
- **P1 (1 unique finding, affects both Microbiology virus variants):**
  - Microbiology virus GLB failure — "Tune microbe" panel, desktop 1440x900: when a GLB load fails
    right after the user picks "Whole virion (real influenza)" or "Cutaway (real influenza)" from
    the Tune microbe panel, that same panel remains open and visually covers the error card's
    "Try again" button, making it unclickable (`locator.click` times out) until the user separately
    closes the panel via its own "Hide microbe controls" close button — with no visual cue that a
    hidden retry control exists behind the panel.
    Evidence: `microbiology-virus-whole-glb-failure-desktop.png` (obstructed) vs.
    `microbiology-virus-whole-glb-failure-panel-closed-desktop.png` (same state, panel closed,
    fully reachable).
- **P2:** none observed.

## Unproven / not covered

- Mobile viewport (390x844) was not tested for any of the three labs — explicitly out of scope per
  task instructions ("skip mobile unless time allows").
- Microbiology cutaway variant: fallback presence (DOM `role="alert"` text) and mounted-app state
  were directly verified, but the click-timeout reproduction of the P1 (obstructed "Try again")
  and the nav-away-after-failure check were not independently re-run for this specific variant —
  inferred from the whole-virion result since both variants render through the same
  `GlbErrorBoundary`/panel layout and same call site. Flagged here rather than silently assumed.
- Did not test simultaneous/interleaved failures (e.g. aborting both virus GLBs in the same run, or
  aborting the GLB then letting a retry succeed) — task scoped each GLB to its own isolated run.
- Did not inspect whether the `console.warn` line surfaces raw internal error text
  (`[MicrobiologyLab] Virus model failed to load. Error: Could not load .../Failed to fetch`) to
  end users anywhere in the visible UI — confirmed it is console-only in all three labs, not
  rendered in the DOM/alert text shown to the learner.
