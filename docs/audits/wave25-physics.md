# Wave 25 Physics Audit — Current State (2026-08-18)

Read-only audit. All claims below are sourced directly from `quantaora-app/src/App.tsx`,
`quantaora-app/src/routes/PhysicsLab.tsx`, `EnergyLab.tsx`, `ElectricityLab.tsx`,
`BranchLab.tsx`, `quantaora-app/src/data/hierarchy.ts`, `modelRegistry.ts`,
`quantaora-app/src/data/generated/{mechanics,energy,electricity}.ts`,
`content/taxonomy/physics.json`, and `content/subjects/physics/**` as they exist right now.
No numbers are copied from prior audit docs.

## 0. Route map (from `App.tsx` lines 48–50, 60)

| Branch | Status in `hierarchy.ts` | Route | Component file |
| --- | --- | --- | --- |
| `mechanics` | `live`, componentCount 13 | `/app/labs/motion` | `PhysicsLab.tsx` |
| `energy` | `live`, componentCount 6 | `/app/labs/energy` | `EnergyLab.tsx` |
| `electricity` | `live`, componentCount 9 | `/app/labs/electricity` | `ElectricityLab.tsx` |
| `waves` | `planned` | none | — |
| `sound` | `planned` | none | — |
| `light-and-optics` | `planned` | none | — |
| `magnetism` | `planned` | none | — |
| `fluids` | `planned` | none | — |
| `heat-and-thermodynamics` | `planned` | none | — |
| `modern-physics-foundations` | `planned` | none | — |

The generic fallback route `/app/labs/branch/:branchId` (`BranchLab.tsx`) exists in `App.tsx` line
60, but it cannot serve the 7 planned branches either: `branchComponents(branchId)` (via
`src/data/branchModules.ts`) returns an empty array for any branch with no authored content, and
`BranchLab.tsx` lines 141–143 hard-`Navigate`s to `/app/labs` whenever `!activeId`. Confirmed by
directory listing: `content/subjects/physics/` contains only `electricity/`, `energy/`, and
`mechanics/` — no `waves`, `sound`, `light-and-optics`, `magnetism`, `fluids`,
`heat-and-thermodynamics`, or `modern-physics-foundations` directories exist at all. These 7
branches are **unauthored, unrouted, and unreachable** by any path, dedicated or generic.

`content/taxonomy/physics.json` confirms this at the source: `mechanics`, `energy`, and
`electricity` are the only branches marked `"detailed": true` (with `lowLevelItems` /
`interactiveComponents` transcribed from the spec); the other 7 are `"detailed": false` — not
even named low-level items exist yet to author against.

**"Coming soon" status**: `quantaora-app/src/routes/Subjects.tsx` lines 194–203 renders every
non-live branch (any branch without a route) as a disabled row with a `Clock` icon and the literal
label `Coming soon`, at `opacity-60`. This is exactly where a learner sees `waves`, `sound`,
`light-and-optics`, `magnetism`, `fluids`, `heat-and-thermodynamics`, and
`modern-physics-foundations` today — as 7 grey, unclickable "Coming soon" rows, styled identically
regardless of branch.

## 1. Mechanics — `/app/labs/motion` (`PhysicsLab.tsx`, 1715 lines)

**Components (13, all mapped, matches `hierarchy.ts` componentCount 13 and taxonomy's 13
`lowLevelItems`):** `position`, `distance`, `displacement`, `speed`, `velocity`, `acceleration`,
`force`, `mass`, `weight`, `gravity`, `friction`, `normal-force`, `momentum` — confirmed via
`COMPONENT_ICONS` (lines 130–144) and the `mechanicsReadout()` switch (lines 301–453), and each
has a full `content/subjects/physics/mechanics/<id>/{module.json,lesson.md,quiz.json,
model-metadata.json,glossary.json,standards.json}` set on disk.

**Visual type — legitimate dynamic procedural, not apparatus.** The entire scene
(`MechanicsScene` → `MechanicsRig`, lines 1043–1247+) is built from raw three.js primitives
(`boxGeometry`/`cylinderGeometry`/`coneGeometry`) positioned by a live physics integrator:
`computePhysics()` (lines 259–285, real Newtonian math — net force, friction clamp, normal force,
`F=ma`) and `stepOnce()` (lines 287–299, semi-implicit Euler integration at a fixed `RACE_STEP =
0.04s`) drive a `Cart`'s position every frame via `AnimationDriver`/`useFrame`. The 13 components
are 13 *views* into the same cart-on-a-track rig (`mechanicsMode()`, lines 165–171, maps each
component id to one of 5 modes: `force-motion`, `motion-measure`, `friction-slope`,
`gravity-weight`, `momentum-energy`), not 13 separate assets. Every `model-metadata.json` in
`content/subjects/physics/mechanics/*/` declares `"modelType": "procedural"` (verified for
`force` and `momentum`) with a placeholder `url` (e.g.
`/assets/models/mechanics/force/force.glb`) — that path does not exist under
`quantaora-app/public/` and is never loaded; `PhysicsLab.tsx` ignores the authored `model` field
entirely and renders its own procedural `<Canvas>` instead. This is correctly self-labeled content
metadata, not a broken/missing-asset situation.

Two real, PASS-reviewed sourced GLB **props** are layered in as visual dressing only (never drive
`computePhysics`/`stepOnce`, per the code comment at lines 64–66): `baseball-polyhaven.glb`
(`/models/sourced/physics-mechanics-wave2/baseball-polyhaven.glb`, CC0, `qualityTier: support`,
`modelRegistry.ts` lines 642–652) and `measuring-tape-polyhaven.glb`
(`/models/sourced/physics-mechanics-wave2/measuring-tape-polyhaven.glb`, CC0,
`modelRegistry.ts` lines 654–664) — both registered under `componentIds:
['physics-mechanics-baseball']` / `['physics-mechanics-measuring-tape']`, generic mechanics props
not tied to one taxonomy item. They only render in `motion-measure` mode (position/distance/
displacement/speed/velocity) per `TrackedBaseball` (referenced ~line 1485/1535).

**Interaction depth.** Real drag/adjust-and-observe: `TunePanel` (lines 919–1006) exposes 5 range
sliders (Applied force −30..30 N, Mass 1..20 kg, Friction 0..0.7, Slope −20..20°, Gravity 1.6..12
m/s²) that feed straight into `computePhysics`, plus a full **predict → run → check** loop
(`PREDICTION_OPTIONS`, lines 105–128; `startRace()`/`choosePrediction()`, lines 707–726) where the
learner predicts whether their cart beats a reference 5 kg cart, then watches a live two-cart race
with position/velocity history feeding a `GraphScreen`. Every hotspot tap swaps `activeHotspotId`
and re-frames the isolate view. Nothing in mechanics is static/text-only.

**Repeated visual across components?** By design, all 13 components share one cart-and-track rig
(same `Track`/`Cart`/force-arrow primitives), differentiated only by which arrows/labels are
highlighted per `mechanicsMode()`/`dim()`. This is intentional single-apparatus reuse consistent
with the taxonomy's own single MVP module (`motion-lab`), not a defect — flagged here only because
the audit brief asks to call out any visual reuse.

**Mobile reachability.** `data-lab-stage` canvas is `h-[56svh] shrink-0` on mobile,
`lg:h-auto lg:flex-1` on desktop (line 760). The desktop `ContentNav` sidebar is `hidden ...
lg:block` (line 741); mobile instead gets a horizontal-scroll chip switcher
(`lg:hidden` block, lines 855–890) calling the same `selectComponent()`. `TunePanel` is capped at
`max-h-[42svh] overflow-y-auto` with a scroll-fade hint on small screens (lines 942–946) so all 5
sliders + prediction UI remain reachable without desktop-only affordances.

**P0/P1.** Mechanics is feature-complete for its 13 taxonomy items — no P0 gap. Two taxonomy
`interactiveComponents` are not distinctly implemented: a true **projectile launcher** (parabolic
flight) and a dedicated **collision lab** (two-cart elastic/inelastic collision) — `momentum-energy`
mode races two carts and reports momentum/kinetic energy, but does not model an actual collision
event between them. P1 — mechanics already covers all 13 required low-level items; these are
taxonomy-listed *interactive components*, not *components*, so they're enrichment, not a content gap.

## 2. Energy — `/app/labs/energy` (`EnergyLab.tsx`, 1342 lines)

**Components (6, matches `hierarchy.ts` componentCount 6 and taxonomy):**
`conservation-of-energy`, `kinetic-energy`, `potential-energy`, `work`, `power`, `efficiency` —
confirmed via `COMPONENT_ICONS` (lines 74–81) and `energyReadout()` switch (lines 222–292), each
with a full authored content set on disk under `content/subjects/physics/energy/<id>/`.

**Visual type — legitimate dynamic procedural.** `EnergyRig` (lines 943–991) renders a roller-
coaster track (`CoasterTrack`) with a cart whose height follows `trackHeight(progress, factor)`
(lines 174–183, a cosine-eased descent/ascent curve) driven by `energyValues()` (lines 191–220) —
real physics: `startPotential = mgh`, `kinetic = transformed − thermal`, `efficiency = useful /
total × 100`. `EnergyBars` renders live PE/KE/heat bar-chart splits that update every tick via
`AnimationDriver`. Same single-rig-per-mode pattern as mechanics (`energyMode()`, lines 165–170:
`conservation` / `efficiency` / `forms` / `work-power`). `model-metadata.json` for
`conservation-of-energy` declares `"modelType": "simulation"` — again self-labeled correctly, and
again the authored placeholder `.glb` path is unused; `EnergyLab.tsx` builds its own Canvas.

Three real, PASS-reviewed sourced GLBs (`generator.glb`, `multimeter.glb`, `electric-stove.glb`,
all Poly Haven CC0, `modelRegistry.ts` lines 666–700, `qualityTier: hero`/`support`) are wired as
toggleable **"real-world examples"** (`energyRealWorldExamples`, `EXAMPLE_ICONS` lines 86–90) that
render *alongside* the coaster rig, not instead of it (line 995 comment) — a chip row lets the
learner switch between them while the live energy readout values annotate whichever is active.
These are genuine apparatus assets, already sourced and license-clear, not placeholders.

**Gap vs. taxonomy:** `content/taxonomy/physics.json` line 26 lists `"Pendulum energy transfer"`
as an energy `interactiveComponent`. No pendulum apparatus or pendulum-specific procedural
simulation exists anywhere in `EnergyLab.tsx` — energy transfer is taught exclusively via the
skate-ramp/coaster rig. This is the one place in Energy where the taxonomy names a specific
apparatus (a pendulum) that has neither a dynamic-procedural implementation nor a sourced 3D asset.
P1 (all 6 required low-level items are still covered by the coaster rig; the pendulum is a named
enrichment interactive component, not one of the 6 components).

**Interaction depth.** `TunePanel` (lines 658–783) exposes 7 controls (height 2–12 m, mass
1–16 kg, heat loss 0–55%, a "Perfectly elastic" checkbox, push force 5–80 N, push distance
1–10 m, transfer time 0.5–8 s) all live-feeding `energyValues()`. `GuidedChallenge` (lines
566–647) is a full predict → observe → check flow: learner drags a "predicted bounce height %"
slider, then must explicitly press "Check my prediction" against the live `returnPercent`, with a
stale-state guard (lines 572–574, 638–642) that invalidates a check once controls change again so
a wrong guess can't stay silently "correct." Real interaction depth, not static.

**Mobile reachability.** Same pattern as mechanics: `h-[56svh] shrink-0 lg:h-auto lg:flex-1`
(line 401), `ResponsiveEnergyGroup` scales the whole rig by viewport aspect (0.56/0.72/0.92,
lines 937–941), and `TunePanel`'s scroll area has an explicit `ResizeObserver`-driven "Scroll for
more" affordance (lines 695–780) specifically because a prior wave found all 7 sliders invisible
below the fold on a 390×844 viewport (comment lines 695–701) — i.e. mobile reachability was
previously broken and has since been patched with live overflow detection, not a fixed guess.

## 3. Electricity — `/app/labs/electricity` (`ElectricityLab.tsx`, 1247 lines, fully read)

**Components (9, matches `hierarchy.ts` componentCount 9 and taxonomy):** `charge`, `current`,
`voltage`, `resistance`, `circuit` (mapped to `current`/other parts — see below), `battery`,
`bulb`, `switch`, `series-circuit`, `parallel-circuit` — confirmed by directory listing
(`content/subjects/physics/electricity/` has exactly 9 subdirs: `battery`, `bulb`, `charge`,
`current`, `parallel-circuit`, `resistance`, `series-circuit`, `switch`, `voltage`).

**Visual type — legitimate dynamic procedural.** `CircuitScene` (lines 625–781) is a full circuit
simulation: `equivalentResistance = mode === 'series' ? resistance * loadCount : resistance /
loadCount`, `current = switchClosed ? voltage / equivalentResistance : 0`, `bulbPower` computed
from real series/parallel formulas (lines 958–962), and `brightness` derived from power — every
`Bulb`'s emissive glow (`glow = Math.max(0.05, Math.min(1, brightness))`, lines 259, 266–279)
updates live from that math, `CurrentParticle` spheres animate along the wire path only when
`switchClosed && animationPlaying && current > 0` (line 656). Battery/switch/bulb/resistor are
built from three.js primitives (`boxGeometry`/`sphereGeometry`/`torusGeometry`), not GLB apparatus
— by design, since the whole point is a live-reactive circuit diagram, not a photorealistic prop.

One real sourced GLB, `wire-cable-set.glb` (`/models/physics/electricity/wire-cable-set.glb`,
Poly Haven CC0, `modelRegistry.ts` lines 630–640, `qualityTier: support`, "not a single
default-framed hero drop-in... nodes must be picked apart individually") is used correctly per its
own registry caveat: `WireHarness`/`WireSegmentMesh`/`WireConnectorMesh` (lines 340–552) pull two
named sub-meshes (`cable_straight_long`, `cable_box_turn`) out of the 49-mesh kit and re-orient them
parametrically along the circuit's own wire-path data, with a `WireGlbBoundary` error boundary
(lines 574–585) that falls back to a plain procedural `<Line>` if the GLB fails to load — a
resilient, non-blocking integration.

**Interaction depth.** `Tune circuit` panel (lines ~1145–1224): series/parallel mode toggle,
switch open/closed toggle, voltage slider (1.5–12 V), resistance slider (2–20 Ω), load count
stepper (1–3 bulbs) — all live-feeding the current/brightness formulas above, with per-part click
handlers (`Battery`/`Switch`/`Bulb`/`Resistor` all call `onSelect(part)` on click, lines 189,
198, 225, 261, 295) that populate the detail panel. `PredictRunCheck` (lines 806–923) runs 4
distinct challenge scenarios (voltage↑, resistance↑, switch open, loads+ in series vs. parallel)
with a genuine predict → observe (forces the learner to actually open circuit controls and change
the value) → check (compares against a captured baseline metric) loop. This is the deepest
interaction model of the three physics labs.

**Repeated visual across components.** All 9 electricity components render the same circuit-board
scene; only `activeId`/`selectedPart` and which `CircuitPart` is highlighted change
(`PART_TO_COMPONENT`, lines 31–42, maps e.g. both `bulb-a`/`bulb-b`/`bulb-c` to the single `bulb`
component id). Same intentional single-apparatus pattern as mechanics/energy.

**Mobile reachability.** `h-[56svh] shrink-0 lg:h-auto lg:flex-1` (line 1079),
`ResponsiveCircuitGroup` scales by aspect (0.52/0.72/1, lines 619–623). Unlike mechanics/energy,
electricity has no separate mobile chip-switcher block in this file — the desktop `ContentNav`
aside is still `hidden ... lg:block` (line 1062), and on mobile the only component-switching path
visible in this file is via `HotspotMarker` taps inside the 3D scene itself (which call
`selectPart()` → `setActiveId(PART_TO_COMPONENT[part])`, lines 1037–1040) or the `PredictRunCheck`
"Open circuit controls" button. This is a narrower mobile navigation surface than mechanics/energy
(no `Component X of 9` chip strip) — worth flagging as a P1 UX gap, not a P0 blocker, since the
in-canvas hotspot taps and Tune-panel access remain functional on mobile.

## 4. Summary table

| Branch | Components (authored) | Dedicated route | Legitimate dynamic-procedural | Real-apparatus-needing-asset | "Coming soon" |
| --- | ---: | :---: | :---: | :---: | :---: |
| Mechanics | 13 | Yes (`/app/labs/motion`) | 13 / 13 | 0 | No |
| Energy | 6 | Yes (`/app/labs/energy`) | 6 / 6 | 0 (pendulum apparatus named in taxonomy, not built — no asset attempted either) | No |
| Electricity | 9 | Yes (`/app/labs/electricity`) | 9 / 9 | 0 | No |
| Waves | 0 (unauthored) | No | — | — | Yes |
| Sound | 0 (unauthored) | No | — | — | Yes |
| Light and Optics | 0 (unauthored) | No | — | — | Yes |
| Magnetism | 0 (unauthored) | No | — | — | Yes |
| Fluids | 0 (unauthored) | No | — | — | Yes |
| Heat and Thermodynamics | 0 (unauthored) | No | — | — | Yes |
| Modern Physics Foundations | 0 (unauthored) | No | — | — | Yes |
| **Total** | **28 built / 28 taxonomy-named across 3 detailed branches; 7 branches (0 components) entirely unauthored** | **3 of 10 branches routed** | **28 / 28 built components** | **0 built components are stub/placeholder apparatus** | **7 of 10 branches** |

**Headline finding:** Every one of the 28 currently-built physics components (mechanics 13 +
energy 6 + electricity 9) is a genuine dynamic-procedural simulation with live-computed physics
driving the 3D scene every frame — none are static apparatus props standing in for missing
interactivity, and none of their authored `model-metadata.json` GLB paths are actually loaded
(all three labs render fully custom `<Canvas>` scenes and ignore the placeholder `model` field).
The real gap is entirely at the branch level: 7 of 10 physics branches (waves, sound,
light-and-optics, magnetism, fluids, heat-and-thermodynamics, modern-physics-foundations) have
zero authored components, zero routes, and zero taxonomy detail (`"detailed": false` in
`content/taxonomy/physics.json`) — they are pure "Coming soon" placeholders in `Subjects.tsx`,
not partially-built or asset-blocked labs. P0 for physics as a subject is standing up any one of
those 7 branches from scratch (taxonomy detailing → content authoring → apparatus/procedural
decision → route), not fixing assets inside the 3 that already ship.
