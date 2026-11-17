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

const OUT_DIR = new URL('../../public/models/physics/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    ...options,
  })
}

const mats = {
  brass: mat('#d9a441', { roughness: 0.38, metalness: 0.08 }),
  blue: mat('#55b7df', { roughness: 0.45 }),
  water: mat('#7cc7df', { transparent: true, opacity: 0.42, side: THREE.DoubleSide, roughness: 0.34 }),
  orange: mat('#d98552', { roughness: 0.5 }),
  green: mat('#8ebf6f', { roughness: 0.52 }),
  red: mat('#d9685a', { roughness: 0.48 }),
  white: mat('#e8e2d6', { roughness: 0.52 }),
  dark: mat('#3b3f46', { roughness: 0.7 }),
  glass: mat('#d7ecf1', { transparent: true, opacity: 0.18, side: THREE.DoubleSide, roughness: 0.2 }),
  purple: mat('#9b8bd6', { roughness: 0.48 }),
  yellow: mat('#f2c45e', { roughness: 0.44 }),
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

function cone(parent, name, radius, height, position, rotation, material, segments = 32) {
  return add(parent, name, new THREE.ConeGeometry(radius, height, segments), material, position, rotation)
}

function tube(parent, name, points, radius, material, tubularSegments = 72) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return add(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 12, false), material)
}

function torus(parent, name, radius, tubeRadius, position, rotation, material) {
  return add(parent, name, new THREE.TorusGeometry(radius, tubeRadius, 18, 128), material, position, rotation)
}

function arrow(parent, name, from, to, color = '#f2c45e', radius = 0.025) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  const direction = end.clone().sub(start)
  const length = direction.length()
  const material = mat(color, { roughness: 0.42 })
  const shaft = cyl(parent, `${name}-shaft`, radius, radius, length * 0.78, mid.toArray(), [0, 0, 0], material, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
  const head = cone(parent, `${name}-head`, radius * 3.2, length * 0.18, end.toArray(), [0, 0, 0], material, 20)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
}

function extents(parent, max = 3.2) {
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

function pressureParticles(root, count, startX, gap, y, strong = false) {
  for (let i = 0; i < count; i += 1) {
    const dense = i % 4 < 2
    const x = startX + i * gap + (dense ? -0.04 : 0.04)
    sphere(root, `pressure-particle-${i}`, strong && dense ? 0.055 : 0.04, [x, y + Math.sin(i * 0.8) * 0.05, 0.08], dense ? mats.blue : mats.green, [1, 1, 1], 18)
  }
}

function buildSound(kind) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${kind}`
  extents(root, 3.3)
  box(root, 'quiet-stage-reference-base', [2.6, 0.08, 0.16], [0, -0.7, 0], mats.dark)

  if (kind === 'physics-sound-vibration') {
    cyl(root, 'vibrating-source-tuning-fork-left', 0.035, 0.035, 1.0, [-0.88, 0.05, 0], [0, 0, 0], mats.brass)
    cyl(root, 'vibrating-source-tuning-fork-right', 0.035, 0.035, 1.0, [-0.62, 0.05, 0], [0, 0, 0], mats.brass)
    cyl(root, 'vibrating-source-handle', 0.055, 0.055, 0.6, [-0.75, -0.62, 0], [0, 0, 0], mats.brass)
    pressureParticles(root, 18, -0.35, 0.09, 0.05)
    arrow(root, 'wave-direction', [-0.32, -0.34, 0.05], [0.85, -0.34, 0.05], '#55b7df')
  } else if (kind === 'physics-sound-pitch') {
    cyl(root, 'fast-vibrating-string-low-note', 0.018, 0.018, 1.45, [-0.72, 0, 0], [0, 0, Math.PI / 2], mats.brass)
    cyl(root, 'fast-vibrating-string-high-note', 0.018, 0.018, 1.45, [-0.72, 0.32, 0], [0, 0, Math.PI / 2], mats.yellow)
    pressureParticles(root, 22, -0.05, 0.065, 0.22)
    sphere(root, 'listener-ear-detects-tight-frequency', 0.22, [1.05, 0.05, 0], mats.red, [0.65, 1.25, 0.28], 32)
  } else if (kind === 'physics-sound-volume') {
    cyl(root, 'vibrating-speaker-cone', 0.36, 0.12, 0.28, [-0.86, 0.05, 0], [0, 0, Math.PI / 2], mats.dark, 48)
    pressureParticles(root, 16, -0.35, 0.105, 0.05, true)
    torus(root, 'strong-compression-ring-near-source', 0.42, 0.022, [-0.32, 0.05, 0], [Math.PI / 2, 0, 0], mats.yellow)
    torus(root, 'distance-drop-weaker-ring', 0.26, 0.016, [0.82, 0.05, 0], [Math.PI / 2, 0, 0], mats.green)
  } else if (kind === 'physics-sound-medium') {
    sphere(root, 'vibrating-bell-source', 0.2, [-1.0, 0.24, 0], mats.brass, [1, 0.9, 1], 32)
    box(root, 'air-particles-chamber', [0.62, 0.62, 0.14], [-0.42, 0.05, 0], mats.glass)
    pressureParticles(root, 9, -0.68, 0.07, 0.05)
    box(root, 'solid-path-table-block', [0.65, 0.16, 0.16], [0.3, -0.12, 0], mats.orange)
    torus(root, 'vacuum-gap-no-particles', 0.28, 0.018, [0.92, 0.18, 0], [Math.PI / 2, 0, 0], mats.dark)
    arrow(root, 'blocked-sound-through-vacuum', [0.72, 0.18, 0], [1.12, 0.18, 0], '#64748b', 0.018)
  } else {
    sphere(root, 'direct-sound-source-clap', 0.18, [-0.98, 0.22, 0], mats.yellow, [1, 1, 1], 28)
    sphere(root, 'listener-ear-hears-delay', 0.18, [-0.88, -0.35, 0], mats.red, [0.65, 1.2, 0.28], 28)
    box(root, 'reflecting-wall-hard-surface', [0.12, 1.15, 0.18], [0.86, 0.02, 0], mats.dark)
    tube(root, 'direct-sound-short-path', [[-0.85, 0.18, 0.05], [-0.35, 0.18, 0.05], [0.18, 0.18, 0.05]], 0.018, mats.blue)
    tube(root, 'return-path-delayed-echo', [[0.18, 0.18, 0.05], [0.78, 0.14, 0.05], [0.2, -0.28, 0.05], [-0.72, -0.33, 0.05]], 0.018, mats.green)
    arrow(root, 'reflection-turnaround', [0.62, 0.12, 0.08], [0.28, -0.16, 0.08], '#8ebf6f', 0.018)
  }
  return root
}

function sinePoints(amplitude = 0.34, wavelength = 0.74, cycles = 3.2, y = 0) {
  const points = []
  const width = 2.25
  const samples = 72
  for (let i = 0; i < samples; i += 1) {
    const t = i / (samples - 1)
    const x = -width / 2 + t * width
    points.push([x, y + Math.sin((x / wavelength) * Math.PI * 2) * amplitude, 0.06])
  }
  return points
}

function buildWave(kind) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${kind}`
  extents(root, 3.2)
  box(root, 'rest-line-reference', [2.45, 0.035, 0.12], [0, 0, 0], mats.dark)

  const amp = kind === 'physics-waves-amplitude' ? 0.54 : 0.34
  const wavelength = kind === 'physics-waves-wavelength' ? 1.08 : kind === 'physics-waves-frequency' ? 0.48 : 0.74
  tube(root, 'wave-curve-energy-transfer', sinePoints(amp, wavelength), 0.035, mats.blue, 96)
  sphere(root, 'crest-high-point', 0.085, [-0.55, amp, 0.08], mats.yellow, [1, 1, 1], 24)
  sphere(root, 'trough-low-point', 0.085, [0.2, -amp, 0.08], mats.orange, [1, 1, 1], 24)

  if (kind === 'physics-waves-amplitude') {
    arrow(root, 'amplitude-marker-rest-to-crest', [-0.55, 0.02, 0.12], [-0.55, amp - 0.06, 0.12], '#d9685a', 0.018)
    torus(root, 'energy-ring-bigger-disturbance', 0.28, 0.018, [-0.88, amp * 0.6, 0.08], [Math.PI / 2, 0, 0], mats.red)
  } else if (kind === 'physics-waves-wavelength') {
    sphere(root, 'next-crest-matching-point', 0.085, [0.55, amp, 0.08], mats.yellow, [1, 1, 1], 24)
    arrow(root, 'wavelength-span-crest-to-crest', [-0.5, amp + 0.16, 0.12], [0.5, amp + 0.16, 0.12], '#f2c45e', 0.018)
  } else if (kind === 'physics-waves-frequency') {
    sphere(root, 'cycle-counter-fixed-marker', 0.1, [0, 0.72, 0.08], mats.green, [1, 1, 1], 24)
    cyl(root, 'fast-source-oscillator', 0.12, 0.12, 0.42, [-1.22, 0, 0.05], [Math.PI / 2, 0, 0], mats.orange, 32)
    arrow(root, 'shorter-spacing-indicator', [-0.2, -0.58, 0.12], [0.28, -0.58, 0.12], '#55b7df', 0.016)
  } else {
    arrow(root, 'crest-trough-read-line', [-0.55, amp - 0.05, 0.13], [0.2, -amp + 0.05, 0.13], '#8ebf6f', 0.018)
  }
  return root
}

function tank(root, name, position = [0, 0, 0], size = [1.0, 1.2, 0.18]) {
  box(root, `${name}-glass-back`, size, position, mats.glass)
  box(root, `${name}-water-column`, [size[0] * 0.86, size[1] * 0.74, size[2] * 0.72], [position[0], position[1] - size[1] * 0.08, position[2]], mats.water)
}

function buildFluid(kind) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${kind}`
  extents(root, 3.2)
  box(root, 'fluid-lab-bench', [2.45, 0.08, 0.16], [0, -0.78, 0], mats.dark)

  if (kind === 'physics-fluids-pressure') {
    tank(root, 'pressure-depth-tank', [-0.32, 0, 0], [0.9, 1.28, 0.18])
    torus(root, 'surface-gauge-low-pressure', 0.11, 0.016, [-0.52, 0.36, 0.12], [Math.PI / 2, 0, 0], mats.green)
    torus(root, 'deep-gauge-high-pressure', 0.16, 0.02, [-0.52, -0.42, 0.12], [Math.PI / 2, 0, 0], mats.blue)
    arrow(root, 'side-push-jet-from-depth', [0.05, -0.43, 0.12], [0.82, -0.43, 0.12], '#d98552', 0.022)
  } else if (kind === 'physics-fluids-buoyancy') {
    tank(root, 'buoyancy-tank', [0, -0.02, 0], [1.12, 1.08, 0.18])
    box(root, 'floating-object-hull-displacing-fluid', [0.42, 0.22, 0.16], [0, 0.03, 0.13], mats.orange, [0, 0, 0.08])
    arrow(root, 'upward-force-buoyancy', [0, -0.22, 0.18], [0, 0.45, 0.18], '#55b7df', 0.024)
    arrow(root, 'object-weight-down', [0.22, 0.2, 0.18], [0.22, -0.32, 0.18], '#d9685a', 0.02)
    torus(root, 'displaced-fluid-outline', 0.38, 0.014, [0, -0.12, 0.11], [Math.PI / 2, 0, 0], mats.green)
  } else if (kind === 'physics-fluids-density') {
    box(root, 'same-volume-left-heavy-sample', [0.34, 0.34, 0.22], [-0.82, 0.04, 0], mats.dark)
    box(root, 'same-volume-right-light-sample', [0.34, 0.34, 0.22], [-0.36, 0.04, 0], mats.white)
    box(root, 'dense-layer-bottom-fluid', [0.66, 0.34, 0.18], [0.5, -0.36, 0], mats.orange)
    box(root, 'less-dense-layer-top-fluid', [0.66, 0.34, 0.18], [0.5, 0.0, 0], mats.water)
    box(root, 'density-column-glass', [0.76, 0.82, 0.08], [0.5, -0.18, -0.02], mats.glass)
    arrow(root, 'layering-direction-density', [0.96, 0.08, 0.12], [0.96, -0.5, 0.12], '#f2c45e', 0.018)
  } else {
    box(root, 'flow-channel-clear-tube', [2.0, 0.18, 0.14], [0, -0.12, 0], mats.glass)
    tube(root, 'fast-water-stream-low-viscosity', [[-1.0, 0.15, 0.08], [-0.5, 0.2, 0.08], [0.05, 0.14, 0.08], [0.78, 0.2, 0.08]], 0.035, mats.blue)
    tube(root, 'slow-syrup-stream-high-viscosity', [[-1.0, -0.28, 0.1], [-0.58, -0.24, 0.1], [-0.16, -0.3, 0.1], [0.32, -0.26, 0.1]], 0.05, mats.orange)
    box(root, 'narrow-channel-resistance', [0.3, 0.08, 0.16], [0.44, -0.12, 0.11], mats.green)
    arrow(root, 'flow-rate-direction', [-0.9, 0.48, 0.1], [0.9, 0.48, 0.1], '#55b7df', 0.02)
  }
  return root
}

const builders = {
  'physics-sound-vibration': buildSound,
  'physics-sound-pitch': buildSound,
  'physics-sound-volume': buildSound,
  'physics-sound-medium': buildSound,
  'physics-sound-echo': buildSound,
  'physics-waves-crest-trough': buildWave,
  'physics-waves-amplitude': buildWave,
  'physics-waves-wavelength': buildWave,
  'physics-waves-frequency': buildWave,
  'physics-fluids-pressure': buildFluid,
  'physics-fluids-buoyancy': buildFluid,
  'physics-fluids-density': buildFluid,
  'physics-fluids-flow-viscosity': buildFluid,
}

for (const [id, builder] of Object.entries(builders)) {
  await exportScene(builder(id), `${id}.glb`)
}
