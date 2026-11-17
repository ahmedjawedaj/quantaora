import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for CrystalViewer.tsx's "Try again" retry (docs/reviews/wave14-COMBINED.md P1
// #3): "the 'Try again' retry button after a simulated GLB failure fires no new network request
// and never recovers the model (graceful-degrade UI is otherwise correct)."
//
// CrystalViewer.tsx originally fixed this with its own local `retryKey` state + inline
// `useGLTF.clear(url)` call (see this file's prior history) -- that local fix was later extracted
// into the shared `useGlbRetry(url)` hook (./useGlbRetry.ts) during the GLB-reliability
// unification wave, and CrystalViewer.tsx itself was switched onto that shared hook alongside
// GenericViewer/CellViewer/OrganViewer/StarViewer (see ./glbRetryCacheClear.test.ts, which now
// covers CrystalViewer.tsx's use of the hook directly). This file now only asserts CrystalViewer's
// JSX actually keys/wires the shared hook's output correctly at its own call site; the hook's own
// clear-before-bump ordering is covered once, at the hook level, by
// ./glbRetryCacheClear.test.ts's first test.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/components/explorer/crystalRetryRemount.test.ts

const CRYSTAL_VIEWER_PATH = fileURLToPath(new URL('./CrystalViewer.tsx', import.meta.url))
const src = readFileSync(CRYSTAL_VIEWER_PATH, 'utf8')

test('CrystalViewer: uses the shared useGlbRetry(url) hook rather than a locally reimplemented retryKey/useGLTF.clear pair', () => {
  assert.match(
    src,
    /import \{ useGlbRetry \} from '\.\/useGlbRetry'/,
    'expected an import of the shared useGlbRetry hook',
  )
  assert.match(
    src,
    /const \{ retryKey, retryLoad \} = useGlbRetry\(url\)/,
    'expected `const { retryKey, retryLoad } = useGlbRetry(url)` to be called',
  )
  assert.doesNotMatch(
    src,
    /const \[retryKey, setRetryKey\] = useState\(0\)/,
    'expected the locally reimplemented retryKey state to be gone now that useGlbRetry owns it',
  )
})

test('CrystalViewer: the retry-key is actually used in a remount key on the error-boundary/model subtree, not just tracked and ignored', () => {
  // `[\s\S]*?\}\s+onRetry` (non-greedy, terminated by the next prop) rather than `[^}]+\}`, since
  // the key expression is a template literal (`${url}-${retryKey}`) containing its own nested `}`
  // characters that a naive `[^}]+` would stop at prematurely.
  const keyPropMatch = src.match(/<GlbErrorBoundary\s+key=\{([\s\S]*?)\}\s+onRetry/)
  assert.ok(keyPropMatch, 'expected <GlbErrorBoundary> to carry a `key` prop derived from retryKey (so React actually remounts it, not just re-renders in place)')
  assert.match(
    keyPropMatch![1],
    /retryKey/,
    `expected the <GlbErrorBoundary> key expression to reference retryKey so it changes on every retry (got: ${keyPropMatch![1]})`,
  )
})

test('CrystalViewer: retryLoad (from the shared hook) is wired up as <GlbErrorBoundary>\'s onRetry, and CrystalMesh still calls useGLTF(url) directly', () => {
  assert.match(
    src,
    /onRetry=\{retryLoad\}/,
    'expected <GlbErrorBoundary onRetry={retryLoad}> so the shared hook\'s cache-clearing retry handler is actually the one invoked by the "Try again" button',
  )
  const useGltfCallMatch = src.match(/useGLTF\(([^)]*)\)/)
  assert.ok(useGltfCallMatch, "expected a useGLTF(...) call to still exist in CrystalViewer.tsx (CrystalMesh's GLB load)")
  assert.equal(
    useGltfCallMatch![1].trim(),
    'url',
    `expected useGLTF(...) to still be called with \`url\` (the same value passed to useGlbRetry), got useGLTF(${useGltfCallMatch![1].trim()})`,
  )
})
