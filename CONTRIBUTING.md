# Contributing to Quantaora

Thank you for helping make hands-on STEM learning clearer and more accessible for children. Contributions should improve scientific accuracy, learning value, usability, accessibility, or visual quality.

## Before You Start

- Search existing issues and pull requests to avoid duplicate work.
- For a new branch, large UI change, or major 3D asset, open a proposal issue first.
- Never include learner names, analytics exports, credentials, or other personal data.
- Do not add an asset unless its source, creator, license, and redistribution terms are known.

## Set Up the Project

```bash
git clone https://github.com/ahmedjawedaj/quantaora.git
cd quantaora/quantaora-app
npm ci
npm run dev
```

Use Node.js 22 or newer. The app requires no backend for local development.

## Choose the Right Source of Truth

- Curriculum authoring belongs in `content/subjects/<subject>/<branch>/<component>/`.
- Generated curriculum modules under `quantaora-app/src/data/generated/` must be regenerated, not edited alone.
- Application behavior belongs in `quantaora-app/src/`.
- Shipped media belongs in `quantaora-app/public/` with license metadata.
- Product and quality decisions belong in `docs/`.

After changing authored curriculum, run:

```bash
cd quantaora-app
npm run codegen -- <branch> <subject>
npm run codegen:check
```

## 3D Asset Requirements

Every submitted model must be recognizable, inspectable, correctly framed, efficient enough for the web, and useful for a specific learning objective.

1. Prefer public-domain, CC0, or CC BY sources with clear redistribution rights.
2. Do not submit files with unknown provenance or licenses that prohibit redistribution.
3. Add a `.license.json` sidecar beside sourced assets.
4. Add the asset to `docs/ASSET-LICENSES.md` and `quantaora-app/src/data/modelRegistry.ts`.
5. Verify model bounds, scale, materials, textures, animation, mobile framing, and fallback behavior.
6. Run `npm run assets:check`.

See `docs/3D-ASSET-QUALITY-GATE.md` and `docs/ASSET-SOURCING.md` for the full quality bar.

## Learning Content Requirements

- Write for the learner's age without removing scientific accuracy.
- Define what the learner predicts, changes, observes, and explains.
- Connect every control to a visible result.
- Avoid generic filler, unsupported medical claims, and unsafe experiments.
- Include meaningful quiz distractors and explanations, not only the correct answer.
- Keep terminology consistent within a subject and define unfamiliar words.

## User Interface Requirements

- Preserve keyboard access, focus visibility, labels, contrast, and reduced-motion behavior.
- Test at desktop and mobile sizes.
- Keep 3D objects fully visible and provide recoverable zoom/reset controls.
- Do not hide essential learning content behind hover-only interactions.
- Match the existing visual system instead of introducing one-off patterns.

## Validate Your Change

Run the narrowest relevant test while working, then run the full gate before opening a pull request:

```bash
cd quantaora-app
npm run lint
npm test
npm run quality:gaps
npm run assets:check
npm run build
```

For visual changes, include desktop and mobile screenshots in the pull request description. Do not commit local review screenshots unless a maintainer requests a curated document asset.

## Pull Requests

- Keep each pull request focused on one coherent improvement.
- Use a descriptive title and explain the learner-facing result.
- Link the related issue.
- Document new assets and licenses.
- Add or update tests for changed behavior.
- Call out remaining limitations honestly.
- Resolve CI failures and review conversations before merge.

By contributing, you agree that your original code and documentation contributions are licensed under the MIT License. Third-party assets remain under their documented licenses.
