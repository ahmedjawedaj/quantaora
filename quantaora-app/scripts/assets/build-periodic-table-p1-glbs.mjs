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
    roughness: 0.5,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.45,
    ...options,
  })
}

const M = {
  board: mat('#f2eee6'),
  grid: mat('#cfd8dc'),
  dim: mat('#d8d2c8'),
  blue: mat('#55a6d9'),
  green: mat('#87b86f'),
  yellow: mat('#f0bd4f'),
  orange: mat('#d98a52'),
  red: mat('#d9685a'),
  purple: mat('#9b83d5'),
  dark: mat('#343840', { roughness: 0.72 }),
  metal: mat('#b9c1c8', { metalness: 0.35, roughness: 0.34 }),
  glass: mat('#d9eff5', { transparent: true, opacity: 0.28, side: THREE.DoubleSide }),
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
const torus = (p, n, r, t, pos, rot, material) => mesh(p, n, new THREE.TorusGeometry(r, t, 16, 80), material, pos, rot)

function arrow(parent, name, from, to, color = '#f0bd4f') {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const mid = start.clone().lerp(end, 0.5)
  const material = mat(color)
  const shaft = cyl(parent, `${name}-shaft`, 0.018, dir.length() * 0.82, mid.toArray(), [0, 0, 0], material, 14)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.07, 0.18, 18), material, end.toArray())
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
  ].forEach((position, i) => sphere(parent, `normalization-anchor-${i}`, 0.001, position, invisible, [1, 1, 1], 8))
}

function table(parent, highlights = []) {
  const group = new THREE.Group()
  group.name = 'periodic-table-board'
  parent.add(group)
  box(group, 'table-backing', [3.1, 0.05, 1.55], [0, -0.04, 0], M.board)
  const highlightSet = new Set(highlights.map(([c, r]) => `${c}:${r}`))
  for (let r = 0; r < 7; r++) {
    for (let c = 0; c < 18; c++) {
      const leftBlock = c < 2
      const rightBlock = c > 11
      const mainRows = r > 0 || leftBlock || rightBlock
      if (!mainRows) continue
      const x = -1.43 + c * 0.168
      const z = -0.54 + r * 0.17
      const hot = highlightSet.has(`${c}:${r}`)
      box(group, hot ? `highlight-cell-${c + 1}-${r + 1}` : `cell-${c + 1}-${r + 1}`, [0.13, hot ? 0.09 : 0.035, 0.13], [x, hot ? 0.035 : 0.0, z], hot ? M.yellow : M.dim)
    }
  }
  group.rotation.x = -0.22
  return group
}

function atom(parent, name, electronCount = 2, position = [0, 0.55, 0]) {
  const g = new THREE.Group()
  g.name = name
  g.position.set(...position)
  parent.add(g)
  sphere(g, 'nucleus', 0.16, [0, 0, 0], M.red)
  torus(g, 'shell-x', 0.45, 0.01, [0, 0, 0], [Math.PI / 2, 0, 0], M.blue)
  torus(g, 'shell-y', 0.45, 0.01, [0, 0, 0], [Math.PI / 2, Math.PI / 2.8, 0], M.blue)
  for (let i = 0; i < electronCount; i++) {
    const a = (i / electronCount) * Math.PI * 2
    sphere(g, `electron-${i + 1}`, 0.045, [Math.cos(a) * 0.45, Math.sin(a) * 0.1, Math.sin(a) * 0.45], M.yellow)
  }
}

function makeScene(id) {
  const root = new THREE.Group()
  root.name = id
  const allGroup1 = Array.from({ length: 7 }, (_, r) => [0, r])
  const allGroup17 = Array.from({ length: 6 }, (_, r) => [16, r + 1])
  const allGroup18 = Array.from({ length: 7 }, (_, r) => [17, r])
  const row3 = Array.from({ length: 18 }, (_, c) => [c, 2])
  const staircase = [[12, 1], [13, 2], [14, 3], [15, 4], [16, 5]]
  const nonmetals = [[0, 0], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1], [14, 2], [15, 2], [16, 2], [17, 2]]
  const metals = [...allGroup1.slice(1), ...row3.slice(2, 12)]

  if (id === 'alkali-metal') {
    table(root, allGroup1)
    box(root, 'soft-shiny-metal-sample', [0.5, 0.3, 0.5], [-0.55, 0.55, -0.05], M.metal)
    atom(root, 'one-valence-electron-atom', 1, [0.7, 0.68, 0.0])
    arrow(root, 'reactivity-arrow', [-0.1, 0.55, 0.0], [0.3, 0.64, 0.0], '#d9685a')
  } else if (id === 'atomic-number') {
    table(root, [[5, 1]])
    atom(root, 'proton-count-nucleus', 3, [0.2, 0.68, -0.05])
    ;[-0.18, 0, 0.18].forEach((x, i) => sphere(root, `counted-proton-${i + 1}`, 0.07, [-0.75 + x, 0.62, 0], M.red))
  } else if (id === 'atomic-mass') {
    table(root, [[5, 1]])
    box(root, 'mass-scale-platform', [1.0, 0.08, 0.45], [0.35, 0.52, 0.02], M.dark)
    ;[-0.18, 0, 0.18].forEach((x, i) => sphere(root, `proton-mass-${i + 1}`, 0.08, [0.2 + x, 0.65, 0.0], M.red))
    ;[-0.08, 0.1].forEach((x, i) => sphere(root, `neutron-mass-${i + 1}`, 0.08, [0.62 + x, 0.65, 0.0], M.blue))
  } else if (id === 'group') {
    table(root, allGroup17)
    atom(root, 'shared-valence-pattern-top', 7, [-0.55, 0.68, -0.05])
    atom(root, 'shared-valence-pattern-bottom', 7, [0.65, 0.68, -0.05])
  } else if (id === 'period') {
    table(root, row3)
    atom(root, 'third-shell-atom', 8, [0.0, 0.72, -0.05])
    torus(root, 'period-shell-level-one', 0.62, 0.012, [0, 0.72, -0.05], [Math.PI / 2, 0, 0], M.green)
    torus(root, 'period-shell-level-two', 0.78, 0.012, [0, 0.72, -0.05], [Math.PI / 2, 0, 0], M.purple)
  } else if (id === 'halogen') {
    table(root, allGroup17)
    sphere(root, 'diatomic-halogen-left', 0.16, [-0.25, 0.62, -0.02], M.green)
    sphere(root, 'diatomic-halogen-right', 0.16, [0.05, 0.62, -0.02], M.green)
    arrow(root, 'gains-electron-arrow', [0.55, 0.7, 0], [0.25, 0.64, 0], '#55a6d9')
    sphere(root, 'incoming-electron', 0.05, [0.65, 0.72, 0], M.yellow)
  } else if (id === 'noble-gas') {
    table(root, allGroup18)
    atom(root, 'full-outer-shell-atom', 8, [0.0, 0.68, -0.05])
    sphere(root, 'calm-nonreactive-shield', 0.62, [0, 0.68, -0.05], M.glass, [1, 1, 1], 48)
  } else if (id === 'metal') {
    table(root, metals)
    for (let i = 0; i < 6; i++) sphere(root, `metal-lattice-node-${i + 1}`, 0.1, [-0.55 + i * 0.22, 0.62, 0.0], M.metal)
    arrow(root, 'conductivity-path', [-0.75, 0.82, 0], [0.75, 0.82, 0], '#f0bd4f')
  } else if (id === 'metalloid') {
    table(root, staircase)
    box(root, 'stair-step-silicon-sample', [0.32, 0.12, 0.32], [-0.4, 0.62, 0], M.purple)
    box(root, 'semiconductor-chip-face', [0.55, 0.04, 0.38], [0.42, 0.62, 0], M.dark)
    arrow(root, 'in-between-arrow', [-0.08, 0.68, 0], [0.16, 0.68, 0], '#9b83d5')
  } else {
    table(root, nonmetals)
    sphere(root, 'oxygen-atom', 0.16, [-0.28, 0.64, 0], M.red)
    sphere(root, 'carbon-atom', 0.16, [0.04, 0.64, 0], M.dark)
    sphere(root, 'oxygen-atom-two', 0.16, [0.36, 0.64, 0], M.red)
    arrow(root, 'molecule-bond-line', [-0.12, 0.64, 0], [0.2, 0.64, 0], '#55a6d9')
  }
  extents(root)
  return root
}

async function exportScene(root, filename) {
  const scene = new THREE.Scene()
  scene.add(root)
  const exporter = new GLTFExporter()
  const result = await new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, { binary: true, trs: false, onlyVisible: true, includeCustomExtensions: false })
  })
  const outPath = fileURLToPath(new URL(filename, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, Buffer.from(result))
  console.log(outPath)
}

for (const id of ['alkali-metal', 'atomic-mass', 'atomic-number', 'group', 'halogen', 'metal', 'metalloid', 'noble-gas', 'nonmetal', 'period']) {
  await exportScene(makeScene(id), `chem-periodic-${id}.glb`)
}
