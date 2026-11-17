import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard: entrance wrappers previously started at opacity: 0 with staggered delays
// (up to 1s), so a screenshot taken immediately after navigation showed a blank hero -- only the
// HeroScene fallback circle painted -- even though the DOM text existed. Fix: entrance() only
// ever animates transforms (never opacity), so critical content is opacity: 1 on the first frame
// in both normal and reduced-motion modes. This is a static source-text heuristic, not a real
// render/perf test (see heroSceneLazyLoad.test.ts for why).

function heroSource(): string {
  return readFileSync(fileURLToPath(new URL('./Hero.tsx', import.meta.url)), 'utf8')
}

test('Hero.tsx: entrance() never sets initial/animate opacity to 0', () => {
  const source = heroSource()
  assert.doesNotMatch(source, /opacity:\s*0/, 'no wrapper may start or animate through opacity 0')
  assert.doesNotMatch(source, /entrance\(\{[^}]*opacity/, 'entrance() must not be passed an opacity key at all')
})

test('Hero.tsx: entrance() helper only animates transforms, never opacity', () => {
  const source = heroSource()
  const helperMatch = source.match(/const entrance = \(transform: Record<string, number>\) => \(\{[\s\S]*?\}\)/)
  assert.ok(helperMatch, 'expected an entrance(transform) helper')
  assert.doesNotMatch(helperMatch[0], /opacity/, 'entrance() implementation must not reference opacity')
})
