# Chemistry — Wave 2 Gap-Closing Asset Sourcing (apparatus / crystal lattices)

Agent: CHEM-GAPS-WAVE2. Scope: pick up the **unresolved gaps** left by the two Wave 1 agents —
`docs/assets/chemistry-reactions.md` (apparatus/vessels) and `docs/assets/chemistry-structure.md`
(atoms/molecules/crystals/periodic table) — and either close them with a genuinely-licensed
download or document why they remain open. This wave does **not** re-download anything already
recorded as sourced/PASS in either Wave 1 doc or in `docs/ASSET-LICENSES.md`; see §0.

Ownership for this wave:
- `quantaora-app/public/models/sourced/chemistry-gaps-wave2/**` (new GLBs + sidecars + validator script)
- this file

Nothing here has been wired into route code, `src/data/modelRegistry.ts`, or
`docs/ASSET-LICENSES.md` — per the task brief, this is sourcing only, no integration.

Last updated: 2026-08-18.

## 0. Ground truth read — what was already PASS/sourced (not re-touched)

Cross-checked against `docs/assets/chemistry-reactions.md`, `docs/assets/chemistry-structure.md`,
and `docs/ASSET-LICENSES.md` before starting any search:

- **Already sourced, not re-downloaded:** beaker (3 sizes), test tube + stand, retort/clamp
  stand, bunsen burner (both the `chemistry-lab-bench.glb` scene-prop node and the dedicated
  `bunsen-burner.glb` hero), reagent bottles — all in
  `quantaora-app/public/models/sourced/chemistry-reactions/`. Water, oxygen, carbon dioxide,
  methane, glucose, sodium-chloride lattice — all in
  `quantaora-app/public/models/sourced/chemistry-structure/`. `atom.glb` (project-authored,
  already CLEAR in `docs/ASSET-LICENSES.md`).
- Verified the actual node list inside `chemistry-lab-bench.glb` directly (not just the Wave 1
  doc's summary) via a GLB JSON-chunk parse: 50 named nodes, confirmed **no burette or graduated
  cylinder mesh exists** despite Poly Haven's own tag metadata mentioning "burette clamp" — that
  tag refers to the retort clamp assembly (`chemistry_set_clamp*`), not an actual titration
  burette tube. This means burette/graduated cylinder — named explicitly in this wave's brief — is
  a genuine, previously-undocumented gap, not a duplicate of anything already sourced.
- Confirmed no already-PASS asset was redundantly re-downloaded.

## 1. Gap mapping (carried over from Wave 1 + this wave's brief)

| Gap | Wave 1 status | This wave's outcome |
| --- | --- | --- |
| Erlenmeyer / conical flask | Candidates found, Sketchfab-auth-blocked | **Still blocked** — re-verified, no new download path (§2, §3) |
| Lab funnel | No candidate found | **New CC-BY candidate found**, still Sketchfab-auth-blocked (§2, §3) |
| Burette / graduated cylinder | Not even named as a gap in Wave 1 | **New gap, documented this wave.** CC-BY candidates found, Sketchfab-auth-blocked (§2, §3) |
| Periodic-table physical display stand | Candidates found, Sketchfab-auth-blocked | **Still blocked**, no new source found (§2, §3) |
| Metal / nonmetal / metalloid / noble-gas specimen set | No CC0/no-auth source found | **Partially resolved** — nonmetal (diamond, graphite) and metalloid-family (silicon carbide) crystal lattices sourced from NIH 3D, CC0/CC-BY, no auth wall. Metal and noble-gas specimens remain unresolved (§4, §5) |
| General "crystal must look like its actual crystal system" requirement | N/A (Wave 1 authored NaCl only) | **Alpha quartz (SiO2)** added as a bonus real-mineral crystal-system example |

## 2. Downloaded files

Directory: `quantaora-app/public/models/sourced/chemistry-gaps-wave2/`

| File | Source entry | License | Bytes | SHA-256 (first 16 hex) |
| --- | --- | --- | --- | --- |
| `crystal-diamond-carbon-nih.glb` | [NIH 3D 3DPX-008116](https://3d.nih.gov/entries/3DPX-008116), "Diamond", by Afsoon Farzan | **CC0 1.0** | 699,424 | `b460a83c285031548a` |
| `crystal-graphite-sheet-nih.glb` | [NIH 3D 3DPX-008098](https://3d.nih.gov/entries/3DPX-008098), "Graphite sheet parametric model", by heinonj (Juha Heinonen) | **CC-BY 4.0** | 312,712 | `b54473c8ae5b903e13` |
| `crystal-silicon-carbide-2h-nih.glb` | [NIH 3D 3DPX-008102](https://3d.nih.gov/entries/3DPX-008102), "Silicon Carbide 2H", by feriousfabrious | **CC0 1.0** | 257,424 | `ea1c3ff2ab12c66dfe` |
| `crystal-alpha-quartz-nih.glb` | [NIH 3D 3DPX-008115](https://3d.nih.gov/entries/3DPX-008115), "Alpha Quartz", by DemoniWaari | **CC0 1.0** | 5,351,044 | `226bc13cc97d4c4a11` |

All four pass GLB validation via `validate-glb.mjs` (copied verbatim from
`sourced/chemistry-structure/validate-glb.mjs`, stdlib-only): magic header `0x676c5446` ('glTF')
OK, declared length matches file size, glTF 2.0, generator `https://github.com/mikedh/trimesh`
(NIH 3D's own STL→GLB conversion pipeline for these entries). Full validation JSON, exact download
URLs, creator/license/attribution text, and approximate bounding boxes are in each asset's sidecar
`.license.json`.

**Important quality caveat, recorded per the task's hard rules (no self-declared PASS):** all four
files are single untextured meshes with **zero materials** (`materialCount: 0`) — they were
authored as 3D-*printable* unit-cell models (fused solid geometry) rather than the app's existing
ball-and-stick style (separate per-atom/per-bond nodes with CPK-colored materials, as used by
`water.glb`, `glucose.glb`, etc.). Geometrically they are scientifically correct representations of
their real crystal systems (diamond-cubic carbon, hexagonal graphite sheet, hexagonal 2H-SiC,
trigonal alpha-quartz), but they will render flat/grey until a material pass is applied, and the
alpha-quartz file in particular is large (5.1 MB) for an untextured single mesh and would benefit
from decimation before integration. Every sidecar's `reviewStatus` is explicitly
`"render-review-pending"` — none are self-declared PASS.

## 3. Candidate comparison table

All candidates evaluated this wave, kept and rejected, with reasons.

| Candidate | Source | License (reported) | Downloadable | Decision | Reason |
| --- | --- | --- | --- | --- | --- |
| Diamond | NIH 3D 3DPX-008116 | CC0 1.0 (verified via page's CC0 badge link) | Yes, direct file, no auth (via `/api/submissions/.../output-files/{id}` route once the raw S3 link 403'd) | **Accepted** | Real diamond-cubic carbon unit cell, correct crystal system, no auth wall, no attribution burden |
| Graphite sheet parametric model | NIH 3D 3DPX-008098 | CC-BY 4.0 (verified via page's CC-BY badge link) | Yes, same route | **Accepted** | Real hexagonal graphite/graphene honeycomb lattice; pairs with diamond for a classic "same element, different crystal structure" allotrope-comparison lesson |
| Silicon Carbide 2H | NIH 3D 3DPX-008102 | CC0 1.0 | Yes, same route | **Accepted, with caveat** | Real hexagonal 2H-SiC unit cell (metalloid-family semiconductor crystal). Not literally elemental silicon (no clearly-licensed elemental-Si crystal was found anywhere this wave); documented honestly as the closest genuine substitute rather than mislabeled as "Silicon" |
| Alpha Quartz | NIH 3D 3DPX-008115 | CC0 1.0 | Yes, same route | **Accepted** | Real trigonal alpha-quartz (SiO2) ball-and-stick unit cell; general bonus crystal-system example, doesn't map to a single named gap but strengthens the "crystal must look like its actual crystal system" requirement |
| Spinel crystal structure v2 | NIH 3D 3DPX-008114, by T.Hamalainen | CC-BY 4.0 | Yes, same route (not tested) | **Evaluated, not downloaded** | MgAl2O4 mixed-oxide mineral — doesn't map to any named metal/nonmetal/metalloid/noble-gas gap or to a molecules-and-bonding need; quartz and diamond already cover the "labeled real-mineral crystal" bonus slot. Left as a documented, license-clear candidate for a future wave if a "complex mineral" example is specifically requested |
| Graphene | NIH 3D 3dpx-010768 | Not fetched/verified this wave | Unknown | **Not pursued** | Found via search but 2D single-sheet allotrope is lower priority than the bulk 3D lattices already accepted; graphite sheet (008098) already covers the "honeycomb carbon sheet" visual need |
| Burette | Sketchfab `4bb5f945638a46ba9ea5684d0f38ebad` (3dlabwaremodels), `8164ac62b35c49d191f280d2335e50a7` (itschemistry2) | CC Attribution, confirmed via API | `isDownloadable: true` per API, but archive download endpoint returns `401` unauthenticated | **Blocked, not downloaded** | Same Sketchfab account-login gate documented in Wave 1; re-tested live this wave, still blocked |
| Graduated Cylinders | Sketchfab `e0a1a66e2d104e4fb5b410ea84cd6b6f` (cesar.seidel), `e80739446d4c46d4a9c637c025694fec` (itschemistry2), `5e96064ca1b74f3385460cdcc1f98f7a` (3dlabwaremodels) | CC Attribution | Same auth gate | **Blocked, not downloaded** | Same reason |
| "erlenmeyer flask" (itschemistry2), "Erlenmeyer Flask Collection" (3dlabwaremodels), "Simple Erlenmeyer" (pistachx) | Sketchfab | CC Attribution | Same auth gate | **Blocked, not downloaded** | Re-confirmed still blocked; same three candidates already recorded in Wave 1 (`docs/assets/chemistry-reactions.md` §3), no new information |
| "Erlenmeyer Flask: Witchtober Day 6" / "Smooth Erlenmeyer Flask Witchtober Day 6" | Sketchfab, AmythystWillis | CC Attribution-NonCommercial-NoDerivs | N/A | **Rejected** | NC + ND — excluded by policy regardless of the auth gate |
| "CC0 - Funnel 3" | Sketchfab `9c71ecea8e0941af9f0e7b59895f7fd4`, by plaggy | Reports as **CC Attribution** via API despite the listing's own "CC0" name (Sketchfab license metadata is authoritative over the title text) | `isDownloadable: true`, download endpoint `401` | **New candidate, blocked, not downloaded** | Low-poly (1,440 faces / 720 verts) — good size for a hero funnel prop; license and auth situation identical to everything else on Sketchfab this wave |
| Periodic table candidates (`sijosaji`, `TheOfficialApolloIndustries`, `NutcrackerSilver`, `rubysloth32`, `infatum`) | Sketchfab | CC Attribution | Same auth gate | **Blocked, not downloaded** | First two already recorded in Wave 1; three more distinct CC-BY candidates surfaced this wave, all equally blocked |
| "Periodic table of the elements" (ecavalli) | Sketchfab | CC Attribution-ShareAlike | N/A | **Rejected** | ShareAlike excluded by project policy (redistribution obligations beyond attribution) |
| Poly Haven full model catalogue (521 models) re-scanned for flask/funnel/burette/crystal/lattice/quartz/mineral/vial/pipette/titration keywords | Poly Haven API | CC0 (blanket) | Yes, no auth | **No new qualifying match** | Only hit was `chemistry_set` (already sourced in Wave 1) plus decorative desert-quartz rock packs (`namaqualand_stones_01`/`namaqualand_rocks_01`, `cheiridopsis_succulent`, `crystalline_iceplant`) — decorative nature assets, not labeled crystal-structure or lab-glassware models |
| Smithsonian Open Access 3D (`3d.si.edu`) | Smithsonian | N/A | N/A | **Could not evaluate** | The site's API/search endpoints return Cloudflare `403` challenge pages to unauthenticated automated requests; no accessible search surface found this wave. Flagged for a future wave with a real browser session rather than fabricated as "no results" |
| NIH 3D direct search API (`3d.nih.gov/api/search`) | NIH 3D | N/A | N/A | **Endpoint not found** | `404` on guessed REST paths; site search is client-rendered. Worked around by using targeted web search to locate specific `/entries/<id>` pages instead (this is how the four accepted crystal files were found) |
| Quaternius (full pack catalogue page) | quaternius.com | CC0 (blanket) | Yes, no auth | **No qualifying match** | No lab/science/glassware pack exists in the catalogue; packs are nature/environment/character themed |
| Kenney.nl | kenney.nl | CC0 (blanket) | Yes, no auth | **Not pursued further** | No lab-glassware or crystal-structure-relevant asset pack found in a quick catalogue check; Kenney's library is overwhelmingly game-prop/UI-icon themed, consistent with Wave 1's assessment that it wasn't worth chasing for scientific apparatus |
| RCSB PDB Chemical Component Dictionary | RCSB | CC0 | Yes, no auth | **Not applicable this wave** | RCSB's CCD is for molecules/ligands, not elemental/mineral crystal lattices or lab apparatus — already exhausted for the molecules-and-bonding need in Wave 1 |

## 4. Why Sketchfab downloads were not completed this wave

Re-verified live (not assumed from Wave 1's notes): `api.sketchfab.com/v3/models/<uid>` correctly
reports `license` and `isDownloadable` without authentication. The archive download endpoint
(`api.sketchfab.com/v3/models/<uid>/download`) still returns `401 Authentication credentials were
not provided` for every candidate tested this wave (flask, funnel, burette, graduated cylinder,
periodic table), including ones whose listing title says "CC0" — Sketchfab's platform-level
download gate applies regardless of license tier. No Sketchfab account/API token is available in
this environment, and per the brief's instruction, no auth-gate bypass or unauthorized mirror was
attempted. All candidates are recorded with exact uid/license/creator for a future wave with
Sketchfab credentials.

## 5. Unresolved gaps — commissioned-model briefs

### Gap 1: Erlenmeyer / conical flask (unchanged from Wave 1)
Still the single most recognizable "chemistry" vessel missing from the sourced set. Immediate
unblock option is unchanged: a human with Sketchfab credentials pulling "FREE Conical Flask |
Laboratory | Low poly" by nakedsingularity (CC-BY, 2,742 tris) — see
`docs/assets/chemistry-reactions.md` §5 Gap 1 for the full commissioned-geometry brief if that
path isn't available.

### Gap 2: Lab funnel (unchanged from Wave 1, one new candidate found)
"CC0 - Funnel 3" by plaggy (Sketchfab `9c71ecea8e0941af9f0e7b59895f7fd4`, actually CC-BY 4.0 per
API, 1,440 faces) is now the recommended first-unblock target if Sketchfab credentials become
available — smaller and simpler than chasing a from-scratch commission. Commissioned-geometry
brief unchanged from `docs/assets/chemistry-reactions.md` §5 Gap 2 if not.

### Gap 3: Burette / graduated cylinder (new gap, named explicitly in this wave's brief)
- **Why needed:** titration/measurement apparatus, explicitly named in this wave's brief; confirmed
  absent from the already-sourced `chemistry-lab-bench.glb` despite that model's Poly Haven tag
  metadata mentioning "burette clamp" (that tag describes the clamp, not a burette tube — see §0).
- **Immediate unblock option:** "Burette" by 3dlabwaremodels (Sketchfab
  `4bb5f945638a46ba9ea5684d0f38ebad`, CC-BY) or "Graduated Cylinders" by cesar.seidel (Sketchfab
  `e0a1a66e2d104e4fb5b410ea84cd6b6f`, CC-BY) once Sketchfab credentials are available.
- **If commissioning instead:** clear glass burette, ~50cm graduated tube ~1.5cm diameter with a
  stopcock/tap at the base, optional retort-clamp-mount point to pair with the existing
  `chemistry_set_clamp` node; alternative/simpler option is a graduated cylinder (open cylindrical
  vessel with printed volume markings, ~10cm height × ~2.5cm diameter). Budget 500–1.5k triangles,
  single node named `burette` or `graduated_cylinder`. Reference imagery: standard titration
  burette or graduated cylinder product photo.

### Gap 4: Periodic-table physical display stand (unchanged from Wave 1)
No new source found this wave beyond three additional Sketchfab CC-BY candidates (`NutcrackerSilver`,
`rubysloth32`, `infatum`'s blank-table variant) — all equally auth-gated. Commissioned brief
unchanged from `docs/assets/chemistry-structure.md` §5 Gap A.

### Gap 5: Metal specimen (elemental — copper/iron/aluminum)
- **Why needed:** completes the metal/nonmetal/metalloid/noble-gas comparison set alongside this
  wave's new diamond (nonmetal) and silicon-carbide (metalloid-family) crystal lattices.
- **Why unresolved:** no CC0/CC-BY/no-auth elemental-metal crystal-lattice model was found on NIH
  3D, Poly Haven, Smithsonian (inaccessible this wave), Quaternius, or Kenney. NIH 3D's
  crystal-structure mini-collection (the same submitter cluster that produced diamond/quartz/SiC/
  graphite, IDs roughly 3DPX-008090–008116) does not include a pure-metal FCC/BCC lattice.
- **Commissioned brief if built from scratch:** small hero object showing a metal's FCC or BCC
  unit cell (e.g. copper, a = 3.615 Å, FCC) with visible metallic luster material, OR a stylized
  metal sample block with visible crystalline grain if a literal unit-cell diagram is too abstract
  for the target age group. Budget under 2k triangles / under 2 MB. Reference: any standard FCC/BCC
  unit-cell diagram (public-domain crystallographic fact, not a specific commercial chart) plus a
  metal sample product photo.

### Gap 6: Noble gas specimen
- **Why needed:** completes the four-way metal/nonmetal/metalloid/noble-gas comparison.
- **Why unresolved:** noble gases have no solid-lattice form at room temperature, so this can't be
  solved the same way as the other three; no clearly-licensed "sealed glass discharge tube" model
  was found this wave either (not searched for directly — the concept itself needs a apparatus-style
  model, not a crystal-lattice one, so it sits closer to Gap 1–3's glassware search space).
- **Commissioned brief:** sealed glass ampoule/discharge-tube silhouette with an emissive
  gas-glow material keyed to a specific noble gas's characteristic color (e.g. neon's red-orange),
  reusing the app's existing glass-material language. Budget under 1k triangles. Reference:
  standard gas-discharge-tube demonstration photo.

### Gap 7 (carried forward, not re-pursued): states-of-matter ice/water/steam
Unchanged from Wave 1 — `states-of-matter` is still `"detailed": false` in
`content/taxonomy/chemistry.json` at time of writing; not pursued for the same reason recorded in
`docs/assets/chemistry-reactions.md` §5 Gap 3.

## 6. Summary

COMPONENTS_AUDITED: 7 (Erlenmeyer flask, funnel, burette/graduated cylinder, periodic-table stand,
metal specimen, nonmetal/metalloid crystal specimens, noble-gas specimen)
CANDIDATES_EVALUATED: 19 (4 NIH 3D, 1 Poly Haven catalogue re-scan covering multiple keyword hits,
Smithsonian/NIH-search/Quaternius/Kenney/RCSB source-level checks, 13 distinct Sketchfab uids)
GLBS_DOWNLOADED: 4 — all NIH 3D, all structurally validated (GLB header + JSON chunk OK, sha256
recorded, cross-checked with `validate-glb.mjs`), all license-clear (3× CC0 1.0, 1× CC-BY 4.0), all
explicitly `render-review-pending` (no self-declared PASS)
REJECTED_OR_BLOCKED_CANDIDATES: 15 (12 Sketchfab CC-BY candidates auth-gate-blocked, 2 Sketchfab
NC/ND candidates policy-rejected, 1 CC-BY-ShareAlike candidate policy-rejected, plus Spinel
evaluated-and-deferred as a lower-priority bonus)
ALREADY-PASS ASSETS RE-DOWNLOADED: 0 — confirmed via §0 cross-check against both Wave 1 docs and
`docs/ASSET-LICENSES.md`, and via direct GLB node-list inspection of `chemistry-lab-bench.glb`
HARD_GAPS_FOR_COMMISSIONING: 6 (Erlenmeyer flask, funnel, burette/graduated cylinder, periodic-table
stand, metal specimen, noble-gas specimen) — full briefs in §5
NEXT_STEPS: (1) a future wave with Sketchfab credentials can immediately unblock the flask, funnel,
burette, and periodic-table gaps using the specific named uids in §3/§5 rather than commissioning
from scratch; (2) the four accepted NIH crystal-lattice files need a material/color pass (they ship
with zero materials) and a render-review pass before any PASS status is assigned; (3) metal and
noble-gas specimens still have no license-clear source and remain the two genuinely hard gaps.
