# Wave 25 Navigation / Coverage Audit

Date: 2026-08-18. Read-only, code-based audit. Every claim below is sourced from the exact files
listed — no completion percentages were copied from prior audit docs.

Route table source: `quantaora-app/src/App.tsx` (lines 34–66).
Branch → route source of truth: `quantaora-app/src/data/hierarchy.ts` (`HIERARCHY`).

## 1. Route table (`App.tsx`)

Top level: `/` (Landing), `/first-flight` (FirstFlight).
Under `/app` (AppShell layout, `App.tsx:37-63`):
`index` (Explore), `subjects` (Subjects), `labs` (Labs), 19 static `labs/<slug>` dedicated-lab
routes, `labs/branch/:branchId` (BranchLab, generic), `notebook` (Notebook), `grownups` (Grownups).

The 19 static dedicated-lab routes and the file each renders:
`labs/molecules`→ChemistryLab.tsx, `labs/reactions`→ChemicalReactionsLab.tsx, `labs/atoms`→AtomsLab.tsx,
`labs/orbit`→SpaceLab.tsx, `labs/functions`→MathLab.tsx, `labs/math-manipulatives`→MathManipulativesLab.tsx,
`labs/number-sense`→NumberSenseLab.tsx, `labs/motion`→PhysicsLab.tsx, `labs/energy`→EnergyLab.tsx,
`labs/electricity`→ElectricityLab.tsx, `labs/physiology`→PhysiologyLab.tsx, `labs/cells`→CellLab.tsx,
`labs/stars`→StarsLab.tsx, `labs/galaxies`→GalaxyLab.tsx, `labs/moons`→MoonsLab.tsx,
`labs/genetics`→GeneticsLab.tsx, `labs/ecology`→EcologyLab.tsx, `labs/plants`→PlantsLab.tsx,
`labs/microbiology`→MicrobiologyLab.tsx. Plus `/app` index → Explore.tsx (the Human Anatomy lab).

## 2. Branch → route mapping (`hierarchy.ts`)

23 branches carry `status: 'live'` and a `route`. All 23 routes are one of the 20 dedicated paths
above (`/app` + the 19 `labs/<slug>` paths) — **none** of the 23 live branches' canonical `route`
field points at the generic `labs/branch/:branchId` path:

- Biology (7 live): cell-biology→`/app/labs/cells`, human-anatomy→`/app`, human-physiology→`/app/labs/physiology`,
  genetics→`/app/labs/genetics`, ecology→`/app/labs/ecology`, plants→`/app/labs/plants`,
  microbiology→`/app/labs/microbiology`.
- Chemistry (4 live): atoms-and-elements→`/app/labs/atoms`, periodic-table→`/app/labs/atoms` (shared),
  molecules-and-bonding→`/app/labs/molecules`, chemical-reactions→`/app/labs/reactions`.
- Math (5 live): number-and-arithmetic→`/app/labs/number-sense`, fractions-and-ratios→`/app/labs/math-manipulatives`,
  algebra→`/app/labs/functions`, geometry→`/app/labs/math-manipulatives` (shared),
  data-and-statistics→`/app/labs/math-manipulatives` (shared).
- Physics (3 live): mechanics→`/app/labs/motion`, energy→`/app/labs/energy`, electricity→`/app/labs/electricity`.
- Space (4 live): solar-system→`/app/labs/orbit`, stars→`/app/labs/stars`, galaxies→`/app/labs/galaxies`,
  moons→`/app/labs/moons`.

28 branches are non-live (`authored-pending` or `planned`) across the 51 total branches in
`HIERARCHY` (12 biology, 10 chemistry, 9 math, 10 physics, 10 space = 51 total; 51 − 23 = 28
non-live).

## 3. Landing (`Landing.tsx` → its 9 child components) CTA trace

`Landing.tsx` renders: Nav, Hero, StudioSection, TutorSection, SubjectsSection, CurriculumSection,
LocalProgressSection, ParentSection, FinalCta, Footer.

| Component | CTA text | Destination | Lands on |
|---|---|---|---|
| `Nav.tsx:50` | "Try a demo lab" | `/app/labs/branch/atoms-and-elements` | **Generic BranchLab**, not the dedicated AtomsLab.tsx |
| `Nav.tsx:55` | "Start your mission" | `/first-flight` | FirstFlight onboarding |
| `Hero.tsx:54` | "Start your first mission" | `/first-flight` | FirstFlight onboarding |
| `Hero.tsx:60` | "Try a demo lab" | `/app/labs/branch/atoms-and-elements` | **Generic BranchLab**, not AtomsLab.tsx |
| `SubjectsSection.tsx:74` (all 5 subject cards: Physics/Chemistry/Math/Biology/Space) | "Explore {subject}" (whole-card link) | `/app/labs` | Labs.tsx index, **always opens with the Biology accordion** (`Labs.tsx:181` `useState<SubjectId \| null>('biology')` is a hardcoded default, not subject-aware) regardless of which subject card was clicked |
| `StudioSection.tsx` | none (static feature tiles) | — | — |
| `TutorSection.tsx` | none (static "how it works" stages) | — | — |
| `CurriculumSection.tsx` | none (static mock curriculum-map panel with hardcoded 82/64/41/18% bars) | — | — |
| `LocalProgressSection.tsx` | none (static privacy bullets) | — | — |
| `ParentSection.tsx:28` | "Open the parent zone" | `/app/grownups` | Grownups.tsx (built) |
| `FinalCta.tsx:22` | "Start First Flight" | `/first-flight` | FirstFlight onboarding |
| `Footer.tsx` | none | — | — |

**Finding:** `SubjectsSection.tsx` lists specific lab-sounding items per card (e.g. "Motion Lab: cart
& friction", "Molecule Builder: water, CO₂, methane", "Function Studio: slope & intercept", "Orbit
Sandbox: mass & distance", "Heart: chambers & blood flow") but the whole card is one `Link` to the
generic `/app/labs` index (`SubjectsSection.tsx:74`), not to any specific lab — and it does not even
open the matching subject's accordion once there.

## 4. FirstFlight (`FirstFlight.tsx`) → recommended lab trace

`FirstFlight.tsx:8-56` defines a local `SUBJECTS` array (independent of `hierarchy.ts`) with a
`firstLab` per subject, used by `recommendLab()` (`FirstFlight.tsx:66-74`) to pick where "Start
first lab" (`FirstFlight.tsx:276-284`, mobile duplicate `FirstFlight.tsx:311-319`) navigates:

| Subject | `FirstFlight.tsx` firstLab | Canonical `hierarchy.ts` route for that subject's featured branch | Match? |
|---|---|---|---|
| biology | `/app` | human-anatomy → `/app` | Match |
| chemistry | `/app/labs/atoms` | atoms-and-elements → `/app/labs/atoms` | Match |
| math | `/app/labs/branch/geometry` | geometry → `/app/labs/math-manipulatives` | **Mismatch — lands on generic BranchLab, not MathManipulativesLab.tsx** |
| physics | `/app/labs/electricity` | electricity → `/app/labs/electricity` | Match |
| space | `/app/labs/orbit` | solar-system → `/app/labs/orbit` | Match |

Math is the only one of 5 FirstFlight subjects whose "recommended start" CTA diverges from its own
branch's dedicated lab. Any learner whose weakest confidence subject is Math is routed to the
generic BranchLab template instead of the purpose-built MathManipulativesLab.tsx (2,360 lines of
bespoke geometry/fractions/statistics UI, per `wc -l`) that Subjects.tsx/Labs.tsx would otherwise
send them to.

## 5. Subjects.tsx and Labs.tsx accordions

Both files iterate `HIERARCHY` and use `branch.route` directly (`Subjects.tsx:157`,
`Labs.tsx:87,395`), so **every** live-branch CTA in both accordions lands on its dedicated route —
23 CTAs in Subjects.tsx, 23 in Labs.tsx (46 total), 0 landing on generic BranchLab, 0 locked.

Non-live branches:
- `Subjects.tsx:194-203` renders them as a disabled, non-`Link` div with a Clock icon and the
  literal text **"Coming soon"** (no distinction between `authored-pending` vs `planned` status
  here — both get the same "Coming soon" label).
- `Labs.tsx`'s `liveBranchRows()` (`Labs.tsx:40-89`) filters to `status === 'live'` only, so
  **Labs.tsx never displays the 28 non-live branches at all**, not even as locked placeholders —
  they exist only in Subjects.tsx.

## 6. BranchLab.tsx (generic fallback) — who actually lands there, and how

`BranchLab.tsx` renders `content/model` from `branchComponents(branchId)`
(`src/data/branchModules.ts:26-49`, which has an entry for every one of the 23 live branch ids,
so it never renders empty for a live id) through a **generic** `GenericViewer` +
`resolveBranchAssetPresentation()` (`branchLabAssetPresentation.ts`) pipeline — a materially
different, less specialized UI than the bespoke dedicated labs (e.g. AtomsLab.tsx has a custom
periodic-table grid + orbital Canvas; MathManipulativesLab.tsx has custom geometry/fraction
manipulatives; BranchLab.tsx has neither, only single-model + hotspot viewing).

In-app links to `/app/labs/branch/:branchId` (grepped across `src/`, excluding tests):
- `Nav.tsx:50` → hardcoded `atoms-and-elements`
- `Hero.tsx:60` → hardcoded `atoms-and-elements`
- `FirstFlight.tsx:37` → hardcoded `geometry`

No other file links into this route. Both `atoms-and-elements` and `geometry` **already have**
dedicated flagship routes (`/app/labs/atoms`, `/app/labs/math-manipulatives`) that Subjects.tsx and
Labs.tsx correctly use — so all 3 in-app entry points to BranchLab.tsx bypass an existing, richer,
purpose-built lab in favor of the generic template. The route is parametric
(`:branchId`) and would technically work for all 23 live branch ids, but 21 of the 23
(everything except atoms-and-elements/geometry) have **no discoverable in-app link at all** into
this route — reachable only by typing the URL directly (e.g. `/app/labs/branch/mechanics`).

## 7. "Coming soon" / locked / status-badge grep across `src/`

Grep for `coming soon`, `locked`, `"new"`/`>new<`, `comingSoon` (case-insensitive) across
`quantaora-app/src/**/*.{ts,tsx}`, excluding `*.test.ts`:

- **User-visible "Coming soon" badge**: `Subjects.tsx:201` — shown for every non-live branch row
  (28 branches) in the Subjects accordion. Consistent: these rows are non-`Link` divs, so nothing
  is actually reachable behind the badge.
- **User-visible "Coming soon" / "Not built yet" badge**: `ContentNav.tsx:117` —
  `{b.status === 'authored-pending' ? 'Not built yet' : 'Coming soon'}`, shown in the "Other
  branches of {subject}" footer list inside every dedicated lab's left sidebar (confirmed present
  in all 19 dedicated lab files + Explore.tsx + BranchLab.tsx via `grep -l ContentNav
  src/routes/*.tsx`). Same non-`Link` div treatment — consistent with actual reachability.
- No other user-facing "Coming soon"/"locked"/"new" badge strings exist in `src/`. All other
  "locked" hits are unrelated content copy (tidally-locked moons in `data/moons.ts`, DNA-editor
  "locked" UI copy in `data/generated/genetics.ts`, a math "locked plinth" constant metaphor in
  `data/generated/{constant,algebra}.ts`, marketing copy "no locked features" in
  `ParentSection.tsx:25` / `Grownups.tsx:247`) — none are navigation-relevant.
- No badge/destination **mismatch** found: everywhere a "Coming soon"/"Not built yet" badge
  appears, the underlying branch genuinely has no built route (`status !== 'live'` or no `route`
  field), and every branch that lacks such a badge (`status === 'live'`) does resolve to a real,
  content-populated dedicated route.

## 8. Orphan-route check (every `App.tsx` route vs. discoverable entry points)

All 27 routes in `App.tsx` have at least one discoverable in-app entry point:

- `/`, `/first-flight` — reachable from Nav/Hero/FinalCta/AppShell profile icon/Grownups.tsx.
- `/app`, `/app/subjects`, `/app/labs`, `/app/notebook`, `/app/grownups` — all 5 in AppShell's nav
  (`AppShell.tsx:8-14`, both desktop and mobile nav bars).
- All 19 static `/app/labs/<slug>` routes — reachable via `branch.route` in Subjects.tsx and
  Labs.tsx for their respective live branches (§2/§5).
- `/app/labs/branch/:branchId` — reachable, but **effectively orphaned for 21 of 23 valid branch
  ids** (§6): only `atoms-and-elements` and `geometry` are ever linked to; the other 21 live
  branch ids on this route pattern are typed-URL-only.

**No fully orphaned top-level route.** One partially-orphaned route pattern
(`labs/branch/:branchId`, orphaned for 21/23 possible values).

## Summary table

| Metric | Count |
|---|---|
| Total CTAs traced (Landing + FirstFlight + Subjects.tsx + Labs.tsx) | 46 branch-accordion CTAs (23 Subjects.tsx + 23 Labs.tsx) + 9 Landing CTA links + 2 FirstFlight "Start first lab" buttons (same destination, desktop+mobile) + 5 FirstFlight-subject recommendation mappings = **62 distinct CTA/link instances traced** |
| Landing on a dedicated, fully-built lab | 46 (Subjects.tsx + Labs.tsx accordions) + 4 of 5 FirstFlight subject mappings (biology/chemistry/physics/space) + `ParentSection.tsx`→Grownups + AppShell nav's 5 links = **56** |
| Landing on generic `BranchLab.tsx` | 3 (`Nav.tsx` "Try a demo lab", `Hero.tsx` "Try a demo lab", `FirstFlight.tsx` math recommendation) — all 3 bypass an existing dedicated route for the same content |
| Landing on locked / "Coming soon" (non-navigable) | 28 non-live branches in `Subjects.tsx` (shown, not clickable); 0 in `Labs.tsx` (not shown at all) |
| Orphan routes (no in-app entry point at all) | 0 fully orphaned top-level routes; 1 route pattern (`labs/branch/:branchId`) orphaned for 21 of its 23 valid parameter values |
| Badge/destination mismatches | 0 badge-vs-content mismatches (badges accurately reflect route existence); **3 CTA-vs-destination-quality mismatches** (Nav/Hero "demo lab" and FirstFlight math path all land on the generic template instead of the richer dedicated lab that already exists for that same content) |

Additional non-badge finding: `SubjectsSection.tsx`'s 5 subject cards all route to the same
`/app/labs` index regardless of subject, and that index always opens with the Biology accordion
expanded by default (`Labs.tsx:181`), not the subject the visitor clicked.
