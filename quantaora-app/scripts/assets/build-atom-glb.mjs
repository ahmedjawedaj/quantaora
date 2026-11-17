import { mkdir, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const OUT = new URL('../../public/models/chemistry/atoms-and-elements/atom.glb', import.meta.url)
const outPath = fileURLToPath(OUT)

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

const scene = new THREE.Scene()

const materials = {
  proton: new THREE.MeshStandardMaterial({
    color: '#d96b5a',
    roughness: 0.48,
    metalness: 0,
  }),
  neutron: new THREE.MeshStandardMaterial({
    color: '#7387a6',
    roughness: 0.54,
    metalness: 0,
  }),
  electron: new THREE.MeshStandardMaterial({
    color: '#d9a441',
    emissive: '#5b3f10',
    emissiveIntensity: 0.12,
    roughness: 0.36,
    metalness: 0,
  }),
  shell: new THREE.MeshPhysicalMaterial({
    color: '#5f7792',
    roughness: 0.5,
    metalness: 0,
    transmission: 0,
    transparent: true,
    opacity: 0.28,
    side: THREE.DoubleSide,
  }),
  cloud: new THREE.MeshPhysicalMaterial({
    color: '#86a67b',
    roughness: 0.82,
    metalness: 0,
    transparent: true,
    opacity: 0.085,
    side: THREE.DoubleSide,
  }),
}

function addSphere(name, radius, position, material, segments = 32) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, segments, segments), material)
  mesh.name = name
  mesh.position.set(...position)
  scene.add(mesh)
  return mesh
}

function addTorus(name, radius, tube, rotation, material) {
  const torus = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 18, 144), material)
  torus.name = name
  torus.rotation.set(...rotation)
  scene.add(torus)
  return torus
}

const nucleusPoints = [
  [-0.12, 0.08, 0.02],
  [0.11, 0.1, -0.03],
  [-0.02, -0.12, 0.08],
  [0.08, -0.08, -0.12],
  [-0.1, -0.04, -0.1],
  [0.03, 0.0, 0.16],
  [-0.17, 0.0, 0.0],
  [0.17, -0.02, 0.04],
  [0.0, 0.18, -0.08],
  [0.0, -0.18, -0.02],
  [0.08, 0.02, 0.0],
  [-0.04, 0.02, -0.16],
]

nucleusPoints.forEach((point, index) => {
  addSphere(
    index % 2 === 0 ? `proton-${index}` : `neutron-${index}`,
    0.145,
    point,
    index % 2 === 0 ? materials.proton : materials.neutron,
    28,
  )
})

addSphere('soft-nucleus-core', 0.38, [0, 0, 0], new THREE.MeshPhysicalMaterial({
  color: '#d2b0a6',
  roughness: 0.72,
  transparent: true,
  opacity: 0.18,
}), 40)

addSphere('electron-cloud-inner', 1.35, [0, 0, 0], materials.cloud, 48)
addSphere('electron-cloud-outer', 1.85, [0, 0, 0], materials.cloud, 48)

addTorus('electron-shell-horizontal', 1.55, 0.018, [Math.PI / 2, 0, 0], materials.shell)
addTorus('electron-shell-diagonal-a', 1.68, 0.016, [Math.PI / 2.7, 0.35, 0.42], materials.shell)
addTorus('electron-shell-diagonal-b', 1.78, 0.016, [Math.PI / 2.2, -0.55, -0.7], materials.shell)

const electrons = [
  ['electron-a', [1.55, 0.02, 0.12]],
  ['electron-b', [-1.18, 0.82, -0.1]],
  ['electron-c', [0.4, -1.5, 0.24]],
  ['electron-d', [-0.52, -0.22, 1.67]],
  ['electron-e', [0.72, 1.34, -0.7]],
  ['electron-f', [-1.5, -0.5, -0.4]],
]

electrons.forEach(([name, position]) => {
  addSphere(name, 0.105, position, materials.electron, 32)
})

const exporter = new GLTFExporter()

const result = await new Promise((resolve, reject) => {
  exporter.parse(
    scene,
    resolve,
    reject,
    {
      binary: true,
      trs: false,
      onlyVisible: true,
      includeCustomExtensions: false,
    },
  )
})

await mkdir(dirname(outPath), { recursive: true })
await writeFile(outPath, Buffer.from(result))
console.log(`Wrote ${outPath}`)
