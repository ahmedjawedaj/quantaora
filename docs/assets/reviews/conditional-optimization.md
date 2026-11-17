# Conditional Asset Optimization — Asset Recovery Wave 3 (Agent 10)

Scope: 6 CONDITIONAL-for-technical-reasons assets flagged in the Wave-2 visual acceptance reviews
(`docs/assets/reviews/biology-cell-visual.md`, `space-planets-visual.md`, `biology-life-visual.md`,
`chemistry-reactions-visual.md`). This pass produces optimized **derivatives only** — no route,
`modelRegistry.ts`, or `docs/ASSET-LICENSES.md` integration was touched, and no source file was
modified, overwritten, or deleted. Assets CONDITIONAL/REJECT for scientific, content, or
completeness reasons (bacteria, T4/influenza viruses, flower-stage-1-bud, microscope, bulb, lens,
compass, chandra, titan, and all REJECT files) were left untouched, per scope.

**Naming convention:** each derivative sits alongside its source file as
`<original-name>-optimized.glb`, with a matching `<original-name>-optimized.license.json` sidecar
that inherits the exact same source/creator/license facts as the original (only geometry/texture/
transform differs — never license/attribution facts). Originals were never modified; verified by
re-checking file size and mtime after all edits (all 7 sources unchanged from their pre-work state).

**Tooling:** `@gltf-transform/cli`/`@gltf-transform/core` v4.4.2 (meshoptimizer-backed `simplify`,
`weld` for vertex dedup) for #1-3, a small Node script using `@gltf-transform/core` for #4's texture
re-embed and #5's node-transform rescale, and a small Node script for #6's material-factor edit.
Python 3 + Pillow for #4's texture analysis/edit. All scratch tooling lives outside the repo
(`/tmp/quantaora-asset-opt/`), not committed.

## Summary table

| # | Asset | Verdict/reason (own re-check) | Derivative produced | Before → After size | Recommend fresh visual review? |
| - | --- | --- | --- | --- | --- |
| 1 | `virus-polio-capsid-nih.glb` | CONDITIONAL, size only (23.8MB, remesh_clean print mesh, "no content problems") | `virus-polio-capsid-nih-optimized.glb` | 23.84MB → 7.03MB | Yes — high confidence |
| 2 | `organelle-ribosome-80s-bychain-nih.glb` | CONDITIONAL, size (93.1MB, 6.2x budget) + separate open color/recognizability issues (not mine) | `organelle-ribosome-80s-bychain-nih-optimized.glb` | 93.13MB → 9.46MB | Yes, for size — but color/recognizability concerns remain open regardless |
| 3 | `nucleosome-dna-packaging-nih.glb` | CONDITIONAL, marginal size (~15.77MB) | `nucleosome-dna-packaging-nih-optimized.glb` | 16.54MB → 7.88MB | Yes — high confidence |
| 4 | `mercury.glb` | CONDITIONAL, pole-to-pole texture seam (cube-map export artifact) | `mercury-optimized.glb` | 3.05MB → 3.24MB (texture re-encode) | Yes — medium confidence (seam softened, not eliminated) |
| 5 | `deer.glb` + `fox.glb` | CONDITIONAL, scale/framing (jointly out of real-world proportion) | `deer-optimized.glb` + `fox-optimized.glb` | deer 207KB→203KB / fox 119KB→116KB (file size ~flat, transform-only) | Yes — high confidence |
| 6 | `chemistry-lab-bench.glb` | CONDITIONAL, glass material renders near-black (metalness:1/roughness:1 under no-IBL lighting) | `chemistry-lab-bench-optimized.glb` | 3.73MB → 3.72MB (material-factor edit only) | Yes — medium confidence (factor edit applied correctly, not render-verified) |

All 6 candidates were attempted; none were skipped. Detail per asset below.

---

## 1. `virus-polio-capsid-nih.glb` → `virus-polio-capsid-nih-optimized.glb`

- **Re-verified reason**: `biology-cell-visual.md` line 48 — CONDITIONAL purely for size (23.8MB,
  1.6x the 15MB guideline), explicitly calling the shape "the best iconic virus shape of the
  batch" with "no content problems," recommending a decimation pass and naming this file as the
  one to fix first if only one virus asset can be processed.
- **Method**: `gltf-transform weld` (no-op here, source has no duplicate vertices) then `simplify`
  (meshoptimizer, `--ratio 0.3 --error 0.005`) on the single POSITION-only mesh.
- **Structural comparison**:
  - File size: 23,839,532 B → 7,027,336 B (3.4x reduction)
  - Vertices: 652,757 → 185,656 (~28.4% retained)
  - Triangles: 1,333,783 → ~380K (proportional to vertex reduction)
  - Bounding box: unchanged — `[-179.14792, 31.63005, -186.16756]` to
    `[178.71286, 403.76212, 187.63078]`, identical before/after per `gltf-transform inspect`.
- **Judgment**: comfortably under the 15MB budget with a wide safety margin, geometry-only change,
  no attributes lost (source had none beyond POSITION). High confidence this clears the technical
  bar; recommend a fresh visual pass to confirm spike/knob surface detail still reads well at
  default camera distance after decimation.

## 2. `organelle-ribosome-80s-bychain-nih.glb` → `organelle-ribosome-80s-bychain-nih-optimized.glb`

- **Re-verified reason**: `biology-cell-visual.md` lines 43, 244-247 — CONDITIONAL for size
  ("93.1 MB — 6.2x the 15MB budget... the fix is purely a decimation/retopology problem, not a
  re-sourcing problem"), and *separately* for a saturated rainbow-chain color style mismatch and
  inherent low silhouette recognizability as an amorphous blob. Per task scope, only the size
  problem was addressed — **the color and recognizability concerns are explicitly NOT fixed by
  this derivative and remain open** for whoever owns style/content decisions.
- **Method**: `weld` first (this alone cut the file from 93.13MB to 63.22MB by deduplicating
  shared vertices — the cryo-EM export apparently had heavy vertex duplication), then `simplify`
  (`--ratio 0.15 --error 0.005`) preserving POSITION/NORMAL/COLOR_0.
- **Structural comparison**:
  - File size: 93,129,968 B → 9,463,236 B (9.8x reduction)
  - Vertices: 2,283,564 → 181,588
  - Bounding box: unchanged within float rounding — one axis differs by 0.0422 units on a ~327-unit
    span (negligible, `-163.5536` vs source `-163.59576`).
- **Judgment**: technical (size) bar cleared with a wide margin. Color/recognizability are separate,
  unresolved, non-technical issues — flagging explicitly per the task brief so the next reviewer
  doesn't assume this derivative is a full "ship-ready" fix.

## 3. `nucleosome-dna-packaging-nih.glb` → `nucleosome-dna-packaging-nih-optimized.glb`

- **Re-verified reason**: `biology-cell-visual.md` lines 41, 162-163 — CONDITIONAL, marginally over
  budget (16.5MB file / 15.77MB per the automated quality report vs the 15MB guideline), "needs at
  least a light decimation pass." (The review's other note on this file — saturated rainbow ribbon
  coloring — is a style concern, not addressed here, same rationale as #2.)
- **Method**: `weld` (16.54MB → 16.01MB) then `simplify` (`--ratio 0.5 --error 0.005`), a
  deliberately gentler ratio than #1/#2 since the source was only marginally over budget and this
  is lower priority per the task brief ("include if time allows" — included).
- **Structural comparison**:
  - File size: 16,536,576 B → 7,883,328 B (2.1x reduction)
  - All 5 meshes preserved (POSITION/NORMAL/COLOR_0 intact)
  - Bounding box: unchanged within float rounding (largest delta ~0.005 units on an ~82-unit span).
- **Judgment**: clears budget with a large margin (7.88MB vs 15MB target). High confidence.

## 4. `mercury.glb` → `mercury-optimized.glb`

- **Re-verified reason**: `space-planets-visual.md` lines 116-140 — CONDITIONAL, "a visible
  vertical seam artifact runs pole-to-pole near the left-of-center of the visible face," a
  cube-map-to-sphere export artifact, recommended fix "edge-padding/blur at the cube-map
  boundaries, or re-export with an equirectangular projection."
- **Method**: extracted the embedded `mercury_diff.jpg` baseColorTexture (2048x1536 PNG, laid out
  as a cross/cube-map unwrap) via `gltf-transform copy` to glTF+bin+PNG, then used Python/Pillow to
  locate the defect empirically: a column-average brightness scan (with a wide local-background
  baseline to reject individual-crater noise) found a genuine, measurable ~7-intensity-unit
  relative darkening centered at **texture-space x=1240**, spanning roughly y=460–950 — i.e. within
  the visible/front cube face, left-of-center, matching the review's description almost exactly.
  Applied a narrow (28px), feathered (raised-cosine falloff, so no new hard edge is introduced at
  the band boundary) Gaussian blur (radius 3px) centered on that column, then re-embedded the
  edited PNG into the glTF via `@gltf-transform/core` (`Texture.setImage`) and wrote a new `.glb`.
  Geometry, UVs, and mesh topology are untouched — verified identical bounding box/mesh stats via
  `gltf-transform inspect` before/after.
- **Structural comparison**:
  - File size: 3,048,920 B → 3,240,844 B (+6%, from PNG re-encoding of the extracted texture, not
    added resolution — texture stays 2048x1536)
  - Mesh: unchanged (2,034 vertices, 3,072 indices, same NORMAL/POSITION/TEXCOORD_0 attributes)
  - Bounding box: unchanged (`[-500, -500, -500]` to `[500, 500, 500]`)
- **Judgment — honest caveat**: the fix **softens but does not perfectly eliminate** the seam — a
  faint residual gradient remains where the hard line used to be (confirmed by side-by-side crop
  comparison of the affected band, saved at
  `/tmp/quantaora-asset-opt/work/mercury-extract/seam_strip_fixed_v2.png`, not committed). I
  intentionally used a narrow band and gentle blur radius after an initial wider/stronger attempt
  produced a visibly blurry vertical stripe that looked worse than the original hard line at that
  scale — the final parameters trade some residual softness for not creating a new, more
  conspicuous defect. Medium confidence this clears the bar at typical in-app render distance;
  recommend a fresh visual-acceptance render pass (front + three-quarter-front-left angles
  specifically, since those are where the review found the seam) to confirm, and treat "re-export
  equirectangular" as the fallback if the residual softness is still judged unacceptable.

## 5. `deer.glb` + `fox.glb` → `deer-optimized.glb` + `fox-optimized.glb` (joint pair)

- **Re-verified reason**: `biology-life-visual.md` lines 55, 70, 181 — both CONDITIONAL for scale;
  explicitly flagged as needing a **joint** rescale (not independent per-asset normalization) to
  preserve the real-world deer:fox proportion ratio (~3-4:1), since current relative scale
  (deer≈1.66x fox height per the review, 1.60x per my own bbox measurement) would otherwise
  collapse to ~1:1 under naive independent auto-scaling.
- **Method**: measured actual bounding-box heights via `gltf-transform inspect` (deer 4.274m, fox
  2.677m — close to but not identical to the review's rounder figures, likely measurement-method
  differences; used my own precise numbers for the scale math). Chose target real-world heights
  within the review's cited ranges: deer 1.5m (range 1.2-2m), fox 0.4m (range 35-40cm, upper
  bound), giving a 3.75:1 ratio — inside the review's target 3-4:1 window. Applied a single uniform
  scale to each file's root node transform only (`Node.setScale`, via `@gltf-transform/core`) —
  geometry/vertex data untouched, per the task's "transform-matrix rescaling" instruction.
- **Structural comparison**:

  | | Deer before | Deer after | Fox before | Fox after |
  | --- | --- | --- | --- | --- |
  | bbox height | 4.274 m | **1.500 m** | 2.677 m | **0.400 m** |
  | bbox min | [-0.729, -0.013, -1.642] | [-0.256, -0.005, -0.576] | [-0.531, -0.002, -3.180] | [-0.079, 0.000, -0.475] |
  | bbox max | [0.729, 4.261, 2.755] | [0.256, 1.495, 0.967] | [0.531, 2.675, 2.703] | [0.079, 0.400, 0.404] |
  | file size | 207,220 B | 202,712 B | 118,828 B | 116,488 B |
  | scale factor | — | 0.350958 | — | 0.149421 |

  deer:fox height ratio: 1.60:1 (source) → **3.75:1** (derivative pair), matching the review's
  3-4:1 real-world target.
- **Judgment**: high confidence — this directly and precisely resolves the exact numeric target the
  review specified, no geometry/topology risk since it's a pure transform edit. Recommend a fresh
  visual pass mainly to sanity-check camera auto-framing still behaves well at the new (much
  smaller, sub-2m) scale, not because the scale math itself is in doubt.

## 6. `chemistry-lab-bench.glb` → `chemistry-lab-bench-optimized.glb`

- **Re-verified reason**: `chemistry-reactions-visual.md` lines 44, 131-157 — CONDITIONAL, "nearly
  all glass vessels... render as flat near-black opaque silhouettes under the app's actual no-IBL
  stage lighting," root cause confirmed as `chemistry_set_glass` baked with
  `metalness: 1, roughness: 1`. Review's own scoped recommendation: "remap the glass nodes'
  metalness factor down (e.g. toward 0) and rely on the diffuse/normal map plus a modest roughness."
  My tooling (`@gltf-transform/core`) can safely read/write glTF material scalar factors in place,
  so this was attempted (not skipped).
- **Method**: small Node script read the `.glb`, located the `chemistry_set_glass` material (37
  node instances: beakers, bottles, graduated cylinder — confirmed via `gltf-transform inspect`
  material table), set `metallicFactor: 1 → 0.05` and `roughnessFactor: 1 → 0.35`, left the
  `chemistry_set` material (non-glass props, already rendering correctly per the review) untouched,
  and wrote the result. Verified by reading the factors back out of the written file (not just
  trusting the write call) — confirmed persisted as `0.05`/`0.35`.
- **Structural comparison**:
  - File size: 3,726,556 B → 3,721,252 B (~0.1% smaller, from JSON re-serialization only — no
    geometry or texture pixels changed, all 50 nodes/meshes and 6 textures unchanged)
  - `chemistry_set_glass`: metallic 1→0.05, roughness 1→0.35 (baked ORM texture pixels unchanged;
    per the glTF PBR spec, final per-pixel metalness/roughness = factor × texture value, so this
    scales down every glass node's effective metalness regardless of its baked per-pixel value)
  - `chemistry_set`: unchanged (metallic 1, roughness 1 — correct as-is per the review)
- **Judgment — honest caveat**: the factor edit is correctly applied and mechanically sound, but I
  did **not** render/screenshot the result to visually confirm the glass now reads as translucent
  rather than black (no headless WebGL renderer was available in this environment within budget).
  Medium confidence — recommend this be the first thing the fresh visual-acceptance reviewer
  checks, since it's the one derivative in this batch not visually spot-checked at all.

---

## Cross-cutting notes for the next reviewer

- **Recommended priority order for a fresh visual-acceptance pass** (highest to lowest confidence
  that the technical bar is now cleared): #5 (deer/fox, exact numeric target hit) ≈ #1 (polio,
  wide size margin, no other changes) ≈ #3 (nucleosome, wide size margin) > #2 (ribosome, size
  fixed but color/recognizability still open — re-review should explicitly re-confirm those remain
  separate follow-ups, not blockers to accepting the size fix) > #6 (lab bench, mechanically correct
  but never rendered) ≈ #4 (mercury, seam softened but visibly not eliminated in a side-by-side
  crop — worth an explicit judgment call on whether "softened" clears the bar or a full
  equirectangular re-export is still needed).
- **Nothing in this pass was integrated** into any route, `modelRegistry.ts`, or
  `docs/ASSET-LICENSES.md` — that remains explicitly out of scope for this wave per the task brief.
- All `-optimized.glb` derivatives have a matching `-optimized.license.json` sidecar inheriting the
  exact same source/creator/license/attribution facts as their original (never altered), with a
  `processingNote` documenting exactly what technical transform was applied and why.
