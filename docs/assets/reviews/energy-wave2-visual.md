# Physics — Energy Systems Apparatus (Wave 2): Visual Render Review

Reviewer: Wave 6 visual acceptance agent (read-only). Date: 2026-08-18.

Method: served `quantaora-app/public/` locally, rendered each GLB via Google `<model-viewer>`
(neutral-image environment lighting, off-white `#f2efe9` background, `camera-controls`,
auto-rotate off) at 4 fixed camera orbits (front, side, back-high, three-quarter) using headless
Chromium via Playwright, screenshots saved at 1200x900. Every PNG below was visually inspected
with the Read tool (not just checked for existence). No product files were modified; nothing was
wired into the app.

Screenshot root (relative to `quantaora-app/`):
`review-screenshots/asset-acceptance-2026-08-18-wave6/energy/<model-name>/<angle>.png`

---

## 1. `generator.glb`

- **Verdict: PASS**
- **Path**: `quantaora-app/public/models/sourced/physics-energy-wave2/generator.glb`
- **Evidence**: `energy/generator/front.png`, `energy/generator/side.png`,
  `energy/generator/three-quarter.png`, `energy/generator/back-high.png`
- **Component mapping**: Sourcing doc maps this to `Energy > Generator (electrical energy
  generation apparatus)`. Confirmed by render — a consumer-style gasoline portable generator
  (yellow fuel-tank housing, black roll-cage frame, control panel with two AC outlets, circuit
  breaker switch, pull-start engine block, wheeled/skid frame). Immediately readable as "a
  generator" to a child.
- **Quality assessment**: Clean PBR material with legible printed labels (`EN2500`, `CIRCUIT
  BREAKER`, `AC OUT 120V`, warning decal) at all four angles, no missing-texture magenta/
  checkerboard, no visible mesh holes or inverted normals from any angle including the back. Paint
  wear/scratches and chipped yellow enamel are present but read as an intentional "used
  workshop-grade tool" material rather than degraded/broken geometry — closer to the Anatomy
  Atelier bar than the flask/heater below, though still not the flattest "brand new" clean finish.
- **Performance/framing**: Well centered and fully framed at every angle tested; no clipping
  against the viewport edge; roll-cage tubing does not overlap/occlude the control panel.
- **Integration safety note**: None found. The four visible meshes (housing, engine block, control
  panel, frame) look separable enough to support hotspot-per-part if that's ever wanted (e.g.
  fuel tank vs. control panel vs. engine), though `.license.json` reports only 4 nodes/4 meshes so
  granularity is coarse — verify against actual node names before planning per-part hotspots.

---

## 2. `insulated-flask.glb`

- **Verdict: CONDITIONAL**
- **Path**: `quantaora-app/public/models/sourced/physics-energy-wave2/insulated-flask.glb`
- **Evidence**: `energy/insulated-flask/front.png`, `energy/insulated-flask/side.png`,
  `energy/insulated-flask/three-quarter.png`, `energy/insulated-flask/back-high.png`
- **Component mapping**: Sourcing doc maps this to `Heat And Thermodynamics > Insulation /
  conduction demonstration object`. Confirmed by render — a classic vacuum-insulated thermos
  flask (screw cap, stainless steel dome lid, side handle, "TRAPFER GRAMLEY THERMOS" branded
  label). Silhouette and proportions read clearly as "a thermos" at every angle.
- **Quality assessment**: Geometry is clean (single mesh, no holes/inverted normals visible), but
  the material is a heavily distressed teal/green patina finish with dark speckled corrosion-like
  spotting covering nearly the entire body at every angle. This matches the `.license.json`'s own
  self-flagged note ("Worn/scuffed surface texture ... flag for a possible material/texture pass
  before final integration to match the Anatomy Atelier clean warm off-white bar") — confirmed
  visually, this is a materially bigger aesthetic gap than the note's wording suggests. The finish
  reads as "old rusty camping thermos found in a shed," not the clean warm off-white / non-gamey
  language the rest of the app targets. No texture-loading failures (no magenta/checkerboard) —
  this is an intentional worn material baked into the source asset, not a broken render.
- **Performance/framing**: Well centered, fully in-frame, no clipping at any of the four angles.
- **Integration safety note**: Before wiring into a lesson, this asset needs either (a) a
  replacement/cleaner Poly Haven variant if one exists, or (b) a material swap to a less-corroded
  finish — the current worn/rust-spotted texture is the single biggest visual-bar mismatch found
  across this wave's five assets and would stand out badly next to cleaner assets (e.g.
  `generator.glb`, `multimeter.glb`) in the same lab/catalog.

---

## 3. `multimeter.glb`

- **Verdict: PASS**
- **Path**: `quantaora-app/public/models/sourced/physics-energy-wave2/multimeter.glb`
- **Evidence**: `energy/multimeter/front.png`, `energy/multimeter/side.png`,
  `energy/multimeter/three-quarter.png`, `energy/multimeter/back-high.png`
- **Component mapping**: Sourcing doc marks this a bonus find for `Energy > Energy-transfer
  measurement instrument`. Confirmed by render — a retro analog voltmeter/ammeter multimeter with
  a rotary range-selector dial, a meter-face window, carry handle, and red/black test-probe leads
  with visible wire coil. Reads clearly as "a multimeter" / electrical measurement tool.
- **Quality assessment**: Clean dark-navy plastic-look housing, legible printed V/A/mA scale
  markings and unit labels on the front dial face, and a fully-detailed schematic + spec table
  printed on the back panel (visible and legible in `back-high.png`) — a genuinely nice "See it"
  detail for a hotspot. No missing textures, no mesh holes, no inverted-normal artifacts at any
  angle. Some light wear/scuffing on the housing edges but far less aggressive than the
  insulated-flask; overall closer to a clean classroom-instrument aesthetic.
- **Performance/framing**: Well framed at all angles; the flexible red/black probe cables droop
  naturally in front of the unit without clipping through the housing or extending outside frame.
- **Integration safety note**: None found. The meter-face "needle" window renders as flat black in
  these static screenshots (plausible unlit/unpowered glass reflection given the neutral lighting
  used here) — worth a quick check under the app's actual lighting/hotspot camera to confirm the
  dial face reads correctly once wired in, since an unreadable dial would weaken a "read the
  measurement" learning interaction.

---

## 4. `masonry-heater.glb`

- **Verdict: CONDITIONAL**
- **Path**: `quantaora-app/public/models/sourced/physics-energy-wave2/masonry-heater.glb`
- **Evidence**: `energy/masonry-heater/front.png`, `energy/masonry-heater/side.png`,
  `energy/masonry-heater/three-quarter.png`, `energy/masonry-heater/back-high.png`
- **Component mapping**: Sourcing doc maps this to `Heat And Thermodynamics > Heat apparatus
  (furnace / heater, bonus)`. Confirmed by render as a floor-to-ceiling cylindrical wood-stove/
  masonry-heater silhouette (ribbed metal-clad cylindrical body, stovepipe outlet, small hinged
  fuel door with decorative tree motif, footed base) — recognizable as "a heater/stove," though a
  child is more likely to read it as an old metal barrel-stove/furnace than a "masonry" (brick/
  tile) heater, since no brick or tile texture is visible anywhere on the body.
- **Quality assessment**: **Two issues found, not previously flagged in the `.license.json`:**
  1. **Material mismatch vs. sourcing note**: the `.license.json` states "Clean off-white masonry
     finish already matches the Anatomy Atelier warm off-white bar well." The actual render shows
     a silvery-gray galvanized-metal finish with heavy dark streaking, white mineral bloom, and
     rust stains at the base and around the fuel door — not off-white, and not a "clean" finish by
     the Anatomy Atelier bar. This is a documentation/render mismatch worth correcting before
     anyone plans integration based on the license note alone.
  2. **Floating geometry artifact**: visible in `three-quarter.png` and clearly in
     `back-high.png` — two thin rust-colored rod/prong shapes and a thin blue line/wire are
     floating detached in empty space next to the stovepipe, not touching any surface of the
     model. This is a genuine mesh defect (disconnected debris geometry), not a lighting or camera
     artifact — it is visible from multiple angles at a consistent 3D position relative to the
     heater.
- **Performance/framing**: model-viewer auto-frames the full ~1.2m x 2.4m x 1.3m object correctly
  in all four shots with no cropping, but this confirms the `.license.json`'s own scale flag: this
  is an architecture-scale fixture, not a benchtop/handheld prop like the other four files in this
  wave.
- **Integration safety note**: **Do not wire in as-is.** Before integration this needs (a) the
  floating rod/wire debris either removed or investigated (may indicate a damaged/incomplete
  export from the original glTF), and (b) a corrected description — this is a metal-clad stove/
  furnace object, not an off-white masonry heater as currently documented. Scale also needs a
  deliberate placement decision (scene-scale fixture vs. scaled-down diorama), consistent with the
  license note.

---

## 5. `electric-stove.glb`

- **Verdict: PASS**
- **Path**: `quantaora-app/public/models/sourced/physics-energy-wave2/electric-stove.glb`
- **Evidence**: `energy/electric-stove/front.png`, `energy/electric-stove/side.png`,
  `energy/electric-stove/three-quarter.png`, `energy/electric-stove/back-high.png`
- **Component mapping**: Sourcing doc maps this to `Heat And Thermodynamics > Heat apparatus
  (heating element)`. Confirmed by render — a compact free-standing white electric cooker/stove
  with four visible coil burners, six control knobs, an oven door with viewing window, and a
  lower storage/broiler drawer. Immediately readable as "a stove," and the coil-burner meshes are
  clearly separable hotspot targets for a resistive-heating-element lesson as the sourcing note
  intends.
- **Quality assessment**: Front and side faces are clean white enamel with light, plausible rust
  streaks below the knobs/handles (matches a real household appliance, reads as "used" rather
  than "broken"), branded "ARINA" nameplate and indicator lights are crisp and legible, coil
  burners have correct dark metal-coil shading. **Note**: the back panel (`back-high.png`) is a
  starkly different, heavily rust-mottled dark-brown unfinished metal texture — realistic for a
  real appliance's unseen rear, but a jarring contrast if a learner is given free 360° rotation
  control in the lab viewer, since the clean white front gives no visual warning of the grungy
  back.
- **Performance/framing**: Well centered and fully in-frame at all four angles; oven-door window
  and burners are not clipped or occluded.
- **Integration safety note**: If the lab's camera/rotate control allows viewing the unit from
  behind, consider constraining the default rotate range or accepting the back-panel material as
  intentional "appliance back" detail — flagging so it isn't mistaken for a texture-loading bug if
  seen unexpectedly during a rotate interaction.

---

## Summary

| Asset | Verdict | Primary issue (if any) |
| --- | --- | --- |
| `generator.glb` | PASS | — |
| `insulated-flask.glb` | CONDITIONAL | Heavily worn/corroded material finish clashes with the clean warm off-white bar |
| `multimeter.glb` | PASS | Confirm dial-face legibility once lit under real app lighting |
| `masonry-heater.glb` | CONDITIONAL | Floating detached rod/wire geometry artifact; finish is galvanized-metal, not off-white masonry as documented |
| `electric-stove.glb` | PASS | Back panel is a much grungier finish than the front, worth a rotate-range decision |

No canvas rendered blank across the 20 screenshots captured (4 angles x 5 models); every model
rendered with legible real-world silhouettes at every angle tested. The two CONDITIONAL verdicts
are both material/finish or geometry-defect issues, not licensing, sourcing-category, or
identifiability problems — all five files are recognizable as their intended real-world object.
