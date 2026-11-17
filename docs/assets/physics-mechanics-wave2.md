# Physics — Mechanics Apparatus Asset Sourcing (Wave 2)

Agent: PHYSICS-MECHANICS-WAVE2. Scope (as assigned): search additional authoritative/open 3D
catalogues beyond what wave 1 covered for **physics mechanics apparatus not yet covered: carts,
tracks/ramps, pendulum, pulley, spring, gears, levers, balls/projectiles, and measuring apparatus
(rulers, stopwatches, force meters etc.)**.

This is a read-only-to-the-rest-of-the-repo sourcing pass: nothing in `quantaora-app/src/**` was
touched, and nothing here is wired into `modelRegistry.ts` or any route. Sourcing only.

Date: 2026-08-18.

## 0. Ground truth and duplicate-coverage check (read before the tables below)

`docs/assets/physics-mechanics.md` (wave 1) already did an exhaustive pass over
`content/taxonomy/physics.json`'s `mechanics`/`energy` branches and Poly Haven's full 521-model
catalogue, and concluded: **zero downloadable assets** for any of cart/track/ramp/
pendulum/spring/lever/pulley/gear/balance-scale, because every license-qualifying candidate lived
on Sketchfab behind its OAuth download gate (`GET /v3/models/{uid}/download` -> `401`, no
credentials available), and Poly Haven's catalogue had no matching models at all. Wave 1's
`public/models/sourced/physics-mechanics/` therefore holds only a validator script, no GLBs.

Re-confirmed at the start of this wave, not assumed:

- **Poly Haven's catalogue is unchanged** since wave 1 (521 models, same total, fetched fresh from
  `https://api.polyhaven.com/assets?type=models`) for the cart/track/pendulum/spring/lever/pulley/
  gear/balance keyword set wave 1 already scanned. This wave scanned it again with a **wider**
  keyword set (`ruler`, `stopwatch`, `watch`, `clock`, `timer`, `ball`, `sphere`, `tape`, `meter`,
  `wagon`, `trolley`, `incline`, `dumbbell`, plus the wave-1 set) — new hits this time: a measuring
  tape, several clocks/watches, and several sports balls (§2).
- **Sketchfab's OAuth download gate is unchanged.** Re-tested directly in this wave:
  `GET https://api.sketchfab.com/v3/models/{uid}/download` -> `401
  {"detail":"Authentication credentials were not provided."}`, same as wave 1 and as
  `physics-energy-wave2`. Public search/read (`GET /v3/search`, `GET /i/models/{uid}`) still works
  without auth; only the file fetch is gated. Wave 1's 12-candidate CC-BY shortlist (balance scale,
  pendulum, lever, pulley, spring, gear) is still the best-documented Sketchfab list and was not
  re-collected here — see wave 1's §2 instead of duplicating it.
- **Smithsonian 3D (`3d.si.edu`)** — every request to the 3D voyager portal (page loads and its
  search API) returned a Cloudflare bot-block `403` from this environment, identical to what
  `physics-energy-wave2` independently found for the same domain. **Not the same as unlicensed —
  the source could not be reached at all.** The separate Smithsonian **Open Access metadata API**
  (`api.si.edu`, a different host, works with the public `DEMO_KEY`) was also queried for
  "balance scale scientific instrument", "orrery", "antique lever simple machine", "gear
  mechanism model", "pendulum clock mechanism" — it returned museum/library *catalog* records
  (mostly 2D images, one steam-engine patent-model photo) with no `3d_model`/`usdz`/`3d_pdf`
  media type for any of them. Net: Smithsonian yielded nothing usable in this session, for two
  independent reasons (voyager portal blocked; Open Access API has no 3D geometry files indexed
  for this subject).
- **NIH 3D** (`3d.nih.gov`) — searched `lever`; zero results. Expected: it is a biomedical-imaging
  repository (confirmed by `docs/ASSET-LICENSES.md`'s existing "Known traps" note), not a
  mechanics-apparatus source. Not pursued further.
- **Quaternius** — no dedicated mechanics/apparatus pack exists (checked the pack index and the
  "Ultimate Platformer Pack", the closest tangential hit for spring-like/mechanical props; its own
  listing only names generic categories — "animated mechanics and much more" — with no per-asset
  filenames disclosed on the pack page, so a specific spring/lever/gear prop could not be confirmed
  to exist without downloading a full untargeted pack on speculation. Not pursued, matching how
  `physics-energy-wave2` treated Quaternius's sci-fi packs for the same reason).
- **Kenney.nl** — `physics-energy-wave2` logged this source as "not pursued... client-rendered JS,
  unreachable via plain HTTP fetch" (their WebFetch-based check hit a JS-rendered shell). This wave
  fetched the raw asset-page HTML directly with `curl` instead and found each pack's actual
  download URL embedded as a plain `<a href="...zip">` link (e.g.
  `https://kenney.nl/media/pages/assets/factory-kit/.../kenney_factory-kit_3.0.zip`) — **fully
  reachable, no auth, no JS execution needed.** Three packs were downloaded and inspected in full
  in this wave: **Factory Kit**, **Toy Car Kit**, **Car Kit** (see §2). This is a real, working,
  CC0 source for this domain — the sibling wave's "unreachable" conclusion was a tooling artifact,
  not a property of the source.

## 1. Category mapping (this wave's 9 requested apparatus types)

| Requested category | Status this wave |
| --- | --- |
| Carts | **Still a gap.** Closest real candidate found (Kenney Toy Car Kit vehicles) rejected for aesthetic mismatch — see §2/§3. Commission brief carried forward from wave 1, reinforced below. |
| Tracks/ramps | **Still a gap.** Same Toy Car Kit near-miss (it does have literal straight-track and hill/ramp segments) rejected for the same reason. Commission brief carried forward. |
| Pendulum | **Still a gap.** No CC0 source found anywhere searched this wave (Poly Haven: none; Kenney: none in any of the 3 packs checked; Smithsonian: unreachable). Wave 1's Sketchfab CC-BY candidate (`pedrobax`, 632 faces) remains the fastest path if Sketchfab access is ever obtained. |
| Pulley | **Still a gap.** Kenney Factory Kit's `crane`/`crane-lift`/`crane-magnet` evaluated and rejected (§2/§3) — a small hook/magnet gantry, not a legible pulley-wheel-and-rope demo. No other CC0 candidate found. Wave 1's Sketchfab CC-BY candidates (`LeakyRUS`, `harigoat`) remain the fastest path if unblocked. |
| Spring | **Still a gap.** No CC0 source found anywhere searched this wave. Wave 1 already rejected Poly Haven's `mousetrap` on content-appropriateness grounds (still true); no new spring-apparatus candidate surfaced. Wave 1's Sketchfab CC-BY candidates remain the fastest path if unblocked. |
| Gears | **Sourced.** `gear-small-kenney.glb` + `gear-large-kenney.glb` (Kenney Factory Kit `cog-a`/`cog-c`, CC0). First open-license gear geometry found for this scope across both waves. |
| Levers | **Still a gap — near-miss identified and explicitly rejected.** Kenney Factory Kit ships models literally named `lever-single.glb`/`lever-double.glb`, but they model a *control lever* (a push-plunger/joystick shape), not a *simple-machine lever* (plank on a fulcrum with a load) — wrong concept for the Work/lever taxonomy need. See §2/§3. |
| Balls/projectiles | **Sourced.** `baseball-polyhaven.glb` (Poly Haven `baseball_01`, CC0) — clean, correctly-scaled, kid-recognizable. |
| Measuring apparatus (rulers, stopwatches, force meters) | **Partially sourced.** `measuring-tape-polyhaven.glb` covers the ruler/tape-measure need. `alarm-clock-polyhaven.glb` is kept as a timing-apparatus stand-in but is explicitly **not** a stopwatch (see its `.license.json` caveat) — a literal stopwatch/digital-timer remains a gap, and no force-meter/Newton-scale candidate was found anywhere (same gap wave 1 already logged for Force/Weight). |

## 2. Candidate comparison table

Every candidate evaluated in this wave, kept and rejected. (Wave 1's own comparison table,
`docs/assets/physics-mechanics.md` §2, is not reproduced here — see it directly for the ~25
Sketchfab/Poly Haven/BlenderKit/itch.io candidates already logged there.)

| Source | Asset | License (verified) | Downloadable? | Accept/Reject |
| --- | --- | --- | --- | --- |
| Poly Haven | `measuring_tape_01` — Kuutti Siitonen | CC0 1.0 (per `/files` + `/info` API) | Yes, public Files API, no auth | **Accept** -> `measuring-tape-polyhaven.glb`. Real 3m tape measure, correct scale. Diffuse texture has a small fictional "P-TECH"/"3m" decal, not a real trademark — flagged in the sidecar for a reviewer to eyeball. |
| Poly Haven | `baseball_01` — Rico Cilliers | CC0 1.0 | Yes | **Accept** -> `baseball-polyhaven.glb`. Clean, correctly-scaled (~7.5cm), no branding. |
| Poly Haven | `alarm_clock_01` — James Ray Cock / Yann Kervran | CC0 1.0 | Yes | **Accept (with caveat)** -> `alarm-clock-polyhaven.glb`. Classic twin-bell analog clock, no visible brand. Kept as the best kid-recognizable timing prop found, but it is not a literal stopwatch — see notes in its `.license.json`. |
| Poly Haven | `wall_clock` — PierreB3D | CC0 1.0 | Yes | **Reject** — clean modern design, but the dial face carries a real, legible **"BRAUN"** brand watermark. A licensed CC0 3D file does not clear a real trademark printed on the object; not worth the risk when `alarm_clock_01` is brand-free. |
| Poly Haven | `football` / `dirty_football` — Amal Kumar | CC0 1.0 | Yes | **Reject (secondary to baseball)** — both are explicitly "battered, partially deflated... scuffed... dirty" per their own descriptions; oval shape is also a worse fit than a round ball for a generic projectile-motion prop. `baseball_01` covers the need more cleanly. Logged here as a backup, not discarded from consideration. |
| Poly Haven | `pocket_watch`, `vintage_pocket_watch`, `mantel_clock_01`, `vintage_grandfather_clock_01`, `vintage_telephone_wall_clock` | CC0 1.0 | Yes | **Reject** — all "antique/ornate/vintage" per their own tags; duplicate the timing-apparatus role `alarm_clock_01` already fills, with a fussier/less-legible-to-a-kid aesthetic. |
| Poly Haven | `hand_truck`, `CoffeeCart_01`, `industrial_storage_cart`, `tool_cart`, `portable_welding_cart`, `old_military_compressor` (all tagged "cart") | CC0 1.0 | Yes | **Reject — wrong concept.** All are real-world warehouse/catering/workshop carts (sack trucks, rolling tool chests), not a physics-lab dynamics cart for a ruled track. Confirms wave 1's finding that no dynamics-cart model exists on Poly Haven under any tag. |
| Poly Haven | Full 521-model catalogue, re-scanned with an expanded keyword list (`ruler`, `stopwatch`, `watch`, `clock`, `timer`, `ball`, `sphere`, `tape`, `meter`, `wagon`, `trolley`, `incline`, `dumbbell`, plus wave 1's set) | CC0 site-wide | Direct CDN, no auth | Confirms **still zero** matches for cart/track/ramp/pendulum/pulley/spring/lever/gear/balance/dumbbell; the only genuinely new hits were the measuring tape, clocks/watches, and sports balls listed above. |
| Kenney (Factory Kit, `kenney_factory-kit_3.0.zip`) | `cog-a.glb` (6-tooth gear) | CC0 1.0 (per pack's bundled `License.txt`) | Yes, plain HTTPS zip download from kenney.nl, no auth | **Accept** -> `gear-small-kenney.glb`. Clean trapezoidal-tooth gear silhouette, single mesh. Shipped referencing a shared external `colormap.png`; re-packed to a self-contained `.glb` (see `.license.json`). |
| Kenney (Factory Kit) | `cog-c.glb` (8-tooth gear w/ center hole) | CC0 1.0 | Yes | **Accept** -> `gear-large-kenney.glb`. Same reasoning; kept as a size-variant pair with `cog-a` for a meshing-gears demo. |
| Kenney (Factory Kit) | `cog-b.glb`, `cog-d.glb`, `cog-e.glb` | CC0 1.0 | Yes | **Reject (redundant/weaker silhouette)** — `cog-b` is a near-duplicate of `cog-a`'s tooth family at a different size (not worth a third near-identical file); `cog-d`/`cog-e` have a rounded, scalloped "flower" tooth profile that reads less clearly as "gear" to a child than `cog-a`/`cog-c`'s squared teeth. |
| Kenney (Factory Kit) | `lever-single.glb`, `lever-double.glb` | CC0 1.0 | Yes | **Reject — wrong concept.** Models a push-plunger/control-lever/joystick shape (a factory control switch), not a simple-machine lever (plank on a fulcrum with a load on one end). Using it would teach the wrong object for the taxonomy's Work/lever apparatus need. |
| Kenney (Factory Kit) | `crane.glb`, `crane-lift.glb`, `crane-magnet.glb` | CC0 1.0 | Yes | **Reject** — a small desktop hook/electromagnet gantry crane. Implies lifting, but does not show a legible pulley wheel + rope + load; would not read as "here is a pulley" to a kid without a lot of squinting. |
| Kenney (Factory Kit) | `piston-round.glb`, `piston-square.glb`, `piston-thin-round.glb`, `piston-thin-square.glb`, `conveyor-*` (dozens of variants), `robot-arm-a.glb`, `robot-arm-b.glb`, `machine*.glb`, `pipe-*.glb` | CC0 1.0 | Yes | **Reject (out of this wave's 9-category scope)** — real, clean, CC0 mechanical parts, but none map to cart/track/pendulum/pulley/spring/gear/lever/ball/measuring-apparatus. Logged as a head start for a future heat-and-thermodynamics or industrial-mechanism wave. |
| Kenney (Toy Car Kit, `kenney_toy-car-kit.zip`) | `track-wide-straight.glb`, `track-*-straight-hill-beginning/complete/end.glb` (ramp/hill sections), `vehicle-racer-low.glb`, `vehicle-suv.glb`, `wheel-{small,medium,large}.glb`, `supports*.glb` | CC0 1.0 (per pack's bundled `License.txt`) | Yes, plain HTTPS zip, no auth | **Reject — aesthetic/thematic mismatch, not a license problem.** This is literally a "Toy Car Kit": bright-orange glossy plastic race-track ribbon and cartoon toy cars (chunky proportions, oversized wheels, "monster truck"/"speedster" naming). It has the right *shapes* (straight track segments, ramp/hill segments, a low simple vehicle body, separate wheels) but the wrong *register* — reads as a toy racetrack, not a physics-lab motion apparatus, which is exactly what the "not gamey" quality bar in this wave's brief rules out. Documented in full because the shape-match is real: a future modeler could use this pack's proportions as a *reference*, or a re-skin/re-material pass could salvage it, but it is not being kept as-is. |
| Kenney (Car Kit, `kenney_car-kit.zip`) | Full pack (`sedan`, `suv`, `ambulance`, `firetruck`, `taxi`, `kart-*`, `tractor*`, `wheel-*`, debris parts) | CC0 1.0 | Yes | **Reject — no track/ramp pieces at all** (this pack is vehicles-only; `Toy Car Kit` is the sibling pack with track geometry), and the vehicles are realistic city cars/emergency vehicles, an even worse fit for a lab cart than Toy Car Kit's already-rejected racers. |
| Kenney (Prototype Kit) | Full pack | CC0 1.0 | Yes (not downloaded — page description checked first) | **Not pursued** — page's own description lists only "animals, characters, vehicles, buildings, walls, wheelchairs"; no gear/lever/spring/pulley/cart-and-track content named. Lower-confidence than Factory Kit / Toy Car Kit, not worth the download budget after those two were already fully inspected. |
| Sketchfab | (not re-collected — see wave 1 §2 for the full 12-candidate CC-BY shortlist) | CC Attribution (various) | **No — re-confirmed** `GET /v3/models/{uid}/download` -> `401`, no credentials in this session | Still blocked. Search/read API (no auth) re-confirmed working; only the file-download endpoint is gated. |
| Smithsonian (`3d.si.edu`) | n/a — could not search | n/a | **No — Cloudflare `403` bot-block** on every request (page loads and search API) | Not evaluated — source unreachable, not a licensing rejection. |
| Smithsonian Open Access API (`api.si.edu`, `DEMO_KEY`) | Searched "balance scale scientific instrument", "orrery", "antique lever simple machine", "gear mechanism model", "pendulum clock mechanism" | n/a | Reachable, but returns catalog metadata only | **Reject — no 3D geometry files indexed** for any of these queries; results are 2D photos of library/museum records (one hit: a 2D photo of a "Mayhew Diaphragm Steam Engine, Patent Model"), not downloadable 3D assets. |
| NIH 3D (`3d.nih.gov`) | Searched "lever" | n/a | Reachable | **Reject — zero results.** Confirms `docs/ASSET-LICENSES.md`'s existing note that NIH 3D is a biomedical-imaging repository, not a mechanics-apparatus source. |
| Quaternius | Pack index + "Ultimate Platformer Pack" (closest tangential hit) | CC0 (site-wide) | Whole-pack download only; no per-asset filenames disclosed on the pack page | **Not pursued** — same reasoning `physics-energy-wave2` used for Quaternius's sci-fi packs: confirming a specific spring/lever/gear prop exists would require downloading a full untargeted pack on speculation, low-confidence use of budget. |
| NASA 3D Resources | GitHub repo `3D Models/` tree, browsed for mechanical/wheeled/apparatus content | Public domain | Yes | **Reject — no apparatus match.** Catalogue is spacecraft/satellites/planetary bodies; no mechanics-lab apparatus of any kind, confirmed by browsing the repo's model list (satellites, landers, telescopes — nothing wheeled/geared/levered in a mechanics-lab sense). |

## 3. Rejection reasons (summary)

- **Real trademark visible on an otherwise-CC0 model**: Poly Haven `wall_clock` ("BRAUN" watermark
  on the dial face).
- **Wrong concept despite a matching name**: Kenney `lever-single`/`lever-double` (control lever,
  not simple-machine lever); Kenney `crane*` (hook/magnet gantry, not a legible pulley
  demonstration).
- **Aesthetic/register mismatch, not a license problem**: Kenney Toy Car Kit's track+vehicle set
  (glossy toy-race-track orange plastic and cartoon cars — the exact "gamey" register this wave's
  brief rules out), Kenney Car Kit (same pack family, no track pieces at all and even more
  realistic-vehicle-themed).
- **Real-world object, wrong sub-type**: Poly Haven `hand_truck`/`CoffeeCart_01`/
  `industrial_storage_cart`/`tool_cart`/`portable_welding_cart`/`old_military_compressor`
  (warehouse/catering carts, not a dynamics-lab cart); Poly Haven `football`/`dirty_football`
  (worn/dirty, oval — `baseball_01` is the cleaner pick); Poly Haven antique
  clocks/watches (ornate, duplicate `alarm_clock_01`'s role with a fussier look).
- **Redundant/weaker within the same accepted family**: Kenney `cog-b` (near-duplicate of
  `cog-a`), `cog-d`/`cog-e` (rounded "flower" tooth profile, less legible as "gear" to a kid).
- **Source unreachable in this session (not a licensing rejection)**: Smithsonian 3D voyager
  portal (`3d.si.edu`, Cloudflare `403` on every request).
- **Source reachable but has no matching content**: Smithsonian Open Access API (catalog metadata
  only, no 3D files for these queries), NIH 3D (zero results, confirmed biomedical-only), NASA 3D
  Resources (spacecraft-only catalogue, no mechanics apparatus).
- **Systemic blocker, unchanged from wave 1**: Sketchfab's OAuth-gated file download, re-confirmed
  directly in this wave.
- **Not pursued (low-confidence, budget-conscious)**: Quaternius (no per-asset filenames disclosed
  without downloading a full speculative pack), Kenney Prototype Kit (page description names no
  relevant apparatus).

## 4. Downloaded-file list

All five in `quantaora-app/public/models/sourced/physics-mechanics-wave2/`, each with a
`.license.json` sidecar (source, creator, license, license URL, attribution requirement/text,
redistribution status, date sourced, original format, repackaging method, file size, sha256, and a
structural-validation block), matching the sidecar shape used in `physics-fields/` and
`physics-energy-wave2/`. **Every file's `notes` field explicitly states
`render-review-pending`** — none of these have been opened in an actual 3D viewer/renderer or
visually inspected in-app; only structurally validated.

| File | Apparatus category | Size | Approx. dimensions | sha256 (first 16 hex) |
| --- | --- | --- | --- | --- |
| `measuring-tape-polyhaven.glb` | Measuring apparatus (ruler/tape) | 1.21 MB | 0.041 x 0.073 x 0.169 m | `d936ee53a39f2e0e` |
| `baseball-polyhaven.glb` | Balls/projectiles | 2.84 MB | 0.074 x 0.075 x 0.075 m | `1ac739a7d1774475` |
| `alarm-clock-polyhaven.glb` | Measuring apparatus (timing, stopwatch-adjacent — see caveat above) | 4.47 MB | 0.096 x 0.132 x 0.174 m | `47c9939fd41a1841` |
| `gear-small-kenney.glb` | Gears (6-tooth) | 24.9 KB | unit-normalized [-1,1]; scale at integration | `792c000b1cabc08a` |
| `gear-large-kenney.glb` | Gears (8-tooth, center hole) | 24.9 KB | unit-normalized [-1,1]; scale at integration | `fb0978c478fa0577` |

**Poly Haven assets** (`measuring-tape-polyhaven.glb`, `baseball-polyhaven.glb`,
`alarm-clock-polyhaven.glb`) were downloaded as separate `.gltf` + `.bin` + JPG textures via Poly
Haven's public unauthenticated Files API, then repacked into single self-contained `.glb` files by
`pack-polyhaven-glb.mjs` in this directory — a byte-for-byte copy of the wave-1
`physics-fields`/`physics-energy-wave2` script (Node built-ins only, no new dependency): downloads
the files, deduplicates repeated image references, appends image bytes into the binary buffer as
new `bufferView` entries, writes a standard two-chunk GLB. Container-only change; no mesh/material
data altered.

**Kenney assets** (`gear-small-kenney.glb`, `gear-large-kenney.glb`) started as Kenney's own
official per-model GLB export from the Factory Kit pack, which references one shared external
`colormap.png` texture by relative uri (valid glTF, but not a single self-contained file as
packaged). `embed-kenney-texture.mjs` (new script, written in this wave, Node built-ins only, no
new dependency) embeds that shared PNG into each target `.glb` as a new `bufferView`, producing a
fully self-contained single file. Container-only change; no mesh/material/UV data altered.

Every file was structurally validated two ways:

1. `validate-glb.mjs` in this directory (copy of the wave-1 validator): GLB magic header, JSON+BIN
   chunk parse, scene/node/mesh/material/texture/image/animation/accessor/bufferView counts,
   embedded-vs-external image counts, declared-length vs. actual-file-size match, approximate
   bounding box from POSITION accessors.
2. The official **Khronos glTF-Validator** (npm package `gltf-validator@2.0.0-dev.3.10`,
   `validateBytes`) — **all five files passed with 0 errors** (`measuring-tape-polyhaven.glb`: 1
   warning; `baseball-polyhaven.glb`: 1 warning; `alarm-clock-polyhaven.glb`: 5 warnings; both gear
   files: 0 warnings). Warnings on the Poly Haven files are pre-existing upstream (not introduced
   by repackaging) and did not block validation.

## 5. Unresolved gaps and commissioned-model briefs

Six of the nine requested apparatus categories are still unfilled by any downloadable open-license
asset after two full sourcing waves. These briefs update/reinforce (not replace) wave 1's briefs in
`docs/assets/physics-mechanics.md` §5, since nothing in this wave changed their geometry needs —
only added negative evidence that no better source exists.

1. **Cart & Track / Ramp & Cart** — wave 1's brief stands unchanged (see
   `docs/assets/physics-mechanics.md` §5 briefs #1–2). This wave's one new data point: Kenney's Toy
   Car Kit *has* the right rough shapes (straight track ribbon segments, hill/ramp segments, a
   low simple vehicle body, separate wheel meshes) in a fully CC0, no-auth-needed, already-inspected
   pack — but in a glossy orange-plastic toy-race-track register that fails the "not gamey" bar. A
   commissioned artist could use this pack's proportions/segmentation approach as a *reference for
   scale and how to break a track into modular pieces* without adopting its material language.

2. **Pendulum** — wave 1's brief stands unchanged (`docs/assets/physics-mechanics.md` §5 brief #6).
   No new CC0 candidate found this wave on any of the 5 additional sources checked.

3. **Pulley / Lever/Pulley Work Station** — wave 1's brief stands unchanged (§5 brief #7). This
   wave additionally confirmed Kenney's `crane*` models are not a usable substitute (see §2/§3).

4. **Spring / Newton Scale** — wave 1's brief stands unchanged (§5 brief #3). No new candidate
   found.

5. **Balance Scale** — wave 1's brief stands unchanged (§5 brief #5). No new candidate found.

6. **Stopwatch / lab timer** (new, narrower gap surfaced by this wave) — the Force/measuring-
   apparatus need is now partially covered by `alarm-clock-polyhaven.glb`, but a literal stopwatch
   (digital LCD timer, or a classic analog stopwatch with a start/stop button and a lap-second
   bezel) was not found anywhere in this session. Cheap commission: a small handheld puck shape
   with a round face (minute/second sub-dials or a simple LCD digit strip) and a top plunger
   button — low geometry cost, useful for the Speed/Velocity "cart + track + stopwatch" scenes
   named in wave 1's Cart & Track brief.

## Notes for the next wave / coordinator

- **Kenney.nl is a real, usable CC0 source for this domain** despite the sibling
  `physics-energy-wave2` wave's note that it was "unreachable" — that was a WebFetch/JS-rendering
  tooling limitation, not a property of the site. Fetching the plain asset-page HTML with `curl`
  and grepping for the `.zip` download link works every time, no auth, no session, no JS engine
  needed. Worth re-checking Kenney directly (not just through a markdown-summarizing web-fetch
  tool) for any future wave in this project that hits a "cannot reach" dead end there.
- Both gear files are Kenney's stock **unit-normalized** scale ([-1, 1] bounding cube), not
  real-world meters like the Poly Haven assets — whoever integrates them needs to apply an explicit
  scale factor (a car engine's cog is a few centimetres; a factory drivetrain gear could be tens of
  centimetres — pick per lesson).
- The six remaining gaps (cart, track/ramp, pendulum, pulley, spring, lever/simple-machine) are now
  confirmed absent across **two full sourcing waves** and **eight distinct catalogues** (Poly Haven,
  Sketchfab, BlenderKit, itch.io, Kenney x3 packs, Quaternius, Smithsonian x2 endpoints, NIH 3D,
  NASA 3D Resources). At this point the highest-leverage next step is almost certainly either (a)
  Sketchfab account/API-token access — wave 1 already has a fully vetted 12-candidate CC-BY
  shortlist waiting on exactly that — or (b) commissioning the six briefs above (this wave's #1 and
  wave 1's #2–5), not further open-catalogue searching.
