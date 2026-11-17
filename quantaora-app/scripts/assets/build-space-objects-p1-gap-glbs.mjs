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

function mat(color, options = {}) {
  return new THREE.MeshPhysicalMaterial({
    color,
    roughness: 0.56,
    metalness: 0,
    clearcoat: 0.12,
    clearcoatRoughness: 0.48,
    ...options,
  })
}

const M = {
  black: mat('#02040a', { roughness: 0.9, clearcoat: 0 }),
  blue: mat('#6bb7ff', { emissive: '#15395c', emissiveIntensity: 0.1 }),
  cyan: mat('#90e3ff', { emissive: '#164b5b', emissiveIntensity: 0.16 }),
  gold: mat('#ffd36d', { emissive: '#7a4d10', emissiveIntensity: 0.18 }),
  orange: mat('#f28f45', { emissive: '#7a2f10', emissiveIntensity: 0.14 }),
  red: mat('#d95752', { emissive: '#631413', emissiveIntensity: 0.12 }),
  rose: mat('#e78aae', { emissive: '#5c1835', emissiveIntensity: 0.08 }),
  white: mat('#f2eee1', { emissive: '#69604c', emissiveIntensity: 0.12 }),
  ash: mat('#7c828d', { roughness: 0.72 }),
  dust: mat('#d6a66b', { transparent: true, opacity: 0.32, side: THREE.DoubleSide, roughness: 0.8 }),
  plasma: mat('#8fd8ff', { transparent: true, opacity: 0.3, side: THREE.DoubleSide, roughness: 0.35 }),
  halo: mat('#c5dcff', { transparent: true, opacity: 0.16, side: THREE.DoubleSide, roughness: 0.4 }),
}

function add(parent, name, geometry, material, position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1]) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = name
  mesh.position.set(...position)
  mesh.rotation.set(...rotation)
  mesh.scale.set(...scale)
  parent.add(mesh)
  return mesh
}

function sphere(parent, name, radius, position, material, scale = [1, 1, 1], segments = 40) {
  return add(parent, name, new THREE.SphereGeometry(radius, segments, segments), material, position, [0, 0, 0], scale)
}

function cyl(parent, name, radiusTop, radiusBottom, height, position, rotation, material, segments = 32) {
  return add(parent, name, new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments), material, position, rotation)
}

function cone(parent, name, radius, height, position, rotation, material, segments = 36) {
  return add(parent, name, new THREE.ConeGeometry(radius, height, segments), material, position, rotation)
}

function torus(parent, name, radius, tubeRadius, position, rotation, material, radialSegments = 18, tubularSegments = 128) {
  return add(parent, name, new THREE.TorusGeometry(radius, tubeRadius, radialSegments, tubularSegments), material, position, rotation)
}

function tube(parent, name, points, radius, material, tubularSegments = 88) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  return add(parent, name, new THREE.TubeGeometry(curve, tubularSegments, radius, 12, false), material)
}

function extents(parent, max = 3.4) {
  const half = max / 2
  const invisible = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0 })
  ;[
    [-half, 0, 0],
    [half, 0, 0],
    [0, -half, 0],
    [0, half, 0],
    [0, 0, -half],
    [0, 0, half],
  ].forEach((position, index) => sphere(parent, `normalization-anchor-${index}`, 0.001, position, invisible, [1, 1, 1], 8))
}

function spiralPoints(arms, turns, radius, yScale, z = 0.08) {
  const paths = []
  for (let arm = 0; arm < arms; arm += 1) {
    const points = []
    const offset = (arm / arms) * Math.PI * 2
    for (let i = 0; i < 72; i += 1) {
      const t = i / 71
      const r = 0.16 + radius * t
      const a = offset + turns * Math.PI * 2 * t
      points.push([Math.cos(a) * r, Math.sin(a) * r * yScale, z])
    }
    paths.push(points)
  }
  return paths
}

function starSpecks(root, prefix, count, radius, scaleY = 0.45, material = M.white) {
  for (let i = 0; i < count; i += 1) {
    const a = i * 2.399963
    const r = radius * Math.sqrt((i + 0.5) / count)
    const z = ((i % 5) - 2) * 0.035
    sphere(root, `${prefix}-stellar-knot-${i}`, 0.018 + (i % 3) * 0.006, [Math.cos(a) * r, Math.sin(a) * r * scaleY, z], material, [1, 1, 1], 12)
  }
}

function flare(root, prefix, material, length = 1.0) {
  for (let i = 0; i < 8; i += 1) {
    const a = (i / 8) * Math.PI * 2
    cone(root, `${prefix}-radial-ray-${i}`, 0.055, length, [Math.cos(a) * 0.42, Math.sin(a) * 0.42, 0], [0, 0, a - Math.PI / 2], material, 18)
  }
}

async function exportScene(root, filename) {
  const scene = new THREE.Scene()
  scene.add(root)
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

function buildBlackHole() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-black-hole'
  extents(root)
  sphere(root, 'black-hole-event-horizon-dark-core', 0.38, [0, 0, 0.02], M.black, [1, 1, 1], 56)
  torus(root, 'glowing-accretion-disk-fast-inner-ring', 0.62, 0.055, [0, 0, 0], [Math.PI / 2.35, 0.18, 0], M.gold)
  torus(root, 'orange-accretion-disk-wide-outer-ring', 0.9, 0.04, [0, 0, 0], [Math.PI / 2.35, 0.18, 0], M.orange)
  torus(root, 'bent-light-photon-orbit', 1.12, 0.018, [0, 0, 0], [Math.PI / 2.35, 0.18, 0], M.plasma)
  sphere(root, 'gravity-lensing-blue-back-star', 0.07, [-0.92, 0.52, -0.18], M.cyan, [1, 1, 1], 20)
  sphere(root, 'gravity-lensing-red-back-star', 0.055, [0.86, -0.42, -0.16], M.rose, [1, 1, 1], 18)
  return root
}

function buildMainSequenceStar() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-main-sequence-star'
  extents(root)
  sphere(root, 'stable-main-sequence-fusing-core', 0.55, [0, 0, 0], M.gold, [1, 1, 1], 56)
  sphere(root, 'transparent-radiation-zone-shell', 0.72, [0, 0, 0], M.halo, [1, 1, 1], 48)
  flare(root, 'steady-light-output', M.gold, 0.82)
  torus(root, 'balanced-hydrostatic-equilibrium-band', 0.82, 0.016, [0, 0, 0], [Math.PI / 2, 0, 0], M.plasma)
  return root
}

function buildNeutronStar() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-neutron-star'
  extents(root)
  sphere(root, 'tiny-ultra-dense-neutron-core', 0.3, [0, 0, 0], M.cyan, [1, 1, 1], 56)
  torus(root, 'magnetic-field-loop-one', 0.72, 0.014, [0, 0, 0], [Math.PI / 2, 0.8, 0], M.plasma)
  torus(root, 'magnetic-field-loop-two', 0.96, 0.012, [0, 0, 0], [Math.PI / 2, -0.8, 0], M.plasma)
  cyl(root, 'north-pulsar-beam', 0.055, 0.16, 1.18, [0, 0.88, 0], [0.18, 0, 0], M.blue, 28)
  cyl(root, 'south-pulsar-beam', 0.16, 0.055, 1.18, [0, -0.88, 0], [0.18, 0, 0], M.blue, 28)
  torus(root, 'rapid-spin-equator-ring', 0.43, 0.015, [0, 0, 0], [Math.PI / 2, 0, 0], M.white)
  return root
}

function buildProtostar() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-protostar'
  extents(root)
  sphere(root, 'young-protostar-warm-growing-core', 0.34, [0, 0, 0.08], M.orange, [1, 1, 1], 44)
  torus(root, 'dusty-accretion-envelope', 0.72, 0.09, [0, 0, 0], [Math.PI / 2.4, 0.25, 0], M.dust)
  torus(root, 'infalling-gas-disk-inner-track', 0.46, 0.035, [0, 0, 0], [Math.PI / 2.4, 0.25, 0], M.gold)
  cyl(root, 'bipolar-jet-up-from-forming-star', 0.05, 0.12, 0.95, [0, 0.8, 0.08], [0.14, 0, 0], M.cyan, 24)
  cyl(root, 'bipolar-jet-down-from-forming-star', 0.12, 0.05, 0.95, [0, -0.8, 0.08], [0.14, 0, 0], M.cyan, 24)
  starSpecks(root, 'nearby-natal-cloud', 18, 1.18, 0.62, M.ash)
  return root
}

function buildRedGiant() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-red-giant'
  extents(root)
  sphere(root, 'expanded-red-giant-cool-outer-envelope', 0.82, [0, 0, 0], M.red, [1, 1, 1], 56)
  sphere(root, 'small-hot-fusion-core-inside', 0.18, [0, 0, 0.08], M.gold, [1, 1, 1], 32)
  sphere(root, 'transparent-loose-outer-atmosphere', 1.04, [0, 0, 0], M.dust, [1, 1, 1], 48)
  flare(root, 'slow-pulsing-red-giant-light', M.orange, 0.56)
  return root
}

function buildSupernova() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-supernova'
  extents(root)
  sphere(root, 'supernova-white-hot-explosion-core', 0.26, [0, 0, 0.08], M.white, [1, 1, 1], 40)
  sphere(root, 'expanding-shock-front-transparent-shell', 0.9, [0, 0, 0], M.halo, [1, 1, 1], 48)
  flare(root, 'blast-ejecta', M.orange, 1.18)
  for (let i = 0; i < 12; i += 1) {
    const a = (i / 12) * Math.PI * 2
    sphere(root, `heavy-element-ejecta-clump-${i}`, 0.055, [Math.cos(a) * 0.82, Math.sin(a) * 0.62, (i % 4) * 0.04], i % 2 ? M.red : M.cyan, [1, 1, 1], 16)
  }
  return root
}

function buildWhiteDwarf() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-white-dwarf'
  extents(root)
  sphere(root, 'small-hot-white-dwarf-remnant', 0.34, [0, 0, 0.08], M.white, [1, 1, 1], 56)
  sphere(root, 'faint-cooling-glow-shell', 0.55, [0, 0, 0.08], M.halo, [1, 1, 1], 44)
  torus(root, 'leftover-planetary-nebula-ring', 0.92, 0.045, [0, 0, 0], [Math.PI / 2.45, 0.32, 0], M.plasma)
  starSpecks(root, 'cooling-remnant-background', 10, 1.18, 0.58, M.ash)
  return root
}

function buildAndromeda() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-andromeda'
  extents(root)
  sphere(root, 'andromeda-bright-central-bulge', 0.24, [0, 0, 0.1], M.gold, [1.3, 0.85, 0.55], 44)
  spiralPoints(4, 0.95, 1.08, 0.42).forEach((points, index) => tube(root, `andromeda-wide-spiral-arm-${index}`, points, 0.035, index % 2 ? M.halo : M.white))
  torus(root, 'andromeda-tilted-stellar-disk-haze', 0.88, 0.08, [0, 0, 0], [Math.PI / 2.55, 0.28, 0], M.halo)
  starSpecks(root, 'andromeda-disk', 34, 1.16, 0.38, M.white)
  return root
}

function buildMilkyWay() {
  const root = new THREE.Group()
  root.name = 'quantaora-authored-milky-way'
  extents(root)
  cyl(root, 'milky-way-central-bar', 0.09, 0.09, 0.86, [0, 0, 0.1], [0, 0, Math.PI / 2.8], M.gold, 28)
  sphere(root, 'milky-way-yellow-central-bulge', 0.22, [0, 0, 0.12], M.gold, [1.15, 0.75, 0.48], 44)
  spiralPoints(4, 0.78, 1.02, 0.48).forEach((points, index) => tube(root, `milky-way-barred-spiral-arm-${index}`, points, 0.032, index % 2 ? M.cyan : M.white))
  torus(root, 'milky-way-thin-dust-lane-ring', 0.72, 0.045, [0, 0, 0.04], [Math.PI / 2.7, 0.16, 0], M.dust)
  starSpecks(root, 'milky-way-local-stellar-neighborhood', 38, 1.12, 0.46, M.white)
  sphere(root, 'sun-position-marker-in-orion-arm', 0.04, [0.54, -0.18, 0.18], M.orange, [1, 1, 1], 16)
  return root
}

const builders = {
  'black-hole': buildBlackHole,
  'main-sequence-star': buildMainSequenceStar,
  'neutron-star': buildNeutronStar,
  'protostar': buildProtostar,
  'red-giant': buildRedGiant,
  'supernova': buildSupernova,
  'white-dwarf': buildWhiteDwarf,
  andromeda: buildAndromeda,
  'milky-way': buildMilkyWay,
}

for (const [id, builder] of Object.entries(builders)) {
  await exportScene(builder(), `space-p1-${id}.glb`)
}
