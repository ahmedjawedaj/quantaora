# Space Asset Optimization — Wave 2 (texture-budget pass)

Scope: audit every GLB under `quantaora-app/public/models/sourced/space/` for embedded texture
resolution and file size against the project's texture budget (**longest edge ≤ 2048px**), and
produce optimized derivatives for any file that exceeds it. Optimization-only — no route,
`modelRegistry.ts`, or `docs/ASSET-LICENSES.md` integration was touched, and no source `.glb` was
modified, overwritten, or deleted. Date: 2026-08-18.

Ownership boundary for this run: `quantaora-app/public/models/sourced/space/**` (new
`-optimized.glb` / `-optimized.license.json` files only) and this document. Nothing else was
written to. No route/component code under `quantaora-app/src/**` was touched.

**Naming convention** (matches the existing pattern in
`quantaora-app/public/models/sourced/biology-life/ecology/*-optimized.glb` and the Wave-1
`mercury-optimized.glb` seam-fix derivative already in this same directory): each derivative sits
alongside its source as `<original-name>-optimized.glb`, with a matching
`<original-name>-optimized.license.json` sidecar that inherits the exact same
`sourceUrl`/`creator`/`license`/`attributionRequired`/`attributionText`/`redistributionStatus`
facts as the original — optimization never changes license provenance.

**Tooling:** `@gltf-transform/cli` / `@gltf-transform/core` v4.4.2, installed into a scratch
directory outside the repo (`/tmp/gltf-scratch/`, not committed) — no new dependency was added to
`quantaora-app/package.json`. Texture downscale used `gltf-transform resize --width 2048 --height
2048` (Lanczos3 filtering). This command treats `--width`/`--height` as **maximum** dimensions per
texture, preserves the original aspect ratio, and never upscales — a pure texture operation with
no geometry/mesh/UV change. Verified via a small Node script against `@gltf-transform/core`
directly (vertex/triangle counts, sha256, texture dimensions before/after for every candidate).

**IMPORTANT — visual-review-pending:** every derivative produced in this wave is unreviewed for
visual quality. This agent is optimization-only and is **not authorized to self-approve** whether
the downscaled textures still read correctly at expected in-app hotspot-zoom distance. All 6
derivatives below must be treated as `visual-review-pending` until a human or the dedicated visual
reviewer signs off, exactly per the same gate already used for `mercury-optimized.glb` in
`docs/assets/reviews/conditional-optimization.md`.

## Summary

- **17 GLBs inspected** (`bennu`, `callisto`, `chandra-xray-observatory`, `deimos`, `enceladus`,
  `europa`, `ganymede`, `hubble-telescope`, `io`, `jwst-telescope`, `mercury`, `moon-earth`,
  `perseverance-rover`, `phobos`, `titan`, `triton`, `vesta`). The pre-existing
  `mercury-optimized.glb` (a Wave-3 texture-seam-fix derivative, unrelated purpose) was left as-is
  and not re-processed.
- **6 needed texture optimization** (embedded baseColorTexture exceeded 2048px on the longest
  edge): `enceladus`, `europa`, `io`, `moon-earth`, `titan`, `triton`. All 6 were successfully
  downscaled to ≤2048px, aspect ratio preserved, geometry untouched.
- **11 were already within budget** (longest texture edge ≤ 2048px, or no textures at all) —
  deliberately skipped, no derivative produced: `bennu` (1024x1024), `callisto` (2048x1024),
  `chandra-xray-observatory` (max 1024x1024), `deimos` (1024x1024), `ganymede` (2048x1024),
  `hubble-telescope` (max 512x1024), `jwst-telescope` (no embedded textures — untextured
  gold-hexagon-segment material), `mercury` (2048x1536 — already at the 2048 ceiling, and it
  already has an unrelated Wave-3 `mercury-optimized.glb` for a texture-seam fix, not a size
  issue), `perseverance-rover` (max 1024x1024, 23-material CAD kit), `phobos` (2048x2048 — exactly
  at, not over, the budget), `vesta` (both baseColor and normal maps 2048x1024).

## Optimized: before → after

| File | Texture (before) | Texture (after) | File size (before → after) | Reduction | Geometry |
| --- | --- | --- | --- | --- | --- |
| `enceladus.glb` | 4096×2048 | 2048×1024 | 17,925,448 B (17.09 MB) → 5,508,312 B (5.25 MB) | 3.25x | unchanged (10,604 verts / 20,508 tris) |
| `europa.glb` | 4096×2048 | 2048×1024 | 12,287,068 B (11.72 MB) → 4,227,856 B (4.03 MB) | 2.91x | unchanged (10,604 verts / 20,508 tris) |
| `io.glb` | 4096×2048 | 2048×1024 | 17,479,700 B (16.67 MB) → 6,001,304 B (5.72 MB) | 2.91x | unchanged (10,604 verts / 20,508 tris) |
| `moon-earth.glb` | 4096×4096 | 2048×2048 | 13,799,876 B (13.16 MB) → 5,675,152 B (5.41 MB) | 2.43x | unchanged (46,464 verts / 23,232 tris) |
| `titan.glb` | 4096×2048 | 2048×1024 | 686,348 B (0.65 MB) → 577,096 B (0.55 MB) | 1.19x | unchanged (10,604 verts / 20,508 tris) |
| `triton.glb` | 4096×2048 | 2048×1024 | 6,865,548 B (6.55 MB) → 2,934,096 B (2.80 MB) | 2.34x | unchanged (10,606 verts / 20,508 tris) |

`titan.glb`'s texture was already heavily JPEG-compressed at source (222.6 KB embedded PNG despite
4096×2048 dimensions), so the *file-size* win from downscaling it is modest — but the *GPU/VRAM*
footprint at 4096×2048 was still ~44.7 MB decoded (per `gltf-transform inspect`'s `gpuSize` column)
regardless of how well the compressed bytes happened to shrink, which is the actual reason it was
over budget and worth fixing for a kids' app expected to run on mid-range tablets.

### sha256 (originals — confirmed unmodified after this pass)

| File | sha256 |
| --- | --- |
| `enceladus.glb` | `7548234bae15047d6c1af6bec4f348748b1acae7d4e7bfbe50e5bb3dda75506f` |
| `europa.glb` | `fe88cbe326574a658c9d3b0885d1a38deea3ebfb354772eb3b95fe0f3f3d542c` |
| `io.glb` | `118a6bf7eda476ea6b454039f621778189141a82acb3ad0aaa762f1771c5a723` |
| `moon-earth.glb` | `12d3b0bb7fe214903f51447d1bc61710f442e92a11c703fcaca6d4e7ff8e67d4` |
| `titan.glb` | `9e92e30902a26130895bf2558172d7f36186eb4a51368a60bc3ec1d01134fde4` |
| `triton.glb` | `a25df7ee7fe8679e3da8cca7f1a09ec7241ad5e0c7ad97a39f057b8c1a0043ce` |

### sha256 (new `-optimized.glb` derivatives)

| File | sha256 |
| --- | --- |
| `enceladus-optimized.glb` | `b8f876079f9b3e42102d6c8e4ef7564ce4c6795847cfbaf7b22aa508bb4de99d` |
| `europa-optimized.glb` | `c44a48819c8e95aafb6b596c12fd34eb5980613dd5faadd85160365fa04ec80a` |
| `io-optimized.glb` | `a8173d7f9851742ab85236c0f6012ddde03380881e5291d18e510146773369cc` |
| `moon-earth-optimized.glb` | `16fa32ef2471064ae9a96e88f1d19b8bb1d8ab13da1b23789ba2cbfbd5f5d804` |
| `titan-optimized.glb` | `ccdf5083f19b7039c8ba7191b434b3f66f4a547d620a35b311a2ab56f228807c` |
| `triton-optimized.glb` | `62477c090a93a16d2b89ae03fc690281535a9cdcb5ada87fa4ca8d0f473de37b` |

Every derivative's sha256 above was independently re-verified against its
`-optimized.license.json` sidecar's `sha256` field (`shasum -a 256`), and every original's sha256
was re-checked after the pass to confirm the source files are byte-for-byte unchanged.

**Vertex/triangle counts are identical before and after for all 6 files** (confirmed via a
`@gltf-transform/core` script reading `POSITION` accessor counts and indices directly, not just
trusting the CLI log) — this was a pure texture-resample operation, no mesh/UV/node/scene-graph
change, no draco/meshopt compression, no material reassignment.

## Deliberately skipped (already within the 2048px budget) — reasoning per file

- **`bennu.glb`** (1024×1024 grayscale relief texture, 0.82 MB): well under budget. No content
  loss risk either way — this is a small, correctly-sized asteroid asset.
- **`callisto.glb`** (2048×1024, 4.25 MB file): longest edge exactly at 2048, not over. Left as-is
  — this is a moon meant for close hotspot inspection (icy, heavily cratered surface); no reason to
  push it below the accepted planetary/moon ceiling already used elsewhere in this same directory
  (e.g. `mercury.glb` ships at 2048×1536 un-flagged).
- **`chandra-xray-observatory.glb`** (multiple small textures, max 1024×1024, largest 796.7 KB):
  well under budget.
- **`deimos.glb`** (1024×1024, 0.87 MB texture): well under budget.
- **`ganymede.glb`** (2048×1024, 3.61 MB texture): at the accepted ceiling, same reasoning as
  Callisto.
- **`hubble-telescope.glb`** (8 small textures, max 512×1024): well under budget.
- **`jwst-telescope.glb`**: no embedded textures at all (`gltf-transform inspect` reports "No
  textures found") — the gold hexagonal mirror segments and other surfaces are untextured PBR
  materials (metallic/roughness factors + vertex color), so there is nothing to downscale. This is
  also the explicit "flagship JWST hotspot-zoom asset" per the wave-1 sourcing doc's CAD-accuracy
  praise (`docs/assets/space.md` §5) — no texture-budget action needed or possible here.
- **`mercury.glb`** (2048×1536, 2.96 MB texture): at the accepted ceiling. Note: this directory
  already contains an unrelated `mercury-optimized.glb` from a prior wave (Wave 3, per
  `docs/assets/reviews/conditional-optimization.md` #4) that fixes a texture-seam visual defect via
  a targeted blur, not a resolution change — that file was left untouched and this wave did not
  attempt to layer a second, differently-purposed optimization onto the same derivative name.
- **`perseverance-rover.glb`** (23 animation channels, many small textures, max 1024×1024): well
  under budget — a detailed multi-material CAD kit that is already texture-efficient.
- **`phobos.glb`** (2048×2048, 3.14 MB texture): exactly at, not over, the 2048 ceiling. Kept at
  full resolution deliberately — Phobos is one of the two highest-value "irregular body" wins
  called out in the wave-1 sourcing doc (`docs/assets/space.md` §2, "irregular potato-shaped
  bodies where a textured sphere would be actively wrong"), and it's already exactly on-budget, so
  there is no texture-budget justification to degrade it further.
- **`vesta.glb`** (baseColor + normal maps, both 2048×1024, 2.1–2.2 MB each): at the accepted
  ceiling on both texture slots. Vesta is a specimen asset whose southern Rheasilvia-basin
  impact-structure detail was called out as a PASS-worthy strength in
  `docs/assets/reviews/space-objects-visual.md` — left at full resolution to protect that detail
  rather than trimmed for a marginal size win it doesn't need.

None of the 6 optimized files were skipped or exempted — all 6 candidates over the 2048px ceiling
were successfully downscaled. No texture in this wave was judged to "genuinely need" to stay above
2048px (unlike, hypothetically, a single hero close-up asset) — all 6 are moon/Earth-Moon-system
bodies at the same relative content tier as the already-accepted 2048px-ceiling moons (Callisto,
Ganymede, Phobos), so bringing them down to the same 2048px ceiling is a consistency fix, not a
quality downgrade relative to their sibling assets.

## Files produced this wave

```
quantaora-app/public/models/sourced/space/enceladus-optimized.glb
quantaora-app/public/models/sourced/space/enceladus-optimized.license.json
quantaora-app/public/models/sourced/space/europa-optimized.glb
quantaora-app/public/models/sourced/space/europa-optimized.license.json
quantaora-app/public/models/sourced/space/io-optimized.glb
quantaora-app/public/models/sourced/space/io-optimized.license.json
quantaora-app/public/models/sourced/space/moon-earth-optimized.glb
quantaora-app/public/models/sourced/space/moon-earth-optimized.license.json
quantaora-app/public/models/sourced/space/titan-optimized.glb
quantaora-app/public/models/sourced/space/titan-optimized.license.json
quantaora-app/public/models/sourced/space/triton-optimized.glb
quantaora-app/public/models/sourced/space/triton-optimized.license.json
```

All 6 originals (`enceladus.glb`, `europa.glb`, `io.glb`, `moon-earth.glb`, `titan.glb`,
`triton.glb`) remain on disk, untouched, at their original paths and hashes.

## Next steps (not performed here, out of scope for this wave)

1. A human or the dedicated visual reviewer must render/inspect all 6 `-optimized.glb` derivatives
   at expected in-app hotspot-zoom distance and confirm surface detail (Europa's ice cracks, Io's
   volcanic terrain, Enceladus's tiger-stripe fractures, Triton's cantaloupe terrain, Titan's haze
   coloring, and the Earth/Moon `Cube_diffuse` texture) still reads acceptably at 2048px.
2. Only after that sign-off should any of these derivatives be wired into `modelRegistry.ts` or
   any route, and only then should `docs/ASSET-LICENSES.md` gain a row for the chosen (original vs.
   optimized) file per asset.
