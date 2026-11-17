# Chemistry — Reactions & Apparatus Visual Acceptance Review

Scope: the 2 apparatus assets sourced in Asset Recovery Wave 2
(`quantaora-app/public/models/sourced/chemistry-reactions/*.glb`): `bunsen-burner.glb` (standalone
hero burner + tripod ring stand) and `chemistry-lab-bench.glb` (50-node lab-bench diorama scene).
Molecular/atomic-structure assets (atoms, molecules, crystals, periodic table) are out of scope —
owned by the chemistry-structure reviewer. Anatomy models are already approved and out of scope.

Rendered headless via a custom Puppeteer + three.js harness (Chrome + SwiftShader software WebGL;
scratch scripts at `/tmp/asset-review-chemistry-reactions/`, not committed). Stage matches the
app's real `GenericViewer.tsx` recipe exactly: background `#faf8f4`, ambient `#fff4e6` @0.7, key
directional `#fff7ec` @2 at (3,4,3), fill directional `#dce8f5` @0.6 at (-3,-1,2), camera fov 36.
**Important caveat carried over from `GenericViewer.tsx` verbatim: this stage has no environment
map / image-based lighting (IBL), only the two directional lights + ambient — confirmed by reading
the component source (no `<Environment>` from drei, no envMap wiring anywhere in the file). That
absence is not a quirk of this review's test harness; it is the app's actual production lighting,
and it materially affects how these particular assets read (see §2 material fault below).**
Camera auto-framed per asset from its actual world-space bounding box (computed post node-transform
via `THREE.Box3().setFromObject()`, exact-fit distance for the fov × ~1.35 margin), independent of
native export scale.

**Animations:** both files ship `animationCount: 0` (confirmed both from the `.license.json`
sidecars and by live-inspecting `gltf.animations` after load — empty array for both). No flame
flicker channel on the burner, no liquid pour/color-change channel on the bench. Expected/fine:
flame, bubbling, and color-change are explicitly scoped as procedural runtime effects per
`docs/assets/chemistry-reactions.md` §0, not authored-mesh animation.

**Duplicate-note cross-check:** `chemistry-lab-bench.license.json`'s `duplicateNote` and
`docs/assets/chemistry-reactions.md` §6 both flag that `chemistry_set_bunsen_burner` (a node
bundled inside the lab-bench scene) and the standalone `bunsen-burner.glb` are two different
meshes of the same real-world object from the same Poly Haven donor collection, not an accidental
double-import. **That reading holds up visually.** Compare `bunsen-burner.glb`'s screenshots
(§1 below, ~8.4K-tri hero asset, crisp collar/valve/hose-barb detail visible at close range) against
`chemistry-lab-bench/06-closeup-bunsen-burner-bundled.png` (§2 below): the bundled burner is a
visibly lower-poly, lower-detail stand-in with no separate tripod-ring stand mesh and coarser
proportions — clearly scene dressing, not a competing hero asset. No duplicate-detection action
needed; documenting here as requested rather than re-flagging it as new.

## Summary table

| Asset | Verdict | One-line reason |
| --- | --- | --- |
| `bunsen-burner.glb` | PASS | Correct, recognizable burner + tripod stand; readable collar/valve/hose-barb detail; clean materials under this stage's lighting; static as expected |
| `chemistry-lab-bench.glb` | CONDITIONAL | Scientifically accurate 50-prop diorama with legible individual props at close range, but nearly all glass vessels (beakers, bottles, graduated cylinder) render as flat near-black opaque silhouettes under the app's actual no-IBL stage lighting — a real in-app material fault, not a test-harness artifact |

## 1. `bunsen-burner.glb`

**Verdict: PASS**

- **Taxonomy/component mapping:** `chemistry` > `chemical-reactions` branch (detailed) > "reaction
  apparatus" component, specifically the dedicated hero Bunsen burner per
  `chemistry-lab-bench.license.json`'s `mappedComponents` and `docs/assets/chemistry-reactions.md`
  §1 row "Bunsen burner (hero, standalone)". `content/taxonomy/chemistry.json`'s
  `chemical-reactions` low-level items include "Exothermic"/"Endothermic" and interactive
  components include "Reaction particle animation" / "Energy diagram" — the burner is a natural
  physical anchor for heat-related reaction concepts (e.g. exothermic energy-diagram scenes), used
  as scene dressing / a hotspot-focal object rather than content that itself teaches a taxonomy
  term.
- **Source & mesh:** Poly Haven "Bunsen Burner" by creator BKS, CC0. 2 mesh nodes: `bunsen_burner`
  (blue-enamel base + brass gas-inlet valve + ridged hose barb + vertical chimney with an
  air-adjustment collar) and `burner_stand` (3-legged tripod ring stand for holding a vessel over
  the flame) — both real, distinct, correctly-modeled parts of a real Bunsen burner setup, not a
  simplified placeholder. Real-world scale (~14cm × 17cm), matches Poly Haven's published
  dimensions and the sidecar's `approxDimensionsMeters`.
- **Mesh/material/texture quality:** Clean, low-poly-but-not-crude geometry; the front, 3/4, and
  top-down renders all show correct silhouette and proportions. Materials read well under this
  stage's two-directional-light-only setup: matte blue enamel base/ring, brushed-steel legs with
  visible longitudinal highlight streaks, and a distinct brass-toned knurled gas valve — all
  clearly differentiated by albedo, not relying on environment reflections to separate from each
  other (contrast with the lab-bench glass problem in §2).
- **Detail shot (gas valve / collar, `05-detail-valve-collar.png`):** Legible at close range — the
  vertical air-adjustment collar on the chimney (with its characteristic elongated slot/vent
  detailing) and the knurled brass gas-inlet fitting plus the ridged plastic/metal hose barb are
  all individually readable. This is the kind of physical detail worth a dedicated close-up
  hotspot in-app (e.g. "how do you control the flame" teaching moment).
- **Recognizability for a child audience:** High. Silhouette reads immediately as "the classic lab
  burner with the tripod stand," even before a flame is added procedurally.
- **Visual style fit vs. Anatomy Atelier/Space bar:** Consistent — clean geometry, warm off-white
  background compatible, no clutter, no gamey stylization.
- **Default camera framing / bounding-box sanity:** Bounding box is a tight, roughly cube-shaped
  ~0.139m × 0.173m × 0.139m centered at (0, 0.087, 0) — sane, no stray geometry or off-center
  origin. Auto-framing centers and fits the object cleanly at every angle tested.
- **Transparency/material faults:** None observed. No glass elements in this asset.
- **Animation:** None (confirmed, see above). A flame-flicker overlay would add real value here
  since the model has no fire of its own — consistent with the doc's stated plan to keep flame
  procedural.
- **Performance:** 2 meshes, 1 material, 3 textures (diffuse/normal/ORM at 1K), 2,131,920 bytes
  (~2.1MB). Lightweight; no performance concern for a component viewer.
- **Attribution:** Not legally required (CC0), but the sidecar's project-convention text should be
  honored in the in-app credits list: *"Bunsen Burner by BKS / Poly Haven (CC0)."*

Screenshots: `bunsen-burner/01-front.png`, `02-three-quarter-front-left.png`,
`03-three-quarter-front-right.png`, `04-top-down-three-quarter.png`, `05-detail-valve-collar.png`,
and composed `bunsen-burner/contact-sheet.png`.

## 2. `chemistry-lab-bench.glb`

**Verdict: CONDITIONAL**

- **Taxonomy/component mapping:** `chemistry` > `chemical-reactions` branch (detailed). Per
  `chemistry-lab-bench.license.json`'s `mappedComponents` and
  `docs/assets/chemistry-reactions.md` §1, the 50 nodes cover: beakers (large/med/small), test
  tubes + stand, retort/clamp stand, a secondary (lower-detail) Bunsen burner, and a bonus set of
  12 reagent-bottle nodes (dropper/cork/lid, dark + clear glass) explicitly earmarked for the
  not-yet-detailed `solutions`/`acids-and-bases` branches. None of this content invents facts for
  the undetailed branches — the doc is explicit that the bottles are pre-positioned inventory for
  later, consistent with the coordinator's instruction not to author content for `detailed: false`
  branches.
- **Source & scene:** Poly Haven "Chemistry Set" by creator Jiri Ptacek, CC0. 50 named, distinct
  mesh nodes (beakers, test tubes + 6 content-fill inserts, clamp + clamp stand + clamp tool,
  10 reagent bottles with lids/corks/droppers, 6 bottle-content inserts, 7 bottle labels, a
  secondary bunsen burner, and 2 test-tube stands) — genuinely one coherent lab-bench diorama, not
  a generic prop reused across unrelated branches, matching the sidecar's `sceneContents`
  description.
- **Mesh/material/texture quality — overall diorama read:** From the front/3-4/top-down angles
  (`01`–`04`), the diorama's *silhouette and layout* reads correctly as "a chemistry lab bench with
  many small instruments laid out in a row" — the clamp stand's cross-arm, the retort/clamp hook,
  the tiered bottle-and-test-tube arrangement, and a tall graduated cylinder are all distinguishable
  by shape alone. At the default overview framing the bench does **not** read as total mush — each
  prop cluster is spatially separated and shape-legible — but color/material differentiation
  between props is poor (see next point), so a first glance mostly reads as "a row of dark
  bottle-shaped objects" rather than a rich multi-material lab scene.
- **Individual-prop legibility at close range:** Good. The three close-up shots
  (`05-closeup-beaker-large`, `06-closeup-bunsen-burner-bundled`, `07-closeup-clamp-stand`) each
  clearly resolve 2–3 named props with correct real-world proportions: a graduated cylinder with
  faint printed volume markings, a beaker with a visible pour spout, the retort clamp's hook and
  perforated cross-arm, dropper-bottle caps in distinct colors (blue, dark red, white/frosted), and
  the secondary bunsen burner's blue base + brass nozzle. Individual props are legible up close;
  the "mush" risk noted in the brief is specifically a wide-shot color/material problem (below), not
  a geometry-resolution problem.
- **Critical material fault — glass/bottle vessels render as near-black opaque silhouettes:**
  Live-inspected every mesh's material via the loaded Three.js scene graph (not just visually):
  every glass-adjacent node (`chemistry_set_beaker_large/med/small`, all 10 bottle nodes, the
  graduated-cylinder-style `Cylinder075/123` nodes, all test tubes) is a `MeshStandardMaterial`
  with **factor `metalness: 1`, `roughness: 1`**, textured only by a baked diffuse/ORM map — there
  is **no `KHR_materials_transmission` extension and no `ior`** on any material; these are fully
  opaque PBR materials, not real glass shaders. Under Poly Haven's own studio HDRI (what the
  source asset was authored/previewed against), a shiny near-metallic material like this would
  pick up bright environment reflections and read convincingly as "glossy glass." Under this app's
  actual production stage — **confirmed from `GenericViewer.tsx` source: two directional lights and
  an ambient light only, no environment map** — a high-metalness surface has no diffuse albedo to
  fall back on and no reflections to catch, so it renders almost entirely black except for two tiny
  specular hotspots per light. This is exactly what the renders show: every beaker, bottle, and the
  graduated cylinder appear as solid black/near-black cylinders in all four overview angles and all
  three close-ups, rather than legible glass vessels. **This is a real, reproducible in-app problem
  given the stage recipe as specified, not an artifact of this review's rendering setup** — the
  same asset dropped into the live app's `GenericViewer` today would show the same near-black
  bottles. For contrast: `bunsen-burner.glb` uses the identical scalar material factors
  (`metalness: 1, roughness: 1`) but reads correctly (§1) — meaning the *per-pixel* ORM texture
  values differ between the two assets' donor textures, and it is specifically the lab-bench's
  glass-vessel texture regions that are baked too metallic/glossy to survive non-IBL lighting.
  **Recommendation for a follow-up pass (not attempted here, per scope):** either add a light
  environment map/IBL to the viewer stage generally (helps all glossy/metallic assets, broader
  change), or, scoped to this asset, remap the glass nodes' metalness factor down (e.g. toward 0)
  and rely on the diffuse/normal map plus a modest roughness for a believable frosted/painted-glass
  look under directional-only lighting — this would need a material edit pass on the glTF, out of
  scope for this read-only visual review.
- **Non-glass props (clamp/clamp stand/clamp tool, test-tube stand, tripod legs, bottle
  lids/corks):** Render correctly — matte painted-metal and cork/wood-toned materials hold their
  albedo fine without an environment map, same pattern as the burner asset in §1. The fault is
  specific to the glass-coded materials, not universal to the file.
- **Recognizability for a child audience:** Mixed. The overall bench shape and the metal apparatus
  (clamp stand, tripod, tube rack) read well and are recognizable. The glass vessels — arguably the
  most iconic "chemistry" objects for a child (a beaker, a test tube) — currently read as
  unrecognizable black lumps rather than glass containers, which undercuts the component's teaching
  value for exactly the pieces most central to "reaction apparatus."
- **Visual style fit vs. Anatomy Atelier/Space bar:** Geometry and layout fit the bar (clean,
  real-world-scale, not gamey); the black-glass material fault is a clear miss against the bar's
  "clean 3D" quality standard until addressed.
- **Default camera framing / bounding-box sanity — data-quality note:** The live world-space
  bounding box (computed post-transform from all 50 nodes, via `THREE.Box3().setFromObject()`)
  measures **~1.078m × 0.429m × 0.354m**, centered at approximately (0.014, 0.205, -0.052) — a
  long, shallow bench layout roughly 2.5× wider than the sidecar's stated
  `validation.approxDimensionsMeters` of **[0.2788, 0.429, 0.1578]**. The height (Y) axis matches
  almost exactly (0.429 vs 0.429); X and Z do not. This suggests the sidecar's validator computed
  its bounding box from the raw local-space POSITION accessor min/max across nodes *without*
  applying each node's transform matrix (translation/rotation), understating the true footprint —
  the sidecar's own note ("Bounding box derived from POSITION accessor min/max across all 50 nodes
  combined... not per-object") is consistent with this. Flagging as a data-quality observation for
  whoever maintains `validate-glb.mjs`, not a rendering defect: the actual model itself frames fine
  in-app (auto-framing here used the correct, transform-applied box and produced sane results at
  every angle), but the sidecar's published dimensions for this specific file should not be trusted
  for anything footprint-sensitive (e.g. deciding viewport/camera-distance defaults from the JSON
  alone rather than a live bounding-box computation).
- **Animation:** None (confirmed). Liquid pour/color-change effects remain procedural per scope —
  correct call, since no content/color-change channels exist in this file to lose.
- **Performance:** 50 mesh nodes / 50 meshes, 2 materials, 6 textures (4 unique images), 202
  accessors, 3,726,556 bytes (~3.7MB). 50 draw calls (assuming no default batching across the 2
  shared materials — three.js can potentially batch same-material meshes but this depends on
  runtime instancing setup, not evaluated here) is on the higher side for a single component
  viewer relative to typical single-hero-asset viewers in this app (e.g. the 2-mesh burner), but
  not alarming for a desktop/tablet target — worth a lightweight perf smoke-test once integrated,
  not a blocker for this visual review.
- **Whole-diorama-background vs. split-out-props — observation for the coordinator:** Given (a)
  the material fault above specifically affects the glass hero props (beaker, bottles) that are
  individually most valuable as dedicated hotspot objects, and (b) the doc's own
  `mappedComponents` already itemizes beaker/test-tube/clamp-stand/burner as separate concepts
  under the same detailed branch, there's a reasonable case for eventually splitting 3–5 of the
  most pedagogically relevant nodes (large beaker, a test tube + stand, the clamp stand) out as
  their own dedicated hero `.glb` files — mirroring how the burner already has both a bundled
  and a standalone version — rather than shipping the whole scene as one background prop. That
  said, the whole-diorama file is also legitimately useful as-is for a single "lab bench overview"
  scene/background shot once the material issue is fixed. This is an observation for
  prioritization, not an action taken here — no splitting/editing was performed.
- **Attribution:** Not legally required (CC0), but per the sidecar's project convention, credit
  *"Chemistry Set by Jiri Ptacek / Poly Haven (CC0)"* in the in-app asset credits list.

Screenshots: `chemistry-lab-bench/01-front.png`, `02-three-quarter-front-left.png`,
`03-three-quarter-front-right.png`, `04-top-down-three-quarter.png`,
`05-closeup-beaker-large.png`, `06-closeup-bunsen-burner-bundled.png`,
`07-closeup-clamp-stand.png`, and composed `chemistry-lab-bench/contact-sheet.png`.

## 3. Renderability

Both `.glb` files loaded and parsed successfully via `GLTFLoader` with no loader errors — 2/2
rendered, 0/2 unrenderable.
