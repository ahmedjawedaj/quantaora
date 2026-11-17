# Quantaora Context Engineering Log

Purpose: keep project state outside chat. Read this at the start of every session, then update it
after every meaningful implementation slice.

Last updated: 2026-08-31.

## Latest Session Delta — 2026-08-31

- Started Asset Realism Wave 1 as an existing-assets-first pass, not a full replacement wave.
  Added `quantaora-app/src/data/assetRealismTracker.ts` and
  `quantaora-app/src/data/assetRealismTracker.test.ts` so the P1 realism queue has an executable,
  honest state: upgraded existing assets, support-only assets, and branches still needing sourcing.
- Wired existing vetted assets where they are a better exact component fit:
  Cell Biology > Cell Wall now uses `/models/cells/bacteria-wall-nih.glb`; Cell Biology > Ribosome
  now uses `/models/sourced/biology-cell/organelle-ribosome-80s-bychain-nih-optimized.glb`; Health
  And Disease > Pathogen remains on the vetted NIH influenza GLB.
- Registered the optimized NIH/RCSB human 80S ribosome in `quantaora-app/src/data/modelRegistry.ts`
  with CC-BY 4.0 attribution requirements and support-tier quality. `docs/ASSET-LICENSES.md` and
  `docs/ASSET-SOURCING.md` now record the ribosome, cell-wall, pathogen, and Human Physiology
  generic route asset state.
- Human Physiology generated branch components now resolve to registered local support GLBs instead
  of unresolved placeholder paths. This improves the generic `/app/labs/branch/human-physiology`
  route, while the dedicated `/app/labs/physiology` route remains the stronger procedural flagship.
- Guard tests added/extended:
  `quantaora-app/src/data/cellBiologyAssetWiring.test.ts`,
  `quantaora-app/src/data/humanPhysiologyAssetWiring.test.ts`, and the new tracker test. The
  generated module files were patched directly because this checkout does not contain the expected
  `content/subjects/...` source tree; if that tree returns, mirror these model-path changes there.
- Quality distinction: this wave reduces obvious realism gaps but does not close the P1 asset
  realism queue. Evolution, Animals, Biochemistry Foundations, Sound, Fluids, and
  Heat And Thermodynamics still need sourced or artist-grade assets. Cell Biology, Human
  Physiology, Health/Disease, Neuroscience, and Biochemistry Links still need deeper flagship
  replacements beyond the support upgrades recorded here.
- Browser QA caught the exact user-facing risk from larger real meshes: the ribosome and pathogen
  could sit too close to the canvas edge. `GenericViewer` now receives per-component min/max camera
  bounds, `GenericModel` has targeted fit/offset rules for the ribosome, influenza pathogen, and
  Human Physiology support models, and camera distance changes recenter on the model instead of
  preserving stale camera direction. This keeps the common toolbar zoom controls from creating
  clipped views for these routes.
- Validation for this slice passed: `npm test -- src/data/assetRealismTracker.test.ts
  src/data/cellBiologyAssetWiring.test.ts src/data/healthDiseaseAssetWiring.test.ts
  src/data/humanPhysiologyAssetWiring.test.ts src/routes/BranchLab.test.ts
  src/routes/dedicatedCauseEffectPanels.test.ts`, `npm run quality:gaps`, and `npm run build`.
  Screenshot artifacts:
  `quantaora-app/review-screenshots/asset-realism-wave1-2026-08-31/cell-biology-cell-wall-desktop.png`,
  `cell-biology-ribosome-desktop.png`, `cell-biology-ribosome-mobile.png`,
  `health-disease-pathogen-desktop.png`, `health-disease-pathogen-mobile.png`,
  `human-physiology-blood-circulation-desktop.png`, and
  `human-physiology-blood-circulation-mobile.png`.
- Continued the asset-realism lane with Biology / Evolution sourcing groundwork. Added
  `docs/assets/biology-evolution-sourcing-candidates.json` with five Smithsonian CC0/Public Domain
  Sketchfab candidates mapped to Fossil Evidence, Common Ancestry, Adaptation, and Variation, plus
  the rejected non-commercial blue-whale candidate. Added
  `quantaora-app/src/data/biologyEvolutionSourcingCandidates.test.ts`.
- Hardened `quantaora-app/scripts/assets/import-sketchfab-candidate.mjs`: default output folders
  now derive from the manifest branch id, so Evolution imports land under
  `public/models/sourced/biology-evolution/` instead of the Animals folder. Guarded by
  `quantaora-app/src/data/sketchfabImporter.test.ts`.
- `quantaora-app/src/data/assetRealismTracker.ts` now distinguishes
  `ready-for-authenticated-import` from generic `needs-sourcing`. Animals and Evolution are
  now import-ready once `SKETCHFAB_TOKEN` exists; Sound, Fluids, Heat/Thermodynamics, and
  Biochemistry Foundations still need candidate sourcing.
- Live dry-run validation passed for Evolution candidates Nothrotheriops, Triceratops, and
  Mammuthus using `npm run assets:import:sketchfab -- --manifest
  ../docs/assets/biology-evolution-sourcing-candidates.json --candidate <candidate> --dry-run`.
- Added attribution-review sourcing manifests for the remaining unsourced P1 realism branches:
  `docs/assets/physics-sound-sourcing-candidates.json`,
  `docs/assets/physics-fluids-sourcing-candidates.json`,
  `docs/assets/physics-heat-thermodynamics-sourcing-candidates.json`, and
  `docs/assets/biology-biochemistry-foundations-sourcing-candidates.json`. These candidates are
  mostly CC Attribution, so they require attribution review and `--allow-attrib`; they are not
  treated as CLEAR or wired yet.
- `quantaora-app/scripts/assets/import-sketchfab-candidate.mjs` now derives default sourced folders
  from both manifest `subject` and `branchId`, so Physics manifests target
  `public/models/sourced/physics-*` and Biology manifests target `public/models/sourced/biology-*`.
  Guarded by `quantaora-app/src/data/sketchfabImporter.test.ts`.
- Dry-run validation passed for one candidate in each new manifest: tuning fork, graduated
  cylinders, thermometer, and triose phosphate isomerase. The next blocked step is actual download,
  optimization, license sidecar review, registry wiring, and visual screenshots after
  `SKETCHFAB_TOKEN` is available.

## Previous Session Delta — 2026-08-29

- Dedicated lab route integration completed for the shared cause/effect system:
  `src/routes/CellLab.tsx` now renders the shared Cell Biology panel and saves `cellControls`;
  `src/routes/PhysiologyLab.tsx` now renders the shared Human Physiology panel and saves
  `physiologyControls`.
- Extracted shared config-driven panel code into
  `src/components/labs/BranchCauseEffectPanel.tsx` and shared configs/defaults into
  `src/data/branchCauseEffectConfigs.ts`. `BranchLab.tsx` now imports these for Cell Biology,
  Evolution, Animals, Biochemistry Links, and Human Physiology instead of embedding the config
  block locally.
- Extracted the existing bespoke panels for Sound, Fluids, Heat And Thermodynamics, Health And
  Disease, Neuroscience, and Biochemistry Foundations into
  `src/components/labs/BranchBespokeCauseEffectPanels.tsx`. This preserves the option-rich custom
  behavior while reducing `BranchLab.tsx` ownership.
- First concrete asset-realism upgrade in this slice: Health And Disease > Pathogen now uses the
  existing vetted NIH influenza hero GLB at
  `/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb` instead of the authored
  placeholder path. The GLB and license sidecar already exist in the repo and are guarded by
  `src/data/healthDiseaseAssetWiring.test.ts`.
- Performance groundwork: the production `BranchLab` route chunk dropped from about 172 KB gzip
  40.00 KB to about 158.64 KB gzip 36.23 KB after extracting the shared/config panel code. Large
  `branchModules`, `react-three-fiber`, and app index chunks remain.
- New focused tests added: `src/routes/dedicatedCauseEffectPanels.test.ts` and
  `src/data/healthDiseaseAssetWiring.test.ts`. Narrow validation passed for BranchLab wiring,
  dedicated Cell/Physiology route wiring, Cell Biology asset wiring, and Health/Disease asset
  wiring.
- Refactored `src/routes/BranchLab.tsx` with a reusable data-driven
  `BranchCauseEffectPanel` system for branch-specific cause/effect learning panels. Existing
  bespoke panels for Sound, Fluids, Heat And Thermodynamics, Health And Disease, Neuroscience, and
  Biochemistry Foundations were preserved to avoid regressions.
- Added config-driven cause/effect panels for Cell Biology, Evolution, Animals, Biochemistry Links,
  and Human Physiology. Each config defines learner controls, computed cause/effect results,
  component-specific focus text, compact visual meters, and saved `BottomTray` lab state.
- The new panels are available on generic branch lab routes:
  `/app/labs/branch/cell-biology`, `/app/labs/branch/evolution`,
  `/app/labs/branch/animals`, `/app/labs/branch/biochemistry-links`, and
  `/app/labs/branch/human-physiology`. Important routing note: the main app still has dedicated
  `/app/labs/cells` and `/app/labs/physiology` routes, so those dedicated pages do not yet consume
  this generic config system.
- Added focused source tests in `src/routes/BranchLab.test.ts` for the reusable panel system, the
  five new branch configs, required learner controls/results, and saved branch state.
- Validation for this config-driven slice passed: `npm test -- src/routes/BranchLab.test.ts`,
  `npm test -- src/routes/BranchLab.test.ts src/data/biologyRemainingBranches.test.ts
  src/data/foundationBranches.test.ts src/data/physicsEverydayBranches.test.ts
  src/data/cellBiologyAssetWiring.test.ts`, `npm run quality:gaps`, `npm run build`, and Playwright
  checks for `/app/labs/branch/cell-biology`, `/app/labs/branch/animals`, and
  `/app/labs/branch/human-physiology`.
- Screenshot artifacts for this slice:
  `quantaora-app/review-screenshots/config-driven-cause-effect-2026-08-29/cell-biology-desktop.png`,
  `cell-biology-desktop-changed.png`, `cell-biology-mobile.png`, `animals-desktop.png`,
  `animals-desktop-changed.png`, `animals-mobile.png`, `human-physiology-desktop.png`,
  `human-physiology-desktop-changed.png`, and `human-physiology-mobile.png`.
- Important quality distinction: these five branches now have better interactive learning coverage,
  but they remain in the P1 asset-realism queue until weak authored visuals are replaced with
  sourced or artist-grade `.glb` assets.
- P1 biology/biochemistry product-quality pass added three more branch-specific cause/effect
  panels in `src/routes/BranchLab.tsx`: Health And Disease, Neuroscience, and Biochemistry
  Foundations. These render above the generic mission, use computed learner-facing results, and
  pass their branch state into `BottomTray` as `labState` for saved experiments.
- Health And Disease now lets learners change pathogen amount, immune response strength, time since
  infection, vaccine readiness, spread/contact rate, and recovery support. The panel computes
  infection pressure, immune advantage, symptom risk, antibody readiness, and contact-rate spread
  pressure.
- Neuroscience now lets learners change signal strength, myelin level, synapse gap,
  neurotransmitter amount, stimulus frequency, and fatigue/rest level. The panel computes signal
  speed, synapse-crossing chance, reaction delay, and fatigue load.
- Biochemistry Foundations now lets learners change temperature, pH, substrate amount, enzyme shape
  fit, concentration, and membrane permeability/folding stress. The panel computes reaction rate,
  enzyme condition/fit, product output, denaturation/folding risk, and membrane permeability.
- Validation for this slice passed: `npm test -- src/routes/BranchLab.test.ts`, `npm test --
  src/routes/BranchLab.test.ts src/data/biologyRemainingBranches.test.ts
  src/data/foundationBranches.test.ts`, `npm run quality:gaps`, `npm run build`, and browser
  interaction checks for `/app/labs/branch/health-and-disease`, `/app/labs/branch/neuroscience`,
  and `/app/labs/branch/biochemistry-foundations`.
- Screenshot artifacts for this slice:
  `quantaora-app/review-screenshots/bio-cause-effect-panels-2026-08-29/health-and-disease-desktop.png`,
  `health-and-disease-desktop-changed.png`, `health-and-disease-mobile.png`,
  `health-and-disease-mobile-results.png`, `neuroscience-desktop.png`,
  `neuroscience-desktop-changed.png`, `neuroscience-mobile.png`, `neuroscience-mobile-results.png`,
  `biochemistry-foundations-desktop.png`, `biochemistry-foundations-desktop-changed.png`,
  `biochemistry-foundations-mobile.png`, and `biochemistry-foundations-mobile-results.png`.
- Important quality distinction: these three branches now have materially better learning
  interactions, but they remain in the P1 asset-realism queue until their authored concept GLBs are
  replaced or upgraded to anatomy-level inspectable assets.

## Previous Session Delta — 2026-08-28

- Continued the P1 visual-quality hardening pass after the asset coverage waves. Full screenshot
  sweep artifacts live at
  `quantaora-app/review-screenshots/lab-visual-signals-2026-08-27/`, including
  `contact-sheet-1-settled.jpg` through `contact-sheet-4-settled.jpg`.
- Upgraded the shared `GlbLoadingStatus` surface in `src/components/explorer/GlbErrorBoundary.tsx`
  from a small floating pill to a clearer premium loading panel with `role="status"` and
  `aria-live="polite"`, so slow GLBs are understandable instead of looking broken.
- Hardened `scripts/qa/lab-visual-signals.mjs`: visible loading status now fails the route after
  settle wait, while hidden/stale loading text no longer causes false 45s waits. Solar System and
  Atoms skeletons now expose visible status semantics while loading, and the orbit Suspense fallback
  is covered too.
- Validation passed after the loader/QA changes:
  `npm test -- src/routes/labGlbErrorStatusAnnouncement.test.ts src/glbSafetyAudit.test.ts`
  (32/32), `npm run build`, and `QA_SCREENSHOTS=none npm run qa:visual-signals` (48/48).
- Current visual QA reality: coverage is functional across the audited routes, and the new P1
  authored GLBs removed the blank/coming-soon gap. The next quality gap is realism and polish:
  several generated concept GLBs are useful but do not reach the Human Anatomy flagship asset bar.
  Prioritize sourced or artist-grade replacements for weak authored assets by branch, plus GLB
  optimization for heavy sourced routes.
- Added `src/data/visualQualityRubric.ts` as the explicit anatomy-bar quality source of truth and
  `src/data/visualQualityRubric.test.ts` to force every live branch to have a grade. `npm run
  quality:gaps` now includes `Visual grade` and `Replacement target` columns while keeping the
  existing route column stable for browser QA.
- Current `npm run quality:gaps` result after the visual rubric: 51 branches audited, 0 missing
  asset mappings, 1 P0 legal branch, and 11 P1 asset-realism branches. The P1 replacement queue is
  Cell Biology, Human Physiology, Evolution, Animals, Health And Disease, Neuroscience,
  Biochemistry Foundations, Biochemistry Links, Sound, Fluids, and Heat And Thermodynamics.
- Validation after the visual rubric passed: `npm test -- src/data/visualQualityRubric.test.ts`,
  `npm run quality:gaps`, `npm run build`, and `QA_SCREENSHOTS=none npm run qa:visual-signals`
  (48/48).
- Labs index now consumes the visual rubric in `src/routes/Labs.tsx` so learner-facing labels are
  honest and product-safe: `Flagship 3D`, `Interactive 3D`, `Concept Lab`, and `Guided Model`
  instead of internal asset/sourcing language. Targeted desktop/mobile screenshots:
  `quantaora-app/review-screenshots/labs-quality-rubric-desktop.png` and
  `quantaora-app/review-screenshots/labs-quality-rubric-mobile.png`. Validation: `npm run build`.
- Started the first real P1 asset-realism branch pipeline for Biology / Animals. Added vetted
  candidate manifest `docs/assets/biology-animals-sourcing-candidates.json` with five Smithsonian
  CC0/Public Domain Sketchfab candidates and one rejected non-commercial candidate. Added strict
  importer `quantaora-app/scripts/assets/import-sketchfab-candidate.mjs` plus package script
  `npm run assets:import:sketchfab`. The importer verifies live Sketchfab API license metadata,
  rejects non-commercial licenses, requires `SKETCHFAB_TOKEN` for downloads, writes sourced
  sidecar provenance, and supports metadata-only `--dry-run`.
- Validation for the Animals sourcing pipeline passed:
  `npm run assets:import:sketchfab -- --candidate smithsonian-diodon-hystrix --dry-run` and
  `npm test -- src/data/biologyAnimalsSourcingCandidates.test.ts`.
- P1 Sound product-quality pass started in `src/routes/BranchLab.tsx`: the generic Sound branch now
  gets a real cause/effect control panel above the mission. Learners can change frequency,
  amplitude, listener distance, reflecting-wall distance, and medium; the panel computes wavelength,
  cycle time, relative loudness, echo delay, and vacuum/no-medium behavior. Sound control state is
  passed into `BottomTray` as `labState`, so saved experiments keep the Sound setup rather than only
  the selected component.
- Sound validation passed: `npm test -- src/routes/BranchLab.test.ts
  src/data/physicsEverydayBranches.test.ts`, `npm run build`, and browser interaction checks on
  `/app/labs/branch/sound`. Screenshots:
  `quantaora-app/review-screenshots/sound-cause-effect-desktop.png`,
  `quantaora-app/review-screenshots/sound-cause-effect-mobile-final.png`, and
  `quantaora-app/review-screenshots/sound-cause-effect-mobile-controls-final.png`.
- P1 Fluids product-quality pass started in `src/routes/BranchLab.tsx`: the generic Fluids branch
  now gets a real cause/effect control panel above the mission. Learners can change depth, fluid
  density, object mass, object volume, viscosity, tube width, and temperature; the panel computes
  pressure, buoyant force vs object weight, float/sink result, and flow score. Fluids control state
  is passed into `BottomTray` as `labState`, so saved experiments keep the Fluids setup.
- Fluids validation passed: `npm test -- src/routes/BranchLab.test.ts
  src/data/physicsEverydayBranches.test.ts`, `npm run build`, and browser interaction checks on
  `/app/labs/branch/fluids`. Screenshots:
  `quantaora-app/review-screenshots/fluids-cause-effect-desktop.png`,
  `quantaora-app/review-screenshots/fluids-cause-effect-desktop-changed.png`, and
  `quantaora-app/review-screenshots/fluids-cause-effect-mobile.png`.
- P1 Heat And Thermodynamics product-quality pass started in `src/routes/BranchLab.tsx`: the
  generic Heat branch now gets a real cause/effect control panel above the mission. Learners can
  change heat source temperature, object temperature, material type, insulation, particle motion,
  exposure time, and transfer mode; the panel computes heat-flow direction, estimated object
  temperature change, particle speed, fastest/slowest material comparison, and insulation effect.
  Heat control state is passed into `BottomTray` as `labState`, so saved experiments keep the Heat
  setup.
- Mobile BranchLab content rails now include bottom padding so long branch-specific control panels
  can scroll above the fixed bottom tray. Remaining polish: on small phones, the fixed tray still
  limits how much of the lower result cards can be seen at once; content is reachable, but a future
  compact tray/collapsible tray pass would improve comfort.
- Heat validation passed: `npm test -- src/routes/BranchLab.test.ts
  src/data/physicsEverydayBranches.test.ts`, `npm run quality:gaps`, `npm run build`, and browser
  interaction checks on `/app/labs/branch/heat-and-thermodynamics`. Screenshots:
  `quantaora-app/review-screenshots/heat-thermo-cause-effect-2026-08-28/heat-thermo-desktop.png`,
  `quantaora-app/review-screenshots/heat-thermo-cause-effect-2026-08-28/heat-thermo-desktop-changed.png`,
  `quantaora-app/review-screenshots/heat-thermo-cause-effect-2026-08-28/heat-thermo-mobile.png`,
  `quantaora-app/review-screenshots/heat-thermo-cause-effect-2026-08-28/heat-thermo-mobile-controls.png`, and
  `quantaora-app/review-screenshots/heat-thermo-cause-effect-2026-08-28/heat-thermo-mobile-results.png`.
- Remaining launch distinction: if this becomes a paid product, the Human Anatomy REVIEW assets
  remain P0 legal/provenance work. If it stays unpaid/internal, the next best work is P1/P2 visual
  realism, model optimization, and bundle/chunk cleanup.

## Latest Session Delta — 2026-08-26

- Controlled Codex-agent P1 asset coverage wave completed with the corrected low-token protocol:
  parent read the gap report/graph, launched only two forkless workers at a time, gave workers exact
  read/write scopes, closed agents immediately after completion, and merged all shared
  `modelRegistry.ts` / `ASSET-LICENSES.md` changes centrally.
- Added 96 project-owned CLEAR authored GLBs across the remaining P1 asset gaps:
  Genetics 13, Number Sense 9, Biology physiology/ecology/plants/microbiology 28,
  Physics/Chemistry foundations 17 generated then corrected to 17 registered curriculum IDs,
  Advanced Math 20, and Space Stars/Galaxies 9. Builder scripts:
  `scripts/assets/build-genetics-p1-glbs.mjs`,
  `scripts/assets/build-number-sense-p1-glbs.mjs`,
  `scripts/assets/build-biology-p1-gap-glbs.mjs`,
  `scripts/assets/build-physics-chemistry-p1-gap-glbs.mjs`,
  `scripts/assets/build-math-advanced-p1-gap-glbs.mjs`, and
  `scripts/assets/build-space-objects-p1-gap-glbs.mjs`.
- Current `npm run quality:gaps` result: 51 branches audited, 315 hierarchy components,
  311 hero mappings, 33 support mappings, 0 components without a registered asset mapping,
  50 branches with P1 depth proof, 0 P1 branches still needing depth proof. Remaining P0 is only
  the known Human Anatomy paid-launch provenance/legal track: 9 REVIEW assets / 9 paid-risk assets.
- Validation after the controlled-agent wave passed: new asset builders, `npm run assets:check`
  (329 registered GLBs; only the known 9 Anatomy REVIEW warnings), `npm run quality:gaps`,
  focused touched-branch tests (54/54), `npm run codegen:check`, full `npm test` (446/446),
  `npm run build`, and `QA_SCREENSHOTS=none npm run qa:visual-signals` (48/48 routes, 0 failures).
- Note for next cleanup: visual QA emitted repeated `THREE.Clock` deprecation warnings from the
  running app, but no behavior/layout failures. Treat that as a P2 maintenance cleanup, not a P1
  blocker.

- Added a lightweight repo graph/context-pack workflow for low-token execution:
  `quantaora-app/scripts/context/build-code-graph.mjs`.
- New command: from `quantaora-app/`, run `npm run context:graph` to regenerate
  `docs/CODE-GRAPH.json` and `docs/AGENT-CONTEXT-PACKS.md`.
- To scope an agent to one branch, run
  `node scripts/context/build-code-graph.mjs --branch <branch-id>` and give the agent only the
  returned `filesToRead` plus the listed focused validation commands.
- Current graph baseline: 317 source files scanned, 754 local dependency edges, and 51 branch
  packs generated. Human Anatomy is handled as a flagship special case through `Explore.tsx` and
  `organs.ts`.
- Serena is the preferred semantic context tool for this workspace. `.serena/project.yml` is now
  configured for the TypeScript language server, scoped to `quantaora-app`, and ignores heavy
  folders such as `node_modules`, screenshots, asset-quality reports, and Claude worktrees.
- Corrected multi-agent protocol after the usage-limit incident: the parent agent must run graph
  discovery and validation; child agents must not run `context:graph`, broad search, codegen,
  assets checks, full build, or repo-wide tests. Launch at most 2 Codex child agents at a time.
  Each child receives 3-10 exact files, a disjoint write scope, one focused test command, and a
  final report capped to `changed/tests/blocked`.
- Latest controlled retry used two low-cost workers for Mechanics and Electricity. Both returned
  that critical-thinking missions and live control-impact UI were already present, with focused
  tests passing. Parent validation then passed focused route tests and production build after a
  one-line unused-variable fix in `ChemicalReactionsLab.tsx`.
- Second controlled wave used two low-cost workers for Atoms/Periodic Table and Math
  Manipulatives. Atoms added a focused P1 depth test; Math updated 29 mission prompts and tests.
  Parent validation passed the wave-focused tests plus production build.
- Third controlled wave used two low-cost workers for Energy and Algebra. Both added focused
  source-level P1 depth tests and mission/challenge markers; parent validation passed focused
  tests, TypeScript, and production build.
- Fourth controlled wave used two low-cost workers for Space motion and Molecules. Both added
  focused P1 depth tests; parent validation passed the wave tests, TypeScript, and production
  build.
- Fifth controlled wave used two low-cost workers for Plants and Ecology. Both added focused P1
  depth tests; parent validation passed the wave tests, TypeScript, and production build.
- Sixth controlled wave used two low-cost workers for Microbiology and Stars/Galaxies. Both added
  focused P1 depth tests; parent validation passed the wave tests, TypeScript, and production
  build.
- Seventh controlled wave used two low-cost workers for Genetics and Number Sense. Both added
  focused P1 depth tests; parent validation passed the wave tests, TypeScript, and production
  build.
- Eighth controlled wave used two low-cost workers for Cell Biology and Moons. Both added focused
  P1 depth tests; parent validation passed the wave tests, TypeScript, and production build.
- After the P1 waves, `npm run quality:gaps` reports 50 branches with P1 depth proof and 0 P1
  branches still needing depth proof. Full validation passed: `npm test` 446/446,
  `npm run codegen:check`, `npm run assets:check`, and `npm run build`. Remaining P1 work is
  visual QA/screenshots and any route-specific defects found there.
- P1 visual QA follow-up fixed route-specific defects found in screenshots: Energy and Earth In
  Space mission/challenge panels now open by default, Moons shows its mission before secondary
  comparison controls, and Math Manipulatives missions now surface Observe/Predict/Change/Explain
  on the first screen. Focused tests, TypeScript, build, `quality:gaps`, and desktop/mobile
  screenshot signals passed. Screenshot folder:
  `quantaora-app/review-screenshots/p1-depth-qa-2026-08-26/`.
- Added a reusable visual QA gate: `npm run qa:visual-signals`. It reads
  `docs/TODAY-P0-P1-GAP-REPORT.md`, visits each unique lab route with Playwright, and checks for
  a real lab stage, shared toolbar, Zoom In/Out, Lesson, Checkpoint, no horizontal overflow, and
  visible Observe/Predict/Explain language. Use `QA_SCREENSHOTS=none` for low-token pass/fail,
  `QA_SCREENSHOTS=failures` for failure images, and `QA_ROUTE_FILTER=<route-or-branch>` for a
  targeted route. After fixing generic and flagship default mission visibility plus the
  Trigonometry shell, the full sweep passes 48/48 routes with 0 failures.

## Low-Token Multi-Agent Contract

Use this pattern for every remaining branch/lab wave.

1. Parent runs `npm run context:graph`.
2. Parent prints the branch pack and selects only the files the child must read.
3. Child prompt includes exact read files, exact write files, acceptance criteria, and one focused
   test command.
4. Child is forbidden from broad repo exploration, graph regeneration, full build, codegen, assets
   checks, lint, screenshots, or long final summaries.
5. Parent reviews changes, integrates shared route/registry edits centrally, then runs shared
   validation once.
6. Parent closes completed/errored agents before launching another wave.

## Latest Session Delta — 2026-08-24

- Number Sense P1 depth pass shipped at `/app/labs/number-sense`: 10 guided missions now map
  one-to-one to the arithmetic components; selecting a component syncs the mission card; desktop
  quick manipulative actions moved into the bottom control band so they do not cover the model;
  Clean view hides the added canvas actions. Browser QA screenshots:
  `review-screenshots/number-sense-p1-2026-08-24/number-sense-desktop-fixed.png`,
  `number-sense-place-value-fixed.png`, and `number-sense-mobile.png`.
- First Flight now saves a real three-step `recommendedMission` in the learner profile and shows
  it during onboarding; Parent/Teacher reads that saved mission and renders linked steps.
- `npm run quality:gaps` now generates `docs/TODAY-P0-P1-GAP-REPORT.md`, the operational P0/P1
  queue. Current counts after the 2026-08-24 P0 asset waves: 51 branches, 315 hierarchy
  components, 1 P0 branch, 50 P1 branches, 147 hero mappings, 24 support mappings,
  148 components without registered asset mappings, and 9 Anatomy REVIEW paid-launch risks.
- Asset registry mappings were corrected for methane/hydrocarbon and the electric stove
  conduction/phase-change examples so already-wired high-value GLBs are counted accurately.
- Cell Biology DNA now uses `/models/biology/genetics/dna-b-form-double-helix-nih.glb` from
  authored metadata through generated data. The old `/assets/models/biology/cell-biology/dna/dna.glb`
  placeholder path is guarded against by `src/data/cellBiologyAssetWiring.test.ts`.
- Space P0 partial branches now have three new project-owned CLEAR GLBs:
  `public/models/space/authored/comet-nucleus-authored.glb`,
  `sample-return-workflow-authored.glb`, and `wavelength-comparison-authored.glb`.
  They are generated by `quantaora-app/scripts/assets/build-space-p0-glbs.mjs`, wired into
  Asteroids And Comets / Space Exploration / Telescopes And Observation, registered in
  `modelRegistry.ts`, and recorded in `ASSET-LICENSES.md`.
- Browser smoke screenshots for those Space assets live in
  `quantaora-app/review-screenshots/space-p0-authored-2026-08-24/`; desktop QA confirmed one
  canvas, no horizontal overflow, and visible centered models.
- Physics Sound/Waves/Fluids now have 13 component-specific project-owned CLEAR authored GLBs in
  `public/models/physics/authored/`, generated by
  `quantaora-app/scripts/assets/build-physics-p0-glbs.mjs`. They are wired into `sound.ts`,
  `waves.ts`, and `fluids.ts`, registered in `modelRegistry.ts`, and recorded in
  `ASSET-LICENSES.md`.
- Browser smoke screenshots for those Physics assets live in
  `quantaora-app/review-screenshots/physics-p0-authored-2026-08-24/`; desktop QA confirmed Echo,
  Frequency, and Flow/Viscosity render as one visible centered canvas with no horizontal overflow.
- Chemistry P0 authored GLB wave is complete: 25 project-owned CLEAR GLBs in
  `public/models/chemistry/authored/` for States Of Matter, Acids And Bases, Solutions,
  Stoichiometry Foundations, and Biochemistry Links. Generated by
  `scripts/assets/build-chemistry-p0-glbs.mjs`, wired into branch data, registered in
  `modelRegistry.ts`, and recorded in `ASSET-LICENSES.md`. Screenshots live in
  `quantaora-app/review-screenshots/chemistry-p0-authored-2026-08-24/`.
- Foundation P0 authored GLB wave is complete: 15 project-owned CLEAR GLBs in
  `public/models/foundations/authored/` for Modern Physics Foundations, Gravity And Orbits, and
  Cosmology Foundations. Generated by `scripts/assets/build-space-physics-foundation-glbs.mjs`,
  wired into branch data, registered in `modelRegistry.ts`, and recorded in `ASSET-LICENSES.md`.
- Biology P0 authored GLB wave is complete: 31 project-owned CLEAR GLBs in
  `public/models/biology/authored/` for remaining Cell Biology specialized cells plus Evolution,
  Animals, Health And Disease, Neuroscience, and Biochemistry Foundations. Generated by
  `scripts/assets/build-biology-p0-glbs.mjs`, wired into cell/branch data, registered in
  `modelRegistry.ts`, and recorded in `ASSET-LICENSES.md`.
- Browser smoke screenshots for the latest cross-subject sweep live in
  `quantaora-app/review-screenshots/p0-p1-hero-complete-2026-08-24/`; checked routes include
  Cell Biology, Evolution, Animals, Health And Disease, Neuroscience, Biochemistry Foundations,
  Modern Physics Foundations, Gravity And Orbits, and Cosmology Foundations. Desktop QA confirmed
  one canvas, no horizontal overflow, selected component text present, and visible centered models.
- Validation run for this slice: `npm test`, `npm run build`, `npm run codegen:check`,
  `npm run assets:check`, and `npm run quality:gaps` pass. `assets:check` still reports only the
  known 9 Anatomy REVIEW warnings.

## Previous Session Delta — 2026-08-23

- Generic procedural BranchLab scenes now report animation availability and respond to
  Play/Pause with a subtle motion pulse; real embedded GLB animation behavior is unchanged.
- Physics Heat & Thermodynamics now uses the cleared electric-stove GLB for conduction and
  phase-change examples, with a tall-apparatus camera preset to avoid clipping.
- Organic Chemistry Hydrocarbon now uses the cleared methane GLB, with a large-molecule camera
  preset to avoid edge clipping.
- Biology non-anatomy staged assets were reviewed conservatively: existing plant/ecology growth
  sequences are already wired where the review passed; the glucose asset stayed unwired because
  its review says it is low-recognizability/conditional for kids.
- Earth In Space Rotation & Revolution now has a visible speed experiment panel: Spin only,
  Orbit only, Fast days, Fast year, day signal, year signal, and an explicit conclusion tying
  rotation to day/night and revolution to the yearly orbit.
- Earth In Space motion/seasons framing was adjusted: default camera distance `16`, max distance
  `24`, teaching orbit radius `4.2`, and `WIDE_SCENE_X_OFFSET = -1.2`.
- Browser QA screenshot: `review-screenshots/earth-motion-speed-2026-08-23/rotation-revolution-scene-offset-fixed.png`.

## Canonical Reading Order

1. `docs/TODAY-EXECUTION.md` — low-token execution brief, agent ownership, P0 scope, and quality bar.
2. `docs/CLAUDE-EXECUTION.md` — Claude/Claude Code budget rules and scoped agent template.
3. `docs/AGENT-PROMPTS.md` — reusable scoped prompts for parallel agents.
4. `docs/PROJECT-STATUS.md` — current product state, phase status, honest gaps.
5. `docs/NEXT-SCOPE-IMPLEMENTATION.md` — next execution slice and quality bar.
6. `docs/ASSET-SOURCING.md` — non-anatomy `.glb` sourcing priorities and candidate tracker.
7. `docs/ASSET-LICENSES.md` — asset permissions, paid-launch blockers, cleared sources.
8. `docs/QUALITY-GAP-MATRIX.md` — branch-level anatomy-quality gaps and next build order.
9. `docs/QA-CHECKLIST.md` — low-token visual QA checklist for current execution.
10. `docs/QA-GATE.md` — broader component/lab visual quality bar.
11. `docs/PRODUCTION-PLAN.md` — long-range dependency order.
12. `docs/quantaora-product-tech-spec.md` — full product spec and screen intent.

## Current Product State

- Product name: Quantaora.
- App: `quantaora-app/`, Vite + React + TypeScript + React Three Fiber.
- Data: content/codegen foundation exists; app still has a mix of bespoke flagship labs and
  generated branch labs.
- Branch breadth: as of 2026-08-23, there are no hierarchy branches left with
  `status: 'planned'`. The remaining gap is no longer route/content coverage; it is upgrading
  procedural first-pass branches to Anatomy-level visual quality with sourced/cleared `.glb`
  assets or bespoke flagship simulators.
- Latest validation baseline: `rtk test npm test`, `rtk err npm run build`,
  `rtk test npm run codegen:check`, `rtk test npm run assets:check`, and
  `rtk test npm run quality:gaps` pass. The only asset warnings are the known nine Anatomy REVIEW
  provenance warnings.
- Storage: local-first Zustand persisted blob, not IndexedDB yet.
- Onboarding: `/first-flight` exists, stores local learner profile, and now saves a three-step
  recommended mission path.
- Labs index: professional accordion/filter page with subject, search, quality, and grade-band
  filters.
- Canvas controls: shared toolbar across labs with Rotate, Play/Pause, Isolate, Section, Compare,
  Zoom In/Out, Fullscreen, More, Reset.
- More menu: labels, X-Ray where meaningful, Fit view, Clean view.
- GLB animation foundation: real embedded GLB clips auto-play and can be paused; static GLBs show
  disabled Play. Orbit uses Play/Pause for simulation.
- Cell asset licensing: the old NIH non-commercial animal-cell/neuron GLBs were replaced by
  project-owned authored animated GLBs on 2026-08-12.
- Anatomy assets are the current quality reference. Do not spend the primary product lane
  re-finding organ models; keep anatomy provenance cleanup as a parallel paid-release track.
- Quality-gap focus is now non-anatomy: Physics Electricity, Chemistry Molecules/Atom, Math
  Algebra, Space branch reconciliation, then Biology non-anatomy.
- Physics Electricity first pass is live at `/app/labs/electricity`: circuit simulator, current
  animation, switch, series/parallel mode, voltage/resistance/load controls, compact meters, Tune
  Circuit drawer, and shared toolbar.
- Physics Mechanics first pass is live at `/app/labs/motion`: all 13 authored mechanics
  components share one ramp/cart simulator with applied force, mass, friction, slope, gravity,
  net force, acceleration, velocity, position, distance/displacement, normal force, weight,
  momentum, and kinetic-energy indicators. It starts paused so the learner deliberately runs the
  experiment, and uses the shared toolbar plus `Tune mechanics` drawer.
- Physics Energy first pass is live at `/app/labs/energy`: all 6 authored energy components share
  one coaster/cart transfer simulator with start height, mass, heat loss, push force, push
  distance, transfer time, total energy, stored/potential energy, motion/kinetic energy, heat,
  useful output, efficiency, work, and power indicators. It starts paused and uses the shared
  toolbar plus `Tune energy` drawer.
- Chemistry Chemical Reactions first pass is live at `/app/labs/reactions`: all 7 authored
  reaction components share one reaction bench with H2/O2/H2O coefficients, temperature, catalyst
  help, heat mode, atom-count panels, balanced/unbalanced feedback, rate, energy, and absorbed/
  released heat indicators. It starts paused and uses the shared toolbar plus `Tune reaction`
  drawer.
- Chemistry Atoms/Periodic Table first pass is live at `/app/labs/atoms`: all 9 authored atom
  components and all 10 authored periodic-table components share one atom/table bridge with a
  procedural atom model, clickable first-18 table, proton/electron/neutron counts, shell layout,
  group/period readouts, ion charge, isotope neutron, electron-speed, and table-emphasis controls.
  It starts paused and uses the shared toolbar plus `Tune atom` drawer.
- Chemistry Molecules first pass is live at `/app/labs/molecules`: molecule presets, H/C/N/O atom
  adding, bond add/remove mode, formula/bond/open-valence meters, atom inspection, animated bond
  electrons, and shared toolbar/Clean view.
- Math Algebra first pass is live at `/app/labs/functions`: savings, taxi, draining tank, balance
  scale, and candle contexts with concrete objects, equation/graph/table linkage, variable
  controls, shared toolbar, and Clean view.
- Math Manipulatives first pass is live at `/app/labs/math-manipulatives`: all 11 Geometry,
  all 8 Fractions/Ratios, and all 10 Data/Statistics components share one manipulative lab with
  angle/area/perimeter/volume controls, fraction tiles, ratio mixer, bar/line/statistics board,
  live mean/median/mode/range, compact meters, shared toolbar, and `Tune math` drawer.
- Math Number Sense P1 pass is live at `/app/labs/number-sense`: all 10 arithmetic components
  have concrete manipulatives, visible guided missions, mission/component sync, quick bottom-band
  actions for direct experimentation, compact meters, shared toolbar, and `Tune numbers` drawer.
- Space reconciliation first pass is live: Solar System, Stars, and Galaxies are counted as
  flagship labs; Galaxies has shared Play/Pause, camera Rotate, compact Tune galaxy controls, and
  mobile-safe Clean view.
- Solar System critical-thinking pass is live: `/app/labs/orbit` now separates rotation from
  revolution with a visible selected-planet spin arrow, compact Spin/Orbit/Year meters, an
  `Investigate motion` drawer, rotation-speed control, revolution-speed control, and
  orbital-distance/year-length cause-effect feedback.
- Genetics flagship first pass is live at `/app/labs/genetics`: DNA double helix with base-pair
  inspection (A–T, C–G), gene segment selection, mutation toggle (substitution/insertion/
  deletion with silent/missense/nonsense effects), real Play/Pause-driven replication and
  transcription-translation animation, protein fold toggle, chromosome packaging with DNA-coil
  reveal, allele/trait pairing, and Punnett-square grid with ratio bars — all 10 authored
  genetics components, procedural/hybrid (RCSB GLB bank referenced but never harvested to disk).
  Compact `Tune molecule` panel, meters, shared toolbar, and Clean view.
- Plants flagship second pass is live at `/app/labs/plants`: all 9 authored plants components in
  one plant studio — chloroplast cutaway (outer membrane peel, grana disc stacks, chlorophyll
  flecks, sunlight/water/CO₂ input rays with photon flow, sugar+O₂ output flow), flower anatomy
  with pollen-transfer animation and seed-forming ovary, leaf food factory (vein network,
  chlorophyll, breathing stoma with CO₂-in/O₂-out gas arrows), phloem sugar flow leaf→root/seed
  sinks, root system in peelable soil (root cap, root hairs, rising xylem water, storage),
  seed cutaway with germination slider + sprout growth, stem two-way elevator (water up xylem /
  sugar down phloem, node rings, cross-section ring), stomata with guard-cell turgor slider
  (pore openness % with breathing cycle), and xylem tube-in-tube with rising water. Compact
  `Tune plant` panel (peel membrane/soil, show rays/veins/pollen path/cross-section/contrast),
  live meters, shared toolbar, and Clean view.
- Plants Seed critical-thinking pass is live: germination now stages seed coat split, root-first
  growth, shoot rise, leaf opening, and seedling explanation with compact stage/next-change
  meters and `Tune plant` scrubber anchors.
- Microbiology flagship third pass is live at `/app/labs/microbiology`: all 5 authored
  microbiology components in one microbe studio — bacteria cutaway (peelable cell wall +
  membrane, loose DNA loop and ribosomes, whipping flagellum, binary-fission pinch with
  division-buddy reveal), virus infection cycle (icosohedral coat with attachment spikes, peel
  to reveal genetic-material coil, attach → host cell → release of new virus particles), fungus
  on a soil block (peel soil to expose hyphae/mycelium, drifting spores, budding yeast),
  protozoa pond drop (amoeba with pulsing pseudopod + nucleus + food vacuole and engulfed food
  speck, flagellate whip, ciliate hairs), and microbiome (human silhouette with dense gut +
  sparse skin colonies, gut-wall close-up ring, helpful-job chips, antibiotic slider that
  visibly shrinks the community). Compact `Tune microbe` panel (peel wall/coat/soil, show
  flagellum/spikes/spores/yeast/movement/feeding/jobs), live meters, shared toolbar, and Clean
  view.
- Human Physiology flagship first pass is live at `/app/labs/physiology`: the route moved from
  process-diagram-only to shared `CanvasControls`, procedural 3D physiology scenes, compact
  meters, and a `Tune body` cause/effect drawer across all 9 authored processes. It covers heart
  pulse/pressure, breathing rate/airway tightness, digestion enzyme/meal-size, kidney
  water/waste load, nerve signal/pathway gap, muscle command/load, hormone delivery, immune
  signal/germ load, and heat/sweat regulation. Shared toolbar spacing was tightened so the full
  tool rail fits shorter stages.
- Ecology flagship first pass is live at `/app/labs/ecology`: the branch moved from generic
  branch viewer to a dedicated ecosystem diorama for all 11 authored components: organism,
  population, community, ecosystem, habitat, niche, producer, consumer, decomposer, predator, and
  prey. It has animated food-web energy flow, producer/consumer/decomposer/predator/prey visuals,
  habitat/water/shelter state, compact meters, and a `Tune ecosystem` drawer for sunlight,
  predator pressure, decomposer activity, and habitat stress. It uses the two existing clear
  Quaternius Ecology support GLBs plus procedural organisms; no new unclear assets were imported.
- Mobile BottomTray is now a compact action bar: Lesson, Checkpoint, and Notebook stay visible on
  mobile; Real-world stays desktop-only because DetailPanel already includes the explanation.
- Current top quality reference: Human Anatomy. Every other flagship must be judged against that
  visible 3D quality and interaction density.

## Current Route Map To Preserve

- Anatomy: `/app`
- Labs index: `/app/labs`
- Chemistry molecules flagship: `/app/labs/molecules`
- Solar System flagship: `/app/labs/orbit`
- Mechanics flagship: `/app/labs/motion`
- Energy flagship: `/app/labs/energy`
- Stars flagship: `/app/labs/stars`
- Galaxies flagship: `/app/labs/galaxies`
- Genetics flagship: `/app/labs/genetics`
- Ecology flagship: `/app/labs/ecology`
- Plants flagship: `/app/labs/plants`
- Microbiology flagship: `/app/labs/microbiology`
- Generated branch labs: `/app/labs/branch/:branchId`
- First Flight onboarding: `/first-flight`
- Notebook: `/app/notebook`
- Parent/Teacher: `/app/grownups`

## Latest Verified Commands

Run from `quantaora-app/`.

```bash
npm run build
npm run lint -- --quiet
npm run codegen:check
npm run assets:check
```

Latest result on 2026-08-17 after the Ecology flagship slice:

- `npm run build` (full `tsc -b` + Vite) passed. Vite still reports the known large single-chunk
  warning; route-level code splitting remains P2.
- `npm run lint -- --quiet` passed (0 errors).
- `npm run codegen:check` passed.
- `npm run assets:check` passed with 9 warnings: the anatomy organ GLBs are `REVIEW` and need
  final provenance/legal clearance.
- `PAID_RELEASE=1 npm run assets:check` intentionally fails on those same 9 REVIEW assets.
- 0 `NC-RISK` registered assets remain.

## Latest Visual QA Artifacts

Screenshots are in `quantaora-app/review-screenshots/implementation/`.

- `toolbar-mobile-icon-only.png` — mobile toolbar after icon-only fix.
- `toolbar-play-disabled-anatomy.png` — static GLB shows disabled Play.
- `clean-view-anatomy.png` — Clean view hides anatomy overlays and leaves Show UI.
- `clean-view-orbit.png` — Clean view hides orbit simulation controls and leaves Show UI.
- `labs-filter-layout-final-desktop.png` — Labs filters desktop layout.
- `labs-filter-layout-final-mobile.png` — Labs filters mobile layout.
- `xray-anatomy.png`, `xray-chemistry.png`, `xray-cells.png`, `xray-orbit.png` — X-Ray checks.
- `p0-authored-animal-cell-final.png` — project-owned animated animal-cell replacement.
- `p0-authored-neuron-final.png` — project-owned animated neuron replacement.
- `p0-authored-neuron-clean-view.png` — Clean view on the replacement neuron.
- `electricity-flagship-clear-desktop.png`, `electricity-flagship-controls-open-final.png`,
  `electricity-flagship-mobile-final.png`, `electricity-flagship-clean-mobile.png` — Electricity
  flagship QA.
- `chemistry-builder-desktop.png`, `chemistry-builder-open-desktop.png`,
  `chemistry-builder-add-atom-desktop.png`, `chemistry-builder-mobile.png`,
  `chemistry-builder-clean-mobile.png` — Chemistry molecule builder QA.
- `algebra-studio-desktop.png`, `algebra-studio-controls-open-desktop.png`,
  `algebra-studio-mobile.png`, `algebra-studio-clean-mobile.png`,
  `algebra-balance-scale-desktop.png` — Algebra concrete studio QA.
- `space-solar-flagship-desktop.png`, `space-stars-flagship-desktop.png`,
  `space-galaxies-flagship-desktop.png`, `space-galaxies-mobile.png`,
  `space-galaxies-clean-mobile.png`, `space-labs-flagship-index.png` — Space reconciliation QA.
- `genetics-flagship-desktop.png`, `genetics-flagship-controls-open-desktop.png`,
  `genetics-flagship-mobile.png`, `genetics-flagship-clean-mobile.png`,
  `genetics-punnett-desktop.png` — Genetics flagship QA (2026-08-12).
- `plants-flagship-desktop.png`, `plants-flagship-controls-open-desktop.png`,
  `plants-flagship-mobile.png`, `plants-flagship-clean-mobile.png` — Plants flagship QA
  (2026-08-12; all 9 scenes probed at 43.9–48.1% content variance, no console/page errors,
  canvas fully in viewport on desktop and mobile).
- `microbiology-flagship-desktop.png`, `microbiology-flagship-controls-open-desktop.png`,
  `microbiology-flagship-mobile.png`, `microbiology-flagship-clean-mobile.png` — Microbiology
  flagship QA (2026-08-12; all 5 scenes probed at 42.6–46.4% content variance, no console/page
  errors, canvas fully in viewport on desktop and mobile, Clean view verified).
- `ecology-flagship-desktop.png`, `ecology-controls-open-desktop.png`,
  `ecology-predator-balance-desktop.png`, `ecology-flagship-mobile.png` — Ecology flagship QA
  (2026-08-17; canvas and toolbar fit on desktop/mobile, no console errors, mobile BottomTray
  exposes Lesson/Checkpoint/Notebook action cards).
- `mechanics-flagship-desktop.png`, `mechanics-controls-open-desktop.png`,
  `mechanics-friction-desktop.png`, `mechanics-flagship-mobile.png` — Mechanics flagship QA
  (2026-08-17; canvas and toolbar fit on desktop/mobile, no console errors, starts paused for a
  readable first view).
- `energy-flagship-desktop.png`, `energy-controls-open-desktop.png`,
  `energy-efficiency-desktop.png`, `energy-flagship-mobile.png` — Energy flagship QA
  (2026-08-17; canvas and toolbar fit on desktop/mobile, no console errors, starts paused for a
  readable first view).
- `reactions-flagship-desktop.png`, `reactions-controls-open-desktop.png`,
  `reactions-endothermic-desktop.png`, `reactions-flagship-mobile.png` — Chemical Reactions
  flagship QA (2026-08-17; canvas and toolbar fit on desktop/mobile, no console errors, starts
  paused for a readable first view).
- `atoms-flagship-desktop.png`, `atoms-controls-open-desktop.png`,
  `atoms-neon-shells-desktop.png`, `atoms-flagship-mobile.png` — Atoms/Periodic Table flagship QA
  (2026-08-17; canvas and toolbar fit on desktop/mobile, no console errors, no duplicate generated
  heading text, detail fact rows no longer overflow).
- `math-manipulatives-geometry-desktop.png`, `math-manipulatives-controls-open-desktop.png`,
  `math-manipulatives-fractions-desktop.png`, `math-manipulatives-data-desktop.png`,
  `math-manipulatives-mobile.png` — Math Manipulatives flagship QA (2026-08-17; geometry,
  fractions, and data views checked; toolbar fits on desktop/mobile; no console errors).

## What Actually Remains

### P0 — Anatomy Paid-Release Provenance

This is the only P0 left in the generated gap report.

- Current anatomy visuals are good enough to preserve as the reference.
- Human Anatomy still has 9 REVIEW organ GLBs with paid-launch risk. The visuals are good and
  should not be replaced with inferior assets, but provenance/rights need proof or equal-quality
  replacements before paid release.
- Keep anatomy provenance cleanup as a parallel legal/release track, not the main product
  experience lane.

### P1 — Non-Anatomy Quality Bar

The largest product-experience gap is now deepening and polishing non-anatomy branches that are
live or hero-complete, not creating missing P0 coverage.

- Non-anatomy P0 authored GLB asset coverage is now closed for Chemistry, Physics/Space
  Foundations, and Biology branch-level gaps. These are clear teaching-object GLBs; future P1
  should replace selected abstract authored models with richer sourced assets only when the
  sourced asset is more recognizable and legally clear.
- Done first pass: Physics Electricity circuit builder, current animation, series/parallel controls,
  resistance/voltage controls, and hotspots tied to visible circuit parts.
- Done first pass: Physics Mechanics flagship (all 13 authored mechanics components in one
  ramp/cart simulator with force, mass, friction, slope, gravity, net force, acceleration,
  velocity, position, distance/displacement, normal force, weight, momentum, and energy
  indicators) at `/app/labs/motion`.
- Done first pass: Physics Energy flagship (all 6 authored energy components in one coaster/cart
  transfer simulator with stored energy, motion energy, heat loss, efficiency, work, and power
  controls) at `/app/labs/energy`.
- Done first pass: Chemistry Molecules builder with atom adding, bond add/remove, valence/formula
  counters, atom inspection, and animated bond electrons.
- Done first pass: Math Algebra concrete studio with savings, taxi, draining tank, balance scale,
  and candle contexts tied to equation/graph/table.
- Done first pass: Space branch reconciliation and Galaxies toolbar/control cleanup.
- Done first pass: Genetics flagship (DNA base-pair inspection, gene segments, mutation effects,
  real Play/Pause replication/translation, protein folding, chromosome packaging, Punnett grid)
  at `/app/labs/genetics`.
- Done first pass: Plants flagship (all 9 authored plants components in one plant studio with
  flower reproduction, leaf photosynthesis/breathing, phloem/xylem transport, seed germination,
  and stomata turgor sliders) at `/app/labs/plants`.
- Done first pass: Microbiology flagship (all 5 authored microbiology components in one microbe
  studio with binary fission, virus lifecycle, fungus mycelium/spores, protozoa locomotion, and
  microbiome antibiotic-balance slider) at `/app/labs/microbiology`.
- Done first pass: Human Physiology flagship (heart/breathing/digestion/kidney/nerve/muscle/
  hormone/immune/temperature processes with visible cause/effect controls) at `/app/labs/physiology`.
- Done first pass: Ecology flagship (ecosystem diorama, food-web energy, producer/consumer/
  decomposer roles, predator/prey balance, habitat stress, and recycling controls) at
  `/app/labs/ecology`.
- Next: Number Sense/Arithmetic should move from preview coverage to flagship-quality concrete
  manipulatives.

### P1 — Chemistry Deepening

The first molecule builder is live. Remaining chemistry depth is scientific fidelity and guided
challenge design.

- Add PubChem/RCSB-backed molecule structures where exact 3D geometry matters.
- Add polarity, molecular shape, and compare modes.
- Deepen atoms/table with full-table mode, richer ion/isotope/group challenges, orbital/cloud
  views, and better atom/apparatus assets where they improve clarity.
- Deepen reactions with richer presets, particle-collision mode, guided stoichiometry, and better
  molecule/apparatus assets.
- Keep procedural/hybrid for behavior; use GLB only when it improves visible quality.

### P1 — Physics Electricity Flagship

Current physics breadth exists, but flagship interaction is not anatomy-quality.

- Build a circuit lab with components, wires, switch, current visualization, resistance changes.
- Use GLB apparatus only for recognizable components; procedural current carries the learning.
- Add prediction-before-run: "What happens if resistance doubles?"

### P1 — Learning Engine

First Flight exists, but the real retention engine does not.

- Move from localStorage blob to IndexedDB/Dexie.
- Add skill/component/hotspot progress rows.
- Add quiz attempt history with misconception tags.
- Add due-review queue and Leitner intervals.
- Add mission composer from grade, prerequisites, low mastery, and due review.

### P1 — Grade-Aware Product Flow

- Labs has grade-band filters.
- Subjects and Parent/Teacher still need grade-aware views.
- First Flight grade should influence recommended missions, not only the first recommended lab.

### P2 — Standards And Parent/Teacher Proof

- Standards JSON exists but is not surfaced.
- Parent/Teacher needs subject/branch/component progress, weak skills, due review, notebook, and
  export/import.

### P2 — Performance And Accessibility

- Bundle is still large; route-level code splitting is needed.
- Canvas needs a parallel accessible structure/hotspot list.
- Modal focus-trap/Escape behavior and reduced-motion canvas behavior need hardening.
- Add visual regression gate for toolbar/canvas clipping.

## Recommended Next Slice

Do not expand more breadth next. The highest-leverage next slice is:

1. Build Number Sense/Arithmetic from generated preview coverage into flagship manipulatives:
   place-value trays, bead bars, number line, regrouping, factors/multiples, primes, negative
   number motion, and operation animations.
2. Then deepen Math Manipulatives with direct drag handles, transformations, probability
   simulation, and richer guided challenges.
3. Source cleared molecular/apparatus/manipulative GLBs only where they improve recognition; keep
   scientific/math behavior procedural/data-driven and controllable.
4. Verify desktop/mobile, Clean view, labels, Play/Pause where useful, zoom, and no clipping.
5. Update `PROJECT-STATUS.md`, `NEXT-SCOPE-IMPLEMENTATION.md`, and `QUALITY-GAP-MATRIX.md`.

## Recent Decisions

- Clean view is a canvas-level mode, not a global app mode.
- Play/Pause should mean real animation or live simulation; static GLBs get disabled Play.
- X-Ray should be enabled only where mesh/material transparency teaches something.
- Mobile toolbar should be icon-only; desktop rail keeps icon + text.
- Labels and canvas overlays must never overflow into side panels.
- Physics and chemistry should be procedural/hybrid when behavior is the learning goal; do not force
  static GLBs where simulation is more truthful.
- Current anatomy organ visuals are good enough to preserve; the main product gap is other subjects
  not meeting that bar.

## Session Update Checklist

At the end of each work session:

1. Update `Last updated`.
2. Add a short session note to `PROJECT-STATUS.md` when product state changed.
3. Update `What Actually Remains` if a gap closed or a new blocker appeared.
4. Add verification commands and results.
5. Add screenshot filenames for any browser QA.
6. Record unresolved warnings honestly.
