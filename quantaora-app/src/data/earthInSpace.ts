import type { ComponentContent } from './types'
// Explicit `.ts` extension (unusual for this app-side data layer, harmless under
// allowImportingTsExtensions/bundler resolution): this module is imported directly by
// earthInSpace.test.ts / EarthInSpaceLab.test.ts under `node --test`'s native ESM loader, which
// — unlike Vite — requires a resolvable specifier at runtime.
import { earth_in_space } from './generated/earth_in_space.ts'

// ─────────────────────────────────────────────────────────────────────────────
// Earth In Space — five interactive components covering this branch's full
// taxonomy (content/taxonomy/space.json): lowLevelItems (Axis, Rotation,
// Revolution, Tilt, Equator, Hemisphere, Orbit), processes (Day and night,
// Seasons, Moon phases, Solar eclipse, Lunar eclipse, Tides), and
// interactiveComponents (Seasons simulator, Moon phase wheel, Eclipse
// alignment model, Tide cause/effect model).
//
// All facts, lesson copy, and quiz content are authored under
// content/subjects/space/earth-in-space/<id>/ (module.json, lesson.md,
// quiz.json, model-metadata.json, glossary.json, standards.json) and
// generated into ./generated/earth_in_space.ts via `npm run codegen
// earth-in-space space` — content/ is the single source of truth, exactly
// like every other branch in BRANCH_COMPONENTS (branchModules.ts). This file
// is a thin adapter: it only adds `mode`, the one field that isn't
// factual/authorable content but a UI routing key telling EarthInSpaceLab
// and EarthSpaceViewer which simulation panel/scene to show for a component.
//
// Unlike the hotspot-on-a-body pattern used by Moons/Stars/Galaxies, this
// branch is process-driven: the "Touch it" interaction is a live physics
// simulation (independent rotation/revolution speed, tilt angle, orbit
// position, moon angle, alignment offset) rather than tapping points on a
// single model, so each entry here carries no hotspots — the simulation
// itself, in EarthSpaceViewer.tsx, is the interactive surface. The physics
// backing that simulation (src/lib/earthInSpacePhysics.ts) is a single
// shared, independently-tested module used by all five modes, so authored
// content does not duplicate it as a per-component simulation.ts. Earth and
// Moon render from the same real, already-cleared GLBs used elsewhere in
// Space (see src/data/planets.ts's earth entry and src/data/moons.ts's moon
// entry for provenance/license — both CLEAR/hero in modelRegistry.ts).
// ─────────────────────────────────────────────────────────────────────────────

export type EarthSpaceMode = 'motion' | 'seasons' | 'phases' | 'eclipses' | 'tides'

export interface EarthSpaceComponent extends ComponentContent {
  mode: EarthSpaceMode
}

const MODE_BY_ID: Record<string, EarthSpaceMode> = {
  'rotation-and-revolution': 'motion',
  'axial-tilt-and-seasons': 'seasons',
  'moon-phases': 'phases',
  eclipses: 'eclipses',
  tides: 'tides',
}

/** Fixed display order (Motion → Seasons → Phases → Eclipses → Tides) — the pedagogical
 *  progression each component's `compareCandidate` chain assumes, not the alphabetical order
 *  `npm run codegen` sorts generated output in. */
const DISPLAY_ORDER = ['rotation-and-revolution', 'axial-tilt-and-seasons', 'moon-phases', 'eclipses', 'tides']

const generatedById: Record<string, ComponentContent> = Object.fromEntries(earth_in_space.map((c) => [c.id, c]))

export const earthInSpace: EarthSpaceComponent[] = DISPLAY_ORDER.map((id) => ({
  ...generatedById[id],
  mode: MODE_BY_ID[id],
}))

export const earthInSpaceById: Record<string, EarthSpaceComponent> = Object.fromEntries(
  earthInSpace.map((c) => [c.id, c]),
)
