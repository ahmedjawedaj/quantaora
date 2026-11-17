# 3D-Modeling Commission Briefs — Asset Recovery Wave 2

**Role:** GAP/COMMISSION PLANNER. Read-only planning pass over Wave 1's sourcing docs
(`docs/assets/*.md`), `docs/ASSET-SOURCING.md`, `docs/COVERAGE-AUDIT-2026-08-18.md`, and
`content/taxonomy/*.json`. No code, `.glb`, or other agents' files were touched — this file is
this agent's only output.

Date: 2026-08-18.

## How to read this document

Each brief is for a component where Wave 1 found **no viable, actually-downloadable, license-clear
asset** (i.e. either nothing was found, or something was found but is blocked behind an
authenticated download the sourcing pass could not complete). Briefs are grouped by subject, and
within each subject by whether the branch is `"detailed": true` (ready for a full production brief)
or `"detailed": false` (flagged only per CLAUDE.md's content-hierarchy rule — no detailed brief
invented, but any candidate leads already found are carried forward so they aren't re-searched from
scratch next wave).

Every full brief follows the same 10-part template:
1. Taxonomy path + component name
2. Scientific correctness requirements
3. Separable nodes/hotspots
4. Animations needed
5. Poly/texture/file budget
6. Neutral pose / default framing (Anatomy Atelier stage convention)
7. Child-facing framing/complexity notes
8. Licensing deliverables required at handoff
9. Procedural-vs-commission call
10. Vetted candidate lead (if any), with its known blocker

**Standard licensing deliverable, referenced by every brief below** (matches the
`<name>.license.json` sidecar schema already used in `public/models/sourced/**`, e.g.
`chemistry-reactions/chemistry-lab-bench.license.json`): single-file `.glb` + a sidecar
`<name>.license.json` containing `sourceUrl`/commission record, creator, license/ownership grant
(project must receive at minimum a CC0- or CC-BY-equivalent redistribution right, or full
work-for-hire ownership if directly commissioned), `attributionRequired` + `attributionText` if any,
`redistributionStatus`, `dateSourced`, `fileSizeBytes`, `sha256`, and glTF structural-validation
counts (scene/node/mesh/material/texture/animation/accessor, declared-length-vs-file-size match) —
i.e. it must pass the same `validate-glb.mjs`-style check already used across every `sourced/**`
subdirectory. **Default framing convention** referenced by every brief: warm off-white stage
background `#faf8f4` (`src/components/explorer/GenericViewer.tsx`), matte `MeshStandardMaterial`
(roughness ~0.8–0.9, metalness 0 unless the real object is genuinely metallic), no harsh specular,
auto-rotate-safe silhouette (reads correctly from any horizontal rotation angle), default camera
framing so the whole object fits in frame with ~15% margin. **Default file-size target** unless
stated otherwise: **under 3MB, textures ≤2048px, single embedded `.glb`** (comfortably under the
15MB WARN threshold in `docs/3D-ASSET-QUALITY-GATE.md`, consistent with the bulk of the existing
corpus).

---

## 1. Physics — Mechanics & Energy (`content/taxonomy/physics.json` → `mechanics`, `energy`, both `"detailed": true`)

Primary source: `docs/assets/physics-mechanics.md`. Headline finding from that wave: **zero GLBs
downloaded** for this branch pair — every apparatus candidate that cleared the CC0/CC-BY license
bar lives on Sketchfab, and Sketchfab's file-download endpoint (`GET /v3/models/{uid}/download`)
returns `401` without an authenticated account/token, which the sourcing pass correctly did not try
to bypass. Poly Haven's full 521-model CC0 catalogue has **no** ramp/cart/pulley/pendulum/spring/
lever/balance-scale model at all. All 19 mechanics+energy components currently render via
`"modelType": "procedural"` Three.js geometry (nothing is broken today) — these briefs are about
whether a real apparatus mesh can raise the bar above procedural, not about fixing an outage.

### 1.1 Cart & Track
**Taxonomy path:** Physics > Mechanics > (Kinematics unit) > Motion cart interactive component >
Position, Distance, Displacement, Speed, Velocity, Momentum (collision-lab variant, two carts).
**Scientific correctness:** track must be a straight, level rail (no incline — that's brief 1.2);
tick marks evenly spaced at real 0.1 m intervals so a "read the ruler" interaction is dimensionally
honest; cart wheels must actually contact the rail (no floating/clipping) since kids will drag the
cart along it. For the Momentum variant, two carts must share identical wheel/axle geometry so mass
differences are communicated by body size/color, not by an accidental geometry mismatch.
**Separable nodes/hotspots:** `Track`, `Cart`, `CartWheelL`, `CartWheelR` (per spec §21 hotspot
convention — each must be independently selectable so "Touch it" can highlight the wheel vs. the
body vs. the track).
**Animations needed:** cart sliding along the track's local X-axis (driven by app state, not baked);
wheels spinning in sync with translation speed. No baked incline/tilt animation — that's out of
scope for this flat variant.
**Poly/texture/file budget:** 3–6k triangles total, ≤1024px textures (or flat vertex-color
materials, matching the rest of the mechanics apparatus tier), target <2MB, single `.glb`.
**Neutral pose / default framing:** track laid along the viewer's horizontal axis, cart centered at
rest, camera framed so ~1.5–2m of track is visible with 15% margin, warm off-white stage.
**Child-facing framing notes:** warm oak-wood track + amber/coral cart body (reuse the color
language already in `content/subjects/physics/mechanics/force/model-metadata.json`), rounded-box
cart silhouette — not a literal lab-supply-catalog PASCO/Vernier cart (avoid copying any vendor
branding, silhouette/proportions only).
**Licensing deliverables:** see standard deliverable above; if commissioned directly (no
third-party asset), the contract must grant the project full ownership/work-for-hire rights, no CC
attribution needed.
**Procedural-vs-commission call:** **commission is the right call here.** This is the single
highest-leverage apparatus in the whole subject — it's the shared rig for 9 of 19 mechanics/energy
components — and no CC0/CC-BY candidate exists anywhere (Poly Haven has none; Sketchfab has none
either, confirmed by targeted search, not just absence from a general catalogue scan). A procedural
box-on-a-line is what's already shipping; a real mesh is a genuine upgrade, not a redundant one.
**Vetted candidate lead:** none found. This is a clean-slate commission, not an auth-blocked fetch.

### 1.2 Ramp & Cart
**Taxonomy path:** Physics > Mechanics > Acceleration; Physics > Energy > Kinetic energy, Potential
energy, Efficiency (skate-ramp energy lab interactive component).
**Scientific correctness:** ramp incline angle should be modeled at a fixed, visually-clear ~30–40°
(the *parametric* angle-change interaction stays in the existing Three.js layer per
`energy/kinetic-energy/model-metadata.json` — the mesh only needs to look correct at its authored
angle, not physically hinge); ramp-to-flat transition must be a clean, continuous surface (no gap or
seam a cart would visibly clip through).
**Separable nodes/hotspots:** `Ramp`, `TrackRibbon`, `Cart` (reuse from 1.1), `Mat` (landing mat at
ramp base, for the "watch it slow down" friction/efficiency framing).
**Animations needed:** cart sliding down the ramp and onto the flat section (position-driven, not
baked); no camera or lighting animation needed.
**Poly/texture/file budget:** 4–8k triangles (ramp geometry adds modest complexity over 1.1), ≤1024px
textures, target <3MB.
**Neutral pose / default framing:** ramp descending left-to-right (or right-to-left, pick one and
stay consistent with 1.1's track orientation), cart at rest at the ramp's top, warm off-white stage.
**Child-facing framing notes:** same wood/amber material family as 1.1 for visual continuity between
the two apparatus variants; avoid a literal industrial skate-ramp/half-pipe look — this should read
as a classroom incline-plane demo, not a skate park.
**Licensing deliverables:** standard deliverable (commissioned original — work-for-hire).
**Procedural-vs-commission call:** **commission, sharing the cart mesh from 1.1.** Same rationale —
no CC0/CC-BY incline-and-cart candidate exists anywhere searched.
**Vetted candidate lead:** none found.

### 1.3 Spring / Newton Scale
**Taxonomy path:** Physics > Mechanics > Force, Weight.
**Scientific correctness:** dial face should show a real, readable 0–10 N scale (not decorative
numbers) so a "read the force" micro-skill is honest; spring coil must visibly compress/extend along
its axis, not just scale uniformly (a uniform scale reads as "the whole object shrinking," not "the
spring stretching").
**Separable nodes/hotspots:** `ScaleHousing`, `SpringCoil`, `DialFace`, `Hook`.
**Animations needed:** spring coil extension/compression driven by an applied-force app-state value;
dial needle rotating in sync (if a needle-style dial is used) or a sliding indicator (if a
slot-style dial is used).
**Poly/texture/file budget:** 1–3k triangles, ≤512px texture for the dial face numerals (or a baked
vertex-color/decal approach), target <1MB.
**Neutral pose / default framing:** scale hanging vertically at rest (unloaded), hook facing down,
centered in frame, warm off-white stage.
**Child-facing framing notes:** classic school "newton meter" spring balance silhouette — a hanging
or push-style scale, not an industrial dynamometer; pairs visually with the existing `force`
component's "wooden box + scale plate" `assetBrief`.
**Licensing deliverables:** standard deliverable (commissioned original).
**Procedural-vs-commission call:** **commission.** No spring-scale/Newton-meter candidate was found
on any source searched (Poly Haven, Sketchfab, BlenderKit, general web) — this is a genuine
clean-slate gap, not an auth-blocked fetch.
**Vetted candidate lead:** none found. (A generic automotive coil-spring mesh — "Suspension Coil" by
jolle.kemppainen, Sketchfab, CC-BY — exists as a *component reference* for coil geometry only; not a
full scale apparatus, and Sketchfab-auth-blocked anyway. Not worth pursuing as a fetch target on its
own.)

### 1.4 Friction Block & Plank
**Taxonomy path:** Physics > Mechanics > Friction, Normal force.
**Scientific correctness:** block must rest flush on the plank surface with correct contact (no
visible gap that would misrepresent normal force); plank should support two distinct surface-material
variants (smooth vs. textured) via material swap on the *same* mesh, so friction-coefficient
differences are taught by material, not by two different objects.
**Separable nodes/hotspots:** `Plank`, `Block`.
**Animations needed:** plank tilt (parametric/app-driven, mesh itself can be static-rigged for a
hinge rotation at the base) and block sliding along the plank surface once tilt exceeds the static
friction threshold — both app-state-driven, not baked.
**Poly/texture/file budget:** 1–2k triangles, two swappable ≤1024px surface textures (smooth vs.
textured), target <1.5MB.
**Neutral pose / default framing:** plank flat/level at rest, block centered on top, warm off-white
stage.
**Child-facing framing notes:** simple wooden block + wooden plank, no textured-surface material
should read as visually harsh (sandpaper-style bump map should be readable but not aggressive).
**Licensing deliverables:** standard deliverable (commissioned original).
**Procedural-vs-commission call:** **commission.** No block-on-plank/incline-friction candidate
found anywhere searched.
**Vetted candidate lead:** none found.

### 1.5 Balance Scale
**Taxonomy path:** Physics > Mechanics > Mass.
**Scientific correctness:** beam must pivot on a true central fulcrum (equal arm lengths either
side) so "equal mass = level beam" reads correctly; pans must be flat and large enough to visibly
hold the weight-cube set without clipping.
**Separable nodes/hotspots:** `Beam`, `Fulcrum`, `PanLeft`, `PanRight`, `WeightSet`.
**Animations needed:** beam tilting toward the heavier side (app-state-driven by the mass difference
entered), pans staying level relative to the ground as the beam tilts (a two-pan balance's pans are
gimbal-hung, not rigidly fixed to the beam — get this right or the physics reads wrong).
**Poly/texture/file budget:** 2–4k triangles, ≤1024px wood-grain + brass-tone textures, target
<2MB.
**Neutral pose / default framing:** beam level (balanced, no weights), pans empty, centered in
frame, warm off-white stage.
**Child-facing framing notes:** kid-legible two-pan beam balance — warm wood + brass-tone metal,
**not** an ornate "Lady Justice"/legal-scale styling (the closest Sketchfab candidate found leans
this way and should not be the visual reference).
**Licensing deliverables:** standard deliverable (commissioned original, or CC-BY attribution if the
Sketchfab lead below is fetched instead).
**Procedural-vs-commission call:** **try the fetch first, commission only if it stays blocked.**
Unlike 1.1–1.4, this component already has license-cleared candidates sitting one authenticated
download away — commissioning from scratch should be the fallback, not the first move.
**Vetted candidate lead:** three CC-BY Sketchfab candidates, all `downloadType: "free"` per the
Sketchfab public API but blocked by the `401` OAuth-download gate (no account/token available this
wave): **"Scales" by FlukierJupiter** (uid `2ed4e14b…`, 2,068 faces — best poly budget fit),
**"Medieval balance scales" by chaschinkaa** (uid `0893d688…`, native `.glb` export, but 45MB
all-formats bundle so actual glb-only size is unverified until fetched), and **"Balance Scale" by
Jean-Francois.Bonin** (uid `c880997f…`, 251k faces — would need heavy decimation, ornate "Lady
Justice" styling, lowest priority of the three). Recommend attempting FlukierJupiter's model first
if a Sketchfab account becomes available.

### 1.6 Pendulum
**Taxonomy path:** Physics > Mechanics > Gravity; Physics > Energy > Conservation of energy
(pendulum energy transfer interactive component).
**Scientific correctness:** rod/string length must stay visually constant through the swing (a
pendulum's defining constraint); bob should swing in a single vertical plane, arcing symmetrically
about the lowest point — asymmetric swing would misteach the physics.
**Separable nodes/hotspots:** `Stand`, `Rod`, `Bob`.
**Animations needed:** bob swinging (angle-driven by app state/physics sim, not a baked loop, so it
can be paused/scrubbed for the energy-transfer teaching moment at different swing angles).
**Poly/texture/file budget:** 1–2k triangles, target <1MB, minimal/no texture needed (flat-color
materials suffice for stand/rod/bob).
**Neutral pose / default framing:** bob at rest, hanging straight down from the stand, centered in
frame, warm off-white stage.
**Child-facing framing notes:** simple frame/stand + rod or string + sphere/cylinder bob — avoid a
Newton's-cradle-multi-ball framing (that's a different, more advanced concept) or an
over-engineered "Solidworks CAD" look (one rejected Sketchfab candidate leaned this way).
**Licensing deliverables:** standard deliverable (commissioned original, or CC-BY attribution if the
Sketchfab lead below is fetched).
**Procedural-vs-commission call:** **try the fetch first**, same reasoning as 1.5 — a light,
license-clear candidate is one authenticated download away.
**Vetted candidate lead:** **"Pendulum" by pedrobax** (Sketchfab, uid `5e385550…`), CC-BY confirmed
via the public API, `downloadType: "free"`, 632 faces (lightweight, good budget fit) — blocked by
the same `401` OAuth-download gate, no account available this wave. A second candidate, **"Pendulum
Experiment in Blender" by dradnon**, is CC-BY but only offers a `.blend` export (no glTF/GLB), so
even with Sketchfab access it would need a Blender re-export step — lower priority than pedrobax's
model.

### 1.7 Lever / Pulley Work Station
**Taxonomy path:** Physics > Energy > Work, Power.
**Scientific correctness:** if built as a lever — fulcrum must sit at a fixed, correctly-proportioned
point along the beam (not centered by default; a real first-class lever's effort/load arm ratio is
part of the teaching point) so "move the fulcrum, change the effort needed" reads correctly. If
built as a pulley — rope must visibly wrap the wheel with correct geometry (no rope clipping through
the pulley wheel) and the load must hang directly below the wheel's contact point, not offset.
**Separable nodes/hotspots:** Lever variant: `LeverArm`, `Fulcrum`, `Load`. Pulley variant: `Wheel`,
`Rope`, `Load`, `Frame`.
**Animations needed:** Lever: beam rotating about the fulcrum as effort force changes (app-driven).
Pulley: rope sliding around the wheel as the load is raised/lowered, wheel rotating in sync.
**Poly/texture/file budget:** 1.5–3k triangles, target <1.5MB.
**Neutral pose / default framing:** lever level at rest (no load applied) or pulley at rest with
load hanging static, centered in frame, warm off-white stage.
**Child-facing framing notes:** recommend the **lever** as primary (shares the plank/fulcrum
material language with brief 1.4, cheaper to build consistently) — a simple plank-on-a-fulcrum-block
with a weight on one end, not an industrial crane/hoist silhouette.
**Licensing deliverables:** standard deliverable (commissioned original — no single Sketchfab
candidate bundles a full lever+load or pulley+rope+load rig; individual parts exist but would still
need assembly).
**Procedural-vs-commission call:** **commission.** Individual lever-plank and single-pulley-wheel
meshes exist on Sketchfab (both CC-BY, both auth-blocked) but none is a complete rig — fetching one
would still leave assembly work, so a purpose-built commission is the more efficient path here,
unlike 1.5/1.6 where a single fetch would fully resolve the gap.
**Vetted candidate lead (component references only, not full rigs):** "Lever" by Spore_Explorer
(Sketchfab, CC-BY, 136 faces — too low-poly to be more than a placeholder); "Lever" by Car Wong
(Sketchfab, CC-BY, 896 faces); "Pulley" by LeakyRUS (Sketchfab, CC-BY, single wheel only, no
rope/frame/load); "Pulley" by harigoat (Sketchfab, CC-BY, 424 faces, `.stl` source geometry only).
All auth-blocked; useful only as proportion/silhouette references for the commission, not as fetch
targets.

### Physics > Heat And Thermodynamics — flagged, not detailed
`"detailed": false` in `content/taxonomy/physics.json` — no low-level items or interactive
components transcribed from the spec yet, and no `content/subjects/physics/heat-and-thermodynamics/`
directory exists. **Needs detail transcription before a brief can be written.** Head-start leads
already found (not fetched, both Sketchfab CC-BY, auth-blocked, belong to a physics-fields Sketchfab
lookup that overlapped this branch): "CC0 - Gear" by plaggy (uid `bb92a0e2…`, listed CC-BY despite
the title) and "Gears Mechanism" by max_imum (uid `af7b1dfa…`); "Thermometer" by Toss90 (uid
`f5711971…`, CC-BY). Carry these forward once the branch is SME-detailed — do not author content
against them yet.

---

## 2. Math (`content/taxonomy/math.json`)

Primary source: `docs/assets/math.md`. Headline finding: all 43 already-authored components across
5 `"detailed": true` math branches correctly ship as bespoke `procedural-three` builds (base-ten
blocks, fraction pizza, bead ratios, balance scale, dot array, protractor ring, spinner, unit-cube
box) with full custom `assetBrief`s — **sourcing an external GLB for any of these would be the wrong
call**, since the interaction contract (named nodes like `Regroupables`, `DigitPlate_Each`,
`ScaleControl`) is bespoke to the app, not a generic mesh any downloaded manipulative could satisfy.
The real gaps are two items the spec/catalogue names that aren't in the taxonomy's `lowLevelItems`
yet, plus one fully un-detailed branch.

### 2.1 Platonic / geometric solids
**Taxonomy path:** Math > Geometry (branch `"detailed": true`) — **note:** not yet a named
`lowLevelItems` entry in `content/taxonomy/math.json`'s geometry branch; this is a future content
addition the spec/catalogue calls for, not an existing taxonomy component. Brief is written now so
it's ready the moment the taxonomy item is added; do not treat this as authored content yet.
**Scientific correctness:** the 5 solids must be true regular polyhedra with flat, exact faces
(tetrahedron 4 faces, cube 6, octahedron 8, dodecahedron 12, icosahedron 20) — **not** smoothed or
subdivided (one rejected Sketchfab candidate, "Smooth Platonic Solids," fails specifically because
rounding contradicts the point of a Platonic solid); edge length normalized across all 5 so they
read as directly comparable on a shared tray.
**Separable nodes/hotspots:** one node per solid (`Tetrahedron`, `Cube`, `Octahedron`,
`Dodecahedron`, `Icosahedron`) plus a shared `Tray`/`Shelf` node; each solid needs a face/edge/vertex
counter label per spec's compare-tray convention.
**Animations needed:** individual spin (per-solid, for "Touch it" inspection) and a "compare" camera
move across the shared tray — both are app-driven interaction states, not baked animation.
**Poly/texture/file budget:** 1–3k triangles **per solid** (5–15k total across all 5) — this is
deliberately far lighter than any Sketchfab candidate found (the lightest rejected candidate alone
was 80 faces but under-detailed; the best-license one was 9,720 faces for the full set, more than
enough headroom to build clean instead). Target <1MB total.
**Neutral pose / default framing:** all 5 solids arranged on one shared tray/shelf, matching camera
framing already used by the `volume`/`angle` geometry components.
**Child-facing framing notes:** warm-paper material matching the Math palette (reuse the existing
`volume`/`angle` `materialNotes`), no photoreal glass/metal — this should look like a classroom
solid-shape kit, not a CAD reference render.
**Licensing deliverables:** standard deliverable (project-owned procedural build — no external
license needed if built per the recommendation below).
**Procedural-vs-commission call:** **procedural-script build is correct, not a sourced GLB.**
Platonic solids are exact mathematical objects — hand-authored geometry (same pattern as
`place-value`/`volume`/`angle`'s existing procedural-script builds) is both cheaper and more
scientifically correct than any downloaded mesh, and it gets the named-node/hotspot/compare-tray
control the app needs for free. Do not commission this one externally.
**Vetted candidate lead:** "Platonic Solids" by gmachnik (Sketchfab, uid `c6fa900…`, CC-BY,
9,720 faces, `isDownloadable: true` but auth-gate-blocked) — **useful only as a proportion/
arrangement reference image** for the procedural build, not a fetch target, since procedural is the
recommended path anyway.

### 2.2 Abacus
**Taxonomy path:** Math > Number-and-arithmetic (branch `"detailed": true`) — **note:** same nuance
as 2.1: not yet in the taxonomy's `lowLevelItems`, but is named in `docs/ASSET-LICENSES.md`'s CC-BY
import order and `docs/supplier/stem-os-asset-catalogue.md` (AST-0003, target path
`math/number-and-arithmetic/abacus`). No `module.json`/`lesson.md`/etc. exists yet — this is a
content-authoring gap as much as an asset gap.
**Scientific correctness:** rod/bead counts must match a real counting convention — either a
standard 10-bead-per-rod school abacus (simpler, better for younger learners) or a soroban layout
(upper deck 1 bead = 5, lower deck 4 beads = 1) — pick one and label it correctly; whichever is
chosen, bead position along the rod must map to an actual place-value read-out so the "running
total" interaction is mathematically honest, not decorative.
**Separable nodes/hotspots:** per-rod nodes (`Rod_1`…`Rod_10`) each with their own bead nodes
(`Bead_*`) so hotspots can bind to individual place values, matching the sibling `place-value`
component's node convention.
**Animations needed:** beads sliding along their rod on tap/drag (app-driven), with a running-total
readout ticking in sync — ties back conceptually to the `place-value` component.
**Poly/texture/file budget:** 6–10k triangles, target <2MB.
**Neutral pose / default framing:** frame upright, all beads at their "zero" rest position (typically
all pushed to one side), centered in frame, warm-paper Math-palette material.
**Child-facing framing notes:** match the existing procedural math components' warm, simplified
style — this is a teaching manipulative, not a museum antique-abacus replica.
**Licensing deliverables:** standard deliverable (project-owned procedural build recommended; CC-BY
attribution required if the Sketchfab lead below is fetched instead as a static reference).
**Procedural-vs-commission call:** **procedural-script build is the recommended primary path**
(consistent with all 10 sibling number-and-arithmetic components), for the same named-node/hotspot
reason as 2.1. The Sketchfab lead below is a legitimate secondary path but would need to be treated
as a **static reference/isolate-rotate-only model, not a drop-in replacement** for the drag-bead
interaction, since it wasn't built with this app's interaction contract in mind.
**Vetted candidate lead:** "Abacus" by pamruta (Sketchfab, uid `faf7e2cf…`), CC-BY confirmed,
77,848 faces (would need heavy decimation before use even if fetched), `isDownloadable: true` but
blocked by the `401` OAuth-download gate — the best real-object candidate found, worth a
authenticated re-check in a future wave once/if procedural is judged insufficient on its own.

### Math > Measurement — flagged, not detailed
`"detailed": false` in `content/taxonomy/math.json` — no low-level items authored. **Needs detail
transcription before a brief can be written.** The branch's likely eventual components (ruler,
protractor, scale/balance, tape measure) are simple, well-defined real objects and — once
SME-detailed — are expected to be easy procedural-script builds reusing the `angle` component's
existing `ProtractorRing` node pattern, rather than needing external sourcing at all. No candidate
leads to carry forward (no sourcing was attempted against an un-detailed branch, correctly).

---

## 3. Biology — Cell Biology / Genetics / Microbiology (`content/taxonomy/biology.json`, all three `"detailed": true`)

Primary source: `docs/assets/biology-cell.md`. This wave (BIO-CELL) actually landed 10 real GLBs
(DNA, E. coli, 3-piece influenza virus set, bacteriophage T4 capsid, polio capsid, ribosome, Golgi
apparatus — several oversized and flagged for a decimation pass, tracked in that doc's §4, not
repeated here since decimation is a processing task, not a commissioning one). The briefs below are
for what still has **no** downloaded asset at all.

### 3.1 Mitosis / cell division stages
**Taxonomy path:** Biology > Cell Biology > interactive component "Mitosis / cell division stages"
(explicit P0 in `docs/ASSET-SOURCING.md`'s priority queue).
**Scientific correctness:** needs 4–5 discrete, scientifically ordered stages (prophase, metaphase,
anaphase, telophase, optionally cytokinesis) showing chromosome condensation, spindle-fiber
formation, and nuclear-envelope breakdown/reformation in the correct sequence; cell silhouette must
stay consistent across all stages so a "scrub through mitosis" interaction reads as one continuous
object changing state, not five unrelated models.
**Separable nodes/hotspots:** per-stage root node (`Prophase`, `Metaphase`, `Anaphase`,
`Telophase`, optionally `Cytokinesis`), each internally exposing `Membrane`, `Chromosomes`,
`SpindleFibers`, `NuclearEnvelope` sub-nodes to match the existing cell-organelle hotspot pattern.
**Animations needed:** a scrub/slider control moving between the 5 stages (can be implemented as 5
discrete meshes cross-faded, or as one rigged mesh with a morph-target/blend-shape per stage —
either satisfies the "scrub through mitosis" interaction).
**Poly/texture/file budget:** match the existing `animal-cell-authored.glb` fidelity tier —
transparent membrane, readable chromosomes/spindle, no photoreal texturing. Target <2MB per stage
(<10MB for the full 5-stage set).
**Neutral pose / default framing:** same camera framing/scale as `animal-cell-authored.glb` so
switching between mitosis and the resting animal-cell view doesn't jar the learner.
**Child-facing framing notes:** same "friendly biology diagram" style as the existing authored cell
set — no gore/anatomical-realism cues; chromosomes as simple X-shapes, spindle fibers as thin lines,
not literal microscopy renders.
**Licensing deliverables:** standard deliverable (commissioned original / project-owned, via the
same `build-cell-glbs.mjs` authoring pipeline already used for `animal-cell-authored.glb` and
`neuron-authored.glb`).
**Procedural-vs-commission call:** **commission, using the existing authored-GLB pipeline.** The
only real candidate found (NIH 3D's "Stages of Mitosis / Whitefish blastula") is licensed
CC-BY-NC-SA — the NonCommercial clause is explicitly disallowed by this project's sourcing policy,
so this is a genuine license rejection, not a fetch-access problem. No workaround exists; must be
authored from scratch.
**Vetted candidate lead:** none usable. NIH 3D's model is license-rejected (see above) — it is a
reasonable *visual reference* for the "bas-relief mitosis stages" idea only, not fetchable under any
circumstance without a relicense from NIH.

### 3.2 Plant cell
**Taxonomy path:** Biology > Cell Biology > grouping "Plant cell."
**Scientific correctness:** must correctly include cell wall, large central vacuole, chloroplasts,
and correctly *omit* lysosomes/centrioles (present in the existing animal-cell asset but not
biologically present in a typical plant cell) — getting this differentiation right is the entire
pedagogical point of having a distinct plant-cell asset instead of reusing the animal one.
**Separable nodes/hotspots:** same convention as `animal-cell-authored.glb` plus new
`CellWall`, `Vacuole`, `Chloroplast` nodes.
**Animations needed:** none beyond whatever cutaway/rotate interaction the existing animal-cell
asset already supports (isolate/highlight per organelle).
**Poly/texture/file budget:** match `animal-cell-authored.glb`'s existing tier, target <5MB.
**Neutral pose / default framing:** same camera/scale convention as the existing animal-cell asset.
**Child-facing framing notes:** same friendly-diagram style, transparent outer membrane so interior
organelles stay visible without an explicit cutaway step.
**Licensing deliverables:** standard deliverable — CC-BY attribution if the Sketchfab lead below is
fetched, or project-owned if authored via `build-cell-glbs.mjs`.
**Procedural-vs-commission call:** **try the fetch first, commission only if it stays blocked.** A
genuinely good CC-BY candidate exists and is downloadable in principle — this is purely an
access/authentication gap, not a licensing or availability gap, so spending a commission budget here
before trying the authenticated fetch would be wasteful.
**Vetted candidate lead:** **"bio project: plant cell" by campbell-beharm** (Sketchfab, CC-BY
confirmed via API `license.slug=by`), `isDownloadable: true`, 56k faces (would need decimation),
labeled organelles (nucleus, ER, vacuole, Golgi, chloroplasts, mitochondria, lysosome, cell wall,
ribosomes) — the single best-fit candidate found, blocked only by the `401` Sketchfab OAuth-download
gate. Two alternates also exist, both same blocker: "Plant Cell | Biology" by okchs (CC-BY, 170k
faces) and "Plant Cell Organelles" by cvallance01 (CC-BY, 1.35M faces — would need heavy
decimation even with access). **If fetch access remains unavailable next wave, fall back to
commissioning** a companion to `animal-cell-authored.glb` via the `build-cell-glbs.mjs` pipeline
(adds cell wall/vacuole/chloroplasts, removes lysosomes/centrioles) to keep visual-language parity
with the existing animal cell.

### 3.3 Fungus, Protozoa
**Taxonomy path:** Biology > Microbiology > Fungus, Protozoa (low-level items).
**Scientific correctness:** Fungus item is served at organism level (a whole mushroom fruiting
body is an acceptable representation of "Fungus," not a fungal-cell cutaway); Protozoa should show
a recognizable single-celled organism silhouette (amoeba's irregular pseudopod shape, or paramecium's
elongated ciliate shape) rather than a generic blob.
**Separable nodes/hotspots:** single-node organism mesh is acceptable for both (no internal
cutaway required at this level, unlike the cell-biology organelle assets).
**Animations needed:** none required at minimum; a subtle idle pseudopod-flow (amoeba) or cilia-wave
(paramecium) loop would be a nice-to-have, not a blocker.
**Poly/texture/file budget:** target <1MB each (both candidate leads below are well under this
already).
**Neutral pose / default framing:** organism centered in frame, warm off-white stage, default
resting/idle shape.
**Child-facing framing notes:** organism-level realism is fine here (this isn't a cutaway-diagram
component) — keep colors friendly/biology-textbook rather than photoreal-grim microscopy.
**Licensing deliverables:** CC-BY attribution required for either lead below if fetched.
**Procedural-vs-commission call:** **try the fetch first.** Both leads are genuinely good, licensed,
lightweight candidates blocked purely by the Sketchfab auth gate — no reason to commission from
scratch before that path is exhausted.
**Vetted candidate lead:** Fungus: **"CC0 - Mushroom 2" by plaggy** (Sketchfab, listed CC-BY via API
despite the title's "CC0" claim, 2,096 faces) — best fungus candidate, auth-blocked. Protozoa: **
"Amoeba" by maliakshay394** (CC-BY, 26.8k faces) and a lighter alternate **"Amoeba" by
KadenCampbell** (CC-BY, 1,008 faces); **"Paramecium" by humbleprogamer** (CC-BY, 297k faces, would
need decimation). All auth-blocked, no license issue.

### 3.4 Vacuole, Chloroplast (standalone), plant Cell wall
**Taxonomy path:** Biology > Cell Biology > Vacuole, Chloroplast, Cell wall (plant) low-level items.
**Scientific correctness:** if built standalone (rather than folded into 3.2's plant-cell asset), a
chloroplast needs a correctly double-membraned structure with visible thylakoid stacks (grana) and
stroma — this is the one organelle here with enough internal structure to matter visually.
**Separable nodes/hotspots:** `OuterMembrane`, `InnerMembrane`, `Thylakoid`, `Stroma` if built as a
standalone chloroplast.
**Animations needed:** none required.
**Poly/texture/file budget:** target <1MB if built standalone.
**Neutral pose / default framing:** match the cutaway-organelle convention already used for
mitochondria in `animal-cell-authored.glb`.
**Child-facing framing notes:** same friendly cutaway-diagram style as the existing organelle set.
**Licensing deliverables:** standard deliverable (project-owned, via `build-cell-glbs.mjs`).
**Procedural-vs-commission call:** **lowest-risk path is folding these into the 3.2 plant-cell asset
in situ** (a correctly-built plant cell already contains vacuole/chloroplast/wall) rather than
sourcing or commissioning three isolated organelle props. Only commission a standalone chloroplast
if the Plants branch specifically needs one independent of the plant-cell asset (e.g. for its own
`chloroplast` low-level item, per `docs/assets/biology-life.md`'s note that this item is
"covered elsewhere, out of that wave's ownership").
**Vetted candidate lead:** none searched standalone (time-boxed in Wave 1) — no fetch lead to carry
forward; this is a from-scratch commission decision only if the fold-into-plant-cell path is
rejected.

### 3.5 Red blood cell, Muscle cell, Sperm cell, Egg cell
**Taxonomy path:** Biology > Cell Biology > specialized-cell groupings.
**Scientific correctness:** each has a very distinctive, well-known real silhouette (RBC's biconcave
disc, sperm's flagellum+head, egg's spherical cell+zona pellucida, muscle's striated fiber bundle) —
getting the silhouette right matters more than internal organelle detail for these.
**Separable nodes/hotspots:** single-node organism-level mesh is likely sufficient for each (unlike
the generic animal/plant cell assets which need full organelle hotspots).
**Animations needed:** sperm cell flagellum motion would be a strong nice-to-have; not required.
**Poly/texture/file budget:** target <1MB each.
**Neutral pose / default framing:** each cell centered in frame at its characteristic resting shape.
**Child-facing framing notes:** friendly biology-diagram coloring (red for RBC, etc.), not
photoreal/clinical.
**Licensing deliverables:** CC-BY attribution if a future-wave fetch finds a usable candidate, or
standard project-owned deliverable if commissioned.
**Procedural-vs-commission call:** **undetermined — flagged as not-yet-searched, not confirmed
absent.** Wave 1 explicitly did not exhaustively search for these under its time budget. Before
commissioning, run a proper NIH-3D/Sketchfab CC0/CC-BY search — these are common biology-education
subjects and candidates likely exist.
**Vetted candidate lead:** none searched yet. This is a "do the search" flag, not a "search came up
empty" flag.

### 3.6 Full-morphology bacteriophage T4 (optional upgrade)
**Taxonomy path:** Biology > Microbiology > Virus (already served by the accepted 3-piece influenza
set — this is an optional alternate/upgrade, not an unresolved core gap).
**Scientific correctness:** T4's iconic "lunar lander" silhouette requires capsid head + tail sheath
+ 6 tail fibers + baseplate, not just the capsid (which is all the currently-sourced CC0 candidate
provides).
**Separable nodes/hotspots:** `CapsidHead`, `TailSheath`, `TailFiber_1..6`, `Baseplate`.
**Animations needed:** none required; a tail-fiber "landing" animation would be a nice-to-have for
an infection-mechanism lesson, not required at this level.
**Poly/texture/file budget:** target <2MB, reusing the already-sourced CC0 capsid geometry (PDB
5VF3) as the head component rather than re-authoring it.
**Neutral pose / default framing:** upright "lander" pose, tail fibers extended, matching standard
T4 textbook diagrams.
**Child-facing framing notes:** same low-poly/vertex-color style as the rest of the authored cell
set — this should read as a diagram, not a cryo-EM render.
**Licensing deliverables:** standard deliverable (project-owned addition built on the already-CC0
capsid geometry).
**Procedural-vs-commission call:** **low priority — the influenza set already serves the Virus
component.** Only commission this if T4 specifically (rather than influenza) is wanted as the Virus
hero for a "recognizable virus shape" teaching moment.
**Vetted candidate lead:** n/a (this is an addition to an already-sourced CC0 asset, not a new fetch
target).

---

## 4. Biology — Life Sciences (Plants, Ecology, `content/taxonomy/biology.json`, both `"detailed": true`)

Primary source: `docs/assets/biology-life.md`. That wave sourced 17 real CC0 GLBs (Corn 5-stage
growth sequence, Flower 4-stage bud→bloom, Mushroom 5-stage decomposer sequence, Deer, Fox, a
vintage microscope) from Quaternius packs and Poly Haven — genuinely strong coverage. The gaps below
are what none of those cover.

### 4.1 Plant cross-section (Root / Stem+Xylem+Phloem / Leaf+Stomata)
**Taxonomy path:** Biology > Plants > Root, Stem, Leaf, Stomata, Xylem, Phloem (low-level items);
Plants > interactive component "Plant cross-section."
**Scientific correctness:** root system needs a visible taproot + root hairs meeting a soil cutaway
plane; stem cross-section must show xylem (inner, darker/thicker-walled) distinctly from phloem
(outer, thinner) as concentric rings, not a single undifferentiated vascular blob; leaf cross-section
must show, in order, upper epidermis → palisade mesophyll → spongy mesophyll → lower epidermis →
stomata on the underside — this ordering is the entire scientific content of the asset, so it can't
be approximated loosely.
**Separable nodes/hotspots:** Root: `Taproot`, `RootHairs`, `SoilCutaway`. Stem: `Xylem`, `Phloem`,
`VascularBundle`, `Pith`. Leaf: `UpperEpidermis`, `PalisadeMesophyll`, `SpongyMesophyll`,
`LowerEpidermis`, `Stomata`.
**Animations needed:** none required for a static cutaway; an optional "water/nutrient flow" arrow
animation along the xylem/phloem would support the transport-structure teaching point as a
nice-to-have.
**Poly/texture/file budget:** target <2MB per cutaway slab (root/stem/leaf can ship as 3 separate
files or one multi-part scene — either is acceptable), ≤1024px textures.
**Neutral pose / default framing:** each as a cutaway slab/wedge, consistent camera framing across
the three so switching between them doesn't jar the learner.
**Child-facing framing notes:** match the existing `animal-cell-authored.glb`/`neuron-authored.glb`
precedent (`public/models/cells/`, authored via `build-cell-glbs.mjs`) — this is the same "no clean
CC0 source exists for cutaway biological interiors" situation those assets were built to solve.
**Licensing deliverables:** standard deliverable (project-owned, via a `build-plant-glbs.mjs`
sibling script to the existing cell-authoring pipeline).
**Procedural-vs-commission call:** **commission via the authored-GLB pipeline.** The only candidate
found anywhere (a Sketchfab "Leaf Cross Section for Biology Task") carries Sketchfab's default "Free
Standard" license, which does **not** grant redistribution rights — this is a licensing rejection,
not an access block, so there is no fetch path to try first. This is a genuinely niche
educational-diagram category that open CC0 libraries (Poly Haven, Quaternius, Smithsonian, NIH 3D)
simply don't cover.
**Vetted candidate lead:** none usable (see above — the one candidate found is license-rejected, not
merely access-blocked).

### 4.2 Additional decomposer diversity (earthworm, decomposer beetle)
**Taxonomy path:** Biology > Ecology > Decomposer (low-level item; already partially filled by the
sourced 5-stage mushroom sequence, but a single fungus doesn't demonstrate decomposer *diversity*).
**Scientific correctness:** low bar here — a recognizable earthworm and/or beetle silhouette is
sufficient; no internal anatomy needed.
**Separable nodes/hotspots:** single-node organism mesh is sufficient.
**Animations needed:** none required; a simple crawl-cycle would be a nice-to-have for the earthworm.
**Poly/texture/file budget:** target <500KB each — these should be very light props.
**Neutral pose / default framing:** organism centered in frame at a natural resting pose.
**Child-facing framing notes:** same visual tier as the existing Quaternius packs already in the
repo (low-poly, flat-color, friendly) — should sit comfortably alongside Deer/Fox/Mushroom.
**Licensing deliverables:** CC0 preferred if fetched (matching the rest of the Quaternius-sourced
ecology set); standard deliverable if commissioned.
**Procedural-vs-commission call:** **re-search before committing to either path** — this is
explicitly lower priority than 4.1, and Wave 1 did not exhaustively search newer Quaternius packs or
Poly Haven's small-creature offerings before flagging it. Don't commission until that search is
actually done.
**Vetted candidate lead:** none searched yet (flagged "not fully researched," not "confirmed
absent").

### 4.3 Non-anatomy physiology equipment (stethoscope, thermometer, sphygmomanometer)
**Taxonomy path:** Biology > Human Physiology (branch `"detailed": true`) — supports
cause/effect-slider demonstration content adjacent to the organ-bound processes (breathing,
circulation, etc.), which stay anatomy-owned and out of scope here.
**Scientific correctness:** low bar — these are simple, universally recognizable instruments;
correct proportions (e.g. a stethoscope's chest-piece-to-tubing-to-earpiece ratio) is the only real
requirement.
**Separable nodes/hotspots:** single-node prop is sufficient for each.
**Animations needed:** none required.
**Poly/texture/file budget:** target <500KB each, matching the already-sourced vintage-microscope's
scale/weight tier.
**Neutral pose / default framing:** each prop at rest, centered in frame, warm off-white stage.
**Child-facing framing notes:** clean, simple, classroom-equipment styling — avoid the
overly-clinical/hospital look; match the microscope's approachable tone.
**Licensing deliverables:** standard deliverable (commissioned original — every search hit for this
category was a "known trap" per below).
**Procedural-vs-commission call:** **commission, and this is low priority.** Every stethoscope/
thermometer/BP-cuff search hit was TurboSquid/CGTrader/Free3D/Meshy — all explicitly named "known
traps" in `docs/ASSET-LICENSES.md` (royalty-free-with-terms or AI-generated, unverifiable
provenance). No taxonomy component currently blocks on this asset; it would only enrich physiology
process visuals, not fill a hard gap.
**Vetted candidate lead:** none usable — every hit found falls in the known-traps category.

---

## 5. Chemistry — Reactions & Apparatus (`chemical-reactions` `"detailed": true`)

Primary source: `docs/assets/chemistry-reactions.md`. That wave sourced two strong CC0 Poly Haven
assets (`chemistry-lab-bench.glb`, 50 named nodes covering beakers/test-tubes/retort-stand/burner/
reagent-bottles; `bunsen-burner.glb`, dedicated hero). Two apparatus items remain unfilled.

### 5.1 Erlenmeyer / conical flask
**Taxonomy path:** Chemistry > Chemical Reactions > apparatus (the single most recognizable
"chemistry" vessel silhouette, currently missing from the sourced lab-bench set which has beakers
and test tubes but no conical flask).
**Scientific correctness:** correct conical-flask proportions — narrow neck (~2.5cm diameter), wide
conical base (~9cm diameter), ~12cm height, consistent with a real ~250mL Erlenmeyer flask; thin
glass-shell thickness (a solid-looking flask would misrepresent labware).
**Separable nodes/hotspots:** single node `flask_erlenmeyer`; optional separate `LiquidFill` node so
runtime can swap fill color/level procedurally without touching the glass geometry.
**Animations needed:** none required for the glass itself; liquid-fill level/color changes stay a
runtime material/mesh-scale swap on the separate fill node, not a baked animation.
**Poly/texture/file budget:** 1.5–3k triangles, single node, target <1MB.
**Neutral pose / default framing:** upright, empty (or with a neutral placeholder fill level),
centered in frame, warm off-white stage.
**Child-facing framing notes:** clean clear-glass look (roughness ~0.05, transmission/IOR ~1.5 or a
faked transparent-glass shader consistent with the app's existing glass materials) — no chemical
hazard iconography.
**Licensing deliverables:** CC-BY attribution if the Sketchfab lead below is fetched; standard
deliverable if commissioned.
**Procedural-vs-commission call:** **try the fetch first.** A specific, well-matched CC-BY candidate
exists and is confirmed downloadable in principle — commissioning before exhausting that path would
be wasteful.
**Vetted candidate lead:** **"FREE Conical Flask | Laboratory | Low poly" by nakedsingularity**
(Sketchfab, uid `f2991abcaaa44616ad5f72d29a3d47b3`, CC-BY confirmed via API, `isDownloadable: true`,
2,742 tris, real-world scale) — the recommended first move, blocked only by the `401` Sketchfab
OAuth-download gate. Two weaker alternates exist if this one becomes unavailable: "erlenmeyer flask"
by itschemistry2 (CC-BY, thin provenance/no description) and "Erlenmeyer Flask Collection" by
3dLabWare (CC-BY, but ~100k faces — over-budget, would need re-decimation after fetch).

### 5.2 Lab funnel
**Taxonomy path:** Chemistry > Chemical Reactions > filtration/pouring apparatus.
**Scientific correctness:** standard conical bowl (~8cm top diameter) narrowing to a stem (~1cm
diameter × ~6cm length) — correct proportions matter for a "how filtration works" visual.
**Separable nodes/hotspots:** single node `funnel`.
**Animations needed:** none required.
**Poly/texture/file budget:** 500–1.5k triangles, target <500KB.
**Neutral pose / default framing:** upright, centered in frame, warm off-white stage.
**Child-facing framing notes:** thin-shell glass or matte plastic material matching the existing
lab-bench palette (`chemistry-lab-bench.glb`'s established material language).
**Licensing deliverables:** standard deliverable (commissioned original — no candidate found at
all, license or otherwise).
**Procedural-vs-commission call:** **commission.** Poly Haven's full 521-model catalogue has no
`funnel` match by name, tag, or description, and no clearly-licensed Sketchfab candidate surfaced
either — this is a genuine clean-slate gap, not an auth-blocked fetch.
**Vetted candidate lead:** none found.

### Chemistry > States Of Matter, Acids And Bases, Solutions — flagged, not detailed
All three `"detailed": false` in `content/taxonomy/chemistry.json`. **Needs detail transcription
before a brief can be written.** Two relevant notes to carry forward once these are SME-detailed:
(1) the already-sourced `chemistry-lab-bench.glb` beakers can serve as the physical container for
whatever states-of-matter content emerges — ice/water/steam themselves are good candidates to stay
**procedural** (particle/shader-driven melt/boil/condensation) rather than authored meshes,
consistent with this project's existing "reaction particles/bubbling/color-change effects may remain
procedural" guidance; (2) the lab-bench asset's 12 reagent dropper-bottle nodes are a bonus already
in hand for whatever Acids-And-Bases/Solutions apparatus need emerges (litmus paper/pH strips and
stirring rods were not pursued since the branches aren't detailed yet, correctly).

---

## 6. Chemistry — Structure (`periodic-table` `"detailed": true`; molecules already fully sourced)

Primary source: `docs/assets/chemistry-structure.md`. That wave authored 6 real molecule GLBs from
RCSB PDB ideal-coordinate data (water, oxygen, CO2, glucose from real crystallography; methane and
the NaCl ionic lattice from textbook geometry, since no clean PDB entry exists for either) — this is
excellent, scientifically-correct coverage and needs no further commissioning. Two periodic-table
apparatus items remain unfilled.

### 6.1 Periodic-table physical display stand
**Taxonomy path:** Chemistry > Periodic Table > display apparatus (anchor object for the "Element
cards" and "Group compare" interactive components).
**Scientific correctness:** must follow the real 18-column/7-row IUPAC layout exactly — this is
public-domain factual data, not a design choice, and getting the column/row/category assignment
wrong would directly misteach the periodic table's structure.
**Separable nodes/hotspots:** one node per element cell (118 total, or a representative subset if
element cards are otherwise handled by a 2D UI layer, per `dataviz`-skill-owned chart components) —
coordinate with whichever agent owns the periodic-table UI before committing to full 118-cell
geometry; if the cards themselves are 2D/UI, this asset may only need to be the physical
board/shelf frame, not 118 individually-modeled cells.
**Animations needed:** none required; cell selection/highlight is a material-swap interaction, not
baked animation.
**Poly/texture/file budget:** target <3MB (higher than most apparatus briefs in this doc given the
118-cell grid, if built as full geometry rather than a frame + 2D card overlay).
**Neutral pose / default framing:** flat board/shelf viewed at a slight angle so the full grid is
legible, warm off-white stage.
**Child-facing framing notes:** category color-coding should reuse the existing app palette (alkali
metal, halogen, noble gas, metal, nonmetal, metalloid), warm off-white material family matching the
Anatomy Atelier bar — not a sterile lab-poster look.
**Licensing deliverables:** CC-BY attribution if a lead below is fetched; standard deliverable if
commissioned.
**Procedural-vs-commission call:** **clarify UI vs. 3D ownership first, then likely commission the
frame only.** If element cards are already/planned as a 2D data-viz component (the periodic-table
branch's own doc calls trend heatmaps/element cards "data-driven UI/chart components, no GLB need"),
then this brief should shrink to just a physical board/frame object, not 118 modeled cells —
resolve that scope question before committing budget to full-grid geometry.
**Vetted candidate lead:** "Periodic Table" by sijosaji (Sketchfab, uid `0ac5b5cacc9f49f2b2732ae541
ad737b`, CC-BY, auth-blocked) — best candidate found; "The 3D Periodic Table" by
TheOfficialApolloIndustries (uid `09cd9683c4244eba9167a083c7298804`, CC-BY, auth-blocked) as a
backup. Both are full-grid 3D boards, useful as a reference for whichever scope (frame-only vs.
full-grid) is ultimately chosen.

### 6.2 Labeled metal / nonmetal / metalloid / noble-gas specimen set
**Taxonomy path:** Chemistry > Periodic Table > Metal, Nonmetal, Metalloid, Noble gas (low-level
items).
**Scientific correctness:** each of the 4 samples must visually communicate its real category
property — metal: visible luster/crystalline grain; nonmetal: a genuinely nonmetal-looking material
(sulfur crystal cluster or graphite flake, not a shiny metal-look reused with a different color);
metalloid: silicon's characteristic wafer/ingot look (could reuse the NaCl lattice's
already-proven authoring pattern extended to a silicon diamond-cubic lattice); noble gas: since
noble gases have no solid form at room temperature, a sealed glass ampoule with a
characteristic glow-discharge color (e.g. neon's red-orange) is the scientifically honest way to
represent one, not a fake "solid neon" object.
**Separable nodes/hotspots:** one node per sample (`MetalSample`, `NonmetalSample`,
`MetalloidSample`, `NobleGasAmpoule`), each independently selectable for a category-compare
interaction.
**Animations needed:** none required; an optional glow-discharge shimmer on the noble-gas ampoule
would be a nice-to-have.
**Poly/texture/file budget:** target <2MB total across all 4 samples, warm off-white / clean-3D
material language matching `atom.glb`.
**Neutral pose / default framing:** all 4 samples arranged for side-by-side comparison, consistent
scale across all 4 despite their different real-world sizes (comparability matters more than literal
scale accuracy here).
**Child-facing framing notes:** should read as a friendly "compare 4 rocks/objects" tray, not a
hazardous-materials specimen case.
**Licensing deliverables:** standard deliverable (commissioned original — no candidate covers all 4
categories together; the closest individual leads below are auth-blocked anyway).
**Procedural-vs-commission call:** **commission, extending the existing lattice-authoring pattern.**
No CC0/no-auth-download source publishes a labeled 4-category elemental-specimen set (RCSB is
molecules/macromolecules, not raw elements; Poly Haven's only near-hits were reaction glassware and
decorative desert rocks, neither a fit). The metalloid sample specifically should reuse
`sodium-chloride-lattice.glb`'s authoring pipeline rather than being sourced externally, since that
pipeline already proves out for crystallographic lattice geometry.
**Vetted candidate lead:** "Silicon Crystal Lattice" by lydiathelee (Sketchfab, CC-BY, auth-blocked)
— metalloid reference only; "Face-Centered Cubic (FCC) Lattice Brillouin Zone" by basir.bsmrstu
(CC-BY, auth-blocked) — generic metal-lattice reference only. Neither is a fetch target given the
recommendation to author the full 4-sample set as one coherent commission instead.

---

## 7. Physics — Electricity (`"detailed": true`)

Primary source: `docs/assets/physics-fields.md`. That wave sourced 4 real CC0 Poly Haven assets
(`bulb.glb`, `wire-cable-set.glb`, `compass.glb`, `lens.glb` as a magnifying-glass proxy). Four
Electricity-branch apparatus items remain unfilled — all four have license-clear Sketchfab
candidates already identified, blocked only by the same Sketchfab auth gate seen throughout this
document.

### 7.1 Battery
**Taxonomy path:** Physics > Electricity > Battery (low-level item).
**Scientific correctness:** correct AA/C-cell proportions (~50mm × 14mm for AA), a flat negative
terminal clearly distinguished from a raised positive nub — the +/− distinction is the entire
teaching point for circuit-polarity lessons and must be unambiguous at a glance.
**Separable nodes/hotspots:** `Body`, `PositiveTerminal`, `NegativeTerminal`.
**Animations needed:** none required.
**Poly/texture/file budget:** 500–1.5k triangles, target <500KB, wraparound label can be a simple
two-tone material rather than a printed decal.
**Neutral pose / default framing:** upright, centered in frame, warm off-white stage.
**Child-facing framing notes:** standard AA-battery look; alternative brief if the branch wants a
"how batteries work" angle instead of a modern cell: a historic voltaic/trough cell (glass jar +
metal plates) — pick one framing, not both, to avoid diluting the component's identity.
**Licensing deliverables:** standard deliverable (commissioned original).
**Procedural-vs-commission call:** **commission.** No qualifying candidate was found on any source
(Poly Haven, Sketchfab CC0/CC-BY, TurboSquid-free, CGTrader-free) — genuinely absent, not
auth-blocked.
**Vetted candidate lead:** none found.

### 7.2 Switch
**Taxonomy path:** Physics > Electricity > Switch (low-level item).
**Scientific correctness:** must show two visible states (open/closed) with metal contacts visibly
touching (closed) or separated (open) — kids need to *see why* current stops, not just infer it from
a toggle position.
**Separable nodes/hotspots:** `Base`, `Lever`, `ContactA`, `ContactB`.
**Animations needed:** lever/hinge rotation between open and closed states, app-driven.
**Poly/texture/file budget:** 500–1.5k triangles, target <500KB.
**Neutral pose / default framing:** default to the closed (circuit-complete) state at rest, centered
in frame.
**Child-facing framing notes:** recommend a classic **knife switch** silhouette over a wall-toggle
switch — more legible for teaching "why breaking the circuit stops the bulb" than the two
wall-toggle Sketchfab candidates found.
**Licensing deliverables:** CC-BY attribution if a lead below is fetched; standard deliverable if
commissioned.
**Procedural-vs-commission call:** **try the fetch first**, but note both leads are wall-toggle
switches (a weaker apparatus choice than the recommended knife switch) — if commissioning anyway to
get the better knife-switch pedagogy, that's a reasonable call to make directly rather than fetching
a worse-fit asset just to save the commission budget.
**Vetted candidate lead:** "Simple Light Switch" by BillieBones (Sketchfab, CC-BY, auth-blocked) and
"Light Switch" by Avot (CC-BY, auth-blocked) — both wall-toggle switches, both blocked by the same
`401` gate.

### 7.3 Resistor
**Taxonomy path:** Physics > Electricity > Resistance (served visually by a Resistor apparatus
object).
**Scientific correctness:** standard axial resistor with 4 color bands and two wire leads — the
teaching value is almost entirely in the color-band material accuracy (resistor color code is real,
standardized data), not mesh complexity.
**Separable nodes/hotspots:** `Body`, `Lead_1`, `Lead_2`, `ColorBand_1..4`.
**Animations needed:** none required.
**Poly/texture/file budget:** very cheap — a capsule + two thin cylinders, target <200KB. Flagged in
the source doc as "a good first commission candidate since it is cheap to build well."
**Neutral pose / default framing:** horizontal, centered in frame, leads extending symmetrically.
**Child-facing framing notes:** color bands must use the real standardized resistor color code, not
arbitrary colors, if a specific resistance value is ever taught against this asset.
**Licensing deliverables:** CC-BY attribution if the lead below is fetched; standard deliverable if
commissioned.
**Procedural-vs-commission call:** **commission — cheapest, highest-confidence win in this whole
document.** Given the trivial geometry, commissioning directly is arguably more efficient than
chasing the Sketchfab auth path for this one specifically.
**Vetted candidate lead:** part of "[CC0] Set of Electronic Components" by literallylara (Sketchfab)
— note the license-label mismatch already flagged by Wave 1: the model's own title claims CC0 but
Sketchfab's API reports the account's actual grant as CC Attribution; re-verify on the model page
before any future import regardless of which path is chosen.

### 7.4 Breadboard
**Taxonomy path:** Physics > Electricity > Circuit builder (breadboard as a physical prop within
it).
**Scientific correctness:** needs a legible hole-grid texture/normal map at standard breadboard
spacing, plus red/blue power rails along the edges — a flat grey box (the failure mode of the
weakest rejected candidate) doesn't read as a real breadboard.
**Separable nodes/hotspots:** single node is likely sufficient (`Breadboard`) since the internal
hole grid is a texture, not separate geometry per hole.
**Animations needed:** none required.
**Poly/texture/file budget:** simple box geometry, but needs a genuinely detailed ≤2048px hole-grid
normal/diffuse texture to read correctly — this is a texture-budget item more than a poly-budget one.
**Neutral pose / default framing:** flat, centered in frame, warm off-white stage.
**Child-facing framing notes:** standard solderless-breadboard look; avoid the "generic grey box"
failure mode explicitly called out in the rejected 12-face Sketchfab candidate.
**Licensing deliverables:** CC-BY attribution if a lead below is fetched; standard deliverable if
commissioned.
**Procedural-vs-commission call:** **try the fetch first**, but the two leads found are lower
priority than for other components: one (Matys's "Arduino Breadboard - Low poly") is a reasonable
candidate; the other (TrentPierce's "Simple Protoboard," 12 faces) already failed the "inspectable"
bar on inspection and should not be pursued even with auth access.
**Vetted candidate lead:** "Arduino Breadboard - Low poly" by Matys (Sketchfab, CC-BY, auth-blocked)
— the viable one; "Simple Protoboard" by TrentPierce (CC-BY, auth-blocked, but independently
rejected for being too low-poly — do not fetch even if access becomes available).

### Physics > Magnetism, Light And Optics, Sound / Waves — flagged, not detailed
All `"detailed": false` in `content/taxonomy/physics.json`. **Needs detail transcription before a
brief can be written.** Per CLAUDE.md, no pedagogical/scientific-correctness brief is authored for
these — the physical objects below are named in `docs/assets/physics-fields.md` as apparatus needs
that wave pre-sourced *ahead of* content authoring (its own words: "should not be read as
confirmation that content exists yet"). Carrying forward the candidate leads only, so a future wave
doesn't re-search from scratch once these branches are SME-detailed:

| Object | Branch | Lead (all Sketchfab CC-BY, all auth-blocked unless noted) |
| --- | --- | --- |
| Bar magnet | Magnetism | "Cartridg Bar Magnet V2" by GaudiLabs |
| Horseshoe magnet | Magnetism | "Horseshoe Magnet" by ArchieCGD; alternate by Louis DeScioli |
| Prism | Light And Optics | **None found anywhere** (Poly Haven, Sketchfab CC0/CC-BY, TurboSquid-free, CGTrader-free, Meshy) — clean-slate commission territory whenever this branch is detailed |
| Mirror | Light And Optics | Poly Haven `ornate_mirror_01` (CC0, no-auth) exists but is rejected for being a decorative full-length ornate mirror, not lab optics apparatus — a plain classroom mirror-on-a-stand would need to be commissioned |
| Ray box | Light And Optics | **None found anywhere** — clean-slate commission territory |
| Tuning fork | Sound/Waves | "Resonant Tuning Fork" by The_Vague_Dragon, 396 faces |
| Speaker | Sound/Waves | "SPEAKERS" by ZIRODESIGN. Poly Haven `boombox` (CC0, no-auth) exists but is rejected — a sealed enclosure hides the cone/diaphragm the component needs to teach |
| Slinky | Sound/Waves | "Slinky Toy" by Studio Lab — note the stretch/compress motion itself may be better served procedurally (a spring-simulation-driven animated coil) with this mesh only as the rest-state anchor, once the branch is detailed |

`lens.glb` (Poly Haven `magnifying_glass_01`, CC0, already downloaded) is a **partial fit** for
Light-And-Optics' eventual Lens component — it's a handheld magnifier, not a bare ray-diagram-style
biconvex/biconcave lens. A purpose-built lens brief should be written once the branch is detailed;
not written now per the flag-only rule.

---

## 8. Space (`solar-system`, `stars`, `galaxies`, `earth-in-space` all `"detailed": true`)

Primary source: `docs/assets/space.md`. This is the best-covered subject in the whole recovery
effort — that wave landed 26 real public-domain NASA GLBs (all 8 planets with real relief geometry,
10 moons including irregular Phobos/Deimos shape models, Pluto/Ceres, Bennu/Vesta asteroids, 3
telescopes, the Perseverance rover). The gaps below are genuinely absent from any NASA/ESA/
Smithsonian source searched, not auth-blocked.

### 8.1 Star lifecycle stages (main-sequence, red giant, white dwarf, neutron star, black hole)
**Taxonomy path:** Space > Stars > Main-sequence star, Red giant, White dwarf, Neutron star, Black
hole (low-level items; Protostar and Supernova/remnant stages already have real assets:
`bp-tauri.glb` and 4 remnant GLBs).
**Scientific correctness:** relative scale contrast between stages matters more than surface detail
— a white dwarf reads correctly mainly by being small and searingly bright/dense-looking next to a
much larger red giant, not by any geometric complexity. Black hole is the one stage where geometry
carries real meaning: accretion-disk proportions and photon-ring/lensing appearance should be
grounded in real EHT M87*/Sgr A* imagery (public domain, NSF/EHT Collaboration), not invented.
**Separable nodes/hotspots:** per-stage single-sphere node for main-sequence/red-giant/white-dwarf;
neutron star adds `PolarJet_1`, `PolarJet_2` nodes; black hole adds `AccretionDisk`,
`EventHorizon`, `PhotonRing`.
**Animations needed:** none required for the simple-sphere stages; black hole's accretion disk could
support a slow rotation loop as a nice-to-have.
**Poly/texture/file budget:** main-sequence/red-giant/white-dwarf: trivial (a sphere + shader/color
ramp) — likely near-zero incremental geometry budget. Black hole: target <1MB for the disk torus +
event-horizon sphere.
**Neutral pose / default framing:** each stage centered in frame at a scale appropriate to sell the
size contrast against neighboring stages in a lifecycle-sequence view.
**Child-facing framing notes:** avoid over-literal "scary void" black-hole imagery — keep the
color/shader treatment consistent with the app's warm, approachable tone even for this concept.
**Licensing deliverables:** standard deliverable (commissioned/procedural — no external asset
exists to license).
**Procedural-vs-commission call:** **mostly procedural is the right call, be honest about it.**
Main-sequence/red-giant/white-dwarf/neutron-star bodies are all physically simple spheres whose
visual interest is almost entirely in shading/color/physics rather than surface geometry — NASA
itself represents these as videos/illustrations, not meshes, for exactly this reason. **Recommend
prototyping a shader/color-ramp sphere before commissioning any bespoke geometry** for these four.
**Black hole is the one exception** where bespoke geometry (the accretion disk torus + photon-ring
shader) meaningfully beats a placeholder, since a plain sphere communicates nothing about a black
hole — this one is worth commissioning/authoring directly.
**Vetted candidate lead:** none — confirmed absent from NASA 3D Resources, NASA Science, and
Smithsonian 3D, not merely access-blocked.

### 8.2 Galaxies (Milky Way, spiral, elliptical, irregular, star cluster, galactic center)
**Taxonomy path:** Space > Galaxies > Milky Way, spiral galaxy, elliptical galaxy, irregular
galaxy, star cluster, galactic center (low-level items; `crab-nebula.glb` already dual-serves the
Nebula item).
**Scientific correctness:** if built at all as geometry, spiral-arm structure/proportions should be
grounded in real reference imagery (NASA/ESA Hubble press-release Milky Way illustrations, public
domain) rather than invented arm counts/pitch angles.
**Separable nodes/hotspots:** n/a if procedural (see call below) — a particle system's "nodes" are
generated parameters (star count, arm count, color), not authored mesh hotspots.
**Animations needed:** slow rotation is the obvious one if this ships as any kind of 3D object;
already exists in the current procedural particle-disk implementation per
`docs/COVERAGE-AUDIT-2026-08-18.md`'s note that Galaxies already has 7 distinct procedural
compositions live in production.
**Poly/texture/file budget:** n/a for the procedural path (recommended); if a static "hero"
image/model is still wanted for a card view, target <1MB.
**Neutral pose / default framing:** n/a for the procedural path; a static hero would follow the
standard warm off-white stage convention.
**Child-facing framing notes:** n/a for the procedural path.
**Licensing deliverables:** n/a for the procedural path; reference-imagery-only for a static hero
(NASA/ESA Hubble illustrations are public domain and don't need a license grant, only correct
attribution as a courtesy).
**Procedural-vs-commission call:** **procedural is very likely the correct call, and this project
already has 7 working procedural galaxy compositions in production** (per the coverage audit) —
galaxies are literally star-particle distributions at the scale being depicted, unlike a planet or
moon which is one solid body. **Do not commission a static galaxy mesh without first confirming the
existing procedural galaxies are actually inadequate** — Wave 1's own space doc recommends
prototyping the procedural route further before spending any commission budget here, and this
planner agrees based on what's already shipping.
**Vetted candidate lead:** none usable — every Sketchfab galaxy listing found (Milky Way and
generic spiral/elliptical/irregular searches) was either an unclear/store-listing license or a
stylized hobbyist render, not a verified NASA/ESA source; none met the CC0/CC-BY + verified-source
bar. Not a fetch target regardless of the procedural-vs-commission call above.

### 8.3 Comet nucleus
**Taxonomy path:** Space > Solar System > Comets (`otherObjects`).
**Scientific correctness:** a real rubble-pile/irregular nucleus shape (67P's bilobed "rubber duck"
shape is the most famous real reference) rather than a generic asteroid-style rock, if geometry is
authored; coma/tail must stay dynamic/procedural regardless of nucleus source (it's inherently a
gas/dust plume, not a solid shape).
**Separable nodes/hotspots:** `Nucleus` (single node sufficient); coma/tail is a separate procedural
particle system, not a mesh node.
**Animations needed:** none for the nucleus itself; coma/tail motion is procedural, out of this
brief's scope.
**Poly/texture/file budget:** target <2MB if commissioned, matching the Bennu/Vesta irregular-body
tier already in the corpus.
**Neutral pose / default framing:** nucleus alone (no coma/tail rendered) at rest, standard space
asset framing.
**Child-facing framing notes:** match the existing Bennu/Vesta asteroid-shape-model presentation
style for visual consistency within the `otherObjects` category.
**Licensing deliverables:** if the ESA lead below clears legal review: standard CC0/CC-BY deliverable
per ESA's actual grant (must be re-verified, not assumed); if commissioned: standard deliverable.
**Procedural-vs-commission call:** **pursue the ESA license inquiry before commissioning.** A real
shape model (67P, from ESA/Rosetta's OSIRIS team) exists and is scientifically ideal — commissioning
an invented rubble-pile shape when a real one might become available cheaply (a licensing
conversation, not a re-modeling effort) is the less efficient path to try first.
**Vetted candidate lead:** Comet 67P/Churyumov-Gerasimenko shape model
(https://sci.esa.int/web/rosetta/-/54728-shape-model-of-comet-67p, ESA/Rosetta OSIRIS team) — **not
a Sketchfab-auth-gate case**, a genuine unresolved-license case: the page did not confirm
CC0/CC-BY redistribution rights, and the only available formats are `.obj`/`.wrl` (needs conversion
to `.glb` regardless of the license outcome). Needs a direct license inquiry to ESA's Rosetta team,
not a download attempt. A secondary, unrelated NASA-mission lead worth checking first (not yet
searched): Deep Impact/EPOXI's Tempel 1 or Hartley 2 imagery, which would likely carry the same
clean U.S.-government public-domain status as the rest of this wave's NASA finds.
**Fallback if no license clears:** a commissioned low-poly "rubble pile" nucleus mesh with a
procedural tail/coma, per the source doc's own recommendation.

### 8.4 Eris, Haumea, Makemake (dwarf planets)
**Taxonomy path:** Space > Solar System > Eris, Haumea, Makemake (dwarf planets, `otherObjects`/
planet-adjacent low-level items).
**Scientific correctness:** these are small, distant, poorly-imaged bodies — real relief/topography
data plausibly doesn't exist from any mission yet, unlike Pluto/Ceres which had dedicated
NASA-mission imaging.
**Procedural-vs-commission call — this is the honest recommendation, not a brief to commission:**
**do not commission invented surface detail.** Recommend a **textured-sphere fallback**, matching
the exact approach this project already used (and accepted) for all 8 main planets *before* this
wave's real-relief-geometry upgrade — i.e. the pre-upgrade texture-only approach is a legitimate,
scientifically honest choice here specifically because inventing surface relief for bodies with no
real imaging data would be actively wrong, not just lower-effort. No commission brief is warranted;
this is a "confirm the texture-only fallback is intentional, don't chase a mesh" flag.
**Vetted candidate lead:** none — no NASA authored 3D model found for any of the three (Pluto and
Ceres were the only dwarf planets with dedicated `science.nasa.gov` resource pages).

### Space — other branches, flagged, not detailed
`gravity-and-orbits`, `moons` (its actual members are already covered under `solar-system`, see
§8 above — no separate gap), `asteroids-and-comets`, `space-exploration`, `cosmology-foundations`,
`telescopes-and-observation` are all `"detailed": false` in `content/taxonomy/space.json`. **Needs
detail transcription before a brief can be written**, except note: `telescopes-and-observation`
(Hubble/JWST/Chandra) and `space-exploration` (Perseverance rover) already have real assets sourced
and sitting ready per the space wave's explicit instruction to pre-source these regardless of
branch-detail status — no further commissioning action needed there whenever those branches are
authored. `cosmology-foundations` has no defined component list yet even to pre-source against.

---

## Summary

| Subject area | Full commission briefs written | Flagged-only (branch `detailed: false`) |
| --- | --- | --- |
| Physics — Mechanics & Energy | 7 (Cart & Track, Ramp & Cart, Spring/Newton Scale, Friction Block & Plank, Balance Scale, Pendulum, Lever/Pulley) | 1 branch (Heat And Thermodynamics) |
| Math | 2 (Platonic solids, Abacus — both pending taxonomy-item addition within an already-detailed branch) | 1 branch (Measurement) |
| Biology — Cell/Genetics/Microbiology | 6 (Mitosis stages, Plant cell, Fungus/Protozoa, Vacuole/Chloroplast/Cell wall, RBC/Muscle/Sperm/Egg, T4 phage upgrade) | 0 (all 3 branches in scope are detailed) |
| Biology — Life Sciences | 3 (Plant cross-section, Decomposer diversity, Physiology equipment) | 0 (both branches in scope are detailed) |
| Chemistry — Reactions | 2 (Erlenmeyer flask, Lab funnel) | 3 branches (States Of Matter, Acids And Bases, Solutions) |
| Chemistry — Structure | 2 (Periodic-table stand, Element specimen set) | 0 (branch in scope is detailed) |
| Physics — Electricity/Fields | 4 (Battery, Switch, Resistor, Breadboard) | 4 branches (Magnetism, Light And Optics, Sound, Waves) — leads carried forward in a table, not full briefs |
| Space | 4 (Star lifecycle, Galaxies, Comet nucleus, Eris/Haumea/Makemake — last one recommends *against* commissioning) | 6 branches (Gravity And Orbits, Moons[no separate gap], Asteroids And Comets, Space Exploration, Cosmology Foundations, Telescopes And Observation) |
| **Total** | **30 full briefs** | **~15 branches flagged, not authored** |

Of the 30 full briefs, 3 explicitly recommend **against** commissioning as the near-term answer
(Platonic solids and Abacus — procedural-script builds; star lifecycle stages 1–4 of 5 — shader/
color-ramp spheres; galaxies — existing procedural particle system; Eris/Haumea/Makemake —
textured-sphere fallback, no mesh work at all), and roughly a third of the remainder recommend
attempting an already-identified, license-cleared Sketchfab fetch (once an authenticated account is
available) before spending commission budget.
