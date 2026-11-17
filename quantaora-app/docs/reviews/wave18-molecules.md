# Wave 18 QA — Molecules (Chemistry)

Reviewer: Wave 18 reviewer — molecules scope (read-only visual QA)
Date: 2026-08-18
Dev server: http://127.0.0.1:5174 (reachable, not restarted/interfered with)
Route: `/app/labs/molecules` (component: `src/routes/ChemistryLab.tsx`, data: `src/data/molecules.ts`)
Molecules available (5): Water, Oxygen, Carbon Dioxide, Methane, Sodium Chloride
Method: isolated Playwright (chromium) launched from `/tmp/wave18-molecules-qa`, `page.on('console')` / `page.on('pageerror')` active for the entire session.

Evidence directory: `review-screenshots/wave18-2026-08-18/molecules/` (18 PNGs).
Source files inspected (read-only): `src/data/molecules.ts`, `src/routes/ChemistryLab.tsx`, `src/components/explorer/MoleculeViewer.tsx`, `src/components/explorer/ContentNav.tsx`, `src/components/explorer/CanvasControls.tsx`.

## Overall verdict: PASS

No P0 or P1 findings. All 5 molecules load correctly at both 1440x900 and 390x844 with no blank canvases, crashes, clipping, or console/page errors. Water's 3 atoms are correctly color/size-distinguished (red O vs white H, CPK convention), formula "H₂O" is legible everywhere, and oxygen/hydrogen hotspots correctly show atom-specific info panels on both viewports. No molecules failed the smoke test.

## Check 1 — Water: three atoms visually distinguishable (1440x900)

**PASS.** Oxygen renders as one large red sphere (`#ff2d2d`, radius 0.4); each hydrogen renders as a smaller off-white/grey sphere (`#f4f2ee`, radius 0.24) — consistent CPK-style convention, color- and size-differentiated. Confirmed at both the "as-loaded" default and at a manually-verified static (auto-rotate off + camera reset) framing.
- Evidence: `water-default-desktop-1440x900.png`, `water-static-default-desktop-1440x900.png`

**P2 (minor, self-correcting):** Auto-rotate is on by default (`autoRotate` state initializes `true` in `ChemistryLab.tsx`). Because water's two hydrogens sit at the same Y/Z and only differ in X (`h1: [0.712,-0.551,0]`, `h2: [-0.712,-0.551,0]`), a screenshot taken at certain moments during the rotation animation shows the two hydrogen spheres visually overlapping (transiently reads as a single blob) before rotation continues and separates them again. Captured on `water-default-mobile-390x844.png` (taken ~1.5s after page load) vs. the clean desktop capture, purely due to timing — not a static/geometry bug. Confirmed by pausing rotation and resetting camera (`water-static-default-mobile-390x844.png` shows both hydrogens clearly separated).

## Check 2 — Correct chemical formula "H₂O" displayed legibly

**PASS**, both viewports. Header pill reads "WATER (H₂O) · DRAG TO ROTATE · CLICK AN ATOM" (desktop) / breadcrumb chip "Water" (mobile), and the FORMULA stat card shows "H₂O" (proper subscript-2 glyph) in both the canvas overlay and the right-hand Key Facts panel.
- Evidence: `water-default-desktop-1440x900.png`, `water-default-mobile-390x844.png`

## Check 3 — Hotspots exist, are clickable, and show correct per-atom info

**PASS**, both viewports. Clicking the oxygen hotspot (`aria-label="View O"`) isolates/highlights the red sphere and opens a right-panel card: "STRUCTURE / Oxygen — The larger, more electronegative atom... / FUNCTION: Forms two single covalent bonds with hydrogen and holds two lone pairs of electrons." Clicking a hydrogen hotspot (`aria-label="View H"`) correctly swaps to: "STRUCTURE / Hydrogen — A single proton and electron... / FUNCTION: Forms one single covalent bond with oxygen; this side of the molecule is slightly positive." No cross-contamination of info between atoms observed.
- Desktop: `water-oxygen-hotspot-desktop-1440x900.png`, `water-hydrogen-hotspot-desktop-1440x900.png`
- Mobile: `water-oxygen-hotspot-mobile-390x844.png` (isolate state), `water-oxygen-hotspot-mobile-panel-390x844.png` (info panel, reached by scrolling below the canvas — expected mobile single-column layout, not a bug)

## Check 4 — Repeat 1–3 at 390x844 mobile

**PASS**, all three sub-checks hold on mobile: three distinguishable atoms (once rotation is paused/reset — see P2 above), correct "H₂O" formula display, and working oxygen/hydrogen hotspots with correct per-atom info (panel requires scrolling into view, normal for the mobile layout — content itself did not overflow or clip).

## Check 5 — Smoke test remaining molecules (Oxygen, Carbon Dioxide, Methane, Sodium Chloride)

**PASS for all 4**, at both viewports — each loads with a non-blank, non-crashed, properly-framed canvas:
- Oxygen (O₂): two identical red spheres + bond stick, formula "O₂" correct. `molecule-oxygen-desktop-1440x900.png`, `molecule-oxygen-mobile-390x844.png`
- Carbon Dioxide (CO₂): black carbon center flanked by two red oxygens (real sourced GLB), formula "CO₂" correct, linear geometry visible. `molecule-carbon-dioxide-desktop-1440x900.png`, `molecule-carbon-dioxide-mobile-390x844.png`
- Methane (CH₄): black carbon center with 4 white hydrogens in tetrahedral arrangement (real sourced GLB), formula "CH₄" correct. `molecule-methane-desktop-1440x900.png`, `molecule-methane-mobile-390x844.png`
- Sodium Chloride (NaCl): purple/green alternating ion lattice, formula "NaCl" correct, correctly labeled as ionic ("Bonding & Charge Map" swap instead of polarity map). `molecule-sodium-chloride-desktop-1440x900.png`, `molecule-sodium-chloride-mobile-390x844.png`

No blank canvases, no clipped geometry against the canvas bounds, no overlapping/obscured toolbar controls observed for any of the 5 molecules at either viewport.

## Check 6 — Console/pageerror audit

**No errors, no pageerrors** for the entire session (page load + molecule switches + hotspot clicks, both viewports). Only benign warnings logged, none correlated with any molecule failing to load:
```
"THREE.Clock: This module has been deprecated. Please use THREE.Timer instead." (both viewports, on load)
"[.WebGL-...] GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels" (desktop only, x4, driver-level perf hint, not app-level)
```
`pageerrors: []` for both viewports.

## Additional observation (P2, code-cross-referenced, not in original checklist)

The toolbar's Play/Pause "model animation" control is wired as `animationAvailable={labMode === 'molecules'}` in `ChemistryLab.tsx` (line 788) — i.e. enabled/active-styled for every molecule in Molecules mode, including fully procedural presets like Water/Oxygen/Sodium Chloride that have no embedded GLB animation to actually play or pause. Visually this renders as a solid-purple "active" Pause button, indistinguishable from a real, functioning toggle, whereas the neighboring "Section" (cross-section) button correctly greys out/disables when unsupported. Toggling it produces no observable change for these molecules. Minor control-clarity issue, not blocking.

## Findings by severity

- **P0:** none.
- **P1:** none.
- **P2 (2):**
  1. Auto-rotate can transiently overlap water's two hydrogens in screen-space projection at certain animation frames — self-corrects as rotation continues; confirmed non-issue with rotation paused/reset.
  2. Play/Pause "model animation" toolbar button renders as active/enabled for procedural molecules (Water, Oxygen, Sodium Chloride) that have no animation to toggle, unlike the Section button which correctly disables.
