import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for Wave 8 QA finding (docs/reviews/wave8-crystals-branchlab.md):
// ContentNav's "Other branches of <subject>" list showed a badge literally reading
// "Needs sourcing" for any locked/not-yet-built branch -- internal asset-sourcing-pipeline
// vocabulary leaking into learner-facing UI (confirmed live on every BranchLab route with a
// non-live sibling branch). Code path flagged: ContentNav.tsx's `b.status === 'authored-pending'
// ? 'Not built yet' : 'Needs sourcing'` ternary.
//
// This is a plain source-text scan (not a render test): the project has no React Testing
// Library / jsdom dependency installed (see package.json), and this file's only user-facing
// strings are static JSX literals, so scanning the compiled-away-free .tsx source text is a
// faithful proxy for "does this ever render to the DOM" -- same lightweight approach as this
// package's other tests (see ../../routes/BranchLab.test.ts), which use node:test + native TS
// type-stripping instead of a bundler-based test runner.
//
// Run with: node --test src/components/explorer/ContentNav.test.ts

const CONTENT_NAV_PATH = fileURLToPath(new URL('./ContentNav.tsx', import.meta.url))

// Internal-pipeline vocabulary that must never leak into shipped UI copy. Matched
// case-insensitively as plain substrings against the raw source text.
const BANNED_INTERNAL_COPY = ['Needs sourcing', 'sourcing pipeline', 'sourcing incomplete', 'NC-RISK', 'pending legal', 'TODO']

test('ContentNav.tsx contains no internal asset-sourcing-pipeline vocabulary in its source (Wave 8 regression guard)', () => {
  const source = readFileSync(CONTENT_NAV_PATH, 'utf8')
  for (const banned of BANNED_INTERNAL_COPY) {
    assert.ok(
      !source.toLowerCase().includes(banned.toLowerCase()),
      `ContentNav.tsx source contains banned internal-pipeline copy "${banned}" -- this must never reach a learner-facing badge/label (see docs/reviews/wave8-crystals-branchlab.md)`,
    )
  }
})

test('ContentNav.tsx still renders a learner-safe label for non-live sibling branches', () => {
  const source = readFileSync(CONTENT_NAV_PATH, 'utf8')
  // Sanity check that the locked-branch badge still exists at all (i.e. this test isn't
  // trivially passing because the whole branch-status badge was deleted rather than fixed).
  assert.match(source, /status === 'authored-pending'/, 'expected the non-live branch status ternary to still exist in ContentNav.tsx')
})
