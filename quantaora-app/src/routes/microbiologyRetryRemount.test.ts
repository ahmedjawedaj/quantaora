import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Microbiology tasks (docs/reviews/wave16-microbiology.md,
// mirroring the already-guarded CrystalViewer.tsx fix at
// ../components/explorer/crystalRetryRemount.test.ts):
//
//  1. VirusRealStructureScene's "Try again" retry handler must actually bust the drei/suspend-
//     react module-level GLTF loader cache for the failed `url` before bumping the `retryKey`
//     state that remounts <GlbErrorBoundary>. As of the GLB-reliability unification wave, this is
//     no longer a locally reimplemented `retryLoad`/`useState(0)` pair -- MicrobiologyLab now
//     calls the shared `useGlbRetry(url)` hook (../components/explorer/useGlbRetry.ts), which owns
//     the clear-then-bump ordering itself (see ../components/explorer/glbRetryCacheClear.test.ts
//     for the hook-level regression guard on that ordering, shared by every migrated viewer). This
//     file only asserts MicrobiologyLab actually calls that hook and wires its output up as the
//     boundary's key/onRetry, rather than re-inlining a bare retryKey bump that would bypass it.
//  2. The error-boundary's fallback card must carry a mobile-specific offset (a `-translate-y-*`
//     class active at the default/mobile breakpoint, reset via `lg:translate-y-0` at desktop) so
//     it doesn't render centered on top of/under the bottom meter-chip row on mobile/tablet -- now
//     passed as the shared GlbErrorBoundary's `cardClassName` prop instead of being baked into a
//     locally-defined boundary's own render().
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/microbiologyRetryRemount.test.ts

const MICROBIOLOGY_LAB_PATH = fileURLToPath(new URL('./MicrobiologyLab.tsx', import.meta.url))
const src = readFileSync(MICROBIOLOGY_LAB_PATH, 'utf8')

test('MicrobiologyLab: VirusRealStructureScene uses the shared useGlbRetry hook (busts useGLTF cache for the active virus `url`), not a locally reimplemented retryKey bump', () => {
  assert.match(
    src,
    /import \{ useGlbRetry \} from '@\/components\/explorer\/useGlbRetry'/,
    'expected an import of the shared useGlbRetry hook',
  )
  assert.match(
    src,
    /const \{ retryKey, retryLoad \} = useGlbRetry\(url\)/,
    'expected `const { retryKey, retryLoad } = useGlbRetry(url)` inside VirusRealStructureScene',
  )
  assert.doesNotMatch(
    src,
    /const \[retryKey, setRetryKey\] = useState\(0\)/,
    'expected the locally reimplemented retryKey state to be gone now that useGlbRetry owns it',
  )
})

test('MicrobiologyLab: the retry-key is actually used in a remount key on <GlbErrorBoundary>, not just tracked and ignored', () => {
  // Non-greedy `[\s\S]*?` terminated by `\s+onRetry` (not a bare `\}`), since the key expression is
  // a template literal (`${url}-${retryKey}`) containing its own nested `}` characters a naive
  // `\}` would stop at prematurely -- same reasoning as crystalRetryRemount.test.ts.
  const keyPropMatch = src.match(/<GlbErrorBoundary\s+key=\{([\s\S]*?)\}\s+onRetry/)
  assert.ok(keyPropMatch, 'expected <GlbErrorBoundary> to carry a `key` prop derived from retryKey (so React actually remounts it, not just re-renders in place)')
  assert.match(
    keyPropMatch![1],
    /retryKey/,
    `expected the <GlbErrorBoundary> key expression to reference retryKey so it changes on every retry (got: ${keyPropMatch![1]})`,
  )
})

test('MicrobiologyLab: retryLoad (from the shared hook) is wired up as <GlbErrorBoundary>\'s onRetry (declared-and-used, not dead code)', () => {
  assert.match(
    src,
    /onRetry=\{retryLoad\}/,
    'expected <GlbErrorBoundary onRetry={retryLoad}> so the shared hook\'s cache-clearing retry handler is actually the one invoked by the "Try again" button',
  )
})

test('MicrobiologyLab: onGlbError is still wired up as <GlbErrorBoundary>\'s onError so the Tune panel can react to a failed load', () => {
  assert.match(
    src,
    /<GlbErrorBoundary\b[\s\S]{0,200}?onError=\{onGlbError\}/,
    'expected <GlbErrorBoundary onError={onGlbError}> preserved on the virus boundary usage',
  )
})

test('MicrobiologyLab: the error-boundary carries a mobile-specific vertical offset that lifts its card clear of the bottom meter-chip row, reset at the lg breakpoint', () => {
  // 2000-char window: the virus boundary's opening tag carries a long explanatory comment
  // (documenting the mobile-safe offset fix) between its props, matching the generous windows
  // glbSafetyAudit.test.ts/labGlbErrorStatusAnnouncement.test.ts use elsewhere in this suite.
  const boundaryMatch = src.match(/<GlbErrorBoundary\b[\s\S]{0,2000}?>/)
  assert.ok(boundaryMatch, 'expected a <GlbErrorBoundary ...> opening tag')
  const boundaryProps = boundaryMatch![0]

  const cardClassNameMatch = boundaryProps.match(/cardClassName="([^"]*)"/)
  assert.ok(cardClassNameMatch, 'expected the virus <GlbErrorBoundary> to pass a `cardClassName` prop')
  const className = cardClassNameMatch![1]

  assert.match(
    className,
    /-translate-y-\d+/,
    'expected cardClassName to carry a `-translate-y-*` class active at the default/mobile breakpoint, lifting the error card clear of the bottom meter-chip row -- a card that is simply centered with no mobile-safe offset would render on top of/under the collapsed meter chips on mobile/tablet',
  )
  assert.match(
    className,
    /lg:translate-y-0/,
    'expected the mobile `-translate-y-*` offset to be reset via `lg:translate-y-0` at the lg breakpoint, so desktop (where the chip row never reaches this high) keeps its original centered position',
  )

  assert.match(
    boundaryProps,
    /zIndexRange=\{\[1000, 900\]\}/,
    'expected the virus <GlbErrorBoundary> to keep its zIndexRange stacking priority over the floating Tune panel chips',
  )
})
