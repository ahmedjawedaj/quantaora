# Physics — Fields (Electricity / Magnetism / Optics) — Visual Acceptance Review

Reviewer: PHYSICS-FIELDS visual acceptance agent, Asset Recovery Wave 2.
Date: 2026-08-18.
Scope: render-inspect the 4 `.glb` files under
`quantaora-app/public/models/sourced/physics-fields/` that were previously only
structurally validated (never opened in a 3D viewer). Anatomy models are out of scope and were
not touched.

Method: headless Chromium (Google Chrome 151, `--use-gl=swiftshader --use-angle=swiftshader
--enable-unsafe-swiftshader`) driving a Three.js scene built to match the app's real viewer
stage exactly (`src/components/explorer/GenericViewer.tsx`, read-only reference): background
`#faf8f4`; `ambientLight` `#fff4e6` @ 0.7; `directionalLight` `#fff7ec` @ 2 at `(3,4,3)`;
`directionalLight` `#dce8f5` @ 0.6 at `(-3,-1,2)`; `PerspectiveCamera` fov 36;
`ACESFilmicToneMapping`, exposure 1.05 (matches `GenericViewer.tsx` renderer config). Each model
was loaded via `GLTFLoader`, bounding-box-computed, and orbited around its own centroid
regardless of native scale. 5 angles per asset were captured as individual PNGs plus one
composed contact sheet per asset. All screenshot paths below are relative to
`review-screenshots/asset-acceptance-2026-08-18/physics-fields/`.

All 4 files loaded and rendered without a single loader/parser error. **0 unrenderable.**

## Summary

| Asset | Verdict | One-line reason |
| --- | --- | --- |
| `bulb.glb` | CONDITIONAL | Great geometry/proportions, but glass material (`transmission:1`, no env map in the app's actual stage) renders essentially **opaque black**, hiding the filament — the one feature the sidecar flags as the intended hotspot. |
| `compass.glb` | CONDITIONAL | Functionally accurate needle+dial+hinge, reads well from the top; but antique worn-brass finish is dark and off-brand vs. the Anatomy Atelier warm off-white bar (already flagged in its own sidecar). |
| `lens.glb` | CONDITIONAL | Documented proxy (magnifying glass, not a bare ray-diagram lens) renders as a solid, recognizable prop — but the same glass-transparency material fault as the bulb is more damaging here because refraction/transparency *is* the entire teaching point of "Lens." |
| `wire-cable-set.glb` | PASS (integration note) | 49 individual wire/connector/plug meshes are cleanly modeled, opaque, no material faults; correctly *not* usable as a single default-framed drop-in (by design — must be picked apart per-node), confirmed by direct bounding-box measurement. |

## 1. `bulb.glb` — CONDITIONAL

**Taxonomy mapping:** Physics > Electricity (`detailed: true`) > lowLevelItem `Bulb`. Matches
`docs/assets/physics-fields.md` §1 (`Electricity | Bulb | ... | Sourced — bulb.glb`) and the
sidecar's `"component": "Electricity > Circuit / Bulb"`.

**Scientific relevance/accuracy:** Correct form factor — classic incandescent A-type bulb,
Edison-screw (E-series) metal base with visible threading, worn/used-look glass envelope,
distinct visible filament-coil mesh region as the sidecar promised. Good foundation for teaching
current → resistance → heat → light in a circuit.

**Mesh/material/texture quality:** 2 meshes, 2 materials, 7 embedded textures (2k). Screw base
material and its thread ridges render correctly and read well in every angle. The glass material
is a `MeshPhysicalMaterial`-style setup: `transparent: true, opacity: 1, transmission: 1, ior:
1.45` — a physically-correct approach to glass **that requires an environment/IBL map to
resolve to anything visible**. The app's real stage (`GenericViewer.tsx`) sets up only
`ambientLight` + 2 `directionalLight`s and **no environment map**. Rendered under that exact
stage, the glass comes out essentially solid black in every single angle tested — see
`bulb/bulb__front.png`, `bulb/bulb__three-quarter-front-left.png`,
`bulb/bulb__top-down-three-quarter.png`. Only in the closest, most favorably-lit angle
(`bulb/bulb__filament-detail-close.png`) does the filament coil become faintly, barely visible
through a thin bright streak — nowhere near clear enough for a hotspot-driven "Touch it / Name
it" flow at a child's viewing distance.

**Recognizability for a child audience:** The outer silhouette (bulb shape + screw base) is
instantly recognizable as "a lightbulb." The filament — the actual educational payload — is not
recognizable under the app's real lighting.

**Style fit vs. Anatomy Atelier bar:** Silhouette and worn-glass texture style are consistent with
a clean-3D, warm off-white presentation; the black-glass fault is the only thing breaking the
bar, and it's severe because it hides the asset's most important feature.

**Default camera framing / bounding-box sanity:** Good. `approxDimensionsMeters` in the sidecar
(`[0.06, 0.1003, 0.06]`) matched our own computed bounding box (`maxDim ≈ 0.1003 m`) almost
exactly. Auto-framing around the centroid produced clean, well-centered compositions at every
angle with no clipping.

**Transparency/material faults:** Confirmed and reproducible — see above. This is a rendering-
pipeline mismatch (transmission material + no IBL), not a geometry defect. Two practical fixes for
whoever integrates this: (a) add a lightweight `Environment`/IBL preset to `GenericViewer.tsx` so
all transmission-based glass across the app resolves correctly, or (b) swap this asset's glass
material to a simple alpha-blended `transparent: true, opacity: ~0.2–0.3` material (no
`transmission`) that renders predictably under directional-light-only rigs. Given more than one
sourced asset here uses `transmission` (bulb, lens), fix (a) is the higher-leverage option if other
Physics/Chemistry glass assets follow the same pattern.

**Animation:** `animationCount: 0` (sidecar) confirmed — no animation channels exist. A
"filament glow" pulsing effect (mentioned nowhere in the spec but a natural add) would need to be
procedural (emissive material animation), not baked.

**Rough performance:** 3.03 MB file, 2 meshes, 2 materials, 7 textures @ 2k. Well within budget for
a hero single-object asset.

**Attribution:** CC0 1.0 (Poly Haven, `lightbulb_01`, creator Josh Dean). Not legally required;
sidecar's optional credit text ("Lightbulb 01 by Josh Dean, Poly Haven, CC0") is accurate and
sensible.

## 2. `compass.glb` — CONDITIONAL

**Taxonomy mapping:** Physics > Magnetism > "Compass" per `docs/assets/physics-fields.md` §1
and the sidecar's `"component": "Magnetism > Compass"`. Caveat: `Magnetism` is
`"detailed": false` in `content/taxonomy/physics.json` (branch is named only, with no
`lowLevelItems`/`interactiveComponents` transcribed yet) — per `CLAUDE.md`'s content-hierarchy
rule, no content-authoring facts should be written against this branch until it's SME-sourced.
This asset is correctly pre-sourced ahead of that, not a claim that Magnetism content exists.

**Scientific relevance/accuracy:** Functionally correct nautical/field compass: magnetic needle
pivoting on a center pin, engraved compass-rose dial with cardinal-direction letters and fine
graduation ticks, hinged sighting lid with a sight wire, and a side thumbscrew — all visible and
legible in `compass/compass__needle-dial-top.png` and
`compass/compass__three-quarter-front-left.png`. This is a strong apparatus for a "how a compass
finds north" lesson.

**Mesh/material/texture quality:** 3 meshes (body, hinged lid, needle — a distinct node,
`seadogs_compass_needle`), 1 material, 3 textures (2k). No transparency anywhere, so none of the
bulb/lens alpha-blending failure mode applies here. However, the "worn antique brass" material is
low-albedo and dark under this exact lighting rig: the straight-on `front` angle
(`compass/compass__front.png`) is nearly a silhouette — most detail only becomes readable once the
lid is viewed more face-on (`needle-dial-top`, `three-quarter-front-left`/`-right`). The sidecar
already flags this exact concern ("Aesthetic is worn/vintage brass, not the clean warm off-white
Anatomy Atelier bar — flag for a material/texture restyle pass") and this render pass confirms it
concretely.

**Recognizability for a child audience:** An adult reads this instantly as an antique field
compass. A child may read it first as a "pirate treasure map" prop rather than "a magnetism
science tool" — the vintage brass styling pulls it toward an adventure-prop read rather than a lab-
apparatus read. Worth a target-age gut-check before final integration, independent of the
lighting/material restyle.

**Style fit vs. Anatomy Atelier bar:** Does not currently fit — confirmed restyle candidate
(simpler flat recolor toward the warm off-white palette, or a brighter brass/nickel finish, would
likely resolve both the "too dark" and "too antique" concerns in one pass).

**Default camera framing / bounding-box sanity:** Good. Computed `maxDim ≈ 0.150 m` matches the
sidecar's `approxDimensionsMeters` (`[0.0813, 0.0225, 0.1251]`, `maxDim` on the same axis) closely.
Auto-framing centered cleanly with no clipping across all 5 angles.

**Transparency/material faults:** None — all opaque, no alpha/transmission issues.

**Animation:** `animationCount: 0` confirmed. No baked needle-settling animation exists, but since
the needle (`seadogs_compass_needle`) is a separate node from the body/lid, a procedural
needle-settling rotation (spring-damped rotation toward north, driven at the app layer) is
straightforward to add without any new asset work — worth doing, since "needle settling into
place" is one of the most obvious "aha" interactions this component affords.

**Rough performance:** 8.42 MB — the largest of the four files, driven by 2k textures on a
detailed antique-brass PBR material (base color/normal/ORM likely). Acceptable for a hero asset
but worth a 1k-texture pass if load-time budget is tight (`wire-cable-set.glb` already took that
route for a similar reason).

**Attribution:** CC0 1.0 (Poly Haven, `seadogs_compass`, creator Benny Weimer). Sidecar's optional
credit text is accurate.

## 3. `lens.glb` — CONDITIONAL

**Taxonomy mapping:** Physics > Light And Optics > "Lens" per `docs/assets/physics-fields.md`
§1, explicitly marked there and in the sidecar as a **partial-fit proxy**: `"component": "Light
And Optics > Lens (best-available proxy; see gap notes)"`. `Light And Optics` is also
`"detailed": false` in the taxonomy, same SME-sourcing caveat as Magnetism above. This review
does not treat the proxy status as a defect in itself — it was already disclosed and tracked
honestly in §1/§5 of the sourcing doc — but does evaluate whether the proxy renders acceptably.

**Scientific relevance/accuracy:** As documented, this is a handheld magnifying glass, not a bare
biconvex lens on a stand suited to ray-diagram teaching. It is a reasonable stand-in for
"there is a lens here" but cannot support a proper refraction/ray-bending lesson as modeled —
the physics-fields.md brief for a purpose-built lens (§5 item 7 area) remains the right long-term
fix; this file is correctly labeled a placeholder-with-caveats, not a final asset.

**Mesh/material/texture quality:** 2 meshes, 2 materials, 5 textures (2k). Frame/handle material
(opaque black) renders cleanly and consistently across all angles. The lens-glass material
(`transmission: 1, ior: 1.5`, same physically-based approach as the bulb) suffers the identical
env-map-dependency fault: under the app's real lighting rig (no IBL), the lens surface renders as
a flat, frosted, opaque white-grey disc with no transparency or refractive distortion at all — see
`lens/lens__front.png` and `lens/lens__refraction-angle.png`. There is no visible warping of
anything behind/through it, and no see-through quality whatsoever.

**Recognizability for a child audience:** The overall magnifying-glass silhouette (round lens +
tapered black handle) is instantly recognizable as "a magnifying glass" at every angle
(`lens/lens__top-down-three-quarter.png` is a particularly clean read). But a magnifying glass
whose "glass" doesn't look like glass at all undermines exactly the lesson it exists to teach.

**Style fit vs. Anatomy Atelier bar:** Handle/frame styling is clean and on-bar; the glass
material fault is the sole but significant break from the bar, and it is more damaging here than
on the bulb because transparency/refraction is this component's entire pedagogical reason for
existing (per the review brief's explicit call-out that "transparency/refraction behavior" is the
key functional feature to check for lens).

**Default camera framing / bounding-box sanity:** Good. Computed `maxDim ≈ 0.272 m` matches the
sidecar's `approxDimensionsMeters` (`[0.1321, 0.2716, 0.0267]`) exactly on the long axis. Clean,
centered framing at all 5 angles, no clipping.

**Transparency/material faults:** Confirmed, same root cause and same two fix options as the bulb
(add IBL to `GenericViewer`, or swap to a simple alpha-blended non-transmission glass material).
Given both of the app's two glass-bearing Physics assets fail the same way, fixing this at the
viewer level (adding an `Environment`) is very likely worth doing once, rather than patching each
asset's material individually.

**Animation:** `animationCount: 0` confirmed — no animation channels. No obvious animation need
beyond what a future purpose-built ray-diagram lens asset would want (animated light rays bending
through the lens), which per the physics-fields.md brief pattern would stay procedural rather than
baked into the mesh.

**Rough performance:** 1.18 MB — smallest of the four files, cheap to load.

**Attribution:** CC0 1.0 (Poly Haven, `magnifying_glass_01`). Sidecar's optional credit text is
accurate.

## 4. `wire-cable-set.glb` — PASS (integration note)

**Taxonomy mapping:** Physics > Electricity (`detailed: true`) — maps to the `Circuit`
lowLevelItem and the `Circuit builder` interactiveComponent per
`content/taxonomy/physics.json`, and to `docs/assets/physics-fields.md`'s
"Electricity | Circuit builder / Wire" row. One nuance worth flagging: `physics.json`'s
`lowLevelItems` array for Electricity does not list a standalone `"Wire"` item (it lists
`Charge, Current, Voltage, Resistance, Circuit, Battery, Bulb, Switch, Series circuit, Parallel
circuit`) — "Wire" only appears as part of the `Circuit builder` interactive component in the
taxonomy, not as its own named low-level item. Not a blocker, just worth a taxonomy-consistency
note for whoever authors the Circuit builder module.

**Scientific relevance/accuracy:** A modular kit of 49 separate meshes — straight/curved/bent
cable segments in multiple lengths, connector boxes (3-way, 4-way, double), plugs (single, double,
4x, covered), and light-switch housings. Individually, every piece reads as a real, physically
plausible electrical-wiring component. This is exactly the right level of abstraction for a
drag-and-drop circuit builder (per-node props), not a single "wire" prop.

**Mesh/material/texture quality:** 49 meshes, 2 materials (`modular_electric_cables`,
`modular_electric_cables_boxes`), 6 textures at 1k (deliberately downshifted from 2k per the
sidecar, to stay under a 15 MB budget for this many meshes). All materials opaque — no
transparency faults anywhere in this asset. Individual pieces hold up well at close range: see
`wire-cable-set/wire-cable-set__connector-detail.png`, which shows distinct, well-separated cable
bends, a 3-way junction box, plugs, and switch housings all reading clearly at a glance.

**Recognizability for a child audience:** Individual pieces (a plug, a bent cable, a switch box)
are all clearly recognizable as "electrical wiring/connector" parts. The whole 49-piece kit shown
at once (as in every one of our 5 captured angles, since we rendered the raw scene) reads as a
disassembled hardware-store parts bin, not as one coherent "wire" object — but that is the
intended usage pattern (see next point), not a defect.

**Style fit vs. Anatomy Atelier bar:** Individual pieces are clean, simple, and consistent with
the warm off-white / uncluttered visual language; no ornamentation or stylization mismatches.

**Default camera framing / bounding-box sanity — key finding:** Our directly computed bounding
box is `size ≈ [2.077, 0.757, 0.215] m`, `maxDim ≈ 2.077 m` — the 49 nodes are laid out **side by
side in a flat grid**, not stacked/overlapping at the origin (see
`wire-cable-set/wire-cable-set__front.png` and `wire-cable-set/wire-cable-set__top-down-three-
quarter.png`, both clearly showing a parts-catalog grid layout). This is meaningfully larger and a
different shape than the sidecar's recorded `approxDimensionsMeters: [0.2145, 0.9856, 0.3208]`
(that figure is likely a per-mesh or different-axis measurement from the structural validator, not
the full multi-node scene bbox — worth a follow-up note back to whoever maintains
`validate-glb.mjs`, though that script is out of scope for this review to edit). **Practical
consequence: this file must never be dropped into `GenericViewer` (or any single-camera viewer)
as-is** — auto-framing the whole scene would either show the entire spread-out grid tiny and
cluttered, or clip most of it if framed on any single piece. This matches the sidecar's own
intended-usage note exactly ("Intended to be picked apart per-node in-app ... rather than shown as
one assembled unit") — so this is a confirmed integration constraint, not a newly discovered flaw,
but it is now render-verified rather than just asserted.

**Transparency/material faults:** None found.

**Animation:** `animationCount: 0` confirmed — no animation channels exist anywhere in the 49
nodes. The taxonomy's `Current-flow animation` interactive component (Electricity branch) will
need to be entirely procedural (e.g., an animated emissive/UV-scroll shader along whichever cable
node is placed in a built circuit) — consistent with the "fields stay procedural" pattern already
established for this whole asset wave.

**Rough performance:** 5.98 MB for 49 meshes / 2 materials / 6 textures @ 1k — reasonable for a
kit this size; the deliberate 1k-texture choice (documented in the sidecar as a drop from 17.6 MB
at 2k) was the right call and doesn't visibly hurt readability of individual connector/cable props
at the distances these will be viewed.

**Attribution:** CC0 1.0 (Poly Haven, `modular_electric_cables`). Sidecar's optional credit text
is accurate.

## Cross-cutting recommendation

Two of four assets (`bulb.glb`, `lens.glb`) share one root-cause material fault: physically-based
transmissive glass with no environment map in the actual app stage. Rather than treating this as
two separate asset problems, the highest-leverage fix is almost certainly at the `GenericViewer`
level (adding a lightweight `Environment`/IBL preset) — file paths for whoever picks this up:
`quantaora-app/src/components/explorer/GenericViewer.tsx` (read-only reference during this
review; not modified), and the two affected assets are `quantaora-app/public/models/sourced/
physics-fields/bulb.glb` and `.../lens.glb`.
