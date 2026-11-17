import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import {
  childSafeAssetNote,
  resolveBranchAssetPresentation,
} from './branchLabAssetPresentation.ts'
// Relative (not `@/...`) import: this file is type-checked and run outside
// Vite (tsconfig.test.json, `node --test`), which doesn't have the app's
// `@/` bundler path alias wired up.
import type { AssetResolution } from '../data/modelRegistry.ts'
import {
  branchCameraConfig,
  DEFAULT_BRANCH_CAMERA,
} from './branchLabCamera.ts'
// Reachability check below needs the same two sources branchModules.ts
// merges into BRANCH_COMPONENTS['human-anatomy'] (organs.ts + the codegen'd
// generated/human_anatomy.ts). Importing branchModules.ts itself isn't safe
// here: its own internal imports (e.g. `from './organs'`) omit extensions,
// which node's native TS loader/`node --test` (unlike Vite) cannot resolve —
// out of scope to change (branchModules.ts is outside this task's ownership).
import { organs } from '../data/organs.ts'
import { human_anatomy as human_anatomy_generated } from '../data/generated/human_anatomy.ts'

const branchLabSource = readFileSync(new URL('./BranchLab.tsx', import.meta.url), 'utf8')
const sharedPanelSource = readFileSync(new URL('../components/labs/BranchCauseEffectPanel.tsx', import.meta.url), 'utf8')
const sharedConfigSource = readFileSync(new URL('../data/branchCauseEffectConfigs.ts', import.meta.url), 'utf8')
const bespokePanelSource = readFileSync(new URL('../components/labs/BranchBespokeCauseEffectPanels.tsx', import.meta.url), 'utf8')
const genericViewerSource = readFileSync(new URL('../components/explorer/GenericViewer.tsx', import.meta.url), 'utf8')

// Pure-logic tests for BranchLab's REVIEW/missing/CLEAR fallback handling
// (Task: registry- and BranchLab-focused test coverage). Run with:
//   node --test src/routes/BranchLab.test.ts
// No test framework/dependency is required — Node's built-in test runner
// (node:test) plus native TS type-stripping cover this without touching
// package.json, which is outside this file's ownership scope.

const CLEAR_ASSET: AssetResolution = {
  requestedModel: '/models/chemistry/atoms-and-elements/atom.glb',
  status: 'ready',
  resolvedUrl: '/models/chemistry/atoms-and-elements/atom.glb',
  asset: {
    url: '/models/chemistry/atoms-and-elements/atom.glb',
    subject: 'chemistry',
    branch: 'atoms-and-elements',
    componentIds: ['atom'],
    sourceName: 'Quantaora authored GLB',
    license: 'Project-owned authored asset',
    licenseStatus: 'CLEAR',
    qualityTier: 'hero',
    notes: 'test fixture',
  },
}

const HUMAN_ANATOMY_REVIEW_ASSET: AssetResolution = {
  requestedModel: '/models/heart.glb',
  status: 'ready',
  resolvedUrl: '/models/heart.glb',
  asset: {
    url: '/models/heart.glb',
    subject: 'biology',
    branch: 'human-anatomy',
    componentIds: ['heart'],
    sourceName: 'Sourced anatomy asset set',
    license: 'Provenance recorded outside this repo',
    licenseStatus: 'REVIEW',
    qualityTier: 'hero',
    notes: 'test fixture',
    replaceBeforePaidLaunch: true,
  },
}

const GENERIC_REVIEW_ASSET: AssetResolution = {
  requestedModel: '/models/biology/authored/biology-animal-mammal.glb',
  status: 'ready',
  resolvedUrl: '/models/biology/authored/biology-animal-mammal.glb',
  asset: {
    url: '/models/biology/authored/biology-animal-mammal.glb',
    subject: 'biology',
    branch: 'animals',
    componentIds: ['mammal'],
    sourceName: 'Review fixture',
    license: 'Provenance recorded outside this repo',
    licenseStatus: 'REVIEW',
    qualityTier: 'hero',
    notes: 'test fixture',
    replaceBeforePaidLaunch: true,
  },
}

const MISSING_ASSET: AssetResolution = {
  requestedModel: '/models/does-not-exist.glb',
  status: 'missing',
}

const INTERNAL_LANGUAGE = [
  'REVIEW',
  'licence',
  'license',
  'pending legal',
  'sourcing incomplete',
  'NC-RISK',
  'clearance',
]

function assertNoInternalLanguageLeak(note: string | undefined) {
  assert.ok(note, 'expected a user-facing fallback note to be present')
  for (const banned of INTERNAL_LANGUAGE) {
    assert.ok(
      !note!.toLowerCase().includes(banned.toLowerCase()),
      `fallback note leaked internal vocabulary "${banned}": "${note}"`,
    )
  }
}

test('CLEAR asset on a generic branch: model renders, no fallback note shown', () => {
  const { modelUrl, footerNote } = resolveBranchAssetPresentation(CLEAR_ASSET)
  assert.equal(modelUrl, CLEAR_ASSET.resolvedUrl)
  assert.equal(footerNote, undefined)
})

test('REVIEW asset on a generic branch: falls back honestly, never shows the REVIEW GLB', () => {
  const { modelUrl, footerNote } = resolveBranchAssetPresentation(GENERIC_REVIEW_ASSET)
  // Must not silently render the REVIEW-status GLB as if it were cleared.
  assert.equal(modelUrl, undefined)
  // Must show a positive, honest, user-facing note...
  assertNoInternalLanguageLeak(footerNote)
  // ...and it must be the same purpose-built illustration copy used for a
  // fully-missing asset, not a distinct "there's a problem" message that
  // would itself hint at legal/sourcing trouble to a child.
  assert.equal(footerNote, childSafeAssetNote(MISSING_ASSET, false))
})

test('REVIEW asset on the human-anatomy branch renders the prototype organ GLB', () => {
  // Human Anatomy's organ GLBs are the current visual quality bar and are
  // intentionally visible in this non-paid prototype route. Paid-launch
  // provenance is still tracked separately; other REVIEW assets still fall
  // back above.
  const { modelUrl, footerNote } = resolveBranchAssetPresentation(HUMAN_ANATOMY_REVIEW_ASSET)
  assert.equal(modelUrl, HUMAN_ANATOMY_REVIEW_ASSET.resolvedUrl)
  assert.equal(footerNote, undefined)
})

test('missing asset (no registry entry at all): falls back honestly with the same illustrated-model copy', () => {
  const { modelUrl, footerNote } = resolveBranchAssetPresentation(MISSING_ASSET)
  assert.equal(modelUrl, undefined)
  assertNoInternalLanguageLeak(footerNote)
})

test('undefined asset resolution (component itself unresolved): no model, no footer note to show', () => {
  const { modelUrl, footerNote } = resolveBranchAssetPresentation(undefined)
  assert.equal(modelUrl, undefined)
  assert.equal(footerNote, undefined)
})

test('human-anatomy branch: all 18 authored components remain reachable from the branch route', () => {
  // The presentation decision (which model URL to render for the active
  // component) must not shrink the set of
  // components BranchLab's nav/switcher lists. branchModules.ts merges
  // organs.ts's 9 hand-tuned entries (id wins on collision) with the
  // codegen'd module's entries for the other authored directories — mirrored
  // here (not imported: branchModules.ts's own extensionless internal
  // imports aren't resolvable by node --test's native TS loader).
  assert.equal(human_anatomy_generated.length, 16, 'expected 16 authored human-anatomy content directories')
  assert.equal(organs.length, 9, 'expected 9 hand-tuned flagship organs')
  const organIds = new Set(organs.map((o) => o.id))
  const merged = [...organs, ...human_anatomy_generated.filter((c) => !organIds.has(c.id))]
  // Every one of the 16 authored directories is represented in the merged,
  // reachable set — either directly (codegen'd entry) or via its
  // organs.ts hand-tuned duplicate sharing the same id.
  assert.equal(merged.length, 18, 'expected all authored content reachable with no id collisions dropped')
  assert.equal(new Set(merged.map((c) => c.id)).size, 18)
})

test('human-anatomy flagship organ model files exist in public/models', () => {
  for (const organ of organs) {
    assert.ok(
      existsSync(new URL(`../../public${organ.model}`, import.meta.url)),
      `expected ${organ.name} GLB at ${organ.model}`,
    )
  }
})

test('human-anatomy generated components never point at nonexistent asset pipeline GLBs', () => {
  for (const component of human_anatomy_generated) {
    assert.doesNotMatch(
      component.model,
      /^\/assets\/models\/biology\/human-anatomy\/.*\.glb$/,
      `${component.id} points at a planned asset path that is not shipped by Vercel`,
    )

    if (component.model.endsWith('.glb')) {
      assert.ok(
        existsSync(new URL(`../../public${component.model}`, import.meta.url)),
        `expected generated anatomy GLB to exist in public: ${component.id} -> ${component.model}`,
      )
    }
  }
})

test('wide space GLBs start farther back than the generic BranchLab camera', () => {
  for (const componentId of [
    'space-exploration-perseverance-rover',
    'space-telescope-hubble',
    'space-telescope-jwst',
    'space-observatory-chandra',
    'physics-heat-temperature',
    'physics-heat-conduction',
    'physics-heat-convection',
    'physics-heat-radiation',
    'physics-heat-phase-change',
    'chem-organic-hydrocarbon',
    'bacterial-cell',
    'cell-wall',
    'golgi-apparatus',
    'ribosome',
    'biology-health-pathogen',
    'biology-health-immune-response',
    'biology-health-vaccine',
    'biology-animals-vertebrate',
    'biology-animals-behavior',
    'physics-sound-vibration',
    'physics-sound-pitch',
    'physics-sound-volume',
    'physics-sound-medium',
    'physics-sound-echo',
    'physics-fluids-pressure',
    'physics-fluids-buoyancy',
    'physics-fluids-density',
    'physics-fluids-flow-viscosity',
    'biology-biochemistry-protein',
    'biology-biochemistry-enzyme',
    'biology-biochemistry-carbohydrate',
    'biology-biochemistry-lipid',
    'biology-biochemistry-atp-cellular-energy',
    'chem-biolink-protein-folding',
    'chem-biolink-enzyme-substrate',
    'chem-biolink-carbohydrate',
    'chem-biolink-lipid-membrane',
    'blood-circulation',
    'breathing',
    'digestion',
    'kidney-filtration',
    'temperature-regulation',
    'biology-neuroscience-neuron',
    'biology-neuroscience-synapse',
    'biology-neuroscience-brain-regions',
  ]) {
    const config = branchCameraConfig(componentId)
    assert.ok(
      config.defaultDistance > DEFAULT_BRANCH_CAMERA.defaultDistance,
      `${componentId} should not use the clipped generic camera distance`,
    )
    assert.ok(
      config.maxDistance >= config.defaultDistance,
      `${componentId} default camera distance must stay inside its zoom range`,
    )
  }
})

test('BranchLab passes per-component zoom bounds into GenericViewer', () => {
  assert.match(branchLabSource, /minCameraDistance=\{activeCameraConfig\.minDistance\}/)
  assert.match(branchLabSource, /maxCameraDistance=\{activeCameraConfig\.maxDistance\}/)
  assert.match(genericViewerSource, /minDistance=\{minCameraDistance\}/)
  assert.match(genericViewerSource, /maxDistance=\{maxCameraDistance\}/)
  assert.match(genericViewerSource, /camera\.position\.set\(0, 0\.35, distance\)/)
  assert.match(genericViewerSource, /camera\.lookAt\(0, 0, 0\)/)
})

test('GenericModel has asset-specific fit rules for large biology realism upgrades', () => {
  assert.match(genericViewerSource, /branch=\{branch\}/)
  assert.match(genericViewerSource, /minDistance=\{minCameraDistance\}/)
  assert.match(genericViewerSource, /maxDistance=\{maxCameraDistance\}/)
  assert.match(
    readFileSync(new URL('../components/explorer/GenericModel.tsx', import.meta.url), 'utf8'),
    /organelle-ribosome[\s\S]+virus-influenza[\s\S]+branch === 'human-physiology'/,
  )
})

test('sound branch has a real cause/effect control panel, not only generic model controls', () => {
  assert.match(bespokePanelSource, /export function SoundCauseEffectPanel/)
  assert.match(bespokePanelSource, /data-sound-cause-effect/)
  assert.match(branchLabSource, /branch\.id === 'sound'/)

  for (const learnerControl of ['Frequency', 'Amplitude', 'Listener distance', 'Reflecting wall', 'Medium']) {
    assert.match(bespokePanelSource, new RegExp(learnerControl), `expected Sound control: ${learnerControl}`)
  }

  for (const evidenceText of ['Wavelength', 'one cycle takes', 'Relative loudness', 'Echo returns', 'vacuum']) {
    assert.match(bespokePanelSource, new RegExp(evidenceText, 'i'), `expected Sound evidence text: ${evidenceText}`)
  }

  assert.match(bespokePanelSource, /DEFAULT_SOUND_CONTROLS/)
  assert.match(branchLabSource, /soundControls/)
  assert.match(branchLabSource, /branch\.id === 'sound'\s*\?\s*\{ soundControls \}/)
})

test('fluids branch has pressure, buoyancy, and flow controls with saved state', () => {
  assert.match(bespokePanelSource, /export function FluidsCauseEffectPanel/)
  assert.match(bespokePanelSource, /data-fluids-cause-effect/)
  assert.match(branchLabSource, /branch\.id === 'fluids'/)

  for (const learnerControl of ['Depth', 'Fluid density', 'Object mass', 'Object volume', 'Viscosity', 'Tube width', 'Temperature']) {
    assert.match(bespokePanelSource, new RegExp(learnerControl), `expected Fluids control: ${learnerControl}`)
  }

  for (const evidenceText of ['Pressure is about', 'Buoyancy is', 'weight is', 'Flow score', 'floats', 'sinks']) {
    assert.match(bespokePanelSource, new RegExp(evidenceText, 'i'), `expected Fluids evidence text: ${evidenceText}`)
  }

  assert.match(bespokePanelSource, /DEFAULT_FLUID_CONTROLS/)
  assert.match(branchLabSource, /fluidControls/)
  assert.match(branchLabSource, /branch\.id === 'fluids'\s*\?\s*\{ fluidControls \}/)
})

test('heat and thermodynamics branch has transfer controls with saved state', () => {
  assert.match(bespokePanelSource, /export function HeatCauseEffectPanel/)
  assert.match(bespokePanelSource, /data-heat-cause-effect/)
  assert.match(branchLabSource, /branch\.id === 'heat-and-thermodynamics'/)

  for (const learnerControl of [
    'Heat source temperature',
    'Object temperature',
    'Material type',
    'Insulation level',
    'Particle motion',
    'Time exposed',
    'Transfer mode',
  ]) {
    assert.match(bespokePanelSource, new RegExp(learnerControl), `expected Heat control: ${learnerControl}`)
  }

  for (const evidenceText of [
    'Heat flow direction',
    'Estimated temperature change',
    'Particle speed change',
    'Copper is fastest',
    'air is slowest',
    'Insulation blocks',
  ]) {
    assert.match(bespokePanelSource, new RegExp(evidenceText, 'i'), `expected Heat evidence text: ${evidenceText}`)
  }

  assert.match(bespokePanelSource, /DEFAULT_HEAT_CONTROLS/)
  assert.match(branchLabSource, /heatControls/)
  assert.match(branchLabSource, /branch\.id === 'heat-and-thermodynamics'\s*\?\s*\{ heatControls \}/)
})

test('health and disease branch has exposure, prevention, and recovery controls with saved state', () => {
  assert.match(bespokePanelSource, /export function HealthCauseEffectPanel/)
  assert.match(bespokePanelSource, /data-health-cause-effect/)
  assert.match(branchLabSource, /branch\.id === 'health-and-disease'/)

  for (const learnerControl of [
    'Pathogen amount',
    'Immune response strength',
    'Time since infection',
    'Vaccine readiness',
    'Spread contact rate',
    'Recovery support',
  ]) {
    assert.match(bespokePanelSource, new RegExp(learnerControl), `expected Health control: ${learnerControl}`)
  }

  for (const evidenceText of [
    'Infection pressure',
    'Immune advantage',
    'symptom risk',
    'Antibody readiness',
    'contact rate',
  ]) {
    assert.match(bespokePanelSource, new RegExp(evidenceText, 'i'), `expected Health evidence text: ${evidenceText}`)
  }

  assert.match(bespokePanelSource, /DEFAULT_HEALTH_CONTROLS/)
  assert.match(branchLabSource, /healthControls/)
  assert.match(branchLabSource, /branch\.id === 'health-and-disease'\s*\?\s*\{ healthControls \}/)
})

test('neuroscience branch has signal path controls with saved state', () => {
  assert.match(bespokePanelSource, /export function NeuroCauseEffectPanel/)
  assert.match(bespokePanelSource, /data-neuro-cause-effect/)
  assert.match(branchLabSource, /branch\.id === 'neuroscience'/)

  for (const learnerControl of [
    'Signal strength',
    'Myelin level',
    'Synapse gap',
    'Neurotransmitter amount',
    'Stimulus frequency',
    'Fatigue rest level',
  ]) {
    assert.match(bespokePanelSource, new RegExp(learnerControl), `expected Neuro control: ${learnerControl}`)
  }

  for (const evidenceText of [
    'Signal speed',
    'Chance of crossing synapse',
    'reaction delay',
    'More myelin',
    'Fatigue load',
    'Cause map',
    'likely to fade at the synapse',
  ]) {
    assert.match(bespokePanelSource, new RegExp(evidenceText, 'i'), `expected Neuro evidence text: ${evidenceText}`)
  }

  assert.match(bespokePanelSource, /DEFAULT_NEURO_CONTROLS/)
  assert.match(branchLabSource, /neuroControls/)
  assert.match(branchLabSource, /branch\.id === 'neuroscience'\s*\?\s*\{ neuroControls \}/)
})

test('biochemistry foundations branch has molecular condition controls with saved state', () => {
  assert.match(bespokePanelSource, /export function BiochemCauseEffectPanel/)
  assert.match(bespokePanelSource, /data-biochem-cause-effect/)
  assert.match(bespokePanelSource, /aria-label=\{label\}/)
  assert.match(bespokePanelSource, /aria-label=\{`Decrease \$\{label\}`\}/)
  assert.match(bespokePanelSource, /aria-label=\{`Increase \$\{label\}`\}/)
  assert.match(bespokePanelSource, /event\.preventDefault\(\)/)
  assert.match(branchLabSource, /branch\.id === 'biochemistry-foundations'/)

  for (const learnerControl of [
    'Temperature',
    'pH',
    'Substrate amount',
    'Enzyme shape fit',
    'Concentration',
    'Membrane permeability or folding stress',
  ]) {
    assert.match(bespokePanelSource, new RegExp(learnerControl), `expected Biochem control: ${learnerControl}`)
  }

  for (const evidenceText of [
    'Reaction rate',
    'Enzyme fit',
    'product output',
    'Denaturation or folding risk',
    'Membrane permeability',
    'Cause map',
    'main limiting factor',
    'Active-site evidence',
    'Membrane evidence',
  ]) {
    assert.match(bespokePanelSource, new RegExp(evidenceText, 'i'), `expected Biochem evidence text: ${evidenceText}`)
  }

  assert.match(bespokePanelSource, /DEFAULT_BIOCHEM_CONTROLS/)
  assert.match(branchLabSource, /biochemControls/)
  assert.match(branchLabSource, /branch\.id === 'biochemistry-foundations'\s*\?\s*\{ biochemControls \}/)
})

test('BranchLab has a reusable data-driven BranchCauseEffectPanel system', () => {
  assert.match(sharedPanelSource, /interface BranchCauseEffectConfig/)
  assert.match(sharedPanelSource, /export function BranchCauseEffectPanel/)
  assert.match(sharedConfigSource, /BRANCH_CAUSE_EFFECT_CONFIGS/)
  assert.match(sharedPanelSource, /data-branch-cause-effect/)
  assert.match(branchLabSource, /@\/components\/labs\/BranchCauseEffectPanel/)
  assert.match(branchLabSource, /@\/data\/branchCauseEffectConfigs/)
  assert.match(branchLabSource, /renderConfigDrivenPanel/)
})

test('config-driven remaining P1 branches have cause/effect controls and saved state', () => {
  const expected = [
    {
      branchId: 'cell-biology',
      dataAttribute: 'data-cell-cause-effect',
      stateName: 'cellControls',
      controls: ['Growth resources', 'Membrane permeability', 'Oxygen supply', 'Waste buildup', 'Division signal', 'Organelle energy'],
      results: ['Cell growth readiness', 'Transport balance'],
    },
    {
      branchId: 'evolution',
      dataAttribute: 'data-evolution-cause-effect',
      stateName: 'evolutionControls',
      controls: ['Trait variation', 'Inheritance strength', 'Selection pressure', 'Generation count', 'Environment change', 'Population size'],
      results: ['Adaptation shift', 'Diversity remaining'],
    },
    {
      branchId: 'animals',
      dataAttribute: 'data-animals-cause-effect',
      stateName: 'animalsControls',
      controls: ['Body plan fit', 'Habitat match', 'Food energy', 'Movement ability', 'Predator pressure', 'Life cycle stage'],
      results: ['Survival fit', 'Adaptation pressure'],
    },
    {
      branchId: 'biochemistry-links',
      dataAttribute: 'data-biochem-links-cause-effect',
      stateName: 'biochemLinksControls',
      controls: ['Temperature', 'pH', 'Substrate amount', 'Active site match', 'Water exposure', 'Membrane permeability'],
      results: ['Molecule function fit', 'Membrane barrier effect'],
    },
    {
      branchId: 'human-physiology',
      dataAttribute: 'data-physiology-cause-effect',
      stateName: 'physiologyControls',
      controls: ['Activity level', 'Heart rate', 'Breathing rate', 'Oxygen demand', 'Hydration', 'Nerve signal'],
      results: ['Oxygen delivery balance', 'Homeostasis strain'],
    },
  ]

  for (const branch of expected) {
    assert.match(branchLabSource, new RegExp(`branch\\.id === '${branch.branchId}'`), `expected render gate for ${branch.branchId}`)
    assert.match(sharedConfigSource, new RegExp(branch.dataAttribute), `expected data attribute for ${branch.branchId}`)
    assert.match(branchLabSource, new RegExp(branch.stateName), `expected state for ${branch.branchId}`)
    assert.match(branchLabSource, new RegExp(`\\? \\{ ${branch.stateName} \\}`), `expected saved labState for ${branch.branchId}`)

    for (const control of branch.controls) {
      assert.match(sharedConfigSource, new RegExp(control), `expected control ${control} for ${branch.branchId}`)
    }
    for (const result of branch.results) {
      assert.match(sharedConfigSource, new RegExp(result), `expected result ${result} for ${branch.branchId}`)
    }
  }
})

test('config-driven P1 panels use real component ids for selected-topic guidance', () => {
  for (const componentId of [
    'biology-evolution-variation',
    'biology-evolution-common-ancestry',
    'biology-animals-vertebrate',
    'biology-animals-body-systems',
    'hormone-signaling',
    'immune-response',
    'muscle-contraction',
  ]) {
    assert.match(sharedConfigSource, new RegExp(`['"]${componentId}['"]`), `expected real component id ${componentId}`)
  }

  for (const staleId of [
    'biology-evolution-common-ancestor',
    'biology-evolution-speciation',
    'biology-animals-vertebrate-invertebrate',
    'biology-animals-food-web-role',
  ]) {
    assert.doesNotMatch(sharedConfigSource, new RegExp(staleId), `stale component id should not remain: ${staleId}`)
  }
})

test('animals and evolution panels expose visual evidence beyond numeric scores', () => {
  assert.match(sharedPanelSource, /What changes on the model/)
  assert.match(sharedPanelSource, /computed\.evidence/)
  assert.match(sharedPanelSource, /Cause map/)
  assert.match(sharedPanelSource, /computed\.causeMap/)
  assert.match(sharedPanelSource, /Input changed/)
  assert.match(sharedPanelSource, /System response/)
  assert.match(sharedPanelSource, /Observable result/)

  for (const evidenceText of [
    'Before selection',
    'After generations',
    'Body plan evidence',
    'Habitat pressure',
    'Life stage needs',
    'Energy budget',
  ]) {
    assert.match(sharedConfigSource, new RegExp(evidenceText), `expected evidence text: ${evidenceText}`)
  }
})

test('shared P1 cause/effect panels explain mechanisms with branch-specific evidence', () => {
  for (const evidenceText of [
    'Membrane gate',
    'Organelle workload',
    'Division checkpoint',
    'Stress evidence',
    'Shape stability',
    'Active-site test',
    'Membrane crossing',
    'Bottleneck',
    'Heart-lung coupling',
    'Oxygen debt',
    'Hydration effect',
    'Recovery readiness',
  ]) {
    assert.match(sharedConfigSource, new RegExp(evidenceText), `expected branch-specific evidence text: ${evidenceText}`)
  }

  for (const causeText of [
    'division can proceed',
    'Trait frequency should visibly shift',
    'Body plan and movement trade energy',
    'reaction/function fit',
    'Heart, lungs, nerves, and kidneys coordinate supply',
  ]) {
    assert.match(sharedConfigSource, new RegExp(causeText, 'i'), `expected cause map text: ${causeText}`)
  }
})

test('shared cause/effect controls expose stepper buttons and range labels', () => {
  assert.match(sharedPanelSource, /aria-label=\{`Decrease \$\{label\}`\}/)
  assert.match(sharedPanelSource, /aria-label=\{`Increase \$\{label\}`\}/)
  assert.match(sharedPanelSource, /aria-label=\{label\}/)
  assert.match(sharedPanelSource, /onClick=\{\(\) => applyDelta\(/)
  assert.match(sharedPanelSource, /disabled=\{value <= min\}/)
  assert.match(sharedPanelSource, /disabled=\{value >= max\}/)
  assert.match(sharedPanelSource, /accent=\{config\.accent\}/)
  assert.match(sharedPanelSource, /accentColor: accent/)
})
