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
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.16, clearcoatRoughness: 0.46, ...options })
}

const M = {
  base: mat('#f3eee4'),
  grid: mat('#d6d0c6'),
  blue: mat('#4f9fd7'),
  green: mat('#7fba78'),
  yellow: mat('#efbd4f'),
  orange: mat('#dd8650'),
  red: mat('#dc6659'),
  purple: mat('#947fd3'),
  teal: mat('#53b7ad'),
  dark: mat('#343941', { roughness: 0.76 }),
  glass: mat('#d9eef6', { transparent: true, opacity: 0.34, side: THREE.DoubleSide }),
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
const sphere = (p, n, r, pos, material, scale = [1, 1, 1], seg = 32) => mesh(p, n, new THREE.SphereGeometry(r, seg, seg), material, pos, [0, 0, 0], scale)
const cyl = (p, n, r, h, pos, rot, material, seg = 32) => mesh(p, n, new THREE.CylinderGeometry(r, r, h, seg), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) => mesh(p, n, new THREE.TorusGeometry(r, t, 18, 96), material, pos, rot)

function line(parent, name, from, to, material = M.blue, radius = 0.018) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const item = cyl(parent, name, radius, dir.length(), start.clone().lerp(end, 0.5).toArray(), [0, 0, 0], material, 16)
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  return item
}

function arrow(parent, name, from, to, material = M.yellow, radius = 0.018) {
  line(parent, `${name}-shaft`, from, to, material, radius)
  const dir = new THREE.Vector3(...to).sub(new THREE.Vector3(...from)).normalize()
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.07, 0.18, 20), material, to)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
}

function base(root) {
  box(root, 'advanced-math-base', [3.0, 0.06, 1.65], [0, -0.08, 0], M.base)
}

function extents(root, max = 3.4) {
  const half = max / 2
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[[-half, 0, 0], [half, 0, 0], [0, -half, 0], [0, half, 0], [0, 0, -half], [0, 0, half]].forEach((position, i) =>
    sphere(root, `normalization-anchor-${i}`, 0.001, position, invisible, [1, 1, 1], 8),
  )
}

function textBars(root, name, chars, x, y, z, material = M.dark) {
  ;[...chars].forEach((_, i) => box(root, `${name}-symbol-${i + 1}`, [0.08, 0.38, 0.05], [x + i * 0.14, y, z], material, [0, 0, i % 2 ? 0.2 : -0.2]))
}

function axes(root, prefix = 'coordinate') {
  arrow(root, `${prefix}-x-axis`, [-1.18, 0.16, 0.48], [1.18, 0.16, 0.48], M.dark, 0.012)
  arrow(root, `${prefix}-y-axis`, [-1.05, 0.16, 0.62], [-1.05, 1.28, 0.62], M.dark, 0.012)
  for (let i = 0; i < 5; i++) {
    line(root, `${prefix}-vertical-grid-${i + 1}`, [-0.85 + i * 0.42, 0.155, 0.42], [-0.85 + i * 0.42, 0.155, -0.55], M.grid, 0.006)
    line(root, `${prefix}-horizontal-grid-${i + 1}`, [-1.15, 0.35 + i * 0.2, 0.48 - i * 0.18], [1.08, 0.35 + i * 0.2, 0.48 - i * 0.18], M.grid, 0.006)
  }
}

function curve(root, name, points, material = M.blue, radius = 0.016) {
  points.slice(0, -1).forEach((point, i) => line(root, `${name}-segment-${i + 1}`, point, points[i + 1], material, radius))
}

function makeAlgebra(id) {
  const root = new THREE.Group()
  root.name = `math-advanced-algebra-${id}`
  base(root)
  if (id === 'variable') {
    sphere(root, 'unknown-variable-x-token', 0.18, [-0.25, 0.38, 0], M.purple)
    textBars(root, 'large-x', 'xx', [-0.38][0], 0.68, 0, M.dark)
    box(root, 'value-mystery-box', [0.45, 0.34, 0.34], [0.55, 0.36, 0], M.glass)
  } else if (id === 'expression') {
    box(root, 'term-3x-block', [0.46, 0.34, 0.28], [-0.62, 0.3, 0], M.blue)
    box(root, 'plus-operator', [0.12, 0.42, 0.08], [-0.07, 0.34, 0], M.yellow)
    box(root, 'constant-5-block', [0.34, 0.34, 0.28], [0.48, 0.3, 0], M.green)
  } else if (id === 'equation') {
    line(root, 'balance-beam-equals', [-0.95, 0.52, 0], [0.95, 0.52, 0], M.dark, 0.026)
    box(root, 'left-expression-pan', [0.62, 0.08, 0.42], [-0.55, 0.36, 0], M.blue)
    box(root, 'right-value-pan', [0.62, 0.08, 0.42], [0.55, 0.36, 0], M.green)
    cyl(root, 'equal-sign-pivot', 0.05, 0.5, [0, 0.24, 0], [0, 0, 0], M.yellow)
  } else if (id === 'inequality') {
    line(root, 'less-than-upper-arm', [-0.15, 0.46, 0], [0.46, 0.72, 0], M.red, 0.032)
    line(root, 'less-than-lower-arm', [-0.15, 0.46, 0], [0.46, 0.2, 0], M.red, 0.032)
    box(root, 'smaller-stack', [0.3, 0.24, 0.26], [-0.75, 0.24, 0], M.blue)
    box(root, 'larger-stack', [0.3, 0.68, 0.26], [0.88, 0.46, 0], M.green)
  } else {
    axes(root, 'slope')
    line(root, 'rise-step', [-0.45, 0.42, 0.15], [-0.45, 0.82, -0.22], M.green, 0.024)
    line(root, 'run-step', [-0.45, 0.42, 0.15], [0.45, 0.42, 0.15], M.orange, 0.024)
    line(root, 'slope-line', [-0.72, 0.3, 0.28], [0.82, 1.0, -0.38], M.blue, 0.026)
  }
  extents(root)
  return root
}

function makeGraphs(id) {
  const root = new THREE.Group()
  root.name = `math-advanced-graphs-${id}`
  base(root)
  axes(root, id)
  if (id === 'math-graphs-coordinate-plane') {
    sphere(root, 'plotted-point-quadrant-one', 0.06, [0.25, 0.72, -0.18], M.red)
    line(root, 'point-x-guide', [0.25, 0.16, 0.48], [0.25, 0.72, -0.18], M.yellow, 0.01)
  } else if (id === 'math-graphs-slope') {
    line(root, 'positive-slope-line', [-0.9, 0.32, 0.34], [0.9, 1.08, -0.44], M.blue, 0.026)
    box(root, 'rise-label-bar', [0.12, 0.48, 0.12], [-0.2, 0.66, -0.04], M.green)
    box(root, 'run-label-bar', [0.56, 0.1, 0.12], [0.1, 0.44, 0.12], M.orange)
  } else if (id === 'math-graphs-intercept') {
    line(root, 'line-crossing-y-axis', [-0.7, 0.42, 0.22], [0.9, 0.88, -0.32], M.blue, 0.026)
    sphere(root, 'y-intercept-marker', 0.075, [-1.05, 0.55, 0.28], M.red)
    sphere(root, 'x-intercept-marker', 0.075, [-0.25, 0.16, 0.48], M.orange)
  } else if (id === 'math-graphs-linear-function') {
    line(root, 'linear-function-straight-rule', [-0.9, 0.3, 0.36], [0.9, 1.0, -0.36], M.teal, 0.028)
    ;[[-0.5, 0.46, 0.18], [0.0, 0.65, 0], [0.5, 0.84, -0.18]].forEach((p, i) => sphere(root, `input-output-point-${i + 1}`, 0.055, p, M.yellow))
  } else {
    line(root, 'steeper-line', [-0.8, 0.22, 0.4], [0.45, 1.16, -0.48], M.red, 0.024)
    line(root, 'gentler-line', [-0.88, 0.5, 0.22], [0.92, 0.86, -0.22], M.green, 0.024)
    sphere(root, 'shared-comparison-point', 0.06, [-0.2, 0.68, -0.04], M.yellow)
  }
  extents(root)
  return root
}

function makeTrig(id) {
  const root = new THREE.Group()
  root.name = `math-advanced-trig-${id}`
  base(root)
  if (id === 'math-trig-unit-circle') {
    torus(root, 'unit-circle-ring', 0.58, 0.018, [0, 0.42, 0], [Math.PI / 2, 0, 0], M.blue)
    line(root, 'unit-radius', [0, 0.42, 0], [0.42, 0.42, -0.4], M.yellow, 0.022)
    sphere(root, 'point-on-unit-circle', 0.065, [0.42, 0.42, -0.4], M.red)
    axes(root, 'unit-circle')
  } else {
    const pts = [[-0.72, 0.2, 0.35], [0.68, 0.2, 0.35], [0.68, 0.82, -0.36]]
    pts.forEach((p, i) => line(root, `right-triangle-side-${i + 1}`, p, pts[(i + 1) % pts.length], i === 0 ? M.orange : i === 1 ? M.green : M.blue, 0.028))
    box(root, 'right-angle-square', [0.18, 0.03, 0.18], [0.55, 0.23, 0.23], M.yellow)
    sphere(root, 'angle-theta-marker', 0.055, [-0.72, 0.2, 0.35], M.purple)
    if (id === 'math-trig-sine') line(root, 'sine-opposite-highlight', pts[1], pts[2], M.red, 0.04)
    else if (id === 'math-trig-cosine') line(root, 'cosine-adjacent-highlight', pts[0], pts[1], M.red, 0.04)
    else if (id === 'math-trig-tangent') {
      line(root, 'tangent-opposite-highlight', pts[1], pts[2], M.red, 0.04)
      line(root, 'tangent-adjacent-highlight', pts[0], pts[1], M.orange, 0.04)
    } else torus(root, 'triangle-angle-arc', 0.24, 0.015, [-0.72, 0.22, 0.35], [Math.PI / 2, 0, -0.52], M.yellow)
  }
  extents(root)
  return root
}

function makeCalculus(id) {
  const root = new THREE.Group()
  root.name = `math-advanced-calculus-${id}`
  base(root)
  axes(root, id)
  const pts = [[-0.92, 0.32, 0.34], [-0.55, 0.48, 0.16], [-0.2, 0.76, -0.02], [0.2, 0.9, -0.2], [0.72, 0.78, -0.42]]
  curve(root, 'smooth-function-curve', pts, M.blue, 0.022)
  if (id === 'math-calc-rate-of-change') {
    arrow(root, 'average-change-arrow', [-0.55, 0.48, 0.16], [0.2, 0.9, -0.2], M.orange)
    sphere(root, 'start-sample-point', 0.055, [-0.55, 0.48, 0.16], M.green)
    sphere(root, 'end-sample-point', 0.055, [0.2, 0.9, -0.2], M.red)
  } else if (id === 'math-calc-tangent-slope') {
    line(root, 'tangent-line-at-point', [-0.55, 0.53, 0.12], [0.5, 1.0, -0.34], M.red, 0.024)
    sphere(root, 'tangent-touch-point', 0.065, [-0.2, 0.76, -0.02], M.yellow)
  } else if (id === 'math-calc-area-under-curve') {
    ;[-0.5, -0.2, 0.1, 0.4].forEach((x, i) => box(root, `area-rectangle-${i + 1}`, [0.23, 0.28 + i * 0.06, 0.2], [x, 0.3 + i * 0.03, 0.18 - i * 0.12], M.glass))
  } else if (id === 'math-calc-limit') {
    arrow(root, 'left-approach-arrow', [-0.9, 0.44, 0.26], [-0.28, 0.72, -0.01], M.green)
    arrow(root, 'right-approach-arrow', [0.55, 0.95, -0.35], [-0.12, 0.79, -0.06], M.orange)
    sphere(root, 'limit-target-open-point', 0.075, [-0.2, 0.76, -0.02], M.red)
  } else {
    ;[-0.72, -0.42, -0.12, 0.18, 0.48].forEach((x, i) => box(root, `accumulating-sum-slab-${i + 1}`, [0.22, 0.13 + i * 0.08, 0.22], [x, 0.2 + i * 0.04, 0.16 - i * 0.12], i < 2 ? M.green : M.yellow))
    arrow(root, 'accumulation-direction-arrow', [-0.82, 0.88, 0.22], [0.62, 0.98, -0.38], M.red)
  }
  extents(root)
  return root
}

function makeAsset(id) {
  if (['variable', 'expression', 'equation', 'inequality', 'slope'].includes(id)) return makeAlgebra(id)
  if (id.startsWith('math-graphs-')) return makeGraphs(id)
  if (id.startsWith('math-trig-')) return makeTrig(id)
  return makeCalculus(id)
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

const algebra = ['variable', 'expression', 'equation', 'inequality', 'slope']
const graphs = ['math-graphs-coordinate-plane', 'math-graphs-slope', 'math-graphs-intercept', 'math-graphs-linear-function', 'math-graphs-comparing-lines']
const trig = ['math-trig-right-triangle', 'math-trig-sine', 'math-trig-cosine', 'math-trig-tangent', 'math-trig-unit-circle']
const calculus = ['math-calc-rate-of-change', 'math-calc-tangent-slope', 'math-calc-area-under-curve', 'math-calc-limit', 'math-calc-accumulation']

for (const id of [...algebra, ...graphs, ...trig, ...calculus]) {
  await exportScene(makeAsset(id), `math-advanced-${id}.glb`)
}
