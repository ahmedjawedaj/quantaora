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

const OUT_DIR = new URL('../../public/models/chemistry/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.14, clearcoatRoughness: 0.48, ...options })
}

const M = {
  base: mat('#f2eee6'),
  red: mat('#d9685a'),
  blue: mat('#55a6d9'),
  yellow: mat('#f0bd4f', { emissive: '#4d3608', emissiveIntensity: 0.18 }),
  green: mat('#87b86f'),
  purple: mat('#9b83d5'),
  dark: mat('#343840', { roughness: 0.72 }),
  glass: mat('#d9eff5', { transparent: true, opacity: 0.24, side: THREE.DoubleSide }),
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
const cyl = (p, n, rt, rb, h, pos, rot, material, seg = 32) => mesh(p, n, new THREE.CylinderGeometry(rt, rb, h, seg), material, pos, rot)

function line(parent, name, from, to, material = M.yellow, radius = 0.018) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const item = cyl(parent, name, radius, radius, dir.length(), start.clone().lerp(end, 0.5).toArray(), [0, 0, 0], material, 14)
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function arrow(parent, name, from, to, material = M.yellow) {
  line(parent, `${name}-shaft`, from, to, material, 0.018)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.065, 0.18, 18), material, to)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize())
}

function extents(root, max = 3.1) {
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  const h = max / 2
  ;[[-h, 0, 0], [h, 0, 0], [0, -h, 0], [0, h, 0], [0, 0, -h], [0, 0, h]].forEach((p, i) => sphere(root, `normalization-anchor-${i}`, 0.001, p, invisible, [1, 1, 1], 8))
}

function molecule(parent, name, x, z, colors = [M.blue, M.red]) {
  const group = new THREE.Group()
  group.name = name
  group.position.set(x, 0.32, z)
  parent.add(group)
  colors.forEach((material, i) => sphere(group, `atom-${i + 1}`, 0.11, [(i - (colors.length - 1) / 2) * 0.22, 0, 0], material))
  if (colors.length > 1) line(group, 'bond', [-0.1, 0, 0], [0.1, 0, 0], M.dark, 0.018)
  return group
}

function beaker(parent, name, x, z, fill = M.blue) {
  const group = new THREE.Group()
  group.name = name
  group.position.set(x, 0, z)
  parent.add(group)
  cyl(group, 'glass-wall', 0.22, 0.18, 0.42, [0, 0.3, 0], [0, 0, 0], M.glass)
  cyl(group, 'liquid-fill', 0.17, 0.15, 0.16, [0, 0.2, 0], [0, 0, 0], fill)
  return group
}

function make(id) {
  const root = new THREE.Group()
  root.name = `chem-reaction-${id}`
  box(root, 'reaction-base', [2.5, 0.06, 1.35], [0, -0.08, 0], M.base)
  if (id === 'balanced-equation') {
    molecule(root, 'two-hydrogen-reactants', -0.8, -0.18, [M.blue, M.blue])
    molecule(root, 'one-oxygen-reactant', -0.25, -0.18, [M.red, M.red])
    arrow(root, 'reaction-arrow', [0.05, 0.34, -0.18], [0.45, 0.34, -0.18])
    molecule(root, 'two-water-products-a', 0.75, -0.28, [M.blue, M.red, M.blue])
    molecule(root, 'two-water-products-b', 0.75, 0.12, [M.blue, M.red, M.blue])
  } else if (id === 'coefficient') {
    ;[-0.72, -0.52, -0.32].forEach((x, i) => molecule(root, `coefficient-copy-${i + 1}`, x, 0, [M.blue, M.red]))
    box(root, 'coefficient-multiplier-block', [0.32, 0.2, 0.32], [0.35, 0.35, 0], M.purple)
    arrow(root, 'multiplies-whole-formula', [-0.1, 0.42, 0], [0.18, 0.38, 0])
  } else if (id === 'conservation-of-mass') {
    beaker(root, 'reactants-on-scale', -0.55, 0, M.blue)
    beaker(root, 'products-on-scale', 0.55, 0, M.green)
    line(root, 'balance-beam', [-0.95, 0.58, 0], [0.95, 0.58, 0], M.dark, 0.024)
    sphere(root, 'equal-mass-pivot', 0.08, [0, 0.58, 0], M.yellow)
  } else if (id === 'endothermic') {
    beaker(root, 'cooling-reaction-beaker', 0, 0, M.blue)
    ;[-0.8, -0.55, 0.55, 0.8].forEach((x, i) => arrow(root, `heat-in-arrow-${i + 1}`, [x, 0.62, 0], [x * 0.35, 0.35, 0], M.blue))
    box(root, 'temperature-drop-card', [0.52, 0.1, 0.28], [0, 0.72, 0], M.dark)
  } else if (id === 'exothermic') {
    beaker(root, 'warming-reaction-beaker', 0, 0, M.orange)
    ;[-0.15, 0, 0.15].forEach((x, i) => sphere(root, `heat-burst-${i + 1}`, 0.08, [x, 0.68 + i * 0.08, 0], M.yellow))
    ;[-0.65, 0.65].forEach((x, i) => arrow(root, `heat-out-arrow-${i + 1}`, [0.18 * (i ? 1 : -1), 0.52, 0], [x, 0.78, 0], M.yellow))
  } else if (id === 'product') {
    molecule(root, 'reactant-a', -0.72, 0, [M.blue])
    molecule(root, 'reactant-b', -0.38, 0, [M.red])
    arrow(root, 'forms-product-arrow', [-0.1, 0.35, 0], [0.28, 0.35, 0])
    molecule(root, 'new-product-molecule', 0.72, 0, [M.blue, M.red, M.green])
    sphere(root, 'product-highlight-ring', 0.32, [0.72, 0.32, 0], M.glass, [1, 1, 1], 40)
  } else {
    molecule(root, 'starting-reactant-a', -0.42, -0.2, [M.blue, M.blue])
    molecule(root, 'starting-reactant-b', -0.42, 0.2, [M.red])
    box(root, 'reactant-side-marker', [0.82, 0.06, 0.78], [-0.42, 0.1, 0], M.purple)
    arrow(root, 'reaction-start-arrow', [0.05, 0.34, 0], [0.55, 0.34, 0])
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

for (const id of ['balanced-equation', 'coefficient', 'conservation-of-mass', 'endothermic', 'exothermic', 'product', 'reactant']) {
  await exportScene(make(id), `chem-reaction-${id}.glb`)
}
