#!/usr/bin/env node
// Standalone glTF (separate .gltf + .bin + textures) -> single-file .glb packer.
// Built-in fs/path/buffer only, no new deps.
// Usage: node gltf-to-glb.mjs <input.gltf> <output.glb>
//
// Merges the external binary buffer and every externally-referenced image into
// one GLB binary chunk, so the result is a single portable file.
import fs from "node:fs";
import path from "node:path";

function align4(buf) {
  const pad = (4 - (buf.length % 4)) % 4;
  if (pad === 0) return buf;
  return Buffer.concat([buf, Buffer.alloc(pad, 0)]);
}

function mimeFor(file) {
  const ext = path.extname(file).toLowerCase();
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".png") return "image/png";
  return "application/octet-stream";
}

function pack(inputPath, outputPath) {
  const baseDir = path.dirname(inputPath);
  const gltf = JSON.parse(fs.readFileSync(inputPath, "utf8"));

  if (!Array.isArray(gltf.buffers) || gltf.buffers.length !== 1) {
    throw new Error("Expected exactly one buffer in source glTF");
  }

  const bufferUri = gltf.buffers[0].uri;
  if (!bufferUri || bufferUri.startsWith("data:")) {
    throw new Error("Expected an external buffer uri");
  }
  let binChunk = fs.readFileSync(path.join(baseDir, decodeURIComponent(bufferUri)));

  // Fold every external image into the binary chunk as a bufferView.
  if (Array.isArray(gltf.images)) {
    for (const img of gltf.images) {
      if (!img.uri || img.uri.startsWith("data:")) continue;
      const imgPath = path.join(baseDir, decodeURIComponent(img.uri));
      const imgBytes = fs.readFileSync(imgPath);
      const alignedBin = align4(binChunk);
      const byteOffset = alignedBin.length;
      binChunk = Buffer.concat([alignedBin, imgBytes]);

      gltf.bufferViews.push({
        buffer: 0,
        byteOffset,
        byteLength: imgBytes.length,
      });
      img.bufferView = gltf.bufferViews.length - 1;
      img.mimeType = mimeFor(imgPath);
      delete img.uri;
    }
  }

  binChunk = align4(binChunk);
  gltf.buffers[0] = { byteLength: binChunk.length };

  // JSON chunk padding must use spaces (0x20), not null bytes.
  const jsonRaw = Buffer.from(JSON.stringify(gltf), "utf8");
  const jsonPad = (4 - (jsonRaw.length % 4)) % 4;
  const jsonChunkData = Buffer.concat([jsonRaw, Buffer.alloc(jsonPad, 0x20)]);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonChunkData.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binChunk.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  const totalLength =
    12 + jsonChunkHeader.length + jsonChunkData.length + binChunkHeader.length + binChunk.length;

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // 'glTF'
  header.writeUInt32LE(2, 4); // version
  header.writeUInt32LE(totalLength, 8);

  const glb = Buffer.concat([
    header,
    jsonChunkHeader,
    jsonChunkData,
    binChunkHeader,
    binChunk,
  ]);

  fs.writeFileSync(outputPath, glb);
  return { outputPath, bytes: glb.length };
}

const [inputPath, outputPath] = process.argv.slice(2);
if (!inputPath || !outputPath) {
  console.error("Usage: node gltf-to-glb.mjs <input.gltf> <output.glb>");
  process.exit(1);
}
const result = pack(inputPath, outputPath);
console.log(`Wrote ${result.outputPath} (${result.bytes} bytes)`);
