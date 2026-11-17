# STEM OS — Production Asset & Curriculum Catalogue (adopted)

Source: `~/Downloads/STEM_OS_Production_Asset_Curriculum_Catalogue.xlsx` (10 sheets:
Blueprint, Master Curriculum, Lesson Library, Production Asset Catalog, Hero Procurement,
ThreeJS Modules, Interaction Standards, Source & License Matrix, Roadmap, Content Schema).

Raw dump used for this transcription: `/var/folders/rg/807ryhwn6sn7s4cn7_87mp_40000gn/T/opencode/stemcatalog/sheet_*.txt`.
This doc is the durable, repo-side reference so procurement stays traceable without the
spreadsheet open. **Rights/risk decisions are made here, then applied per-file in
[ASSET-LICENSES.md](../ASSET-LICENSES.md).**

Last transcribed: 2026-08-09.

---

## 1. The thesis

**Procedural-first; premium GLB only where a concrete real object teaches better.**
Rule 1 of its own blueprint: "do not force GLBs where procedural is better". The catalogue is
a permission structure, not a mandate — an 800-row asset plan tuned to a 4-5 week hero build,
not a backlog of things that must ship.

- 16 subjects x 10 branches = 160 branches; 800 lesson rows; 800 asset rows; 25 procedural
  engine modules. Exceeds Quantaora's 5-subject MVP — but its **P0 Hero list (112 rows) is
  the useful slice** for us, because it is the only set with per-asset procurement URLs,
  licence flags and a quality target.
- Strategic rules (from Blueprint sheet, kept verbatim in intent):
  1. Don't force GLBs where procedural is better (Math/CS/Geography = procedural).
  2. Premium/official GLB for concrete real-world objects (anatomy, machines, labs, fossils).
  3. Every asset must support interaction (hotspots, cutaway, exploded view — see §4).
  4. Licensing is a **product risk** — no NC/ND assets in a commercial release.
  5. Reusable engines over bespoke scenes.
  6. Consistent semantic asset schema (named parts → power AI tutor + hotspots).
  7. Optimize for school devices: Mobile LOD, KTX2/Basis, Draco/Meshopt, lazy loading.
  8. Content quality > asset count.
  9. Procurement tied to curriculum priority: **P0 Hero → P1 Core → P2 Expand**.
- Quality bar (verbatim): realistic / scientific / production-ready. **Reject cartoon,
  toy-like, low-poly, broken topology, unclear licenses.**

> ⚠️ Note the tension with Quantaora's current GIS work: the Quaternius nature pack already
> wired into Ecology is **low-poly stylized** — fine for diorama bases (CC0, clearly out of
> "hero" category), but no Quaternius model should be presented as a P0 hero. The catalogue's
> reject-list is exactly the bar our hero assets must clear.

## 2. Asset decisions by subject (full catalogue, 800 rows)

How the catalogue split its 800 requests between `Premium/Official GLB`,
`Procedural Three.js` and `Hybrid` (GLB base + procedural dynamics):

| Subject | GLB | Procedural | Hybrid | Read |
| --- | --- | --- | --- | --- |
| Mathematics | 4 | 46 | 0 | procedural — abstract |
| Physics | 48 | 1 | 1 | **mostly GLB** (see §3 caveat) |
| Chemistry | 10 | 1 | 39 | hybrid — lab glass + procedural molecules |
| Biology | 46 | 0 | 4 | GLB — bodies/cells/specimens |
| Earth Science | 43 | 2 | 5 | GLB (layered Earth) |
| Astronomy & Space | 44 | 2 | 4 | GLB (NASA) |
| Geography & GIS | 0 | 50 | 0 | procedural (terrain) |
| Engineering | 49 | 0 | 1 | GLB (machines) |
| Electronics | 44 | 5 | 1 | GLB |
| Robotics | 48 | 1 | 1 | GLB |
| Computer Science | 0 | 50 | 0 | procedural |
| AI & ML | 8 | 42 | 0 | procedural + small GLB |
| Environmental Science | 45 | 1 | 4 | GLB |
| Medicine & Health | 47 | 1 | 2 | GLB |
| Architecture | 48 | 0 | 2 | GLB |
| Energy Systems | 47 | 2 | 1 | GLB |

Priorities across all 800: **P0 Hero 112, P1 Core 375, P2 Expand 313**.

## 3. Where the catalogue over-claims GLB

The blueprint's own rule says "don't force GLBs", yet **Physics got 48 GLB / 1 procedural**
and **Biology 46 GLB / 0 procedural**. For Quantaora the following physics rows should be
treated as **Hybrid or procedural**, not static GLB, because the teaching value is in the
variable-driven sim (spec §22):

- AST-0056 Projectile Launcher, AST-0057 Collision Carts (mechanics) — Rapier sim + procedural
  visuals; GLB only for the launcher/cart shell if desired.
- AST-0071 Slinky, AST-0072 Ripple Tank (waves) — PHY-004 Wave Simulation Engine, not a GLB.
- AST-0096 Atom, AST-0097 Particle Detector (modern physics) — procedural particle systems.
- Chemistry AST-0101/0102 (atoms), 0106/0107 (molecules), 0111–0114 (bonds/lattice),
  0136/0137 (states of matter), 0141/0142 (acids) — the catalogue itself marks these
  **Hybrid**; their `CHEM-001/002/003` engines make them procedural with GLB optional.

Biology's P0 is genuinely GLB-appropriate (anatomy, cells, specimens) and aligns with our
existing organ/NIH asset work.

**Adopt:** any future "Physics" procurement request must justify GLB-over-procedural in the
risk note; the default is a Three.js module from the §4 engine list.

## 4. Reusable Three.js engines (25 modules — procedural surface)

| ID | Module | Subjects | GLB? |
| --- | --- | --- | --- |
| MATH-001 | Parametric Curve Renderer | Math | No |
| MATH-002 | Coordinate Plane Engine | Math/Geography | No |
| MATH-003 | 3D Surface Plotter | Math/AI | No |
| MATH-004 | Manipulative Blocks | Math | Procedural |
| PHY-001 | Vector Field Renderer | Physics/Eng | No |
| PHY-002 | Particle System Lab | Phys/Chem | No |
| PHY-003 | Rigid Body Lab (Rapier/Ammo) | Phys/Rob | **Hybrid** |
| PHY-004 | Wave Simulation Engine | Phys/Elec | No |
| CHEM-001 | Molecule Builder | Chem/Bio | Hybrid |
| CHEM-002 | Reaction Timeline | Chem | Hybrid |
| CHEM-003 | Crystal Lattice Generator | Chem/Materials | Hybrid |
| BIO-001 | Anatomy Hotspot System | Bio/Med | GLB required |
| BIO-002 | Physiology Flow Overlay | Bio/Med | Hybrid |
| EARTH-001 | Layered Earth Engine | Earth | Hybrid |
| GEO-001 | Terrain Tile Engine | Geo/Earth | Hybrid |
| ASTRO-001 | Orbit Mechanics Engine | Astronomy | Hybrid |
| ENG-001 | Exploded Assembly System | Eng/Elec/Rob | GLB required |
| ENG-002 | Stress & Load Overlay | Eng/Arch | Hybrid |
| CS-001 | Packet Flow Visualizer | CS | No |
| CS-002 | Algorithm Stepper | CS/AI | No |
| AI-001 | Neural Network Lab | AI | No |
| AI-002 | Transformer Attention Viewer | AI | No |
| ROB-001 | Kinematics Rig | Robotics | GLB + procedural |
| ENV-001 | Ecosystem Network Engine | Env Sci | Hybrid |
| ARCH-001 | BIM Layer Viewer | Architecture | GLB/IFC |

Quantaora-relevant mapping today: BIO-001 ≈ our hotspot viewer (already built); ASTRO-001
≈ our orbit/solar-system viewer (already built); PHY-004 + PHY-002 are the natural next
engines for the waves/mechanics branches; ENV-001 ≈ the ecology branch's ecosystem engine
direction. **No GLB** engines (Math/CS/AI rows) are the procedural subject plan — already
matches how we treat Math/CS.

## 5. Interaction standards & content schema (adopt as contract)

The catalogue's **14 interaction capabilities** line up with our existing
`CanvasControls` rail. Adoption stance: they are already satisfied by the generic viewer for
hotspot assets; the two gaps to close as content authoring grows are (a) **Time Slider**
(mandatory when a concept changes over time) and (b) **AI Tutor Hook** (context-aware
explanation), both currently scoped out of MVP.

Catalogue content schema (10 entities) vs. our `module.json`/`model-metadata.json`/`quiz.json`:

| Catalogue entity | Fields | Quantaora home | Delta for us |
| --- | --- | --- | --- |
| Subject | id, name, audience, ageBand, heroBranches | taxonomy `index.json` / branch tables | — |
| Branch | id, subjectId, name, sequence, summary, prerequisites | taxonomy `*.json` | `sequence` + `prerequisites` not formalised |
| Lesson | id, branchId, component, learningOutcome, misconceptions, lessonFlow, difficulty | `module.json` (`summary`, `keyFacts`), `lesson.md` | `misconceptions` field exists in our `quiz.json`; catalogue wants it at lesson level |
| Asset | id, lessonId, assetType, source, license, fileUri, meshMap, LODs, risk | `model-metadata.json` + ASSET-LICENSES row | `meshMap`, `LODs`, explicit `risk` field → recommended addition to `model-metadata.json` |
| Hotspot | id, assetId, meshId, label, definition, narration, quizId, cameraTarget | `model-metadata.json` hotspots | `meshId` (semantic node name) vs our positional `position` hotspots — future asset models should carry named nodes; `narration` + `quizId` currently live in quiz/lesson files |
| Animation | id, assetId, timeline, keyframes, variables, narrationMarkers | not present | **new entity** — needed by Time Slider standard |
| Quiz | id, lessonId, prompt, choices, explanation, difficulty | `quiz.json` | — |
| AI Tutor Context | lessonId, selectedMesh, variableState, learnerLevel, history | not present (MVP has no AI tutor) | defer |
| Telemetry | lessonId, event, variableState, answer, confidence, timestamp | Zustand `localStorage` blob (subset: quizResults, mastery, timeSpent) | catalogue wants fine-grained variable-state events — revisit when telemetry is built |
| Assessment | (note: catalogue lists Quiz but roadmap references assessment) | `standards.json` (standards alignment) | keep current model |

Adopted decision: do **not** re-write the content schema wholesale. The catalogue's
`Asset`/`Hotspot` fields are a **procurement contract for future GLB heroes** (named meshes,
LOD budget, license/risk) and will be captured in the per-asset register (§6) rather than
forced back into existing authored content.

## 6. Hero procurement — 112 P0 rows, licence risk profile

Asset-type mix: **91 Premium/Official GLB, 21 Hybrid**.

Licence mix (colour = risk):

| Licence flag | Count | Stance |
| --- | --- | --- |
| Verify per asset | 23 | must open each URL, confirm licence + commercial terms before import |
| NASA guidelines | 22 | CLEAR for our use (public domain imagery/models), standard credits |
| Paid license | 19 | budgeted purchase; add legal review before import |
| Per-entry / paid royalty-free | 15 | per-asset invoice; legal review |
| Paid or CC | 14 | prefer the CC-by-license variant when price is non-zero |
| **CC BY** | 11 | CLEAR + attribution (in-app credits line) |
| **CC BY-NC** | **4** | **NC-RISK — must not ship in a paid release** |
| **CC BY-NC-ND** | **1** | **NC-RISK + no-derivatives — replace with procedural/hybrid** |
| Free Standard / NoAI | 1 | fine as-is; note no-AI clause irrelevant to rendering |
| CC BY listed / CC0 claim | 1 | verify the claim before trusting |
| Per-entry NIH license | 1 | NIH per-entry terms; matches our existing NIH-NC-RISK rows |

**Named NC/ND rows to never treat as CLEAR:**

| ID | Component | Flag | Replace with |
| --- | --- | --- | --- |
| AST-0102 | Oxygen Atom (Chemistry) | **CC BY-NC-ND** | CHEM-001 Molecule Builder (procedural) |
| AST-0114 | Crystal Lattice (Chemistry) | CC BY-NC | CHEM-003 Crystal Lattice Generator (procedural) |
| AST-0361 | Generator (Eng) | CC BY-NC | procedural energy animation |
| AST-0759 | Generator (Wind Energy) | CC BY-NC | procedural turbine |
| AST-0764 | Generator (Hydropower) | CC BY-NC | procedural turbine |

The 11 **CC BY** rows are the cheapest legitimate heroes to import into Quantaora and
several map 1:1 to components we already authored. Priorities for immediate wiring:

| Catalogue ID | Component | Our component path | Licence | Notes |
| --- | --- | --- | --- | --- |
| AST-0151 | Heart | `biology/human-anatomy/heart` + `human-physiology/beating-heart` | CC BY q9.5 | named-mesh anatomy; strongest hero |
| AST-0153 | Lungs | `biology/human-anatomy/lungs` | CC BY q9.5 | sibling |
| AST-0152 | Brain | `biology/human-anatomy/brain` | CC BY q9 | sibling |
| AST-0156 | Animal Cell | `biology/cell-biology/animal-cell` | CC BY q9 | our current animal-cell GLB is NC-RISK (NIH) — this is a potential **NC-RISK replacement** |
| AST-0157 | Plant Cell | `biology/cell-biology/plant-cell` | CC BY q8.5 | same |
| AST-0161 | DNA Double Helix | `biology/genetics/dna-replication` | CC BY q8.5 | supplements banked RCSB `1BNA` |
| AST-0134 | Bunsen Burner | `chemistry/...` lab-equipment branch (not yet authored) | CC BY q8 | future chemistry branch |
| AST-0003 | Abacus | `math/number-and-arithmetic/abacus` (authored) | CC BY q8.5 | concrete manipulative for a procedural subject |
| AST-0252 | Earth | `space/solar-system/earth` | NASA q10 | already shipping (procedural); NASA GLB optional |

Other P0 subjects: Engineering rows are 100% **Paid license** (Engine, Gearbox, Bridge,
Jet Engine…) — skip for now; Energy Systems rows are the NC-risk trio above; Astronomy rows
sit under "NASA guidelines" and we already ship five space GLBs that cover that territory.

## 7. Source & license matrix (adopt verbatim into sourcing policy)

| Source | Tier | Licence posture | Use for |
| --- | --- | --- | --- |
| NASA 3D Resources / NASA Science 3D | Tier 1 | public domain, guidelines + credits | space, astronomy, planetary |
| NIH 3D | (per-entry) | **per-entry licence; NIH does not enforce contributor terms** | limited; verify each entry |
| Smithsonian 3D | Tier 1 | many CC0 — verify per item | fossils, specimens |
| Khronos glTF-Sample-Assets | validation | sample/validation only | licensed demonstration, not curriculum content |
| TurboSquid / CGTrader / Hum3D | Tier 2 paid | paid licence per asset | machines, hero engineering |
| Fab / Quixel Megascans | Tier 2 | mixed | textures, environment |
| Sketchfab Downloadable | Tier 3 | selective, per-asset | rare CC-BY finds only (Sketchfab is login-walled for direct fetch) |
| Poly Haven | (our addition) | CC0 | lab glass, plants, textures |
| Quaternius | (our addition) | CC0 | stylised ecosystem/critters — **not hero-grade** |

## 8. Roadmap (their phases vs. our status)

| Their phase | Duration | Deliverable | Our status |
| --- | --- | --- | --- |
| P0: Asset law + pipeline foundation | 2 wk | licence policy, naming, GLB import, LOD/Draco/KTX2, QA checklist | **done** — but no KTX2/Draco yet (add when mobile perf matters) |
| P1: Hero vertical MVP | 4-6 wk | biology anatomy, physics mechanics/elec, chem lab/atoms, math procedural graphs | **~in progress** — 19 GLBs, generic viewer, all branches live; hero-fit work remains |
| P2: Simulation-first core | 6-10 wk | procedural engines list (§4) | not started — next real work block |
| P3: Expanded subjects | 8-12 wk | earth, astronomy, engineering, robotics, CS, env, medicine, arch, energy | out of MVP |
| P4: AI tutor + authoring studio | 8-12 wk | AI-guided lesson creation, hotspot authoring, auto-quiz, teacher dashboards | deferred (no AI tutor in MVP) |
| P5: Production scale | ongoing | premium packs, optimization, certification curriculum, school pilots | n/a |

## 9. Decisions logged

- **Adopt the P0 Hero ≤112 row set as the procurement backlog** (filtered to our 5 MVP
  subjects), storing per-row licence/risk decisions here and per-file rows in
  ASSET-LICENSES.md when an asset is actually imported.
- **Never transitive-trust licence flags**: every "Verify per asset" and "Ready for
  legal/technical QA" row still requires opening the URL and reading the licence field
  before import — same rule ASSET-LICENSES.md already enforces.
- **Physics default = procedural/hybrid** unless a static concrete object is genuinely required.
- **Reject the 5 NC/ND rows above** in any paid scenario; they are already replaced by
  procedural engines in the plan.
- **CC BY hero import order:** Heart → Lungs → Brain → Animal Cell → Plant Cell → DNA → Abacus
  (highest q-score first, and cell rows double as NC-RISK replacements).
- Data sheet transcription prints live at
  `/var/folders/rg/807ryhwn6sn7s4cn7_87mp_40000gn/T/opencode/stemcatalog/` if a full-row
  look-up is needed; re-print from the xlsx on demand (script inlined in repo history).