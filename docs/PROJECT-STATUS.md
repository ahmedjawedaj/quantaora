# Quantaora — Plan, Scope & Status

**Living document.** This is the single place that answers "what are we building, how much
is done, what's left." Update it whenever a phase closes or scope changes — don't let a
second copy of this fork off into a chat artifact again.

Full product/tech vision lives in [quantaora-product-tech-spec.md](quantaora-product-tech-spec.md)
(scope, personas, every screen spec). This doc is the delta: what's actually built against
that spec, right now, and the phase plan to close the gap.

Last updated: 2026-08-26.

**Session note (2026-08-26, P1 visual QA fixes):** Browser QA continued from the P1 depth-proof
wave. Added `npm run qa:visual-signals`, a Playwright route-matrix check that reads
`TODAY-P0-P1-GAP-REPORT.md`, visits every unique lab route, and verifies lab stage, shared
toolbar, Zoom In/Out, Lesson, Checkpoint, no horizontal overflow, and visible
Observe/Predict/Explain text. Fixed default learning-task visibility in `BranchLab.tsx`,
`PhysicsLab.tsx`, `EnergyLab.tsx`, `EarthInSpaceLab.tsx`, `MoonsLab.tsx`, `AtomsLab.tsx`,
`GeneticsLab.tsx`, `StarsLab.tsx`, `ChemistryLab.tsx`, `ChemicalReactionsLab.tsx`, `MathLab.tsx`,
`NumberSenseLab.tsx`, `PhysiologyLab.tsx`, `EcologyLab.tsx`, and `MicrobiologyLab.tsx`. Added the
shared toolbar and BottomTray to `TrigonometryFoundationsLab.tsx`. Full visual-signal sweep now
passes 48/48 unique lab routes with 0 failures (`QA_SCREENSHOTS=none npm run qa:visual-signals`).
Focused route tests and `npm run build` pass. Screenshot evidence lives in
`quantaora-app/review-screenshots/p1-depth-qa-2026-08-26/`: `math-manipulatives-updated-desktop.png`,
`energy-updated-desktop.png`, `moons-mission-priority-desktop.png`, `earth-in-space-updated-desktop.png`,
`earth-in-space-mobile.png`, `plants-mobile.png`, and `moons-mobile.png`.

**Session note (2026-08-26, context engineering setup):** Added a low-token code graph workflow
for finishing the remaining P1 product work with multiple agents. `npm run context:graph` in
`quantaora-app/` writes `docs/CODE-GRAPH.json` and `docs/AGENT-CONTEXT-PACKS.md`; a branch pack
can be printed with `node scripts/context/build-code-graph.mjs --branch <branch-id>`. The first
baseline scanned 297 source files, mapped 744 local dependency edges, and generated 51 branch
packs with route file, data file, focused tests, and validation commands. Serena is also tuned for
this repo: TypeScript language server enabled, workspace narrowed to `quantaora-app`, and heavy
generated/runtime folders ignored. Use this before assigning any branch/lab task so agents read
only impacted files instead of reloading the whole app.

**Session note (2026-08-26, P1 controlled-agent recovery):** The initial broad Wave 2 sub-agent
launch hit the Codex usage limit and was stopped. The corrected process is now documented in
`CONTEXT-ENGINEERING.md`: parent-only graph discovery and shared validation, max 2 Codex workers,
pre-cut file lists only, one focused test per worker, no worker build/codegen/assets checks, and
short `changed/tests/blocked` reports. A controlled retry launched only Mechanics and Electricity
workers with strict scopes; both found the requested P1 critical-thinking mission/control-impact
layers already present and focused tests passing. Parent verification passed
`npm test -- src/routes/mechanicsCriticalMissions.test.ts src/routes/electricityCircuitInspection.test.ts`
and `npx tsc -b && npm run build` after removing one unused local variable left in
`ChemicalReactionsLab.tsx`. Existing build warnings remain large chunks/Tailwind plugin timing.

**Session note (2026-08-26, P1 proof wave):** Added/verified source-level P1 depth proof for
Atoms/Periodic Table and Math Manipulatives. `src/routes/atomsP1Depth.test.ts` now locks the
Atoms lab to visible prediction missions for element identity, isotope/ion behavior, shells, and
periodic-table families. Math Manipulatives mission prompts now include explicit cause/effect
language across all 29 Geometry, Fractions/Ratios, and Data/Statistics components, with quick
controls kept outside the canvas and hidden in Clean view. Parent validation passed
`npm test -- src/routes/atomsP1Depth.test.ts src/routes/mathHandsOnCoverageWave.test.ts` and
`npm run build`. The quality-gap report still ranks these as P1 because it measures registered
asset mappings, not interactive mission depth.

**Session note (2026-08-26, Energy + Algebra P1 depth wave):** Controlled two-worker wave added
visible P1 mission/challenge proof for Energy and Algebra. `EnergyLab.tsx` now exposes
mission/change/observe/explain prompts across conservation of energy, kinetic energy, potential
energy, work, power, and efficiency, with `src/routes/energyP1Depth.test.ts` as the focused
source-level guard. `MathLab.tsx` now exposes algebra predict/change/observe/explain mission
markers covering variable, expression, equation, slope, intercept, coefficient, and constant
concepts, with `src/routes/algebraP1Depth.test.ts` as the guard. Parent validation passed
`npm test -- src/routes/energyP1Depth.test.ts src/routes/algebraP1Depth.test.ts`,
`npx tsc -b`, and `npm run build`.

**Session note (2026-08-26, Space motion + Molecules P1 depth wave):** Controlled two-worker wave
added explicit P1 mission/challenge proof for Solar System/Earth In Space and Molecules. Space
motion now has source-level coverage in `src/routes/spaceMotionP1Depth.test.ts` for speed,
distance, gravity, year length, rotation/revolution, seasons, and day/night effects across
`SpaceLab.tsx` and `EarthInSpaceLab.tsx`. Molecules now has source-level coverage in
`src/routes/moleculesP1Depth.test.ts` for atom count, bond count/type, shape, polarity, and ionic
attraction markers in `ChemistryLab.tsx`. Parent validation passed the focused space/molecules
test set, `npx tsc -b`, and `npm run build`.

**Session note (2026-08-26, Plants + Ecology P1 depth wave):** Controlled two-worker wave added
or verified explicit P1 mission/challenge proof for Plants and Ecology. Plants now has
`src/routes/plantsP1Depth.test.ts` covering seed germination, photosynthesis/chloroplast,
flower/pollination, leaf/stomata, xylem/phloem, roots, stems, and child-visible control effects.
Ecology now has `src/routes/ecologyP1Depth.test.ts` covering organism, population, community,
ecosystem, habitat, niche, producer, consumer, decomposer, predator, prey, and causal changes from
sunlight, predator pressure, decomposer activity, habitat stress, water, shelter, and energy flow.
Parent validation passed the focused plants/ecology test set, `npx tsc -b`, and `npm run build`.

**Session note (2026-08-26, Microbiology + Stars/Galaxies P1 depth wave):** Controlled
two-worker wave added explicit P1 mission/challenge proof for Microbiology and space objects.
Microbiology now has `src/routes/microbiologyP1Depth.test.ts` covering bacteria, virus, fungus,
protozoa, microbiome, and visible effects from peel/flagellum/spike/spore/movement/feeding/job
and antibiotic/community controls. Stars/Galaxies now has `src/routes/spaceObjectsP1Depth.test.ts`
covering star lifecycle/physics markers and galaxy structure experiments, including a galaxy
star-density control with visible rendered-star response. Parent validation passed the focused
microbiology/space-object test set, `npx tsc -b`, and `npm run build`.

**Session note (2026-08-26, Genetics + Number Sense P1 depth wave):** Controlled two-worker wave
added explicit P1 proof for Genetics and Number Sense. Genetics now has
`src/routes/geneticsP1Depth.test.ts` covering all 10 genetics concepts with
observe/predict/change/explain/check mission markers and control-change evidence for bases,
mutations, genes, alleles, traits, folds, chromosomes, and Punnett squares. Number Sense now has
`src/routes/numberSenseP1Depth.test.ts`, a visible `data-number-challenge` marker, accessible
prediction labeling, and explicit Explain output across all 10 number-sense domains. Parent
validation passed the focused genetics/number-sense test set, `npx tsc -b`, and `npm run build`.

**Session note (2026-08-26, Cell Biology + Moons P1 depth wave):** Controlled two-worker wave
added explicit P1 proof for Cell Biology and Moons. Cell Biology now has a kid-facing
mission/challenge panel for animal, plant, and bacterial cells, plus
`src/routes/cellBiologyP1Depth.test.ts` covering membrane, nucleus, mitochondria, chloroplast,
ribosome, DNA, cell wall, cytoplasm/organelle relationships, and live view controls. Moons now has
a live moon-phase control/readout with reset support, expanded mission copy for phases, gravity,
surface/craters, orbit/tides, and moon comparison, plus `src/routes/moonsP1Depth.test.ts`. Parent
validation passed the focused cell/moons test set, `npx tsc -b`, and `npm run build`.

**Session note (2026-08-26, P1 depth proof closed):** `npm run quality:gaps` now distinguishes
P1 mission-depth proof from asset-mapping coverage. Current report shows 50 branches with P1 depth
proof and 0 P1 branches still needing depth proof. Full validation after the P1 waves passed:
`npm test` (446/446), `npm run codegen:check`, `npm run assets:check`, and `npm run build`.
`assets:check` still reports the known 9 Anatomy REVIEW provenance warnings; those remain P0
legal only if paid launch returns to scope. Next work is P1 visual QA/screenshots and any defects
found there, not more proof-test authoring.

**Session note (2026-08-24, Number Sense P1 interaction depth):** `/app/labs/number-sense`
now has a visible guided mission layer across all 10 arithmetic components, synced to component
selection so the prompt always matches the current manipulative. Desktop/tablet learners get
direct quick actions in the bottom control band (`A +1`, `Combine`, `Make 249`, `Next prime`,
etc.) outside the hidden tuning drawer; those controls stay out of the model frame and hide in
Clean view. Place Value mission sync, desktop layout, abacus visibility, and mobile fit were
browser-checked. Screenshots live under
`review-screenshots/number-sense-p1-2026-08-24/`. Validation for this slice: focused Number Sense
tests pass and production build passes with the existing Vite chunk-size warning.

**Session note (2026-08-24, P0/P1 asset execution):** P1 onboarding now creates a real
three-step `recommendedMission` instead of only a single recommended lab. First Flight stores the
mission in the local learner profile, the onboarding preview shows the ordered path, and
Parent/Teacher renders the saved mission as linked steps. The operational P0/P1 report is
generated by `npm run quality:gaps` at `docs/TODAY-P0-P1-GAP-REPORT.md`; current report audits
51 branches / 315 hierarchy components and shows 1 remaining P0 branch, 50 P1 branches,
148 components without registered asset mappings, and the known 9 Anatomy REVIEW paid-launch
risks. Non-anatomy P0 asset gaps are now closed to `hero-complete` status: Chemistry States,
Acids, Solutions, Stoichiometry, and Biochemistry Links have 25 project-owned CLEAR authored
GLBs; Physics Modern Physics Foundations plus Space Gravity/Orbits and Cosmology have 15
project-owned CLEAR authored GLBs; Biology Cell Biology, Evolution, Animals, Health And Disease,
Neuroscience, and Biochemistry Foundations have 31 project-owned CLEAR authored GLBs. Earlier
Space partial branches (Comet Nucleus, Sample Return Workflow, Wavelength Comparison) and Physics
Sound/Waves/Fluids are also registered and clear. Browser smoke screenshots for the latest sweep
live under `quantaora-app/review-screenshots/p0-p1-hero-complete-2026-08-24/`; desktop QA
confirmed one canvas, no horizontal overflow, selected component text present, common toolbar
visible, and centered models across Cell Biology, Evolution, Animals, Health, Neuroscience,
Biochemistry, Modern Physics, Gravity/Orbits, and Cosmology. Validation for this slice:
`npm test`, `npm run build`, `npm run codegen:check`, `npm run assets:check`, and
`npm run quality:gaps` pass; `assets:check` still reports only the 9 Anatomy REVIEW warnings.

**Session note (2026-08-23, continuation after full-coverage wave):** Visual-depth work
continued after the branch-breadth milestone. Generic procedural BranchLab scenes now expose a
real Play/Pause animation state instead of disabling animation for every non-GLB scene. Physics
Heat & Thermodynamics promoted cleared stove GLBs for conduction/phase-change examples, Organic
Chemistry promoted the cleared methane GLB for hydrocarbons, and per-component camera presets were
added where those assets initially clipped. Earth In Space now has an explicit Rotation vs
Revolution "speed experiment" panel with Spin only / Orbit only / Fast days / Fast year presets,
live day/year signal readouts, and a child-readable conclusion explaining that rotation controls
day/night while revolution controls the trip around the Sun. Earth In Space motion/seasons framing
was tightened with a smaller teaching orbit, larger default camera distance, and wide-scene offset;
browser QA confirmed one canvas, shared toolbar, speed panel content, and no horizontal overflow.
Screenshots live under `review-screenshots/earth-motion-speed-2026-08-23/`. Validation for this
slice: focused Earth-in-space tests pass and production build passes with the existing Vite
large-chunk warning. Remaining gap is still the big one: non-anatomy branches need more
Anatomy-quality sourced/cleared `.glb` assets or bespoke flagship scenes, not just procedural
coverage.

**Session note (2026-08-23, full branch coverage wave):** All hierarchy branches are now live;
there are no remaining `status: 'planned'` branches in `quantaora-app/src/data/hierarchy.ts`.
New generic BranchLab coverage was added for Chemistry states of matter, acids and bases,
solutions, stoichiometry foundations, organic chemistry foundations, and biochemistry links;
Physics waves, sound, fluids, heat and thermodynamics, and modern physics foundations; Math
graphs and functions, trigonometry foundations, and calculus foundations; Space gravity and
orbits plus cosmology foundations; Biology evolution, animals, health and disease, neuroscience,
and biochemistry foundations. Validation after the wave: `rtk npm test` passes 397/397, build
passes with the existing large-chunk warning, `rtk npm run codegen:check` passes, and
`rtk npm run assets:check` passes with the known nine Anatomy REVIEW provenance warnings. Honest
residual: this closes breadth/route/content coverage, not the final visual quality bar. Many of
the newly-live branches are procedural first-pass labs with child-readable cause/effect content,
but they still need the dedicated GLB sourcing or bespoke flagship-simulator pass before they
match Anatomy quality. Top next lane remains non-anatomy `.glb` sourcing, license clearance,
camera/framing QA, and upgrading the highest-value procedural branches into premium flagships.

**Session note (2026-08-19, verification + perf wave):** Anatomy provenance remains REVIEW (nine
assets, hashes recorded, replacement leads tracked) — all 16 authored Anatomy components stay
reachable and the generic-branch route correctly gates on REVIEW assets. Space Moons is now a
tested exception. Ecology Predator vs Prey are visually distinct with canonical meters. Chemistry
NaCl has context/focus isolate. Microbiology virus uses the real NIH poliovirus capsid mode. Route
lazy loading cut initial gzip ~1.27MB→134KB; Hero scene progressive-loads with first-paint text;
404 route is accessible. Verified: 282/282 tests, build/lint/codegen/assets checks pass, 23
branches parity-checked, 53 CLEAR / 4 ATTRIB / 9 REVIEW assets. Honest residuals: nine Anatomy
assets remain a paid-launch blocker; `branchModules` is a ~1.57MB shared data chunk (async compare
split proposed, not done); `GlbErrorBoundary` is duplicated across shared components; pre-existing
lint warnings remain.

**Session note (2026-08-19, P0 wave — Earth In Space labs, Algebra redesign, Chemistry GLB
wiring, prop integrations, Ecology scenes):** Earth In Space now has a dedicated five-mode lab
with canonical authored-content/codegen integration. Algebra's piggy-bank/taxi/draining-tank
contexts were redesigned plus a mobile graph fix. Chemistry cleared water/CO2/methane/NaCl GLBs
are wired in, including a water-orientation fix. Mechanics/Energy prop integrations were cleared
along with mobile reachability and asset-prominence fixes. Ecology now has visually distinct
central scenes. Verification: 236/236 tests pass, build/codegen/assets pass, 23 branches
parity-checked, browser shows no console errors or overflow. Honest residuals: Predator vs Prey
still looks similar (P2), procedural Ecology/Mechanics assets remain below Anatomy's polish, NaCl
isolate mode is P2, bundle is ~4.64MB minified/~1.27MB gzip, and nine Anatomy REVIEW assets
remain a paid-launch blocker (licensing not solved).

**Session note (2026-08-17, Math Manipulatives flagship):** **Math Geometry/Fractions/Data
flagship first pass shipped.** `/app/labs/math-manipulatives` is now a dedicated manipulative lab
instead of generic branch viewers for Geometry, Fractions And Ratios, and Data And Statistics.
It covers all 29 authored components across those branches: angle, area, circle, line, perimeter,
point, quadrilateral, ray, segment, triangle, volume, decimal, denominator, equivalent fraction,
fraction, numerator, percent, proportion, ratio, bar chart, data point, line graph, mean, median,
mode, outlier, probability, range, and table. The route uses the shared lab shell with
`CanvasControls`, SVG/3D-styled manipulatives, geometry measurement board, fraction tiles, ratio
mixer, bar/line/statistics board, compact meters, and a `Tune math` drawer. Learners can change
angle, width, height, depth, numerator, denominator, ratio parts, data points, and outlier value,
then see angle type, area, perimeter, volume, simplified fraction, decimal, percent, scaled ratio,
mean, median, mode, and range respond. Labs metadata now routes Geometry, Fractions And Ratios,
and Data And Statistics to `/app/labs/math-manipulatives` and counts them as flagship branches.
QA screenshots: `math-manipulatives-geometry-desktop.png`,
`math-manipulatives-controls-open-desktop.png`, `math-manipulatives-fractions-desktop.png`,
`math-manipulatives-data-desktop.png`, and `math-manipulatives-mobile.png`. Remaining P0
product-experience gap is Number Sense/Arithmetic manipulatives plus deeper guided challenge
sequences across the new flagship labs.

**Session note (2026-08-17, Chemistry Atoms + Periodic Table flagship):** **Atoms/Periodic
Table flagship first pass shipped.** `/app/labs/atoms` is now a dedicated atom/table bridge
instead of two generic branch viewers. It covers all 9 authored Atoms And Elements components
and all 10 authored Periodic Table components in one shared lab: atom, electron, electron shell,
element, ion, isotope, neutron, nucleus, proton, alkali metal, atomic mass, atomic number, group,
halogen, metal, metalloid, noble gas, nonmetal, and period. The route uses the shared 3D lab
shell with `CanvasControls`, a procedural atom model, clickable first-18 periodic table, shell
and particle readouts, and a `Tune atom` drawer. Learners can pick an element, change electron
speed, ion charge, isotope neutrons, and table emphasis, then see proton/electron/neutron counts,
shell layout, group/period, charge, and mass number respond. Labs metadata now routes both
Atoms And Elements and Periodic Table to `/app/labs/atoms` and counts them as flagship branches.
QA screenshots: `atoms-flagship-desktop.png`, `atoms-controls-open-desktop.png`,
`atoms-neon-shells-desktop.png`, and `atoms-flagship-mobile.png`. Follow-up P0 math gap was
Geometry/Fractions/Data; that slice is now live above.

**Session note (2026-08-17, Chemistry Chemical Reactions flagship):** **Chemistry reactions
flagship first pass shipped.** `/app/labs/reactions` is now a dedicated cause/effect reaction
lab instead of a generic branch viewer. It covers all 7 authored Chemical Reactions components:
reactant, product, coefficient, balanced equation, conservation of mass, exothermic, and
endothermic. The route uses the shared 3D lab shell with `CanvasControls`, a procedural reaction
bench, molecule groups for H2/O2/H2O, atom-count panels, heat-flow visuals, compact meters, and a
`Tune reaction` drawer. Learners can change H2, O2, and H2O coefficients, temperature, catalyst
help, and heat mode, then see hydrogen/oxygen counts, atom gap, balanced/unbalanced state, rate,
energy, and absorbed/released heat respond. Reactions start paused so the first view is readable
and Play deliberately runs the molecular transformation. Labs metadata now routes Chemical
Reactions to `/app/labs/reactions` and counts it as a flagship. QA screenshots:
`reactions-flagship-desktop.png`, `reactions-controls-open-desktop.png`,
`reactions-endothermic-desktop.png`, and `reactions-flagship-mobile.png`. Follow-up P0 chemistry
gap was Atoms/Periodic Table; that slice is now live above.

**Session note (2026-08-17, Physics Energy flagship):** **Physics Energy flagship first pass
shipped.** `/app/labs/energy` is now a dedicated Energy lab instead of a generic branch viewer.
It covers all 6 authored Energy components: conservation of energy, efficiency, kinetic energy,
potential energy, power, and work. The route uses the shared 3D lab shell with `CanvasControls`,
a procedural coaster/cart energy-transfer scene, energy-form bars, heat-loss particles, work/power
meters, compact readouts, and a `Tune energy` drawer. Learners can change start height, mass,
heat loss, push force, push distance, and transfer time, then see total energy, stored energy,
motion energy, heat, useful output, efficiency, work, and power respond. Energy starts paused so
the first view is readable and Play deliberately runs the transformation. Labs metadata now routes
Energy to `/app/labs/energy` and counts it as a flagship. QA screenshots:
`energy-flagship-desktop.png`, `energy-controls-open-desktop.png`,
`energy-efficiency-desktop.png`, and `energy-flagship-mobile.png`. Verification:
`npm run lint -- --quiet` and `npm run build` passed during implementation; final verification
suite below should remain green. Remaining P0 product-experience gap moves to generated
Chemistry/Math branches and deeper Physics challenge modes.

**Session note (2026-08-17, Physics Mechanics flagship):** **Physics Mechanics flagship first
pass shipped.** `/app/labs/motion` now covers all 13 authored Mechanics components instead of a
single SVG motion-lab card: acceleration, displacement, distance, force, friction, gravity, mass,
momentum, normal force, position, speed, velocity, and weight. The route uses the shared 3D lab
shell with `CanvasControls`, a procedural ramp/cart/track simulator, compact meters, and a
`Tune mechanics` drawer. Learners can change applied force, mass, friction, slope, and gravity,
then see net force, acceleration, velocity, position, distance/displacement, normal force, weight,
friction, and momentum/energy indicators respond. Mechanics now starts paused so the first view is
readable and the learner deliberately presses Play to run the experiment. Labs metadata now counts
Mechanics as a 13-component flagship. QA screenshots:
`mechanics-flagship-desktop.png`, `mechanics-controls-open-desktop.png`,
`mechanics-friction-desktop.png`, and `mechanics-flagship-mobile.png`. Verification:
`npm run lint -- --quiet` and `npm run build` pass during implementation; final verification suite
below should remain green. Remaining P0 Physics gap: Energy branch flagship.

**Session note (2026-08-17, Ecology flagship + mobile tray):** **Fifth Biology non-anatomy
flagship slice shipped.** `/app/labs/ecology` is now a dedicated ecosystem lab instead of the
generic branch viewer. It covers all 11 authored ecology components through one food-web diorama:
organism, population, community, ecosystem, habitat, niche, producer, consumer, decomposer,
predator, and prey. Learners can change sunlight into plants, predator pressure, decomposer
activity, and habitat stress, then watch producer energy, prey safety, population balance,
nutrient recycling, water/shelter availability, and energy-flow particles respond. The scene uses
procedural organisms plus the two clear Quaternius Ecology support GLBs already present in the
project; no unclear new asset was imported. The route keeps `ContentNav`, `DetailPanel`,
Lesson/Quiz/Compare modals, notebook/progress hooks, shared `CanvasControls`, Play/Pause, zoom,
labels, X-Ray, Clean view, and reset. Also tightened the shared bottom tray on mobile: it now
shows Lesson / Checkpoint / Notebook as a compact action bar, while the long Real-world card stays
desktop-only because the detail panel already contains the explanation on mobile. QA screenshots:
`ecology-flagship-desktop.png`, `ecology-controls-open-desktop.png`,
`ecology-predator-balance-desktop.png`, and `ecology-flagship-mobile.png`. Verification:
`npm run lint -- --quiet`, `npm run build`, `npm run codegen:check`, and `npm run assets:check`
pass. Remaining P0 product-experience gap: bring Physics Energy and the generated
Chemistry/Math branches up from preview coverage to flagship interactive labs.

**Session note (2026-08-17, critical-thinking interactions):** **First cause/effect learning
pass shipped.** Solar System now explicitly separates **rotation** from **revolution** in
`/app/labs/orbit`: the selected planet gets a visible yellow spin ring/arrow, compact desktop
and mobile meters show Spin / Orbit / Year without blocking the model, and an `Investigate
motion` drawer lets learners change revolution speed, rotation speed, and orbital distance while
reading the effect: spin changes day/axis motion; distance changes year length through Kepler
behavior. Plants Seed now shows germination as a staged visual process instead of a plain percent:
seed coat split, root-first growth downward, shoot growth upward, first leaves, stage/next-change
meters, and a `Tune plant` drawer with dry seed → root first → shoot rises → leaves open anchors.
Also fixed the Microbiology duplicate React key warning by removing the duplicated bacteria
`Reproduce` fact and made DetailPanel fact keys resilient; Plants and Microbiology now use
component-specific default inspected parts so Seed does not show chloroplast grana and Virus does
not inherit bacteria cell wall. QA screenshots:
`orbit-motion-compact-desktop.png`, `orbit-motion-investigation-open-desktop.png`,
`orbit-motion-compact-mobile.png`, `plants-seed-growth-compact-desktop.png`,
`plants-seed-growth-controls-open-desktop.png`, `microbiology-warning-check-desktop.png`.
Verification: `npm run lint -- --quiet`, `npm run codegen:check`, `npm run assets:check`, and
`npm run build` pass. Remaining scope: apply this same predict/change/observe/explain pattern
across Physiology, Ecology, Mechanics, Energy, Chemistry reactions, Math manipulatives, and
every branch where a variable can drive a visible outcome.

**Session note (2026-08-17, Human Physiology flagship):** **Fourth Biology non-anatomy flagship
slice shipped.** `/app/labs/physiology` is no longer a process-diagram-only route: it now uses
the shared 3D lab shell with `CanvasControls`, procedural physiology scenes, compact meters, and
a `Tune body` drawer. The first pass covers all 9 authored physiology processes through
cause/effect visualizations: blood circulation (heart pulse, red/blue flow loops, body demand,
vessel resistance, heart-rate/pressure outcome), breathing (lung expansion, airflow beads,
breathing rate, airway tightness, oxygen pickup), digestion (meal size/enzyme help), kidney
filtration (water level/waste load), nerve signaling (signal strength/pathway gap), muscle
contraction (nerve command/load), hormone signaling, immune response, and temperature regulation.
The route keeps authored ContentNav, DetailPanel, BottomTray, Lesson/Quiz/Compare modals, and
the common toolbar including Play/Pause, zoom, labels, X-Ray, Clean view, and reset. Also tightened
the shared toolbar spacing so the full tool rail fits shorter stages. QA screenshots:
`physiology-flagship-desktop.png`, `physiology-flagship-controls-open-desktop.png`,
`physiology-flagship-mobile.png`, plus exploratory `physiology-breathing-desktop.png` and
`physiology-nerve-signal-desktop.png`. Verification: `npm run lint -- --quiet`,
`npm run codegen:check`, `npm run assets:check`, and `npm run build` pass. Next gap: Ecology
flagship with food-web/population/energy-flow cause-effect.

**Session note (2026-08-12, Microbiology flagship):** **Third Biology non-anatomy flagship
shipped.** `/app/labs/microbiology` is wired (App route + `hierarchy.ts` repointed from the
generic branch lab + Labs index flagship set) and renders a microbe studio for all 5 authored
microbiology components: bacteria cutaway (peelable cell wall + membrane, loose DNA loop and
ribosomes, whipping flagellum, binary-fission pinch with division-buddy reveal), virus infection
cycle (icosohedral coat with attachment spikes, peel to reveal genetic-material coil, attach →
host cell → release of new virus particles), fungus on a soil block (peel soil to expose the
hyphae/mycelium network, drifting spores, budding yeast cluster), protozoa pond drop (amoeba
with pulsing pseudopod, nucleus, food vacuole and food speck being engulfed, flagellate whip,
ciliate hairs beat), and microbiome (human silhouette, dense gut + sparse skin microbe colonies,
gut-wall close-up ring, helpful-job chips, and an antibody slider that visibly shrinks the
community). Every scene has its own tune control behind the compact `Tune microbe` button (peel
wall/coat/soil, show flagellum/spikes/spores/yeast/movement/feeding/jobs), live meters, shared
toolbar (Rotate, Play/Pause, Isolate, Compare, Zoom, Fullscreen, More: Labels/X-Ray/Fit/Clean,
Reset), DetailPanel with authored hotspot text matched by label, BottomTray, and Lesson/Quiz
modals (Compare stays disabled — no compare candidates authored for microbiology). QA: all 5
scenes render (42.6–46.4% content variance, no console/page errors), canvas fully in viewport on
desktop and mobile, Clean view verified, Labs index shows Microbiology as Flagship lab →
`/app/labs/microbiology`. Screenshots: `microbiology-flagship-desktop.png`,
`microbiology-flagship-controls-open-desktop.png`, `microbiology-flagship-mobile.png`,
`microbiology-flagship-clean-mobile.png`. Verification: `npm run lint -- --quiet` (0 errors),
`./node_modules/.bin/vite build`, and full `tsc -p tsconfig.app.json --noEmit` all pass. Next
gap: Human Physiology flagship, then Ecology.

**Session note (2026-08-12, Plants flagship):** **Second Biology non-anatomy flagship
shipped.** `/app/labs/plants` is wired (App route + `hierarchy.ts` repointed from the generic
branch lab + Labs index flagship set) and renders a real plant studio for all 9 authored plants
components: chloroplast cutaway (outer membrane peel, grana disc stacks, chlorophyll flecks,
sunlight/water/CO₂ input rays with photon flow, sugar+O₂ output flow), flower anatomy with
pollen-transfer animation and seed-forming ovary, leaf food factory (vein network, chlorophyll,
breathing stoma with CO₂-in/O₂-out gas arrows), phloem sugar flow leaf→root/seed sinks, root
system in peelable soil (root cap, root hairs, rising xylem water, storage), seed cutaway with
germination slider + sprout growth animation, stem two-way elevator (water up xylem / sugar down
phloem, node rings, cross-section ring), stomata with guard-cell turgor slider (pore openness %
with breathing cycle — water level is the visible cause), and xylem tube-in-tube with rising
water. Every scene has its own tune control behind the compact `Tune plant` button (peel
membrane/soil, show rays/veins/pollen path/cross-section/contrast), live meters, shared toolbar
(Rotate, Play/Pause, Isolate, Compare, Zoom, Fullscreen, More: Labels/X-Ray/Fit/Clean, Reset),
DetailPanel with authored hotspot text matched by label, BottomTray, and Lesson/Quiz modals
(Compare stays disabled — no compare candidates authored for plants). QA: all 9 scenes render
(43.9–48.1% content variance, no console/page errors), canvas fully in viewport on desktop and
mobile, Clean view verified, Labs index shows Plants as Flagship lab → `/app/labs/plants`.
Screenshots: `plants-flagship-desktop.png`, `plants-flagship-controls-open-desktop.png`,
`plants-flagship-mobile.png`, `plants-flagship-clean-mobile.png`. Verification: `npm run lint
-- --quiet`, `npm run codegen:check`, `npm run assets:check` (9 anatomy REVIEW, 0 NC-RISK),
`./node_modules/.bin/vite build`, and full `tsc -p tsconfig.app.json --noEmit` all pass. Note: the
old Plants session note already called the next gap "Microbiology flagship" — that gap is now
closed by this session.

**Session note (2026-08-12, Genetics flagship):** **First Biology non-anatomy flagship
shipped.** `/app/labs/genetics` is wired (App route + `hierarchy.ts` repointed from the generic
branch lab + Labs index flagship set) and renders a real genetics studio, not the preview
branch: double-helix DNA with tap-to-inspect base pairs (A–T, C–G), gene segment selection
(promoter / coding sequence), mutation mode (substitution / insertion / deletion with live
silent / missense / nonsense effect), replication and transcription-translation scenes driven
by the shared Play/Pause control (real `useFrame` tick, not fake state), a protein chain with
folded/unfolded shape toggle, chromosome packaging with DNA-coil reveal, allele/trait pairing,
and a Punnett-square grid with parent-allele pickers and 1/4 ratio bars — all 10 authored
genetics components. Keeps the shared toolbar (Rotate, Play/Pause, Isolate, Compare, Zoom,
Fullscreen, More: Labels/X-Ray/Fit/Clean, Reset), compact `Tune molecule` panel, meters,
DetailPanel, BottomTray, Lesson/Quiz/Compare modals, and Clean view with Show UI recovery.
Fully procedural/hybrid (the banked RCSB `1BNA`/`1CRN`/`1A9N` GLBs are referenced in
ASSET-LICENSES but were never harvested to disk — `dl/` is empty — so DNA/protein stay
procedural this pass; RCSB wiring remains a future deepening option, not a blocker). QA
screenshots: `genetics-flagship-desktop.png`, `genetics-flagship-controls-open-desktop.png`,
`genetics-flagship-mobile.png`, `genetics-flagship-clean-mobile.png`, and
`genetics-punnett-desktop.png`. DOM-audited headless: canvas fully in viewport desktop +
mobile, no console/page errors, Clean view hides every overlay and leaves Show UI, Labs index
shows Genetics as a Flagship lab routing to `/app/labs/genetics`, and Play/Pause measurably
advances the replication animation (meter 56% → done while playing, frozen while paused).
Verification: `npm run lint -- --quiet`, `npm run codegen:check`, `npm run assets:check`
(9 anatomy REVIEW, 0 NC-RISK), `./node_modules/.bin/vite build`, and full
`tsc -p tsconfig.app.json --noEmit` all pass (tsc ran to completion this time instead of
hanging; fixed the unused-symbol + Dispatch-prop + invalid `transparent-opacity` prop errors
it surfaced in the new file). Next gap: Plants or Microbiology flagship.

**Session note (2026-08-12):** **Lab UX/control pass complete + context engineering started.**
The Labs index is now user-facing instead of internal-sourcing-facing: subject accordions, search,
quality filters, grade-band filters, mobile-wrapping chips, Biology-first default, and live routing
to the polished bespoke labs where quality is higher (`/app`, `/app/labs/molecules`,
`/app/labs/orbit`, `/app/labs/stars`, `/app/labs/galaxies`). The shared canvas toolbar is now
common across labs and includes Rotate, Play/Pause, Isolate, Section, Compare, Zoom In/Out,
Fullscreen, More, Reset. More contains Show/Hide labels, X-Ray view where supported, Fit view,
and Clean view. Clean view hides canvas overlays/tool panels and leaves a recovery `Show UI`
button. Real GLB loaders now detect embedded animation clips and auto-play them when present;
static GLBs show disabled Play, while Orbit uses Play/Pause for the live simulation. Verified
with `npm run build`, `npm run lint -- --quiet`, `npm run codegen:check`, `npm run assets:check`,
plus Playwright screenshots in `quantaora-app/review-screenshots/implementation/`. At that point
the asset warnings were 9 REVIEW organ GLBs and 2 NC-RISK NIH cell GLBs; the NC-RISK cell items
were closed in the P0 follow-on below.

**Session note (2026-08-12, P0 follow-on):** **NC-RISK cell assets replaced.** The two live
CC-BY-NC-SA NIH cell models (`animal-cell-nih.glb`, `neuron-nih.glb`) were removed from
`public/models/cells/` and replaced with project-owned authored GLBs generated by
`quantaora-app/scripts/assets/build-cell-glbs.mjs`: `animal-cell-authored.glb` and
`neuron-authored.glb`. Both include embedded animation clips, so the shared Play/Pause control is
active in Cell Biology. `modelRegistry.ts`, `cells.ts`, and `ASSET-LICENSES.md` now mark these
assets as CLEAR/project-owned. Verification: `npm run assets:check` now reports **NC-RISK 0** and
9 remaining REVIEW warnings (the anatomy organ provenance set). `PAID_RELEASE=1 npm run
assets:check` fails only on those 9 REVIEW anatomy assets. Browser QA screenshots:
`p0-authored-animal-cell-final.png`, `p0-authored-neuron-final.png`,
`p0-authored-neuron-clean-view.png`.

**Session note (2026-08-12, P0 anatomy clearance prep):** **Organ asset gate tightened.**
The anatomy lab remains the quality baseline, so the nine current organ GLBs were preserved, but
their licence tracking is now per-file instead of a broad `public/models/*.glb` wildcard.
`quantaora-app/scripts/check-assets.ts` now requires an exact `docs/ASSET-LICENSES.md` row for
every registered model. Added `docs/supplier/anatomy-asset-clearance.md` with the P0 work order
and clearance evidence checklist: Heart -> Lungs -> Brain -> Eye -> Kidneys -> Liver ->
Intestine -> Pancreas -> Skin. Initial source scan: NIH 3D `3DPX-020966` / HRA Heart Female is a
specific CC BY 4.0 Heart candidate with attribution text and GLB metadata, but direct CLI retrieval
returned an XML access response, so browser/API download and visual QA are still required before
replacement. Z-Anatomy/BodyParts3D are quality-relevant but ShareAlike/copyleft, NIH 3D and
Sketchfab must be checked per exact asset, and AI/model mirror sites are rejected by default unless
provenance is independently verifiable. Verification: `npm run build`, `npm run lint -- --quiet`,
`npm run codegen:check`, and `npm run assets:check` pass; `PAID_RELEASE=1 npm run assets:check`
intentionally fails only on the 9 REVIEW organ assets. This remains a paid-release cleanup track,
not the main product-experience lane.

**Session note (2026-08-12, scope correction):** **Do not make anatomy re-sourcing the main lane.**
The current anatomy assets are already the quality reference. The real product gap is that most
other branches are live as content/preview coverage, not anatomy-quality learning experiences.
Added [QUALITY-GAP-MATRIX.md](QUALITY-GAP-MATRIX.md) and changed the execution order:
Physics Electricity flagship first, Chemistry Molecule/Atom second, then Math Algebra, Space
branch reconciliation, and Biology non-anatomy. Anatomy provenance remains a parallel paid-release
cleanup track only.

**Session note (2026-08-12, Physics Electricity flagship):** **First non-anatomy gap filled.**
Electricity now routes to a dedicated flagship simulator at `/app/labs/electricity` instead of the
generic preview branch. It includes a clean procedural 3D circuit with battery, switch, wires,
bulbs, resistor, live current particles, brightness response, series/parallel mode, voltage and
resistance sliders, load stepper, compact meters, Tune Circuit drawer, selectable hotspots, shared
canvas toolbar, Clean view, zoom, labels, X-Ray, and Play/Pause for current animation. Labs index
now treats Electricity as a flagship lab. QA screenshots saved in
`quantaora-app/review-screenshots/implementation/`: `electricity-flagship-clear-desktop.png`,
`electricity-flagship-controls-open-final.png`, `electricity-flagship-mobile-final.png`, and
`electricity-flagship-clean-mobile.png`. Verification: `npm run build`, `npm run lint -- --quiet`,
`npm run codegen:check`, and `npm run assets:check` pass. Next gap: Chemistry Molecule/Atom
builder.

**Session note (2026-08-12, Chemistry Molecule Builder):** **Second non-anatomy flagship
slice shipped.** `/app/labs/molecules` is now a real molecule builder, not only a molecule viewer.
Learners can add H/C/N/O atoms, inspect selected atoms, toggle Bond mode, form/remove bonds, reset
to scientific presets, watch formula/bond/open-valence meters update, and pause/play animated
bond-electron motion through the shared toolbar. The lab keeps the common Rotate, Play/Pause,
Isolate, Section, Compare, Zoom, Fullscreen, More, Reset, labels, X-Ray, Fit view, and Clean view
control model. Labs index now treats Molecules And Bonding as a flagship lab. QA screenshots:
`chemistry-builder-desktop.png`, `chemistry-builder-open-desktop.png`,
`chemistry-builder-add-atom-desktop.png`, `chemistry-builder-mobile.png`, and
`chemistry-builder-clean-mobile.png`. Verification: `npm run build`, `npm run lint -- --quiet`,
`npm run codegen:check`, and `npm run assets:check` pass. Next gap: Math Algebra concrete-object
redesign.

**Session note (2026-08-12, Math Algebra flagship):** **Third non-anatomy flagship slice
shipped.** `/app/labs/functions` is now a concrete algebra studio instead of a graph-only
experience. It includes Steady Savings, Taxi Fare, Tank Draining, Balance Scale, and Candle
Burning contexts; each connects a visible object, equation, graph, table, current x/y value,
slope/rate, and starting value. The shared toolbar is now present in Algebra with Rotate,
Play/Pause, Isolate, Section, Compare, Zoom, Fullscreen, More, Reset, labels, X-Ray, Fit view, and
Clean view. Mobile defaults to a single Tune button so the object is not covered. QA screenshots:
`algebra-studio-desktop.png`, `algebra-studio-controls-open-desktop.png`,
`algebra-studio-mobile.png`, `algebra-studio-clean-mobile.png`, and
`algebra-balance-scale-desktop.png`. Verification: `npm run build`, `npm run lint -- --quiet`,
`npm run codegen:check`, and `npm run assets:check` pass. Next gap: Space branch reconciliation.

**Session note (2026-08-12, Space reconciliation):** **Space flagship routing and controls
reconciled.** Solar System, Stars, and Galaxies are now treated as flagship labs in the Labs index,
instead of being counted like generated preview branches. The Labs index now counts actual
flagship lab rows, not individual hero GLB pieces, so the user-facing stat is no longer misleading.
Galaxies now uses shared Play/Pause for live stellar rotation, while Rotate controls camera orbit;
the shared canvas toolbar has a higher z-layer so hotspot markers cannot intercept toolbar taps on
mobile. The Galaxies tuning panel is compact by default and opens behind a Tune galaxy button,
matching the newer Chemistry/Algebra control pattern. QA screenshots:
`space-solar-flagship-desktop.png`, `space-stars-flagship-desktop.png`,
`space-galaxies-flagship-desktop.png`, `space-galaxies-mobile.png`,
`space-galaxies-clean-mobile.png`, and `space-labs-flagship-index.png`. Verification: Vite
production build, `npm run lint -- --quiet`, `npm run codegen:check`, and `npm run assets:check`
pass. `tsc -p tsconfig.app.json` hung during this session and was stopped; Vite/lint/browser QA did
not show runtime or syntax errors. Next gap: Biology non-anatomy.

**Context engineering rule (2026-08-12):** before starting a new implementation slice, read
this file, [NEXT-SCOPE-IMPLEMENTATION.md](NEXT-SCOPE-IMPLEMENTATION.md),
[ASSET-LICENSES.md](ASSET-LICENSES.md), and
[CONTEXT-ENGINEERING.md](CONTEXT-ENGINEERING.md). After each meaningful slice, update the
session note, verification status, screenshots, and next queue. Do not leave the project state
only in chat.

**Session note (2026-08-10):** **Procedural-visual backfill complete + full headless verification gate.** The generic-solid stand-in is closed for every authored component: component-aware `visual` blocks were authored into all 148 remaining non-math `model-metadata.json` files by `scripts/authoring/author-visuals.py` (197/207 components carry `visual.shape`; the 10 real-GLB models were correctly skipped), and 8 new bio/space compositions shipped (`ear-shell`, `eye-ball`, `intestine-coils`, `stomach-pouch`, `galaxy-disk`, `rotation-spin`, `solar-scale`, `surface-orb`) → **58-composition library**. All 22 branch data files regenerated (codegen writes one branch per invocation — looped over every branch). **Verification: headless puppeteer pass (`scripts/verification/verify-components.js`) across all 17 non-math branches = 158/158 components clean** — sidebar↔content parity, pill matches click target, non-blank canvas, zero console/page/GLB errors; math 49/49 was already gated in the prior session. Bugs the gate caught and fixed: (1) `QuizModal` crashed the entire page when `content.quiz` was empty — added a guard render; (2) **Andromeda was only half-authored** (module/lesson only) and could crash the Galaxies branch — completed `quiz.json` (5 Qs), `model-metadata.json` (5 hotspots + visual), `glossary.json`, `standards.json`, plus `compareCandidateId` both ways with the Milky Way; (3) `hierarchy.ts` still routed solar-system/stars/galaxies to legacy bespoke labs (`/app/labs/orbit|stars|galaxies`) instead of `BranchLab` — repointed, and `componentCount` corrected to authored reality (8/7/2); (4) removed a phantom empty `electrical-conductors-insulators` content dir. lint + build + codegen:check green. **Next: genetics GLB wiring (banked `1BNA`/`1crn`/`1a9n`) and CC BY hero imports** proceed independently; then the Algebra concrete-object redesign; Phase 1 (learner model) per PRODUCTION-PLAN.

**Session note (2026-08-09, pm):** The **STEM OS asset catalogue** (16 subjects × 10 branches,
800 lessons/assets, 112 P0 heroes, 25 procedural engines) was adopted as the procurement source
of truth — full transcription in `docs/supplier/stem-os-asset-catalogue.md`. Key decisions:
physics/chemistry default to **procedural or hybrid**, never static GLB on its own (the
catalogue over-claims GLB on Physics 48:1); the **5 CC BY-NC/ND rows are barred from a paid
release** (Oxygen Atom, Crystal Lattice, Generator ×3 — all have procedural replacements);
the 11 **CC BY** heroes are the cheapest legitimate imports and several map 1:1 to authored
components — **import order: Heart → Lungs → Brain → Animal Cell → Plant Cell → DNA → Abacus**
(heart/brain/lungs q9+; animal/plant cell rows double as NC-RISK replacements for the two
NIH CC-BY-NC-SA cell models). Licence flags from the catalogue are now referenced from
`docs/ASSET-LICENSES.md`.

**Session note (2026-08-09, pm, follow-on):** The generic viewer's per-subject placeholder
solids ("same cube for every math component") were replaced by **component-aware procedural
compositions** per `docs/PROCEDURAL-VISUALS.md`. SHIPPED: 51-composition library
(`quantaora-app/src/components/explorer/procedural/{compositions,resolve}.ts*` +
`src/lib/procedural/types.ts`), authored `visual` blocks in **all 49 math**
`model-metadata.json` files, resolver + viewer rewiring, all 16 branches regenerated;
`lint`/`build`/`codegen:check` clean. Verified headless via puppeteer: all 49 math components
render as distinct compositions (0 GLB failures, 0 page errors, frame diffs 23–108/component).
**Next: physics slice** (`lever`/`pulley`/`battery`/`circuit` compositions, PHY-003/004 style),
then remaining branches until zero generic solids; genetics GLB wiring (banked `1BNA`/`1crn`/
`1a9n`) and CC BY hero imports proceed independently.

**Session note (2026-08-09):** Asset sourcing is underway. A headless harvest pipeline is
working — RCSB PDB Mol* exports GLB directly (`1BNA` DNA dodecamer, `1CRN` crambin, `1A9N`
proto-oncogene, banked for the genetics branch) and the Quaternius **Ultimate Nature Pack**
(CC0) was pulled from its Google Drive folder, all **50 models converted FBX→GLB via Assimp**,
shipped to `quantaora-app/public/models/nature/quaternius-ultimate-nature/`. Two of those are
**now wired**: `producer.glb` and `ecosystem.glb` (tree diorama bases) resolve via
`resolveAuthoredModel()` and render in the Ecology branch instead of the procedural stand-in.
The `seed` component stays procedural for now — every candidate seed source (Sketchfab is
login-walled, itch.io "Green Plant" is FBX + unlicensed) was verified. License rows for
the pack and both derived GLBs were added to `docs/ASSET-LICENSES.md` (all CLEAR). The genetics
branch is next (banked RCSB GLBs → wire DNA/protein).

**Session note (2026-08-08):** **All authored content is now stitched and live.** Verified this
session: 207 components across 22 branches (Biology 81, Chemistry 32, Math 49, Physics 28,
Space 17) are authored on disk, all pass `npm run codegen <branch>` and `npm run codegen:check`,
and every one is now surfaced in the app through a new **data-driven `BranchLab`** at
`/app/labs/branch/:branchId` (generic viewer + hotspots + lesson/quiz/compare modals — driven
by the authored payload, with a procedural 3D stand-in until each GLB is built). Fixed codegen blockers
found along the way: `genetics` had two components on an obsolete process schema
(`dna-replication`, `mutation`) and one with object-form `parts` (`inheritance-punnett-squares`),
plus `protein/model-metadata.json` had four `"TBD-pending-mesh-build"` hotspot positions — all
normalized to the standard schema. `hierarchy.ts` statuses/counts now match the registry
(via a parity check run this session: all 22 live).

---

## 1. What Quantaora is

An interactive 3D STEM learning app for kids ages 8–16 (grades 3–10), covering five subjects —
Biology, Chemistry, Math, Physics, Space — at a build quality bar set by
[Anatomy Atelier](https://anatomy-livid.vercel.app/): clean 3D, warm off-white surfaces,
hotspot-driven exploration, no gamey clutter. Content follows a strict hierarchy
(`Subject > Branch > Unit > System/Group > Component > Structure/Variable/Rule > Micro-skill`,
spec §6) and every authored component satisfies the Component-Level Learning Flow: **See it →
Touch it → Name it → Explain it → Belongs to → Compare it → Use it → Review it**.

Product shape (locked): consumer-first, school-ready as it grows. US/NGSS-aligned first.
Three grade bands — **3–5, 6–8, 9–10** (K–2 explicitly out of scope: pre-readers need an
audio-first product, not 3D hotspot labs). Free for now, no monetization gate yet. No AI tutor.
Local-first data (everything runs and persists without an account); accounts/rostering come
later as an additive layer, not a rewrite.

---

## 2. Content scope — every branch, current status

Status values: **live** (real interactive 3D component in the app), **authored-pending**
(lesson/quiz/glossary/model-metadata written to `content/subjects/`, not yet wired into a
route), **planned** (named in the spec, nothing built or sourced yet).

### Biology (12 branches)

| Branch | Status | Components | Grades |
|---|---|---|---|
| Cell Biology | **live** — `/app/labs/branch/cell-biology` | 21 | 6–8 |
| Human Anatomy | **live** — `/app/labs/branch/human-anatomy` | 16 | 3–8 |
| Human Physiology | **live flagship** — `/app/labs/physiology` | 9 | 6–10 |
| Genetics | **live flagship** — `/app/labs/genetics` | 10 | 7–10 |
| Ecology | **live** — `/app/labs/branch/ecology` | 11 | 4–8 |
| Plants | **live flagship** — `/app/labs/plants` | 9 | 3–8 |
| Microbiology | **live flagship** — `/app/labs/microbiology` | 5 | 7–10 |
| Animals | planned | — | 3–5 |
| Evolution | planned | — | 7–10 |
| Health And Disease | planned | — | 6–10 |
| Neuroscience | planned | — | 9–10 |
| Biochemistry Foundations | planned | — | 10 |

### Chemistry (10 branches)

| Branch | Status | Components | Grades |
|---|---|---|---|
| Periodic Table | **live** — `/app/labs/atoms` | 10 | 7–10 |
| Molecules And Bonding | **live flagship** — `/app/labs/molecules` | 6 | 7–10 |
| Atoms And Elements | **live** — `/app/labs/atoms` | 9 | 6–8 |
| Chemical Reactions | **live** — `/app/labs/reactions` | 7 | 7–10 |
| States Of Matter | planned | — | 3–7 |
| Acids And Bases | planned | — | 7–10 |
| Solutions | planned | — | 7–10 |
| Stoichiometry / Organic Chem / Biochem Links (foundations) | planned | — | 10 |

### Math (9 branches)

| Branch | Status | Components | Grades |
|---|---|---|---|
| Number Sense And Arithmetic | **live** — `/app/labs/branch/number-and-arithmetic` | 10 | 3–5 |
| Fractions And Ratios | **live** — `/app/labs/math-manipulatives` | 8 | 3–7 |
| Algebra | **live** — `/app/labs/branch/algebra` | 10 | 7–10 |
| Geometry | **live** — `/app/labs/math-manipulatives` | 11 | 6–10 |
| Data And Statistics | **live** — `/app/labs/math-manipulatives` | 10 | 4–10 |
| Measurement | planned | — | 3–5 |
| Graphs And Functions | planned | — | 7–10 |
| Trigonometry / Calculus Foundations | planned | — | 9–10 |

**Known quality gap:** Algebra was previously user-rated 1/10 — abstract graph-only
presentation, no real-world object grounding. Approved redesign (not yet built): rebuild
around concrete objects — piggy bank (linear growth), taxi meter (slope/intercept), draining
tank (rate of change) — per the "guided procedure structure, deeper simulation rigor" decision.

### Physics (10 branches)

| Branch | Status | Components | Grades |
|---|---|---|---|
| Mechanics | **live** — `/app/labs/branch/mechanics` | 13 | 6–10 |
| Energy | **live** — `/app/labs/energy` | 6 | 4–10 |
| Electricity | **live** — `/app/labs/branch/electricity` | 9 | 6–10 |
| Waves / Sound / Light And Optics / Magnetism / Fluids / Heat / Modern Physics | planned | — | varies |

### Space (10 branches)

| Branch | Status | Components | Grades |
|---|---|---|---|
| Solar System | **live** — `/app/labs/branch/solar-system` | 8 | 3–8 |
| Stars | **live** — `/app/labs/branch/stars` | 7 | 6–10 |
| Galaxies | **live** — `/app/labs/branch/galaxies` | 2 | 7–10 |
| Earth In Space | **live** — `/app/labs/earth-in-space` | 5 | 3–7 |
| Moons | **live** — `/app/labs/moons` | 5 | 3–8 |
| Gravity And Orbits / Asteroids And Comets / Space Exploration / Telescopes / Cosmology | live through generated branch routes | varies | varies |

### Totals

- **8 flagship lab routes**: Human Anatomy, Genetics, Plants, Microbiology, Chemistry Molecules,
  Physics Electricity, Math Algebra, plus the three Space flagship routes (Solar System, Stars,
  Galaxies) — 10 flagship entries in the Labs index total.

- **51 audited branches, 315 declared components** across all 5 subjects. The latest
  `npm run quality:gaps` report shows 50 branches with P1 depth proof and 0 P1 branches still
  needing depth proof.
- **No authored content remains unwired.** Earth In Space is live as a dedicated five-mode lab.
- **3D note:** most branches still render through the generic viewer. Human Anatomy, Genetics,
  Plants, Microbiology, Chemistry Molecules, Physics Electricity, Math Algebra, Solar System,
  Stars, and Galaxies now have stronger bespoke flagship routes. 19 GLBs ship (9 organs, 3 cells,
  5 space + 2 ecology) plus the 50-model CC0 Quaternius nature pack, resolved by basename via
  `resolveAuthoredModel()`. The rest still use the procedural stand-in (hotspots + lessons +
  quizzes all live) — that is the next quality gate (Anatomy Atelier bar).
- 51 branches total in the taxonomy; current P1 work is visual QA and asset-quality uplift, not
  missing branch/component proof.

---

## 3. Architecture snapshot

- Vite + React 19 + TypeScript + React Router (`BrowserRouter`).
- Tailwind CSS v4 (CSS-first `@theme`, OKLCH tokens) — no `tailwind.config.js`.
- React Three Fiber + drei for all 3D: `useGLTF` for sourced models, custom `ShaderMaterial`
  for procedural bodies (stars via blackbody-temperature color, galaxies via GPU point clouds
  with differential rotation, cells).
- Zustand + `persist` middleware → **a single `localStorage` blob** (`quantaora-local-progress`):
  `learnerProfile`, `lastVisitedLab`, `notebook[]`, `quizResults[]`,
  `mastery: Record<id, 0-5>`, `timeSpentMinutes`. First Flight profile exists, but Dexie,
  per-skill progress, due-review, migration, and backup/export are still Phase 1 gaps.
- Shared UI pattern across every lab (this was the "why is every screen different" fix):
  `ContentNav` (left sidebar), `CanvasControls` (Rotate/Play/Isolate/Section/Compare/Zoom/
  Fullscreen/More/Reset rail), `DetailPanel`, `BottomTray`
  (Lesson/Checkpoint/Notebook/Real-world), `CompareModal` with a required `compareReason` so
  pairings are never arbitrary. The canvas rail also supports labels, X-Ray, Fit view, Clean
  view, and embedded GLB animation playback when an asset supplies animation clips.
- Visual QA gate: `npm run qa:visual-signals` uses Playwright to audit lab routes from the
  generated P0/P1 report. Use `QA_SCREENSHOTS=none` for low-token pass/fail checks,
  `QA_SCREENSHOTS=failures` for failure screenshots, and `QA_ROUTE_FILTER=<route-or-branch>` for
  targeted checks.
- Content authoring file set per component (spec §23): `module.json`, `lesson.md`, `quiz.json`,
  `simulation.ts` (where applicable), `model-metadata.json`, `glossary.json`, `standards.json` →
  `content/subjects/<subject>/<branch>/<component>/`.
- Asset licensing tracked per-file in [ASSET-LICENSES.md](ASSET-LICENSES.md) — NASA models,
  the Quaternius nature pack (50 GLBs), project-owned cell/chemistry assets, and most textures
  are CLEAR (public domain / CC0 / authored); 9 organ models need provenance confirmed before
  paid launch.

---

## 4. Phase plan

### Foundations Infra — content-driven pipeline (F1) — **done**
The `content/` → TS pipeline is live end-to-end: content is the single source of truth for the
physiology branch, the app renders generated output, and there is no hand-written duplicate.
- **Schema** (`quantaora-app/src/lib/schema/content.ts`) — Zod contracts for `module.json`,
  `model-metadata.json`, `quiz.json`, `glossary.json`; normalized `ComponentContent` union.
- **Codegen** (`quantaora-app/scripts/codegen/generate.ts` + `seeds/`) — reads authored content,
  emits `src/data/generated/human_physiology.ts` (9 components) with `physiologyProcessById`.
  `npm run codegen`.
- **Absorption migration** (`scripts/codegen/migrate-physiology-fields.ts`, one-time) — moved the
  app-only fields out of the hand-written file and INTO authored content: hotspot `color` +
  `function` (47 hotspots, matched by position), plus `scientificName`, `tagline`, `didYouKnow`,
  `conditions`, `compareCandidateId`, `compareReason` on 8/9 module.json. Content is now fully
  self-contained; the enrichment seed is **empty** (kept only so codegen has one path).
- **Parity check** (`scripts/codegen/parity-check.ts`, `npm run codegen:check`) — hard gates:
  (1) generated round-trips authored content losslessly, (2) app contract fully covered. Both ✓.
- **Flip done**: `src/data/physiologyProcesses.ts` (hand-written) deleted; `allContent.ts` +
  `PhysiologyLab.tsx` import `@/data/generated/human_physiology`. Verified: `tsc -b`, `oxlint`
  (0 errors), `vite build` all pass.
- Note: hotspot `id`s in content are the `hs-*` scheme, internally consistent across
  `model-metadata.json` / `quiz.hotspotId` / `lesson.md`; the old app file had drifted to a
  different id scheme. Hotspot `label`/`position`/`color`/`description` are unchanged.

### Phase 0 — Unify UI + fix worst content gaps — **done**
Shared nav/canvas-rail/compare pattern across all labs. Grade-band data model
(`GRADE_MIN/MAX`, `GRADE_BANDS`, `gradeMin/gradeMax` on every branch). Parent/Teacher zone
rebuilt to cover all 5 subjects (was Biology-only, hiding 36 of 45 components from parents).
Wrong-quiz-answers now surface the authored `misconception` field, not just the right answer.
Stars and Galaxies branches built and wired (15 new components). Real NIH GLB models swapped
into Animal Cell and Neuron (Bacterial Cell correctly kept procedural — the sourced model is a
cell-wall cross-section, not a whole bacterium). Fixed a 22px hotspot-marker misalignment bug
present in every 3D viewer in the app.

### Phase 1 — Learner model + onboarding — **partially started**
- Done: `/first-flight` creates a local `LearnerProfile` with name, grade, interests,
  confidence, and a recommended lab. App shell surfaces resume/recommended-lab behavior.
- Done: Labs page has grade-band filters (`3–5`, `6–8`, `9–10`) and quality filters.
- Remaining: migrate the single `localStorage` blob to Dexie/IndexedDB (spec's multi-store
  local database model).
- Remaining: `SkillProgress` per component/hotspot
  (confidence, attempts, `nextReviewAt`, `mistakeTags`) replacing the flat 0–5 `mastery` map.
- Remaining: grade-aware mission selection, due-review queue, and audience-split progress metrics.

### Phase 2 — Retention mechanics — **not started**
Khan-style Mastery Challenge (6 questions / 3 skills / 2 each; 2/2 → level up, 0/2 → level
down, 1/2 → no change). Leitner spaced-repetition boxes (1/2/4/8/16-day intervals) driving
`nextReviewAt`. Guided predict → test → observe → conclude lab flow (currently labs are
open-ended explore-only). Daily accuracy goal. Per-interaction telemetry (local-first).

### Phase 3 — Classroom layer — **not started**
Class code + nickname seats (no student PII required to join). Teacher assignment of specific
components/branches. Class-level reports. Teacher-facing content bundle. Privacy artifacts
(COPPA 2025 amendments, FERPA school-official exception, UK Age Appropriate Design Code,
GDPR Article 8 — all researched, none implemented).

### Phase 4 — Standards & authoring tools — **not started**
Standards display layer (surface NGSS/state-standard tags already captured in
`standards.json` per component — authored but not rendered anywhere). Smart reassignment
(recommend review based on `mistakeTags`). Custom quiz builder for teachers. Lab presets.
ESSA Tier 4 evidence packet.

### Phase 5 — Integrations & scale — **not started**
Clever / ClassLink / Google Classroom rostering (OneRoster, LTI 1.3). Admin console.
Replace the two CC-BY-NC-SA cell models before any paid launch. Confirm organ-model
provenance before paid launch.

---

## 5. Open risks / honest gaps

- **Every component resolves a meaningful procedural composition, not a generic solid** — all 207 authored components have `visual.shape` blocks; the remaining quality gap is the *real GLB asset* itself: 19 GLBs ship (9 organs, 3 cells, 5 space + 2 ecology) plus the 50-model CC0 Quaternius nature pack, the rest render the authored composition stand-in until each asset is built/sourced to the Anatomy Atelier bar.
- **Math (Algebra) quality gap remains** — authored content is live now, but the approved
  concrete-object redesign (piggy bank / taxi meter / draining tank) isn't built.
- **Grade filtering exists only on Labs** — First Flight captures grade and Labs can filter by
  grade band, but Subjects, mission routing, and Parent/Teacher reports are not yet grade-aware.
- **Mastery is a single 0–5 int per component**, no confidence/attempts/decay — spaced
  repetition literally cannot be built on top of it without the Phase 1 migration.
- **No registered NC-RISK assets remain live** — the remaining paid-launch asset blocker is the
  9 REVIEW anatomy organ GLBs that need provenance confirmation or replacement.
- **Standards tags are authored but invisible** — every component has a `standards.json`,
  nothing in the UI ever shows it, so there's no parent/teacher-facing proof of curriculum
  alignment despite the data existing.
- **Visual QA remains a P1 execution track** — screenshots now cover a representative desktop
  and mobile set, but the full branch matrix still needs pass/fail screenshots before calling P1
  fully closed.
