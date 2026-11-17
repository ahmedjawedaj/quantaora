# Wave 6 Live QA — Genetics + Notebook Save Flow + Generic BranchLab

Date: 2026-08-18
Scope owner: Wave 6 agent — Genetics, Notebook save/rename round-trip, generic BranchLab sampling.
Target: `http://127.0.0.1:5174` (dev server reachable — 200 on `/`).
Tooling: ad hoc Playwright (chromium) driven via Node scripts in `/tmp/wave6-genetics-branchlab/`
(scratch only, not committed). Viewports: desktop 1440x900, mobile 390x844.

All evidence below is under
`review-screenshots/live-acceptance-2026-08-18-wave6/genetics-branchlab/` (paths given in full).

---

## Part 1 — Genetics (`/app/labs/genetics`)

**Verdict: FAIL (P0 mobile navigation gap; content/mutation logic itself is correct — P1/P2 only)**

### Mutation-type correctness (desktop, `mutation` component)

Verified by reading `src/routes/GeneticsLab.tsx` (`applyMutation`, `mutationEffect`,
`MutationScene`) and by driving the real UI (Tune molecule → Change type → Substitution /
Insertion / Deletion), with "Show labels" on so the in-scene chip text is legible.

| Type | Length effect | Frameshift note | Flanking context |
|---|---|---|---|
| Substitution | Correct — strand stays 12 bases; only the codon at the mutated base changes (`codon before: GCC → after: GGC`). No "strand is now N bases" claim is shown (correct, since length is unchanged). | Correctly **never** labeled frameshift — effect meter showed `missense` for the sampled base/letter. | Full 12-base helix stays rendered around the mutated rung; chip text shows the full before/after codon, not an isolated single base. |
| Insertion | Correct — chip explicitly reads "one base added → strand is now **13** bases" and the helix visibly gains one rung. | Correctly flagged `frameshift`, with the explanatory chip "every codon after base 4 shifts" and "frame before: GCC TTC GAA → after: GCC CTT CGA" / "protein: ??? PHE GLU → ??? ??? ???". | Full mutated strand rendered; frame-shift text shows multiple codons before/after, not just the touched codon. |
| Deletion | Correct — chip reads "strand is now **11** bases" and the helix visibly loses one rung. | Correctly flagged `frameshift`, with "every codon after base 5 shifts" and a before/after codon-frame comparison. | Same as above — full strand + multi-codon frame comparison shown. |

Code cross-check (`GeneticsLab.tsx`): `mutationEffect()` returns `'frameshift'` unconditionally for
insertion/deletion (base-count changes, independent of which base) and only computes
silent/missense/nonsense for substitution — this exactly matches genetics teaching content and
matches what rendered on screen. `applyMutation()` correctly slices/splices for each of the three
types.

Screenshots:
- Default DNA: `.../genetics/desktop/01-default.png`
- Mutation component default (substitution, silent, before I changed type): `.../genetics/desktop/02-mutation-default.png`
- Tune molecule panel open: `.../genetics/desktop/03-mutation-controls-open.png`
- Clean (panel-closed) scene, labels on, per type: `.../genetics/desktop/09-clean-scene-insertion.png`, `09-clean-scene-deletion.png`, `09-clean-scene-substitution.png`

### Findings

**P0 — Genetics mobile 390x844: no way to switch away from the default DNA component; 9 of 10
genetics components (including Mutation) are unreachable on mobile.**
`GeneticsLab.tsx`'s `ContentNav` sidebar (the only place that lists DNA / DNA Replication / Gene /
**Mutation** / Transcription and Translation / Protein / Chromosome / Allele / Trait / Punnett
Squares) is rendered `hidden ... lg:block` (line 1458) with **no mobile fallback** — unlike the
generic `BranchLab.tsx`, which has an explicit `lg:hidden` horizontal chip switcher ("Component 1
of N") for exactly this case. I confirmed via Playwright that the "Mutation" nav button exists in
the DOM (`allTextContents()` includes "Mutation") but `isVisible()` is `false` at 390px width, and
clicking it times out because it's not interactable. Net effect: on a phone, a learner opening
Genetics can only ever see the default DNA scene; Mutation (and Replication, Protein, Punnett,
etc.) cannot be reached through any visible control.
- Evidence: `.../genetics/mobile/01-default.png` (no component switcher anywhere) vs.
  `.../branchlab/mobile/human-anatomy-REVIEW.png` (same app, generic BranchLab route, showing the
  working "COMPONENT 1 OF 16" chip row with Blood Vessels/Bones/Brain/Ear).
- Also: `.../genetics/mobile/02-tune-molecule-dna-default.png` — Tune molecule works fine, but
  only ever exposes DNA-specific controls (schematic/real-structure toggle) because `activeId` is
  stuck on `'dna'`.

**P2 — Desktop: the "Tune molecule" panel fully occludes the 3D scene while open.**
Not a framing/clipping bug (the scene is intact once the panel is closed — see the `09-clean-scene-*`
screenshots), but while `Tune molecule` is open (`.../genetics/desktop/03-mutation-controls-open.png`,
`04-mutation-*.png`) a learner cannot see the strand update live while adjusting Change
type/Base position/New base — they must close the panel to see the result. This is a design
tradeoff rather than a defect, flagged for polish only.

**P2 — Mutation chip labels in the clean scene are small and tightly packed against the floating
Molecule/Effect chips at the bottom of the canvas** (readable but visually dense) —
`.../genetics/desktop/09-clean-scene-insertion.png`, `09-clean-scene-deletion.png`.

No console errors or page errors were observed on the genetics route at either viewport (see
Console/error section below). No internal QA/debug/lorem/TODO strings were observed anywhere on
the genetics route.

---

## Part 2 — Save Experiment → Notebook round-trip

**Verdict: PASS with one P1 caveat (snapshot is real but shallow for this lab)**

Confirmed via `Read` of `src/components/explorer/SaveExperimentButton.tsx`,
`src/components/explorer/BottomTray.tsx`, and `src/routes/Notebook.tsx` before testing: the
"Save this setup" control lives in `BottomTray` (labeled "Experiment / Save this setup"), writes
to `useAppStore().saveExperimentSnapshot`, and `Notebook.tsx`'s "Saved experiments" tab renders
`snap.title` / `snap.state` / `snap.createdAt`, with a real rename control (pencil icon → text
input → check/✕) confirmed in the source before use.

**Test performed:** In Genetics, navigated to the **Mutation** component, set **Change type =
Deletion** (`.../genetics/desktop/06-before-save-deletion-state.png`), clicked **"Save this
setup"** (button changed to "Saved!" — `.../genetics/desktop/07-after-save-click.png`), then went
to `/app/notebook` → **Saved experiments** tab.

- The entry appeared immediately, titled **"Mutation — saved setup"**, tagged
  `BIOLOGY · MUTATION`, with chips `mastery: —`, `favorited: no`, `route: /app/labs/genetics`,
  `branch: genetics`, and a real timestamp ("Saved 8/18/2026, 3:12:27 AM") — not a placeholder/empty
  entry. Evidence: `.../notebook/desktop/02-saved-experiments-tab.png`.
- **Rename:** clicked the pencil icon, cleared the field, typed
  "QA Wave6 Genetics Deletion Test", pressed the Check button. The card immediately re-rendered
  with the new title and the rename UI closed cleanly (no layout shift/overflow).
  Evidence: `.../notebook/desktop/03-renaming-in-progress.png` (input focused, mid-edit) and
  `.../notebook/desktop/04-after-rename.png` (new title persisted, all other tags/timestamp
  unchanged).

**P1 — The Genetics save-snapshot does not actually capture the mutation configuration
(Deletion / base position / new-base letter) I set before saving.** `BottomTray.tsx` accepts an
optional `labState` prop that a lab can use to enrich its snapshot beyond the generic
`{ mastery, favorited, route, branch }" fields, but `GeneticsLab.tsx`'s `<BottomTray>` call (line
1619) does not pass one. So the saved entry correctly identifies *which component* was active
("Mutation") and the route, but two people who save two different mutation setups (e.g.
substitution-at-base-2 vs. deletion-at-base-9) from Genetics get visually indistinguishable
Notebook entries beyond their (renamable) title — the specific interactive state a learner
configured is not actually preserved. This is real, verified behavior (confirmed by reading the
component-state chips rendered in `.../notebook/desktop/02-saved-experiments-tab.png`, which show
only the generic fields), not a guess.

---

## Part 3 — Generic BranchLab (`/app/labs/branch/:branchId`)

**Verdict: PASS — no misleading flagship-model reuse and no internal legal/QA text leak observed
in any sampled state.**

Sampled by reading `src/data/modelRegistry.ts` (ground truth for which GLBs are wired, and their
`licenseStatus`) and `src/routes/BranchLab.tsx` (the actual gating logic) before choosing routes,
rather than assuming branch ids from the task's suggested list (none of which — `evolution`,
`animals`, `waves`, `sound`, `light-and-optics`, `magnetism`, `fluids`, `measurement`,
`states-of-matter` — have any authored components in `src/data/branchModules.ts` at all; visiting
any of them 404s out of `BranchLab` via its own `<Navigate to="/app/labs" replace />` guard rather
than rendering a fallback state, so they could not be used as a "missing" 3D-content sample).

| Sample branch id | Registry status (from `modelRegistry.ts`) | What actually renders |
|---|---|---|
| `cell-biology` | `animal-cell` asset, `licenseStatus: 'CLEAR'`, `qualityTier: 'hero'` | Real authored `animal-cell-authored.glb` renders correctly as the default component — approved/clean state. `.../branchlab/desktop/cell-biology-approvedCLEAR.png` |
| `human-anatomy` | All 9 organ assets (brain, eye, heart, intestine, kidneys, liver, lungs, pancreas, skin) are `licenseStatus: 'REVIEW'` | `BranchLab.tsx` has a hard-coded exemption (`ANATOMY_BRANCH_ID`) so `human-anatomy` is the **one** branch where `reviewPendingInGenericBranch` is forced `false` — the real REVIEW-status "Blood Vessels" organ GLB renders as the full hero experience, byte-for-byte the same as it would through the dedicated `Explore.tsx` route. `.../branchlab/desktop/human-anatomy-REVIEW.png`, mobile: `.../branchlab/mobile/human-anatomy-REVIEW.png` |
| `periodic-table` (also checked `molecules-and-bonding`) | No `MODEL_ASSETS` entry references either branch's authored components (their `model` paths don't resolve) | Correctly falls back to the procedural/illustrated scene with the honest, non-technical sidebar note "Illustrated 3D model, built to teach this topic clearly." — no real model, no leaked jargon. `.../branchlab/desktop/periodic-table-missingfallbacksuspected.png`, `.../branchlab/desktop/molecules-and-bonding-approvedCLEARATTRIB.png` |

**Flagship-model-reuse check:** none of the three samples borrowed another branch's model and
presented it as their own. `cell-biology` shows its own real cell model; `human-anatomy` shows its
own real organ models (by an explicit, documented code exemption, not a bug); `periodic-table`
and `molecules-and-bonding` show their own generic procedural/illustrated content, not someone
else's GLB.

**Internal legal/QA text leak check:** scanned the full rendered body text on every sample (regex
for `REVIEW|TODO|licenseStatus|NC-RISK|provenance|premium GLB sourcing|pending legal|internal`) —
**zero matches** on all three desktop samples and the one mobile sample. `BranchLab.tsx`'s
`childSafeAssetNote()` (with its explicit doc-comment warning against leaking
`assetStatusLabel()`'s internal vocabulary) is doing its job: it only ever surfaces the single
generic, positive sentence quoted above, never the internal `REVIEW`/`NC-RISK`/"provenance"
wording that `modelRegistry.ts`'s `assetStatusLabel()` uses for its own (dev-only) purposes.

**Observation (not a defect):** every currently-registered `REVIEW`-status asset belongs to the
`human-anatomy` branch, which is the one branch explicitly exempted from the
"hide REVIEW assets in generic branches" logic. That means the `reviewPendingInGenericBranch`
code path in `BranchLab.tsx` (the branch that's supposed to swap a REVIEW asset for the
illustrated fallback) currently has **no live branch/component in the data that exercises it** —
it's correct as written, but unverified by any real REVIEW-status asset outside `human-anatomy`
today.

No P0/P1 findings in Part 3.

---

## Console / page-error summary

Logs captured for the full session:
- `review-screenshots/live-acceptance-2026-08-18-wave6/genetics-branchlab/console-and-errors-ERROR.txt` (desktop: genetics default → mutation types → save → notebook → rename → 3 BranchLab desktop samples)
- `review-screenshots/live-acceptance-2026-08-18-wave6/genetics-branchlab/console-and-errors-mobile2.txt` (mobile: genetics default, Tune molecule, human-anatomy BranchLab sample)
- `review-screenshots/live-acceptance-2026-08-18-wave6/genetics-branchlab/console-supp.txt` (desktop supplemental: labels-on + clean per-mutation-type scenes)

**No `pageerror` and no `requestfailed` events were logged in any of the three files.** The only
console output across the whole session was benign dev-mode noise, verbatim:
- `THREE.Clock: This module has been deprecated. Please use THREE.Timer instead.` (warning, every page load)
- `[.WebGL-...]GL Driver Message (OpenGL, Performance, GL_CLOSE_PATH_NV, High): GPU stall due to ReadPixels` (warning, first paint only, "this message will no longer repeat")
- `unsupported GPOS table LookupType 8 format 2` / `LookupType 5 format 1` / `GSUB ... LookupType 6 format 2/1` (debug, font-shaping noise from the Notebook route's font)
- Vite HMR `[vite] connecting...` / `connected.` (debug) and the React DevTools info banner (info)

(Note: the first script run's process exited with a Playwright `TimeoutError` mid-mobile-pass
because the "Mutation" nav button was not visible/clickable — that failure is itself the P0
evidence above, not a tooling problem; the mobile pass was re-run with the correct assertions
after diagnosing that as a real product gap, and both runs' logs are kept for evidence.)

---

## Coverage statement

**Tested:**
- Genetics (`/app/labs/genetics`), desktop 1440x900: default DNA state, navigation to Mutation,
  all three mutation types (Substitution/Insertion/Deletion) with length + frameshift + flanking-context
  verification, Show-labels toggle, Save-experiment flow from a specific (Deletion) state.
- Genetics, mobile 390x844: default DNA state, Tune molecule panel for the default component,
  and an explicit check (both DOM presence + visibility) that no other component is reachable.
- Notebook (`/app/notebook`), desktop 1440x900: Saved-experiments tab contents after a real save,
  rename flow (pencil → edit → confirm) with before/after screenshots.
- Generic BranchLab (`/app/labs/branch/:branchId`), desktop 1440x900: `cell-biology` (CLEAR/approved),
  `human-anatomy` (REVIEW, exempted), `periodic-table` and `molecules-and-bonding` (no registered
  asset / illustrated fallback) — all checked for flagship-model reuse and leaked internal text.
- Generic BranchLab, mobile 390x844: one sample (`human-anatomy`), used as comparison evidence for
  the Genetics mobile navigation gap (its working mobile chip switcher vs. Genetics' absent one).
- Console/page-error logging across the entire session at both viewports.

**Not tested / explicit gaps:**
- Genetics mobile: could not test the Mutation, DNA Replication, Gene, Transcription/Translation,
  Protein, Chromosome, Allele, Trait, or Punnett-square components at 390x844 at all, because no
  UI control on that viewport can select them (this is the P0 finding itself, not an omission).
- BranchLab: only 3 of the many "live" branch ids were sampled (as scoped); other live branches
  (`ecology`, `plants`, `atoms-and-elements`, `chemical-reactions`, `electricity`,
  `human-physiology`, etc.) were not individually screenshotted, though their registry status was
  visible in `modelRegistry.ts` while selecting samples.
- Notebook: only the "Saved experiments" tab and rename were exercised; Notes/Quiz
  history/Favorites/Completed-labs tabs were not tested (out of this scope's task list).
- Desktop-only mutation-type testing used labels-on for legibility; labels-off rendering of the
  mutation scene was seen only in passing (screenshot `02-mutation-default.png`) and not
  separately verified for clipping.
