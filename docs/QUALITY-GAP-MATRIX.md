# Quantaora Quality Gap Matrix

Status: active execution guide. Last updated 2026-08-23.

**2026-08-23 coverage update:** all hierarchy branches are live. The old "preview-only" gap is
closed for breadth; the remaining work is visual depth, asset clearance, richer guided challenges,
and production readiness. Number Sense now routes to `/app/labs/number-sense` as a dedicated
manipulative lab, while many newer foundation branches route through generic BranchLab with
procedural visuals.

**2026-08-19 verification + perf wave:** Anatomy provenance remains REVIEW (nine assets, hashes +
replacement leads recorded); all 16 authored Anatomy components reachable, generic route correctly
gates REVIEW assets. Moons now tested. Ecology Predator/Prey visually distinct with canonical
meters. Chemistry NaCl has context/focus isolate. Microbiology virus uses the real NIH poliovirus
capsid mode. Route lazy loading cut initial gzip ~1.27MB→134KB; Hero scene progressive-loads with
first-paint text; 404 is accessible. Verified: 282/282 tests, build/lint/codegen/assets pass, 23
branches parity-checked, 53 CLEAR/4 ATTRIB/9 REVIEW assets. Residuals: nine Anatomy REVIEW assets
remain a paid-launch blocker, `branchModules` ~1.57MB shared data chunk (async compare split
proposed, not done), `GlbErrorBoundary` duplicated across shared components, pre-existing lint
warnings remain.

**2026-08-19 P0 wave:** Earth In Space five-mode lab + canonical content/codegen integration;
Algebra piggy-bank/taxi/draining-tank redesign + mobile graph; Chemistry water/CO2/methane/NaCl
GLBs wired + water orientation fix; Mechanics/Energy prop integrations + mobile
reachability/asset-prominence fixes; Ecology distinct central scenes. Verified: 236/236 tests,
build/codegen/assets pass, 23 branches parity-checked, no console errors/overflow. Residuals:
Predator vs Prey still similar (P2), procedural Ecology/Mechanics below Anatomy polish, NaCl
isolate (P2), bundle ~4.64MB minified/~1.27MB gzip, nine Anatomy REVIEW assets remain a
paid-launch blocker (licensing unsolved).

Anatomy is the visual and interaction reference. Its current organ assets are good enough to keep as
the product quality target; provenance cleanup is a parallel paid-release task, not the main
experience-building lane.

## Quality Bar

A branch meets the bar only when it has:

- a premium recognizable GLB scene or a deliberately precise procedural simulator;
- no canvas clipping or hidden asset parts on desktop/mobile;
- shared toolbar support: labels, zoom, reset, fullscreen, Clean view, and Play/Pause where useful;
- branch-specific interaction beyond rotate/click;
- cause/effect investigation where applicable: changing speed, distance, force, temperature,
  concentration, water, time, population, or another real variable must visibly change the
  model/simulation and explain the result;
- hotspots tied to visible parts, variables, or actions;
- lesson/checkpoint/notebook content tied to what the learner can actually manipulate.

## Live Branch Coverage

| Subject | Branch | Components | Current coverage | Quality gap |
| --- | --- | ---: | --- | --- |
| Biology | Human Anatomy | 16 | 7 hero organ GLBs + preview coverage for remaining components | Keep as reference. Do not spend primary execution here unless paid-release provenance is the task. |
| Biology | Cell Biology | 21 | Authored animal cell and neuron exist, but branch coverage is still mostly preview | Wire/upgrade hero cells into the branch; add bacteria, plant cell, and cell division quality assets. |
| Biology | Human Physiology | 9 | Dedicated physiology flagship | Improved: `/app/labs/physiology` now has shared toolbar, procedural 3D process scenes, compact meters, and Tune body cause/effect controls across all 9 authored processes: blood circulation, breathing, digestion, hormone signaling, immune response, kidney filtration, muscle contraction, nerve signaling, and temperature regulation. Remaining: deeper per-process challenges, better anatomical GLB assets where they improve clarity, and stronger mobile content layout below the canvas. |
| Biology | Genetics | 10 | Dedicated genetics flagship | Improved: DNA double helix with base-pair inspection, gene segments, mutation toggle (substitution/insertion/deletion with silent/missense/nonsense effects), replication and transcription-translation animation driven by real Play/Pause, protein fold toggle, chromosome packaging with DNA-coil reveal, allele/trait pairing, and Punnett-square grid with ratio bars at `/app/labs/genetics`. Shared toolbar, Tune molecule panel, Clean view. Remaining: RCSB GLB wiring (`1BNA`/`1CRN`/`1A9N` were never harvested to disk) as a scientific-fidelity deepening pass. |
| Biology | Ecology | 11 | Dedicated ecology flagship | Improved: `/app/labs/ecology` now has one ecosystem diorama for all 11 authored components: organism, population, community, ecosystem, habitat, niche, producer, consumer, decomposer, predator, and prey. Learners can change sunlight, predator pressure, decomposer activity, and habitat stress, then see producer energy, prey safety, population balance, nutrient recycling, habitat/water/shelter state, and animated food-web energy flow respond. Uses two existing clear Quaternius support GLBs plus procedural organisms. Remaining: higher-fidelity ecosystem/animal GLBs, richer food-web challenge sequences, and authored compare candidates. |
| Biology | Plants | 9 | Dedicated plant-flag | Improved: all 9 authored plants components compose one plant-study studio at `/app/labs/plants` — chloroplast cutaway (membrane peel, grana, chlorophyll flecks, input rays + photon flow + sugar/O₂ output), flower anatomy with pollen-transfer animation and seed-forming ovary, leaf food factory (veins, chlorophyll, breathing stoma with CO₂-in/O₂-out arrows), phloem sugar flow leaf→root/seed sinks, root system in peelable soil (root cap, root hairs, rising xylem water, storage), seed cutaway with staged germination (coat split, root first, shoot rises, leaves open), stem two-way elevator (water up xylem / sugar down phloem, node rings, cross-section), stomata with guard-cell turgor slider (pore openness % with breathing cycle), and xylem tube-in-tube with rising water. Shared toolbar, Tune plant panel, meters, Clean view. Remaining: compare candidates for plants (Compare stays disabled), deeper guided photosynthesis/transport quizzes, and more cause/effect controls for light/water/CO₂ intensity. |
| Biology | Microbiology | 5 | Dedicated microbe studio | Improved: all 5 authored microbiology components compose one microbe lab at `/app/labs/microbiology` — bacteria cutaway (peelable cell wall + membrane, loose DNA loop, whipping flagellum, binary-fission pinch + division buddies), virus infection cycle (icosohedral coat with attachment spikes, peel coat to expose the genetic-material coil, attach → host cell → release of new viruses), fungus on soil (peel soil to expose the hyphae/mycelium network, drifting spores, budding yeast), protozoa pond drop (amoeba with pulsing pseudopod, nucleus, food vacuole and engulfed food speck; flagellate whip; ciliate hairs), and microbiome (human silhouette with dense gut + sparse skin colonies, gut-wall close-up, helpful-job chips, and an antibiotic slider that visibly shrinks the community). Shared toolbar, Tune microbe panel, meters, Clean view. Duplicate-key/detail fallback issue fixed. Remaining: compare candidates for microbiology (Compare stays disabled) and deeper guided infection/immune-response challenges. |
| Chemistry | Atoms And Elements | 9 | Dedicated atom/table flagship | Improved: `/app/labs/atoms` now covers all 9 atom components with a procedural atom model, protons/neutrons/electrons, shell rings, selectable first-18 elements, ion charge, isotope neutron, electron-speed, group/period, and particle/mass/shell readouts. Shared toolbar, Tune atom panel, DetailPanel, Lesson/Quiz/Compare, and mobile action bar are wired. Remaining: richer orbital/cloud modes, higher-fidelity atom GLB usage, and guided identity/isotope/ion challenge sequences. |
| Chemistry | Periodic Table | 10 | Dedicated atom/table flagship | Improved: `/app/labs/atoms` now covers all 10 periodic-table components in the same atom/table bridge: clickable first-18 table, group/period positions, category coloring, valence-shell handoff, atomic-number/mass readouts, and element-to-atom cause/effect. Remaining: full-table mode, more elements, stronger family simulations, and cleared element/sample GLBs where useful. |
| Chemistry | Molecules And Bonding | 6 | Dedicated molecule builder | Improved: scientific presets, H/C/N/O atom adding, bond add/remove mode, live formula/bond/valence meters, atom inspection, animated bond electrons, and shared toolbar at `/app/labs/molecules`. Remaining: PubChem/RCSB-backed structure imports where exact geometry matters, polarity/shape compare, and guided challenges. |
| Chemistry | Chemical Reactions | 7 | Dedicated reactions flagship | Improved: `/app/labs/reactions` now has one reaction bench for all 7 authored components: reactant, product, coefficient, balanced equation, conservation of mass, exothermic, and endothermic. Learners can change H2/O2/H2O coefficients, temperature, catalyst help, and heat mode, then see atom counts, conservation gap, balanced/unbalanced state, rate, energy, and heat absorbed/released respond. Shared toolbar, Tune reaction panel, meters, DetailPanel, Lesson/Quiz/Compare, and mobile action bar are wired. Remaining: richer reaction presets, particle-collision mode, stronger apparatus/molecule GLBs, and guided stoichiometry challenges. |
| Math | Number And Arithmetic | 10 | Dedicated number-sense flagship | Improved: `/app/labs/number-sense` covers addition, subtraction, multiplication, division, place value, number line, negative numbers, factors, multiples, and prime numbers with concrete manipulatives, operation controls, abacus/place-value behavior, mobile fit fixes, shared toolbar, DetailPanel, Lesson/Quiz/Compare, and BottomTray. Remaining: deeper guided challenge sequences, more direct drag handles, and optional tactile GLB props only where they improve clarity. |
| Math | Fractions And Ratios | 8 | Dedicated manipulatives flagship | Improved: `/app/labs/math-manipulatives` now covers all 8 fraction/ratio components with fraction tiles, denominator/numerator controls, decimal/percent readouts, simplified fraction, ratio mixer, and scaled proportion feedback. Shared toolbar, Tune math panel, DetailPanel, Lesson/Quiz/Compare, and mobile action bar are wired. Remaining: richer equivalent-fraction animations, number-line handoff, and guided challenge sequence. |
| Math | Algebra | 10 | Dedicated concrete algebra studio | Improved: piggy bank savings, taxi fare, draining tank, balance scale, and candle contexts with object, equation, graph, table, x/y meters, rate/start/test controls, shared toolbar, and Clean view at `/app/labs/functions`. Remaining: deeper guided challenge sequence and better algebra manipulatives for all 10 generated components. |
| Math | Geometry | 11 | Dedicated manipulatives flagship | Improved: `/app/labs/math-manipulatives` now covers all 11 geometry components with an angle/ray board, measurement block, area/perimeter/volume readouts, side/depth/angle controls, labels, zoom, and Clean view. Remaining: direct drag handles, transformations, circle-specific radius/diameter mode, and proof-style guided challenges. |
| Math | Data And Statistics | 10 | Dedicated manipulatives flagship | Improved: `/app/labs/math-manipulatives` now covers all 10 data/statistics components with bar/line/table-style visualization, point/outlier controls, live mean/median/mode/range readouts, and visible outlier effects. Remaining: direct draggable points, probability-specific simulation, distribution view, and guided chart-reading challenges. |
| Physics | Electricity | 9 | Dedicated flagship circuit simulator | Improved: battery, bulbs, wires, switch, current animation, resistance/voltage controls, series/parallel mode, live meters, and shared toolbar are now routed at `/app/labs/electricity`. Remaining: deeper guided challenges and apparatus GLBs only if they improve clarity. |
| Physics | Mechanics | 13 | Dedicated mechanics flagship | Improved: `/app/labs/motion` now has one ramp/cart mechanics simulator for all 13 authored components. Learners can change applied force, mass, friction, slope, and gravity, then see net force, acceleration, velocity, position, distance/displacement, normal force, weight, friction, momentum, and kinetic-energy indicators respond. Shared toolbar, Tune mechanics panel, meters, DetailPanel, Lesson/Quiz/Compare, and mobile action bar are wired. Remaining: deeper collision/pendulum/lever/pulley modes and cleared apparatus GLBs if they improve recognition. |
| Physics | Energy | 6 | Dedicated energy flagship | Improved: `/app/labs/energy` now has one coaster/cart energy-transfer simulator for all 6 authored components. Learners can change start height, mass, heat loss, push force, push distance, and transfer time, then see total energy, potential/stored energy, kinetic/motion energy, heat, useful output, efficiency, work, and power respond. Shared toolbar, Tune energy panel, meters, DetailPanel, Lesson/Quiz/Compare, and mobile action bar are wired. Remaining: deeper electrical/thermal/chemical energy modes and richer guided conservation challenges. |
| Space | Solar System | 8 | Bespoke orbit flagship | Improved: Labs index routes and counts it as flagship; orbit simulation has Play/Pause, zoom, labels, X-Ray, Clean view, distance controls, Kepler period feedback, and a Rotation vs Revolution investigation with separate spin/orbit/year meters, selected-planet spin arrow, rotation-speed slider, revolution-speed slider, and orbital-distance/year-length cause effect. Remaining: saved missions and deeper guided scale challenges. |
| Space | Stars | 7 | Bespoke stars flagship | Improved: Labs index routes and counts it as flagship; NASA GLBs/procedural physics stars use shared toolbar, labels, Clean view, and GLB animation support where available. Remaining: lifecycle property controls and guided comparison sequence. |
| Space | Galaxies | 2 | Bespoke galaxy flagship | Improved: Labs index routes and counts it as flagship; particle galaxy has shared Play/Pause, camera Rotate, zoom, labels, compact Tune galaxy panel, and Clean view. Remaining: saved comparisons and deeper morphology challenges. |

## Priority Order

1. **Biology non-anatomy** — Genetics, Plants, Microbiology, Human Physiology, and Ecology first
   passes are live; next work here is asset fidelity, compare candidates, and richer challenges.
2. **Chemistry deepening** — Molecules, Reactions, and Atoms/Periodic Table first passes are live;
   next chemistry work is PubChem/RCSB-backed molecules, polarity/shape comparisons, full-table
   mode, richer reaction presets, and guided stoichiometry/ion/isotope challenges.
3. **Math deepening** — Algebra and Math Manipulatives first passes are live; next close Number
   Sense/Arithmetic, add direct drag handles, and build guided challenge sequences.
4. **Space deepening** — add saved missions, lifecycle controls, and morphology challenges.

## Next Implementation Slice

Physics Electricity, Chemistry Molecules, Math Algebra, Space reconciliation, the Genetics
flagship, the Plants flagship, the Microbiology flagship, the Human Physiology flagship, and the
Ecology flagship first passes are live. Next move to the highest-value non-Biology gap:

1. Deepen Math Manipulatives with direct drag handles, transformations, probability
   simulation, and richer guided challenges.
2. Source cleared apparatus/molecular GLBs only where recognition improves; keep reaction behavior
   procedural/data-driven so the learning remains controllable.
3. Upgrade generic BranchLab foundation branches with richer branch-specific interactions where
   a variable can visibly change the outcome.
4. Verify desktop/mobile screenshots, no clipping, toolbar behavior, labels, Clean view, and
   Play/Pause where useful.
