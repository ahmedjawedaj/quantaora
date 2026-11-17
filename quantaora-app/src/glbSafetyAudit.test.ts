import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Whole-codebase regression guard: every GLB (.glb/.gltf) consumer found under src/ (searched via
// `grep -rl "useGLTF(" src` plus a broader `.glb`/`GLTFLoader` sweep at the start of this wave)
// must either be wrapped in a local `GlbErrorBoundary`-style class component (implementing
// `static getDerivedStateFromError`) around the JSX that renders the `useGLTF(...)` caller, or
// have a documented reason its GLB usage can't crash a route/canvas. A broken/404 GLB asset must
// never take down a whole route silently.
//
// As of the GLB-reliability unification wave, most of these consumers no longer define their own
// local boundary class -- they import the shared `GlbErrorBoundary` from
// ./components/explorer/GlbErrorBoundary.tsx instead (see that file for the class implementing
// getDerivedStateFromError once, centrally). GeneticsLab.tsx (DnaGlbErrorBoundary) and the
// non-GLB-lab boundaries (BunsenBurnerBoundary, WireGlbBoundary, ExamplePropBoundary,
// MechanicsPropBoundary, GrowthStageErrorBoundary) are out of scope for that wave and still define
// their own local class, so `assertWrappedByLocalBoundary` still covers those. Migrated files use
// `assertWrappedBySharedBoundary` instead.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../routes/BranchLab.test.ts's own comment on why, and
// ./components/explorer/crystalGlbErrorBoundary.test.ts for the established per-file pattern this
// file generalizes across the whole tree).
//
// Run with: node --test src/glbSafetyAudit.test.ts

function readSrc(relativePath: string): string {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return readFileSync(path, 'utf8')
}

/** Asserts `src` defines at least one local error-boundary class component (any name) that
 *  implements `getDerivedStateFromError`, and that the JSX for `boundaryUsageHint` (a substring
 *  expected to appear inside a `<SomeBoundary ...> ... </SomeBoundary>` span) is actually wrapped
 *  by one of those boundary components -- not just that a boundary class exists somewhere unused. */
function assertWrappedByLocalBoundary(src: string, wrappedJsxNeedle: string, label: string) {
  const boundaryClassNames = [...src.matchAll(/class\s+(\w*Boundary\w*)\s+extends\s+Component[\s\S]{0,600}?getDerivedStateFromError/g)].map(
    (m) => m[1],
  )
  assert.ok(
    boundaryClassNames.length > 0,
    `${label}: expected at least one local error-boundary class (extends Component, implements getDerivedStateFromError) in this file`,
  )

  // 2000-char windows: generous enough to span a multi-prop component invocation (e.g.
  // CellModel's ~15-line prop list plus a sibling hotspot-marker .map() block before the boundary
  // closes) without being so wide it would match across two unrelated, unnested boundary regions.
  const wrappedByAny = boundaryClassNames.some((name) => {
    const re = new RegExp(`<${name}\\b[\\s\\S]{0,2000}?${wrappedJsxNeedle}[\\s\\S]{0,2000}?</${name}>`)
    return re.test(src)
  })
  assert.ok(
    wrappedByAny,
    `${label}: expected "${wrappedJsxNeedle}" to be rendered inside a <...Boundary> ... </...Boundary> span (found boundary class(es): ${boundaryClassNames.join(', ') || 'none'}), so a failed GLB load degrades to a fallback instead of crashing the canvas`,
  )
}

/** Asserts `src` imports the shared `GlbErrorBoundary` (from either the explorer-relative
 *  `./GlbErrorBoundary` path or the route-relative `@/components/explorer/GlbErrorBoundary` alias)
 *  and that `wrappedJsxNeedle` is actually wrapped by a `<GlbErrorBoundary>...</GlbErrorBoundary>`
 *  span -- the shared-module equivalent of `assertWrappedByLocalBoundary` above. */
function assertWrappedBySharedBoundary(src: string, wrappedJsxNeedle: string, label: string) {
  assert.match(
    src,
    /import \{ GlbErrorBoundary(?:, GlbLoadingStatus)? \} from '(?:\.\/GlbErrorBoundary|@\/components\/explorer\/GlbErrorBoundary)'/,
    `${label}: expected an import of the shared GlbErrorBoundary component`,
  )
  const wrapped = new RegExp(`<GlbErrorBoundary\\b[\\s\\S]{0,2000}?${wrappedJsxNeedle}[\\s\\S]{0,2000}?</GlbErrorBoundary>`).test(src)
  assert.ok(
    wrapped,
    `${label}: expected "${wrappedJsxNeedle}" to be rendered inside a <GlbErrorBoundary>...</GlbErrorBoundary> span, so a failed GLB load degrades to a fallback instead of crashing the canvas`,
  )
}

// ---------------------------------------------------------------------------
// components/explorer/*Viewer.tsx + *Model.tsx pairs: the Viewer defines/uses a local
// GlbErrorBoundary wrapping <XModel .../>, which is where useGLTF() is actually called.
// ---------------------------------------------------------------------------

test('GenericViewer.tsx wraps GenericModel (useGLTF caller) in a GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/GenericViewer.tsx')
  assertWrappedBySharedBoundary(src, '<GenericModel', 'GenericViewer.tsx')
})

test('GenericModel.tsx itself: sanity check it is the one calling useGLTF (protection belongs in the viewer, not here)', () => {
  const src = readSrc('./components/explorer/GenericModel.tsx')
  assert.match(src, /useGLTF\(/, 'expected GenericModel.tsx to call useGLTF -- if this no longer holds, the boundary-placement assumption above needs revisiting')
})

test('CellViewer.tsx wraps CellModel (useGLTF caller) in a GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/CellViewer.tsx')
  assertWrappedBySharedBoundary(src, '<CellModel', 'CellViewer.tsx')
})

test('CellModel.tsx itself: sanity check it is the one calling useGLTF', () => {
  const src = readSrc('./components/explorer/CellModel.tsx')
  assert.match(src, /useGLTF\(/)
})

test('OrganViewer.tsx wraps OrganModel (useGLTF caller) in a GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/OrganViewer.tsx')
  assertWrappedBySharedBoundary(src, '<OrganModel', 'OrganViewer.tsx')
})

test('OrganModel.tsx itself: sanity check it is the one calling useGLTF', () => {
  const src = readSrc('./components/explorer/OrganModel.tsx')
  assert.match(src, /useGLTF\(/)
})

test('StarViewer.tsx wraps StarModel (useGLTF caller) in a GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/StarViewer.tsx')
  assertWrappedBySharedBoundary(src, '<StarModel', 'StarViewer.tsx')
})

test('StarModel.tsx itself: sanity check it is the one calling useGLTF', () => {
  const src = readSrc('./components/explorer/StarModel.tsx')
  assert.match(src, /useGLTF\(/)
})

// ---------------------------------------------------------------------------
// Self-contained explorer components: the file that calls useGLTF also defines and applies its
// own local GlbErrorBoundary around that call site (no separate *Viewer.tsx wrapper file).
// ---------------------------------------------------------------------------

test('CrystalViewer.tsx wraps its GLB mesh (CrystalMesh) in a local GlbErrorBoundary', () => {
  // Covered in depth by ./components/explorer/crystalGlbErrorBoundary.test.ts; re-asserted here
  // so this file is a complete single-source audit of every consumer in the tree.
  const src = readSrc('./components/explorer/CrystalViewer.tsx')
  assert.match(src, /useGLTF\(/, 'expected CrystalViewer.tsx to still call useGLTF directly')
  assertWrappedBySharedBoundary(src, '<CrystalMesh', 'CrystalViewer.tsx')
})

test('MoleculeModel.tsx wraps its GLB mesh (GlbMolecule) in a local GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/MoleculeModel.tsx')
  assert.match(src, /useGLTF\(/, 'expected MoleculeModel.tsx to still call useGLTF directly')
  assertWrappedBySharedBoundary(src, '<GlbMolecule', 'MoleculeModel.tsx')
})

test('MoleculeViewer.tsx: sanity check it only renders <MoleculeModel>, relying on that file\'s own internal boundary rather than needing a second one here', () => {
  const src = readSrc('./components/explorer/MoleculeViewer.tsx')
  assert.doesNotMatch(src, /useGLTF\(/, 'MoleculeViewer.tsx should not call useGLTF directly -- protection is expected to live inside MoleculeModel.tsx')
  assert.match(src, /<MoleculeModel\b/, 'expected MoleculeViewer.tsx to render <MoleculeModel>, whose own file wraps the actual GLB call in a boundary')
})

test('MoonModel.tsx wraps its GLB mesh (GlbMoonBody) in a local GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/MoonModel.tsx')
  assert.match(src, /useGLTF\(/, 'expected MoonModel.tsx to still call useGLTF directly')
  assertWrappedBySharedBoundary(src, '<GlbMoonBody', 'MoonModel.tsx')
})

test('PlanetModel.tsx wraps its GLB mesh (GlbPlanetBody) in a local GlbErrorBoundary', () => {
  const src = readSrc('./components/explorer/PlanetModel.tsx')
  assert.match(src, /useGLTF\(/, 'expected PlanetModel.tsx to still call useGLTF directly')
  assertWrappedBySharedBoundary(src, '<GlbPlanetBody', 'PlanetModel.tsx')
})

// ---------------------------------------------------------------------------
// Route files with their own real-world/GLB props, each with a locally named boundary class
// (BunsenBurnerBoundary, WireGlbBoundary, ExamplePropBoundary, MechanicsPropBoundary,
// GrowthStageErrorBoundary, GlbErrorBoundary, DnaGlbErrorBoundary) wrapping the component/hook
// that calls useGLTF.
// ---------------------------------------------------------------------------

test('ChemicalReactionsLab.tsx wraps the bunsen burner GLB (BunsenBurnerModel) in BunsenBurnerBoundary', () => {
  const src = readSrc('./routes/ChemicalReactionsLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected ChemicalReactionsLab.tsx to still call useGLTF directly (BunsenBurnerModel)')
  assertWrappedByLocalBoundary(src, '<BunsenBurnerModel', 'ChemicalReactionsLab.tsx')
})

test('ElectricityLab.tsx wraps the wire-cable GLB usage (WireDressingLoaded, via useWireCableNodes) in WireGlbBoundary', () => {
  const src = readSrc('./routes/ElectricityLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected ElectricityLab.tsx to still call useGLTF directly (useWireCableNodes)')
  assertWrappedByLocalBoundary(src, '<WireDressingLoaded', 'ElectricityLab.tsx')
})

test('EnergyLab.tsx wraps every real-world example GLB (Generator/Multimeter/ElectricStove, via useNormalizedGlbScene) in one ExamplePropBoundary', () => {
  const src = readSrc('./routes/EnergyLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected EnergyLab.tsx to still call useGLTF directly (useNormalizedGlbScene)')
  assertWrappedByLocalBoundary(src, '<GeneratorExample', 'EnergyLab.tsx (GeneratorExample)')
  // Multimeter and electric-stove examples are switched on inside the very same
  // ExamplePropBoundary/Suspense block as GeneratorExample (see RealWorldExampleProp), so the
  // single wrapping check above already covers all three -- explicitly confirm both other
  // examples are rendered inside that same conditional block rather than a second, unguarded one.
  const boundaryBlock = src.match(/<ExamplePropBoundary\b[\s\S]{0,1200}?<\/ExamplePropBoundary>/)
  assert.ok(boundaryBlock, 'expected to find an <ExamplePropBoundary>...</ExamplePropBoundary> block')
  assert.match(boundaryBlock![0], /<MultimeterExample/, 'expected MultimeterExample to render inside the same ExamplePropBoundary block as GeneratorExample')
  assert.match(boundaryBlock![0], /<ElectricStoveExample/, 'expected ElectricStoveExample to render inside the same ExamplePropBoundary block as GeneratorExample')
})

test('PhysicsLab.tsx wraps its mechanics prop GLBs (BaseballModel, MeasuringTapeModel, via useFittedGltf) in MechanicsPropBoundary', () => {
  const src = readSrc('./routes/PhysicsLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected PhysicsLab.tsx to still call useGLTF directly (useFittedGltf)')
  assertWrappedByLocalBoundary(src, '<BaseballModel', 'PhysicsLab.tsx (BaseballModel)')
  assertWrappedByLocalBoundary(src, '<MeasuringTapeModel', 'PhysicsLab.tsx (MeasuringTapeModel)')
})

test('PlantsLab.tsx wraps its growth-stage GLB sequences (GrowthStageModelView, x2 call sites) in GrowthStageErrorBoundary', () => {
  const src = readSrc('./routes/PlantsLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected PlantsLab.tsx to still call useGLTF directly (GrowthStageModelView)')
  const wrappedCount = [...src.matchAll(/<GrowthStageErrorBoundary\b[\s\S]{0,600}?<GrowthStageModelView\b[\s\S]{0,600}?<\/GrowthStageErrorBoundary>/g)].length
  assert.ok(
    wrappedCount >= 2,
    `expected both GrowthStageModelView call sites (flower + corn sequences) to be wrapped in <GrowthStageErrorBoundary>, found ${wrappedCount}`,
  )
})

test('EcologyLab.tsx wraps both SupportGlb background-dressing call sites (ecosystem.glb, producer.glb) in GlbErrorBoundary', () => {
  // Regression target for this wave's Ecology sibling fix: at the start of this wave these two
  // SupportGlb call sites (ecosystem.glb / producer.glb) were unprotected. This asserts the
  // correct end state -- both wrapped -- and is expected to be red until that fix lands, matching
  // this repo's established precedent for landing a correct-but-initially-red test (see
  // ./routes/mobileSwitcherAffordance.test.ts and
  // ./components/explorer/crystalGlbErrorBoundary.test.ts's own comments on this).
  const src = readSrc('./routes/EcologyLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected EcologyLab.tsx to still call useGLTF directly')

  const supportGlbUrls = ['/models/biology/ecology/ecosystem.glb', '/models/biology/ecology/producer.glb']
  for (const url of supportGlbUrls) {
    const escaped = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const wrapped = new RegExp(`<GlbErrorBoundary\\b[\\s\\S]{0,400}?${escaped}[\\s\\S]{0,400}?<SupportGlb\\b[\\s\\S]{0,400}?</GlbErrorBoundary>`).test(src)
    assert.ok(wrapped, `expected the SupportGlb call for "${url}" to be wrapped in a <GlbErrorBoundary>...</GlbErrorBoundary> span`)
  }
})

test('EcologyLab.tsx wraps the decomposer hero GLB (DecomposerHeroModel, via DecomposerMushroomHero) in GlbErrorBoundary', () => {
  const src = readSrc('./routes/EcologyLab.tsx')
  assertWrappedBySharedBoundary(src, '<DecomposerHeroModel', 'EcologyLab.tsx (DecomposerHeroModel)')
})

test('GeneticsLab.tsx wraps the real DNA GLB (RealDnaHelixModel) in a local error boundary (DnaGlbErrorBoundary)', () => {
  // Regression target for this wave's Genetics sibling fix: at the start of this wave
  // RealDnaHelixModel had no local error boundary at all (grep for "Boundary" /
  // "getDerivedStateFromError" returned nothing) and was only wrapped in a bare
  // `<Suspense fallback={null}>`, so a failed/404 GLB fetch threw past Suspense with nothing to
  // catch it, taking down the whole Genetics lab canvas. DnaGlbErrorBoundary (a local class
  // component implementing getDerivedStateFromError, keyed by `retryKey` so its "Try again"
  // button remounts the model for a fresh load attempt) now wraps <RealDnaHelixModel>, matching
  // the OrganViewer/EcologyLab GlbErrorBoundary precedent. This is now a regression guard
  // (expected GREEN) -- if a future edit strips that wrapping, this test should fail.
  const src = readSrc('./routes/GeneticsLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected GeneticsLab.tsx to still call useGLTF directly (RealDnaHelixModel)')
  assertWrappedByLocalBoundary(src, '<RealDnaHelixModel', 'GeneticsLab.tsx')
})

test('MicrobiologyLab.tsx wraps the real virus GLB (VirusGlbModel) in a local error boundary (GlbErrorBoundary)', () => {
  // Regression target for this wave's Microbiology sibling fix: at the start of this wave
  // VirusGlbModel had no local error boundary at all and was only wrapped in a bare
  // `<Suspense fallback={null}>`. A local GlbErrorBoundary class (keyed by both the stage `url`
  // and `retryKey`, so switching whole<->cutaway also remounts the boundary) now wraps
  // <VirusGlbModel>. This is now a regression guard (expected GREEN), not a red guard for
  // in-flight work.
  const src = readSrc('./routes/MicrobiologyLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected MicrobiologyLab.tsx to still call useGLTF directly (VirusGlbModel)')
  assertWrappedBySharedBoundary(src, '<VirusGlbModel', 'MicrobiologyLab.tsx')
})

test('MathManipulativesLab.tsx wraps the real measuring-cup GLB (CupModel) in a local error boundary (GlbErrorBoundary)', () => {
  // Regression target for this wave's Math Manipulatives sibling fix: at the start of this wave
  // CupModel had no local error boundary at all and was only wrapped in a bare
  // `<Suspense fallback={null}>`. A local GlbErrorBoundary class (keyed by `retryKey`) now wraps
  // <CupModel>. This is now a regression guard (expected GREEN), not a red guard for in-flight
  // work.
  const src = readSrc('./routes/MathManipulativesLab.tsx')
  assert.match(src, /useGLTF\(/, 'expected MathManipulativesLab.tsx to still call useGLTF directly (CupModel)')
  assertWrappedBySharedBoundary(src, '<CupModel', 'MathManipulativesLab.tsx')
})

// ---------------------------------------------------------------------------
// Confirmed non-consumers, recorded so a future full-tree grep doesn't need to re-derive this:
// GalaxyModel.tsx / GalaxyViewer.tsx render a fully procedural starfield/disk with no useGLTF,
// .glb, or GLTFLoader reference anywhere in either file (grepped at audit time) -- nothing to
// guard there. No direct `new GLTFLoader()` usage exists anywhere in src/ outside drei's useGLTF
// (grepped for "GLTFLoader" across src/ at audit time -- the only hits are code comments in
// MicrobiologyLab.tsx/GeneticsLab.tsx and a data-file note in modelRegistry.ts, none of which
// instantiate a loader directly).
// ---------------------------------------------------------------------------

test('GalaxyModel.tsx / GalaxyViewer.tsx do not load any GLB asset (confirms they are out of scope for this audit)', () => {
  const modelSrc = readSrc('./components/explorer/GalaxyModel.tsx')
  const viewerSrc = readSrc('./components/explorer/GalaxyViewer.tsx')
  assert.doesNotMatch(modelSrc, /useGLTF\(|\.glb['"`)]|GLTFLoader/, 'GalaxyModel.tsx was expected to be fully procedural with no GLB usage')
  assert.doesNotMatch(viewerSrc, /useGLTF\(|\.glb['"`)]|GLTFLoader/, 'GalaxyViewer.tsx was expected to be fully procedural with no GLB usage')
})
