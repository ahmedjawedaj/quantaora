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
  dark: mat('#343840', { roughness: 0.72 }),
  glass: mat('#d9eff5', { transparent: true, opacity: 0.32, side: THREE.DoubleSide }),
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
  const mid = start.clone().lerp(end, 0.5)
  const item = cyl(parent, name, radius, dir.length(), mid.toArray(), [0, 0, 0], material, 14)
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return item
}

function arrow(parent, name, from, to, material = M.yellow) {
  line(parent, `${name}-shaft`, from, to, material, 0.018)
  const end = new THREE.Vector3(...to)
  const start = new THREE.Vector3(...from)
  const dir = end.clone().sub(start).normalize()
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.065, 0.18, 18), material, to)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
}

function base(root) {
  box(root, 'manipulative-base', [2.8, 0.06, 1.5], [0, -0.08, 0], M.base)
}

function extents(root, max = 3.2) {
  const half = max / 2
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[[-half, 0, 0], [half, 0, 0], [0, -half, 0], [0, half, 0], [0, 0, -half], [0, 0, half]].forEach((position, i) =>
    sphere(root, `normalization-anchor-${i}`, 0.001, position, invisible, [1, 1, 1], 8),
  )
}

function fractionDisk(root, slices, filled, name) {
  for (let i = 0; i < slices; i++) {
    const a = (i / slices) * Math.PI * 2
    const mid = a + Math.PI / slices
    const shape = new THREE.Shape()
    shape.moveTo(0, 0)
    for (let s = 0; s <= 8; s++) {
      const t = a + (s / 8) * ((Math.PI * 2) / slices)
      shape.lineTo(Math.cos(t) * 0.62, Math.sin(t) * 0.62)
    }
    shape.lineTo(0, 0)
    const geom = new THREE.ExtrudeGeometry(shape, { depth: 0.045, bevelEnabled: false })
    mesh(root, `${name}-slice-${i + 1}`, geom, i < filled ? M.orange : M.grid, [0, 0.3, 0], [-Math.PI / 2, 0, 0])
    line(root, `${name}-divider-${i + 1}`, [0, 0.36, 0], [Math.cos(mid) * 0.58, 0.36, Math.sin(mid) * 0.58], M.dark, 0.006)
  }
}

function bars(root, values, material = M.blue) {
  values.forEach((value, i) => box(root, `bar-${i + 1}`, [0.22, value, 0.24], [-0.85 + i * 0.34, value / 2, 0], material))
}

function makeGeometry(id) {
  const root = new THREE.Group()
  root.name = `math-geometry-${id}`
  base(root)
  if (id === 'angle') {
    line(root, 'ray-a', [-0.6, 0.22, 0.2], [0.75, 0.22, 0.2], M.blue)
    line(root, 'ray-b', [-0.6, 0.22, 0.2], [0.35, 0.22, -0.65], M.green)
    torus(root, 'angle-arc', 0.32, 0.015, [-0.6, 0.22, 0.2], [Math.PI / 2, 0, 0.72], M.yellow)
    sphere(root, 'vertex', 0.06, [-0.6, 0.22, 0.2], M.red)
  } else if (id === 'area') {
    for (let x = 0; x < 4; x++) for (let z = 0; z < 3; z++) box(root, `unit-square-${x}-${z}`, [0.28, 0.035, 0.28], [-0.45 + x * 0.3, 0.18, -0.3 + z * 0.3], (x + z) % 2 ? M.green : M.blue)
  } else if (id === 'circle') {
    torus(root, 'circumference', 0.55, 0.025, [0, 0.28, 0], [Math.PI / 2, 0, 0], M.blue)
    line(root, 'radius', [0, 0.28, 0], [0.55, 0.28, 0], M.yellow)
    line(root, 'diameter', [-0.55, 0.22, 0.12], [0.55, 0.22, 0.12], M.red)
  } else if (id === 'line') {
    arrow(root, 'line-forward', [-1.05, 0.25, 0], [1.05, 0.25, 0], M.blue)
    arrow(root, 'line-back', [1.05, 0.25, 0], [-1.05, 0.25, 0], M.blue)
    sphere(root, 'point-on-line', 0.055, [0.15, 0.25, 0], M.red)
  } else if (id === 'perimeter') {
    ;[[-0.8, 0.25, -0.42], [0.8, 0.25, -0.42], [0.8, 0.25, 0.42], [-0.8, 0.25, 0.42]].forEach((p, i, arr) => line(root, `edge-${i + 1}`, p, arr[(i + 1) % arr.length], M.orange, 0.026))
    sphere(root, 'walker-dot', 0.07, [-0.8, 0.25, -0.42], M.purple)
  } else if (id === 'point') {
    sphere(root, 'precise-point', 0.09, [0, 0.35, 0], M.red)
    line(root, 'x-axis', [-1, 0.18, 0], [1, 0.18, 0], M.grid)
    line(root, 'z-axis', [0, 0.18, -0.65], [0, 0.18, 0.65], M.grid)
  } else if (id === 'quadrilateral') {
    const pts = [[-0.75, 0.25, -0.3], [0.55, 0.25, -0.42], [0.82, 0.25, 0.35], [-0.45, 0.25, 0.5]]
    pts.forEach((p, i) => line(root, `quad-side-${i + 1}`, p, pts[(i + 1) % pts.length], M.green, 0.026))
    pts.forEach((p, i) => sphere(root, `quad-corner-${i + 1}`, 0.06, p, M.yellow))
  } else if (id === 'ray') {
    sphere(root, 'endpoint', 0.07, [-0.85, 0.25, 0], M.red)
    arrow(root, 'ray-direction', [-0.85, 0.25, 0], [0.9, 0.25, 0], M.blue)
  } else if (id === 'segment') {
    line(root, 'fixed-segment', [-0.8, 0.25, 0], [0.8, 0.25, 0], M.blue, 0.028)
    sphere(root, 'endpoint-a', 0.07, [-0.8, 0.25, 0], M.red)
    sphere(root, 'endpoint-b', 0.07, [0.8, 0.25, 0], M.red)
  } else if (id === 'triangle') {
    const pts = [[-0.75, 0.24, -0.35], [0.75, 0.24, -0.35], [0.0, 0.24, 0.55]]
    pts.forEach((p, i) => line(root, `triangle-side-${i + 1}`, p, pts[(i + 1) % pts.length], M.purple, 0.028))
    pts.forEach((p, i) => sphere(root, `triangle-vertex-${i + 1}`, 0.065, p, M.yellow))
  } else {
    box(root, 'volume-box-shell', [0.85, 0.7, 0.55], [0, 0.38, 0], M.glass)
    for (let x = 0; x < 3; x++) for (let y = 0; y < 2; y++) for (let z = 0; z < 2; z++) box(root, `unit-cube-${x}-${y}-${z}`, [0.17, 0.17, 0.17], [-0.22 + x * 0.22, 0.2 + y * 0.22, -0.13 + z * 0.22], M.blue)
  }
  extents(root)
  return root
}

function makeData(id) {
  const root = new THREE.Group()
  root.name = `math-data-${id}`
  base(root)
  if (id === 'bar-chart') {
    bars(root, [0.35, 0.7, 0.5, 0.95], M.blue)
    line(root, 'category-axis', [-1.05, 0.1, 0.2], [1.0, 0.1, 0.2], M.dark)
  } else if (id === 'line-graph') {
    const pts = [[-0.9, 0.24, 0.2], [-0.35, 0.5, 0.05], [0.15, 0.38, -0.1], [0.75, 0.82, -0.25]]
    pts.forEach((p, i) => sphere(root, `data-dot-${i + 1}`, 0.06, p, M.red))
    pts.slice(0, -1).forEach((p, i) => line(root, `trend-segment-${i + 1}`, p, pts[i + 1], M.green, 0.018))
  } else if (id === 'data-point') {
    sphere(root, 'single-data-point', 0.1, [0.2, 0.55, 0], M.red)
    line(root, 'x-guide', [0.2, 0.1, 0], [0.2, 0.55, 0], M.grid)
    line(root, 'y-guide', [-0.9, 0.55, 0], [0.2, 0.55, 0], M.grid)
  } else if (id === 'mean') {
    bars(root, [0.28, 0.72, 0.46, 0.86], M.blue)
    line(root, 'mean-level-line', [-1.0, 0.58, 0.28], [0.6, 0.58, 0.28], M.yellow, 0.02)
  } else if (id === 'median') {
    ;[-0.75, -0.45, -0.15, 0.15, 0.45].forEach((x, i) => box(root, `sorted-block-${i + 1}`, [0.2, 0.18 + i * 0.04, 0.22], [x, 0.2 + i * 0.02, 0], i === 2 ? M.yellow : M.blue))
  } else if (id === 'mode') {
    ;[-0.7, -0.42, -0.14, 0.14, 0.42, 0.7].forEach((x, i) => sphere(root, `value-chip-${i + 1}`, 0.09, [x, 0.28, 0], i < 3 ? M.purple : M.green))
    box(root, 'mode-count-badge', [0.55, 0.1, 0.28], [-0.42, 0.5, 0], M.purple)
  } else if (id === 'outlier') {
    ;[-0.55, -0.35, -0.18, 0.0].forEach((x, i) => sphere(root, `cluster-point-${i + 1}`, 0.07, [x, 0.28, 0], M.blue))
    sphere(root, 'far-outlier-point', 0.08, [0.85, 0.5, -0.2], M.red)
    line(root, 'outlier-gap', [0.08, 0.32, 0], [0.76, 0.48, -0.18], M.yellow, 0.012)
  } else if (id === 'probability') {
    torus(root, 'spinner-ring', 0.46, 0.02, [-0.25, 0.38, 0], [Math.PI / 2, 0, 0], M.blue)
    arrow(root, 'spinner-pointer', [-0.25, 0.38, 0], [0.1, 0.52, 0], M.red)
    bars(root, [0.32, 0.58, 0.22], M.green)
  } else if (id === 'range') {
    box(root, 'low-value', [0.18, 0.18, 0.18], [-0.75, 0.25, 0], M.blue)
    box(root, 'high-value', [0.18, 0.8, 0.18], [0.75, 0.56, 0], M.red)
    arrow(root, 'range-arrow', [-0.6, 0.82, 0], [0.6, 0.82, 0], M.yellow)
  } else {
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) box(root, `table-cell-${r}-${c}`, [0.34, 0.04, 0.22], [-0.55 + c * 0.37, 0.2, -0.25 + r * 0.25], r === 0 ? M.yellow : M.grid)
  }
  extents(root)
  return root
}

function makeFraction(id) {
  const root = new THREE.Group()
  root.name = `math-fraction-${id}`
  base(root)
  if (id === 'fraction') fractionDisk(root, 4, 3, 'fraction-three-fourths')
  else if (id === 'numerator') {
    fractionDisk(root, 5, 2, 'numerator-two')
    sphere(root, 'counted-filled-part-one', 0.055, [-0.18, 0.75, 0], M.yellow)
    sphere(root, 'counted-filled-part-two', 0.055, [0.02, 0.75, 0], M.yellow)
  } else if (id === 'denominator') {
    fractionDisk(root, 6, 2, 'denominator-sixths')
    torus(root, 'all-equal-parts-ring', 0.72, 0.015, [0, 0.32, 0], [Math.PI / 2, 0, 0], M.purple)
  } else if (id === 'equivalent-fraction') {
    fractionDisk(root, 2, 1, 'one-half-left')
    fractionDisk(root, 4, 2, 'two-fourths-right')
    root.children.filter((c) => c.name.includes('two-fourths')).forEach((c) => c.position.x += 0.75)
    root.children.filter((c) => c.name.includes('one-half')).forEach((c) => c.position.x -= 0.75)
    arrow(root, 'same-value-arrow', [-0.35, 0.75, 0], [0.35, 0.75, 0], M.yellow)
  } else if (id === 'decimal') {
    for (let i = 0; i < 10; i++) box(root, `tenths-block-${i + 1}`, [0.14, 0.1, 0.32], [-0.72 + i * 0.16, 0.22, 0], i < 4 ? M.green : M.grid)
    sphere(root, 'decimal-point-marker', 0.045, [-0.05, 0.48, 0], M.red)
  } else if (id === 'percent') {
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) box(root, `percent-square-${r}-${c}`, [0.07, 0.025, 0.07], [-0.36 + c * 0.08, 0.18, -0.36 + r * 0.08], r * 10 + c < 37 ? M.orange : M.grid)
  } else if (id === 'ratio') {
    ;[-0.55, -0.35, -0.15].forEach((x, i) => sphere(root, `ratio-blue-${i + 1}`, 0.085, [x, 0.28, 0], M.blue))
    ;[0.25, 0.45].forEach((x, i) => sphere(root, `ratio-green-${i + 1}`, 0.085, [x, 0.28, 0], M.green))
    box(root, 'ratio-divider', [0.05, 0.36, 0.22], [0.04, 0.32, 0], M.dark)
  } else {
    line(root, 'proportion-balance-beam', [-0.9, 0.42, 0], [0.9, 0.42, 0], M.dark, 0.024)
    bars(root, [0.3, 0.6], M.blue)
    bars(root, [0.45, 0.9], M.green)
    root.children.filter((c) => c.name.startsWith('bar-')).forEach((c, i) => c.position.x += i < 2 ? -0.25 : 0.55)
  }
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

const geometry = ['angle', 'area', 'circle', 'line', 'perimeter', 'point', 'quadrilateral', 'ray', 'segment', 'triangle', 'volume']
const data = ['bar-chart', 'data-point', 'line-graph', 'mean', 'median', 'mode', 'outlier', 'probability', 'range', 'table']
const fractions = ['decimal', 'denominator', 'equivalent-fraction', 'fraction', 'numerator', 'percent', 'proportion', 'ratio']

for (const id of geometry) await exportScene(makeGeometry(id), `math-geometry-${id}.glb`)
for (const id of data) await exportScene(makeData(id), `math-data-${id}.glb`)
for (const id of fractions) await exportScene(makeFraction(id), `math-fractions-${id}.glb`)
