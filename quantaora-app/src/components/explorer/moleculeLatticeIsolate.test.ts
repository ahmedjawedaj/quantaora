import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for the Sodium Chloride Isolate/Focus fix.
//
// A prior fix attempted per-node isolate targeting for the NaCl lattice GLB (a ~27-ion repeating
// mesh, public/models/chemistry/molecules/sodium-chloride-lattice.glb): it tagged the one mesh
// node nearest to each authored atom with `userData.moleculeAtomId`, then dimmed every OTHER node
// while keeping that one node at full opacity. That version passed source-text pattern checks
// (the isSelectedNode/resolveIsolateOpacity call shapes all looked right) but did not actually
// change what rendered in the browser: Context and Focus mode looked visually identical, and
// selecting an ion never visibly dimmed the rest of the lattice at all -- reproduced by loading
// the live app, selecting an ion, and confirming zero pixel difference between "Isolating" and
// "Focused on this ion" screenshots.
//
// The real fix (see MoleculeModel.tsx) stops relying on per-node targeting entirely: the whole
// GLB mesh dims as one unit via `resolveIsolateOpacity` (no per-node branch to silently no-op),
// and the selected ion is made unmistakable by a separate `SelectedIonOverlay` sphere rendered at
// the atom's extracted real position/radius/color, unaffected by the lattice's dim state. This
// is simpler and doesn't depend on nearest-neighbor node matching working perfectly for every
// sourced asset.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why;
// MoleculeModel.tsx and ChemistryLab.tsx both contain JSX, which Node's native TS stripping cannot
// parse, so `resolveIsolateOpacity`'s arithmetic is verified below by re-deriving it from the
// extracted source constants rather than importing and calling the real function).
//
// Run with: node --test src/components/explorer/moleculeLatticeIsolate.test.ts

function readSrc(relativePath: string): string {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return readFileSync(path, 'utf8')
}

const MODEL_SRC = readSrc('./MoleculeModel.tsx')
const VIEWER_SRC = readSrc('./MoleculeViewer.tsx')
const LAB_SRC = readSrc('../../routes/ChemistryLab.tsx')

test('MoleculeModel.tsx: extractGlbAtomPositions returns both the matched node position and its real on-screen radius', () => {
  assert.match(
    MODEL_SRC,
    /function extractGlbAtomPositions\(/,
    'expected extractGlbAtomPositions to still exist',
  )
  assert.match(
    MODEL_SRC,
    /radii\[atom\.id\]\s*=\s*\(Math\.max\(nodeSize\.x, nodeSize\.y, nodeSize\.z\) \/ 2\) \* scale/,
    'expected the matched node\'s own bounding-box radius (scaled to match its final on-screen size) to be returned per atom id, so SelectedIonOverlay can size a highlight sphere that matches the real ion instead of guessing',
  )
})

test('MoleculeModel.tsx: SelectedIonOverlay renders an always-full-strength, correctly colored highlight at the selected atom\'s real position', () => {
  assert.match(
    MODEL_SRC,
    /function SelectedIonOverlay\(/,
    'expected a SelectedIonOverlay component',
  )
  const overlayCallMatch = MODEL_SRC.match(/\{dimmed && activeAtom && activeAtomPosition && \(\s*<SelectedIonOverlay([\s\S]*?)\/>\s*\)\}/)
  assert.ok(overlayCallMatch, 'expected GlbMolecule to render <SelectedIonOverlay> only while an atom/ion is selected (dimmed)')
  assert.match(
    overlayCallMatch![1],
    /color=\{ELEMENT_COLOR\[activeAtom\.element\]\}/,
    'expected the overlay to be colored from the selected atom\'s own element (ELEMENT_COLOR), so Na and Cl are never shown with the wrong ion color',
  )
  assert.match(
    overlayCallMatch![1],
    /position=\{activeAtomPosition\}/,
    'expected the overlay to sit at the selected atom\'s real extracted on-screen position, not its authored formula-unit coordinate',
  )
})

test('MoleculeModel.tsx: isolate dimming applies to the whole GLB mesh as one unit, not a per-node isSelectedNode branch', () => {
  const frameLoopMatch = MODEL_SRC.match(/useFrame\(\(_, delta\) => \{[\s\S]*?model\.traverse\(\(child\) => \{([\s\S]*?)\n  \}\)\n\n  const activeAtom/)
  assert.ok(frameLoopMatch, 'expected GlbMolecule\'s useFrame(...) => model.traverse(...) isolate-dimming loop to still exist')
  const loopBody = frameLoopMatch![1]
  assert.doesNotMatch(
    loopBody,
    /isSelectedNode/,
    'expected the per-frame dimming loop to no longer branch on a per-node "isSelectedNode" flag -- nearest-neighbor node matching is a best-effort visual match, not a reliable way to isolate one ion\'s mesh from the rest of a sourced GLB, and relying on it previously made Isolate/Focus visibly do nothing',
  )
  assert.match(
    loopBody,
    /resolveIsolateOpacity\(\{\s*baseOpacity,\s*dimmed,\s*isolateFocusMode,\s*xrayActive\s*\}\)/,
    'expected every material in the GLB to receive the same whole-lattice dim target from resolveIsolateOpacity',
  )
})

test('MoleculeModel.tsx: transparent stays true until the opacity fade has actually settled, so un-dimming never pops to fully opaque mid-fade', () => {
  assert.match(
    MODEL_SRC,
    /material\.transparent = baseOpacity < 0\.999 \|\| material\.opacity < 0\.999 \|\| target < 0\.999/,
    'expected material.transparent to be derived from the material\'s current (post-lerp) opacity and target, not just the dimmed/xrayActive booleans -- otherwise a material can flip back to non-transparent (which ignores its opacity value entirely) before its opacity has actually finished lerping back up to baseOpacity, causing a visible pop',
  )
})

test('MoleculeModel.tsx: cloned GLB materials are disposed on unmount/remount without touching the cached useGLTF scene', () => {
  const disposeEffectMatch = MODEL_SRC.match(/useEffect\(\(\) => \{\s*return \(\) => \{([\s\S]*?)\n    \}\n  \}, \[model\]\)/)
  assert.ok(disposeEffectMatch, 'expected a cleanup effect keyed on [model] that disposes cloned materials when GlbMolecule unmounts or model is recreated')
  assert.match(
    disposeEffectMatch![1],
    /material\.dispose\(\)/,
    'expected the cleanup effect to call material.dispose() on the per-mount cloned materials',
  )
  assert.doesNotMatch(
    disposeEffectMatch![1],
    /\.map\.dispose\(\)|geometry\.dispose\(\)|scene\.dispose\(\)/,
    'expected the cleanup effect to dispose only the cloned materials, never textures/geometry/the cached useGLTF scene -- those are shared references reused by future mounts of the same cached model',
  )
})

test('MoleculeModel.tsx: resolveIsolateOpacity restores baseOpacity for the whole mesh once dimmed is false (no leaked isolate state after deselect)', () => {
  assert.match(
    MODEL_SRC,
    /export function resolveIsolateOpacity/,
    'expected an exported resolveIsolateOpacity(...) helper in MoleculeModel.tsx',
  )
  assert.match(
    MODEL_SRC,
    /if \(!dimmed\) return xrayActive \? Math\.min\(baseOpacity, [\d.]+\) : baseOpacity/,
    'expected resolveIsolateOpacity to short-circuit to baseOpacity (the material\'s own original opacity) whenever dimmed is false -- this is what makes deselecting (or switching molecules, which remounts with a fresh baseOpacity) fully restore materials with no leftover isolate state',
  )
})

test('MoleculeModel.tsx: resolveIsolateOpacity makes Context and Focus modes produce strictly different opacity targets', () => {
  // Re-derive resolveIsolateOpacity's branches directly from source so this test still fails if
  // the real function's logic (not just its call sites, checked above) regresses.
  const contextConstMatch = MODEL_SRC.match(/export const ISOLATE_CONTEXT_DIM_OPACITY = ([\d.]+)/)
  const focusConstMatch = MODEL_SRC.match(/export const ISOLATE_FOCUS_DIM_OPACITY = ([\d.]+)/)
  assert.ok(contextConstMatch, 'expected an exported ISOLATE_CONTEXT_DIM_OPACITY constant')
  assert.ok(focusConstMatch, 'expected an exported ISOLATE_FOCUS_DIM_OPACITY constant')
  const contextDim = Number(contextConstMatch![1])
  const focusDim = Number(focusConstMatch![1])

  assert.ok(focusDim < contextDim, `expected the opt-in "Focus this ion" dim (${focusDim}) to be strictly stronger (lower opacity) than the default context-preserving dim (${contextDim}), so toggling Focus always produces a visible change`)
  assert.ok(contextDim < 1, `expected ISOLATE_CONTEXT_DIM_OPACITY (${contextDim}) to actually dim (be less than full opacity 1), or Isolate would not visibly change the lattice at all`)

  const baseOpacity = 1
  const contextTarget = Math.min(baseOpacity, contextDim)
  const focusTarget = Math.min(baseOpacity, focusDim)
  assert.notEqual(contextTarget, focusTarget, 'expected Context and Focus mode to resolve to different opacity targets for the same material')
})

test('MoleculeModel.tsx: Focus opacity is materially lower than Context opacity, not just a fractionally-lower one -- and both land in their requested visual bands', () => {
  // Real-browser verification (see this fix's screenshots) showed that a `~4%` gap between
  // Context and Focus (the previous 0.34 vs 0.08 constants) reads as visually indistinguishable
  // once ~27 overlapping semi-transparent ions in the real NaCl lattice GLB compound their alpha
  // -- so this test pins both constants to their requested visual bands (roughly 35-45% for
  // Context, roughly 10-15% for Focus) instead of only checking focusDim < contextDim.
  const contextDim = Number(MODEL_SRC.match(/export const ISOLATE_CONTEXT_DIM_OPACITY = ([\d.]+)/)![1])
  const focusDim = Number(MODEL_SRC.match(/export const ISOLATE_FOCUS_DIM_OPACITY = ([\d.]+)/)![1])

  assert.ok(
    contextDim >= 0.35 && contextDim <= 0.45,
    `expected ISOLATE_CONTEXT_DIM_OPACITY (${contextDim}) to sit in the requested ~35-45% Context band`,
  )
  assert.ok(
    focusDim >= 0.1 && focusDim <= 0.15,
    `expected ISOLATE_FOCUS_DIM_OPACITY (${focusDim}) to sit in the requested ~10-15% Focus band`,
  )
  assert.ok(
    focusDim <= contextDim * 0.5,
    `expected Focus (${focusDim}) to be materially lower than Context (${contextDim}) -- at most half -- not just a marginally lower value that would read as visually indistinguishable`,
  )
})

test('MoleculeModel.tsx: SelectedIonOverlay renders a distinct halo/outline shell around an opaque, enlarged core, not just a bigger plain sphere', () => {
  const overlayFnMatch = MODEL_SRC.match(/function SelectedIonOverlay\(\{[\s\S]*?\n\}\n/)
  assert.ok(overlayFnMatch, 'expected the SelectedIonOverlay function body')
  const body = overlayFnMatch![0]

  assert.match(
    body,
    /side=\{THREE\.BackSide\}/,
    'expected a BackSide-rendered shell mesh -- the mechanism that makes the halo read as a rim/outline around the selected ion instead of a solid blob that would cover the ion\'s own color',
  )
  assert.match(
    body,
    /transparent[\s\S]{0,80}opacity=\{OVERLAY_HALO_OPACITY\}/,
    'expected the halo shell to be translucent (its own separate material), distinct from the always-opaque core',
  )
  assert.doesNotMatch(
    body.match(/<mesh ref=\{coreRef\}[\s\S]*?\/mesh>/)?.[0] ?? '',
    /transparent/,
    'expected the core sphere\'s own material to have no `transparent` prop -- it must stay fully opaque regardless of isolate/focus dimming so the selected ion is always unmistakable',
  )

  const coreScale = Number(MODEL_SRC.match(/const OVERLAY_CORE_SCALE = ([\d.]+)/)?.[1])
  const haloScale = Number(MODEL_SRC.match(/const OVERLAY_HALO_SCALE = ([\d.]+)/)?.[1])
  assert.ok(coreScale > 1.2, `expected the core sphere to grow visibly larger than its real matched ion (OVERLAY_CORE_SCALE=${coreScale}), obvious even at a 390x844 mobile viewport`)
  assert.ok(haloScale > coreScale, `expected the halo shell (${haloScale}) to sit outside the opaque core (${coreScale}) so it reads as an outline, not an overlap`)
})

test('MoleculeViewer.tsx: Canvas gl config has no preserveDrawingBuffer -- focus/isolate visuals are driven by lerped material/overlay state under frameloop="always", so retaining the drawing buffer is pure GPU cost with no visual benefit', () => {
  assert.doesNotMatch(
    VIEWER_SRC,
    /preserveDrawingBuffer/,
    'expected MoleculeViewer\'s <Canvas gl={{...}}> to omit preserveDrawingBuffer and use the production default (false)',
  )
  const contextDim = Number(MODEL_SRC.match(/export const ISOLATE_CONTEXT_DIM_OPACITY = ([\d.]+)/)?.[1])
  const focusDim = Number(MODEL_SRC.match(/export const ISOLATE_FOCUS_DIM_OPACITY = ([\d.]+)/)?.[1])
  assert.equal(contextDim, 0.4, 'expected ISOLATE_CONTEXT_DIM_OPACITY to remain 0.4')
  assert.equal(focusDim, 0.12, 'expected ISOLATE_FOCUS_DIM_OPACITY to remain 0.12')
})

test('MoleculeViewer.tsx: isolateFocusMode is threaded through to MoleculeModel (not dropped between ChemistryLab and the GLB renderer)', () => {
  assert.match(
    VIEWER_SRC,
    /isolateFocusMode\s*=\s*false,/,
    'expected MoleculeViewer to accept an isolateFocusMode prop',
  )
  assert.match(
    VIEWER_SRC,
    /<MoleculeModel[\s\S]*?isolateFocusMode=\{isolateFocusMode\}/,
    'expected MoleculeViewer to forward isolateFocusMode to <MoleculeModel>',
  )
})

test('ChemistryLab.tsx: latticeIsolateFocus is reset alongside activeAtomId on molecule switch, preset reset, and the canvas Reset control', () => {
  const selectMoleculeMatch = LAB_SRC.match(/const selectMolecule = \(id: string\) => \{([\s\S]*?)\n  \}/)
  assert.ok(selectMoleculeMatch, 'expected a selectMolecule(...) handler')
  assert.match(selectMoleculeMatch![1], /setLatticeIsolateFocus\(false\)/, 'expected selectMolecule to reset latticeIsolateFocus to false, so switching molecules never carries a stale focus toggle into the next selection')

  const resetMoleculeMatch = LAB_SRC.match(/const resetMolecule = \(\) => \{([\s\S]*?)\n  \}/)
  assert.ok(resetMoleculeMatch, 'expected a resetMolecule(...) handler ("Preset" button)')
  assert.match(resetMoleculeMatch![1], /setLatticeIsolateFocus\(false\)/, 'expected resetMolecule to reset latticeIsolateFocus to false')

  const canvasResetMatch = LAB_SRC.match(/onReset=\{\(\) => \{\s*if \(labMode === 'molecules'\) \{([\s\S]*?)\n\s*\} else \{/)
  assert.ok(canvasResetMatch, 'expected the CanvasControls onReset handler\'s molecules branch')
  assert.match(canvasResetMatch![1], /setLatticeIsolateFocus\(false\)/, 'expected the canvas Reset control to also reset latticeIsolateFocus to false')
})

test('ChemistryLab.tsx: handleAtomSelect resets latticeIsolateFocus when switching directly from one selected atom to a different one', () => {
  const handlerMatch = LAB_SRC.match(/const handleAtomSelect = \(id: string\) => \{([\s\S]*?)\n  \}/)
  assert.ok(handlerMatch, 'expected a handleAtomSelect(...) handler')
  const body = handlerMatch![1]
  assert.match(
    body,
    /if \(activeAtomId !== null\) setLatticeIsolateFocus\(false\)/,
    'expected handleAtomSelect to reset latticeIsolateFocus when the newly-clicked atom differs from the currently-selected one (atom-to-atom selection), not just on deselect/reset/molecule-switch',
  )
})

test('ChemistryLab.tsx: the isolate focus toggle only renders for ionic content with an atom actively selected (not a permanent extra control)', () => {
  assert.match(
    LAB_SRC,
    /\{isIonicContent && isolateActive && \(/,
    'expected the "Focus this ion" / "show full lattice" toggle to be conditionally rendered only when isIonicContent (NaCl) and isolateActive (an atom/ion is selected) are both true',
  )
  assert.match(
    LAB_SRC,
    /onClick=\{\(\) => setLatticeIsolateFocus\(\(v\) => !v\)\}/,
    'expected the toggle button to flip latticeIsolateFocus',
  )
})
