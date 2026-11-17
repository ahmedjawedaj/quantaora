import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for GeneticsLab.tsx's DNA "Try again" retry (DnaRealStructureScene), mirroring
// ../components/explorer/glbRetryCacheClear.test.ts's `assertUsesSharedRetryHook` helper (the
// shared-hook shape) rather than ./microbiologyRetryRemount.test.ts's inline-clear shape, since
// this fix routes through the extracted `useGlbRetry` hook (../components/explorer/useGlbRetry.ts)
// instead of reimplementing its own `useGLTF.clear(url)`-then-`setRetryKey` pair inline.
//
// Same underlying bug class in all of these: drei's useGLTF is built on suspend-react's
// module-level load cache, keyed by [Loader, url]. A failed fetch permanently caches the
// rejection and re-throws the SAME rejected promise for that url on every subsequent call,
// remount or not -- so a bare `retryKey`-bump-only "Try again" handler is a silent no-op. The fix
// is `useGLTF.clear(url)` before the remount, which useGlbRetry's `retryLoad` already does.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/geneticsRetryRemount.test.ts

const GENETICS_LAB_PATH = fileURLToPath(new URL('./GeneticsLab.tsx', import.meta.url))
const src = readFileSync(GENETICS_LAB_PATH, 'utf8')

test('GeneticsLab.tsx: imports the shared useGlbRetry hook', () => {
  assert.match(
    src,
    /import \{ useGlbRetry \} from '@\/components\/explorer\/useGlbRetry'/,
    "expected GeneticsLab.tsx to import the shared useGlbRetry hook from '@/components/explorer/useGlbRetry'",
  )
})

test('GeneticsLab.tsx: DnaRealStructureScene calls useGlbRetry(DNA_MODEL_URL) and destructures retryKey/retryLoad', () => {
  assert.match(
    src,
    /const \{ retryKey, retryLoad \} = useGlbRetry\(DNA_MODEL_URL\)/,
    'expected `const { retryKey, retryLoad } = useGlbRetry(DNA_MODEL_URL)` to be called (DnaRealStructureScene)',
  )
})

test('GeneticsLab.tsx: <DnaGlbErrorBoundary key={retryKey} onRetry={retryLoad}> wires the shared hook up as the actual retry handler', () => {
  // Non-greedy `[\s\S]*?` (not `[^}]*`) in case the key expression is ever changed to a template
  // literal containing its own nested `}` characters -- same reasoning as the other retry tests.
  const keyPropMatch = src.match(/<DnaGlbErrorBoundary\s+key=\{([\s\S]*?)\}\s+onRetry=\{(\w+)\}/)
  assert.ok(
    keyPropMatch,
    'expected <DnaGlbErrorBoundary key={...} onRetry={...}> with both props present',
  )
  assert.match(
    keyPropMatch![1],
    /retryKey/,
    `expected the <DnaGlbErrorBoundary> key expression to reference retryKey so it changes on every retry (got: ${keyPropMatch![1]})`,
  )
  assert.equal(
    keyPropMatch![2],
    'retryLoad',
    `expected <DnaGlbErrorBoundary onRetry={retryLoad}> to wire the shared hook's output up as the actual retry handler (not a re-inlined bare retryKey bump), got onRetry={${keyPropMatch![2]}}`,
  )
})

test('GeneticsLab.tsx: no bare inline `onRetry={() => setRetryKey(...)}` handler for the DNA retry (would bypass useGlbRetry\'s cache clear)', () => {
  assert.doesNotMatch(
    src,
    /onRetry=\{\(\) => setRetryKey/,
    'found an inline `onRetry={() => setRetryKey(...)}` handler -- this bypasses useGlbRetry\'s useGLTF.clear(url) call and reintroduces the cached-rejection "Try again does nothing" bug',
  )
  // Also guard against a raw `useState(0)`-backed local retryKey being reintroduced for this
  // scene instead of going through the shared hook (the pre-fix shape this bug report described).
  assert.doesNotMatch(
    src,
    /const \[retryKey, setRetryKey\] = useState\(0\)/,
    'found a local `const [retryKey, setRetryKey] = useState(0)` -- DnaRealStructureScene should get retryKey/retryLoad from the shared useGlbRetry hook instead of reimplementing its own state',
  )
})

test('GeneticsLab.tsx: RealDnaHelixModel still calls useGLTF(DNA_MODEL_URL) directly', () => {
  assert.match(
    src,
    /const \{ scene \} = useGLTF\(DNA_MODEL_URL\)/,
    'expected RealDnaHelixModel to still load the DNA GLB via useGLTF(DNA_MODEL_URL)',
  )
})

test('GeneticsLab.tsx: <RealDnaHelixModel is still wrapped by <DnaGlbErrorBoundary>...</DnaGlbErrorBoundary> (crash-safety not regressed)', () => {
  const boundaryOpenIdx = src.indexOf('<DnaGlbErrorBoundary key={retryKey} onRetry={retryLoad}>')
  assert.ok(boundaryOpenIdx !== -1, 'expected to find the DnaGlbErrorBoundary opening tag')
  const boundaryCloseIdx = src.indexOf('</DnaGlbErrorBoundary>', boundaryOpenIdx)
  assert.ok(boundaryCloseIdx !== -1, 'expected to find the matching </DnaGlbErrorBoundary> closing tag')
  const between = src.slice(boundaryOpenIdx, boundaryCloseIdx)
  assert.match(
    between,
    /<RealDnaHelixModel/,
    'expected <RealDnaHelixModel to render inside <DnaGlbErrorBoundary>...</DnaGlbErrorBoundary>, not outside its crash-safety wrapping',
  )
})
