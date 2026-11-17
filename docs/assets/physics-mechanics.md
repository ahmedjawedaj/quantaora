# Physics — Mechanics & Energy Asset Sourcing (Wave 1)

Agent: PHYSICS-MECHANICS. Scope: `content/taxonomy/physics.json` branches `mechanics` and
`energy` (both `"detailed": true`), plus a flagged audit of `heat-and-thermodynamics`
(`"detailed": false`). Out of scope: `electricity`, `magnetism`, `waves`, `sound`,
`light-and-optics`, `fluids`, `modern-physics-foundations` — owned by other agents in this wave.

Date: 2026-08-18. Follows the tone/structure of `docs/ASSET-SOURCING.md`.

## Headline result

**0 GLBs downloaded.** Every apparatus asset that cleared the license bar (CC0/CC-BY, explicit
redistribution rights) lives on **Sketchfab**, and Sketchfab gates the actual model file behind
its OAuth download endpoint (`GET /v3/models/{uid}/download` → `401 Authentication credentials
were not provided`) even when the model page shows a public "Download 3D Model" button and a
`CC Attribution` license. This sourcing session has no Sketchfab account/API token, and per the
wave's rules ("Never bypass auth gates or use unauthorized mirrors") that gate was respected, not
routed around. **Poly Haven — the one CC0 source that is downloadable with a plain `curl`, no
login — simply has no ramp/cart/pulley/pendulum/spring/lever/balance-scale/gear/thermometer
models in its 521-model catalog** (verified by keyword-scanning the full `/assets?type=models`
listing; confirmed by comparison with the sibling chemistry/electricity agents, who *did* find
Poly Haven matches for their scopes — `chemistry_set`, `bunsen_burner`, a light bulb — in the same
catalog).

Net effect: this wave produced a fully vetted **candidate shortlist with real license data** (via
Sketchfab's public read API, `sketchfab.com/i/models/{uid}`, which does not require auth) plus
**commissioned-model briefs** for every component, per the "do not fabricate placeholders"
instruction. Nothing was written to `public/models/sourced/physics-mechanics/` except a validator
script, because there is nothing legitimately downloadable to validate yet.

## 1. Branch/component mapping

Mechanics (13 components) and Energy (6 components) both `"detailed": true` — ready for
content-agent authoring; asset need mapped to the shared physical apparatus that would carry the
"See it / Touch it" step of the Component-Level Learning Flow. All current `model-metadata.json`
files under `content/subjects/physics/{mechanics,energy}/*` use `"modelType": "procedural"` — i.e.
every one of these already renders via Three.js procedural geometry today; nothing here is
currently broken, this wave is about whether a real authored apparatus mesh can raise the bar.

| Taxonomy component | Branch | Apparatus need | Status |
| --- | --- | --- | --- |
| Position | mechanics | Cart + ruled track | Gap — brief below (Cart & Track) |
| Distance | mechanics | Cart + ruled track | Gap — shares Cart & Track brief |
| Displacement | mechanics | Cart + ruled track (start/end pins) | Gap — shares Cart & Track brief |
| Speed | mechanics | Cart + ruled track + stopwatch | Gap — shares Cart & Track brief |
| Velocity | mechanics | Cart + ruled track + direction arrow (arrow stays procedural) | Gap — shares Cart & Track brief |
| Acceleration | mechanics | Ramp + cart | Gap — shares Ramp & Cart brief |
| Force | mechanics | Wooden box + spring/Newton scale | Gap — brief below (Spring Scale) |
| Mass | mechanics | Two-pan balance scale | **Candidate found, download-blocked** (Sketchfab, see §2) |
| Weight | mechanics | Hanging spring scale + weight set | Gap — shares Spring Scale brief |
| Gravity | mechanics | Pendulum or drop rig | **Candidate found, download-blocked** (Sketchfab pendulum) |
| Friction | mechanics | Block on plank/incline | Gap — brief below (Friction Block & Plank) |
| Normal force | mechanics | Block on flat surface (shares Friction rig) | Gap — shares Friction Block brief |
| Momentum | mechanics | Two carts on a track (collision lab) | Gap — shares Cart & Track brief (×2 carts) |
| Kinetic energy | energy | Ramp + cart (skate-ramp energy lab) | Gap — shares Ramp & Cart brief |
| Potential energy | energy | Ramp + cart, or pendulum at height | Gap — shares Ramp & Cart / Pendulum brief |
| Work | energy | Lever or pulley + load | **Candidate found, download-blocked** (Sketchfab lever/pulley) |
| Power | energy | Same Work apparatus + stopwatch | Gap — shares Work brief |
| Conservation of energy | energy | Pendulum (classic swing demo) | **Candidate found, download-blocked** (Sketchfab pendulum) |
| Efficiency | energy | Pulley or ramp system with visible friction loss | Gap — shares Work / Ramp & Cart brief |

`heat-and-thermodynamics` (`"detailed": false`): named only in the spec, no low-level items or
interactive components transcribed yet, and no `content/subjects/physics/heat-and-thermodynamics/`
directory exists. **Flagging the asset gap without authoring/inventing content for it**, per
instructions. If/when it is detailed, the natural apparatus (thermometer, piston, gears) has a
partial Sketchfab shortlist already gathered in §2 as a head start.

## 2. Candidate comparison table

Every candidate evaluated, not just winners. License/downloadability for Sketchfab entries was
confirmed via Sketchfab's public JSON endpoint `https://sketchfab.com/i/models/{uid}` (no auth
required to *read* metadata — only to fetch the actual file), which returns authoritative
`license.slug` and `downloadType` fields, not just page text.

| Source | Asset | License (verified) | Downloadable file access | Accept/Reject |
| --- | --- | --- | --- | --- |
| Poly Haven | Full 521-model catalog, keyword-scanned for ramp/cart/pulley/pendulum/spring/lever/gear/scale/thermometer/wheel/toy/trolley | CC0 (site-wide) | Direct CDN, no auth | **Reject — no matching model exists in the catalog.** Closest tangential hits (`overhead_crane`, `mousetrap`, `bench_vice_01`) rejected individually below. |
| Poly Haven | `overhead_crane` (weathered dockyard hoist, tags include "pully") | CC0 | Direct CDN, no auth (`dl.polyhaven.org/.../overhead_crane_*.gltf`) | **Reject** — real pulleys are present but it's a rusted, grimy 8K industrial-dockyard prop. Clashes hard with the Anatomy Atelier warm off-white/clean-3D bar; would need a full re-material pass, not a light edit. Noted as a CC0 fallback if a future wave wants to reuse it after re-texturing. |
| Poly Haven | `mousetrap` (has a literal coil spring) | CC0 | Direct CDN, no auth | **Reject** — a snap-trap is not an appropriate spring-apparatus visual for a kids' Hooke's-law lesson (pest-control/violence connotation), independent of license. |
| Poly Haven | `bench_vice_01`, `chemistry_set`, `bunsen_burner`, `drill_press_01`, `industrial_microscope`, `retro_multimeter`, other `tools`/`industrial` category items | CC0 | Direct CDN, no auth | **Reject (out of scope or wrong apparatus)** — none model position/motion/force/energy apparatus; `chemistry_set`/`bunsen_burner` belong to the chemistry agent's scope. |
| Sketchfab | Balance Scale — Jean-Francois.Bonin (`c880997f…`) | CC Attribution (confirmed via API: `license.slug="by"`) | `downloadType: "free"`, but file fetch requires OAuth — **blocked, no credentials** | **License-qualifies, download-blocked.** 251k faces (heavy — would need decimation). Depicts an ornate "Legal Scale" (Lady Justice style) — usable for the two-pan balance concept, thematically ornate rather than lab-clean. |
| Sketchfab | Scales — FlukierJupiter (`2ed4e14b…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. 2,068 faces — reasonable budget. |
| Sketchfab | Medieval balance scales — chaschinkaa (`0893d688…`) | CC Attribution (`"by"`) | `downloadType: "free"`, native `.glb` export, OAuth-blocked | License-qualifies, download-blocked. Native glb is convenient but archive is 45MB (all formats bundled) — actual glb-only size unknown until downloaded. |
| Sketchfab | Old Balance Scale — romullus (`47567886…`) | **None / Sketchfab Standard** (API returned `license: null`) | `downloadType: "no"` | **Reject** — no open license, not downloadable at all. |
| Sketchfab | Pendulum — pedrobax (`5e385550…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. 632 faces, lightweight. |
| Sketchfab | Pendulum Experiment in Blender — dradnon (`c5c01d88…`) | CC Attribution (`"by"`) | `downloadType: "free"` (`.blend` only), OAuth-blocked | License-qualifies but **not GLB** — would need Blender re-export even if downloaded. |
| Sketchfab | Newton's Cradle(Pendulum) — Sidharth1 (`e613336b…`) | **None / Standard** (API: `license: null`) | `downloadType: "no"` | **Reject** — no open license. |
| Sketchfab | Triple Pendulum Mechanism — trinityscsp (`2131be15…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. Solidworks-authored, 64k faces (heavy), more "engineering demo" than a single kid-legible pendulum — lower priority than the simple pendulum. |
| Sketchfab | CC0 - Lever — plaggy (`1d4a93a0…`) | Listed CC Attribution via API despite "CC0" in the title (`license.slug="by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies (as CC-BY, attribute plaggy), download-blocked. Only 660 faces — very low-poly, would read as a placeholder plank+fulcrum, fine as a base mesh to dress up. |
| Sketchfab | Lever — Spore_Explorer (`a1624ecb…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. 136 faces — too low-poly to be more than a placeholder on its own. |
| Sketchfab | Lever — Car Wong / carolyn.wong1 (`daac8fcc…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. 896 faces. |
| Sketchfab | Pulley — LeakyRUS (`8cc7d1b1…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. Single pulley wheel, not a full block-and-tackle rig — would need a load/rope/frame added. |
| Sketchfab | Pulley — harigoat (`8b7f631f…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. 424 faces, `.stl` source (geometry only, no material). |
| Sketchfab | Torsion Spring — sinnervoncrawsz (`fc9192d4…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. `.stl` source. |
| Sketchfab | Suspension Coil — jolle.kemppainen (`f9e9d2bd…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. Automotive coil spring, not a lab spring, but a real coil spring mesh for a Hooke's-law scene. |
| Sketchfab | CC0 - Gear — plaggy (`bb92a0e2…`) | Listed CC Attribution via API (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. Belongs to `heat-and-thermodynamics`/`modern-physics-foundations` scope, not mechanics/energy — logged here as a head start only. |
| Sketchfab | Gears Mechanism — max_imum (`af7b1dfa…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. Same out-of-current-scope note as above. |
| Sketchfab | Thermometer — Toss90 (`f5711971…`) | CC Attribution (`"by"`) | `downloadType: "free"`, OAuth-blocked | License-qualifies, download-blocked. `heat-and-thermodynamics` scope (not detailed yet) — logged as a head start only. |
| Sketchfab | Diorama of Simple Machines — jesus99 (`475e3854…`) | **None / Standard** (API: `license: null`) | `downloadType: "no"`, `.stl` | **Reject** — no open license, not downloadable. |
| Sketchfab | "Cart"/"ramp"/"incline"/"spring scale"/"Newton meter"/"force meter" — targeted searches | — | — | **Reject — no matching results found at all.** Nothing on Sketchfab (or elsewhere searched) models a physics-lab motion cart, track, or spring/Newton force scale. This is the single biggest gap: the flagship kinematics apparatus (Position/Distance/Displacement/Speed/Velocity/Acceleration/Momentum/Kinetic energy/Potential energy — 9 of 19 components) has zero open-license candidate anywhere. |
| BlenderKit | Search API results for "pendulum", "lever physics" | `"royalty_free"` (BlenderKit's own EULA — **not CC0/CC-BY**) | Free tier requires login; `download_asset` endpoint redirects to an HTML login page without a token | **Reject — license and access both fail the bar.** BlenderKit's "free" assets are royalty-free-with-terms, explicitly excluded by the wave's rules, independent of the auth gate. |
| itch.io | `3dmodelscc0.itch.io` — "Free CC0 Industrial 3D Models" (cable drum, car jack, electrical box, gas cylinder, pallet truck, platform trolley, work lights) | CC0 (per page) | "Name your own price" itch.io purchase flow (untested whether $0 goes through without a session) | **Reject — no apparatus match.** None of the 12 items map to a mechanics/energy taxonomy component. Not pursued further. |
| itch.io | `osmanfrat.itch.io/screw-and-spring` (screw + spring geometry, `.blend`/`.fbx`) | CC-BY 4.0 (per page) | "Name your own price" purchase flow, not verified as anonymous-downloadable | **Not pursued** — single small tangential asset (screw-focused, spring is secondary), and the itch.io $0-purchase flow needs session/CSRF handling that wasn't worth the budget given the file wouldn't materially move any of the 19 components on its own. Logged for a future wave if itch.io access gets resolved generally. |
| Khronos glTF-Sample-Assets | n/a | Reference only per wave rules | n/a | Not evaluated as content — explicitly excluded from real-content use by the wave's own rules. |

## 3. Rejection reasons (summary)

- **No open license recorded** (Sketchfab API returned `license: null`, i.e. the default
  restrictive "Standard" license, and `downloadType: "no"`): Old Balance Scale (romullus),
  Newton's Cradle (Sidharth1), Diorama of Simple Machines (jesus99).
- **License technically fine, but wrong file type for the pipeline**: Pendulum Experiment in
  Blender (dradnon) — `.blend` only, no glTF/GLB export offered.
- **License fine, geometry too sparse to be more than a placeholder on its own**: Lever —
  Spore_Explorer (136 faces), CC0-Lever — plaggy (660 faces).
- **Aesthetic/quality-bar mismatch, not a license problem**: Poly Haven `overhead_crane` (grimy
  industrial dockyard hoist vs. warm off-white clean-3D bar), Poly Haven `mousetrap` (spring
  apparatus but content-inappropriate object for kids).
- **Wrong license family entirely**: BlenderKit (`royalty_free` EULA, not CC0/CC-BY).
- **No apparatus match found at all despite targeted search**: motion cart, ramp/track,
  spring/Newton-meter force scale — searched specifically and turned up nothing usable anywhere
  (Poly Haven, Sketchfab, BlenderKit, general web).
- **Systemic blocker, not a per-asset rejection**: every Sketchfab candidate that otherwise passed
  (CC Attribution + `downloadType: "free"`) could not actually be fetched — `GET
  /v3/models/{uid}/download` returns `401 Authentication credentials were not provided` with no
  Sketchfab account/token available in this sourcing session. Confirmed this is a real OAuth gate
  (not a missing header) by testing the endpoint directly. Per the wave's rules this was not
  bypassed.

## 4. Downloaded-file list

None. `public/models/sourced/physics-mechanics/` contains only `validate-glb.mjs` (this wave's
copy of the same built-in-only GLB inspector used by the space wave), ready for whoever completes
an authenticated Sketchfab download or a commissioned model to run against the result.

## 5. Unresolved gaps and commissioned-model briefs

Two tracks to close these: (A) have a human/agent with a Sketchfab account complete the 12
already-license-cleared downloads in §2 (fast path — no commissioning needed, just the OAuth
step), or (B) commission clean-3D originals matching the Anatomy Atelier bar. Briefs below assume
track B since it's the only guaranteed path.

**1. Cart & Track (flagship — covers 9 of 19 components: Position, Distance, Displacement, Speed,
Velocity, Acceleration, Momentum, Kinetic energy, Potential energy)**
Geometry: a straight ruled track/rail (~1.5–2 m scale, tick marks every 0.1 m) with one simple
low-poly cart (rounded box on two visible wheels, ~15×10×8 cm scale) that can be duplicated for the
Momentum/collision-lab case (two carts). Warm wood or matte-painted-metal track, amber/coral cart
body consistent with the mechanics `force`/`kinetic-energy` model-metadata color language already
in `content/subjects/physics/mechanics/force/model-metadata.json` (oak wood + coral/blue accents,
no emissive, metallic=0). Reference imagery: any classroom "dynamics cart and track" photo (PASCO
or Vernier-style lab cart — do not copy their branding, just the silhouette/proportions). Named
nodes: `Track`, `Cart`, `CartWheelL`, `CartWheelR`. 3–6k tris.

**2. Ramp & Cart (variant of #1, adds an inclined section — covers Acceleration, Kinetic energy,
Potential energy, Efficiency)**
Same cart, track now has a hinged/fixed ramp section rising to ~30–40° with an adjustable-looking
pivot at the base (static geometry is fine; the angle change stays procedural/parametric in the
existing Three.js layer, matching how `energy/kinetic-energy/model-metadata.json` already frames
ramp+track as one asset). Named nodes: `Ramp`, `TrackRibbon`, `Cart`, `Mat`.

**3. Spring / Newton Scale (covers Force, Weight)**
A small hanging or push-style spring scale: coiled-spring body inside a slim housing with a
numbered dial face (0–10 N) and a hook. Pairs with the existing `force` model's "wooden box +
scale plate" concept already described in its `assetBrief`. Reference imagery: classic school
"newton meter"/spring balance. Named nodes: `ScaleHousing`, `SpringCoil`, `DialFace`, `Hook`.
1–3k tris.

**4. Friction Block & Plank (covers Friction, Normal force)**
A rectangular block (~10×10×6 cm) resting on a flat wooden plank that can tilt (static geometry;
tilt is parametric). Two surface material variants suggested (smooth vs. textured) so the same
mesh can carry both low- and high-friction demonstrations via material swap rather than a second
model. Named nodes: `Plank`, `Block`.

**5. Balance Scale (covers Mass — Sketchfab candidates in §2 are the fast path if unblocked)**
A simple two-pan beam balance, kid-legible (not ornate "Lady Justice" styling like the Sketchfab
candidates) — a horizontal beam on a central fulcrum with two flat pans, small stackable weight
cubes. Warm wood + brass-tone metal, matching the app's material language. Named nodes: `Beam`,
`Fulcrum`, `PanLeft`, `PanRight`, `WeightSet`.

**6. Pendulum (covers Gravity, Conservation of energy — Sketchfab pedrobax pendulum, 632 faces, is
the fast path if unblocked)**
A frame/stand with a string or rigid rod and a bob (sphere or cylinder weight), swinging in a
single plane. Named nodes: `Stand`, `Rod`, `Bob`.

**7. Lever/Pulley Work Station (covers Work, Power — Sketchfab lever/pulley candidates in §2 are a
fast path for individual parts, but none bundle a full rig)**
A simple first-class lever (plank on a fulcrum block with a weight on one end) *or* a single fixed
pulley with a rope and hanging load — either is sufficient to demonstrate work = force × distance;
recommend the lever as primary since it shares the plank/fulcrum language with #4. Named nodes:
`LeverArm`, `Fulcrum`, `Load`.

**heat-and-thermodynamics (not detailed — flag only, no brief authored)**: branch has no
low-level items or interactive components transcribed from the spec yet, so no component-level
brief can be written responsibly. The Sketchfab thermometer/gear candidates in §2 are logged as a
head start for whenever this branch gets SME-sourced content.

## Notes for the next wave / coordinator

- The real blocker in this scope was never license — it was *access*. 12 CC-BY, redistribution-
  permitting Sketchfab candidates are fully catalogued (uid, license, face count, format) in §2 and
  can be pulled in minutes by anyone with a free Sketchfab account and API token; that would close
  Mass, Gravity, Conservation of energy, Work, and give a head start on the un-detailed
  heat-and-thermodynamics branch without any commissioning cost.
- The 9-component kinematics core (cart+track+ramp) has no open-license candidate anywhere
  searched. This is the one that most needs either a paid/commissioned asset or a from-scratch
  Blender build (the existing `content/subjects/physics/mechanics/*/model-metadata.json`
  `assetBrief` fields already describe most of the needed geometry in enough detail to hand to a
  modeler directly).
