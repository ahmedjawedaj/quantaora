import { createHash } from 'node:crypto'
import { mkdir, stat, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

globalThis.FileReader ??= class FileReader {
  readAsArrayBuffer(blob) {
    blob
      .arrayBuffer()
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

const OUT_DIR = new URL('../../public/models/biology/authored/', import.meta.url)
const ASSET_NAME = 'evolution-fossil-specimen-suite'

function material(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.72,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.56,
    ...options,
  })
}

const M = {
  slabDark: material('#5b4a3d'),
  slabMid: material('#8b755f'),
  slabLight: material('#c0a98b'),
  bone: material('#efe4ce', { roughness: 0.62 }),
  boneShadow: material('#d3bea0', { roughness: 0.78 }),
  amber: material('#d79a38'),
  teal: material('#2f8f83'),
  blue: material('#4d8fc9'),
  red: material('#bf604f'),
  violet: material('#7b65b8'),
  graphite: material('#34312d'),
  glass: material('#cfe7df', {
    transparent: true,
    opacity: 0.22,
    side: THREE.DoubleSide,
    roughness: 0.35,
  }),
}

function mesh(parent, name, geometry, mat, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const item = new THREE.Mesh(geometry, mat)
  item.name = name
  item.position.set(...position)
  item.rotation.set(...rotation)
  item.scale.set(...scale)
  item.castShadow = true
  item.receiveShadow = true
  parent.add(item)
  return item
}

function sphere(parent, name, radius, position, mat, scale = [1, 1, 1], segments = 32) {
  return mesh(parent, name, new THREE.SphereGeometry(radius, segments, segments), mat, position, [0, 0, 0], scale)
}

function box(parent, name, size, position, mat, rotation = [0, 0, 0]) {
  return mesh(parent, name, new THREE.BoxGeometry(...size), mat, position, rotation)
}

function cylinder(parent, name, radiusTop, radiusBottom, height, position, rotation, mat, segments = 32) {
  return mesh(parent, name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), mat, position, rotation)
}

function cone(parent, name, radius, height, position, rotation, mat) {
  return mesh(parent, name, new THREE.ConeGeometry(radius, height, 32), mat, position, rotation)
}

function torus(parent, name, radius, tube, position, rotation, mat) {
  return mesh(parent, name, new THREE.TorusGeometry(radius, tube, 18, 96), mat, position, rotation)
}

function tube(parent, name, points, radius, mat, segments = 72) {
  const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)))
  return mesh(parent, name, new THREE.TubeGeometry(curve, segments, radius, 12, false), mat)
}

function arrow(parent, name, from, to, color) {
  const mat = material(color)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const direction = end.clone().sub(start)
  const middle = start.clone().lerp(end, 0.5)
  const shaft = cylinder(parent, `${name}-shaft`, 0.018, 0.018, direction.length() * 0.78, middle.toArray(), [0, 0, 0], mat, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize())
  const head = cone(parent, `${name}-head`, 0.06, 0.18, end.toArray(), [0, 0, 0], mat)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize())
}

function addExtents(parent) {
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  for (const position of [
    [-1.35, 0, 0],
    [1.35, 0, 0],
    [0, -1.05, 0],
    [0, 1.05, 0],
    [0, 0, -0.75],
    [0, 0, 0.75],
  ]) {
    sphere(parent, 'normalization-anchor', 0.001, position, invisible, [1, 1, 1], 8)
  }
}

function buildSpecimenSuite() {
  const group = new THREE.Group()
  group.name = 'quantaora-authored-evolution-fossil-specimen-suite'
  addExtents(group)

  box(group, 'stratigraphy-oldest-rock-layer', [2.5, 0.2, 1.24], [0, -0.78, 0], M.slabDark)
  box(group, 'stratigraphy-middle-rock-layer', [2.38, 0.18, 1.16], [0, -0.58, 0.02], M.slabMid)
  box(group, 'stratigraphy-newest-rock-layer', [2.28, 0.16, 1.08], [0, -0.39, 0.04], M.slabLight)
  box(group, 'cutaway-front-face-with-visible-time-bands', [2.56, 0.64, 0.06], [0, -0.59, 0.66], M.glass)

  tube(
    group,
    'fossil-spine-with-curved-vertebrae',
    [
      [-0.82, -0.24, 0.22],
      [-0.55, -0.1, 0.28],
      [-0.16, -0.03, 0.31],
      [0.24, -0.07, 0.29],
      [0.64, -0.18, 0.24],
    ],
    0.035,
    M.bone,
  )

  for (let i = 0; i < 9; i += 1) {
    const x = -0.72 + i * 0.17
    const y = -0.2 + Math.sin(i * 0.7) * 0.07
    sphere(group, `separate-vertebra-${i + 1}`, 0.055, [x, y, 0.3], M.boneShadow, [1.1, 0.78, 0.58], 24)
    const ribSpan = 0.21 + (i % 3) * 0.025
    tube(group, `left-rib-arc-${i + 1}`, [[x, y, 0.28], [x - 0.05, y + ribSpan, 0.26], [x + 0.07, y + ribSpan + 0.08, 0.24]], 0.018, M.bone)
    tube(group, `right-rib-arc-${i + 1}`, [[x, y, 0.28], [x - 0.05, y - ribSpan, 0.26], [x + 0.07, y - ribSpan - 0.08, 0.24]], 0.018, M.bone)
  }

  sphere(group, 'fossil-skull-main-cranium', 0.2, [-1.02, -0.24, 0.3], M.bone, [1.25, 0.76, 0.62], 40)
  sphere(group, 'fossil-eye-socket-left', 0.045, [-1.11, -0.14, 0.41], M.graphite, [1, 1, 0.35], 18)
  sphere(group, 'fossil-eye-socket-right', 0.045, [-1.11, -0.33, 0.41], M.graphite, [1, 1, 0.35], 18)
  cone(group, 'fossil-horn-left-adaptation-trait', 0.04, 0.42, [-1.18, -0.09, 0.48], [0.95, -0.42, -0.1], M.bone)
  cone(group, 'fossil-horn-right-adaptation-trait', 0.04, 0.42, [-1.18, -0.4, 0.48], [0.95, 0.42, 0.1], M.bone)
  tube(group, 'jaw-bone-with-teeth-row', [[-1.1, -0.28, 0.2], [-0.94, -0.31, 0.19], [-0.82, -0.27, 0.2]], 0.024, M.boneShadow)
  for (let i = 0; i < 6; i += 1) {
    cone(group, `small-tooth-${i + 1}`, 0.014, 0.06, [-1.03 + i * 0.04, -0.31, 0.17], [Math.PI, 0, 0], M.bone)
  }

  tube(group, 'front-leg-bone-with-joint', [[-0.42, -0.28, 0.26], [-0.55, -0.55, 0.25], [-0.42, -0.71, 0.24]], 0.026, M.bone)
  tube(group, 'rear-leg-bone-with-joint', [[0.42, -0.22, 0.25], [0.54, -0.5, 0.25], [0.72, -0.68, 0.24]], 0.03, M.bone)
  sphere(group, 'front-knee-joint', 0.05, [-0.55, -0.55, 0.28], M.boneShadow, [1, 1, 0.65], 20)
  sphere(group, 'rear-knee-joint', 0.055, [0.54, -0.5, 0.28], M.boneShadow, [1, 1, 0.65], 20)

  for (let i = 0; i < 4; i += 1) {
    const x = 0.2 + i * 0.27
    sphere(group, `preserved-footprint-${i + 1}`, 0.07, [x, 0.47 + (i % 2) * 0.08, 0.3], M.slabDark, [1.45, 0.72, 0.22], 20)
    for (let toe = 0; toe < 3; toe += 1) {
      sphere(group, `preserved-footprint-${i + 1}-toe-${toe + 1}`, 0.026, [x - 0.05 + toe * 0.05, 0.55 + (i % 2) * 0.08, 0.32], M.slabDark, [1, 1, 0.18], 12)
    }
  }

  sphere(group, 'shared-ancestor-node-on-evidence-map', 0.07, [-0.58, 0.55, 0.36], M.violet)
  tube(group, 'ancestry-branch-to-modern-bird-line', [[-0.5, 0.55, 0.36], [-0.14, 0.72, 0.36], [0.26, 0.74, 0.36]], 0.015, M.teal)
  tube(group, 'ancestry-branch-to-modern-reptile-line', [[-0.5, 0.55, 0.36], [-0.1, 0.44, 0.36], [0.34, 0.38, 0.36]], 0.015, M.blue)
  sphere(group, 'derived-trait-marker-feathers-or-scales', 0.05, [0.1, 0.68, 0.4], M.amber)
  sphere(group, 'derived-trait-marker-horn-or-beak', 0.05, [0.08, 0.42, 0.4], M.red)
  arrow(group, 'older-to-newer-time-arrow', [-1.08, -0.82, 0.74], [-1.08, -0.36, 0.74], '#4d8fc9')
  arrow(group, 'trait-fit-evidence-arrow', [-0.96, -0.02, 0.52], [-1.13, -0.33, 0.52], '#d79a38')
  torus(group, 'inspectable-fossil-evidence-highlight-ring', 0.78, 0.018, [-0.12, -0.22, 0.36], [Math.PI / 2, 0, -0.16], M.amber)

  return group
}

async function exportScene(scene, filename) {
  const exporter = new GLTFExporter()
  const result = await new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, {
      binary: true,
      trs: false,
      onlyVisible: true,
      includeCustomExtensions: false,
    })
  })

  const outPath = fileURLToPath(new URL(filename, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  const buffer = Buffer.from(result)
  await writeFile(outPath, buffer)

  const licensePath = outPath.replace(/\.glb$/, '.license.json')
  const info = await stat(outPath)
  await writeFile(
    licensePath,
    `${JSON.stringify(
      {
        assetName: filename,
        sourceAsset: 'Quantaora authored Evolution fossil specimen suite',
        sourceUrl: 'quantaora-app/scripts/assets/build-evolution-specimen-glbs.mjs',
        creator: 'Quantaora',
        license: 'Project-owned authored asset',
        licenseStatus: 'CLEAR',
        attributionRequired: false,
        redistributionStatus: 'Owned project asset; commercial use and redistribution permitted by project owner.',
        dateAuthored: '2026-09-08',
        fileSizeBytes: info.size,
        sha256: createHash('sha256').update(buffer).digest('hex'),
        validation: {
          glbMagicHeaderValid: buffer.subarray(0, 4).toString('utf8') === 'glTF',
          glTFVersion: buffer.readUInt32LE(4),
          declaredLengthMatchesFile: buffer.readUInt32LE(8) === buffer.length,
          sceneCount: 1,
          note: 'Generated by Three.js GLTFExporter. Visual QA must still be performed in the app canvas; this is a support-tier teaching asset, not a photogrammetry fossil scan.',
        },
        sceneContents: {
          description:
            'Layered rock slab with visible strata, inspectable fossil skull, horns, spine, ribs, limb bones, footprints, evidence highlight ring, and ancestry/derived-trait markers.',
          mappedComponents: [
            'biology-evolution-fossil-evidence',
            'biology-evolution-common-ancestry',
            'biology-evolution-adaptation',
          ],
        },
      },
      null,
      2,
    )}\n`,
  )

  console.log(`Wrote ${outPath}`)
  console.log(`Wrote ${licensePath}`)
}

await exportScene(buildSpecimenSuite(), `${ASSET_NAME}.glb`)
