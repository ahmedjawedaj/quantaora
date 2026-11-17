# Biology Life Sciences Asset Sourcing — Wave 1 (Agent BIO-LIFE)

Scope: Plants/growth stages, ecology organisms/food-web components, and non-anatomy physiology
specimens/equipment. Source of truth: `content/taxonomy/biology.json`. Anatomy organs
(`public/models/{brain,eyeball,heart,intestine,kidneys,liver,lungs,pancreas,skin}.glb`) are
out of scope and were never opened. Inventory + sourcing + validation only — no route/
`src/data/modelRegistry.ts`/`docs/ASSET-LICENSES.md` wiring (a later wave).

Date sourced: 2026-08-18.

Ownership boundary for this run: `quantaora-app/public/models/sourced/biology-life/**` and this
document. Nothing else was written to.

## 1. Audit of already-cleared assets in scope

- `public/models/nature/quaternius-ultimate-nature/**` (50 GLBs) — confirmed by directory listing:
  every file is a `BirchTree*`, `Bush*`, `Cactus*`, or `CommonTree*` variant (trees/bushes/cacti
  only). **No growth-stage sequences, no flowers, no food-web animals, no fungi** — the pack does
  not cover any of this wave's targets beyond generic tree/shrub set dressing. No duplication risk
  with anything sourced below.
- `public/models/biology/ecology/producer.glb` and `ecology.glb` — both derived from trees in the
  pack above (`CommonTree_1`, `CommonTree_Autumn_1`). They cover the **Producer** and generic
  **Ecosystem** low-level items only. **Consumer, Decomposer, Predator, Prey** were completely
  unrepresented before this wave.

Neither directory was modified.

## 2. Branch/component mapping table

Only `plants` and `ecology` are `"detailed": true` in `content/taxonomy/biology.json` within this
wave's scope; `animals` is `"detailed": false` (named only, not authored) and is flagged, not
sourced-for-content. Human Physiology processes are organ-bound (anatomy, out of scope) except for
generic lab equipment, audited separately below.

| Branch (`detailed`) | Component / low-level item | Status before | Status after |
| --- | --- | --- | --- |
| plants (true) | Seed → seedling → sprout → mature plant (growth-stage sequence) | none | **sourced** — 5-stage `Corn_*` sequence, see §5 |
| plants (true) | Flower | none | **sourced** — 4-stage bud→bloom `Flower_*` sequence, see §5 |
| plants (true) | Root | none | **gap** — commissioned brief, see §6 |
| plants (true) | Stem / Xylem / Phloem (internal transport structure) | none | **gap** — commissioned brief, see §6 |
| plants (true) | Leaf / Stomata (cross-section) | none | **gap** — commissioned brief, see §6 |
| plants (true) | Chloroplast | covered elsewhere (cell-biology organelle, out of this wave's ownership — flag only, do not duplicate) | not touched |
| plants (true) | interactiveComponents: Plant cross-section | none | **gap**, folds into Root/Stem/Leaf cross-section brief, §6 |
| plants (true) | interactiveComponents: Photosynthesis variable lab, Pollination timeline | procedural (correct — variable-driven simulations, not object models) | unchanged, no gap |
| ecology (true) | Producer | `producer.glb` (existing, cleared) | unchanged, adequate |
| ecology (true) | Consumer | none | **sourced** — Deer, see §5 |
| ecology (true) | Predator | none | **sourced** — Fox, see §5 |
| ecology (true) | Prey | none | **sourced incidentally** — Deer doubles as prey-of-fox in a predator/prey pair, see §5 |
| ecology (true) | Decomposer | none | **sourced** — 5-stage `Mushroom_*` fungal sequence, see §5 |
| ecology (true) | Organism, Population, Community, Ecosystem, Habitat, Niche | abstract/relational concepts | unchanged — no single-object 3D asset applies; correctly procedural/diagram-driven (population sliders, biome explorer, food-web builder graph) |
| ecology (true) | processes: Food chain, Food web, Energy pyramid, Population growth, Carrying capacity, Symbiosis, Carbon cycle, Water cycle | procedural (correct) | unchanged, no gap |
| animals (false) | — | not authored | flagged only — do not invent content; the Deer/Fox sourced above serve the Ecology food-web need directly and can be reused once `animals` gets an SME breakdown, but were not sourced *as* an Animals-branch deliverable |
| human-physiology (true) | Non-organ lab equipment (supports "Flow animations" / "Microscope mode"-adjacent demonstration content) | none | **sourced** — vintage microscope, see §5. Note: "Microscope mode" is explicitly listed under the Microbiology branch's interactiveComponents, not Human Physiology's — sourced here as general biology-lab equipment since it is clearly non-anatomy; flagging for the coordinator in case Microbiology is another agent's lane, to avoid double-sourcing. |
| human-physiology (true) | Breathing, circulation, digestion, filtration, muscle contraction, nerve signaling, hormone signaling, immune response, temperature regulation | organ-bound flow animations (anatomy owns the organ meshes) | out of scope — no non-anatomy specimen applies to these processes beyond the microscope above |

## 3. Candidate comparison table

Every candidate evaluated, not just accepted ones.

| Candidate | Source | License | Redistribution | Verdict | Reason |
| --- | --- | --- | --- | --- | --- |
| Ultimate Crops Pack — `Corn_1..4`, `Corn_Crop` (5-stage growth) | quaternius.com/packs/ultimatecrops.html (Google Drive folder, CC0 badge on page) | CC0 1.0 Universal | Direct download, folder confirmed public | **Accepted** | Exact match for "seedling→sprout→mature plant" need; visually consistent (same studio/style) with the already-imported `quaternius-ultimate-nature` pack |
| Ultimate Crops Pack — `Flower_1..4` (bud→bloom, 4 stages) | same pack/folder | CC0 1.0 Universal | Direct download | **Accepted** | Fills the standalone "Flower" low-level item and supports a pollination-timeline visual anchor |
| Ultimate Crops Pack — `Mushroom_1..4`, `Mushroom_Crop` (5-stage fungal growth) | same pack/folder | CC0 1.0 Universal | Direct download | **Accepted** | Fills "Decomposer" — no decomposer organism existed in the repo at all before this |
| Ultimate Crops Pack — other 15 crop families (Apple, Bamboo, Beet, BushBerries, Cactus, Carrot, Coconut, Grass, Lettuce, Orange, PalmTree, Pumpkin, Rice, Tomato, Watermelon, Wheat) | same pack/folder | CC0 1.0 Universal | Direct download | **Evaluated, not downloaded** | Same license/quality tier as the accepted Corn/Flower/Mushroom sets; out of immediate scope (no distinct taxonomy component needs them this wave) — noted here so a future wave doesn't re-audit the pack from scratch. Full 410-file folder index cached during this run. |
| Ultimate Animated Animal Pack — `Deer.gltf` | quaternius.com/packs/ultimateanimatedanimals.html (Google Drive folder, CC0 badge + `License.txt` in folder confirms CC0 1.0) | CC0 1.0 Universal | Direct download | **Accepted** | Fills Consumer/Prey |
| Ultimate Animated Animal Pack — `Fox.gltf` | same pack/folder | CC0 1.0 Universal | Direct download | **Accepted** | Fills Predator; forms a recognizable predator/prey pair with Deer for a food-web builder |
| Ultimate Animated Animal Pack — `Alpaca`, `Bull`, `Cow`, `Donkey`, `Horse`, `Horse_White`, `Husky`, `ShibaInu`, `Stag`, `Wolf` | same pack/folder | CC0 1.0 Universal | Direct download | **Evaluated, not downloaded** | Same quality/license tier; domesticated animals (Cow/Bull/Donkey/Horse/Husky/ShibaInu) are weaker fits for a *wild* food-web than farm-content, and Wolf/Stag are redundant with Fox/Deer as a first predator/prey pair. Left for a future wave if farm-food-chain or a second predator/prey pair is needed. |
| Poly Haven "Vintage Microscope" | polyhaven.com/a/vintage_microscope | CC0 1.0 Universal | Direct download (1k glTF + bin + jpg textures, md5-verified) | **Accepted** | Real photogrammetry/PBR lab instrument; only qualifying non-anatomy physiology-adjacent equipment found. Flagged for art-direction review (PBR-realistic vs. the app's low-poly style) — see note in its sidecar. |
| Poly Haven "Industrial Microscope" | polyhaven.com/models (search hit) | CC0 (Poly Haven site-wide) | Direct download | **Rejected — redundant** | Same equipment category as Vintage Microscope; only one microscope needed for this wave, kept the better-documented one |
| Poly Haven "Magnifying Glass 01" | polyhaven.com/models (search hit) | CC0 (Poly Haven site-wide) | Direct download | **Evaluated, not downloaded** | Plausible small physiology/biology-lab prop; out of immediate component-mapping need this wave, noted for future equipment sourcing |
| Poly Haven flower scans (`flower_gazania`, `flower_ursinia`, `flower_empodium`, `flower_heliophila`, `flower_stinkkruid`, `crystalline_iceplant`, `nettle_plant`, `periwinkle_plant`, `potted_plant_01/02/04`, `weed_plant_02`) | polyhaven.com/models/plants (API query) | CC0 1.0 Universal | Direct download | **Evaluated, not downloaded** | Genuine, real, redistributable, high quality — but photogrammetry-PBR style, which would sit inconsistently next to the low-poly Quaternius growth-stage sequence chosen for Plants. Recorded as a same-tier alternative/supplement, not used to avoid a style clash within one component family. |
| Sketchfab "Leaf Cross Section for Biology Task" (user: beltain) | sketchfab.com/3d-models/leaf-cross-section-for-biology-task-51899a9f8440427a83dd0a446a72e8fc | "Free Standard" (Sketchfab's own default license, **not** CC0/CC-BY) | Viewable/downloadable on Sketchfab but license terms don't affirmatively grant redistribution | **Rejected** | Fails the explicit rule: Sketchfab only allowed when the model shows a CC0/CC-BY license. "Free Standard" is not one of those. This was the only leaf-cross-section-with-xylem/phloem candidate found anywhere; nothing else qualified, hence the commissioned brief in §6. |
| Sketchfab "Phloem Xylem" (user: Ayeshasiddiqa) | sketchfab.com | Not checked in detail after the sibling result above set the pattern | Unknown | **Rejected (not pursued)** | Same platform/category as the rejected leaf model; given the site's default-license pattern found above, not worth spending further token budget verifying — flagged instead of silently dropped |
| TurboSquid / RigModels / Meshy / CGTrader / Free3D stethoscope results | various (web search) | Royalty-free-with-terms or unclear; several are AI-generated ("Meshy") | Unverifiable provenance | **Rejected** | Matches the documented "known trap" categories exactly (TurboSquid-free, CGTrader-free, Free3D, AI text-to-3D) — no stethoscope candidate anywhere met the bar. Commissioned brief in §6 if this equipment is wanted later. |
| Smithsonian 3D (`3d.si.edu`) open-access highlights | 3d.si.edu/collections/openaccesshighlights | CC0 where marked (per `docs/ASSET-LICENSES.md`) | N/A | **Not evaluated — blocked** | Page returned HTTP 403 to the fetch tool (likely bot/anti-scrape gate); did not attempt to bypass per the "never bypass auth gates" rule. Flagged as unresolved research, not a rejection — a future wave with browser-based access could check it for fungi/insect/decomposer specimens. |

## 4. Downloaded-file list

All under `quantaora-app/public/models/sourced/biology-life/`. Every `.glb` has a sibling
`.license.json` sidecar with source URL, creator, license, attribution/redistribution status,
`dateSourced: "2026-08-18"`, file size, sha256, and GLB-structure validation counts (see §5 for
the validation method).

| Local path | Source pack | Original filename | Size |
| --- | --- | --- | --- |
| `plants/growth-stage-corn/corn-stage-1.glb` | Ultimate Crops Pack | `Corn_1.fbx` | 7.1 KB |
| `plants/growth-stage-corn/corn-stage-2.glb` | Ultimate Crops Pack | `Corn_2.fbx` | 10.3 KB |
| `plants/growth-stage-corn/corn-stage-3.glb` | Ultimate Crops Pack | `Corn_3.fbx` | 22.9 KB |
| `plants/growth-stage-corn/corn-stage-4.glb` | Ultimate Crops Pack | `Corn_4.fbx` | 63.8 KB |
| `plants/growth-stage-corn/corn-stage-5-mature.glb` | Ultimate Crops Pack | `Corn_Crop.fbx` | 8.0 KB |
| `plants/flower/flower-stage-1-bud.glb` | Ultimate Crops Pack | `Flower_1.fbx` | 6.6 KB |
| `plants/flower/flower-stage-2.glb` | Ultimate Crops Pack | `Flower_2.fbx` | 4.2 KB |
| `plants/flower/flower-stage-3.glb` | Ultimate Crops Pack | `Flower_3.fbx` | 11.2 KB |
| `plants/flower/flower-stage-4-bloom.glb` | Ultimate Crops Pack | `Flower_4.fbx` | 14.3 KB |
| `ecology/decomposer-mushroom/mushroom-stage-1.glb` | Ultimate Crops Pack | `Mushroom_1.fbx` | 12.4 KB |
| `ecology/decomposer-mushroom/mushroom-stage-2.glb` | Ultimate Crops Pack | `Mushroom_2.fbx` | 40.8 KB |
| `ecology/decomposer-mushroom/mushroom-stage-3.glb` | Ultimate Crops Pack | `Mushroom_3.fbx` | 60.7 KB |
| `ecology/decomposer-mushroom/mushroom-stage-4.glb` | Ultimate Crops Pack | `Mushroom_4.fbx` | 113 KB |
| `ecology/decomposer-mushroom/mushroom-stage-5-mature.glb` | Ultimate Crops Pack | `Mushroom_Crop.fbx` | 84.1 KB |
| `ecology/consumer-deer/deer.glb` | Ultimate Animated Animal Pack | `Deer.gltf` | 207.2 KB |
| `ecology/predator-fox/fox.glb` | Ultimate Animated Animal Pack | `Fox.gltf` | 118.8 KB |
| `physiology-equipment/vintage-microscope.glb` | Poly Haven (single asset) | `vintage_microscope_1k.gltf` + bin + 3 jpg | 837.0 KB |

Total: **17 GLBs, 1.6 MB combined** — all far under the 15 MB/hero-asset budget.

### Conversion + validation method

- Crops-pack source files were FBX; animal-pack files were self-contained glTF (single-file,
  embedded base64 buffer, no external textures). All converted to single-file GLB with
  `assimp export`.
- **Known limitation:** `assimp`'s glTF2 exporter failed outright (`Failed to write file`) on the
  two skinned/animated animal meshes (Fox, Deer) — this reproduced across a glTF→GLB direct path
  and a glTF→DAE→GLB path. Fix used: export to static OBJ first (which drops the armature/animation
  by construction), then OBJ→GLB. Net effect: **Fox and Deer ship as static geometry, no
  skeleton/animation, matching the existing repo precedent** ("Converted FBX→GLB via Assimp;
  geometry only, no textures" for `quaternius-ultimate-nature`). If posed/animated versions are
  wanted later, re-run from the original `.gltf`/`.fbx` in a tool that handles this pack's rig
  correctly (e.g. Blender headless), not `assimp`.
- Crop-family and flower/mushroom files have no textures either (material colors only), same as
  the existing nature pack. The microscope is the only textured asset (real jpg diffuse/normal/ARM
  maps carried through from Poly Haven).
- Every file was validated with a small Node script
  (`node -e` using only built-in `fs`/`crypto`, no new dependency) that: confirms the GLB magic
  header (`0x46546C67` / `'glTF'` at byte 0), reads the declared total length and cross-checks it
  against the actual file size, parses the JSON chunk, and reports scene/node/mesh/material/
  texture/animation/accessor counts plus a bounding box derived from each mesh's `POSITION`
  accessor min/max. All 17 files passed (valid header, JSON parses, `totalLength == fileSize`).
  None were opened in an actual 3D viewer — flagging that render-inspection (not just structural
  validation) is still outstanding for all 17.
- sha256 computed for every file (recorded in its sidecar and cross-checked against the copy in
  `public/` after placement — all 17 matched).

## 5. Notable per-asset findings

- The crop-pack growth sequences are **not scientifically labeled species stages** — they are a
  stylized game-asset progression (`_1` through `_4`, then `_Crop` = harvest-ready). They read
  clearly as "small → big, growing" but do not, on their own, teach real germination biology
  (radicle emergence, cotyledon vs. true leaves, etc.). Fine as the *visual* backbone for a
  germination/growth-stage component; content authoring should not claim these stages map to named
  botanical growth phases without a diagram/label layer on top.
- Fox/Deer bounding boxes (~2.6 m tall for Fox, ~4.3 m tall for Deer per the validator) look
  oversized for the real animals — likely a modeling-scale convention in this Quaternius pack (unit
  = decimeters or similar) rather than a defect. Re-check scale against the existing
  `quaternius-ultimate-nature` trees before compositing into one scene.
- Vintage Microscope bounding box (~0.13 m tall) is smaller than Poly Haven's stated ~0.4 m
  real-world scan height — also flagged as a scale mismatch to resolve at integration time, not
  during this sourcing wave.

## 6. Unresolved gaps — commissioned-model briefs

None of these had a qualifying free/CC0/CC-BY downloadable candidate. Do not fabricate a
placeholder GLB for any of them; each needs either a commissioned asset or a procedural
build-out.

### 6.1 Plant cross-section (Root / Stem+Xylem+Phloem / Leaf+Stomata)

- **Taxonomy need:** `plants.lowLevelItems`: Root, Stem, Leaf, Stomata, Xylem, Phloem;
  `plants.interactiveComponents`: "Plant cross-section".
- **Why nothing qualified:** every leaf/stem cross-section model found (TurboSquid, Sketchfab,
  RenderHub) was either paid, editorial-only, or licensed under Sketchfab's default "Standard"
  terms (not CC0/CC-BY). No CC0 source (Poly Haven, Quaternius, Smithsonian, NIH 3D) publishes
  labeled internal-plant-anatomy geometry — this is a niche educational-diagram category that
  open CC0 libraries don't cover.
- **Brief:** one authored GLB (or a small family) showing: (a) a root system with a visible taproot
  + root hairs meeting a soil cutaway plane; (b) a stem cross-section with distinct xylem (inner,
  darker/thicker-walled) and phloem (outer, thinner) rings, cutaway or exploded so both are
  independently hotspot-able; (c) a leaf cross-section showing epidermis, palisade/spongy
  mesophyll, and stomata on the underside, again as a cutaway slab. Reference imagery: any standard
  botany-textbook cross-section diagram (upper epidermis → palisade mesophyll → spongy mesophyll →
  lower epidermis → stomata for the leaf; vascular bundle ring for the stem). Style: match the
  existing `animal-cell-authored.glb` / `neuron-authored.glb` precedent in
  `public/models/cells/` — those were built as project-owned authored GLBs via
  `quantaora-app/scripts/assets/build-cell-glbs.mjs` for exactly this reason (no clean CC0 source
  existed for cutaway biological interiors either). A `build-plant-glbs.mjs` sibling script
  following the same pattern is the likely path.

### 6.2 Additional decomposer diversity (earthworm, beetle, bacteria-visible-to-kids)

- **Taxonomy need:** `ecology.lowLevelItems`: Decomposer (partially filled by the mushroom
  sequence above, but a single fungus doesn't demonstrate decomposer *diversity*).
- **Why nothing qualified:** no CC0 earthworm/decomposer-insect pack was found in the time budget
  for this wave (Quaternius's other nature/animal packs are trees/pets/farm-focused, not
  detritivores). Not exhaustively searched — flag as "not fully researched" rather than "confirmed
  absent."
- **Brief (lower priority than 6.1):** a simple low-poly earthworm and/or a decomposer beetle,
  same visual tier as the Quaternius packs already in the repo, would round out a "decomposer
  team" alongside the mushroom sequence. A future wave should re-search Quaternius's newer packs
  and Poly Haven's small-creature offerings before commissioning from scratch.

### 6.3 Non-anatomy physiology equipment beyond the microscope

- **Taxonomy need:** `human-physiology.processes` (breathing, circulation, filtration, etc.) are
  organ-bound and out of this wave's scope, but classroom-style demonstration equipment
  (stethoscope, thermometer, sphygmomanometer/blood-pressure cuff) would support "cause/effect
  slider" and "what happens if…" interactions without touching anatomy meshes.
- **Why nothing qualified:** every stethoscope search hit was TurboSquid/CGTrader/Free3D/Meshy —
  all named "known traps" in `docs/ASSET-LICENSES.md` (royalty-free-with-terms or AI-generated,
  unverifiable provenance). No Poly Haven, Quaternius, Smithsonian, or NIH 3D stethoscope/
  thermometer/BP-cuff model exists as of this search.
- **Brief:** commission or author a simple low-poly stethoscope + digital thermometer +
  sphygmomanometer set, CC0/project-owned, matching the microscope's scale tier. Low priority —
  no taxonomy component currently blocks on this; it would only enrich physiology process visuals.

### 6.4 Smithsonian 3D — unresearched due to access block

- `3d.si.edu`'s collection pages returned HTTP 403 to the fetch tool in this session (likely an
  anti-bot gate, not a licensing issue). Per the "never bypass auth gates or use unauthorized
  mirrors" rule, this was not worked around. A future wave with interactive/browser access should
  check `3d.si.edu` directly for CC0-marked fungi, insect, or decomposer specimens before any of
  §6.2 is commissioned from scratch — Smithsonian's fossil/specimen catalogue is a plausible fit
  and wasn't ruled out, just unreachable this run.

## 7. Duplicate / reuse findings for the quality-pipeline agent

- No overlap between anything sourced here and the existing `quaternius-ultimate-nature`,
  `producer.glb`, or `ecosystem.glb` — confirmed by directory audit in §1 (existing pack is
  100% trees/bushes/cacti, no growth stages, no animals, no fungi).
- Corn/Flower/Mushroom growth stages come from the **same Google Drive folder/pack** family as the
  already-imported nature pack (Quaternius), so they'll sha256-dedupe cleanly against each other
  but are legitimately distinct meshes, not accidental duplicates.
- Deer and Fox come from a **different** Quaternius pack (Ultimate Animated Animal Pack) than the
  nature pack — separate `License.txt` confirms CC0 independently, recorded in both sidecars.
