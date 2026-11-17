# Biology (Cell Biology / Genetics / Microbiology) Asset Sourcing — Gap-Fill Wave 2

Scope: **re-source specifically the components flagged as REJECT/unresolved** by the earlier
Wave-1/Wave-2 cell-biology sourcing and visual-review passes
(`docs/assets/biology-cell.md`, `docs/assets/reviews/biology-cell-visual.md`,
`docs/assets/COMMISSION-BRIEFS-2026-08-18.md`) — Golgi apparatus and influenza virus by name, plus
any other flagged cell/genetics/microbiology gaps. Human anatomy (organs) is explicitly out of
scope and was not touched. Sourcing + structural validation only — **no route, `modelRegistry.ts`,
or `docs/ASSET-LICENSES.md` integration**; every asset below is flagged `render-review-pending`,
never self-declared PASS.

Ownership boundary for this run: `quantaora-app/public/models/sourced/biology-gaps-wave2/**` and
this document. Nothing else was written to.

Date sourced: 2026-08-18.

## 0. What was actually broken before this wave (re-verified, not assumed)

Re-read directly from `docs/assets/reviews/biology-cell-visual.md` and
`docs/ASSET-LICENSES.md` before doing any new searching:

- **Golgi apparatus** — `organelle-golgi-apparatus-nih.glb` (NIH 3D entry 3DPX-000003) was
  **REJECT**. The only downloadable file at that entry, `FinalGolgi4Print_NIH3D.glb`, is a
  3D-print base plate: a flat pedestal with the Golgi geometry embossed as thin relief on top,
  plus engraved attribution text and a legend bar baked into the mesh geometry itself. No Golgi
  organelle mesh exists anywhere else on disk. This is a true content gap, not a licensing gap.
- **Influenza virus** — the Wave-1 "primary" candidate was a 3-piece deconstructible set (entry
  3DPX-014934: capsid+RNA core, envelope half A, envelope half B). The visual review REJECTed the
  capsid-RNA piece outright (reads as a flat ridged disc, not a virus) and marked both envelope
  halves CONDITIONAL (each alone looks like "a torn/hollow bowl," only reads as a virus when both
  halves are paired). Per `docs/ASSET-LICENSES.md`'s own note on the shipped polio capsid: *"The
  rejected influenza capsid-RNA disc and the CONDITIONAL influenza envelope halves ... were not
  used."* So influenza has never actually had a working single-view asset, despite being marked
  "sourced" in the Wave-1 doc.

## 1. Search process and sources checked

- **NIH 3D** (`3d.nih.gov`) — searched via the site's client-rendered `/discover` search (returns
  no server-rendered results, confirmed empty), so switched to targeted web search
  (`site:3d.nih.gov <term>`) plus direct entry-page fetches, which do expose a Next.js
  flight-data JSON blob in the raw HTML containing every input/output file's exact `fileId`,
  `s3Location`, `fileFormat`, `fileSize`, and the page's own rendered license badge/link. This is
  a more reliable per-file license check than relying on any cached/aggregate metadata — matches
  `docs/ASSET-LICENSES.md`'s own warning that NIH 3D licenses are **per-file, per-entry**, not
  per-source.
- **Sketchfab** — public `api.sketchfab.com/v3/search` and `/v3/models/{uid}` endpoints (no auth
  needed for search/metadata/license fields). The `/v3/models/{uid}/download` endpoint was tested
  directly and confirmed to return `401 {"detail":"Authentication credentials were not
  provided."}` for every candidate with no exception — this is a hard, credential-gated wall, not
  a licensing issue, and matches Wave 1's identical finding. No Sketchfab account/API token was
  available or created for this pass (out of scope per the task brief — sourcing only, no new
  service accounts).
- **Smithsonian 3D (3d.si.edu)** — blocked by Cloudflare bot-challenge (`403 Attention Required`)
  on every request attempted; no results obtainable this pass (same conclusion as Wave 1, which
  found no cell/microbiology content there anyway).
- **TurboSquid, CGTrader, Cults3D, Free3D, RigModels, Sketchfab Store listings** — checked and
  explicitly excluded per `docs/ASSET-LICENSES.md`'s "known traps" list (royalty-free-with-terms
  or unverifiable provenance, not open licences).

## 2. Golgi apparatus — re-search result: GAP CONFIRMED, no qualifying asset found

| Candidate | Source | License (as reported) | Downloadable? | Verdict |
| --- | --- | --- | --- | --- |
| "Golgi Apparatus from EM Tomography" (3DPX-000003) | NIH 3D | CC0 1.0 | Yes (only file: `FinalGolgi4Print_NIH3D.glb`) | **Re-confirmed REJECT** — same print-base-plate file as Wave 1; NIH 3D has no other output variant/format for this entry (checked `/entries/3DPX-000003` and `/entries/3DPX-000003/2` — one downloadable file each, identical) |
| "Golgi Apparatus/Complex" (Sketchfab, MajoraMaster) | Sketchfab | **CC-BY 4.0** (verified: `license.slug: "by"`, `isDownloadable: true`) | API says yes, but `GET /v3/models/f9a893.../download` returns `401` | **Qualifying, not fetched** — the only Sketchfab Golgi model marked `isDownloadable: true` out of 22 results returned for "golgi apparatus" (the other 21 all report `isDownloadable: false`, i.e. paid Store/restricted listings) |
| "Golgi Apparatus Anatomy" (Sketchfab, h3ydari96) | Sketchfab | n/a | `isDownloadable: false` | Rejected — Sketchfab Store paid listing |
| "GOLGI APPARATUS" (Sketchfab, Deepak_Sharma) | Sketchfab | n/a | `isDownloadable: false` | Rejected — not downloadable |
| 18 further Sketchfab "Golgi"/"Golgi apparatus"/"Golgi Complex" results (pavelmo4alov, objects1, patricias_visualbridges, juliopanz ×2, tomparsons, xreadylab, Gager123, anne.abcde, tklab ×2, adamM1, magzgaemz, Frikiprint, jlf_illustration, amritarobertson) | Sketchfab | n/a | all `isDownloadable: false` | Rejected — not downloadable |
| TurboSquid / CGTrader / Cults3D / RigModels / Free3D Golgi listings | various | royalty-free-with-terms, unverifiable | n/a | Rejected — excluded source category per `docs/ASSET-LICENSES.md` known traps |
| Zenodo / GitHub cryo-ET segmentation search | web search | n/a | n/a | No qualifying openly-licensed segmented Golgi mesh found |

**Conclusion: Golgi apparatus remains an unresolved gap.** Nothing new was downloaded. No file was
kept under a "best available" compromise, per the task's explicit instruction to write a
commission brief instead of shipping a mediocre/unclear substitute.

### Golgi apparatus — commission brief

- **Taxonomy path:** Biology > Cell Biology > Golgi apparatus (low-level item).
- **Scientific correctness:** stack of 4–8 flattened, curved membranous cisternae (the
  characteristic "stack of pancakes" shape) with associated vesicles budding off the cis and
  trans faces; should read as a distinct curved-stack silhouette, not a blob or a flat plaque.
- **Separable nodes/hotspots:** cis face, medial cisternae, trans face, transport vesicles —
  matches the Component-Level Learning Flow's "See it / Name it / Explain it" stages.
- **Animations:** vesicle budding/transport (protein moving from ER → cis-Golgi → trans-Golgi →
  vesicle) would add strong teaching value; static is acceptable for v1.
- **Poly/file budget:** target well under the 15MB hero-asset guideline (the real cryo-ET geometry
  that exists at 3DPX-000003 is legitimately good data, just currently inseparable from its print
  pedestal — a decimated, isolated re-export of just the Golgi mesh, with the base plate and
  engraved text manually cropped out in a mesh editor, is the cheapest possible fix if NIH 3D
  itself is contacted for a clean export; otherwise this needs new geometry).
- **Framing:** default camera on the curved stack's long axis, matching the Anatomy Atelier stage
  convention already used for `animal-cell-authored.glb`'s organelles.
- **Child-facing framing:** "the post office of the cell" — proteins go in one side, get
  packaged, come out the other side in delivery trucks (vesicles). Keep the stack/curve legible at
  a glance; a child should be able to say "it's a stack of curvy plates" before any label is shown.
- **Licensing deliverable:** CC0/CC-BY-equivalent redistribution right, `.license.json` sidecar
  matching this repo's existing schema.
- **Procedural-vs-commission call:** **commission** — this is the single most attempted-and-blocked
  gap in the whole cell-biology asset set (blocked in both Wave 1 and this wave, for two different
  reasons: bad geometry at the one license-clear source, and an auth wall at the one license-clear
  Sketchfab candidate). Matching the authored-GLB style already used for `animal-cell-authored.glb`
  (double membrane, cutaway-relief language) is the safest path to something that's both accurate
  and stylistically consistent.
- **Vetted candidate lead for a future wave (not a licensing dead end, just credential-gated):**
  "Golgi Apparatus/Complex" by MajoraMaster (Sketchfab, CC-BY 4.0, `isDownloadable: true`,
  52,672 faces, `https://sketchfab.com/3d-models/golgi-apparatuscomplex-f9a893dac37e43a487bc92e7f828db50`)
  — needs an authenticated Sketchfab API token to actually retrieve the file; license is already
  confirmed clean.

## 3. Influenza virus — re-search result: RESOLVED, two new whole-virion candidates found and downloaded

Rather than re-fetching the same 3-piece deconstructible set Wave 1 already tried (and which the
visual review already REJECTed/CONDITIONAL'd), this pass searched specifically for a **single,
whole, standalone-recognizable** influenza virion — something Wave 1 never found because its
search only surfaced entry 3DPX-014934. Two additional NIH 3D entries turned up under different
search terms, both with a real single-file GLB output (not a piece set):

| Candidate | Source | License | Whole/single mesh? | Verdict |
| --- | --- | --- | --- | --- |
| "Influenza virus" (3DPX-000030), by Darrell Hurt (NIAID) | NIH 3D | **CC0 1.0** | Yes — one continuous mesh, `Flu_NIH3D.glb` | **Accepted (primary)** — `virus-influenza-whole-nih.glb` |
| "Influenza Virion (PathogenAR)" (3DPX-013373), by kbrowne (NIAID Biovisualization Program) | NIH 3D | **CC-BY 4.0** | Yes — one continuous mesh, `Influenza_0_NIH3D.glb` output (the entry's separate FBX/Unity-import files do describe "floating pieces," but that does not apply to this specific GLB output, which validated as a single mesh/node) | **Accepted (alternate — cutaway variant)** — `virus-influenza-pathogenar-cutaway-nih.glb` |
| "Influenza Capsid, Envelope and RNA" 3-piece set (3DPX-014934) | NIH 3D | CC-BY 4.0 | No — 3 separate pieces | **Not re-fetched** — already on disk from Wave 1 at `public/models/sourced/biology-cell/`, already visually REJECTed/CONDITIONAL per `docs/assets/reviews/biology-cell-visual.md`; re-downloading it here would just duplicate a known-bad candidate |
| "Influenza Virus" (Sketchfab, GLS, 2.8M faces) | Sketchfab | CC-BY (`license.slug: "by"`) | Unknown (not inspected — download blocked) | **Qualifying, not fetched** — `401` on download endpoint |
| "A Variety of Influenza Virus Particles" (Sketchfab, GLS, 930k faces) | Sketchfab | CC-BY | Unknown | **Qualifying, not fetched** — `401` |
| "Influenza (Flu Virus)" (Sketchfab, arloopa, 509k faces) | Sketchfab | CC-BY | Unknown | **Qualifying, not fetched** — `401` |
| "Influenza Virus" (Sketchfab, studentinnovation, 12k faces) | Sketchfab | CC-BY | Unknown | **Qualifying, not fetched** — `401` (lightest-weight alternate if a future Sketchfab-auth wave wants a low-poly option) |
| NIH 3D entry 14933 | NIH 3D | CC-BY 4.0 | No | **Rejected/mismatch** — this is actually a Polio Capsid and RNA deconstructible set (title misleadingly returned by a broad web search for "influenza"), unrelated to influenza |

Both accepted files were downloaded, structurally validated (valid `glTF` binary magic header,
version 2, declared length matches file size, parseable JSON chunk, 1 scene / 2 nodes / 1 mesh
each, `POSITION` + `COLOR_0` real vertex-color attributes — no `NORMAL`, same gap seen on several
Wave-1 NIH files, needs `computeVertexNormals()` or equivalent at integration time), and their
thumbnail renders (fetched directly from NIH 3D's own output-file API, not self-rendered) were
visually spot-checked:

- `virus-influenza-whole-nih.glb` — a fully spherical virion densely covered in protein knobs,
  color-coded blue (hemagglutinin) / red (neuraminidase) with yellow membrane visible in the gaps.
  Reads immediately and unambiguously as "a virus," directly comparable in silhouette quality to
  the already-shipped polio capsid.
- `virus-influenza-pathogenar-cutaway-nih.glb` — a half-cutaway: one hemisphere shows the intact
  spiky exterior (pink/red hemagglutinin, yellow neuraminidase on a teal membrane), the other
  hemisphere is sliced open to reveal interior nucleoprotein/RNA (tan) and polymerase (purple)
  detail. This is the first influenza candidate across both waves that offers genuine
  cutaway/cross-section support, matching the CLAUDE.md 3D-asset quality bar's isolate/
  cross-section/compare requirement.

**Neither file has been visually acceptance-reviewed under the app's actual stage lighting/camera
rig** (no headless-render setup was built for this pass) — both are marked
`"render-review-pending"` in their sidecars, consistent with the task's explicit instruction to
never self-declare PASS. A follow-up visual-acceptance pass (same method as
`docs/assets/reviews/biology-cell-visual.md`) is recommended before either is wired into a route.

**Conclusion: Influenza virus gap is resolved from a sourcing standpoint** — two license-clear,
single-mesh, standalone-recognizable candidates now exist on disk, at less than half the combined
file size of Wave 1's rejected 3-piece set (3.0MB + 6.0MB = 9.0MB vs. the old set's ~39MB).

## 4. Other cell/genetics/microbiology gaps re-checked (per docs/assets/COMMISSION-BRIEFS-2026-08-18.md and biology-cell.md §5)

No new candidates were downloaded for any of these — status unchanged from Wave 1's findings,
re-verified rather than assumed:

| Gap | Re-check result |
| --- | --- |
| Mitosis / cell division stages | Re-searched; the only candidate found (`3dpx-000519`, "Stages of mitosis" / Whitefish blastula) is still **CC-BY-NC-SA 4.0** — still explicitly disallowed. No alternative found. Gap unchanged. |
| Plant cell, Fungus, Protozoa | Same Sketchfab CC-BY candidates identified in Wave 1 (campbell-beharm plant cell, plaggy CC0-Mushroom-2, maliakshay394/humbleprogamer amoeba/paramecium) — still license-clear, still blocked by the same confirmed `401` download wall. Fetch-gap, not licensing gap, unchanged from Wave 1. |
| Vacuole, Chloroplast, plant Cell wall | No standalone candidates found this pass either (same as Wave 1) — lowest-risk path remains authoring these as part of a plant-cell asset rather than isolated organelle props. |
| Red blood cell, Muscle cell, Sperm cell, Egg cell | Newly searched this pass (Wave 1 had flagged these as "not searched exhaustively"). Found CC-BY, `isDownloadable: true` Sketchfab candidates for sperm cell ("Sperm Cell" by jawad.abedin, 1.17M faces; "CC0 - Sperm" by plaggy, 2,794 faces — despite its name, API reports `license.slug: "by"`, not CC0) and muscle cell ("Smooth Muscle Cell" by mattmacgregorsharp) — all confirmed `401`-blocked on download, same wall as everything else on Sketchfab. No qualifying red-blood-cell or egg-cell candidate found (top results for both terms were off-topic: hemoglobin molecule models, unrelated game assets). Still a gap; red blood cell / egg cell specifically need a dedicated follow-up search. |
| Full-morphology bacteriophage T4 (with tail/legs) | Checked 3 additional NIH 3D T4 entries not in Wave 1's list (3DPX-002436/"prolate head", 3DPX-001842/"infective T4" cryo-ET, 3DPX-001796/"fiberless T4", 3DPX-011010/duplicate prolate-head). All are CC0 or CC-BY and license-clear, but every one is either explicitly capsid-only or explicitly "fiberless" — none show the tail sheath/tail fibers/baseplate that make T4 visually iconic. Downloaded 3DPX-001842's thumbnail to confirm visually: it is a spiky sphere, same silhouette class as the already-accepted capsid-only file, no tail. **No qualifying full-morphology candidate exists on NIH 3D.** Low priority per the commission-briefs doc (influenza now serves the Virus component); still a gap if T4 specifically is wanted later. |

## 5. Downloaded-file list

All files in `quantaora-app/public/models/sourced/biology-gaps-wave2/`, each validated with the
directory's own `validate-glb.mjs` (same tool/pattern as `physics-mechanics`, `space`, etc. — GLB
magic header, chunk parsing, accessor bounding box, no external dependencies).

| File | Size | License | Status |
| --- | --- | --- | --- |
| `virus-influenza-whole-nih.glb` | 2.9 MB (3,025,888 B) | CC0 1.0 | Structurally valid, `render-review-pending`. sha256 `3eceb8820695f354b4fa1707997b50b18495e3a1e3e14ef7106082222229a23a` |
| `virus-influenza-pathogenar-cutaway-nih.glb` | 5.7 MB (5,997,144 B) | CC-BY 4.0 | Structurally valid, `render-review-pending`. sha256 `2fb62fa7544538e6d304901b0e690abfc8beffc9babf5b1772c67641eb2c54e8` |

Each has a matching `<name>.license.json` sidecar in the same directory, following the exact
schema already used by `public/models/sourced/biology-cell/*.license.json` (sourceUrl, creator,
license, attribution text, redistribution status, dateSourced, downloadUrl, sha256, and a
`validation` block with GLB structural-check results). `validate-glb.mjs` is copied in from
`public/models/sourced/physics-mechanics/` unmodified, so a future pass can re-run it identically.

No Golgi file was downloaded — see §2's commission brief instead of a placeholder asset.

## 6. Duplicate / reuse check

- Neither new file's sha256 matches any existing file's hash search performed against
  `public/models/sourced/biology-cell/*.glb` (`virus-influenza-capsid-rna-nih.glb`,
  `virus-influenza-envelope-a-nih.glb`, `virus-influenza-envelope-b-nih.glb`) — genuinely
  different NIH 3D entries (3DPX-000030 and 3DPX-013373 vs. 3DPX-014934), not re-downloads.
- The Wave-1 3-piece influenza set was deliberately **not** re-fetched into this directory (would
  be a pointless duplicate of already-REJECTed content sitting on disk); this document instead
  supersedes it with two working alternatives.

---

STRUCTURED SUMMARY

COMPONENTS_RE-AUDITED: 2 named gaps (Golgi apparatus, Influenza virus) + 6 previously-flagged gaps
re-checked for change (mitosis, plant cell/fungus/protozoa, vacuole/chloroplast/cell wall,
RBC/muscle/sperm/egg cells, full-morphology T4)
QUALIFYING_CANDIDATES: 2 accepted + 6 qualifying-but-Sketchfab-auth-blocked (1 Golgi, 4 influenza
alternates, 1 sperm/muscle each newly identified)
GLBS_DOWNLOADED: 2 (`virus-influenza-whole-nih.glb`, `virus-influenza-pathogenar-cutaway-nih.glb`)
REJECTED_CANDIDATES: 24 (1 NIH Golgi re-confirmed REJECT, 21 non-downloadable Sketchfab Golgi
listings, 1 misidentified NIH entry 14933, 1 mitosis NC-SA re-confirmed rejected)
GOLGI_STATUS: **still an unresolved gap** — commission brief written (§2), no asset downloaded
INFLUENZA_STATUS: **resolved** — 2 new license-clear, single-mesh, standalone-recognizable
candidates downloaded and structurally validated (both `render-review-pending`, not yet visually
accepted)
OTHER_GAPS_STATUS: unchanged from Wave 1 for mitosis/plant-cell/fungus/protozoa/organelles/T4;
RBC and egg-cell specifically still need a dedicated follow-up search (sperm/muscle now have
identified-but-blocked candidates)
NEXT_STEPS: (1) a visual-acceptance render pass on the 2 new influenza files before any route
wiring, matching `docs/assets/reviews/biology-cell-visual.md`'s method; (2) an authenticated
Sketchfab API token would unblock 7+ already-license-cleared candidates across Golgi, influenza
alternates, plant cell, fungus, protozoa, sperm cell, and muscle cell in one move — this is now
the single highest-leverage unblock for the whole cell-biology asset set; (3) commission a Golgi
apparatus organelle mesh per §2 if the Sketchfab token route remains unavailable.
