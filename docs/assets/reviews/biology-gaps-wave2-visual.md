# Biology Gaps Wave 2 — Visual Acceptance Review

Date: 2026-08-18
Reviewer: Quantaora Visual Reviewer (read-only QA agent, Wave 6)
Scope: `public/models/sourced/biology-gaps-wave2/` — 2 GLBs

Method: served `public/` locally via `python3 -m http.server`, rendered each GLB with Google
`<model-viewer>` (CDN, camera-controls, no auto-rotate, neutral environment, off-white
background) at 6 fixed `camera-orbit` angles per model via a throwaway Playwright script, saved
PNGs, then visually inspected every screenshot with the Read tool. No product source was
modified; only screenshots and this report were written.

Note: `docs/assets/biology-gaps-wave2.md` referenced in the task brief does not exist in this
repo checkout. Context below is instead drawn from the `.license.json` sidecars shipped
alongside each GLB in `public/models/sourced/biology-gaps-wave2/`, which contain detailed
sourcing, component-mapping, and validation notes.

---

## 1. `virus-influenza-whole-nih.glb`

**Verdict: PASS**

**Path:** `public/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb`

**Evidence screenshots** (`review-screenshots/asset-acceptance-2026-08-18-wave6/biology-gaps/virus-influenza-whole-nih/`):
- `front-0-75-105.png`
- `side-90-75-105.png`
- `back-180-60-120.png`
- `topdown-0-20-130.png`
- `quarter-45-80-100.png`
- `other-side-270-75-105.png`

**Likely component mapping:** Per the sidecar `.license.json`, this is the primary candidate for
`biology > microbiology > Virus` (low-level item), specifically the influenza-specific display —
a replacement for an earlier 3-piece deconstructible set that was previously REJECTed/marked
CONDITIONAL. Sourced from NIH 3D entry 3DPX-000030 (EM data by Bernard Heymann/NCI, segmented by
Darrell Hurt/NIAID), CC0.

**Scientific-accuracy judgment (primary bar):** PASS, and a strong one. Across all six angles the
model reads unambiguously as an influenza virion, not a generic spiky-ball virus: a roughly
spherical envelope densely covered in two visually distinct surface glycoprotein populations —
a much more numerous blue population (hemagglutinin) and a sparser, clustered red population
(neuraminidase) that appears in irregular patches rather than being evenly interspersed. This
patchy/clustered distribution of the minority (red) spike type against the dense majority (blue)
spike population is a real, recognizable feature of authentic influenza EM-derived surface
renders and is clearly visible in `front-0-75-105.png`, `side-90-75-105.png`, and
`other-side-270-75-105.png`. A yellow membrane layer is faintly visible through gaps between
spikes at the top-down/glancing angles (`topdown-0-20-130.png`), consistent with the license
file's stated coloring scheme (blue = hemagglutinin, red = neuraminidase, yellow = membrane).
This is not a coronavirus-style single-spike-type look, not a bacteriophage silhouette, and not
an abstract "germ" blob — it correctly shows two differentiated surface protein types at
plausible relative density and distribution. Does not need to be rejected.

**Performance/framing notes:** Model is well-centered and consistently framed at every tested
orbit angle (0°, 45°, 90°, 180°, 270° azimuth; 20°–80° elevation); no clipping against the canvas
edge at any angle, comfortable margin on all sides. Shading renders correctly (proper lit/shaded
spike geometry, not flat or black) despite the sidecar noting the GLB has no NORMAL accessor —
model-viewer/three.js evidently computes usable normals automatically, so this did not manifest
as a rendering problem in this harness. No visible texture/material artifacts; vertex-color-only
shading reads cleanly.

**Integration safety note:** The sidecar itself flags "no NORMAL accessor... needs
`computeVertexNormals()` or an equivalent fix at integration time" for loaders that don't
auto-compute normals — that caveat is about the app's own GLTFLoader configuration, not something
observed as broken in this render, but it should be verified against the app's actual loader
setup (not model-viewer's) before wiring in, since some loaders will render this flat/unlit if
they don't auto-generate normals. No other integration concerns observed.

---

## 2. `virus-influenza-pathogenar-cutaway-nih.glb`

**Verdict: PASS**

**Path:** `public/models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb`

**Evidence screenshots** (`review-screenshots/asset-acceptance-2026-08-18-wave6/biology-gaps/virus-influenza-pathogenar-cutaway-nih/`):
- `front-0-75-105.png`
- `side-90-75-105.png`
- `back-180-60-120.png`
- `topdown-0-20-130.png`
- `quarter-45-80-100.png`
- `other-side-270-75-105.png`

**Likely component mapping:** Per the sidecar `.license.json`, this is the companion/alternate
candidate to `virus-influenza-whole-nih.glb` for the same `biology > microbiology > Virus`
low-level item, intended to satisfy the spec's cross-section/cutaway support requirement.
Sourced from NIH 3D entry 3DPX-013373 (PathogenAR / NIAID Biovisualization Program), CC-BY 4.0
(attribution required — see sidecar `attributionText`).

**Scientific-accuracy judgment (primary bar):** PASS. This is a genuinely informative cutaway,
not a hollow-shell gimmick. From the intact side (`back-180-60-120.png`), it shows a teal
envelope densely covered in two spike populations — a dominant red/pink population and sparser
clustered yellow knobs — matching the sidecar's stated hemagglutinin (red/pink) and neuraminidase
(yellow) coloring, and clearly distinct in look from the whole-virion file's blue/red scheme
(expected, since these are two separately-authored NIH assets using different color-coding
conventions, not an inconsistency within this file). Critically, the cut face reveals internal
structure that is meaningfully different from the exterior: a beige/tan meshwork layer just
inside the envelope (consistent with M1 matrix protein), and clustered orange and purple/violet
blobs deeper inside (consistent with the nucleoprotein/RNA/polymerase complexes the sidecar
describes) — visible clearly in `front-0-75-105.png`, `side-90-75-105.png`,
`quarter-45-80-100.png`, and especially the edge-on `other-side-270-75-105.png`, where the
layered internal structure reads almost like a cross-sectional diagram. The `topdown-0-20-130.png`
angle looking straight down into the open cut face is the single clearest shot of the internal
layering (spike layer → membrane → matrix mesh → RNP clusters) and would make a strong default
"cutaway" camera framing for the app. This clears the bar of showing something meaningfully
different from the outside view, and does not read as a generic hollow "spiky ball with an empty
socket."

**Performance/framing notes:** Well-centered and unclipped at every tested angle; the model is
slightly larger in frame than the whole-virion file at the same orbit radius (visible edges at
`side-90-75-105.png` and `other-side-270-75-105.png` come closer to the canvas border but do not
clip), so if both models are shown at the same fixed camera-orbit distance in-app, this one may
need a marginally longer default radius than the whole model to keep comfortable padding. No
texture/material artifacts, shading renders correctly.

**Integration safety note:** Same NORMAL-accessor caveat as the whole-virion file — sidecar
explicitly calls out no NORMAL attribute and requests a specific check that "the cutaway plane
reads clearly at the app's default camera framing (not just NIH's own thumbnail angle)." Based on
this render pass, the cutaway plane does read clearly across a wide range of angles (not only one
lucky thumbnail angle), so that specific risk is resolved — but the app's actual default camera
orbit/distance should still be checked once wired in, since a poorly chosen default angle could
still hide the cut face (e.g. viewing from directly behind the intact side). CC-BY 4.0 license
requires attribution (unlike the CC0 whole-virion file) — the exact `attributionText` string is
already recorded in the sidecar and should be surfaced in-app wherever asset credits are shown.

---

## Summary

Both GLBs PASS the scientific-accuracy bar for this review: the whole-virion model shows a
correctly differentiated two-spike-type influenza envelope (not a generic virus clipart), and the
cutaway model shows genuinely legible, differentiated internal structure (matrix layer + RNP
clusters) rather than an empty shell. No blank renders, no clipping, no console-visible loading
errors, no missing geometry across the 12 captured angles (6 per model). The only carried-forward
items for the eventual integration step (not this review) are: (1) verify the app's actual GLTF
loader computes vertex normals for these two normal-less meshes, (2) choose a default camera
orbit for the cutaway model that keeps the cut face visible, and (3) surface the required CC-BY
attribution text for the cutaway model in the app's credits.
