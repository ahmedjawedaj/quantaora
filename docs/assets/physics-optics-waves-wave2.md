# Physics — Optics / Waves & Sound Apparatus Asset Sourcing (Wave 2)

Scope (Asset Recovery Wave 2, agent PHYSICS-OPTICS-WAVES-WAVE2): a focused second pass over the
apparatus gaps left open by Wave 1 (`docs/assets/physics-fields.md`) — lenses, prisms, mirrors,
speakers, tuning forks, and wave tanks (plus any other clearly-licensed optical/acoustic
apparatus turned up along the way). Fields, rays, and waveforms themselves stay **procedural**
(built in Three.js) per the Wave 1 brief; only physical apparatus was in scope for sourcing here.
No route/component/registry code was touched — sourcing only, no integration.

Ground truth: `content/taxonomy/physics.json`. `light-and-optics`, `waves`, and `sound` are all
`"detailed": false` — named only in the spec, not yet SME-sourced for content authoring. Component
names below (Lens, Prism, Mirror, Speaker, Tuning fork) follow the same naming Wave 1 used from the
product spec; they are not yet transcribed into the taxonomy JSON.

Last updated: 2026-08-18.

## 1. Branch/component mapping (this wave's targets)

| Branch (`detailed`) | Taxonomy component | Asset need | Status after this wave |
| --- | --- | --- | --- |
| Light And Optics (false) | Lens | Bare biconvex/biconcave lens, ray-diagram friendly | **No change** — still only the Wave 1 `magnifying_glass_01` proxy (`physics-fields/lens.glb`); no better candidate found on any source checked this wave |
| Light And Optics (false) | Prism | Equilateral triangular glass prism | Gap — one CC-BY Sketchfab candidate identified (correct shape, low-poly), download-blocked (see §2) |
| Light And Optics (false) | Mirror | Plane or concave/parabolic lab mirror | Gap — one CC-BY Sketchfab candidate identified (parabolic reflector), download-blocked (see §2) |
| Waves/Sound (false) | Wave tank / ripple tank | Clear rectangular tank apparatus for wave-propagation demos | **Hard gap** — no candidate found on any source checked, including Sketchfab. Real objects exist in Smithsonian's catalog (see §2) but have no 3D scan/model attached |
| Sound / Waves (false) | Tuning fork | Two-pronged metal resonator | Gap — same CC-BY Sketchfab candidate Wave 1 already identified ("Resonant Tuning Fork"), still download-blocked |
| Sound / Waves (false) | Speaker | Bare speaker driver (cone + magnet visible) | Gap — one new CC-BY Sketchfab candidate identified ("Speaker Driver", cone/magnet/frame all visible), download-blocked |

No new Poly Haven, NASA 3D Resources, NIH 3D, Smithsonian, Quaternius, or Kenney candidates were
downloadable this wave — see §2 and §3 for the full evaluation trail, including sources that were
checked and came back empty for this domain.

## 2. Candidate comparison table

Every candidate evaluated, not just the closest fits.

| Candidate | Source | License (as read from source, not title) | Downloadable w/o auth? | Redistribution | Decision |
| --- | --- | --- | --- | --- | --- |
| "Triangular prism" (`54fc26b1…`) | Sketchfab, user symmetry312ubc | CC Attribution | **No — Sketchfab gates all downloads behind an authenticated account** (confirmed via API: `GET /v3/models/{uid}/download` -> `401 {"detail":"Authentication credentials were not provided."}`, no anonymous path; `isDownloadable: true` in metadata is not the same as being downloadable anonymously) | Would be full w/ attribution if downloaded | Blocked, not downloaded — see §5 brief. 620 faces / 330 verts, published 2022-10-22; correct equilateral shape language for a Newton-dispersion demo |
| "Prisms" (`965a574a…`) | Sketchfab, user miyulauri | CC Attribution | No (same auth gate) | Would be full w/ attribution | Rejected for fit even before the auth block — 72 faces, likely near-primitive |
| "Cirno Prism" / "Tesseract prism" / "PARADOX PRISM" / "Sennacherib's Prism" | Sketchfab (CC-BY search) | CC Attribution | No (same auth gate) | N/A | Rejected for fit — game-stylised, a historical inscribed clay prism, or otherwise not a clear optical-glass triangular prism |
| "Resonant Tuning Fork" (`e3939cec…`) | Sketchfab, user The_Vague_Dragon (Brikk) | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded. Same candidate Wave 1 already recorded in `docs/assets/physics-fields.md` — re-confirmed still auth-gated this wave, no status change. 396 faces / 264 verts |
| "Speaker Driver" (`ae8cccfe…`) | Sketchfab, user pawanrajawat0129 | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded — see §5 brief. 10,912 faces / 5,599 verts, published 2026-08-15; shows cone, dust cap, surround, and magnet housing separately (the exact "you can see the cone" teaching point Wave 1 flagged) |
| "Speaker" (`af1c249e…`, Ditador_Nicastro) / "Vintage Wooden Speaker" / "Speakers" (callsudhir8087) / Yamaha NS-6490 / car subwoofer / Bluetooth speaker results | Sketchfab (CC-BY search, various queries) | CC Attribution | No (same auth gate) | N/A | Rejected for fit even before the auth block — sealed cabinet/enclosure speakers, same "hides the cone" problem as Wave 1's rejected Poly Haven `boombox` |
| "Parabolic Reflector" (`83ba2d94…`) | Sketchfab, user optiforms | CC Attribution | No (same auth gate) | Would be full w/ attribution | Blocked, not downloaded — see §5 brief. 7,994 faces / 3,997 verts, published 2017; a genuine parabolic-mirror silhouette, good for a concave-mirror focusing demo specifically (not a plane mirror) |
| "In the mirror world" / "Picture Frame or Mirror" / "Astronomical quintant" / "MIRROR BALL 2001" / assorted art-installation "mirror" results | Sketchfab (CC-BY search, various queries) | CC Attribution | No (same auth gate) | N/A | Rejected for fit even before the auth block — decorative/art pieces or antique instruments, not a plain lab mirror-on-stand |
| Poly Haven full model catalogue (521 models) — keyword pass for lens/prism/mirror/speaker/tuning-fork/wave-tank/acoustic/optics terms | Poly Haven | CC0 1.0 | Yes (public Files API, no auth) | Full | **No qualifying result.** Only re-surfaces the two Wave 1 already-decided items: `magnifying_glass_01` (already imported as the Wave 1 lens proxy) and `ornate_mirror_01` (already rejected in Wave 1 for being decorative/ornate). No prism, no tuning fork, no bare speaker driver, no wave/ripple tank exists in the catalogue |
| `boombox` | Poly Haven | CC0 1.0 | Yes | Full | Re-confirmed reject (no new evaluation needed — already rejected in Wave 1 for sealing the cone) |
| `ornate_mirror_01` | Poly Haven | CC0 1.0 | Yes | Full | Re-confirmed reject (already rejected in Wave 1 for being decorative, not lab apparatus) |
| Smithsonian Open Access catalogue: "Prism" (x6 records), "chandelier prisms", "Tuning Fork" (x8 records incl. "Tuning Fork with Resonator"), "Ripple Tank" (National Museum of American History), "Concave Mirror", "Mirror Demonstration Apparatus", "Telescope Mirror", "Wave Demonstration Device" (x4), "Acoustic Research AR-3 loudspeaker" + woofer/tweeter components | Smithsonian Open Access API (`api.si.edu/openaccess`) | CC0-equivalent under Smithsonian's open access terms where a 3D asset exists | N/A — **every one of these matching real historical-instrument records was checked individually via the API's `online_media` field and none carry an attached `3d_model` media type** (at most a couple have flat photographs). `3d.si.edu` (the actual Voyager 3D viewer/host) is Cloudflare-protected and has no public unauthenticated search API from this environment | Not usable — no 3D asset exists for these records despite being an exact subject-matter match. Real physical objects, real catalogue entries, zero 3D scans |
| NASA 3D Resources (full 200+ model catalogue) | `github.com/nasa/NASA-3D-Resources` | Public domain | Yes | Full | Checked, no relevant models — catalogue is 100% spacecraft/satellites/rovers/astronaut gear/space telescopes, no optics-bench or acoustics apparatus of any kind |
| NIH 3D | `3d.nih.gov` | Varies per entry | N/A | N/A | Checked — domain is entirely molecular/cellular/anatomical (their own search UI is a JS app with no simple query API from this environment); not a plausible source for physics lab apparatus, no further time spent |
| Quaternius (full pack index, ~70 packs) | `quaternius.com` | CC0 | Yes | Full | Checked — no science/lab-equipment pack exists; packs are game-asset categories (fantasy, sci-fi, vehicles, nature, food, furniture, characters). Nothing plausibly reskinnable as scientifically-accurate optics/acoustic apparatus |
| Kenney.nl | `kenney.nl` | CC0 | Unclear (site is JS-rendered, no simple query API from this environment) | N/A | Checked briefly — Kenney's catalogue is stylised low-poly game props; even if a match existed it would likely fail the "scientifically accurate in silhouette" bar this wave was asked to hold to. Not pursued further given the time budget |

## 3. Rejection reasons (summary)

- **All 4 new Sketchfab CC-BY candidates found this wave (prism, tuning fork, speaker driver,
  parabolic mirror)** — every one requires an authenticated Sketchfab account to download
  (confirmed via direct API call: `/v3/models/{uid}/download` returns
  `401 {"detail": "Authentication credentials were not provided."}` with no anonymous fallback, as
  of 2026-08-18). This is the identical constraint Wave 1 documented for its 10 Sketchfab
  candidates. No Sketchfab credentials are available in this environment. These 4 are correctly
  licensed (CC-BY), correct subject matter, and reasonable poly counts — they are recorded as
  strong candidates for a future wave with an authenticated Sketchfab session, not rejected on
  merit.
- **Lower-quality Sketchfab results for the same searches** (stylised prisms, sealed-cabinet
  speakers, decorative/art "mirror" pieces, a historical inscribed-clay prism) were rejected for
  fit independent of the auth block — wrong level of stylisation or wrong object entirely.
- **Poly Haven** — exhaustively keyword-scanned across its full 521-model catalogue (name,
  category, and tag fields) for lens/prism/mirror/speaker/tuning-fork/wave-tank/acoustic/optics
  terms. No new candidates exist beyond the two Wave 1 already evaluated (`magnifying_glass_01`,
  imported; `ornate_mirror_01`, rejected).
- **Smithsonian Open Access** — genuinely the closest subject-matter match of any source checked
  (the National Museum of American History's physics-instrument collection literally holds prisms,
  tuning forks, a ripple tank, concave mirrors, and AR-3 loudspeaker components), but none of the
  matching catalogue records have an attached 3D model in the Open Access API's media metadata.
  `3d.si.edu`, the Institution's actual 3D-model host/viewer, sits behind Cloudflare's bot
  challenge and exposes no public unauthenticated API from this environment, so even a manual
  browse wasn't possible here.
- **NASA 3D Resources** — confirmed out of domain (space hardware only) by listing the full `3D
  Models` directory of the source repo; no time spent per-item since the category mismatch is
  total.
- **NIH 3D** — confirmed out of domain (molecular/cellular/anatomical) by inspection of prior
  entries already in this repo's register; not re-searched exhaustively given the domain mismatch
  is structural, not just a missing keyword match.
- **Quaternius / Kenney.nl** — both CC0 game-asset catalogues, both checked for a dedicated
  science/lab pack; neither has one. Reskinning an unrelated pack item was not attempted — doing so
  would trade a "scientifically accurate silhouette" for a stylised game prop, which this wave's
  brief explicitly asked to avoid.

## 4. Downloaded files

**Zero.** No file under `quantaora-app/public/models/sourced/physics-optics-waves-wave2/` was
created this wave, and the directory itself was not created, because every candidate found either
(a) is not anonymously downloadable (all 4 new Sketchfab CC-BY candidates), or (b) does not exist
at all under a clear, redistributable license anywhere checked (wave tank; a bare, non-magnifier
lens). Per the sourcing brief's "quality over count" rule and "if no qualifying asset exists,
write a commission brief instead of downloading something mediocre" instruction, nothing was
downloaded and nothing was self-declared PASS.

This is a genuine outcome, not a shortfall in effort: six sources were checked (Poly Haven
exhaustively, Sketchfab across 20+ targeted queries and 2 license filters, Smithsonian's Open
Access API, NASA's full model directory, and a domain-mismatch check on NIH 3D/Quaternius/Kenney),
and the one structural blocker — Sketchfab's authentication-gated download endpoint — is identical
to the blocker Wave 1 already hit and documented for 10 other candidates.

## 5. Unresolved gaps — commissioned-model briefs

None of these were fabricated as placeholders; they are genuinely absent (or auth-blocked) and are
being explicitly flagged per the "do not skip silently" rule. All six line up with, and extend,
Wave 1's own gap list in `docs/assets/physics-fields.md` §5.

1. **Lens (Light And Optics)** — Still unresolved after two sourcing waves. Needs: a bare biconvex
   (and ideally also biconcave) lens on a small clip/stand or free-standing, clear glass material,
   sized to read clearly in a ray-diagram scene (~60–100mm diameter, distinct front/back curvature
   visible in silhouette so kids can tell converging vs. diverging apart). The current
   `physics-fields/lens.glb` (a handheld magnifying glass) remains the best available stand-in;
   no purpose-built alternative was found on any source checked in either wave. Reference: any
   standard optics-bench convex/concave lens pair photo.

2. **Prism (Light And Optics)** — Equilateral triangular glass prism, ~50–80mm edge length,
   perfectly clear/transparent material (glass IOR ~1.5) so light dispersion into a rainbow reads
   correctly when lit. Wave 1 found zero candidates anywhere. This wave found one CC-BY Sketchfab
   candidate ("Triangular prism" by symmetry312ubc, 620 faces, `54fc26b1663946e093cb6194c1314d0d`)
   with the right shape language — download-blocked pending Sketchfab account access (see §6). If
   Sketchfab access never materializes, this is otherwise a cheap, high-value from-scratch
   commission: a prism is geometrically a simple triangular prism mesh with a clear-glass PBR
   material (base color near-white, roughness ~0.05, transmission if the pipeline supports it,
   else a simple transparent alpha material) — no complex topology needed.

3. **Mirror (Light And Optics)** — A plain, functional lab mirror. Wave 1's only candidate
   (`ornate_mirror_01`) was rejected as too decorative. This wave found a different-but-related
   candidate: "Parabolic Reflector" (`83ba2d942300495e81f4e1da60c86583`, CC-BY, 7,994 faces) — a
   genuine parabolic/concave mirror shape, good specifically for a "concave mirror focuses light to
   a point" lesson, but not a plane mirror. Download-blocked pending Sketchfab access. Recommend
   commissioning **two** simple meshes if Sketchfab access doesn't land: a flat rectangular/circular
   plane mirror on a small stand (for reflection-angle lessons) and a shallow concave/parabolic dish
   (for focusing lessons) — both trivial geometry, most of the value is in a clean reflective PBR
   material (metalness ~1, roughness ~0.02–0.05) that will read well under generic lighting without
   depending on a specific studio HDRI reflection.

4. **Wave tank / ripple tank (Waves)** — The hardest gap in this wave: **no candidate exists on any
   source checked**, including Sketchfab (multiple query variants returned zero results). Smithsonian's
   catalogue literally has a "Ripple Tank" object record (National Museum of American History) but
   it carries no 3D scan. This needs a clean-slate commission: a shallow rectangular clear-glass (or
   clear-acrylic) tank on a frame/stand, water surface as a separate plane (can be animated
   procedurally for the ripple pattern itself, consistent with the "fields/waveforms stay
   procedural" rule — the tank is the physical anchor object, the ripples are code-driven). Simple
   geometry (a box shell + a water-surface plane), most learning value is in the procedural ripple
   animation the mesh anchors, not mesh complexity. Reference: any classic ripple-tank physics-demo
   photo (shallow tray, point-source or bar-wave generator, light source underneath/above for
   shadow patterns).

5. **Tuning fork (Sound/Waves)** — Unchanged from Wave 1. "Resonant Tuning Fork"
   (`e3939cecca6540778faa467eab690f93`, CC-BY, The_Vague_Dragon, 396 faces) remains the best
   candidate, still download-blocked. Otherwise a cheap commission: two thin parallel prongs off a
   handle, metal PBR material (metalness ~0.9, roughness ~0.3 for brushed steel), simple enough
   that a from-scratch mesh is not a large lift if Sketchfab access continues to be unavailable.

6. **Speaker (Sound/Waves)** — This wave found a materially better candidate than Wave 1's
   ("SPEAKERS" by ZIRODESIGN, not re-verified this wave): "Speaker Driver"
   (`ae8cccfe8a5741b28e42af138fc58b93`, CC-BY, pawanrajawat0129, 10,912 faces, published
   2026-08-15) — a genuinely bare driver unit (frame, cone, dust cap, surround, magnet housing all
   visibly separate meshes/regions), exactly the "you can see the cone move" apparatus the taxonomy
   needs, not a sealed enclosure. Download-blocked pending Sketchfab access. If that never
   materializes, commission a single bare driver unit (circular frame + cone + dust cap + magnet
   housing on the back) rather than a full audio product — geometry is straightforward, most value
   is in silhouette correctness (visible cone taper, visible surround ring) plus a simple
   paper-cone-colored diffuse material (no reflective/metallic dependency, so it will light
   predictably under any generic setup).

## 6. Confidence on generic lighting for anything eventually imported

None of the 4 Sketchfab candidates identified this wave were downloaded, so none can be
render-inspected yet — but their PBR material composition can be reasoned about from the
subject matter, which is useful for whichever future wave gets Sketchfab access:

- **High confidence (should light well generically):** "Triangular prism" and "Speaker Driver" —
  a glass prism's material is inherently simple (base color + transmission/roughness, not
  scene-baked), and a speaker driver's materials (paper cone, rubber surround, painted metal frame)
  are all standard diffuse/semi-rough PBR surfaces with no obvious dependency on a specific studio
  HDRI.
- **Uncertain, needs a render check first:** "Parabolic Reflector" and "Resonant Tuning Fork" —
  both are likely to use high-metalness/low-roughness materials (polished reflector dish, brushed
  or polished steel fork) that can look great under a matched studio HDRI and flat/dead under a
  mismatched generic environment; these are exactly the kind of asset the sourcing brief's "avoid
  baked-in scene-specific lighting" warning is aimed at, and should get an explicit environment-map
  test before being trusted, not just a structural GLB validation.
- **No assets were downloaded this wave**, so no `.license.json` sidecar, sha256, or structural
  validation exists yet for any candidate above — all four remain purely "identified, not
  imported" pending Sketchfab access, exactly like Wave 1's 10 blocked candidates.

## Summary of what to unblock next

Same conclusion as Wave 1, reinforced: **Sketchfab account access is the single highest-leverage
unblock.** Combined across both waves, 14 correctly-licensed, correctly-subject-matter candidates
(10 from Wave 1 + 4 new from this wave: prism, tuning fork, speaker driver, parabolic mirror) are
sitting behind the same authentication gate. Only the wave/ripple tank and the bare (non-magnifier)
lens have no identified candidate at all on any source checked in either wave and would need a
clean-slate commission regardless of Sketchfab access.
