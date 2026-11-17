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
  membrane: mat('#efd8c5', { transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
  cytoplasm: mat('#f6ead9', { transparent: true, opacity: 0.2, side: THREE.DoubleSide }),
  coral: mat('#d97757'),
  rust: mat('#a94f39'),
  green: mat('#7fa968'),
  blue: mat('#5aa6d6'),
  purple: mat('#9b7acb'),
  yellow: mat('#e8b95f'),
  dark: mat('#3f3b38', { roughness: 0.72 }),
  white: mat('#efe6d3'),
  glass: mat('#cfe8e0', { transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
  red: mat('#c95b55'),
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
const box = (p, n, size, pos, material, rot = [0, 0, 0]) =>
  mesh(p, n, new THREE.BoxGeometry(...size), material, pos, rot)
const cyl = (p, n, rt, rb, h, pos, rot, material, seg = 32) =>
  mesh(p, n, new THREE.CylinderGeometry(rt, rb, h, seg), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) =>
  mesh(p, n, new THREE.TorusGeometry(r, t, 16, 96), material, pos, rot)
const cone = (p, n, r, h, pos, rot, material) =>
  mesh(p, n, new THREE.ConeGeometry(r, h, 28), material, pos, rot)

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
  const shaft = cyl(parent, `${name}-shaft`, 0.018, 0.018, len * 0.74, mid.toArray(), [0, 0, 0], material, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  const head = cone(parent, `${name}-head`, 0.055, 0.16, end.toArray(), [0, 0, 0], material)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
}

function root(id) {
  const group = new THREE.Group()
  group.name = `quantaora-authored-${id}`
  extents(group)
  return group
}

function addCellScene(group, id) {
  if (id === 'plant-cell') {
    box(group, 'cellulose-cell-wall', [1.7, 1.0, 0.2], [0, 0, 0], M.green)
    box(group, 'cell-membrane-under-wall', [1.52, 0.84, 0.16], [0, 0, 0.03], M.membrane)
    sphere(group, 'large-central-vacuole', 0.34, [0.2, 0.02, 0.14], M.glass, [1.45, 0.82, 0.38], 40)
    sphere(group, 'nucleus', 0.16, [-0.48, 0.22, 0.24], M.coral)
    for (let i = 0; i < 5; i += 1) sphere(group, `chloroplast-${i}`, 0.09, [-0.52 + i * 0.26, -0.25 + (i % 2) * 0.16, 0.25], M.green, [1.35, 0.72, 0.5])
  } else if (id === 'bacterial-cell') {
    sphere(group, 'capsule-outer-coat', 0.52, [0, 0, 0], M.glass, [1.65, 0.62, 0.45], 48)
    sphere(group, 'cell-wall-and-membrane', 0.46, [0, 0, 0.03], M.green, [1.55, 0.54, 0.38], 48)
    tube(group, 'looped-bacterial-dna-nucleoid', [[-0.34, 0.1, 0.3], [-0.08, 0.25, 0.34], [0.22, 0.12, 0.32], [0.08, -0.12, 0.34], [-0.28, -0.1, 0.32], [-0.34, 0.1, 0.3]], 0.018, M.purple)
    for (let i = 0; i < 10; i += 1) sphere(group, `ribosome-dot-${i}`, 0.025, [-0.55 + i * 0.12, -0.18 + (i % 4) * 0.12, 0.28], M.dark)
    tube(group, 'flagellum-tail', [[0.78, -0.02, 0.04], [1.02, -0.16, 0.06], [1.18, 0.14, 0.06]], 0.024, M.white)
  } else if (id === 'red-blood-cell') {
    torus(group, 'biconcave-red-blood-cell-rim', 0.48, 0.13, [0, 0, 0], [Math.PI / 2, 0, 0], M.red)
    sphere(group, 'soft-center-dimple-front', 0.3, [0, 0, 0.02], M.red, [1, 1, 0.16])
    sphere(group, 'oxygen-cargo-a', 0.08, [-0.58, 0.0, 0.14], M.blue)
    sphere(group, 'oxygen-cargo-b', 0.08, [0.58, 0.0, 0.14], M.blue)
    arrow(group, 'oxygen-delivery-flow', [-0.85, 0.25, 0.2], [0.85, 0.25, 0.2], '#5aa6d6')
  } else if (id === 'muscle-cell') {
    box(group, 'long-muscle-fiber-body', [1.8, 0.38, 0.26], [0, 0, 0], M.coral)
    for (let i = 0; i < 8; i += 1) box(group, `striated-band-${i}`, [0.05, 0.42, 0.28], [-0.76 + i * 0.22, 0, 0.02], i % 2 ? M.rust : M.yellow)
    tube(group, 'actin-myosin-overlap-line-a', [[-0.8, 0.16, 0.18], [0.8, 0.16, 0.18]], 0.018, M.white)
    tube(group, 'actin-myosin-overlap-line-b', [[-0.8, -0.16, 0.18], [0.8, -0.16, 0.18]], 0.018, M.white)
    arrow(group, 'contraction-direction-left', [-0.9, 0.45, 0.18], [-0.24, 0.45, 0.18], '#9b7acb')
    arrow(group, 'contraction-direction-right', [0.9, 0.45, 0.18], [0.24, 0.45, 0.18], '#9b7acb')
  } else if (id === 'sperm-cell') {
    sphere(group, 'dna-head', 0.18, [-0.78, 0.08, 0], M.white, [1.35, 0.82, 0.5])
    sphere(group, 'acrosome-cap', 0.08, [-0.94, 0.1, 0.04], M.coral, [1.3, 0.7, 0.45])
    cyl(group, 'mitochondria-midpiece', 0.08, 0.08, 0.28, [-0.45, 0.03, 0], [0, 0, Math.PI / 2], M.yellow)
    tube(group, 'motile-flagellum', [[-0.28, 0, 0], [0.06, -0.12, 0.05], [0.42, 0.08, -0.02], [0.76, -0.06, 0.03], [1.05, 0.12, 0]], 0.028, M.white)
  } else {
    sphere(group, 'zona-pellucida-protective-coat', 0.56, [0, 0, 0], M.glass, [1, 1, 0.62], 48)
    sphere(group, 'nutrient-rich-cytoplasm', 0.46, [0, 0, 0.06], M.yellow, [1, 1, 0.48], 48)
    sphere(group, 'egg-nucleus-half-dna-set', 0.16, [0.12, 0.12, 0.32], M.coral)
    torus(group, 'single-entry-protection-ring', 0.62, 0.018, [0, 0, 0], [Math.PI / 2, 0, 0], M.purple)
  }
}

function addEvolutionScene(group, id) {
  box(group, 'generation-ground', [2.0, 0.08, 0.2], [0, -0.72, 0], M.dark)
  if (id.endsWith('variation')) {
    for (let i = 0; i < 8; i += 1) sphere(group, `population-trait-${i}`, 0.1, [-0.7 + i * 0.2, -0.35 + (i % 2) * 0.24, 0.14], i % 3 ? M.green : M.coral)
  } else if (id.endsWith('natural-selection')) {
    for (let i = 0; i < 6; i += 1) sphere(group, `selected-survivor-${i}`, 0.09, [-0.55 + i * 0.2, -0.25 + (i % 2) * 0.14, 0.14], i < 4 ? M.green : M.coral)
    arrow(group, 'selection-pressure-arrow', [-0.9, 0.35, 0.18], [-0.25, 0.05, 0.18], '#c95b55')
  } else if (id.endsWith('adaptation')) {
    box(group, 'water-habitat-zone', [0.85, 0.42, 0.08], [-0.48, -0.3, 0], M.blue)
    box(group, 'dry-habitat-zone', [0.85, 0.42, 0.08], [0.48, -0.3, 0], M.yellow)
    sphere(group, 'webbed-foot-trait', 0.16, [-0.42, 0.08, 0.16], M.green, [1.4, 0.5, 0.2])
    sphere(group, 'trait-benefit-marker', 0.1, [0.55, 0.12, 0.16], M.coral)
  } else if (id.endsWith('fossil-evidence')) {
    for (let i = 0; i < 4; i += 1) box(group, `rock-layer-${i}`, [1.75, 0.16, 0.12], [0, -0.52 + i * 0.22, 0], i % 2 ? M.yellow : M.dark)
    torus(group, 'fossil-impression-shell', 0.2, 0.025, [-0.42, -0.2, 0.18], [Math.PI / 2, 0, 0], M.white)
    tube(group, 'later-fossil-bone-sequence', [[0.18, 0.18, 0.18], [0.42, 0.24, 0.18], [0.62, 0.14, 0.18]], 0.03, M.white)
  } else {
    sphere(group, 'shared-ancestor-node', 0.11, [-0.72, -0.3, 0.14], M.purple)
    tube(group, 'ancestry-branch-a', [[-0.62, -0.22, 0.14], [-0.18, 0.08, 0.14], [0.32, 0.42, 0.14]], 0.02, M.green)
    tube(group, 'ancestry-branch-b', [[-0.62, -0.22, 0.14], [-0.1, -0.08, 0.14], [0.48, -0.36, 0.14]], 0.02, M.blue)
    sphere(group, 'derived-trait-marker', 0.09, [0.5, -0.36, 0.18], M.coral)
  }
}

function addAnimalScene(group, id) {
  if (id.endsWith('vertebrate')) {
    tube(group, 'vertebrate-backbone-chain', [[-0.78, 0.12, 0.14], [-0.36, 0.18, 0.14], [0.08, 0.1, 0.14], [0.52, 0.16, 0.14]], 0.035, M.white)
    for (let i = 0; i < 7; i += 1) sphere(group, `vertebra-${i}`, 0.055, [-0.72 + i * 0.2, 0.13 + Math.sin(i) * 0.04, 0.2], M.white)
    sphere(group, 'invertebrate-shell-contrast', 0.24, [0.62, -0.28, 0.16], M.green, [1.2, 0.7, 0.5])
  } else if (id.endsWith('body-systems')) {
    sphere(group, 'animal-body-outline', 0.56, [0, 0, 0], M.glass, [1.4, 0.72, 0.42])
    tube(group, 'circulation-loop', [[-0.48, 0.05, 0.22], [-0.1, 0.28, 0.24], [0.4, 0.08, 0.22], [0.08, -0.25, 0.22], [-0.48, 0.05, 0.22]], 0.025, M.red)
    sphere(group, 'gas-exchange-lungs-gills', 0.13, [-0.32, 0.2, 0.26], M.blue)
    sphere(group, 'digestion-energy-core', 0.16, [0.18, -0.08, 0.26], M.yellow)
  } else if (id.endsWith('habitat-adaptation')) {
    box(group, 'branch-habitat', [0.85, 0.12, 0.12], [-0.45, -0.34, 0], M.green)
    box(group, 'pond-habitat', [0.85, 0.12, 0.12], [0.45, -0.34, 0], M.blue)
    sphere(group, 'beak-or-foot-trait', 0.18, [0, 0.18, 0.16], M.yellow, [1.35, 0.5, 0.25])
    arrow(group, 'habitat-fit-test', [-0.32, 0.05, 0.18], [0.4, 0.05, 0.18], '#7fa968')
  } else if (id.endsWith('life-cycle')) {
    sphere(group, 'egg-stage', 0.1, [-0.65, -0.25, 0.16], M.white)
    sphere(group, 'larva-young-stage', 0.14, [-0.24, 0.08, 0.16], M.green, [1.35, 0.65, 0.35])
    sphere(group, 'adult-stage', 0.22, [0.45, 0.2, 0.16], M.coral, [1.2, 0.72, 0.42])
    arrow(group, 'stage-progression-a', [-0.52, -0.18, 0.2], [-0.3, 0.0, 0.2], '#5aa6d6')
    arrow(group, 'stage-progression-b', [-0.05, 0.08, 0.2], [0.25, 0.18, 0.2], '#5aa6d6')
  } else {
    sphere(group, 'cue-signal', 0.12, [-0.65, 0.22, 0.16], M.red)
    sphere(group, 'animal-response-body', 0.18, [0, 0, 0.16], M.green, [1.35, 0.68, 0.35])
    box(group, 'shelter-outcome', [0.36, 0.28, 0.18], [0.66, -0.22, 0.08], M.dark)
    arrow(group, 'behavior-response-arrow', [-0.48, 0.16, 0.2], [0.48, -0.1, 0.2], '#d97757')
  }
}

function addHealthScene(group, id) {
  if (id.endsWith('pathogen')) {
    sphere(group, 'pathogen-body', 0.28, [0, 0, 0.16], M.purple)
    for (let i = 0; i < 12; i += 1) {
      const a = (i / 12) * Math.PI * 2
      cone(group, `pathogen-surface-spike-${i}`, 0.035, 0.16, [Math.cos(a) * 0.34, Math.sin(a) * 0.34, 0.16], [0, 0, -a + Math.PI / 2], M.red)
    }
  } else if (id.endsWith('immune-response') || id.endsWith('vaccine')) {
    sphere(group, id.endsWith('vaccine') ? 'safe-antigen-marker' : 'pathogen-target', 0.18, [-0.45, 0.12, 0.16], id.endsWith('vaccine') ? M.yellow : M.red)
    torus(group, 'immune-shield-ring', 0.42, 0.04, [0.18, 0, 0.16], [Math.PI / 2, 0, 0], M.blue)
    sphere(group, 'memory-cell-response', 0.1, [0.72, -0.18, 0.18], M.purple)
    arrow(group, 'trained-response-arrow', [-0.24, 0.06, 0.2], [0.54, -0.1, 0.2], '#7fa968')
  } else if (id.endsWith('nutrition')) {
    for (let i = 0; i < 5; i += 1) sphere(group, `nutrient-group-${i}`, 0.1, [-0.65 + i * 0.32, 0.12 - (i % 2) * 0.28, 0.16], [M.yellow, M.green, M.blue, M.coral, M.purple][i])
    tube(group, 'digestion-track-to-body', [[-0.78, -0.34, 0.18], [-0.2, -0.18, 0.18], [0.4, -0.34, 0.18], [0.78, -0.12, 0.18]], 0.035, M.white)
  } else {
    for (let i = 0; i < 14; i += 1) sphere(group, `population-person-${i}`, 0.055, [-0.72 + (i % 7) * 0.24, -0.25 + Math.floor(i / 7) * 0.35, 0.16], i < 4 ? M.red : M.blue)
    arrow(group, 'contact-spread-arrow', [-0.54, 0.08, 0.2], [0.46, 0.08, 0.2], '#c95b55')
    torus(group, 'prevention-break-ring', 0.26, 0.02, [0.62, -0.24, 0.16], [Math.PI / 2, 0, 0], M.green)
  }
}

function addNeuroScene(group, id) {
  if (id.endsWith('neuron')) {
    sphere(group, 'soma-cell-body', 0.22, [-0.56, 0.22, 0.16], M.coral)
    tube(group, 'axon-output-path', [[-0.42, 0.12, 0.16], [0.05, -0.02, 0.16], [0.58, -0.22, 0.16]], 0.035, M.yellow)
    for (let i = 0; i < 4; i += 1) tube(group, `dendrite-input-${i}`, [[-0.68, 0.24, 0.16], [-0.96 + i * 0.12, 0.5 - i * 0.08, 0.16]], 0.018, M.coral)
    sphere(group, 'signal-pulse', 0.07, [0.18, -0.08, 0.22], M.purple)
  } else if (id.endsWith('synapse')) {
    tube(group, 'sending-terminal', [[-0.8, 0.18, 0.16], [-0.34, 0.02, 0.16]], 0.045, M.yellow)
    tube(group, 'receiving-dendrite', [[0.34, -0.02, 0.16], [0.82, -0.18, 0.16]], 0.045, M.coral)
    for (let i = 0; i < 8; i += 1) sphere(group, `neurotransmitter-${i}`, 0.035, [-0.18 + i * 0.05, 0.04 - (i % 2) * 0.08, 0.2], M.purple)
    box(group, 'synaptic-gap', [0.16, 0.48, 0.04], [0, 0, 0.12], M.glass)
  } else if (id.endsWith('reflex-arc')) {
    sphere(group, 'stimulus-sensor', 0.12, [-0.78, 0.28, 0.16], M.red)
    sphere(group, 'spinal-cord-relay', 0.18, [0, 0.02, 0.16], M.purple)
    sphere(group, 'muscle-response', 0.18, [0.72, -0.22, 0.16], M.coral, [1.5, 0.55, 0.3])
    arrow(group, 'sensory-path', [-0.64, 0.22, 0.2], [-0.14, 0.08, 0.2], '#5aa6d6')
    arrow(group, 'motor-path', [0.18, -0.02, 0.2], [0.56, -0.16, 0.2], '#7fa968')
  } else if (id.endsWith('brain-regions')) {
    sphere(group, 'brain-cortex-region', 0.42, [0, 0.08, 0.12], M.coral, [1.35, 0.82, 0.55], 48)
    sphere(group, 'cerebellum-region', 0.17, [0.46, -0.28, 0.18], M.green)
    cyl(group, 'brainstem-region', 0.08, 0.1, 0.42, [0.12, -0.48, 0.1], [0, 0, 0.15], M.yellow)
    tube(group, 'network-link', [[-0.42, 0.12, 0.22], [0.12, 0.28, 0.24], [0.48, -0.22, 0.22]], 0.018, M.purple)
  } else {
    sphere(group, 'stimulus-light-sound-pressure', 0.12, [-0.72, 0.22, 0.16], M.yellow)
    sphere(group, 'sensory-receptor', 0.2, [-0.18, 0.02, 0.16], M.blue)
    tube(group, 'nerve-signal-to-brain', [[0.04, 0, 0.18], [0.36, -0.08, 0.18], [0.78, 0.1, 0.18]], 0.028, M.purple)
    arrow(group, 'coded-signal-flow', [-0.56, 0.16, 0.22], [0.58, 0.04, 0.22], '#9b7acb')
  }
}

function addBiochemScene(group, id) {
  if (id.endsWith('protein')) {
    tube(group, 'folded-amino-acid-chain', [[-0.7, 0.0, 0.18], [-0.32, 0.32, 0.2], [0.12, 0.0, 0.18], [0.46, 0.24, 0.2], [0.72, -0.08, 0.18]], 0.04, M.purple)
    sphere(group, 'function-site-pocket', 0.12, [0.16, -0.08, 0.28], M.green)
  } else if (id.endsWith('enzyme')) {
    sphere(group, 'enzyme-body-active-site', 0.34, [-0.22, 0, 0.16], M.purple, [1.15, 0.82, 0.5], 40)
    sphere(group, 'substrate-fitting-piece', 0.13, [0.48, 0.06, 0.2], M.yellow, [1.4, 0.65, 0.35])
    arrow(group, 'product-release', [0.28, 0.02, 0.24], [0.82, -0.16, 0.24], '#7fa968')
  } else if (id.endsWith('carbohydrate')) {
    for (let i = 0; i < 5; i += 1) {
      torus(group, `sugar-ring-${i}`, 0.11, 0.022, [-0.62 + i * 0.3, 0.02 + (i % 2) * 0.12, 0.16], [Math.PI / 2, 0, 0], M.yellow)
      if (i > 0) tube(group, `glycosidic-link-${i}`, [[-0.73 + i * 0.3, 0.08, 0.16], [-0.52 + i * 0.3, 0.08, 0.16]], 0.015, M.white)
    }
  } else if (id.endsWith('lipid')) {
    for (let i = 0; i < 7; i += 1) {
      sphere(group, `phospholipid-head-top-${i}`, 0.055, [-0.72 + i * 0.24, 0.22, 0.16], M.blue)
      tube(group, `fatty-tail-top-${i}`, [[-0.72 + i * 0.24, 0.16, 0.16], [-0.72 + i * 0.24, -0.05, 0.16]], 0.016, M.yellow)
      sphere(group, `phospholipid-head-bottom-${i}`, 0.055, [-0.72 + i * 0.24, -0.28, 0.16], M.blue)
    }
  } else {
    sphere(group, 'adenosine-base', 0.13, [-0.52, 0, 0.16], M.purple)
    for (let i = 0; i < 3; i += 1) sphere(group, `phosphate-${i}`, 0.1, [-0.15 + i * 0.28, 0, 0.16], M.yellow)
    arrow(group, 'atp-to-cell-work', [0.5, 0.04, 0.2], [0.92, 0.24, 0.2], '#d97757')
    box(group, 'cell-work-load', [0.22, 0.22, 0.12], [0.95, 0.28, 0.12], M.green)
  }
}

function build(id) {
  const group = root(id)
  if (CELL_IDS.includes(id)) addCellScene(group, id)
  else if (id.startsWith('biology-evolution-')) addEvolutionScene(group, id)
  else if (id.startsWith('biology-animals-')) addAnimalScene(group, id)
  else if (id.startsWith('biology-health-')) addHealthScene(group, id)
  else if (id.startsWith('biology-neuroscience-')) addNeuroScene(group, id)
  else addBiochemScene(group, id)
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

const CELL_IDS = ['plant-cell', 'bacterial-cell', 'red-blood-cell', 'muscle-cell', 'sperm-cell', 'egg-cell']
const BRANCH_IDS = [
  'biology-evolution-variation',
  'biology-evolution-natural-selection',
  'biology-evolution-adaptation',
  'biology-evolution-fossil-evidence',
  'biology-evolution-common-ancestry',
  'biology-animals-vertebrate',
  'biology-animals-body-systems',
  'biology-animals-habitat-adaptation',
  'biology-animals-life-cycle',
  'biology-animals-behavior',
  'biology-health-pathogen',
  'biology-health-immune-response',
  'biology-health-vaccine',
  'biology-health-nutrition',
  'biology-health-epidemiology-spread',
  'biology-neuroscience-neuron',
  'biology-neuroscience-synapse',
  'biology-neuroscience-reflex-arc',
  'biology-neuroscience-brain-regions',
  'biology-neuroscience-senses-signals',
  'biology-biochemistry-protein',
  'biology-biochemistry-enzyme',
  'biology-biochemistry-carbohydrate',
  'biology-biochemistry-lipid',
  'biology-biochemistry-atp-cellular-energy',
]

for (const id of [...CELL_IDS, ...BRANCH_IDS]) {
  await exportScene(build(id), `${id}.glb`)
}
