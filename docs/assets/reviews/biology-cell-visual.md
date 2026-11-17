# Biology — Cell Biology / Genetics / Microbiology — Visual Acceptance Review

Reviewer: Agent BIO-CELL (visual acceptance pass, Asset Recovery Wave 2)
Date: 2026-08-18
Scope: the 10 `.glb` files sourced by the earlier BIO-CELL sourcing wave under
`quantaora-app/public/models/sourced/biology-cell/`. Anatomy models and the 3 already-cleared
authored cell assets (`animal-cell-authored.glb`, `neuron-authored.glb`, `bacteria-wall-nih.glb`)
are out of scope and were not touched.

**Headline finding vs. the task brief's warning:** none of the 10 `.glb` files are S3
`AccessDenied` XML pages. All 10 have a valid `glTF` binary magic header, a parseable JSON chunk,
and load cleanly through `GLTFLoader` in an isolated headless-Chromium/SwiftShader renderer built
for this review (`/tmp/asset-review-biology-cell/`, not committed). The problems found in this
pass are about **content**, not file corruption: one asset is a literal 3D-print base plate with
engraved text, one is an unreadable flat disc when viewed alone, several ship at 3–6× the 15MB
mobile budget, and none carry per-atom/per-organelle color coding beyond raw chain-rainbow exports.

Rendering method: headless Chromium (`puppeteer-core` + the Chrome-for-Testing binary already
cached under `~/.cache/puppeteer`) with `--use-gl=swiftshader`, loading the app's exact vendored
Three.js/`GLTFLoader` builds via an importmap. Stage replicates
`src/components/explorer/GenericViewer.tsx` exactly: background `#faf8f4`, ambient `#fff4e6`
@0.7, key light `#fff7ec` @2 at (3,4,3), fill light `#dce8f5` @0.6 at (-3,-1,2), `PerspectiveCamera`
fov 36, `ACESFilmicToneMapping`, `SRGBColorSpace` output. Each model was auto-framed by computing
its bounding box and scaling/centering it the same way `GenericModel.tsx`'s `GlbModel` does
(`FIT_SIZE`-equivalent normalization), independent of native units — necessary here because native
bounding boxes range from ~15 units (bacteria) to ~930 units (T4 phage). Meshes lacking a `NORMAL`
attribute got `computeVertexNormals()` (the app's real `GLTFLoader` does not add this
automatically, so any of these that ship as-is would render unlit/flat without an equivalent
fix — flagged per-asset below). Materials were only tuned the way `GlbModel` tunes them
(clamp roughness 0.42–0.62, force metalness 0) — nothing else was invented. 5 angles were
captured per asset (front, 3/4 front-left, 3/4 front-right, top-down 3/4, and a shape-revealing low
angle) plus a per-asset contact sheet, all under
`review-screenshots/asset-acceptance-2026-08-18/biology-cell/<asset-slug>/`.

## Summary table

| Asset | Verdict | One-line reason |
| --- | --- | --- |
| `bacteria-ecoli-whole-cell-nih.glb` | CONDITIONAL | Correct rod-bacterium silhouette but a totally featureless smooth capsule (no nucleoid/flagellum/wall texture, no color) — reads as "pill," not "bacterium," without hotspot context |
| `dna-b-form-double-helix-nih.glb` | PASS | Clean, immediately recognizable double helix; monochrome balls-and-sticks, well within size budget |
| `nucleosome-dna-packaging-nih.glb` | CONDITIONAL | Excellent, scientifically accurate DNA-wrapped-histone visual with a strong top-down hero shot; saturated rainbow chain coloring clashes with the quality bar, and it's marginally over the 15MB budget |
| `organelle-golgi-apparatus-nih.glb` | REJECT | The downloaded file is a 3D-print base plate — a flat rectangular slab with engraved attribution text and a legend bar; not a usable organelle mesh |
| `organelle-ribosome-80s-bychain-nih.glb` | CONDITIONAL | Scientifically rich, detailed cryo-EM surface, but 93MB (6× budget) and a saturated rainbow palette; amorphous blob shape is hard to "recognize" without labeling |
| `virus-bacteriophage-t4-capsid-bychain-nih.glb` | CONDITIONAL | Nicely textured icosahedral capsid but capsid-only (no tail/fibers/baseplate) — doesn't read as "T4," just "a round spiky ball"; rainbow chain coloring |
| `virus-influenza-capsid-rna-nih.glb` | REJECT | Alone, this renders as a flat ridged oval disc — does not read as "virus" or even "RNA" to any viewer without labels; only makes sense nested inside the envelope halves |
| `virus-influenza-envelope-a-nih.glb` | CONDITIONAL | Good spiky-virus half-sphere, but it's only half — alone it looks like a torn/hollow bowl; needs pairing with envelope-b (and ideally the capsid-RNA core) to read as "a virus" |
| `virus-influenza-envelope-b-nih.glb` | CONDITIONAL | Mirror of envelope-a; same half-sphere caveat |
| `virus-polio-capsid-nih.glb` | CONDITIONAL | Best "iconic virus" shape of the batch — full spiky sphere, monochrome, highly recognizable — but 23.8MB (over budget), needs a decimation pass |

**Totals: 10/10 rendered (0 unrenderable). PASS: 1. CONDITIONAL: 7. REJECT: 2.**

---

## 1. `bacteria-ecoli-whole-cell-nih.glb`

**Verdict: CONDITIONAL**

- Taxonomy mapping: `biology.json` → `cell-biology` → grouping "Bacterial cell", and
  `microbiology` → low-level item "Bacteria". License sidecar's `componentMapping` matches this
  correctly.
- Scientific relevance/accuracy: gross rod (bacillus) shape is directionally correct for E. coli,
  but there is zero internal or surface detail — no nucleoid, no ribosomes, no flagellum, no
  pili, no cell-wall texture. The sidecar itself flags this as "basic silhouette quality, not
  hero-detail," which the render confirms.
- Mesh/material/texture quality: single mesh, 2,995 vertices / 5,986 triangles, `POSITION` only
  (no `NORMAL`, no `COLOR_0`, no material). `computeVertexNormals()` was required to get any
  lighting response at all — the app's real `GLTFLoader` does not add this automatically, so
  shipping this file as-is (without an equivalent fix in the loading pipeline) would render flat/
  unlit. Surface has a faint low-poly facet pattern visible under raking light (see
  `03-three-quarter-front-right.png`).
- Recognizability for a child audience: as a smooth capsule with rounded ends, this reads more as
  "a pill" or "a marshmallow" than "a bacterium" without a label. Needs hotspot/label support to
  land the "this is a bacterium" idea.
- Style fit: monochrome off-white, no lighting faults, fits the clean-3D warm-off-white bar by
  default (there's simply nothing to clash with). Not gamey, not cluttered — just under-detailed.
- Camera framing/bbox: native bbox size ~[10, 10, 15] (from `report-output/latest.json`), a
  1.5:1 elongated capsule. Front view (`01-front.png`) looks straight down the long axis and is
  uninformative (just a circle); the 3/4 views are the ones that actually show the rod shape. The
  in-app default camera (fov 36, distance ~6.3) would show a similar issue — recommend a default
  orbit angle that isn't dead-on front for this asset specifically.
- Transparency/material faults: none (opaque, no material even present).
- Animation: none present (`animationCount: 0`); this is a static structural model. An animation
  would add real value here (e.g., binary fission / division), but that's a separate authoring
  effort, not a defect in this asset.
- Performance: 108.6 KB, 2,995 verts — trivially light, no concern.
- Attribution: `attributionRequired: false` (CC0 1.0). Recommended (non-mandatory) credit text is
  present in the sidecar: `"E Coli Simple Model", NIH 3D (3d.nih.gov, entry 3DPX-017609), by
  akhasawneh. CC0 1.0.`

Screenshots: `bacteria-ecoli-whole-cell-nih/01-front.png` … `05-low-underside.png`,
contact sheet `bacteria-ecoli-whole-cell-nih/_contact-sheet-bacteria-ecoli-whole-cell-nih.png`.

## 2. `dna-b-form-double-helix-nih.glb`

**Verdict: PASS**

- Taxonomy mapping: `biology.json` → `genetics` → low-level item "DNA" (also usable for
  `cell-biology`'s DNA item). Matches sidecar's `componentMapping`.
- Scientific relevance/accuracy: genuine B-DNA double helix derived from RCSB PDB 1BNA
  (a real crystallographic dodecamer structure, not a stylized decorative coil). Clearly shows
  the antiparallel double-helix twist and major/minor grooves in the 3/4 and top-down views.
- Mesh/material/texture quality: single mesh, 188,246 vertices / 377,300 triangles (smooth
  ball-and-stick spheres/cylinders), `POSITION` only — **no `COLOR_0` and no material**, despite
  the sidecar's validation note claiming "Vertex-colored balls-and-sticks mesh." That claim is
  incorrect: this file is monochrome white throughout, with no differentiation between backbone
  atoms, base atoms, or strands. This is a real (if modest) pedagogical gap — a child can see
  "it's a twisted ladder" but can't see "these are the two strands" or "these are base pairs" by
  color alone.
- Recognizability: excellent. The double-helix silhouette is unmistakable from every angle
  captured, including the low/side angle (`05-low-underside.png`, shot end-on along the helix
  axis) which shows the characteristic spiral offset clearly.
- Style fit: clean, warm-white, matches the Anatomy Atelier bar well — not gamey, not cluttered,
  reads as a lab/scientific model rather than a toy.
- Camera framing/bbox: native bbox ~[42, 28, 23] units, a wide horizontal helix. Auto-fit centers
  and fills the frame correctly at every angle; no clipping or off-center framing observed.
- Transparency/material faults: none.
- Animation: none present; static is fine here, though a "strand separation / replication fork"
  animation would be a strong future addition matching the Genetics branch's "DNA replication"
  process.
- Performance: 6.8 MB, comfortably within the 15MB hero-asset budget.
- Attribution: **required** (CC-BY 4.0). Sidecar text: `"B-DNA dodecamer as balls and sticks" by
  mariu.mihasan, NIH 3D (3d.nih.gov, entry 3DPX-014287), derived from RCSB PDB 1BNA. Licensed
  CC-BY 4.0.` — must be surfaced in-app before shipping (not yet wired per the sourcing doc; out
  of scope for this visual pass but flagged since it's a shipping blocker).

Screenshots: `dna-b-form-double-helix-nih/01-front.png` … `05-low-underside.png`,
contact sheet `dna-b-form-double-helix-nih/_contact-sheet-dna-b-form-double-helix-nih.png`.

## 3. `nucleosome-dna-packaging-nih.glb`

**Verdict: CONDITIONAL**

- Taxonomy mapping: `genetics` → "Chromosome" per the sidecar, flagged there as a "bonus" partial
  match. This is the correct caveat to keep — the model shows DNA (green ribbon) wrapped around a
  histone octamer core (rainbow ribbons), which is real nucleosome structure (PDB 3AFA), **not**
  a full metaphase chromosome's X-shape. It should be labeled/mapped as "DNA packaging /
  nucleosome," a supporting visual for the Chromosome concept, not a stand-in for "Chromosome"
  itself if a child expects the familiar X shape.
- Scientific relevance/accuracy: high — real crystallographic structure, correctly shows DNA
  coiling around histones, which is exactly the mechanism the Chromosome/DNA-packaging concept
  needs to teach.
- Mesh/material/texture quality: 5 meshes, 349,684 vertices / 561,736 triangles total, `POSITION`
  + `NORMAL` + `COLOR_0` (real per-chain rainbow vertex coloring, unlike the DNA helix file).
  Rendering is smooth and well-lit; no visible seams or gaps between the 5 sub-meshes.
- Recognizability: the top-down 3/4 angle (`04-top-down-three-quarter.png`) is a genuinely strong
  "wagon-wheel" hero shot — a child can see DNA (green) wound around a colorful core, which
  visually explains "DNA gets packaged around proteins" better than a diagram could. The other
  angles are serviceable but less immediately legible (side views read as a green-and-rainbow
  tangle).
- Style fit: **this is the main issue.** The chain-rainbow vertex coloring (bright green, gold,
  orange, blue, red) is vivid and scientifically conventional (color-by-chain is standard
  structural-biology visualization) but is a clear mismatch against the "warm off-white, clean-3D,
  not gamey" bar — it reads closer to a bright toy/puzzle-ball palette than the muted Anatomy
  Atelier language. Recommend a recolor pass (e.g., a duotone DNA-green + single warm protein-tan)
  before this ships as a default-state hero asset, reserving full rainbow for an optional
  "color by chain" toggle if one exists.
- Camera framing/bbox: native bbox ~[100.8, 63.9, 103.6], a fairly balanced blob — auto-fit framed
  it well at all 5 angles with no clipping.
- Transparency/material faults: none.
- Animation: none present. An "unwind" animation (chromosome → nucleosome → bare DNA) would add
  real teaching value given this is explicitly a packaging-mechanism asset, but that's future work.
- Performance: 16.5 MB — marginally over the 15MB budget (the quality report puts it at 15.77MB
  raw, still over). Needs at least a light decimation pass.
- Attribution: `attributionRequired: false` (CC0 1.0). Recommended credit:
  `"Human nucleosome structure", NIH 3D (3d.nih.gov, entry 3DPX-002662), derived from RCSB PDB
  3AFA. CC0 1.0.`

Screenshots: `nucleosome-dna-packaging-nih/01-front.png` … `05-low-underside.png`,
contact sheet `nucleosome-dna-packaging-nih/_contact-sheet-nucleosome-dna-packaging-nih.png`.

## 4. `organelle-golgi-apparatus-nih.glb`

**Verdict: REJECT**

- Taxonomy mapping: `cell-biology` → low-level item "Golgi apparatus" — correct target, but the
  delivered file cannot serve it.
- What the render actually shows: this is **not an isolated organelle mesh**. The downloaded
  variant (`FinalGolgi4Print_NIH3D.glb`, per the sidecar's own `downloadedVariant` field) is a
  3D-print-ready file: a flat rectangular base plate/pedestal with the actual Golgi geometry
  embossed as a thin relief on top, plus **engraved attribution text directly in the geometry**
  (legible in `04-top-down-three-quarter.png`: lines reading "Assembly, Golgi...", "...Berkeley
  Lab, NIH...", "Golgi Apparatus", "Physical model by Harold Hart...") and a small blue
  color-coded scale/legend bar along one edge. The front view (`01-front.png`) and low/underside
  view (`05-low-underside.png`) show this even more starkly — from the side it's an obvious flat
  slab with a bumpy top surface, not a recognizable membranous organelle stack from any angle.
- Scientific relevance: the underlying cryo-ET-derived Golgi geometry (visible as the bumpy top
  texture) is presumably a legitimate reconstruction, and the sourcing doc is right that this
  kind of real-data geometry has pedagogical value — but it is inseparable from the print base in
  this specific file. Nothing about the surrounding pedestal/text is teachable content; a child
  viewing this would see a plaque or nameplate, not a cell organelle.
- Mesh/material/texture quality: 701,386 vertices / 1,409,330 triangles, `COLOR_0` present (used
  for the blue legend bar and faint green markers), no `NORMAL` (needed `computeVertexNormals()`
  to render at all — same gap as the bacteria file).
- Recognizability: fails outright — this reads as "a rectangular plaque," not "an organelle,"
  from every one of the 5 captured angles.
- Camera framing/bbox: native bbox ~[56.1, 8.5, 48.1] — the Y dimension (8.5) being roughly 1/6th
  of X/Z (56/48) is itself diagnostic: this is a thin flat slab, not a 3D organelle stack. Bbox
  shape alone should have been a red flag before this got saved as a candidate asset.
- Performance: 28.1 MB, ~1.9× the budget — moot given the content problem, but noted for
  completeness.
- Attribution: `attributionRequired: false` (CC0 1.0). Recommended credit:
  `"Golgi Apparatus from EM Tomography", NIH 3D (3d.nih.gov, entry 3DPX-000003), by swanjere, from
  cryo-ET data by Rachid Sougrat. CC0 1.0.`
- Recommendation: go back to the NIH 3D entry (3DPX-000003) and look for a non-print-oriented
  export/variant that contains only the Golgi mesh with no base plate and no engraved text; if
  none exists, this needs either a manual geometry-isolation pass (crop away the base plate and
  text in a mesh editor) or a different source entirely. Do not ship the current file under any
  circumstance — the engraved text alone makes it unusable regardless of license cleanliness.

Screenshots: `organelle-golgi-apparatus-nih/01-front.png` … `05-low-underside.png`,
contact sheet `organelle-golgi-apparatus-nih/_contact-sheet-organelle-golgi-apparatus-nih.png`.

## 5. `organelle-ribosome-80s-bychain-nih.glb`

**Verdict: CONDITIONAL**

- Taxonomy mapping: `cell-biology` → low-level item "Ribosome". Correct target; sidecar mapping
  is accurate and honest about there being no other ribosome mesh in the existing asset set.
- Scientific relevance/accuracy: high-fidelity, real cryo-EM-derived human 80S ribosome structure
  (PDB/structure 4V6X), colored by protein/RNA chain. This is genuinely accurate structural
  biology, not a stylized stand-in.
- Mesh/material/texture quality: single mesh, 2,283,564 vertices / 2,432,410 triangles,
  `POSITION` + `NORMAL` + `COLOR_0`. Renders cleanly with good surface shading (real cryo-EM
  surface detail is visible under the key light in all 5 angles) — no gaps, no backface issues,
  no z-fighting observed even at the low/underside angle.
- Recognizability for a child audience: this is the weakest point. A ribosome doesn't have an
  iconic silhouette the way a virus or a double helix does — the render is an amorphous,
  colorful, blobby mass from every angle. Without a hotspot label actively saying "this is a
  ribosome, it makes proteins," a child would have no independent way to recognize or name this
  shape. That's not really fixable by better modeling (real ribosomes *are* blobby) — it just
  means this asset leans hard on the "Name it" / "Explain it" stages of the Component-Level
  Learning Flow rather than "See it" recognition, which is fine as long as the hotspot/label
  design compensates.
- Style fit: same rainbow-chain-coloring mismatch as the nucleosome and T4 files — vivid,
  saturated, more "colorful lab poster" than "warm off-white clean-3D." Recommend a muted
  recolor for the default view.
- Camera framing/bbox: native bbox ~[287.9, 327.2, 321.1] — fairly balanced/cubic, auto-fit framed
  it consistently with no clipping across all 5 angles.
- Transparency/material faults: none.
- Animation: none present. A translation-in-progress animation (mRNA threading through, tRNA
  cycling) would add substantial teaching value for this specific organelle, more so than most
  other assets in this set, given how central translation is to the Genetics branch's process
  list — worth flagging as a high-value future animation target, not a defect today.
- Performance: **93.1 MB — 6.2× the 15MB budget.** The sidecar's own note says "DO NOT SHIP
  AS-IS" and this render pass confirms the geometry itself is fine, so the fix is purely a
  decimation/retopology problem, not a re-sourcing problem. This is the single heaviest file in
  the set and the biggest blocker to shipping anything from this batch.
- Attribution: **required** (CC-BY 4.0). Sidecar text: `"Human 80S Ribosome", NIAID / NIH 3D
  (3d.nih.gov, entry 3DPX-011099), derived from structure 4V6X. Licensed CC-BY 4.0.`

Screenshots: `organelle-ribosome-80s-bychain-nih/01-front.png` … `05-low-underside.png`,
contact sheet
`organelle-ribosome-80s-bychain-nih/_contact-sheet-organelle-ribosome-80s-bychain-nih.png`.

## 6. `virus-bacteriophage-t4-capsid-bychain-nih.glb`

**Verdict: CONDITIONAL**

- Taxonomy mapping: `microbiology` → low-level item "Virus", marked "alternate" in the sourcing
  doc. Correct target.
- Scientific relevance/accuracy: real icosahedral T4 capsid structure (PDB 5VF3), correctly
  showing the capsomer protein tiling over the shell surface. As the sidecar itself flags, this
  is **capsid-only** — no tail sheath, tail fibers, or baseplate, which is what actually makes
  T4 recognizable as "the lunar-lander phage" in textbook imagery.
- Mesh/material/texture quality: single mesh, 210,068 vertices / 420,128 triangles, `POSITION` +
  `NORMAL` + `COLOR_0`. The surface texture reads as a convincing bumpy protein-capsomer pattern
  in close-up (visible in all 5 angles) — this is a well-made capsid mesh on its own terms.
- Recognizability: as a standalone shape, this looks like "a round textured ball with patches of
  color" — recognizable as *a* virus-like structure to someone who already knows viruses have
  capsids, but not specifically as *T4 phage* (no tail = no iconic silhouette). Fine as a
  secondary "compare capsid structures" asset per the sourcing doc's own framing; not
  strong enough to be the primary Virus hero on its own.
- Style fit: saturated rainbow chain coloring (magenta/gold/blue/red/green patches) — same
  concern as the nucleosome/ribosome files, more toy-ball than clean-3D museum-specimen. Combined
  with the round/textured shape, this is the asset most at risk of reading as "gamey" (it visually
  resembles a beach ball or a soccer-ball toy more than the other virus candidates do).
- Camera framing/bbox: native bbox ~[874, 862, 928] — very close to cubic/spherical, auto-fit
  framed it consistently and fully in-frame at all 5 angles, no clipping.
- Transparency/material faults: none.
- Animation: none present; static is acceptable for a capsid-structure teaching point.
- Performance: 10.9 MB, within budget.
- Attribution: `attributionRequired: false` (CC0 1.0). Recommended credit:
  `"Bacteriophage T4 isometric capsid", NIAID / NIH 3D (3d.nih.gov, entry 3DPX-007978), derived
  from PDB 5VF3. CC0 1.0.`

Screenshots: `virus-bacteriophage-t4-capsid-bychain-nih/01-front.png` … `05-low-underside.png`,
contact sheet
`virus-bacteriophage-t4-capsid-bychain-nih/_contact-sheet-virus-bacteriophage-t4-capsid-bychain-nih.png`.

## 7. `virus-influenza-capsid-rna-nih.glb`

**Verdict: REJECT** (as a standalone default-display asset — see integration note below)

- Taxonomy mapping: `microbiology` → low-level item "Virus", flagged as the "PRIMARY virus
  candidate" in the sourcing doc because the full 3-piece set (this file + envelope-a +
  envelope-b) is the most pedagogically complete option found. That reasoning is sound for the
  *set*; this review is specifically about what this one file looks like on its own.
- What the render actually shows: from every angle, this is a thin, flat, ridged oval
  disc — like a scalloped leaf or a grooved cookie. The front view (`01-front.png`) is a nearly
  invisible vertical sliver; the 3/4 and top-down views show parallel ridged/combed grooves
  across an oval plate. This is presumably a reasonable representation of the bundled influenza
  RNA genome segments (8 segments, side by side) plus their nucleoprotein coating, but nothing
  about the shape communicates "virus," "RNA," or "capsid" to any viewer — expert or child —
  without an explicit label.
- Mesh/material/texture quality: single mesh, 418,283 vertices / 837,046 triangles, `POSITION`
  only (no `NORMAL`, no `COLOR_0`, no material) — same normals gap as the bacteria/golgi files,
  needed `computeVertexNormals()` to render at all.
- Recognizability: fails for a child audience in isolation — this is the core reason for the
  REJECT verdict. Per the review brief's own standard ("a plausible name with a broken/generic/
  misleading mesh is a REJECT"), a flat ridged disc under the name "capsid-rna" is misleading if
  shown on its own.
- Camera framing/bbox: native bbox ~[0.227, 2.24, 2.24] — a ~10:1 flatness ratio in the smallest
  axis vs. the other two. This extreme aspect ratio is itself a strong bounding-box red flag,
  independent of the visual inspection — worth checking for automatically in future quality gates
  (e.g., flag any asset whose bbox min-dimension is <15% of its max dimension for manual review).
- Transparency/material faults: none (opaque, no material).
- Animation: none present.
- Performance: 15.0 MB — right at the budget ceiling on its own; combined with both envelope
  halves the full set is ~39MB, confirmed from file sizes on disk.
- Attribution: **required** (CC-BY 4.0, commissioned by the Smithsonian NMNH). Sidecar text:
  `"Influenza Capsid, Envelope and RNA" by PeeryA, NIH 3D (3d.nih.gov, entry 3DPX-014934),
  commissioned by the Smithsonian National Museum of Natural History. Licensed CC-BY 4.0.`
- Integration note (not a scope change to this review, just context for whoever picks this up
  next): this file may still be usable as a nested/hidden piece inside an "explode the virus"
  interaction where it's revealed pulled out from inside the assembled envelope halves with an
  explicit "RNA genome" label and callout — that is a plausible path to a future PASS. As
  delivered and viewed on its own, it does not meet the recognizability bar.

Screenshots: `virus-influenza-capsid-rna-nih/01-front.png` … `05-low-underside.png`,
contact sheet
`virus-influenza-capsid-rna-nih/_contact-sheet-virus-influenza-capsid-rna-nih.png`.

## 8. `virus-influenza-envelope-a-nih.glb`

**Verdict: CONDITIONAL**

- Taxonomy mapping: `microbiology` → low-level item "Virus", supporting piece of the primary
  3-piece candidate. Correct target.
- Scientific relevance/accuracy: shows the classic influenza envelope with dense surface spike
  proteins (hemagglutinin/neuraminidase), which is exactly the recognizable "spiky ball" imagery
  associated with flu/coronavirus media depictions. This half models roughly one hemisphere of
  the full envelope.
- Mesh/material/texture quality: single mesh, 340,474 vertices / 681,162 triangles, `POSITION`
  only (no `NORMAL`/`COLOR_0`/material — normals gap again, fixed for this review via
  `computeVertexNormals()`). The spike-protein surface detail is genuinely good — individual
  spike clusters are visible and well-formed in close-up (see `02-three-quarter-front-left.png`).
- Recognizability: strong when viewed as "half a spiky virus," but the 3/4-front-right and
  top-down angles reveal the cut interior — a hollow, oddly ridged inner surface (visible in
  `03-three-quarter-front-right.png`) that looks like the inside of a bowl rather than anything
  biological. Alone, this reads as "a torn spiky ball," which undercuts the recognition value
  unless it's always shown paired with envelope-b (and ideally with the capsid-RNA core nested
  inside, per the deconstructible-set design intent).
- Style fit: monochrome white/grey, no jarring color issues — this is actually the best style fit
  of the three influenza pieces and matches the clean-3D bar well, aside from the cut-open
  interior looking incomplete.
- Camera framing/bbox: native bbox ~[1.64, 3.28, 3.37] — consistent with being roughly half a
  sphere (flattened along one axis). Auto-fit framed all 5 angles without clipping; the interior
  cut is visible by design (it's a half-shell), not a framing bug.
- Transparency/material faults: none.
- Animation: none present. A "budding/assembly" animation showing the two halves (and the RNA
  core) coming together would fit this asset well as a future enhancement.
- Performance: 12.3 MB, within budget.
- Attribution: **required** (CC-BY 4.0). Same commissioning/attribution text as the capsid-RNA
  piece above (single shared source entry 3DPX-014934).

Screenshots: `virus-influenza-envelope-a-nih/01-front.png` … `05-low-underside.png`,
contact sheet
`virus-influenza-envelope-a-nih/_contact-sheet-virus-influenza-envelope-a-nih.png`.

## 9. `virus-influenza-envelope-b-nih.glb`

**Verdict: CONDITIONAL**

- Same profile as envelope-a (its mirror-image half from the same deconstructible set): correct
  taxonomy target, good spike-protein surface detail, monochrome style fit is good, but alone it
  reads as a torn/cut half-sphere rather than a complete virus. The cut edge and hollow interior
  are even more visible in this half (see `01-front.png` and `04-top-down-three-quarter.png`,
  where the flat rim edge of the cut is clearly visible as a thin disc lip along one side).
- Mesh/material/texture quality: single mesh, 319,402 vertices / 638,984 triangles, `POSITION`
  only (same normals gap, same fix applied for this review).
- Camera framing/bbox: native bbox ~[2.45, 3.35, 3.32], consistent with a half-sphere shell.
  Auto-fit framed correctly at all 5 angles.
- Transparency/material faults: none. Animation: none present (same "budding" opportunity noted
  under envelope-a applies here too).
- Performance: 11.5 MB, within budget.
- Attribution: **required** (CC-BY 4.0), same source entry/commissioning credit as envelope-a and
  the capsid-RNA piece.
- Recommendation (applies to both envelope halves): whichever route the integration takes, do
  not ship either half alone as a default "Virus" display — pair them (and ideally the RNA core)
  so the assembled shape reads as a complete virus, reserving the individual halves for an
  explicit "cutaway/explode" interaction with labeling.

Screenshots: `virus-influenza-envelope-b-nih/01-front.png` … `05-low-underside.png`,
contact sheet
`virus-influenza-envelope-b-nih/_contact-sheet-virus-influenza-envelope-b-nih.png`.

## 10. `virus-polio-capsid-nih.glb`

**Verdict: CONDITIONAL**

- Taxonomy mapping: `microbiology` → low-level item "Virus", marked "alternate/secondary
  candidate" in the sourcing doc. Correct target.
- Scientific relevance/accuracy: real poliovirus capsid structure (EMDB 5886), a complete
  icosahedral shell (not capsid-only-missing-parts like the T4 file, and not a cut half like the
  influenza envelope pieces) — this is a whole, self-contained capsid.
- Mesh/material/texture quality: single mesh, 652,757 vertices / 1,333,783 triangles, `POSITION`
  only (no `NORMAL`/`COLOR_0`/material — same normals gap, fixed for this review). The surface
  has convincing fine cryo-EM-derived spike/knob detail across the whole sphere, consistently
  textured from every angle with no visible seams or gaps.
- Recognizability: **the strongest "iconic virus" shape in the entire batch.** A complete,
  roughly spherical shell covered in pronounced spike protrusions, monochrome white/grey — this
  closely matches the common media/textbook depiction of "a virus" that a child is most likely to
  already have in mind. Every one of the 5 captured angles reads clearly as "a spiky virus ball"
  without needing a label to identify the general concept.
- Style fit: monochrome, clean, no color clashes — the best style match to the warm-off-white/
  clean-3D bar of any asset in this batch. Not gamey, not cluttered.
- Camera framing/bbox: native bbox ~[357.9, 372.1, 373.8] — very close to a perfect sphere;
  auto-fit framed it cleanly and fully in-frame at all 5 angles with no clipping.
- Transparency/material faults: none.
- Animation: none present; a life-cycle animation (attachment → capsid opening → RNA release)
  would suit the Microbiology branch's "Infection" process well as future work, not required now.
- Performance: **23.8 MB — 1.6× the 15MB budget.** The sidecar itself calls this a
  "remesh_clean print-oriented mesh," i.e., print-resolution rather than real-time-render
  resolution. Needs a decimation/Draco pass before shipping, same as the ribosome and Golgi
  files, but starting from much better raw material (the shape itself has no content problems).
- Attribution: `attributionRequired: false` (CC0 1.0). Recommended credit:
  `"Polio Virus Capsid", NIH 3D (3d.nih.gov, entry 3DPX-001519), by James Tyrwhitt Drake, derived
  from EMDB 5886. CC0 1.0.`
- Recommendation: **if only one virus asset can be decimated and shipped first, make it this
  one** — it has the best shape/recognizability-to-effort ratio of the four virus candidates
  reviewed (this file, T4, and the two influenza-envelope halves).

Screenshots: `virus-polio-capsid-nih/01-front.png` … `05-low-underside.png`,
contact sheet `virus-polio-capsid-nih/_contact-sheet-virus-polio-capsid-nih.png`.

---

## Cross-cutting notes

- **Normals gap:** 6 of the 10 files ship with no `NORMAL` attribute and no material
  (`bacteria-ecoli-whole-cell-nih`, `dna-b-form-double-helix-nih`, `organelle-golgi-apparatus-nih`,
  `virus-influenza-capsid-rna-nih`, `virus-influenza-envelope-a-nih`,
  `virus-influenza-envelope-b-nih`). The app's real `GLTFLoader` (confirmed by reading
  `node_modules/three/examples/jsm/loaders/GLTFLoader.js`) does not auto-compute vertex normals,
  and `GenericModel.tsx`'s `GlbModel` doesn't either — so today, without a fix, these 6 files
  would load into the real viewer completely unlit/flat. This review only produced usable
  lighting by manually calling `computeVertexNormals()` in the review's own render script. Whoever
  wires these into the real viewer needs to either pre-process normals into the `.glb` files or
  add a `computeVertexNormals()` fallback to `GlbModel`'s mesh-traversal step.
- **Saturated chain-rainbow coloring** on 3 files (`nucleosome-dna-packaging-nih`,
  `organelle-ribosome-80s-bychain-nih`, `virus-bacteriophage-t4-capsid-bychain-nih`) is the most
  consistent style-fit problem across the batch — scientifically conventional but visually at odds
  with the warm-off-white/clean-3D/not-gamey bar. A muted recolor pass (or reserving rainbow
  coloring for an optional toggle) would resolve this without touching geometry.
- **Size budget:** 3 of the 10 files exceed the 15MB guideline
  (`organelle-golgi-apparatus-nih` 28.1MB, `organelle-ribosome-80s-bychain-nih` 93.1MB,
  `virus-polio-capsid-nih` 23.8MB), and one is marginally over
  (`nucleosome-dna-packaging-nih`, ~15.77MB per the automated quality report). None of these are
  ready to ship without a decimation/Draco-compression pass, independent of their visual verdicts.
- **None of the 10 assets contain animation clips** (`animationCount: 0` across the board) — every
  one of these is a static structural model. Several would benefit from future animation (DNA
  replication, ribosome translation, nucleosome unwinding, virus budding/infection), noted per
  asset above, but static presentation is an acceptable baseline for structural/anatomical content
  consistent with how the rest of the app's authored cell assets work today.
