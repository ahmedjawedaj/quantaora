# Crystal Lattice Material Fix — Wave 7 (chemistry-gaps-wave2 CONDITIONAL follow-up)

> **Wave 9 update (contrast fix, diamond only):** see
> [Wave 9 addendum](#wave-9-addendum--diamond-contrast-fix) at the bottom of this doc. Status
> remains **visual-review-pending** / not integrated — this addendum only records a material
> property change, not a sign-off.

Scope: the 3 CONDITIONAL crystal-lattice GLBs flagged in
`docs/assets/reviews/chemistry-gaps-wave2-visual.md` (Wave 6 visual review), all CONDITIONAL for
the identical reason — every source file is a single untextured mesh
(`materialCount: 0`, converted from a 3D-print STL/OpenSCAD source via `trimesh`), so it renders
flat white/grey in `<model-viewer>` and cannot be told apart from its siblings by color:

- `crystal-diamond-carbon-nih.glb`
- `crystal-silicon-carbide-2h-nih.glb`
- `crystal-graphite-sheet-nih.glb`

The sibling `crystal-alpha-quartz-nih.glb` (REJECT verdict, disconnected/unassembled geometry) is
out of scope for this pass and was not touched.

This pass produces **non-integrated derivative files only**. No source GLB, `.license.json`
sidecar, `modelRegistry.ts`, `docs/ASSET-LICENSES.md`, or route/lab file was modified. Nothing was
wired into the app. Status of all 3 derivatives below is **visual-review-pending** — this is a
structural material fix plus programmatic validation, not a human/agent visual sign-off.

**Naming convention:** each derivative sits alongside its source as
`<original-name>-material-fixed.glb`. Sources were never modified; verified below by re-checking
size/sha256 after the script ran (all 3 sources byte-identical to their pre-work state).

**Tooling:** a small new Node script,
[`scripts/assets/fix-crystal-materials.mjs`](../../../quantaora-app/scripts/assets/fix-crystal-materials.mjs)
(no new dependency — `@gltf-transform/core` is not installed in this repo, and `three`'s
`GLTFLoader`/`GLTFExporter` are documented elsewhere in this codebase, in
`scripts/asset-quality/lib/glb.mjs`, as unsuitable for plain Node because they expect a DOM/fetch
environment). The script follows this repo's own established pattern for headless Node GLB work
(same manual GLB-container parsing approach as this folder's `validate-glb.mjs` and
`scripts/asset-quality/lib/glb.mjs`): it parses the GLB JSON chunk directly, adds one glTF-core PBR
material per file, points the existing mesh primitive at it, and re-serializes only the JSON chunk.
The BIN chunk (all accessors/bufferViews/vertex+index bytes) is copied byte-for-byte from source to
derivative — geometry is never touched.

## What was wrong (Wave 6 review, re-verified)

All three sources have exactly one mesh with exactly one primitive and zero materials:

| Asset | Mesh/primitives | Vertices | Indices | Attributes |
| --- | --- | --- | --- | --- |
| `crystal-diamond-carbon-nih.glb` | 1 mesh / 1 primitive | 19,402 | 116,436 | POSITION only |
| `crystal-silicon-carbide-2h-nih.glb` | 1 mesh / 1 primitive | 7,125 | 42,738 | POSITION only |
| `crystal-graphite-sheet-nih.glb` | 1 mesh / 1 primitive | 6,480 | 39,012 | POSITION, NORMAL |

Because each file is a single indexed mesh with no per-vertex color/material-index data, there is
no way to distinguish e.g. Si atoms from C atoms within the silicon-carbide mesh without splitting
geometry — which is explicitly out of scope (topology must be preserved exactly). Each fix below is
therefore a single uniform material applied to the whole mesh, chosen to read as visually distinct
from the other two crystal types.

## Material fix applied

1. **`crystal-diamond-carbon-nih.glb` → `crystal-diamond-carbon-nih-material-fixed.glb`**
   Material `diamond-carbon-clear`: pale blue-white `baseColorFactor` `[0.86, 0.92, 0.96, 0.42]`,
   `alphaMode: "BLEND"`, `roughnessFactor: 0.04`, `metallicFactor: 0.05`, `doubleSided: true`. Uses
   only core glTF 2.0 PBR (alpha-blended low-roughness base color) rather than the
   `KHR_materials_transmission`/`KHR_materials_ior` extensions, to stay compatible with any glTF 2.0
   viewer without extra extension support. The source mesh has no NORMAL attribute, so shading
   falls back to flat per-triangle facets — incidentally reinforcing the "faceted crystalline
   carbon" read for diamond rather than needing a separate fix.

2. **`crystal-silicon-carbide-2h-nih.glb` → `crystal-silicon-carbide-2h-nih-material-fixed.glb`**
   Material `silicon-carbide-2h`: blue-grey semiconductor-family `baseColorFactor`
   `[0.42, 0.5, 0.58, 1.0]`, `metallicFactor: 0.35`, `roughnessFactor: 0.4`, opaque. This is the
   "at minimum, a material treatment visually distinguishable from both diamond and graphite"
   fallback — per-atom-type (Si vs C) coloring was not possible given the single-primitive,
   no-vertex-color source geometry (see above). Content-accuracy note preserved: this is SiC (a
   compound), not elemental silicon — unchanged from the existing `.license.json` sidecar's
   `componentMapping` note, which this pass did not touch.

3. **`crystal-graphite-sheet-nih.glb` → `crystal-graphite-sheet-nih-material-fixed.glb`**
   Material `graphite-sheet-dark`: near-black `baseColorFactor` `[0.09, 0.09, 0.1, 1.0]`,
   `metallicFactor: 0.55`, `roughnessFactor: 0.32`, opaque, double-sided (relevant for a thin flat
   sheet viewed edge-on). Dark with a subtle metallic sheen, consistent with real graphite's
   lustre. Content-accuracy note preserved: this is a single graphene sheet, not stacked
   multi-layer graphite (per the Wave 6 review and the existing `.license.json` sidecar); the
   sidecar's CC-BY attribution requirement is unchanged and still applies to this derivative — this
   pass only edited materials/colors in the JSON chunk, not license metadata, which lives in the
   untouched `.license.json` file, not embedded in the GLB itself (confirmed: neither source GLB
   has an `asset.copyright` field or other embedded license data).

## Structural validation

Ran both the new script's built-in validation and this folder's existing `validate-glb.mjs` against
every source/derivative pair after generation.

| Asset | magicOk | glbVersion | declaredLength==fileSize | meshCount / accessorCount unchanged | vertex/index counts unchanged | BIN chunk sha256 identical | materialCount before → after |
| --- | --- | --- | --- | --- | --- | --- | --- |
| diamond | true | 2 | true | 1 / 2 → 1 / 2 | 19,402 / 116,436 → unchanged | match | 0 → 1 |
| silicon carbide | true | 2 | true | 1 / 2 → 1 / 2 | 7,125 / 42,738 → unchanged | match | 0 → 1 |
| graphite | true | 2 | true | 1 / 3 → 1 / 3 | 6,480 / 39,012 → unchanged | match | 0 → 1 |

File sizes grew only by the small JSON-chunk material addition (~380–410 bytes each): diamond
699,424 B → 699,808 B; silicon carbide 257,424 B → 257,836 B; graphite 312,712 B → 313,124 B.

Source files re-verified byte-identical after the script ran (same size, same sha256 as pre-work):

- `crystal-diamond-carbon-nih.glb`: `b460a83c…4e` (unchanged)
- `crystal-silicon-carbide-2h-nih.glb`: `ea1c3ff2…03b` (unchanged)
- `crystal-graphite-sheet-nih.glb`: `b54473c8…0db` (unchanged)

`.license.json` sidecars for all three (and the untouched `crystal-alpha-quartz-nih.glb` +
sidecar) were not modified — confirmed via directory listing (mtimes unchanged from before this
task ran).

No textures/images exist in any of these files (`textureCount: 0`, `imageCount: 0` before and
after in all three) so there was nothing to verify there beyond the counts staying at zero.

## Status: visual-review-pending

This pass confirms the derivatives are structurally sound (parse correctly, geometry byte-identical
to source, materials present and referenced) and that the chosen colors/PBR factors are
scientifically reasoned (clear/translucent for diamond, blue-grey semiconductor tone for SiC, dark
metallic-sheen carbon for graphite). **It does not confirm how these render** — no screenshots or
`<model-viewer>` renders were taken in this pass. A human or the visual-reviewer agent should render
all three derivatives (same 4-angle method as the Wave 6 review) before any integration decision is
made. Known open questions for that follow-up review:

- Whether the diamond's `alphaMode: "BLEND"` translucency reads as "clear gem" or as "washed out"
  under the reviewer's lighting/background setup, given the mesh has no NORMAL attribute (flat
  faceted shading).
- Whether the SiC blue-grey tone is distinct enough from the graphite near-black at default camera
  distance, or needs more contrast.
- Whether graphite's metallic sheen is visible/appropriate at the sheet's thin edge-on angle
  (`side90`-equivalent in the Wave 6 camera set).

No route, `modelRegistry.ts`, or `ChemistryLab.tsx` changes were made — these three derivatives are
not wired into the app.

## Wave 9 addendum — diamond contrast fix

Wave 8 QA (`docs/reviews/wave8-crystals-branchlab.md`) rendered all three Wave 7 derivatives and
found the diamond derivative specifically reads as **washed-out / near-invisible** at several
camera angles (particularly `back180` and `side90`) against the app's off-white review background
— risking being mistaken for a broken/empty render. This confirms the "known open question" flagged
above ("Whether the diamond's `alphaMode: BLEND` translucency reads as clear gem or washed out").
Silicon carbide and graphite were **not** flagged by Wave 8 (their opaque, higher-alpha materials
already had good contrast) and were **not modified** in this pass — only the diamond `JOBS` entry in
`scripts/assets/fix-crystal-materials.mjs` changed.

**Root cause:** alpha 0.42 combined with a near-white `baseColorFactor` ([0.86, 0.92, 0.96]) let too
much of the off-white page show through — the gem's own color and the background color+alpha were
too close together to read as a distinct object at some angles.

**Fix applied** (diamond `material.pbrMetallicRoughness`, `crystal-diamond-carbon-nih.glb` →
`crystal-diamond-carbon-nih-material-fixed.glb` only):

| Property | Before (Wave 7) | After (Wave 9) |
| --- | --- | --- |
| `baseColorFactor` | `[0.86, 0.92, 0.96, 0.42]` | `[0.58, 0.74, 0.86, 0.62]` |
| `metallicFactor` | `0.05` | `0.08` |
| `roughnessFactor` | `0.04` | `0.1` |
| `alphaMode` | `BLEND` (unchanged) | `BLEND` (unchanged) |
| `doubleSided` | `true` (unchanged) | `true` (unchanged) |

Rationale: raised alpha (more of the material's own color shows through instead of the page behind
it) and deepened/saturated the blue tint (less near-white) for contrast against the off-white
background, plus a small roughness/metalness bump for a touch more surface definition — without
going anywhere near the opaque siblings' full alpha 1.0, so diamond still reads as a translucent
"clear gem," not a flat opaque mineral. No mesh/geometry changes (topology-preservation checks
below are unaffected) and no `.license.json` sidecar or attribution changes.

**Re-run and regeneration:** `node scripts/assets/fix-crystal-materials.mjs` was re-run from
`quantaora-app/`. Output (all three jobs, since the script always regenerates all three
derivatives): `geometryPreserved: true`, `binChunkSha256Match: true`, `declaredLengthMatchesFile:
true` for all three — same structural validation this script always performs. Diamond derivative
grew from 699,808 B to 700,108 B (new `outSha256` `42aa22d8…33c6`) — the source GLB
(`crystal-diamond-carbon-nih.glb`) is unchanged (`srcSha256` still `b460a83c…4e`, byte-identical to
before). Silicon carbide and graphite derivatives regenerated byte-identical to their prior Wave 7
output (257,836 B / 313,124 B, same as recorded above) — confirming this pass touched diamond's
material only.

**Status: still visual-review-pending, still not integrated.** This addresses the Wave 8
"washed-out at back180/side90" finding at the material-property level; it does not itself constitute
a visual sign-off. No `modelRegistry.ts` or `ChemistryLab.tsx` change was made — the derivative
remains a non-integrated asset, same as the rest of this doc. A follow-up visual review (4-angle
render, same method as Wave 6/8) should confirm the new contrast reads correctly before any
integration decision.
