import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for CrystalViewer.tsx's GLB reliability: diamond / SiC / graphite sheet must
// degrade to an accessible retry card, not a blank canvas, on a failed/slow GLB fetch.
//
// As of the GLB-reliability unification wave, CrystalViewer.tsx no longer defines its own local
// `class GlbErrorBoundary` (see this file's prior history for that shape) -- it imports the shared
// GlbErrorBoundary/GlbLoadingStatus from ./GlbErrorBoundary.tsx, which is itself a class component
// implementing getDerivedStateFromError (see ./GlbErrorBoundary.tsx directly for that contract).
// This file now asserts CrystalViewer.tsx actually imports and uses that shared boundary around
// CrystalMesh, with a real loading placeholder (not `null`) in the Suspense fallback beneath it.
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own
// comment on why).
//
// Run with: node --test src/components/explorer/crystalGlbErrorBoundary.test.ts

const CRYSTAL_VIEWER_PATH = fileURLToPath(new URL('./CrystalViewer.tsx', import.meta.url))
const crystalViewerSrc = readFileSync(CRYSTAL_VIEWER_PATH, 'utf8')

test('CrystalViewer.tsx imports the shared GlbErrorBoundary/GlbLoadingStatus rather than defining a local class', () => {
  assert.match(
    crystalViewerSrc,
    /import \{ GlbErrorBoundary, GlbLoadingStatus \} from '\.\/GlbErrorBoundary'/,
    'expected CrystalViewer.tsx to import the shared GlbErrorBoundary/GlbLoadingStatus from ./GlbErrorBoundary',
  )
  assert.doesNotMatch(
    crystalViewerSrc,
    /class\s+GlbErrorBoundary\s+extends\s+Component/,
    'expected the locally-defined GlbErrorBoundary class to be gone now that CrystalViewer.tsx imports the shared one',
  )
})

test('CrystalViewer.tsx: the GLB mesh (CrystalMesh) is actually wrapped by <GlbErrorBoundary>, not just imported and unused', () => {
  const wrapsCrystalMesh = /<GlbErrorBoundary\b[\s\S]{0,400}?<CrystalMesh\b/.test(crystalViewerSrc)
  assert.ok(
    wrapsCrystalMesh,
    'expected <GlbErrorBoundary> to wrap <CrystalMesh> in the JSX tree (imported but never rendered around the GLB load would not actually catch anything)',
  )
})

test('CrystalViewer.tsx: the Suspense fallback around CrystalMesh is a real accessible loading placeholder, not a bare `null`', () => {
  const suspenseAroundMesh = crystalViewerSrc.match(/<Suspense\s+fallback=\{([\s\S]{0,200}?)\}>\s*<CameraDistance/)
  assert.ok(suspenseAroundMesh, 'expected to find the <Suspense fallback={...}> wrapping CrystalMesh\'s render tree')
  const fallbackExpr = suspenseAroundMesh![1].trim()
  assert.notEqual(
    fallbackExpr,
    'null',
    'expected the Suspense fallback around CrystalMesh to render a real loading placeholder, not a bare `null` that leaves the canvas blank while the GLB streams in',
  )
  assert.match(
    fallbackExpr,
    /<GlbLoadingStatus\b/,
    'expected the Suspense fallback around CrystalMesh to use the shared GlbLoadingStatus accessible loading pill',
  )
})

test('CrystalViewer.tsx: the error boundary carries crystal-specific copy via the shared `message` prop', () => {
  const boundaryOpenMatch = crystalViewerSrc.match(/<GlbErrorBoundary\b([\s\S]*?)>/)
  assert.ok(boundaryOpenMatch, 'expected a <GlbErrorBoundary ...> opening tag')
  assert.match(
    boundaryOpenMatch![1],
    /message="This crystal lattice model couldn't load\."/,
    'expected the crystal boundary to pass its "This crystal lattice model couldn\'t load." copy via the `message` prop',
  )
})
