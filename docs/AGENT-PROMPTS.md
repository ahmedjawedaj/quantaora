# Quantaora Agent Prompts

Purpose: reusable low-token prompts for running multiple Codex agents today.

Last updated: 2026-08-17.

## Base Prompt

```text
You are working in /Users/ahmedjawed/Documents/Kids Learning app.

Read only:
- docs/TODAY-EXECUTION.md
- docs/PROJECT-STATUS.md top session notes only if needed
- docs/QUALITY-GAP-MATRIX.md only for your assigned branch
- docs/QA-CHECKLIST.md only if you are taking screenshots or verifying UI

Do not reread the whole repository.
Do not edit files outside your assigned ownership.
Do not revert changes made by other agents.
Keep final report under 15 lines.

Task:
[paste assigned task]

Acceptance:
- shared toolbar remains available;
- no clipped canvas/model on desktop or mobile;
- controls create visible cause/effect;
- run the smallest relevant verification;
- list changed files and screenshots.
```

## Number Sense Agent

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

## Space Agent

```text
Deepen Space cause/effect interactions without changing unrelated labs. Own only existing space
route files. Improve rotation vs revolution, speed effects, gravity/orbital distance, scale
tradeoffs, and mission prompts. Keep toolbar, clean view, and mobile fit.
```

## Biology Process Agent

```text
Deepen Biology process learning without touching Anatomy assets. Own only existing biology flagship
route files. Add seed-to-plant-style cause/effect patterns where useful: stage, variable, visible
change, next result, and explanation.
```

## Local Saving Agent

```text
Add backend-free learning persistence. Own only local storage/progress modules and minimal UI
touchpoints. Save completed labs, favorites, experiment snapshots, quiz attempts, and notes. Prefer
an IndexedDB-ready abstraction if it fits the repo.
```

## Asset Sourcing Agent

```text
Create and fill docs/ASSET-SOURCING.md for weak non-anatomy assets. Do not re-source Anatomy organ
assets. Prioritize cleared .glb candidates and record license risk, source URL, branch/component,
quality fit, and implementation priority.
```

## QA Agent

```text
Run visual QA for current flagship labs. Own only docs/QA-CHECKLIST.md and screenshot outputs. Check
desktop/mobile, toolbar fit, clean view, zoom, play/pause, clipping, console errors, and screenshot
coverage. Keep report short and actionable.
```
