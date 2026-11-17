# Chemistry — Structure Asset Sourcing (atoms / molecules / crystals / periodic materials)

Scope: Wave 1 asset recovery, agent `CHEM-STRUCTURE`. Covers lab-quality atom / molecule /
crystal / periodic-material representations for the Chemistry subject
([content/taxonomy/chemistry.json](../../content/taxonomy/chemistry.json)). Reaction apparatus,
vessels, and state-change scenes belong to a different agent's scope and are **not** covered
here. Anatomy organ assets were never touched.

Ownership for this wave:
- `quantaora-app/public/models/sourced/chemistry-structure/**` (new GLBs + sidecars + build/validate scripts)
- this file

Nothing here has been wired into route code, `src/data/modelRegistry.ts`, or
`docs/ASSET-LICENSES.md` — that integration is a future wave, per the wave-1 brief.

## 1. Branch / component mapping

| Branch (`detailed`) | Component / asset need | Status | Notes |
| --- | --- | --- | --- |
| `atoms-and-elements` (true) | Proton/neutron/electron/nucleus/shell visualization | **Covered — no gap** | `public/models/chemistry/atoms-and-elements/atom.glb` already exists (project-authored, CLEAR per `docs/ASSET-LICENSES.md`). Audited, not duplicated. |
| `molecules-and-bonding` (true) | Water (H2O) | **Sourced** | `water.glb` — RCSB PDB ligand `HOH`, real ideal coordinates. |
| `molecules-and-bonding` (true) | Oxygen (O2) | **Sourced** | `oxygen.glb` — RCSB PDB ligand `OXY`. |
| `molecules-and-bonding` (true) | Carbon dioxide (CO2) | **Sourced** | `carbon-dioxide.glb` — RCSB PDB ligand `CO2`; double bonds rendered as twin cylinders for the "bond highlighting" interactive component. |
| `molecules-and-bonding` (true) | Methane (CH4) | **Sourced** | `methane.glb` — no clean RCSB CCD entry exists for plain methane (see §5); authored from standard tetrahedral geometry (109.5°, 1.09 Å), same authoring pipeline as `atom.glb`. |
| `molecules-and-bonding` (true) | Sodium chloride (NaCl) | **Sourced** | `sodium-chloride-lattice.glb` — NaCl has no discrete molecule; authored as the real rock-salt ionic lattice (a = 5.64 Å), scientifically more correct than a fake "NaCl molecule." Doubles as a periodic-table ionic-lattice example. |
| `molecules-and-bonding` (true) | Glucose (C6H12O6) | **Sourced** | `glucose.glb` — RCSB PDB ligand `GLC` (alpha-D-glucose), 24-atom ideal coordinates matching the real formula. |
| `periodic-table` (true) | Periodic-table display stand (physical apparatus) | **Gap — commissioned brief** | See §5. Sketchfab candidates found and license-qualifying but blocked by Sketchfab's account-login download gate this wave (no credentials available; not bypassed). |
| `periodic-table` (true) | Metal / nonmetal / metalloid / noble-gas category specimens | **Gap — commissioned brief** | See §5. No CC0/CC-BY, no-auth-download source found for labeled element specimens. `sodium-chloride-lattice.glb` (ionic) partially serves the "compare bonding/structure by category" need but is not a substitute for actual specimen photography/models. |
| `periodic-table` (true) | Periodic trend heatmaps, element cards, group compare | **Out of asset scope** | These are data-driven UI/chart components (see `dataviz` skill), not 3D assets — no GLB need. |
| `chemical-reactions` (true) | Reaction apparatus/vessels/state changes | **Out of this agent's scope** | Owned by a different Wave 1 agent. Not audited here beyond confirming the taxonomy boundary. |
| `states-of-matter`, `acids-and-bases`, `solutions`, `stoichiometry-foundations`, `organic-chemistry-foundations`, `biochemistry-links` (all `detailed: false`) | — | **Not sourced — content not ready** | Per taxonomy status, these branches aren't SME-detailed yet; flagging per instructions rather than inventing structure content or assets for them. |

## 2. Candidate comparison table

All candidates evaluated, not just winners. RCSB PDB Chemical Component Dictionary (CCD) data is
CC0 by definition (wwPDB policy); Sketchfab licenses below are as reported by Sketchfab's own API
(`api.sketchfab.com/v3/models/<uid>`), read directly rather than trusting search-result text.

| Source | Candidate | License (reported) | Downloadable | Accept/Reject | Reason |
| --- | --- | --- | --- | --- | --- |
| RCSB PDB CCD | `HOH_ideal.sdf` (water) | CC0 (PDB data) | Yes, direct HTTP, no auth | **Accept** | Real ideal coordinates, no auth wall, matches documented project pipeline. |
| RCSB PDB CCD | `OXY_ideal.sdf` (oxygen) | CC0 (PDB data) | Yes, direct HTTP, no auth | **Accept** | Same. |
| RCSB PDB CCD | `CO2_ideal.sdf` (carbon dioxide) | CC0 (PDB data) | Yes, direct HTTP, no auth | **Accept** | Same. |
| RCSB PDB CCD | `GLC_ideal.sdf` (alpha-D-glucose) | CC0 (PDB data) | Yes, direct HTTP, no auth | **Accept** | 24-atom count matches C6H12O6 exactly; verified before use. |
| RCSB PDB CCD | `CH4` ligand code | — | — | **Reject (wrong data)** | `CH4` in the CCD is `3-[(2-AMINOETHYL)AMINO]-2-{[(2-AMINOETHYL)AMINO]METHYL}PROPANAL` (C8H20N4O, 33 atoms) — not methane. Confirmed via `data.rcsb.org/rest/v1/core/chemcomp/CH4` before use; full-text search for "methane" also returns no standalone CH4 entry. Used textbook geometry instead. |
| Sketchfab — MehdiMM | "H2O Molecule" (`e181944932084b5dbb4d5b625a5e9b10`) | CC Attribution (CC-BY 4.0) | `isDownloadable: true` (API), but file download endpoint requires an authenticated Sketchfab account bearer token | **Qualifies on license; not downloaded this wave** | Auth-gated — see §3. Good candidate for a follow-up wave with credentials. |
| Sketchfab — sduce | "Carbon Dioxide Molecule" (`cd0b0b5f696747f084f54fb670632586`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Same reason. Already covered by our RCSB-sourced `carbon-dioxide.glb`. |
| Sketchfab — sduce | "Methane Molecule" (`dfb1c75b9d3449c483bedc6d4721cecf`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Already covered by our authored `methane.glb`. |
| Sketchfab — ChemDavid | "Oxygen Molecule (O2)" (`0bac33ee81184eaea874fe1d9b9b9d0c`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Already covered by our RCSB-sourced `oxygen.glb`. |
| Sketchfab — brutebandit | "Glucose Molecule" (`2b4c96af7c0c41debf1bd654c1103a00`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Already covered by our RCSB-sourced `glucose.glb`. |
| Sketchfab — borkia | "Water Molecule ball-and-stick model" (`b3b508a8fde242ddb4d5baa8988ee090`) | CC Attribution-ShareAlike (CC-BY-SA 4.0) | Yes | **Reject** | Brief's allowed set is CC0/CC-BY only; ShareAlike imposes redistribution obligations beyond attribution. |
| Sketchfab — ecavalli | "Periodic table of the elements" (`c71a72a82f5b46cf9dcff37a10dd6e28`) | CC Attribution-ShareAlike | Yes | **Reject** | Same ShareAlike exclusion. |
| Sketchfab — sijosaji | "Periodic Table" (`0ac5b5cacc9f49f2b2732ae541ad737b`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Best periodic-table-display candidate found — see §5 gap brief. |
| Sketchfab — TheOfficialApolloIndustries | "The 3D Periodic Table" (`09cd9683c4244eba9167a083c7298804`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Backup periodic-table candidate. |
| Sketchfab — lydiathelee | "Silicon Crystal Lattice" (`73e292f32ffe4ca490e166faeba317e7`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Good metalloid-category lattice candidate for §5 gap. |
| Sketchfab — basir.bsmrstu | "Face-Centered Cubic (FCC) Lattice Brillouin Zone" (`0c2cd44921a444fc9c91769a4a8a02a2`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Generic metal-lattice candidate. |
| Sketchfab — gilles.schaeck | "Maille NaCl" (`3557893f74014bbb8f224637c3581dc8`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Not needed — we authored `sodium-chloride-lattice.glb` from real crystallography instead. |
| Sketchfab — efrenr | "Sodium Chloride" (`c31588115ba2433e819282ceee5d706c`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Same — superseded by our authored lattice. |
| Sketchfab — kohaerenz | "A9 \| C (Graphite) \| P6(3)/mmc" (`88d92c32e2cd4d21b1cbec4db818361f`) | CC Attribution | Same auth gate | **Qualifies on license; not downloaded** | Candidate for a future carbon-allotrope/crystal-lattice pass. |
| Sketchfab — XReady Lab | "Sodium Chloride (NaCl) Lattice" (`6d3156dfe8c24925935d1fa10f1c9920`) | none reported (`license: {}`) | `isDownloadable: false` | **Reject** | No license metadata + not downloadable via API. |
| Sketchfab — XReady Lab | "Diamond Lattice" (`1705f16ca4d9463a956848c93069c8d0`) | none reported | `isDownloadable: false` | **Reject** | Same. |
| Sketchfab — Emanuele Messina | "Diamond Lattice Structure" (`b0378af5ed874c8780b11c3a76d07ace`) | none reported | `isDownloadable: false` | **Reject** | Same. |
| Sketchfab — Museum of Mineralogy and Petrography, UAIC | "Crystal structure of Diamond" (`3faa5a1748c4429aba1c683ada5af378`) | none reported | `isDownloadable: false` | **Reject** | Same — whole collection appears editorial/non-downloadable. |
| Sketchfab — Museum of Mineralogy and Petrography, UAIC | "Crystal structure of Graphite" (`75b6db0709b84549b62306e143aadbb1`) | none reported | `isDownloadable: false` | **Reject** | Same. |
| Sketchfab — CLauter | "Sodium chloride (NaCl) Model A/B/D/F/H" (multiple uids) | CC Attribution-NonCommercial | Yes | **Reject** | NC license — excluded by brief. |
| Sketchfab — refodige | "Molécula de Dióxido de Carbono (CO2)", "Metano" | CC Attribution-NonCommercial-NoDerivs | Yes | **Reject** | NC + ND — excluded. |
| Sketchfab — various | Quartz crystal candidates (Landy42, laboratorija, virtualcurationlab, etc.) | Mostly CC-BY-NC / CC-BY-NC-SA / CC-BY-NC-ND | Yes | **Reject** | NC-family licenses — excluded. One CC-BY hit (`boypuff` "Garden Quartz") was decorative rock, not a labeled crystal-structure asset — not pursued given no auth-download path anyway. |
| Poly Haven | Full model catalogue scanned via `api.polyhaven.com/assets?type=models` (521 models) for crystal/mineral/periodic/lab-glassware matches | CC0 (blanket, per Poly Haven policy) | Yes, no auth | **No qualifying match for this scope** | Hits were `bunsen_burner` and `chemistry_set` (retort stand, burette clamp, titration glassware) — these read as reaction/titration apparatus, which is the other Wave 1 agent's scope (`chemistry-reactions`), so deliberately not claimed here to avoid overlap. `namaqualand_stones_01` (desert quartz rocks) is decorative, not a labeled structure asset — not pursued. No periodic-table-stand or labeled-element-specimen model exists in the Poly Haven catalogue. |

## 3. Why Sketchfab downloads were not completed this wave

Sketchfab's public API correctly reports `license` and `isDownloadable` without authentication,
which is how the license/downloadability columns above were verified (`api.sketchfab.com/v3/models/<uid>`).
However the actual file-download endpoint
(`api.sketchfab.com/v3/models/<uid>/download`) returned `401 Authentication credentials were not
provided` — Sketchfab requires a logged-in account bearer token to fetch the archive URL even for
CC0/CC-BY models with `isDownloadable: true`. No Sketchfab account/API token was available in this
environment, and per the brief's instruction ("Never bypass auth gates or use unauthorized
mirrors"), no workaround was attempted. All CC-BY-qualifying Sketchfab candidates above are
recorded with exact uid/license/creator for a future wave that has Sketchfab credentials.

## 4. Downloaded / authored file list

All in `quantaora-app/public/models/sourced/chemistry-structure/`:

| File | Pipeline | Size | SHA-256 (first 16 hex) |
| --- | --- | --- | --- |
| `water.glb` | RCSB PDB `HOH_ideal.sdf` → three.js/GLTFExporter | 119,380 B | `28c81364ff88f60f` |
| `oxygen.glb` | RCSB PDB `OXY_ideal.sdf` → three.js/GLTFExporter | 82,156 B | `1f9eb44d4713f4d6` |
| `carbon-dioxide.glb` | RCSB PDB `CO2_ideal.sdf` → three.js/GLTFExporter | 126,816 B | `eabeac0999613735` |
| `glucose.glb` | RCSB PDB `GLC_ideal.sdf` → three.js/GLTFExporter | 985,200 B | `18920acec3b53db0` |
| `methane.glb` | Authored — textbook tetrahedral geometry | 201,460 B | `59c912b968c01388` |
| `sodium-chloride-lattice.glb` | Authored — real rock-salt crystallography (a = 5.64 Å) | 1,206,556 B | `bd84c141c6df1317` |

Full sha256, per-file validation counts (scene/node/mesh/material/texture/animation), and
world-space bounding-box dimensions are in each file's sidecar `<name>.license.json` in the same
directory. All six pass GLB magic-header + JSON-chunk validation (`glTF` version 2, declared
length matches file size on disk). None exceed 1.21 MB — well under the 15 MB hero-asset budget.
No textures/images in any file (pure vertex-colored PBR materials), so the 2048px texture rule
doesn't apply.

Source data and tooling (read-only reference, not shipped assets):
- `source-data/HOH_ideal.sdf`, `OXY_ideal.sdf`, `CO2_ideal.sdf`, `GLC_ideal.sdf` — raw RCSB CCD
  ideal-coordinate files as downloaded, kept for provenance/reproducibility.
- `build-molecules.mjs` — the authoring script (three.js + `GLTFExporter`, the same technique
  `scripts/assets/build-atom-glb.mjs` already uses for `atom.glb`). Parses the SDF files for the
  four RCSB-sourced molecules; hardcodes the two textbook-geometry ones. Re-run with
  `node public/models/sourced/chemistry-structure/build-molecules.mjs` from `quantaora-app/`.
- `validate-glb.mjs` — standalone GLB header/JSON-chunk validator (fs/crypto only, no new deps),
  same approach as `public/models/sourced/space/validate-glb.mjs`.

Bounding-box note: the validator's generic accessor-min/max bbox reads `[-1,1]` for every file
because `GLTFExporter`'s `trs:false` mode bakes node transforms into matrices, so raw accessor
extents reflect local unit-geometry space, not world space. `build-molecules.mjs` was extended to
also compute a `THREE.Box3` over the fully-transformed scene at build time; those real world-space
dimensions are recorded in each sidecar's `approxWorldBoundingBoxUnits` field instead (e.g. water
≈ 0.95 × 0.76 × 1.35 units, glucose ≈ 4.69 × 3.63 × 2.18 units, NaCl lattice ≈ 4.02³ units — all in
the same order of magnitude as `atom.glb`'s ~2-unit scale).

## 5. Unresolved gaps — commissioned-model briefs

### Gap A: Periodic-table physical display stand
- **Need**: a recognizable, inspectable 3D "periodic table board" — element tiles or cubbies
  arranged in the real 18-column/7-row layout, usable as the anchor object for the "Element
  cards" and "Group compare" interactive components (spec §6, periodic-table branch).
- **Why no asset shipped**: two CC-BY Sketchfab candidates qualify on license
  (`sijosaji/periodic-table-0ac5b5c...`, `TheOfficialApolloIndustries/the-3d-periodic-table-09cd968...`)
  but both sit behind Sketchfab's authenticated-download gate (§3).
- **Commissioned brief if built from scratch**: low-poly board/shelf geometry, 18×7 grid of
  labeled cells (category color-coded: alkali metal, halogen, noble gas, metal, nonmetal,
  metalloid — reuse the existing app palette), each cell inspectable/selectable, warm off-white
  material family matching the Anatomy Atelier quality bar (spec §3, §12). Reference imagery:
  any standard IUPAC periodic table layout (public domain data, not the visual design of any
  specific commercial chart).

### Gap B: Labeled metal / nonmetal / metalloid / noble-gas specimen set
- **Need**: 3–4 small inspectable objects (or one multi-hotspot diorama) letting a learner compare
  a metal sample, a nonmetal sample, a metalloid sample, and a noble-gas representation, backing
  the periodic-table branch's "Metal / Nonmetal / Metalloid / Noble gas" low-level items.
- **Why no asset shipped**: no CC0/no-auth-download source was found. Sketchfab has a CC-BY
  silicon-lattice candidate (`lydiathelee/silicon-crystal-lattice-73e292f...`, metalloid) and
  several generic metal-lattice candidates (FCC by `basir.bsmrstu`), both auth-gated. Poly Haven
  and RCSB have no labeled elemental-specimen assets (RCSB is molecules/macromolecules, not raw
  elements; Poly Haven's only near-hits were reaction glassware and decorative desert rocks).
- **Commissioned brief if built from scratch**: four small hero objects — (1) a metal sample with
  visible luster/crystalline grain (e.g. stylized aluminum or copper block), (2) a nonmetal sample
  (sulfur crystal cluster or carbon/graphite flake), (3) a metalloid sample (silicon wafer/ingot —
  our `sodium-chloride-lattice.glb`'s ionic-lattice authoring pattern could extend to a silicon
  diamond-cubic lattice the same way), (4) a sealed glass ampoule silhouette for a noble gas (glow
  discharge color cue, e.g. neon's characteristic red-orange). Keep each under ~2 MB, same warm
  off-white / clean-3D material language as `atom.glb`.

## Summary

COMPONENTS_AUDITED: 12
QUALIFYING_CANDIDATES: 15
GLBS_DOWNLOADED: 6
REJECTED_CANDIDATES: 11
UNRESOLVED_GAPS: 2
DUPLICATE_OR_REUSE_FINDINGS: none — `sodium-chloride-lattice.glb` intentionally double-serves molecules-and-bonding (NaCl) and periodic-table (ionic-lattice example), documented explicitly as a correct scientific reuse, not a flagship-model duplication.
NEXT_INTEGRATION_BATCH: wire water.glb / oxygen.glb / carbon-dioxide.glb / methane.glb / glucose.glb / sodium-chloride-lattice.glb into the molecule-builder module + src/data/modelRegistry.ts in a future wave; revisit periodic-table display-stand and element-specimen gaps once Sketchfab credentials are available (candidates already identified in §2/§3) or commission per §5 briefs.
