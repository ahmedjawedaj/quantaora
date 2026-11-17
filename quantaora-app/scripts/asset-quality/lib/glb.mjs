// Manual glTF 2.0 binary (.glb) container parser.
//
// We deliberately do NOT use three.js's GLTFLoader here: it expects a DOM/fetch
// environment (Image, document, URL.createObjectURL, etc.) that does not exist in
// plain Node, and getting it to run headlessly is fragile. The GLB container format
// is a tiny, fully-documented binary layout (see the "GLB File Format Specification"
// section of the glTF 2.0 spec), so we parse it directly:
//
//   uint32 magic   ("glTF" = 0x46546C67)
//   uint32 version
//   uint32 length  (total file length, bytes)
//   -- chunk 0 (required, must be JSON) --
//   uint32 chunkLength
//   uint32 chunkType ("JSON" = 0x4E4F534A)
//   ubyte[chunkLength] chunkData
//   -- chunk 1 (optional, BIN) --
//   uint32 chunkLength
//   uint32 chunkType ("BIN\0" = 0x004E4942)
//   ubyte[chunkLength] chunkData
//
// This is sufficient to recover scene/node/mesh/material/texture/animation counts,
// accessor min/max (bounding box), and embedded image bytes for resolution sniffing.
// It cannot verify visual correctness (framing, material shading, animation
// playback) -- that still needs a renderer or human/agent screenshot review.

export const GLB_MAGIC = 0x46546c67
const CHUNK_TYPE_JSON = 0x4e4f534a
const CHUNK_TYPE_BIN = 0x004e4942

/**
 * @param {Buffer} buf
 * @returns {{
 *   valid: boolean,
 *   error?: string,
 *   version?: number,
 *   declaredLength?: number,
 *   actualLength: number,
 *   lengthMismatch?: boolean,
 *   json?: any,
 *   jsonParseError?: string,
 *   binChunk?: Buffer,
 *   chunkSummary?: Array<{ type: string, length: number }>,
 * }}
 */
export function parseGLB(buf) {
  const actualLength = buf.length

  if (actualLength < 12) {
    return { valid: false, error: 'File is smaller than the 12-byte GLB header.', actualLength }
  }

  const magic = buf.readUInt32LE(0)
  if (magic !== GLB_MAGIC) {
    return {
      valid: false,
      error: `Bad magic: expected 0x46546c67 ("glTF"), got 0x${magic.toString(16)}.`,
      actualLength,
    }
  }

  const version = buf.readUInt32LE(4)
  const declaredLength = buf.readUInt32LE(8)
  const lengthMismatch = declaredLength !== actualLength

  let offset = 12
  let jsonChunk = null
  let binChunk = null
  const chunkSummary = []

  while (offset + 8 <= actualLength) {
    const chunkLength = buf.readUInt32LE(offset)
    const chunkType = buf.readUInt32LE(offset + 4)
    const dataStart = offset + 8
    const dataEnd = dataStart + chunkLength

    if (dataEnd > actualLength) {
      chunkSummary.push({ type: chunkTypeLabel(chunkType), length: chunkLength, truncated: true })
      break
    }

    const data = buf.subarray(dataStart, dataEnd)
    if (chunkType === CHUNK_TYPE_JSON && !jsonChunk) jsonChunk = data
    else if (chunkType === CHUNK_TYPE_BIN && !binChunk) binChunk = data

    chunkSummary.push({ type: chunkTypeLabel(chunkType), length: chunkLength })
    offset = dataEnd
  }

  if (!jsonChunk) {
    return {
      valid: false,
      error: 'No JSON chunk found (malformed GLB or truncated file).',
      version,
      declaredLength,
      actualLength,
      lengthMismatch,
      chunkSummary,
    }
  }

  let json
  let jsonParseError
  try {
    json = JSON.parse(jsonChunk.toString('utf8'))
  } catch (err) {
    jsonParseError = err instanceof Error ? err.message : String(err)
  }

  return {
    valid: !jsonParseError,
    error: jsonParseError ? `JSON chunk failed to parse: ${jsonParseError}` : undefined,
    version,
    declaredLength,
    actualLength,
    lengthMismatch,
    json,
    jsonParseError,
    binChunk,
    chunkSummary,
  }
}

function chunkTypeLabel(chunkType) {
  if (chunkType === CHUNK_TYPE_JSON) return 'JSON'
  if (chunkType === CHUNK_TYPE_BIN) return 'BIN'
  return `0x${chunkType.toString(16)}`
}

/**
 * Summarize scene-graph-level counts from a parsed glTF JSON document.
 * @param {any} json
 */
export function summarizeCounts(json) {
  if (!json) return null
  return {
    scenes: json.scenes?.length ?? 0,
    nodes: json.nodes?.length ?? 0,
    meshes: json.meshes?.length ?? 0,
    materials: json.materials?.length ?? 0,
    textures: json.textures?.length ?? 0,
    images: json.images?.length ?? 0,
    animations: json.animations?.length ?? 0,
    accessors: json.accessors?.length ?? 0,
    buffers: json.buffers?.length ?? 0,
    bufferViews: json.bufferViews?.length ?? 0,
  }
}

/**
 * Compute an aggregate bounding box across all mesh primitives' POSITION accessor
 * min/max (per glTF spec, POSITION accessors SHOULD carry min/max). Returns null
 * if the file has no meshes; marks `incomplete: true` if any primitive lacks
 * min/max (so we cannot claim a fully accurate box).
 * @param {any} json
 */
export function computeBoundingBox(json) {
  if (!json?.meshes?.length || !json.accessors) return null

  let min = null
  let max = null
  let incomplete = false
  let positionAccessorsSeen = 0

  for (const mesh of json.meshes) {
    for (const primitive of mesh.primitives ?? []) {
      const accessorIndex = primitive.attributes?.POSITION
      if (accessorIndex === undefined) continue
      positionAccessorsSeen += 1
      const accessor = json.accessors[accessorIndex]
      if (!accessor || !accessor.min || !accessor.max) {
        incomplete = true
        continue
      }
      min = min ? min.map((v, i) => Math.min(v, accessor.min[i])) : [...accessor.min]
      max = max ? max.map((v, i) => Math.max(v, accessor.max[i])) : [...accessor.max]
    }
  }

  if (positionAccessorsSeen === 0) return null
  if (!min || !max) return { min: null, max: null, incomplete: true }

  const size = max.map((v, i) => v - min[i])
  return { min, max, size, incomplete }
}

/**
 * Extract the raw bytes for a glTF image, if it is embedded via bufferView
 * (the only case a self-contained .glb can serve without an external file).
 * @param {any} json
 * @param {Buffer|null} binChunk
 * @param {number} imageIndex
 */
export function extractImageBytes(json, binChunk, imageIndex) {
  const image = json.images?.[imageIndex]
  if (!image) return { bytes: null, note: 'image index out of range' }
  if (image.uri) {
    if (image.uri.startsWith('data:')) {
      const commaIdx = image.uri.indexOf(',')
      if (commaIdx === -1) return { bytes: null, note: 'malformed data URI' }
      try {
        const bytes = Buffer.from(image.uri.slice(commaIdx + 1), 'base64')
        return { bytes, note: null }
      } catch {
        return { bytes: null, note: 'failed to decode data URI' }
      }
    }
    return { bytes: null, note: `external URI reference ("${image.uri}") -- not embedded, cannot inspect` }
  }
  if (image.bufferView === undefined) return { bytes: null, note: 'image has neither uri nor bufferView' }
  if (!binChunk) return { bytes: null, note: 'no BIN chunk present in file' }

  const bufferView = json.bufferViews?.[image.bufferView]
  if (!bufferView) return { bytes: null, note: 'referenced bufferView missing' }
  if (bufferView.buffer !== undefined && bufferView.buffer !== 0) {
    return { bytes: null, note: `image data lives in buffer index ${bufferView.buffer}, only buffer 0 (embedded BIN chunk) is supported` }
  }

  const start = bufferView.byteOffset ?? 0
  const end = start + bufferView.byteLength
  if (end > binChunk.length) return { bytes: null, note: 'bufferView range exceeds BIN chunk length' }
  return { bytes: binChunk.subarray(start, end), note: null }
}
