# Wave 25 — Space Subject Audit (Planets / Moons / Stars / Galaxies / Telescopes)

Read-only, current-state audit. Dated 2026-08-18. All claims cross-referenced against the code
listed below, read directly for this audit — no completion percentages are copied from prior
audit docs. Where a prior doc is mentioned, it is explicitly labeled "prior audit claimed...".

Sources read: `quantaora-app/src/App.tsx`, `quantaora-app/src/data/hierarchy.ts`,
`quantaora-app/src/data/planets.ts`, `moons.ts`, `stars.ts`, `galaxies.ts`,
`quantaora-app/src/data/modelRegistry.ts`, `quantaora-app/src/routes/SpaceLab.tsx`,
`MoonsLab.tsx`, `StarsLab.tsx`, `GalaxyLab.tsx`, `BranchLab.tsx`, `Subjects.tsx`, `Labs.tsx`,
`content/taxonomy/space.json`, `content/subjects/space/**`, plus `public/models/sourced/space/*.glb`
and `public/models/space/planets/*.glb` on disk.

---

## 1. Route / CTA mapping

From `quantaora-app/src/App.tsx` lines 44, 53–55 (all nested under `/app`):

| Branch (space.json id) | Route path | Component | Data file | Live bodies |
|---|---|---|---|---|
| `solar-system` | `/app/labs/orbit` | `SpaceLab.tsx` | `src/data/planets.ts` | 11 (`sun, mercury, venus, earth, mars, jupiter, saturn, uranus, neptune, pluto, ceres`) |
| `stars` | `/app/labs/stars` | `StarsLab.tsx` | `src/data/stars.ts` | 8 (`protostar, main-sequence-star, red-giant, white-dwarf, crab-nebula, cassiopeia-a, cygnus-loop, g292`) |
| `galaxies` | `/app/labs/galaxies` | `GalaxyLab.tsx` | `src/data/galaxies.ts` | 7 (`milky-way, andromeda, whirlpool-galaxy, sombrero-galaxy, elliptical-galaxy, irregular-galaxy, globular-cluster`) |
| `moons` | `/app/labs/moons` | `MoonsLab.tsx` | `src/data/moons.ts` | 5 (`moon, europa, io, titan, enceladus`) |
| `gravity-and-orbits` | none | — | — | 0 |
| `asteroids-and-comets` | none | — | — | 0 |
| `space-exploration` | none | — | — | 0 |
| `cosmology-foundations` | none | — | — | 0 |
| `telescopes-and-observation` | none | — | — | 0 |
| `earth-in-space` | none (see §5) | — | — | 0 |

Every space route above is a **dedicated hand-built lab**, not the generic `BranchLab.tsx` fallback
(`/app/labs/branch/:branchId`, App.tsx line 60). Confirmed: `grep -rn "space" src/data/branchModules.ts`
returns zero matches — `branchModules.ts` (the data source `BranchLab.tsx` reads via `branchComponents()`)
has **no space entries at all**. So navigating directly to `/app/labs/branch/earth-in-space` or any
other non-live space branch id renders `BranchLab.tsx` with an empty component list — there is no
generic-fallback content standing in for any missing space branch.

`src/data/hierarchy.ts` lines 111–126 is the CTA gate: `Subjects.tsx` (lines 154/201) only renders a
clickable `<Link>` for a branch when `b.status === 'live' && b.route`; every other branch renders a
greyed-out `opacity-60` row with a `Clock` icon reading **"Coming soon"** (Subjects.tsx line 201).
`Labs.tsx` line 42 filters the same way for its lab grid. Result: the 6 non-live branches above are
each reachable only as a disabled "Coming soon" row — there is no way to open them from the UI.

**hierarchy.ts componentCount vs. actual live counts (verified by grep-counting each data file's
top-level `id:` entries) — three of four live branches are wrong:**

| Branch | `hierarchy.ts` `componentCount` | Actual count in data file |
|---|---|---|
| `solar-system` | 8 | **11** |
| `stars` | 7 | **8** |
| `galaxies` | 2 | **7** |
| `moons` | 5 | 5 (correct) |

---

## 2. Visual assets — GLB vs. procedural, per component

### 2a. Planets/Solar System (`SpaceLab.tsx`, 11 bodies) — `src/data/planets.ts`

| id | `model` field | Registry entry (`modelRegistry.ts`) | licenseStatus / qualityTier |
|---|---|---|---|
| sun | `''` (procedural sphere, `texture: /textures/planets/sun.jpg`) | not registered | — |
| mercury | `/models/sourced/space/mercury-optimized.glb` | line 786 | CLEAR / hero |
| venus | `/models/space/planets/venus.glb` | line 306 | CLEAR / hero |
| earth | `/models/space/planets/earth.glb` | line 294 | CLEAR / hero |
| mars | `/models/space/planets/mars.glb` | line 318 | CLEAR / hero |
| jupiter | `/models/space/planets/jupiter.glb` | line 330 | CLEAR / hero |
| saturn | `/models/space/planets/saturn.glb` | line 342 | CLEAR / hero |
| uranus | `/models/space/planets/uranus.glb` | line 354 | CLEAR / hero |
| neptune | `/models/space/planets/neptune.glb` | line 366 | CLEAR / hero |
| pluto | `/models/space/planets/pluto.glb` | line 378 | CLEAR / hero |
| ceres | `/models/space/planets/ceres.glb` | line 390 | CLEAR / hero |

10/11 real hero GLBs, all `licenseStatus: CLEAR`, public-domain NASA 3D Resources. Only the **Sun**
has no GLB and no registry entry — `PlanetModel.tsx` line 226 comment confirms a texture-mapped
procedural sphere is the fallback path used "when absent" (Sun, and previously Mercury before it
got sourced).

### 2b. Moons (`MoonsLab.tsx`, 5 bodies) — `src/data/moons.ts`

| id | `model` field | Registry entry | licenseStatus / qualityTier |
|---|---|---|---|
| moon | `/models/sourced/space/moon-earth-optimized.glb` | modelRegistry.ts:798 | CLEAR / hero |
| europa | `/models/sourced/space/europa-optimized.glb` | modelRegistry.ts:762 | CLEAR / hero |
| io | `/models/sourced/space/io-optimized.glb` | modelRegistry.ts:774 | CLEAR / hero |
| titan | `/models/sourced/space/titan-optimized.glb` | modelRegistry.ts:810 | CLEAR / hero |
| enceladus | `/models/sourced/space/enceladus-optimized.glb` | modelRegistry.ts:750 | CLEAR / hero |

5/5 real GLBs, all CLEAR/hero (`moons.ts` header comment, lines 3–8: "no procedural fallback exists
… for any of the five").

### 2c. Stars (`StarsLab.tsx`, 8 bodies) — `src/data/stars.ts`

| id | `modelType` | `model` field | Registry entry |
|---|---|---|---|
| protostar | glb | `/models/space/bp-tauri.glb` | modelRegistry.ts:210, CLEAR/hero |
| main-sequence-star | **procedural** | `''` | not registered (blackbody-color procedural sphere) |
| red-giant | **procedural** | `''` | not registered |
| white-dwarf | **procedural** | `''` | not registered |
| crab-nebula | glb | `/models/space/crab-nebula.glb` | modelRegistry.ts:258, CLEAR/hero |
| cassiopeia-a | glb | `/models/space/cassiopeia-a-supernova.glb` | modelRegistry.ts:222, CLEAR/hero |
| cygnus-loop | glb | `/models/space/cygnus-loop-supernova.glb` | modelRegistry.ts:234, CLEAR/hero |
| g292 | glb | `/models/space/g292-supernova-remnant.glb` | modelRegistry.ts:246, CLEAR/hero |

5/8 real GLB, 3/8 procedural — by design per the file's own header comment (lines 9–15): no
telescope can resolve the surface of a distant main-sequence/red-giant/white-dwarf star into
geometry, so those three are rendered from real blackbody-temperature physics instead.

### 2d. Galaxies (`GalaxyLab.tsx`, 7 bodies) — `src/data/galaxies.ts`

All 7 (`milky-way, andromeda, whirlpool-galaxy, sombrero-galaxy, elliptical-galaxy,
irregular-galaxy, globular-cluster`) have `model: ''` — **100% procedural**, by explicit design
(file header comment lines 1–13: "A galaxy is ~10^11 point lights… every entry here is authored as
PARAMETERS for a procedural particle system rather than as a path to a GLB file"). Zero galaxy GLBs
exist in `modelRegistry.ts` — this is not a gap, it is the documented approach.

---

## 3. Approved `space` assets in `modelRegistry.ts` NOT wired into any component

**None by URL.** Every one of the 19 `subject: 'space'` entries in `modelRegistry.ts` was checked by
grepping its exact `url` against `planets.ts`/`moons.ts`/`stars.ts`/`galaxies.ts` — all 19 resolve to
exactly one `model:` reference each (verified via shell loop, 1 hit per file, zero misses, zero
duplicates).

However, the `componentIds` metadata field inside `modelRegistry.ts` is **systematically
disconnected from the actual ids used at runtime**, which matters for anyone trusting that field
as documentation:

- `resolveAuthoredAsset()` (modelRegistry.ts lines 851–877) matches purely by `url` or basename —
  `componentIds` is never read by any resolution code. `grep -rn "componentIds" src` outside
  `modelRegistry.ts` returns only two hits, both in `BranchLab.test.ts` fixtures — nothing in the
  live app reads this field.
- Concretely wrong `componentIds` in the space section: `space-planet-earth` (registry) vs. `earth`
  (actual id in `planets.ts`); `space-moon-europa` vs. `europa`; `space-moon-moon` vs. `moon`; same
  pattern for every planet/moon entry. The three supernova-remnant GLBs
  (`cassiopeia-a-supernova.glb`, `cygnus-loop-supernova.glb`, `g292-supernova-remnant.glb`) all
  share the **identical** generic tag `componentIds: ['supernova-remnant']` even though they back
  three distinct star ids (`cassiopeia-a`, `cygnus-loop`, `g292`) — the tag can't distinguish them.
  `crab-nebula.glb` is tagged `['nebula']`, not `crab-nebula`. Only `bp-tauri.glb` →
  `['protostar']` actually matches its real id.

This is a documentation-accuracy gap, not a broken-wiring gap: URL-based resolution still works.

---

## 4. Visual reuse across distinct objects

**None found.** Every space GLB in `modelRegistry.ts` maps 1:1 to exactly one planet/moon/star id
(§3's grep). No planet mesh stands in for another planet, no moon mesh is reused across two moons,
and the three supernova-remnant GLBs are three physically distinct real NASA models (Cassiopeia A,
Cygnus Loop, G292.0+1.8) despite sharing a generic registry tag — not the same asset reused.

---

## 5. Missing components

### 5a. Whole branches with zero route ("Coming soon")

Per `hierarchy.ts` (§1 table): `gravity-and-orbits`, `asteroids-and-comets`, `space-exploration`,
`cosmology-foundations`, `telescopes-and-observation` are all `status: 'planned'`, no `route` — all
render as the disabled "Coming soon" row in `Subjects.tsx`. `earth-in-space` is
`status: 'authored-pending'` — same disabled treatment even though `content/taxonomy/space.json`
marks it `"detailed": true` with fully transcribed `lowLevelItems` (Axis, Rotation, Revolution,
Tilt, Equator, Hemisphere, Orbit), `processes` (Day and night, Seasons, Moon phases, Solar eclipse,
Lunar eclipse, Tides), and `interactiveComponents` (Seasons simulator, Moon phase wheel, Eclipse
alignment model, Tide cause/effect model) — spec-ready content with no lab built against it.

**Telescopes are the most concrete gap named in the audit brief**: `telescopes-and-observation` has
no taxonomy detail (`"detailed": false` in `space.json`), no route, no data file, and no lab — but
real, already-sourced telescope GLBs sit unused on disk (see §5b): `chandra-xray-observatory.glb`,
`hubble-telescope.glb`, `jwst-telescope.glb` in `public/models/sourced/space/`, zero references
anywhere in `src/`.

### 5b. Named objects in `space.json` with no live component, despite an already-sourced GLB sitting unused on disk

`content/taxonomy/space.json`'s `solar-system.moons` array (line 21) explicitly names 10 moons:
`Moon, Phobos, Deimos, Europa, Ganymede, Callisto, Io, Titan, Enceladus, Triton`. `moons.ts`
implements only **5 of the 10** (`Moon, Europa, Io, Titan, Enceladus`). The other 5 —
**Phobos, Deimos, Ganymede, Callisto, Triton** — are named in the spec taxonomy but have no
`MoonBody` entry, no route, and no `modelRegistry.ts` entry, yet real GLBs for every one of them
already exist on disk and are referenced nowhere in `src/` (confirmed via `grep -rln` per file,
zero hits each):

| File | Size | Named in space.json | Wired anywhere? |
|---|---|---|---|
| `public/models/sourced/space/phobos.glb` | 3.7M | Mars moon (also a Mars `lowLevelItems` entry) | No |
| `public/models/sourced/space/deimos.glb` | 1.5M | Mars moon (also a Mars `lowLevelItems` entry) | No |
| `public/models/sourced/space/ganymede.glb` | 3.9M | Jupiter moon (also a Jupiter `lowLevelItems` entry) | No |
| `public/models/sourced/space/callisto.glb` | 4.3M | Jupiter moon (also a Jupiter `lowLevelItems` entry) | No |
| `public/models/sourced/space/triton.glb` + `triton-optimized.glb` | 6.6M / 2.8M | Neptune moon | No |
| `public/models/sourced/space/bennu.glb` | 840K | Asteroid (`otherObjects: Asteroid belt`) | No |
| `public/models/sourced/space/vesta.glb` | 4.8M | Asteroid (`otherObjects: Asteroid belt`) | No |
| `public/models/sourced/space/chandra-xray-observatory.glb` | 976K | Telescope (branch has no taxonomy detail) | No |
| `public/models/sourced/space/hubble-telescope.glb` | 1.6M | Telescope | No |
| `public/models/sourced/space/jwst-telescope.glb` | 4.5M | Telescope | No |
| `public/models/sourced/space/perseverance-rover.glb` | 4.8M | Mars `lowLevelItems: "Rover missions"` | No |

None of these 12 files appear in `modelRegistry.ts` (`grep -n "bennu\|callisto\|chandra\|deimos\|ganymede\|hubble\|jwst\|perseverance\|phobos\|triton\|vesta" src/data/modelRegistry.ts` → zero
matches), so they are not even "approved-but-unused" registry entries — they are un-registered,
un-reviewed, un-wired assets sitting in `public/`. This is the single largest concrete finding of
this audit: five of the ten spec-named moons and all three space-relevant telescopes already have
sourced 3D geometry on disk with zero code-side integration.

### 5c. `otherObjects` from `space.json` with no component at all

`Asteroid belt, Kuiper belt, Oort cloud, Comets, Meteoroids, Rings` (space.json line 22) — none
have a dedicated id anywhere in `planets.ts`/`moons.ts`/`stars.ts`/`galaxies.ts`. `Rings` is
partially covered as a property of the Saturn planet model (registry note, modelRegistry.ts:351,
confirms real separate ring geometry), not as its own component. The rest map to the
`asteroids-and-comets` branch, which has no route (§5a) — though `bennu.glb`/`vesta.glb` above show
real asteroid assets already exist unused.

---

## 6. Quality / performance gaps verifiable from code

1. **Zero hotspots on every planet in the flagship Solar System branch.** `grep -n "hotspots:"
   src/data/planets.ts` shows all 11 bodies (Sun through Ceres) are wired to the single shared
   `emptyHotspots` constant (planets.ts line 23, `const emptyHotspots: PlanetBody['hotspots'] = []`)
   — a literal empty array. `OrbitSandbox.tsx` (the 3D scene SpaceLab renders) has zero hotspot
   rendering code (`grep -n "hotspot" src/components/explorer/OrbitSandbox.tsx` → no matches). This
   directly contradicts: (a) `space.json`'s own `interactiveComponents` list for solar-system, which
   names "Surface feature hotspots" as a required interactive component; (b) `space.json`'s
   `components.mars`/`components.jupiter` entries, which explicitly transcribe low-level surface
   features (Olympus Mons, Valles Marineris, Polar ice caps for Mars; Great Red Spot, gas-giant
   layers, magnetic field for Jupiter) that have nowhere to attach as hotspots today; (c) the
   project's spec-level Component-Level Learning Flow ("See it → **Touch it** →…") and the CLAUDE.md
   3D-asset quality bar ("hotspots mapped to concept IDs"). By contrast, Moons (`moons.ts`), Stars
   (`stars.ts`), and Galaxies (`galaxies.ts`) all author 4–6 real hotspots per body — the Solar
   System branch is the outlier. `content/subjects/space/solar-system/surface-feature-hotspots/`
   exists as authored spec content but is not consumed by any runtime code (confirmed: `content/` is
   never imported by `src/`, only referenced by codegen comments for other subjects — space has no
   `src/data/generated/*.ts` codegen output at all).

2. **Auto-rotate toggle: present in all 4 live space routes.** `SpaceLab.tsx` (`cameraAutoRotate`
   state, `CanvasControls` `onToggleAutoRotate`), `MoonsLab.tsx` (`autoRotate` state, same control),
   `StarsLab.tsx` and `GalaxyLab.tsx` both wire the same `CanvasControls` component — no gap here.

3. **`sun.jpg` texture is the largest planet texture at 822KB** (`public/textures/planets/sun.jpg`),
   and `moon.jpg` is the largest of any body's texture at **2.96MB** (`public/textures/planets/moon.jpg`)
   — but this texture is dead weight: `MoonsLab.tsx`/`moons.ts` render the Moon via the real GLB
   (`/models/sourced/space/moon-earth-optimized.glb`), not this JPG. The `texture` field in
   `planets.ts` is only consumed as the procedural-sphere fallback path in `PlanetModel.tsx` (used
   live only for the Sun, and historically for Mercury before it was sourced) — the other 9 planets'
   texture JPGs (up to 1.4MB for `earth.jpg`) are declared in `planets.ts` but never rendered, since
   every non-Sun planet has a real GLB and `PlanetModel.tsx`'s own comment (line 226-228) states the
   GLB's baked textures "carry the look — `texture` is not layered under it" once a GLB is present.

4. **Non-optimized duplicate GLBs still ship in `public/`.** `enceladus.glb` (17M) sits alongside
   the wired `enceladus-optimized.glb` (5.3M); same pattern for `europa.glb` (12M vs. 4.0M
   optimized), `io.glb` (17M vs. 5.7M optimized), `moon-earth.glb` (13M vs. 5.4M optimized),
   `mercury.glb` (2.9M vs. 3.1M "optimized" — actually a seam-blend fix, not smaller per
   modelRegistry.ts:795), `titan.glb` (672K vs. 564K optimized), `triton.glb` (6.6M vs. 2.8M
   optimized, though neither Triton file is wired at all — see §5b). The un-optimized originals are
   pure dead weight in the public build output (they are not imported by any route) but still ship
   in `public/` and therefore in any deploy that copies the whole `public/` directory verbatim.

5. **No LOD system anywhere in the space routes** — `grep`-checked; `PlanetModel.tsx`,
   `MoonModel`/`MoonViewer`, `StarViewer`, `GalaxyViewer` load a single fixed-resolution GLB or
   particle count per body with no distance-based level-of-detail swap. Not flagged as a defect per
   se (matches the rest of the app's pattern per `modelRegistry.ts`'s notes elsewhere), just noted
   as verifiably absent since the audit brief asks for it explicitly.

---

## Summary table

| Metric | Count |
|---|---|
| **Planets/dwarf planets** (SpaceLab, `/app/labs/orbit`) | 11 total — 10 real GLB (hero, CLEAR), 1 procedural-only (Sun) |
| **Moons** (MoonsLab, `/app/labs/moons`) | 5 total — 5 real GLB (hero, CLEAR); **5 more spec-named moons (Phobos, Deimos, Ganymede, Callisto, Triton) have zero component despite real GLBs already on disk, unwired** |
| **Stars** (StarsLab, `/app/labs/stars`) | 8 total — 5 real GLB (hero, CLEAR), 3 procedural-by-design (main-sequence, red-giant, white-dwarf) |
| **Galaxies** (GalaxyLab, `/app/labs/galaxies`) | 7 total — 0 real GLB (100% procedural particle systems, by design) |
| **Telescopes/observation** | 0 total — no taxonomy detail, no route, no data file; 3 real telescope GLBs (Chandra, Hubble, JWST) exist on disk, zero wired |
| **Total space objects/components with a dedicated route** | 31 (11 planets + 5 moons + 8 stars + 7 galaxies), across 4 dedicated routes |
| **Count with real GLB** | 20 (10 planets + 5 moons + 5 stars + 0 galaxies) |
| **Count procedural-only** | 11 (1 planet [Sun] + 3 stars + 7 galaxies) |
| **Count "Coming soon" (no route at all)** | 6 branches (`gravity-and-orbits`, `asteroids-and-comets`, `space-exploration`, `cosmology-foundations`, `telescopes-and-observation`, `earth-in-space`) |
| **Approved-but-unused `modelRegistry.ts` `space` assets (by URL)** | 0 |
| **Sourced-but-unregistered GLBs on disk with zero code references** | 12 files (`bennu`, `callisto`, `chandra-xray-observatory`, `deimos`, `ganymede`, `hubble-telescope`, `jwst-telescope`, `perseverance-rover`, `phobos`, `triton` + `triton-optimized`, `vesta`) |
