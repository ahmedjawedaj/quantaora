import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for Wave 11 Worker 1's task: SpaceLab/OrbitSandbox/PlanetModel P0 findings
// that Saturn's rings clip the canvas and Neptune renders off-canvas because the scene's camera
// framing was never recomputed after the initial mount -- it only reacted to explicit user zoom
// (the `cameraDistance` prop) and to the canvas's aspect ratio, never to which body is actually
// selected or to that body's real measured bounds once its GLB has loaded. This continues the
// Wave 8 Saturn-ring precedent documented at the top of ../routes/perModelCameraConfig.test.ts
// (that fix made the fit aspect-ratio-aware; this one is about making it *live-selection* and
// *live-bounds* aware, not just aspect-aware).
//
// Static source-text checks only -- no jsdom/WebGL in this repo's test setup (see
// ../routes/BranchLab.test.ts's own comment on why). These assert the *shape* of a real fix
// (recompute keyed off selection/load, ideally from measured bounds) rather than rendering the
// scene or asserting exact pixel framing.
//
// Run with: node --test src/routes/orbitPostSelectionFit.test.ts

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const orbitSandboxSrc = readFileSync(srcPath('../components/explorer/OrbitSandbox.tsx'), 'utf8')
const planetModelSrc = readFileSync(srcPath('../components/explorer/PlanetModel.tsx'), 'utf8')
const spaceLabSrc = readFileSync(srcPath('./SpaceLab.tsx'), 'utf8')

test('OrbitSandbox: default camera framing is not a single fixed worst-case literal reused unconditionally, but a computation taking a live input', () => {
  // The old bug pattern (Wave 6, corrected in Wave 8/9) was a bare numeric literal
  // (DEFAULT_CAMERA_DISTANCE = 11) used for every frame regardless of anything about the live
  // scene. The current/expected shape is a named computation function that a) takes at least one
  // parameter (aspect ratio, and/or the live selected body / its measured bounds) and b) is
  // actually invoked at the call site that sets the live camera position, not just defined and
  // left unused while a bare literal is used instead.
  const fitFnDecl = orbitSandboxSrc.match(/function\s+(\w*(?:[Cc]amera|[Ff]it|[Ff]ram\w*)\w*)\s*\(([^)]*)\)/)
  assert.ok(
    fitFnDecl,
    'expected OrbitSandbox.tsx to define a camera-fit/framing computation function (e.g. computeRequiredCameraDistance), not just a bare fixed-distance constant',
  )
  const [, fnName, params] = fitFnDecl!
  assert.ok(
    params.trim().length > 0,
    `expected ${fnName} to take at least one live parameter (aspect ratio and/or selection/bounds), not be a zero-argument function that always returns the same worst-case literal`,
  )

  // It must actually be called somewhere the live camera position is set (not just exported and
  // unused elsewhere) -- i.e. the function name appears applied as a call, more than once (once
  // for its own def line already matched above, so require a *second* occurrence = a real call site).
  const callSites = orbitSandboxSrc.match(new RegExp(`${fnName}\\s*\\(`, 'g')) ?? []
  assert.ok(
    callSites.length >= 2,
    `expected ${fnName} to be invoked at a real camera-position call site in OrbitSandbox.tsx, not just declared`,
  )
})

test('OrbitSandbox/SpaceLab: camera fit recomputes on selection change and/or after a body settles, not only on manual zoom/aspect change (Neptune off-canvas / Saturn ring regression)', () => {
  // Accept any of three real-fix shapes, per the Wave 11 task brief:
  //  (a) a useEffect (or equivalent reactive hook) whose dependency array includes the selected
  //      body id (e.g. `selectedId`) DIRECTLY, so the fit recomputes every time the user picks a
  //      new body -- not only when they manually zoom or the canvas resizes; or
  //  (b) the same, but indirectly: a component/function that receives `selectedId` and uses it
  //      inside a memoized callback (useCallback) which a useEffect/useFrame elsewhere in that
  //      same component depends on/calls -- functionally identical reactivity to (a), just one
  //      level of indirection through the memoized function's own identity/closure, which is a
  //      common and valid React shape for this (this is what Worker 1 actually landed: a
  //      `CameraFit` component taking `selectedId` as a prop, computing required distance via a
  //      `computeRequired = useCallback(..., [aspect, selectedId, camera, positionsRef])`, then
  //      both a `useEffect` and a `useFrame` in that same component call `computeRequired()` and
  //      set `camera.position` from its result); or
  //  (c) a bounds-based fit derived from the body's *actual measured geometry* (a THREE.Box3 or
  //      THREE.Sphere computed from the real loaded model/scene), which is inherently correct per
  //      body regardless of selection timing, rather than a hand-derived trig formula assuming a
  //      single worst-case ring geometry.
  const combinedSrc = `${orbitSandboxSrc}\n${spaceLabSrc}`

  // (a) useEffect(...) whose deps array (the last bracketed group before the closing paren of the
  // useEffect call) mentions selectedId directly.
  const useEffectBlocks = combinedSrc.match(/useEffect\([\s\S]*?\[[^\]]*\]\s*\)/g) ?? []
  const directSelectionKeyedEffect = useEffectBlocks.some((block) => {
    const depsMatch = block.match(/\[([^\]]*)\]\s*\)$/)
    return !!depsMatch && /selectedId/.test(depsMatch[1])
  })

  // (b) indirect: a component/function whose own parameter list mentions `selectedId`, and whose
  // body (approximated as the text up to the next top-level `function ` declaration, or a fixed
  // generous window, whichever is shorter) both sets `camera.position` and does so inside a
  // useEffect/useFrame call -- i.e. selectedId feeds a reactive camera-position update somewhere
  // in that same component, however many useCallback hops away.
  const indirectSelectionKeyedComponent = (() => {
    const fnStarts = [...orbitSandboxSrc.matchAll(/function\s+\w+\s*\(/g)].map((m) => m.index!)
    for (let i = 0; i < fnStarts.length; i += 1) {
      const start = fnStarts[i]
      const end = i + 1 < fnStarts.length ? fnStarts[i + 1] : Math.min(start + 4000, orbitSandboxSrc.length)
      const body = orbitSandboxSrc.slice(start, end)
      if (!/\bselectedId\b/.test(body)) continue
      const setsCameraPosition = /camera\.position\.(?:copy|set)\(/.test(body)
      const reactiveHookPresent = /use(?:Effect|Frame)\(/.test(body)
      if (setsCameraPosition && reactiveHookPresent) return true
    }
    return false
  })()

  // (c) a Box3/Sphere bounds-based fit computed from a live object (not just PlanetModel's
  // unrelated scale-normalization use of Box3, which this check deliberately excludes).
  const boundsBasedFit =
    /new\s+THREE\.(?:Box3|Sphere)\(\)[\s\S]{0,400}?(?:camera|fit|distance)/i.test(orbitSandboxSrc) ||
    /new\s+THREE\.(?:Box3|Sphere)\(\)[\s\S]{0,400}?(?:camera|fit|distance)/i.test(spaceLabSrc)

  assert.ok(
    directSelectionKeyedEffect || indirectSelectionKeyedComponent || boundsBasedFit,
    'expected either (a) a useEffect with `selectedId` directly in its dependency array, (b) a component receiving `selectedId` that reactively sets camera.position via useEffect/useFrame (even if selectedId reaches that hook indirectly through a useCallback), or (c) a Box3/Sphere real-bounds-based fit function, in OrbitSandbox.tsx/SpaceLab.tsx -- so the camera reframes per selected body (fixing Neptune rendering off-canvas / Saturn ring clipping that a purely aspect-driven, selection-agnostic worst-case fit cannot handle)',
  )
})

test('PlanetModel: still computes each GLB\'s real bounding box on load (the raw material a bounds-based camera fit would need)', () => {
  // Sanity check that this isn't accidentally passing test 2 above by a coincidence elsewhere --
  // PlanetModel already measures a THREE.Box3 per loaded body (for scale-normalization); a
  // bounds-based camera fit, if that's the shape Worker 1 lands, would plausibly build on this
  // existing per-body measurement rather than duplicating it blind.
  assert.match(
    planetModelSrc,
    /new\s+THREE\.Box3\(\)\.setFromObject/,
    'expected PlanetModel.tsx to still measure each loaded GLB\'s real bounding box (used for scale-normalization today, and the natural source of truth for a future bounds-based camera fit)',
  )
})
