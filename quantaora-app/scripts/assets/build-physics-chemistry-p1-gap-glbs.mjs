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

const PHYSICS_OUT = new URL('../../public/models/physics/authored/', import.meta.url)
const CHEMISTRY_OUT = new URL('../../public/models/chemistry/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.55,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.5,
    ...options,
  })
}

const M = {
  red: mat('#d9685a'),
  blue: mat('#55a6d9'),
  green: mat('#8abf6d'),
  yellow: mat('#f0bd4f'),
  purple: mat('#9b83d5'),
  orange: mat('#d98a52'),
  white: mat('#e8e2d6'),
  dark: mat('#343840', { roughness: 0.72 }),
  metal: mat('#aeb7c2', { roughness: 0.34, metalness: 0.22 }),
  glass: mat('#d9eff5', { transparent: true, opacity: 0.2, side: THREE.DoubleSide, roughness: 0.22 }),
  heat: mat('#ff8a3d', { emissive: '#7a2400', emissiveIntensity: 0.45, roughness: 0.42 }),
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

function sphere(parent, name, radius, position, material, scale = [1, 1, 1], segments = 28) {
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

function torus(parent, name, radius, tubeRadius, position, rotation, material) {
  return add(parent, name, new THREE.TorusGeometry(radius, tubeRadius, 18, 112), material, position, rotation)
}

function tube(parent, name, points, radius, material, tubularSegments = 72) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return add(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 12, false), material)
}

function arrow(parent, name, from, to, color = '#f0bd4f', radius = 0.022) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  const dir = end.clone().sub(start)
  const length = dir.length()
  const material = mat(color)
  const shaft = cyl(parent, `${name}-shaft`, radius, radius, length * 0.78, mid.toArray(), [0, 0, 0], material, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  const head = cone(parent, `${name}-head`, radius * 3.2, length * 0.18, end.toArray(), [0, 0, 0], material, 20)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function extents(parent, max = 3.4) {
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

async function exportScene(root, outDir, filename) {
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
  const outPath = fileURLToPath(new URL(filename, outDir))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, Buffer.from(result))
  console.log(`Wrote ${outPath}`)
}

function bench(root, name = 'concept-stage-reference-base') {
  box(root, name, [2.45, 0.08, 0.16], [0, -0.82, 0], M.dark)
}

function buildMechanics(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-physics-p1-${id}`
  extents(root)
  bench(root, 'mechanics-bench-reference-base')

  if (id === 'force') {
    box(root, 'pushed-block-force-target', [0.58, 0.42, 0.34], [-0.22, -0.35, 0], M.blue)
    arrow(root, 'applied-force-push-arrow', [-1.12, -0.18, 0.14], [-0.54, -0.18, 0.14], '#f0bd4f', 0.03)
    arrow(root, 'motion-response-arrow', [0.18, -0.18, 0.14], [0.88, -0.18, 0.14], '#8abf6d', 0.022)
  } else if (id === 'friction') {
    box(root, 'rough-surface-track-with-grip', [1.7, 0.12, 0.24], [0, -0.58, 0.04], M.orange)
    box(root, 'sliding-box-being-slowed', [0.48, 0.34, 0.3], [-0.1, -0.32, 0.08], M.blue)
    for (let i = 0; i < 7; i += 1) box(root, `surface-bump-friction-${i}`, [0.12, 0.08, 0.1], [-0.75 + i * 0.25, -0.47, 0.2], M.dark)
    arrow(root, 'motion-arrow-forward', [-0.65, 0.2, 0.16], [0.55, 0.2, 0.16], '#55a6d9', 0.018)
    arrow(root, 'friction-arrow-opposes-motion', [0.38, -0.1, 0.18], [-0.38, -0.1, 0.18], '#d9685a', 0.022)
  } else if (id === 'gravity') {
    sphere(root, 'large-planet-gravity-source', 0.48, [0, -0.28, 0], M.green, [1, 1, 1], 40)
    sphere(root, 'falling-object-pulled-inward', 0.14, [0, 0.72, 0.08], M.yellow)
    torus(root, 'gravity-field-ring-near-mass', 0.72, 0.018, [0, -0.28, 0], [Math.PI / 2, 0, 0], M.glass)
    arrow(root, 'gravity-pulls-toward-center', [0, 0.58, 0.14], [0, 0.08, 0.14], '#d9685a', 0.024)
  } else if (id === 'mass') {
    box(root, 'balance-scale-beam', [1.5, 0.08, 0.16], [0, -0.1, 0], M.metal, [0, 0, -0.09])
    cyl(root, 'scale-fulcrum-pivot', 0.18, 0.28, 0.48, [0, -0.52, 0], [0, 0, 0], M.dark, 32)
    sphere(root, 'larger-mass-sample', 0.25, [-0.58, -0.03, 0.1], M.purple)
    sphere(root, 'smaller-mass-sample', 0.14, [0.64, 0.08, 0.1], M.yellow)
    arrow(root, 'more-mass-more-inertia-marker', [-0.58, 0.3, 0.14], [-0.58, -0.24, 0.14], '#d9685a', 0.018)
  } else if (id === 'normal-force') {
    box(root, 'supporting-table-surface', [1.55, 0.14, 0.28], [0, -0.48, 0], M.dark)
    box(root, 'object-resting-on-surface', [0.48, 0.36, 0.32], [0, -0.23, 0.1], M.blue)
    arrow(root, 'normal-force-up-from-surface', [0, -0.5, 0.18], [0, 0.24, 0.18], '#55a6d9', 0.024)
    arrow(root, 'weight-down-balanced-by-normal', [0.28, 0.08, 0.18], [0.28, -0.5, 0.18], '#d9685a', 0.02)
  } else if (id === 'phase-change') {
    box(root, 'solid-state-packed-particles', [0.42, 0.18, 0.28], [-0.72, -0.34, 0.08], M.blue)
    cyl(root, 'liquid-state-beaker', 0.24, 0.2, 0.46, [0, -0.28, 0.06], [0, 0, 0], M.glass, 40)
    for (let i = 0; i < 7; i += 1) sphere(root, `gas-state-rising-particle-${i}`, 0.055, [0.46 + (i % 3) * 0.18, -0.12 + Math.floor(i / 3) * 0.22, 0.14], M.yellow)
    arrow(root, 'heat-drives-solid-to-liquid', [-0.48, -0.24, 0.16], [-0.18, -0.24, 0.16], '#ff8a3d', 0.016)
    arrow(root, 'heat-drives-liquid-to-gas', [0.24, -0.12, 0.16], [0.66, 0.32, 0.16], '#ff8a3d', 0.016)
  } else {
    sphere(root, 'object-with-mass-has-weight', 0.23, [0, 0.26, 0.08], M.orange)
    box(root, 'spring-scale-body', [0.22, 0.8, 0.12], [-0.55, 0.14, 0], M.glass)
    cyl(root, 'spring-scale-hook', 0.08, 0.08, 0.04, [-0.55, -0.34, 0.08], [Math.PI / 2, 0, 0], M.metal, 24)
    tube(root, 'scale-string-to-object', [[-0.45, -0.18, 0.12], [-0.18, 0.05, 0.12], [0, 0.15, 0.12]], 0.014, M.white)
    arrow(root, 'weight-force-downward', [0, 0.05, 0.16], [0, -0.58, 0.16], '#d9685a', 0.026)
  }
  return root
}

function buildEnergy(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-physics-p1-${id}`
  extents(root)
  bench(root, 'energy-bench-reference-base')
  box(root, 'height-reference-tower', [0.16, 1.28, 0.16], [-0.62, -0.12, 0], M.dark)
  sphere(root, 'raised-ball-stored-potential-energy', 0.22, [-0.2, 0.42, 0.1], M.yellow)
  sphere(root, 'lower-ball-less-potential-energy', 0.16, [0.62, -0.52, 0.1], M.blue)
  arrow(root, 'height-increases-stored-energy', [-0.9, -0.58, 0.14], [-0.9, 0.56, 0.14], '#8abf6d', 0.02)
  arrow(root, 'potential-can-become-motion', [-0.08, 0.28, 0.16], [0.44, -0.28, 0.16], '#d9685a', 0.022)
  return root
}

function heatWaves(root, name, x, y, material = M.heat) {
  for (let i = 0; i < 3; i += 1) {
    const dx = (i - 1) * 0.2
    tube(root, `${name}-thermal-wave-${i}`, [[x + dx, y - 0.22, 0.16], [x + dx + 0.08, y, 0.16], [x + dx - 0.04, y + 0.22, 0.16]], 0.018, material, 32)
  }
}

function buildHeat(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-physics-p1-${id}`
  extents(root)
  bench(root, 'thermal-bench-reference-base')

  if (id === 'conduction') {
    cyl(root, 'metal-rod-conducts-heat', 0.08, 0.08, 1.65, [0, -0.16, 0.08], [0, 0, Math.PI / 2], M.metal, 32)
    sphere(root, 'hot-end-particle-vibrating', 0.16, [-0.82, -0.16, 0.14], M.heat)
    sphere(root, 'cool-end-particle-warming', 0.13, [0.82, -0.16, 0.14], M.blue)
    arrow(root, 'heat-conducts-through-touch', [-0.62, 0.18, 0.16], [0.62, 0.18, 0.16], '#ff8a3d', 0.02)
  } else if (id === 'convection') {
    cyl(root, 'warm-fluid-beaker', 0.48, 0.38, 1.05, [0, -0.18, 0], [0, 0, 0], M.glass, 48)
    sphere(root, 'hot-less-dense-fluid-rises', 0.12, [-0.2, -0.48, 0.14], M.heat)
    sphere(root, 'cool-denser-fluid-sinks', 0.12, [0.24, 0.32, 0.14], M.blue)
    tube(root, 'convection-current-loop', [[-0.25, -0.5, 0.16], [-0.4, 0.22, 0.16], [0.18, 0.48, 0.16], [0.42, -0.2, 0.16], [-0.25, -0.5, 0.16]], 0.02, M.orange)
  } else if (id === 'radiation') {
    sphere(root, 'glowing-heat-source-radiates', 0.28, [-0.58, -0.08, 0.05], M.heat, [1, 1, 1], 40)
    for (let i = 0; i < 3; i += 1) torus(root, `radiation-energy-wave-${i}`, 0.42 + i * 0.2, 0.014, [-0.58, -0.08, 0.05], [Math.PI / 2, 0, 0], i === 2 ? M.yellow : M.orange)
    box(root, 'distant-object-warmed-without-touch', [0.34, 0.42, 0.2], [0.76, -0.16, 0.08], M.blue)
    arrow(root, 'radiation-travels-through-space', [-0.18, 0.3, 0.16], [0.48, 0.02, 0.16], '#f0bd4f', 0.018)
  } else if (id === 'temperature') {
    cyl(root, 'thermometer-glass-tube', 0.07, 0.07, 1.05, [0, -0.05, 0.04], [0, 0, 0], M.glass, 32)
    sphere(root, 'thermometer-bulb', 0.18, [0, -0.56, 0.08], M.red)
    cyl(root, 'red-liquid-temperature-level', 0.045, 0.045, 0.74, [0, -0.22, 0.1], [0, 0, 0], M.red, 24)
    sphere(root, 'fast-particle-high-temperature', 0.1, [0.62, 0.28, 0.14], M.orange)
    arrow(root, 'particle-speed-indicates-temperature', [0.44, 0.08, 0.16], [0.92, 0.44, 0.16], '#d98a52', 0.016)
  } else {
    sphere(root, 'many-particles-total-thermal-energy-cluster', 0.12, [-0.45, -0.1, 0.12], M.orange)
    for (let i = 0; i < 9; i += 1) sphere(root, `thermal-energy-particle-${i}`, 0.085, [-0.76 + (i % 3) * 0.26, -0.36 + Math.floor(i / 3) * 0.24, 0.1], i % 2 ? M.heat : M.yellow)
    heatWaves(root, 'stored-random-motion', 0.58, -0.05)
    arrow(root, 'more-particles-more-total-energy', [-0.05, 0.32, 0.15], [0.72, 0.32, 0.15], '#8abf6d', 0.018)
  }
  return root
}

function bond(root, name, from, to, radius = 0.028) {
  tube(root, name, [from, to], radius, M.white, 12)
}

function moleculeAtom(root, name, position, material, radius = 0.13) {
  return sphere(root, name, radius, position, material, [1, 1, 1], 28)
}

function carbonChain(root, prefix, count, startX = -0.55, y = 0.05) {
  const atoms = []
  for (let i = 0; i < count; i += 1) {
    const pos = [startX + i * 0.38, y + (i % 2) * 0.12, 0.1]
    atoms.push(pos)
    moleculeAtom(root, `${prefix}-carbon-${i}`, pos, M.dark, 0.13)
    if (i > 0) bond(root, `${prefix}-carbon-bond-${i - 1}-${i}`, atoms[i - 1], pos)
  }
  return atoms
}

function buildOrganic(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-chem-p1-${id}`
  extents(root)
  bench(root, 'organic-chemistry-bench-reference-base')

  if (id === 'carbon-chain') {
    carbonChain(root, 'visible-carbon-backbone', 5, -0.76, 0.0)
    arrow(root, 'carbon-chain-continues-direction', [-1.0, 0.36, 0.14], [1.0, 0.36, 0.14], '#f0bd4f', 0.016)
    for (let i = 0; i < 5; i += 1) moleculeAtom(root, `attached-hydrogen-marker-${i}`, [-0.76 + i * 0.38, -0.28 + (i % 2) * 0.08, 0.1], M.white, 0.065)
  } else if (id === 'functional-group') {
    const atoms = carbonChain(root, 'backbone', 3, -0.62, -0.08)
    moleculeAtom(root, 'highlighted-oxygen-functional-group', [0.34, 0.44, 0.1], M.red, 0.15)
    moleculeAtom(root, 'reactive-hydrogen-on-functional-group', [0.7, 0.54, 0.1], M.white, 0.09)
    bond(root, 'functional-group-attachment-bond', atoms[2], [0.34, 0.44, 0.1])
    bond(root, 'oxygen-hydrogen-polar-bond', [0.34, 0.44, 0.1], [0.7, 0.54, 0.1], 0.02)
    torus(root, 'functional-group-reactive-site-ring', 0.32, 0.018, [0.48, 0.48, 0.12], [Math.PI / 2, 0, 0], M.yellow)
  } else if (id === 'hydrocarbon') {
    const atoms = carbonChain(root, 'hydrocarbon-chain', 4, -0.66, 0.02)
    atoms.forEach((p, i) => {
      moleculeAtom(root, `hydrocarbon-hydrogen-top-${i}`, [p[0], p[1] + 0.28, 0.1], M.white, 0.08)
      moleculeAtom(root, `hydrocarbon-hydrogen-bottom-${i}`, [p[0], p[1] - 0.28, 0.1], M.white, 0.08)
      bond(root, `hydrocarbon-c-h-top-bond-${i}`, p, [p[0], p[1] + 0.28, 0.1], 0.018)
      bond(root, `hydrocarbon-c-h-bottom-bond-${i}`, p, [p[0], p[1] - 0.28, 0.1], 0.018)
    })
    arrow(root, 'carbon-hydrogen-only-composition-cue', [-0.92, 0.58, 0.15], [0.86, 0.58, 0.15], '#f0bd4f', 0.016)
  } else if (id === 'isomer') {
    const straight = carbonChain(root, 'straight-chain-isomer', 4, -0.92, 0.42)
    const branched = carbonChain(root, 'branched-chain-isomer', 3, -0.46, -0.32)
    moleculeAtom(root, 'branched-same-atoms-side-carbon', [-0.08, 0.0, 0.1], M.dark, 0.13)
    bond(root, 'branch-position-different-bond', branched[1], [-0.08, 0.0, 0.1])
    straight.forEach((p, i) => moleculeAtom(root, `straight-isomer-hydrogen-count-marker-${i}`, [p[0], p[1] + 0.23, 0.1], M.white, 0.065))
    torus(root, 'same-formula-different-shape-ring', 0.34, 0.014, [0.54, 0.05, 0.12], [Math.PI / 2, 0, 0], M.purple)
  } else if (id === 'monomer') {
    moleculeAtom(root, 'single-monomer-unit-center', [0, 0.02, 0.12], M.green, 0.22)
    moleculeAtom(root, 'left-linking-end', [-0.38, 0.02, 0.12], M.yellow, 0.11)
    moleculeAtom(root, 'right-linking-end', [0.38, 0.02, 0.12], M.yellow, 0.11)
    bond(root, 'monomer-left-reactive-link', [-0.38, 0.02, 0.12], [0, 0.02, 0.12], 0.024)
    bond(root, 'monomer-right-reactive-link', [0, 0.02, 0.12], [0.38, 0.02, 0.12], 0.024)
    arrow(root, 'monomer-ready-to-join-polymer', [0.58, 0.02, 0.14], [1.05, 0.02, 0.14], '#8abf6d', 0.018)
  } else {
    for (let i = 0; i < 6; i += 1) {
      const x = -0.8 + i * 0.32
      moleculeAtom(root, `repeating-polymer-monomer-unit-${i}`, [x, Math.sin(i * 0.9) * 0.13, 0.1], i % 2 ? M.green : M.purple, 0.14)
      if (i > 0) bond(root, `polymer-repeat-link-${i - 1}-${i}`, [-0.8 + (i - 1) * 0.32, Math.sin((i - 1) * 0.9) * 0.13, 0.1], [x, Math.sin(i * 0.9) * 0.13, 0.1], 0.026)
    }
    torus(root, 'long-chain-polymer-flexible-coil', 0.78, 0.015, [0, 0, 0.08], [Math.PI / 2, 0, 0], M.glass)
    arrow(root, 'many-monomers-linked-direction', [-1.05, -0.5, 0.14], [1.05, -0.5, 0.14], '#f0bd4f', 0.018)
  }
  return root
}

const physicsAssets = [
  ['force', buildMechanics],
  ['friction', buildMechanics],
  ['gravity', buildMechanics],
  ['mass', buildMechanics],
  ['normal-force', buildMechanics],
  ['weight', buildMechanics],
  ['potential-energy', buildEnergy],
  ['conduction', buildHeat],
  ['convection', buildHeat],
  ['radiation', buildHeat],
  ['temperature', buildHeat],
  ['phase-change', buildHeat],
]

const chemistryAssets = [
  'carbon-chain',
  'functional-group',
  'hydrocarbon',
  'isomer',
  'polymer',
]

for (const [id, builder] of physicsAssets) {
  await exportScene(builder(id), PHYSICS_OUT, `physics-p1-${id}.glb`)
}

for (const id of chemistryAssets) {
  await exportScene(buildOrganic(id), CHEMISTRY_OUT, `chem-p1-${id}.glb`)
}
