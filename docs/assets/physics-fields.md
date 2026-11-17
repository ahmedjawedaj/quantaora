# Physics — Electricity / Magnetism / Optics / Waves & Sound Asset Sourcing

Scope (Asset Recovery Wave 1, agent PHYSICS-FIELDS): circuits/components (battery, bulb, resistor,
breadboard, wire, switch), magnets (bar magnet, horseshoe magnet, compass), optics apparatus
(lens, prism, mirror, ray box), waves/sound equipment (tuning fork, speaker, slinky).
`physics-mechanics` (motion/forces/energy/thermodynamics) belongs to a different agent and is out
of scope here. Fields/waveforms themselves stay procedural (Three.js); only the physical
apparatus needed an authored model.

Ground truth: `content/taxonomy/physics.json`. Only `electricity` is `"detailed": true` (low-level
items + interactive components transcribed from the spec). `magnetism`, `light-and-optics`,
`waves`, and `sound` are `"detailed": false` — named only in the spec, not yet SME-sourced for
content authoring. Assets below for those branches are pre-sourced ahead of content authoring;
they should **not** be read as confirmation that content exists yet.

Last updated: 2026-08-18.

## 1. Branch/component mapping

| Branch (`detailed`) | Taxonomy component | Asset need | Status |
| --- | --- | --- | --- |
| Electricity (true) | Bulb | Incandescent/LED bulb with visible filament | **Sourced** — `bulb.glb` |
| Electricity (true) | Circuit builder / Wire | Wire/cable + connector props | **Sourced** — `wire-cable-set.glb` |
| Electricity (true) | Battery | AA/cell battery, or historic cell (trough/voltaic) | Gap — see brief |
| Electricity (true) | Switch | Toggle or lever switch | Gap — candidates identified, download-blocked (see §2) |
| Electricity (true) | Resistor | Axial resistor with colour bands | Gap — candidate identified, download-blocked (see §2) |
| Electricity (true) | Breadboard | Solderless breadboard | Gap — candidates identified, download-blocked (see §2) |
| Magnetism (false) | Compass | Magnetic compass w/ needle + dial | **Sourced** — `compass.glb` (restyle flag, see notes) |
| Magnetism (false) | Bar magnet | Red/blue-painted or plain bar magnet | Gap — candidate identified, download-blocked (see §2) |
| Magnetism (false) | Horseshoe magnet | U-shaped magnet | Gap — 2 candidates identified, download-blocked (see §2) |
| Light And Optics (false) | Lens | Biconvex/biconcave lens (ray-diagram friendly) | Partially sourced — `lens.glb` is a magnifying-glass proxy, see brief for a purpose-built lens |
| Light And Optics (false) | Prism | Triangular glass prism (dispersion demo) | Gap — no qualifying candidate found at all (see brief) |
| Light And Optics (false) | Mirror | Plane/concave lab mirror on a stand | Gap — one CC0 candidate rejected for fit (see §2/§3), see brief |
| Light And Optics (false) | Ray box | Light-source box with slit apertures | Gap — no candidate found anywhere (see brief) |
| Sound / Waves (false) | Tuning fork | Two-pronged metal resonator | Gap — candidate identified, download-blocked (see §2) |
| Sound / Waves (false) | Speaker | Bare speaker/driver (cone + magnet visible) | Gap — candidate identified, download-blocked; Poly Haven `boombox` rejected for fit (see §2/§3) |
| Sound / Waves (false) | Slinky | Coiled metal spring toy | Gap — candidate identified, download-blocked (see §2) |

Fields (electric/magnetic field lines), current-flow animation, Ohm's-law sliders, and
waveform/sound-wave visualizations stay procedural per the wave brief — no asset need there.

## 2. Candidate comparison table

Every candidate evaluated, not just winners.

| Candidate | Source | License (as read from source, not title) | Downloadable w/o auth? | Redistribution | Decision |
| --- | --- | --- | --- | --- | --- |
| `lightbulb_01` | Poly Haven (polyhaven.com/a/lightbulb_01) | CC0 1.0 | Yes (public Files API) | Full, incl. derivatives | **Accept** → `bulb.glb` |
| `lightbulb_led` | Poly Haven (polyhaven.com/a/lightbulb_led) | CC0 1.0 | Yes | Full | Reject — redundant with `lightbulb_01`; kept as a documented alternative, not downloaded (avoids importing an unneeded duplicate) |
| `magnifying_glass_01` | Poly Haven (polyhaven.com/a/magnifying_glass_01) | CC0 1.0 | Yes | Full | **Accept (partial fit)** → `lens.glb`; handheld magnifier, not a bare ray-diagram lens — see brief |
| `modular_electric_cables` | Poly Haven (polyhaven.com/a/modular_electric_cables) | CC0 1.0 | Yes | Full | **Accept** → `wire-cable-set.glb` (49-mesh kit: plugs, connector boxes, cable segments) |
| `seadogs_compass` | Poly Haven (polyhaven.com/a/seadogs_compass) | CC0 1.0 | Yes | Full | **Accept (restyle flag)** → `compass.glb`; worn brass/antique finish, not warm off-white — functionally accurate (needle, dial, hinge) |
| `circuit_board` | Poly Haven (polyhaven.com/a/circuit_board) | CC0 1.0 | Yes | Full | Reject — a bare PCB doesn't map to any single taxonomy component (Circuit is a system concept served by the builder, not one mesh) |
| `ornate_mirror_01` | Poly Haven (polyhaven.com/a/ornate_mirror_01) | CC0 1.0 | Yes | Full | Reject — decorative full-length ornate mirror; doesn't read as lab optics apparatus. See mirror brief in §5 |
| `boombox` | Poly Haven (polyhaven.com/a/boombox) | CC0 1.0 | Yes | Full | Reject — a full boombox obscures the speaker cone/diaphragm the Speaker component needs to teach; wrong level of abstraction |
| "Resonant Tuning Fork" (`e3939cec…`) | Sketchfab, user The_Vague_Dragon (Brikk) | CC Attribution | **No — Sketchfab gates all downloads behind an authenticated account** (confirmed via API: `GET /v3/models/{uid}/download` → 401 "Authentication credentials were not provided" with no anonymous path; web UI download button is also login-gated) | Would be full w/ attribution if downloaded | Blocked, not downloaded — see §5 gap + brief |
| "Horseshoe Magnet" (`9daa7e19…`) | Sketchfab, user ArchieCGD | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "Horseshoe Magnet" (`adf165f5…`) | Sketchfab, user Louis DeScioli | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "Cartridg Bar Magnet V2" (`d5069b60…`) | Sketchfab, user GaudiLabs | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "[CC0] Set of Electronic Components" (`f4cb777b…`, incl. resistor + breadboard meshes) | Sketchfab, user literallylara | **CC Attribution** (API `license.label` field — the uploader's own title claims "CC0" but the account's actual licence grant on Sketchfab is Attribution; title is not authoritative) | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded; licence label mismatch flagged for future re-check |
| "Arduino Breadboard - Low poly" (`497ee275…`) | Sketchfab, user Matys | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "Simple Protoboard" (`8b61a405…`) | Sketchfab, user TrentPierce | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded; also only 12 faces (near-primitive box) — would likely fail the "too low-poly for inspection" bar even if downloadable |
| "Simple Light Switch" (`32d02fa0…`) | Sketchfab, user BillieBones | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "Light Switch" (`808c3de4…`) | Sketchfab, user Avot | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "Slinky Toy" (`74e2f89c…`) | Sketchfab, user Studio Lab | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "SPEAKERS" (`09b0bd6a…`) | Sketchfab, user ZIRODESIGN | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded |
| "Woodworking Compass" | Sketchfab (CC0 search) | CC0 | No (same auth gate) | N/A | Reject — wrong tool (drafting/proportional compass, not a magnetic compass); also blocked |
| Various "Compass"/"prism"/"magnet" fantasy/game props | Sketchfab (CC0/CC-BY search) | Mixed | No / not evaluated further | N/A | Reject — stylised fantasy props, not physically representative |
| TurboSquid "free" tuning fork / prism / AA battery results | TurboSquid (free tier) | Marketing copy says "free"; not an open licence | N/A | Unverifiable | Reject per `docs/ASSET-LICENSES.md` known-traps list — unverifiable provenance |
| CGTrader "free" AA battery / breadboard | CGTrader (free tier) | Not an open licence | N/A | Unverifiable | Reject per known-traps list |
| Meshy "Prism" gallery items | Meshy (AI text-to-3D) | Claimed CC0 | N/A | Unverifiable generation provenance | Reject per known-traps list (AI text-to-3D generators are unverifiable provenance) |
| Cults3D / MakerWorld / Printables breadboard, AA battery items | Print-model marketplaces | Mostly STL, mixed/unclear commercial licences | N/A | Unverifiable | Reject — wrong format (STL, not glTF-friendly) and unclear licence terms |

## 3. Rejection reasons (summary)

- **`lightbulb_led`** — redundant duplicate of an already-accepted bulb asset; importing both
  would be reusing one branch's asset budget on two near-identical props with no distinct
  learning value.
- **`circuit_board`** — doesn't map to a single taxonomy component; a PCB is not what "Circuit"
  means at this level (Circuit is served by battery+bulb+wire+switch assembled in the builder).
- **`ornate_mirror_01`** — decorative, ornate, full-length wall mirror. Doesn't read as lab optics
  apparatus for a ray-reflection lesson; aesthetic and form factor both wrong.
- **`boombox`** — a sealed consumer electronics enclosure hides the speaker cone/diaphragm/magnet
  that the Speaker component exists to show. Wrong level of visual abstraction.
- **All Sketchfab candidates (10 total)** — every one requires an authenticated Sketchfab account
  to download (confirmed via direct API call: `/v3/models/{uid}/download` returns
  `401 {"detail": "Authentication credentials were not provided."}` with no anonymous fallback,
  and the web download button is equally login-gated as of 2025-12). No Sketchfab credentials are
  available in this environment, and creating a third-party account was out of scope for this
  wave. These are recorded as strong candidates (correct licence, correct redistribution rights,
  correct subject) for a future wave that has an authenticated Sketchfab session.
- **"[CC0] Set of Electronic Components"** — additionally flagged because the model's own display
  title claims "CC0" but Sketchfab's licence API field for it actually reports **CC Attribution**.
  Titles are not authoritative; always read the licence field. Re-verify on the model page before
  any future import.
- **"Simple Protoboard"** — even if it were downloadable, its 12-face geometry is essentially a
  textured box, likely too low-poly to read as an inspectable component up close (fails the
  Anatomy-quality "inspectable" bar from `docs/ASSET-SOURCING.md`).
- **TurboSquid free / CGTrader free / Meshy (AI text-to-3D) / Cults3D / MakerWorld / Printables**
  — all rejected per `docs/ASSET-LICENSES.md` "Known traps": unverifiable provenance, unclear
  commercial/redistribution terms, or (Meshy) AI-generated with no verifiable rights chain.
- **"Woodworking Compass" and fantasy-styled compass/prism/magnet props** — wrong object (drafting
  tool, not a magnetic compass) or too stylised/fantastical to teach the real apparatus.

## 4. Downloaded files

All four in `quantaora-app/public/models/sourced/physics-fields/`, each with a `.license.json`
sidecar recording source, licence, attribution, redistribution status, size, sha256, and
structural-validation counts.

| File | Component | Size | sha256 (first 16 hex) |
| --- | --- | --- | --- |
| `bulb.glb` | Electricity / Bulb | 3.03 MB | `a2322de94bb65e3` |
| `lens.glb` | Light And Optics / Lens (proxy) | 1.13 MB | `2e3176ea729a5e0f` |
| `wire-cable-set.glb` | Electricity / Wire (circuit builder kit) | 5.71 MB | `c7a0cdc1bead9459` |
| `compass.glb` | Magnetism / Compass | 8.03 MB | `9328639250565d38` |

All four were originally Poly Haven glTF (separate `.gltf` + `.bin` + JPG textures, CC0,
downloaded through the public unauthenticated Poly Haven Files API). Poly Haven does not publish
a packaged `.glb` for models — only separate glTF. They were repacked into single self-contained
`.glb` files by a project-authored script,
`quantaora-app/public/models/sourced/physics-fields/pack-polyhaven-glb.mjs` (Node built-ins only,
no new npm dependency): it downloads the `.gltf` + `.bin` + referenced textures, deduplicates
repeated image references, appends all image bytes into the binary buffer as new `bufferView`
entries, and writes a standard two-chunk GLB (JSON chunk + BIN chunk). This changes the container
only — no mesh/material data was altered — and keeps the CC0 licence chain unbroken (Poly Haven's
licence explicitly permits repackaging/derivatives).

Every file was structurally validated with
`quantaora-app/public/models/sourced/physics-fields/validate-glb.mjs` (GLB magic header, JSON+BIN
chunk parse, scene/node/mesh/material/texture/image/animation/accessor counts, declared-length vs.
actual-file-size match) plus an extra bounds/magic-byte pass (every `bufferView` inside the
buffer's bounds; every embedded image's bytes start with a valid JPEG/PNG magic header at its
declared offset). All four passed every check. None were opened in an actual 3D viewer/renderer in
this pass — that is flagged explicitly in each `.license.json`'s `notes` field as an open item for
whichever agent/QA step does visual/render inspection next.

Texture resolution: `bulb.glb`, `lens.glb`, `compass.glb` used Poly Haven's 2k maps;
`wire-cable-set.glb` was built from 1k maps specifically (its 2k build hit 17.6 MB, over the 15 MB
target for a 49-mesh kit; 1k brought it to 5.98 MB with no meaningful loss of readability for
small connector/cable props).

## 5. Unresolved gaps — commissioned-model briefs

For every gap not resolved by a download, here is what a commissioned/authored model would need.
None of these were fabricated as placeholders; they are genuinely absent (or auth-blocked) and are
being explicitly flagged per the "do not skip silently" rule.

1. **Battery (AA/cell, Electricity)** — Geometry: cylindrical AA/C-cell with a flat negative
   terminal and a raised positive nub, wraparound label graphic (can be a simple two-tone
   material instead of a printed label), correct proportions (~50mm x 14mm for AA). Alternative:
   a historic voltaic/trough cell (glass jar + metal plates) if the branch wants a "how batteries
   work" angle rather than a modern cell. Reference imagery: any standard AA battery photo.
   Interactive need: needs a clear +/− terminal distinction for circuit-polarity teaching.

2. **Switch (Electricity)** — Simple SPST toggle or knife switch on a small base, two visible
   states (open/closed) as either two meshes or a hinge-rigged lever, metal contacts visibly
   touching/separated so kids can see *why* current stops. Reference: classic knife switch is more
   legible for teaching than a wall toggle switch (the Sketchfab candidates found were both wall
   toggles, a weaker apparatus for "why does breaking the circuit stop the bulb").

3. **Resistor (Electricity)** — Small cylindrical axial resistor with 4 colour bands, two wire
   leads. Very simple geometry (a capsule + two thin cylinders), most of the teaching value is in
   the colour-band material, not mesh complexity — a good first commission candidate since it is
   cheap to build well.

4. **Breadboard (Electricity)** — Rectangular perfboard block with the standard visible hole grid
   texture/normal map and two red/blue power rails along the edges. Needs enough resolution in the
   hole-grid texture to read as a real breadboard, not a generic grey box (this is exactly where
   the rejected Sketchfab "Simple Protoboard" 12-face candidate failed).

5. **Bar magnet (Magnetism)** — Rectangular bar, red half / blue half (N/S convention), rounded
   edges, small embossed or painted "N" and "S" letters at the ends. Simple, high learning value
   for polarity teaching.

6. **Horseshoe magnet (Magnetism)** — U-shaped bar, same red/blue N/S convention at the two pole
   faces, painted or plated metal finish. Two Sketchfab candidates exist with the right shape
   language if a future wave gets Sketchfab access.

7. **Prism (Light And Optics)** — Equilateral triangular glass prism, ~50–80mm edge length,
   perfectly clear/transparent material (glass IOR ~1.5) so light dispersion into a rainbow reads
   correctly when lit. No qualifying candidate was found on any source checked (Poly Haven,
   Sketchfab CC0/CC-BY, TurboSquid-free, CGTrader-free, Meshy) — this is a clean-slate commission.
   Reference imagery: any classic Newton-dispersion-experiment prism photo.

8. **Mirror (Light And Optics)** — Small plane (or slightly concave) lab mirror mounted upright on
   a simple stand/base, clean rectangular or circular reflective surface, no ornate frame. The one
   CC0 candidate found (Poly Haven `ornate_mirror_01`) was rejected specifically for being too
   decorative — this commission should intentionally be the visual opposite: plain, functional,
   classroom-apparatus styling.

9. **Ray box (Light And Optics)** — A small box-shaped light source with a slit/comb aperture on
   one face that produces multiple parallel light rays (the classic optics-bench "ray box").
   No candidate was found on any source checked. Geometry is simple (a box + slotted front plate);
   most of the teaching value would come from the procedural light-ray rendering fed by this mesh
   as an anchor object, similar to how fields stay procedural elsewhere in this wave.

10. **Tuning fork (Sound/Waves)** — Two-pronged metal fork with a handle, thin prongs for a
    springy silhouette. One Sketchfab CC-BY candidate ("Resonant Tuning Fork", 396 faces) exists
    and would need only a re-check + download once Sketchfab access is available; otherwise a
    cheap commission (simple bent-cylinder geometry, metal PBR material).

11. **Speaker (Sound/Waves)** — A bare speaker driver: circular frame, visible cone/diaphragm,
    dust cap, surround, and magnet housing on the back — the classroom point is "you can see the
    cone move," which a sealed boombox/enclosure defeats. One Sketchfab CC-BY candidate
    ("SPEAKERS") exists; otherwise commission a simple single-driver unit, not a full audio
    product.

12. **Slinky (Sound/Waves)** — Coiled metal spring toy, used to demonstrate longitudinal/
    transverse wave propagation. One Sketchfab CC-BY candidate ("Slinky Toy") exists; this is
    also a case where the taxonomy interactive component itself (a stretch/compress animation)
    may be better served procedurally (an animated coil driven by a spring simulation) with the
    mesh only providing the rest-state look — flagging as a candidate for "procedural + simple
    anchor mesh" rather than a fully authored animated GLB.

## Summary of what to unblock next

The single highest-leverage fix for this branch set is **Sketchfab account access** — 10 of the
remaining 12 gaps already have a correctly-licensed, correctly-downloadable-in-principle candidate
identified and recorded above; they are blocked purely on authentication, not on availability or
licensing. Only prism, mirror, ray box (and arguably a from-scratch battery/switch/resistor for a
consistent visual family) need genuine new commissions.
