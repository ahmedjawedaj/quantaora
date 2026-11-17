import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard: the hero's 3D scene (@react-three/fiber + drei + three) previously loaded
// synchronously inside Hero.tsx, so the browser had to parse/execute that heavy bundle before
// React could paint the headline/CTA at all -- a ~2-3s blank hero on cold load. The fix is to
// code-split the scene behind React.lazy + Suspense (with a non-blocking fallback) so headline
// text/CTA/nav render immediately, and to thread a reducedMotion flag into the scene so
// prefers-reduced-motion users don't get the continuous orbit/float/pointer-parallax animation.
//
// This is a static source-text heuristic (see mobileSwitcherAffordance.test.ts for why this repo
// has no jsdom/RTL render harness), not a real render/perf test.

function componentPath(fileName: string): string {
  return fileURLToPath(new URL(`./${fileName}`, import.meta.url))
}

test('Hero.tsx: lazy-loads HeroScene behind Suspense with a non-blocking fallback', () => {
  const source = readFileSync(componentPath('Hero.tsx'), 'utf8')
  assert.match(source, /lazy\(\(\)\s*=>\s*import\(['"]\.\/HeroScene['"]\)\)/, 'HeroScene must be React.lazy-imported, not statically imported')
  assert.doesNotMatch(source, /^import HeroScene from ['"]\.\/HeroScene['"]/m, 'HeroScene must not also be statically imported')
  assert.match(source, /<Suspense fallback=/, 'HeroScene must be mounted inside a <Suspense> with a fallback')
  assert.match(source, /function HeroSceneFallback/, 'expected a dedicated fallback component for the loading state')
})

test('Hero.tsx: headline, CTAs, and next-section hint are not gated behind the scene Suspense boundary', () => {
  const source = readFileSync(componentPath('Hero.tsx'), 'utf8')
  const suspenseCloseIdx = source.indexOf('</Suspense>')
  assert.ok(suspenseCloseIdx !== -1, 'expected a closing </Suspense> tag')
  const afterSuspense = source.slice(suspenseCloseIdx)
  assert.match(afterSuspense, /See science/, 'headline must render outside the scene Suspense boundary')
  assert.match(afterSuspense, /to="\/first-flight"/, 'primary CTA route must be preserved outside the Suspense boundary')
  assert.match(afterSuspense, /to="\/app\/labs\/atoms"/, 'secondary CTA route must be preserved outside the Suspense boundary')
  assert.match(afterSuspense, /href="#studio"/, 'next-section scroll hint must render outside the Suspense boundary')
})

test('Hero.tsx: passes a reducedMotion flag derived from useReducedMotion into HeroScene', () => {
  const source = readFileSync(componentPath('Hero.tsx'), 'utf8')
  assert.match(source, /useReducedMotion/, 'expected framer-motion useReducedMotion to be used')
  assert.match(source, /<HeroScene reducedMotion=/, 'HeroScene must receive a reducedMotion prop')
})

test('HeroScene.tsx: accepts reducedMotion and gates continuous animation on it', () => {
  const source = readFileSync(componentPath('HeroScene.tsx'), 'utf8')
  assert.match(source, /reducedMotion\??:\s*boolean/, 'expected a reducedMotion boolean prop somewhere in the scene')
  assert.match(source, /if \(reducedMotion\)|reducedMotion\s*\?\s*|reducedMotion \? nucleus/, 'expected animation logic to branch on reducedMotion')
  assert.match(source, /speed=\{reducedMotion \? 0 : [\d.]+\}/, 'Sparkles motion speed should be zeroed for reducedMotion')
})
