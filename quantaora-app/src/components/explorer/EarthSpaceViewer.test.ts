import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Static source-text checks only — this file imports React/Three.js/@react-three/drei and (at
// module scope) calls useGLTF.preload, none of which run under this repo's plain node:test +
// native TS type-stripping setup without a jsdom/WebGL harness (see EarthInSpaceLab.test.ts's own
// comment on why that convention was chosen). Run with:
// node --test src/components/explorer/EarthSpaceViewer.test.ts

const viewerSrc = readFileSync(fileURLToPath(new URL('./EarthSpaceViewer.tsx', import.meta.url)), 'utf8')

test('camera FOV: Canvas uses the shared CAMERA_FOV_DEG constant from earthSpaceCamera.ts, not a hardcoded literal', () => {
  assert.match(viewerSrc, /import \{ CAMERA_FOV_DEG \} from '@\/lib\/earthSpaceCamera'/)
  assert.match(viewerSrc, /camera=\{\{ position: \[0, 3\.2, cameraDistance\], fov: CAMERA_FOV_DEG \}\}/)
})

// Regression guard: src/lib/earthSpaceCamera.ts hardcodes the "widest orbit extent" as a literal
// (6.05 = orbit radius 5.2 + EARTH_SIZE/2 0.85) rather than importing these constants, precisely
// so it stays free of this file's React/Three.js dependency chain and is unit-testable under
// node:test. That means the two files can silently drift if either constant changes here without
// the other file being updated — this test is the tripwire.
test('framing constants stay in sync: EarthSpaceViewer.tsx geometry matches earthSpaceCamera.ts\'s hardcoded WIDE_ORBIT_EXTENT (5.05 = 4.2 orbit radius + 0.85 Earth half-size)', () => {
  assert.match(viewerSrc, /const EARTH_SIZE = 1\.7/, 'expected EARTH_SIZE to still be 1.7 (half-size 0.85, baked into earthSpaceCamera.ts)')
  assert.match(viewerSrc, /const MOTION_ORBIT_RADIUS = 4\.2/, 'expected MOTION_ORBIT_RADIUS to still be 4.2 (baked into earthSpaceCamera.ts)')
  assert.match(viewerSrc, /const SEASONS_ORBIT_RADIUS = 4\.2/, 'expected SEASONS_ORBIT_RADIUS to still be 4.2 (baked into earthSpaceCamera.ts)')
})

test('wide orbit scenes use a small x-offset so Earth does not ride the right canvas edge beside the app chrome', () => {
  assert.match(viewerSrc, /const WIDE_SCENE_X_OFFSET = -1\.2/)
  assert.match(viewerSrc, /<group position=\{\[WIDE_SCENE_X_OFFSET, 0, 0\]\}>/)
})
