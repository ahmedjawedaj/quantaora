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
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, clearcoat: 0.16, clearcoatRoughness: 0.46, ...options })
}

const M = {
  proton: mat('#d9685a'),
  neutron: mat('#55a6d9'),
  electron: mat('#f0bd4f', { emissive: '#6b4b08', emissiveIntensity: 0.2 }),
  shell: mat('#87b86f'),
  cloud: mat('#d9eff5', { transparent: true, opacity: 0.24, side: THREE.DoubleSide }),
  base: mat('#f2eee6'),
  dark: mat('#343840', { roughness: 0.72 }),
  purple: mat('#9b83d5'),
  green: mat('#87b86f'),
  red: mat('#d9685a'),
  blue: mat('#55a6d9'),
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

const sphere = (p, n, r, pos, material, scale = [1, 1, 1], seg = 32) => mesh(p, n, new THREE.SphereGeometry(r, seg, seg), material, pos, [0, 0, 0], scale)
const box = (p, n, s, pos, material, rot = [0, 0, 0]) => mesh(p, n, new THREE.BoxGeometry(...s), material, pos, rot)
const cyl = (p, n, r, h, pos, rot, material, seg = 32) => mesh(p, n, new THREE.CylinderGeometry(r, r, h, seg), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) => mesh(p, n, new THREE.TorusGeometry(r, t, 16, 96), material, pos, rot)

function line(parent, name, from, to, material = M.shell, radius = 0.014) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const item = cyl(parent, name, radius, dir.length(), start.clone().lerp(end, 0.5).toArray(), [0, 0, 0], material, 14)
  item.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function arrow(parent, name, from, to, material = M.electron) {
  line(parent, `${name}-shaft`, from, to, material, 0.016)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const head = mesh(parent, `${name}-head`, new THREE.ConeGeometry(0.06, 0.16, 18), material, to)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize())
}

function extents(root, max = 3.1) {
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  const h = max / 2
  ;[[-h, 0, 0], [h, 0, 0], [0, -h, 0], [0, h, 0], [0, 0, -h], [0, 0, h]].forEach((p, i) => sphere(root, `normalization-anchor-${i}`, 0.001, p, invisible, [1, 1, 1], 8))
}

function nucleus(parent, protons, neutrons, name = 'nucleus') {
  const group = new THREE.Group()
  group.name = name
  parent.add(group)
  const total = protons + neutrons
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2
    const ring = i % 2 ? 0.13 : 0.02
    sphere(group, i < protons ? `proton-${i + 1}` : `neutron-${i + 1 - protons}`, 0.09, [Math.cos(a) * ring, Math.sin(i) * 0.05, Math.sin(a) * ring], i < protons ? M.proton : M.neutron)
  }
  return group
}

function atom(parent, electrons = 3, shells = 2) {
  nucleus(parent, 3, 3)
  for (let s = 0; s < shells; s++) {
    const r = 0.42 + s * 0.24
    torus(parent, `electron-shell-${s + 1}`, r, 0.012, [0, 0, 0], [Math.PI / 2, s * 0.55, 0], M.shell)
  }
  for (let i = 0; i < electrons; i++) {
    const a = (i / electrons) * Math.PI * 2
    sphere(parent, `electron-${i + 1}`, 0.045, [Math.cos(a) * 0.66, Math.sin(a * 1.7) * 0.16, Math.sin(a) * 0.66], M.electron)
  }
}

function make(id) {
  const root = new THREE.Group()
  root.name = `chem-atoms-${id}`
  box(root, 'concept-base', [2.4, 0.05, 1.35], [0, -0.12, 0], M.base)
  if (id === 'electron') {
    atom(root, 1, 1)
    sphere(root, 'highlighted-electron', 0.08, [0.72, 0.2, 0], M.electron)
    arrow(root, 'electron-motion-path', [0.2, 0.18, 0.4], [0.65, 0.2, 0.05])
  } else if (id === 'electron-shell') {
    atom(root, 8, 3)
    ;[0.42, 0.66, 0.9].forEach((r, i) => torus(root, `named-energy-level-${i + 1}`, r, 0.018, [0, 0, 0], [Math.PI / 2, 0.2 * i, 0], i === 2 ? M.purple : M.shell))
  } else if (id === 'element') {
    atom(root, 6, 2)
    box(root, 'element-card', [0.56, 0.1, 0.42], [0.82, 0.34, 0], M.dark)
    sphere(root, 'same-proton-count-marker', 0.07, [0.82, 0.52, 0], M.proton)
  } else if (id === 'ion') {
    atom(root, 3, 2)
    sphere(root, 'lost-electron', 0.05, [0.95, 0.35, 0.2], M.electron)
    arrow(root, 'electron-transfer', [0.42, 0.18, 0.24], [0.9, 0.34, 0.2])
    box(root, 'charged-ion-glow', [0.7, 0.04, 0.7], [0, 0.02, 0], M.purple)
  } else if (id === 'isotope') {
    const a = nucleus(root, 3, 2, 'isotope-a')
    a.position.x = -0.45
    const b = nucleus(root, 3, 4, 'isotope-b')
    b.position.x = 0.45
    line(root, 'same-proton-count-link', [-0.45, 0.24, 0], [0.45, 0.24, 0], M.proton, 0.018)
  } else if (id === 'neutron') {
    nucleus(root, 2, 4)
    sphere(root, 'highlighted-neutral-neutron', 0.12, [0.62, 0.34, 0], M.neutron)
    box(root, 'no-charge-marker', [0.42, 0.05, 0.12], [0.62, 0.16, 0], M.dark)
  } else if (id === 'nucleus') {
    nucleus(root, 4, 5)
    sphere(root, 'electron-cloud-boundary', 0.78, [0, 0, 0], M.cloud, [1, 1, 1], 48)
  } else {
    nucleus(root, 4, 3)
    sphere(root, 'highlighted-positive-proton', 0.12, [0.62, 0.34, 0], M.proton)
    arrow(root, 'atomic-number-count-arrow', [0.38, 0.22, 0], [0.55, 0.31, 0], M.proton)
  }
  root.position.y = 0.15
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

for (const id of ['electron', 'electron-shell', 'element', 'ion', 'isotope', 'neutron', 'nucleus', 'proton']) {
  await exportScene(make(id), `chem-atoms-${id}.glb`)
}
