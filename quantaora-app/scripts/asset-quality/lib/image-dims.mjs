// Header-only image dimension sniffing (PNG / JPEG / WebP). We only need
// width/height, never pixel data, so there is no need for a decode library --
// each format publishes its dimensions in a fixed, well-documented spot near
// the start of the byte stream.

/**
 * @param {Buffer} bytes
 * @returns {{ width: number, height: number, format: string } | { format: null, note: string }}
 */
export function sniffImageDimensions(bytes) {
  if (!bytes || bytes.length < 8) return { format: null, note: 'buffer too small to identify' }

  if (isPNG(bytes)) return sniffPNG(bytes)
  if (isJPEG(bytes)) return sniffJPEG(bytes)
  if (isWebP(bytes)) return sniffWebP(bytes)

  return { format: null, note: `unrecognized image signature (first bytes: ${bytes.subarray(0, 4).toString('hex')})` }
}

function isPNG(bytes) {
  return (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  )
}

function sniffPNG(bytes) {
  // Signature (8 bytes) + IHDR length (4) + "IHDR" (4) = 16, then width(4 BE), height(4 BE).
  if (bytes.length < 24) return { format: 'png', note: 'truncated before IHDR' }
  const width = bytes.readUInt32BE(16)
  const height = bytes.readUInt32BE(20)
  return { width, height, format: 'png' }
}

function isJPEG(bytes) {
  return bytes[0] === 0xff && bytes[1] === 0xd8
}

const JPEG_SOF_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf,
])

function sniffJPEG(bytes) {
  let i = 2
  while (i + 9 < bytes.length) {
    if (bytes[i] !== 0xff) {
      i += 1
      continue
    }
    const marker = bytes[i + 1]
    if (marker === 0xff) {
      i += 1 // padding byte between markers
      continue
    }
    if (JPEG_SOF_MARKERS.has(marker)) {
      const height = bytes.readUInt16BE(i + 5)
      const width = bytes.readUInt16BE(i + 7)
      return { width, height, format: 'jpeg' }
    }
    if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
      i += 2 // markers with no payload
      continue
    }
    const segmentLength = bytes.readUInt16BE(i + 2)
    if (segmentLength < 2) break // malformed, bail out
    i += 2 + segmentLength
  }
  return { format: 'jpeg', note: 'no SOF marker found before end of buffer' }
}

function isWebP(bytes) {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  )
}

function sniffWebP(bytes) {
  // RIFF header (12 bytes), then a chunk: fourCC(4) + chunkSize(4) + payload.
  if (bytes.length < 30) return { format: 'webp', note: 'truncated before chunk header' }
  const fourCC = bytes.toString('ascii', 12, 16)
  if (fourCC === 'VP8 ') {
    // Lossy: width/height are 14-bit little-endian values at fixed offsets within the frame tag.
    const width = bytes.readUInt16LE(26) & 0x3fff
    const height = bytes.readUInt16LE(28) & 0x3fff
    return { width, height, format: 'webp (lossy)' }
  }
  if (fourCC === 'VP8L') {
    // Lossless: first byte after chunk header is signature 0x2f, then 14-bit width-1, 14-bit height-1.
    const b0 = bytes[21]
    const b1 = bytes[22]
    const b2 = bytes[23]
    const b3 = bytes[24]
    const width = (1 + (((b1 & 0x3f) << 8) | b0))
    const height = (1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)))
    return { width, height, format: 'webp (lossless)' }
  }
  if (fourCC === 'VP8X') {
    // Extended: 24-bit width-1 and height-1, little-endian, at offsets 24 and 27.
    const width = 1 + (bytes[24] | (bytes[25] << 8) | (bytes[26] << 16))
    const height = 1 + (bytes[27] | (bytes[28] << 8) | (bytes[29] << 16))
    return { width, height, format: 'webp (extended)' }
  }
  return { format: 'webp', note: `unrecognized WebP chunk "${fourCC}"` }
}
