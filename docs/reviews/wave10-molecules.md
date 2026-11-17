# Wave 10 QA Report — Molecules Lab (NaCl focus)

**Scope:** `http://127.0.0.1:5174/app/labs/molecules`, desktop 1440x900 + mobile 390x844, isolated Playwright/Chromium session (persistent context at `/tmp/wave10-molecules/profile*`, no shared browser/extension used). Read-only — no product files were modified; only screenshots were written, plus throwaway scripts/logs under `/tmp/wave10-molecules/`.

Source consulted (read-only): `quantaora-app/src/data/molecules.ts`, `quantaora-app/src/routes/ChemistryLab.tsx`, `quantaora-app/src/components/explorer/MoleculeViewer.tsx`, `quantaora-app/src/components/explorer/CanvasControls.tsx`, `quantaora-app/src/components/explorer/DetailPanel.tsx`.

All evidence screenshots are under:
`review-screenshots/wave10-2026-08-18/molecules/`

## 1. Molecule switcher — all 5 molecules

The lab has exactly 5 molecules registered in `molecules.ts`: `water`, `oxygen`, `carbon-dioxide`, `methane`, `sodium-chloride-lattice`. Switched through all of them via the desktop left `ContentNav` list and the mobile bottom-tray pill switcher.

**PASS** — every molecule rendered a non-blank, correctly framed model at both viewports, with matching formula/bond/valence meters and correct summary copy:
- Water: `switcher-desktop-water.png`, `switcher-mobile-water.png`
- Oxygen: `switcher-desktop-oxygen.png`, `switcher-mobile-oxygen.png`
- Carbon Dioxide: `switcher-desktop-carbon-dioxide.png`, `switcher-mobile-carbon-dioxide.png`
- Methane: `switcher-desktop-methane.png`, `switcher-mobile-methane.png`
- Sodium Chloride: `switcher-desktop-sodium-chloride-lattice.png`, `switcher-mobile-sodium-chloride-lattice.png`

No blank/black canvases, no broken renders observed in any of the 10 switcher screenshots.

## 2. NaCl hotspots

NaCl has exactly 2 authored hotspots (`na`, `cl`) — confirmed both exist and are clickable (`naclHotspotCountDesktop: 2`, `naclHotspotCountMobile: 2`).

**PASS** — each hotspot produces a distinct, scientifically-correct label + description in the right-hand Detail Panel:
- Before click (overview panel): `nacl-desktop-before-hotspot.png`
- Na⁺ click → panel shows "Sodium ion (Na⁺)" with correct electron-transfer description + function text, isolate marker "Na" visible on the model: `nacl-desktop-hotspot-0-View_Na.png`
- Cl⁻ click → panel updates to "Chloride ion (Cl⁻)" with correct description, marker "Cl" visible: `nacl-desktop-hotspot-1-View_Cl.png`
- Mobile equivalents (scrolled to the detail panel, which sits below the fold in the mobile layout's independently-scrolling right `aside`): `nacl-mobile-hotspot-0-Na-scrolled.png`, `nacl-mobile-hotspot-1-Cl-scrolled.png`

Text matched the source content in `molecules.ts` exactly (e.g. "Sodium gave up its one loose outer electron entirely to chlorine..." / "Chlorine grabbed the electron sodium gave up..."). Cause/effect is clear and legible at both viewports.

**Note (not a bug, documented in-code):** the two hotspots are the single authored "formula unit," while the rendered GLB is a ~27-ion lattice — clicking a hotspot places its marker/label at one specific ion pair rather than one for every visible ion in the crystal. This is called out explicitly in `MoleculeViewer.tsx`'s own comments as an intentional simplification, not an oversight, so not flagged as a defect.

## 3. Fit View + zoom (full lattice, no clipping)

**PASS** — at both viewports, "Fit view" (found inside the "More" tools menu, confirmed reachable: `nacl-desktop-more-menu-open.png`, `nacl-mobile-more-menu-open.png`) frames the complete NaCl lattice with clear margin on all sides, no ions cut off by canvas bounds or overlapping UI:
- Desktop fit view: `nacl-desktop-fitview.png`
- Mobile fit view: `nacl-mobile-fitview.png`

Manual zoom in/out (toolbar Zoom In / Zoom Out buttons) both changed the rendered scale correctly while keeping the full lattice inside frame:
- Desktop zoomed in: `nacl-desktop-zoomed-in.png` — Desktop zoomed out: `nacl-desktop-zoomed-out.png`
- Mobile zoomed in: `nacl-mobile-zoomed-in.png` — Mobile zoomed out: `nacl-mobile-zoomed-out.png`

Pixel-cropped the top edge of `nacl-mobile-zoomed-in.png` to check for hard clipping at max zoom — confirmed no ion is flat-cut by the canvas edge at any zoom level tested.

**P2 (polish):** On mobile at 3-clicks-zoomed-in, the "Touch an atom to explore" instructional pill overlay sits directly on top of the middle ion in the lattice's top row, significantly obscuring it. Evidence: `nacl-mobile-zoomed-in.png`. This is a UI-overlay legibility issue, not a canvas-bounds clipping bug — the geometry itself is never cut off.

## 4. Console / network errors

Full console/pageerror/requestfailed log captured across the whole session. Verbatim entries:

```
[session] console.debug: [vite] connecting...
[session] console.info: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
[session] console.debug: [vite] connected.
[session] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
[session] console.warning: [.WebGL-0x1340056bc00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[session] console.warning: [.WebGL-0x1340056bc00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[session] console.warning: [.WebGL-0x1340056bc00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels
[session] console.warning: [.WebGL-0x1340056bc00]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels (this message will no longer repeat)
[session] console.debug: [vite] connecting...
[session] console.debug: [vite] connected.
[session] console.info: %cDownload the React DevTools for a better development experience: https://react.dev/link/react-devtools font-weight:bold
[session] console.warning: THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.
```

**PASS** — no `pageerror` entries, no `requestfailed` entries (no 404s on any of the GLBs loaded during the session), and no application-level `console.error`. The only warnings are a benign Three.js deprecation notice (`THREE.Clock`) and macOS WebGL/Metal driver performance advisories (GPU stall on `ReadPixels`), standard/expected on this platform during first paint, not application bugs.

## 5. No internal/debug UI text leaking

**PASS** — reviewed all 30 captured screenshots; no lorem ipsum, TODO strings, component names, or QA scaffolding visible anywhere in the Molecules lab UI at either viewport.

## What could not be verified / out of scope

- **Compare, Cross-section, X-Ray, Labels toggle, molecule builder (Build molecule), Lesson/Quiz modals** for NaCl — not exercised, since this review was scoped to switcher + NaCl hotspots + Fit View/zoom. `Section` (cross-section) is visibly disabled (greyed out, e.g. `nacl-desktop-fitview.png`) for every molecule in this lab — consistent code behavior (`ChemistryLab.tsx` doesn't pass `onToggleCrossSection`), not specific to NaCl.
- Programmatic extraction of Detail Panel text initially targeted the wrong DOM node (no `data-detail-panel` attribute in the markup) — compensated by visually confirming the correct label/description via screenshots instead, so the underlying claim is still evidenced, just noting the tooling limitation for transparency.
- Onboarding, Labs catalog, Notebook, or any lab other than Molecules — out of scope, not reviewed.
- Tablet or other intermediate viewports — only the two specified viewports (1440x900, 390x844) were tested.

## Severity summary

- **P0:** none found.
- **P1:** none found.
- **P2:** mobile zoomed-in NaCl view — "Touch an atom to explore" instructional pill overlaps/obscures the top-middle ion of the lattice (`nacl-mobile-zoomed-in.png`). Not a clipping bug; purely a legibility/overlay polish issue at that specific zoom level on mobile.

Overall: the NaCl lattice and the 4 other molecules render correctly and consistently at both viewports, Fit View reliably frames the full uncropped lattice, zoom in/out both work without clipping, both NaCl hotspots produce distinct correct content changes (verified on both viewports), and no console/network errors occurred during the session.

---
*Note: this report file was written by the Wave 10 coordinator on behalf of the `molecules` reviewer agent, which produced all findings and evidence above but whose permission scope restricted its own file writes to `review-screenshots/`. Content is the reviewer's own verbatim report, persisted here to satisfy the wave's `docs/reviews/wave10-<scope>.md` deliverable format.*
