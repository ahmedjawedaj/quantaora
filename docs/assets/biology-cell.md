# Biology (Cell Biology / Genetics / Microbiology) Asset Sourcing — Wave 1 (Agent BIO-CELL)

Scope: cell biology, genetics/DNA, and microbiology only (`content/taxonomy/biology.json` branches
`cell-biology`, `genetics`, `microbiology`, all `"detailed": true`). Human anatomy/physiology,
evolution, ecology, plants, animals, health-and-disease, neuroscience, and biochemistry-foundations
are out of scope for this run. Anatomy `.glb`s were never opened or referenced. Inventory + sourcing
+ validation only — no route/registry/`ASSET-LICENSES.md` wiring (a later wave).

Date sourced: 2026-08-18.

Ownership boundary for this run: `quantaora-app/public/models/sourced/biology-cell/**` and this
document. Nothing else was written to.

## 0. What the 3 already-cleared cell assets do and don't cover

Per the task brief, `animal-cell-authored.glb`, `neuron-authored.glb`, and `bacteria-wall-nih.glb`
were **not** re-sourced or re-saved — only inspected via `docs/ASSET-LICENSES.md` and the
authoring script `quantaora-app/scripts/assets/build-cell-glbs.mjs` to know what they contain:

- `animal-cell-authored.glb` — covers the **Animal cell** grouping and these low-level items: cell
  membrane, cytoplasm, nucleus, mitochondrion, lysosome, rough ER, cytoskeleton, plus a decorative
  (not structurally accurate) coiled-DNA element. **Does not** include a distinct ribosome mesh,
  Golgi apparatus, vacuole, chloroplast, or cell wall.
- `neuron-authored.glb` — covers the **Neuron (specialized cell)** grouping only.
- `bacteria-wall-nih.glb` — covers only a peptidoglycan/teichoic-acid/lipid-bilayer cross-section of
  a gram-positive **cell wall**. It is explicitly not a whole bacterium (no nucleoid, ribosomes,
  flagellum, or whole-cell silhouette) — confirmed in `docs/ASSET-LICENSES.md`'s own note.

Everything else below targets what these three do not cover.

## 1. Branch/component mapping table

Source of truth: `content/taxonomy/biology.json`. All three branches in scope are `"detailed": true`.

| Branch | Component / low-level item | Status before this wave | Status after this wave |
| --- | --- | --- | --- |
| cell-biology | Cell membrane, Cytoplasm, Nucleus, Mitochondrion, Lysosome, Endoplasmic reticulum, Cytoskeleton | covered by `animal-cell-authored.glb` | unchanged, adequate |
| cell-biology | Ribosome | not distinctly modeled | **sourced** (raw, oversized) — `organelle-ribosome-80s-bychain-nih.glb`, see §4 |
| cell-biology | Golgi apparatus | none | **sourced** (raw, oversized) — `organelle-golgi-apparatus-nih.glb`, see §4 |
| cell-biology | Vacuole | none | **gap** — see §5 |
| cell-biology | Chloroplast | none | **gap** — see §5 |
| cell-biology | Cell wall (plant) | none (only bacterial wall exists, separate structure) | **gap** — see §5 |
| cell-biology | DNA (as cell-biology low-level item) | decorative coil only, not structurally real | **sourced** — see genetics row below (same asset serves both) |
| cell-biology grouping | Animal cell | `animal-cell-authored.glb` | unchanged, adequate |
| cell-biology grouping | Plant cell | none | **candidate found, not fetched** (Sketchfab auth-gated) — see §2/§5 |
| cell-biology grouping | Bacterial cell | wall cross-section only | **partially sourced** — `bacteria-ecoli-whole-cell-nih.glb` (whole-cell silhouette, no interior nucleoid/ribosome/flagellum detail) |
| cell-biology grouping | Neuron | `neuron-authored.glb` | unchanged, adequate |
| cell-biology grouping | Red blood cell, Muscle cell, Sperm cell, Egg cell | none | **gap** — see §5 |
| cell-biology interactive | Mitosis / cell division stages (named explicitly in `docs/ASSET-SOURCING.md` P0 priority queue) | none | **unresolved gap** — only candidate found is NC-licensed, rejected; see §3/§5 |
| genetics | DNA | none (real structure) | **sourced** — `dna-b-form-double-helix-nih.glb` (CC-BY, from RCSB PDB 1BNA) |
| genetics | Chromosome | none | **partially sourced (bonus)** — `nucleosome-dna-packaging-nih.glb` shows DNA-histone packaging (PDB 3AFA), not a full metaphase-chromosome X-shape; flagged partial in §5 |
| genetics | Gene, Allele, Trait, Mutation | not applicable to 3D asset sourcing | out of scope — these are conceptual/abstract; procedural/UI treatment is correct per the quality bar, not a sourcing gap |
| genetics | Protein | not explicitly required by this wave's priority notes | not pursued this pass (time budget) — RCSB PDB has abundant CC0 protein structures if needed later |
| microbiology | Bacteria | wall cross-section only | **sourced** — `bacteria-ecoli-whole-cell-nih.glb` (CC0) |
| microbiology | Virus | none | **sourced** — primary: `virus-influenza-capsid-rna-nih.glb` + 2 envelope pieces (deconstructible, CC-BY); alternates: `virus-bacteriophage-t4-capsid-bychain-nih.glb` (CC0, capsid-only), `virus-polio-capsid-nih.glb` (CC0) |
| microbiology | Fungus | none | **candidate found, not fetched** (Sketchfab auth-gated) — see §2/§5 |
| microbiology | Protozoa | none | **candidate found, not fetched** (Sketchfab auth-gated) — see §2/§5 |
| microbiology | Microbiome | none | not pursued — inherently a population/ecosystem-of-microbes abstraction, procedural/diagram treatment is correct per the quality bar, not a single-organism sourcing gap |

**33 components/items audited** across the 3 in-scope branches (13 cell-biology low-level items + 8
groupings + 1 interactive-component need + 7 genetics low-level items, DNA counted once, + 5
microbiology low-level items).

## 2. Candidate comparison table

Every candidate evaluated, not just accepted ones. License field is what the source page/API
literally reports, checked per-entry (not assumed from the source name).

| Candidate | Source | License (as reported) | Downloadable? | Verdict | Notes |
| --- | --- | --- | --- | --- | --- |
| B-DNA dodecamer as balls and sticks (3DPX-014287) | NIH 3D, from RCSB PDB 1BNA | CC-BY 4.0 | Yes | **Accepted** | Primary DNA/genetics asset |
| Human nucleosome structure (3DPX-002662, PDB 3AFA), ribbon-rainbow-vis variant | NIH 3D | CC0 1.0 | Yes | **Accepted** | Bonus DNA-packaging/chromosome asset |
| E Coli Simple Model (3DPX-017609) | NIH 3D | CC0 1.0 | Yes | **Accepted** | Primary bacteria/bacterial-cell asset; simple silhouette only |
| Escherichia coli (16305) | NIH 3D | **CC-BY-SA 4.0** | Yes | **Rejected** | ShareAlike clause is not on the allowed list (only public domain/CC0/CC-BY); redistributing under SA would force downstream relicensing obligations incompatible with a proprietary app release |
| Rod (E. coli) Model - Part II (3DPX-017980) | NIH 3D | CC-BY 4.0 | Yes | **Evaluated, not selected** | License-clean alternate, but redundant with the CC0 primary (no attribution burden preferred when duplicate content exists) |
| Influenza Capsid, Envelope and RNA — 3-piece deconstructible set (3DPX-014934) | NIH 3D, commissioned by Smithsonian NMNH | CC-BY 4.0 | Yes | **Accepted** | Primary virus asset — most pedagogically complete (envelope + capsid + RNA as separable pieces) |
| Bacteriophage T4 isometric capsid (3DPX-007978, PDB 5VF3) | NIH 3D (NIAID) | CC0 1.0 | Yes | **Accepted (alternate)** | Capsid shell only, no tail/tail-fibers — under-represents the iconic T4 shape; see §5 brief |
| Polio Virus Capsid (3DPX-001519, EMDB 5886) | NIH 3D | CC0 1.0 | Yes | **Accepted (alternate)** | Whole capsid, oversized file (23.8MB) |
| Stages of Mitosis / Whitefish blastula (3DPX-000519) | NIH 3D | **CC-BY-NC-SA 4.0** | Yes | **Rejected** | NonCommercial clause explicitly disallowed by the sourcing policy |
| Human 80S Ribosome (3DPX-011099, structure 4V6X), surf-bychain-print variant | NIH 3D (NIAID) | CC-BY 4.0 | Yes | **Accepted (raw)** | License-clean but 93MB — see §4 oversize flag |
| Golgi Apparatus from EM Tomography (3DPX-000003) | NIH 3D | CC0 1.0 | Yes | **Accepted (raw)** | License-clean but 28MB — see §4 oversize flag |
| "bio project: plant cell" (Sketchfab, campbell-beharm) | Sketchfab | CC-BY (verified via Sketchfab API `license.slug=by`) | Yes (`isDownloadable: true`) | **Qualifying, not fetched** | Best plant-cell candidate found: 56k faces, labeled organelles (nucleus, ER, vacuole, Golgi, chloroplasts, mitochondria, lysosome, cell wall, ribosomes). Sketchfab's download API requires an authenticated session/API token this sourcing pass does not have — file retrieval, not license, is the blocker |
| "Plant Cell \| Biology" (Sketchfab, okchs) | Sketchfab | CC-BY | Yes | **Qualifying, not fetched** | Alternate plant-cell candidate, 170k faces |
| "Plant Cell Organelles" (Sketchfab, cvallance01) | Sketchfab | CC-BY | Yes | **Qualifying, not fetched** | 1.35M faces — would need heavy decimation even if fetched |
| "Plant CELL" (Sketchfab, naratech) | Sketchfab | **CC-BY-NC** | Yes | **Rejected** | NonCommercial |
| "Amoeba" (Sketchfab, maliakshay394) | Sketchfab | CC-BY | Yes | **Qualifying, not fetched** | Best protozoa candidate, 26.8k faces |
| "Amoeba" (Sketchfab, KadenCampbell) | Sketchfab | CC-BY | Yes | **Qualifying, not fetched** | Ultra-light alternate, 1,008 faces |
| "Paramecium" (Sketchfab, humbleprogamer) | Sketchfab | CC-BY | Yes | **Qualifying, not fetched** | Protozoa alternate, 297k faces |
| "Structure of Amoeba" (Sketchfab, arloopa) | Sketchfab | **Standard (free-standard)** | Yes | **Rejected** | Sketchfab's "Standard" license does not grant redistribution rights, even though it's free to view/download |
| "amoeba" (Sketchfab, msmu) | Sketchfab | undefined/unset | `isDownloadable: false` | **Rejected** | Not downloadable, license unset |
| "Paramecium" (Sketchfab, SsnakeE7) | Sketchfab | undefined/unset | `isDownloadable: false` | **Rejected** | Not downloadable, license unset |
| "CC0 - Mushroom 2" (Sketchfab, plaggy) | Sketchfab | CC-BY (despite the model's own title claiming CC0 — API's `license.slug` says `by`) | Yes | **Qualifying, not fetched** | Best fungus candidate, 2,096 faces (whole mushroom fruiting body, not a fungal cell — acceptable for the organism-level "Fungus" low-level item) |
| "Fungal Cell" (Sketchfab, appsnation.co) | Sketchfab | undefined/unset | `isDownloadable: false` | **Rejected** | Not downloadable, license unset (Sketchfab Store paid listing) |
| "Fungal Cell" (Sketchfab, selinamay.tresenio) | Sketchfab | undefined/unset | `isDownloadable: false` | **Rejected** | Not downloadable, license unset |
| "Yeast cells" (Sketchfab, FranzAlvior) | Sketchfab | undefined/unset | `isDownloadable: false` | **Rejected** | Not downloadable, license unset |
| Smithsonian 3D (3d.si.edu) — searched for diatom/protist/cell content | Smithsonian | n/a | n/a | **No qualifying results** | Smithsonian's 3D collection is specimens/fossils/artifacts; no cellular-biology or microbiology content found |

## 3. Rejection reasons (summary)

- **NC / NC-SA license** (2): Whitefish-blastula mitosis stages (CC-BY-NC-SA), "Plant CELL" by
  naratech (CC-BY-NC). Non-commercial terms are explicitly disallowed by this wave's policy.
- **SA (ShareAlike) license** (1): NIH 3D's other E. coli entry (16305, CC-BY-SA). Not on the
  allowed list (only public domain/CC0/CC-BY); ShareAlike would force any derivative/redistribution
  to carry the same copyleft terms, which is incompatible with a proprietary release.
- **Sketchfab "Standard" (free-standard) license** (1): "Structure of Amoeba" by arloopa. Free to
  view/download on the site but the license grant does not include redistribution rights.
- **Unset/undefined license + not downloadable** (5): four Sketchfab fungal/yeast/protozoa models
  (appsnation.co, selinamay.tresenio, FranzAlvior, SsnakeE7, msmu) all report `license: undefined`
  and `isDownloadable: false` via the Sketchfab API — likely Store/paid or restricted listings.
  Rejected on both license-clarity and non-downloadability grounds.

## 4. Downloaded-file list

All files in `quantaora-app/public/models/sourced/biology-cell/`. Every `.glb` has a sidecar
`<name>.license.json` with sourceUrl, creator, license, attribution requirement, redistribution
status, `dateSourced: "sourced 2026-08-18"`, file size, sha256, and glTF structural-validation
counts (magic header, scene/node/mesh/material/texture/animation/accessor counts, sample bounding
box). None were visually render-inspected — only structurally validated via a Node script reading
the GLB binary header + JSON chunk (magic bytes, chunk parsing, accessor min/max).

| File | Size | License | Notes |
| --- | --- | --- | --- |
| `dna-b-form-double-helix-nih.glb` | 6.8 MB | CC-BY 4.0 | Genetics DNA hero — within size budget |
| `nucleosome-dna-packaging-nih.glb` | 16.5 MB | CC0 1.0 | Chromosome/DNA-packaging bonus — slightly over 15MB target |
| `bacteria-ecoli-whole-cell-nih.glb` | 108.6 KB | CC0 1.0 | Bacteria/bacterial-cell hero — very lightweight, simple silhouette |
| `virus-influenza-capsid-rna-nih.glb` | 15.0 MB | CC-BY 4.0 | Virus hero, core piece (capsid+RNA) — at the size ceiling |
| `virus-influenza-envelope-a-nih.glb` | 12.3 MB | CC-BY 4.0 | Virus hero, envelope half A |
| `virus-influenza-envelope-b-nih.glb` | 11.5 MB | CC-BY 4.0 | Virus hero, envelope half B (3-piece set totals ~39MB combined) |
| `virus-bacteriophage-t4-capsid-bychain-nih.glb` | 10.9 MB | CC0 1.0 | Virus alternate — capsid only, no tail |
| `virus-polio-capsid-nih.glb` | 23.8 MB | CC0 1.0 | Virus alternate — oversized, needs decimation |
| `organelle-ribosome-80s-bychain-nih.glb` | 93.1 MB | CC-BY 4.0 | Ribosome — **raw material only, not ship-ready**, ~6x over budget |
| `organelle-golgi-apparatus-nih.glb` | 28.1 MB | CC0 1.0 | Golgi apparatus — oversized, needs decimation |

Total on disk: **10 GLBs, ~219 MB**. All confirmed valid glTF 2.0 binaries (magic header `glTF`,
parseable JSON chunk, ≥1 scene/node/mesh/accessor each). None have embedded materials, textures, or
animations — all are vertex-colored structural meshes exported from NIH's PDB/cryo-EM/EM-tomography
pipelines, consistent with the rest of the NIH-sourced entries already in `ASSET-LICENSES.md`.

**Size-budget flags for a future processing wave:** `organelle-ribosome-80s-bychain-nih.glb` (93MB),
`virus-polio-capsid-nih.glb` (23.8MB), and `organelle-golgi-apparatus-nih.glb` (28.1MB) all exceed
the 15MB hero-asset guideline and need a decimation/Draco-compression pass before they can ship.
The influenza 3-piece set and the nucleosome file are marginally over/at the line.

## 5. Unresolved gaps — commissioned-model briefs

For every gap where nothing qualified (license-wise) or nothing was fetchable, here is what a
commissioned model would need instead of a fabricated placeholder:

**Mitosis / cell division stages** (cell-biology interactive component, explicit P0 in
`docs/ASSET-SOURCING.md`)
- Geometry: 4–5 discrete stage models (prophase, metaphase, anaphase, telophase, optionally
  cytokinesis) of a generic animal cell showing chromosome condensation, spindle fibers, and nuclear
  envelope breakdown/reformation — consistent cell silhouette across stages so a "scrub through
  mitosis" interaction reads as one continuous object.
- Reference imagery: standard biology-textbook mitosis diagrams (not the rejected NC-SA whitefish
  blastula prints); NIH's own model shows the right *idea* (bas-relief mitosis stages) but is
  license-blocked.
- Detail level: same fidelity tier as `animal-cell-authored.glb` (transparent membrane, readable
  chromosomes/spindle, no photoreal texturing needed).

**Plant cell** (cell-biology grouping)
- A CC-BY candidate exists ("bio project: plant cell" by campbell-beharm, Sketchfab, 56k faces) —
  this is a **fetch gap, not a licensing gap**. Needs an authenticated Sketchfab download (API
  token or logged-in session) in a follow-up wave. If that continues to be blocked, commission a
  companion to `animal-cell-authored.glb` using the same authored-GLB pipeline
  (`build-cell-glbs.mjs`) adding: cell wall, large central vacuole, chloroplasts, and removing
  lysosomes/centrioles to match real plant-cell biology — this keeps visual-language parity with
  the existing animal cell.

**Fungus, Protozoa** (microbiology low-level items)
- Same situation: CC-BY candidates exist and are downloadable per the Sketchfab API
  (`CC0-Mushroom 2` by plaggy for fungus; `Amoeba` by maliakshay394 and `Paramecium` by
  humbleprogamer for protozoa) but require authenticated Sketchfab retrieval not available in this
  sandboxed pass. Flag as fetch-gap first; only commission new geometry if Sketchfab access remains
  unavailable in the next wave.

**Vacuole, Chloroplast, plant Cell wall** (cell-biology organelles)
- Not found as standalone NIH/Sketchfab CC0/CC-BY assets in this pass (time-boxed search). Lowest
  risk path: author these as small addition to the plant-cell asset above (a plant cell with correct
  organelles already contains vacuole/chloroplast/wall in situ) rather than sourcing isolated
  organelle props.
- If a standalone chloroplast is still wanted (e.g. for the Plants branch's own chloroplast item),
  commission brief: double-membrane organelle with visible thylakoid stacks (grana) and stroma,
  matching the authored-GLB cutaway style already used for mitochondria in `animal-cell-authored.glb`.

**Red blood cell, Muscle cell, Sperm cell, Egg cell** (cell-biology specialized-cell groupings)
- Not searched exhaustively this pass (time budget — flagged rather than left silent, per
  instructions). These are common biology-education subjects; expect CC0/CC-BY candidates to exist
  on NIH 3D or Sketchfab but were not verified. Recommend a dedicated follow-up sourcing pass before
  commissioning new geometry.

**Full-morphology bacteriophage T4 (with tail/legs)**
- The accepted CC0 capsid-only model (`virus-bacteriophage-t4-capsid-bychain-nih.glb`) is
  structurally accurate PDB data but shows only the icosahedral head, not the tail sheath, tail
  fibers, or baseplate that make T4 visually iconic ("lunar lander" silhouette). If T4 specifically
  (rather than the already-sourced influenza set) is wanted as the Virus hero, commission: capsid
  head (can reuse the sourced PDB 5VF3 geometry) + tail sheath + 6 tail fibers + baseplate, in the
  same low-poly/vertex-color style as the rest of the authored cell set.

## 6. Duplicate / reuse findings

- No overlap detected between this wave's downloads and the existing cleared cell assets
  (`animal-cell-authored.glb`, `neuron-authored.glb`, `bacteria-wall-nih.glb`) — different sha256s,
  different subjects.
- Internal near-duplicate avoided: NIH 3D hosts two independent E. coli models (16305 CC-BY-SA,
  rejected; 17980 CC-BY, evaluated-not-selected) in addition to the accepted CC0 17609 — only one
  was downloaded to avoid redundant bacteria content per the "never reuse/duplicate flagship
  content" spirit of the quality bar.
- The 3-piece influenza set (envelope A, envelope B, capsid+RNA) is intentionally kept as 3 files
  rather than merged, since NIH designed it as a deconstructible teaching aid — a future
  integration pass should decide whether the viewer loads all 3 by default or lazy-loads the
  envelope halves only on an "explode/isolate" interaction.

---

STRUCTURED SUMMARY

COMPONENTS_AUDITED: 33
QUALIFYING_CANDIDATES: 16
GLBS_DOWNLOADED: 10
REJECTED_CANDIDATES: 9
UNRESOLVED_GAPS: 6 (mitosis stages; plant cell fetch; fungus+protozoa fetch; vacuole/chloroplast/plant cell wall; red-blood-cell/muscle/sperm/egg specialized cells; full-morphology T4 phage)
DUPLICATE_OR_REUSE_FINDINGS: none against existing cleared assets; internally deduped E. coli (kept 1 of 3 candidates) and kept the 3-piece influenza set intentionally split (not a duplicate, a designed deconstructible set)
NEXT_INTEGRATION_BATCH: DNA (dna-b-form-double-helix-nih.glb) and E. coli (bacteria-ecoli-whole-cell-nih.glb) are lightest-weight and most ship-ready; influenza 3-piece virus set next after deciding load strategy; Golgi/ribosome/polio-capsid need a decimation pass before any route wiring; plant cell/fungus/protozoa need an authenticated Sketchfab fetch follow-up before they can be integrated at all
