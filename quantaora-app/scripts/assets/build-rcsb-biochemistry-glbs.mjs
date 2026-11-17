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

const OUT_DIR = new URL('../../public/models/sourced/biochemistry-structure/', import.meta.url)

const STRUCTURES = [
  {
    id: 'hemoglobin-protein',
    pdbId: '1HHO',
    title: 'Human deoxyhemoglobin backbone',
    components: ['biology-biochemistry-protein', 'chem-biolink-protein-folding'],
    focusResidues: ['HEM'],
    palette: ['#d9585a', '#4e9fd9', '#7bbf6a', '#8f77d9'],
  },
  {
    id: 'lysozyme-enzyme',
    pdbId: '1LYZ',
    title: 'Hen egg-white lysozyme enzyme backbone',
    components: ['biology-biochemistry-enzyme', 'chem-biolink-enzyme-substrate'],
    focusResidues: ['GLU', 'ASP'],
    palette: ['#8f77d9', '#4e9fd9', '#d98a52', '#7bbf6a'],
  },
]

const LIGANDS = [
  {
    id: 'atp-cellular-energy',
    ligandId: 'ATP',
    title: 'Adenosine triphosphate',
    components: ['biology-biochemistry-atp-cellular-energy'],
    focusElements: ['P'],
  },
  {
    id: 'phospholipid-membrane',
    ligandId: 'PEF',
    title: 'Dipalmitoyl phosphatidylethanolamine',
    components: ['biology-biochemistry-lipid', 'chem-biolink-lipid-membrane'],
    focusElements: ['P', 'N'],
  },
]

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.08,
    clearcoatRoughness: 0.58,
    ...options,
  })
}

const M = {
  dark: mat('#2f333b', { roughness: 0.72 }),
  pale: mat('#e9dfcf'),
  gold: mat('#efbd4c'),
  site: mat('#f97316', { emissive: '#301000', emissiveIntensity: 0.08 }),
  glass: mat('#c8edf7', { transparent: true, opacity: 0.16, side: THREE.DoubleSide, roughness: 0.24 }),
}

const ELEMENTS = {
  H: { radius: 0.038, color: '#f2ece0' },
  C: { radius: 0.06, color: '#3f3b36' },
  N: { radius: 0.066, color: '#4e9fd9' },
  O: { radius: 0.064, color: '#d9585a' },
  P: { radius: 0.082, color: '#efbd4c' },
  S: { radius: 0.078, color: '#d98a52' },
}

const ligandBondMaterial = mat('#c9beae', { roughness: 0.64 })

async function fetchText(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Failed ${url}: ${response.status}`)
  return response.text()
}

function parsePdb(text) {
  const atoms = []
  for (const line of text.split(/\r?\n/)) {
    if (!line.startsWith('ATOM  ') && !line.startsWith('HETATM')) continue
    atoms.push({
      record: line.slice(0, 6).trim(),
      atom: line.slice(12, 16).trim(),
      residue: line.slice(17, 20).trim(),
      chain: line.slice(21, 22).trim() || '_',
      residueNumber: Number.parseInt(line.slice(22, 26), 10),
      x: Number.parseFloat(line.slice(30, 38)),
      y: Number.parseFloat(line.slice(38, 46)),
      z: Number.parseFloat(line.slice(46, 54)),
    })
  }
  return atoms.filter((atom) => Number.isFinite(atom.x) && Number.isFinite(atom.y) && Number.isFinite(atom.z))
}

function parseSdf(text) {
  const lines = text.split(/\r?\n/)
  const countsLine = lines[3] ?? ''
  const atomCount = Number.parseInt(countsLine.slice(0, 3), 10)
  const bondCount = Number.parseInt(countsLine.slice(3, 6), 10)
  if (!Number.isFinite(atomCount) || !Number.isFinite(bondCount)) {
    throw new Error('Could not parse SDF counts line')
  }

  const atoms = []
  for (let index = 0; index < atomCount; index += 1) {
    const parts = lines[4 + index].trim().split(/\s+/)
    atoms.push({
      x: Number.parseFloat(parts[0]),
      y: Number.parseFloat(parts[1]),
      z: Number.parseFloat(parts[2]),
      element: parts[3],
    })
  }

  const bonds = []
  for (let index = 0; index < bondCount; index += 1) {
    const parts = lines[4 + atomCount + index].trim().split(/\s+/)
    bonds.push({
      a: Number.parseInt(parts[0], 10) - 1,
      b: Number.parseInt(parts[1], 10) - 1,
      order: Number.parseInt(parts[2], 10),
    })
  }

  return {
    atoms: atoms.filter((atom) => Number.isFinite(atom.x) && Number.isFinite(atom.y) && Number.isFinite(atom.z)),
    bonds: bonds.filter((bond) => Number.isInteger(bond.a) && Number.isInteger(bond.b)),
  }
}

function normalize(points) {
  const vectors = points.map((point) => new THREE.Vector3(point.x, point.y, point.z))
  const box = new THREE.Box3().setFromPoints(vectors)
  const center = box.getCenter(new THREE.Vector3())
  const size = box.getSize(new THREE.Vector3())
  const scale = 2.55 / Math.max(size.x, size.y, size.z, 0.001)
  return (point) => new THREE.Vector3(point.x, point.y, point.z).sub(center).multiplyScalar(scale)
}

function add(parent, name, geometry, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(...position)
  parent.add(mesh)
  return mesh
}

function sphere(parent, name, radius, position, material, segments = 24) {
  return add(parent, name, new THREE.SphereGeometry(radius, segments, segments), material, position)
}

function cylinderBetween(parent, name, from, to, radius, material) {
  const start = new THREE.Vector3(...from)
  const end = new THREE.Vector3(...to)
  const dir = end.clone().sub(start)
  const length = dir.length()
  if (length < 0.001) return
  const mesh = add(parent, name, new THREE.CylinderGeometry(radius, radius, length, 12), material, start.clone().lerp(end, 0.5).toArray())
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
}

function tube(parent, name, points, radius, material) {
  if (points.length < 2) return
  const curve = new THREE.CatmullRomCurve3(points)
  add(parent, name, new THREE.TubeGeometry(curve, Math.max(points.length * 6, 48), radius, 12, false), material)
}

function addExtents(root) {
  const invisible = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 })
  for (const position of [
    [-1.6, 0, 0],
    [1.6, 0, 0],
    [0, -1.6, 0],
    [0, 1.6, 0],
    [0, 0, -1.6],
    [0, 0, 1.6],
  ]) sphere(root, `normalization-anchor-${position.join('-')}`, 0.001, position, invisible, 8)
}

function buildStructure(definition, atoms) {
  const root = new THREE.Group()
  root.name = `rcsb-${definition.pdbId.toLowerCase()}-${definition.id}`
  addExtents(root)

  const caAtoms = atoms.filter((atom) => atom.record === 'ATOM' && atom.atom === 'CA')
  const toScene = normalize(caAtoms.length ? caAtoms : atoms)
  const chains = Map.groupBy(caAtoms, (atom) => atom.chain)

  let chainIndex = 0
  for (const [chainId, chainAtoms] of chains) {
    const material = mat(definition.palette[chainIndex % definition.palette.length])
    const ordered = chainAtoms.toSorted((a, b) => a.residueNumber - b.residueNumber).map(toScene)
    tube(root, `real-pdb-chain-${chainId}-backbone`, ordered, 0.035, material)
    for (let i = 0; i < ordered.length; i += Math.max(1, Math.floor(ordered.length / 22))) {
      sphere(root, `chain-${chainId}-residue-marker-${i}`, 0.055, ordered[i].toArray(), material, 18)
    }
    chainIndex += 1
  }

  const focusAtoms = atoms
    .filter((atom) => definition.focusResidues.includes(atom.residue))
    .filter((_, index) => index % 8 === 0)
    .slice(0, 40)
  for (const [index, atom] of focusAtoms.entries()) {
    sphere(root, `function-site-real-atom-${atom.residue}-${index}`, 0.065, toScene(atom).toArray(), M.site, 18)
  }

  add(root, 'structure-bounding-capsule', new THREE.SphereGeometry(1.38, 42, 18), M.glass)
  cylinderBetween(root, 'sequence-to-fold-arrow', [-1.35, -1.25, 0], [-0.55, -1.25, 0], 0.018, M.gold)
  sphere(root, 'active-shape-marker', 0.11, [0.92, -0.95, 0], M.gold, 24)
  sphere(root, 'protein-context-base', 0.07, [-1.45, -1.25, 0], M.dark, 18)
  return root
}

function materialForElement(element) {
  const def = ELEMENTS[element.toUpperCase()] ?? { radius: 0.058, color: '#9a9488' }
  return { ...def, material: mat(def.color, { roughness: 0.48 }) }
}

function buildLigand(definition, atoms, bonds) {
  const root = new THREE.Group()
  root.name = `rcsb-ccd-${definition.ligandId.toLowerCase()}-${definition.id}`
  addExtents(root)

  const toScene = normalize(atoms)
  const positions = atoms.map(toScene)

  for (const [index, atom] of atoms.entries()) {
    const { radius, material } = materialForElement(atom.element)
    sphere(root, `real-atom-${atom.element}-${index}`, radius, positions[index].toArray(), material, 18)
  }

  for (const [index, bond] of bonds.entries()) {
    const from = positions[bond.a]
    const to = positions[bond.b]
    if (!from || !to) continue
    cylinderBetween(root, `real-bond-${index}`, from.toArray(), to.toArray(), 0.026, ligandBondMaterial)
  }

  for (const [index, atom] of atoms.entries()) {
    if (!definition.focusElements.includes(atom.element.toUpperCase())) continue
    sphere(root, `function-focus-${atom.element}-${index}`, 0.11, positions[index].toArray(), M.site, 24)
  }

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
  console.log(`Wrote ${outPath}`)
}

async function writeSidecar(definition) {
  const sidecar = {
    id: definition.id,
    pdbId: definition.pdbId,
    title: definition.title,
    sourceName: `RCSB PDB ${definition.pdbId}`,
    sourceUrl: `https://www.rcsb.org/structure/${definition.pdbId}`,
    coordinateUrl: `https://files.rcsb.org/download/${definition.pdbId}.pdb`,
    license: 'RCSB PDB data files are distributed under CC0 1.0 Universal',
    licenseStatus: 'CLEAR',
    qualityTier: 'support',
    targetComponents: definition.components,
    generatedBy: 'scripts/assets/build-rcsb-biochemistry-glbs.mjs',
  }
  const outPath = fileURLToPath(new URL(`${definition.id}.license.json`, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, `${JSON.stringify(sidecar, null, 2)}\n`)
}

async function writeLigandSidecar(definition) {
  const sidecar = {
    id: definition.id,
    ligandId: definition.ligandId,
    title: definition.title,
    sourceName: `RCSB PDB Chemical Component Dictionary - ${definition.ligandId}`,
    sourceUrl: `https://files.rcsb.org/ligands/view/${definition.ligandId}_ideal.sdf`,
    license: 'RCSB PDB Chemical Component Dictionary data files are distributed under CC0 1.0 Universal',
    licenseStatus: 'CLEAR',
    qualityTier: 'support',
    targetComponents: definition.components,
    generatedBy: 'scripts/assets/build-rcsb-biochemistry-glbs.mjs',
  }
  const outPath = fileURLToPath(new URL(`${definition.id}.license.json`, OUT_DIR))
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, `${JSON.stringify(sidecar, null, 2)}\n`)
}

for (const definition of STRUCTURES) {
  const pdb = await fetchText(`https://files.rcsb.org/download/${definition.pdbId}.pdb`)
  const atoms = parsePdb(pdb)
  if (!atoms.length) throw new Error(`No atoms parsed for ${definition.pdbId}`)
  await exportScene(buildStructure(definition, atoms), `${definition.id}.glb`)
  await writeSidecar(definition)
}

for (const definition of LIGANDS) {
  const sdf = await fetchText(`https://files.rcsb.org/ligands/view/${definition.ligandId}_ideal.sdf`)
  const { atoms, bonds } = parseSdf(sdf)
  if (!atoms.length || !bonds.length) throw new Error(`No ligand geometry parsed for ${definition.ligandId}`)
  await exportScene(buildLigand(definition, atoms, bonds), `${definition.id}.glb`)
  await writeLigandSidecar(definition)
}
