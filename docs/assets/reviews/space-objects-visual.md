# Space Objects — Visual Acceptance Review (Wave 2)

Reviewer: SPACE-OBJECTS agent, part of "Asset Recovery Wave 2" (2026-08-18).
Scope: the 7 non-planet space-body / telescope / spacecraft GLBs under
`quantaora-app/public/models/sourced/space/`: `bennu.glb`, `ceres.glb`, `vesta.glb`,
`chandra-xray-observatory.glb`, `hubble-telescope.glb`, `jwst-telescope.glb`,
`perseverance-rover.glb`. Planets and named moons (earth, mars, mercury, venus, jupiter, saturn,
neptune, uranus, pluto, moon-earth, io, europa, ganymede, callisto, titan, enceladus, triton,
phobos, deimos) are out of scope — owned by a separate SPACE-PLANETS reviewer.

**No galaxy or standalone "star" GLBs exist in `public/models/sourced/space/`** despite the wider
asset brief mentioning that category — confirmed absent, not fabricated. This matches
`docs/assets/space.md` §6, which documents galaxies/star-lifecycle stages as unresolved sourcing
gaps (no qualifying authored mesh found), not an oversight of this review.

Rendering method: headless Chromium (Google Chrome, since the Downloads-folder Chromium.app was
Gatekeeper-quarantined and hung on launch) via `puppeteer-core`, software WebGL
(`--use-gl=swiftshader`), vendored Three.js `0.185.1` ESM (`GLTFLoader` + `DRACOLoader` — 4 of the
7 GitHub-sourced NASA files are Draco-compressed, decoded via the vendored
`three/examples/jsm/libs/draco/gltf` decoder, `type: 'js'` for headless-safe decoding). Each GLB
was loaded from a base64-embedded ArrayBuffer (avoids file:// fetch/CORS issues entirely — the
importmap itself still needed `--allow-file-access-from-files` to resolve `three`/`three/addons`
module imports across file:// origins). Stage recipe matches
`src/components/explorer/GenericViewer.tsx` exactly: background `#faf8f4`, ambient `#fff4e6`@0.7,
key light `#fff7ec`@2 at (3,4,3), fill light `#dce8f5`@0.6 at (-3,-1,2), camera fov 36. Camera
auto-framed per-asset from the model's computed bounding box/centroid (native scales vary wildly
across these 7 files — see Performance notes). 5 angles captured per asset (front, 3/4 front-left,
3/4 front-right, top-down 3/4, one distinctive-feature angle) plus a composited contact sheet.

**Result: all 7/7 rendered successfully** — no loader errors, no fabricated renders needed.

## Summary table

| Asset | Verdict | One-line reason |
| --- | --- | --- |
| `bennu.glb` | PASS | Real NASA shape model of the spinning-top-shaped asteroid; correct irregular silhouette, no texture needed at this content level. |
| `ceres.glb` | PASS | Correct near-spherical dwarf-planet body with cratering and a visible bright-spot region (Occator-consistent); matches taxonomy's explicit dwarf-planet listing. |
| `vesta.glb` | PASS | Correct irregular cratered body; southern Rheasilvia-basin angle clearly shows the concentric-ridge/central-peak impact structure real Vesta is known for. |
| `chandra-xray-observatory.glb` | CONDITIONAL | Right overall silhouette (long optics tube + spacecraft bus + solar arrays + antenna) but flat, low-detail materials read as a generic satellite rather than specifically Chandra; branch also not yet authored. |
| `hubble-telescope.glb` | PASS | Distinctive, correctly proportioned cylindrical body, aperture door, aft instrument bay ports, solar arrays; solar-panel color is a minor material inaccuracy, not a shape/proportion error. |
| `jwst-telescope.glb` | PASS | CAD-accurate: gold hexagonal primary-mirror segments, secondary mirror on tripod struts, kite-shaped sunshield that correctly hides the mirror from most angles (real opto-mechanical behavior) — but see camera-framing and poly-count notes. |
| `perseverance-rover.glb` | PASS | Highly detailed, correctly proportioned 6-wheel rocker-bogie rover with mast, RTG, turret, and cabling; ships 23 animation channels (wheel articulation potential); most direct taxonomy match of the 7. |

**Totals:** 7/7 rendered, 0 unrenderable. 6 PASS, 1 CONDITIONAL, 0 REJECT.

Screenshot root (relative paths below are from this doc):
`../../../review-screenshots/asset-acceptance-2026-08-18/space-objects/`

---

## bennu.glb — PASS

**Taxonomy mapping:** `content/taxonomy/space.json` → `solar-system.otherObjects: "Asteroid belt"`
(specimen) per `docs/assets/space.md` §2/§5, and/or `asteroids-and-comets` branch (currently
`"detailed": false` — named only, not yet authored with low-level items). **Accuracy caveat:**
Bennu is scientifically a *near-Earth* asteroid (Apollo-group), not a main-belt object — the
"asteroid belt specimen" label carried over from the sourcing wave is a loose fit. Recommend the
eventual `asteroids-and-comets` authoring treat Bennu as a near-Earth-object specimen, not a
belt specimen, when that branch gets detailed.

**License/attribution:** Public domain, NASA VTAD, `science.nasa.gov`. Not legally required, but
an in-app "NASA" credit line is recommended (matches existing convention).

**Rendered evidence:**
- `bennu/front.png`, `bennu/three-quarter-front-left.png`, `bennu/three-quarter-front-right.png`,
  `bennu/top-down-three-quarter.png`, `bennu/distinctive-silhouette-side.png`
- `bennu/bennu-contact-sheet.png`

**Assessment:** Single mesh, single material, single texture (grayscale/relief-shaded, no color
map) — 860 KB. The model reproduces Bennu's real "spinning-top" shape (flattened, bulging
equatorial ridge) correctly across all 5 angles; the equatorial bulge and boulder-strewn surface
are clearly legible even without a color texture. Bounding box is sane (roughly 565×508×535 native
units, centroid near origin) and the auto-framed camera captures the full silhouette with no
clipping. No animation channels (correct — a real asteroid at this content level has no rigid
articulation; a *tumble* animation would be a nice-to-have but is legitimately a procedural/orbit
concern, not a baked animation this mesh needs). No transparency/material faults observed. Highly
recognizable as "the weird spinning-top asteroid" for a child audience, which is exactly Bennu's
scientific claim to fame (also the OSIRIS-REx sample-return target).

## ceres.glb — PASS

**Taxonomy mapping:** `content/taxonomy/space.json` → `solar-system.dwarfPlanets: ["Pluto",
"Ceres", ...]` — explicit, direct match; `solar-system` is `"detailed": true`.

**License/attribution:** Public domain, NASA VTAD, `science.nasa.gov`. Same in-app credit
recommendation as above.

**Rendered evidence:**
- `ceres/front.png`, `ceres/three-quarter-front-left.png`, `ceres/three-quarter-front-right.png`,
  `ceres/top-down-three-quarter.png`, `ceres/distinctive-polar-crater.png`
- `ceres/ceres-contact-sheet.png`

**Assessment:** Single mesh/material, 2 textures (color + presumably normal/relief) — 9.5 MB,
the largest of the 7 by file size. Correctly near-spherical body (radius ~473, size
946×873×946 — the slight Y-flattening matches Ceres's real oblate-spheroid shape from its slow
rotation and icy-rocky composition). Heavy, realistic cratering is visible at every angle, and a
small bright patch is visible in two of the captured frames — consistent with Ceres's famous
Occator-crater bright deposits (a genuinely distinctive, "wow" feature for a child audience: "why
is there a bright spot on this dwarf planet?"). No transparency/material faults. No animation
channels (correct at this content level — rotation belongs to the procedural sim layer). File size
is above the ~15 MB guideline used elsewhere in `docs/assets/space.md`... actually under it (9.5 MB
< 15 MB) — fine, no action needed, mentioned only because it's the heaviest of this batch.

## vesta.glb — PASS

**Taxonomy mapping:** Same `asteroids-and-comets` (undetailed) / `solar-system.otherObjects`
belt-specimen mapping as Bennu, but **without** the near-Earth-vs-belt accuracy caveat — Vesta is
a genuine main-asteroid-belt body, so "asteroid belt specimen" is scientifically correct here.

**License/attribution:** Public domain, NASA VTAD, `science.nasa.gov`.

**Rendered evidence:**
- `vesta/front.png`, `vesta/three-quarter-front-left.png`, `vesta/three-quarter-front-right.png`,
  `vesta/top-down-three-quarter.png`, `vesta/distinctive-southern-basin.png`
- `vesta/vesta-contact-sheet.png`

**Assessment:** Single mesh/material, 2 textures — 4.84 MB. Body is correctly irregular/lumpy
(not a sphere) with heavy real cratering, matching Vesta's actual battered-protoplanet appearance.
The two southern-hemisphere angles (`distinctive-southern-basin.png` and the bottom-left contact
sheet cell) clearly show a large circular basin with concentric ridges and a central peak-like
mound — this is a strong, recognizable rendering of the real Rheasilvia impact basin, one of the
largest known impact structures in the solar system relative to its parent body. That is exactly
the kind of "distinctive feature" a hotspot should call out for this component. No transparency
faults. No animation channels (correct). Good candidate for a future "why does this asteroid have
a giant crater" hotspot.

## chandra-xray-observatory.glb — CONDITIONAL

**Taxonomy mapping:** `telescopes-and-observation` branch — currently `"detailed": false` (named
only in the spec, not yet authored with low-level items/components). No authored component path
exists yet for this asset to attach to; it is usable as a "reusable instrument" asset per
`docs/assets/space.md` §2, but content authoring must happen before it can be wired to a real
lesson.

**License/attribution:** Public domain, NASA, `github.com/nasa/NASA-3D-Resources`.

**Rendered evidence:**
- `chandra-xray-observatory/front.png`, `.../three-quarter-front-left.png`,
  `.../three-quarter-front-right.png`, `.../top-down-three-quarter.png`,
  `.../distinctive-side-profile.png`
- `chandra-xray-observatory/chandra-xray-observatory-contact-sheet.png`

**Assessment:** 6 meshes / 5 materials / 4 textures, Draco-compressed, 998 KB. The overall
silhouette is directionally correct for Chandra: a long forward optics tube (standing in for the
High Resolution Mirror Assembly/sunshade), a central spacecraft bus, two solar-array wings, and a
small dish/antenna element. However, the materials are flat and low-detail — no visible surface
paneling, insulation blanket texture, or the distinctive louvered radiators real Chandra photos
show — so on its own, without a caption or label, this reads as "a generic satellite/telescope"
rather than specifically recognizable as Chandra to a child audience, which is the exact trap the
review brief calls out for store-bought/generic spacecraft models. The best single angle for
legibility is actually `three-quarter-front-right` (az +45°) in the contact sheet, not the
`distinctive-side-profile` (az +90°) angle chosen ahead of rendering — at az +90° the tube
foreshortens end-on and the shot reads mostly as a flat solar-panel cross, so if this asset moves
forward, the production default camera angle should be closer to a 30–45° azimuth, not a pure
side-on view. No transparency/material faults beyond the general low detail. No animation
channels. **Recommendation: usable as a placeholder "X-ray telescope" instrument, but pair it with
a clear on-screen label/name callout so children aren't relying on shape recognition alone; revisit
with a higher-detail Chandra model if/when `telescopes-and-observation` gets authored and this
component becomes a graded lesson asset** rather than a background/gallery piece.

## hubble-telescope.glb — PASS

**Taxonomy mapping:** `telescopes-and-observation` branch — currently `"detailed": false`. Same
authoring-gap caveat as Chandra: real, usable asset, no authored component path yet.

**License/attribution:** Public domain, NASA, `github.com/nasa/NASA-3D-Resources`.

**Rendered evidence:**
- `hubble-telescope/front.png`, `.../three-quarter-front-left.png`,
  `.../three-quarter-front-right.png`, `.../top-down-three-quarter.png`,
  `.../distinctive-solar-panels-side.png`
- `hubble-telescope/hubble-telescope-contact-sheet.png`

**Assessment:** Single mesh, 5 materials, 5 textures, Draco-compressed, 1.69 MB. This is a
genuinely strong, specifically-recognizable Hubble model: the elongated cylindrical body, the open
aperture door with the correct off-center circular opening, the aft instrument-bay ports (visible
as the dark circular/oval cutouts near the base), and the two rectangular solar-array wings are all
present and correctly proportioned relative to each other (bounding box ~458×525×501 native
units). This is exactly the kind of silhouette a child would recognize from photos as "the Hubble
telescope," not a generic satellite. **One material caveat:** the solar arrays render as a flat
brown/orange matte surface; real Hubble's arrays (especially the later rigid-panel replacement
arrays) read as a darker blue-black cell grid with a metallic/specular quality — this is a
stylization gap, not a proportion/shape error, so it does not block a PASS, but it's worth a
texture/material touch-up if this asset gets promoted to a graded lesson component. No
transparency faults otherwise. No animation channels (a solar-panel deployment/EVA-servicing
animation would add genuine educational value here — Hubble's multiple shuttle servicing missions
are a strong story beat — but none are baked into this GLTF).

## jwst-telescope.glb — PASS

**Taxonomy mapping:** `telescopes-and-observation` branch — currently `"detailed": false`. Same
authoring-gap caveat.

**License/attribution:** Public domain, NASA, `github.com/nasa/NASA-3D-Resources`. Sidecar notes
"detailed engineering-style CAD model of the observatory structure (mirror segments, sunshield,
instrument bus)" — confirmed accurate by inspection.

**Rendered evidence:**
- `jwst-telescope/front.png`, `.../three-quarter-front-left.png`,
  `.../three-quarter-front-right.png`, `.../top-down-three-quarter.png`,
  `.../distinctive-sunshield-underside.png`
- `jwst-telescope/jwst-telescope-contact-sheet.png`

**Assessment:** This is the most scientifically detailed asset in the batch: 1600 nodes, 1600
meshes, 46 materials, 0 textures (materials are flat CAD colors, no image maps needed at this
level of geometric detail), 4.71 MB, Draco-compressed. Inspection confirms the **actual gold
hexagonal primary-mirror segments** are modeled (not a generic disc or a plain gold circle) —
visible clearly in the `three-quarter-front-right.png` angle, along with the secondary mirror held
on its correct tripod-strut boom and the kite-shaped, multi-layer-implied sunshield underneath.
This is exactly the "hold spacecraft models to real-mission-accuracy" bar the review brief asks
for, and this asset clears it. Two notes, neither a blocker:
1. **Default-angle framing:** the systematic `front.png` (az 0°) and `distinctive-sunshield-underside.png`
   (looking up from below the sunshield) both show *no visible mirror* — the sunshield fully
   occludes it from those angles, which is actually physically correct (JWST's sunshield is
   designed to block exactly this line of sight to keep the mirror cold), but it means a naive
   "default camera reset" angle for this component would show a child a grey kite and nothing
   resembling a telescope. **Recommend the production default camera angle for this component be
   set closer to the az +45° view** (where the mirror is visible) rather than a pure front-on
   reset, or that the "See it" step of the component learning flow explicitly orbit past the
   sunshield before settling.
2. **Stray disconnected element:** every captured angle shows a small flat quad floating apart
   from the main structure (visible at the left edge of every contact-sheet cell), connected to
   nothing visibly. This is plausibly the real **sunshield momentum-trim flap** (a small
   solar-radiation-pressure trim tab JWST actually carries on a boom off the sunshield), rendered
   without its connecting boom mesh/material — but it could also be a stray CAD export artifact.
   Recommend a follow-up check against NASA's JWST reference diagrams before this asset is wired
   into a registry, to confirm whether that geometry is real and needs its boom fixed, or should be
   deleted.

**Performance flag:** 1600 individual mesh nodes for one on-screen object is heavy for a real-time
mobile viewer even though the file itself is a modest 4.71 MB — draw-call/node overhead, not
texture memory, is the risk here. Recommend a mesh-merge pass (e.g., via `gltf-transform`) before
this asset goes into a production scene with multiple simultaneous 3D objects, matching the
performance-budget concerns already flagged elsewhere in `docs/assets/space.md`.

## perseverance-rover.glb — PASS

**Taxonomy mapping:** `content/taxonomy/space.json` → `solar-system.components.mars.lowLevelItems:
"Rover missions"` — explicit, direct, and already called out by name in the asset's own
`.license.json` sidecar note. `solar-system` is `"detailed": true`. This is the single strongest
taxonomy fit of all 7 assets reviewed.

**License/attribution:** Public domain, NASA, `github.com/nasa/NASA-3D-Resources`.

**Rendered evidence:**
- `perseverance-rover/front.png`, `.../three-quarter-front-left.png`,
  `.../three-quarter-front-right.png`, `.../top-down-three-quarter.png`,
  `.../distinctive-instrument-mast-side.png`
- `perseverance-rover/perseverance-rover-contact-sheet.png`

**Assessment:** By far the most production-ready asset in this batch: 68 meshes, 47 materials, 40
textures, 88 nodes, 4.99 MB, Draco-compressed. The side-profile shot
(`distinctive-instrument-mast-side.png`) shows real texture work — weathered white thermal
blanketing, visible cabling/tubing (the gold coiled lines on the aft deck are a correct nod to the
rover's RTG heat-rejection plumbing), the correct 6-wheel rocker-bogie suspension geometry with
articulated bogie joints, the remote-sensing mast with camera head, and the robotic-arm turret at
the front. Proportions are correct relative to each other across all 5 angles, and the bounding
box (~2.7×1.85×3.1 native units) is sane. **This GLTF ships 23 animation channels** — by far the
richest animation data of any asset in this wave — strongly suggesting baked wheel-steering/
rocker-bogie-articulation and/or mast-pan-tilt rigging is already present. This is high-value: the
Component-Level Learning Flow's "Use it" step (spec §6) could directly drive this rover's
suspension articulation instead of needing a bespoke procedural rig. Recommend a follow-up
technical pass (outside this visual-review's scope) to inspect exactly which channels/bones these
23 animations drive before committing to "play on hotspot" wiring. No transparency/material
faults observed. No performance concerns — mesh/texture count is proportionate to visual payoff
and file size is reasonable for the detail delivered.

---

## Cross-cutting notes for the integration wave (informational only — not actioned here)

- **Native scale is wildly inconsistent across these 7 files** (Bennu ~565 units across, JWST ~21
  units across, Perseverance ~2.7 units across, Chandra ~470–768 units across). This review's
  renderer auto-framed the camera per-asset to compensate, but the production `GenericViewer`
  will need an explicit per-asset `scale` value in whatever registry entry gets written — this is
  not a defect in the assets themselves, just a integration-time requirement to flag for whoever
  wires these into routes/registries next.
- **Branch-authoring gap:** 3 of the 7 assets (Chandra, Hubble, JWST) have no authored
  `telescopes-and-observation` taxonomy content to attach to yet (branch is `"detailed": false`).
  They are visually acceptance-reviewed and ready, but cannot become a real lesson component until
  that branch gets the low-level-item/process breakdown the spec's other detailed branches have.
- **Attribution:** none of the 7 assets legally require an attribution string (all public-domain
  U.S. Government works), but every sidecar recommends an in-app "NASA" credit line for
  consistency with how the existing 5 legacy `public/models/space/*.glb` entries are presented.
  Recommend carrying that convention forward for all 7 if/when a credits screen is built.
