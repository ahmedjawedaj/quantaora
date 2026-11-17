#!/usr/bin/env node
// Wave 7 (chemistry-gaps-wave2 crystal material fix, non-integrated derivatives).
//
// The three source crystal-lattice GLBs in
// public/models/sourced/chemistry-gaps-wave2/ were converted from 3D-print
// STL/OpenSCAD sources via trimesh and ship with zero materials
// (materialCount: 0 per their .license.json sidecars) -- they all render as
// flat default white/grey, so a learner cannot tell diamond, silicon carbide,
// and graphite apart by color/material (Wave 6 visual review verdict:
// CONDITIONAL on all three for this exact reason -- see
// docs/assets/reviews/chemistry-gaps-wave2-visual.md).
//
// This script writes NEW derivative .glb files (does not overwrite the
// sources) that add one glTF-core PBR material per file and assign it to the
// existing mesh primitive. No geometry is touched: we parse the GLB
// container manually (same approach as this folder's own validate-glb.mjs
// and scripts/asset-quality/lib/glb.mjs -- deliberately not three.js's
// GLTFLoader/GLTFExporter, which expect a DOM/fetch environment that doesn't
// exist in plain Node) and only rewrite the JSON chunk. The BIN chunk
// (accessors/bufferViews/buffer bytes -- i.e. all vertex/index data) is
// copied byte-for-byte from the source into the derivative, so mesh
// topology (vertex count, face count, UVs -- none of these files have UVs
// to begin with) is provably unchanged.
//
// Usage: node scripts/assets/fix-crystal-materials.mjs

import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'

const DIR = fileURLToPath(new URL('../../public/models/sourced/chemistry-gaps-wave2/', import.meta.url))

const JOBS = [
  {
    src: 'crystal-diamond-carbon-nih.glb',
    out: 'crystal-diamond-carbon-nih-material-fixed.glb',
    materialName: 'diamond-carbon-clear',
    // Diamond: clear/faceted crystalline carbon. No NORMAL attribute in the
    // source mesh, so shading will be flat-faceted per-triangle -- which
    // reads *well* for diamond (faceted gem look) rather than needing a fix.
    // alphaMode BLEND + low alpha + very low roughness + zero metalness give
    // a glassy, light-refractive read using only core glTF 2.0 (no
    // KHR_materials_transmission/ior extension -- keeps the derivative
    // maximally compatible with any glTF 2.0 viewer, incl. <model-viewer>
    // and three.js without extra extension plugins).
    //
    // Wave 8 QA (docs/reviews/wave8-crystals-branchlab.md) found the original
    // alpha of 0.42 combined with a near-white baseColor ([0.86, 0.92, 0.96])
    // reads as washed-out / near-invisible against the app's off-white review
    // background at back180/side90 camera angles -- close enough to the
    // background color+alpha that the gem effectively disappears instead of
    // reading as "clear". Wave 9 fix (this pass): raise alpha 0.42 -> 0.62 and
    // deepen/saturate the tint (less near-white, more visible blue) so more of
    // the material's own color shows through even where it's backed by the
    // pale off-white page rather than a contrasting object, while keeping
    // metalness/roughness low enough to still read as glassy translucent gem
    // (not the opaque siblings' flat mineral look). Contrast reference point:
    // sibling entries below (silicon carbide, graphite) both PASSED Wave 8
    // visual review using opaque materials with alpha 1.0 -- diamond can't go
    // opaque without losing the "clear gem" identity, so the fix instead pulls
    // alpha and tint saturation partway toward that end of the range rather
    // than all the way.
    material: {
      name: 'diamond-carbon-clear',
      pbrMetallicRoughness: {
        baseColorFactor: [0.58, 0.74, 0.86, 0.62],
        metallicFactor: 0.08,
        roughnessFactor: 0.1,
      },
      alphaMode: 'BLEND',
      doubleSided: true,
      extras: {
        note: 'Core glTF 2.0 PBR only (baseColor alpha for translucency); no KHR_materials_transmission extension used, to stay viewer-compatible without extra plugin support. Wave 9: alpha raised 0.42->0.62 and tint deepened/saturated (was near-white [0.86,0.92,0.96], now [0.58,0.74,0.86]) plus a small roughness/metalness bump (0.04->0.1 / 0.05->0.08) to fix a Wave 8 washed-out/near-invisible finding against the off-white review background, while keeping the clear-gem read.',
      },
    },
  },
  {
    src: 'crystal-silicon-carbide-2h-nih.glb',
    out: 'crystal-silicon-carbide-2h-nih-material-fixed.glb',
    materialName: 'silicon-carbide-2h',
    // Silicon carbide (SiC, 2H polytype): semiconductor-family blue-grey,
    // moderate metalness/roughness -- distinct from diamond's pale glassy
    // translucency and graphite's dark sheen. The source mesh is a single
    // primitive with no per-atom-type (Si vs C) vertex data, so per-species
    // coloring isn't possible without splitting geometry (out of scope --
    // topology must be preserved exactly); this is the "at minimum, a
        // material treatment visually distinguishable from both diamond and
    // graphite" fallback called for in the task brief.
    material: {
      name: 'silicon-carbide-2h',
      pbrMetallicRoughness: {
        baseColorFactor: [0.42, 0.5, 0.58, 1.0],
        metallicFactor: 0.35,
        roughnessFactor: 0.4,
      },
      alphaMode: 'OPAQUE',
      doubleSided: false,
      extras: {
        note: 'Single-primitive mesh, no per-atom-type (Si vs C) vertex data available -- uniform material distinguishes the whole crystal from diamond/graphite rather than coloring Si/C atoms separately.',
      },
    },
  },
  {
    src: 'crystal-graphite-sheet-nih.glb',
    out: 'crystal-graphite-sheet-nih-material-fixed.glb',
    materialName: 'graphite-sheet-dark',
    // Graphite (single graphene sheet -- NOT stacked multi-layer graphite,
    // per the Wave 6 review and this sheet's own .license.json; CC-BY
    // attribution required, unchanged here since this script only edits
    // materials/colors, license metadata sidecar is untouched): dark
    // near-black with a subtle metallic sheen, consistent with real
    // graphite's lustre and distinct from diamond (pale/clear) and SiC
    // (blue-grey).
    material: {
      name: 'graphite-sheet-dark',
      pbrMetallicRoughness: {
        baseColorFactor: [0.09, 0.09, 0.1, 1.0],
        metallicFactor: 0.55,
        roughnessFactor: 0.32,
      },
      alphaMode: 'OPAQUE',
      doubleSided: true,
      extras: {
        note: 'Depicts a single graphene sheet, not stacked multi-layer graphite -- material darkened/given a subtle metallic sheen to read as graphite-family carbon, not the interlayer-stacked bulk mineral.',
      },
    },
  },
]

const GLB_MAGIC = 0x46546c67
const CHUNK_TYPE_JSON = 0x4e4f534a
const CHUNK_TYPE_BIN = 0x004e4942

function parseGLB(buf) {
  const magic = buf.readUInt32LE(0)
  if (magic !== GLB_MAGIC) throw new Error(`Bad GLB magic in source file: 0x${magic.toString(16)}`)
  const version = buf.readUInt32LE(4)
  const declaredLength = buf.readUInt32LE(8)

  let offset = 12
  let jsonChunk = null
  let binChunk = null
  const chunks = []
  while (offset + 8 <= buf.length) {
    const chunkLength = buf.readUInt32LE(offset)
    const chunkType = buf.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + chunkLength
    const data = buf.subarray(dataStart, dataEnd)
    chunks.push({ type: chunkType, data })
    if (chunkType === CHUNK_TYPE_JSON && !jsonChunk) jsonChunk = data
    else if (chunkType === CHUNK_TYPE_BIN && !binChunk) binChunk = data
    offset = dataEnd
  }

  const json = JSON.parse(jsonChunk.toString('utf8'))
  return { version, declaredLength, json, jsonChunk, binChunk, chunks }
}

function buildChunk(type, data) {
  // Pad per glTF 2.0 GLB spec: JSON chunk padded with 0x20 (space), BIN
  // chunk padded with 0x00, to a 4-byte boundary.
  const padByte = type === CHUNK_TYPE_JSON ? 0x20 : 0x00
  const padLength = (4 - (data.length % 4)) % 4
  const padded = padLength === 0 ? data : Buffer.concat([data, Buffer.alloc(padLength, padByte)])
  const header = Buffer.alloc(8)
  header.writeUInt32LE(padded.length, 0)
  header.writeUInt32LE(type, 4)
  return Buffer.concat([header, padded])
}

function buildGLB(json, binChunkRaw) {
  const jsonBuf = Buffer.from(JSON.stringify(json), 'utf8')
  const jsonChunk = buildChunk(CHUNK_TYPE_JSON, jsonBuf)
  const binChunk = buildChunk(CHUNK_TYPE_BIN, binChunkRaw)
  const totalLength = 12 + jsonChunk.length + binChunk.length
  const header = Buffer.alloc(12)
  header.writeUInt32LE(GLB_MAGIC, 0)
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(totalLength, 8)
  return Buffer.concat([header, jsonChunk, binChunk])
}

function sha256(buf) {
  return createHash('sha256').update(buf).digest('hex')
}

function summarize(json) {
  return {
    sceneCount: json.scenes?.length ?? 0,
    nodeCount: json.nodes?.length ?? 0,
    meshCount: json.meshes?.length ?? 0,
    materialCount: json.materials?.length ?? 0,
    accessorCount: json.accessors?.length ?? 0,
    primitiveCounts: (json.meshes ?? []).map((m) => m.primitives?.length ?? 0),
    accessorAttribCounts: (json.meshes ?? []).flatMap((m) =>
      (m.primitives ?? []).map((p) => ({
        attributes: p.attributes,
        indices: p.indices,
        indexCount: json.accessors?.[p.indices]?.count ?? null,
        vertexCount: json.accessors?.[p.attributes?.POSITION]?.count ?? null,
      })),
    ),
  }
}

const results = []

for (const job of JOBS) {
  const srcPath = DIR + job.src
  const outPath = DIR + job.out
  const srcBuf = readFileSync(srcPath)
  const parsed = parseGLB(srcBuf)

  if (!parsed.binChunk) throw new Error(`${job.src}: no BIN chunk found, cannot preserve geometry`)
  if ((parsed.json.materials?.length ?? 0) !== 0) {
    throw new Error(`${job.src}: expected 0 pre-existing materials, found ${parsed.json.materials.length}`)
  }

  const beforeSummary = summarize(parsed.json)

  // Deep clone JSON, add the material, point every mesh primitive at it.
  const newJson = JSON.parse(JSON.stringify(parsed.json))
  newJson.materials = [job.material]
  let primitivesPatched = 0
  for (const mesh of newJson.meshes ?? []) {
    for (const primitive of mesh.primitives ?? []) {
      primitive.material = 0
      primitivesPatched += 1
    }
  }

  const outBuf = buildGLB(newJson, parsed.binChunk)
  writeFileSync(outPath, outBuf)

  // Re-parse the freshly written derivative to validate it structurally
  // (magic/version/chunk parse, JSON parses, geometry/material counts).
  const reparsed = parseGLB(outBuf)
  const afterSummary = summarize(reparsed.json)

  const geometryPreserved =
    sha256(parsed.binChunk) === sha256(reparsed.binChunk) &&
    JSON.stringify(beforeSummary.accessorAttribCounts) === JSON.stringify(afterSummary.accessorAttribCounts)

  results.push({
    src: job.src,
    out: job.out,
    materialName: job.materialName,
    primitivesPatched,
    srcFileSizeBytes: srcBuf.length,
    outFileSizeBytes: outBuf.length,
    srcSha256: sha256(srcBuf),
    outSha256: sha256(outBuf),
    binChunkSha256Match: sha256(parsed.binChunk) === sha256(reparsed.binChunk),
    magicOk: reparsed.json !== null,
    glbVersion: reparsed.version,
    declaredLengthMatchesFile: (() => {
      const declared = outBuf.readUInt32LE(8)
      return declared === outBuf.length
    })(),
    before: beforeSummary,
    after: afterSummary,
    geometryPreserved,
  })
}

console.log(JSON.stringify(results, null, 2))

const anyFailed = results.some((r) => !r.geometryPreserved || !r.binChunkSha256Match || !r.declaredLengthMatchesFile)
if (anyFailed) {
  console.error('\nOne or more derivatives failed structural/geometry validation. See output above.')
  process.exit(1)
}
