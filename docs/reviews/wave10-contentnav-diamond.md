# Wave 10 QA — contentnav-diamond

Dev server reachable at `http://127.0.0.1:5174` (HTTP 200). Isolated Playwright/Chromium instance run from `/tmp/wave10-contentnav-diamond` (own persistent profile, not the shared browser/extension). No product files modified — verified read-only throughout.

## Part 1 — ContentNav / BranchLab text audit

**Finding: the Wave 8 P0 is FIXED.** Verified via fresh source read and fresh live-page grep, independently — not assumed.

- `src/components/explorer/ContentNav.tsx:117` now reads `b.status === 'authored-pending' ? 'Not built yet' : 'Coming soon'` — the old `'Needs sourcing'` string is gone from the code entirely.
- Programmatic grep of `page.textContent('body')` for `"Needs sourcing"`, `"sourcing"`, `"TBD"`, `"lorem ipsum"`, `"placeholder"`, `"todo"`, `"authored-pending"`, `"licenseStatus"` across every captured page/sidebar state returned **zero matches** (`grep` exit code 1 across all `.txt` dumps).
- Sidebar screenshots confirm the badges rendered are `LIVE` / `COMING SOON` only — no internal pipeline vocabulary visible.

| Check | Result | Evidence |
|---|---|---|
| Atoms-and-elements sidebar, siblings visible, desktop 1440×900 | **PASS** — badges read `LIVE` (Periodic Table, Molecules And Bonding, Chemical Reactions) / `COMING SOON` (States Of Matter, Acids And Bases, Solutions, Stoichiometry Foundations, Organic Chemistry Foundations, Biochemistry Links) | `sidebar-atoms-desktop.png`, `sidebar-atoms-desktop-scrolled.png` |
| Algebra sidebar, siblings visible, desktop 1440×900 | **PASS** — badges read `LIVE` (Number Sense And Arithmetic, Fractions And Ratios, Geometry, Data And Statistics) / `COMING SOON` (Measurement, Graphs And Functions, Trigonometry Foundations, Calculus Foundations) | `sidebar-algebra-desktop.png`, `sidebar-algebra-desktop-scrolled.png` |
| Live/built component — Atom, atoms-and-elements default | **PASS** — genuine atom 3D scene (nucleus + orbiting electron shells) renders, matches the "Atom" name, no fallback note, no generic/wrong-topic model | `live-component-atoms-desktop.png` |
| Missing-state component — Electron (atoms-and-elements) | **PASS** — shows footer note "Illustrated 3D model, built to teach this topic clearly." (identical honest wording from Wave 8), no internal vocabulary leaked | `missing-state-electron.png`, `missing-state-electron-sidebar-scrolled.png`, `electron-sidebar-text.txt` |
| Missing-state component — Coefficient (algebra default) | **PASS** — same honest fallback note, confirmed in scrolled sidebar text dump | `missing-state-coefficient.png`, `sidebar-algebra-text.txt` |

No console errors observed during any of the Part 1 navigations.

**Severity:** the Wave 8 P0 (`"Needs sourcing"` leak) is now resolved — no open P0/P1 findings for Part 1. One minor observational note (not a defect): neither branch's sibling list happened to exercise the `'authored-pending'` → `"Not built yet"` code path (all locked siblings observed used the `else` branch, `"Coming soon"`), so that specific string wasn't directly witnessed live — but it is clearly non-internal, user-appropriate wording by inspection of the code, consistent with the fix.

## Part 2 — Diamond derivative re-render (`crystal-diamond-carbon-nih-material-fixed.glb`)

Confirmed via fresh grep of `src/` and `content/` that the file is **still not integrated**: no references to `crystal-diamond`/`diamond` in `src/data/modelRegistry.ts` or `src/routes/ChemistryLab.tsx`. `docs/assets/reviews/crystal-material-fix.md` confirms a "Wave 9 addendum" changed only the diamond material (raised `baseColorFactor` alpha from 0.42→0.62 and deepened the blue tint from `[0.86,0.92,0.96]`→`[0.58,0.74,0.86]`) specifically to address the Wave 8 washed-out finding — file mtime (Aug 18 04:39:48) is confirmed newer than both the Wave 8 report (04:31:08) and the Wave 8 diamond screenshots (04:34:51), so this is genuinely a different render than what Wave 8 saw.

Rendered directly from the served GLB (`http://127.0.0.1:5174/models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih-material-fixed.glb`, HTTP 200, `Content-Type: model/gltf-binary`) via a standalone `<model-viewer>` page (served over local HTTP to avoid `file://` CORS issues) with an off-white background, same 4-camera-angle method as Wave 8 (front/side90/back180/top-down).

| Angle | Geometry in-frame, no clipping | Material legibility | Evidence |
|---|---|---|---|
| Front (0°) | Yes | Clear pale blue-grey "gem" tone, visible specular highlights, easily distinguished from off-white background | `diamond-front.png` |
| Side 90° | Yes | Clear, good contrast — this is one of the two angles Wave 8 flagged as near-invisible; now clearly legible | `diamond-side90.png` |
| Back 180° | Yes | Clear, good contrast — the other angle Wave 8 flagged as near-invisible; now clearly legible | `diamond-back180.png` |
| Top-down | Yes | Palest of the four angles — visibly lighter than front/side/back — but still legible: distinct shading, specular highlights, and outline against the background, not literally invisible | `diamond-topdown.png` |

Tetrahedral bonded-carbon ball-and-stick cage geometry is intact and fully in-frame at all four angles in every screenshot — no clipping at canvas bounds observed. Console output during capture showed only WebGL performance warnings ("GPU stall due to ReadPixels") and a benign viewport-meta warning — no load/render errors on the final (HTTP-served) run.

**Verdict: PASS** (upgraded from Wave 8's CONDITIONAL). The specific concern raised in Wave 8 — "washed-out/near-invisible... especially at `back180` and `side90`" — is resolved at exactly those two angles in this re-render; the material now reads as a legible pale "clear gem" rather than a broken/empty render. Minor residual note (P2, not blocking): the top-down angle is noticeably paler than the other three and would benefit from the same contrast treatment if a wider range of camera angles is expected to be used in-app, but it does not read as invisible/broken.

**Separate, unrelated status note (not a material-quality issue):** the asset remains fully unintegrated — no `modelRegistry.ts` or `ChemistryLab.tsx` reference exists — so this PASS applies only to the standalone-render evidence above, not to any in-app experience (there isn't one yet to review).

## What I could not verify

- Whether any branch in the app actually has a sibling with `status: 'authored-pending'` that would render the `"Not built yet"` string live (only `"Coming soon"` was observed in the two branches sampled) — confirmed the string itself is safe by code read, but did not observe it rendered live.
- No in-app rendering of the diamond derivative exists to review (confirmed via grep, consistent with Wave 8) — Part 2 evidence is necessarily from a standalone test harness, not the production ChemistryLab UI/lighting/camera setup.

## Evidence index

All files under `review-screenshots/wave10-2026-08-18/contentnav-diamond/`:
`sidebar-atoms-desktop.png`, `sidebar-atoms-desktop-scrolled.png`, `sidebar-atoms-text.txt`, `sidebar-algebra-desktop.png`, `sidebar-algebra-desktop-scrolled.png`, `sidebar-algebra-text.txt`, `live-component-atoms-desktop.png`, `atoms-body-text.txt`, `atoms-nav-buttons.txt`, `missing-state-electron.png`, `missing-state-electron-sidebar-scrolled.png`, `electron-body-text.txt`, `electron-sidebar-text.txt`, `missing-state-coefficient.png`, `coefficient-body-text.txt`, `diamond-front.png`, `diamond-side90.png`, `diamond-back180.png`, `diamond-topdown.png`.

Files read (read-only, no edits): `docs/reviews/wave8-crystals-branchlab.md`, `docs/assets/reviews/crystal-material-fix.md`, `quantaora-app/src/components/explorer/ContentNav.tsx`, `quantaora-app/src/data/modelRegistry.ts`, `quantaora-app/src/routes/ChemistryLab.tsx`.

---
*Note: this report file was written by the Wave 10 coordinator on behalf of the `contentnav-diamond` reviewer agent, which produced all findings and evidence above but whose permission scope restricted its own file writes to `review-screenshots/`. Content is the reviewer's own verbatim report, persisted here to satisfy the wave's `docs/reviews/wave10-<scope>.md` deliverable format.*
