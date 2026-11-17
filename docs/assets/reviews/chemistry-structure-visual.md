# Chemistry — Structure Visual Acceptance Review

Scope: the 6 molecule/lattice GLBs sourced in Asset Recovery Wave 2, agent `CHEM-STRUCTURE`
(`quantaora-app/public/models/sourced/chemistry-structure/*.glb`): water, oxygen, carbon dioxide,
methane, sodium chloride lattice, glucose. Anatomy models are already approved and out of scope.
`source-data/*.sdf` (raw RCSB coordinate files, no `.glb`) is out of scope. Reaction
apparatus/vessels are a different wave-1 agent's scope.

Rendered headless via a custom Puppeteer + three.js harness (Chrome-for-Testing binary + SwiftShader
software WebGL; scratch scripts at `/tmp/asset-review-chemistry-structure/`, not committed). Stage
matches the app's real `GenericViewer.tsx` recipe exactly: background `#faf8f4`, ambient `#fff4e6`
@0.7, key directional `#fff7ec` @2 at (3,4,3), fill directional `#dce8f5` @0.6 at (-3,-1,2), camera
fov 36, ACES Filmic tone mapping + sRGB output (matching the app's `onCreated` GL setup). Camera
auto-framed per asset from its actual bounding sphere, independent of native export scale.

**Critical framing detail applied:** `GenericModel.tsx` (line 195) wraps every GLB in
`<group rotation={[0.05, -0.28, 0]}>` before display — a small fixed tilt baked into the real
in-app viewer, not raw model space. The harness reproduces that exact rotation before computing
the bounding box/default camera, so the "front" capture below is what a learner actually sees by
default, not an idealized unrotated view. This mattered concretely for `oxygen.glb` — see below.

**Animations:** all 6 files ship `animationCount: 0` — no baked rotation/keyframes, consistent
with every other reviewed catalog in this pipeline. `GenericModel`'s `autoRotate` prop already
drives slow Y-axis spin at the composition level for any GLB, so no embedded animation is needed.
Recommend enabling auto-rotate by default specifically for this catalog: every one of these six
assets is a small 3D shape whose entire teaching point (bond angle, linearity, tetrahedral
geometry, cubic lattice) is invisible from a single static frame and only reads on rotation —
noted once here, not repeated per asset unless an asset is an exception.

**Attribution:** all 6 sidecars mark `attributionRequired: false` (4 are CC0 RCSB PDB coordinate
data; 2 — methane and the NaCl lattice — are project-authored from public-domain physical/
crystallographic constants). No attribution text is required for any asset; RCSB recommends but
does not require a credit line ("Molecular geometry data: RCSB PDB (rcsb.org), CC0.").

**Material/style note (applies to all 6):** no textures/images in any file — pure vertex-colored
`MeshStandardMaterial` spheres+cylinders. `GenericModel.tsx` clamps roughness to 0.42–0.62,
metalness to 0, and clearcoat to 0.08–0.12 for every GLB, which gives all six the same warm,
matte-glossy "clean 3D" look as the approved Anatomy Atelier models — style fit is consistent
across the set and not repeated per asset below.

## Summary table

| Asset | Verdict | One-line reason |
| --- | --- | --- |
| water.glb | PASS | 3 atoms, correct O(red)/H(white) CPK coloring, ~104.5° bent shape clearly visible in default view |
| oxygen.glb | CONDITIONAL | Correct 2-atom O=O and correct red coloring, but the real in-app default camera angle renders it as a single lumpy blob — the diatomic bond is invisible until rotated |
| carbon-dioxide.glb | PASS | 3 atoms, correct O(red)/C(black) coloring, linearity unambiguous even in the default view |
| methane.glb | PASS | 5 atoms, correct C(black)/H(white) coloring, tetrahedral geometry clearly legible in default view |
| glucose.glb | CONDITIONAL | Atom count/colors verified correct (24 atoms, C6H12O6) but the ring reads as a dense overlapping blob from most angles — low recognizability for a child audience |
| sodium-chloride-lattice.glb | PASS | Clean repeating cubic lattice with visible bond rods, correct purple-Na/green-Cl convention colors |

**Rendered vs unrenderable:** 6/6 rendered successfully, 0 loader errors.
**Verdict counts:** PASS 4, CONDITIONAL 2, REJECT 0.

---

## water.glb

**Component mapping:** `chemistry.json` → `molecules-and-bonding` (detailed: true) →
`starterMolecules: "Water"`. Matches `docs/assets/chemistry-structure.md` row exactly (RCSB PDB
ligand `HOH`, ideal coordinates).

**Scientific/structural accuracy:** 3 atoms rendered — 1 large red sphere (O) + 2 smaller white/
off-white spheres (H). Color convention is correct standard CPK (O = red, H = white). The bent
~104.5° H-O-H shape is clearly visible in the `front`, `three-quarter-front-right`, and
`top-down-three-quarter` captures — the two H atoms are never collinear through O in any of the
default-ish angles, which is the correct qualitative signature of a bent (not linear) molecule.
Bounding box `[0.947 × 0.760 × 1.354]` units — sane, no degenerate axis.

**Mesh/material quality:** 5 meshes (3 atom spheres + 2 O-H bond cylinders per the sidecar), 4
materials, no textures. Atom spheres are sized large enough (van-der-Waals-adjacent proportions)
that they fully overlap and visually swallow both bond cylinders — the bonds exist as separate
geometry (useful for a future "bond highlighting" interaction) but are not visible as sticks in
any static screenshot. This is a legitimate CPK space-filling convention, not a defect, but it
does mean this reads more as "two overlapping colored balls" than a textbook ball-and-stick
diagram.

**Recognizability for a child audience:** Good. Two colors, three balls, obviously not one blob —
a child can count "1 red, 2 white" at a glance in most angles.

**Camera framing / bounding-box sanity:** Sane. Default (`front`) view already shows the bend.

**Transparency/material faults:** None observed.

**Animation:** Would add value (see catalog-wide note above) — slow rotation would make the bend
angle obvious from every frame, not just the lucky angles.

**Performance:** 119,380 bytes, tiny. No concerns.

**Attribution:** Not required (CC0 RCSB PDB data).

**Verdict: PASS.**

Screenshots: `water/water--contact-sheet.png` (6-angle grid); individual angles
`water/water--front.png`, `--three-quarter-front-left.png`, `--three-quarter-front-right.png`,
`--top-down-three-quarter.png`, `--left-side.png`, `--right-side.png`, `--back.png`,
`--bottom-up-three-quarter.png`, `--isometric.png`.

---

## oxygen.glb

**Component mapping:** `chemistry.json` → `molecules-and-bonding` → `starterMolecules: "Oxygen"`.
Matches the doc (RCSB PDB ligand `OXY`, ideal coordinates).

**Scientific/structural accuracy:** 2 atoms, both red — correct atom count (O2 is diatomic) and
correct CPK color (O = red) for both. No structural error here: the geometry data itself is fine.

**Mesh/material quality:** 4 meshes (2 atom spheres + presumably 1-2 bond-related meshes per
sidecar's nodeCount 5), 3 materials, no textures. Fine.

**Recognizability for a child audience — the actual problem:** The RCSB `OXY` ideal coordinates
place the O=O bond axis exactly along world Z. `GenericModel.tsx`'s fixed `[0.05, -0.28, 0]`
tilt (real in-app default framing, reproduced exactly in this harness) only rotates the model
~16° around Y, which is nowhere near enough to visually separate two spheres whose bond length is
short relative to their radius. The result: in the `front` and `three-quarter-front-left`
captures, oxygen renders as **one single lumpy/asymmetric blob** — there is no visual cue that
this is a two-atom molecule at all until the camera is orbited to a side (`left-side`) or
`isometric` angle, where the two spheres separate cleanly. This is the exact case the brief
called out to check for: default camera framing failing to convey "this is a molecule."

**Camera framing / bounding-box sanity:** Bounding box `[1.093 × 0.833 × 1.506]` (post-tilt) is
sane and not degenerate — the geometry itself is fine, this is purely a viewing-angle problem for
the *default* frame, not a data problem.

**Transparency/material faults:** None.

**Recommendation:** Either (a) increase the fixed tilt applied to axis-aligned diatomic/linear
molecules specifically (or apply a per-asset authored rotation at build time so O2's bond axis
isn't perfectly Z-aligned), or (b) rely on auto-rotate being on by default for this asset so the
blob resolves into two atoms within the first second of viewing. Given every other reviewed
molecule in this set reads correctly from its default angle, this is a one-off orientation fix,
not a rebuild.

**Animation:** Would meaningfully fix the recognizability gap noted above — strongly recommended
here specifically, more so than for the other five.

**Performance:** 82,156 bytes, tiny.

**Attribution:** Not required (CC0 RCSB PDB data).

**Verdict: CONDITIONAL** — ship only with auto-rotate on by default, or fix the default-angle
orientation; as a static default frame it currently fails the "recognizable as a molecule" bar.

Screenshots: `oxygen/oxygen--contact-sheet.png` (6-angle grid, blob-vs-resolved contrast visible
side by side); individual angles `oxygen/oxygen--front.png` (the blob),
`oxygen/oxygen--left-side.png` and `oxygen/oxygen--isometric.png` (clearly 2 atoms), plus
`--three-quarter-front-left.png`, `--three-quarter-front-right.png`, `--top-down-three-quarter.png`,
`--back.png`, `--right-side.png`, `--bottom-up-three-quarter.png`.

---

## carbon-dioxide.glb

**Component mapping:** `chemistry.json` → `molecules-and-bonding` → `starterMolecules: "Carbon
dioxide"`. Matches the doc (RCSB PDB ligand `CO2`, ideal coordinates; double bonds authored as
twin cylinders specifically for the "Bond highlighting" interactive component).

**Scientific/structural accuracy:** 3 atoms in a straight line — 1 black/dark-grey center (C) + 2
red ends (O). Color convention correct (C = black/dark grey, O = red). Linearity is unambiguous:
the `left-side` capture shows all three spheres in a perfectly horizontal row, and every other
angle shows a clean diagonal line — there is no angle where this looks bent or ambiguous, which is
exactly right for a linear molecule and the clearest structural read of the six assets tested.

**Mesh/material quality:** 7 meshes, 4 materials, no textures. Per the sidecar, the two C=O double
bonds are modeled as twin parallel cylinders (for future bond-highlighting), but like water/O2 the
oversized atom spheres fully hide the bond cylinders visually — not a defect, just means the
"double bond" distinction isn't visible in a static render (would need the app's own bond-
highlight interaction to surface it).

**Recognizability for a child audience:** Very good — 3 balls in a row, 2 colors, obviously a
straight-line molecule even to a young learner.

**Camera framing / bounding-box sanity:** Sane, `[1.308 × 0.870 × 2.253]` (post-tilt) — the long
axis is clearly the molecule's axis, default view already reads correctly (unlike O2, this
molecule's default-frame projection is not axis-collapsed).

**Transparency/material faults:** None.

**Animation:** Would add value (see catalog note) but less critical than for O2 — linearity is
already legible from the static default frame.

**Performance:** 126,816 bytes, tiny.

**Attribution:** Not required (CC0 RCSB PDB data).

**Verdict: PASS.**

Screenshots: `carbon-dioxide/carbon-dioxide--contact-sheet.png` (6-angle grid); individual angles
`carbon-dioxide/carbon-dioxide--front.png`, `--three-quarter-front-left.png`,
`--three-quarter-front-right.png`, `--top-down-three-quarter.png`, `--left-side.png`
(perfectly linear), `--right-side.png`, `--back.png`, `--bottom-up-three-quarter.png`,
`--isometric.png`.

---

## methane.glb

**Component mapping:** `chemistry.json` → `molecules-and-bonding` → `starterMolecules:
"Methane"`. Matches the doc (no RCSB CCD entry exists for plain CH4 — confirmed in the doc's §2 —
so this is authored from standard textbook tetrahedral geometry: 109.5° H-C-H, 1.09 Å C-H bonds;
uncopyrightable physical constants, correctly documented as project-owned).

**Scientific/structural accuracy:** 5 atoms — 1 dark/black center (C) + 4 white (H) around it.
Color convention correct. The tetrahedral arrangement is clearly legible: every captured angle
shows either a "two up / two down" cross pattern (front) or a classic "one H toward the viewer, 3
behind" tetrahedral silhouette (isometric, bottom-up), which is exactly the recognizable signature
of sp3 tetrahedral geometry — no view makes this look flat or planar.

**Mesh/material quality:** 9 meshes, 6 materials, no textures. Same overlapping-sphere convention
as the other molecules (bonds not visible as sticks, hidden inside spheres) — consistent, not a
defect specific to this asset.

**Recognizability for a child audience:** Very good — 1 dark ball surrounded by 4 lighter balls
reads clearly as "one atom with four things attached" even before a child knows the word
"tetrahedral."

**Camera framing / bounding-box sanity:** Sane, `[1.475 × 1.255 × 1.498]` (post-tilt) — good,
roughly cube-like bounding box appropriate for a tetrahedral molecule, no axis-collapse risk like
O2's linear case.

**Transparency/material faults:** None.

**Animation:** Would add value (see catalog note) — rotating through the tetrahedral shape is one
of the best "3D really matters here" teaching moments in this whole set.

**Performance:** 201,460 bytes, tiny.

**Attribution:** Not required (project-owned, public-domain physical constants).

**Verdict: PASS.**

Screenshots: `methane/methane--contact-sheet.png` (6-angle grid); individual angles
`methane/methane--front.png`, `--three-quarter-front-left.png`, `--three-quarter-front-right.png`,
`--top-down-three-quarter.png`, `--bottom-up-three-quarter.png`, `--left-side.png`,
`--right-side.png`, `--back.png`, `--isometric.png`.

---

## glucose.glb

**Component mapping:** `chemistry.json` → `molecules-and-bonding` → `starterMolecules:
"Glucose"`. Matches the doc (RCSB PDB ligand `GLC`, alpha-D-glucopyranose, ideal coordinates,
24 atoms matching C6H12O6 exactly per the doc's pre-verification).

**Scientific/structural accuracy:** Visually recounted directly from the `front` capture: 6
black/dark spheres (C), 6 red spheres (O, including the ring oxygen), and the remaining spheres
white (H) — atom count and color convention both check out against the documented 24-atom,
C6H12O6 claim. The six-membered pyranose ring is present in the geometry and partially readable in
the `top-down-three-quarter` angle, where a rough hexagonal arrangement of carbons/oxygens can be
traced.

**Mesh/material quality:** 48 meshes (24 atoms + ~24 bonds), 25 materials, no textures — by far
the most geometrically complex asset in this set, appropriately so for a 24-atom sugar.

**Recognizability for a child audience — the actual problem:** Unlike the other five molecules,
glucose's 24 overlapping same-size-ish spheres pack into a visually dense clump from nearly every
angle (`left-side` is the worst — a near-solid mass with no readable substructure). Even the
better angles (`front`, `top-down-three-quarter`) require real effort to pick the ring out from
the substituent -OH/-CH2OH groups. This is scientifically correct but a real recognizability
concern for a young learner audience: "molecule" reads clearly, but "ring" and "sugar shape"
mostly don't, at rest.

**Camera framing / bounding-box sanity:** Sane, `[4.653 × 3.637 × 2.557]` (post-tilt) — box is
appropriately larger/flatter than the small starter molecules, reflecting glucose's real bulk;
no degenerate axis.

**Transparency/material faults:** None.

**Animation:** Would help meaningfully here — slow rotation is the most practical way to let a
learner mentally resolve the ring from the clump, more so than for the simpler molecules.

**Performance:** 985,200 bytes — noticeably larger than the other four molecule files (which sit
at 82–202 KB) despite still having zero textures. This tracks with 48 meshes at default three.js
sphere/cylinder tessellation (same authoring pipeline as `atom.glb`) rather than any texture
bloat; still well under any reasonable per-asset budget, but if this catalog is revisited, lower
sphere segment counts (or instanced spheres) would cut this meaningfully without any visual loss
given how small each sphere renders on screen.

**Attribution:** Not required (CC0 RCSB PDB data).

**Verdict: CONDITIONAL** — structurally/scientifically correct, but recommend either exposing the
bond sticks (smaller atom radii) or leaning on rotation + a "highlight the ring" interaction
before this ships as a *first* introduction to glucose for a child; as a static default view it
under-delivers relative to the other five.

Screenshots: `glucose/glucose--contact-sheet.png` (6-angle grid); individual angles
`glucose/glucose--front.png`, `--three-quarter-front-left.png`, `--three-quarter-front-right.png`,
`--top-down-three-quarter.png`, `--left-side.png` (densest/worst angle),
`--right-side.png`, `--back.png`, `--bottom-up-three-quarter.png`, `--isometric.png`.

---

## sodium-chloride-lattice.glb

**Component mapping:** `chemistry.json` → `molecules-and-bonding` → `starterMolecules: "Sodium
chloride"`, **and** double-serves `periodic-table` (detailed: true) → ionic-lattice / periodic-
material example. Matches the doc exactly, including the documented rationale for authoring the
real rock-salt lattice instead of a fictitious "NaCl molecule" (NaCl has no discrete molecular
form) and the explicit, correctly-reasoned dual-use note in the sidecar (`doubleUse` field) — this
is a legitimate scientific reuse, not a flagship-asset duplication.

**Scientific/structural accuracy:** Clear 3×3×3 repeating cubic grid of alternating purple and
green spheres connected by visible rods along the lattice axes — exactly the rock-salt structure
the doc describes (a = 5.64 Å, alternating ions by (i+j+k) parity). Color convention: purple = Na+
and green = Cl- match the standard convention used by common molecular viewers (e.g. Jmol/PyMOL
default Na = violet/purple, Cl = green) — correct. This is unambiguously a repeating lattice, not
a single random cluster: every screenshot shows the grid structure with clean rows/columns/depth,
and the `isometric` and `top-down-three-quarter` angles show the cubic unit-cell repetition
especially clearly.

**Mesh/material quality:** 81 meshes (multiple ions + connecting rods), 28 materials, no textures.
Atom spheres here are sized proportionally smaller relative to spacing than in the small
molecules, which is exactly why the bond rods are visible here and not in the other five assets —
a real ball-and-stick look, the strongest "clean 3D, hotspot-driven" match to the Anatomy Atelier
bar in this whole set.

**Recognizability for a child audience:** Very good — the repeating pattern and two-color
alternation communicate "crystal/lattice, not a blob" immediately, more effectively than any of
the five molecules above.

**Camera framing / bounding-box sanity:** Sane, `[4.977 × 4.266 × 5.172]` (post-tilt) — roughly
cubic bounding box appropriate for a lattice fragment, no degenerate axis, default view already
shows the repeating structure clearly.

**Transparency/material faults:** None.

**Animation:** Would add value (see catalog note) but less critical than for the molecules — the
lattice pattern is already legible without rotation.

**Performance:** 1,206,556 bytes — the largest file in the set, again with zero textures. Same
explanation as glucose (81 default-tessellation spheres+rods, not texture bloat); still small in
absolute terms but the heaviest of the six, worth the same "could be optimized via lower sphere
segments or instancing if this catalog gets a performance pass" note.

**Attribution:** Not required (project-owned, public-domain crystallographic constants).

**Verdict: PASS.**

Screenshots: `sodium-chloride-lattice/sodium-chloride-lattice--contact-sheet.png` (6-angle grid);
individual angles `sodium-chloride-lattice/sodium-chloride-lattice--front.png`,
`--three-quarter-front-left.png`, `--three-quarter-front-right.png`,
`--top-down-three-quarter.png`, `--left-side.png`, `--right-side.png`, `--back.png`,
`--bottom-up-three-quarter.png`, `--isometric.png`.

---

## Cross-asset notes

- **No REJECTs.** All 6 GLBs loaded cleanly with GLTFLoader, no parse errors, no missing
  buffers/accessors, and no degenerate bounding boxes.
- **Two CONDITIONALs share a root cause:** both `oxygen.glb` and `glucose.glb` are structurally
  and scientifically correct (verified atom counts, verified CPK colors) but fail the
  child-recognizability bar from a *static default view* — oxygen because its default camera angle
  collapses two atoms into one blob, glucose because 24 overlapping spheres pack into a dense
  clump. Both are fixable without re-sourcing the underlying geometry: auto-rotate (already
  supported by `GenericModel`/`GenericViewer` at the composition level, no GLB change needed) is
  the cheapest mitigation for both; a per-asset orientation fix (oxygen) or smaller atom radii
  exposing bond sticks (glucose) would be the more thorough fix.
- **Taxonomy mapping is exact.** All 6 assets map 1:1 to `chemistry.json`'s
  `molecules-and-bonding.starterMolecules` list (Water, Oxygen, Carbon dioxide, Methane, Sodium
  chloride, Glucose), with the NaCl lattice additionally and correctly serving the
  `periodic-table` branch's ionic-lattice example need — matches `docs/assets/chemistry-structure.md`
  §1 exactly. None of these six are wired into `src/data/modelRegistry.ts` yet per that doc; this
  review does not change that.
