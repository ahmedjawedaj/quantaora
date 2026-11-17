# Wave 25 Audit — Biology (read-only, 2026-08-18)

Sources read directly for this audit: `content/taxonomy/biology.json`, `content/subjects/biology/**`,
`quantaora-app/src/App.tsx`, `quantaora-app/src/data/hierarchy.ts`, `quantaora-app/src/data/modelRegistry.ts`,
`quantaora-app/src/data/allContent.ts`, `quantaora-app/src/data/branchModules.ts`,
`quantaora-app/src/data/organs.ts`, `quantaora-app/src/data/cells.ts`,
`quantaora-app/src/data/generated/{human_anatomy,cell_biology,human_physiology,genetics,plants,microbiology,ecology}.ts`,
`quantaora-app/src/routes/{PhysiologyLab,CellLab,GeneticsLab,PlantsLab,MicrobiologyLab,EcologyLab,BranchLab,Explore,Labs}.tsx`,
`quantaora-app/src/components/explorer/ContentNav.tsx`.

No source/asset files were edited. Percentages/status claims below come from reading current code, not from
older docs. Where an older doc is cited for context it is explicitly labeled "prior audit claimed...".

## 0. Branch-level map (content/taxonomy/biology.json × hierarchy.ts)

Biology has **12 branches** in the taxonomy. **7 are `status: "live"`** with a route in `hierarchy.ts`; **5 are
`status: "planned"`, `"detailed": false`, and have no `content/subjects/biology/<branch>/` folder at all** (verified
by `ls content/subjects/biology/` → only `cell-biology, ecology, genetics, human-anatomy, human-physiology,
microbiology, plants` exist; `evolution, animals, health-and-disease, neuroscience, biochemistry-foundations` do
not).

| Branch | status | route (hierarchy.ts) | componentCount (hierarchy.ts) |
|---|---|---|---|
| cell-biology | live | `/app/labs/cells` (CellLab.tsx) | 8 |
| human-anatomy | live | `/app` (index route → Explore.tsx) | 9 |
| human-physiology | live | `/app/labs/physiology` (PhysiologyLab.tsx) | 9 |
| genetics | live | `/app/labs/genetics` (GeneticsLab.tsx) | 10 |
| ecology | live | `/app/labs/ecology` (EcologyLab.tsx) | 11 |
| plants | live | `/app/labs/plants` (PlantsLab.tsx) | 9 |
| microbiology | live | `/app/labs/microbiology` (MicrobiologyLab.tsx) | 5 |
| evolution | planned | none | 0 (no content) |
| animals | planned | none | 0 (no content) |
| health-and-disease | planned | none | 0 (no content) |
| neuroscience | planned | none | 0 (no content) |
| biochemistry-foundations | planned | none | 0 (no content) |

All 5 planned branches surface as a locked row with a `Lock` icon reading **"Coming soon"** in
`ContentNav.tsx` (lines ~112–121, `b.status === 'live' && b.route ? <Link>… : <div>…Coming soon</div>`) whenever
any live biology lab's sidebar is open, and as a "Coming soon" badge (`Clock` icon) in `Subjects.tsx`. **61**
components across the 7 live branches make up the routed, learner-reachable biology library
(8+9+9+10+11+9+5 = 61). This matches `hierarchy.ts` `componentCount` fields exactly.

**Important structural finding:** none of the 61 routed biology components render through the generic
`BranchLab.tsx` fallback in normal navigation. Every live biology branch has its own flagship lab component
(`PhysiologyLab`/`CellLab`/`GeneticsLab`/`PlantsLab`/`MicrobiologyLab`/`EcologyLab`), and `human-anatomy`'s
`hierarchy.ts` route is `/app` (Explore.tsx, not `labs/branch/:branchId`). `BranchLab.tsx` (`App.tsx` line 60,
path `labs/branch/:branchId`) is dead code for biology in the shipped UI — it is only reachable by typing a URL
like `/app/labs/branch/cell-biology` or `/app/labs/branch/human-anatomy` directly, since `BranchLab.tsx`'s own
lookup (`Object.values(HIERARCHY).find(h => h.branches.some(b => b.id === branchId))`, line 87-89) does not check
`status === 'live'` or that `branch.route` actually points at `BranchLab`. See §7 for what that dead path would
render if hit directly.

## 1. cell-biology — `/app/labs/cells` (CellLab.tsx)

**8 routed components** (`src/data/cells.ts`): `animal-cell, plant-cell, bacterial-cell, neuron, red-blood-cell,
muscle-cell, sperm-cell, egg-cell`. These are the taxonomy's `groupings` (specialized cell types), matching the
spec's own `mvpModule` exactly (`content/taxonomy/biology.json` lines 5-11: skills `cell-membrane, nucleus,
mitochondrion, cytoplasm, ribosome, plant-vs-animal-cell`; interactions `3D cell, hotspots, isolate organelles,
compare plant and animal cells, label drag task`) — individual organelles (nucleus, mitochondrion, etc.) are
explored as **hotspots inside each cell-type scene**, not as separate top-level components, which matches the
spec's stated interaction design.

- **Real GLB (default view):** `animal-cell` → `/models/cells/animal-cell-authored.glb` (hero, CLEAR,
  project-authored, `scripts/assets/build-cell-glbs.mjs`) and `neuron` → `/models/cells/neuron-authored.glb`
  (hero, CLEAR, project-authored). Both have an embedded animation (pulse/signal) per registry notes.
- **Procedural (no GLB):** `plant-cell, bacterial-cell, red-blood-cell, muscle-cell, sperm-cell, egg-cell` — per
  `CellLab.tsx`'s own footer note (line 367): "Animal Cell and Neuron now use project-owned animated GLBs. The
  rest are procedurally built: membrane and organelles rendered as real 3D geometry."
- **Interaction depth:** rotate (OrbitControls autoRotate default on), hotspot click → isolate/dim
  (`activeOrganelleId`), xray toggle, label toggle, Compare modal (`compareCandidate`), and a bespoke **"Cause &
  effect: trace it"** guided step-through (`PROCESS_TRACE`, lines 71-149) unique per cell type (e.g. animal-cell
  traces DNA → ribosome → ER → Golgi → mitochondrion → lysosome), each step tied to a real hotspot ID and a
  Predict/Reveal interaction.
- **Registered-but-unused asset:** `/models/cells/bacteria-wall-nih.glb` (support, CLEAR, NIH 3D 3DPX-010752,
  componentId `cell-wall`) is in `modelRegistry.ts` but `cell-wall` is not one of CellLab's 8 live components —
  it is only reachable through the orphaned `generated/cell_biology.ts` path (§7).

## 2. human-anatomy — `/app` (Explore.tsx + OrganViewer)

**9 routed organs** (`src/data/organs.ts`): `heart, brain, lungs, liver, kidneys, eyeball(Eye), intestine,
pancreas, skin`. **This branch is APPROVED per instructions — reported factually, not flagged for re-sourcing.**

- **Real GLB (default view, all 9):** `/models/{heart,brain,lungs,liver,kidneys,eyeball,intestine,pancreas,
  skin}.glb`. All 9 share `licenseStatus: 'REVIEW'`, `qualityTier: 'hero'`, `replaceBeforePaidLaunch: true`, and
  the same registry note: *"Current anatomy-quality baseline. Provenance must be verified before any paid
  launch."* This is a factual, existing flag in the registry itself (not a new finding) — provenance/licence
  paperwork, not asset quality, is the open item.
- **Interaction depth:** hotspot markers (3-6 per organ, hand-placed coordinates), isolate, xray, Compare modal
  (each organ has a `compareCandidate`, e.g. heart↔lungs, brain↔eye), full lesson steps + 4-question quiz per
  organ, `didYouKnow`/`conditions` panels.
- **Content-vs-code gap:** `content/subjects/biology/human-anatomy/` has **16 authored component folders**
  (adds `blood-vessels, bones, ear, muscles, spleen, stomach, large-intestine, small-intestine` on top of the 9
  live organs — `intestine` in `organs.ts` is a single merged organ where the authored content instead splits it
  into `large-intestine`/`small-intestine`). All 16 are codegen'd into
  `src/data/generated/human_anatomy.ts` (verified: 16 `"id"` entries) — but only 9 of those 16 are ever rendered,
  because `Explore.tsx` uses `organs.ts` directly, not the generated file. The other 8
  (`blood-vessels, bones, ear, muscles, spleen, stomach, large-intestine, small-intestine`) are only reachable via
  the dead `BranchLab.tsx` route (§0, §7) and their `model` field points to
  `/assets/models/biology/human-anatomy/<slug>/<slug>.glb`, which is **not in `MODEL_ASSETS`** (i.e.
  `resolveAuthoredAsset` returns `status: 'missing'`) — they would render as GenericViewer's procedural fallback
  keyed on `content.visual.shape` (e.g. `blood-loop` for blood-vessels) if ever exposed.

## 3. human-physiology — `/app/labs/physiology` (PhysiologyLab.tsx)

**9 routed components** (`src/data/generated/human_physiology.ts`): `breathing, blood-circulation, digestion,
kidney-filtration, muscle-contraction, nerve-signaling, hormone-signaling, immune-response,
temperature-regulation`.

- **Visual:** 100% procedural three.js (no GLB registered for any `human-physiology` `componentIds` in
  `modelRegistry.ts`) — body silhouette + per-process particle-flow scenes (`BloodScene, BreathingScene,
  DigestionScene, KidneyScene, NerveScene, MuscleScene, HormoneScene, ImmuneScene, TemperatureScene`, one
  dedicated scene function per process).
- **Interaction depth:** this is the deepest cause/effect interaction of any biology branch — a "Tune body" panel
  with two sliders (signal/load) that drives a real derived-output readout (`tuningCopy()`, e.g. heart rate/bpm,
  oxygen pickup %, urine color) plus a **guided Predict-then-Check** flow (`GUIDED_CHALLENGES`, one per process,
  each with a concrete right/wrong prediction and explanation) and a stage-strip hotspot sequence
  (`StageStrip`). Isolate/xray/labels/animation-toggle/Compare all present via `CanvasControls`.
- No "coming soon" gating; no reused visuals across processes (each of the 9 has its own dedicated scene
  geometry).

## 4. genetics — `/app/labs/genetics` (GeneticsLab.tsx)

**10 routed components** (`src/data/generated/genetics.ts`): `allele, chromosome, dna, dna-replication, gene,
mutation, protein, trait, transcription-translation`, plus a Punnett-square inheritance component (10th id,
confirmed present via generated-file id count).

- **Real GLB:** only `dna` → `/models/biology/genetics/dna-b-form-double-helix-nih.glb` (hero, **ATTRIB**, NIH 3D
  3DPX-014287, derived from RCSB PDB 1BNA — attribution string required per registry notes). This is **not the
  default view**: `DnaScene` (procedural helix with clickable A-T/C-G rungs) is the default; the real GLB only
  appears via `DnaRealStructureScene`, toggled from a "Tune molecule" control (`RealDnaHelixModel`,
  `DnaGlbErrorBoundary` handles load failure).
- **Procedural (all other 9):** chromosome (arm/centromere primitives), allele (colored block pair), trait
  (procedural flower + genotype card), Punnett grid, mutation (rebuilt DNA rungs per mutation type: substitution/
  insertion/deletion, with frameshift codon-readout labels), transcription (mRNA strand + codon readout),
  protein (amino-acid chain, folded/unfolded toggle), dna-replication (fork-separation animation).
- **Interaction depth:** hotspot/marker click-to-select on nearly every scene, isolate-dim, labels toggle
  (reveals structural chip labels), and for mutation specifically a genuinely simulated effect (substitution vs.
  insertion vs. deletion actually changes sequence length and downstream codon framing, not just a label swap).

## 5. plants — `/app/labs/plants` (PlantsLab.tsx)

**9 routed components** (`src/data/generated/plants.ts`): `chloroplast, flower, leaf, phloem, root, seed, stem,
stomata, xylem`.

- **Real GLB, but only behind a "real growth" toggle, not the default view:**
  - `flower` → `flower-stage-2.glb, flower-stage-3.glb, flower-stage-4-bloom.glb` (support, CLEAR, Quaternius
    Ultimate Crops Pack) — `FlowerGrowthScene`, 3-stage sequence, only shown when `showRealGrowth` is toggled;
    default is the procedural `FlowerScene` (stem/petals/stamen/pistil primitives + pollination animation).
  - `seed` → `corn-stage-1.glb … corn-stage-4.glb` (support, CLEAR, Quaternius) — `CornGrowthScene`, 4-stage
    sequence, same toggle pattern. **Labeling mismatch:** the taxonomy component is "Seed" (germination), but the
    real-growth GLBs are literally a corn-plant growth sequence (seedling → mature stalk), not a seed/germination
    asset. The in-app copy self-flags this: `ChipLabel` text reads *"Stylized reference model — not a labeled
    botanical stage"* (PlantsLab.tsx line ~983).
  - Registry note on `flower-stage-4-bloom.glb`: petals render "an unusual dark teal/blue-green rather than a warm
    flower color" — `PlantsLab.tsx`'s `warmTealMaterials()` (lines 350-364) recolors this at runtime as a
    mitigation, not a source-asset fix.
- **Procedural only:** `chloroplast, leaf, phloem, root, stem, stomata, xylem` (all 7 use hand-built
  sphere/BeadTube/cylinder primitives — grana stacks for chloroplast, veins+stomata pore for leaf, sugar-flow
  BeadTubes for phloem, taproot+laterals for root, xylem water-rise flow for root/stem, etc).
- **Interaction depth:** variable-driven simulation is genuinely causal — e.g. `seedSuitability(water, warmth,
  nutrients)` and `photosynthesisRate(light, co2)` drive visible stall/growth/sugar-output changes, with a
  per-component Observe/Predict/Change/Explain/Check text block (`getChallenge()`).

## 6. microbiology — `/app/labs/microbiology` (MicrobiologyLab.tsx)

**5 routed components** (`src/data/generated/microbiology.ts`): `bacteria, virus, fungus, protozoa, microbiome`.

- **`virus` has 3 distinct visual states**, all behind a toggle in the Tune panel; none is a straightforward
  single "real vs procedural" split:
  1. **Default = procedural**: `VirusCapsidModel` (icosahedron + radial spike cones) drives the default
     infection-cycle scene (`VirusScene`, attach → inject → replicate → burst). The code comment (lines 361-368)
     explains why: the registered real poliovirus capsid GLB
     (`/models/biology/microbiology/virus-polio-capsid-nih-optimized.glb`, hero, CLEAR, NIH 3D 3DPX-001519) has
     **no recorded visual-acceptance PASS** per `docs/assets/reviews/biology-cell-visual.md` — so it sits in
     `MODEL_ASSETS` **registered but never actually loaded anywhere in the shipped UI**.
  2. **"Whole virion" real GLB**: `/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb` (hero, CLEAR,
     NIH 3D 3DPX-000030).
  3. **"Cutaway" real GLB**: `/models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb`
     (hero, ATTRIB — CC-BY 4.0, NIH 3D 3DPX-013373) — the branch's cross-section/cutaway support (spec §13).
- **Procedural only:** `bacteria, fungus, protozoa, microbiome` — binary-fission step scene (bacteria), mycelium/
  fruiting-body scene with spore/yeast toggles (fungus), amoeba pseudopod/food scene (protozoa), colony-dot scene
  (microbiome).
- **Interaction depth:** step-through infection/division cycles (`BACTERIA_STAGES`, `VIRUS_STAGES`) plus variable
  sliders that visibly change geometry (e.g. fungus moisture → mycelium `reach`/spore count; protozoa food
  availability → pseudopod reach); guided Observe/Predict/Change/Explain/Check prompts per component
  (`GUIDED_PROMPTS`).

## 7. ecology — `/app/labs/ecology` (EcologyLab.tsx)

**11 routed components** (`src/data/generated/ecology.ts`): `community, consumer, decomposer, ecosystem, habitat,
niche, organism, population, predator, prey, producer`.

- **Real GLB — but shared as background dressing across ALL 11 components, not distinct per component.**
  `EcosystemDiorama` (the single scene function used for every one of the 11 `componentId` values) unconditionally
  renders `SupportGlb` for **both** `/models/biology/ecology/ecosystem.glb` (support, CLEAR, Quaternius Ultimate
  Nature Pack) **and** `/models/biology/ecology/producer.glb` (support, CLEAR, Quaternius) at fixed positions with
  opacity ~0.32-0.34, regardless of which of the 11 components is selected (`EcologyLab.tsx` lines 1081-1096). The
  only per-component difference is which procedural cluster is dimmed/undimmed via `dim(focus)` when Isolate is
  active — **this is a direct "same visual reused across multiple components" case**: `community, consumer,
  ecosystem, habitat, niche, organism, population, predator, prey, producer` (10 of the 11) all show the identical
  `ecosystem.glb` + `producer.glb` backdrop; only `decomposer` gets a distinctly-its-own hero treatment.
- **`decomposer` real GLB (genuine per-component hero):** `DecomposerMushroomHero` renders one of
  `decomposer-mushroom-stage-1.glb … stage-4.glb` (support, CLEAR, Quaternius Ultimate Crops Pack) driven by a
  dedicated growth-stage slider (`GrowthStageControl`, stage 1-4, with cap-width-cm/age-days readout) — this is
  the only ecology component with a real GLB that is actually distinct to it.
- **Procedural (all 11):** producer clusters, prey/predator clusters (count driven by simulated
  `computeEcosystemState`), waste pile, habitat layer, niche ring, `EnergyWeb` flow lines.
- **Interaction depth:** the richest scenario system in biology — 4 named preset scenarios (**Drought, Predator
  boom, Recycling stalls, Habitat loss**) each running a full 5-step Observe→Predict→Change→Explain→Check flow
  with a real multiple-choice check and correct/incorrect feedback (`SCENARIOS`, `ScenarioPanel`), on top of 4 live
  sliders (sunlight, predator pressure, decomposer activity, habitat stress) that drive a single shared cascading
  simulation (`computeEcosystemState`) feeding every component's readout text.

## 8. Orphaned/authored-but-unreachable content (found via content/subjects/biology vs. generated/*.ts vs. routes)

- **`vacuole`** (`content/subjects/biology/cell-biology/vacuole/`) has a full authored set —
  `module.json, lesson.md, quiz.json, model-metadata.json, glossary.json, standards.json` — but is **absent from
  `generated/cell_biology.ts`** entirely (verified: no `"id": "vacuole"` in that file, only prose mentions of
  "vacuole" inside the `cell-wall` entry's text). It has **zero code exposure** anywhere in the app — not even via
  the dead BranchLab path. This is the one true "written but never surfaces" case found in biology.
- **`generated/cell_biology.ts`** has **20** `ComponentContent` entries (the 8 live cell types + 12 individual
  organelles: `cell-membrane, cell-wall, chloroplast, cytoplasm, cytoskeleton, dna, endoplasmic-reticulum,
  golgi-apparatus, lysosome, mitochondrion, nucleus, ribosome`) — all fully authored in
  `content/subjects/biology/cell-biology/`, all codegen'd, but only reachable via the dead
  `/app/labs/branch/cell-biology` URL (§0), never linked in the UI. These same organelles are already
  appropriately explorable as **hotspots inside CellLab's 8 live cell-type scenes** — so the 12 standalone
  duplicates are redundant authoring/build output, not a learner-facing content gap.
- **`generated/human_anatomy.ts`** has 8 organs (`blood-vessels, bones, ear, muscles, spleen, stomach,
  large-intestine, small-intestine`) fully authored in `content/subjects/biology/human-anatomy/` and codegen'd,
  reachable only via the same dead `/app/labs/branch/human-anatomy` URL, with `model` paths that don't resolve in
  `modelRegistry.ts` (§2).

## 9. Mobile reachability (390×844), from code

All 6 dedicated biology labs plus `BranchLab.tsx` share one consistent responsive pattern: the 3D stage carries
`data-lab-stage` and a fixed-viewport-height class on mobile that switches to `lg:h-auto lg:flex-1` on desktop —
`PhysiologyLab`/`EcologyLab`/`MicrobiologyLab`/`GeneticsLab` use `h-[56svh] shrink-0 lg:h-auto lg:flex-1`;
`CellLab`/`BranchLab` use `h-[46svh] shrink-0 lg:h-auto lg:flex-1`; `PlantsLab` uses `flex min-h-[300px] shrink-0
flex-col lg:min-h-[380px] lg:flex-1` with an explicit Wave-15 code comment about the Tune panel becoming a
`max-h-[24svh]` real flex sibling instead of an overlay specifically to fix a prior mobile-clipping bug. The
`ContentNav` desktop sidebar is `hidden … lg:block`, replaced on mobile by a horizontal-scroll chip strip
(`lg:hidden`) rendered in every biology lab's right-hand panel — confirmed present in `EcologyLab.tsx` (lines
586-627), `CellLab.tsx`/`BranchLab.tsx`/others use the equivalent component-switcher pattern. All bottom
controls (Tune panel, meters) are `absolute bottom-3 left-3 right-3` with internal `overflow-y-auto` and
`max-h-[42svh]`/`max-h-[46svh]` caps. This is a consistent, mobile-aware layout pattern across all of biology, not
a per-branch risk — no biology-specific mobile-layout code smell was found (this is a code-level read, not a
live-viewport screenshot verification).

## 10. P0 vs P1 completion needs

- **P1 — ecology visual differentiation:** 10 of 11 ecology components share an identical `ecosystem.glb` +
  `producer.glb` background composition (§7); a learner clicking through community → consumer → niche → habitat
  sees the same diorama every time, differentiated only by dimming and side-panel text. Worth a distinct visual
  treatment per component (or at minimum per taxonomy sub-group) to avoid the "did the model even change" feel.
- **P1 — plants "seed" real-growth mismatch:** the `seed` component's real-growth toggle shows a **corn plant**
  growth sequence, not a seed/germination sequence (§5) — self-flagged in-app copy softens this, but the asset
  concept doesn't match the taxonomy component name.
- **P1 — cleanup/dead-code:** `BranchLab.tsx` is unreachable dead code for all of biology (§0); the 20-entry
  `generated/cell_biology.ts` and 16-entry `generated/human_anatomy.ts` are >90% unused duplicate content builds;
  `vacuole` is fully authored and 100% unreachable (§8). None of these block a learner today (nothing links to
  them), but they represent real authoring effort with zero current payoff and should be either wired up or
  pruned from codegen.
- **P0 — none found that block the *live, routed* 61-component biology experience.** Every routed component has a
  working visual (real GLB or an intentional, functioning procedural scene) and passes through a flagship lab
  with real interaction depth (isolate/xray/labels/compare/lesson/quiz at minimum, often more). The only
  standing P0-adjacent item is the human-anatomy asset licence-provenance flag already carried in
  `modelRegistry.ts` (`licenseStatus: 'REVIEW'`, `replaceBeforePaidLaunch: true`) — a legal/paperwork blocker for
  paid launch, not a visual-quality problem, and out of scope per this audit's instruction not to flag Anatomy
  assets for re-sourcing.

## Summary table

| Metric | Count |
|---|---|
| Total biology components counted (routed, live) | **61** |
| — with a dedicated flagship-lab route (not generic BranchLab) | **61 / 61** |
| — with a real authored GLB as the *default* view | **12** (9 human-anatomy organs + animal-cell + neuron + decomposer) |
| — with a real GLB only behind an optional toggle (procedural is default) | **4** (dna, virus, flower, seed) |
| — with a real GLB only as shared low-opacity background dressing (not distinctly theirs) | **10** (all ecology components except decomposer) |
| — fully procedural, no GLB touchpoint at all | **35** |
| — "Coming soon" / locked (branch-level; 0 components each) | **5 branches** (evolution, animals, health-and-disease, neuroscience, biochemistry-foundations) → **0 components** |
| — reusing another component's visual (near-identical shared composition) | **10** (ecology, see above) + orphaned duplicates: 12 cell-biology organelles + 8 human-anatomy organs authored but unreachable via any linked route |

Note: the GLB-status rows (12 / 4 / 10 / 35) sum to 61 and are mutually exclusive by construction (each
component classified by its *most real* touchpoint). The polio-capsid virus GLB registered in `modelRegistry.ts`
is not counted anywhere above because it is never actually loaded by any component (§6).
