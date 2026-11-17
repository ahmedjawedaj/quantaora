# Quantaora Today Execution

Purpose: finish the highest-value product gaps with multiple agents while keeping token usage low.
Read this file first. Only open larger docs when this file points you there.

Last updated: 2026-08-19.

**2026-08-19 verification + perf wave:** Anatomy provenance remains REVIEW (hashes + replacement
leads recorded); all 16 authored Anatomy components reachable, generic route correctly gates
REVIEW assets. Moons now tested. Predator/Prey visually distinct with canonical meters. NaCl has
context/focus isolate. Microbiology virus uses the real NIH poliovirus capsid mode. Route lazy
loading cut initial gzip ~1.27MB→134KB; Hero scene progressive-loads with first-paint text; 404 is
accessible. 282/282 tests, build/lint/codegen/assets pass, 23 branches parity-checked, 53
CLEAR/4 ATTRIB/9 REVIEW assets. Residuals: nine Anatomy REVIEW assets still a paid-launch blocker,
`branchModules` ~1.57MB shared data chunk (async compare split proposed, not done),
`GlbErrorBoundary` duplicated across shared components, pre-existing lint warnings remain.

**2026-08-19 P0 wave verified:** Earth In Space dedicated five-mode lab (canonical
authored-content/codegen integration), Algebra piggy-bank/taxi/draining-tank redesign + mobile
graph fix, Chemistry water/CO2/methane/NaCl GLBs wired (water orientation fixed),
Mechanics/Energy prop integrations + mobile reachability/asset-prominence fixes, Ecology distinct
central scenes. 236/236 tests, build/codegen/assets pass, 23 branches parity-checked, no console
errors/overflow. Residuals: Predator vs Prey still similar (P2), procedural Ecology/Mechanics
below Anatomy polish, NaCl isolate (P2), bundle ~4.64MB minified/~1.27MB gzip, nine Anatomy
REVIEW assets remain a paid-launch blocker.

## Quality Bar

Quantaora must feel like the current Anatomy lab: clean, premium, visual, interactive, and readable.

A lab is acceptable only when:

- the first view clearly shows the subject without clipped models, hidden content, or overflow;
- every lab uses the shared toolbar: rotate, play/pause when useful, zoom in/out, fit/reset,
  fullscreen, labels, clean view, and relevant isolate/section/compare actions;
- controls visibly change the model or simulation, not just numbers;
- the child can answer: "what changed, why did it change, and what happens if I change this?";
- desktop and mobile both fit without broken text, blocking overlays, or unusable controls;
- screenshots prove the visual state before calling the slice done.

## Current Done State

- Biology Anatomy is the visual reference. Do not spend today's primary effort re-sourcing its
  organ assets.
- Biology Genetics, Plants, Microbiology, Human Physiology, and Ecology have dedicated flagship
  first passes.
- Physics Electricity, Mechanics, and Energy have dedicated flagship first passes.
- Chemistry Molecules, Reactions, and Atoms/Periodic Table have dedicated flagship first passes.
- Math Algebra and Math Manipulatives have dedicated flagship first passes.
- Space Solar System, Stars, and Galaxies are counted as flagship labs.
- Labs index has subject accordions, search, filters, and quality-state navigation.
- Shared canvas toolbar exists in `quantaora-app/src/components/explorer/CanvasControls.tsx`.
- Current storage is local-first Zustand persisted state. IndexedDB progress is not done yet.

## P0 Remaining Scope

1. **Number Sense / Arithmetic flagship**
   - Replace preview-only branch with a concrete manipulative lab.
   - Cover addition, subtraction, multiplication, division, place value, number line, negative
     numbers, factors, multiples, and prime numbers.
   - Include base-ten blocks, bead bars, arrays, number line motion, regrouping, and prime/factor
     discovery.

2. **Space critical-thinking deepening**
   - Make rotation vs revolution impossible to miss.
   - Show speed controls, year/day effects, orbital distance effects, scale tradeoffs, gravity
     influence, and mission-style prompts.
   - Preserve the clean 3D style and common toolbar.

3. **Biology process deepening**
   - Use seed-to-plant as the quality example: stage, cause, visible change, next outcome.
   - Apply the same pattern where useful: digestion, circulation, breathing, immune response,
     cell division, photosynthesis, food webs, and microbe infection cycles.

4. **Learning and saving without backend**
   - Add local persistence for completed labs, saved experiments, favorites, quiz attempts, and
     learner notes.
   - Prefer IndexedDB/Dexie or a small local abstraction if the repo already has a pattern.
   - Keep the API backend-ready but do not add a backend today.

5. **Guided challenge layer**
   - Each flagship should eventually have Observe, Predict, Change, Explain, and Check prompts.
   - Challenges must reference the visible model controls.
   - Keep the first implementation reusable and lightweight.

6. **3D asset sourcing**
   - Anatomy assets are already strong. Do not duplicate that effort.
   - Source weak non-anatomy needs first: cell biology, chemistry apparatus/molecules, space
     bodies, physics apparatus, plants/microbiology support assets, and math manipulatives only
     where 3D improves clarity.
   - Track candidates in `docs/ASSET-SOURCING.md`.

## Agent Ownership

Use disjoint write scopes. Do not let agents edit the same route unless explicitly integrating.

| Agent | Scope | Owns |
| --- | --- | --- |
| Agent 1 | Number Sense lab | `quantaora-app/src/routes/NumberSenseLab.tsx`, route wiring in `App.tsx`, `hierarchy.ts`, `Labs.tsx`, `AppShell.tsx` if needed |
| Agent 2 | Space deepening | existing space lab route files only |
| Agent 3 | Biology process deepening | existing biology flagship route files only |
| Agent 4 | Local saving/progress | local storage modules, hooks, notebook/progress UI touchpoints only |
| Agent 5 | Asset sourcing | `docs/ASSET-SOURCING.md`, asset manifest notes only |
| Agent 6 | QA/screenshots | `docs/QA-CHECKLIST.md`, screenshot artifacts, QA notes only |

## Low-Token Agent Prompt

Copy this into each new agent and add its assigned scope.

```text
You are working in /Users/ahmedjawed/Documents/Kids Learning app.

Read only:
- docs/TODAY-EXECUTION.md
- docs/PROJECT-STATUS.md top session notes only if needed
- docs/QUALITY-GAP-MATRIX.md only for your assigned branch

Do not reread the whole repository.
Do not edit files outside your assigned ownership.
Do not revert changes made by other agents.
Keep the final report under 15 lines.

Task:
[PASTE ONE AGENT SCOPE HERE]

Acceptance:
- shared toolbar remains available;
- no clipped canvas/model on desktop or mobile;
- controls create visible cause/effect;
- run the smallest relevant verification;
- list changed files and screenshots.
```

## Claude Setup

Claude-specific execution rules live in `docs/CLAUDE-EXECUTION.md`.

Claude slash-command prompts live in `.claude/commands/`:

- `/quantaora-next`
- `/quantaora-agent`
- `/quantaora-qa`
- `/quantaora-status`

Do not install more Claude skills or external plugins today unless a task explicitly needs that
external service. The current local skills are enough for app UI, landing UI, docs, and QA.

## Recommended Agent Prompts

### Agent 1: Number Sense

```text
Implement the Number Sense / Arithmetic flagship lab. Own only:
- quantaora-app/src/routes/NumberSenseLab.tsx
- quantaora-app/src/App.tsx
- quantaora-app/src/data/hierarchy.ts
- quantaora-app/src/routes/Labs.tsx
- quantaora-app/src/components/AppShell.tsx only if route fallback needs it

Cover addition, subtraction, multiplication, division, place value, number line, negative number,
factors, multiples, and prime number with concrete manipulatives. Use the shared toolbar and
desktop/mobile-safe layout. Start paused if animation exists.
```

### Agent 2: Space

```text
Deepen Space cause/effect interactions without changing unrelated labs. Own only existing space
route files. Improve rotation vs revolution, speed effects, gravity/orbital distance, scale
tradeoffs, and mission prompts. Keep toolbar, clean view, and mobile fit.
```

### Agent 3: Biology Processes

```text
Deepen Biology process learning without touching Anatomy assets. Own only existing biology flagship
route files. Add seed-to-plant-style cause/effect patterns where useful: stage, variable, visible
change, next result, and explanation.
```

### Agent 4: Local Saving

```text
Add backend-free learning persistence. Own only local storage/progress modules and minimal UI
touchpoints. Save completed labs, favorites, experiment snapshots, quiz attempts, and notes. Prefer
an IndexedDB-ready abstraction if it fits the repo.
```

### Agent 5: Asset Sourcing

```text
Create and fill docs/ASSET-SOURCING.md for weak non-anatomy assets. Do not re-source Anatomy organ
assets. Prioritize cleared .glb candidates and record license risk, source URL, branch/component,
quality fit, and implementation priority.
```

### Agent 6: QA

```text
Run visual QA for current flagship labs. Own only docs/QA-CHECKLIST.md and screenshot outputs. Check
desktop/mobile, toolbar fit, clean view, zoom, play/pause, clipping, console errors, and screenshot
coverage. Keep report short and actionable.
```

## Minimal Verification

Run from `quantaora-app/` after integration:

```bash
npm run lint -- --quiet
npm run build
npm run codegen:check
npm run assets:check
```

Known expected result: Vite may warn about a large chunk. `assets:check` may show the known Anatomy
REVIEW warnings. Any new error or new non-commercial risk is a blocker.

## Screenshot Folder

Use:

`quantaora-app/review-screenshots/current-state-2026-08-17/`

For a new implementation slice, capture at least:

- desktop default view;
- desktop controls open;
- one alternate concept/state;
- mobile default view.

## Coordination Rules

- Main coordinator owns integration and final verification.
- Agents should report changed files, tests, screenshots, and unresolved risks only.
- If an agent needs another agent's files, stop and report instead of editing across ownership.
- Prefer concise docs updates over long chat summaries.
- Update this file when the product state or ownership changes.
