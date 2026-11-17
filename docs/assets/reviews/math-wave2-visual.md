# Math Wave 2 — Visual/Render Review (Wave 6, 2026-08-18)

Scope: render-review the 7 GLBs downloaded by the MATH-WAVE2 sourcing agent
(`docs/assets/math-wave2.md`) under `quantaora-app/public/models/sourced/math-wave2/`. Each was
previously marked `"reviewStatus": "render-review-pending"` in its `.license.json` sidecar and
had not been opened in a 3D viewer before this review. This wave opens each in a headless
`<model-viewer>` (Chromium via Playwright) at 4 camera angles per model and visually inspects
every screenshot.

Method: served `public/` over local HTTP, loaded each GLB in Google's `<model-viewer>` web
component, captured PNGs at `front` (0°/75°/90%), `side` (90°/75°/90%), `top-ish`
(180°/45°/100%), and `closeup-front` (15°/80°/55%) camera orbits. One extra diagnostic angle set
was captured for the die to confirm a defect (see below). Screenshots live under
`review-screenshots/asset-acceptance-2026-08-18-wave6/math/<model-name>/` (paths below are
relative to `quantaora-app/`).

---

## 1. measuring-cup-milkandbanana.glb — PASS

- Path: `public/models/sourced/math-wave2/measuring-cup-milkandbanana.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/measuring-cup-milkandbanana/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png`
- Likely component mapping: Math > Measurement > Volume/Capacity (measuring cup manipulative), per
  the sourcing doc's "Measurement" branch grouping.
- Learning-usefulness: Immediately recognizable translucent plastic measuring cup with a handle
  and four horizontal red graduation-line decals evenly spaced up the side — clearly communicates
  "this object has marked fill levels," the core concept for a volume/capacity lesson. The one
  limitation: the graduation lines carry no printed numbers or unit labels (no "1 cup," "250 mL,"
  etc.), so the model shows *that* graduated measurement works but not the specific scale values —
  numeric labels would need to be added via UI overlay/hotspot rather than relying on the mesh's
  own decal.
- Performance/framing: Fits the viewport cleanly at all 4 angles, no clipping, no holes, correct
  scale relative to a hand-sized kitchen object. Clean single-material PBR shading, no missing
  textures.
- Integration safety: None found. Safe to wire in as-is; recommend pairing with a numeric-label
  hotspot/overlay in the component UI since the mesh itself has no unit numerals.

---

## 2. ruler-poly-google.glb — CONDITIONAL

- Path: `public/models/sourced/math-wave2/ruler-poly-google.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/ruler-poly-google/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png`, `.../zoom-ticks.png`
- Likely component mapping: Math > Measurement > Length (ruler manipulative).
- Learning-usefulness: Correctly proportioned wooden ruler with a baked-texture tick-mark pattern
  running its full length — recognizable as a ruler at a glance, and the `top-ish`/`side` angles
  show the tick rhythm (major/minor divisions) clearly enough to read as "a ruler has evenly
  spaced marks." However, because the object is long and thin, the **default/typical framing
  angle (`front`, camera radius ~90–100% of the model's bounding sphere) renders it as a thin
  diagonal sliver occupying a small fraction of the frame** — at that scale the individual
  numerals on the tick marks are not legible, only the tick pattern is. A dedicated close-up
  attempt (`zoom-ticks.png`, tighter FOV/target) did not meaningfully improve legibility within
  this review's harness, so numeral legibility specifically (vs. mark-pattern recognition) is
  **not confirmed** from any angle tested.
- Performance/framing: No mesh defects (no holes, no inverted normals, no floating debris). Scale
  is plausible. The framing issue described above is the only concern.
- Integration safety: Whoever wires this into a component should plan a **non-default camera
  preset** (e.g., a tight top-down close-up on one end, matching the "closeup" hotspot pattern
  used elsewhere in the app) rather than the generic default-orbit framing, or numerals will be
  illegible to a learner.

---

## 3. measuring-tape-01-polyhaven.glb — CONDITIONAL

- Path: `public/models/sourced/math-wave2/measuring-tape-01-polyhaven.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/measuring-tape-01-polyhaven/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png`
- Likely component mapping: Math > Measurement > Length (measuring tape manipulative, alternate to
  the ruler).
- Learning-usefulness: High material/texture quality — black rubberized case, glossy yellow
  release button, chrome hook, visible screws — a very recognizable, photoreal tape measure at a
  glance. However, the mesh ships with the **blade almost fully retracted** in every angle
  rendered (only a short curled tab of blade extends past the case), and **that visible sliver of
  blade shows no visible cm/inch tick marks or numerals** — it renders as a plain dark strip. The
  actual graduated measuring surface, which is the entire pedagogical point of this object, is not
  demonstrated or even confirmed present in any static default pose.
- Performance/framing: No mesh defects observed (clean geometry, no holes/inverted normals). Well
  framed and centered at all 4 angles. Scale plausible for a hand tool.
- Integration safety: Before this is usable for a measurement lesson, whoever wires it in needs to
  either (a) confirm the blade mesh/texture actually has legible cm/inch markings once extended
  (not visible in any angle captured this review) and rig an "extend tape" pose/animation, or
  (b) treat this asset as the retracted-case "identify the tool" object only and pair it with the
  ruler for the actual graduated-reading interaction.

---

## 4. dice-poly-google.glb — REJECT

- Path: `public/models/sourced/math-wave2/dice-poly-google.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/dice-poly-google/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png` (all four show the same defect;
  additional diagnostic captures at camera radii from 150% to 1000% and all 8 compass azimuths at
  90° elevation were taken during triage and show the identical defect at every angle — not saved
  under the review-screenshots path since they were disambiguation captures, but the four
  angle-shots above already fully demonstrate the reproducible defect).
- Likely component mapping: Math > Data & Probability > Probability (dice manipulative), per the
  sourcing doc.
- Learning-usefulness: **Cannot currently teach the intended probability concept.** From every
  camera angle tested — including extreme radii (up to 1000% of the model's default framing
  distance, ruling out a simple "camera parked too close" explanation — see `front.png`: the
  camera sits at a normal 90% default-framing distance and still shows the same defect) — the
  viewer sees the **inside-out interior of the die**: a concave hollow-box view with pips visible
  on the far interior walls, rather than the convex exterior a real die presents. A learner would
  never see a normal die face; they would see through the die into its hollow inside. This is a
  genuine mesh/normals defect (comparable in kind, though not in cause, to the protractor defect
  the sourcing doc already caught and rejected — this one wasn't caught pre-download because
  thumbnail review can't detect an inverted-normal defect the way it can catch a corrupted
  UV/texture).
- Performance/framing: Scale (~100 units bounding box) and material (white body, red pip decals)
  are otherwise fine — the pips themselves are crisp and well-shaded, which is why the sourcing
  doc's thumbnail-based selection missed this; the defect only appears once you can see the whole
  cube in a 3D viewer rather than a single static thumbnail.
- Integration safety: **Do not wire this into any component as-is.** It needs either a normals-flip
  repair on the source mesh (outside this read-only review's scope) or a different candidate
  re-sourced. Flagging as a new, previously-unknown gap for the probability/dice manipulative —
  the sourcing doc's "Accept — downloaded" verdict for this file should be treated as superseded by
  this render-review finding.

---

## 5. coin-poly-google.glb — CONDITIONAL

- Path: `public/models/sourced/math-wave2/coin-poly-google.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/coin-poly-google/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png`
- Likely component mapping: Math > Data & Probability > Probability (coin-flip manipulative).
- Learning-usefulness: Clean gold disc, no mesh defects. The embossed "$" symbol is legible and
  reads clearly from a top-down-ish angle (`top-ish.png`), confirming a real, identifiable coin
  face. Two real limitations for the probability use case specifically: (1) the **default
  near-edge-on `front` framing barely shows the face at all** — the emboss is nearly invisible
  from that angle, so a default camera preset would need adjusting; (2) as already flagged in the
  sourcing doc, **both visible faces carry the identical "$" texture** (`side.png` confirms this —
  the same dollar sign appears on what should be the coin's second face). For a coin-flip
  probability lesson (heads vs. tails as two distinguishable outcomes), this is a real gap: the
  model cannot visually distinguish a "heads" result from a "tails" result.
- Performance/framing: No holes, no inverted normals, no floating debris. Scale plausible for a
  coin. Framing issue is angle-dependent only (see above), not a defect.
- Integration safety: Safe to wire in geometrically, but (a) needs a custom default camera preset
  angled toward the face (not the current near-edge default), and (b) if the component needs to
  visually represent a coin-flip outcome, this single-texture asset can't do it alone — would need
  either a second differently-textured coin variant or a UI-level (non-mesh) way to communicate
  the flip result.

---

## 6. kitchen-scale-poly-google.glb — CONDITIONAL

- Path: `public/models/sourced/math-wave2/kitchen-scale-poly-google.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/kitchen-scale-poly-google/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png`
- Likely component mapping: Math > Measurement > Weight/Mass (kitchen/digital scale manipulative;
  sourcing doc explicitly notes this stands in for the "scale" measurement-tool concept, not a
  two-pan balance).
- Learning-usefulness: Clearly recognizable digital kitchen scale silhouette — round weighing
  platform, low base unit, side control nub with a small display window. However, the **LCD
  readout renders as a flat, blank grey rectangle with no digits or numerals** in every angle
  captured, including the `closeup-front.png` shot aimed directly at it. Per this review's
  explicit bar ("scale readout visible"), this is not met — a learner looking at this model would
  see a scale with an unreadable/empty display, not a scale showing a weight value.
- Performance/framing: No mesh defects (no holes, no inverted normals). Well framed, plausible
  human-kitchen scale. Material (matte white plastic body, dark grey display panel) is fine.
- Integration safety: If this component's interaction plan calls for the scale to show a live/
  changing weight number, the current mesh's flat display panel has no digit texture or geometry
  to drive — that readout would need to be implemented as a DOM/canvas overlay positioned over the
  display area rather than expecting the GLB itself to show numerals.

---

## 7. abacus-soroban-bruno-oliveira.glb — PASS

- Path: `public/models/sourced/math-wave2/abacus-soroban-bruno-oliveira.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/math/abacus-soroban-bruno-oliveira/front.png`,
  `.../side.png`, `.../top-ish.png`, `.../closeup-front.png`
- Likely component mapping: Math > Number & Arithmetic > Place Value (abacus/soroban manipulative),
  per the sourcing doc's note that this resolves the wave 1 abacus gap.
- Learning-usefulness: The `top-ish.png` angle in particular shows this very clearly: a real
  Japanese soroban in its wooden hinged travel case (black felt-lined lid open on one side, the
  bead board on the other), with visible vertical rods, a row of single "heaven" beads above the
  reckoning bar and a cluster of "earth" beads below on each rod. This is immediately identifiable
  as an abacus and correctly communicates the rods-and-beads structure that a place-value/counting
  lesson needs. Beads are uniformly white/cream (no per-rod or per-position color-coding), so the
  static mesh alone doesn't visually distinguish bead values — that would need to come from an
  interactive layer (moving/highlighting individual beads), not the base asset.
- Performance/framing: No holes, no inverted normals, no floating debris observed. Scale plausible
  (fits a desk/lap-sized real soroban). The `front`/`side` angles (near-flat grazing angles) render
  the rods/case mostly as a thin diagonal strip similar to the ruler's framing issue — `top-ish` is
  by far the most legible angle and should inform whatever default camera preset this component
  ships with.
- Integration safety: None found structurally. Recommend defaulting the in-app camera closer to
  the `top-ish` orbit used here rather than a more side-on default, since that is the only angle
  in this review where the rod/bead structure reads clearly.

---

## Summary

| Model | Verdict | Primary issue |
| --- | --- | --- |
| measuring-cup-milkandbanana.glb | PASS | none (numeric labels would need UI overlay) |
| ruler-poly-google.glb | CONDITIONAL | numeral legibility unconfirmed at any framing tested; needs custom close-up camera preset |
| measuring-tape-01-polyhaven.glb | CONDITIONAL | blade retracted in every angle; no visible graduations on the exposed tab |
| dice-poly-google.glb | **REJECT** | reproducible inside-out/inverted-normals defect at every angle and radius tested — not caught by pre-download thumbnail review |
| coin-poly-google.glb | CONDITIONAL | default framing near-edge-on; both faces share identical "$" texture, can't represent heads/tails |
| kitchen-scale-poly-google.glb | CONDITIONAL | LCD readout is a blank grey rectangle, no digits |
| abacus-soroban-bruno-oliveira.glb | PASS | none (default camera should favor the top-ish orbit) |

Net: 2 clean PASS, 4 CONDITIONAL (all fixable at the integration/camera-preset/UI-overlay level,
not mesh-level), 1 REJECT (dice — genuine geometry defect, needs re-sourcing or a normals repair
outside this review's read-only scope). This supersedes the "render-review-pending" status noted
in each `.license.json` sidecar as of this review's date; sidecars themselves were not modified
(read-only review).
