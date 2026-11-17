# Quantaora Next Scope

Status: active execution queue. Last updated 2026-08-24.

Latest shipped slice:

- 2026-08-24 Number Sense P1 interaction depth: `/app/labs/number-sense` now has 10 synced
  guided missions and direct quick manipulative actions in the bottom control band, outside the
  hidden Tune drawer and away from the visible model. Browser QA screenshots are in
  `review-screenshots/number-sense-p1-2026-08-24/`. Focused tests and production build pass.
- 2026-08-24 P0/P1 foundation: First Flight now saves a real three-step recommended mission and
  Parent/Teacher renders that mission as linked steps. `npm run quality:gaps` generates
  `docs/TODAY-P0-P1-GAP-REPORT.md`; use that report as the current execution queue. Current
  report counts after the P0 asset waves: 1 P0 branch, 50 P1 branches, 147 hero mappings,
  24 support mappings, and 148 components without registered asset mappings. Cell Biology DNA is
  wired to the reviewed PASS NIH/RCSB B-DNA GLB. Space partial branches have project-owned CLEAR
  authored GLBs for Comet Nucleus, Sample Return Workflow, and Wavelength Comparison. Physics
  Sound/Waves/Fluids have 13 project-owned CLEAR authored GLBs. Chemistry States/Acids/Solutions/
  Stoichiometry/Biochemistry Links have 25 project-owned CLEAR authored GLBs. Modern Physics,
  Gravity And Orbits, and Cosmology have 15 project-owned CLEAR authored GLBs. Biology Cell
  Biology, Evolution, Animals, Health And Disease, Neuroscience, and Biochemistry Foundations
  have 31 project-owned CLEAR authored GLBs. Latest screenshots are in
  `review-screenshots/p0-p1-hero-complete-2026-08-24/`. Do not repeat these items unless tests or
  visual QA show a regression.
- Latest continuation: procedural BranchLab scenes now animate under Play/Pause; Heat &
  Thermodynamics has cleared stove GLBs for conduction/phase-change with safe camera framing;
  Organic Chemistry Hydrocarbon has the cleared methane GLB with safe camera framing; Earth In
  Space Rotation & Revolution has a child-facing speed experiment panel plus safer motion/seasons
  framing. Do not repeat these items unless visual QA finds a regression.
- Full branch breadth is now live. There are no remaining hierarchy branches marked
  `status: 'planned'`; the 2026-08-23 wave added generic BranchLab coverage for the remaining
  Chemistry, Physics, Math, Space, and Biology foundation/everyday branches. Current validation
  baseline: 397/397 tests pass, build passes with the existing Vite large-chunk warning,
  codegen check passes, and asset check passes with the known nine Anatomy REVIEW warnings.
- The next product gap is visual depth, not branch existence. Treat newly-live procedural
  branches as coverage-quality unless they have a dedicated flagship simulator or sourced,
  legally-clear `.glb` assets that meet the Anatomy reference bar.
- Labs index upgraded with subject accordions, search, quality filters, grade-band filters,
  mobile wrapping, and corrected routes to the polished flagship labs.
- Shared canvas toolbar upgraded with zoom, fullscreen, labels, X-Ray, Clean view, and
  Play/Pause.
- Real GLB animation clips now auto-play and can be paused; static GLBs show disabled Play.
- Orbit/Solar System uses the same Play/Pause control for the live simulation.
- P0 cell licensing blocker closed: NIH `animal-cell-nih.glb` and `neuron-nih.glb` were removed
  from shipped assets and replaced by project-owned animated GLBs.
- Physics Electricity now has a dedicated flagship simulator at `/app/labs/electricity`.
- Chemistry Molecules now has a dedicated builder at `/app/labs/molecules` with atom adding,
  bond add/remove mode, valence/formula meters, atom inspection, animated bond electrons, and the
  shared toolbar/Clean view model.
- Math Algebra now has a concrete-object studio at `/app/labs/functions` with savings, taxi,
  draining tank, balance scale, and candle contexts tied to equation/graph/table/variable controls.
- Space Solar System, Stars, and Galaxies are reconciled as flagship labs in the Labs index; Galaxies
  now has shared Play/Pause and a compact Tune galaxy panel.
- Genetics now has a dedicated flagship lab at `/app/labs/genetics`: DNA double helix with
  tap-to-inspect base pairs (A–T, C–G), gene segment selection, mutation toggle
  (substitution/insertion/deletion with silent/missense/nonsense effects), replication and
  transcription-translation animation driven by the real Play/Pause control, protein fold toggle,
  chromosome packaging (DNA-coil reveal), allele/trait pairing, and a Punnett-square grid with
  offspring ratio bars — all 10 authored genetics components, procedural/hybrid with shared
  toolbar, `Tune molecule` panel, meters, and Clean view.
- Plants now has a dedicated flagship lab at `/app/labs/plants`: all 9 authored plants components
  compose one plant-study studio — chloroplast cutaway (outer membrane peel, grana disc stacks,
  chlorophyll flecks, sunlight/water/CO₂ input rays with photon flow, sugar+O₂ output flow),
  flower anatomy with pollen-transfer animation and seed-forming ovary, leaf food factory (vein
  network, chlorophyll, breathing stoma with CO₂-in/O₂-out gas arrows), phloem sugar flow
  leaf→root/seed sinks, root system in peelable soil (root cap, root hairs, rising xylem water,
  storage), seed cutaway with germination slider + sprout growth, stem two-way elevator (water up
  xylem / sugar down phloem, node rings, cross-section ring), stomata with guard-cell turgor
  slider (pore openness % with breathing cycle), and xylem tube-in-tube with rising water.
  Procedural/hybrid with shared toolbar, `Tune plant` panel, live meters, and Clean view.
- Microbiology now has a dedicated flagship lab at `/app/labs/microbiology`: all 5 authored
  microbiology components compose one microbe studio — bacteria cutaway (peelable cell wall +
  membrane, loose DNA loop, whipping flagellum, binary-fission pinch + division buddies), virus
  infection cycle (icosohedral coat with attachment spikes, peel coat to expose the
  genetic-material coil, attach → host cell → release of new viruses), fungus on soil (peel soil
  to expose hyphae/mycelium, drifting spores, budding yeast), protozoa pond drop (amoeba with
  pulsing pseudopod, nucleus, food vacuole; flagellate whip; ciliate hairs), and microbiome
  (human silhouette with dense gut + sparse skin colonies, gut-wall close-up, helpful-job chips,
  antibiotic slider that visibly shrinks the community). Procedural/hybrid with shared toolbar,
  `Tune microbe` panel, live meters, and Clean view.
- Critical-thinking interaction pass started: Solar System now has a child-readable Rotation vs
  Revolution investigation with separate spin/orbit/year meters, visible selected-planet spin
  arrow, rotation-speed slider, revolution-speed slider, and orbital-distance/year-length cause
  effect. Plants Seed now visualizes germination as staged transformation: seed coat split, root
  first, shoot rises, leaves open, and seedling stage, with matching meters and Tune controls.
  Microbiology duplicate-key warning and wrong default inspected-part fallbacks were cleaned up.
- Human Physiology now has a dedicated flagship shell at `/app/labs/physiology`: shared
  `CanvasControls`, procedural 3D physiology scenes, compact meters, and a `Tune body` drawer
  for all 9 authored processes. Learners can change demand, resistance, airway tightness, enzyme
  help, water level, waste load, signal strength, pathway gap, load weight, immune signal, germ
  load, heat stress, and sweat loss depending on process, then watch the visible body-system
  response.
- Ecology now has a dedicated flagship lab at `/app/labs/ecology`: all 11 authored ecology
  components share one ecosystem diorama with producers, consumers, decomposers, predators, prey,
  habitat/water/shelter, niche markers, animated food-web energy flow, compact meters, and a
  `Tune ecosystem` drawer. Learners can change sunlight, predator pressure, decomposer activity,
  and habitat stress, then see plant energy, prey safety, population balance, nutrient recycling,
  and habitat health shift. The route uses the two existing clear Quaternius support GLBs plus
  procedural organisms; no new unclear assets were imported.
- Shared mobile BottomTray now behaves like a compact action bar: Lesson, Checkpoint, and
  Notebook remain visible on mobile; the long Real-world card remains desktop-only because the
  detail panel already carries that content on mobile.
- Physics Mechanics now has a dedicated flagship lab at `/app/labs/motion`: all 13 authored
  mechanics components share one ramp/cart simulator with force, mass, friction, slope, gravity,
  net-force, acceleration, velocity, position, distance/displacement, normal-force, weight,
  momentum, and kinetic-energy indicators. It uses the shared toolbar, starts paused for a calm
  first view, and exposes a `Tune mechanics` drawer for predict/change/observe/explain work.
- Physics Energy now has a dedicated flagship lab at `/app/labs/energy`: all 6 authored energy
  components share one coaster/cart transfer simulator with stored energy, motion energy, heat
  loss, useful output, efficiency, work, and power meters. It starts paused and exposes a
  `Tune energy` drawer for start height, mass, heat loss, push force, push distance, and transfer
  time.

## 1. Quality Bar

The biology anatomy lab is the reference bar. A flagship lab is not done unless it has:

- a premium, recognizable 3D scene or a deliberately precise procedural simulator;
- stable framing on desktop and mobile;
- meaningful hotspots tied to visible parts or variables;
- at least one real interaction beyond rotate/click;
- cause/effect thinking where applicable: learner changes a variable, predicts/observes what
  changes, and the scene explains why in child-readable language;
- lesson and quiz content tied to what is visible;
- saved progress and notebook behavior;
- source, licence, and attribution recorded before the asset is referenced.

Placeholder procedural scenes are acceptable for coverage, but they must be labelled as preview
quality and should not be treated as finished product.

## 2. Priority 0: GLB Asset Sourcing And Gate

This is the first production lane because asset quality is the largest gap between anatomy and the
rest of the app.

### Current P0 next actions

1. Work down `docs/TODAY-P0-P1-GAP-REPORT.md` in order. The only P0 branch currently reported is
   Human Anatomy legal clearance/replacement for the 9 REVIEW organ GLBs.
2. For P1, source and clear hero-quality `.glb` assets only where the authored/procedural object
   is not recognizable enough for kids. Math should stay primarily procedural unless a real
   manipulative asset is clearly better than a precise simulator.
3. For every sourced asset, add `modelRegistry.ts` record, `docs/ASSET-LICENSES.md` row, source
   notes, component mapping, and `assets:check` coverage before wiring it into content.
4. Browser-test each new asset in its real lab route at desktop and mobile sizes; add a camera
   preset immediately if any model is cut off, too small, or hidden behind toolbar/detail UI.
5. Do not promote conditional assets that fail child recognizability. Example: the staged glucose
   GLB exists locally but remains unwired because its review says the molecule reads as a dense
   blob for kids.

### Implemented foundation

- Real GLBs are now registered in `quantaora-app/src/data/modelRegistry.ts` with source, licence,
  licence status, quality tier, supported components, and replacement risk.
- Branch labs now surface the current asset status in the left navigation footer.
- `npm run assets:check` validates registered GLBs, matching files, duplicate basenames, licence
  rows, and paid-launch blockers.
- `PAID_RELEASE=1 npm run assets:check` hard-fails `NC-RISK` and `REVIEW` assets.
- The licence register is now exact per shipped GLB. Wildcard rows are no longer accepted by the
  asset gate.
- `docs/supplier/anatomy-asset-clearance.md` tracks the nine anatomy files one by one, with the
  required evidence for clearance or replacement.

### Sourcing rules

- Prefer `.glb` as the app delivery format.
- Keep source/original files separately when possible: `.blend`, `.fbx`, `.obj`, textures, licence.
- Every imported asset needs:
  - source URL;
  - licence;
  - attribution text if needed;
  - quality tier;
  - component mapping;
  - paid-launch risk flag.
- Do not import marketplace/free assets with unclear provenance.
- Do not rely on "NIH", "Sketchfab", or "free download" as a licence. Verify the exact asset page.

### Source priorities

- Biology/anatomy: current organ assets remain the quality reference; provenance cleanup continues
  as a paid-release track, but do not make it the main product-experience lane.
- Cells: NIH `NC-RISK` assets are replaced; continue improving visual fidelity if a better
  commercial-safe asset appears.
- Space: NASA public-domain 3D resources and NASA/JPL textures.
- Chemistry: hybrid path, with molecule data from PubChem/RCSB where scientific structure matters.
- Math: mostly procedural, with GLBs only for real manipulatives.
- Physics: hybrid path; GLBs for concrete apparatus, procedural simulation for behavior.

## 3. Five Flagship Labs

Build one excellent lab per subject before expanding breadth.

| Subject | Flagship | Asset direction | Required flagship interaction |
| --- | --- | --- | --- |
| Biology | Human Anatomy | premium anatomy GLBs | isolate, section, compare organs/systems |
| Chemistry | Atom/Molecule Builder | hybrid GLB/procedural | add particles, form bonds, inspect structure |
| Math | Geometry Lab | procedural precision | drag rays, measure angles, transform shapes |
| Physics | Electricity Circuit Lab | GLB apparatus + procedural current | wire components, switch current, change resistance |
| Space | Solar System Explorer | NASA textures/GLBs + procedural orbit engine | scale mode, orbit time, inspect planets |

## 4. Product Foundation Remaining Scope

### First Flight

Basic `/first-flight` is built and now stores a local three-step recommended mission. Remaining
work is to make it drive the real curriculum engine.

- add a short starting diagnostic;
- store profile in IndexedDB after the local DB migration;
- generate adaptive recommended missions from mastery/prerequisites instead of the current static
  subject mission map;
- use grade/interests/confidence to order Subjects, Labs, and Parent/Teacher views;
- keep "view everything" available so grade is guidance, not a hard lock.

### Local Progress

Move beyond simple localStorage mastery.

- IndexedDB learner profile;
- component mastery;
- skill mastery;
- quiz attempt history;
- misconception tags;
- saved notebook items;
- due-review queue;
- export/import backup.

### Curriculum Graph

Adopt the JayDay-style model:

`Subject -> Branch -> Topic -> Component -> Hotspot -> Lesson -> Quiz -> Skill -> Standard`

Grade-aware curriculum should select the next mission from prerequisites, mastery, recency, and
school relevance.

### Parent/Teacher Zone

Make it functional:

- child profile summary;
- progress by subject/branch/component;
- weak skills and due review;
- saved notebook;
- export/import;
- optional local PIN gate later.

### Landing Page

Keep the clean visual style, but only claim what exists.

- "Try Anatomy Lab" can route to the current best demo.
- "Start First Flight" can route to the implemented onboarding flow.
- Adaptive path and backup/export copy should stay behind implementation.

## 5. Execution Order

1. Improve Biology non-anatomy branches: Genetics, Plants, Microbiology, Human Physiology, and
   Ecology flagship first passes shipped; remaining Biology work is deepening and asset fidelity.
2. Bring Physics Mechanics/Energy up to the Electricity interaction level.
3. Deepen Chemistry with PubChem/RCSB-backed molecules, polarity/shape compare, and reactions.
4. Deepen Math Algebra across all generated algebra components.
5. Deepen Space with saved missions, lifecycle controls, and morphology challenges.
6. Continue anatomy provenance cleanup in parallel for paid-release readiness, without replacing
   the current organ visuals unless an equal/better cleared asset is available.
7. Move progress storage to IndexedDB.
8. Add curriculum planner and daily mission routing.
9. Update Parent/Teacher with grade-aware progress, weak skills, due review, and export/import.
10. Update landing copy and CTAs to match the implemented flow.

## 6. Immediate Next Implementation Slice

The next concrete slice should be:

1. Bring the remaining generated Math preview branch up to the flagship standard. Chemistry
   Chemical Reactions is live at `/app/labs/reactions`, the Atoms/Periodic Table bridge is live at
   `/app/labs/atoms`, and Math Geometry/Fractions/Data is live at
   `/app/labs/math-manipulatives`; the next highest-value gap is Number Sense/Arithmetic because
   kids need concrete place-value trays, bead bars, number lines, regrouping, factors/multiples,
   primes, negative-number motion, and operation animations.
2. Use the same quality pattern now proven across Biology: procedural/hybrid studio tied to
   authored components, shared toolbar, compact tune panel, meters, Clean view, and explicit
   predict/change/observe/explain copy.
3. Source GLB/molecular/manipulative assets only when they improve recognition: lab apparatus,
   crystal/compound examples, or clear math manipulatives. Register and licence-clear anything
   that ships.
4. Keep Ecology/Human Physiology/Mechanics/Energy/Chemical Reactions/Atoms/Math Manipulatives as
   deepening candidates after the next preview branch: better assets, direct manipulation, richer
   challenges, and compare candidates.
5. Verify desktop/mobile screenshots plus toolbar behavior: labels, zoom, Clean view, Play/Pause
   where useful, and no canvas clipping.
6. Update `PROJECT-STATUS.md`, `CONTEXT-ENGINEERING.md`, and `QUALITY-GAP-MATRIX.md`.
