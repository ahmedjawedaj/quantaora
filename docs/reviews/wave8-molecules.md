# Wave 8 QA — Molecules

Date: 2026-08-18
Route: `/app/labs/molecules`
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/molecules/` (33 PNGs)

No console `error`-level messages or `pageerror` events across the full session (5 molecules x 2 viewports x multiple interactions). Only benign warnings at initial load (`THREE.Clock deprecated`, WebGL "GPU stall due to ReadPixels").

## Checklist verdicts

**1. Switching between water, O2, CO2, methane, NaCl — desktop + mobile: PASS**
Desktop `ContentNav` list and mobile horizontal chip switcher both work for all 5 molecules at both viewports, canvas rebuilds each time, no crashes.

**2. Distinct asset + correct formula per molecule: PASS (formula) / PARTIAL (asset clarity)**
Formulas correct and properly styled with subscripts: H₂O, O₂, CO₂, CH₄, NaCl. Assets are structurally distinct (diatomic, bent triatomic, linear triatomic, tetrahedral, ionic lattice), but Water, CO2, and NaCl are so badly clipped (see framing findings) that the distinct geometry is hard to perceive.

**3. Hotspots present/distinct per molecule: PASS (water, O2, CO2, methane) / FAIL (NaCl)**
Water, Oxygen, CO2, Methane each show molecule-specific hotspot copy on atom click (e.g. clicking O in water surfaces "Oxygen — the larger, more electronegative atom..."). NaCl is broken: clicking directly on rendered Na/Cl spheres (4+ points at desktop incl. after zoom-out/fit-view, 4 points on mobile) never triggers a label or info-panel change.

**4. Camera framing / clipping: FAIL (water, CO2, NaCl) / PASS (O2, methane)**
- Water: oxygen sphere dominates/crowds frame at both viewports, hydrogens partially cropped/overlapped, bent geometry hard to read.
- CO2: severely clipped top/left/right at desktop; clipped right/bottom on mobile.
- NaCl: worst — clipped on all four edges at both viewports, uncorrectable via in-app controls (tried Zoom Out x6 and "Full"/fit-view reset, lattice stays cropped). Root cause (read-only inspection): all molecules share one fixed camera-distance range (`DEFAULT/MIN/MAX = 3.6/2/6` in `src/routes/ChemistryLab.tsx:19-21`), fine for small covalent molecules but far too tight for the larger repeating NaCl lattice mesh.
- Oxygen and Methane: well-centered, fully in frame, no clipping, both viewports.

**5. Toolbar/controls reachable and functional: PASS**
Rotate, Pause, Isolate, Zoom In/Out, Full, More, Reset, Compare all visible/reachable at both viewports with no overlap/cropping. Compare dialog opens cleanly with no overflow at either viewport. Molecule-builder side panel renders without overflow on mobile. Note: "Section" (cross-section) toolbar item is present but permanently disabled across all 5 molecules/both viewports — flagged as P2 since it's a listed but never-usable control.

**6. No internal QA/debug language leaking into UI: PASS**

## Findings

**P0 — broken/blocking**
1. NaCl hotspots are completely non-functional at both desktop and mobile — clicking directly on rendered Na/Cl atoms never triggers a label or info-panel change, zero cause/effect feedback for this molecule. Evidence: `desktop-nacl-hotspot-p1.png`–`p4.png`, `desktop-nacl-zoomed-out-hotspot.png`, `mobile-nacl-hotspot-multi.png`.
2. NaCl camera framing is broken and uncorrectable via any in-app control — lattice clipped on all four edges at both viewports. Evidence: `desktop-nacl.png`, `desktop-nacl-zoomed-out.png`, `desktop-nacl-fitview.png`, `mobile-nacl.png`.

**P1 — significant**
3. CO2 desktop framing severely clipped top/left/right — atoms overflow canvas bounds. Evidence: `desktop-co2.png`.
4. CO2 mobile framing clipped right/bottom. Evidence: `mobile-co2.png`.
5. Water framing over-zoomed/oversized at both viewports — oxygen atom crowds frame, partially overlaps/crops the two hydrogens, obscuring the bent molecular shape. Evidence: `desktop-water.png`, `mobile-water.png`.

**P2 — polish**
6. Compare dialog body copy uses plain "CO2" (no subscript) while formula fields elsewhere in the same dialog use styled "CO₂" — typographic inconsistency. Evidence: `desktop-compare-dialog.png`.
7. "Section" (cross-section) toolbar control permanently disabled for all 5 molecules at both viewports; likely intentional but worth confirming since it's a listed but never-functional affordance.

## Files inspected (read-only)
`src/routes/ChemistryLab.tsx`, `src/components/explorer/MoleculeViewer.tsx`, `src/data/molecules.ts`, `src/App.tsx`. No product/source files modified.
