import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { earthInSpace } from '../data/earthInSpace.ts'

// Note: branchModules.ts / allContent.ts are intentionally NOT imported here. Both transitively
// import every other branch's extensionless generated module (`./generated/cell_biology`, etc.),
// written for Vite/bundler resolution — those don't resolve under node --test's native ESM
// loader (see earthInSpace.ts's own `.ts`-extension comment for why *that one* import had to
// change). So branchModules.ts registration is checked via static source text below instead.

// Correction-agent regression guard for the P0 gap an independent review found: the Earth In
// Space branch's content/subjects/space/earth-in-space/ dir was empty (bypassing codegen), and
// branchModules.ts had no 'earth-in-space' entry at all, so ALL_CONTENT / generic branch tooling
// silently never saw this branch's five components. Content is now authored under
// content/subjects/space/earth-in-space/<id>/ and generated via `npm run codegen earth-in-space
// space` into src/data/generated/earth_in_space.ts; src/data/earthInSpace.ts is a thin adapter
// that only layers the UI `mode` field on top (see that file's header comment).
//
// Static source-text checks only for the route/JSX-shape assertions, matching this repo's plain
// node:test + native TS type-stripping convention (no jsdom/WebGL/R3F-render harness -- see
// ./BranchLab.test.ts's own comment on why). The content-coverage assertions run against the
// real imported data/module graph, not source text.
//
// Run with: node --test src/routes/EarthInSpaceLab.test.ts

function readSrc(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

const appSrc = readSrc('../App.tsx')
const labSrc = readSrc('./EarthInSpaceLab.tsx')

test('route reachability: App.tsx imports EarthInSpaceLab and mounts it at labs/earth-in-space', () => {
  // App.tsx route-splits lab routes via React.lazy (perf: keeps EarthInSpaceLab's Three-heavy
  // bundle out of the initial app chunk), so this checks the lazy import + routeElement(...)
  // wiring instead of a static default import.
  assert.match(appSrc, /const EarthInSpaceLab = lazy\(\(\) => import\('\.\/routes\/EarthInSpaceLab'\)\)/)
  assert.match(appSrc, /<Route path="labs\/earth-in-space" element=\{routeElement\(EarthInSpaceLab\)\} \/>/)
})

test('common toolbar: CanvasControls is wired with the full shared toolbar contract', () => {
  const idx = labSrc.indexOf('<CanvasControls')
  assert.ok(idx !== -1, 'expected EarthInSpaceLab.tsx to render <CanvasControls />')
  const block = labSrc.slice(idx, idx + 1600)
  for (const prop of [
    'autoRotate',
    'onToggleAutoRotate',
    'isolateActive',
    'onToggleIsolate',
    'onCompare',
    'compareDisabled',
    'onZoomIn',
    'onZoomOut',
    'labelsVisible',
    'onToggleLabels',
    'animationAvailable',
    'animationPlaying',
    'onToggleAnimation',
    'cleanViewActive',
    'onToggleCleanView',
    'onFitView',
    'onReset',
  ]) {
    assert.ok(block.includes(prop), `expected the shared CanvasControls toolbar to be wired with a "${prop}" prop`)
  }
})

test('mobile stage affordance: data-lab-stage carries the mobile-height / desktop-flex pattern shared by other labs', () => {
  const idx = labSrc.indexOf('data-lab-stage')
  assert.ok(idx !== -1, 'expected a data-lab-stage wrapper around the 3D canvas')
  const block = labSrc.slice(idx, idx + 400)
  assert.match(block, /h-\[46svh\]/, 'expected a mobile-only fixed svh stage height')
  assert.match(block, /lg:h-auto/, 'expected the mobile stage height to be overridden back to auto on desktop (lg:)')
  assert.match(block, /shrink-0/, 'expected the mobile stage to not get squeezed by flex siblings')
})

test('scroll affordance: the detail/content aside scrolls independently and the mission log uses the shared clamped BottomTray', () => {
  assert.match(labSrc, /import BottomTray from '@\/components\/explorer\/BottomTray'/)
  assert.match(labSrc, /<BottomTray/, 'expected EarthInSpaceLab to render the shared BottomTray (owns the bottom-sheet scroll/gradient affordance)')
  const asideIdx = labSrc.indexOf('order-2 min-h-0 flex-1 overflow-y-auto')
  assert.ok(asideIdx !== -1, 'expected the right-hand detail aside to be an independently scrollable region (overflow-y-auto)')
})

test('camera framing: fit/reset/select all route the default distance through framedCameraDistance instead of the flat DEFAULT_CAMERA_DISTANCE constant', () => {
  assert.match(
    labSrc,
    /import \{ framedCameraDistance \} from '@\/lib\/earthSpaceCamera'/,
    'expected EarthInSpaceLab.tsx to import the aspect-aware camera-framing helper (P0 fix for Earth clipping the mobile canvas edge in motion/seasons mode)',
  )
  assert.match(labSrc, /ref=\{stageRef\}\s+data-lab-stage/, 'expected the 3D stage div to be measured via a ref so the real canvas aspect ratio is known')
  assert.match(labSrc, /setCameraDistance\(defaultDistanceFor\(earthInSpaceById\[id\]\.mode\)\)/, 'expected selectComponent to use the aspect-aware default')
  assert.match(labSrc, /setCameraDistance\(defaultDistanceFor\(mode\)\)/, 'expected resetAll to use the aspect-aware default')
  assert.match(labSrc, /onFitView=\{\(\) => \{\s*setCameraDistance\(defaultDistanceFor\(mode\)\)/, 'expected the Fit View toolbar action to use the aspect-aware default, not the flat constant')
  assert.match(
    labSrc,
    /onZoomIn=\{\(\) => setCameraDistance\(\(d\) => Math\.max\(MIN_CAMERA_DISTANCE, Number\(\(d - ZOOM_STEP\)\.toFixed\(2\)\)\)\)\}/,
    'expected zoom in/out to keep stepping from the current cameraDistance by ZOOM_STEP, untouched by the aspect-aware framing fix',
  )
})

test('mode controls: each of the five simulation modes renders its own dedicated control panel', () => {
  for (const mode of ['motion', 'seasons', 'phases', 'eclipses', 'tides']) {
    assert.match(
      labSrc,
      new RegExp(`mode === '${mode}' && \\(`),
      `expected a dedicated \`mode === '${mode}' && (...)\` control panel block in EarthInSpaceLab.tsx`,
    )
  }
})

test('motion mode: speed experiment presets make rotation vs revolution consequences explicit', () => {
  assert.match(labSrc, /const SPEED_EXPERIMENTS = \[/, 'expected dedicated speed experiment presets')
  for (const phrase of [
    'Spin only',
    'Orbit only',
    'Fast days',
    'Fast year',
    'Day signal',
    'Year signal',
    'Rotation controls day/night; revolution controls the trip around the Sun',
  ]) {
    assert.ok(labSrc.includes(phrase), `expected the motion panel to include "${phrase}"`)
  }
  assert.match(labSrc, /setRotationSpeed\(experiment\.rotationSpeed\)/, 'expected presets to change rotation speed')
  assert.match(labSrc, /setRevolutionSpeed\(experiment\.revolutionSpeed\)/, 'expected presets to change revolution speed')
})

test('content coverage: earthInSpace has exactly five components, one per mode', () => {
  assert.equal(earthInSpace.length, 5)
  const modes = new Set(earthInSpace.map((c) => c.mode))
  assert.equal(modes.size, 5, 'expected each component to have a distinct mode')
})

test('content coverage: branchModules.ts registers "earth-in-space" in BRANCH_COMPONENTS (the P0 gap this file guards against)', () => {
  const branchModulesSrc = readSrc('../data/branchModules.ts')
  assert.match(
    branchModulesSrc,
    /import \{ earth_in_space \} from '\.\/generated\/earth_in_space'/,
    'expected branchModules.ts to import the codegen-generated earth_in_space module',
  )
  assert.match(
    branchModulesSrc,
    /'earth-in-space':\s*earth_in_space,/,
    'expected BRANCH_COMPONENTS to register an "earth-in-space" entry — previously this key did not exist at all, so allContent.ts (which spreads BRANCH_COMPONENTS) silently never saw this branch\'s components',
  )
})

test('content coverage: content/subjects/space/earth-in-space is authored per component, not bypassing codegen', () => {
  const generatedSrc = readSrc('../data/generated/earth_in_space.ts')
  assert.match(generatedSrc, /@generated by scripts\/codegen/, 'expected src/data/generated/earth_in_space.ts to exist and be codegen output')
  for (const c of earthInSpace) {
    assert.ok(generatedSrc.includes(`"id": "${c.id}"`), `expected generated earth_in_space.ts to contain codegen output for "${c.id}"`)
  }
})

test('content coverage: every component resolves to real authored content with >= 5 quiz questions and a valid lesson', () => {
  for (const c of earthInSpace) {
    assert.ok(c.quiz.length >= 5, `expected >= 5 quiz questions for "${c.id}", got ${c.quiz.length}`)
    for (const q of c.quiz) {
      assert.ok(q.misconception && q.misconception.length > 0, `expected a non-empty misconception for a "${c.id}" quiz question: "${q.prompt}"`)
      assert.ok(q.correctIndex >= 0 && q.correctIndex < q.options.length, `expected a valid correctIndex for a "${c.id}" quiz question: "${q.prompt}"`)
    }
    assert.ok(c.lesson.steps.length > 0, `expected lesson steps for "${c.id}"`)
    assert.ok(c.lesson.predictionPrompt.length > 0, `expected a predictionPrompt for "${c.id}"`)
    assert.ok(c.lesson.practiceItem.length > 0, `expected a practiceItem for "${c.id}"`)
    assert.ok(c.lesson.checkpoint.length > 0, `expected a checkpoint for "${c.id}"`)
  }
})
