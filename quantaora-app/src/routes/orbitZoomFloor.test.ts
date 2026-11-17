import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this wave's Orbit task: "zoom floor so Saturn's rings stay fully visible."
// OrbitSandbox.tsx's live CameraFit already recomputes the *default/refit* camera distance from
// each ringed body's real geometry (see computeRequiredCameraDistance / RING_OUTER_MULTIPLIER,
// guarded by ../routes/perModelCameraConfig.test.ts and ../routes/orbitPostSelectionFit.test.ts),
// but as read at the start of this wave the native <OrbitControls minDistance={4}> floor is a
// bare fixed literal -- explicitly called out in this file's own comment as unchanged by the
// ring-fit work ("minDistance (4) is unchanged, so Zoom In behavior is unaffected"). That means a
// learner can still manually zoom/scroll past the point where Saturn's rings clip the frustum,
// regardless of how good the auto-fit is on selection change. A real fix ties the zoom floor to
// the selected body's own ring/framing extent (e.g. via bodyFramingExtent/RING_OUTER_MULTIPLIER),
// not a single constant shared by every body.
//
// Static source-text checks only, matching this repo's plain node:test + native TS
// type-stripping convention (no jsdom/WebGL harness -- see ./BranchLab.test.ts's own comment on
// why). Expected to be RED until the Orbit sibling agent's fix lands this wave -- that's correct,
// not a bug in this test (see ./mobileSwitcherAffordance.test.ts for the established precedent of
// writing a test correct and letting it stay red until the owning fix lands).
//
// Run with: node --test src/routes/orbitZoomFloor.test.ts

const ORBIT_SANDBOX_PATH = fileURLToPath(new URL('../components/explorer/OrbitSandbox.tsx', import.meta.url))
const orbitSandboxSrc = readFileSync(ORBIT_SANDBOX_PATH, 'utf8')

test('OrbitSandbox: RING_OUTER_MULTIPLIER / bodyFramingExtent (ring-aware sizing) still exists as the source of truth for how far a ringed body\'s rings extend', () => {
  // Sanity check this isn't accidentally passing the next test by coincidence -- the ring-extent
  // data a real zoom-floor fix would need must still be present.
  assert.match(
    orbitSandboxSrc,
    /RING_OUTER_MULTIPLIER/,
    'expected OrbitSandbox.tsx to still define RING_OUTER_MULTIPLIER (or equivalent ring-extent sizing), the raw material any per-body zoom floor would need',
  )
})

test('OrbitSandbox: the live <OrbitControls> minDistance is not a single fixed literal shared by every body (Saturn ring over-zoom)', () => {
  const minDistanceMatch = orbitSandboxSrc.match(/<OrbitControls\b[\s\S]{0,400}?minDistance=\{([^}]+)\}/)
  assert.ok(minDistanceMatch, 'expected the live scene\'s <OrbitControls> element to still carry a minDistance prop')
  const minDistanceExpr = minDistanceMatch![1].trim()

  const isBareNumericLiteral = /^-?\d+(\.\d+)?$/.test(minDistanceExpr)
  assert.ok(
    !isBareNumericLiteral,
    `expected <OrbitControls minDistance={...}> to be driven by a body-aware computation (referencing the selected body's ring/framing extent, e.g. via RING_OUTER_MULTIPLIER/bodyFramingExtent), not the bare fixed literal it evaluated to today (minDistance={${minDistanceExpr}}) -- a fixed floor lets a learner zoom in close enough for Saturn's rings to clip the frustum regardless of the live auto-fit`,
  )
})

test('OrbitSandbox: if a dedicated zoom-floor helper exists, it is actually derived from ring/framing extent (not an unrelated unused function)', () => {
  // Accept either shape: (a) the minDistance expression itself references a ring-aware
  // identifier directly (already covered by the previous test failing to be a bare literal), or
  // (b) a named helper (e.g. computeZoomFloor/minDistanceForBody) exists that takes the selected
  // body/its ring extent as input and is actually invoked, not just declared.
  const helperDecl = orbitSandboxSrc.match(/function\s+(\w*(?:[Zz]oom[Ff]loor|[Mm]in[Dd]istance)\w*)\s*\(([^)]*)\)/)
  if (!helperDecl) {
    // No dedicated helper -- rely entirely on the previous test's inline-expression check, which
    // already covers this case. Nothing further to assert here.
    return
  }
  const [, fnName, params] = helperDecl
  assert.ok(params.trim().length > 0, `expected ${fnName} to take at least one parameter (the selected body or its ring extent), not return a constant regardless of input`)
  const callSites = orbitSandboxSrc.match(new RegExp(`${fnName}\\s*\\(`, 'g')) ?? []
  assert.ok(callSites.length >= 2, `expected ${fnName} to actually be called (at the minDistance call site), not just declared`)
})
