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

const OUT_DIR = new URL('../../public/models/biology/authored/', import.meta.url)

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.16,
    clearcoatRoughness: 0.48,
    ...options,
  })
}

const M = {
  blue: mat('#4f95d1'),
  cyan: mat('#61c7d8'),
  green: mat('#78a85d'),
  yellow: mat('#e5b84d'),
  coral: mat('#d56f55'),
  red: mat('#c94f52'),
  purple: mat('#8d72c7'),
  white: mat('#eee5d4'),
  dark: mat('#3e3b37', { roughness: 0.76 }),
  glass: mat('#cfe8df', { transparent: true, opacity: 0.22, side: THREE.DoubleSide }),
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

const sphere = (p, n, r, pos, material, scale = [1, 1, 1], segments = 32) =>
  mesh(p, n, new THREE.SphereGeometry(r, segments, segments), material, pos, [0, 0, 0], scale)
const box = (p, n, size, pos, material, rot = [0, 0, 0]) =>
  mesh(p, n, new THREE.BoxGeometry(...size), material, pos, rot)
const cyl = (p, n, rt, rb, h, pos, rot, material, seg = 32) =>
  mesh(p, n, new THREE.CylinderGeometry(rt, rb, h, seg), material, pos, rot)
const torus = (p, n, r, t, pos, rot, material) =>
  mesh(p, n, new THREE.TorusGeometry(r, t, 16, 96), material, pos, rot)
const cone = (p, n, r, h, pos, rot, material) =>
  mesh(p, n, new THREE.ConeGeometry(r, h, 28), material, pos, rot)

function tube(parent, name, points, radius, material, tubularSegments = 64) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return mesh(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 10, false), material)
}

function extents(parent, max = 2.4) {
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

function arrow(parent, name, from, to, color = '#d56f55') {
  const material = mat(color)
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const mid = start.clone().lerp(end, 0.5)
  const dir = end.clone().sub(start)
  const len = dir.length()
  const shaft = cyl(parent, `${name}-shaft`, 0.018, 0.018, len * 0.74, mid.toArray(), [0, 0, 0], material, 16)
  shaft.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
  const head = cone(parent, `${name}-head`, 0.055, 0.16, end.toArray(), [0, 0, 0], material)
  head.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
}

function root(id) {
  const group = new THREE.Group()
  group.name = `quantaora-authored-bio-genetics-${id}`
  extents(group)
  return group
}

function dnaRail(group, prefix, x = 0, scale = 1, activeIndex = -1) {
  const steps = 9
  for (let i = 0; i < steps; i += 1) {
    const y = -0.62 + i * 0.155
    const a = i * 0.85
    const left = [x + Math.cos(a) * 0.22 * scale, y, Math.sin(a) * 0.12 * scale + 0.08]
    const right = [x - Math.cos(a) * 0.22 * scale, y, -Math.sin(a) * 0.12 * scale + 0.08]
    tube(group, `${prefix}-sugar-phosphate-side-${i}`, [left, [left[0], y + 0.11, left[2]]], 0.018, M.white, 8)
    tube(group, `${prefix}-paired-base-rung-${i}`, [left, right], 0.018, i === activeIndex ? M.yellow : M.cyan, 8)
    sphere(group, `${prefix}-base-dot-left-${i}`, 0.045, left, i === activeIndex ? M.yellow : M.blue)
    sphere(group, `${prefix}-base-dot-right-${i}`, 0.045, right, i === activeIndex ? M.yellow : M.purple)
  }
}

function chromosomePair(group, prefix, leftMat, rightMat, y = 0, marked = false) {
  tube(group, `${prefix}-maternal-chromatid-a`, [[-0.35, -0.58 + y, 0.12], [-0.08, -0.1 + y, 0.16], [-0.35, 0.58 + y, 0.12]], 0.055, leftMat)
  tube(group, `${prefix}-maternal-chromatid-b`, [[-0.62, -0.58 + y, 0.12], [-0.08, -0.1 + y, 0.16], [-0.62, 0.58 + y, 0.12]], 0.055, leftMat)
  tube(group, `${prefix}-paternal-chromatid-a`, [[0.35, -0.58 + y, 0.12], [0.08, -0.1 + y, 0.16], [0.35, 0.58 + y, 0.12]], 0.055, rightMat)
  tube(group, `${prefix}-paternal-chromatid-b`, [[0.62, -0.58 + y, 0.12], [0.08, -0.1 + y, 0.16], [0.62, 0.58 + y, 0.12]], 0.055, rightMat)
  sphere(group, `${prefix}-centromere`, 0.095, [0, -0.1 + y, 0.18], M.dark)
  if (marked) {
    sphere(group, `${prefix}-matching-gene-locus-left`, 0.07, [-0.49, 0.24 + y, 0.21], M.yellow)
    sphere(group, `${prefix}-matching-gene-locus-right`, 0.07, [0.49, 0.24 + y, 0.21], M.yellow)
  }
}

function build(id) {
  const group = root(id)

  if (id === 'allele') {
    chromosomePair(group, 'same-gene-position', M.blue, M.purple, 0, true)
    sphere(group, 'allele-version-a-marker', 0.1, [-0.72, 0.42, 0.2], M.yellow)
    sphere(group, 'allele-version-b-marker', 0.1, [0.72, 0.42, 0.2], M.coral)
  } else if (id === 'dominant-allele') {
    sphere(group, 'dominant-allele-large-visible-effect', 0.28, [-0.22, 0.1, 0.2], M.yellow)
    sphere(group, 'recessive-allele-smaller-masked-copy', 0.16, [0.34, 0.02, 0.14], M.purple)
    torus(group, 'dominant-expression-halo', 0.42, 0.035, [-0.1, 0.08, 0.18], [Math.PI / 2, 0, 0], M.yellow)
  } else if (id === 'recessive-allele') {
    sphere(group, 'recessive-copy-one', 0.2, [-0.28, 0.04, 0.16], M.purple)
    sphere(group, 'recessive-copy-two-needed', 0.2, [0.28, 0.04, 0.16], M.purple)
    tube(group, 'matching-recessive-pair-link', [[-0.1, 0.04, 0.18], [0.1, 0.04, 0.18]], 0.025, M.white)
    sphere(group, 'trait-appears-when-paired', 0.13, [0, 0.42, 0.2], M.green)
  } else if (id === 'homozygous-pairing') {
    sphere(group, 'matching-allele-copy-left', 0.22, [-0.32, 0.04, 0.16], M.blue)
    sphere(group, 'matching-allele-copy-right', 0.22, [0.32, 0.04, 0.16], M.blue)
    torus(group, 'same-same-pairing-bracket', 0.5, 0.025, [0, 0.04, 0.14], [Math.PI / 2, 0, 0], M.green)
  } else if (id === 'heterozygous-pairing') {
    sphere(group, 'different-allele-copy-left', 0.22, [-0.32, 0.04, 0.16], M.blue)
    sphere(group, 'different-allele-copy-right', 0.22, [0.32, 0.04, 0.16], M.coral)
    box(group, 'different-version-contrast-bar', [0.12, 0.64, 0.06], [0, 0.04, 0.2], M.white, [0, 0, -0.72])
  } else if (id === 'chromosome') {
    chromosomePair(group, 'x-shaped-chromosome', M.purple, M.purple, 0, true)
    torus(group, 'chromosome-packed-dna-boundary', 0.76, 0.018, [0, 0, 0.1], [Math.PI / 2, 0, 0], M.glass)
  } else if (id === 'dna-replication') {
    dnaRail(group, 'parent-dna-template', -0.42, 0.9, 3)
    dnaRail(group, 'new-dna-copy', 0.46, 0.9, 3)
    arrow(group, 'copy-direction-fork', [-0.12, -0.48, 0.28], [0.28, -0.12, 0.28], '#78a85d')
    sphere(group, 'unzipping-enzyme-marker', 0.12, [0, -0.36, 0.28], M.green)
  } else if (id === 'gene') {
    dnaRail(group, 'dna-strand-with-gene-segment', 0, 1, 4)
    box(group, 'gene-highlight-window', [0.72, 0.42, 0.08], [0, 0.08, 0.02], M.glass)
    for (let i = 0; i < 3; i += 1) sphere(group, `gene-coded-base-${i}`, 0.055, [-0.18 + i * 0.18, 0.08, 0.27], M.yellow)
  } else if (id === 'inheritance-punnett-squares') {
    for (let x = 0; x < 2; x += 1) for (let y = 0; y < 2; y += 1) box(group, `offspring-square-${x}-${y}`, [0.34, 0.34, 0.06], [-0.18 + x * 0.38, -0.18 + y * 0.38, 0.04], (x + y) % 2 ? M.blue : M.purple)
    box(group, 'punnett-horizontal-divider', [0.78, 0.035, 0.09], [0, 0, 0.09], M.white)
    box(group, 'punnett-vertical-divider', [0.035, 0.78, 0.09], [0, 0, 0.09], M.white)
    sphere(group, 'parent-allele-top-a', 0.07, [-0.18, 0.58, 0.14], M.yellow)
    sphere(group, 'parent-allele-left-b', 0.07, [-0.58, -0.18, 0.14], M.coral)
  } else if (id === 'mutation') {
    dnaRail(group, 'dna-with-single-base-change', 0, 1, 5)
    sphere(group, 'mutated-base-mismatch', 0.09, [0.34, 0.16, 0.34], M.red)
    torus(group, 'mutation-warning-ring', 0.18, 0.02, [0.34, 0.16, 0.34], [Math.PI / 2, 0, 0], M.red)
  } else if (id === 'protein') {
    tube(group, 'folded-protein-chain-from-gene', [[-0.72, -0.1, 0.16], [-0.36, 0.28, 0.22], [0.08, -0.08, 0.2], [0.46, 0.25, 0.22], [0.75, -0.12, 0.16]], 0.045, M.purple)
    sphere(group, 'active-shape-pocket', 0.12, [0.12, -0.12, 0.28], M.green)
    sphere(group, 'amino-acid-bead', 0.07, [-0.42, 0.22, 0.28], M.yellow)
  } else if (id === 'trait') {
    sphere(group, 'gene-input-marker', 0.13, [-0.62, 0.22, 0.16], M.purple)
    arrow(group, 'gene-to-trait-expression', [-0.46, 0.18, 0.2], [0.22, 0.02, 0.2], '#78a85d')
    sphere(group, 'visible-trait-flower-color', 0.25, [0.52, -0.02, 0.18], M.coral)
    for (let i = 0; i < 6; i += 1) sphere(group, `trait-petal-${i}`, 0.09, [0.52 + Math.cos((i / 6) * Math.PI * 2) * 0.26, -0.02 + Math.sin((i / 6) * Math.PI * 2) * 0.26, 0.18], M.coral, [1, 0.72, 0.35])
  } else if (id === 'transcription-translation') {
    dnaRail(group, 'dna-gene-template', -0.62, 0.75, 4)
    tube(group, 'mrna-transcript-ribbon', [[-0.25, 0.26, 0.22], [0.05, 0.06, 0.24], [0.36, 0.18, 0.22]], 0.025, M.green)
    sphere(group, 'ribosome-translation-machine', 0.18, [0.58, -0.02, 0.2], M.yellow, [1.35, 0.82, 0.5])
    for (let i = 0; i < 4; i += 1) sphere(group, `protein-amino-acid-output-${i}`, 0.055, [0.36 + i * 0.14, -0.35, 0.22], [M.blue, M.coral, M.purple, M.green][i])
    arrow(group, 'information-flow-arrow', [-0.32, 0.18, 0.3], [0.46, -0.08, 0.3], '#d56f55')
  }

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
  await writeFile(outPath, Buffer.from(result))
  console.log(`Wrote ${outPath}`)
}

const GENETICS_IDS = [
  'allele',
  'dominant-allele',
  'recessive-allele',
  'homozygous-pairing',
  'heterozygous-pairing',
  'chromosome',
  'dna-replication',
  'gene',
  'inheritance-punnett-squares',
  'mutation',
  'protein',
  'trait',
  'transcription-translation',
]

for (const id of GENETICS_IDS) {
  await exportScene(build(id), `bio-genetics-${id}.glb`)
}
