# Wave 8 QA — Genetics

Date: 2026-08-18
Route: `/app/labs/genetics`
Viewports: desktop 1440x900, mobile 390x844
Screenshots: `review-screenshots/wave8-2026-08-18/genetics/` (27 files)

Zero `console.error` and zero `pageerror` events across every session (default load, all 10 mobile-switcher clicks, all mutation-type interactions, DNA real-structure toggle, Punnett navigation).

## Checklist verdicts

**1. Mobile component switcher reaches every genetics component — PASS**
Clicked through all 10 switcher chips ("Component X of 10") at 390x844. Each click updated `aria-current`, the "Molecule" meter, and header text 1-10 correctly. No dead ends. Evidence: `mobile-switcher-step1-allele.png` ... `mobile-switcher-step10-transcription-and-translation.png`.

**2. Insertion/deletion/substitution length and frameshift logic — PASS (logic), P1 (visibility)**
Source (`src/routes/GeneticsLab.tsx`) confirms correct distinction: `mutationEffect()` (line 1172) — insertion/deletion are unconditionally frameshift, substitution never is; `applyMutation()` (line 584) — insertion grows sequence by 1, deletion shrinks by 1, substitution keeps length identical, and the rendered helix rebuilds at the new base count. Substitution correctly computes silent/missense/nonsense from codon translation instead of frameshift. Confirmed via UI: "Effect" meter read `silent` for substitution then `frameshift` immediately on switching to Insertion/Deletion, at both viewports. Downgraded to P1 due to a framing problem (below) that hides most of the visual evidence of the length change.

**3. DNA 3D asset — PASS (renders, contextually correct), P2 polish note**
Both the schematic helix and the real PDB 1BNA ball-and-stick structure render, are not blank, not generic placeholders — real-structure toggle swaps in an actual sourced molecular mesh with correct attribution banner ("REAL B-DNA STRUCTURE · PDB 1BNA · NIH 3D · CC-BY 4.0"). Evidence: `desktop-dna-default.png`, `desktop-dna-real-structure.png`, `mobile-dna-default.png`. P2: schematic backbone strands (`#A98F6B` tan) sit very close in value to the scene background (`#F0E7DA` tan) — double-helix silhouette reads mostly as a stack of colored rungs rather than a clearly legible twisted-ladder shape.

**4. Panels/toolbars legible, not clipped, reachable — P1 (canvas compression), P2 (minor clipping)**
This is the most significant finding of the review:
- 3D canvas is squeezed short by variable-height "Real-world" copy in `BottomTray`, and the Tune panel then covers nearly all of what's left. Measured: on `dna` (shorter `whyItMatters` text) canvas stage is 465px tall at 1440x900; on `mutation` (longer text) it shrinks to 285px because the bottom tray's fifth "Real-world" grid cell grows to fit the longer paragraph and all `grid-cols-5` cells match the tallest. With the Tune panel open, only a 1-2 rung sliver of the helix remains visible above the panel, at both viewports — weakening cause/effect visibility for mutation type/base changes. Evidence: `desktop-mutation-clean-tune-open.png`, `desktop-mutation-clean-insertion.png`, `desktop-mutation-clean-deletion.png`, `mobile-mutation-tune-open.png`.
- On-canvas mutation explanation text (`ChipLabel` frameshift explanation: "one base added -> every codon after base N shifts", frame before/after, protein sequence) sits low in 3D-scene space and falls outside the compressed camera crop, so it never renders even with "Show labels" enabled and Tune panel closed. Evidence: `desktop-mutation-insertion-panel-closed.png`.
- Intermittent: canvas occasionally renders fully blank after the sequence open Tune -> change mutation type -> close Tune -> toggle "Show labels" — reproduced twice out of four attempts at 1440x900 (Effect meter and side panel text still update correctly; zero console/page errors either time). Likely a timing/resize race in the R3F canvas when surrounding layout height changes rapidly, not a crash. Evidence: `desktop-mutation-insertion-labels-on.png` (blank) vs `desktop-mutation-insertion-labels-on-visible-repro.png` (normal).
- Punnett square scene's top marker is clipped by the "GENETICS · TAP MOLECULES..." banner at mobile 390x844 only (grid itself fully visible/legible). Evidence: `mobile-punnett-default.png` vs `desktop-punnett-default.png`.
- Everything else checked (ContentNav, DetailPanel, BottomTray, mutation type buttons, base-position slider, new-base letter buttons) is legible, un-clipped, reachable at both viewports; no page-level scroll issues.

No internal QA/debug language found in `genetics.ts`/`GeneticsLab.tsx` or observed in any screenshot.

## Findings

**P0 — none found.**

**P1**
1. Mutation-lab canvas is compressed by variable-length `BottomTray` "Real-world" copy (worst on the `mutation` component itself), and the Tune-molecule panel then covers nearly all of the remaining canvas at both viewports — undermining visible cause/effect for insertion/deletion length changes. Evidence: `desktop-mutation-clean-tune-open.png`, `mobile-mutation-tune-open.png`.
2. On-canvas frameshift explanation labels never render because they fall outside the compressed camera crop even with "Show labels" on. Evidence: `desktop-mutation-insertion-panel-closed.png`.
3. Intermittent (~50% in local repro): DNA canvas can render fully blank after Tune-panel-open -> mutation-type change -> Tune-panel-close -> "Show labels" toggle, with no console/page error. Evidence: `desktop-mutation-insertion-labels-on.png` vs `desktop-mutation-insertion-labels-on-visible-repro.png`.

**P2**
1. Schematic DNA backbone color is low-contrast against the scene background, making the double-helix silhouette hard to read. Evidence: `desktop-dna-default.png`.
2. Punnett-square scene's top hotspot marker is clipped by the fixed banner overlay at mobile viewport only. Evidence: `mobile-punnett-default.png`.

Mutation-type correctness itself (insertion/deletion -> frameshift, substitution -> never frameshift, length grows/shrinks by exactly one base) is implemented correctly in source and confirmed via the Effect meter at both viewports — the P1 issues above are about visibility of that correct behavior, not its correctness.

## Files inspected (read-only)
`src/routes/GeneticsLab.tsx`, `src/data/generated/genetics.ts` (or equivalent). No product/source files modified.
