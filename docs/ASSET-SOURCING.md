# Quantaora Asset Sourcing

Purpose: track high-quality `.glb` or equivalent 3D assets needed to lift non-anatomy branches to
the Anatomy quality bar.

Last updated: 2026-09-03.

## Sourcing Principles

- Do not spend primary execution time replacing the current Anatomy organ assets; they are already
  the visual reference.
- Prioritize non-anatomy branches where a recognizable 3D object materially improves learning.
- Prefer permissive or commercially clear licenses.
- Record license, provenance, and risk before importing.
- For the current free explorer/prototype deployment, attribution-required and non-commercial assets may be used only when clearly marked `ATTRIB` or `NC-RISK`; keep them isolated from paid-release readiness claims.
- Reject assets that are visually unclear, too low-poly for inspection, badly scaled, or likely to
  clip on mobile.
- Keep procedural simulators where exact cause/effect matters more than realistic meshes.

## Priority Queue

| Priority | Subject | Branch | Asset need | Why it matters | Status |
| --- | --- | --- | --- | --- | --- |
| P0 | Biology | Cell Biology | Plant cell, bacteria, mitosis/cell division, organelles | Cell branch still lacks Anatomy-level recognizable component coverage | Needed |
| P0 | Chemistry | Molecules, Reactions, Stoichiometry, Organic Chemistry, Solutions, Acids/Bases, States Of Matter | Molecular structures, lab glassware, burner, beaker, reaction vessel, pH strips, phase-change apparatus | Chemistry now has broad live coverage; premium apparatus and molecule assets will lift the largest first-pass visual gap | Needed |
| P0 | Physics | Mechanics, Energy, Electricity, Waves, Sound, Fluids, Heat/Thermodynamics, Modern Physics | Ramp/cart, pulley, pendulum, spring, battery, bulb, speaker, wave tank, fluid tank, heat apparatus, photon/atom support props | Apparatus recognition helps kids connect abstract variables to visible experiments | Needed |
| P0 | Space | Solar System, Stars, Galaxies, Gravity/Orbits, Cosmology, Telescopes, Exploration | Planet surface variants, star lifecycle bodies, galaxy morphology references, telescope/probe/rover assets, orbit/gravity props | Space quality is strong where real GLBs exist; remaining procedural concepts need the same recognizable scale and object hierarchy | Needed |
| P1 | Biology | Plants, Microbiology, Ecology, Evolution, Animals, Neuroscience, Health/Disease, Biochemistry | Seedling stages, flower, leaf cross-section, bacteria/virus/fungus support, animal forms, neuron/synapse, immune/pathogen props, proteins/enzymes | Current procedural visuals work, but better assets can raise fidelity and reduce generic shapes | Needed |
| P2 | Math | Number, Geometry, Fractions, Data, Graphs, Trigonometry, Calculus | Base-ten blocks, beads, fraction tiles, 3D solids, graph surfaces, unit-circle props, area-under-curve solids | Procedural is usually strongest; source only manipulatives that improve clarity or tactile feel | Optional |

## Candidate Tracker

Use one row per candidate.

| Status | Subject | Branch/component | Asset | Source URL | License | File type | Quality fit | Risk | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Wired | Biology | Cell Biology / ribosome | `public/models/sourced/biology-cell/organelle-ribosome-80s-bychain-nih-optimized.glb` | https://3d.nih.gov/entries/3DPX-011099 | CC-BY 4.0 | `.glb` | Real 80S ribosome support asset | Attribution required; still needs child-readable recolor/cutaway | Wave 1 existing-assets-first upgrade |
| Wired | Biology | Cell Biology / cell wall | `public/models/cells/bacteria-wall-nih.glb` | https://3d.nih.gov/entries/3DPX-010752/2 | CC0 1.0 | `.glb` | Real cell-wall cross-section support asset | Not a whole plant wall scene | Wave 1 existing-assets-first upgrade |
| Wired | Biology | Health/Disease / pathogen | `public/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb` | https://3d.nih.gov/entries/3DPX-000030 | CC0 1.0 | `.glb` | Real influenza virion hero asset | No NORMAL accessor; verify app normal handling visually | Wave 1 existing-assets-first upgrade |
| Wired | Biology | Health/Disease / nutrition + epidemiology spread | `public/models/intestine.glb`, `public/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb` | Existing anatomy organ set + NIH 3D | REVIEW / CC0 1.0 | `.glb` | Nutrition now opens with recognizable intestine; spread now opens with real pathogen | Intestine is prototype-only REVIEW; spread still needs population/contact overlay | Existing-assets-first upgrade |
| Wired | Biology | Human Physiology / generic branch models | `public/models/biology/authored/bio-p1-*.glb` and physiology support copies | Project-authored | Project-owned | `.glb` | Registered support assets replace unresolved placeholder paths | Still authored/diagrammatic | Wave 1 resolves missing generic branch GLB paths, not final anatomy-level realism |
| Wired | Biology | Human Physiology / circulation + breathing + digestion + kidney + temperature | `public/models/heart.glb`, `public/models/lungs.glb`, `public/models/intestine.glb`, `public/models/kidneys.glb`, `public/models/brain.glb` | Existing anatomy organ set | REVIEW | `.glb` | Anatomy-quality prototype organ visuals | Replace before paid launch; provenance unresolved | Reused only because anatomy assets are current visual bar and no paid launch is planned |
| Wired | Biology | Neuroscience / neuron + synapse + reflex + brain regions + senses | `public/models/cells/neuron-authored.glb`, `public/models/brain.glb`, `public/models/eyeball.glb` | Project-authored + existing anatomy organ set | Project-owned / REVIEW | `.glb` | Stronger neuron/cell, brain, and eye visuals across all Neuroscience components | Brain/eye are prototype-only REVIEW; needs dedicated synapse/reflex overlays | Existing-assets-first upgrade |
| Wired | Biology/Chemistry | Biochemistry / protein + enzyme + ATP + phospholipid | `public/models/sourced/biochemistry-structure/*.glb` | RCSB PDB 1HHO/1LYZ and RCSB CCD ATP/PEF | CC0 1.0 | `.glb` | Real coordinate-derived protein/enzyme/ATP/phospholipid anchors | Support-tier; needs child-readable overlays, full bilayer, and before/after animations | Built by `npm run assets:build:rcsb-biochemistry` |
| Wired | Physics | Sound / vibration + pitch + volume + medium + echo | `public/models/physics/authored/physics-sound-apparatus-suite.glb` | Project-authored | Project-owned | `.glb` | Tuning fork, speaker driver, pressure waves, medium particles, ear/cochlea, echo wall | Support-tier vs photoreal anatomy bar | Built by `npm run assets:build:physics-realism`; sidecar provenance included |
| Wired | Physics | Fluids / pressure + buoyancy + density + flow | `public/models/physics/authored/physics-fluids-apparatus-suite.glb` | Project-authored | Project-owned | `.glb` | Pressure tank, gauges, buoyancy tank, density column, flow ramp, water/honey paths | Support-tier; needs higher-realism glass/water materials | Built by `npm run assets:build:physics-realism`; sidecar provenance included |
| Wired | Biology | Evolution / fossil evidence + ancestry + adaptation | `public/models/biology/authored/evolution-fossil-specimen-suite.glb` | Project-authored | Project-owned | `.glb` | Layered fossil slab with skull, spine, ribs, limb bones, footprints, ancestry fork, and trait markers | Support-tier; not Smithsonian photogrammetry | Built by `npm run assets:build:evolution-specimens`; sidecar provenance included |
| Wired | Biology | Animals / vertebrate vs invertebrate | `public/models/sourced/biology-animals/barramundi-fish-khronos.glb` | Khronos glTF Sample Assets | CC0 Public Domain | `.glb` | Real textured fish gives Animals a clearly readable vertebrate body-plan anchor | Support-tier; needs skeleton/internal anatomy overlays and companion invertebrate | Direct no-auth GitHub raw download, sidecar provenance included |
| Wired | Biology | Animals / vertebrate vs invertebrate | `public/models/sourced/biology-animals/mosquito-in-amber-khronos.glb` | Khronos glTF Sample Assets / Sketchfab source | CC-BY 4.0 | `.glb` | Real insect specimen in amber gives Animals a concrete invertebrate anchor | Attribution required; browser performance/framing review needed before flagship status | Direct no-auth GitHub raw download, sidecar provenance included |
| Staged | Biology | Animals / behavior | `public/models/sourced/biology-animals/fox-khronos.glb` | Khronos glTF Sample Assets | CC0 + CC-BY 4.0 | `.glb` | Animated fox with survey/walk/run cycles could improve behavior learning | Browser QA showed clipping; not wired until animation-root/fitting pass | Direct no-auth GitHub raw download, sidecar provenance included |
| Wired | Biology | Evolution / fossil evidence | `public/models/sourced/biology-evolution/scattering-skull-khronos.glb` | Khronos glTF Sample Assets | CC0 Public Domain | `.glb` | Real skull/bone specimen gives fossil evidence a recognizable inspectable structure | Support-tier; not a fossil sequence or Smithsonian scan | Direct no-auth GitHub raw download, sidecar provenance included |
| Wired | Physics | Sound / volume speaker source | `public/models/sourced/physics-sound/boombox-speaker-khronos.glb` | Khronos glTF Sample Models | CC0 Public Domain | `.glb` | Real textured speaker/boombox replaces symbolic-only volume source | Support-tier; still needs wave/ear pairing for flagship sound lesson | Direct no-auth GitHub raw download, sidecar provenance included |
| Ready | Biology | Animals / vertebrate + adaptation | `public/models/sourced/biology-animals/*.glb` | Smithsonian Sketchfab API | CC0 Public Domain | `.glb` | Real animal body-plan specimens | Requires `SKETCHFAB_TOKEN`; optimize after import | Manifest: `docs/assets/biology-animals-sourcing-candidates.json` |
| Ready | Biology | Evolution / fossil evidence + ancestry + adaptation | `public/models/sourced/biology-evolution/*.glb` | Smithsonian Sketchfab API | CC0 Public Domain | `.glb` | Real fossil/specimen anchors for deep-time evidence | Requires `SKETCHFAB_TOKEN`; optimize after import | Manifest: `docs/assets/biology-evolution-sourcing-candidates.json` |
| Review | Physics | Sound / photoreal speaker + ear upgrade | `public/models/sourced/physics-sound/*.glb` | Sketchfab API | CC Attribution | `.glb` | Higher-realism tuning fork, speaker, and ear candidates | Requires attribution review, `SKETCHFAB_TOKEN`, and visual QA | Manifest: `docs/assets/physics-sound-sourcing-candidates.json` |
| Review | Physics | Fluids / premium glassware upgrade | `public/models/sourced/physics-fluids/*.glb` | Sketchfab API | CC Attribution | `.glb` | Beaker, cylinders, and glassware candidates | Requires attribution review, `SKETCHFAB_TOKEN`, and transparent-material QA | Manifest: `docs/assets/physics-fluids-sourcing-candidates.json` |
| Review | Physics | Heat/Thermo / temperature + heat transfer | `public/models/sourced/physics-heat-and-thermodynamics/*.glb` | Sketchfab API | CC Attribution | `.glb` | Thermometer, burner, and hot-plate candidates | Requires attribution review; hot plate is blocked until optimized | Manifest: `docs/assets/physics-heat-thermodynamics-sourcing-candidates.json` |
| Review | Biology | Biochemistry Foundations / protein + enzyme + ATP + membrane | `public/models/sourced/biology-biochemistry-foundations/*.glb` | Sketchfab API | CC Attribution | `.glb` | Molecular structure candidates | Requires attribution review; heavy structures need optimization/recolor | Manifest: `docs/assets/biology-biochemistry-foundations-sourcing-candidates.json` |
| Needed | Biology | Cell Biology / plant cell | TBD | TBD | TBD | `.glb` preferred | Must support inspectable organelles | Unknown | Start here before importing |
| Needed | Biology | Cell Biology / mitosis | TBD | TBD | TBD | `.glb` or procedural sequence | Must show stages clearly | Unknown | Could be procedural first |
| Needed | Chemistry | Reactions / glassware | TBD | TBD | TBD | `.glb` | Recognizable lab bench apparatus | Unknown | Do not let mesh replace reaction logic |
| Needed | Chemistry | Organic Chemistry / molecule kit | TBD | TBD | TBD | `.glb` or generated molecular mesh | Must clearly show carbon skeletons, functional groups, and bonds | Unknown | Candidate source should support exact attribution and formula mapping |
| Needed | Chemistry | Acids/Bases + Solutions / bench props | TBD | TBD | TBD | `.glb` | pH strip, dropper, beakers, solute/solvent containers should read instantly | Unknown | Behavior remains procedural; assets are context props |
| Needed | Physics | Mechanics / apparatus | TBD | TBD | TBD | `.glb` | Ramp/cart/pulley/pendulum should read instantly | Unknown | Keep equations procedural |
| Needed | Physics | Waves/Sound/Fluids/Heat / apparatus | TBD | TBD | TBD | `.glb` | Wave tank, speaker, fluid tank, thermometer/heater props | Unknown | Prioritize props that make variable changes visible |
| Needed | Space | Stars / lifecycle | TBD | TBD | TBD | `.glb` or shader/procedural | Must show red giant, white dwarf, nebula ideas | Unknown | Procedural may be stronger |
| Needed | Space | Telescopes/Exploration / instruments | TBD | TBD | TBD | `.glb` | Rover, probe, telescope, and observatory assets must frame cleanly on mobile | Unknown | Some real GLBs are already wired; source only missing/weak items |
| Needed | Biology | Evolution/Animals/Health/Neuroscience / support models | TBD | TBD | TBD | `.glb` or precise procedural | Must be recognizable without becoming decorative | Unknown | Prioritize neuron/synapse, immune cell/pathogen, animal body-form assets |

## Biology Animals - First Vetted Candidate Set

Detailed manifest: `docs/assets/biology-animals-sourcing-candidates.json`.

Importer dry run:

```bash
cd quantaora-app
npm run assets:import:sketchfab -- --candidate smithsonian-diodon-hystrix --dry-run
```

Authenticated import command shape:

```bash
cd quantaora-app
SKETCHFAB_TOKEN=<token> npm run assets:import:sketchfab -- --candidate smithsonian-diodon-hystrix
```

Current vetted candidates are all Smithsonian / Sketchfab API records with `CC0 Public Domain`
metadata and `downloadable: true` confirmed through the public API. Download bytes still require a
Sketchfab API token, so these are not yet staged in `public/models/`.

| Candidate | Target components | License | Face count | Status |
| --- | --- | --- | ---: | --- |
| Diodon hystrix | Vertebrate/Invertebrate; Habitat Adaptation | CC0 Public Domain | 100000 | Ready for authenticated download |
| Geochelone carbonaria | Vertebrate/Invertebrate; Habitat Adaptation | CC0 Public Domain | 99992 | Ready for authenticated download |
| Nothrotheriops Shastensis | Vertebrate/Invertebrate; Life Cycle | CC0 Public Domain | 150000 | Ready for authenticated download; optimize after import |
| Triceratops Horridus Marsh | Vertebrate/Invertebrate; Habitat Adaptation | CC0 Public Domain | 149998 | Ready for authenticated download; optimize after import |
| Mammuthus primigenius (Blumbach) | Vertebrate/Invertebrate; Life Cycle | CC0 Public Domain | 149999 | Ready for authenticated download; optimize after import |

Rejected candidate:

| Candidate | License | Reason |
| --- | --- | --- |
| Blue whale skeleton | CC Attribution-NonCommercial-ShareAlike | Non-commercial; reject for paid/future commercial product |

## Biology Evolution - First Vetted Candidate Set

Detailed manifest: `docs/assets/biology-evolution-sourcing-candidates.json`.

Importer dry run:

```bash
cd quantaora-app
npm run assets:import:sketchfab -- --manifest ../docs/assets/biology-evolution-sourcing-candidates.json --candidate smithsonian-triceratops-horridus --dry-run
```

Authenticated import command shape:

```bash
cd quantaora-app
SKETCHFAB_TOKEN=<token> npm run assets:import:sketchfab -- --manifest ../docs/assets/biology-evolution-sourcing-candidates.json --candidate smithsonian-triceratops-horridus
```

Current vetted candidates are Smithsonian / Sketchfab API records with `CC0 Public Domain`
metadata. Dry-run validation confirms license labels through the live public model API. Download
bytes still require a Sketchfab API token, so these are not yet staged in `public/models/`.

| Candidate | Target components | License | Face count | Status |
| --- | --- | --- | ---: | --- |
| Nothrotheriops Shastensis | Fossil Evidence; Common Ancestry; Adaptation | CC0 Public Domain | 150000 | Ready for authenticated download; optimize after import |
| Triceratops Horridus Marsh | Fossil Evidence; Common Ancestry; Adaptation | CC0 Public Domain | 149998 | Ready for authenticated download; optimize after import |
| Mammuthus primigenius (Blumbach) | Fossil Evidence; Common Ancestry; Variation | CC0 Public Domain | 149999 | Ready for authenticated download; optimize after import |
| Diodon hystrix | Adaptation; Common Ancestry | CC0 Public Domain | 100000 | Ready for authenticated download |
| Geochelone carbonaria | Adaptation; Common Ancestry | CC0 Public Domain | 99992 | Ready for authenticated download |

Rejected candidate:

| Candidate | License | Reason |
| --- | --- | --- |
| Blue whale skeleton | CC Attribution-NonCommercial-ShareAlike | Non-commercial; reject for paid/future commercial product |

## Physics And Biochemistry - Attribution Review Candidate Sets

These manifests are not treated as fully cleared imports yet because their best candidates are
`CC Attribution`, not CC0. They are still useful because they move the remaining P1 branches from
open-ended sourcing into a concrete import/review queue.

Dry-run commands:

```bash
cd quantaora-app
npm run assets:import:sketchfab -- --manifest ../docs/assets/physics-sound-sourcing-candidates.json --candidate brikk-resonant-tuning-fork --allow-attrib --dry-run
npm run assets:import:sketchfab -- --manifest ../docs/assets/physics-fluids-sourcing-candidates.json --candidate cesar-seidel-graduated-cylinders --allow-attrib --dry-run
npm run assets:import:sketchfab -- --manifest ../docs/assets/physics-heat-thermodynamics-sourcing-candidates.json --candidate medical-gallery-thermometer --allow-attrib --dry-run
npm run assets:import:sketchfab -- --manifest ../docs/assets/biology-biochemistry-foundations-sourcing-candidates.json --candidate mc-triose-phosphate-isomerase-1tim --allow-attrib --dry-run
```

Authenticated import command shape:

```bash
cd quantaora-app
SKETCHFAB_TOKEN=<token> npm run assets:import:sketchfab -- --manifest ../docs/assets/physics-sound-sourcing-candidates.json --candidate brikk-resonant-tuning-fork --allow-attrib
```

Review rule before wiring: attribution copy must be added to `docs/ASSET-LICENSES.md`, the sidecar
must be checked, the model must be optimized if needed, and desktop/mobile screenshots must show no
clipping.

## Acceptance Checklist Before Import

- License is compatible with the intended release.
- Source URL and author are recorded.
- Asset is inspectable at mobile size.
- Asset can be framed without clipping.
- File size is reasonable for web delivery.
- Material colors work with the app palette.
- It has either meaningful geometry or useful embedded animation.
- It maps to a real component or branch, not decoration.

## Import Notes

- Register imported assets in the existing asset manifest/check flow.
- Add a screenshot after import.
- Run `npm run assets:check`.
- If an asset is uncertain, mark it REVIEW and keep it out of paid-release mode until cleared.
