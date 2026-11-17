# Math Asset Sourcing — Wave 1 (Agent MATH)

Purpose: audit the Math subject's manipulative/real-object asset needs against
`content/taxonomy/math.json` and the authored `content/subjects/math/**` components, and source
license-clear GLBs where a real manipulative would beat a procedural primitive.

Date: 2026-08-18.

## 0. Headline finding

Every one of the 43 already-authored Math components (5 `"detailed": true` branches:
number-and-arithmetic, fractions-and-ratios, algebra, geometry, data-and-statistics) already
ships a `model-metadata.json` with `modelType: "procedural-three"` and a full custom
`assetBrief` (named nodes, sliders, hotspots, exact geometry) — the same house pattern as
`scripts/assets/build-atom-glb.mjs` / `build-cell-glbs.mjs`. **This is the correct call, not a
gap.** Base-ten blocks (`place-value`), a fraction pizza (`fraction`), bead ratios (`ratio`), a
balance scale (`equation`), a dot array (`multiplication`), a protractor ring (`angle`), a
spinner (`probability`), a unit-cube box (`volume`) etc. are all specced as bespoke
script-generated GLBs with interaction-specific named nodes (`Regroupables`, `DigitPlate_Each`,
`ScaleControl`, `SolveSteps`…) that no generic downloaded manipulative could satisfy — sourcing
an external model for any of these 43 would violate "never reuse a flagship model as unrelated
content" in spirit (the interaction contract is bespoke to the app, not a generic mesh). None of
the 43 GLBs exist on disk yet (`public/assets/models/math/` does not exist) — that's a
content-build-script task for a future wave, not an asset-sourcing task for this one.

This wave's real job was narrower: find the handful of items the taxonomy/catalogue name that
are **not yet covered** by any authored component (Platonic solids, Abacus, Measurement-branch
tools), and source real GLBs for those if a license-clear, actually-downloadable candidate
exists. Short version: it mostly doesn't — see §2 and §5.

## 1. Branch/component mapping table

| Branch | Detailed? | Components authored | Asset need | Status |
| --- | --- | --- | --- | --- |
| number-and-arithmetic | yes | 10/10 (`number-line`, `place-value`, `addition`, `subtraction`, `multiplication`, `division`, `factors`, `multiples`, `prime-number`, `negative-number`) | Place-value blocks, array multiplication — all specced as procedural-script GLBs | procedural-is-fine (already planned) |
| fractions-and-ratios | yes | 8/8 (`fraction`, `numerator`, `denominator`, `equivalent-fraction`, `decimal`, `percent`, `ratio`, `proportion`) | Fraction pizza, bead-ratio tray, percent grid — all specced as procedural-script GLBs | procedural-is-fine (already planned) |
| algebra | yes | 10/10 (`variable`, `expression`, `equation`, `term`, `coefficient`, `constant`, `like-terms`, `inequality`, `slope`, `intercept`) | Balance scale (in `equation`), expression builder — procedural-script | procedural-is-fine (already planned) |
| geometry | yes | 11/11 (`point`, `line`, `ray`, `segment`, `angle`, `triangle`, `quadrilateral`, `circle`, `area`, `perimeter`, `volume`) | Shape builder, angle/protractor, unit-cube volume box — procedural-script | procedural-is-fine (already planned) |
| geometry — **Platonic/geometric solids** | n/a | **not in taxonomy `lowLevelItems`, no authored component** | A compare-the-5-solids manipulative (explicitly named in this wave's scope brief) | **gap — see §5a** |
| data-and-statistics | yes | 10/10 (`data-point`, `table`, `bar-chart`, `line-graph`, `mean`, `median`, `mode`, `range`, `outlier`, `probability`) | Spinner/probability, dataset/chart — procedural-script (abstract data viz correctly kept procedural) | procedural-is-fine (already planned) |
| number-and-arithmetic — **Abacus** | n/a | **not in taxonomy `lowLevelItems`, no authored component**, but named in `docs/ASSET-LICENSES.md`'s CC BY import order and `docs/supplier/stem-os-asset-catalogue.md` (AST-0003, `math/number-and-arithmetic/abacus`) | Countable-bead manipulative | **gap — see §5b** |
| measurement | no (`detailed: false`) | 0 | Ruler, protractor, scale/balance, tape measure — the exact "measuring tools" this wave's scope names | **gap — content not sourced yet, flagging only, see §5c** |
| graphs-and-functions | no | 0 | Coordinate plane / function graphing | procedural-only per spec (MATH-002 Coordinate Plane Engine, no GLB) — no manipulative need identified |
| trigonometry-foundations | no | 0 | Unit circle / triangle ratios | procedural-only expected — no manipulative need identified |
| calculus-foundations | no | 0 | Tangent-line / area-under-curve sliders | procedural-only per spec (MATH-001/003, no GLB) — no manipulative need identified |

## 2. Candidate comparison table

Every candidate actually evaluated this wave (source checked directly via API/page, not trusted
from a listing):

| Source | Candidate | License (verified) | Downloadable? | Fit | Accept/Reject |
| --- | --- | --- | --- | --- | --- |
| Poly Haven API (`api.polyhaven.com/assets?t=models`) | keyword scan for `ruler`, `protractor`, `scale`, `cube`, `abacus`, `dice`, `block`, `sphere`, `solid`, `tile` | n/a | n/a | 0 matches — Poly Haven has no math-manipulative models (confirms `docs/ASSET-LICENSES.md`'s framing of Poly Haven as lab-glass/plants/textures, not math) | **Reject — no candidates exist** |
| Sketchfab (`api.sketchfab.com/v3/models/c6fa900…`) | "Platonic Solids" by gmachnik | CC Attribution (verified via API `license.label`) | `isDownloadable: true` per API flag, 9,720 faces | Full 5-solid set, reasonable poly budget | **Reject — auth-gated (see §3)** |
| Sketchfab (`…7164816e…`) | "Platonic Solids" by dudecon | CC Attribution | `isDownloadable: true`, but only 80 faces / 50 verts total | Too crude for a 5-solid inspectable set (≈10 faces per solid) | **Reject — auth-gated + under-detailed** |
| Sketchfab (`…8d14acc0…`) | "Smooth Platonic Solids" by Ayman.Ibrahim | CC Attribution | `isDownloadable: true`, 450,730 faces | Rounded/subdivided solids contradict the point of a Platonic-solid set (flat exact faces); also ~30x over the 15MB/mobile budget | **Reject — auth-gated + wrong geometry + oversized** |
| Sketchfab (`…4fcfa8c0…`) | "Octahedron" by chandlerklebs | CC Attribution | `isDownloadable: true`, 8 faces | Single shape only, not a comparable set | **Reject — auth-gated + incomplete set** |
| Sketchfab (`…faf7e2cf…`) | "Abacus" by pamruta | CC Attribution | `isDownloadable: true`, 77,848 faces | Best license-qualifying Abacus candidate found | **Reject — auth-gated only** (would otherwise accept) |
| Sketchfab (`…5a3bb4c7…`) | "Abacus Model" by sherwin_leehao | CC Attribution-ShareAlike | `isDownloadable: true` | ShareAlike is outside the allowed license set (CC0/CC-BY only per this wave's policy) | **Reject — license (SA) not permitted** |
| Sketchfab (`…1b9cdd59…`) | "Retro soroban — Japanese abacus" by shizuniik | "Free Standard" (Sketchfab Standard license) | listed, but Standard ≠ redistribution license | Not a CC0/CC-BY grant | **Reject — license does not permit redistribution** |
| Sketchfab (`…a19ebc67…`) | "Classroom" by jaromir.ternavskiy | CC Attribution | `isDownloadable: true` | A furnished classroom scene, not a manipulative; surfaced only because it matched an "abacus" search | **Reject — not relevant to any component** |
| Kenney.nl | "Prototype Kit" (`kenney_prototype-kit.zip`, downloaded and inspected, no auth wall) | CC0 1.0 | Yes — direct zip, no login | Inspected contents (FBX): columns, doors, floors, crates, animal/character figurines, generic game-blockout props. **No Platonic solids, no math manipulatives**, and the aesthetic (flat-color low-poly blockout kit) is exactly the "gamey"/"toy-like" look this project's quality bar rejects | **Reject — wrong content and wrong aesthetic, despite clean CC0 + no-auth download** |
| Khronos glTF-Sample-Assets | (considered, not individually fetched) | sample/validation license | n/a | `docs/ASSET-LICENSES.md` "Known traps" and this wave's brief both flag Khronos samples as "licensed demonstration, not curriculum content" | **Reject per existing policy — not evaluated further** |
| GeoGebra / Desmos / oPhysics / Physics Aviary / Wolfram Demonstrations | (considered per "Known traps" instruction) | paid / NC-only | n/a | These are interactive web tools, not GLB repositories, and are already blacklisted in `docs/ASSET-LICENSES.md` | **Reject — confirmed out of scope, no asset attempt made** |

## 3. Why nothing was downloaded — the Sketchfab auth wall

Every Sketchfab candidate above passes the license bar (CC0/CC-BY) and shows `isDownloadable:
true` in the public search/model API (`api.sketchfab.com/v3/models/{uid}`), which requires no
authentication. But the actual file-transfer endpoint —
`api.sketchfab.com/v3/models/{uid}/download` — returned:

```json
{"detail":"Authentication credentials were not provided."}
```

Sketchfab now gates **all** downloads, including CC0 and CC-BY models, behind an OAuth bearer
token tied to a logged-in account (the account is needed to record license acceptance). This
repo/session has no Sketchfab API token, and the task's rules explicitly forbid bypassing auth
gates or using unauthorized mirrors. So every otherwise-qualifying Sketchfab candidate is
recorded here with full provenance (source URL, creator, license, face count) but **not
downloaded**. A future pass with a human-held Sketchfab account (free tier is enough) can
complete the download of the two best candidates:

- Platonic Solids — https://sketchfab.com/3d-models/platonic-solids-c6fa90072b7f46ddb3fb50cb33992c65 (gmachnik, CC-BY, 9,720 faces)
- Abacus — https://sketchfab.com/3d-models/abacus-faf7e2cf754544328730f6a43aab002e (pamruta, CC-BY, 77,848 faces)

Once downloaded, they must still go through this wave's validation script (GLB magic-header
check, chunk parse, sha256, license sidecar JSON) before counting as sourced — that has not
happened yet for either.

## 4. Downloaded-file list

**None.** `public/models/sourced/math/` was created per this wave's ownership but contains zero
files: Poly Haven had no matching assets, every license-clear Sketchfab candidate is blocked by
the account-auth requirement above, and the one asset that was actually downloadable without
auth (Kenney's CC0 Prototype Kit) was rejected on content/aesthetic fit after inspection (see
§2) and deleted, not kept on disk.

## 5. Unresolved gaps — commissioned-model briefs

### 5a. Platonic / geometric solids (Geometry branch)

Not currently in `content/taxonomy/math.json`'s geometry `lowLevelItems` — this wave's scope
brief names it explicitly, but the taxonomy has no `platonic-solids` or `3d-solids` component id
yet, so this is a **future content addition**, not an existing-component gap.

- **If added:** recommend a procedural-script build (same pattern as `place-value`/`volume`/
  `angle`), not a sourced GLB — Platonic solids are exact mathematical objects (regular
  polyhedra), so hand-authored geometry is both cheaper and more scientifically correct than any
  downloaded mesh, and it gets the named-node/hotspot/compare-tray control the app needs for
  free.
- **Geometry brief:** 5 solids on a shared tray/shelf — tetrahedron (4 faces), cube (6),
  octahedron (8), dodecahedron (12), icosahedron (20) — each a flat-faced regular polyhedron
  (not smoothed/subdivided), edge length normalized so they read as comparable, warm-paper
  material per the Math palette (matches `volume`/`angle` `materialNotes`), a face/edge/vertex
  counter label per solid, and a "spin/compare" interaction consistent with the geometry
  branch's existing `angle`/`volume` camera and hotspot conventions. Budget 1-3k triangles per
  solid (5-15k total) — far lighter than any of the Sketchfab candidates in §2.
- **Reference imagery:** the rejected Sketchfab "Platonic Solids" by gmachnik (§2) is a
  reasonable visual reference for proportion/arrangement even though it can't be imported
  directly.

### 5b. Abacus (Number & Arithmetic branch)

Named in `docs/ASSET-LICENSES.md`'s CC BY import order (Heart → Lungs → Brain → Cell → DNA →
**Abacus**) and `docs/supplier/stem-os-asset-catalogue.md` (AST-0003, target path
`math/number-and-arithmetic/abacus`), but **no content exists yet** — no
`module.json`/`lesson.md`/`quiz.json`/`model-metadata.json`, and it isn't in the taxonomy's
`lowLevelItems` for number-and-arithmetic either. This is a genuine content-authoring gap, not
just an asset gap.

- **Two viable asset paths once content is authored:**
  1. **Procedural-script build (recommended, consistent with the other 10 sibling
     components):** a frame with 10 wires/rods, each holding movable beads (upper deck 1 bead =
     5, lower deck 4 beads = 1, standard soroban layout, or a simple 10-bead-per-rod school
     abacus if targeting younger learners), beads slide on tap/drag, a running total readout
     ties back to `place-value`. Budget 6-10k triangles, named nodes per rod (`Rod_1..Rod_10`,
     `Bead_*`) so hotspots can bind to place values.
  2. **Sourced GLB:** pamruta's Sketchfab "Abacus" (CC-BY, §2/§3) is the only license-qualifying
     real-object candidate found. It is blocked by the Sketchfab auth wall today — flag for
     manual authenticated download in a future wave, then re-run this wave's validation script
     before it counts as sourced. Given it wasn't built with this app's hotspot/interaction
     contract in mind, expect to still need it re-rigged or treated as a static reference
     model (isolate/rotate only, no bead-drag interaction) rather than a drop-in replacement
     for path 1.

### 5c. Measurement branch (ruler / protractor / scale / tape measure)

`content/taxonomy/math.json` marks `measurement` `"detailed": false` — no `lowLevelItems`, no
authored components. Per this wave's instructions, flagging the gap without inventing content:
the branch needs an SME-sourced breakdown (which measurement structures/skills belong here) from
the taxonomy/content side before an agent can safely author facts or asset briefs for it. Once
authored, ruler/protractor/scale are simple, well-defined real objects — expect them to be easy
procedural-script builds (flat ruler with tick marks and a slide-to-measure interaction,
protractor arc reusing the `angle` component's existing `ProtractorRing` node pattern, a
balance/spring scale with a moving needle) — no external sourcing should be needed once content
exists. No asset action taken this wave beyond this flag.

## 6. Duplicate/reuse check

No overlap found with anatomy (`brain`/`eyeball`/`heart`/`intestine`/`kidneys`/`liver`/`lungs`/
`pancreas`/`skin`.glb — untouched, never opened), space, chemistry, biology/cells, or nature
directories. The `angle` component's own `assetBrief` already plans a "protractor ring" layer
internal to that component — noted in §5c so a future Measurement-branch ruler/protractor
component doesn't duplicate that geometry, just the standalone-tool framing.

---

COMPONENTS_AUDITED: 45
QUALIFYING_CANDIDATES: 2
GLBS_DOWNLOADED: 0
REJECTED_CANDIDATES: 9
UNRESOLVED_GAPS: 3
DUPLICATE_OR_REUSE_FINDINGS: none (anatomy set untouched; `angle` component's internal protractor-ring layer noted as a design precedent for a future Measurement-branch protractor, not a conflict)
NEXT_INTEGRATION_BATCH: (1) write/run the procedural build scripts for the 43 already-specced math `model-metadata.json` assetBriefs (biggest unblocked win, no sourcing needed — content team already wrote the briefs); (2) get a Sketchfab account token and complete authenticated download + validation of pamruta's CC-BY Abacus (best real-object candidate) as a reference/compare asset; (3) commission the 5-solid Platonic-solids procedural build per §5a once/if it's added to the geometry taxonomy; (4) route Measurement-branch (ruler/protractor/scale) back to content/taxonomy authoring — no asset work is unblocked there yet.
