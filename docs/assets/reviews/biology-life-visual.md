# Biology / Life Sciences — Visual Acceptance Review (Wave 2)

Reviewer: BIO-LIFE visual acceptance agent. Date: 2026-08-18.

Scope: the 17 `.glb` files sourced in `docs/assets/biology-life.md` (Wave 1), under
`quantaora-app/public/models/sourced/biology-life/`. Anatomy organs are out of scope and were not
touched.

Rendering method: headless Chromium (Google Chrome + `puppeteer-core`, `--use-gl=swiftshader
--enable-unsafe-swiftshader --enable-webgl --ignore-gpu-blocklist`) driving a Three.js scene that
reproduces the app's real stage recipe from `src/components/explorer/GenericViewer.tsx` exactly:
background `#faf8f4`; ambient `#fff4e6` @ 0.7; directional `#fff7ec` @ 2 at `(3,4,3)`; directional
`#dce8f5` @ 0.6 at `(-3,-1,2)`; camera fov 36. Camera auto-framed per model from its computed
bounding sphere (not a fixed distance), 5 angles captured per asset (front, 3/4 front-left, 3/4
front-right, top-down 3/4, and a low/back angle chosen to reveal backfaces/gaps/underside). All 17
files parsed and rendered without loader errors — **0 unrenderable**.

Screenshot root (relative to this doc): `../../../review-screenshots/asset-acceptance-2026-08-18/biology-life/<asset-slug>/`
— each folder has `01-front.png` … `05-low-back.png` plus `<slug>-contact-sheet.png`.

## Summary table

| # | Asset | Verdict | One-line reason |
| - | --- | --- | --- |
| 1 | `ecology/consumer-deer/deer.glb` | CONDITIONAL | Clean, recognizable low-poly deer; no animation channels; scale convention (~4.3 m tall) must be normalized before compositing with other organisms |
| 2 | `ecology/predator-fox/fox.glb` | CONDITIONAL | Clean, recognizable low-poly fox, good predator/prey pair with Deer; same scale-convention fix needed; no animation channels |
| 3 | `ecology/decomposer-mushroom/mushroom-stage-1.glb` | PASS | Small domed cap-on-stem, clean read, first step of a coherent growth sequence |
| 4 | `ecology/decomposer-mushroom/mushroom-stage-2.glb` | PASS | Taller conical cap, clear visual growth over stage 1 |
| 5 | `ecology/decomposer-mushroom/mushroom-stage-3.glb` | PASS | Wider domed spotted cap (amanita-style), good mid-sequence step |
| 6 | `ecology/decomposer-mushroom/mushroom-stage-4.glb` | PASS | Largest domed cap with strongest stem, best "near-mature" read in the set |
| 7 | `ecology/decomposer-mushroom/mushroom-stage-5-mature.glb` | REJECT | Not a taller continuation of stages 1–4 — a flattened, wide, featureless disc (a harvest-crop asset, not a growth stage); breaks the sequence |
| 8 | `physiology-equipment/vintage-microscope.glb` | CONDITIONAL | High-quality real PBR scan, but stylistically clashes with the flat low-poly ecology/plant set; falls near-black on the unlit backside under the app's 2-light rig; taxonomy branch is ambiguous (flagged in sourcing doc) |
| 9 | `plants/flower/flower-stage-1-bud.glb` | CONDITIONAL | Renders as a plain two-blade sprout, not a recognizable "bud" — mislabeled relative to what's on screen |
| 10 | `plants/flower/flower-stage-2.glb` | PASS | Reads as a closed spike/bud — visually the strongest "bud" of the set |
| 11 | `plants/flower/flower-stage-3.glb` | PASS | Opening 4–5 petal flower, clear progression from stage 2 |
| 12 | `plants/flower/flower-stage-4-bloom.glb` | PASS | Fuller open bloom; unusual dark teal petal color hurts "flower" recognizability for kids |
| 13 | `plants/growth-stage-corn/corn-stage-1.glb` | PASS | Simple two-blade seedling, clean start to an excellent sequence |
| 14 | `plants/growth-stage-corn/corn-stage-2.glb` | PASS | Young leafy stalk, clear growth over stage 1 |
| 15 | `plants/growth-stage-corn/corn-stage-3.glb` | PASS | Taller stalk, more leaves, strong mid-sequence step |
| 16 | `plants/growth-stage-corn/corn-stage-4.glb` | PASS | Full stalk with husked ears and tassel — best single asset in this wave |
| 17 | `plants/growth-stage-corn/corn-stage-5-mature.glb` | REJECT | Not a taller/tasseled continuation of stage 4 — a detached, husked cob lying on its side (a harvest-crop asset, not a growth stage); breaks the sequence |

**Totals: 17/17 rendered (0 unrenderable). PASS 11 / CONDITIONAL 4 / REJECT 2.**

---

## 1. `ecology/consumer-deer/deer.glb`

- **Screenshots**: `../../../review-screenshots/asset-acceptance-2026-08-18/biology-life/deer/deer-contact-sheet.png`
- **Taxonomy mapping**: `biology.json` → `ecology` (detailed) → `lowLevelItems`: Consumer, Prey. Correctly identified in the sourcing doc (§2, §5) as filling both roles for a future food-web builder. Confirmed correct.
- **Scientific relevance/accuracy**: A deer is a textbook herbivore consumer / prey organism; correct choice.
- **Mesh/material/texture quality**: 7 meshes, 7 materials, 2,098 triangles, no textures (flat material colors only, per license.json — confirmed by render). Faceted low-poly antlers/body/legs read cleanly at all 5 angles; the front, 3/4, and low-back angles all show a closed, gap-free silhouette — no visible backface holes.
- **Recognizability for a child audience**: Good — silhouette, antlers, four-legged stance, and coat coloring are immediately readable as "deer" even at low poly.
- **Style fit**: Flat-shaded low-poly "nature pack" look, consistent with the already-approved `quaternius-ultimate-nature` trees, but a visibly more stylized/gamey look than the Anatomy Atelier smooth-PBR reference. Acceptable as an ecology-diorama sub-style; should not be placed in the same shot as the smooth PBR anatomy organs.
- **Default camera framing / bounding-box sanity**: Auto-framing behaved correctly (bounding sphere fit at all angles). However, the model's own scale is a real integration problem: bounding box is ~4.26 m tall × 4.4 m long — a real deer is closer to ~1.2–2 m at the head. This is the same scale-convention issue flagged in the sourcing doc §5 ("re-check scale... before compositing into one scene"). Confirmed via render: needs a uniform scale-down (roughly ÷2 to ÷3) before it can share a scene with correctly-scaled objects.
- **Transparency/material faults**: None observed.
- **Animation**: `animations: []` (0) — confirmed both in the license.json validator and in this render's GLTF parse. The sourcing doc explains this was stripped during FBX→GLB conversion (assimp couldn't export the skinned rig; had to re-export as static geometry via OBJ). A idle/graze or walk cycle would clearly add engagement value for a "Consumer" food-web card, but the current file is permanently static — re-acquiring/re-rigging from the original pack (e.g. via Blender headless, as the sourcing doc suggests) would be required to get animation back, not a simple follow-up fix.
- **Performance**: 2,098 triangles, 207 KB file, 0 textures — trivially cheap.
- **Attribution**: CC0 1.0 (Quaternius). Not legally required, but project convention credits Quaternius in in-app/docs credits — carry that convention forward here too.
- **Verdict: CONDITIONAL** — asset quality and recognizability are good; blocking items before ship are the scale normalization (needed for any multi-organism scene) and a decision on whether static-only is acceptable for this card or animation must be re-sourced.

## 2. `ecology/predator-fox/fox.glb`

- **Screenshots**: `.../biology-life/fox/fox-contact-sheet.png`
- **Taxonomy mapping**: `ecology` → Predator. Confirmed correct; forms the intended predator/prey pair with Deer.
- **Scientific relevance/accuracy**: Correct predator exemplar (red fox); coloring (orange-red body, dark legs/ears, light tail tip) is scientifically accurate for a red fox.
- **Mesh/material/texture quality**: 5 meshes, 5 materials, 1,848 triangles, no textures. All 5 angles show a clean, closed mesh; the top-down and low-back angles reveal no gaps or z-fighting.
- **Recognizability for a child audience**: Very good — pointed ears, bushy tail, slender legs are all clear even at low poly, arguably the most recognizable asset in this batch.
- **Style fit**: Same note as Deer — flat low-poly, consistent within its own family, a different sub-style than the Anatomy Atelier PBR bar.
- **Default camera framing / bounding-box sanity**: Framing correct. Same scale-convention issue: bounding box ~2.57 m tall / 5.88 m long is oversized for a real fox (real shoulder height ~35–40 cm). Needs the same normalization pass as Deer, and the two should be re-scaled together so their *relative* size stays correct (current ratio deer:fox height ≈ 1.66:1; real-world ratio is closer to 3–4:1, so a naive per-asset auto-scale would make them read as same-sized animals — flag for whoever does the scale pass).
- **Transparency/material faults**: None observed.
- **Animation**: 0 animation channels, same cause (assimp skinning-export failure) as Deer. Same recommendation: an idle/trot cycle would add real value for a predator/prey interactive, but requires re-sourcing from the original rig.
- **Performance**: 1,848 triangles, 119 KB, 0 textures — trivially cheap.
- **Attribution**: CC0 1.0 (Quaternius), same convention as Deer.
- **Verdict: CONDITIONAL** — same profile as Deer: good asset, blocked on a scale-normalization pass (this time a *joint* pass with Deer to preserve relative scale) before multi-organism scenes.

## 3–7. Decomposer mushroom growth sequence

- **Screenshots**: `.../biology-life/mushroom-stage-{1,2,3,4,5-mature}/`
- **Taxonomy mapping**: `ecology` → Decomposer. Confirmed correct — before this wave there was no decomposer organism in the repo at all (per sourcing doc §1). The sourcing doc itself already flags that this sequence is "not scientifically labeled species stages... a stylized game-asset progression," which content authoring must not oversell as named botanical/mycological growth phases. This review is consistent with that caveat.
- **Mesh/material/texture quality (stages 1–4)**: 2 meshes / 2 materials each, no textures, triangle counts scale up sensibly with size (160 → 604 → 920 → 1,760). All render as a clean cap-on-stem silhouette with light spotting detail on the cap; no gaps or backface artifacts at any of the 5 angles, including the low/underside angle.
- **Recognizability**: Good — the classic "toadstool" cap-and-stem shape reads immediately as a mushroom, even without gill detail underneath.
- **Sequence coherence (stages 1–4)**: **Strong.** Height/cap-width both increase monotonically and the silhouette style stays identical across 1→4 (same stem taper, same cap-spot texture-by-material), so it reads as one organism growing — a genuinely good "compare it" candidate for the learning flow, for stages 1–4.
- **Stage 5 ("mature")**: **Breaks the sequence.** Bounding-box height collapses from ~40 units (stage 4) to ~12 units while width stays ~44 units — confirmed visually: stage 5 is a wide, flat, low disc with almost no visible stem, and its underside (captured in the low-back angle) is a completely flat, featureless olive plane with no gill or pore detail. This is not a taller/more-mature continuation of the standing mushroom in stages 1–4; the original filename `Mushroom_Crop.glb` (from the sourcing doc's file list) confirms it's the pack's separate "harvestable crop" asset, not a growth-stage pose of the same model family. Using it as "stage 5 of 5" would visually mislead a child into thinking a mushroom flattens into a plate as it matures, which isn't what the model is even depicting (it's clearly a distinct low, wide game-asset shape, not gill/cap ageing).
- **Transparency/material faults**: None on any stage.
- **Animation**: 0 channels on all 5, correctly matches license.json (Decomposer mushrooms were never expected to animate).
- **Performance**: All tiny (160–1,760 triangles, 12–113 KB) — negligible cost.
- **Attribution**: CC0 1.0 (Quaternius), same convention.
- **Verdicts**: stages 1–4 **PASS**; stage 5 **REJECT** for use as "growth stage 5" — recommend either (a) dropping stage 5 from the sequence and treating stages 1–4 as a complete-enough "young → near-mature" arc, or (b) re-scoping the existing stage-5 file as a separate "harvested mushroom" asset elsewhere in the taxonomy (not as part of this growth sequence), or (c) sourcing a true 5th "fully opened cap, gills visible" stage from the same or another CC0 pack.

## 8. `physiology-equipment/vintage-microscope.glb`

- **Screenshots**: `.../biology-life/vintage-microscope/vintage-microscope-contact-sheet.png`
- **Taxonomy mapping**: Sourced as general biology-lab equipment for "Microscope mode." The sourcing doc itself (§2 row for `human-physiology`) flags an unresolved ambiguity: `biology.json` lists "Microscope mode" under **Microbiology**'s `interactiveComponents`, not Human Physiology's — the sourcing doc placed the file under `physiology-equipment/` anyway and explicitly asked the coordinator to check for double-sourcing risk with a Microbiology-lane agent. Confirming this flag is still open and should be resolved (which branch actually owns this asset) before wiring it into any registry.
- **Scientific relevance/accuracy**: Excellent — a real, detailed antique brass microscope; correct focus wheel, eyepiece, stage, mirror/base details all present and identifiable.
- **Mesh/material/texture quality**: 9 meshes, 3 materials (2 unique after traversal), 3 real jpg textures (diffuse/normal/ARM), 20,631 triangles — the highest-fidelity asset in this batch by a wide margin, and the only genuinely PBR-textured one. Front/3-4/top-down angles all look excellent — sharp brass highlights, correct proportions, no visible seams or UV stretching.
- **Recognizability for a child audience**: Very good — instantly reads as "old microscope," more so than a generic modern lab microscope would.
- **Style fit**: **Real concern, flagged already in its own sidecar.** This is a photogrammetry-realistic PBR scan sitting in the same wave as 16 flat-color low-poly Quaternius assets — a hard style clash if ever shown side-by-side (e.g., a lab-equipment shelf next to the ecology diorama). Fine on its own as a standalone "Microscope mode" prop; needs an explicit art-direction call before pairing with anything else in this wave.
- **Default camera framing / bounding-box sanity**: Auto-framing worked correctly for all 5 angles. Scale is the opposite problem from Deer/Fox: bounding box is only ~0.4 m tall in this render vs. Poly Haven's stated ~0.4 m real-world scan height for the *original* — actually consistent here (the earlier "smaller than stated" flag in the sourcing doc's sidecar referred to the *raw accessor* bounding box before node-scale transforms; this render, which includes the full scene graph, gets ~0.4 m, matching Poly Haven's real-world figure). No scale fix needed for this one specifically — worth updating the sidecar's stale scale-mismatch note now that a real render confirms it's correct.
- **Transparency/material faults**: None observed on the visible-light angles.
- **Backside/underside lighting fault (new finding from this render)**: The low/back angle (`05-low-back.png`) renders almost entirely black — the app's two-light rig (both lights positioned front/top-ish) leaves the unlit rear of this dark-brass PBR material with no fill, and there's no environment/IBL map to give metals any ambient response. A child spinning this model 360° in auto-rotate would hit several seconds of a near-black silhouette. This is a shared-rig limitation exposed specifically by this asset's dark, metallic material (the flat-color Quaternius assets don't show this because their diffuse materials pick up the ambient light fine). Flag for whoever owns `GenericViewer.tsx`/the lighting rig — either add a low-intensity fill/rim light, or accept that dark-metal PBR assets need a brighter base-color variant.
- **Animation**: 0 channels — correct, a static lab prop needs no rig.
- **Performance**: 20,631 triangles / 837 KB — heaviest single asset in the wave, but still far under any reasonable per-asset budget (spec's "15 MB/hero-asset" ceiling), and the triangle count is fine for real-time.
- **Attribution**: CC0 1.0 (Poly Haven / Luis Jose Fernandez Rodriguez). Not legally required; Poly Haven asks for a courtesy credit — include "Vintage Microscope by Luis Jose Fernandez Rodriguez, Poly Haven, CC0" in credits.
- **Verdict: CONDITIONAL** — best-executed single model in the wave, but ships with three open items: (1) branch-ownership ambiguity (Microbiology vs. Human Physiology) needs a coordinator decision, (2) style-clash needs an explicit art-direction call before pairing with other assets, (3) the shared lighting rig leaves it near-black from behind.

## 9. `plants/flower/flower-stage-1-bud.glb`

- **Screenshots**: `.../biology-life/flower-stage-1-bud/flower-stage-1-bud-contact-sheet.png`
- **Taxonomy mapping**: `plants` → Flower (standalone low-level item) / growth-stage sequence, per sourcing doc §2.
- **Scientific relevance/accuracy**: **Mismatch between filename and rendered geometry.** All 5 angles show a simple two-blade leaf/sprout shape — a V of two thin pointed leaves on a short stem — with no bulb, sepal, or enclosed-bud silhouette anywhere. It is visually near-identical in structure to `corn-stage-1.glb` (also a two-blade seedling). Nothing in the render reads as a "flower bud"; a child shown this and told "this is a flower bud" would reasonably disagree.
- **Mesh/material/texture quality**: 1 mesh, 1 material, 80 triangles, no textures. Clean geometry, no defects — the shape itself is fine, just mismapped to "bud."
- **Recognizability for a child audience**: Reads as "a small green sprout," not as "a flower about to bloom."
- **Style fit**: Consistent with the rest of the Quaternius set.
- **Default camera framing / bounding-box sanity**: Framing fine. No scale red flags relative to the other flower stages.
- **Sequence coherence**: Once stage 2 (a genuine closed spike/bud shape, see below) is compared, stage 1 looks less like "step 1 of budding" and more like a mislabeled reuse of a generic seedling asset from the same pack family as the corn seedlings.
- **Transparency/material faults**: None.
- **Animation**: 0 channels, as expected.
- **Performance**: Negligible (80 triangles, 6.6 KB).
- **Attribution**: CC0 1.0 (Quaternius), same convention.
- **Verdict: CONDITIONAL** — the mesh itself is clean and cheap, but it doesn't visually satisfy its stated role ("bud"). Recommend either relabeling it honestly as a generic seedling/sprout stage (and moving the Flower sequence's first "true" stage to what's currently `flower-stage-2.glb`), or replacing it with a model that actually shows an enclosed bud.

## 10. `plants/flower/flower-stage-2.glb`

- **Screenshots**: `.../biology-life/flower-stage-2/flower-stage-2-contact-sheet.png`
- **Mesh/material/texture quality**: 1 mesh, 1 material, 42 triangles. Renders as a tall thin stem topped with a closed, pointed conical/spike shape — this is the most convincing "unopened bud" shape in the whole sequence, ironically more so than the file explicitly named "bud" (stage 1).
- **Recognizability**: Reads as "a bud about to open" reasonably well for a stylized low-poly asset.
- **Sequence coherence**: Strong step relative to stage 3 (opens into visible petals next).
- **Transparency/material/animation/performance**: No faults; 0 animation channels; 4.2 KB, negligible.
- **Verdict: PASS.**

## 11. `plants/flower/flower-stage-3.glb`

- **Screenshots**: `.../biology-life/flower-stage-3/flower-stage-3-contact-sheet.png`
- **Mesh/material/texture quality**: 2 meshes, 2 materials, 152 triangles. Shows a stem with a small leaf/bract and an opening flower head with 4–5 visible petals at the top — a clear visual step up from stage 2's closed spike.
- **Recognizability**: Reads as "an opening flower," good progression marker.
- **Color note**: Petals are a dark teal/blue-green — carried through from the earlier note on stage 4; flagged there rather than repeated per-stage.
- **Sequence coherence**: Good — clean step between stage 2 (closed) and stage 4 (fully open).
- **Transparency/material/animation/performance**: No faults; 0 animation channels; 11.2 KB, negligible.
- **Verdict: PASS.**

## 12. `plants/flower/flower-stage-4-bloom.glb`

- **Screenshots**: `.../biology-life/flower-stage-4-bloom/flower-stage-4-bloom-contact-sheet.png`
- **Mesh/material/texture quality**: 2 meshes, 2 materials, 230 triangles. Petals spread wider/flatter than stage 3 — a believable "full bloom" silhouette, plus a small leaf/bract on the stem for visual interest.
- **Recognizability**: Good bloom silhouette, but **the petal color is an unusual dark teal/blue-green** rather than a typical warm flower color (red/pink/yellow/white). For a children's-learning "what does a flower look like" component, this hurts at-a-glance recognizability — a child's mental model of "flower" skews toward warm colors, and this reads slightly closer to a stylized underwater plant or an anemone than a garden flower. Because these assets are untextured (material-color only, per license.json), this is a trivial one-line material-color fix at authoring/integration time (swap the base color), not a remodel.
- **Sequence coherence**: Good final step for stages 1(sprout)/2(bud)/3(opening)/4(bloom) — modulo the stage-1 mislabeling noted above.
- **Transparency/material/animation/performance**: No faults; 0 animation channels; 14.3 KB, negligible.
- **Verdict: PASS**, with a recolor recommendation flagged for content authoring, not blocking.

## 13–16. Corn growth sequence, stages 1–4

- **Screenshots**: `.../biology-life/corn-stage-{1,2,3,4}/`
- **Taxonomy mapping**: `plants` → "Seed → seedling → sprout → mature plant" growth-stage sequence. Confirmed correct and, per the sourcing doc, the first content this taxonomy item ever had.
- **Mesh/material/texture quality**: 1–3 meshes per stage, 1–3 materials, triangle counts scale sensibly with complexity (88 → 140 → 348 → 958). No textures (flat material colors), consistent with the rest of the Quaternius set. All render cleanly at all 5 angles with no gaps, no z-fighting, no backface holes.
- **Recognizability**: Excellent at every stage — stage 1 is unmistakably a two-blade grass/corn seedling, stage 2 a young leafy stalk, stage 3 a taller stalk with more leaves, and stage 4 a full stalk with visible husked ears and a tassel at the top. This is genuinely the strongest asset family in the whole wave.
- **Sequence coherence**: **Excellent.** Height and leaf count increase monotonically and continuously (bounding-box height ≈ 39 → 66 → 125 → 197 units), the stem/leaf style stays visually identical across all 4 stages, and stage 4 introduces the husk/ear/tassel detail exactly where a real observer would expect it. This is the single best "compare it" learning-flow candidate in the entire batch — recommend prioritizing this sequence for the germination/growth-stage component.
- **Transparency/material faults**: None on any of the 4 stages.
- **Animation**: 0 channels on all 4 — correct, static plant stages need no rig.
- **Performance**: All tiny (88–958 triangles, 7–64 KB) — negligible.
- **Attribution**: CC0 1.0 (Quaternius), same convention.
- **Verdicts**: stages 1, 2, 3, 4 all **PASS.**

## 17. `plants/growth-stage-corn/corn-stage-5-mature.glb`

- **Screenshots**: `.../biology-life/corn-stage-5-mature/corn-stage-5-mature-contact-sheet.png`
- **Mesh/material/texture quality**: 2 meshes, 2 materials, only 80 triangles — a huge drop from stage 4's 958. Renders at every angle as a stubby, elongated husk-wrapped shape lying on its side, green on one half and golden-tan (kernels) on the other, with no visible stalk, leaves, or tassel.
- **Sequence coherence**: **Breaks entirely.** This is not a taller, more-mature standing plant continuing stages 1–4 — bounding-box height collapses from ~197 units (stage 4, standing) to ~15 units (stage 5), while the asset itself is clearly a detached, husked corn cob viewed lying on its side, not a plant. Cross-referencing the sourcing doc's file list, the original filename was `Corn_Crop.glb` (the pack's separate "harvestable crop" asset) — the exact same pattern as the mushroom sequence's stage 5. Presenting this as "growth stage 5 of 5" would teach a child that a corn plant turns into a stubby husk-wrapped lump lying on the ground as it matures, which is not what's depicted and not botanically what happens (the plant keeps standing; the ear matures on the stalk).
- **Recognizability**: Recognizable as "an ear of corn" in isolation, just not as a continuation of the standing-plant sequence.
- **Transparency/material faults**: None.
- **Animation**: 0 channels.
- **Performance**: Negligible (80 triangles, 8 KB).
- **Attribution**: CC0 1.0 (Quaternius), same convention, if reused elsewhere.
- **Verdict: REJECT** for use as "growth stage 5" — recommend treating the corn sequence as a complete 4-stage arc (seedling → tasseled stalk), or re-scoping this file as a standalone "harvested corn cob" asset for a different taxonomy slot (e.g. illustrating the harvested product / a "parts of a corn plant" component), not as part of this growth-stage sequence.

---

## Cross-cutting notes for the coordinator

1. **Two sequence-ending assets are mismatched, not defective.** Both `mushroom-stage-5-mature.glb` and `corn-stage-5-mature.glb` are structurally sound, cleanly-modeled files — they are simply the wrong *object* for their stated role (both are the source pack's separate "harvestable crop" item, not a further growth pose of the same plant/fungus). Same root cause, same fix pattern: drop them from the growth sequence or re-scope them elsewhere.
2. **Deer/Fox need a joint scale-normalization pass**, not just individual rescaling — their current relative scale (deer ≈1.66× fox height) doesn't preserve real-world proportions (~3–4×), so a naive "auto-scale each to 1 unit" pass at integration would make them look like similarly-sized animals.
3. **The vintage microscope's branch ownership is still unresolved** ("Microscope mode" lives under Microbiology in `biology.json`, not Human Physiology) — this was already flagged as an open question in the sourcing doc and remains open after this visual pass; needs a coordinator decision before any registry wiring.
4. **The shared 2-light stage rig has a real backlighting blind spot** for dark/metallic PBR materials (demonstrated by the microscope's near-black low-back angle) that the flat-color low-poly assets don't expose. Worth a ticket against `GenericViewer.tsx`'s lighting setup independent of this specific asset.
5. **Flower petal color (teal/blue-green) reduces recognizability** for a children's "flower" concept; trivial one-line material-color fix since none of these are textured.
