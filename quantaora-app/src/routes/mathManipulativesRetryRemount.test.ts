import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for MathManipulativesLab.tsx's measuring-cup "Try again" retry (CupPanel),
// mirroring ../components/explorer/glbRetryCacheClear.test.ts's `assertUsesSharedRetryHook`
// helper (the shared-hook shape) rather than a locally reimplemented `useGLTF.clear(url)`-then-
// `setRetryKey` pair, since this fix routes through the extracted `useGlbRetry` hook
// (../components/explorer/useGlbRetry.ts).
//
// Same underlying bug class in all of these: drei's useGLTF is built on suspend-react's
// module-level load cache, keyed by [Loader, url]. A failed fetch permanently caches the
// rejection and re-throws the SAME rejected promise for that url on every subsequent call,
// remount or not -- so a bare `retryKey`-bump-only "Try again" handler is a silent no-op. The fix
// is `useGLTF.clear(url)` before the remount, which useGlbRetry's `retryLoad` already does.
//
// As of the GLB-reliability unification wave, the cup boundary uses the shared GlbErrorBoundary
// (../components/explorer/GlbErrorBoundary.tsx) imported from that module, not a locally-defined
// `class GlbErrorBoundary` in this file -- regexes below anchor on the JSX usage/import, not on a
// local class definition.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/mathManipulativesRetryRemount.test.ts

const MATH_LAB_PATH = fileURLToPath(new URL('./MathManipulativesLab.tsx', import.meta.url))
const src = readFileSync(MATH_LAB_PATH, 'utf8')

test('MathManipulativesLab.tsx: imports the shared useGlbRetry hook and the shared GlbErrorBoundary', () => {
  assert.match(
    src,
    /import \{ useGlbRetry \} from '@\/components\/explorer\/useGlbRetry'/,
    "expected MathManipulativesLab.tsx to import the shared useGlbRetry hook from '@/components/explorer/useGlbRetry'",
  )
  assert.match(
    src,
    /import \{ GlbErrorBoundary, GlbLoadingStatus \} from '@\/components\/explorer\/GlbErrorBoundary'/,
    "expected MathManipulativesLab.tsx to import the shared GlbErrorBoundary/GlbLoadingStatus from '@/components/explorer/GlbErrorBoundary', not define its own local class",
  )
  assert.doesNotMatch(
    src,
    /class\s+GlbErrorBoundary\s+extends\s+Component/,
    'expected the locally-defined GlbErrorBoundary class to be gone now that this file imports the shared one',
  )
})

test('MathManipulativesLab.tsx: CupPanel calls useGlbRetry(MEASURING_CUP_MODEL_URL) and destructures retryKey/retryLoad', () => {
  assert.match(
    src,
    /const \{ retryKey, retryLoad \} = useGlbRetry\(MEASURING_CUP_MODEL_URL\)/,
    'expected `const { retryKey, retryLoad } = useGlbRetry(MEASURING_CUP_MODEL_URL)` to be called (CupPanel)',
  )
})

test('MathManipulativesLab.tsx: exactly one <GlbErrorBoundary> JSX usage exists, and it wires key={retryKey} onRetry={retryLoad}', () => {
  const jsxUsages = [...src.matchAll(/<GlbErrorBoundary\b/g)]
  assert.equal(
    jsxUsages.length,
    1,
    `expected exactly one <GlbErrorBoundary> JSX usage in MathManipulativesLab.tsx (the cup boundary), found ${jsxUsages.length}`,
  )

  const boundaryOpenMatch = src.match(/<GlbErrorBoundary\b([\s\S]*?)>/)
  assert.ok(boundaryOpenMatch, 'expected a <GlbErrorBoundary ...> opening tag')
  const props = boundaryOpenMatch![1]

  const keyPropMatch = props.match(/key=\{([\s\S]*?)\}/)
  assert.ok(keyPropMatch, 'expected the <GlbErrorBoundary> to carry a `key` prop')
  assert.match(
    keyPropMatch![1],
    /retryKey/,
    `expected the <GlbErrorBoundary> key expression to reference retryKey so it changes on every retry (got: ${keyPropMatch![1]})`,
  )

  assert.match(
    props,
    /onRetry=\{retryLoad\}/,
    'expected <GlbErrorBoundary onRetry={retryLoad}> to wire the shared hook\'s output up as the actual retry handler (not a re-inlined bare retryKey bump)',
  )
  assert.match(
    props,
    /message="This 3D measuring cup model couldn't load\."/,
    'expected the cup boundary to pass its "This 3D measuring cup model couldn\'t load." copy via the `message` prop',
  )
})

test('MathManipulativesLab.tsx: the <GlbErrorBoundary> usage wraps <CupModel (the cup, not some other GLB consumer)', () => {
  const boundaryOpenIdx = src.search(/<GlbErrorBoundary\b/)
  assert.ok(boundaryOpenIdx !== -1, 'expected to find the GlbErrorBoundary opening tag')
  const boundaryCloseIdx = src.indexOf('</GlbErrorBoundary>', boundaryOpenIdx)
  assert.ok(boundaryCloseIdx !== -1, 'expected to find the matching </GlbErrorBoundary> closing tag')
  const between = src.slice(boundaryOpenIdx, boundaryCloseIdx)
  assert.match(
    between,
    /<CupModel/,
    'expected <CupModel to render inside <GlbErrorBoundary>...</GlbErrorBoundary>, not outside its crash-safety wrapping',
  )
  assert.match(
    between,
    /<Suspense fallback=\{<GlbLoadingStatus message="Loading measuring cup model…" \/>\}>/,
    'expected the Suspense fallback around CupModel to use the shared GlbLoadingStatus pill with the cup\'s loading copy',
  )
})

test('MathManipulativesLab.tsx: no bare inline `onRetry={() => setRetryKey(...)}` handler for the cup retry (would bypass useGlbRetry\'s cache clear)', () => {
  assert.doesNotMatch(
    src,
    /onRetry=\{\(\) => setRetryKey/,
    'found an inline `onRetry={() => setRetryKey(...)}` handler -- this bypasses useGlbRetry\'s useGLTF.clear(url) call and reintroduces the cached-rejection "Try again does nothing" bug',
  )
  // Also guard against a raw `useState(0)`-backed local retryKey being reintroduced for CupPanel
  // instead of going through the shared hook (the pre-fix shape this bug report described).
  assert.doesNotMatch(
    src,
    /const \[retryKey, setRetryKey\] = useState\(0\)/,
    'found a local `const [retryKey, setRetryKey] = useState(0)` -- CupPanel should get retryKey/retryLoad from the shared useGlbRetry hook instead of reimplementing its own state',
  )
})

test('MathManipulativesLab.tsx: CupModel still calls useGLTF(MEASURING_CUP_MODEL_URL) directly', () => {
  assert.match(
    src,
    /const \{ scene \} = useGLTF\(MEASURING_CUP_MODEL_URL\)/,
    'expected CupModel to still load the measuring-cup GLB via useGLTF(MEASURING_CUP_MODEL_URL)',
  )
})
