# Wave 25 Asset-Utilization Audit — Quantaora 3D Model Registry

Read-only audit. Date: 2026-08-18. Scope: `quantaora-app/src/data/modelRegistry.ts` (`MODEL_ASSETS`,
66 entries) cross-checked against `quantaora-app/public/models/` on disk (174 `.glb` files) and
every route/component file that consumes a `componentId` or model URL. All claims below are from
direct inspection of the current registry/filesystem/source tree during this session — no claim is
copied from `docs/COVERAGE-AUDIT-2026-08-18.md`, `docs/QUALITY-GAP-MATRIX.md`,
`docs/ASSET-LICENSES.md`, `docs/3D-ASSET-QUALITY-GATE.md`, or `docs/PROJECT-STATUS.md` (those are
cited only where explicitly labeled "prior audit claimed...", which does not occur in this report —
none were consulted for conclusions).

No files were edited. This report only lists findings for other agents/maintainers to act on.

---

## 1. Full `MODEL_ASSETS` enumeration (66 entries)

`grep -c "url: '/models" src/data/modelRegistry.ts` → **66**. Status/tier tally from the file
itself:

- `licenseStatus`: CLEAR = 53, ATTRIB = 4, REVIEW = 9, NC-RISK = 0
- `qualityTier`: hero = 46, support = 20, preview = 0
- `replaceBeforePaidLaunch: true` = 9 — and it is **exactly** the 9 REVIEW-status human-anatomy
  organs (verified by cross-tabulating the flag against `licenseStatus` per record; see §7).

Full per-asset table (url · subject/branch · componentIds · licenseStatus · qualityTier ·
replaceBeforePaidLaunch · reachable-from-a-live-route, per §2):

| # | url | subject/branch | componentIds | license | tier | RBPL | Reachable? |
|---|---|---|---|---|---|---|---|
| 1 | `/models/brain.glb` | biology/human-anatomy | brain | REVIEW | hero | yes | YES (Explore.tsx, `/app`) |
| 2 | `/models/eyeball.glb` | biology/human-anatomy | eye | REVIEW | hero | yes | YES (Explore.tsx) |
| 3 | `/models/heart.glb` | biology/human-anatomy | heart | REVIEW | hero | yes | YES (Explore.tsx) |
| 4 | `/models/intestine.glb` | biology/human-anatomy | intestine | REVIEW | hero | yes | YES (Explore.tsx) |
| 5 | `/models/kidneys.glb` | biology/human-anatomy | kidneys | REVIEW | hero | yes | YES (Explore.tsx) |
| 6 | `/models/liver.glb` | biology/human-anatomy | liver | REVIEW | hero | yes | YES (Explore.tsx) |
| 7 | `/models/lungs.glb` | biology/human-anatomy | lungs | REVIEW | hero | yes | YES (Explore.tsx) |
| 8 | `/models/pancreas.glb` | biology/human-anatomy | pancreas | REVIEW | hero | yes | YES (Explore.tsx) |
| 9 | `/models/skin.glb` | biology/human-anatomy | skin | REVIEW | hero | yes | YES (Explore.tsx) |
| 10 | `/models/cells/animal-cell-authored.glb` | biology/cell-biology | animal-cell | CLEAR | hero | – | YES (`src/data/cells.ts` → CellLab.tsx, `/app/labs/cells`) |
| 11 | `/models/cells/bacteria-wall-nih.glb` | biology/cell-biology | cell-wall | CLEAR | support | – | **NO — ORPHAN** (§3.1) |
| 12 | `/models/cells/neuron-authored.glb` | biology/cell-biology | neuron | CLEAR | hero | – | YES (`src/data/cells.ts` → CellLab.tsx) |
| 13 | `/models/biology/genetics/dna-b-form-double-helix-nih.glb` | biology/genetics | dna | ATTRIB | hero | – | YES (GeneticsLab.tsx line 280, `/app/labs/genetics`) |
| 14 | `/models/biology/microbiology/virus-polio-capsid-nih-optimized.glb` | biology/microbiology | virus | CLEAR | hero | – | **NO — ORPHAN** (§3.2) |
| 15 | `/models/chemistry/atoms-and-elements/atom.glb` | chemistry/atoms-and-elements | atom | CLEAR | hero | – | YES (`generated/atoms_and_elements.ts` → AtomsLab.tsx, `/app/labs/atoms`) |
| 16 | `/models/space/bp-tauri.glb` | space/stars | protostar | CLEAR | hero | – | YES (`src/data/stars.ts` → StarsLab.tsx, `/app/labs/stars`) |
| 17 | `/models/space/cassiopeia-a-supernova.glb` | space/stars | supernova-remnant | CLEAR | hero | – | YES (stars.ts `cassiopeia-a`, StarsLab.tsx) |
| 18 | `/models/space/cygnus-loop-supernova.glb` | space/stars | supernova-remnant | CLEAR | hero | – | YES (stars.ts `cygnus-loop`, StarsLab.tsx) |
| 19 | `/models/space/g292-supernova-remnant.glb` | space/stars | supernova-remnant | CLEAR | hero | – | YES (stars.ts `g292`, StarsLab.tsx) |
| 20 | `/models/space/crab-nebula.glb` | space/stars | nebula | CLEAR | hero | – | YES (stars.ts `crab-nebula`, StarsLab.tsx) |
| 21 | `/models/biology/ecology/producer.glb` | biology/ecology | producer | CLEAR | support | – | YES (EcologyLab.tsx:1094, `SupportGlb`) |
| 22 | `/models/biology/ecology/ecosystem.glb` | biology/ecology | ecosystem | CLEAR | support | – | YES (EcologyLab.tsx:1086, `SupportGlb`) |
| 23–31 | `/models/space/planets/{earth,venus,mars,jupiter,saturn,uranus,neptune,pluto,ceres}.glb` | space/solar-system | space-planet-* | CLEAR | hero | – | YES (`src/data/planets.ts` → SpaceLab.tsx / OrbitSandbox, `/app/labs/orbit`), all 9 |
| 32–35 | `/models/biology/ecology/decomposer-mushroom-stage-{1..4}.glb` | biology/ecology | ecology-decomposer-mushroom-stage-{1..4} | CLEAR | support | – | YES (`generated/ecology.ts` `decomposerGrowthStages` → EcologyLab.tsx:54,392,548), all 4 |
| 36–38 | `/models/biology/plants/flower-stage-{2,3,4-bloom}.glb` | biology/plants | plants-flower-stage-* | CLEAR | support | – | YES (`generated/plants.ts` → PlantsLab.tsx `GrowthStageModelView`), all 3 |
| 39–42 | `/models/biology/plants/corn-stage-{1..4}.glb` | biology/plants | plants-corn-stage-* | CLEAR | support | – | YES (same path, `growthStageModels`), all 4 |
| 43 | `/models/chemistry/molecules/water.glb` | chemistry/molecules-and-bonding | chem-molecule-water | CLEAR | hero | – | **NO — ORPHAN** (§3.3) |
| 44 | `/models/chemistry/molecules/carbon-dioxide.glb` | chemistry/molecules-and-bonding | chem-molecule-carbon-dioxide | CLEAR | hero | – | YES (`molecules.ts:307` → ChemistryLab.tsx, `/app/labs/molecules`) |
| 45 | `/models/chemistry/molecules/methane.glb` | chemistry/molecules-and-bonding | chem-molecule-methane | CLEAR | hero | – | YES (`molecules.ts:419`) |
| 46 | `/models/chemistry/molecules/sodium-chloride-lattice.glb` | chemistry/molecules-and-bonding | chem-molecule-sodium-chloride-lattice | CLEAR | hero | – | YES (`molecules.ts:554`) |
| 47 | `/models/chemistry/chemical-reactions/bunsen-burner.glb` | chemistry/chemical-reactions | apparatus-bunsen-burner | CLEAR | hero | – | YES (ChemicalReactionsLab.tsx:47, `/app/labs/reactions`) |
| 48 | `.../crystal-diamond-carbon-nih-material-fixed.glb` | chemistry/crystal-structures | chem-crystal-diamond | CLEAR | hero | – | YES (`crystals.ts:34-35` → ChemistryLab.tsx `crystals` tab) |
| 49 | `.../crystal-silicon-carbide-2h-nih-material-fixed.glb` | chemistry/crystal-structures | chem-crystal-silicon-carbide | CLEAR | hero | – | YES (`crystals.ts:164-165`) |
| 50 | `.../crystal-graphite-sheet-nih-material-fixed.glb` | chemistry/crystal-structures | chem-crystal-graphite | ATTRIB | hero | – | YES (`crystals.ts:304-305`) |
| 51 | `/models/physics/electricity/wire-cable-set.glb` | physics/electricity | physics-electricity-wire-cable-set | CLEAR | support | – | YES (ElectricityLab.tsx:318, `/app/labs/electricity`) |
| 52 | `.../physics-mechanics-wave2/baseball-polyhaven.glb` | physics/mechanics | physics-mechanics-baseball | CLEAR | support | – | YES (PhysicsLab.tsx:67, `/app/labs/motion`) |
| 53 | `.../physics-mechanics-wave2/measuring-tape-polyhaven.glb` | physics/mechanics | physics-mechanics-measuring-tape | CLEAR | support | – | YES (PhysicsLab.tsx:68) |
| 54 | `.../physics-energy-wave2/generator.glb` | physics/energy | physics-energy-generator | CLEAR | hero | – | YES (`generated/energy.ts:1384` → EnergyLab.tsx, `/app/labs/energy`) |
| 55 | `.../physics-energy-wave2/multimeter.glb` | physics/energy | physics-energy-multimeter | CLEAR | support | – | YES (`generated/energy.ts:1392`) |
| 56 | `.../physics-energy-wave2/electric-stove.glb` | physics/energy | physics-energy-electric-stove | CLEAR | hero | – | YES (`generated/energy.ts:1400`) |
| 57 | `.../math-wave2/measuring-cup-milkandbanana.glb` | math/measurement | math-measurement-measuring-cup | CLEAR | support | – | YES (MathManipulativesLab.tsx:47, `/app/labs/math-manipulatives`) |
| 58 | `.../math-wave2/abacus-soroban-bruno-oliveira.glb` | math/number-and-arithmetic | math-number-and-arithmetic-abacus | ATTRIB | support | – | **NO — ORPHAN** (§3.4) |
| 59 | `.../biology-gaps-wave2/virus-influenza-whole-nih.glb` | biology/microbiology | biology-microbiology-virus-influenza-whole | CLEAR | hero | – | YES (MicrobiologyLab.tsx `VIRUS_WHOLE_MODEL_URL`, `/app/labs/microbiology`) |
| 60 | `.../biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb` | biology/microbiology | biology-microbiology-virus-influenza-cutaway | ATTRIB | hero | – | YES (MicrobiologyLab.tsx `VIRUS_CUTAWAY_MODEL_URL`) |
| 61–65 | `.../sourced/space/{enceladus,europa,io,titan,moon-earth}-optimized.glb` | space/moons | space-moon-* | CLEAR | hero | – | YES (`src/data/moons.ts` → MoonsLab.tsx, `/app/labs/moons`), all 5 |
| 66 | `.../sourced/space/mercury-optimized.glb` | space/solar-system | space-planet-mercury | CLEAR | hero | – | YES (`planets.ts:113` → SpaceLab.tsx) |

---

## 2. Route-reachability method and a structural caveat

`src/App.tsx` route table: `/`, `/first-flight`, and `/app` (AppShell) with children `index`
(Explore), `subjects`, `labs`, 19 named lab routes (`labs/molecules`, `labs/reactions`,
`labs/atoms`, `labs/orbit`, `labs/functions`, `labs/math-manipulatives`, `labs/number-sense`,
`labs/motion`, `labs/energy`, `labs/electricity`, `labs/physiology`, `labs/cells`, `labs/stars`,
`labs/galaxies`, `labs/moons`, `labs/genetics`, `labs/ecology`, `labs/plants`,
`labs/microbiology`), plus a generic `labs/branch/:branchId` (`BranchLab.tsx`), `notebook`,
`grownups`.

`src/data/hierarchy.ts` lists every branch's `status` and `route`. Every branch with
`status: 'live'` (22 of them, cross-referencing lines 50–119) has an explicit `route` field that
points at one of the 19 **dedicated** lab paths above — **none** point at
`/app/labs/branch/:branchId`. `Subjects.tsx:154` and `Labs.tsx:42` only render a clickable link
when `b.status === 'live' && b.route`, i.e. they link straight to the dedicated lab, never to the
generic `BranchLab` path. Non-`live` branches (`planned`/`authored-pending`) render no link at all
(`Subjects.tsx:201`, "Coming soon"; `ContentNav.tsx:117`, "Not built yet"/"Coming soon").

**Finding: `BranchLab.tsx` (`/app/labs/branch/:branchId`) has no inbound nav link anywhere in the
app today.** It is present in the route table and would render `BRANCH_COMPONENTS[branchId]` (see
`src/data/branchModules.ts`) for any of the 22 live branches if visited by a hand-typed URL, but no
`Link`/`to=` in `Landing.tsx`, `Subjects.tsx`, `Labs.tsx`, or `Explore.tsx` generates that URL. This
matters for one asset below (`/models/cells/bacteria-wall-nih.glb`, §3.1): it has a `"model"` field
set in `src/data/generated/cell_biology.ts` (the codegen'd content for `BranchLab`'s
`cell-biology` path), but the branch's actual dedicated route (`/app/labs/cells` → `CellLab.tsx`)
uses a separate hand-authored data file (`src/data/cells.ts`) that deliberately leaves this
component procedural (`model: ''`, with an explanatory code comment). So the GLB is unreachable via
the one path a real user takes (`/app/labs/cells`), and the path that *would* reach it
(`/app/labs/branch/cell-biology`) has no link pointing to it. Treated as a full orphan in §3.

"Reachable from a real user route today" in this report = reachable by following an actual `Link`
from Landing → Subjects/Labs/Explore. `BranchLab.tsx` fails that bar for every branch it could
theoretically serve, since all 22 live branches bypass it in favor of dedicated routes.

---

## 3. Orphan PASS/CLEAR (or ATTRIB) assets — registered, licensed, never rendered

Four assets are registered with an approved `licenseStatus` (three CLEAR, one ATTRIB) and a
non-preview `qualityTier`, but are **not loaded by any component on any nav-reachable route**.
Confirmed by grepping the entire `src/` tree for each file's basename outside `modelRegistry.ts`
and, in every case, finding an explicit in-code comment documenting the deliberate exclusion.

### 3.1 `/models/cells/bacteria-wall-nih.glb` — componentId `cell-wall`, CLEAR, support
`src/data/cells.ts:338-353` — the `bacterialCell` record sets `model: ''` and carries this comment:
> "Deliberately still procedural. The sourced NIH asset on disk
> (public/models/cells/bacteria-wall-nih.glb, "Gram Positive Wall v3") is a molecular cross-section
> of the cell *envelope* ... not a whole bacterium. It has no counterpart for the nucleoid,
> ribosomes, cytoplasm or flagellum this component teaches..."

The only other reference is `src/data/generated/cell_biology.ts:600`, consumed exclusively by the
unreachable `BranchLab` path (§2).

### 3.2 `/models/biology/microbiology/virus-polio-capsid-nih-optimized.glb` — componentId `virus`, CLEAR, hero
`src/routes/MicrobiologyLab.tsx:360-368` — `VirusCapsidModel` is procedural (icosahedron + spike
cones), with comment:
> "The real poliovirus capsid GLB (NIH 3D, EMDB 5886) has no recorded PASS visual-acceptance
> verdict: `docs/assets/reviews/biology-cell-visual.md` #10 ... rates it CONDITIONAL ... Until an
> actual PASS lands for either file, this scene stays procedural."

Zero references to this filename anywhere else in `src/`.

### 3.3 `/models/chemistry/molecules/water.glb` — componentId `chem-molecule-water`, CLEAR, hero
`src/data/molecules.ts:7-15` (file-level comment) and `:80-81` (on the `water` record):
> "Water was also authored as a GLB (public/models/chemistry/molecules/water.glb) but the Wave 17
> ... water.glb places both hydrogens behind one another from the default camera angle, hiding
> one ... Deliberately procedural, not `modelType: 'glb'`."

The water molecule component renders a procedural ball-and-stick instead. Zero other references.

### 3.4 `/models/sourced/math-wave2/abacus-soroban-bruno-oliveira.glb` — componentId `math-number-and-arithmetic-abacus`, ATTRIB, support
`src/routes/NumberSenseLab.tsx:39` comment: "the Wave 6 sourced abacus GLB..." plus the whole
place-value manipulative (`AbacusModel`/`AbacusRod`/`AbacusBead`, ~line 1487) is built as
interactive procedural geometry so bead-drag interaction works. Zero references to this filename
anywhere in `src/`.

**Net: 62 of 66 registered assets are reachable from a live route; 4 are orphans (3 CLEAR + 1
ATTRIB), all with an explicit documented reason in the code, not an oversight — but none of the
"licence clear, ready to ship" bookkeeping in the registry reflects that these 4 are dead weight in
`public/models/` today.**

---

## 4. Disk vs. registry: orphan files and missing files

```
Registry entries (MODEL_ASSETS):          66
GLB files on disk (public/models/**/*.glb): 174
```

- **Registered but missing from disk: 0.** `comm -13` of the sorted URL lists returned nothing —
  every registry `url` resolves to a real file.
- **On disk but not in the registry: 108** (174 − 66), totalling **~375 MB** (393,422,116 bytes) of
  the tree's ~556 MB. These fall into two groups:
  1. **`public/models/nature/quaternius-ultimate-nature/` (49 files)** — the raw Quaternius
     "Ultimate Nature Pack" (Bush/Cactus/BirchTree/CommonTree variants), of which only 2 files were
     ever promoted into the registry (`producer.glb`, `ecosystem.glb` — themselves **not** stored
     in this folder but as byte-identical copies elsewhere, see §5).
  2. **`public/models/sourced/**` originals and unpromoted derivatives (59 files)** — e.g. every
     un-optimized `*-material-fixed.glb` predecessor (`crystal-diamond-carbon-nih.glb`,
     `crystal-silicon-carbide-2h-nih.glb`, `crystal-graphite-sheet-nih.glb`), every un-optimized
     space body before its `-optimized` derivative shipped (`enceladus.glb`, `europa.glb`,
     `io.glb`, `titan.glb`, `moon-earth.glb`, `mercury.glb`, plus never-promoted bodies `bennu.glb`,
     `callisto.glb`, `chandra-xray-observatory.glb`, `deimos.glb`, `ganymede.glb`,
     `hubble-telescope.glb`, `jwst-telescope.glb`, `perseverance-rover.glb`, `phobos.glb`,
     `triton.glb`/`triton-optimized.glb`, `vesta.glb`), the entire `biology-cell/` candidate set
     (`bacteria-ecoli-whole-cell-nih.glb`, `nucleosome-dna-packaging-nih.glb` + `-optimized`,
     `organelle-golgi-apparatus-nih.glb`, `organelle-ribosome-80s-bychain-nih.glb` + `-optimized`,
     `virus-bacteriophage-t4-capsid-bychain-nih.glb`, `virus-influenza-capsid-rna-nih.glb`,
     `virus-influenza-envelope-a-nih.glb`, `virus-influenza-envelope-b-nih.glb`,
     `virus-polio-capsid-nih.glb` un-optimized original), `biology-life/` candidates (fox, deer,
     mushroom-stage-5, flower-stage-1-bud, corn-stage-5-mature, vintage-microscope),
     `chemistry-reactions/chemistry-lab-bench(.glb/-optimized.glb)`,
     `chemistry-structure/{glucose,oxygen}.glb`, `math-wave2/{coin,dice,kitchen-scale,ruler,
     measuring-tape-01}-*.glb`, `physics-energy-wave2/{insulated-flask,masonry-heater}.glb`,
     `physics-fields/{bulb,compass,lens}.glb`, `physics-mechanics-wave2/{alarm-clock,gear-large,
     gear-small}*.glb`, `crystal-alpha-quartz-nih.glb`. Every one of these is explicitly named
     REJECT/CONDITIONAL/unwired-on-purpose in in-repo comments seen during this audit (e.g.
     `generated/plants.ts`/`generated/ecology.ts` note `flower-stage-1-bud.glb` and
     `corn-stage-5-mature.glb`/`mushroom-stage-5-mature.glb` are "excluded — REJECT verdict", "stays
     ... out of /public entirely (still under public/models/sourced/, unwired, on purpose)" — note
     this claim is disproven by the filesystem: those two files **are** physically present on disk
     under `public/models/sourced/biology-life/...`, just not registered/loaded).

None of these 108 files are flagged for use anywhere — they are pure filesystem weight with no
registry entry and (per the componentId/url search in §1–§3) no direct code reference outside the
comments describing why they were rejected.

---

## 5. Duplicate-file check (SHA-256, exact byte match — not a size proxy)

Ran `shasum -a 256` on all 174 on-disk `.glb` files. Exactly **2 duplicate pairs**, both
registered-asset ↔ unregistered-nature-pack-file:

| Registered asset (componentId) | Byte-identical unregistered file |
|---|---|
| `/models/biology/ecology/ecosystem.glb` (`ecosystem`, CLEAR/support) | `/models/nature/quaternius-ultimate-nature/CommonTree_Autumn_1.glb` |
| `/models/biology/ecology/producer.glb` (`producer`, CLEAR/support) | `/models/nature/quaternius-ultimate-nature/CommonTree_1.glb` |

I.e. the two "ecology background dressing" registry entries are literally renamed copies of two
trees from the Quaternius pack sitting one directory over — not a registry-integrity problem (only
one copy of each is registered), but confirms these are re-exported single-tree meshes from the
pack, worth knowing if the pack ever gets pruned.

Hashing the 66 **registered** files against each other found **zero** duplicate hashes — no
registry entry double-books the same physical asset under two different componentIds.

---

## 6. File-size ranking

**Top 5 largest files anywhere in `public/models/` (bytes):**

| Rank | Size | Path | Registered? |
|---|---|---|---|
| 1 | 93,129,968 (~88.8 MB) | `sourced/biology-cell/organelle-ribosome-80s-bychain-nih.glb` | No (unregistered original; a 9.5 MB `-optimized` derivative of the same file *is* on disk but neither is registered) |
| 2 | 28,135,284 (~26.8 MB) | `sourced/biology-cell/organelle-golgi-apparatus-nih.glb` | No |
| 3 | 23,839,532 (~22.7 MB) | `sourced/biology-cell/virus-polio-capsid-nih.glb` | No (un-optimized original; the registered `virus-polio-capsid-nih-optimized.glb` is 7.03 MB and is the orphan in §3.2) |
| 4 | 17,925,448 (~17.1 MB) | `sourced/space/enceladus.glb` | No (un-optimized original; registered `enceladus-optimized.glb` is 5.51 MB) |
| 5 | 17,479,700 (~16.7 MB) | `sourced/space/io.glb` | No (un-optimized original; registered `io-optimized.glb` is 6.00 MB) |

All 5 largest files on disk are **unregistered** originals whose optimized derivatives (if any) are
what's actually registered — i.e. the registry's own hygiene already avoided the worst offenders,
but the multi-hundred-MB unoptimized originals are still sitting in `public/`, served by the dev
server, and would ship in any build that doesn't explicitly exclude `public/models/sourced/`.

**Top 5 largest among the 66 *registered* files:**

| Rank | Size | Path |
|---|---|---|
| 1 | 12,916,400 (~12.3 MB) | `/models/space/planets/earth.glb` |
| 2 | 11,479,456 (~10.9 MB) | `/models/space/planets/jupiter.glb` |
| 3 | 9,771,192 (~9.3 MB) | `/models/sourced/physics-energy-wave2/generator.glb` |
| 4 | 9,529,028 (~9.1 MB) | `/models/space/planets/ceres.glb` |
| 5 | 8,502,472 (~8.1 MB) | `/models/space/cassiopeia-a-supernova.glb` |

Total bytes: registered set = 189,126,464 (~180.4 MB); unregistered set = 393,422,116 (~375.2 MB);
combined `public/models/` = 582,548,580 (~555.6 MB).

---

## 7. REVIEW / NC-RISK / ATTRIB assets — already-approved same-branch replacement candidates

Rule followed: only list an **already-registered CLEAR or ATTRIB, hero-tier, PASS** asset as a
candidate. Never suggest a REVIEW/NC-RISK asset as a stand-in for another. No new approvals were
sought or implied.

**NC-RISK: 0 assets exist in the registry** — nothing to evaluate.

**REVIEW (9, all `biology/human-anatomy`, all `replaceBeforePaidLaunch: true`):** `brain.glb`,
`eyeball.glb`, `heart.glb`, `intestine.glb`, `kidneys.glb`, `liver.glb`, `lungs.glb`,
`pancreas.glb`, `skin.glb`. Checked every other registry entry for `branch: 'human-anatomy'` —
**none exist**; these 9 are the entirety of that branch's registered assets. **No already-approved
CLEAR/ATTRIB substitute is available in the registry for any of the 9** — each organ is a distinct
component with no interchangeable sibling. Flagging only; no substitute recommended, consistent
with the "never suggest using a REVIEW/NC-RISK asset without new approval" rule (moot here since
there's nothing CLEAR to substitute in either direction).

**ATTRIB (4):**
1. `biology/genetics/dna-b-form-double-helix-nih.glb` (componentId `dna`) — only registered asset
   in `branch: 'genetics'`. No CLEAR/ATTRIB sibling to substitute.
2. `chemistry/crystal-structures/crystal-graphite-sheet-nih-material-fixed.glb` (componentId
   `chem-crystal-graphite`) — branch `crystal-structures` also has two **already-approved CLEAR**
   hero assets: `crystal-diamond-carbon-nih-material-fixed.glb` (componentId `chem-crystal-diamond`)
   and `crystal-silicon-carbide-2h-nih-material-fixed.glb` (componentId
   `chem-crystal-silicon-carbide`). These are **not suitable substitutes** — each is a distinct,
   named crystal structure tied to its own lesson content; swapping one in for graphite would
   misrepresent the material. Listed for completeness only, per the instruction to name
   already-approved same-branch candidates even when not usable as direct substitutes.
3. `biology/microbiology/virus-influenza-pathogenar-cutaway-nih.glb` (componentId
   `biology-microbiology-virus-influenza-cutaway`) — branch `microbiology` has two already-approved
   **CLEAR** hero assets: `virus-influenza-whole-nih.glb` (componentId
   `biology-microbiology-virus-influenza-whole`, its own intact companion piece — already wired
   side-by-side in `MicrobiologyLab.tsx`, not a substitute since it lacks the cutaway's exposed
   interior) and the orphaned `virus-polio-capsid-nih-optimized.glb` (componentId `virus`, CLEAR,
   §3.2 — different organism, not a valid substitute for an influenza-specific lesson). No suitable
   substitute.
4. `math/number-and-arithmetic/abacus-soroban-bruno-oliveira.glb` (componentId
   `math-number-and-arithmetic-abacus`) — only registered asset in `branch:
   'number-and-arithmetic'`, and (§3.4) it's already an orphan with a working procedural
   replacement in production, so no substitute is needed at all.

**"Coming soon" / not-yet-authored components:** `ContentNav.tsx:117` shows "Not built yet" for
branches with `status: 'authored-pending'` (only `earth-in-space` in `hierarchy.ts:124`) and
"Coming soon" in `Subjects.tsx:201` for `status: 'planned'` branches (18 of them, e.g. `evolution`,
`animals`, `states-of-matter`, `waves`, `magnetism`, etc.). These have **zero** componentIds and
**zero** registry entries — they are content-authoring gaps, not asset-registry gaps, so there is
nothing in `MODEL_ASSETS` to map onto them; not in scope for a registry-substitution
recommendation.

---

## Summary table

| Metric | Count |
|---|---|
| Total registered assets (`MODEL_ASSETS`) | 66 |
| — licenseStatus CLEAR | 53 |
| — licenseStatus ATTRIB | 4 |
| — licenseStatus REVIEW | 9 |
| — licenseStatus NC-RISK | 0 |
| — qualityTier hero | 46 |
| — qualityTier support | 20 |
| — qualityTier preview | 0 |
| — `replaceBeforePaidLaunch: true` | 9 (= all 9 REVIEW human-anatomy organs) |
| Reachable from a live nav-linked route | 62 |
| Orphan PASS/CLEAR-or-ATTRIB (registered, licensed, never rendered) | 4 (3 CLEAR + 1 ATTRIB) |
| Registry entries missing from disk | 0 |
| On-disk GLBs with no registry entry | 108 (~375 MB) |
| Likely-duplicate files (exact SHA-256 match) | 2 pairs (both registered↔unregistered; 0 among the 66 registered files themselves) |
| Top 5 largest files on disk (bytes) | 93,129,968 / 28,135,284 / 23,839,532 / 17,925,448 / 17,479,700 — all 5 unregistered `sourced/` originals (§6) |

**Orphan list (for follow-up, not fixed here):**
1. `/models/cells/bacteria-wall-nih.glb` — componentId `cell-wall`, CLEAR/support
2. `/models/biology/microbiology/virus-polio-capsid-nih-optimized.glb` — componentId `virus`, CLEAR/hero
3. `/models/chemistry/molecules/water.glb` — componentId `chem-molecule-water`, CLEAR/hero
4. `/models/sourced/math-wave2/abacus-soroban-bruno-oliveira.glb` — componentId `math-number-and-arithmetic-abacus`, ATTRIB/support

**Structural note:** `/app/labs/branch/:branchId` (`BranchLab.tsx`) has no inbound link from
Landing/Subjects/Labs/Explore for any of the 22 `live` branches — every live branch's `hierarchy.ts`
`route` points at a dedicated lab component instead. This is the reason orphan #1 above is doubly
unreachable (its only registered content reference lives in the `BranchLab`-only
`generated/cell_biology.ts`, and that route itself has no nav link).
