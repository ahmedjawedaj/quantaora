# Wave 10 Visual QA — Number Sense / Abacus (Place Value component)

**Route:** `/app/labs/number-sense` · **Date:** 2026-08-18
**Tool:** ad hoc Playwright (Chromium, isolated persistent-context profiles, not the shared browser
session) run from `/tmp/wave10-number-sense`, headless.
**Scope:** MOBILE 390×844 (primary) + DESKTOP 1440×900 (secondary) passes on the Abacus
component, which lives inside the "Number Sense" lab and is labeled **"Place Value"** in the
component switcher (there is no separate item literally named "Abacus" — Place Value is the
component that renders the 3-rod bead abacus, confirmed by DOM inspection and screenshots below).

All screenshots: `review-screenshots/wave10-2026-08-18/number-sense/`

---

## 1. Component switcher → Abacus (Place Value)

**PASS** (both viewports).

- Mobile: switcher is a horizontal pill row at the bottom of the card, labeled "COMPONENT 1 OF
  10" by default with **Addition** selected.
  Evidence: `mobile-390x844-switcher-default.png`.
- Clicking the **Place Value** pill switches the lab to the abacus, auto-scrolls the pill row so
  the newly-selected pill stays in view, and re-renders the 3D scene, lesson copy, and key-facts
  panel for Place Value.
  Evidence: `mobile-390x844-switcher-abacus-selected.png`, `mobile-390x844-abacus-initial.png`.
- Desktop: switcher is a left sidebar list instead of a pill row; clicking "Place Value" in the
  sidebar works identically.
  Evidence: `desktop-1440x900-switcher-default.png`, `desktop-1440x900-switcher-abacus-selected.png`.

## 2. Changing all rods (Hundreds, Tens, Ones) + digit readouts

**PASS** (both viewports). Only 3 rods exist for this lab (Hundreds, Tens, Ones) — confirmed by
DOM query, no hidden/undiscovered rods.

For every rod, on every viewport, I drove the digit to its minimum (0) via the `−` button, to its
maximum (9) via the `+` button, and to a mid value (4), and captured the rod card + summary panel
(Digits / Number / Expanded) after each change:

| Rod | Min screenshot | Max screenshot | Mid screenshot |
|---|---|---|---|
| Hundreds | `mobile-390x844-rod-hundreds-digit0.png` | `mobile-390x844-rod-hundreds-digit9.png` | `mobile-390x844-rod-hundreds-digit4-mid.png` |
| Tens | `mobile-390x844-rod-tens-digit0.png` | `mobile-390x844-rod-tens-digit9.png` | `mobile-390x844-rod-tens-digit4-mid.png` |
| Ones | `mobile-390x844-rod-ones-digit0.png` | `mobile-390x844-rod-ones-digit9.png` | `mobile-390x844-rod-ones-digit4-mid.png` |

(desktop equivalents use the `desktop-1440x900-` prefix, same filenames otherwise)

- The `−`/`+` buttons correctly clamp at 0 and 9 — 12 consecutive `−` clicks from 5 stopped
  exactly at 0, never went negative; 12 consecutive `+` clicks stopped exactly at 9, never
  double-digit. Verified via `aria-label` (e.g. "Push a bead down: decrease Hundreds rod" /
  "Push a bead up: increase Hundreds rod" — good a11y labeling, noted positively).
- The **Digits / Number / Expanded** summary cards update correctly and atomically with every rod
  change, e.g. Hundreds→0 with Tens=7, Ones=3 shows Digits `073`, Number `73`, Expanded
  `0 + 70 + 3` (`mobile-390x844-rod-hundreds-digit0.png`); Ones→9 with Hundreds=4, Tens=4 shows
  Digits `449`... then with Tens→9 shows `449`→`494`→`499` progressing correctly across the three
  rod-sequence screenshots.

## 3. Bead ↔ digit correctness (core check)

**PASS.** This is a real soroban-style abacus (1 "heaven" bead worth 5 above the crossbar, up to
4 "earth" beads worth 1 each below), not a naive 1-bead-per-unit counter, and the beads move
correctly and legibly with digit changes:

- **Ones rod, digit 0** (`mobile-390x844-rod-ones-digit0-closeup.png` /
  `mobile-390x844-rod-ones-digit0.png`): 0 blue beads touching the crossbar (both heaven and earth
  beads pulled away, resting off to the side).
- **Ones rod, digit 4** (`mobile-390x844-rod-ones-digit4-mid.png`): exactly 4 blue beads stacked
  touching the crossbar (4 earth beads, 0 heaven) — matches 4 = 0×5 + 4×1.
- **Ones rod, digit 9** (`mobile-390x844-rod-ones-digit9.png`): 4 blue beads clustered at the bar
  **plus** a 5th blue bead separated by a visible gap above them — matches 9 = 1×5 + 4×1 (heaven
  bead now engaged).
- Same pattern independently verified for **Hundreds rod** (`..-rod-hundreds-digit0.png` → 0
  beads, `..-rod-hundreds-digit9.png` → 4+1 beads) and **Tens rod**
  (`..-rod-tens-digit0.png` → 0 beads, `..-rod-tens-digit9.png` → 4+1 beads), each time with the
  *other two* rods' bead counts unchanged from their own untouched digit values — proving each
  rod's beads respond only to its own digit, not to sibling rods.
- Desktop reproduces the identical bead logic (`desktop-1440x900-rod-hundreds-digit9.png`, etc.).

This is a legible, correct cause/effect interaction — a learner can directly see how many beads
are "in use" at a glance and that it matches the digit shown.

## 4. Canvas fit / no clipping

**Mobile 390×844 — PASS.** Canvas bounding box `{x:26, y:193, w:338, h:133}` sits entirely inside
the 390×844 viewport with margin on every side. Full abacus board, both rod tops (with cream bead
caps) and all resting beads at the bottom are completely visible and un-clipped.
Evidence: `mobile-390x844-canvas-zoom-forcomparison.png` (2× zoom of the full board — every rod
top and every resting bead fully rendered, nothing sliced by canvas or card edges). Toolbar (10
icons: Rotate/Play/Isolate/Section[disabled]/Compare/Zoom In/Zoom Out/Full/More/Reset) is a single
horizontal row, all icons visible, none clipped or overlapping — `mobile-toolbar` region cropped
from `mobile-390x844-abacus-initial.png`. `document.documentElement.scrollWidth/scrollHeight`
exactly match `innerWidth/innerHeight` (390×844) — no page-level scroll/overflow.

**Desktop 1440×900 — FAIL, P1 (model clipping).** The abacus model itself is clipped by its own
canvas frame:
- Top: the top of each rod and its "heaven" bead cap get sliced off by the top edge of the canvas
  card. When Hundreds is driven to 9 (heaven bead engaged, sitting near the top of its travel),
  the entire cream heaven-bead cap for that rod is cut off completely — compare the fully-visible
  cream cap on the untouched Ones rod in the same frame.
  Evidence: `desktop-1440x900-CLIP-EVIDENCE-top-zoom.png`,
  `desktop-1440x900-CLIP-EVIDENCE-hundreds-digit9-fullcanvas.png`.
- Bottom: the resting/unused beads stacked at the bottom of each rod are sliced by the bottom edge
  of the canvas card (e.g., only ~3.5 of 4 resting beads visible on the Hundreds rod at rest).
  Evidence: `desktop-1440x900-CLIP-EVIDENCE-bottom-zoom.png`.
- This does **not** reproduce on mobile with the same digit states — the desktop camera/viewport
  framing appears to zoom in tighter relative to the taller canvas aspect ratio, pushing the model
  bounds outside the frame. `document.documentElement.scrollWidth/scrollHeight` do match
  `innerWidth/innerHeight` (1440×900, no page-level scroll), so this is strictly a within-canvas
  framing/clipping issue, not a page overflow issue.
- Toolbar (vertical column on desktop) is fully visible with no overlap — not part of this
  finding.

## 5. Console / page errors

**PASS — no errors on either viewport**, only benign dev-time warnings (not app bugs):
- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (mobile +
  desktop)
- `[.WebGL-...] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to
  ReadPixels` ×4, self-limiting ("this message will no longer repeat") — mobile only, standard
  headless/software-GL performance chatter.
- No `pageerror`, no failed network requests, on either viewport, across the full sequence of
  switcher clicks + all rod min/max/mid interactions.
Full logs: saved from the run (see below) — mobile had the WebGL perf lines above; desktop had
only the THREE.Clock line.

## 6. QA/debug text leakage

**PASS.** Scanned full page `innerText` for `lorem ipsum|TODO|FIXME|debug|placeholder text|test
scaffold` (case-insensitive) on both viewports after every state change — no matches found.

---

## Summary of findings

| Sev | Surface / Viewport | Issue | Evidence |
|---|---|---|---|
| P1 | Number Sense → Place Value (Abacus), **desktop 1440×900** | Abacus model (rod tops / heaven-bead caps and bottom resting beads) is clipped by its own canvas frame; does not reproduce on mobile with identical digit states | `desktop-1440x900-CLIP-EVIDENCE-top-zoom.png`, `desktop-1440x900-CLIP-EVIDENCE-bottom-zoom.png`, `desktop-1440x900-CLIP-EVIDENCE-hundreds-digit9-fullcanvas.png` vs `mobile-390x844-canvas-zoom-forcomparison.png` |
| P2 | Number Sense → Place Value (Abacus), **desktop 1440×900** | "EXPANDED" stat card truncates to `500 + 70 +…`, hiding the final `+ 3` term, despite ample empty horizontal space before the "Tune numbers" button; mobile shows the full string in the same state | `desktop-1440x900-EXPANDED-panel-truncation-zoom.png` vs `mobile-390x844-EXPANDED-panel-fulltext-zoom.png` |

No P0s. Everything else checked (switcher, rod controls reachability/clamping, bead↔digit
correctness for all 3 rods, mobile canvas fit, toolbar reachability, console/page errors, QA-text
leakage) **passed** on both viewports, mobile-primary.

## Not verified / out of scope for this pass

- The `Tune numbers` panel's own contents/overflow behavior was not opened/tested (not required
  by the assigned check list).
- The other 9 components in this lab (Addition, Subtraction, Multiplication, Division, Number
  Line, Negative Numbers, Factors, Multiples, Prime Number) were not reviewed — task scope was the
  Abacus/Place Value component specifically.
- Toolbar buttons (Rotate, Play, Isolate, Compare, Zoom, Full, Reset) were confirmed **visible and
  reachable** at both viewports but their individual *behavior* (e.g. does Rotate actually spin
  the model, does Compare open a real comparison view) was not exercised — only the rod
  `−`/`+` interaction was used for the required cause/effect check, per task scope.
- Whether the desktop clipping is a camera-framing regression vs. an intentional (if visually
  broken) design choice was not something I could determine from the outside — reported purely as
  observed clipped geometry.
