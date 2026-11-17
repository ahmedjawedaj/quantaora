# Quantaora Claude Execution

Purpose: run Claude/Claude Code efficiently on this project while staying inside a small weekly
usage budget.

Last updated: 2026-08-17.

## Budget Rules

- Do not ask Claude to "understand the whole app" during execution.
- Start every task from `docs/TODAY-EXECUTION.md`.
- Open long docs only for the exact assigned branch or component.
- Keep each Claude run to one owned scope.
- Prefer one implementation pass plus one verification pass over repeated discussion.
- Ask for final reports under 15 lines.
- Do not run multiple Claude agents on overlapping files.
- Use smaller/faster models for docs, asset sourcing, and QA triage if available in your Claude
  account. Save the strongest model for complex 3D lab implementation and integration.

## Required First Prompt For Claude

Use this at the start of a fresh Claude session:

```text
Read CLAUDE.md, then read docs/TODAY-EXECUTION.md.
Do not read the whole repository.
Work only on the assigned task and assigned files.
Keep token usage low.
Before editing, state the exact files you will touch.
After editing, report changed files, verification, screenshots, and blockers in under 15 lines.
```

## Best Claude Work Split

Run no more than 3 implementation agents at once on a $20 weekly budget.

1. **Number Sense agent**
   - Highest P0 feature gap.
   - Good standalone implementation.
   - Owns a new route plus minimal route wiring.

2. **Local Saving agent**
   - Can work in parallel with Number Sense.
   - Must touch only storage/progress abstractions and minimal UI hooks.

3. **Asset Sourcing agent**
   - Use cheapest/smallest available model.
   - Docs-only until licenses are clear.

Run QA after integration, not continuously, unless a visual route is known risky.

## Model Use Guidance

If your Claude plan offers model choice:

- complex 3D route implementation: use the strongest model, but only for one scoped lab;
- route wiring, docs, asset matrix, QA checklist: use the cheaper/faster model;
- bugfix after build error: use the smallest model that can read the error and patch it;
- never use the strongest model for broad repository exploration.

## Skills

Current local skills are enough:

- `design-system`
- `ui-styling`
- `ui-ux-pro-max`
- `banner-design`
- `brand`

Use no more than 3 project skills for one task.

Recommended skill choices:

- App lab UI: `design-system`, `ui-styling`, `ui-ux-pro-max`
- Landing page only: `brand`, `banner-design`, `ui-ux-pro-max`
- Docs, QA, asset sourcing, route wiring: no design skills unless visual design is being changed

Do not install more Claude skills today. More installed skills add startup context and increase
decision overhead.

## Tools And Plugins

No external plugin is required right now.

Do not install Notion, Linear, Figma, Vercel, Supabase, or other external plugins for today's
implementation unless the task explicitly needs that external account. They add setup time and
do not help finish the local app faster.

Useful local commands:

```bash
cd "/Users/ahmedjawed/Documents/Kids Learning app/quantaora-app"
npm run lint -- --quiet
npm run build
npm run codegen:check
npm run assets:check
```

Known acceptable warnings:

- Vite large chunk warning.
- Existing Anatomy REVIEW asset warnings during normal `assets:check`.

## Memory Strategy

Use file memory, not chat memory:

- `docs/TODAY-EXECUTION.md` for current plan and ownership.
- `docs/PROJECT-STATUS.md` for what shipped.
- `docs/QUALITY-GAP-MATRIX.md` for branch-level quality gaps.
- `docs/ASSET-SOURCING.md` for asset candidates.
- `docs/QA-CHECKLIST.md` for visual acceptance.

Update docs only with short factual deltas. Do not paste long chat summaries.

## Claude Agent Template

```text
You are working in /Users/ahmedjawed/Documents/Kids Learning app.

Read only:
- CLAUDE.md
- docs/TODAY-EXECUTION.md
- docs/QUALITY-GAP-MATRIX.md only for the assigned branch
- docs/QA-CHECKLIST.md only if verifying UI

Task:
[one concrete task]

Ownership:
[exact files or directories]

Rules:
- Do not edit outside ownership.
- Do not revert other changes.
- Do not browse unrelated files.
- Keep token usage low.
- If blocked by another file, stop and report.

Acceptance:
- visible cause/effect interaction where applicable;
- shared toolbar preserved;
- no desktop/mobile clipping;
- minimal verification run;
- final report under 15 lines.
```

## End-Of-Run Report Format

```text
Changed:
- path

Verified:
- command or screenshot

Remaining:
- short blocker or next step
```
