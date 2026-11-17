# Space Asset Sourcing — Wave 1 (Agent SPACE)

Scope: audit the 5 existing `public/models/space/*.glb`, map them against
`content/taxonomy/space.json`, and source real, licensed, redistributable GLBs to fill gaps for
planets/moons/dwarf planets/asteroids/telescopes not yet represented. Inventory + sourcing +
validation only — no route/registry/`ASSET-LICENSES.md` wiring (that is a later wave).

Date sourced: 2026-08-18.

Ownership boundary for this file/run: `quantaora-app/public/models/sourced/space/**` and this
document. Nothing else was written to.

## 1. Audit of the 5 existing space GLBs

All 5 read from `quantaora-app/public/models/space/*.glb` (unchanged, read-only). Validated with
the same `validate-glb.mjs` inspector used for new downloads (see §3 in
`quantaora-app/public/models/sourced/space/validate-glb.mjs`).

| File | sha256 (truncated) | Size | Meshes/Materials/Textures | What it actually shows |
| --- | --- | --- | --- | --- |
| `bp-tauri.glb` | `368ec135…1902df` | 4.4 MB | 1 / 1 / 0 | BP Tauri — a young stellar object (T Tauri star), single vertex-colored point-cloud-style mesh, no UV texture. Represents the **young-star / protostar-ish** stage of the star lifecycle. |
| `cassiopeia-a-supernova.glb` | `a3a4230c…8e827c` | 8.1 MB | 1 / 1 / 0 | Cassiopeia A — volumetric point-cloud rendering of a **supernova remnant** (post-explosion debris shell), from Chandra/Spitzer data. |
| `cygnus-loop-supernova.glb` | `9a8ad574…4d7a5b` | 2.8 MB | 1 / 1 / 0 | Cygnus Loop — another **supernova remnant** shell, same rendering style. |
| `crab-nebula.glb` | `d9ea6d7f…6f15e07` | 2.1 MB | 1 / 1 / 0 | Crab Nebula — pulsar-wind **supernova remnant** (also cataloged as a nebula), same style. |
| `g292-supernova-remnant.glb` | `20973fca…08a4af2da` | 1.1 MB | 1 / 1 / 0 | G292.0+1.8 — another **supernova remnant** shell, same style. |

**Redundancy finding:** all 5 are the same NASA production family (Blender-exported, untextured,
vertex-colored volumetric point clouds, generator `Khronos glTF Blender I/O`). **4 of the 5 are
functionally the same content category — supernova remnant shells** (Cassiopeia A, Cygnus Loop,
Crab Nebula, G292.0+1.8). They differ in which real object they depict, which is legitimate
diversity for a "supernova remnant" gallery, but they do **not** cover the rest of the star
lifecycle (protostar-proper, main-sequence star, red giant, white dwarf, neutron star, black hole)
and none of them are a planet, moon, or galaxy — despite "space" needing all of those per the
taxonomy. BP Tauri is the only non-remnant, and it only covers "young star," not full
main-sequence. See §6 for the resulting star-lifecycle gap.

None of the 5 existing files were touched, re-saved, or re-sourced.

## 2. Branch/component mapping table

Source of truth: `content/taxonomy/space.json`. Only `solar-system`, `stars`, `galaxies`, and
`earth-in-space` are `"detailed": true`; the rest are named-only and are flagged, not authored.

| Branch (`detailed`) | Component/need | Status before this wave | Status after this wave |
| --- | --- | --- | --- |
| solar-system (true) | Sun | existing texture only (`textures/planets/sun.jpg`, CC BY 4.0) | unchanged — no gap identified (procedural glow/corona is appropriate for a star's active photosphere; see §6) |
| solar-system (true) | Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune (8 planets) | texture-only spheres (`textures/planets/*.jpg`) | **sourced** — real NASA relief-shaded GLBs for all 8, see §5 |
| solar-system (true) | Pluto, Ceres (dwarf planets) | none | **sourced** — real GLBs, see §5 |
| solar-system (true) | Eris, Haumea, Makemake (dwarf planets) | none | **gap** — no NASA authored 3D model found (see §6) |
| solar-system (true) | Moon, Phobos, Deimos, Europa, Ganymede, Callisto, Io, Titan, Enceladus, Triton (10 moons) | `textures/planets/moon.jpg` only for Earth's Moon; nothing for the other 9 | **sourced** — real GLBs for all 10, see §5. Phobos/Deimos are the highest-value wins here: irregular potato-shaped bodies where a textured sphere would be actively wrong. |
| solar-system (true) | mars.lowLevelItems: "Rover missions" | none | **sourced** — Perseverance rover GLB, see §5 |
| solar-system (true) | Asteroid belt / Kuiper belt / Oort cloud / Meteoroids (otherObjects) | none | **gap, recommend procedural** — these are populations of thousands of small bodies; a particle/instancing system is the right tool (matches the quality bar's own carve-out for orbital/field/particle abstractions), not a single hero mesh. Individual specimens are covered below. |
| solar-system (true) | Comets (otherObjects) | none | **unresolved gap** — see §6 (67P candidate found, license unverified) |
| solar-system (true) | Rings (otherObjects) | none | **sourced incidentally** — the new `saturn.glb` validates as 3 meshes / 2 materials, i.e. ring geometry is present as a separate mesh from the planet body, not baked into one sphere. |
| solar-system (true) | Asteroid belt specimen | none | **sourced** — Bennu, Vesta GLBs (real irregular shape models), see §5 |
| stars (true) | Protostar / young star | `bp-tauri.glb` (existing) | unchanged, adequate |
| stars (true) | Main-sequence star | none (sun texture only) | **gap** — see §6 |
| stars (true) | Red giant | none | **gap** — see §6 |
| stars (true) | White dwarf | none | **gap** — see §6 |
| stars (true) | Neutron star | none | **gap** — see §6 |
| stars (true) | Supernova (the explosion/remnant) | 4 existing remnant GLBs | unchanged, adequate (arguably over-served relative to other stages) |
| stars (true) | Black hole | none | **gap** — see §6 |
| galaxies (true) | Milky Way / spiral / elliptical / irregular galaxy / star cluster / galactic center | none | **unresolved gap** — no qualifying public-domain authored mesh found, see §6 |
| galaxies (true) | Nebula | `crab-nebula.glb` (dual-cataloged as remnant+nebula, existing) | unchanged, partially adequate |
| earth-in-space (true) | Axis/rotation/revolution/tilt, day-night, seasons, moon phases, eclipses, tides | `earth.glb` + `moon-earth.glb` (both new, real relief geometry) + existing textures | **sourced** — real Earth/Moon geometry now available to back these processes; the processes themselves (rotation, tilt, phase cycle) remain procedural/simulated, which is correct per the quality bar (dynamic mechanics stay procedural, only the body itself needed authored geometry) |
| gravity-and-orbits (false) | — | not authored | flagged only; gravity/orbit visualization is inherently a procedural simulator (orbital paths), no asset gap to source |
| moons (false, but its members are covered under solar-system) | — | see solar-system row above | covered |
| asteroids-and-comets (false) | — | not authored | flagged; Bennu/Vesta specimens sourced anyway since they also serve the detailed `solar-system.otherObjects` list; comet remains a gap |
| space-exploration (false) | — | not authored | flagged; Perseverance rover + Hubble/JWST/Chandra telescopes sourced anyway as reusable "instrument" content once this branch is authored |
| cosmology-foundations (false) | — | not authored | flagged only, no asset sourced (undefined scope — would need SME breakdown first) |
| telescopes-and-observation (false) | — | not authored | flagged; **sourced anyway** per explicit scope instruction — Hubble, JWST, Chandra X-ray Observatory GLBs, see §5 |

## 3. Candidate comparison table

Every candidate evaluated, not just accepted ones.

| Candidate | Source | License | Redistribution | Verdict | Reason |
| --- | --- | --- | --- | --- | --- |
| Mercury/Venus/Earth/Mars/Jupiter/Saturn/Uranus/Neptune/Pluto/Ceres 3D models | `assets.science.nasa.gov` (science.nasa.gov resource pages) | Public domain, U.S. Government work | Direct `.glb` download, no auth gate | **Accepted** | Real relief-shaded planetary bodies (VTAD-produced), not bare spheres; matches existing register's treatment of other NASA `science.nasa.gov`/`nasa3d.arc.nasa.gov` assets as CLEAR/public domain |
| Moon (Earth), Phobos, Deimos, Europa, Ganymede, Callisto, Io, Titan, Enceladus, Triton 3D models | `assets.science.nasa.gov` + `svs.gsfc.nasa.gov` (Moon) | Public domain, U.S. Government work | Direct `.glb` download | **Accepted** | Real shape-model/topography geometry; Phobos/Deimos especially — irregular bodies where sphere+texture would misrepresent the object |
| Bennu, Vesta 3D models | `assets.science.nasa.gov` | Public domain, U.S. Government work | Direct `.glb` download | **Accepted** | Real irregular asteroid shape models |
| `1999 RQ36 asteroid.glb` (= Bennu, provisional designation) | `github.com/nasa/NASA-3D-Resources` | Public domain | Direct download in-repo | **Evaluated, not downloaded** | Same real-world object as the accepted `bennu.glb` (different render/style). Kept out to avoid a literal duplicate of content; noted for the future integration wave as an alternate style if needed. |
| Hubble Space Telescope (A), James Webb Space Telescope (A), Chandra X-ray Observatory 3D models | `github.com/nasa/NASA-3D-Resources` | Public domain ("free and without copyright") | Direct download in-repo | **Accepted** | Iconic, instantly recognizable observation instruments; explicit scope ask for "telescopes/space observation instruments" |
| Spitzer Space Telescope, Nancy Grace Roman Space Telescope (A), Cassini-Huygens (A) | `github.com/nasa/NASA-3D-Resources` | Public domain | Direct download in-repo | **Evaluated, not downloaded** | Real, license-clean candidates confirmed available (sizes: Spitzer 251KB, Roman 2.67MB, Cassini 1.66MB) but excluded to keep this wave's telescope set to 3 flagship instruments (optical/IR/X-ray) rather than importing every spacecraft in the repo. Good next-wave candidates if `telescopes-and-observation` gets authored. |
| Mars 2020 Perseverance Rover | `github.com/nasa/NASA-3D-Resources` | Public domain | Direct download in-repo | **Accepted** | Serves `content/taxonomy/space.json` → `components.mars.lowLevelItems: "Rover missions"` directly |
| Curiosity Rover (MSL) | `github.com/nasa/NASA-3D-Resources` | Public domain | Only `.blend` + `.png` published, **no `.glb`** | **Rejected** | No redistributable pre-built GLB in the repo for this one (Clean/Dirty variants are Blender source files only); would need a Blender export step, out of scope for a sourcing-only wave |
| Comet 67P/Churyumov-Gerasimenko shape model | `sci.esa.int` (ESA Rosetta OSIRIS team) | ESA — not stated as CC0/CC-BY on the page fetched | `.obj`/`.wrl` only, not `.glb` | **Rejected (unresolved)** | Per this wave's own known-traps guidance, ESA is not uniformly public domain and needs a per-asset license check; the page text did not confirm redistribution rights, and the format would need conversion. Flagged as a commissioned/future-clearance candidate, not downloaded. |
| Halley's Comet (Giotto/Vega Stooke Model 1) | Referenced via `3d-asteroids.space` aggregator | Unclear/aggregator-sourced | Unverified | **Rejected** | `3d-asteroids.space` is a third-party aggregator of mission shape models with no clear license statement of its own — same "unverifiable provenance" trap category as Thingiverse/Free3D in `docs/ASSET-LICENSES.md` |
| Milky Way Galaxy — multiple listings (saurabh.buradkar7, per.rb1, Sohan Bose, samuel2016, Epicfaceball, etc.) | Sketchfab (non-NASA user uploads) | Mixed/unclear per-listing; several are "Buy Royalty Free" store items | Some marked free-download, license terms not verified as CC0/CC-BY per the scope's Sketchfab bar | **Rejected (all)** | None confirmed as the verified official NASA Sketchfab account; scope requires "downloadable file and a redistribution-permitting license (CC0/CC-BY), with provenance recorded" — none of these listings met that bar on inspection from search results alone, and none is an authoritative scientific visualization of the Milky Way (mostly stylized/hobbyist renders) |
| Spiral/elliptical/irregular galaxy generic models | Sketchfab (various), general web search | Mixed/unclear | Unverified | **Rejected (all)** | Same reasoning as Milky Way — no verified NASA/ESA/Smithsonian source found with a clear open license during this wave's search |
| Ganymede via `science.nasa.gov/3d-resources/jupiter-callisto/` | `science.nasa.gov` | Public domain | JPG/TIFF texture only, mislabeled in search snippet | **Rejected (not applicable)** | This URL is actually a Callisto *texture* page (JPG/TIFF), not a Ganymede 3D model; the real Ganymede model was found at the correct `ganymede-3d-model` resource page and is the one accepted above |
| Red giant / white dwarf / neutron star / black hole authored models | NASA 3D Resources, NASA Science, Smithsonian 3D (searched) | — | — | **Not found** | No authored mesh models exist for these under any qualifying source; these are near-universally represented by NASA as videos/renders/illustrations, not downloadable meshes. See commissioned-model brief in §6. |

## 4. Rejection reasons (summary)

- **Curiosity Rover (MSL):** no pre-built `.glb` published in the source repo, only Blender source
  files — outside a sourcing-only wave's scope to export ourselves.
- **Comet 67P (ESA):** license not confirmed as redistribution-permitting on the page fetched;
  ESA is explicitly called out as non-uniformly public domain in this wave's brief. Needs a
  human/legal check of ESA's specific licence type before it can be imported, and a format
  conversion (`.obj`/`.wrl` → `.glb`) besides.
  Reference: [sci.esa.int shape model of comet 67P/C-G](https://sci.esa.int/web/rosetta/-/54728-shape-model-of-comet-67p).
- **Halley's Comet / any `3d-asteroids.space` listing:** third-party aggregator, not a primary
  NASA/ESA/Smithsonian source, no clear license of its own — same category as the
  Thingiverse/Free3D/TurboSquid-free traps already documented in `docs/ASSET-LICENSES.md`.
- **All Sketchfab galaxy listings found:** none verified as the official NASA Sketchfab account;
  none had a confirmed CC0/CC-BY redistribution-permitting license visible from the listing; most
  are stylized hobbyist renders, not scientifically representative — reject per the "Sketchfab
  allowed only if..." bar in the wave brief.
- **Red giant / white dwarf / neutron star / black hole:** not rejected for licensing reasons —
  simply not found as authored downloadable meshes anywhere searched. Not fabricated as
  placeholders per instructions; see commissioned brief instead.
- **`1999 RQ36 asteroid.glb` (GitHub):** not rejected on license grounds (it's clean public
  domain) — excluded only to avoid shipping two different renders of the literal same asteroid
  (Bennu) in one wave. Recorded as a viable alternate for later style/quality comparison.

## 5. Downloaded files

All at `quantaora-app/public/models/sourced/space/` (new directory, this wave). Each `.glb` has a
sidecar `<name>.license.json` with `sourceUrl`, `creator`, `license`, `attributionRequired`,
`redistributionStatus`, `dateSourced`, `fileSizeBytes`, `sha256`, and the glTF structural
validation counts (scene/node/mesh/material/texture/image/animation/accessor counts, generator,
approx bounding-box dimensions). Also included: `validate-glb.mjs` (the reusable inspector — magic
header + JSON-chunk parse, built-in `fs`/`crypto` only) and `generate-sidecars.mjs` (the script
that produced all 26 sidecars from a provenance table + the inspector output).

| File | Category | Size | Notes |
| --- | --- | --- | --- |
| `mercury.glb` | Planet | 2.91 MB | |
| `venus.glb` | Planet | 0.29 MB | |
| `earth.glb` | Planet | 12.32 MB | |
| `mars.glb` | Planet | 3.85 MB | |
| `jupiter.glb` | Planet | 10.95 MB | |
| `saturn.glb` | Planet | 5.22 MB | 3 meshes / 2 materials — includes separate ring geometry |
| `uranus.glb` | Planet | 0.16 MB | |
| `neptune.glb` | Planet | 0.56 MB | |
| `pluto.glb` | Dwarf planet | 6.68 MB | |
| `ceres.glb` | Dwarf planet | 9.09 MB | |
| `moon-earth.glb` | Moon | 13.16 MB | LRO topography-derived height map, "Small" variant chosen to fit the 15MB guideline (full-res variants run 81–313MB) |
| `phobos.glb` | Moon (Mars) | 3.68 MB | Irregular shape model |
| `deimos.glb` | Moon (Mars) | 1.53 MB | Irregular shape model |
| `europa.glb` | Moon (Jupiter) | 11.72 MB | |
| `ganymede.glb` | Moon (Jupiter) | 3.89 MB | |
| `callisto.glb` | Moon (Jupiter) | 4.25 MB | |
| `io.glb` | Moon (Jupiter) | 16.67 MB | Slightly over the 15MB guideline; kept, single clean mesh, no cheaper NASA variant found |
| `titan.glb` | Moon (Saturn) | 0.65 MB | |
| `enceladus.glb` | Moon (Saturn) | 17.10 MB | Over the 15MB guideline; kept, only NASA-authored Enceladus body available |
| `triton.glb` | Moon (Neptune) | 6.55 MB | |
| `bennu.glb` | Asteroid | 0.84 MB | |
| `vesta.glb` | Asteroid | 4.84 MB | |
| `hubble-telescope.glb` | Instrument | 1.62 MB | |
| `jwst-telescope.glb` | Instrument | 4.49 MB | 1600 nodes / 46 materials — detailed structural CAD-style model |
| `chandra-xray-observatory.glb` | Instrument | 0.95 MB | |
| `perseverance-rover.glb` | Spacecraft | 4.76 MB | Serves Mars component's "Rover missions" |

Total new payload: ~157 MB across 26 GLBs + 26 sidecars + the 2 helper scripts, all confined to
`public/models/sourced/space/`.

**Duplicate check:** sha256-compared all 26 new files against each other and against the 5
existing `public/models/space/*.glb` files — **zero hash collisions**, confirming no accidental
re-downloads and no literal duplication with the existing supernova/young-star set.

## 6. Unresolved gaps — commissioned-model briefs

### Star lifecycle stages (main-sequence, red giant, white dwarf, neutron star, black hole)

No authored downloadable mesh exists at any qualifying source (NASA 3D Resources, NASA Science,
Smithsonian 3D) for these five stages. NASA typically represents them as illustrations/animations,
not meshes, because they are physically simple bodies (spheres, or a sphere + accretion disk/jets)
whose *visual* interest is almost entirely in shading/color/physics rather than surface geometry.

Brief if commissioned:
- **Main-sequence star:** sphere with granulated/turbulent surface displacement (subtle, procedural
  noise is likely sufficient and defensible — a plain sphere reads as "the Sun" once textured, so
  this may not need bespoke geometry at all; recommend deciding via prototype before commissioning).
- **Red giant:** larger, redder sphere, optionally with a wispier/less-defined limb (convection
  cell mottling) to read as "puffy" rather than solid.
- **White dwarf:** small, extremely bright/dense-reading sphere with a tight, hot-white color
  ramp; scale contrast against a red-giant or main-sequence body in the same scene sells the concept
  more than geometry does.
- **Neutron star:** small sphere with polar jet cones and (optionally) a faint magnetic-field-line
  overlay — jets/field lines are exactly the kind of "inherently dynamic abstraction" the quality
  bar says can stay procedural; the star body itself is a trivial sphere.
- **Black hole:** accretion disk (torus mesh) + photon-ring shader + event-horizon sphere. This is
  the one stage where bespoke geometry (the disk) meaningfully beats a placeholder, since a plain
  sphere communicates nothing about a black hole. Reference imagery: EHT M87*/Sgr A* images (public
  domain, NSF/EHT Collaboration) for disk proportions and lensing appearance.

### Galaxies (Milky Way, spiral, elliptical, irregular, star cluster, galactic center)

No qualifying open-license authored mesh found. Two viable paths, either is legitimate for this
content type:
1. **Commission an authored low-poly/stylized galaxy disk model** (spiral arm sprite/instancing
   base mesh) matching the Anatomy Atelier warm-off-white, hotspot-driven language.
2. **Build it procedurally** — a particle-system spiral/elliptical/irregular galaxy generator is
   arguably the *correct* tool here (matches the quality bar's own carve-out for particle
   effects), since galaxies are literally star-particle distributions at the scale being depicted,
   unlike a planet or moon which is a single solid body.
Recommend prototyping the procedural route first before commissioning a mesh; if a static "hero"
galaxy image/model is still wanted for a card view, NASA/ESA Hubble press-release Milky Way
illustrations (public domain) are good reference imagery for a commission brief.

### Comet nucleus

Real shape models exist (67P via ESA/Rosetta OSIRIS team, Halley via Giotto/Vega) but neither
cleared this wave's license bar (§4). Next step is a direct license inquiry to ESA's Rosetta team
(page: https://sci.esa.int/web/rosetta/-/54728-shape-model-of-comet-67p) or sourcing an equivalent
public-domain comet shape model if one turns up from a NASA mission (e.g., Deep Impact/EPOXI's
Tempel 1 or Hartley 2 imagery — not checked this wave, worth a follow-up search). If no license
clears, a commissioned low-poly "rubble pile" nucleus mesh with a procedural tail/coma is a
reasonable fallback — the coma/tail motion is inherently dynamic and should stay procedural
regardless.

### Eris, Haumea, Makemake (dwarf planets)

No NASA authored 3D model found for these three (Pluto and Ceres were the only dwarf planets with
dedicated `science.nasa.gov` resource pages found). These are small, distant, poorly-imaged bodies
— real relief data may not exist at all yet from any mission. Recommend a textured-sphere fallback
(matching the existing texture-only approach already accepted for the 8 main planets before this
wave) rather than commissioning invented surface detail that isn't scientifically grounded.

### Telescopes/observation branch, space-exploration branch, cosmology-foundations branch

All three remain `"detailed": false` in the taxonomy — content authoring cannot proceed on them
without an SME-sourced breakdown first, per the existing taxonomy status note. Assets were sourced
anyway for `telescopes-and-observation` (Hubble/JWST/Chandra) and `space-exploration`
(Perseverance rover) per the explicit scope instruction, so the assets are ready whenever those
branches get authored. `cosmology-foundations` has no defined component list yet, so nothing was
sourced for it — flagging only.

## 7. Validation methodology

`quantaora-app/public/models/sourced/space/validate-glb.mjs` (built-in `fs`/`crypto` only, no new
deps) checks: GLB magic header (`0x676C5446`), declared vs. actual file length, JSON-chunk
parseability, and reports scene/node/mesh/material/texture/image/animation/accessor counts plus an
approximate bounding box derived from `POSITION` accessor `min`/`max` where available. All 26 new
downloads plus the 5 existing files validated cleanly (`magicOk: true`, `valid: true`,
`lengthMatchesFile: true`) — see the sidecar `validation` blocks for per-file detail, or re-run
`node validate-glb.mjs <files...>` for raw output.
