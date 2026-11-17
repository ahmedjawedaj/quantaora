import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Ecology task: EcologyLab.tsx's SupportGlb sites (the dimmed
// background "ecosystem.glb" and "producer.glb" dressing models) are separate mount points from
// DecomposerMushroomHero, which already had GlbErrorBoundary + accessible status/alert
// announcements protection *before* this wave. This test targets the SupportGlb sites
// specifically, guarding that they got the same treatment this wave rather than assuming the
// pre-existing DecomposerMushroomHero coverage extends to them.
//
// Repo convention for this pattern (see DecomposerStatusAnnouncement / GlbErrorBoundary /
// DecomposerMushroomHero in EcologyLab.tsx, and the analogous MoonModel.tsx /
// crystalGlbErrorBoundary.test.ts precedent): a `role="status" aria-live="polite"` element while
// the GLB streams in (via <Suspense fallback={...}>), and a `role="alert"` element if the GLB
// load throws (via a <GlbErrorBoundary> class component's fallback prop).
//
// As read at the time this test was written, both SupportGlb sites in EcologyLab.tsx are already
// wrapped in <GlbErrorBoundary> (alert fallback) + <Suspense> (status fallback) using the shared
// DecomposerStatusAnnouncement component, so this test is a regression guard (expected GREEN),
// not a red guard for in-flight work. If a future edit strips that wrapping from either GLB site,
// this test should fail.
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/WebGL/R3F-render harness -- see ./BranchLab.test.ts's own
// comment on why).
//
// Run with: node --test src/routes/ecologySupportGlbErrorStatus.test.ts

const ECOLOGY_LAB_PATH = fileURLToPath(new URL('./EcologyLab.tsx', import.meta.url))
const ecologyLabSrc = readFileSync(ECOLOGY_LAB_PATH, 'utf8')

const SUPPORT_GLB_URLS = [
  '/models/biology/ecology/ecosystem.glb',
  '/models/biology/ecology/producer.glb',
]

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The <GlbErrorBoundary key="...">...</GlbErrorBoundary> block keyed to a given GLB url. */
function boundaryBlockFor(url: string): string {
  const keyIdx = ecologyLabSrc.indexOf(`key="${url}"`)
  assert.ok(keyIdx !== -1, `expected a <GlbErrorBoundary key="${url}"> in EcologyLab.tsx`)
  const openIdx = ecologyLabSrc.lastIndexOf('<GlbErrorBoundary', keyIdx)
  assert.ok(openIdx !== -1, `expected an opening <GlbErrorBoundary tag before the key="${url}" attribute`)
  const closeIdx = ecologyLabSrc.indexOf('</GlbErrorBoundary>', keyIdx)
  assert.ok(closeIdx !== -1, `expected a closing </GlbErrorBoundary> after the key="${url}" attribute`)
  return ecologyLabSrc.slice(openIdx, closeIdx + '</GlbErrorBoundary>'.length)
}

for (const url of SUPPORT_GLB_URLS) {
  test(`EcologyLab.tsx: SupportGlb site for ${url} is wrapped in a GlbErrorBoundary with an accessible alert fallback`, () => {
    const block = boundaryBlockFor(url)
    assert.match(
      block,
      /fallback=\{<DecomposerStatusAnnouncement role="alert"/,
      `expected the GlbErrorBoundary around ${url} to render a DecomposerStatusAnnouncement role="alert" fallback if the GLB fails to load, matching the DecomposerMushroomHero precedent`,
    )
    assert.match(
      block,
      new RegExp(`<SupportGlb url="${escapeRegex(url)}"`),
      `expected the ${url} GlbErrorBoundary block to actually wrap the SupportGlb usage for that url, not just be defined nearby unused`,
    )
  })

  test(`EcologyLab.tsx: SupportGlb site for ${url} shows an accessible loading status while the GLB streams in`, () => {
    const block = boundaryBlockFor(url)
    assert.match(
      block,
      /<Suspense fallback=\{<DecomposerStatusAnnouncement role="status"/,
      `expected a <Suspense fallback={<DecomposerStatusAnnouncement role="status" .../>}> around the SupportGlb(${url}) mesh so a learner on a slow connection gets an accessible "loading" announcement instead of a silent gap, matching the role="status" aria-live="polite" pattern used elsewhere in this file`,
    )
  })
}

test('DecomposerStatusAnnouncement renders role="status" with aria-live="polite" while loading and a bare role="alert" on error (sanity check for the shared component both SupportGlb sites depend on)', () => {
  const fnIdx = ecologyLabSrc.indexOf('function DecomposerStatusAnnouncement')
  assert.ok(fnIdx !== -1, 'expected DecomposerStatusAnnouncement to still be defined in EcologyLab.tsx')
  const body = ecologyLabSrc.slice(fnIdx, fnIdx + 600)
  assert.match(
    body,
    /aria-live=\{role === 'status' \? 'polite' : undefined\}/,
    'expected DecomposerStatusAnnouncement to only set aria-live="polite" for the loading (status) role, not the error (alert) role -- alerts are announced assertively by role="alert" alone',
  )
})
