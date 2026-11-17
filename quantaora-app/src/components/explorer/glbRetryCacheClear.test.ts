import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Wave 17 audit: every *Viewer.tsx in this directory that wraps a useGLTF-calling *Model.tsx in a
// local `GlbErrorBoundary` with a `retryKey`-bump "Try again" handler had the exact same
// cached-rejection bug CrystalViewer.tsx was fixed for (see ./crystalRetryRemount.test.ts and
// CrystalViewer.tsx's `retryLoad` comment): drei's useGLTF is built on suspend-react's
// module-level load cache, keyed by [Loader, url]. A failed fetch permanently caches the
// rejection, so remounting via a React `key` change alone still hits the same stale rejected
// cache entry and re-renders the same error card with zero new network activity.
//
// GenericViewer.tsx, CellViewer.tsx, OrganViewer.tsx, and StarViewer.tsx all independently
// reimplemented this same buggy shape (`onRetry={() => setRetryKey((k) => k + 1)}` with no cache
// eviction). Fixed here by extracting a single shared `useGlbRetry(url)` hook (./useGlbRetry.ts)
// that calls `useGLTF.clear(url)` before bumping the retry key — reusing CrystalViewer's own
// originally-established pattern instead of reinventing a fourth near-identical copy — and
// switching all four viewers to call it. CrystalViewer.tsx itself was later migrated onto the same
// shared hook too (see ./crystalRetryRemount.test.ts), so it's included below alongside the other
// four. This is a regression guard (expected GREEN): if a future edit reintroduces a bare retryKey
// bump without going through useGlbRetry, this should fail.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/components/explorer/glbRetryCacheClear.test.ts

function readSrc(relativePath: string): string {
  const path = fileURLToPath(new URL(relativePath, import.meta.url))
  return readFileSync(path, 'utf8')
}

const HOOK_SRC = readSrc('./useGlbRetry.ts')

test('useGlbRetry.ts: the shared retry hook itself calls useGLTF.clear(url) before bumping retryKey', () => {
  assert.match(
    HOOK_SRC,
    /export function useGlbRetry\(/,
    'expected useGlbRetry.ts to export a useGlbRetry(...) hook',
  )
  const bodyMatch = HOOK_SRC.match(/const retryLoad = \(\) => \{([\s\S]*?)\n\s*\}/)
  assert.ok(bodyMatch, 'expected a `const retryLoad = () => { ... }` function body in useGlbRetry.ts')
  assert.match(
    bodyMatch![1],
    /useGLTF\.clear\(url\)/,
    'expected retryLoad to call useGLTF.clear(url) so a failed load\'s cache entry is evicted before the remount',
  )
  assert.match(
    bodyMatch![1],
    /setRetryKey\(\s*\(?k\)? => k \+ 1\)?\)/,
    'expected retryLoad to also bump retryKey so the boundary/model subtree actually remounts',
  )
})

/** Asserts `viewerRelativePath` imports `useGlbRetry` from the shared hook file, destructures
 *  `retryKey`/`retryLoad` from calling it, and wires `retryLoad` (not an inline no-cache-clear
 *  arrow function) up as the `<GlbErrorBoundary onRetry={...}>` handler. */
function assertUsesSharedRetryHook(viewerRelativePath: string, label: string) {
  const src = readSrc(viewerRelativePath)

  assert.match(
    src,
    /import \{ useGlbRetry \} from '\.\/useGlbRetry'/,
    `${label}: expected an import of the shared useGlbRetry hook`,
  )
  assert.match(
    src,
    /const \{ retryKey, retryLoad \} = useGlbRetry\(/,
    `${label}: expected \`const { retryKey, retryLoad } = useGlbRetry(...)\` to be called`,
  )
  // Non-greedy `[\s\S]*?` (not `[^}]*`) because a couple of these key expressions are template
  // literals (e.g. `` `${star.id}-${retryKey}` ``) containing their own nested `}` characters that
  // a naive `[^}]*` would stop at prematurely -- same reasoning as crystalRetryRemount.test.ts.
  const keyPropMatch = src.match(/<GlbErrorBoundary\s+key=\{([\s\S]*?)\}\s+onRetry=\{(\w+)\}/)
  assert.ok(
    keyPropMatch,
    `${label}: expected <GlbErrorBoundary key={...} onRetry={...}> with both props present`,
  )
  assert.match(
    keyPropMatch![1],
    /retryKey/,
    `${label}: expected the <GlbErrorBoundary> key expression to reference retryKey so it changes on every retry (got: ${keyPropMatch![1]})`,
  )
  assert.equal(
    keyPropMatch![2],
    'retryLoad',
    `${label}: expected <GlbErrorBoundary onRetry={retryLoad}> to wire the shared hook's output up as the actual retry handler (not a re-inlined bare retryKey bump), got onRetry={${keyPropMatch![2]}}`,
  )
  // Guard against a regression where a *second*, bare `setRetryKey((k) => k + 1)` inline handler
  // creeps back in alongside (or instead of) `retryLoad`.
  assert.doesNotMatch(
    src,
    /onRetry=\{\(\) => setRetryKey/,
    `${label}: found an inline \`onRetry={() => setRetryKey(...)}\` handler -- this bypasses useGlbRetry's useGLTF.clear(url) call and reintroduces the cached-rejection "Try again does nothing" bug`,
  )
}

test('GenericViewer.tsx: "Try again" uses the shared useGlbRetry hook (busts useGLTF cache for `url`)', () => {
  assertUsesSharedRetryHook('./GenericViewer.tsx', 'GenericViewer.tsx')
})

test('CellViewer.tsx: "Try again" uses the shared useGlbRetry hook (busts useGLTF cache for the active `modelUrl`)', () => {
  assertUsesSharedRetryHook('./CellViewer.tsx', 'CellViewer.tsx')
})

test('OrganViewer.tsx: "Try again" uses the shared useGlbRetry hook (busts useGLTF cache for `model`)', () => {
  assertUsesSharedRetryHook('./OrganViewer.tsx', 'OrganViewer.tsx')
})

test('StarViewer.tsx: "Try again" uses the shared useGlbRetry hook (busts useGLTF cache for `star.model` when GLB-backed)', () => {
  assertUsesSharedRetryHook('./StarViewer.tsx', 'StarViewer.tsx')
})

test('CrystalViewer.tsx: "Try again" uses the shared useGlbRetry hook (busts useGLTF cache for `url`)', () => {
  assertUsesSharedRetryHook('./CrystalViewer.tsx', 'CrystalViewer.tsx')
})
