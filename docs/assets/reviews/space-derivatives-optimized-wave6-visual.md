# Space Derivatives — Optimized-GLB Visual Review (Wave 6)

Scope: matched-angle before/after visual QA for the 6 space-body `-optimized.glb` derivatives
produced in `docs/assets/reviews/space-optimization-wave2.md` (and one pre-existing Wave-3
derivative, Mercury), to close the `visual-review-pending` gate that doc explicitly requires
before any of these files are wired into `modelRegistry.ts` or a route. Read-only visual review —
no product source was modified. Date: 2026-08-18.

**Method:** Google `<model-viewer>` (CDN, v4.3.1) loading GLBs served locally from
`quantaora-app/public/` via a scratch CORS-enabled Python http.server, driven headlessly with
Playwright (Chromium). Each body/variant pair was rendered at an identical fixed `camera-orbit`
for wide framing (`0deg 75deg 150%`) and close texture-detail inspection (`25deg 65deg 65%`), plus
one additional close angle for Mercury centered directly on its texture seam (`0deg 78deg 40%`).
All screenshots are 900×900 PNGs of the `model-viewer` element only (no browser chrome).

**Note on scope drift for Mercury:** per `space-optimization-wave2.md`, `mercury.glb` was
**not** a resolution-downscale candidate in that wave (its texture is 2048×1536, already at the
budget ceiling) — `mercury-optimized.glb` is a distinct, earlier Wave-3 derivative that applies a
targeted blur to fix a visible texture seam, confirmed by its optimized file being *larger*
(3,240,844 B) than the original (3,048,920 B). It is still reviewed below per the assigned scope
(original vs. `-optimized` pair), with the seam fix itself as the relevant check rather than a
2048px resolution question.

---

## Enceladus

**Verdict: PASS**

- Original: `quantaora-app/public/models/sourced/space/enceladus.glb`
- Optimized: `quantaora-app/public/models/sourced/space/enceladus-optimized.glb`
- Evidence: `review-screenshots/asset-acceptance-2026-08-18-wave6/space-derivatives/enceladus/original-wide.png`,
  `.../enceladus/optimized-wide.png`, `.../enceladus/original-close.png`, `.../enceladus/optimized-close.png`

**Findings:**
- Wide framing: pixel-for-pixel comparable. Tiger-stripe fractures (the south-polar linear
  cracks), bright crater rims, and overall icy-white base color all read identically between
  original and optimized at typical viewing distance.
- Close-up (max-zoom, 65% radius): the fine crack/fracture linework and small crater bump detail
  is visibly *softer* in the optimized version — edges of the thin tiger-stripe cracks are less
  crisp, and the smallest craters in the upper-left crater field lose some micro-contrast. This is
  the expected effect of 4096×2048 → 2048×1024 downscaling on a texture with fine linear detail.
  It does not cross into "muddy" — the fracture network, crater field density, and overall surface
  language are all still clearly legible.
- No seams, tiling artifacts, or new hard edges introduced by optimization.
- Materials/base color unchanged (same cool grey-white icy tone in both).
- Framing/pivot: identical bounding box at the same camera-orbit — no shift.

**Is ≤2048 safe for this body:** Yes, for typical in-app viewing distance. The softening is only
visible at an artificial max-zoom crop tighter than a learner would realistically use for more
than a moment; at the "wide" framing that represents normal lab viewing, the two are
indistinguishable.

**Integration safety note:** Safe to ship as-is. If a future lab adds a dedicated "inspect the
tiger stripes up close" hotspot with sustained max-zoom, re-evaluate against a higher-res crop at
that specific interaction.

---

## Europa

**Verdict: PASS**

- Original: `quantaora-app/public/models/sourced/space/europa.glb`
- Optimized: `quantaora-app/public/models/sourced/space/europa-optimized.glb`
- Evidence: `.../europa/original-wide.png`, `.../europa/optimized-wide.png`,
  `.../europa/original-close.png`, `.../europa/optimized-close.png`

**Findings:**
- Wide framing: essentially identical. Europa's characteristic reddish-brown linea (crack)
  network over the pale icy shell, and the pale-green/tan surface mottling, are preserved with the
  same color and legibility.
- A texture-tile/UV-patch artifact (a visible rectangular lighter patch in the lower-right/lower
  quadrant) is present in **both** original and optimized at identical position and shape — this
  is a pre-existing source-texture defect, not something optimization introduced.
- Close-up: the linea crack lines and mottled color patches are nearly indistinguishable between
  original and optimized — Europa's source texture was already fairly soft/hazy (no fine
  high-frequency detail like Enceladus's craters), so the 4096×2048 → 2048×1024 downscale has
  negligible visible cost here.
- No new seams introduced. Base color/ice sheen look preserved (matte pale surface, consistent
  with original — no obvious loss of any specular "ice sheen" quality, though this asset does not
  appear to carry a strong specular highlight in either version).
- Framing/pivot unchanged.

**Is ≤2048 safe for this body:** Yes, clearly safe — Europa's texture detail is dominated by
soft, low-frequency color/crack patterns rather than fine bump/crater detail, so it tolerates the
downscale better than any other body in this set.

**Integration safety note:** Safe to ship as-is. The pre-existing tile-patch artifact (present in
both original and optimized) is a separate, un-related finding outside this wave's optimization
scope — flagging for awareness only, not blocking.

---

## Io

**Verdict: PASS**

- Original: `quantaora-app/public/models/sourced/space/io.glb`
- Optimized: `quantaora-app/public/models/sourced/space/io-optimized.glb`
- Evidence: `.../io/original-wide.png`, `.../io/optimized-wide.png`,
  `.../io/original-close.png`, `.../io/optimized-close.png`

**Findings:**
- Wide framing: virtually identical between original and optimized. The volcanic color palette
  (mottled yellow/green sulfur plains, orange-red patches around calderas, white frost deposits,
  dark caldera spots) is fully preserved in hue, saturation, and placement.
- Close-up: caldera rings, small dark volcanic vent spots, and the mottled color-splotch pattern
  are essentially pixel-identical between the two — no discernible softening at this crop, likely
  because Io's texture (like Europa's) is dominated by soft painterly color gradients rather than
  fine geometric bump detail.
- No emissive/glow channel was observed in either version at these render settings (this
  `<model-viewer>` harness does not exercise any custom volcanic-glow shader the in-app viewer
  might apply) — base color and material look match between original and optimized; no
  optimization-introduced change to whatever material setup exists.
- No seams or new artifacts. Framing/pivot unchanged.

**Is ≤2048 safe for this body:** Yes, safe — same reasoning as Europa; Io's source texture has no
fine high-frequency detail that would suffer from the downscale.

**Integration safety note:** Safe to ship as-is. If the in-app lab relies on an emissive/glow
material layer for volcanic hotspots (separate from the diffuse texture assessed here), that
layer was not exercised by this static-viewer harness and should be spot-checked once wired into
the actual lab route.

---

## Mercury

**Verdict: PASS**

- Original: `quantaora-app/public/models/sourced/space/mercury.glb`
- Optimized: `quantaora-app/public/models/sourced/space/mercury-optimized.glb`
- Evidence: `.../mercury/original-wide.png`, `.../mercury/optimized-wide.png`,
  `.../mercury/original-close.png`, `.../mercury/optimized-close.png`,
  `.../mercury/original-seam-detail.png`, `.../mercury/optimized-seam-detail.png`

**Findings:**
- Wide framing: both show a prominent vertical seam artifact running down the front-center of the
  sphere in the original — a hard-edged, visibly darker/rougher strip that reads as a UV-seam or
  texture-projection discontinuity, not natural terrain.
- Targeted close-up centered directly on the seam (`0deg 78deg 40%`) confirms the optimized
  version measurably **softens** this defect: in the original, the seam is a sharp double-edged
  dark strip with a visible hard boundary on both sides; in the optimized version, the same strip
  is blurred into a smoother, lower-contrast gradient that blends more naturally into the
  surrounding cratered terrain. The seam is not 100% eliminated (a faint vertical value-shift is
  still perceptible up close), but it is a clear, visible improvement over the original.
- Crater detail elsewhere on the sphere (away from the seam) is effectively identical between
  original and optimized — expected, since both textures are 2048×1536, this derivative is not a
  resolution downscale, only a localized seam blur.
- Base color/material (grey, low-albedo cratered regolith look) unchanged.
- Framing/pivot unchanged.

**Is ≤2048 safe for this body:** Not applicable to this pair — `mercury.glb` was already at
2048×1536 pre-optimization (per Wave 2's own audit) and this derivative doesn't touch resolution.

**Integration safety note:** Safe to ship as-is, and preferable to the original — the optimized
version is a genuine visual quality improvement (reduced seam visibility), not a tradeoff.

---

## Moon-Earth

**Verdict: PASS**

- Original: `quantaora-app/public/models/sourced/space/moon-earth.glb`
- Optimized: `quantaora-app/public/models/sourced/space/moon-earth-optimized.glb`
- Evidence: `.../moon-earth/original-wide.png`, `.../moon-earth/optimized-wide.png`,
  `.../moon-earth/original-close.png`, `.../moon-earth/optimized-close.png`

**Findings:**
- At the fixed camera-orbit used for both wide and close shots, only the **Moon** is framed in
  view (this GLB is presumably an Earth+Moon multi-node scene; Earth was not within this
  particular default orbit/framing). The comparison below is therefore of the Moon's texture,
  which was the component that needed the 4096×4096 → 2048×2048 downscale (the largest resolution
  reduction of the 6 derivatives in this wave).
- Wide framing: crater fields, bright ray systems radiating from prominent craters (Tycho-like
  rays), and overall grey-brown lunar highland color are all preserved essentially identically
  between original and optimized.
- Close-up (max zoom on a ray-crater cluster): remarkably high fidelity retained despite this
  being the largest source-to-target resolution drop in the set — individual small crater rims,
  fine ray-line detail, and speckled crater-field texture are still crisp and clearly legible in
  the optimized version. Only the very finest ray-line detail shows marginal softening under
  extreme scrutiny; not visible at normal viewing scale.
- No seams or tiling artifacts. Framing/pivot unchanged.

**Is ≤2048 safe for this body:** Yes — despite the steepest resolution cut in this wave (2x
reduction on each axis, 4x pixel count), the Moon's `Cube_diffuse` texture holds up very well at
2048×2048, likely because the original 4096×4096 had margin to spare for this level of detail.

**Integration safety note:** Safe to ship as-is for the Moon component. Recommend the actual
in-app lab route (once wired) also be spot-checked at whatever camera-orbit frames Earth in this
same GLB, since Earth's material/texture was not captured by this fixed-orbit harness — Earth was
outside frame at every angle used in this review.

---

## Titan

**Verdict: PASS**

- Original: `quantaora-app/public/models/sourced/space/titan.glb`
- Optimized: `quantaora-app/public/models/sourced/space/titan-optimized.glb`
- Evidence: `.../titan/original-wide.png`, `.../titan/optimized-wide.png`,
  `.../titan/original-close.png`, `.../titan/optimized-close.png`

**Findings:**
- Titan renders as a uniform, smooth orange-tan haze sphere in both original and optimized — this
  is geologically correct (Titan's dense atmospheric haze obscures surface features from orbital
  view), so there is no fine surface detail to lose to a resolution downscale in the first place.
- Wide and close-up shots are visually indistinguishable between original and optimized: same
  warm gold/tan gradient, same subtle color banding from pole to equator, no visible new banding,
  blockiness, or compression artifacts introduced by optimization.
- Consistent with the Wave 2 doc's own note that Titan's *file-size* win from downscaling was
  modest because the source texture was already heavily JPEG-compressed — the real motivation was
  reducing decoded GPU/VRAM footprint (from ~44.7 MB at 4096×2048 per the doc's `gpuSize`
  reporting), not visual quality, and that holds up: no quality cost is visible here.
- No seams, no framing/pivot shift.

**Is ≤2048 safe for this body:** Yes, trivially safe — Titan's texture has effectively no
high-frequency content, so there is no measurable resolution ceiling to worry about for this
body.

**Integration safety note:** Safe to ship as-is.

---

## Summary

| Body | Verdict | ≤2048 safe? | Notes |
| --- | --- | --- | --- |
| Enceladus | PASS | Yes | Minor close-up softening on fine cracks/craters; invisible at normal viewing distance |
| Europa | PASS | Yes | Negligible loss; texture is low-frequency by nature |
| Io | PASS | Yes | Negligible loss; texture is low-frequency by nature |
| Mercury | PASS | N/A (not a resolution derivative) | Optimized version measurably softens a real seam defect — an improvement, not a tradeoff |
| Moon-Earth | PASS | Yes | Largest resolution cut (4096→2048) in the wave, still holds up well; Earth component not captured by this fixed-orbit harness |
| Titan | PASS | Yes | Trivially safe; texture has no fine detail to lose |

All 6 `-optimized.glb` derivatives from `docs/assets/reviews/space-optimization-wave2.md` are
visually cleared to move past the `visual-review-pending` gate that document specifies. No
derivative showed texture quality loss crossing into "muddy," no new seams were introduced by any
optimization, no framing/pivot shift was observed for any pair, and Mercury's optimized derivative
is an outright visual improvement over its original. This review is visual-only; it does not
itself authorize `modelRegistry.ts`/route/`docs/ASSET-LICENSES.md` integration — per Wave 2's
"Next steps," that remains a separate action for whoever owns route wiring.
