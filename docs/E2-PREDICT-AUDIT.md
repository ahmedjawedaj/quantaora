# E2 · Predict-Before-Respond — Design Audit & Spec

**Feature:** E2 (Predict-before-respond) from [PRODUCTION-PLAN.md](PRODUCTION-PLAN.md).
**Status:** audit + design spec, no app code changed.
**Companions:** [quantaora-product-tech-spec.md](quantaora-product-tech-spec.md) §6
(Component-Level Learning Flow), §22 (Simulation Engine), §23 (Content Authoring),
§20 (No-Backend), §19 (mastery); [PROJECT-STATUS.md](PROJECT-STATUS.md).
**North star:** "I finally understand it because I could see it move, change it myself,
and practice it until it made sense."

---

## 1. What is being audited and why it is the keystone

Per the production plan the single most engagement-critical mechanic is making a learner
state an **expectation before the model/simulation responds** — the "see science move"
unlock. Today:

- A `predictionPrompt` already exists and is **authored** on every component:
  `ComponentContent.lesson.predictionPrompt` (`quantaora-app/src/data/types.ts:48-53`).
- It is **rendered as a static, read-only hint** card on the first lesson-step
  (`LessonModal.tsx:97-109`). The learner can read it but cannot answer it, and no code
  ever gates the Run control on a prediction.
- Simulations (`SimulationDefinition`, spec §22) are steppable, manipulable, and the
  Run/Pause control lives in each bespoke lab route (`PhysicsLab.tsx:148-154`,
  `SpaceLab.tsx:100-104`, `PhysiologyLab.tsx:131-132`).
- Learner substrate is a single flat `localStorage` blob
  (`useAppStore.ts`) with no lessons-attempts log, no per-skill confidence, no
  mistake tags — so today there is no place to persist a prediction.

**Conclusion:** the mechanic is *authored* but not *wired*, and it cannot be wired until
two foundations land: content-as-truth (F1) and the Dexie learner substrate (F2). The
interaction contract below assumes F1's `SimulationDefinition` and F2's `SkillProgress`
exist; it is written so the predict step is a thin, generic layer on top of both.

---

## 2. Where predict sits in the component flow

The predict step is the *insertion point* between **Step 7 "Use it in a task"** and the
action of running the model. In flow terms, for a lab/simulation component:

```text
See it → Touch it → Name it → Explain it → Belongs to → Compare it
   └─ PREDICT (new, gating step) ─> Run the model ─> OBSERVE ─> CONCLUDE
```

For a pure model (no run) component, the same step appears flow with the lesson
(`predictionPrompt` shown as an in-flow question answered then revealed immediately,
since there is no run event to anchor the reveal on).

One component payload carries both `lesson.predictionPrompt` (already there) and the
*correct outcome* — which today is **not authored anywhere**. That is the single gap this
spec fills in the data model (§5).

---

## 3. Goal 1 — the predict interaction, end to end

Each predict step is a small closed loop. Everything below is a single authored payload
(one `Prediction` object, §5).

### 3a. The prompt
Rendered verbatim from `predictionPrompt`, e.g. Motion Lab's:
> "Before you press run: if you double the mass but keep the same force, will the cart
> accelerate faster or slower?"

Always phrased as a **testable observable of the model** (velocity, orbit shape,
temperature, impulse) — never a recall-of-definition question. Authoring rule: the
correct outcome must be directly readable from `outputs` the moment you run the model.

### 3b. How the learner answers — three input modes, one interface
Answer capture is a small card with **three modes**; the authored `mode` selects one:

| Mode | UI | Good for | A11y/analytics |
|---|---|---|---|
| `thumb` | Direction-only: "Faster / Slower / Same" or "Up / Down / Same" (2–3 fixed T-btns) | Physics: mass↑ → a↓; friction↑ → v↓ | smallest cognitive load; ideal for K–5; needs **no typing** |
| `choice` | 3–4 authored options, single select | Quantity/exact-value predictions ("about 2 m/s") | radio buttons; mixes confidence wording if desired |
| `typed` | Labeled textarea + submit | open "explain why" / qualitative process predictions | full keyboard path, but only used when options are genuinely unknowable |

All three are **single submission, one attempt per run** in the gating step. The value
recorded to the substrate is the `answer` (string), `mid:` id, and `confidence`.

### 3c. Capture on answer
On submit the prediction is **immediately**:
1. **Written to the notebook** — an entry `{ title: prediction, body: user prediction +
   "I predicted that because…", kind: 'prediction' }` via the existing `saveToNotebook`
   path (`DetailPanel.tsx:31-41`), tagged `kind='prediction'` so the scrapbook can group
   and later annotate the prediction vs the outcome.
2. **Sent to the F2 substrate** — a `PredictionAttempt` record (prediction id, component
   id, mode, confidence, `mistakeTags` empty until confirmed) (§6).
3. A dedicated **"Explain why"** action appears next to the answer ("recast your
   prediction in 1–2 sentences"). Doing so is optional but rewarded (it unlocks the
   `selfExplained` field and is a micro-conclusion fallback).

### 3c. AFTER the model runs — the reveal + comparison
The reveal is **deferred until the learner actually runs/manipulates the model**. State:

1. Learner anticipates (step 3b), submits.
2. Run/gate unlocks → learner runs or manipulates the model.
3. When the learner hits "Check my prediction" (or the model completes a meaningful
   observable / the run is paused), reveal:
   - **The correct outcome** (from the authored `Prediction.reveal`).
   - A **plain-language comparison** (`Prediction.comparison`) written to not a-an answered-:
     > "You predicted *faster*. The model shows *slower* — doubling mass raises inertia,
     > so the same force produces less acceleration. That's F = a×m: bigger m, smaller a."
4. The reveal records `outcome: 'correct' | 'wrong'` against the attempt, writes the
   outcome into the notebook entry, and updates F2 mastery/mistake-tags (§6).

### 3d. "Wrong guess then see why" → a micro-lesson
A wrong prediction is **not a failure — it is the lesson schedule**. The confirm step
feeds back two authored artifacts (both part of the `Prediction` payload):

```text
┌─ WRONG ────────────────────────────────────────────────┐
│ Your guess     : faster          (correct answer: slower) │
│ What the model showed       : acceleration halved        │
│ Why did I think that? ─ mistake tag `mass=adds-force`     │
│ Fix : explain: "more mass resists acceleration —         │
│        divide, don't multiply"                            │
│ Skill deltas: -confidence / +attempts / +1 mistakeTag     │
└──────────────────────────────────────────────────────────┘
```

The micro-lesson is just the reveal + comparison shown *in context of the learner's own
wrong answer*, plus **the wrong attempt is scheduled for spaced review** (a mistag row
gets a Leitner box-1 entry so the same prediction resurfaces tomorrow). Explanation text
shown after a mistake seeds the review prompt (per spec §19 "explanations shown after
mistakes feed review prompts"). On that retake the learner predicts again at box 1; a
correct prediction clears the mistake tag and moves the skill forward.

---

## 4. The interaction contract (Run-blocking)

The contract depends on whether the component has a **runnable model** (a
`SimulationDefinition` / procedural sim) or is **model-only**.

### 4a. lab / simulation components — block Run until a prediction exists
- The Run/Play/Step control (`PhysicsLab.tsx:148-155` pattern) is **disabled (or its
  press is intercepted)** while no prediction is recorded for the current component.
- "No guess = no run." This is the hard-gate (see §7).
- Once a prediction is recorded, Run is enabled. After the first run completes, the
  learner can Run/Reset freely to explore — the gate fires **once per component** (per
  first predict), not per run.
- A "Predict first" affordance surfaces in the Run control's spot when locked (tooltip +
  the predict card opens).

### 4b. model-only components — merge with lesson flow
- No Run control exists, so there is no gate. The predict step renders **inline within
  the lesson flow** (as step 0 today), answer → reveal immediately on "See what
  happens"-style confirm, because the observable is a static description, not an event.
- This branch still records the prediction + reveal to substrate; it just has no
  "wait for run" phase.

### 4c. Data-model extension required (the gate's source of truth)
The gate reads one boolean from learner state: "does a `PredictionAttempt` exist for
this `componentId`?" The **run permission** is derived, never stored — so the gate is
always a pure function of substrate state for the current component. To make this
repeatable the F2 store gains a small `predictions` store (see §6) and the Run
control reads `predicted = store.hasPrediction(componentId)`.

---

## 5. Data model — where the Prediction lives

### 5a. Authored (content, F1 side)
`predictionPrompt` already lives on `lesson`; the correct outcome + reveal + comparison
today lives **nowhere**. Add a sibling authored artifact so the step owns one coherent payload.

**Chosen: `prediction.json`** inside the component folder (spec §23 file set). Rationale:
it is a *distinct* authored unit with its own schema and lifecycle (content-agent
authored together with `lesson.md`/`simulation.ts`), and it keeps `module.json`'s
`LearningModule` shape clean (no new required field, so three existing modules don't all
have to change on day one). It is referenced by componentId and mirrors `lesson`
`predictionPrompt` (the prompt stays where it is; `prediction.json` couples the prompt's
answer to it).

```jsonc
// content/subjects/physics/mechanics/motion-lab/prediction.json
{
  "id": "motion-lab",
  "componentId": "motion-lab",
  "mode": "choice",                                  // thumb | choice | slider | text
  "prompt": "…",                                      // mirrors lesson.predictionPrompt
  "options": ["Faster", "Slower", "Same"],            // for mode choice/thumb
  "confidence": "basic",                              // basic | shaky | confident (optional)
  "correct": "Slower",
  "reveal": "The cart accelerates slower.",
  "comparison": "You chose faster; the model shows slower. Doubling mass while keeping
                  force the same cuts acceleration in half by Newton's second law.",
  "whyMissed": {                                      // micro-lesson on wrong answer
    "cause": "guess-the-effect",
    "corrective": "Greater mass resists acceleration — a larger denominator makes F/m smaller."
  },
  "predictAfter": "doubleMass",                       // observable/frame label from the sim
  "targetOutput": "acceleration"                     // name of the SimulationDefinition.output
}
```

**Alternatives considered & rejected:**
- Add `prediction` to `module.json` — couples to `LearningModule`'s mastery shape and
  forces `type` (model vs sim) aware gating at the content root. Rejected to keep F1
  schema surface minimal.
- Add to `lesson.prediction` — reuse of `lesson` keeps prediction tied to lesson steps,
  but the lesson file is the prose noun; prediction is executable by the sim engine.
  Keep them separate (single payload is assembled at codegen: lesson + prediction joined
  by componentId).
- A `prediction/skillId` mapping is optional per component; default skils = the
  component's `skillIds` (from `module.json`).

### 5b. Runtime (F2/Dexie side)
New Dexie store `predictions`, additive to the F2 schema (PRODUCTION-PLAN F2).

```ts
interface PredictionAttempt {
  id: string
  componentId: string
  predictionId: string            // -> prediction.json.id
  mode: 'thumb' | 'choice' | 'text'
  answer: string                 // what the learner chose/typed
  confidence: 0 | 1 | 2 | 3     // 0 withheld, 1 shaky, 2 confident (offered, optional)
  selfExplained: string | null
  status: 'open' | 'resolved'    // open = predicted but model not run/revealed yet
  resolved: boolean
  correct: boolean | null        // filled on reveal
  predictedAt: number
  resolvedAt?: number
}
interface HistorySaveEntry { …kind: 'prediction'… }  // notebook is already kind-tagged-capable
```

**Gate derivation (run permission) is a pure function:**
```ts
function canRun(preds: PredictionAttempt[], componentId: string) {
  return preds.some(p => p.componentId === componentId && (p.status === 'pending' || p.correct !== null))
}
```

### 5c. Mastery wiring (spec §19)
- **Correct** prediction → confidence `+` and contributes to `skill` progress
  (spec: "successful lab prediction improves mastery") — a small mastered bump.
- **Wrong or shaky** → no bump; `mistakeTags` gained; schedules `nextReviewAt` (Leitner
  1 → next day). Explanations-as-review prompts get fed the authored `corrective`.

---

## 6. UI/UX sketch — the predict card

### 6a. Placement
- **labs/simulations:** the card mounts in the **DetailPanel** (right rail, where the
  lesson content lives) overlay and, on mobile, mirrors into the **BottomTray** slot (a
  predict tab). The Run control sits top of the canvas; when blocked it opens the card.
- **model-only:** the card replaces the current static "Predict first" inset in
  `LessonModal` step 1 (`LessonModal.tsx:97-109`), turning the hint into an interactable
  answer control.

### 6b. States

| State | Card shows | Run control |
|---|---|---|
| `A · unanswered` | prompt + answer control + "Submit prediction" (disabled until an option chosen) | **blocked** (+"Predict first" tooltip) |
| `B · predicted, running` | "Prediction locked in: *Slower*. Now run the model." | enabled |
| `C · reveal` | answer vs outcome, plain-language comparison, "Explain why" optional, conclusion | — |
| `D · wrong-wrong` | micro-lesson (your guess vs what the model did, why, retry link) | enabled |

Transitions: A → B (submit) → runner → C (done) → done/repeat. D branches from C when
`correct=false`.

### 6c. Keyboard / screen-reader path
Strictly linear and focus-sensible:
- `role="radiogroup"` of radio options (mode **thumb/choice**) with arrow-key selection
  (`aria-checked`), or a single labeled `textarea` (mode **text**).
- A labeled "Submit prediction" `button` (enabled only after an answer is valid).
- On submit: card jumps to B, `aria-live="polite"` announces "Prediction saved, run is
  now available."
- Reveal in C: the comparison is `role="status"`/`aria-live="polite"` so SR reads it
  when it pops.
- Wrong case (D): the micro-lesson is a normal focusable region; "Reveal why" +
  "Practice this" buttons both reachable.
- All controls are ≥44px targets; focus trap inside the card only when it is modal
  (desktop rail) — it is never a separate modal modal on mobile.

### 6d. What is saved to the F2 substrate (once F2 exists)
Per answer: `PredictionAttempt` row (§5b) with `answer`, `confidence`, `status`,
`correct`, plus:
- on confirm, **mistakeTags** (`mistake/goi-get:false` for that attempt) and
  **correctObjectSkill** bumps baked into `skill.mastery`/`nextReviewAt`.
- The notebook entry keeps `kind:'prediction'` and annotates the outcome so the
  scrapbook shows guess-vs-actual.
- If `selfExplain` given, the prose lands in the same notebook entry / `selfExplained`.

---

## 7. Recommendation — hard-gate vs soft-prompt

**Recommendation: hard-gate for simulation/lab components; soft-prompt for model-only.**
This matches the asker's lean and the product bar:

- The entire point of "see science move" is **prior expectation → refutation/confirmation**.
  A soft prompt that Run just ignores and lets the learner watch first collapses to the
  current passive viewing — it silently regresses the exact behavior E2 exists to fix.
  Hard-gating the *first* run enforces the cognitive precondition at the moment it is
  cheapest to do (before curiosity has been satisfied).
- Guard against friction: the gate fires **once per component's first run**, never
  against every play; and `thumb`/`choice` input is < 10 seconds, so the cost is trivial.
  "No guess = no run" message is encouraging, not penal.
- Model-only has no "run" event to gate on, so hard-gating makes no sense — the reveal is
  instantaneous and inline; gating it would just add friction to reading a fact. So:
  soft prompt + immediate reveal.

If product ever needs a **teacher/managed mode** or a "just explore" sanboxed level, the
gate pricks be configurable via `LearningModule.type` (`simulation` → gate; `model` →
soft) — which is a content decision, not a code change.

---

## 8. Sequencing / dependencies (no code changed in this audit only)
E2 lands **after F1 + F3** (content-as-truth + generic SimEngine) and can partly proceed
with **F2** (so `PredictionAttempt` has a home). Recommended order:
1. F1 content schema + compile (`prediction.json` added to the F1 Zod schema set).
2. F2 Dexie substrate (`predictions` store + notebook `kind:'prediction'`).
3. F3 generic engine exposes the blocked/unblocked Run control (`canRun` pure fn).
4. E2 thin `PredictCard` + reveal + micro-lesson.

That reproduces: `new predict → mission in 90s → predicts → then run unlocks`.

---

**Key design decision / data-model change (short):** The single authored artifact a
prediction needed is the **answer key + reveal/comparison**, which does not exist today.
Add a new content file `prediction.json` (per component) — `mode`, `options`, `correct`,
`reveal`, `comparison`, `corrective` — joined to the existing
`lesson.predictionPrompt` by `componentId`; persist learner answers in a new Dexie
`predictions` store (a `PredictionAttempt` row with status/correct/confidence/mistakeTags),
and derive **Run permission from `hasPrediction(componentId)`** so "no guess = no run"
is a pure function of substrate state. Gate hard for simulation/lab first-runs, soft for
model-only reads.