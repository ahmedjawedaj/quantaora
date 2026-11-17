import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer()
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

const OUT_DIR = new URL('../../public/models/foundations/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.48,
    ...options,
  })
}

const M = {
  blue: mat('#55a6d9'),
  green: mat('#8abf6d'),
  yellow: mat('#f0bd4f', { emissive: '#5d4312', emissiveIntensity: 0.08 }),
  orange: mat('#d98a52'),
  red: mat('#d9685a'),
  purple: mat('#9b83d5'),
  white: mat('#e8e2d6'),
  dark: mat('#343840', { roughness: 0.72 }),
  glass: mat('#d9eff5', { transparent: true, opacity: 0.2, side: THREE.DoubleSide, roughness: 0.22 }),
  field: mat('#75c9e8', { transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
}

function add(parent, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  parent.add(mesh)
  return mesh
}

function sphere(parent, name, radius, position, material, scale = [1, 1, 1], segments = 32) {
  return add(parent, name, new THREE.SphereGeometry(radius, segments, segments), material, position, [0, 0, 0], scale)
}

function box(parent, name, size, position, material, rotation = [0, 0, 0]) {
  return add(parent, name, new THREE.BoxGeometry(...size), material, position, rotation)
}

function cyl(parent, name, radiusTop, radiusBottom, height, position, rotation, material, segments = 32) {
  return add(parent, name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position, rotation)
}

function torus(parent, name, radius, tubeRadius, position, rotation, material) {
  return add(parent, name, new THREE.TorusGeometry(radius, tubeRadius, 16, 120), material, position, rotation)
}

function tube(parent, name, points, radius, material, tubularSegments = 72) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return add(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 10, false), material)
}

function cone(parent, name, radius, height, position, rotation, material, segments = 28) {
  return add(parent, name, new THREE.ConeGeometry(radius, height, segments), material, position, rotation)
}

function arrow(parent, name, from, to, color = '#f0bd4f', radius = 0.018) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  const dir = end.clone().sub(start)
  const length = dir.length()
  const material = mat(color)
  const shaft = cyl(parent, `${name}-shaft`, radius, radius, length * 0.78, mid.toArray(), [0, 0, 0], material, 14)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  const head = cone(parent, `${name}-head`, radius * 3, length * 0.18, end.toArray(), [0, 0, 0], material, 18)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function extents(parent, max = 3.3) {
  const half = max / 2
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[
    [-half, 0, 0],
    [half, 0, 0],
    [0, -half, 0],
    [0, half, 0],
    [0, 0, -half],
    [0, 0, half],
  ].forEach((position, index) => sphere(parent, `normalization-anchor-${index}`, 0.001, position, invisible, [1, 1, 1], 8))
}

async function exportScene(root, filename) {
  const scene = new THREE.Scene()
  scene.add(root)
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
  await writeFile(outPath, Buffer.from(result))
  console.log(`Wrote ${outPath}`)
}

function wave(parent, name, y = 0, color = M.blue, stretch = 1) {
  const points = []
  for (let i = 0; i < 60; i += 1) {
    const t = i / 59
    const x = -0.95 + t * 1.9
    points.push([x, y + Math.sin(t * Math.PI * 4 / stretch) * 0.16, 0.12])
  }
  tube(parent, name, points, 0.025, color, 80)
}

function buildModern(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'modern-physics-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'physics-modern-photon') {
    wave(root, 'wave-path-light-travel', 0.16, M.blue)
    sphere(root, 'energy-packet-photon', 0.16, [0.1, 0.35, 0.14], M.yellow)
    box(root, 'detector-click-panel', [0.32, 0.42, 0.12], [0.86, -0.02, 0], M.green)
    arrow(root, 'photon-direction', [-0.9, -0.22, 0.14], [0.72, -0.22, 0.14], '#f0bd4f')
  } else if (id === 'physics-modern-energy-level') {
    box(root, 'lower-level-rail', [1.6, 0.04, 0.12], [0, -0.24, 0], M.blue)
    box(root, 'upper-level-rail', [1.6, 0.04, 0.12], [0, 0.38, 0], M.orange)
    sphere(root, 'electron-state-jump', 0.11, [-0.38, -0.24, 0.12], M.yellow)
    arrow(root, 'energy-jump-gap', [-0.38, -0.1, 0.14], [-0.38, 0.28, 0.14], '#d98a52')
    wave(root, 'emitted-photon-gap-wave', 0.05, M.green, 1.4)
  } else if (id === 'physics-modern-radioactive-decay') {
    sphere(root, 'unstable-nucleus-before-decay', 0.34, [-0.55, 0.05, 0], M.red, [1, 1, 0.8], 36)
    sphere(root, 'daughter-nucleus-after-decay', 0.24, [0.55, -0.08, 0], M.green, [1, 1, 0.8], 32)
    arrow(root, 'emission-radiation-event', [-0.2, 0.22, 0.14], [0.32, 0.52, 0.14], '#f0bd4f')
    sphere(root, 'emitted-particle', 0.08, [0.4, 0.56, 0.12], M.yellow)
  } else if (id === 'physics-modern-half-life') {
    box(root, 'start-amount-column', [0.28, 0.82, 0.14], [-0.62, -0.06, 0], M.blue)
    box(root, 'half-mark-column', [0.28, 0.42, 0.14], [0.0, -0.26, 0], M.orange)
    box(root, 'quarter-remain-column', [0.28, 0.22, 0.14], [0.62, -0.36, 0], M.green)
    tube(root, 'decay-curve-falling-halves', [[-0.76, 0.42, 0.14], [-0.2, 0.02, 0.14], [0.42, -0.25, 0.14], [0.82, -0.43, 0.14]], 0.02, M.yellow)
  } else {
    wave(root, 'wave-pattern-interference', 0.22, M.blue)
    sphere(root, 'single-click-localized-detection', 0.13, [0.04, -0.12, 0.14], M.orange)
    box(root, 'experiment-setup-screen', [0.18, 0.92, 0.12], [0.9, 0.02, 0], M.glass)
    sphere(root, 'detector-hit-spot', 0.08, [0.9, 0.24, 0.14], M.green)
  }
  return root
}

function buildGravity(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'gravity-orbit-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'space-gravity-force') {
    sphere(root, 'mass-source-central-body', 0.32, [-0.2, 0.05, 0], M.yellow)
    torus(root, 'field-pattern-inner-ring', 0.52, 0.014, [-0.2, 0.05, 0], [Math.PI / 2, 0, 0], M.field)
    torus(root, 'field-pattern-outer-ring', 0.78, 0.012, [-0.2, 0.05, 0], [Math.PI / 2, 0, 0], M.field)
    sphere(root, 'distance-gap-test-mass', 0.12, [0.94, 0.05, 0.12], M.green)
    arrow(root, 'gravity-pull-inward', [0.78, 0.05, 0.14], [0.15, 0.05, 0.14], '#55a6d9')
  } else if (id === 'space-orbit-path') {
    sphere(root, 'central-mass-planet', 0.28, [0, 0, 0], M.yellow)
    torus(root, 'orbit-path-loop', 0.75, 0.018, [0, 0, 0], [Math.PI / 2, 0, 0], M.blue)
    sphere(root, 'orbiting-body-satellite', 0.1, [0.75, 0, 0.12], M.green)
    arrow(root, 'velocity-arrow-sideways-speed', [0.72, 0.02, 0.15], [0.45, 0.42, 0.15], '#8abf6d')
  } else if (id === 'space-escape-speed') {
    sphere(root, 'central-mass-escape-world', 0.28, [-0.32, -0.08, 0], M.yellow)
    torus(root, 'bound-orbit-reference', 0.52, 0.014, [-0.32, -0.08, 0], [Math.PI / 2, 0, 0], M.blue)
    arrow(root, 'escape-path-open-trajectory', [0.04, 0.18, 0.14], [0.95, 0.72, 0.14], '#d9685a')
    sphere(root, 'escaping-craft', 0.1, [0.42, 0.42, 0.12], M.white)
  } else if (id === 'space-orbital-speed') {
    sphere(root, 'central-mass-speed-world', 0.28, [0, 0, 0], M.yellow)
    torus(root, 'close-fast-orbit', 0.48, 0.016, [0, 0, 0], [Math.PI / 2, 0, 0], M.orange)
    torus(root, 'far-slower-orbit', 0.86, 0.014, [0, 0, 0], [Math.PI / 2, 0, 0], M.blue)
    arrow(root, 'speed-meter-fast-close', [0.48, 0, 0.14], [0.28, 0.34, 0.14], '#d98a52')
  } else {
    sphere(root, 'heavy-body-barycenter-large', 0.32, [-0.42, 0.0, 0], M.yellow)
    sphere(root, 'lighter-body-barycenter-small', 0.15, [0.72, 0.0, 0.12], M.blue)
    sphere(root, 'barycenter-balance-point', 0.08, [-0.08, 0.0, 0.18], M.red)
    torus(root, 'shared-orbit-center-path', 0.68, 0.014, [0.04, 0, 0], [Math.PI / 2, 0, 0], M.field)
  }
  return root
}

function buildCosmology(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'cosmology-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'space-cosmology-observable-universe') {
    sphere(root, 'observer-viewpoint-inside-universe', 0.12, [0, 0, 0.14], M.blue)
    torus(root, 'observable-horizon-edge', 0.82, 0.018, [0, 0, 0], [Math.PI / 2, 0, 0], M.purple)
    sphere(root, 'far-light-lookback-source', 0.09, [0.78, 0.24, 0.12], M.yellow)
    arrow(root, 'light-travel-to-observer', [0.68, 0.2, 0.14], [0.1, 0.02, 0.14], '#f0bd4f')
  } else if (id === 'space-cosmology-expansion') {
    sphere(root, 'near-galaxy-marker', 0.12, [-0.55, 0.0, 0.12], M.blue)
    sphere(root, 'far-galaxy-marker', 0.12, [0.72, 0.18, 0.12], M.red)
    arrow(root, 'space-between-stretches', [-0.32, 0.08, 0.14], [0.48, 0.16, 0.14], '#55a6d9')
    box(root, 'expanding-space-grid', [1.9, 0.72, 0.04], [0.05, 0.04, 0], M.glass)
  } else if (id === 'space-cosmology-redshift') {
    wave(root, 'short-wave-original-light', 0.3, M.blue, 0.65)
    wave(root, 'stretched-wave-redshift-light', -0.18, M.red, 1.6)
    arrow(root, 'wavelength-stretch-arrow', [-0.64, 0.04, 0.14], [0.64, 0.04, 0.14], '#f0bd4f')
  } else if (id === 'space-cosmology-cmb') {
    sphere(root, 'all-sky-microwave-glow-shell', 0.68, [0, 0, 0], M.field, [1, 1, 0.5], 48)
    for (let i = 0; i < 10; i += 1) {
      const a = (i / 10) * Math.PI * 2
      sphere(root, `tiny-temperature-variation-${i}`, 0.045, [Math.cos(a) * 0.55, Math.sin(a) * 0.38, 0.14], i % 2 ? M.orange : M.blue)
    }
    sphere(root, 'ancient-light-center', 0.08, [0, 0, 0.18], M.yellow)
  } else {
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2
      const r = i % 3 === 0 ? 0.75 : 0.45
      sphere(root, `galaxy-node-large-scale-structure-${i}`, 0.06, [Math.cos(a) * r, Math.sin(a) * r * 0.62, 0.12], i % 2 ? M.blue : M.yellow)
    }
    tube(root, 'cosmic-web-filament-a', [[-0.75, 0.0, 0.12], [-0.25, 0.28, 0.12], [0.28, 0.14, 0.12], [0.72, 0.36, 0.12]], 0.018, M.field)
    tube(root, 'cosmic-web-filament-b', [[-0.48, -0.34, 0.12], [0.05, -0.12, 0.12], [0.54, -0.28, 0.12]], 0.018, M.purple)
  }
  return root
}

const ids = [
  'physics-modern-photon',
  'physics-modern-energy-level',
  'physics-modern-radioactive-decay',
  'physics-modern-half-life',
  'physics-modern-wave-particle-model',
  'space-gravity-force',
  'space-orbit-path',
  'space-escape-speed',
  'space-orbital-speed',
  'space-barycenter',
  'space-cosmology-observable-universe',
  'space-cosmology-expansion',
  'space-cosmology-redshift',
  'space-cosmology-cmb',
  'space-cosmology-large-scale-structure',
]

for (const id of ids) {
  const builder = id.startsWith('physics-modern-') ? buildModern : id.startsWith('space-cosmology-') ? buildCosmology : buildGravity
  await exportScene(builder(id), `${id}.glb`)
}
