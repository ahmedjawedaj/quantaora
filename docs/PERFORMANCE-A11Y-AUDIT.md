# Quantaora — Performance (§27) & Accessibility (§26) Audit

Static code audit of `quantaora-app/`. No build was run; findings are from source
inspection plus the existing `dist/` output. **No app code was modified.** All paths are
relative to `quantaora-app/`.

---

## 1. Code-splitting inventory

Overall status: **Single monolithic entry bundle. No route-level code-splitting at all.**

| Item | Eager vs lazy | Evidence |
| --- | --- | --- |
| Routing (`src/App.tsx`) | **Eager** — all 14 routes imported statically | Lines 2–16. No `React.lazy`, no `Suspense`. |
| 3D lab routes (`ChemistryLab`, `SpaceLab`, `MathLab`, `PhysicsLab`, `PhysiologyLab`, `CellLab`, `StarsLab`, `GalaxyLab`) | **Eager** — all pulled via route imports | Each lab statically imports its viewer + `@react-three/fiber`, `drei`, `three`. |
| Landing hero 3D (`Landing` → `Hero` → `HeroScene.tsx`) | **Eager** — mounts a full `<Canvas>` at route `/` | `HeroScene.tsx:110` — React Three Fiber canvas renders before any lab is visited. |
| `three` / `@react-three/fiber` / `@react-three/drei` | **Eager on first paint** | Reached from both Landing (`HeroScene`) and lab viewers. Nothing forces a vendor chunk out of the entry. |
| `@react-three/postprocessing` | **Unused** | In `package.json:15` but zero imports in `src`. Dead dependency. |
| Subject data (`data/*.ts`, `data/allContent.ts`) | **Eager** — `allContent.ts:1-9` imports `cells`, `organs`, `physiologyProcesses`, `molecules`, `functions`, `planets`, `stars`, `galaxies` all statically; `App.tsx` pulls every route that imports them. | All content ships in the entry chunk. |
| GLB models (`public/models/**`, ~52 MB) | **Lazy at runtime** — `useGLTF(url)` returns a Promise and throws, suspending inside a `<Suspense>` | Every viewer wraps its model in `<Suspense>`; drei caches GLBs by URL. Fetch cost deferred, but JS cost is not. |
| Planet textures (`public/textures/**`, ~9 MB) | **Lazy via `useTexture`** | `PlanetModel.tsx:23`. Loaded when `OrbitSandbox` mounts. |
| `Environment preset="apartment"` (OrganViewer) | **Lazy** (drei fetches HDR at mount, inside `Suspense`) | `OrganViewer.tsx:58`. |
| Bundle output (`dist/`) | **One 1.8 MB JS file, zero chunks** | `dist/assets/index-…js` is the only `.js`; `du`/`ls` show no sibling chunk. Confirms no `vite manualChunks`/React.lazy. |

Key nuance: because the **landing hero is itself a three.js Canvas**, moving 3D out of the
critical path is not simply "lazy-load the lab routes" — `three`/fiber/drei are already forced
into the entry by `HeroScene`. Landing and every lab share the same vendor cost.

---

## 2. Accessibility checklist vs spec §6

| Criterion | Status | Findings |
| --- | --- | --- |
| Visible focus | **Pass** | Global `:focus-visible { outline: 2px solid var(--color-brand) }` in `index.css:91`. Real `<button>`/`<Link>`/`<input>` focus ring applies everywhere. |
| Keyboard navigation | **Mixed** | Native buttons/links/`ContentNav`(): good. `ProcessDiagram.tsx:82-115` uses `role="button" tabIndex={0}` + Enter/Space — good. **Gaps:** `LinearGraph.tsx:175-202` drag handles are mouse/pointer-only SVG `<circle>` with no `role`, no keyboard handler, no `tabIndex`; `OrbitSandbox.tsx` planet selection group uses `onClick` on a `<group>` only (but each planet also has a real name button, so a path exists). |
| Reduced motion | **Partial** | CSS block at `index.css:101-108` disables CSS animations/transitions under `prefers-reduced-motion`. **Gaps:** (a) framer-motion modal/hero animation (`Modal.tsx:78-88`) is rAF-driven JS, not CSS — the block does **not** stop it (needs `MotionConfig reducedMotion`); (b) all R3F `useFrame` turntables (`autoRotate` default **true** in every lab) keep spinning regardless of the media query. |
| Canvas fallback / parallel structure list | **Missing** | The 3D canvas has no textual/SVG fallback and no structural key when WebGL is unavailable or motion is reduced. Hotspots exist only as in-canvas `<Html>` markers. |
| Modal focus trap + Escape | **Pass** | `ui/Modal.tsx` implements Escape (line 30), focus wrapping (34-48), restores focus (55), `role="dialog" aria-modal aria-label`, `tabIndex={-1}`, `body` scroll lock. **Minor:** initial focus is the dialog container, not first control; background is not `inert`; `QuizModal.tsx:121-144` sets answered options `disabled:true`, which yanks them out of tab order mid-flow. |
| ARIA on icon buttons / hotspots | **Mostly pass** | Hotspots are **real focusable `<button>`s** (`h-11 w-11`, `aria-label="View {label}"`) in `CellModel.tsx:176-200`, `OrganModel.tsx:31-62`, `StarModel.tsx:132-164`, `GalaxyModel.tsx:318-348`, `MoleculeViewer.tsx:26-33`, `CellViewer.tsx:26-34` — good. Tooltip reveal is hover-only (`onMouseEnter`); keyboard focus never shows the label (aria-label still announces). |
| 44px touch targets | **Mixed** | Hotspot pins **44×44** ✓; `CanvasControls.tsx` rail ✓. **Under-sized:** `OrbitSandbox.tsx:95-102` name pills `px-2 py-0.5`; `ContentNav.tsx:94-98,123-127` tiny `py-1.5` links; filter chip focuses small 10px controls. |
| Color not the only signal | **Pass** | Quiz correct/incorrect conveyed by color **and** `Check`/`X` icon **and** text (`QuizModal.tsx:141-157`). ProcessDiagram uses fill+stroke+number+Thin. Custom shaders belt-and-braces. |
| Contrast | **Not measured** — flagged | Many 10–11px `text-[color:var(--color-ink-500)]` strings on `paper` (`ContentNav`, pills, grid labels). `ink-500` is a mid-tone neutral; likely below ~4.5:1 at small text. Needs an actual contrast tool pass on the token level. |

---

## 3. Concrete recommendations (minimal, file-scoped)

### (a) Code-split routes so `three`/fiber/drei only parse on lab/explore
- `src/App.tsx` — convert every `import Route from './routes/X'` to `const X = lazy(() => import('./routes/X'))`; wrap `<Routes>` in a single top-level `<Suspense fallback={…}>` (or per-`<Route>`).
- Because **Landing mounts three too**, add a last piece: in `src/components/landing/Hero.tsx:5` make `HeroScene` lazy: `const HeroScene = lazy(() => import('./HeroScene'))` inside the existing viewer `Suspense`. Otherwise `three` stays in the entry chunk and the lazy lab routes spin a "shared vendor" chunk that still loads at startup.
- (Optional) `vite.config.ts` add `build.rollupOptions.output.manualChunks: { three: ['three','@react-three/fiber','@react-three/drei','three-stdlib'] }` so the vendor cost is one cacheable chunk, not duplicated.
- `package.json` — drop `@react-three/postprocessing` (unused → removes dead weight).

### B. Lazy-load GLB models with Suspense (already mostly done — finish it)
- GLBs are **already lazy** via `useGLTF` + `<Suspense>` in every viewer; nothing to add for the suspense itself.
- Add **prefetch on mount**: in each viewer for `lab` memo, call `useGLTF.preload(content.model)` (and `useTexture.preload` for `PlanetModel` textures). drei module-caches by URL, so this warms the next model and re-emits zero duplicate fetches.
- Give the `Suspense fallback={null}` cases (`MoleculeViewer.tsx:68`, `CellViewer.tsx:81`) a visible `<Html>` "Loading…" like the others, so the reduced total isn't a blank canvas with no signal.

### (c) Dispose geometry/material on scene-switch
- `StarModel.tsx` (`GlbStar` line 377-383, `ProceduralStar` 655-660) and `GalaxyModel.tsx` (457-458) already dispose. Do the same in the other two GLB cloners:
  - `src/components/explorer/OrganModel.tsx` — in `OrganModel`/`model` `useMemo`, add `useEffect(() => () => {})` cleanup that traverses the **cloned** tree and calls `dispose()` on the created materials.
  - `src/components/explorer/CellModel.tsx` — in `GlbCell` (line 234-311), add the same cleanup for the new `MeshPhysicalMaterial`s created there (229-273). **Do not `dispose()` the cloned geometry** — it’s shared with drei’s cached GLB (`scene.clone(true)` shares geometry/attributes); disposing it would poison the cache. Only the per-clone materials.
- Views or the react adjacent: swap to `<mesh>` with `onUnmount`.

### (d) Least-friction parallel structure list for hotspots
- Add a "Spotlight key" — a DOM list of the same `content.hotspots` as real `<button>`s — rendered in the existing right-hand `DetailPanel`/sidebar (or a small overlay on the canvas), each calling the same `onSelectHotspot(id)` already passed to viewers. This reuses the same `content.hotspots` arrays so it can never drift from the 3D markers, turns every hotspot into a keyboard+SR reachable control independent of WebGL, and doubles as the "canvas fallback" §-6 wants.
- Files: `src/components/explorer/DetailPanel.tsx` (render list) line reuse `StudioSection` pattern; no new state — the labs already own `activeHotspot`/`onSelect`.
- Optionally add `role="img"` + `aria-label`/`aria-labelledby` and a `<noscript>`/`⚠ ` fallback message on each `<Canvas>` describing the model and inviting the list.

(Mobile: `CanvasControls.tsx` / `BottomTray.tsx` are the natural home on small screens.)

---

## 4. Files to change (summary)

| File | Change |
| --- | --- |
| `src/App.tsx` | `lazy()` all routes + top-level `Suspense`. |
| `src/components/landing/Hero.tsx` | `lazy` the `HeroScene` import (required to stop three loading at `/`). |
| `vite.config.ts` | 3-way vendor `manualChunks` (optional). |
| `package.json` | Remove unused `@react-three/postprocessing`. |
| `src/components/explorer/*Viewer.tsx` | Add `useGLTF.preload`/`useTexture.preload` for the "next" content; add visible fallbacks for the two `fallback={null}`. |
| `src/components/explorer/OrganModel.tsx`, `CellModel.tsx` | Dispose per-clone materials on unmount (mirror `StarModel`). |
| `src/components/explorer/DetailPanel.tsx` | Add parallel hotspot-button list (a11y fallback + static structure). |
| `src/components/ui/Modal.tsx` | Wrap motion in `MotionConfig reducedMotion`; initial-focus first control. |
| `src/components/explorer/QuizModal.tsx` | Don't `disabled` all answered options (keep them in Tab order). |
| `src/components/explorer/LinearGraph.tsx` | Add keyboard handling (`role="slider"`, arrow keys) to drag handles. |
| `index.css` | Add `.is-reduced` handling for autoRotate/three rift turn off; verify `ink-500` small-text contrast. |