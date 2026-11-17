#!/usr/bin/env node
// Downloads a Poly Haven glTF (separate .gltf + .bin + texture files) and packs it into a single
// self-contained .glb (binary chunk = original .bin + all referenced images appended, images
// re-pointed at bufferViews instead of external uri). Built-in https/fs/buffer only, no new deps.
// Copied verbatim from ../physics-fields/pack-polyhaven-glb.mjs (wave 1) for this wave's own
// sourcing directory -- logic unchanged.
//
// Usage: node pack-polyhaven-glb.mjs <slug> <resolution e.g. 2k> <outFile.glb>
import https from "node:https";
import fs from "node:fs";
import path from "node:path";

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          fetchBuffer(res.headers.location).then(resolve, reject);
          return;
        }
        if (res.statusCode !== 200) {
          reject(new Error(`GET ${url} -> ${res.statusCode}`));
          return;
        }
        const chunks = [];
        res.on("data", (c) => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
      })
      .on("error", reject);
  });
}

function align4(n) {
  return (n + 3) & ~3;
}

async function main() {
  const [slug, res, outFile] = process.argv.slice(2);
  if (!slug || !res || !outFile) {
    console.error("Usage: node pack-polyhaven-glb.mjs <slug> <resolution> <outFile.glb>");
    process.exit(1);
  }
  const baseUrl = `https://dl.polyhaven.org/file/ph-assets/Models/gltf/${res}/${slug}/`;
  // Poly Haven serves texture images from a sibling "jpg"/"png" directory, not from
  // <gltf-dir>/textures/ despite the gltf file's relative "textures/<name>" URIs.
  const texBaseUrl = `https://dl.polyhaven.org/file/ph-assets/Models/jpg/${res}/${slug}/`;
  const gltfUrl = `${baseUrl}${slug}_${res}.gltf`;
  console.error("Fetching", gltfUrl);
  const gltfBuf = await fetchBuffer(gltfUrl);
  const gltf = JSON.parse(gltfBuf.toString("utf8"));

  if (!gltf.buffers || gltf.buffers.length !== 1 || !gltf.buffers[0].uri) {
    throw new Error("Expected exactly one external buffer with a uri");
  }
  const binUrl = baseUrl + gltf.buffers[0].uri;
  console.error("Fetching", binUrl);
  let combined = await fetchBuffer(binUrl);
  const bufferViews = gltf.bufferViews || [];

  const images = gltf.images || [];
  const bvCacheByFileName = new Map(); // dedupe: several image entries can share one source file
  for (const img of images) {
    if (!img.uri) continue; // already embedded
    const fileName = img.uri.split("/").pop();
    if (bvCacheByFileName.has(fileName)) {
      img.bufferView = bvCacheByFileName.get(fileName);
      if (!img.mimeType) {
        img.mimeType = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
      }
      delete img.uri;
      continue;
    }
    const imgUrl = texBaseUrl + fileName;
    console.error("Fetching", imgUrl);
    const imgBuf = await fetchBuffer(imgUrl);
    // pad current combined buffer to 4-byte boundary before appending
    const pad = align4(combined.length) - combined.length;
    if (pad > 0) combined = Buffer.concat([combined, Buffer.alloc(pad)]);
    const byteOffset = combined.length;
    combined = Buffer.concat([combined, imgBuf]);
    const bvIndex = bufferViews.length;
    bufferViews.push({ buffer: 0, byteOffset, byteLength: imgBuf.length });
    img.bufferView = bvIndex;
    if (!img.mimeType) {
      img.mimeType = fileName.toLowerCase().endsWith(".png") ? "image/png" : "image/jpeg";
    }
    delete img.uri;
    bvCacheByFileName.set(fileName, bvIndex);
  }

  gltf.bufferViews = bufferViews;
  gltf.buffers = [{ byteLength: combined.length }];

  const jsonStr = JSON.stringify(gltf);
  let jsonBuf = Buffer.from(jsonStr, "utf8");
  const jsonPad = align4(jsonBuf.length) - jsonBuf.length;
  if (jsonPad > 0) {
    jsonBuf = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]); // pad with spaces
  }

  let binPad = align4(combined.length) - combined.length;
  let binChunkData = combined;
  if (binPad > 0) {
    binChunkData = Buffer.concat([combined, Buffer.alloc(binPad, 0x00)]);
  }

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // magic 'glTF'
  header.writeUInt32LE(2, 4); // version
  const totalLength = 12 + 8 + jsonBuf.length + 8 + binChunkData.length;
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonBuf.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(binChunkData.length, 0);
  binChunkHeader.writeUInt32LE(0x004e4942, 4); // 'BIN\0'

  const glb = Buffer.concat([header, jsonChunkHeader, jsonBuf, binChunkHeader, binChunkData]);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, glb);
  console.error("Wrote", outFile, glb.length, "bytes");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
