import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buffer) => {
      this.result = buffer
      this.onloadend?.({ target: this })
    }).catch((error) => {
      this.error = error
      this.onerror?.(error)
    })
  }
}

const OUT_DIR = new URL('../../public/models/math/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.52, metalness: 0, clearcoat: 0.14, clearcoatRoughness: 0.48, ...options })
}

const M = {
  base: mat('#f2eee6'),
  grid: mat('#d7d0c5'),
  blue: mat('#55a6d9'),
  green: mat('#87b86f'),
  yellow: mat('#f0bd4f'),
  orange: mat('#d98a52'),
  red: mat('#d9685a'),
  purple: mat('#9b83d5'),
  teal: mat('#56b8a8'),
  dark: mat('#343840', { roughness: 0.72 }),
  glass: mat('#d9eff5', { transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
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

const box = (p, n, s, pos, material, rot = [0, 0, 0]) => mesh(p, n, new THREE.BoxGeometry(...s), material, pos, rot)
const sphere = (p, n, r, pos, material, scale = [1, 1, 1], seg = 28) => mesh(p, n, new THREE.SphereGeometry(r, seg, seg), material, pos, [0, 0, 0], scale)
const cyl = (p, n, r, h, pos, rot, material, seg = 32) => mesh(p, n, new THREE.CylinderGeometry(r, r, h, seg), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) => mesh(p, n, new THREE.TorusGeometry(r, t, 16, 96), material, pos, rot)

function line(parent, name, from, to, material = M.blue, radius = 0.018) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const item = cyl(parent, name, radius, dir.length(), start.clone().lerp(end, 0.5).toArray(), [0, 0, 0], material, 14)
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return item
}

function arrow(parent, name, from, to, material = M.yellow) {
  line(parent, `${name}-shaft`, from, to, material, 0.018)
  const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize()
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.065, 0.18, 18), material, to)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
}

function base(root) {
  box(root, 'number-sense-base', [2.9, 0.06, 1.55], [0, -0.08, 0], M.base)
}

function extents(root, max = 3.2) {
  const half = max / 2
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[[-half, 0, 0], [half, 0, 0], [0, -half, 0], [0, half, 0], [0, 0, -half], [0, 0, half]].forEach((position, i) =>
    sphere(root, `normalization-anchor-${i}`, 0.001, position, invisible, [1, 1, 1], 8),
  )
}

function plus(parent, name, pos, material = M.dark, size = 1) {
  box(parent, `${name}-plus-horizontal`, [0.34 * size, 0.045 * size, 0.08 * size], pos, material)
  box(parent, `${name}-plus-vertical`, [0.08 * size, 0.045 * size, 0.34 * size], pos, material)
}

function minus(parent, name, pos, material = M.dark, size = 1) {
  box(parent, `${name}-minus-bar`, [0.34 * size, 0.045 * size, 0.08 * size], pos, material)
}

function equal(parent, name, pos, material = M.dark, size = 1) {
  box(parent, `${name}-equal-top`, [0.34 * size, 0.045 * size, 0.055 * size], [pos[0], pos[1], pos[2] - 0.07 * size], material)
  box(parent, `${name}-equal-bottom`, [0.34 * size, 0.045 * size, 0.055 * size], [pos[0], pos[1], pos[2] + 0.07 * size], material)
}

function dot(parent, name, x, z, material, r = 0.075) {
  sphere(parent, name, r, [x, 0.23, z], material)
}

function dotGroup(parent, name, count, originX, material, cols = 3) {
  for (let i = 0; i < count; i++) dot(parent, `${name}-counter-${i + 1}`, originX + (i % cols) * 0.18, -0.18 + Math.floor(i / cols) * 0.18, material)
}

function makeAddition(root) {
  dotGroup(root, 'addend-three', 3, -1.08, M.blue)
  plus(root, 'addition-symbol', [-0.42, 0.26, 0], M.dark)
  dotGroup(root, 'addend-two', 2, -0.08, M.green, 2)
  equal(root, 'sum-symbol', [0.45, 0.26, 0], M.dark)
  dotGroup(root, 'sum-five', 5, 0.72, M.yellow, 3)
  arrow(root, 'combine-groups-arrow', [-0.55, 0.58, -0.35], [0.65, 0.58, -0.35], M.orange)
}

function makeSubtraction(root) {
  dotGroup(root, 'starting-five', 5, -1.05, M.blue, 3)
  minus(root, 'subtraction-symbol', [-0.35, 0.26, 0], M.dark)
  dotGroup(root, 'take-away-two', 2, -0.08, M.red, 2)
  equal(root, 'difference-symbol', [0.43, 0.26, 0], M.dark)
  dotGroup(root, 'remaining-three', 3, 0.73, M.green, 3)
  arrow(root, 'take-away-motion-arrow', [-0.1, 0.55, 0.42], [-0.68, 0.55, 0.42], M.red)
}

function makeMultiplication(root) {
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) box(root, `array-row-${r + 1}-column-${c + 1}`, [0.16, 0.11, 0.16], [-0.45 + c * 0.28, 0.22, -0.28 + r * 0.28], (r + c) % 2 ? M.green : M.blue)
  line(root, 'row-brace-three-groups', [-0.78, 0.48, -0.28], [-0.78, 0.48, 0.28], M.yellow, 0.02)
  line(root, 'column-brace-four-in-each-group', [-0.45, 0.58, -0.58], [0.39, 0.58, -0.58], M.orange, 0.02)
}

function makeDivision(root) {
  for (let i = 0; i < 3; i++) {
    torus(root, `equal-share-bowl-${i + 1}`, 0.23, 0.018, [-0.62 + i * 0.62, 0.21, 0.1], [Math.PI / 2, 0, 0], M.purple)
    dotGroup(root, `share-${i + 1}`, 2, -0.7 + i * 0.62, M.green, 2)
  }
  dotGroup(root, 'six-counters-before-sharing', 6, -0.55, M.blue, 6)
  arrow(root, 'divide-into-equal-groups-arrow', [0, 0.62, -0.1], [0, 0.38, 0.22], M.yellow)
}

function makeFactors(root) {
  box(root, 'product-twelve-tile', [1.0, 0.07, 0.68], [0, 0.14, 0], M.glass)
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) box(root, `factor-array-3-by-4-cell-${r + 1}-${c + 1}`, [0.18, 0.08, 0.14], [-0.36 + c * 0.24, 0.22, -0.22 + r * 0.22], M.blue)
  line(root, 'factor-three-side', [-0.64, 0.43, -0.22], [-0.64, 0.43, 0.22], M.yellow, 0.018)
  line(root, 'factor-four-side', [-0.36, 0.52, -0.48], [0.36, 0.52, -0.48], M.orange, 0.018)
}

function makeMultiples(root) {
  line(root, 'skip-count-number-line', [-1.15, 0.2, 0], [1.15, 0.2, 0], M.dark, 0.018)
  ;[-0.9, -0.45, 0, 0.45, 0.9].forEach((x, i) => {
    line(root, `tick-multiple-${(i + 1) * 3}`, [x, 0.16, -0.09], [x, 0.16, 0.09], M.dark, 0.012)
    sphere(root, `multiple-${(i + 1) * 3}-landing-dot`, 0.055, [x, 0.29, 0], M.green)
  })
  arrow(root, 'skip-jump-3-to-6', [-0.9, 0.46, 0.05], [-0.45, 0.46, 0.05], M.yellow)
  arrow(root, 'skip-jump-6-to-9', [-0.45, 0.56, 0.05], [0, 0.56, 0.05], M.yellow)
  arrow(root, 'skip-jump-9-to-12', [0, 0.46, 0.05], [0.45, 0.46, 0.05], M.yellow)
}

function makeNegativeNumber(root) {
  line(root, 'zero-centered-number-line', [-1.15, 0.2, 0], [1.15, 0.2, 0], M.dark, 0.018)
  ;[-0.8, -0.4, 0, 0.4, 0.8].forEach((x, i) => {
    line(root, `integer-tick-${i - 2}`, [x, 0.16, -0.1], [x, 0.16, 0.1], M.dark, 0.012)
    sphere(root, i < 2 ? `negative-${2 - i}-red-marker` : i === 2 ? 'zero-marker' : `positive-${i - 2}-blue-marker`, 0.055, [x, 0.3, 0], i < 2 ? M.red : i === 2 ? M.yellow : M.blue)
  })
  arrow(root, 'move-left-below-zero-arrow', [0.35, 0.52, -0.2], [-0.72, 0.52, -0.2], M.red)
}

function makeNumberLine(root) {
  arrow(root, 'number-line-forward', [-1.15, 0.22, 0], [1.15, 0.22, 0], M.blue)
  ;[-0.9, -0.45, 0, 0.45, 0.9].forEach((x, i) => {
    line(root, `counting-tick-${i}`, [x, 0.16, -0.12], [x, 0.16, 0.12], M.dark, 0.012)
    if (i <= 3) sphere(root, `hop-landing-${i}-to-${i + 1}`, 0.048, [x, 0.34, 0], M.yellow)
  })
  arrow(root, 'counting-hop-one', [-0.9, 0.5, 0.05], [-0.45, 0.5, 0.05], M.green)
  arrow(root, 'counting-hop-two', [-0.45, 0.58, 0.05], [0, 0.58, 0.05], M.green)
}

function makePrimeNumber(root) {
  dotGroup(root, 'prime-seven-counters', 7, -0.55, M.blue, 7)
  box(root, 'only-one-by-seven-array-frame', [1.42, 0.04, 0.22], [0, 0.18, 0], M.glass)
  torus(root, 'prime-special-highlight-ring', 0.56, 0.018, [0, 0.34, 0], [Math.PI / 2, 0, 0], M.yellow)
  line(root, 'no-even-split-divider', [0, 0.46, -0.35], [0, 0.46, 0.35], M.red, 0.018)
}

function makeGeometry(id) {
  const root = new THREE.Group()
  root.name = `math-number-${id}`
  base(root)

  if (id === 'addition') makeAddition(root)
  else if (id === 'division') makeDivision(root)
  else if (id === 'factors') makeFactors(root)
  else if (id === 'multiples') makeMultiples(root)
  else if (id === 'multiplication') makeMultiplication(root)
  else if (id === 'negative-number') makeNegativeNumber(root)
  else if (id === 'number-line') makeNumberLine(root)
  else if (id === 'prime-number') makePrimeNumber(root)
  else makeSubtraction(root)

  extents(root)
  return root
}

async function exportScene(root, filename) {
  const scene = new THREE.Scene()
  scene.add(root)
  const exporter = new GLTFExporter()
  const result = await new Promise((resolve, reject) => exporter.parse(scene, resolve, reject, { binary: true, trs: false, onlyVisible: true, includeCustomExtensions: false }))
  const outPath = fileURLToPath(new URL(filename, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, Buffer.from(result))
  console.log(outPath)
}

const numberSense = ['addition', 'division', 'factors', 'multiples', 'multiplication', 'negative-number', 'number-line', 'prime-number', 'subtraction']

for (const id of numberSense) await exportScene(makeGeometry(id), `math-number-${id}.glb`)
