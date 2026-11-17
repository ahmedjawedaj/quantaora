# Space — Planets & Moons Visual Acceptance Review

Scope: the 19 planet/moon bodies sourced in Asset Recovery Wave 1
(`quantaora-app/public/models/sourced/space/*.glb`): 8 planets, 1 dwarf planet (Pluto), and
10 moons. Asteroids/dwarf-planet-body specimens (Bennu, Ceres, Vesta) and telescopes/spacecraft
are out of scope for this doc — owned by the SPACE-OBJECTS reviewer.

Rendered headless via a custom Puppeteer + three.js harness (Chrome + SwiftShader software
WebGL; scratch scripts at `/tmp/asset-review-space-planets/`, not committed). Stage matches the
app's real `GenericViewer.tsx` recipe exactly: background `#faf8f4`, ambient `#fff4e6` @0.7,
key directional `#fff7ec` @2 at (3,4,3), fill directional `#dce8f5` @0.6 at (-3,-1,2), camera
fov 36. Camera auto-framed per asset from its actual bounding sphere (exact-fit distance for the
vertical FOV × 1.3 margin), independent of each body's native export scale (planets/Pluto/most
moons are exported at ~1000-unit spheres; Phobos/Deimos at ~10-27-unit irregular bodies;
Moon-earth at a ~2.5-unit height-mapped mesh — see each asset's `validation.approxDimensions` in
its `.license.json` sidecar).

**Awareness note (not a per-asset issue):** the app's actual in-app star/planet stage,
`StarViewer.tsx`, renders on a dark `#080d1c` background with cooler rim lighting, not this warm
off-white stage — noted once here per instructions. None of the 19 textures below rely on a light
background to read (no bodies use alpha-blended limb glow that would wash out on dark), so nothing
here is flagged as "would look wrong against the dark backdrop" specifically.

**Animations:** all 19 files ship `animationCount: 0` — self-rotation is not baked into any of
them. That is expected/fine: rotation for every body in this catalog should be driven by the
viewer component (matches how `GenericModel`/`StarModel` already drive rotation for other bodies),
not by the GLTF. Noted once here, not repeated per asset unless a file is an exception.

**Attribution:** all 19 sidecars mark `attributionRequired.required: false` (public-domain U.S.
Government work) but recommend an in-app NASA credit line as good practice, consistent with the
existing 5 `public/models/space/*.glb` entries. Creator field varies: NASA VTAD for most
solar-system-scale bodies, NASA/JPL-Caltech for Mars-family bodies (Mars, Phobos, Deimos), NASA
Goddard SVS (Dan Gallagher/Ernie Wright, LRO data) for the Moon. Recommended credit line: *"3D
model: NASA / NASA Visualization Technology Applications and Development (VTAD)"* (swap in
NASA/JPL-Caltech or NASA Goddard SVS per the table below where applicable).

## Summary table

| Asset | Verdict | One-line reason |
| --- | --- | --- |
| earth.glb | PASS | Real color+relief globe, continents/cloud swirl recognizable, no seams, correct default framing |
| mars.glb | PASS | Recognizable dark regions + visible bright polar ice cap in top-down view, no seams |
| mercury.glb | CONDITIONAL | Real cratered relief, but a visible vertical texture seam runs pole-to-pole near the prime meridian (cube-map face-boundary artifact) |
| venus.glb | PASS | Correct pale cream/yellow cloud banding, smooth limb, no seams |
| jupiter.glb | PASS | Continuous cloud bands, Great Red Spot visible in 3/4 views, correct gas-giant look |
| saturn.glb | PASS | Real ring geometry as a separate mesh (not baked/flat-decal), correct proportions and banding |
| neptune.glb | PASS | Deep blue correct color, subtle banding, no seams |
| uranus.glb | PASS | Pale cyan correct color, subtle banding, no seams |
| pluto.glb | PASS | Tombaugh Regio "heart" clearly visible — high recognizability for a dwarf planet |
| moon-earth.glb | PASS | Real LRO topography mesh (not a bare sphere), maria/cratering recognizable |
| io.glb | PASS | Volcanic yellow/green/red mottled surface correctly distinctive vs. other moons |
| europa.glb | PASS | Linea crack network visible; very minor pole-pinch artifact in top-down view, not disqualifying |
| ganymede.glb | PASS | Grooved terrain + bright/dark dichotomy visible, recognizable |
| callisto.glb | PASS | Dense, high-contrast cratering — most heavily cratered body in the set, correctly so |
| titan.glb | CONDITIONAL | Scientifically accurate (haze hides Titan's surface) but the texture is nearly flat-color; low recognizability/engagement for a child audience |
| enceladus.glb | PASS | Icy grey-white body with faint "tiger stripe" fracture lines near the pole, recognizable |
| triton.glb | PASS | Mottled "cantaloupe terrain" + polar cap streaking visible, recognizable |
| phobos.glb | PASS | Irregular potato shape with Stickney crater clearly visible — exactly where a sphere placeholder would be wrong |
| deimos.glb | PASS | Irregular, smoother/less-cratered shape correctly distinct from Phobos |

**Totals:** 19/19 rendered (0 unrenderable/loader errors). 17 PASS, 2 CONDITIONAL, 0 REJECT.

---

## Detailed findings

### earth.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Earth (also backs Space > Earth in Space,
  which needs the body but keeps rotation/tilt/day-night/season mechanics procedural).
- **Screenshots:** `earth/earth-front.png`, `earth/earth-three-quarter-front-left.png`,
  `earth/earth-three-quarter-front-right.png`, `earth/earth-top-down-three-quarter.png`,
  `earth/earth-terminator.png`, contact sheet `earth/earth-contact-sheet.png`.
- **Scientific accuracy:** real Blue-Marble-style color+relief texture; continents, cloud cover,
  and ocean color are all correctly placed and colored. 1 mesh / 1 material / 2 textures (likely
  color + a secondary map) per the sidecar.
- **Mesh/material/texture quality:** clean single sphere mesh, no visible seams at any of the 5
  angles including top-down (pole region reads clean).
- **Recognizability:** immediately recognizable as Earth to a child audience.
- **Style fit:** matches the Anatomy Atelier warm-neutral-stage bar well — reads clearly against
  `#faf8f4`.
- **Framing/bounding box:** bounding sphere radius ≈865 units (bbox ~1000×996.6×1000, consistent
  with the ~1000-unit relief-sphere export convention used across this NASA VTAD batch); auto-frame
  puts the whole globe comfortably in frame with margin at all 5 angles.
- **Transparency/material faults:** none observed — no atmosphere shell mesh is present in this
  export (clouds are baked into the color texture, not a separate translucent shell). That's an
  acceptable simplification for this body; if a soft atmospheric glow is wanted at the limb later,
  it would need to be added at integration time (rim-light shader or a thin glow sprite), not
  sourced from this asset.
- **Animation:** none shipped (expected/fine, see note above — viewer should drive rotation, and
  Earth in particular will eventually need axial tilt + day/night driven procedurally too, which
  belongs to the Earth-in-space branch's simulators, not this asset).
- **Performance:** 12.32 MB — within the 15MB hero-asset guideline; 1 mesh, 1 material.
- **Attribution:** NASA VTAD, public domain, no legally required credit; recommend a credit line
  per policy above.

### mars.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Mars (`components.mars` in
  `content/taxonomy/space.json`, which also names Phobos/Deimos and "Rover missions" as
  Mars-linked lowLevelItems — both satisfied by other assets in this wave).
- **Screenshots:** `mars/mars-*.png` (5 angles) + `mars/mars-contact-sheet.png`.
- **Scientific accuracy:** dark albedo regions (e.g., Syrtis Major-like markings) correctly placed;
  a bright polar ice cap is clearly visible in the top-down-three-quarter angle — a strong,
  scientifically correct detail for a planet component.
- **Mesh/material/texture quality:** single clean mesh, no seam artifacts observed at any angle.
- **Recognizability:** strong — the reddish color plus visible polar cap reads as Mars immediately.
- **Framing:** bounding sphere radius ≈864 units, auto-frames cleanly.
- **Transparency/material faults:** none (no dust-storm/atmosphere shell — thin atmosphere is
  correctly not represented as a thick shell, matching the taxonomy's own "Thin atmosphere"
  lowLevelItem, which is more of a fact-panel topic than a renderable shell).
- **Animation:** none shipped (expected).
- **Performance:** 3.85 MB — comfortably under budget.
- **Attribution:** NASA/JPL-Caltech, public domain.

### mercury.glb — CONDITIONAL

- **Taxonomy path:** Space > Solar System > Planets > Mercury.
- **Screenshots:** `mercury/mercury-*.png` (5 angles) + `mercury/mercury-contact-sheet.png`. Raw
  embedded texture pulled for inspection at `/tmp/asset-review-space-planets/textures/` (scratch,
  not part of this deliverable) — 2048×1536 PNG, laid out as a cross/cube-map unwrap (six cube
  faces in a plus shape), not a simple equirectangular map.
- **Defect found:** a visible vertical seam artifact runs pole-to-pole near the left-of-center of
  the visible face in the `front` and `three-quarter-front-left` renders (see
  `mercury/mercury-front.png`). This lines up with a cube-face boundary in the source texture,
  where the exported cross-map's face edges don't blend perfectly on the sphere — visible here
  specifically because Mercury's highly cratered, high-contrast albedo makes the seam legible; the
  same UV/export technique is very likely shared by the other same-generator NASA VTAD bodies in
  this batch (identical `Khronos Blender glTF 2.0 I/O` generator, same node/mesh/material counts),
  but on lower-contrast or more uniformly colored bodies (Venus, Neptune, Uranus, Titan) the same
  seam is not visually detectable — worth a second look if any of those bodies get a much brighter
  lighting rig in-app.
- **Scientific accuracy:** otherwise correct — dense, fine cratering typical of Mercury, correct
  neutral grey-brown color.
- **Recognizability:** still reads correctly as Mercury; the seam is a "look closely" defect, not a
  silhouette/identity problem.
- **Recommendation:** acceptable to ship as CONDITIONAL for now (it's the real NASA-authored
  relief, not a placeholder), but flag for a follow-up texture-seam fix (edge-padding/blur at the
  cube-map boundaries, or re-export with an equirectangular projection) before treating it as a
  polished hero asset.
- **Animation:** none shipped (expected).
- **Performance:** 3.05 MB.
- **Attribution:** NASA VTAD, public domain.

### venus.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Venus.
- **Screenshots:** `venus/venus-*.png` (5 angles) + `venus/venus-contact-sheet.png`.
- **Scientific accuracy:** correct pale cream/yellow sulfuric-acid cloud banding, no surface detail
  visible (scientifically correct — Venus's surface is permanently cloud-obscured in visible
  light).
- **Mesh/material/texture quality:** smooth, no seams visible at any of the 5 angles — Venus's low
  contrast, diffuse cloud texture makes this the cleanest-looking body in the batch.
- **Recognizability:** reads correctly as "the cloudy pale planet," reasonably distinct from Earth
  by color alone.
- **Performance:** 0.29 MB — smallest file in the batch, trivial budget cost.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### jupiter.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Jupiter (`components.jupiter`, which also
  names Europa/Io/Ganymede/Callisto and "Strong magnetic field"/"Gas giant layers" as related
  lowLevelItems).
- **Screenshots:** `jupiter/jupiter-*.png` (5 angles) + `jupiter/jupiter-contact-sheet.png`.
- **Scientific accuracy:** continuous, correctly colored cloud bands (tan/cream/white); the Great
  Red Spot is clearly visible in the `three-quarter-front-left` angle as a distinct orange oval
  below the equatorial band — a strong scientifically-correct identifying feature.
- **Mesh/material/texture quality:** bands are continuous across the visible seam region (no
  break/misalignment observed), clean single mesh.
- **Recognizability:** very strong — banding + Red Spot together make this immediately
  identifiable.
- **Framing:** bounding sphere radius ≈848 units (bbox y-axis slightly compressed at 935 vs. 1000
  on x/z — consistent with Jupiter's real oblateness being reflected in the geometry, a nice
  scientific detail rather than a defect).
- **Performance:** 11.48 MB — within the 15MB guideline but on the larger side; single mesh/texture
  so no wasted overhead.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### saturn.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Saturn; also incidentally satisfies
  Space > Solar System > (Rings, an `otherObjects` entry) since the rings are separate ring
  geometry, not a decal.
- **Screenshots:** `saturn/saturn-*.png` (5 angles) + `saturn/saturn-contact-sheet.png`.
- **Scientific accuracy:** rings only on Saturn (as expected), correct proportions relative to the
  planet body, correct pale gold banding on the gas-giant body itself. The `top-down-three-quarter`
  angle is the most informative here — it shows the rings as a broad flat annulus around the body,
  and the `terminator` angle shows the rings correctly casting a shadow band across the globe.
- **Mesh/material/texture quality:** validated 3 meshes / 2 materials (body + ring, confirmed by
  the sidecar's own note) — this is real ring geometry, not a texture trick. Ring material reads
  as a soft, translucent-looking band; no hard transparency clipping/z-fighting observed at any of
  the 5 angles.
- **Recognizability:** immediately identifiable as Saturn.
- **Framing:** bounding sphere radius ≈1709 units (bbox x/z ~2331 due to ring span vs. body-only
  ~1000) — the auto-framer correctly accounts for the ring's much larger footprint so the rings
  are never clipped out of frame.
- **Performance:** 5.22 MB, very reasonable for the extra ring geometry/material.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### neptune.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Neptune.
- **Screenshots:** `neptune/neptune-*.png` (5 angles) + `neptune/neptune-contact-sheet.png`.
- **Scientific accuracy:** correct deep cobalt-blue color with subtle darker banding; no seam
  artifacts observed.
- **Recognizability:** clearly distinct from Uranus by the more saturated blue, correct.
- **Performance:** 0.59 MB, trivial.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### uranus.glb — PASS

- **Taxonomy path:** Space > Solar System > Planets > Uranus.
- **Screenshots:** `uranus/uranus-*.png` (5 angles) + `uranus/uranus-contact-sheet.png`.
- **Scientific accuracy:** correct pale cyan-grey color, subtle banding visible in the
  `three-quarter-front-right` angle. Uranus's famous ~98° axial tilt (rotating "on its side") is an
  orientation property, not baked into this relief-sphere mesh — that is correctly a
  viewer/scene-graph concern for whoever integrates this asset, not a defect in the asset itself;
  flagging so the integration wave doesn't ship Uranus upright by omission.
- **Recognizability:** correct pale color distinguishes it from Neptune.
- **Performance:** 0.17 MB, smallest planet file.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### pluto.glb — PASS

- **Taxonomy path:** Space > Solar System > Dwarf Planets > Pluto.
- **Screenshots:** `pluto/pluto-*.png` (5 angles) + `pluto/pluto-contact-sheet.png`.
- **Scientific accuracy:** the "heart," Tombaugh Regio, is clearly and correctly visible and
  positioned in the `front` and `three-quarter-front-left` angles — this is Pluto's single most
  recognizable feature and it renders cleanly.
- **Mesh/material/texture quality:** good contrast between darker equatorial terrain and the pale
  heart region, no seam artifacts observed.
- **Recognizability:** very strong for a dwarf planet — a child who has seen any Pluto image will
  recognize this immediately.
- **Performance:** 7.01 MB, reasonable.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### moon-earth.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Moon; also backs Space > Earth in Space
  (moon-phase/eclipse/tide processes, which stay procedural per the sourcing doc's own note).
- **Screenshots:** `moon-earth/moon-earth-*.png` (5 angles) +
  `moon-earth/moon-earth-contact-sheet.png`.
- **Scientific accuracy:** real LRO-derived height-map mesh (per the sidecar note, not a bare
  textured sphere) with correctly placed dark maria patches and light highland cratering.
- **Mesh/material/texture quality:** no seams observed; note the actual displacement geometry is
  subtle at the render distances used here (bounding sphere radius only ≈2.2 units — this file is
  exported at a much smaller native scale than the ~1000-unit planet convention, per its
  `approxDimensions: [2.54, 2.54, 2.54]`), so the height-map relief mostly reads through shading
  rather than obvious silhouette bumps; that is expected for a body-scale asset and not a defect.
- **Recognizability:** immediately recognizable as the Moon.
- **Performance:** 13.16 MB — near the 15MB guideline; sidecar notes full-res variants run
  81–313MB, so the "Small" variant chosen here is the right tradeoff.
- **Animation:** none shipped (expected).
- **Attribution:** NASA Goddard SVS (Dan Gallagher; LRO data via Ernie Wright), public domain.

### io.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Io (also named under `components.jupiter`
  lowLevelItems).
- **Screenshots:** `io/io-*.png` (5 angles) + `io/io-contact-sheet.png`.
- **Scientific accuracy:** correct volcanic surface — mottled yellow, green-grey, and rust-red
  patches consistent with sulfur/silicate volcanic deposits; visibly distinct from every other
  moon in this set (no other body has this coloring), which is important since a child needs to
  tell Io apart from Europa/Ganymede/Callisto at a glance.
- **Mesh/material/texture quality:** no seam artifacts observed across the 5 angles.
- **Performance:** 16.67 MB — over the sourcing wave's own 15MB guideline (already flagged in that
  wave's notes as "no cheaper NASA variant found"); confirmed here as a single clean mesh with no
  wasted geometry, so the size is texture-resolution-driven, not bloat. Acceptable but worth
  compressing/re-exporting at integration time if load-time budget is tight.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### europa.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Europa (also named under `components.jupiter`).
- **Screenshots:** `europa/europa-*.png` (5 angles) + `europa/europa-contact-sheet.png`.
- **Scientific accuracy:** correct pale cream/tan icy surface crossed by darker linea (crack)
  markings — Europa's signature feature, clearly visible in all angles.
- **Mesh/material/texture quality:** minor cosmetic artifact — the `top-down-three-quarter` angle
  shows a faint radial "pinch" pattern near the pole (a handful of texture lines fanning from a
  point), typical of an equirectangular-to-sphere pole singularity. It's subtle and doesn't read as
  a hole/seam break at normal viewing distance; not disqualifying, but worth a note if a future
  pass wants zero pole artifacts.
- **Recognizability:** strong — the linea network is Europa's defining visual trait and it's
  present and legible.
- **Performance:** 12.29 MB, within budget.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### ganymede.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Ganymede (also named under
  `components.jupiter`).
- **Screenshots:** `ganymede/ganymede-*.png` (5 angles) + `ganymede/ganymede-contact-sheet.png`.
- **Scientific accuracy:** correct brownish-grey surface with visible grooved terrain and a
  bright/dark regional dichotomy (darker, older terrain vs. brighter, younger grooved terrain) —
  matches real Ganymede imagery well.
- **Mesh/material/texture quality:** no seam artifacts observed.
- **Recognizability:** good — distinct in tone from Callisto (less densely cratered/speckled) and
  from Io/Europa (no volcanic color, no crack network).
- **Performance:** 4.08 MB, comfortable.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### callisto.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Callisto (also named under
  `components.jupiter`).
- **Screenshots:** `callisto/callisto-*.png` (5 angles) + `callisto/callisto-contact-sheet.png`.
- **Scientific accuracy:** correctly the most heavily and uniformly cratered body in the entire
  19-asset set — matches Callisto's real status as one of the most cratered objects in the solar
  system.
- **Mesh/material/texture quality:** crisp crater texture at all 5 angles, including top-down (pole
  region reads clean, no pinch/seam).
- **Recognizability:** very strong — the crater density alone distinguishes it from every other
  Jovian moon in this set.
- **Performance:** 4.45 MB, comfortable.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### titan.glb — CONDITIONAL

- **Taxonomy path:** Space > Solar System > Moons > Titan.
- **Screenshots:** `titan/titan-*.png` (5 angles) + `titan/titan-contact-sheet.png`. Raw embedded
  texture pulled for inspection (scratch, not part of this deliverable) — 4096×2048 PNG.
- **Finding:** the rendered body is an almost perfectly flat amber/gold sphere with only extremely
  faint tonal variation (visible as a barely-there darker patch in the `three-quarter-front-left`
  angle). Pulling the raw 4096×2048 source texture confirms this isn't a rendering/lighting problem
  — the texture itself is genuinely near-uniform color with very low contrast, essentially no
  surface information despite being a reasonably high-resolution image.
- **Is this a defect?** Scientifically, this is *defensible* — Titan's dense hydrocarbon
  atmosphere really does hide essentially all surface detail in natural-color imagery, so a
  near-featureless amber globe is an accurate depiction, not an error. But per the task's explicit
  "common low-quality-asset failure mode" callout (a body that's actually a generic sphere with a
  stretched/plain texture), this asset is visually indistinguishable from that failure mode even
  though its root cause here is real astronomy rather than a placeholder texture. For a child
  audience specifically, this reads as "the boring orange ball" with nothing to point at, touch, or
  name — weak for the Component-Level Learning Flow's "See it" and "Touch it" steps.
- **Recommendation:** ship as CONDITIONAL. Either (a) accept as scientifically correct and lean into
  it with strong captioning/comparison framing ("Titan hides its surface — this is as much detail
  as any spacecraft has ever seen in visible light"), or (b) supplement with a very subtle
  procedural haze-band shader (soft banding, not fabricated surface features) to add visual
  interest without misrepresenting the body. Do not source or invent surface detail that doesn't
  exist in the real data.
- **Performance:** 0.69 MB — smallest moon file, as expected for a near-flat texture.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### enceladus.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Enceladus.
- **Screenshots:** `enceladus/enceladus-*.png` (5 angles) +
  `enceladus/enceladus-contact-sheet.png`.
- **Scientific accuracy:** correct icy grey-white surface; faint linear fracture marks visible near
  the pole region in the `three-quarter-front-left` and `top-down-three-quarter` angles, consistent
  with (though not a dramatic rendering of) Enceladus's famous south-polar "tiger stripe" fractures
  that vent water-ice geysers.
- **Mesh/material/texture quality:** clean, no seam artifacts; texture contrast is intentionally low
  (icy albedo is genuinely very uniform), similar in character to Titan's issue above but far less
  extreme — there's still legible surface texture (subtle craters + the fracture lines) here, so
  this one does not get the same CONDITIONAL treatment.
- **Recognizability:** adequate — reads as an icy moon; the tiger-stripe hint is a nice detail if a
  hotspot calls it out explicitly.
- **Performance:** 17.10 MB — over the 15MB guideline (already flagged in the sourcing wave's own
  notes as the only available NASA Enceladus body); single clean mesh, no structural bloat.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### triton.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Triton.
- **Screenshots:** `triton/triton-*.png` (5 angles) + `triton/triton-contact-sheet.png`.
- **Scientific accuracy:** correct dark, mottled "cantaloupe terrain" texture with a lighter,
  streaked polar-cap region visible in the `front` and `top-down-three-quarter` angles — matches
  Voyager 2 imagery's distinctive look for Triton reasonably well.
- **Mesh/material/texture quality:** no seam artifacts observed.
- **Recognizability:** good — the dark base tone with light polar streaking is visually distinct
  from every other moon in the set.
- **Performance:** 6.55 MB, comfortable.
- **Animation:** none shipped (expected).
- **Attribution:** NASA VTAD, public domain.

### phobos.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Phobos (also named under `components.mars`
  lowLevelItems).
- **Screenshots:** `phobos/phobos-*.png` (5 angles) + `phobos/phobos-contact-sheet.png`.
- **Scientific accuracy:** real irregular shape-model geometry, not a sphere — this is exactly the
  case the sourcing wave flagged as its highest-value win. Stickney crater (the large, deep crater
  that dominates one end of Phobos) is clearly visible and correctly proportioned in the `front`
  and `three-quarter-front-left` angles.
- **Mesh/material/texture quality:** irregular potato shape reads correctly at every angle,
  including top-down; no stretched/pinched texture artifacts despite the non-spherical topology.
- **Recognizability:** excellent — the lumpy asymmetric silhouette alone distinguishes Phobos from
  every planet/round moon in this set before a child even looks at surface color.
- **Framing:** bounding sphere radius ≈21 units (bbox ~24×21×27, correctly asymmetric/irregular,
  consistent with `approxDimensions` in the sidecar) — note this body is exported at a completely
  different native scale (~tens of units) than the ~1000-unit planet convention, which the
  auto-framer here handled transparently; a fixed (non-auto-framing) camera distance in the actual
  app viewer would need to account for this per-body scale difference explicitly.
- **Performance:** 3.86 MB, comfortable.
- **Animation:** none shipped (expected).
- **Attribution:** NASA/JPL-Caltech, public domain.

### deimos.glb — PASS

- **Taxonomy path:** Space > Solar System > Moons > Deimos (also named under `components.mars`
  lowLevelItems).
- **Screenshots:** `deimos/deimos-*.png` (5 angles) + `deimos/deimos-contact-sheet.png`.
- **Scientific accuracy:** real irregular shape-model geometry, correctly smoother and less
  dramatically cratered than Phobos (Deimos has a more regolith-smoothed, rounded appearance in
  reality, and this asset reflects that — it is not simply a smaller copy of the Phobos mesh).
- **Mesh/material/texture quality:** clean at all 5 angles, irregular shape reads well, no
  stretching artifacts.
- **Recognizability:** good — distinctly smaller and smoother than Phobos when the two are compared
  side by side, which is the correct pedagogical contrast for a "compare it" step.
- **Framing:** bounding sphere radius ≈11 units (bbox ~15×12×11), same native-scale caveat as
  Phobos above.
- **Performance:** 1.60 MB, smallest moon file.
- **Animation:** none shipped (expected).
- **Attribution:** NASA/JPL-Caltech, public domain.
