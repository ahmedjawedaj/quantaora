# Chemistry Gaps Wave 2 — Visual Acceptance Review

Reviewer: Wave 6 read-only visual QA agent (chemistry-gaps scope)
Date: 2026-08-18
Method: Rendered each GLB via Google `<model-viewer>` (CDN, offline Chromium via cached
Playwright) at 4 camera angles each (`front` = `0deg 75deg 105%`, `side90` = `90deg 75deg 105%`,
`back180` = `180deg 60deg 120%`, `top-down` = `0deg 15deg 140%`), served locally from `public/`.
Screenshots saved under
`review-screenshots/asset-acceptance-2026-08-18-wave6/chemistry-gaps/<model-name>/<angle>.png`.
No product source files were modified; only screenshots and this report were written.

All four source `.license.json` sidecars pre-flag `reviewStatus: "render-review-pending"` and note
each GLB is a **single untextured mesh, `materialCount: 0`**, converted from a 3D-print
STL/OpenSCAD source rather than authored for web display. That is confirmed visually below: every
model renders in `model-viewer`'s flat default white/off-white material, with no per-atom CPK
coloring and no distinguishing material between the four crystal types.

---

## crystal-diamond-carbon-nih.glb

- **Verdict: CONDITIONAL**
- Path: `public/models/sourced/chemistry-gaps-wave2/crystal-diamond-carbon-nih.glb`
- Evidence: `crystal-diamond-carbon-nih/front.png`, `side90.png`, `back180.png`, `top-down.png`
- Likely component mapping: per sidecar, "Metal/Nonmetal/Metalloid/Noble-gas specimen set
  (nonmetal candidate)" — fills part of the periodic-table specimen gap.
- Structure/material/scale: Reads clearly as a small tetrahedrally-bonded carbon cage
  (diamond-cubic unit cell) — ball-and-stick spheres joined by straight rod bonds at consistent
  tetrahedral angles, visible in all 4 angles (`side90.png` and `top-down.png` are the clearest
  for showing the 3D cage rather than a flat pattern). It is a single small unit cell, not a
  large repeating lattice grid — a student would see "atoms joined in a 3D cage" but not an
  obviously infinite/repeating crystal. No color/material differentiation from the other three
  models (flat white/grey, matches sidecar's `materialCount: 0` note).
- Framing/performance: Model is fully in-frame at all 4 angles, no clipping, reasonable file size
  (699 KB).
- Integration safety: Needs a material pass (color, e.g. clear/pale for diamond) before it can be
  told apart from the other three crystal types in-app; currently indistinguishable by color from
  SiC, graphite, and quartz. Geometry itself is sound and child-legible as "3D cage of bonded
  atoms."

## crystal-silicon-carbide-2h-nih.glb

- **Verdict: CONDITIONAL**
- Path: `public/models/sourced/chemistry-gaps-wave2/crystal-silicon-carbide-2h-nih.glb`
- Evidence: `crystal-silicon-carbide-2h-nih/front.png`, `side90.png`, `back180.png`,
  `top-down.png`
- Likely component mapping: per sidecar, "Metal/Nonmetal/Metalloid/Noble-gas specimen set
  (metalloid/semiconductor-family candidate)"; sidecar explicitly flags this is SiC (a compound),
  not elemental silicon, and that the mapping should be double-checked for scientific accuracy if
  wired into a "silicon" labeled slot.
- Structure/material/scale: Reads as a hexagonal wurtzite-type stacked-layer lattice — distinctly
  different topology from the diamond cage: `back180.png` and `top-down.png` show alternating
  atom layers connected by vertical bonds in a repeating column pattern, visibly different from
  diamond's compact cage and from graphite's flat sheet. There does appear to be a subtle size
  difference between alternating atom spheres (consistent with Si vs. C), though this is hard to
  confirm without color-coding. Structurally the most convincingly "crystal lattice"-looking of
  the four (clear repeating unit visible).
- Framing/performance: Fully in-frame at all 4 angles, no clipping. Small file (257 KB).
- Integration safety: Same material-pass need as diamond — currently flat white/grey,
  indistinguishable by color from the other three. Content-accuracy note from the sidecar (SiC vs
  elemental Si) must be preserved in any future labeling.

## crystal-graphite-sheet-nih.glb

- **Verdict: CONDITIONAL**
- Path: `public/models/sourced/chemistry-gaps-wave2/crystal-graphite-sheet-nih.glb`
- Evidence: `crystal-graphite-sheet-nih/front.png`, `side90.png`, `back180.png`, `top-down.png`
- Likely component mapping: per sidecar, "carbon allotrope comparison — diamond vs graphite,"
  bonus to the specimen-set gap. Requires CC-BY attribution (unlike the other three CC0 assets
  in this wave) — the sidecar flags this explicitly and it is not yet displayed anywhere in the
  render (no in-scene attribution text, as expected for a raw GLB).
- Structure/material/scale: This is the most visually distinct of the four and unambiguously
  reads as a flat honeycomb hexagonal sheet — `front.png` shows a textbook hexagonal graphene
  lattice; `side90.png` (edge-on) confirms it collapses to a thin near-planar sheet, in sharp
  contrast to diamond's 3D cage and SiC's layered-but-3D structure. This single-handedly gives a
  child a clear "flat sheet" vs. "3D cage" visual contrast against the diamond model. Note: this
  is a single graphene-layer sheet (per sidecar description), not multiple stacked graphite
  layers — scientifically it illustrates "graphite's flat hexagonal sheet motif" but not the
  interlayer stacking that defines bulk graphite; worth a labeling caveat if used to teach
  "graphite" specifically rather than "a graphene sheet." Dangling half-bonds visible at the
  sheet's cut edges (e.g. `back180.png`) — expected artifact of cropping a periodic sheet to a
  finite tile, minor.
- Framing/performance: Fully in-frame at all 4 angles, no clipping. Small file (313 KB).
- Integration safety: Needs the same material pass as the others, plus an in-app CC-BY
  attribution line before shipping (legally required, unlike the CC0 siblings in this wave).

## crystal-alpha-quartz-nih.glb

- **Verdict: REJECT**
- Path: `public/models/sourced/chemistry-gaps-wave2/crystal-alpha-quartz-nih.glb`
- Evidence: `crystal-alpha-quartz-nih/front.png`, `side90.png`, `back180.png`, `top-down.png`
- Likely component mapping: per sidecar, "general crystal-lattice structure example (silicate
  mineral, covalent network crystal)," a bonus candidate beyond the named
  metal/nonmetal/metalloid/noble-gas set.
- Structure/material/scale: **Does not read as an assembled crystal lattice at all.** All four
  angles show a scattered arrangement of disconnected geometry: individual solid hemispheres/
  spheres with small drilled peg-holes floating with visible gaps between them, plus a separate
  cluster of flat, thin stacked disc/bar shapes that (per `side90.png` and `top-down.png`) are
  clearly unconnected pieces rather than lattice bonds. There is no visible bond connectivity
  between any of the "atom" pieces — it looks like an unassembled 3D-print parts kit (individual
  atom pieces meant to be pegged together by hand, per the sidecar's own description: "Basic atom
  model can be used to create an atom with any number of bonds at any angle"), not a
  pre-assembled unit cell. A child looking at this would not perceive "repeating pattern of
  bonded atoms" — it reads as scattered disconnected shapes, closer to a rendering/data bug than
  a molecule. This fails the core child-recognizable-lattice bar on its own, independent of the
  cross-model color-distinctness issue shared by all four assets.
- Framing/performance: Geometry is within the camera frame (no off-screen clipping), but framing
  is irrelevant given the structural failure above. Largest file in the set (5.1 MB) for what
  renders as a handful of disconnected primitive shapes.
- Integration safety: Not safe to wire into the app as-is. This asset would need to be
  re-examined against the source NIH 3D entry (3DPX-008115) to confirm whether the downloaded
  `.glb` variant is actually the assembled unit-cell model or an unassembled print-parts export;
  as rendered, it does not depict alpha-quartz's helical/tetrahedral SiO2 framework in any
  legible way.

---

## Cross-comparison: are all four visually distinct?

**No — not fully.** Three of the four (diamond, silicon carbide, graphite) ARE clearly distinct
from each other in bond topology/geometry: diamond is a compact 3D tetrahedral cage, silicon
carbide is a layered hexagonal wurtzite stack, and graphite is an unmistakably flat honeycomb
sheet (confirmed edge-on). A learner could tell these three apart by shape alone. However:

1. **Color/material is identical across all four** — every asset renders in the same flat
   default white/off-white with zero embedded materials (`materialCount: 0` per every sidecar,
   confirmed visually). None of the expected differentiating colors (diamond clear, graphite
   dark, quartz translucent, SiC blue-grey) are present. Until a material/re-coloring pass is
   applied, a learner relying on color alone (as opposed to careful shape inspection) cannot
   distinguish them, and side-by-side in a comparison UI they would look like four grey blob
   variants rather than four different real-world materials.
2. **Alpha-quartz is not comparable at all** — it fails the basic "reads as a lattice" bar
   before color/topology distinctness is even a relevant question (see REJECT above). It cannot
   be meaningfully compared against the other three because it does not present a lattice
   structure.

Net: 3 of 4 pass the shape-distinctness check pending a material pass (CONDITIONAL); 1 of 4
(alpha-quartz) fails outright and should not be integrated without further sourcing verification.
