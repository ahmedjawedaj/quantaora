#!/usr/bin/env node
// Generates <name>.license.json sidecars next to each downloaded GLB using the
// validate-glb.mjs inspection output plus per-file provenance metadata below.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const DATE_SOURCED = "2026-08-18";

// Provenance metadata for every accepted download in this directory.
const META = {
  "mercury.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/m/Mercury_1_4878.glb",
    resourcePage: "https://science.nasa.gov/resource/mercury-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "venus.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/v/Venus_1_12103.glb",
    resourcePage: "https://science.nasa.gov/resource/venus-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "earth.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Earth_1_12756.glb",
    resourcePage: "https://science.nasa.gov/resource/earth-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "mars.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24881_Mars_1_6792.glb",
    resourcePage: "https://science.nasa.gov/resource/planet-mars-3d-model/",
    creator: "NASA/JPL-Caltech",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "jupiter.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/j/Jupiter_1_142984.glb",
    resourcePage: "https://science.nasa.gov/resource/jupiter-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "saturn.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/s/Saturn_1_120536.glb",
    resourcePage: "https://science.nasa.gov/resource/saturn-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
    notes: "3 meshes / 2 materials confirmed by validator — includes ring geometry separate from the planet body, not a bare sphere.",
  },
  "uranus.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/u/Uranus_1_51118.glb",
    resourcePage: "https://science.nasa.gov/resource/uranus-3d-model",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "neptune.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/n/Neptune_1_49528.glb",
    resourcePage: "https://science.nasa.gov/resource/neptune-3d-model",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "pluto.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/p/l/Pluto_1_2374.glb",
    resourcePage: "https://science.nasa.gov/resource/pluto-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "ceres.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/c/Ceres_1_1000.glb",
    resourcePage: "https://science.nasa.gov/resource/ceres-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "moon-earth.glb": {
    sourceUrl: "https://svs.gsfc.nasa.gov/vis/a010000/a014900/a014959/moon_small.glb",
    resourcePage: "https://svs.gsfc.nasa.gov/14959/",
    creator: "NASA Goddard Space Flight Center (Dan Gallagher; data: Ernie Wright); data source Lunar Reconnaissance Orbiter (LRO)",
    license: "Public domain (U.S. Government work, NASA Scientific Visualization Studio)",
    notes: "Real LRO-derived topography (height-map displaced mesh), not a bare textured sphere. 'Small' color+height variant chosen to stay near the 15MB hero-asset budget.",
  },
  "phobos.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24878_Phobos_1_1000.glb",
    resourcePage: "https://science.nasa.gov/resource/phobos-mars-moon-3d-model/",
    creator: "NASA/JPL-Caltech",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
    notes: "Irregular potato-shaped body from real shape-model data — the case where authored geometry matters most vs. a sphere placeholder.",
  },
  "deimos.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/mars/resources/gltf_files/24879_Deimos_1_1000.glb",
    resourcePage: "https://science.nasa.gov/resource/deimos-mars-moon-3d-model/",
    creator: "NASA/JPL-Caltech",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
    notes: "Irregular body from real shape-model data.",
  },
  "europa.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Europa_1_3138.glb",
    resourcePage: "https://science.nasa.gov/resource/europa-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "ganymede.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/g/Ganymede_1_5268.glb",
    resourcePage: "https://science.nasa.gov/resource/ganymede-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "callisto.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/c/Callisto_1_4821.glb",
    resourcePage: "https://science.nasa.gov/resource/callisto-3d-model",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "io.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/i/Io_1_3643.glb",
    resourcePage: "https://science.nasa.gov/resource/io-3d-model",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "titan.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Titan_1_5150.glb",
    resourcePage: "https://science.nasa.gov/resource/titan-3d-model",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "enceladus.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/e/Enceladus_1_504.glb",
    resourcePage: "https://science.nasa.gov/resource/enceladus-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
    notes: "17.9MB — over the 15MB hero-asset guideline; kept because it is the only NASA authored Enceladus body and file is otherwise clean single-mesh geometry. Candidate for re-export/decimation in a later wave.",
  },
  "triton.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/t/Triton_1_2707.glb",
    resourcePage: "https://science.nasa.gov/resource/triton-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "bennu.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/b/Bennu_1_1.glb",
    resourcePage: "https://science.nasa.gov/resource/bennu-3d-model/",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
    notes: "Same real-world body as 'BP Tauri'-adjacent NASA-3D-Resources '1999 RQ36 asteroid.glb' (provisional designation for Bennu) already catalogued on GitHub — different render, same object. Chose this VTAD version for stylistic consistency with the other planet/moon downloads in this batch; the GitHub version was not also downloaded to avoid a literal duplicate.",
  },
  "vesta.glb": {
    sourceUrl: "https://assets.science.nasa.gov/content/dam/science/psd/solar/2023/09/v/Vesta_1_100.glb",
    resourcePage: "https://science.nasa.gov/resource/vesta-3d-model",
    creator: "NASA Visualization Technology Applications and Development (VTAD)",
    license: "Public domain (U.S. Government work, science.nasa.gov / NASA media usage guidelines)",
  },
  "hubble-telescope.glb": {
    sourceUrl: "https://github.com/nasa/NASA-3D-Resources/blob/master/3D%20Models/Hubble%20Space%20Telescope%20(A)/Hubble%20Space%20Telescope%20(A).glb",
    resourcePage: "https://github.com/nasa/NASA-3D-Resources",
    creator: "NASA",
    license: "Public domain (\"free and without copyright\") — NASA 3D Resources repository",
  },
  "jwst-telescope.glb": {
    sourceUrl: "https://github.com/nasa/NASA-3D-Resources/blob/master/3D%20Models/James%20Webb%20Space%20Telescope%20(A)/James%20Webb%20Space%20Telescope%20(A).glb",
    resourcePage: "https://github.com/nasa/NASA-3D-Resources",
    creator: "NASA",
    license: "Public domain (\"free and without copyright\") — NASA 3D Resources repository",
    notes: "1600 nodes / 46 materials — detailed engineering-style CAD model of the observatory structure (mirror segments, sunshield, instrument bus).",
  },
  "chandra-xray-observatory.glb": {
    sourceUrl: "https://github.com/nasa/NASA-3D-Resources/blob/master/3D%20Models/Chandra%20X-ray%20Observatory/Chandra%20X-ray%20Observatory.glb",
    resourcePage: "https://github.com/nasa/NASA-3D-Resources",
    creator: "NASA",
    license: "Public domain (\"free and without copyright\") — NASA 3D Resources repository",
  },
  "perseverance-rover.glb": {
    sourceUrl: "https://github.com/nasa/NASA-3D-Resources/blob/master/3D%20Models/Mars%202020%20Perseverance%20Rover/Mars%202020%20Perseverance%20Rover.glb",
    resourcePage: "https://github.com/nasa/NASA-3D-Resources",
    creator: "NASA",
    license: "Public domain (\"free and without copyright\") — NASA 3D Resources repository",
    notes: "Serves the Mars component's 'Rover missions' low-level item (content/taxonomy/space.json components.mars.lowLevelItems).",
  },
};

function inspect(filePath) {
  const out = execFileSync("node", [path.join(DIR, "validate-glb.mjs"), filePath], {
    maxBuffer: 1024 * 1024 * 50,
  });
  return JSON.parse(out.toString())[0];
}

let count = 0;
for (const [file, meta] of Object.entries(META)) {
  const full = path.join(DIR, file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING FILE: ${file}`);
    continue;
  }
  const v = inspect(full);
  const sidecar = {
    sourceUrl: meta.sourceUrl,
    resourcePage: meta.resourcePage,
    creator: meta.creator,
    license: meta.license,
    attributionRequired: {
      required: false,
      text: "Not legally required (public domain / U.S. Government work). Crediting NASA in an in-app credits line is good practice and matches the style already used for the 5 existing public/models/space/*.glb entries.",
    },
    redistributionStatus: "Permitted — public domain U.S. Government work, explicitly free for reuse without copyright restriction per NASA media usage guidelines / NASA-3D-Resources repository terms.",
    dateSourced: DATE_SOURCED,
    fileSizeBytes: v.fileSizeBytes,
    sha256: v.sha256,
    validation: {
      magicOk: v.magicOk,
      glbVersion: v.glbVersion,
      lengthMatchesFile: v.lengthMatchesFile,
      sceneCount: v.sceneCount,
      nodeCount: v.nodeCount,
      meshCount: v.meshCount,
      materialCount: v.materialCount,
      textureCount: v.textureCount,
      imageCount: v.imageCount,
      animationCount: v.animationCount,
      accessorCount: v.accessorCount,
      generator: v.generator,
      gltfVersion: v.gltfVersion,
      approxDimensions: v.approxDimensions,
    },
  };
  if (meta.notes) sidecar.notes = meta.notes;

  const sidecarPath = full.replace(/\.glb$/, ".license.json");
  fs.writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");
  count++;
  console.log(`Wrote ${path.basename(sidecarPath)}`);
}
console.log(`Done. ${count} sidecars written.`);
