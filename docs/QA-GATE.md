# Quantaora QA Gate — 3D Model / Component Quality Checklist

Enforceable visual, hotspot, and model-quality bar for one 3D learning component, aligned to
spec `§3`, `§12`, `§13`, `§21` and the Anatomy Atelier reference
(`assets/reference/anatomy-atelier/`). Used by content agents during authoring **and** by an
automated fixture after assets are written. Applies to every viewer: OrganViewer, CellViewer,
StarViewer, GalaxyViewer, MoleculeViewer, PlanetViewer/OrbitSandbox, and equivalents.

Two lanes, because two teams author two halves of a component:

- **Content-authored** — what lives in `model-metadata.json` (positions, hotspots, palette,
  layers, compare). Fixed in the authored file, then consumed by code.
- **Code-rendered** — what the viewer/Mesh/Model component does with that data (framing,
  normalizing, dimming, clipping, alignment, palette). Fixed in `.../explorer/*.tsx`, applied
  to every component that uses that viewer.

A component **does not pass** until its content file **and** its rendered result both hold.
The fixture mirrors both halves.

---

## 1. Reference rules (from the code + spec)

The current code already enforces most of the bar — the gate records and automates it so regressions
can't silently reappear:

| Concern | Where it lives now | Mechanism |
| --- | --- | --- |
| Normalization | `OrganModel.tsx:91`, `CellModel.tsx:239`, `StarModel.tsx:370` | Scale mesh into `FIT_SIZE`/`CELL_FIT_SIZE` cube, recenter via Box3 |
| Auto-rotate | every `*Model`, e.g. `StarModel.tsx:720` | ONE rotating `<group>`, markers are children so pins stay welded |
| Hotspot pin | `OrganModel.tsx:30` (`distanceFactor=7`), `CellModel.tsx:170` (`4`) | `<Html center>` — must NOT double-translate (the fixed 22px bug) |
| Isolate/dim | `OrganModel.tsx:156-159`, `CellModel.tsx:318-321` | lerp opacity to ~0.32 when another hotspot active |
| Cross-section | `OrganModel.tsx:83` clip-plane | only rendered where `onToggleCrossSection` wired |
| Compare | `CompareModal.tsx:27` | reads `compareCandidate` + `compareReason` from `ComponentContent` |
| Palette | `MoleculeViewer.tsx:63` (`#faf8f4`), organ clay `#e8cdb6` | warm off-white canvas, subject accents |

**Known divergence the gate must catch:** viewport backgrounds are not uniform. Galaxy
(`GalaxyViewer.tsx:39` `#05070f`) and Star are near-black deep-space; Biology/Chemistry use warm
off-white. Decide per-subject and **record the choice** — mixed tones inside one lab are the
visual-quality regression this gate exists to flag.

**Known patch to preserve:** the 22px hotspot misalignment was fixed by removing the duplicate
`-translate-x/y-1/2` on markers rendered with drei `<Html center>` (see
`StarModel.tsx:137-140`, `CellModel.tsx:177-179`). Any marker that re-adds that translate
reintroduces the bug — an automated check must detect it by comparing marker HTML transform against
an expected neutral class set.

---

## 2. Checklist — Content-authored items (validated against `model-metadata.json`)

| # | Item | Ascertain ("pass" looks like) |
| --- | --- | --- |
| C1 | `cameraDefault.position` + `target` frame the largest axis at ~65-70% viewport height | ranges reflect model radius; target ≈ center (0, roughly 0, 0) |
| C2 | `crossSectionAvailable` present | `true` only when clip-plane data/geometry supports a clean cut |
| C3 | `layers[]` each has `id`, `label`, `submesh`, `defaultVisible` | every default-hidden layer has a `whyHidden`/reason |
| C4 | `layers` reference real named glTF sub-mesh nodes | each `submesh` found in the model |
| C5 | `hotspots[]` every entry has `id`, `label`, `conceptId`, `position`, `description` | non-empty; `conceptId` resolves in the taxonomy graph |
| C6 | Hotspot `conceptId` maps to a Component-Level learning item | each resolves to `System/Group → Component → Micro-skill` chain |
| C7 | `positionSource` final | not `"estimated-pending-glb-export"`; positions reconciled to real anchors |
| C8 | Hotspot count is sparse (2-10, spec's low-clutter rule) | not clustered/overcrowded |
| C9 | `compareCandidate` non-empty AND resolvable id in the same subject | plus `compareReason` 1-3 sentence teaching why the pair is meaningful |
| C10 | `compareReason` present whenever `compareCandidate` is set | they are a pair; never one sans the other |
| C11 | Authentic-set palette matches subject accents | e.g. biology → coral/leaf-green on warm paper; no rainbow diagram coloring |
| C12 | `materialBudget` respects studio material limits (≤4-5) | `materialsUsed ≤ maxMaterials`, shared shader family |
| C13 | NO procedural/clutter overrides | no "glow", "halo ring", "neon", "grid floor", "ground plane" flags left on |
| C14 | `thumbnailUrl` exists for the component | resolves to a real thumbnail path |

### Code-rendered items

| # | Item | Ascertain ("pass" looks like) |
| --- | --- | --- |
| R1 | Model normalized + centered to the core `FIT_SIZE` cube | Box3 size ≈ fit in every viewer; identity framing |
| R2 | Auto-rotate default mirrors `autoRotateDefault` | toggle present; default matches metadata |
| R3 | Hotspot markers remain pinned while rotating | markers are children of the rotating group (not detached) |
| R4 | Markers must NOT double-shift 22px | `<Html center>` wrapper + no manual `translate` on the pin button |
| R5 | Isolate dims non-selected objects | selected hotspot ↔ dim ~0.32, others lerp back up |
| R6 | Cross-section clip plane only injected when `crossSectionAvailable` | `Section` tool button absent when data absent |
| R7 | Canvas background is the decided subject tone (off-white or space-dark) | consistent within a lab |
| R8 | Zoom/pan/fov permit full inspection | min/max distances open; no hard-clip at fit |
| R9 | Layers toggle drives a real submesh visibility | toggling hides/shows the authored mesh |
| R10 | Compare button reveals `CompareModal` only when candidate+reason exist | else greyed/absent |

---

## 3. Automated fixture — assertions

Turn the checklist into a fixture readable as real assertions in a test-runner. Ship as a
`runQAGate(component)` hook. Intended assertion points:

```ts
// CONTENT half — run against model-metadata.json
1  assert(metadata.cameraState?.position && cameraState.target, 'C1 camera framing defined')
2  assert(metadata.modelType, 'persisted modelType is present')          // C0 — see n-takeable
3  assert(metadata.hotspots.length >= 2, 'minimum meaningful hotspots')
4  assert(metadata.hotspots.every(h => h.conceptId), 'every hotspot has conceptId')
5  assert(metadata.hotspots.every(h => h.positionSource !== ''), 'positions reconciled')  // C7
6  assert(metadata.compareCandidate && metadata.compareReason)            // C9, C10
7  assert(metadata.layers.every(l => l.submesh), 'layer submesh names')
8  assert(metadata.materialBudget.maxMaterials >= metadata.materialBudget.materialsUsed)

// RENDERED half (against the viewer/model id) — the numeric gate
9  const pos = metadata.hotspots.map(h => h.position.filter(Boolean))
10 assert(isFitNormalized(metadata), 'Box3 within FIT_SIZE, centered')
11 for pairwise hotspots a,b: assert(dist(a,b) >= MIN_HOTSPOT_GPX, `no overlap ≤ ${MIN_HOTSPOT_GPX}u`)
12 assert(hotspotMarxkerPattern(renderer) sniff === 'neutral-center', 'no 22px double translate')
13 assert(toggles.match(toolsUsed), 'autoRotate/reorder matches modelCapabilities')
14 if (!layerSubmeshAllReal) fail('layer toggle authoring')               // C7b

```

Key constant — set once: `MIN_HOTSPOT_GPX` (minimum pairwise hotspot gap in normalized units).
From the code, FIT_SIZE (organ/star) is 3.8, mantelpiece ~radius 1; recommend **0.55 units**
(≈15% of the fit cube edge — comfortable pin separation). Also add an optional **projected
screen-space** check for overlap tolerance against the default camera: two pins that resolve
under ~12 px apart in silhouette under `cameraState` fail regardless of world distance (this
catches depth-collapsed markers).

Validation types reasserted at compile time — flag any of:
- `modelType` missing on a component that must branch (eat cells/stars) — the `CellModel` defaults
  to 'procedural'; a 'glb' component silently degrading to procedural is the #1 silent regression
  this gate is built to catch (Q `modelType` cheap trap).
- `compareCandidate === ''` or `compareReason === ''`.
- a component declared `compareCandidate: 'X'` where X has no reciprocal — fails symmetric-pair check.

---

## 4. Scoring rubric (0-3)

Evaluate every item in §2. Scoring:

- **3 — Fully pass** · matches the bar, authored and rendered, no doubt.
- **2 — Pass with note** · acceptable; a minor future polish is recorded (e.g. one hotspot
  density high, camera slightly tight).
- **1 — Partial / degraded** · works but violates a rule (e.g. `positionSource: 'estimated…'`,
  compareReason empty-but-error-free).
- **0 — Fail / block** · missing, wrong, silhouette regressive (markers overlap, modelType
  missing/mismatched, compare Candidate empty, clamp to default).

**Gate = P(n)**: a component `PASS`es the gate only if:

- every item in scope ≥ 2, and
- no item scores 0 (any 0 blocks the component), and
- C5/C9/R4 (conceptId, compare pair, marker misalignment) are **never 0 allowed** — they are
  hard gates.

A **tail**: result records `{componentId, total, perItem, blockedBy:[0-scores]}` so the agent or
fixture can list exactly what to fix and where.

### Using it with your agent

For each component whose content to author or recheck:

1. Open `model-metadata.json` for that component and run the content half (§2, C1-C14) row by row.
2. With the component open in the 3D lab, run the rendered half (R1-R10):
   - rotate — all markers stay pinned to features, no 22px jump.
   - select each ·other hotspot → non-selected features dim and lerp back up.
   - if `crossSectionAvailable`, toggle the Section plane; if not, confirm the Section tool is absent.
   - enter Compare — only if candidate pair present; verify the `compareReason` reads intentional.
   - confirm background is the decided palette (off-white biology / dark space).
3. Score each rule 0-3; if any 0 → fix the cause (metadata or viewer code) → re-run the gate
   fixture before submitting.

---

## 5. Summary

- **Categories:** content-authored (camera, layers, hotspot→conceptId, reconciled positions,
  compare pair+reason, materials/palette, no clutter, thumbnail) vs code-rendered (normalize/
  frame, auto-rotate, marker/pin, isolate-dim, clip-plane, background palette, layer toggling,
  compare availability).
- **Fixture asserts:** `modelType` present; `compareCandidate`/`compareReason` non-empty and
  symmetric (bidirectional); every hotspot has `conceptId` + reconciled position; pairwise
  hotspot distance ≥ `MIN_HOTSPOT_GPX` (=0.55u) in normalized space; marker uses neutral-center
  (no duplicated 22px translate); layer sub-mesh exists; camera ranges; optional projected
  screen-space ≥12px separation.
- **Rubric:** 0-3 per item (3 full pass, 2 pass w/ note, 1 below, 0 block). Gate passes only when
  every item ≥2, no item = 0, and the three hard-gates (C5 conceptId, C9/C10 compare symmetries,
  R4 marker alignment) are never 0. Output a rescue map of any 0-scorers.