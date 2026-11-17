# Math Asset Sourcing — Wave 2 (Agent MATH-WAVE2)

Purpose: continue `docs/assets/math.md` (wave 1) for the Math subject's real-object manipulative
needs, scoped this time to: abacus, fraction blocks/bars, base-ten blocks, balance scale,
measuring tools (rulers, protractors, measuring cups), solids/polyhedra (cube, sphere, cone,
cylinder, pyramid, prisms), and probability objects (dice, spinners, coins). Sourcing only — no
route/component/registry wiring, matching wave 1's scope discipline.

Date: 2026-08-18.

## 0. Headline finding

Wave 1 found exactly two license-qualifying real-object candidates (a Platonic-solids set and an
abacus, both on Sketchfab) and downloaded **zero** of them, because Sketchfab gates every
download — including CC0 and CC-BY assets — behind an OAuth-authenticated account this
environment doesn't have. That auth wall is still in effect (re-verified this wave, see §3).

This wave found a second, independent no-auth-wall source that wave 1 didn't check:
**Poly Pizza (poly.pizza)**, a community archive that (a) preserves the original "Poly by
Google" CC-BY 3.0 catalogue from Google's shut-down Poly service (2021-06-30) and (b) hosts
newer creator uploads under their own stated CC0/CC-BY licenses. Every model's exact license is
shown per-listing and the actual mesh file is served as a single self-contained `.glb` from a
public CDN (`static.poly.pizza/<uuid>.glb`) with **no login, no API key, no download button
gate** — confirmed by direct `curl` (200 OK, `content-type: gltf-binary`) against multiple
assets. This resolved several of wave 1's stalled candidates (a real abacus, in particular) and
turned up new ones (ruler, kitchen scale, measuring cup, dice, coin) that wave 1's Poly
Haven-only search didn't have a source for. Poly Haven itself was re-checked and confirmed to
still have exactly one relevant asset (`measuring_tape_01`, unrelated to Poly Pizza) and nothing
else math-relevant, consistent with wave 1's framing of Poly Haven as a lab/nature source.

Also reconfirmed from wave 1, now with a second source checked: **fraction bars, base-ten
blocks, a two-pan balance scale, a probability spinner, and tangram pieces do not exist as
license-clear downloadable assets on any source checked** (Poly Haven, Poly Pizza, Sketchfab,
Smithsonian 3D, Kenney, Quaternius, generic CC0-registry GitHub repos). These remain genuine
content gaps — see §5.

One downloaded candidate (a "Protractor" by Poly by Google) **failed structural validation** —
not the container-level GLB header check, but a coordinate-sanity check that surfaced a real
defect — and was rejected after download rather than kept. Full detail in §4.

## 1. Target-to-status mapping table

| Target manipulative | Found license-clear + downloadable? | Kept this wave | Notes |
| --- | --- | --- | --- |
| Abacus | Yes (Poly Pizza, new source) | `abacus-soroban-bruno-oliveira.glb` | Resolves wave 1 gap 5b (wave 1's Sketchfab candidate stayed blocked; this is a different, independently found asset) |
| Ruler | Yes (Poly Pizza) | `ruler-poly-google.glb` | Two Poly-by-Google duplicates + one third-party duplicate rejected, see §2 |
| Protractor | Found but **structurally defective**, rejected | none | See §4 — flagged as a gap requiring either a fixed re-download or a procedural build |
| Measuring cup | Yes (Poly Pizza, CC0) | `measuring-cup-milkandbanana.glb` | One near-identical duplicate rejected |
| Measuring tape | Yes — two independent sources | `measuring-tape-01-polyhaven.glb` (kept, photoreal) | Poly Pizza's stylized "Measuring tape" icon rejected as a lower-fidelity duplicate of the same concept |
| Balance scale (two-pan/beam) | **No** — not found anywhere | none | Gap, see §5a. "Kitchen scale" and "bathroom scale" (single-platform digital scales) exist and are a different but real measuring-tool concept |
| Kitchen/weighing scale | Yes (Poly Pizza) | `kitchen-scale-poly-google.glb` | Kept as the measurement-tool "scale" concept (not a balance-beam); bathroom-scale duplicate rejected |
| Base-ten blocks | **No** — not found anywhere | none | Gap, see §5b. Every "block" search on every source returns generic building/game blocks (Minecraft-style, LEGO, crates, stone blocks), none marked or usable as place-value units/rods/flats/cubes |
| Fraction bars/blocks | **No** — not found anywhere | none | Gap, see §5c. Zero results on every source for "fraction bar[s]"/"fraction block[s]" |
| Platonic solids / solids-and-polyhedra set | **No complete license-clear set** — reconfirmed | none | Same conclusion as wave 1 §5a: individual solids exist (mostly Sketchfab, auth-walled) but no complete, consistent, non-decorative 5-solid or 6-solid set is both downloadable and license-clear. Recommendation unchanged: procedural build |
| Dice | Yes (Poly Pizza) | `dice-poly-google.glb` | Selected for clear pip legibility after thumbnail review of 8+ candidates, see §2 |
| Coin | Yes (Poly Pizza) | `coin-poly-google.glb` | Single-face-texture limitation noted in sidecar; second "Coin" result was actually a pedestal shape, rejected |
| Probability spinner (wheel) | **No** — not found anywhere | none | Gap, see §5d. Search only surfaces "fidget spinner" (wrong object) and playground/merry-go-round assets |
| Tangram | **No** — not found anywhere | none | Zero results on Poly Pizza; not separately re-checked on Sketchfab (out of this wave's auth-free scope) |

## 2. Candidate comparison table (Poly Pizza results, full search log)

Search performed via Poly Pizza's server-rendered `window.__SERVER_APP_STATE__` payload (no
API key needed for search or download) across keywords: `ruler`, `dice`, `coin`, `abacus`,
`cube`, `sphere`, `cone`, `cylinder`, `pyramid`, `scale`, `measuring`, `fraction`, `spinner`,
`polyhedron`, `block`, `domino`, `protractor`, `compass math`, `balance`, `weighing scale`,
`base ten block`, `fraction bar`, `pan balance`, `seesaw`, `number line`, `playing card`,
`geometric shapes`, `tangram` (28 searches, ~260 result rows, deduplicated).

| Candidate | Creator | License | Fit | Accept/Reject |
| --- | --- | --- | --- | --- |
| Japanese Abacus (Soroban) | Bruno Oliveira | CC-BY 3.0 | Real soroban, wooden case + bead rods, 2610 tris, sane near-origin geometry | **Accept** — downloaded |
| Ruler (`3CqPcG3ATQs`) | Poly by Google | CC-BY 3.0 | Wooden ruler, baked cm/inch tick-mark texture, legible in thumbnail | **Accept** — downloaded |
| Ruler (`1zzYwVp-KDv`) | Poly by Google | CC-BY 3.0 | Same concept/style as above | Reject — duplicate |
| Ruler | J-Toastie | CC-BY 3.0 | Same concept | Reject — duplicate (third-party) |
| Protractor | Poly by Google | CC-BY 3.0 | Looked clean in thumbnail (legible degree ticks) | **Reject after download** — failed structural coordinate check, see §4 |
| Kitchen Scale | Poly by Google | CC-BY 3.0 | Real digital kitchen scale, clear LCD/platform silhouette | **Accept** — downloaded |
| Bathroom scale | Poly by Google | CC-BY 3.0 | Real bathroom scale, same "weighing scale" concept | Reject — redundant with Kitchen Scale, less classroom-relevant |
| Measuring Cup (`q6i3XL52ge`) | MilkAndBanana | CC0 1.0 | Translucent plastic cup with red graduation-line decal | **Accept** — downloaded |
| Measuring Cup (`pV3YC6J5QC`) | MilkAndBanana | CC0 1.0 | Near-identical to above | Reject — duplicate |
| Measuring Spoon(s) (5 listings) | MilkAndBanana | CC0 1.0 | Real measuring spoons | Reject — not requested category this wave (cups only named); redundant concept to measuring cup |
| Measuring tape | Poly by Google | CC-BY 3.0 | Stylized closed-case tape measure icon, "25ft" label legible | Reject — redundant duplicate of Poly Haven's photoreal `measuring_tape_01`, lower fidelity/wrong aesthetic (flat game-icon vs. this project's clean-3D/PBR bar) |
| Dice (`dLS2cGjYw6C`) | Poly by Google | CC-BY 3.0 | White die, red pips, clean rounded geometry, pips clearly legible in thumbnail | **Accept** — downloaded |
| Dice (`c53_TngNW40`) | Poly by Google | CC-BY 3.0 | Flat cartoon-style die, black pips on white, legible but lower-fidelity | Reject — duplicate concept, dLS2cGjYw6C preferred |
| Dice (`8ZyO_fhLV3w`) | Poly by Google | CC-BY 3.0 | Red die, white pips, blurry/low-res baked texture | Reject — pip texture too blurry, fails this wave's "no unclear pip" bar |
| Dice — Jakob Hippe, AroniaStudios, Louis DeScioli, Jeremy Eyring "dice set", Jarlan Perez "Pair of Dice" | various | CC-BY 3.0 | Not individually thumbnail-reviewed once a clean winner was found | Reject — not needed once dLS2cGjYw6C accepted (quality-over-count) |
| Coin (`5dwGkhjKXIW`) | Poly by Google | CC-BY 3.0 | Gold coin, embossed "$" face, clean disc geometry | **Accept** — downloaded |
| Coin (`0QjRoZvnOKT`) | Poly by Google | CC-BY 3.0 | Thumbnail shows an octagonal flat gold pedestal/base, not a round coin | Reject — mislabeled/wrong shape for the "Coin" title |
| Coin — Quaternius (6 listings: Coin, Star Coin, Coin Piles, Skull Coin, Coin Pouch, Coin Bag) | Quaternius | CC0 1.0 | Decorative game-currency coins (piles, pouches, skull-themed) | Reject — decorative/fantasy-game skins, not a plain probability-object coin (task's explicit "decorative object with no learning value" exclusion) |
| Rubik's Cube (3 listings) | Poly by Google | CC-BY 3.0 | Real, recognizable object | Reject — not a plain geometric solid; branded puzzle toy, out of this wave's "cube/sphere/cone/cylinder/pyramid/prism" solids scope |
| Cube/Sphere/Cone/Cylinder/Pyramid (all search results) | various (Quaternius, Kenney, Poly by Google, others) | CC0/CC-BY | Every result is either a themed prop (traffic cone, ice-cream cone, propane cylinder, Egyptian/Mayan pyramid, planet sphere, Minecraft-style block) or a bare undecorated primitive | Reject — a bare primitive has zero pedagogical content a `three.js` `BoxGeometry`/`SphereGeometry`/`ConeGeometry`/`CylinderGeometry` doesn't already provide for free, and every "real-object" pyramid/cone hit is a themed prop, not a plain solid. Confirms wave 1 §5a's conclusion: procedural build is correct, not sourcing |
| Icosahedron (Ina Yosun Chang), Light Icosahedron (Quaternius) | various | CC-BY 3.0 / CC0 1.0 | Single-shape only | Reject — not a complete comparable solids set (same finding as wave 1's Sketchfab search) |
| Base-ten blocks / "block" (30 results) | Quaternius, Kenney, others | CC0/CC-BY | Stone/metal/dirt/wood/crystal/LEGO/Minecraft-style building blocks, a "?-Block" Mario reference, city blocks | Reject — none are place-value unit/rod/flat/cube manipulatives; all decorative or unrelated |
| Fraction bar/block | n/a | n/a | Zero search results on both exact-phrase queries | Reject — no candidates exist |
| Balance / pan balance / weighing scale | Bench (Zsky), Pan (MilkAndBanana, Isa Lousberg), Barbell (Zsky) | CC-BY/CC0 | None are a two-pan balance scale | Reject — no candidates exist |
| Spinner / probability spinner | Fidget Spinner, "Spinner" (industrial part), Merry-go-round, Winding Tree | CC-BY 3.0 | None are a probability spinner wheel | Reject — no candidates exist |
| Tangram | "Tak Game (5x5)" (unrelated board game), Triangle Character | CC-BY/CC0 | Neither is tangram pieces | Reject — no candidates exist |

## 3. Sketchfab re-check — auth wall still blocks every download

Re-ran wave 1's Sketchfab search across the full target list (abacus, base ten blocks, fraction
bars, balance scale, protractor, measuring cup, platonic solid, dice, coin, probability spinner)
via the public (no-auth) search API. Results largely echo wave 1 plus new hits: a **Protractor**
by Microsoft (uid `3de4bcf1dece4f348f6757e77e5c55c7`, CC-BY, 3152 faces — a "Poly by Google"
mirror) and a **D20 with Pips** (uid `cfa7be10ec8c4c2f9665c725f55e09e6`, CC-BY, habit, 20 faces).
Confirmed by direct request that the download endpoint is still gated:

```
GET https://api.sketchfab.com/v3/models/3de4bcf1dece4f348f6757e77e5c55c7/download
-> {"detail":"Authentication credentials were not provided."}
```

Same result for every other Sketchfab uid tried. No token available in this environment; not
bypassed. All Sketchfab candidates are recorded as license-qualifying-but-blocked, same as wave
1 — not downloaded, not counted as kept.

## 4. Protractor — downloaded, then rejected on structural validation

`Protractor` by Poly by Google (`https://poly.pizza/m/8I74ZUgLg5S`,
`https://static.poly.pizza/b5286228-b073-4920-87e8-3aeb2504941f.glb`, CC-BY 3.0) was downloaded
and initially looked good — clean thumbnail, legible degree-tick geometry. `validate-glb.mjs`
passed the container-level checks (magic header OK, GLB v2, declared length matches file, 42
nodes/42 meshes/163 accessors parse cleanly as valid JSON+binary chunks). But per-mesh
`POSITION` accessor `min`/`max` inspection surfaced a real defect: **all 42 sub-meshes
(`Cylinder001_1`, `Box001_1`…`Box036_1`, `Text001_1`…`Text005_1`) sit at raw vertex coordinates
between roughly 3×10⁵ and 1.06×10⁶ units from the origin**, with **no compensating node
transform** (every node in the file has an identity transform — no `translation`/`rotation`/
`scale`/`matrix` fields at all). A protractor at that raw scale/offset does not render as a
normal near-origin prop without manual repair; this is a genuine export artifact from Poly
Pizza's `obj2gltf` conversion pipeline (likely inherited from a 3ds Max scene with an
un-normalized unit/origin), not something safe to ship or hand off as "validated."

Per this wave's hard rule — structural validation must pass **before** a file is kept — the
protractor was deleted after this finding, not written to the license register. It is not
counted in "kept," and is carried forward as a gap (§5e) rather than silently shipped as
broken. No other downloaded file in this wave showed this defect (all other bounding boxes are
sane and near-origin, see each `.license.json`'s `validation.approxDimensionsUnits`).

## 5. Unresolved gaps — commissioned-model briefs

### 5a. Balance scale (two-pan/beam)

No two-pan or beam balance scale exists as a downloadable, license-clear asset on any source
checked (Poly Haven, Poly Pizza, Sketchfab-search, Smithsonian 3D, generic CC0 registries). This
is the same manipulative wave 1's own sibling `equation` component in the algebra branch
already plans as a **procedural-script build** (`ScaleControl` named node, per
`docs/assets/math.md`'s branch table) — recommend building it there rather than continuing to
search for a sourced replacement; a real photoreal balance scale would need custom rigging
(pivot, pan tilt) to be interactive anyway, which a generic download can't provide.

### 5b. Base-ten blocks

Zero qualifying candidates found across two full sourcing waves now. This is already the same
conclusion wave 1 reached (`docs/assets/math.md` branch table: "all specced as procedural-script
GLBs"; `content/subjects/math/number-and-arithmetic/place-value/model-metadata.json`, once
authored, should build unit cubes/ten-rods/hundred-flats/thousand-cubes procedurally with named
`Regroupables`/`DigitPlate_Each` nodes for the regrouping interaction) — no further sourcing
effort recommended for this manipulative; close the search line.

### 5c. Fraction bars/blocks

Same conclusion: zero candidates on any source, and the `fraction` component's
`model-metadata.json` already plans a procedural fraction pizza/bar per wave 1. No further
sourcing effort recommended.

### 5d. Probability spinner (wheel)

Zero candidates matching a probability spinner (colored-wedge wheel with a needle/arrow) on any
source checked. The `probability` component (data-and-statistics branch) already plans a
procedural spinner per `docs/assets/math.md` — this is correctly scoped as build-not-source, and
this wave's search reconfirms no shortcut exists.

### 5e. Protractor

License-clear candidates exist (this wave's Poly Pizza find, plus wave 1's still-blocked
Sketchfab finds), but the one actually downloadable copy has a structural coordinate defect (see
§4) and was not kept. Two paths forward for a future wave:

1. **Repair the existing file.** The geometry itself (tick marks, degree arc, textless "Text00N"
   label meshes) may be usable if each mesh's node is given a corrective `translation`/`scale` to
   re-center it near the origin at a sane real-world size — this is a geometry-repair task, not
   a re-download, and wasn't attempted here because it crosses from "sourcing" into "asset
   processing/authoring," which is out of this wave's scope.
2. **Procedural build**, consistent with the `angle` component's own existing `ProtractorRing`
   node pattern already noted as a design precedent in `docs/assets/math.md` §6 — this sidesteps
   the defect entirely and matches the house convention used by all 43 other authored Math
   components.

Recommend option 2 (procedural) as primary, with option 1 kept as a cheap fallback if a future
wave wants the real-object photoreal look specifically.

### 5f. Solids/polyhedra set (cube, sphere, cone, cylinder, pyramid, prisms)

Reconfirmed, not re-litigated: wave 1 §5a already concluded a procedural build is correct for
Platonic/geometric solids (exact mathematical objects, need labeled face/edge/vertex counts and
a shared compare-tray scale, which no generic downloaded primitive provides). This wave's
broader search (Poly Haven + Poly Pizza, in addition to wave 1's Sketchfab search) turned up
only themed props (traffic cones, ice-cream cones, Egyptian/Mayan pyramids, planet spheres) or
single incomplete shapes (a lone icosahedron) — nothing that changes that recommendation.

### 5g. Tangram

Not in wave 1's scope; zero candidates found this wave on Poly Pizza. Not re-checked on
Sketchfab (would be subject to the same auth wall as every other Sketchfab candidate in this
wave). Flagging only — no taxonomy entry exists for tangram either, so like wave 1's
Platonic-solids finding, this may not be a real content gap yet, just an unauthored concept.

## 6. Duplicate/reuse check

No overlap with anatomy, space, chemistry, biology/cells, or nature directories (none opened).
No overlap with wave 1's `public/models/sourced/math/` directory, which is empty (wave 1
downloaded nothing). This wave's files live in a new sibling directory,
`public/models/sourced/math-wave2/`, keeping the two waves' provenance separate and auditable.
Within this wave, duplicate/near-duplicate candidates (second rulers, second measuring cups,
second dice, bathroom-vs-kitchen scale, Poly-by-Google's stylized measuring tape vs. Poly
Haven's photoreal one) were identified and rejected per §2 rather than downloaded — quality/
non-redundancy over count, per this wave's instructions.

## 7. Files written

`public/models/sourced/math-wave2/`:

- `abacus-soroban-bruno-oliveira.glb` + `.license.json`
- `ruler-poly-google.glb` + `.license.json`
- `kitchen-scale-poly-google.glb` + `.license.json`
- `measuring-cup-milkandbanana.glb` + `.license.json`
- `dice-poly-google.glb` + `.license.json`
- `coin-poly-google.glb` + `.license.json`
- `measuring-tape-01-polyhaven.glb` + `.license.json`
- `gltf-to-glb.mjs` — copy of the existing in-house glTF→GLB packer (used once, for the Poly
  Haven measuring tape's separate gltf+bin+textures export)
- `validate-glb.mjs` — copy of the existing standalone GLB structural validator (magic header,
  chunk parse, sha256, per-mesh bounding box) used to produce every `validation` block above and
  to catch the protractor defect in §4
- `source-polyhaven-measuring-tape/` — the original separate glTF+bin+3 JPG textures for
  `measuring-tape-01-polyhaven.glb`, kept for reproducibility (matches the existing
  `chemistry-reactions/` convention of keeping pre-pack sources alongside the packed `.glb`)

**Every kept asset is marked `"reviewStatus": "render-review-pending"` in its sidecar** — none
has been opened in a 3D viewer or screenshotted yet, only structurally validated
(`validate-glb.mjs`) and thumbnail-reviewed pre-download. None should be treated as visually
approved or wired into any route/component until a render review happens.

**No row was added to `docs/ASSET-LICENSES.md`** — per that file's own rule ("a row is added
here only when a candidate is imported"), and per this wave's read-only-to-the-rest-of-the-repo
restriction. A future integration wave should add rows there (and to
`content/subjects/math/measurement/**`'s not-yet-authored `model-metadata.json` files) when/if
these assets are actually wired into a component.

---

COMPONENTS_TARGETED: abacus, fraction blocks/bars, base-ten blocks, balance scale, rulers,
protractors, measuring cups, solids/polyhedra (cube/sphere/cone/cylinder/pyramid/prism), dice,
spinners, coins (11 manipulative categories)
CANDIDATES_EVALUATED: ~45 individually reviewed (thumbnail and/or license/metadata), ~260 raw
search rows deduplicated down to that set
KEPT: 7 (abacus, ruler, kitchen scale, measuring cup, dice, coin, measuring tape)
REJECTED: ~38, spanning license (CC-BY-SA, Sketchfab "Free Standard"), auth-wall (Sketchfab,
all candidates), duplicate/redundant concept, decorative/no-learning-value (fantasy coins,
branded Rubik's cube, themed cones/pyramids), wrong-shape-for-title (pedestal mislabeled
"Coin"), blurry pip texture (one dice candidate), and one post-download structural-validation
failure (protractor, see §4)
UNRESOLVED_GAPS: 7 — balance scale (5a), base-ten blocks (5b), fraction bars (5c), probability
spinner (5d), protractor (5e, license-clear candidate exists but failed validation), complete
solids/polyhedra set (5f, reconfirms wave 1), tangram (5g)
NEW_SOURCE_DISCOVERED: Poly Pizza (poly.pizza) — no-auth-wall CC0/CC-BY archive, resolves the
Sketchfab auth-wall problem for a meaningful subset of candidates; recommend checking it first
in future waves, before Sketchfab
DUPLICATE_OR_REUSE_FINDINGS: none against other subjects; several within-wave duplicates
identified and rejected (see §2, §6); wave 1's `public/models/sourced/math/` directory
untouched (still empty)
NEXT_INTEGRATION_BATCH: (1) render-review all 7 kept assets and flip `reviewStatus` from
render-review-pending to an actual PASS/CONDITIONAL/REJECT per file; (2) author the Measurement
branch's content (`module.json`/`lesson.md`/`quiz.json`/`model-metadata.json`) so the ruler,
kitchen scale, measuring cup, and measuring tape have a component to attach to; (3) author the
Number & Arithmetic branch's Abacus component and decide between this wave's static-reference
soroban vs. a future interactive procedural bead-slide build; (4) build the procedural balance
scale, spinner, base-ten blocks, fraction bars, and Platonic-solids set already recommended by
this wave and wave 1 — no further sourcing effort needed for those five; (5) either repair or
procedurally replace the protractor per §5e.
