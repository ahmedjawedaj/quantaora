#!/usr/bin/env node
// Standalone GLB validator/inspector for the chemistry-structure asset wave.
// Built-in fs/crypto only, no new deps. Same approach as sourced/space/validate-glb.mjs.
// Usage: node validate-glb.mjs <path-to-glb> [more paths...]
import fs from "node:fs";
import crypto from "node:crypto";

function inspect(filePath) {
  const buf = fs.readFileSync(filePath);
  const size = buf.length;
  const sha256 = crypto.createHash("sha256").update(buf).digest("hex");

  const result = { file: filePath, fileSizeBytes: size, sha256 };

  if (buf.length < 12) {
    result.valid = false;
    result.error = "File too small to contain GLB header";
    return result;
  }

  const magic = buf.readUInt32LE(0);
  const isGlb = magic === 0x46546c67; // 'glTF' little-endian
  result.magicOk = isGlb;

  if (!isGlb) {
    result.valid = false;
    result.error = `Bad magic header: 0x${magic.toString(16)} (expected 0x676c5446 'glTF')`;
    return result;
  }

  const version = buf.readUInt32LE(4);
  const totalLength = buf.readUInt32LE(8);
  result.glbVersion = version;
  result.declaredLength = totalLength;
  result.lengthMatchesFile = totalLength === size;

  let offset = 12;
  let json = null;
  try {
    const chunkLength = buf.readUInt32LE(offset);
    const chunkType = buf.readUInt32LE(offset + 4);
    const JSON_CHUNK = 0x4e4f534a; // 'JSON'
    if (chunkType !== JSON_CHUNK) {
      result.valid = false;
      result.error = `First chunk type 0x${chunkType.toString(16)} is not JSON`;
      return result;
    }
    const jsonBytes = buf.slice(offset + 8, offset + 8 + chunkLength);
    json = JSON.parse(jsonBytes.toString("utf8"));
  } catch (e) {
    result.valid = false;
    result.error = `Failed to parse JSON chunk: ${e.message}`;
    return result;
  }

  result.valid = true;
  result.sceneCount = Array.isArray(json.scenes) ? json.scenes.length : 0;
  result.nodeCount = Array.isArray(json.nodes) ? json.nodes.length : 0;
  result.meshCount = Array.isArray(json.meshes) ? json.meshes.length : 0;
  result.materialCount = Array.isArray(json.materials) ? json.materials.length : 0;
  result.textureCount = Array.isArray(json.textures) ? json.textures.length : 0;
  result.imageCount = Array.isArray(json.images) ? json.images.length : 0;
  result.animationCount = Array.isArray(json.animations) ? json.animations.length : 0;
  result.accessorCount = Array.isArray(json.accessors) ? json.accessors.length : 0;
  result.generator = json.asset && json.asset.generator ? json.asset.generator : null;
  result.gltfVersion = json.asset && json.asset.version ? json.asset.version : null;

  let bbox = null;
  if (Array.isArray(json.accessors)) {
    for (const acc of json.accessors) {
      if (acc.type === "VEC3" && Array.isArray(acc.min) && Array.isArray(acc.max)) {
        if (!bbox) {
          bbox = { min: [...acc.min], max: [...acc.max] };
        } else {
          for (let i = 0; i < 3; i++) {
            bbox.min[i] = Math.min(bbox.min[i], acc.min[i]);
            bbox.max[i] = Math.max(bbox.max[i], acc.max[i]);
          }
        }
      }
    }
  }
  if (bbox) {
    result.approxBoundingBox = bbox;
    result.approxDimensions = [
      +(bbox.max[0] - bbox.min[0]).toFixed(4),
      +(bbox.max[1] - bbox.min[1]).toFixed(4),
      +(bbox.max[2] - bbox.min[2]).toFixed(4),
    ];
  } else {
    result.approxBoundingBox = null;
    result.note = "No POSITION accessor min/max found; bounding box unavailable";
  }

  return result;
}

const paths = process.argv.slice(2);
if (paths.length === 0) {
  console.error("Usage: node validate-glb.mjs <path-to-glb> [more paths...]");
  process.exit(1);
}

const results = paths.map(inspect);
console.log(JSON.stringify(results, null, 2));
