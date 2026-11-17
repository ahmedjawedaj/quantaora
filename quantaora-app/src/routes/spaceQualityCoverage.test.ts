import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

const spaceLabSrc = readSrc('./SpaceLab.tsx')
const earthInSpaceLabSrc = readSrc('./EarthInSpaceLab.tsx')
const starsLabSrc = readSrc('./StarsLab.tsx')
const galaxyLabSrc = readSrc('./GalaxyLab.tsx')

test('SpaceLab: rotation vs revolution has explicit predict/change/observe/explain outcomes tied to controls', () => {
  assert.match(spaceLabSrc, /data-testid="space-cause-effect-strip"/)
  for (const label of ['Predict · Change · Observe · Explain', 'spinOutcome', 'revolutionOutcome', 'distanceOutcome']) {
    assert.ok(spaceLabSrc.includes(label), `expected SpaceLab motion panel to include ${label}`)
  }
  assert.match(spaceLabSrc, /setSpeed\(Number\(e\.target\.value\)\)/, 'expected revolution speed slider to update the visible outcome')
  assert.match(spaceLabSrc, /setRotationSpeed\(Number\(e\.target\.value\)\)/, 'expected rotation speed slider to update the visible outcome')
  assert.match(spaceLabSrc, /setDistanceOverride\(Number\(e\.target\.value\)\)/, 'expected distance slider to update the year/gravity outcome')
})

test('EarthInSpaceLab: moon phase mode includes moon gravity and orbit comparison with live outcomes', () => {
  assert.match(earthInSpaceLabSrc, /import \{ moons, moonById, EARTH_SURFACE_GRAVITY_MS2 \} from '@\/data\/moons'/)
  assert.match(earthInSpaceLabSrc, /data-testid="moon-gravity-orbit-comparison"/)
  for (const phrase of [
    'Moon gravity and orbit comparison',
    'Orbit distance',
    'Orbit period',
    'Surface gravity',
    'Predict:',
    'Observe:',
    'Explain:',
  ]) {
    assert.ok(earthInSpaceLabSrc.includes(phrase), `expected EarthInSpaceLab phase panel to include "${phrase}"`)
  }
  assert.match(earthInSpaceLabSrc, /setMoonCompareId\(m\.id\)/, 'expected picking another moon to change comparison outcomes')
  assert.match(earthInSpaceLabSrc, /setMoonCompareWeightKg\(Number\(e\.target\.value\)\)/, 'expected weight slider to change gravity outcome')
})

test('Stars and Galaxies: lifecycle and scale inspection moments remain visible', () => {
  assert.match(starsLabSrc, /Lifecycle stage \{content\.stageOrder\} of \{stars\.length\}/)
  assert.match(starsLabSrc, /colour is a thermometer/i)
  assert.match(starsLabSrc, /Where this leads/)
  assert.match(galaxyLabSrc, /Mission: real spin vs\. rigid spin/)
  assert.match(galaxyLabSrc, /Real \(differential\)/)
  assert.match(galaxyLabSrc, /Rigid \(no shear\)/)
  assert.match(galaxyLabSrc, /fittedCameraDistance/)
})
