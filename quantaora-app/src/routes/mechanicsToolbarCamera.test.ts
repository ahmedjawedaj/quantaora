import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for Wave 11 Worker 5's task (Wave 10 finding): PhysicsLab's toolbar Zoom
// In/Zoom Out/Fit/Reset buttons only called `setCameraDistance(...)`, updating React state that
// nothing ever read back into the live <OrbitControls> -- so drei's OrbitControls silently
// overwrote the camera position on the very next frame and the buttons visibly did nothing. A
// real fix drives the live camera imperatively (a ref to the OrbitControls instance / the
// underlying THREE.Camera, called directly from the handler or from an effect keyed on the state),
// not purely a `setState` call with no corresponding ref-driven side effect.
//
// Matches ../routes/perModelCameraConfig.test.ts's pure/static source-text style -- no
// jsdom/WebGL in this repo's test setup (see ../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/routes/mechanicsToolbarCamera.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const physicsLabSrc = readFileSync(srcPath('./PhysicsLab.tsx'), 'utf8')

/** Grabs the JSX prop value for a given CanvasControls prop name (e.g. onZoomIn={...}), handling
 *  one level of nested braces/parens in the handler body, which is enough for the
 *  single-expression arrow-function handlers this route uses. */
function extractPropHandler(source: string, propName: string): string | null {
  const propIdx = source.indexOf(`${propName}={`)
  if (propIdx === -1) return null
  const start = propIdx + propName.length + 1 // position of the opening '{'
  let depth = 0
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1
    else if (source[i] === '}') {
      depth -= 1
      if (depth === 0) return source.slice(start, i + 1)
    }
  }
  return null
}

/** Given a `const name = (...) => { ... }` or `function name(...) { ... }` declaration anywhere
 *  in `source`, returns its full brace-balanced body text, or null if no such declaration exists
 *  (e.g. the handler prop was an inline arrow function, not a reference to a named one). */
function findNamedFunctionBody(source: string, name: string): string | null {
  const declPatterns = [
    new RegExp(`const\\s+${name}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*(?::[^={]+)?=>\\s*\\{`),
    new RegExp(`function\\s+${name}\\s*\\([^)]*\\)\\s*\\{`),
  ]
  for (const pattern of declPatterns) {
    const match = source.match(pattern)
    if (!match) continue
    const braceStart = match.index! + match[0].length - 1 // position of the opening '{'
    let depth = 0
    for (let i = braceStart; i < source.length; i += 1) {
      if (source[i] === '{') depth += 1
      else if (source[i] === '}') {
        depth -= 1
        if (depth === 0) return source.slice(braceStart, i + 1)
      }
    }
  }
  return null
}

/** Refs already known, independent of any camera-toolbar fix, to belong to the *physics
 *  simulation* (mass/slope/gravity, race state, prediction state) rather than the camera --
 *  excluded when scanning the whole file so a match against one of these can't produce a false
 *  pass for the file-wide fallback check below (a scoped single-handler-body check doesn't need
 *  this exclusion, since it's already narrow). */
const NON_CAMERA_REF_NAMES = new Set(['simRef', 'simBRef', 'predictionRef', 'controlsRef', 'groupRef'])

/** True if `body` reads a ref's `.current` at all (e.g. `const orbit = orbitControlsRef.current`,
 *  which is then used a few lines later, not necessarily chained inline as
 *  `orbitControlsRef.current.someMethod()`) -- broad on purpose, since this repo's actual fix
 *  style assigns `.current` to a local variable before calling imperative methods on it. Pass
 *  `excludeKnownNonCameraRefs: true` when scanning the whole file (not a single handler's own
 *  body) to avoid matching the pre-existing, unrelated physics-simulation refs. */
function readsAnyRefCurrent(body: string, options: { excludeKnownNonCameraRefs?: boolean } = {}): boolean {
  const matches = [...body.matchAll(/\b(\w+Ref)\.current\b/g)]
  return matches.some((match) => !options.excludeKnownNonCameraRefs || !NON_CAMERA_REF_NAMES.has(match[1]))
}

test('PhysicsLab: an OrbitControls/camera ref exists that is distinct from the physics-simulation `controls` state ref', () => {
  // PhysicsLab.tsx also happens to have a `controlsRef` that mirrors *physics simulation*
  // controls (mass/slope/gravity) inside the race-loop tick() callback -- that is NOT the OrbitControls
  // camera ref this test is about, and a naive `/controlsRef/` grep would false-positive on it.
  // A real fix needs a ref actually pointing at the r3f <OrbitControls> instance or the THREE
  // camera (commonly named something like orbitControlsRef/cameraControlsRef, or the OrbitControls
  // JSX element carrying a `ref={...}` prop at all -- today's OrbitControls element in this file
  // has no ref).
  const orbitControlsElementMatch = physicsLabSrc.match(/<OrbitControls\b[^>]*>/)
  assert.ok(orbitControlsElementMatch, 'expected PhysicsLab.tsx to still render an <OrbitControls> element')

  const hasRefOnElement = /\bref=\{/.test(orbitControlsElementMatch![0])
  // Name-agnostic: accept any *Ref identifier explicitly typed against OrbitControls/THREE.Camera
  // (a real camera ref, whatever it's called -- including a same-named `controlsRef` reused for
  // this purpose, as long as it's genuinely typed/used as the camera ref and not just the existing
  // physics-simulation controls mirror), or a conventionally-named camera/orbit-controls ref.
  const hasTypedCameraRef = /useRef<[^>]*(?:OrbitControls|THREE\.Camera|PerspectiveCamera)/.test(physicsLabSrc)
  const hasNamedCameraRef = /\b(?:orbitControlsRef|cameraControlsRef|orbitRef|cameraRef)\b/.test(physicsLabSrc)

  assert.ok(
    hasRefOnElement || hasTypedCameraRef || hasNamedCameraRef,
    'expected either the <OrbitControls> JSX element to carry a ref prop, a ref explicitly typed as OrbitControls/THREE.Camera, or a conventionally-named camera/orbit-controls ref (e.g. orbitControlsRef) elsewhere in PhysicsLab.tsx -- found none, meaning nothing can imperatively drive the live camera from the toolbar handlers (Wave 10 finding: buttons update state that OrbitControls silently overrides every frame)',
  )
})

for (const [propName, label] of [
  ['onZoomIn', 'Zoom In'],
  ['onZoomOut', 'Zoom Out'],
  ['onFitView', 'Fit'],
  ['onReset', 'Reset'],
] as const) {
  test(`PhysicsLab: ${label} toolbar handler is wired to more than a bare setState (imperative camera ref call, directly or via a named handler function)`, () => {
    const rawHandlerRef = extractPropHandler(physicsLabSrc, propName)
    assert.ok(rawHandlerRef, `expected to find a ${propName}={...} prop passed to CanvasControls in PhysicsLab.tsx`)

    // The prop value is either a bare identifier referencing a named handler declared elsewhere
    // in the file (e.g. `onZoomIn={zoomIn}`), or an inline arrow function
    // (e.g. `onZoomIn={() => setCameraDistance(...)}`). Follow the former to its real definition
    // before checking for ref usage, since the interesting logic lives there, not at the JSX
    // reference site.
    const bareNameMatch = rawHandlerRef!.match(/^\{\s*(\w+)\s*\}$/)
    const inspectedBody = bareNameMatch ? findNamedFunctionBody(physicsLabSrc, bareNameMatch[1]) ?? rawHandlerRef! : rawHandlerRef!

    if (readsAnyRefCurrent(inspectedBody)) {
      // The handler (or the named function it refers to) itself reads an imperative ref's
      // `.current` -- e.g. `const orbit = orbitControlsRef.current` -- directly satisfying the
      // fix, regardless of whether it then chains a method inline or via a local variable.
      return
    }

    // Otherwise, the handler is allowed to be a plain setState call IF a separate effect
    // elsewhere in the file reacts to that same state and imperatively drives a ref's
    // OrbitControls/camera method -- i.e. the ref-driven side effect just isn't inlined into (or
    // directly reachable from) the button handler itself.
    const hasRefCurrentReadAnywhere = readsAnyRefCurrent(physicsLabSrc, { excludeKnownNonCameraRefs: true })
    assert.ok(
      hasRefCurrentReadAnywhere,
      `expected the ${propName} handler (or the named function \`${bareNameMatch?.[1] ?? '(inline)'}\` it references, or a state effect it feeds) to read an imperative camera/OrbitControls ref's \`.current\` somewhere in PhysicsLab.tsx, not purely update React state with no corresponding imperative side effect -- handler prop value: ${rawHandlerRef}`,
    )
  })
}
