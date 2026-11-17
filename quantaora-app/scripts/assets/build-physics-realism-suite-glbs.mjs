import { createHash } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
      .then((buffer) => {
        this.result = buffer
        this.onloadend?.({ target: this })
      })
      .catch((error) => {
        this.error = error
        this.onerror?.(error)
      })
  }
}

const OUT_DIR = new URL('../../public/models/physics/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.48,
    ...options,
  })
}

const M = {
  graphite: mat('#34312d', { roughness: 0.72 }),
  steel: mat('#c8ccd1', { metalness: 0.35, roughness: 0.32, clearcoat: 0.28 }),
  darkSteel: mat('#747b84', { metalness: 0.28, roughness: 0.38 }),
  copper: mat('#b96c46', { metalness: 0.18, roughness: 0.42 }),
  rubber: mat('#22262b', { roughness: 0.82 }),
  blue: mat('#4d95d8'),
  cyan: mat('#55c8d2'),
  water: mat('#7dc7e8', { transparent: true, opacity: 0.42, side: THREE.DoubleSide, roughness: 0.18 }),
  glass: mat('#d9f2f2', { transparent: true, opacity: 0.24, side: THREE.DoubleSide, roughness: 0.22 }),
  amber: mat('#d28a2f'),
  red: mat('#cf5c50'),
  green: mat('#4aa66f'),
  violet: mat('#7b65b8'),
  cream: mat('#eee2cf'),
}

function mesh(parent, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geometry, material)
  item.name = name
  item.position.set(...position)
  item.rotation.set(...rotation)
  item.scale.set(...scale)
  item.castShadow = true
  item.receiveShadow = true
  parent.add(item)
  return item
}

const sphere = (p, n, r, pos, material, scale = [1, 1, 1], seg = 32) =>
  mesh(p, n, new THREE.SphereGeometry(r, seg, seg), material, pos, [0, 0, 0], scale)
const box = (p, n, size, pos, material, rot = [0, 0, 0]) =>
  mesh(p, n, new THREE.BoxGeometry(...size), material, pos, rot)
const cyl = (p, n, rt, rb, h, pos, rot, material, seg = 32) =>
  mesh(p, n, new THREE.CylinderGeometry(rt, rb, h, seg), material, pos, rot)
const cone = (p, n, r, h, pos, rot, material) =>
  mesh(p, n, new THREE.ConeGeometry(r, h, 32), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) =>
  mesh(p, n, new THREE.TorusGeometry(r, t, 18, 96), material, pos, rot)

function tube(parent, name, points, radius, material, segments = 80) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)))
  return mesh(parent, name, new THREE.TubeGeometry(curve, segments, radius, 12, false), material)
}

function arrow(parent, name, from, to, color) {
  const material = mat(color)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const mid = start.clone().lerp(end, 0.5)
  const shaft = cyl(parent, `${name}-shaft`, 0.018, 0.018, dir.length() * 0.76, mid.toArray(), [0, 0, 0], material, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  const head = cone(parent, `${name}-head`, 0.065, 0.18, end.toArray(), [0, 0, 0], material)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
}

function anchors(parent) {
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  for (const pos of [
    [-1.35, 0, 0],
    [1.35, 0, 0],
    [0, -1.05, 0],
    [0, 1.05, 0],
    [0, 0, -0.85],
    [0, 0, 0.85],
  ]) sphere(parent, 'normalization-anchor', 0.001, pos, invisible, [1, 1, 1], 8)
}

function buildSoundSuite() {
  const group = new THREE.Group()
  group.name = 'quantaora-authored-sound-apparatus-suite'
  anchors(group)

  box(group, 'acoustic-bench-base', [2.45, 0.08, 0.9], [0, -0.72, 0], M.cream)

  cyl(group, 'tuning-fork-handle', 0.035, 0.05, 0.52, [-0.92, -0.42, 0.05], [0, 0, 0], M.steel)
  box(group, 'tuning-fork-bridge', [0.32, 0.06, 0.07], [-0.92, -0.14, 0.05], M.steel)
  cyl(group, 'tuning-fork-left-prong', 0.027, 0.027, 0.74, [-1.08, 0.16, 0.05], [0, 0, 0], M.steel)
  cyl(group, 'tuning-fork-right-prong', 0.027, 0.027, 0.74, [-0.76, 0.16, 0.05], [0, 0, 0], M.steel)
  sphere(group, 'vibration-blur-left', 0.05, [-1.14, 0.28, 0.08], M.cyan, [0.35, 1.7, 0.45], 18)
  sphere(group, 'vibration-blur-right', 0.05, [-0.7, 0.28, 0.08], M.cyan, [0.35, 1.7, 0.45], 18)

  cyl(group, 'speaker-cabinet', 0.37, 0.37, 0.24, [-0.22, -0.18, 0.06], [Math.PI / 2, 0, 0], M.graphite, 48)
  cyl(group, 'speaker-metal-rim', 0.31, 0.31, 0.045, [-0.22, -0.18, 0.2], [Math.PI / 2, 0, 0], M.darkSteel, 48)
  cone(group, 'speaker-cone-visible-driver', 0.28, 0.18, [-0.22, -0.18, 0.29], [Math.PI / 2, 0, 0], M.rubber)
  sphere(group, 'speaker-dust-cap', 0.08, [-0.22, -0.18, 0.39], M.graphite, [1, 1, 0.35], 24)

  for (let i = 0; i < 6; i += 1) {
    const x = 0.1 + i * 0.18
    const amp = i < 3 ? 0.22 : 0.13
    torus(group, `pressure-wave-front-${i + 1}`, amp, 0.011, [x, -0.18, 0.34], [Math.PI / 2, 0, 0], i % 2 ? M.blue : M.cyan)
  }
  for (let i = 0; i < 16; i += 1) {
    sphere(group, `medium-particle-${i + 1}`, 0.028, [0.0 + (i % 8) * 0.16, -0.56 + Math.floor(i / 8) * 0.16, 0.22], i % 3 ? M.blue : M.green, [1, 1, 1], 12)
  }

  tube(group, 'outer-ear-pinna-helix', [[0.94, -0.42, 0.18], [1.17, -0.2, 0.2], [1.06, 0.1, 0.2], [0.85, 0.18, 0.2], [0.8, -0.04, 0.2]], 0.045, M.amber)
  tube(group, 'inner-ear-canal', [[0.86, -0.04, 0.22], [0.62, -0.04, 0.22], [0.48, -0.1, 0.22]], 0.03, M.cream)
  torus(group, 'cochlea-spiral-hearing-organ', 0.13, 0.026, [0.54, -0.24, 0.23], [Math.PI / 2, 0, 0.55], M.red)
  tube(group, 'auditory-nerve-signal-path', [[0.46, -0.27, 0.24], [0.3, -0.38, 0.26], [0.14, -0.45, 0.26]], 0.018, M.violet)

  box(group, 'echo-reflecting-wall', [0.08, 0.8, 0.56], [1.2, 0.2, 0.04], M.glass)
  arrow(group, 'direct-sound-to-ear', [-0.02, -0.18, 0.52], [0.62, -0.08, 0.42], '#4d95d8')
  arrow(group, 'echo-path-to-wall', [0.08, 0.04, 0.5], [1.11, 0.32, 0.43], '#d28a2f')
  arrow(group, 'echo-return-path', [1.11, 0.31, 0.4], [0.7, 0.0, 0.4], '#d28a2f')

  return group
}

function buildFluidsSuite() {
  const group = new THREE.Group()
  group.name = 'quantaora-authored-fluids-apparatus-suite'
  anchors(group)

  box(group, 'lab-bench-base', [2.5, 0.08, 0.88], [0, -0.75, 0], M.cream)

  box(group, 'clear-pressure-tank-glass', [0.74, 0.92, 0.44], [-0.74, -0.2, 0.06], M.glass)
  box(group, 'blue-water-column', [0.66, 0.64, 0.36], [-0.74, -0.32, 0.08], M.water)
  cyl(group, 'surface-pressure-gauge', 0.08, 0.08, 0.035, [-1.2, 0.06, 0.34], [Math.PI / 2, 0, 0], M.steel, 32)
  cyl(group, 'deep-pressure-gauge', 0.1, 0.1, 0.035, [-1.2, -0.48, 0.34], [Math.PI / 2, 0, 0], M.steel, 32)
  arrow(group, 'deeper-pressure-stronger-jet', [-0.44, -0.52, 0.2], [0.0, -0.52, 0.2], '#4d95d8')

  box(group, 'buoyancy-tank-glass', [0.66, 0.66, 0.38], [0.06, -0.34, 0.07], M.glass)
  box(group, 'buoyancy-water-volume', [0.58, 0.42, 0.32], [0.06, -0.43, 0.1], M.water)
  box(group, 'floating-block-object', [0.28, 0.16, 0.22], [0.03, -0.18, 0.22], M.amber, [0, 0, -0.12])
  arrow(group, 'buoyant-force-up-arrow', [0.03, -0.46, 0.34], [0.03, -0.13, 0.34], '#4aa66f')
  arrow(group, 'weight-down-arrow', [0.2, -0.13, 0.34], [0.2, -0.45, 0.34], '#cf5c50')
  torus(group, 'displaced-fluid-outline', 0.24, 0.014, [0.05, -0.31, 0.32], [Math.PI / 2, 0, 0], M.green)

  cyl(group, 'density-column-glass-cylinder', 0.18, 0.18, 0.84, [0.66, -0.28, 0.05], [0, 0, 0], M.glass, 48)
  cyl(group, 'dense-syrup-bottom-layer', 0.155, 0.155, 0.2, [0.66, -0.55, 0.05], [0, 0, 0], M.amber, 48)
  cyl(group, 'water-middle-layer', 0.155, 0.155, 0.2, [0.66, -0.34, 0.05], [0, 0, 0], M.blue, 48)
  cyl(group, 'oil-top-layer', 0.155, 0.155, 0.2, [0.66, -0.13, 0.05], [0, 0, 0], M.green, 48)
  sphere(group, 'high-density-sample-sinks', 0.055, [0.59, -0.59, 0.25], M.graphite, [1, 1, 0.9], 18)
  sphere(group, 'low-density-sample-floats', 0.055, [0.73, -0.08, 0.25], M.cream, [1, 1, 0.9], 18)

  box(group, 'viscosity-flow-ramp', [0.88, 0.08, 0.32], [0.48, 0.37, 0.06], M.darkSteel, [0, 0, -0.2])
  tube(group, 'fast-water-flow-channel', [[0.08, 0.48, 0.27], [0.32, 0.42, 0.29], [0.62, 0.35, 0.28], [0.92, 0.25, 0.27]], 0.026, M.blue)
  tube(group, 'slow-honey-flow-channel', [[0.08, 0.3, 0.25], [0.28, 0.28, 0.25], [0.42, 0.22, 0.25], [0.52, 0.15, 0.25]], 0.036, M.amber)
  sphere(group, 'flow-rate-comparison-stopwatch', 0.11, [-0.08, 0.36, 0.24], M.steel, [1, 1, 0.24], 32)

  return group
}

async function exportScene(scene, filename, description, mappedComponents) {
  const exporter = new GLTFExporter()
  const result = await new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, {
      binary: true,
      trs: false,
      onlyVisible: true,
      includeCustomExtensions: false,
    })
  })
  const outPath = fileURLToPath(new URL(filename, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  const buffer = Buffer.from(result)
  await writeFile(outPath, buffer)
  const info = await stat(outPath)
  await writeFile(
    outPath.replace(/\.glb$/, '.license.json'),
    `${JSON.stringify(
      {
        assetName: filename,
        sourceAsset: `Quantaora authored ${filename.replace(/\\.glb$/, '')}`,
        sourceUrl: 'quantaora-app/scripts/assets/build-physics-realism-suite-glbs.mjs',
        creator: 'Quantaora',
        license: 'Project-owned authored asset',
        licenseStatus: 'CLEAR',
        attributionRequired: false,
        redistributionStatus: 'Owned project asset; commercial use and redistribution permitted by project owner.',
        dateAuthored: '2026-09-08',
        fileSizeBytes: info.size,
        sha256: createHash('sha256').update(buffer).digest('hex'),
        validation: {
          glbMagicHeaderValid: buffer.subarray(0, 4).toString('utf8') === 'glTF',
          glTFVersion: buffer.readUInt32LE(4),
          declaredLengthMatchesFile: buffer.readUInt32LE(8) === buffer.length,
          sceneCount: 1,
          note: 'Generated by Three.js GLTFExporter. Visual QA must be performed in the app canvas. Support-tier authored apparatus, not photogrammetry.',
        },
        sceneContents: { description, mappedComponents },
      },
      null,
      2,
    )}\n`,
  )
  console.log(`Wrote ${outPath}`)
}

await exportScene(
  buildSoundSuite(),
  'physics-sound-apparatus-suite.glb',
  'Sound apparatus suite with tuning fork, speaker driver, pressure waves, medium particles, listener ear/cochlea, echo wall, and direct/reflected sound paths.',
  ['physics-sound-vibration', 'physics-sound-pitch', 'physics-sound-volume', 'physics-sound-medium', 'physics-sound-echo'],
)

await exportScene(
  buildFluidsSuite(),
  'physics-fluids-apparatus-suite.glb',
  'Fluids apparatus suite with clear pressure tank, water column, gauges, buoyancy tank, floating block, density column, flow ramp, water stream, and viscous honey stream.',
  ['physics-fluids-pressure', 'physics-fluids-buoyancy', 'physics-fluids-density', 'physics-fluids-flow-viscosity'],
)
