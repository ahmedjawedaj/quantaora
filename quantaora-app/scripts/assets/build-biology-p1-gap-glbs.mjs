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

const OUT_DIR = new URL('../../public/models/biology/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.14,
    clearcoatRoughness: 0.5,
    ...options,
  })
}

const M = {
  air: mat('#8fd3ff', { transparent: true, opacity: 0.36, side: THREE.DoubleSide }),
  amber: mat('#e7a34f'),
  bark: mat('#8b5a3c'),
  blue: mat('#4f9ed8'),
  cream: mat('#f0dfbf'),
  dark: mat('#383634', { roughness: 0.72 }),
  glass: mat('#d7efe8', { transparent: true, opacity: 0.26, side: THREE.DoubleSide }),
  green: mat('#70a95f'),
  lightGreen: mat('#a6c86a'),
  pink: mat('#d98591'),
  purple: mat('#8e75c8'),
  red: mat('#c95b55'),
  soil: mat('#6f5542'),
  white: mat('#f2ead9'),
  yellow: mat('#ecc85d'),
}

function mesh(parent, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geometry, material)
  item.name = name
  item.position.set(...position)
  item.rotation.set(...rotation)
  item.scale.set(...scale)
  parent.add(item)
  return item
}

const sphere = (p, n, r, pos, material, scale = [1, 1, 1], segments = 32) =>
  mesh(p, n, new THREE.SphereGeometry(r, segments, segments), material, pos, [0, 0, 0], scale)
const box = (p, n, size, pos, material, rot = [0, 0, 0]) => mesh(p, n, new THREE.BoxGeometry(...size), material, pos, rot)
const cyl = (p, n, rt, rb, h, pos, rot, material, seg = 32) =>
  mesh(p, n, new THREE.CylinderGeometry(rt, rb, h, seg), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) =>
  mesh(p, n, new THREE.TorusGeometry(r, t, 16, 96), material, pos, rot)
const cone = (p, n, r, h, pos, rot, material) => mesh(p, n, new THREE.ConeGeometry(r, h, 28), material, pos, rot)

function tube(parent, name, points, radius, material, tubularSegments = 64) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return mesh(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 10, false), material)
}

function extents(parent, max = 2.35) {
  const half = max / 2
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[
    [-half, 0, 0],
    [half, 0, 0],
    [0, -half, 0],
    [0, half, 0],
    [0, 0, -half],
    [0, 0, half],
  ].forEach((position, i) => sphere(parent, `normalization-anchor-${i}`, 0.001, position, invisible, [1, 1, 1], 8))
}

function arrow(parent, name, from, to, color = '#d97757') {
  const material = mat(color)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  const dir = end.clone().sub(start)
  const len = dir.length()
  const unit = dir.clone().normalize()
  const shaft = cyl(parent, `${name}-shaft`, 0.018, 0.018, len * 0.72, mid.toArray(), [0, 0, 0], material, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit)
  const head = cone(parent, `${name}-head`, 0.055, 0.16, end.toArray(), [0, 0, 0], material)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), unit)
}

function root(id) {
  const group = new THREE.Group()
  group.name = `quantaora-authored-bio-p1-${id}`
  extents(group)
  return group
}

function addPlantIcon(group, x, y, s = 1) {
  cyl(group, 'producer-plant-stem', 0.025 * s, 0.035 * s, 0.42 * s, [x, y, 0.12], [0, 0, -0.08], M.green)
  sphere(group, 'producer-plant-leaf-left', 0.1 * s, [x - 0.1 * s, y + 0.08 * s, 0.14], M.lightGreen, [1.35, 0.55, 0.28])
  sphere(group, 'producer-plant-leaf-right', 0.1 * s, [x + 0.1 * s, y + 0.16 * s, 0.14], M.green, [1.35, 0.55, 0.28])
}

function addAnimalIcon(group, name, x, y, material = M.amber, s = 1) {
  sphere(group, `${name}-body`, 0.18 * s, [x, y, 0.16], material, [1.35, 0.68, 0.38])
  sphere(group, `${name}-head`, 0.1 * s, [x + 0.22 * s, y + 0.07 * s, 0.18], material)
  cone(group, `${name}-tail`, 0.06 * s, 0.18 * s, [x - 0.24 * s, y + 0.02 * s, 0.16], [0, 0, Math.PI / 2], material)
}

function addPhysiology(group, id) {
  if (id === 'breathing') {
    sphere(group, 'left-lung-air-sac', 0.28, [-0.28, 0.02, 0.18], M.pink, [0.82, 1.25, 0.42])
    sphere(group, 'right-lung-air-sac', 0.28, [0.28, 0.02, 0.18], M.pink, [0.82, 1.25, 0.42])
    tube(group, 'trachea-splits-to-bronchi', [[0, 0.72, 0.18], [0, 0.3, 0.18], [-0.22, 0.0, 0.2]], 0.035, M.white)
    tube(group, 'bronchus-to-right-lung', [[0, 0.3, 0.18], [0.22, 0.0, 0.2]], 0.035, M.white)
    cyl(group, 'diaphragm-moving-dome', 0.58, 0.58, 0.04, [0, -0.56, 0.12], [Math.PI / 2, 0, 0], M.purple)
    arrow(group, 'air-in-flow', [0, 1.0, 0.24], [0, 0.5, 0.24], '#4f9ed8')
  } else if (id === 'digestion') {
    tube(group, 'mouth-to-stomach-food-path', [[-0.65, 0.48, 0.18], [-0.22, 0.18, 0.18], [-0.05, -0.1, 0.18], [0.34, -0.22, 0.18]], 0.055, M.pink)
    sphere(group, 'stomach-churning-pouch', 0.24, [0.2, -0.12, 0.2], M.amber, [1.25, 0.82, 0.45])
    tube(group, 'small-intestine-coils-absorb-nutrients', [[-0.36, -0.42, 0.2], [-0.08, -0.28, 0.22], [0.2, -0.46, 0.2], [0.5, -0.3, 0.22]], 0.045, M.yellow)
    for (let i = 0; i < 5; i += 1) sphere(group, `nutrient-absorbed-${i}`, 0.045, [-0.36 + i * 0.18, -0.66, 0.22], [M.green, M.blue, M.red, M.purple, M.yellow][i])
  } else if (id === 'hormone-signaling') {
    sphere(group, 'endocrine-gland-source', 0.22, [-0.68, 0.24, 0.18], M.purple)
    tube(group, 'bloodstream-hormone-highway', [[-0.48, 0.08, 0.16], [-0.08, -0.12, 0.16], [0.42, 0.02, 0.16]], 0.05, M.red)
    for (let i = 0; i < 5; i += 1) sphere(group, `hormone-message-${i}`, 0.04, [-0.36 + i * 0.18, -0.02 + (i % 2) * 0.12, 0.24], M.yellow)
    sphere(group, 'target-cell-with-receptor', 0.26, [0.7, 0.0, 0.18], M.green, [1.05, 0.82, 0.46])
    torus(group, 'matching-receptor-dock', 0.12, 0.018, [0.52, 0.02, 0.28], [Math.PI / 2, 0, 0], M.blue)
  } else if (id === 'kidney-filtration') {
    sphere(group, 'kidney-filter-bean', 0.34, [-0.16, 0, 0.18], M.red, [0.78, 1.22, 0.42])
    tube(group, 'renal-artery-inlet', [[-0.88, 0.16, 0.18], [-0.44, 0.06, 0.2]], 0.045, M.red)
    tube(group, 'renal-vein-clean-outlet', [[-0.4, -0.08, 0.2], [-0.88, -0.28, 0.18]], 0.045, M.blue)
    tube(group, 'ureter-waste-drain', [[0.08, -0.26, 0.2], [0.42, -0.58, 0.18], [0.62, -0.82, 0.16]], 0.035, M.yellow)
    for (let i = 0; i < 6; i += 1) sphere(group, `filtered-waste-particle-${i}`, 0.035, [0.26 + i * 0.08, -0.42 - i * 0.05, 0.24], M.amber)
  } else {
    sphere(group, 'body-temperature-core', 0.34, [0, 0, 0.16], M.pink, [1.0, 1.2, 0.46])
    torus(group, 'homeostasis-comfort-zone', 0.5, 0.025, [0, 0, 0.18], [Math.PI / 2, 0, 0], M.green)
    cone(group, 'sweat-cooling-drop', 0.07, 0.16, [-0.52, 0.18, 0.2], [Math.PI, 0, 0], M.blue)
    sphere(group, 'shiver-heat-marker', 0.08, [0.54, -0.18, 0.22], M.red)
    arrow(group, 'cooling-feedback-arrow', [-0.74, 0.42, 0.24], [-0.34, 0.18, 0.24], '#4f9ed8')
    arrow(group, 'warming-feedback-arrow', [0.74, -0.42, 0.24], [0.34, -0.18, 0.24], '#c95b55')
  }
}

function addEcology(group, id) {
  if (id === 'community') {
    addPlantIcon(group, -0.55, -0.18, 0.9)
    addAnimalIcon(group, 'herbivore-member', -0.05, -0.2, M.amber, 0.75)
    addAnimalIcon(group, 'predator-member', 0.5, 0.08, M.red, 0.78)
    sphere(group, 'fungus-member', 0.12, [0.1, 0.46, 0.14], M.purple, [1, 0.8, 0.5])
    torus(group, 'many-species-together-ring', 0.78, 0.018, [0, 0, 0.12], [Math.PI / 2, 0, 0], M.blue)
  } else if (id === 'consumer') {
    addPlantIcon(group, -0.58, -0.12, 0.95)
    addAnimalIcon(group, 'consumer-eating-animal', 0.12, -0.02, M.amber, 1)
    arrow(group, 'energy-from-food-arrow', [-0.34, 0.02, 0.24], [0.28, 0.02, 0.24], '#e7a34f')
  } else if (id === 'decomposer') {
    box(group, 'fallen-leaf-litter', [0.9, 0.12, 0.06], [-0.18, -0.36, 0.08], M.bark, [0, 0, -0.18])
    for (let i = 0; i < 5; i += 1) sphere(group, `mushroom-cap-${i}`, 0.08, [-0.42 + i * 0.2, -0.08 + (i % 2) * 0.14, 0.18], M.purple, [1, 0.72, 0.45])
    for (let i = 0; i < 6; i += 1) sphere(group, `released-nutrient-dot-${i}`, 0.035, [-0.5 + i * 0.18, -0.62, 0.18], M.yellow)
  } else if (id === 'habitat') {
    box(group, 'pond-water-place', [0.9, 0.42, 0.08], [-0.42, -0.28, 0.04], M.blue)
    box(group, 'shelter-log-place', [0.72, 0.18, 0.14], [0.45, -0.18, 0.1], M.bark)
    addPlantIcon(group, -0.58, 0.1, 0.78)
    addAnimalIcon(group, 'resident-organism', 0.2, 0.28, M.green, 0.78)
    torus(group, 'habitat-boundary-home', 0.82, 0.02, [0, 0, 0.1], [Math.PI / 2, 0, 0], M.white)
  } else if (id === 'niche') {
    addAnimalIcon(group, 'niche-role-organism', 0, 0.02, M.green, 0.9)
    box(group, 'food-role-tile', [0.32, 0.18, 0.06], [-0.56, 0.4, 0.08], M.yellow)
    box(group, 'shelter-role-tile', [0.32, 0.18, 0.06], [0.0, 0.55, 0.08], M.bark)
    box(group, 'timing-role-tile', [0.32, 0.18, 0.06], [0.56, 0.4, 0.08], M.blue)
    arrow(group, 'role-fit-arrows', [-0.42, 0.34, 0.16], [-0.14, 0.14, 0.2], '#70a95f')
  } else if (id === 'organism') {
    addAnimalIcon(group, 'single-organism-individual', 0, 0, M.amber, 1.2)
    torus(group, 'individual-focus-ring', 0.52, 0.022, [0, 0, 0.13], [Math.PI / 2, 0, 0], M.blue)
  } else if (id === 'population') {
    for (let i = 0; i < 10; i += 1) addAnimalIcon(group, `same-species-${i}`, -0.72 + (i % 5) * 0.36, -0.26 + Math.floor(i / 5) * 0.44, M.green, 0.46)
    torus(group, 'same-species-population-boundary', 0.9, 0.018, [0, 0, 0.08], [Math.PI / 2, 0, 0], M.green)
  } else if (id === 'predator') {
    addAnimalIcon(group, 'predator-hunter', -0.16, 0.08, M.red, 1.05)
    cone(group, 'predator-sharp-tooth-cue', 0.045, 0.14, [0.18, 0.2, 0.28], [Math.PI, 0, 0], M.white)
    addAnimalIcon(group, 'prey-target', 0.66, -0.2, M.amber, 0.55)
    arrow(group, 'hunt-direction-arrow', [0.18, 0.08, 0.24], [0.52, -0.1, 0.24], '#c95b55')
  } else {
    addAnimalIcon(group, 'prey-alert-body', -0.18, 0.02, M.amber, 0.9)
    sphere(group, 'large-eye-alert-cue', 0.045, [0.04, 0.13, 0.28], M.dark)
    box(group, 'grass-cover-refuge', [0.72, 0.2, 0.12], [0.48, -0.32, 0.08], M.green)
    arrow(group, 'escape-to-cover-arrow', [0.12, -0.02, 0.24], [0.5, -0.26, 0.24], '#4f9ed8')
  }
}

function addPlants(group, id) {
  if (id === 'chloroplast') {
    sphere(group, 'chloroplast-green-oval', 0.38, [0, 0, 0.16], M.green, [1.45, 0.72, 0.38], 48)
    for (let i = 0; i < 5; i += 1) cyl(group, `stacked-thylakoid-disc-${i}`, 0.13, 0.13, 0.035, [-0.36 + i * 0.18, 0.02, 0.28], [Math.PI / 2, 0, 0], M.lightGreen)
    arrow(group, 'sunlight-to-sugar-arrow', [-0.76, 0.42, 0.26], [-0.32, 0.12, 0.26], '#ecc85d')
  } else if (id === 'flower') {
    for (let i = 0; i < 6; i += 1) {
      const a = (i / 6) * Math.PI * 2
      sphere(group, `petal-attractor-${i}`, 0.16, [Math.cos(a) * 0.28, Math.sin(a) * 0.28, 0.2], M.pink, [1.1, 0.62, 0.26])
    }
    sphere(group, 'pollen-center', 0.13, [0, 0, 0.28], M.yellow)
    cyl(group, 'flower-stem', 0.035, 0.045, 0.76, [0, -0.64, 0.08], [0, 0, 0], M.green)
  } else if (id === 'leaf') {
    sphere(group, 'broad-leaf-blade', 0.42, [0, 0.06, 0.14], M.green, [1.55, 0.72, 0.22], 48)
    tube(group, 'central-leaf-vein', [[-0.55, 0.06, 0.24], [0.55, 0.06, 0.24]], 0.024, M.lightGreen)
    for (let i = 0; i < 4; i += 1) tube(group, `branching-vein-${i}`, [[-0.2 + i * 0.14, 0.06, 0.24], [-0.02 + i * 0.12, 0.28 - (i % 2) * 0.44, 0.24]], 0.012, M.lightGreen)
  } else if (id === 'phloem') {
    cyl(group, 'phloem-sugar-transport-tube', 0.16, 0.16, 1.35, [0, 0, 0.12], [0, 0, Math.PI / 2], M.amber)
    for (let i = 0; i < 5; i += 1) sphere(group, `sugar-flow-particle-${i}`, 0.055, [-0.48 + i * 0.24, 0.03, 0.26], M.yellow)
    arrow(group, 'food-moves-both-ways-arrow', [-0.64, 0.32, 0.26], [0.64, 0.32, 0.26], '#e7a34f')
  } else if (id === 'root') {
    cyl(group, 'main-root-anchor', 0.07, 0.12, 1.05, [0, -0.12, 0.12], [0, 0, 0.1], M.bark)
    for (let i = 0; i < 5; i += 1) tube(group, `branch-root-hair-${i}`, [[-0.1 + i * 0.05, -0.1 - i * 0.12, 0.16], [-0.48 + i * 0.22, -0.34 - i * 0.06, 0.16]], 0.018, M.bark)
    sphere(group, 'water-mineral-uptake-drop', 0.08, [-0.58, -0.48, 0.2], M.blue)
    arrow(group, 'uptake-arrow-to-plant', [-0.52, -0.42, 0.24], [-0.14, 0.08, 0.24], '#4f9ed8')
  } else if (id === 'seed') {
    sphere(group, 'seed-coat-shell', 0.34, [0, 0, 0.16], M.bark, [0.86, 1.18, 0.48], 48)
    sphere(group, 'embryo-plant-inside', 0.12, [0.06, 0.02, 0.3], M.green, [0.75, 1.25, 0.45])
    sphere(group, 'stored-food-cotyledon', 0.16, [-0.1, -0.08, 0.28], M.yellow, [1.2, 0.8, 0.35])
    arrow(group, 'sprout-growth-arrow', [0.24, 0.32, 0.26], [0.48, 0.72, 0.28], '#70a95f')
  } else if (id === 'stem') {
    cyl(group, 'supporting-stem-column', 0.12, 0.16, 1.45, [0, 0, 0.1], [0, 0, 0], M.green)
    tube(group, 'xylem-up-channel-inside-stem', [[-0.04, -0.58, 0.24], [-0.04, 0.58, 0.24]], 0.024, M.blue)
    tube(group, 'phloem-down-channel-inside-stem', [[0.06, 0.58, 0.24], [0.06, -0.58, 0.24]], 0.024, M.amber)
    sphere(group, 'attached-leaf-node', 0.16, [0.28, 0.28, 0.18], M.lightGreen, [1.35, 0.5, 0.22])
  } else if (id === 'stomata') {
    sphere(group, 'left-guard-cell', 0.22, [-0.18, 0, 0.16], M.green, [0.62, 1.35, 0.3])
    sphere(group, 'right-guard-cell', 0.22, [0.18, 0, 0.16], M.green, [0.62, 1.35, 0.3])
    box(group, 'open-stoma-pore-gap', [0.12, 0.5, 0.035], [0, 0, 0.22], M.dark)
    arrow(group, 'carbon-dioxide-in', [-0.72, 0.24, 0.26], [-0.12, 0.08, 0.26], '#4f9ed8')
    arrow(group, 'water-vapor-out', [0.12, -0.08, 0.26], [0.72, -0.24, 0.26], '#8fd3ff')
  } else {
    cyl(group, 'xylem-water-pipe', 0.16, 0.16, 1.35, [0, 0, 0.12], [0, 0, Math.PI / 2], M.blue)
    for (let i = 0; i < 5; i += 1) sphere(group, `water-mineral-flow-${i}`, 0.055, [-0.48 + i * 0.24, 0.02, 0.26], M.air)
    arrow(group, 'water-moves-upward-arrow', [-0.62, -0.3, 0.26], [0.62, 0.3, 0.26], '#4f9ed8')
  }
}

function addMicrobiology(group, id) {
  if (id === 'bacteria') {
    sphere(group, 'bacterium-capsule-rod', 0.36, [0, 0, 0.16], M.green, [1.7, 0.58, 0.36], 48)
    tube(group, 'looped-dna-nucleoid', [[-0.32, 0.08, 0.3], [-0.05, 0.2, 0.32], [0.24, 0.04, 0.3], [0, -0.14, 0.32], [-0.32, 0.08, 0.3]], 0.016, M.purple)
    for (let i = 0; i < 9; i += 1) sphere(group, `ribosome-dot-${i}`, 0.025, [-0.45 + i * 0.11, -0.12 + (i % 3) * 0.11, 0.28], M.dark)
    tube(group, 'flagellum-swimming-tail', [[0.62, 0, 0.12], [0.9, -0.16, 0.12], [1.12, 0.1, 0.12]], 0.024, M.white)
  } else if (id === 'fungus') {
    for (let i = 0; i < 4; i += 1) {
      cyl(group, `hypha-thread-${i}`, 0.018, 0.018, 0.72, [-0.42 + i * 0.28, -0.1, 0.12], [0.55, 0, -0.35 + i * 0.22], M.white)
      sphere(group, `spore-cap-${i}`, 0.09, [-0.42 + i * 0.28, 0.26, 0.24], M.purple, [1, 0.72, 0.45])
    }
    box(group, 'decomposing-food-base', [1.1, 0.12, 0.06], [0, -0.48, 0.06], M.bark)
  } else if (id === 'microbiome') {
    sphere(group, 'gut-home-habitat', 0.46, [0, 0, 0.12], M.glass, [1.25, 0.82, 0.35])
    for (let i = 0; i < 14; i += 1) sphere(group, `friendly-microbe-${i}`, 0.055, [-0.55 + (i % 7) * 0.18, -0.2 + Math.floor(i / 7) * 0.28, 0.24], [M.green, M.yellow, M.blue, M.purple][i % 4])
    torus(group, 'balanced-community-ring', 0.68, 0.018, [0, 0, 0.18], [Math.PI / 2, 0, 0], M.green)
  } else if (id === 'protozoa') {
    sphere(group, 'protozoan-cell-body', 0.32, [0, 0, 0.16], M.glass, [1.25, 0.82, 0.42], 48)
    sphere(group, 'protozoan-nucleus', 0.1, [-0.08, 0.04, 0.3], M.purple)
    for (let i = 0; i < 7; i += 1) tube(group, `cilia-hair-${i}`, [[-0.44 + i * 0.14, -0.2, 0.18], [-0.52 + i * 0.16, -0.42, 0.18]], 0.011, M.white, 24)
    arrow(group, 'single-cell-swim-arrow', [-0.78, 0.38, 0.24], [-0.22, 0.22, 0.24], '#4f9ed8')
  } else {
    sphere(group, 'virus-capsid-core', 0.25, [0, 0, 0.16], M.purple, [1, 1, 0.72], 48)
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2
      cone(group, `virus-surface-spike-${i}`, 0.035, 0.16, [Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0.18], [0, 0, -a + Math.PI / 2], M.red)
    }
    tube(group, 'genetic-material-inside', [[-0.16, 0.02, 0.32], [0, 0.12, 0.34], [0.16, -0.02, 0.32]], 0.018, M.yellow)
  }
}

function build(id) {
  const group = root(id)
  if (PHYSIOLOGY_IDS.includes(id)) addPhysiology(group, id)
  else if (ECOLOGY_IDS.includes(id)) addEcology(group, id)
  else if (PLANT_IDS.includes(id)) addPlants(group, id)
  else addMicrobiology(group, id)
  return group
}

async function exportScene(scene, filename) {
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

const PHYSIOLOGY_IDS = ['breathing', 'digestion', 'hormone-signaling', 'kidney-filtration', 'temperature-regulation']
const ECOLOGY_IDS = ['community', 'consumer', 'decomposer', 'habitat', 'niche', 'organism', 'population', 'predator', 'prey']
const PLANT_IDS = ['chloroplast', 'flower', 'leaf', 'phloem', 'root', 'seed', 'stem', 'stomata', 'xylem']
const MICROBIOLOGY_IDS = ['bacteria', 'fungus', 'microbiome', 'protozoa', 'virus']

for (const id of [...PHYSIOLOGY_IDS, ...ECOLOGY_IDS, ...PLANT_IDS, ...MICROBIOLOGY_IDS]) {
  await exportScene(build(id), `bio-p1-${id}.glb`)
}
