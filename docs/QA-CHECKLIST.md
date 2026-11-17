# Quantaora QA Checklist

Purpose: give every implementation and QA agent the same visual/product bar without rereading the
whole project.

Last updated: 2026-08-17.

## Required Checks For Each Lab Slice

- Desktop default view screenshot.
- Desktop controls-open screenshot.
- One alternate concept/state screenshot.
- Mobile default view screenshot.
- No clipped canvas, hidden model, or overflow.
- Shared toolbar visible and usable.
- Zoom in/out works.
- Reset or fit view restores readable framing.
- Clean view hides overlays and leaves a way to restore UI.
- Play/Pause exists when the scene animates or simulates.
- Static scenes do not pretend to animate.
- Controls produce visible cause/effect.
- Detail text matches the visible selected component.
- No console errors during basic interaction.
- Build/lint remain clean after integration.

## Browser Viewports

Use at least:

- Desktop: `1440 x 900`
- Mobile: `390 x 844`

## Screenshot Naming

Use this pattern:

```text
[branch]-flagship-desktop.png
[branch]-controls-open-desktop.png
[branch]-[alternate-state]-desktop.png
[branch]-flagship-mobile.png
```

Save under:

`quantaora-app/review-screenshots/current-state-2026-08-17/`

## Blocking Issues

These must be fixed before a slice is accepted:

- first view is visually confusing or mostly empty;
- GLB/canvas is cut off on any side;
- toolbar overlaps the model or content;
- mobile toolbar or drawer is unusable;
- controls only change labels/numbers without visible model change;
- Play/Pause does not match actual animation behavior;
- clean view traps the user with no restore action;
- new asset has unclear or incompatible license;
- new console/runtime error appears.

## Final Verification

Run from `quantaora-app/`:

```bash
npm run lint -- --quiet
npm run build
npm run codegen:check
npm run assets:check
```

Known acceptable warnings:

- Vite large chunk warning.
- Existing Anatomy REVIEW asset warnings during normal `assets:check`.

Anything new should be treated as a regression.
