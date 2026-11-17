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

const OUT_DIR = new URL('../../public/models/physics/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.14, clearcoatRoughness: 0.45, ...options })
}

const M = {
  base: mat('#f2eee6'),
  wire: mat('#343840', { roughness: 0.62 }),
  copper: mat('#d98a52', { metalness: 0.25, roughness: 0.32 }),
  red: mat('#d9685a', { emissive: '#4a130f', emissiveIntensity: 0.12 }),
  blue: mat('#55a6d9'),
  yellow: mat('#f0bd4f', { emissive: '#5b4208', emissiveIntensity: 0.2 }),
  green: mat('#87b86f'),
  purple: mat('#9b83d5'),
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
const torus = (p, n, r, t, pos, rot, material) => mesh(p, n, new THREE.TorusGeometry(r, t, 16, 96), material, pos, rot)

function line(parent, name, from, to, material = M.wire, radius = 0.025) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const item = cyl(parent, name, radius, dir.length(), start.clone().lerp(end, 0.5).toArray(), [0, 0, 0], material, 18)
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function arrow(parent, name, from, to, material = M.yellow) {
  line(parent, `${name}-shaft`, from, to, material, 0.016)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.06, 0.16, 18), material, to)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize())
}

function extents(root, max = 3.2) {
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  const h = max / 2
  ;[[-h, 0, 0], [h, 0, 0], [0, -h, 0], [0, h, 0], [0, 0, -h], [0, 0, h]].forEach((p, i) => sphere(root, `normalization-anchor-${i}`, 0.001, p, invisible, [1, 1, 1], 8))
}

function base(root) {
  box(root, 'circuit-base', [2.6, 0.06, 1.35], [0, -0.08, 0], M.base)
}

function battery(root, x = -0.75, z = 0) {
  box(root, 'battery-case', [0.42, 0.32, 0.3], [x, 0.22, z], M.blue)
  cyl(root, 'positive-terminal', 0.055, 0.12, [x + 0.26, 0.25, z], [0, 0, Math.PI / 2], M.copper)
  cyl(root, 'negative-terminal', 0.045, 0.08, [x - 0.25, 0.25, z], [0, 0, Math.PI / 2], M.copper)
}

function bulb(root, x = 0.75, z = 0) {
  sphere(root, 'glass-bulb', 0.2, [x, 0.38, z], M.glass, [1, 1.2, 1], 36)
  cyl(root, 'bulb-base', 0.11, 0.18, [x, 0.13, z], [0, 0, 0], M.copper)
  torus(root, 'glowing-filament', 0.08, 0.01, [x, 0.38, z], [Math.PI / 2, 0, 0], M.yellow)
}

function switchPart(root, closed = false) {
  box(root, 'switch-base', [0.5, 0.08, 0.24], [0, 0.14, -0.45], M.dark)
  line(root, closed ? 'closed-switch-lever' : 'open-switch-lever', [-0.18, 0.23, -0.45], [0.22, closed ? 0.23 : 0.46, -0.45], M.copper, 0.026)
  sphere(root, 'switch-pivot', 0.055, [-0.18, 0.23, -0.45], M.yellow)
}

function circuitLoop(root, parallel = false) {
  battery(root, -0.85, 0)
  bulb(root, 0.85, parallel ? -0.25 : 0)
  if (parallel) bulb(root, 0.85, 0.32)
  line(root, 'wire-top', [-0.62, 0.23, 0.0], [0.58, 0.23, parallel ? -0.25 : 0.0])
  line(root, 'wire-bottom', [0.58, 0.12, parallel ? -0.25 : 0.0], [-0.62, 0.12, 0.0])
  if (parallel) {
    line(root, 'parallel-branch-top', [0.25, 0.23, -0.25], [0.58, 0.23, 0.32])
    line(root, 'parallel-branch-return', [0.58, 0.12, 0.32], [0.25, 0.12, -0.25])
  }
}

function make(id) {
  const root = new THREE.Group()
  root.name = `physics-electricity-${id}`
  base(root)
  if (id === 'battery') {
    battery(root, 0, 0)
    arrow(root, 'voltage-push-arrow', [-0.45, 0.52, 0], [0.45, 0.52, 0], M.yellow)
  } else if (id === 'bulb') {
    bulb(root, 0, 0)
    sphere(root, 'light-glow-shell', 0.34, [0, 0.38, 0], M.glass, [1, 1, 1], 40)
  } else if (id === 'charge') {
    ;[-0.45, -0.15, 0.15, 0.45].forEach((x, i) => sphere(root, `charge-carrier-${i + 1}`, 0.07, [x, 0.28, 0], i % 2 ? M.blue : M.red))
    arrow(root, 'charge-flow-arrow', [-0.65, 0.48, 0], [0.65, 0.48, 0], M.yellow)
  } else if (id === 'current') {
    circuitLoop(root)
    ;[-0.35, 0, 0.35].forEach((x, i) => arrow(root, `current-arrow-${i + 1}`, [x - 0.12, 0.46, 0], [x + 0.12, 0.46, 0], M.yellow))
  } else if (id === 'parallel-circuit') {
    circuitLoop(root, true)
  } else if (id === 'resistance') {
    circuitLoop(root)
    box(root, 'resistor-block', [0.34, 0.18, 0.22], [0, 0.23, 0], M.purple)
    arrow(root, 'slower-current-arrow', [-0.28, 0.48, 0], [0.02, 0.48, 0], M.red)
  } else if (id === 'series-circuit') {
    battery(root, -0.9, 0)
    bulb(root, 0.2, 0)
    bulb(root, 0.9, 0)
    line(root, 'single-path-wire-a', [-0.68, 0.23, 0], [0.0, 0.23, 0])
    line(root, 'single-path-wire-b', [0.4, 0.23, 0], [0.7, 0.23, 0])
    line(root, 'single-path-return', [0.9, 0.12, 0], [-0.68, 0.12, 0])
  } else if (id === 'switch') {
    circuitLoop(root)
    switchPart(root, false)
    arrow(root, 'close-loop-arrow', [-0.25, 0.6, -0.45], [0.18, 0.4, -0.45], M.green)
  } else {
    battery(root, -0.45, 0)
    bulb(root, 0.55, 0)
    arrow(root, 'voltage-difference-arrow', [-0.68, 0.58, 0], [0.78, 0.58, 0], M.yellow)
    box(root, 'voltmeter-card', [0.46, 0.08, 0.28], [0.05, 0.78, 0], M.dark)
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

for (const id of ['battery', 'bulb', 'charge', 'current', 'parallel-circuit', 'resistance', 'series-circuit', 'switch', 'voltage']) {
  await exportScene(make(id), `physics-electricity-${id}.glb`)
}
