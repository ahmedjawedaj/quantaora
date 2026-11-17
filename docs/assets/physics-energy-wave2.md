# Physics — Energy Systems Apparatus Asset Sourcing (Wave 2)

Agent: PHYSICS-ENERGY-WAVE2. Scope (as assigned): search for **turbines/generators, heat
apparatus (thermometers, heating elements, burners), engines, insulation/conduction demonstration
objects, and energy-transfer equipment (solar panels, batteries, circuits/wires as physical
objects)**. Dynamic heat/energy-flow arrows and other flow visualizations stay procedural
(Three.js) per the brief — only the physical apparatus itself was sourced here.

This is a read-only-to-the-rest-of-the-repo sourcing pass: nothing in `quantaora-app/src/**` was
touched, and nothing here is wired into `modelRegistry.ts` or any route. Sourcing only.

## 0. Ground truth and duplicate-coverage check (read before the tables below)

`content/taxonomy/physics.json`: the `energy` branch (`"detailed": true`) currently names only
Kinetic energy / Potential energy / Work / Power / Conservation of energy / Efficiency as
low-level items — **turbines, generators, solar panels, and batteries are not yet named anywhere
in that branch's transcribed content**. `heat-and-thermodynamics` is `"detailed": false` — named
only in the spec, no low-level items or interactive components transcribed yet, no
`content/subjects/physics/heat-and-thermodynamics/` directory exists. Per the project's content
rule, **no content is invented here for either gap** — this wave only sources apparatus ahead of
that content work and flags the mismatch explicitly (see §5 "Scope note" at the end).

Duplicate-coverage check against existing `quantaora-app/public/models/sourced/` directories,
done before any download in this wave:

- **`physics-fields/`** (wave 1, Electricity/Magnetism/Optics/Waves) already sourced
  `wire-cable-set.glb` (CC0, Poly Haven `modular_electric_cables`) for the Electricity branch's
  Wire need, and already flagged **Battery (AA/cell)** as an open gap in
  `docs/assets/physics-fields.md` §5 brief #1. This wave does **not** re-download wire/cable
  assets, and treats the Battery gap as the same open gap (not a second, separate one) — see §4
  below, which cross-references rather than duplicating.
- **`chemistry-reactions/`** (a different wave) already sourced `bunsen-burner.glb` (CC0, Poly
  Haven `bunsen_burner`) and it is wired into `ChemicalReactionsLab.tsx` as a heat-source prop.
  The task brief's "burners" heat-apparatus category is therefore **already satisfied** by an
  existing asset — this wave does not re-source a burner.
- **`physics-mechanics/`** (wave 1, Mechanics/Energy) found **zero** downloadable assets (every
  license-qualifying candidate was Sketchfab, auth-blocked) and left only a validator script in
  its directory. No overlap with this wave's turbine/generator/heat/insulation/energy-transfer
  scope.

No existing `physics-energy` directory existed before this wave; `physics-energy-wave2/` is new.

## 1. Category mapping

| Requested category | Best-fit taxonomy hook | Status |
| --- | --- | --- |
| Turbines / generators | `energy` branch (not yet a named low-level item) | **Sourced (generator)** — `generator.glb`. No qualifying turbine found on any CC0 source (see §3). |
| Heat apparatus — heating elements | `heat-and-thermodynamics` (not detailed) | **Sourced** — `electric-stove.glb` (visible coil burners = heating elements) |
| Heat apparatus — burners | `heat-and-thermodynamics` (not detailed) | **Already covered** — `chemistry-reactions/bunsen-burner.glb` (different wave, cross-referenced above, not re-sourced) |
| Heat apparatus — thermometers | `heat-and-thermodynamics` (not detailed) | Gap — Sketchfab candidates found, download-blocked (see §2/§4) |
| Heat apparatus — furnace/heater (bonus, not explicitly named in the brief but a natural sibling) | `heat-and-thermodynamics` (not detailed) | **Sourced (bonus)** — `masonry-heater.glb` |
| Engines | `energy` / `heat-and-thermodynamics` boundary (heat engines) | Gap — strong Sketchfab candidates found (incl. a Watt steam-engine model), download-blocked (see §2/§4) |
| Insulation / conduction demonstration objects | `heat-and-thermodynamics` (not detailed) | **Sourced** — `insulated-flask.glb` (vacuum-insulated thermos) |
| Energy-transfer equipment — solar panels | `energy` (not yet a named low-level item) | Gap — Sketchfab candidates found, download-blocked; NASA spacecraft-mounted panels rejected for abstraction mismatch (see §2/§3) |
| Energy-transfer equipment — batteries | `electricity` (named low-level item) + `energy` | Gap — **same open gap already logged in `docs/assets/physics-fields.md` §5 brief #1**; additional Sketchfab candidates found here, still download-blocked (see §2/§4) |
| Energy-transfer equipment — circuits/wires as physical objects | `electricity` (named low-level item) | **Already covered** — `physics-fields/wire-cable-set.glb` (different wave, cross-referenced above, not re-sourced) |
| Energy-transfer measurement (bonus, adjacent to the brief) | `energy` (Power/Efficiency) | **Sourced (bonus)** — `multimeter.glb` |

## 2. Candidate comparison table

Every candidate evaluated, not just winners. Poly Haven license/redistribution is site-wide CC0
(verified previously in wave 1 and re-confirmed by checking each asset's own `/info/<slug>` API
response in this wave — same per-file check discipline `docs/ASSET-LICENSES.md` requires, since a
license register entry is per-file, not per-source). Sketchfab license/downloadability was
verified via the public read endpoints (`api.sketchfab.com/v3/search`, no auth required to
*search or read metadata*) and the actual download gate was independently re-confirmed in this
wave (see §4 "Sketchfab access").

| Candidate | Source | License (as read from source) | Downloadable w/o auth? | Decision |
| --- | --- | --- | --- | --- |
| `portable_generator` | Poly Haven (polyhaven.com/a/portable_generator), James Ray Cock | CC0 1.0 | Yes (public Files API) | **Accept** → `generator.glb` |
| `modified_thermos` | Poly Haven (polyhaven.com/a/modified_thermos), Alex Weber | CC0 1.0 | Yes | **Accept** → `insulated-flask.glb` |
| `scandinavian_masonry_heater` | Poly Haven (polyhaven.com/a/scandinavian_masonry_heater), Kuutti Siitonen | CC0 1.0 | Yes | **Accept (bonus, architecture-scale)** → `masonry-heater.glb` |
| `electric_stove` | Poly Haven (polyhaven.com/a/electric_stove), Kuutti Siitonen | CC0 1.0 | Yes | **Accept** → `electric-stove.glb` |
| `retro_multimeter` | Poly Haven (polyhaven.com/a/retro_multimeter), elli moeller | CC0 1.0 | Yes | **Accept (bonus, outside the 4 requested categories)** → `multimeter.glb` |
| `barrel_stove` | Poly Haven (polyhaven.com/a/barrel_stove), MP | CC0 1.0 | Yes | Reject — a grungy urban night fire-barrel prop, not a controlled classroom heat-apparatus; same aesthetic-mismatch reasoning wave 1 used to reject `boombox`/`ornate_mirror_01` |
| `circuit_board` | Poly Haven (already evaluated by wave 1 `physics-fields`) | CC0 1.0 | Yes | Not re-evaluated here — already Rejected in `docs/assets/physics-fields.md` §2/§3 (doesn't map to one component) |
| Full Poly Haven 521-model catalog | Poly Haven `/assets?type=models` | CC0 site-wide | Direct CDN, no auth | Keyword-scanned for turbine/generator/engine/motor/solar/panel/battery/thermomet/heat/burn/insulat/conduct/wind/windmill/dynamo/piston/steam/boiler/furnace/radiator/coil — **no solar panel, battery, thermometer, turbine, windmill, or bare-engine model exists in the catalog.** Every real hit is listed above; everything else scanned was decorative/unrelated (vases, chandeliers, furniture, etc.) |
| "Wind Turbine" (5 variants, best: `f6e2e03d…`, 2,274 faces) | Sketchfab, various users (ShivanshSingh, davidju, skettch, iedalton, darkfrei) | CC Attribution / CC Attribution-ShareAlike | **No — Sketchfab download endpoint requires OAuth** (re-confirmed in this wave: `GET /v3/models/{uid}/download` → `401 {"detail":"Authentication credentials were not provided."}`, no anonymous path) | Blocked, not downloaded — see §4 |
| "QE2 Starboard High Pressure Turbine Pattern" (`8e135c1a…`) | Sketchfab, ScottishMaritimeMuseum | **CC0 Public Domain** | No (same auth gate) | Blocked, not downloaded. Best-licensed turbine-adjacent find (true CC0), but it is a foundry wooden casting *pattern* for a turbine part, not a turbine itself — lower priority even if unblocked |
| "Turbine Generator" (`705002a2…`), "Turbine Dynamo" (`9516f301…`), "Factory Generator/Turbine" (`82a1e486…`), "hydro generator turbine" (`198952bd…`) | Sketchfab, various | CC Attribution | No (same auth gate) | Blocked, not downloaded — see §4 |
| "Low poly generator" (`146a0eac…`, 1,640 faces) | Sketchfab, creosine | CC Attribution | No (same auth gate) | Blocked, not downloaded; lightest-weight generator alternative if this wave's `portable_generator` needs a lower-poly sibling later |
| "Solar Panel" (best: `be81ba18…`, 46 faces; also `8f094196…`, `83483a66…`) | Sketchfab, various | CC Attribution | No (same auth gate) | Blocked, not downloaded — see §4. Solar panel remains a hard gap otherwise (nothing on Poly Haven, nothing appropriately-scaled on NASA — see next row) |
| Spacecraft with visible solar arrays (Hinode/Solar-B, Parker Solar Probe, Solar Dynamics Observatory, InSight Cruise Lander, STEREO, SOHO) | [NASA 3D Resources](https://github.com/nasa/NASA-3D-Resources) | Public domain ("free and without copyright") | Yes, direct GitHub raw/API access, no auth | **Reject for abstraction mismatch** — every NASA hit is a complete spacecraft with solar arrays as one part of a much larger assembly, not an isolated rooftop/lab solar panel. Would read as "here is a satellite," not "here is a solar panel," to a kid; wrong level of abstraction for a photovoltaic-energy-conversion lesson. Also outside the `space` branch's existing asset set, which already uses several of these craft for their intended purpose |
| "AA Battery" (5+ variants, best: `d3e533bb…` 3,040 faces, `2a3d0e9d…` 2,492 faces), "AA Batteries" (`6e22bb9e…`), "18650 Battery — Rechargeable Li-Ion Cells" (`251370a5…`) | Sketchfab, various (HusarL, AspectStudio, berzerkey, sinnervoncrawsz) | CC Attribution | No (same auth gate) | Blocked, not downloaded. Same underlying gap already logged in `docs/assets/physics-fields.md` §5 brief #1 — not a new gap, just additional candidates for whichever future wave gets Sketchfab access |
| "Car Battery" (best: `5b609365…`, 1,778 faces) | Sketchfab, amt16 | CC Attribution | No (same auth gate) | Blocked, not downloaded; heavier/older-tech alternative to AA cell for a "how a battery works" lesson (visible terminals) |
| "Thermometer" (`5ef4251b…`, 2,996 faces), "Thermometer — Termometer — Medical Devices" (`b2365fe1…`) | Sketchfab, scootsmalone / adriansaputraz | CC Attribution | No (same auth gate) | Blocked, not downloaded — see §4 |
| "Barometer-thermometer amp" (`f58fa7f6…`) | Sketchfab, ahmagh2e | CC Attribution | No (same auth gate) | Blocked, not downloaded; combo instrument, thermometer is only part of the mesh |
| "Model of the Watt Steam Engine with animation" (`36e57c23…`) | Sketchfab, WirtualneMuzeaMalopolski | CC Attribution | No (same auth gate) | Blocked, not downloaded. **Best pedagogical find of this wave** — the actual historic Watt engine is the canonical heat-engine teaching object (thermal energy → mechanical work). 124,023 faces / 82.5MB glb — would need heavy decimation even if unblocked |
| "Steam Engine" (`dc1797a6…`, 38,506 faces, 2.3MB glb) | Sketchfab, robmcrosby | CC Attribution | No (same auth gate) | Blocked, not downloaded; much lighter alternative to the Watt engine model above if a simpler mesh is preferred |
| "Internal Combustion Engine" (`0be463c1…`), "Internal Combustion Engine Moto" (`ebd1dab5…`) | Sketchfab, tflexcad | **CC Attribution-NonCommercial** | No (same auth gate) | Reject regardless of the auth gate — NC license, not usable per `docs/ASSET-LICENSES.md` NC-RISK policy |
| "Motor de combustión" (`ff66d428…`, 4,029 faces) | Sketchfab, simondg | CC Attribution | No (same auth gate) | Blocked, not downloaded; lightweight commercial-clear combustion-engine candidate |
| "Rigged 4-Cylinder Engine (FREE)" (`e14ebe68…`) | Sketchfab, david.gnzlv | CC Attribution | No (same auth gate) | Blocked, not downloaded |
| "Electric Motor" (4 variants by Scarecrow_original, best `f1234b63…` 14,511 faces), "Electric Motor" (`19d028eb…`, `a45e46a4…`, `2204cb42…`, `fd762aca…`) | Sketchfab, various | CC Attribution | No (same auth gate) | Blocked, not downloaded — see §4. Electric motor is the mechanical-energy-out sibling of the generator (electrical-energy-out) already sourced |
| "KTX 3 electric heating element" and 5 more `termagroup`-branded heating-element models | Sketchfab, termagroup | CC Attribution | No (same auth gate) | Blocked, not downloaded; already have `electric-stove.glb` for this category from Poly Haven, so these are backup candidates only, not a live gap |
| "Electric water heater" (`83c1c571…`, `7e20f192…`) | Sketchfab, 1-3D.com | CC Attribution-ShareAlike | No (same auth gate) | Blocked, not downloaded; not pursued further, category already filled |
| "18650 Battery", "Sci-Fi Batteries", "Sci Fi Power Cell", "Stylized Energy Cell" | Sketchfab, various | CC Attribution | No (same auth gate) | Blocked, not downloaded; stylised sci-fi battery props, lower priority than the plain "AA Battery" hits above for a real-world-apparatus teaching bar |
| "voltaic cell", "insulation demonstration", "conduction demonstration", "styrofoam insulation", "immersion heater" | Sketchfab (targeted searches) | — | — | **Reject — zero results found for any of these five searches.** No historic voltaic-pile/trough-cell model and no purpose-built "insulation demo" or "conduction demo" apparatus exists on Sketchfab under any phrasing tried |
| Quaternius sci-fi packs (`scifiessentialskit`, `ultimatemodularscifi`, `modularscifimegakit`) | quaternius.com | CC0 (site-wide) | Whole-pack download only (Google Drive/itch.io, same gated-bundle pattern as the Ultimate Nature Pack already in the register) | **Not pursued** — pack landing pages list no individual per-asset filenames (only a single preview collage image), so there is no way to confirm a specific solar-panel/battery/generator/reactor prop exists inside without downloading and unpacking the full multi-hundred-MB kit; not a good use of this wave's budget on a low-confidence lead |
| Kenney.nl asset search (`solar`, `generator`, `battery`, `turbine`, `thermometer`) | kenney.nl | CC0 (site-wide) | N/A | **Not pursued** — the site's asset search/listing is client-side-rendered (JS), so a plain HTTP fetch returns no enumerable results; Kenney's house style (flat-shaded toy-blocky low-poly) is also a weaker fit for the Anatomy Atelier clean-3D bar than Poly Haven's photoreal PBR props, so this was deprioritized rather than pursued via a browser tool |
| Smithsonian Open Access 3D (3d.si.edu) | si.edu | CC0 where marked (per `docs/ASSET-LICENSES.md`) | **Blocked at the network level** — every request (`3d.si.edu`, its search API) returned Cloudflare `403 Sorry, you have been blocked` in this environment, both for direct page loads and API calls | **Not evaluated** — cannot reach the source at all from this sourcing session, not a licensing rejection |

## 3. Rejection reasons (summary)

- **`barrel_stove`** — grungy/urban/night fire-barrel aesthetic, not a controlled classroom heat
  apparatus; same reasoning wave 1 used for `boombox` and `ornate_mirror_01`.
- **NASA spacecraft with solar arrays** (Hinode, Parker Solar Probe, SDO, InSight, STEREO, SOHO)
  — real, correctly-licensed, and downloadable without auth, but every one is "a satellite that
  happens to have solar panels," not an isolated solar-panel teaching object. Using one would
  teach the wrong shape/concept and would also step on the `space` branch's existing use of some
  of these same craft.
- **Internal Combustion Engine / Internal Combustion Engine Moto (tflexcad)** — Sketchfab lists
  these as **CC Attribution-NonCommercial**, which is an NC-RISK license per
  `docs/ASSET-LICENSES.md` and therefore rejected independent of the download-auth gate.
- **All Sketchfab candidates (30+ total across turbine/generator/solar/battery/thermometer/
  engine/motor/heating-element categories)** — every one requires an authenticated Sketchfab
  account to actually fetch the model file. Re-confirmed directly in this wave:
  `GET https://api.sketchfab.com/v3/models/{uid}/download` returns
  `401 {"detail":"Authentication credentials were not provided."}` for every uid tried, with no
  anonymous fallback — identical to the gate wave 1 (`physics-fields`, `physics-mechanics`)
  already documented. No Sketchfab credentials are available in this environment. These are
  recorded as strong candidates (license verified, subject verified, face counts noted) for a
  future wave with an authenticated Sketchfab session — see §4.
- **"voltaic cell" / "insulation demonstration" / "conduction demonstration" / "styrofoam
  insulation" / "immersion heater"** — genuinely zero search results on Sketchfab under any of
  these phrasings; not a licensing rejection, just nothing exists under that description.
- **Quaternius sci-fi packs** — not rejected on license (CC0 site-wide) but not pursued: pack
  pages don't expose individual asset filenames, so confirming a specific solar-panel/battery/
  generator prop exists would require downloading a full multi-hundred-MB gated bundle on
  speculation. Flagged as a possible future lead, not evaluated further here.
- **Kenney.nl** — not rejected on license (CC0 site-wide) but not pursued: the asset browser is
  client-rendered JS, unreachable via plain HTTP fetch in this sourcing pass, and the house style
  (flat-shaded toy-blocky) is a weaker aesthetic fit than Poly Haven's photoreal props anyway.
- **Smithsonian 3D (3d.si.edu)** — not a licensing rejection; the domain returned a Cloudflare
  bot-block (`403`) on every request attempted from this environment, so it could not be searched
  at all in this pass.

## 4. Downloaded files

All five in `quantaora-app/public/models/sourced/physics-energy-wave2/`, each with a
`.license.json` sidecar recording source, licence, attribution, redistribution status, size,
sha256, and structural-validation counts, matching the sidecar shape used in `physics-fields/`.

| File | Category | Size | Approx. dimensions (m) | sha256 (first 16 hex) |
| --- | --- | --- | --- | --- |
| `generator.glb` | Turbine/generator apparatus | 9.32 MB | 0.82 x 0.59 x 0.56 | `7bbd1f9bb9e699e4` |
| `insulated-flask.glb` | Insulation/conduction demo object | 6.82 MB | 0.14 x 0.31 x 0.10 | `554c245a06c26831` |
| `masonry-heater.glb` | Heat apparatus (furnace/heater, bonus) | 7.70 MB | 1.17 x 2.36 x 1.34 | `5b5b88c44c66d893` |
| `electric-stove.glb` | Heat apparatus (heating elements) | 5.87 MB | 0.72 x 0.88 x 0.61 | `83914cc759584e87` |
| `multimeter.glb` | Energy-transfer measurement (bonus) | 4.04 MB | 0.22 x 0.23 x 0.23 | `fdbdc531b0e4a658` |

All five were Poly Haven glTF (separate `.gltf` + `.bin` + JPG textures, CC0, downloaded through
the public unauthenticated Poly Haven Files API), repacked into single self-contained `.glb`
files by `quantaora-app/public/models/sourced/physics-energy-wave2/pack-polyhaven-glb.mjs` — a
byte-for-byte copy of the wave-1 `physics-fields/pack-polyhaven-glb.mjs` script (Node built-ins
only, no new dependency): downloads the `.gltf` + `.bin` + referenced textures, deduplicates
repeated image references, appends image bytes into the binary buffer as new `bufferView`
entries, and writes a standard two-chunk GLB. Container-only change; no mesh/material data
altered. All five used Poly Haven's 2k texture maps (largest file 9.32 MB, well under the 15 MB
per-asset guideline used in wave 1).

Every file was structurally validated with
`quantaora-app/public/models/sourced/physics-energy-wave2/validate-glb.mjs` (a copy of the wave-1
validator: GLB magic header, JSON+BIN chunk parse, scene/node/mesh/material/texture/image/
animation/accessor counts, declared-length vs. actual-file-size match) plus the same extra
bounds/magic-byte pass wave 1 used (every `bufferView` inside the buffer's bounds; every embedded
image's bytes start with a valid JPEG/PNG magic header at its declared offset). **All five passed
every check.** None were opened in an actual 3D viewer/renderer in this pass — every
`.license.json`'s `notes` field explicitly states `render-review-pending`; nothing here is
self-certified as visually PASSing.

### Sketchfab access

Same conclusion as both wave-1 docs: **Sketchfab account access is the single highest-leverage
fix for this branch's remaining gaps.** Turbine, solar panel, AA/car battery, thermometer, bare
engine (including a real Watt steam-engine model), and electric-motor candidates are all already
identified with verified CC-BY (or, for one turbine-pattern find, true CC0) licenses and correct
subjects — they are blocked purely on Sketchfab's OAuth download gate, not on availability or
licensing. Re-confirmed directly in this wave via `GET /v3/models/{uid}/download` → `401`.

## 5. Unresolved gaps — commissioned-model briefs

For gaps with no downloadable candidate anywhere (not even an auth-blocked one), or where the
best candidate has a real quality/fit problem independent of the auth gate, here is what a
commissioned/authored model would need. Gaps that already have a good Sketchfab candidate
waiting on account access are not re-briefed here — see §2/§4 instead; commissioning would be
wasted effort if that candidate becomes available first.

1. **Solar panel (Energy-transfer equipment)** — A single flat photovoltaic module: dark-blue/
   black grid-textured panel face, aluminum frame, junction box on the back, optionally a simple
   tilt-stand or roof-mount bracket. This is the one category where even the auth-blocked
   Sketchfab candidates are all fairly generic assets (low differentiation), so a purpose-built
   commission may actually beat waiting for Sketchfab access — geometry is simple (one thin box +
   frame edges), most of the teaching value is in the grid-pattern material showing individual
   photovoltaic cells for a "See it" hotspot.

2. **Wind turbine or steam turbine (Turbines/generators)** — No Poly Haven match and no true-CC0
   Sketchfab match (the one CC0 hit, a foundry casting *pattern*, is the wrong object). If a
   simple three-blade horizontal-axis wind turbine on a tower is wanted for a "generator" partner
   piece (turbine mechanical input -> `generator.glb` electrical output, taught as a pair), this
   would be a clean, low-geometry commission: tower cylinder + nacelle box + 3 tapered blades.

3. **Thermometer (Heat apparatus)** — Classic glass-tube liquid thermometer with a visible red/
   mercury-look fluid column and printed temperature-scale markings, OR a simple analog dial
   thermometer. Very cheap commission (a thin glass capsule + a colored fluid material), high
   teaching value for the "See it" step of a temperature/heat lesson, and — unusually for this
   wave — genuinely has zero found candidates anywhere (Poly Haven: none; Sketchfab: found but
   auth-blocked; still worth commissioning in parallel since geometry cost is so low).

## Scope note (flagging, not authoring)

Per the project's content rule, this wave sourced apparatus for concepts (turbines, generators,
solar panels, batteries-as-teaching-objects, insulation demonstrations, heat-engine apparatus)
that are **not currently named as low-level items** in `content/taxonomy/physics.json`'s `energy`
branch, and for a `heat-and-thermodynamics` branch that is still `"detailed": false` (no
low-level items, no interactive components, no `content/subjects/` directory). No content was
invented to justify these assets — they are sourced ahead of that authoring work, exactly as the
task specified, and should be treated as pre-positioned raw material, not confirmation that this
content exists or has been scoped yet. Whoever details `heat-and-thermodynamics` next (or expands
`energy`'s low-level items to include real-world energy-conversion apparatus) should check this
directory and `docs/assets/physics-fields.md` §5 (Battery) first before commissioning anything
new.
