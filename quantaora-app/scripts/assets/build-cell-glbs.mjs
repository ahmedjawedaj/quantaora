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

const OUT_DIR = new URL('../../public/models/cells/', import.meta.url)

function material(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.54,
    metalness: 0,
    clearcoat: 0.2,
    clearcoatRoughness: 0.48,
    ...options,
  })
}

function addMesh(parent, name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.name = name
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  mesh.castShadow = false
  mesh.receiveShadow = false
  parent.add(mesh)
  return mesh
}

function addSphere(parent, name, radius, position, mat, scale = [1, 1, 1], segments = 40) {
  return addMesh(parent, name, new THREE.SphereGeometry(radius, segments, segments), mat, position, [0, 0, 0], scale)
}

function addCapsule(parent, name, radius, length, position, rotation, mat) {
  return addMesh(parent, name, new THREE.CapsuleGeometry(radius, length, 12, 28), mat, position, rotation)
}

function addTube(parent, name, points, radius, mat, tubularSegments = 48) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return addMesh(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 12, false), mat)
}

function addTorus(parent, name, radius, tube, position, rotation, mat) {
  return addMesh(parent, name, new THREE.TorusGeometry(radius, tube, 16, 96), mat, position, rotation)
}

function addCalibrationExtents(parent, max = 2.3) {
  const half = max / 2
  const mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[
    [-half, 0, 0],
    [half, 0, 0],
    [0, -half, 0],
    [0, half, 0],
    [0, 0, -half],
    [0, 0, half],
  ].forEach((position, index) => {
    const marker = addSphere(parent, `normalization-anchor-${index}`, 0.001, position, mat, [1, 1, 1], 8)
    marker.visible = true
  })
}

async function exportScene(scene, clips, filename) {
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
        animations: clips,
      },
    )
  })

  const outPath = fileURLToPath(new URL(filename, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, Buffer.from(result))
  console.log(`Wrote ${outPath}`)
}

function buildAnimalCell() {
  const scene = new THREE.Scene()
  const cell = new THREE.Group()
  cell.name = 'quantaora-authored-animal-cell'
  scene.add(cell)
  addCalibrationExtents(cell)

  const membraneMat = material('#ecd3ba', { transparent: true, opacity: 0.34, side: THREE.DoubleSide })
  const cytoplasmMat = material('#f5ead9', { transparent: true, opacity: 0.16, side: THREE.DoubleSide })
  const nucleusMat = material('#d97757', { roughness: 0.48, clearcoat: 0.32 })
  const dnaMat = material('#a8492f', { roughness: 0.5 })
  const mitoMat = material('#6f9950', { roughness: 0.5, clearcoat: 0.28 })
  const ribosomeMat = material('#4a4038', { roughness: 0.7 })
  const erMat = material('#b7d19a', { roughness: 0.5, transparent: true, opacity: 0.82 })
  const golgiMat = material('#c9a26b', { roughness: 0.52, clearcoat: 0.18 })
  const lysosomeMat = material('#d97757', { roughness: 0.5 })
  const skeletonMat = material('#b9ada1', { roughness: 0.64 })

  addSphere(cell, 'cell-membrane-transparent-shell', 1.08, [0, -0.03, 0.02], membraneMat, [1.03, 0.86, 0.62], 64)
  addSphere(cell, 'cytoplasm-soft-interior', 0.98, [0, -0.05, 0.02], cytoplasmMat, [1.02, 0.8, 0.54], 56)
  const nucleus = addSphere(cell, 'nucleus-pulsing-control-center', 0.28, [0.02, -0.27, 0.39], nucleusMat, [1.22, 0.88, 0.72], 48)
  addTorus(cell, 'dna-coiled-loop-a', 0.12, 0.018, [0.16, -0.11, 0.5], [0.8, 0.3, 0.2], dnaMat)
  addTorus(cell, 'dna-coiled-loop-b', 0.08, 0.014, [0.13, -0.11, 0.5], [0.35, 1.0, -0.4], dnaMat)

  const mitoA = addCapsule(cell, 'mitochondrion-animated-a', 0.06, 0.22, [0.79, -0.41, 0.28], [0.4, 0.5, 1.1], mitoMat)
  const mitoB = addCapsule(cell, 'mitochondrion-animated-b', 0.055, 0.18, [0.38, -0.43, -0.1], [0.3, -0.2, 0.5], mitoMat)
  const mitoC = addCapsule(cell, 'mitochondrion-animated-c', 0.052, 0.16, [-0.24, -0.54, 0.28], [0.2, 0.9, -0.4], mitoMat)

  ;[
    [-0.33, 0.72, 0.3],
    [-0.42, 0.49, 0.2],
    [-0.5, 0.35, 0.05],
    [0.1, -0.1, 0.52],
    [0.32, 0.15, -0.32],
    [-0.28, -0.05, 0.42],
    [0.53, 0.25, 0.12],
    [-0.62, -0.16, 0.22],
  ].forEach((position, index) => {
    addSphere(cell, `ribosome-granule-${index}`, 0.026, position, ribosomeMat, [1, 1, 1], 18)
  })

  addTorus(cell, 'rough-er-fold-a', 0.25, 0.034, [0.19, 0.43, 0.29], [1.1, 0.5, 0.15], erMat)
  addTorus(cell, 'rough-er-fold-b', 0.19, 0.026, [0.02, 0.34, 0.28], [0.9, -0.2, 0.35], erMat)
  addTorus(cell, 'rough-er-fold-c', 0.15, 0.022, [-0.12, 0.26, 0.25], [1.2, 0.35, -0.35], erMat)

  for (let i = 0; i < 6; i += 1) {
    addMesh(
      cell,
      `golgi-flattened-sac-${i}`,
      new THREE.CylinderGeometry(0.12 - i * 0.006, 0.13 - i * 0.006, 0.024, 32),
      golgiMat,
      [-0.45 + i * 0.022, 0.02 + (i - 2.5) * 0.035, 0.35],
      [0.35, 0.9, 1.05],
      [1, 0.45, 0.16],
    )
  }

  addSphere(cell, 'lysosome-vesicle-a', 0.055, [-0.07, -0.64, 0.34], lysosomeMat, [1, 1, 1], 28)
  addSphere(cell, 'lysosome-vesicle-b', 0.048, [-0.42, -0.32, 0.2], lysosomeMat, [1, 1, 1], 28)
  addTube(cell, 'cytoskeleton-filament-a', [[-0.9, -0.18, 0.12], [-0.2, -0.05, 0.28], [0.57, -0.66, 0.29]], 0.014, skeletonMat)
  addTube(cell, 'cytoskeleton-filament-b', [[-0.55, 0.25, -0.15], [0.1, 0.02, 0.14], [0.7, 0.28, 0.1]], 0.011, skeletonMat)

  const pulseTimes = [0, 1.1, 2.2]
  const pulseValues = [1, 1, 1, 1.06, 1.06, 1.06, 1, 1, 1]
  const clips = [
    new THREE.AnimationClip('animal-cell-living-pulse', 2.2, [
      new THREE.VectorKeyframeTrack(`${nucleus.name}.scale`, pulseTimes, [
        ...nucleus.scale.toArray(),
        nucleus.scale.x * 1.05,
        nucleus.scale.y * 1.05,
        nucleus.scale.z * 1.05,
        ...nucleus.scale.toArray(),
      ]),
      new THREE.VectorKeyframeTrack(`${mitoA.name}.scale`, pulseTimes, pulseValues),
      new THREE.VectorKeyframeTrack(`${mitoB.name}.scale`, pulseTimes, pulseValues),
      new THREE.VectorKeyframeTrack(`${mitoC.name}.scale`, pulseTimes, pulseValues),
    ]),
  ]

  return { scene, clips }
}

function buildNeuron() {
  const scene = new THREE.Scene()
  const neuron = new THREE.Group()
  neuron.name = 'quantaora-authored-neuron'
  scene.add(neuron)
  addCalibrationExtents(neuron)

  const somaMat = material('#d98a72', { roughness: 0.5, clearcoat: 0.28 })
  const nucleusMat = material('#a8492f', { roughness: 0.48 })
  const mitoMat = material('#6f9950', { roughness: 0.5, clearcoat: 0.25 })
  const dendriteMat = material('#e3ab97', { roughness: 0.56 })
  const axonMat = material('#c9a074', { roughness: 0.58 })
  const myelinMat = material('#efe6d3', { roughness: 0.45, clearcoat: 0.2 })
  const terminalMat = material('#d9a074', { roughness: 0.5 })
  const synapseMat = material('#8a5a3f', { roughness: 0.55 })
  const signalMat = material('#7c4dff', {
    emissive: '#5b32d6',
    emissiveIntensity: 0.55,
    roughness: 0.32,
  })

  addSphere(neuron, 'soma-cell-body', 0.28, [-0.08, 0.67, 0.14], somaMat, [1.12, 0.9, 0.72], 48)
  addSphere(neuron, 'nucleus-command-center', 0.11, [0.06, 0.59, 0.19], nucleusMat, [1.1, 0.95, 0.75], 36)
  addCapsule(neuron, 'mitochondrion-neuron-power', 0.038, 0.11, [0.19, 0.51, 0.18], [0.4, 0.3, 0.7], mitoMat)

  const dendriteBranches = [
    [[-0.08, 0.67, 0.14], [-0.22, 0.88, 0.16], [-0.11, 1.06, 0.14]],
    [[-0.1, 0.69, 0.12], [-0.38, 0.91, 0.08], [-0.52, 1.1, 0.12]],
    [[-0.02, 0.72, 0.12], [0.16, 0.95, 0.1], [0.32, 1.12, 0.16]],
    [[-0.15, 0.62, 0.1], [-0.48, 0.76, 0.06], [-0.68, 0.85, 0.1]],
    [[0.03, 0.66, 0.08], [0.26, 0.79, 0.04], [0.48, 0.86, 0.08]],
  ]
  dendriteBranches.forEach((points, index) => addTube(neuron, `dendrite-branch-${index}`, points, index === 0 ? 0.038 : 0.026, dendriteMat, 32))

  const axonPoints = [
    [-0.02, 0.52, 0.1],
    [0.32, 0.28, 0.12],
    [0.77, 0.17, 0.14],
    [0.58, -0.08, 0.12],
    [0.42, -0.16, 0.14],
    [0.06, -0.45, 0.11],
    [-0.48, -0.85, 0.14],
  ]
  addTube(neuron, 'axon-long-signal-fiber', axonPoints, 0.032, axonMat, 96)

  ;[
    [0.77, 0.17, 0.14],
    [0.62, 0.0, 0.13],
    [0.42, -0.16, 0.14],
    [0.22, -0.3, 0.12],
    [0.0, -0.45, 0.11],
  ].forEach((position, index) => {
    addCapsule(neuron, `myelin-insulation-${index}`, 0.054, 0.13, position, [0.82, 0, 0.78], myelinMat)
  })

  const terminalPaths = [
    [[-0.48, -0.85, 0.14], [-0.62, -0.95, 0.12], [-0.75, -1.03, 0.16]],
    [[-0.48, -0.85, 0.14], [-0.42, -1.0, 0.16], [-0.36, -1.1, 0.12]],
    [[-0.48, -0.85, 0.14], [-0.28, -0.92, 0.1], [-0.16, -1.14, 0.14]],
  ]
  terminalPaths.forEach((points, index) => addTube(neuron, `axon-terminal-branch-${index}`, points, 0.018, terminalMat, 24))
  addSphere(neuron, 'axon-terminal-bouton-a', 0.045, [-0.75, -1.03, 0.16], terminalMat, [1, 1, 1], 28)
  addSphere(neuron, 'axon-terminal-bouton-b', 0.04, [-0.36, -1.1, 0.12], terminalMat, [1, 1, 1], 28)
  addSphere(neuron, 'synapse-gap-marker', 0.035, [-0.16, -1.14, 0.14], synapseMat, [1, 1, 1], 28)
  addTube(neuron, 'next-neuron-receiving-dendrite-preview', [[0.02, -1.17, 0.08], [0.24, -1.07, 0.06], [0.45, -1.0, 0.12]], 0.014, dendriteMat, 24)

  const signal = addSphere(neuron, 'animated-signal-pulse', 0.052, [-0.11, 1.06, 0.21], signalMat, [1, 1, 1], 28)
  const signalPath = [
    [-0.11, 1.06, 0.21],
    [-0.08, 0.67, 0.22],
    [0.77, 0.17, 0.22],
    [0.42, -0.16, 0.22],
    [-0.48, -0.85, 0.22],
    [-0.16, -1.14, 0.22],
    [-0.11, 1.06, 0.21],
  ]
  const times = [0, 0.8, 1.8, 2.6, 3.6, 4.2, 4.8]
  const clips = [
    new THREE.AnimationClip('neuron-signal-transmission', 4.8, [
      new THREE.VectorKeyframeTrack(`${signal.name}.position`, times, signalPath.flat()),
      new THREE.VectorKeyframeTrack(`${signal.name}.scale`, times, [
        0.35, 0.35, 0.35,
        1.1, 1.1, 1.1,
        1, 1, 1,
        1.12, 1.12, 1.12,
        1.15, 1.15, 1.15,
        1.35, 1.35, 1.35,
        0.35, 0.35, 0.35,
      ]),
    ]),
  ]

  return { scene, clips }
}

await exportScene(...Object.values(buildAnimalCell()), 'animal-cell-authored.glb')
await exportScene(...Object.values(buildNeuron()), 'neuron-authored.glb')
