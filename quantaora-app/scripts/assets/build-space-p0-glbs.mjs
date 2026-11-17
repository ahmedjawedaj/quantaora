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

const OUT_DIR = new URL('../../public/models/space/authored/', import.meta.url)

function material(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.58,
    metalness: 0,
    clearcoat: 0.1,
    clearcoatRoughness: 0.5,
    ...options,
  })
}

function add(parent, name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.name = name
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  parent.add(mesh)
  return mesh
}

function addSphere(parent, name, radius, position, mat, scale = [1, 1, 1], segments = 36) {
  return add(parent, name, new THREE.SphereGeometry(radius, segments, segments), mat, position, [0, 0, 0], scale)
}

function addCylinder(parent, name, radiusTop, radiusBottom, height, position, rotation, mat, segments = 32) {
  return add(parent, name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat, position, rotation)
}

function addCone(parent, name, radius, height, position, rotation, mat, segments = 36) {
  return add(parent, name, new THREE.ConeGeometry(radius, height, segments), mat, position, rotation)
}

function addBox(parent, name, size, position, mat, rotation = [0, 0, 0]) {
  return add(parent, name, new THREE.BoxGeometry(...size), mat, position, rotation)
}

function addTube(parent, name, points, radius, mat, tubularSegments = 72) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return add(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 12, false), mat)
}

function addTorus(parent, name, radius, tube, position, rotation, mat) {
  return add(parent, name, new THREE.TorusGeometry(radius, tube, 18, 120), mat, position, rotation)
}

function addCalibrationExtents(parent, max = 3.0) {
  const half = max / 2
  const markerMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[
    [-half, 0, 0],
    [half, 0, 0],
    [0, -half, 0],
    [0, half, 0],
    [0, 0, -half],
    [0, 0, half],
  ].forEach((position, index) => {
    addSphere(parent, `normalization-anchor-${index}`, 0.001, position, markerMat, [1, 1, 1], 8)
  })
}

async function exportScene(root, filename) {
  const scene = new THREE.Scene()
  scene.add(root)

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

  const outPath = fileURLToPath(new URL(filename, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, Buffer.from(result))
  console.log(`Wrote ${outPath}`)
}

function buildCometNucleus() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-comet-nucleus'
  addCalibrationExtents(root, 3.2)

  const nucleusMat = material('#3f3730', { roughness: 0.86, clearcoat: 0 })
  const iceMat = material('#bcd8dc', { roughness: 0.45, clearcoat: 0.28 })
  const comaMat = material('#9ed9ef', { transparent: true, opacity: 0.14, side: THREE.DoubleSide, roughness: 0.7 })
  const dustMat = material('#d9b16f', { transparent: true, opacity: 0.42, side: THREE.DoubleSide, roughness: 0.74 })
  const ionMat = material('#72b7ff', { transparent: true, opacity: 0.36, side: THREE.DoubleSide, roughness: 0.5 })

  add(root, 'icy-nucleus-dark-lumpy-core', new THREE.DodecahedronGeometry(0.52, 1), nucleusMat, [-0.38, 0, 0], [0.2, 0.45, -0.18], [1.18, 0.82, 0.72])
  ;[
    [-0.72, 0.22, 0.2],
    [-0.52, -0.28, 0.27],
    [-0.12, 0.12, -0.12],
    [-0.45, 0.04, 0.42],
    [-0.78, -0.04, -0.22],
  ].forEach((position, index) => {
    addSphere(root, `icy-nucleus-bright-volatile-patch-${index}`, 0.08, position, iceMat, [1.25, 0.55, 0.35], 18)
  })
  addSphere(root, 'coma-transparent-gas-dust-cloud', 0.98, [-0.26, 0, 0], comaMat, [1.08, 0.9, 0.84], 48)
  addCone(root, 'dust-tail-broad-curved-fan-away-from-sun', 0.66, 2.35, [0.82, 0.18, 0.02], [0, 0, -Math.PI / 2], dustMat)
  addCone(root, 'ion-tail-narrow-blue-solar-wind-line', 0.22, 2.65, [0.98, -0.28, 0.02], [0, 0, -Math.PI / 2], ionMat)
  addSphere(root, 'sunward-warming-edge', 0.055, [-0.92, 0.05, 0.42], material('#ffd28a'), [1, 1, 1], 18)

  return root
}

function buildSampleReturnWorkflow() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-sample-return-workflow'
  addCalibrationExtents(root, 3.4)

  const marsMat = material('#b76545', { roughness: 0.8 })
  const tubeMat = material('#d9c299', { roughness: 0.34, clearcoat: 0.32 })
  const metalMat = material('#a9b0b8', { roughness: 0.42, metalness: 0.08 })
  const rocketMat = material('#e7dccb', { roughness: 0.42 })
  const capsuleMat = material('#d98a5b', { roughness: 0.48, clearcoat: 0.2 })
  const orbitMat = material('#8fd4ff', { transparent: true, opacity: 0.46 })
  const earthMat = material('#497fb5', { roughness: 0.55 })
  const landMat = material('#78a86b', { roughness: 0.65 })

  addCylinder(root, 'select-sample-mars-surface-pad', 0.72, 0.8, 0.18, [-1.02, -0.82, 0], [Math.PI / 2, 0, 0], marsMat, 48)
  addCylinder(root, 'seal-cache-gold-sample-tube', 0.075, 0.075, 0.62, [-1.16, -0.52, 0.35], [Math.PI / 2, 0.22, 0], tubeMat, 24)
  addSphere(root, 'selected-rock-core-inside-tube', 0.08, [-1.32, -0.52, 0.35], material('#6a5b4c'), [1, 0.7, 0.7], 18)

  addCylinder(root, 'launch-ascent-vehicle-body', 0.13, 0.15, 0.72, [-0.22, -0.24, 0.18], [0, 0, 0], rocketMat, 28)
  addCone(root, 'launch-ascent-vehicle-nose', 0.15, 0.24, [-0.22, 0.26, 0.18], [0, 0, 0], capsuleMat, 28)
  addBox(root, 'launch-ascent-vehicle-fin-left', [0.06, 0.2, 0.14], [-0.38, -0.55, 0.18], metalMat, [0, 0, -0.25])
  addBox(root, 'launch-ascent-vehicle-fin-right', [0.06, 0.2, 0.14], [-0.06, -0.55, 0.18], metalMat, [0, 0, 0.25])
  addTube(root, 'rendezvous-orbit-transfer-path', [[-0.16, 0.34, 0.15], [0.38, 0.82, 0.3], [0.9, 0.5, 0.18]], 0.018, orbitMat)
  addTorus(root, 'capture-orbital-rendezvous-ring', 0.34, 0.015, [0.82, 0.34, 0.2], [Math.PI / 2.35, 0.15, 0], orbitMat)
  addBox(root, 'capture-return-orbiter-bus', [0.32, 0.14, 0.18], [0.82, 0.34, 0.2], metalMat)
  addCylinder(root, 'capture-return-orbiter-solar-array-left', 0.01, 0.01, 0.58, [0.48, 0.34, 0.2], [0, 0, Math.PI / 2], material('#344f74'), 8)
  addCylinder(root, 'capture-return-orbiter-solar-array-right', 0.01, 0.01, 0.58, [1.16, 0.34, 0.2], [0, 0, Math.PI / 2], material('#344f74'), 8)

  addSphere(root, 'land-earth-ocean', 0.34, [1.08, -0.72, 0], earthMat, [1, 1, 1], 40)
  addSphere(root, 'land-earth-continent', 0.12, [0.95, -0.62, 0.25], landMat, [1.4, 0.65, 0.2], 20)
  addCone(root, 'land-reentry-capsule', 0.16, 0.24, [0.65, -0.36, 0.32], [Math.PI, 0.2, -0.35], capsuleMat, 28)
  addTube(root, 'clean-chain-sample-return-path', [[-1.16, -0.5, 0.38], [-0.54, -0.18, 0.34], [0.05, 0.42, 0.3], [0.78, 0.35, 0.23], [0.66, -0.32, 0.32]], 0.012, material('#ffcf6a'))

  return root
}

function buildWavelengthComparison() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-wavelength-comparison'
  addCalibrationExtents(root, 3.2)

  const baseMat = material('#2e3138', { roughness: 0.7 })
  const bands = [
    ['radio-infrared-radio-band', '#8f7bd8', -1.1, 0.18],
    ['radio-infrared-infrared-band', '#c8745b', -0.66, 0.24],
    ['visible-band-green-yellow-core', '#e0c84e', -0.22, 0.34],
    ['uv-band-ultraviolet-marker', '#74a4ff', 0.22, 0.26],
    ['xray-band-xray-marker', '#93e0ff', 0.66, 0.18],
    ['gamma-ray-short-wavelength-marker', '#e8edf4', 1.1, 0.13],
  ]

  addBox(root, 'multiwavelength-dark-reference-rail', [2.65, 0.08, 0.1], [0, -0.42, 0], baseMat)
  bands.forEach(([name, color, x, height], index) => {
    addBox(root, name, [0.32, height, 0.18], [x, -0.22 + height / 2, 0], material(color, { emissive: color, emissiveIntensity: 0.06 }))
    addSphere(root, `${name}-target-response`, 0.08 + index * 0.006, [x, 0.36 + index * 0.035, 0.18], material(color, { transparent: true, opacity: 0.72 }))
  })
  addTube(root, 'cold-dust-long-wavelength-path', [[-1.18, 0.36, 0.2], [-0.92, 0.58, 0.2], [-0.66, 0.46, 0.2]], 0.018, material('#d8a56f'))
  addTube(root, 'hot-gas-short-wavelength-path', [[0.32, 0.6, 0.2], [0.68, 0.84, 0.2], [1.1, 0.56, 0.2]], 0.018, material('#8fd4ff'))
  addSphere(root, 'visible-band-star-field-anchor', 0.12, [-0.22, 0.78, 0.2], material('#ffcf6a', { emissive: '#ffcf6a', emissiveIntensity: 0.16 }), [1, 1, 1], 24)
  addSphere(root, 'false-colour-composite-data-stack', 0.16, [0.58, -0.72, 0.16], material('#b6f0d0', { transparent: true, opacity: 0.55 }), [1.3, 0.56, 0.4], 28)

  return root
}

await exportScene(buildCometNucleus(), 'comet-nucleus-authored.glb')
await exportScene(buildSampleReturnWorkflow(), 'sample-return-workflow-authored.glb')
await exportScene(buildWavelengthComparison(), 'wavelength-comparison-authored.glb')
