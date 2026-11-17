#!/usr/bin/env node
// Kenney's per-model GLB exports (Factory Kit, GLB format/) reference one shared external texture
// ("Textures/colormap.png") by relative uri instead of embedding it, since the pack ships one
// colormap.png alongside many small per-model .glb files on disk. That is valid glTF but not a
// single self-contained .glb, and glTF-Validator flags external image uris on the fly here as an
// IO_ERROR. This script embeds that one shared PNG into each target .glb as a new bufferView,
// producing a fully self-contained single-file .glb. Built-in fs only, no new dependency.
// Mirrors the append-image-as-bufferView approach in pack-polyhaven-glb.mjs (same directory).
//
// Usage: node embed-kenney-texture.mjs <colormap.png> <in.glb> <out.glb>
import fs from "node:fs";

function align4(n) {
  return (n + 3) & ~3;
}

const [pngPath, inGlb, outGlb] = process.argv.slice(2);
if (!pngPath || !inGlb || !outGlb) {
  console.error("Usage: node embed-kenney-texture.mjs <colormap.png> <in.glb> <out.glb>");
  process.exit(1);
}

const buf = fs.readFileSync(inGlb);
if (buf.readUInt32LE(0) !== 0x46546c67) throw new Error("Not a GLB (bad magic)");
const jsonChunkLen = buf.readUInt32LE(12);
const json = JSON.parse(buf.slice(20, 20 + jsonChunkLen).toString("utf8"));
let offset = 20 + jsonChunkLen;

let binChunk = Buffer.alloc(0);
if (offset < buf.length) {
  const binLen = buf.readUInt32LE(offset);
  const binType = buf.readUInt32LE(offset + 4);
  if (binType === 0x004e4942) {
    binChunk = buf.slice(offset + 8, offset + 8 + binLen);
  }
}

const png = fs.readFileSync(pngPath);
const pad = align4(binChunk.length) - binChunk.length;
const padded = pad > 0 ? Buffer.concat([binChunk, Buffer.alloc(pad)]) : binChunk;
const byteOffset = padded.length;
const combined = Buffer.concat([padded, png]);

const bufferViews = json.bufferViews || [];
const bvIndex = bufferViews.length;
bufferViews.push({ buffer: 0, byteOffset, byteLength: png.length });
json.bufferViews = bufferViews;
json.buffers = [{ byteLength: combined.length }];

for (const img of json.images || []) {
  if (img.uri) {
    img.bufferView = bvIndex;
    img.mimeType = "image/png";
    delete img.uri;
  }
}

const jsonStr = JSON.stringify(json);
let jsonBuf = Buffer.from(jsonStr, "utf8");
const jsonPad = align4(jsonBuf.length) - jsonBuf.length;
if (jsonPad > 0) jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);

let binChunkData = combined;
const binPad = align4(combined.length) - combined.length;
if (binPad > 0) binChunkData = Buffer.concat([combined, Buffer.alloc(binPad, 0x00)]);

const header = Buffer.alloc(12);
header.writeUInt32LE(0x46546c67, 0);
header.writeUInt32LE(2, 4);
const totalLength = 12 + 8 + jsonBuf.length + 8 + binChunkData.length;
header.writeUInt32LE(totalLength, 8);

const jsonChunkHeader = Buffer.alloc(8);
jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4);

const binChunkHeader = Buffer.alloc(8);
binChunkHeader.writeUInt32LE(binChunkData.length, 0);
binChunkHeader.writeUInt32LE(0x004e4942, 4);

const glb = Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, binChunkData]);
fs.writeFileSync(outGlb, glb);
console.error("Wrote", outGlb, glb.length, "bytes");
