// Builds ball-and-stick molecule / lattice GLBs for the chemistry-structure asset wave.
//
// Two data pipelines, both recorded per-output in the sidecar .license.json:
//  1. "rcsb-sdf": real atomic coordinates parsed from RCSB PDB Chemical Component Dictionary
//     "ideal" SDF files (source-data/*.sdf, downloaded from https://files.rcsb.org/ligands/view/
//     <ID>_ideal.sdf, CC0). This is the same RCSB data source documented in
//     docs/ASSET-LICENSES.md's "RCSB PDB + Mol*" pipeline, minus the Mol* app itself (Mol* is a
//     browser-only tool; this script renders the same public-domain coordinate data directly
//     with the project's existing three.js/GLTFExporter, the same technique already used for
//     public/models/chemistry/atoms-and-elements/atom.glb).
//  2. "textbook-geometry": no clean standalone RCSB CCD entry exists (methane's 3-letter code
//     "CH4" is taken by an unrelated compound; NaCl is an ionic solid, not a discrete PDB
//     ligand). These use standard, uncopyrightable textbook bond lengths/angles and
//     crystallographic constants, authored the same way atom.glb was authored.
//
// Run from quantaora-app/: node public/models/sourced/chemistry-structure/build-molecules.mjs
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'

const HERE = fileURLToPath(new URL('.', import.meta.url))
const SOURCE_DATA = join(HERE, 'source-data')

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

// Element palette: continues the atom.glb convention (oxygen reuses the proton red-orange).
const ELEMENTS = {
  H: { radius: 0.25, color: '#f2ece0' },
  C: { radius: 0.4, color: '#4a4744' },
  N: { radius: 0.38, color: '#5b7fbf' },
  O: { radius: 0.38, color: '#d96b5a' },
  NA: { radius: 0.46, color: '#a67bc4' },
  CL: { radius: 0.44, color: '#8fbf6b' },
}

const BOND_COLOR = '#c9beae'
const ANGSTROM_TO_UNITS = 0.55

function materialFor(element) {
  const def = ELEMENTS[element.toUpperCase()] ?? { radius: 0.32, color: '#9a9488' }
  return { ...def, material: new THREE.MeshStandardMaterial({ color: def.color, roughness: 0.45, metalness: 0 }) }
}

const bondMaterial = new THREE.MeshStandardMaterial({ color: BOND_COLOR, roughness: 0.55, metalness: 0 })

function parseSdf(text) {
  const lines = text.split(/\r?\n/)
  const countsLine = lines[3].trim().split(/\s+/)
  const atomCount = parseInt(countsLine[0], 10)
  const bondCount = parseInt(countsLine[1], 10)
  const atoms = []
  for (let i = 0; i < atomCount; i++) {
    const parts = lines[4 + i].trim().split(/\s+/)
    atoms.push({
      x: parseFloat(parts[0]),
      y: parseFloat(parts[1]),
      z: parseFloat(parts[2]),
      element: parts[3],
    })
  }
  const bonds = []
  for (let i = 0; i < bondCount; i++) {
    const parts = lines[4 + atomCount + i].trim().split(/\s+/)
    bonds.push({
      a: parseInt(parts[0], 10) - 1,
      b: parseInt(parts[1], 10) - 1,
      order: parseInt(parts[2], 10),
    })
  }
  return { atoms, bonds }
}

function buildSceneFromAtomsBonds(atoms, bonds) {
  const scene = new THREE.Scene()
  const positions = atoms.map((atom) => new THREE.Vector3(
    atom.x * ANGSTROM_TO_UNITS,
    atom.y * ANGSTROM_TO_UNITS,
    atom.z * ANGSTROM_TO_UNITS,
  ))

  atoms.forEach((atom, index) => {
    const { radius, material } = materialFor(atom.element)
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 28, 28), material)
    mesh.name = `atom-${atom.element}-${index}`
    mesh.position.copy(positions[index])
    scene.add(mesh)
  })

  bonds.forEach((bond, index) => {
    const start = positions[bond.a]
    const end = positions[bond.b]
    const direction = new THREE.Vector3().subVectors(end, start)
    const length = direction.length()
    if (length < 1e-6) return
    const strands = Math.max(1, Math.min(bond.order || 1, 3))
    const up = new THREE.Vector3(0, 1, 0)
    const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction.clone().normalize())
    // Perpendicular offset axis for double/triple bond strands.
    let perp = new THREE.Vector3().crossVectors(direction, up)
    if (perp.lengthSq() < 1e-6) perp = new THREE.Vector3(1, 0, 0)
    perp.normalize()
    const offsetStep = 0.11
    for (let s = 0; s < strands; s++) {
      const offsetMagnitude = strands === 1 ? 0 : (s - (strands - 1) / 2) * offsetStep
      const cylinder = new THREE.Mesh(
        new THREE.CylinderGeometry(0.09, 0.09, length, 12),
        bondMaterial,
      )
      cylinder.name = `bond-${index}-${s}`
      cylinder.quaternion.copy(quaternion)
      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5)
      midpoint.addScaledVector(perp, offsetMagnitude)
      cylinder.position.copy(midpoint)
      scene.add(cylinder)
    }
  })

  return scene
}

async function exportScene(scene, outPath) {
  scene.updateMatrixWorld(true)
  const box = new THREE.Box3().setFromObject(scene)
  const size = new THREE.Vector3()
  box.getSize(size)

  const exporter = new GLTFExporter()
  const result = await new Promise((resolve, reject) => {
    exporter.parse(scene, resolve, reject, { binary: true, trs: false, onlyVisible: true, includeCustomExtensions: false })
  })
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, Buffer.from(result))
  console.log(`Wrote ${outPath} | world-space bbox size (units): [${size.x.toFixed(3)}, ${size.y.toFixed(3)}, ${size.z.toFixed(3)}]`)
}

// --- 1. RCSB-sdf-sourced molecules -----------------------------------------------------------

const sdfJobs = [
  { id: 'HOH', out: 'water.glb' },
  { id: 'OXY', out: 'oxygen.glb' },
  { id: 'CO2', out: 'carbon-dioxide.glb' },
  { id: 'GLC', out: 'glucose.glb' },
]

for (const job of sdfJobs) {
  const sdfPath = join(SOURCE_DATA, `${job.id}_ideal.sdf`)
  const text = await readFile(sdfPath, 'utf8')
  const { atoms, bonds } = parseSdf(text)
  const scene = buildSceneFromAtomsBonds(atoms, bonds)
  await exportScene(scene, join(HERE, job.out))
}

// --- 2. Textbook-geometry molecules (no standalone RCSB CCD entry) ---------------------------

// Methane: tetrahedral C-H, bond length 1.09 Angstrom, 109.5 degree angle. Standard construction:
// H atoms at the four alternating corners of a cube inscribing the tetrahedron.
{
  const bondLen = 1.09
  const cornerMag = bondLen / Math.sqrt(3)
  const atoms = [
    { x: 0, y: 0, z: 0, element: 'C' },
    { x: cornerMag, y: cornerMag, z: cornerMag, element: 'H' },
    { x: cornerMag, y: -cornerMag, z: -cornerMag, element: 'H' },
    { x: -cornerMag, y: cornerMag, z: -cornerMag, element: 'H' },
    { x: -cornerMag, y: -cornerMag, z: cornerMag, element: 'H' },
  ]
  const bonds = [
    { a: 0, b: 1, order: 1 },
    { a: 0, b: 2, order: 1 },
    { a: 0, b: 3, order: 1 },
    { a: 0, b: 4, order: 1 },
  ]
  const scene = buildSceneFromAtomsBonds(atoms, bonds)
  await exportScene(scene, join(HERE, 'methane.glb'))
}

// Sodium chloride: rock-salt lattice, lattice constant a = 5.64 Angstrom. Simple cubic grid of
// spacing a/2 with alternating Na/Cl by (i+j+k) parity reproduces the correct NaCl structure
// (two interpenetrating FCC sublattices). 3x3x3 grid = one conventional cell plus neighbors.
{
  const a = 5.64
  const half = a / 2
  const atoms = []
  const indexOf = new Map()
  let idx = 0
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      for (let k = 0; k <= 2; k++) {
        const element = (i + j + k) % 2 === 0 ? 'NA' : 'CL'
        atoms.push({ x: i * half, y: j * half, z: k * half, element })
        indexOf.set(`${i}-${j}-${k}`, idx)
        idx++
      }
    }
  }
  const bonds = []
  for (let i = 0; i <= 2; i++) {
    for (let j = 0; j <= 2; j++) {
      for (let k = 0; k <= 2; k++) {
        const from = indexOf.get(`${i}-${j}-${k}`)
        if (i < 2) bonds.push({ a: from, b: indexOf.get(`${i + 1}-${j}-${k}`), order: 1 })
        if (j < 2) bonds.push({ a: from, b: indexOf.get(`${i}-${j + 1}-${k}`), order: 1 })
        if (k < 2) bonds.push({ a: from, b: indexOf.get(`${i}-${j}-${k + 1}`), order: 1 })
      }
    }
  }
  // Center the lattice at the origin.
  const center = a
  atoms.forEach((atom) => { atom.x -= center / 2; atom.y -= center / 2; atom.z -= center / 2 })
  const scene = buildSceneFromAtomsBonds(atoms, bonds)
  await exportScene(scene, join(HERE, 'sodium-chloride-lattice.glb'))
}

console.log('All chemistry-structure molecule/lattice GLBs built.')
