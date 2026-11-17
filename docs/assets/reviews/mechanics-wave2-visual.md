# Mechanics Wave 2 — Visual Acceptance Review

Reviewer: Wave 6 read-only visual QA agent
Date: 2026-08-18
Method: Rendered each GLB with Google `<model-viewer>` (neutral off-white background, `camera-orbit`
varied per shot, `field-of-view: 30deg`) via a local Playwright/Chromium harness against
`public/` served over HTTP (scratch tooling only, nothing added to the repo). 4 angles captured
per model (front / side / three-quarter / back-high); the alarm clock also got 3 additional
relight passes (different exposure/environment/zoom) to rule out a lighting artifact. All
screenshots are under `review-screenshots/asset-acceptance-2026-08-18-wave6/mechanics/`.

No product source was read beyond the two files the brief explicitly allowed
(`docs/assets/physics-mechanics-wave2.md` was not present at the expected path — the sibling
`.license.json` sidecars next to each GLB were read instead, since they contain the same
sourcing/component-mapping metadata `docs/assets/physics-mechanics-wave2.md` would have).

---

## gear-small-kenney.glb

- **Verdict:** CONDITIONAL
- **Path:** `public/models/sourced/physics-mechanics-wave2/gear-small-kenney.glb`
- **Evidence:** `review-screenshots/asset-acceptance-2026-08-18-wave6/mechanics/gear-small-kenney/front.png`,
  `.../gear-small-kenney/side.png`, `.../gear-small-kenney/three-quarter.png`,
  `.../gear-small-kenney/back-high.png`
- **Likely component mapping:** Per the sidecar's own `component` field — a generic Mechanics/Energy
  "gears apparatus" prop, paired with `gear-large-kenney.glb` as a small/large meshing pair. Not
  yet tied to a specific taxonomy low-level item.
- **Quality assessment:** Clean, legible low-poly 6-tooth cog with squared trapezoidal teeth —
  reads instantly as "gear" to a child, single mesh/single material, no visible mesh holes,
  inverted normals, or floating debris. Silhouette and proportions are correct for a game-style
  gear prop. However the entire model renders in Kenney's stock purple/lavender sci-fi colormap —
  this is flat, single-tone, low-detail shading (essentially a flat color, not a real material
  with grain/wear/roughness variation) and reads as an obvious placeholder/asset-pack color, not
  the app's warm off-white, non-gamey material language.
- **Performance/framing notes:** Frames well and fills the viewport at all four angles; no
  clipping against the container.
- **Integration safety note:** The sidecar itself already flags this — needs a material/color
  swap before shipping to match the app's palette. Geometry is fine as-is; only the material is a
  blocker.

## gear-large-kenney.glb

- **Verdict:** CONDITIONAL
- **Path:** `public/models/sourced/physics-mechanics-wave2/gear-large-kenney.glb`
- **Evidence:** `review-screenshots/asset-acceptance-2026-08-18-wave6/mechanics/gear-large-kenney/front.png`,
  `.../gear-large-kenney/side.png`, `.../gear-large-kenney/three-quarter.png`,
  `.../gear-large-kenney/back-high.png`
- **Likely component mapping:** Same Mechanics/Energy "gears apparatus" pairing as the small gear
  (8-tooth cog vs. the small gear's 6-tooth cog, plus a visible center hole).
- **Quality assessment:** Same verdict as `gear-small-kenney.glb` for the same reason: clean,
  legible, correctly-proportioned 8-tooth cog silhouette with a center bore hole, no mesh
  defects observed, but shipped in the same flat purple/lavender placeholder color, not the
  target warm off-white material language.
- **Performance/framing notes:** Frames well at all angles, no clipping.
- **Integration safety note:** Needs the same material/color pass as the small gear before
  shipping; geometry is otherwise integration-ready.

## baseball-polyhaven.glb

- **Verdict:** PASS
- **Path:** `public/models/sourced/physics-mechanics-wave2/baseball-polyhaven.glb`
- **Evidence:** `review-screenshots/asset-acceptance-2026-08-18-wave6/mechanics/baseball-polyhaven/front.png`,
  `.../baseball-polyhaven/side.png`, `.../baseball-polyhaven/three-quarter.png`,
  `.../baseball-polyhaven/back-high.png`
- **Likely component mapping:** Per the sidecar — generic Mechanics balls/projectiles prop for
  Momentum/Kinetic-energy/projectile-motion lessons; not tied to one specific taxonomy component.
- **Quality assessment:** High-quality PBR photoreal baseball: correct white-leather color,
  crisp red stitching with individually legible stitches, subtle dirt/scuff texture variation
  across the surface (not a flat/placeholder material), soft correct-radius spherical silhouette.
  This is clearly the strongest asset in the set and matches (arguably exceeds) the Anatomy
  Atelier/Space-asset material quality bar. No mesh holes, no missing-texture magenta/checkerboard,
  no visible seams or UV stretching.
- **Performance/framing notes:** Fills the frame cleanly at all four angles, well-centered, no
  clipping. File size (~2.98MB) is reasonable for a hero prop.
- **Integration safety note:** None observed — ready to wire in as-is. Note only that the surface
  dirt/scuff texturing reads as "used ball," which is realistic but slightly at odds with the
  otherwise pristine/idealized presentation style of the other clean assets in this wave; a minor
  aesthetic call, not a defect.

## alarm-clock-polyhaven.glb

- **Verdict:** REJECT
- **Path:** `public/models/sourced/physics-mechanics-wave2/alarm-clock-polyhaven.glb`
- **Evidence:** `review-screenshots/asset-acceptance-2026-08-18-wave6/mechanics/alarm-clock-polyhaven/front.png`,
  `.../alarm-clock-polyhaven/side.png`, `.../alarm-clock-polyhaven/three-quarter.png`,
  `.../alarm-clock-polyhaven/back-high.png`
- **Likely component mapping:** Per the sidecar — a "measuring/timing apparatus" stand-in for the
  Speed/Velocity "cart + ruled track + stopwatch" brief. The sidecar itself already flags this as
  a caveat: it is a retro twin-bell alarm clock, not a literal stopwatch, kept only as the closest
  kid-recognizable timing prop available in this sourcing pass.
- **Quality assessment:** The body, bells, wind-up hardware, and rear winding-mechanism side
  (visible in `back-high.png`, with two winding dials and a stamped-metal plate that reads like a
  simplified face) are clean, well-modeled, and child-recognizable as an old-fashioned alarm
  clock — good silhouette and mint-green/chrome material work. **However, the actual clock face
  (front dial — the one surface whose entire purpose is to display time) renders as a completely
  flat, featureless, glossy black disc with zero visible numerals, tick marks, or clock hands at
  every angle and lighting setup tested**, including a second relight pass with a brighter
  exposure, a different environment map, and closer/farther camera distances (see
  `front.png`, `side.png`, `three-quarter.png`, and the additional confirmation renders taken
  during this review, none of which are saved in the repo per the read-only screenshot-location
  rule but were used only to verify the defect is in the asset, not the harness lighting). This
  directly contradicts the sidecar's own notes field, which describes the model as having "clean
  face, Roman numerals ... rigged hands." As sourced, this asset cannot communicate time at all,
  which is disqualifying for a "timing apparatus" prop.
- **Performance/framing notes:** Frames and fills the viewport correctly at all angles; no
  clipping. Framing is not the problem.
- **Integration safety note:** Do not wire this in as a timing/stopwatch stand-in until the blank
  face is understood and resolved (missing texture reference, wrong material node, or numerals
  baked into a texture that isn't being applied) — as currently sourced it would put a
  dead-black glass disc where a legible clock face should be, which is worse than omitting a
  timing prop entirely. The reverse/mechanism side is fine and could be considered as a fallback
  "back of an old clock" prop if the front-face defect can't be fixed, but that is a much weaker
  fit for a timing-apparatus need.

## measuring-tape-polyhaven.glb

- **Verdict:** PASS
- **Path:** `public/models/sourced/physics-mechanics-wave2/measuring-tape-polyhaven.glb`
- **Evidence:** `review-screenshots/asset-acceptance-2026-08-18-wave6/mechanics/measuring-tape-polyhaven/front.png`,
  `.../measuring-tape-polyhaven/side.png`, `.../measuring-tape-polyhaven/three-quarter.png`,
  `.../measuring-tape-polyhaven/back-high.png`
- **Likely component mapping:** Per the sidecar — generic Mechanics/Energy measuring-apparatus
  prop (rulers/measuring tools) for Position/Distance/Displacement/Speed lessons.
- **Quality assessment:** Recognizable real tape-measure silhouette: dark rubberized casing,
  yellow lock button, metal belt clip, and a short length of tape pulled out through the front
  slot in the three-quarter/side shots. Material reads as real rubberized plastic (matte, subtle
  surface variation) rather than a flat placeholder color; no missing-texture magenta/checkerboard,
  no visible mesh holes. Did not inspect the diffuse texture at pixel-level magnification for the
  small "P-TECH"/"3m" decal the sidecar flags as a possible fictional-brand risk — screenshots at
  the resolution captured here don't resolve it legibly either way; flagging that the sidecar's
  own caveat about double-checking the decal under magnification is still open and wasn't
  re-verified in this pass.
- **Performance/framing notes:** The tool body renders noticeably smaller within the frame than
  the other four assets at the same relative `camera-orbit` percentage (compare `front.png` here
  to any of the gear or clock front shots) — the extended tape strap widens the model's bounding
  radius, so a camera framed to fit the whole prop (strap included) leaves the compact tool body
  itself looking small and centered in a lot of empty background. Not a clipping problem, just a
  scale-in-frame difference worth accounting for if a shared default camera framing is applied
  across all mechanics props.
- **Integration safety note:** None blocking. Only note is the unresolved decal-legibility check
  already flagged by the sidecar, and the framing/scale note above if this asset is shown
  alongside the others under one shared default camera distance.

---

## Summary

| Asset | Verdict | Primary reason |
| --- | --- | --- |
| gear-small-kenney.glb | CONDITIONAL | Clean geometry, wrong placeholder material/color |
| gear-large-kenney.glb | CONDITIONAL | Clean geometry, wrong placeholder material/color |
| baseball-polyhaven.glb | PASS | High-quality PBR, no issues found |
| alarm-clock-polyhaven.glb | REJECT | Clock face renders fully blank/black — can't show time |
| measuring-tape-polyhaven.glb | PASS | Recognizable, clean material; minor in-frame scale note |
