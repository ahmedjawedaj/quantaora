# Chemistry — Reactions & Apparatus Asset Sourcing

Agent: CHEM-REACTIONS (Asset Recovery Wave 1). Scope: reaction apparatus/vessels (beaker, flask,
burner, test tube, funnel, retort stand) and state-change representative props for the
`chemical-reactions` and `states-of-matter` chemistry branches. Molecular/atomic structure assets
(atoms, molecules, crystals, periodic table) are explicitly **out of scope** — owned by a separate
chemistry-structure agent. Reaction particles, bubbling, and color-change effects remain
procedural (Three.js runtime); only the physical apparatus/vessels needed authored meshes.

Last updated: 2026-08-18.

## 0. Ground truth read

- `content/taxonomy/chemistry.json`: `chemical-reactions` branch is `"detailed": true` (low-level
  items: Reactant, Product, Coefficient, Conservation of mass, Balanced equation, Exothermic,
  Endothermic; interactive components: Balance equation, Reaction particle animation, Energy
  diagram). `states-of-matter`, `acids-and-bases`, `solutions` are `"detailed": false` — named
  only, not yet SME-sourced, so no content authoring should invent facts for them yet.
- `content/subjects/chemistry/chemical-reactions/**` already has authored `model-metadata.json`
  for `reactant`, `product`, `coefficient`, `balanced-equation`, `exothermic`, `endothermic`,
  `conservation-of-mass`. All seven are `modelType: "procedural-three"` **ball-and-stick molecule
  equation scenes** (e.g. `2H₂ + O₂ → 2H₂O` floating tiles with CPK-color spheres), not vessel
  scenes. That work belongs to the chemistry-structure/molecule-builder lane and is untouched here.
  The apparatus assets sourced in this doc are a **complementary** pool for a not-yet-authored
  "lab setup / reaction vessel" component or for `simulation.ts`/`lesson.md` illustrative use —
  they do not replace the existing procedural equation scenes.
- `docs/ASSET-LICENSES.md` "Cleared sources worth using": Poly Haven CC0 is explicitly called out
  for lab equipment (`chemistry_set`, `bunsen_burner`). Confirmed both exist and matched.

## 1. Branch/component mapping

| Taxonomy branch | Component / asset need | Status | Asset |
| --- | --- | --- | --- |
| `chemical-reactions` (detailed) | Beaker (large/med/small) | **Sourced** | `chemistry-lab-bench.glb` (nodes `chemistry_set_beaker_large/med/small`) |
| `chemical-reactions` (detailed) | Test tube + test tube stand | **Sourced** | `chemistry-lab-bench.glb` (nodes `chemistry_set_test_tube_a/b` + `test_tube_stand_a/b`) |
| `chemical-reactions` (detailed) | Retort/clamp stand | **Sourced** | `chemistry-lab-bench.glb` (nodes `chemistry_set_clamp`, `clamp_stand`, `clamp_tool`) |
| `chemical-reactions` (detailed) | Bunsen burner (hero, standalone) | **Sourced** | `bunsen-burner.glb` (dedicated 4K-source hero asset) |
| `chemical-reactions` (detailed) | Bunsen burner (scene prop) | **Sourced** | `chemistry-lab-bench.glb` (node `chemistry_set_bunsen_burner`, lower detail, in-scene) |
| `chemical-reactions` (detailed) | Reagent bottles (dropper/cork/lid, dark + clear glass) | **Sourced** (bonus, not requested but present) | `chemistry-lab-bench.glb` (12 bottle nodes) — useful later for `solutions`/`acids-and-bases` |
| `chemical-reactions` (detailed) | Erlenmeyer/conical flask | **Gap — candidates identified, download blocked** | See §3 rejected/blocked and §5 brief |
| `chemical-reactions` (detailed) | Funnel | **Gap — no qualifying candidate found** | See §5 brief |
| `chemical-reactions` (detailed) | Reaction particle animation, energy diagram, balance/atom-count visuals | **Out of scope for this agent** | Already procedural molecule scenes, see §0 |
| `states-of-matter` (not detailed) | Ice / water / steam representative props | **Gap, content not yet SME-sourced** | Not pursued this wave per taxonomy status; existing beaker/flask vessels can host procedural ice/water/steam fills once the branch is detailed. See §5 brief. |
| `acids-and-bases` (not detailed) | Litmus paper, pH strips, dropper bottles | **Gap, content not yet SME-sourced** | Reagent dropper bottles already sourced as a bonus (see above); litmus/pH strip prop not pursued — branch undetailed |
| `solutions` (not detailed) | Stirring rod, dissolving beaker | **Gap, content not yet SME-sourced** | Beaker already sourced; stirring rod not pursued — branch undetailed |

## 2. Downloaded files

Directory: `quantaora-app/public/models/sourced/chemistry-reactions/`

| File | Bytes | SHA-256 (first 16 chars) | Nodes/meshes | Materials | Textures |
| --- | --- | --- | --- | --- | --- |
| `chemistry-lab-bench.glb` | 3,726,556 | `278ce3248a6e4b86` | 50 | 2 | 6 (4 images) |
| `bunsen-burner.glb` | 2,131,920 | `6984beb0f86eec05` | 2 | 1 | 3 (3 images) |

Both pass GLB validation: magic header `0x676C5446` ('glTF') OK, declared length matches file
size, glTF 2.0, generator `Khronos glTF Blender I/O v5.1.20` (Poly Haven's own export). Full
validation JSON is embedded in each asset's sidecar `.license.json`. Approx dimensions (from
POSITION accessor min/max, real-world meters): lab bench scene ≈ 0.28m × 0.43m × 0.16m bounding
box across all 50 nodes combined; bunsen burner ≈ 0.14m × 0.17m × 0.14m (matches Poly Haven's
published 138.9mm × 138.9mm × 173.1mm).

Both were downloaded from Poly Haven as separate glTF + `.bin` + JPG textures (Poly Haven does not
publish single-file `.glb`), then repacked into single-file `.glb` with an in-house packer script
(`gltf-to-glb.mjs`, in the same directory, stdlib-only) that embeds the external buffer and every
image as GLB buffer views — no geometry or material edits, purely a container change. This keeps
the shipped format at the "prefer GLB" quality bar while remaining faithful to the CC0 source.

Sidecar files: `chemistry-lab-bench.license.json`, `bunsen-burner.license.json` (source URL,
creator, license, attribution stance, redistribution status, dateSourced, file size, sha256, and
the validation counts above). Utility scripts kept alongside for reproducibility:
`gltf-to-glb.mjs` (packer) and `validate-glb.mjs` (validator, copied from the sibling
`sourced/space/` agent's script — same stdlib-only pattern, no new deps).

## 3. Candidate comparison table

| Candidate | Source | License | Redistribution | Decision | Reason |
| --- | --- | --- | --- | --- | --- |
| Chemistry Set (`chemistry_set`) | Poly Haven — https://polyhaven.com/a/chemistry_set | CC0 1.0 | Explicit downloadable, no restriction | **Accepted** | 50 named nodes covering beaker/test-tube/retort-stand/burner/bottles in one coherent lab-bench diorama; real-world scale; glTF export available |
| Bunsen Burner (`bunsen_burner`) | Poly Haven — https://polyhaven.com/a/bunsen_burner | CC0 1.0 | Explicit downloadable, no restriction | **Accepted** | Dedicated higher-detail hero burner (4K source, 8434 tris), real-world scale; used where burner is the focal hotspot object rather than scene dressing |
| "FREE Conical Flask \| Laboratory \| Low poly" by nakedsingularity | Sketchfab — `f2991abcaaa44616ad5f72d29a3d47b3` | CC Attribution (CC-BY), confirmed via Sketchfab API (`license.slug`), `isDownloadable: true` | Permits redistribution with attribution | **Blocked, not downloaded** | License and downloadability qualify, but Sketchfab's download endpoint (`/v3/models/{uid}/download`) returned `401 Authentication credentials were not provided` for anonymous/unauthenticated `curl`. No Sketchfab account/OAuth token available in this environment; instructions forbid bypassing auth gates. Left as a named, vetted candidate for a human-authenticated follow-up, not fabricated as downloaded. |
| "erlenmeyer flask" by itschemistry2 | Sketchfab — `e2ce2700c8a84ebcba6b0e20e477263c` | CC Attribution (CC-BY) per API | isDownloadable: true | **Rejected** | Same auth-gate block as above, plus no description/provenance text on the listing itself (thin provenance) — lower confidence than the nakedsingularity candidate even if auth were available |
| "Erlenmeyer Flask Collection" by 3dLabWare | Sketchfab — `6fab3ffddbe44cb4bf2e6bbccd49d32f` | CC Attribution (CC-BY) per API | isDownloadable: true | **Rejected** | Same auth-gate block; also 99,840 faces / 49,926 verts — far above what a decimated kids-app hero asset needs, would require re-decimation we can't do without downloading first |
| "Simple Erlenmeyer" by pistachx | Sketchfab — `49b40a9c1a794814ba5d9fedf8d2a33d` | CC Attribution (CC-BY) per API | isDownloadable: true | **Rejected** | Same auth-gate block; described as a "witchtober"/personal-art series piece, lower confidence it reads as clean lab equipment vs. stylized prop |
| Ice Cube by Polychromic | Sketchfab — `cb936b6f2df44bea993a33a975544809` | Unknown — Sketchfab API returned an empty/undefined response for this UID (likely stale or incorrect ID from search) | Unverified | **Rejected** | Could not verify license or metadata at all; `states-of-matter` branch is also `detailed: false` in the taxonomy so no content is ready to consume this asset yet regardless |
| Various Thingiverse/Free3D/TurboSquid/CGTrader-free/AI-text-to-3D funnel and flask results (search noise) | Multiple | Unclear/unverifiable | Unclear | **Rejected outright, not evaluated further** | Matches `docs/ASSET-LICENSES.md` "Known traps" — unverifiable provenance by policy, no per-file check performed |
| BlenderKit chemistry/lab props | blenderkit.com | CC0-filterable per project convention | N/A | **Not evaluated** | BlenderKit downloads require an authenticated add-on/API session; same auth-gate limitation as Sketchfab, and Poly Haven's `chemistry_set` already covered the core apparatus need, so this wasn't pursued further under the token budget |
| Funnel (lab glass funnel) — any source | Poly Haven (none found), Sketchfab (no qualifying CC0/CC-BY hit surfaced in search) | N/A | N/A | **No candidate found** | Poly Haven's model catalogue (521 models) has no `funnel` match by name, tag, or description. Web search surfaced no clearly-licensed downloadable funnel model. See commissioned brief in §5. |

## 4. Rejection reasons (summary)

- **Auth-gate blocked (5 Sketchfab candidates):** license metadata checks out via Sketchfab's public
  v3 API (`license.slug`, `isDownloadable`), but the actual archive download endpoint requires an
  OAuth bearer token tied to a logged-in Sketchfab account. This agent has no such credential and
  the task brief explicitly forbids bypassing auth gates or using unauthorized mirrors. These are
  recorded as **vetted-but-unfetched** rather than accepted or silently dropped.
- **Unverifiable provenance (1 candidate, Ice Cube):** Sketchfab API returned no metadata for the
  UID pulled from search results (likely a stale/incorrect link); rejected without further chase
  since `states-of-matter` isn't a detailed branch yet anyway.
- **Known-trap sources (funnel/flask search noise):** Thingiverse/Free3D/TurboSquid-free/CGTrader-free
  and AI-text-to-3D results were excluded per `docs/ASSET-LICENSES.md` policy without per-file
  inspection — provenance is unverifiable by category, not worth spending validation time on.
- **Over-budget poly count (3dLabWare Erlenmeyer Collection):** ~100K faces is far above a
  decimated kids-app hero asset even before the auth block; flagged so a future authenticated pull
  doesn't default to the highest-poly option.

## 5. Unresolved gaps — commissioned-model briefs

### Gap 1: Erlenmeyer / conical flask (single hero prop)
- **Why needed:** `chemical-reactions` apparatus set currently has beakers and test tubes but no
  conical/Erlenmeyer flask — the single most recognizable "chemistry" vessel silhouette for kids.
- **Immediate unblock option (cheaper than commissioning):** a human with a Sketchfab account can
  authenticate and pull "FREE Conical Flask | Laboratory | Low poly" by nakedsingularity
  (https://sketchfab.com/3d-models/free-conical-flask-laboratory-low-poly-f2991abcaaa44616ad5f72d29a3d47b3,
  CC-BY, 2,742 tris, real-world scale, isDownloadable confirmed) — this is the recommended first
  move before commissioning new geometry.
- **If commissioning instead:** clear conical (Erlenmeyer) flask, ~250mL, narrow neck ~2.5cm
  diameter, base ~9cm diameter, height ~12cm, thin glass shell (roughness ~0.05, transmission/IOR
  ~1.5 or a faked transparent glass shader consistent with the app's existing glass materials),
  optional graduation markings as a decal, optional colored liquid fill mesh as a separate node so
  runtime can swap fill color/level procedurally. Reference imagery: any standard 250mL Erlenmeyer
  flask product photo. Budget 1.5–3k triangles, single node named `flask_erlenmeyer`.

### Gap 2: Lab funnel
- **Why needed:** filtration/pouring apparatus, explicitly named in scope; no Poly Haven or
  clearly-licensed Sketchfab match found in this wave.
- **Commissioned brief:** simple glass or plastic stemmed funnel, conical bowl ~8cm top diameter
  narrowing to a stem ~1cm diameter × ~6cm length, thin-shell glass or matte plastic material
  matching the existing lab-bench palette. Budget 500–1.5k triangles, single node named `funnel`.
  Reference imagery: standard laboratory glass funnel product photo.

### Gap 3: States-of-matter ice/water/steam representative props
- **Why needed:** scope calls out "state-change objects (ice/water/steam representative props)."
- **Not pursued this wave because:** `states-of-matter` is `"detailed": false` in
  `content/taxonomy/chemistry.json` — no SME-sourced low-level items/components exist yet, so per
  the coordinator's instructions this is flagged as a gap rather than content being invented.
- **Recommendation once the branch is detailed:** the already-sourced `chemistry-lab-bench.glb`
  beakers can serve as the physical container; ice/water/steam themselves are good candidates to
  stay procedural (particle/shader-driven melt, boil, condensation) rather than authored meshes,
  consistent with the "reaction particles/bubbling/color-change effects may remain procedural"
  guidance. If a discrete ice-cube prop is still wanted later, re-run a Sketchfab search with
  authenticated download access; none of the anonymous-search hits this wave had verifiable license
  + provenance together.

## 6. Reuse/duplicate note for the quality-pipeline agent

`bunsen-burner.glb` (standalone hero, 8434-tri source) and the `chemistry_set_bunsen_burner` node
embedded inside `chemistry-lab-bench.glb` are **two different meshes of the same real-world object
from the same Poly Haven donor collection** (`project_lighthouse`), not a duplicate import of one
file. This is intentional — the lab-bench scene needs a burner as scene dressing, and a discrete
hotspot-focused component needs a dedicated hero asset. Documented here so a duplicate-detection
pass (e.g. by geometry similarity or file size) doesn't flag-and-remove one as redundant without
context.

## 7. Explicitly out of scope (for the coordinator's awareness)

Molecular structures involved in specific reactions (e.g. the H₂/O₂/H₂O ball-and-stick geometry
used by `reactant`, `product`, `balanced-equation`, `coefficient`, `exothermic`, `endothermic`,
`conservation-of-mass`) were **not** touched — those are already procedural-three assets authored
by a different lane and explicitly excluded from this agent's scope per the task brief
("chemistry-structure — atoms/molecules/crystals/periodic table — belongs to a different agent").
