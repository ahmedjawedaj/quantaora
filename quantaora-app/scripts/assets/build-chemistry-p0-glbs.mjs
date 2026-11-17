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

const OUT_DIR = new URL('../../public/models/chemistry/authored/', import.meta.url)

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
  glass: mat('#d9eff5', { transparent: true, opacity: 0.2, side: THREE.DoubleSide, roughness: 0.22 }),
  water: mat('#73c7df', { transparent: true, opacity: 0.42, side: THREE.DoubleSide, roughness: 0.32 }),
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
  return add(parent, name, new THREE.TorusGeometry(radius, tubeRadius, 16, 100), material, position, rotation)
}

function tube(parent, name, points, radius, material, tubularSegments = 72) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return add(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 10, false), material)
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
  const head = cone(parent, `${name}-head`, radius * 3.1, length * 0.18, end.toArray(), [0, 0, 0], material, 18)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
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

function particleGrid(root, name, count, options = {}) {
  const { spread = 0.28, y = 0, motion = false, material = M.blue } = options
  for (let i = 0; i < count; i += 1) {
    const col = i % 5
    const row = Math.floor(i / 5)
    const x = (col - 2) * spread + (motion ? Math.sin(i) * 0.08 : 0)
    const yy = y + (row - 1.5) * spread + (motion ? Math.cos(i * 0.9) * 0.08 : 0)
    sphere(root, `${name}-particle-${i}`, 0.07, [x, yy, 0.08], material, [1, 1, 1], 20)
  }
}

function beaker(root, name, x = 0, liquid = M.water, fill = 0.5) {
  cyl(root, `${name}-glass`, 0.42, 0.34, 1.05, [x, -0.08, 0], [0, 0, 0], M.glass, 48)
  cyl(root, `${name}-liquid`, 0.36, 0.3, fill, [x, -0.48 + fill / 2, 0.02], [0, 0, 0], liquid, 48)
}

function buildStates(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'states-lab-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'chem-states-solid') {
    particleGrid(root, 'packed-solid-lattice', 20, { spread: 0.22, y: 0.08, material: M.blue })
    box(root, 'fixed-shape-cube-outline', [1.25, 1.0, 0.12], [0, 0.04, -0.02], M.glass)
    torus(root, 'tiny-wiggle-vibration-ring', 0.18, 0.012, [0.5, 0.45, 0.15], [Math.PI / 2, 0, 0], M.yellow)
  } else if (id === 'chem-states-liquid') {
    beaker(root, 'liquid-container-shape', 0, M.water, 0.62)
    particleGrid(root, 'close-sliding-liquid', 14, { spread: 0.22, y: -0.16, motion: true, material: M.blue })
    arrow(root, 'sliding-motion-flow-arrow', [-0.48, 0.28, 0.16], [0.48, 0.28, 0.16], '#d98a52')
  } else if (id === 'chem-states-gas') {
    box(root, 'gas-container-full-space', [1.35, 1.1, 0.12], [0, 0.0, 0], M.glass)
    particleGrid(root, 'far-apart-gas', 12, { spread: 0.38, y: 0, motion: true, material: M.green })
    arrow(root, 'expansion-direction', [-0.2, -0.25, 0.14], [0.65, 0.38, 0.14], '#8abf6d')
  } else if (id === 'chem-states-melting-freezing') {
    particleGrid(root, 'solid-side-ordered', 12, { spread: 0.2, y: 0.12, material: M.blue })
    particleGrid(root, 'liquid-side-sliding', 10, { spread: 0.2, y: -0.25, motion: true, material: M.orange })
    arrow(root, 'heat-melting-forward', [-0.72, 0.55, 0.15], [0.72, 0.55, 0.15], '#f0bd4f')
    arrow(root, 'cooling-freezing-back', [0.72, -0.62, 0.15], [-0.72, -0.62, 0.15], '#55a6d9')
  } else {
    beaker(root, 'evaporation-condensation-beaker', -0.42, M.water, 0.42)
    particleGrid(root, 'evaporating-fast-particles', 8, { spread: 0.26, y: 0.48, motion: true, material: M.green })
    cyl(root, 'cool-condensing-plate', 0.52, 0.52, 0.05, [0.4, 0.7, 0], [Math.PI / 2, 0, 0], M.glass, 48)
    arrow(root, 'vapor-up-condensation-down-loop', [-0.26, 0.02, 0.18], [0.38, 0.6, 0.18], '#55a6d9')
  }
  return root
}

function buildAcids(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'acid-base-lab-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'chem-acids-ph-scale') {
    box(root, 'ph-scale-bar-acid-to-base', [2.2, 0.18, 0.16], [0, 0, 0], M.glass)
    sphere(root, 'acid-side-low-ph-red', 0.18, [-0.85, 0.18, 0.12], M.red)
    sphere(root, 'neutral-seven-green', 0.18, [0, 0.18, 0.12], M.green)
    sphere(root, 'base-side-high-ph-blue', 0.18, [0.85, 0.18, 0.12], M.blue)
  } else if (id === 'chem-acids-acid') {
    beaker(root, 'acid-sample-red-solution', -0.35, M.red, 0.58)
    sphere(root, 'h-plus-ion-activity', 0.12, [0.36, 0.28, 0.14], M.red)
    sphere(root, 'reactive-metal-surface', 0.16, [0.78, -0.22, 0.12], M.dark, [1.5, 0.45, 0.3])
  } else if (id === 'chem-acids-base') {
    beaker(root, 'base-sample-blue-solution', -0.35, M.blue, 0.58)
    sphere(root, 'oh-minus-ion-behavior', 0.12, [0.36, 0.28, 0.14], M.blue)
    torus(root, 'slippery-cleaning-action-ring', 0.24, 0.02, [0.8, -0.18, 0.12], [Math.PI / 2, 0, 0], M.green)
  } else if (id === 'chem-acids-indicator') {
    beaker(root, 'indicator-left-acid-color', -0.62, M.red, 0.48)
    beaker(root, 'indicator-middle-neutral-color', 0, M.green, 0.48)
    beaker(root, 'indicator-right-base-color', 0.62, M.blue, 0.48)
    arrow(root, 'indicator-color-change-row', [-0.85, 0.55, 0.14], [0.85, 0.55, 0.14], '#f0bd4f')
  } else {
    beaker(root, 'acid-beaker-red', -0.62, M.red, 0.44)
    beaker(root, 'base-beaker-blue', 0.62, M.blue, 0.44)
    beaker(root, 'neutralization-product-center', 0, M.green, 0.5)
    arrow(root, 'acid-plus-base-meet', [-0.45, 0.34, 0.14], [-0.1, 0.18, 0.14], '#d9685a')
    arrow(root, 'base-plus-acid-meet', [0.45, 0.34, 0.14], [0.1, 0.18, 0.14], '#55a6d9')
  }
  return root
}

function buildSolutions(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'solutions-lab-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'chem-solutions-solute') {
    beaker(root, 'solvent-water-beaker', 0.18, M.water, 0.58)
    particleGrid(root, 'solute-crystals-entering', 8, { spread: 0.16, y: 0.42, material: M.yellow })
    arrow(root, 'solute-drops-into-solvent', [-0.5, 0.55, 0.16], [-0.05, 0.1, 0.16], '#f0bd4f')
  } else if (id === 'chem-solutions-solvent') {
    beaker(root, 'large-solvent-body', 0, M.water, 0.66)
    particleGrid(root, 'dissolved-small-solute', 10, { spread: 0.18, y: -0.12, motion: true, material: M.yellow })
    torus(root, 'solvent-surrounds-solute-shell', 0.32, 0.018, [0, -0.1, 0.16], [Math.PI / 2, 0, 0], M.blue)
  } else if (id === 'chem-solutions-concentration') {
    beaker(root, 'dilute-low-concentration', -0.55, M.water, 0.54)
    particleGrid(root, 'few-solute-particles', 5, { spread: 0.18, y: -0.15, material: M.yellow })
    beaker(root, 'concentrated-high-concentration', 0.55, M.water, 0.54)
    particleGrid(root, 'many-solute-particles', 14, { spread: 0.13, y: -0.15, material: M.orange })
  } else if (id === 'chem-solutions-saturation') {
    beaker(root, 'saturated-solution-beaker', 0, M.water, 0.58)
    particleGrid(root, 'dissolved-solute-full', 13, { spread: 0.16, y: -0.12, material: M.yellow })
    box(root, 'undissolved-crystal-pile-bottom', [0.58, 0.14, 0.16], [0, -0.58, 0.12], M.orange)
  } else {
    beaker(root, 'mixing-beaker-swirl', 0, M.water, 0.62)
    particleGrid(root, 'mixing-solute-spreading', 12, { spread: 0.2, y: -0.1, motion: true, material: M.yellow })
    tube(root, 'stirring-swirl-path', [[-0.32, 0.28, 0.16], [0.1, 0.45, 0.16], [0.38, 0.1, 0.16], [0.0, -0.18, 0.16], [-0.3, 0.06, 0.16]], 0.018, M.green)
  }
  return root
}

function buildStoich(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'stoichiometry-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'chem-stoich-mole') {
    particleGrid(root, 'particle-count-bundle-one-mole', 16, { spread: 0.16, y: 0.1, material: M.blue })
    box(root, 'mole-stack-counting-box', [0.85, 0.7, 0.14], [0, 0.1, 0], M.glass)
    arrow(root, 'double-amount-mole-arrow', [0.52, -0.42, 0.12], [0.92, -0.42, 0.12], '#8abf6d')
  } else if (id === 'chem-stoich-molar-mass') {
    box(root, 'scale-pan-gram-mass', [0.55, 0.1, 0.18], [-0.68, -0.22, 0], M.dark)
    sphere(root, 'formula-mass-molecule', 0.16, [0, 0.25, 0.12], M.purple)
    sphere(root, 'mole-result-counted-sample', 0.18, [0.72, -0.1, 0.12], M.green)
    arrow(root, 'grams-to-moles-bridge', [-0.45, 0.05, 0.12], [0.52, 0.05, 0.12], '#f0bd4f')
  } else if (id === 'chem-stoich-balanced-ratio') {
    sphere(root, 'reactant-coefficient-two', 0.16, [-0.85, 0.15, 0.12], M.blue)
    arrow(root, 'reaction-arrow-ratio', [-0.5, 0.15, 0.12], [0.42, 0.15, 0.12], '#d98a52')
    sphere(root, 'product-coefficient-two', 0.16, [0.75, 0.15, 0.12], M.green)
    box(root, 'balanced-equation-rail', [2.0, 0.08, 0.14], [0, -0.22, 0], M.glass)
  } else if (id === 'chem-stoich-limiting-reactant') {
    beaker(root, 'small-reactant-runs-out', -0.58, M.red, 0.34)
    beaker(root, 'excess-reactant-leftover', 0.12, M.blue, 0.64)
    beaker(root, 'product-cap-vial', 0.78, M.green, 0.44)
    arrow(root, 'limiting-reaction-stops', [-0.28, 0.3, 0.14], [0.52, 0.3, 0.14], '#f0bd4f')
  } else {
    beaker(root, 'theoretical-yield-vial', -0.58, M.blue, 0.66)
    beaker(root, 'actual-yield-vial', 0.12, M.orange, 0.44)
    torus(root, 'percent-yield-meter', 0.28, 0.024, [0.78, 0.05, 0.12], [Math.PI / 2, 0, 0], M.green)
    arrow(root, 'yield-gap-indicator', [-0.26, 0.44, 0.14], [0.48, 0.18, 0.14], '#d9685a')
  }
  return root
}

function buildBiolink(id) {
  const root = new THREE.Group()
  root.name = `quantaora-authored-${id}`
  extents(root)
  box(root, 'biochemistry-bench', [2.4, 0.08, 0.16], [0, -0.82, 0], M.dark)
  if (id === 'chem-biolink-amino-acid') {
    sphere(root, 'amino-group-nitrogen-end', 0.16, [-0.65, 0.1, 0.12], M.blue)
    sphere(root, 'central-carbon-backbone', 0.15, [0, 0.1, 0.12], M.dark)
    sphere(root, 'carboxyl-group-acid-end', 0.16, [0.58, 0.1, 0.12], M.red)
    sphere(root, 'side-chain-variable-r-group', 0.13, [0, 0.58, 0.12], M.green)
    tube(root, 'amino-acid-backbone-bonds', [[-0.65, 0.1, 0.12], [0, 0.1, 0.12], [0.58, 0.1, 0.12], [0, 0.58, 0.12]], 0.025, M.white)
  } else if (id === 'chem-biolink-protein-folding') {
    tube(root, 'folded-protein-chain-path', [[-0.9, 0.1, 0.12], [-0.45, 0.48, 0.12], [0.0, 0.08, 0.12], [0.42, 0.42, 0.12], [0.82, -0.05, 0.12], [0.22, -0.34, 0.12], [-0.38, -0.16, 0.12]], 0.045, M.purple)
    torus(root, 'fold-pocket-active-region', 0.28, 0.018, [0.18, 0.04, 0.14], [Math.PI / 2, 0, 0], M.yellow)
    sphere(root, 'condition-zone-heat-ph', 0.14, [0.82, 0.48, 0.12], M.orange)
  } else if (id === 'chem-biolink-enzyme-substrate') {
    sphere(root, 'enzyme-body-with-active-site', 0.42, [-0.32, 0.05, 0], M.purple, [1.15, 0.72, 0.42], 36)
    sphere(root, 'active-site-pocket-cutaway', 0.17, [-0.05, 0.08, 0.28], M.red)
    sphere(root, 'substrate-fitting-shape', 0.14, [0.48, 0.08, 0.14], M.orange)
    sphere(root, 'product-after-reaction', 0.12, [0.88, -0.32, 0.12], M.green)
    arrow(root, 'substrate-to-product-flow', [0.28, -0.12, 0.16], [0.76, -0.26, 0.16], '#8abf6d')
  } else if (id === 'chem-biolink-carbohydrate') {
    for (let i = 0; i < 6; i += 1) {
      const angle = (i / 6) * Math.PI * 2
      sphere(root, `sugar-ring-atom-${i}`, 0.1, [Math.cos(angle) * 0.34 - 0.28, Math.sin(angle) * 0.34 + 0.12, 0.12], i === 0 ? M.red : M.yellow)
    }
    tube(root, 'glycosidic-link-chain', [[0.1, 0.12, 0.12], [0.45, 0.12, 0.12], [0.8, 0.12, 0.12]], 0.035, M.white)
    arrow(root, 'energy-path-cell-work', [0.2, -0.35, 0.14], [0.88, -0.35, 0.14], '#8abf6d')
  } else {
    for (let i = 0; i < 8; i += 1) {
      const x = -0.8 + i * 0.23
      sphere(root, `head-layer-water-loving-${i}`, 0.07, [x, 0.32, 0.12], M.blue)
      sphere(root, `head-layer-water-loving-bottom-${i}`, 0.07, [x, -0.32, 0.12], M.blue)
      cyl(root, `tail-core-water-avoiding-${i}`, 0.025, 0.025, 0.42, [x, 0, 0.12], [0, 0, 0], M.orange, 12)
    }
    box(root, 'selective-barrier-bilayer-plane', [1.9, 0.72, 0.04], [0, 0, 0], M.glass)
  }
  return root
}

const ids = [
  'chem-states-solid',
  'chem-states-liquid',
  'chem-states-gas',
  'chem-states-melting-freezing',
  'chem-states-evaporation-condensation',
  'chem-acids-ph-scale',
  'chem-acids-acid',
  'chem-acids-base',
  'chem-acids-indicator',
  'chem-acids-neutralization',
  'chem-solutions-solute',
  'chem-solutions-solvent',
  'chem-solutions-concentration',
  'chem-solutions-saturation',
  'chem-solutions-dissolving-mixing',
  'chem-stoich-mole',
  'chem-stoich-molar-mass',
  'chem-stoich-balanced-ratio',
  'chem-stoich-limiting-reactant',
  'chem-stoich-yield',
  'chem-biolink-amino-acid',
  'chem-biolink-protein-folding',
  'chem-biolink-enzyme-substrate',
  'chem-biolink-carbohydrate',
  'chem-biolink-lipid-membrane',
]

for (const id of ids) {
  const builder = id.startsWith('chem-states-')
    ? buildStates
    : id.startsWith('chem-acids-')
      ? buildAcids
      : id.startsWith('chem-solutions-')
        ? buildSolutions
        : id.startsWith('chem-stoich-')
          ? buildStoich
          : buildBiolink
  await exportScene(builder(id), `${id}.glb`)
}
