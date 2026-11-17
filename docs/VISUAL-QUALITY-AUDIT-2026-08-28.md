# Visual Quality Audit - 2026-08-28

Scope: P1 route visual audit after the cross-subject asset coverage waves.

## Evidence

- Screenshot folder: `quantaora-app/review-screenshots/lab-visual-signals-2026-08-27/`
- Contact sheets: `contact-sheet-1-settled.jpg`, `contact-sheet-2-settled.jpg`,
  `contact-sheet-3-settled.jpg`, `contact-sheet-4-settled.jpg`
- Latest signal gate: `QA_SCREENSHOTS=none npm run qa:visual-signals`
- Result: 48 routes passed, 0 failed.
- Visual rubric source: `quantaora-app/src/data/visualQualityRubric.ts`
- Operational queue: `docs/TODAY-P0-P1-GAP-REPORT.md`
- First branch sourcing manifest: `docs/assets/biology-animals-sourcing-candidates.json`

## What Is Done

- All audited live lab routes have a visible lab stage.
- Shared toolbar expectations are present, including Zoom In and Zoom Out.
- Lesson and Checkpoint affordances are visible.
- P1 mission language is visible enough for the current signal gate.
- No audited route is missing a registered asset mapping.
- Visible stuck loading status is now treated as a QA failure.
- Hidden/stale loading text no longer causes false long waits.
- Every live branch now has an explicit visual quality grade.
- `npm run quality:gaps` now reports `Visual grade`, `Replacement target`, and `P1 asset realism`.
- Sound and Fluids now have branch-specific cause/effect panels instead of only generic model
  controls. Sound covers frequency, amplitude, medium, listener distance, echo delay, wavelength,
  and vacuum behavior. Fluids covers pressure/depth, density, buoyancy, float/sink balance,
  viscosity, tube width, temperature, and flow.
- Heat And Thermodynamics now has a branch-specific cause/effect panel. It covers heat source
  temperature, object temperature, material type, insulation, particle motion, exposure time,
  conduction/convection/radiation, heat-flow direction, estimated temperature change, particle speed,
  fastest/slowest material comparison, and insulation effect.
- Health And Disease, Neuroscience, and Biochemistry Foundations now have branch-specific
  cause/effect panels. Health covers pathogen amount, immune response, time, vaccine readiness,
  spread/contact, recovery, infection pressure, immune advantage, symptom risk, and antibody
  readiness. Neuroscience covers signal strength, myelin, synapse gap, neurotransmitter amount,
  stimulus frequency, fatigue/rest, signal speed, synapse crossing, and reaction delay. Biochemistry
  covers temperature, pH, substrate, enzyme fit, concentration, folding stress, reaction rate,
  product output, denaturation risk, and membrane permeability.
- A reusable data-driven `BranchCauseEffectPanel` now covers the remaining config-ready P1 branches:
  Cell Biology, Evolution, Animals, Biochemistry Links, and Human Physiology. These configs add
  cause/effect controls, computed learner-facing results, component-specific focus text, compact
  visual meters, and saved lab state without adding more one-off panel code.
- The shared Cell Biology and Human Physiology cause/effect panels are now visible on their
  dedicated routes, `/app/labs/cells` and `/app/labs/physiology`, not only the generic branch URLs.
- Health And Disease > Pathogen now uses the vetted NIH influenza hero GLB already staged in
  `public/models/sourced/biology-gaps-wave2/` with its license sidecar, replacing the weaker
  authored placeholder for that component.
- Asset Realism Wave 1 now has a code-level tracker in
  `quantaora-app/src/data/assetRealismTracker.ts`. Cell Biology > Cell Wall and Cell Biology >
  Ribosome now use existing vetted NIH/RCSB GLBs where they fit; Human Physiology generated branch
  components now resolve to registered local support GLBs instead of unresolved placeholder paths.
  These are realism upgrades, not final flagship completion.
- The generic branch viewer now uses per-component camera bounds and targeted fit/offset rules for
  the largest biology realism upgrades, so toolbar zoom/reset does not leave the ribosome, pathogen,
  or Human Physiology support objects clipped against the canvas edge.
- `BranchLab.tsx` no longer owns the shared config-driven panel block or the bespoke branch panel
  implementations directly. The shared system lives in `src/components/labs/BranchCauseEffectPanel.tsx`
  and `src/data/branchCauseEffectConfigs.ts`; option-rich bespoke panels live in
  `src/components/labs/BranchBespokeCauseEffectPanels.tsx`.

## Quality Read

The product is now much stronger functionally than before the P1 wave: the labs are no longer mostly
"coming soon", and there is route coverage across subjects, branches, and components. The quality bar
is still uneven.

Human Anatomy remains the visual benchmark: recognizable, inspectable, real 3D educational objects.
Some newer authored assets are effective as clean teaching diagrams, but many do not yet feel as rich
or premium as the anatomy assets. That is acceptable for functional coverage, but not enough for a
paid flagship product.

## Remaining Priority

1. Replace weakest authored concept GLBs with sourced or artist-grade `.glb` assets where realism is
   educationally important. Current P1 asset-realism queue remains: Cell Biology, Human Physiology,
   Evolution, Animals, Health And Disease, Neuroscience, Biochemistry Foundations, Biochemistry
   Links, Sound, Fluids, and Heat And Thermodynamics. Wave 1 improved Cell Wall, Ribosome,
   Pathogen, and generic Human Physiology support assets, but did not close whole-branch realism.
   First concrete pipeline started for Animals: five Smithsonian CC0 candidates are vetted for
   authenticated import, and the Sketchfab importer dry-run path is validated. Evolution now also
   has five Smithsonian CC0 candidates vetted for authenticated import, and importer output folders
   derive from the manifest branch id so future Evolution downloads land under
   `public/models/sourced/biology-evolution/`. Sound, Fluids, Heat/Thermodynamics, and
   Biochemistry Foundations now have attribution-review manifests with live dry-run validation, but
   they remain unwired until attribution, optimization, and visual QA are complete.
   Sound and Fluids have stronger interaction now, but remain in this queue because their visual
   assets are still mostly clean authored apparatus/diagrams rather than anatomy-level inspectable
   real objects. Heat And Thermodynamics also has stronger interaction now, but remains in this
   queue until thermometer/hot-plate/insulated-cup apparatus assets are upgraded. Health And
   Disease, Neuroscience, and Biochemistry Foundations now teach cause/effect more clearly, but
   still need stronger sourced/artist-grade 3D assets for immune/pathogen models, neuron/synapse
   models, and protein/enzyme/membrane models. Cell Biology, Evolution, Animals, Biochemistry Links,
   and Human Physiology also have stronger interaction now, but still need anatomy-bar sourced or
   artist-grade models for cells/organelles, organisms/fossils/adaptations, animal body plans,
   molecule/pathway links, and physiology system apparatus.
2. Optimize heavy sourced models and textures. Current slow routes are expected but visible:
   Space Exploration, Magnetism, Light And Optics, Asteroids And Comets, Telescopes, Human Anatomy,
   Solar System, and Stars.
3. Keep the subjective visual-grade rubric current as assets improve: `flagship`, `good`,
   `diagram-only`, `replace`, `legal-review`.
4. Keep the current signal gate as the cheap regression check, then run screenshot/contact-sheet
   review only after visual asset changes.
5. If paid launch resumes, clear the Human Anatomy REVIEW/provenance queue before any public paid
   release.

## Validation

- `npm test -- src/routes/labGlbErrorStatusAnnouncement.test.ts src/glbSafetyAudit.test.ts`: pass
- `npm test -- src/data/visualQualityRubric.test.ts`: pass
- `npm run quality:gaps`: pass
- `npm run build`: pass
- `QA_SCREENSHOTS=none npm run qa:visual-signals`: pass, 48/48
- `npm test -- src/routes/BranchLab.test.ts src/data/biologyRemainingBranches.test.ts src/data/foundationBranches.test.ts`: pass
- `npm test -- src/routes/BranchLab.test.ts src/data/biologyRemainingBranches.test.ts src/data/foundationBranches.test.ts src/data/physicsEverydayBranches.test.ts src/data/cellBiologyAssetWiring.test.ts`: pass
- Playwright branch checks for `/app/labs/branch/cell-biology`, `/app/labs/branch/animals`, and
  `/app/labs/branch/human-physiology`: pass, no mobile horizontal overflow after interacting with
  three controls on each route.
- `npm test -- src/routes/BranchLab.test.ts src/routes/dedicatedCauseEffectPanels.test.ts src/data/healthDiseaseAssetWiring.test.ts src/data/cellBiologyAssetWiring.test.ts`: pass
- `npm test -- src/data/assetRealismTracker.test.ts src/data/cellBiologyAssetWiring.test.ts src/data/healthDiseaseAssetWiring.test.ts src/data/humanPhysiologyAssetWiring.test.ts src/routes/BranchLab.test.ts src/routes/dedicatedCauseEffectPanels.test.ts`: pass
- Browser checks for `/app/labs/branch/cell-biology`, `/app/labs/branch/health-and-disease`, and
  `/app/labs/branch/human-physiology`: pass after component selection plus Zoom In, Zoom Out, and
  Reset interactions; no horizontal overflow or fallback asset warnings on desktop/mobile.
