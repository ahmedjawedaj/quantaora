import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// Regression guard for this app's Moons hotspot-label design, covering the full history of fixes
// in MoonModel.tsx:
//
//  - Wave 15 (docs/reviews/wave14-COMBINED.md #7): hotspot label pills stacked and hid each other.
//  - Wave 17 (docs/reviews/wave16-moons.md): same-direction overlapping pairs never closed their gap.
//  - Wave 19 (docs/reviews/wave18-moons.md): the push landed a label under the fixed caption pill.
//  - Wave 21 (docs/reviews/wave20-moons.md P0): the iterative "push further along its existing
//    direction" strategy chained pushes with no concept of the stage's own `overflow: hidden` clip
//    boundary, reliably driving Enceladus's Tiger Stripes (and, at default framing, South Polar
//    Geysers too) entirely past that boundary, AND reintroducing the label-vs-label overlap on top
//    of that. Wave 21 replaced the iterative relaxation with a deterministic, single-pass,
//    stage-aware `layout()` that stacked every VISIBLE label's real measured box and clamped the
//    whole stack into a safe rectangle (see git history / this file's own prior revision for the
//    exhaustive coverage of that algorithm).
//  - Wave 23 (this wave): Wave 21's fix reduced HOW BADLY labels collided, but the underlying
//    design — one always-on text-pill label per hotspot, all shown simultaneously via
//    `labelsVisible`, positioned by 3D→2D projection — is still what created the collision problem
//    in the first place. On mobile, Enceladus's tiger-stripes and south-polar-geysers hotspots'
//    44×44 tap targets themselves (not just their labels) overlapped on screen, and the
//    later-DOM-order element always won the tap — a wrong-content bug, not just a crowding one.
//    Wave 23 REPLACES the whole "N simultaneous labels + collision math" design outright:
//      1. Compact in-canvas scene markers, one per hotspot (`data-testid="moon-marker-<id>"`,
//         `aria-label="View <label>"`), with a distinct selected/active visual state.
//      2. Cluster markers: hotspots whose projected centers land close together collapse into ONE
//         marker (`data-testid` containing "moon-marker-cluster", `data-cluster-hotspot-ids`
//         listing the collapsed ids) that does NOT pick a specific hotspot when clicked.
//      3. An external, DOM-order-independent accessible hotspot list outside the clipped 3D stage
//         (see ./moonsHotspotLabelStageBounds.test.ts) — the reliable, exact-id way to reach every
//         hotspot regardless of on-screen crowding.
//      4. At most ONE selected-hotspot label near the model at a time
//         (`data-testid="moon-selected-hotspot-label"`), not N simultaneous always-on pills.
//    This file was Wave 21's structural-guard file for the old `layout()`/`registerLabel` design;
//    it now guards the Wave 23 replacement instead, including asserting the OLD design's machinery
//    is actually gone (a design that already got rewritten once for the same underlying problem is
//    exactly the kind of thing that could silently regress back in a future "quick fix").
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
//
// Run with: node --test src/components/explorer/moonsHotspotLabelDeconfliction.test.ts

const MOON_MODEL_PATH = fileURLToPath(new URL('./MoonModel.tsx', import.meta.url))
const src = readFileSync(MOON_MODEL_PATH, 'utf8')

// A `data-testid`/`aria-label` value built from a hotspot field can reasonably be written as a
// template literal (this file's existing convention -- see the current `aria-label={`View
// ${hotspot.label}`}`) or as string concatenation (the form used in this wave's own contract
// text), and the per-item loop variable can reasonably be named `hotspot`, `h`, or anything else
// (MoonModel.tsx's own HotspotMarker uses `hotspot`; MoonsLab.tsx's list uses `h` for the same
// field -- both are equally correct). Tests match any identifier so they don't fail purely on
// which loop-variable name or which of two equally-correct JS forms the implementer picked.
function attrRegex(attr: string, prefix: string, field: 'id' | 'label'): RegExp {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const p = esc(prefix)
  const ident = '[a-zA-Z_$][\\w$]*'
  return new RegExp(
    `${esc(attr)}=\\{(?:\`${p}\\$\\{${ident}\\.${field}\\}\`|"${p}"\\s*\\+\\s*${ident}\\.${field}|'${p}'\\s*\\+\\s*${ident}\\.${field})\\}`,
  )
}

test('MoonModel: each hotspot renders a compact scene marker addressed by data-testid="moon-marker-<id>" and aria-label="View <label>", not a name-guessing/positional lookup', () => {
  assert.match(
    src,
    attrRegex('data-testid', 'moon-marker-', 'id'),
    'expected a compact hotspot marker with data-testid built from "moon-marker-" + <hotspot>.id (template literal or string concat) -- this is the exact-id addressable marker the Wave 23 redesign introduces',
  )
  assert.match(
    src,
    attrRegex('aria-label', 'View ', 'label'),
    'expected the compact marker to still carry an aria-label built from "View " + <hotspot>.label',
  )
})

test('MoonModel: the compact marker has SOME observable selected/active visual difference (class list or aria-pressed), not an identical rendering for active vs inactive hotspots', () => {
  // Best-effort/loose per this wave's brief: we cannot execute React here (no jsdom), so this only
  // checks that *some* conditional keyed off an `active`-shaped variable still drives the marker's
  // rendering, not that any particular class name is used.
  const hasAriaPressed = /aria-pressed=\{active/.test(src)
  const hasActiveConditionalClass = /active\s*&&\s*['"`]/.test(src) || /active\s*\?\s*['"`]/.test(src)
  assert.ok(
    hasAriaPressed || hasActiveConditionalClass,
    'expected the marker to expose an observable selected/active state via aria-pressed={active...} or an `active && \'...\'` / `active ? \'...\'` conditional class -- found neither',
  )
})

test('MoonModel: hotspots whose projected screen positions land close together collapse into a single cluster marker (data-testid mentioning "moon-marker-cluster") carrying data-cluster-hotspot-ids', () => {
  // `data-cluster-hotspot-ids` is checked as the primary/authoritative signal since its name is
  // mandated by the contract verbatim and its JSX attribute is unambiguous regardless of whether
  // the implementer computes the testid value inline or via an intermediate variable (e.g.
  // `data-testid={testId}` where `testId` is built from a `'moon-marker-cluster'`-containing
  // expression a few lines away) -- a plain substring search inside the `data-testid={...}`
  // attribute text itself would miss that legitimate indirection.
  assert.match(
    src,
    /data-cluster-hotspot-ids=/,
    'expected a cluster marker to carry a data-cluster-hotspot-ids attribute listing the collapsed hotspot ids',
  )
  assert.match(
    src,
    /\bmoon-marker-cluster\b/,
    'expected the literal substring "moon-marker-cluster" to appear somewhere in MoonModel.tsx (its data-testid value, however it is computed) -- this is the Wave 23 fix for the exact wave20/22 P0 (Enceladus tiger-stripes/south-polar-geysers 44x44 tap targets overlapping, later-DOM-order element always winning the tap)',
  )
})

test('MoonModel: clicking a cluster marker does not directly select a specific (guessed) hotspot id', () => {
  const clusterIdsMatch = src.match(/data-cluster-hotspot-ids=/)
  assert.ok(clusterIdsMatch, 'expected to find data-cluster-hotspot-ids to inspect its surrounding onClick handler')
  const idx = clusterIdsMatch!.index!
  // Look at a window around the cluster marker's own JSX -- generous enough to include a nearby
  // onClick attribute on the same <button>, whichever order the attributes are written in.
  const windowText = src.slice(Math.max(0, idx - 600), idx + 600)
  const onClickMatch = windowText.match(/onClick=\{[^}]*\}/)
  if (onClickMatch) {
    assert.doesNotMatch(
      onClickMatch[0],
      /onSelect\w*\(\s*(?:hotspot\.id|ids\[0\]|clusterIds\[0\]|[a-zA-Z_$][\w$]*\.id)\s*\)/,
      `expected the cluster marker's onClick NOT to call a hotspot-select-shaped callback with a single guessed id (found: ${onClickMatch[0]}) -- clicking a cluster must never silently open the wrong hotspot's content`,
    )
  }
})

test('MoonModel: at most one "moon-selected-hotspot-label" is declared in source, and it is driven by the single active-hotspot value rather than iterated once per hotspot', () => {
  const testidRe = /data-testid=(?:"moon-selected-hotspot-label"|\{"moon-selected-hotspot-label"\})/g
  const matches = [...src.matchAll(testidRe)]
  const viewerPath = fileURLToPath(new URL('./MoonViewer.tsx', import.meta.url))
  const viewerSrc = readFileSync(viewerPath, 'utf8')
  const viewerMatches = [...viewerSrc.matchAll(testidRe)]
  const total = matches.length + viewerMatches.length
  assert.ok(
    total > 0,
    'expected a data-testid="moon-selected-hotspot-label" element to exist in MoonModel.tsx or MoonViewer.tsx -- the single label shown for the active hotspot',
  )
  assert.strictEqual(
    total,
    1,
    `expected exactly one source declaration of the "moon-selected-hotspot-label" testid (found ${total}) -- multiple declaration sites would suggest it is being rendered once per hotspot again rather than once for the single active one`,
  )
  const [host, idx] = matches.length ? [src, matches[0].index!] : [viewerSrc, viewerMatches[0].index!]

  // Two independent, implementation-naming-agnostic structural signals that this element is not
  // rendered unconditionally for every hotspot (the old N-simultaneous-labels behavior):
  //  1. A `{someFlag && (...)}` conditional gate somewhere in a window around the testid -- proof
  //     it's a conditional render, not an always-on one. (The gating variable may itself be a prop
  //     like `showLabel` computed once per marker instance -- by itself this only proves "gated,"
  //     not "singular," which is why signal 2 below is also required.)
  //  2. Somewhere in the file, a single tracked id is compared against each item's own id via
  //     `someLabelOrSelectedVar === x.id` (e.g. the real `labelHotspotId === h.id`) -- since the
  //     left side is a single scalar value (not a Set/array), at most one iteration of any
  //     `.map()` over hotspots can ever satisfy it, which is what actually guarantees "at most
  //     one" rather than merely "conditionally shown."
  const gateWindow = host.slice(Math.max(0, idx - 400), idx + 50)
  assert.match(
    gateWindow,
    /\{\s*[a-zA-Z_$][\w$]*\s*&&\s*\(/,
    'expected the "moon-selected-hotspot-label" element to sit behind a `{someFlag && (...)}`-shaped conditional gate, not be rendered unconditionally for every hotspot',
  )
  assert.match(
    src,
    /\b\w*(?:[Ll]abel|[Ss]elected|[Aa]ctive)\w*\s*===\s*[a-zA-Z_$][\w$]*\.id\b/,
    'expected a singular "<labelOrSelectedVar> === <item>.id"-shaped comparison somewhere in MoonModel.tsx -- proof that at most one hotspot can ever satisfy the label-gate per render pass (a single scalar compared against each item\'s id), not an independently-true-per-item flag that could show N labels again',
  )
})

test('MoonModel: the old "always show every label at once when labelsVisible is true" mechanism is gone -- a label is no longer forced visible simply because the global labelsVisible toggle is on', () => {
  // This was the literal mechanism that made N labels simultaneously visible and thus collidable
  // in the first place (see the Wave 15-21 history above) -- the Wave 23 redesign shows at most one
  // label (the active hotspot's) plus non-overlapping compact markers, so this specific "show all"
  // conditional must not still exist verbatim.
  assert.doesNotMatch(
    src,
    /\(hovered \|\| active \|\| labelsVisible\)\s*&&\s*'opacity-100'/,
    'expected the old `(hovered || active || labelsVisible) && \'opacity-100\'` conditional (which made every hotspot\'s label pill visible simultaneously) to be gone',
  )
})

test('MoonModel: the Wave 21 N-LABEL stacking-specific machinery (items.sort by naturalTop / a placedTops array / a Map of {el, preferredSide} entries) is gone -- at most one label ever needs positioning now, so there is nothing left to stack', () => {
  // NOTE: a `layout()` closure, a `registerLabel` ref-callback, and topSafe/bottomSafe/leftSafe/
  // rightSafe stage-clamp bounds are all still perfectly legitimate in the Wave 23 design -- the
  // single remaining label still needs to clamp itself inside the stage's safe rectangle (see
  // moonsHotspotLabelStageBounds.test.ts), it just never has to negotiate space against any OTHER
  // label's box any more. This test only guards against the specifically MULTI-item machinery
  // (sorting/stacking N boxes, an array of N placed positions, an entries Map holding N {el,
  // preferredSide} pairs) coming back, not against those legitimately-reused names/concepts.
  for (const needle of [
    'items.sort((a, b) => a.naturalTop - b.naturalTop)',
    'placedTops',
    'const labelEls = useRef(new Map<string,',
    'neededHeight',
  ]) {
    assert.ok(
      !src.includes(needle),
      `expected the Wave 21 N-label stacking machinery to be fully replaced by the single-label design -- found leftover fragment: "${needle}".`,
    )
  }
})

// ─────────────────────────── Wave 24: distinct selected-hotspot feedback within a cluster ────────
//
// Wave 24 gives the single "moon-selected-hotspot-label" a way to render for the actively-selected
// hotspot even when that hotspot is currently folded into an on-canvas cluster (see
// moonsHotspotStructuralSelection.test.ts for the showLabel-gate test covering that fix directly).
// The two tests below guard the safety constraint that fix must respect: it must NOT do this by
// making the active cluster member's own marker button individually interactive again -- that would
// reintroduce the wave22 P0 (Enceladus tiger-stripes/south-polar-geysers overlapping 44x44 tap
// targets, later-DOM-order element always winning the tap). A clustered hotspot's marker must stay
// non-interactive/hidden purely because it is clustered, regardless of active state; only its label
// text is allowed to depend on `active`.

test('MoonModel: an individual hotspot marker\'s aria-hidden and click-guard stay gated on isClustered alone, not on isClustered combined with active -- letting the active member of a cluster show a distinguishing label must not also re-enable that marker\'s own individually-clickable/focusable tap target', () => {
  const hotspotMarkerStart = src.indexOf('function HotspotMarker(')
  const clusterMarkerStart = src.indexOf('function ClusterMarker(')
  assert.ok(
    hotspotMarkerStart !== -1 && clusterMarkerStart !== -1 && clusterMarkerStart > hotspotMarkerStart,
    'expected HotspotMarker\'s function body to precede ClusterMarker in MoonModel.tsx',
  )
  const hotspotMarkerSrc = src.slice(hotspotMarkerStart, clusterMarkerStart)

  const ariaHiddenMatch = hotspotMarkerSrc.match(/aria-hidden=\{([^}]*)\}/)
  assert.ok(ariaHiddenMatch, 'expected an aria-hidden={...} attribute on the individual hotspot marker button')
  assert.match(ariaHiddenMatch[1], /isClustered/, 'expected aria-hidden to still be gated on isClustered')
  assert.doesNotMatch(
    ariaHiddenMatch[1],
    /\bactive\b/,
    `expected aria-hidden to remain unconditioned on active (found: ${JSON.stringify(ariaHiddenMatch[1])})`,
  )

  const onClickMatch = hotspotMarkerSrc.match(/onClick=\{\(\)\s*=>\s*\{([\s\S]*?)\}\s*\}/)
  assert.ok(onClickMatch, 'expected an onClick={() => { ... }} handler on the individual hotspot marker button')
  assert.match(onClickMatch[1], /isClustered/, 'expected the marker\'s onClick body to still guard on isClustered')
  assert.doesNotMatch(
    onClickMatch[1],
    /\bactive\b/,
    `expected the marker's onClick guard to remain unconditioned on active (found: ${JSON.stringify(onClickMatch[1])}) -- otherwise tapping the active member's own dot inside a still-visually-collapsed cluster could fire a select even though its hit area still overlaps its siblings'`,
  )

  // Look at the actual code line combining isClustered with pointer-events-none (not any
  // explanatory comment line that happens to mention "pointer-events-none" in prose beforehand).
  const pointerEventsLine = hotspotMarkerSrc
    .split('\n')
    .find((line) => line.includes('isClustered') && line.includes('pointer-events-none'))
  assert.ok(
    pointerEventsLine,
    'expected a code line combining isClustered with a pointer-events-none class on the clustered marker button',
  )
  // `active` legitimately may appear AFTER pointer-events-none on this same line (e.g. gating a
  // sibling `opacity-0` class instead, so the active member becomes visible-but-non-interactive
  // rather than fully hidden) -- what must NOT happen is pointer-events-none itself being wrapped
  // in an `active`-conditioned branch, which would make the active cluster member's dot clickable
  // again some of the time.
  const beforePointerEvents = pointerEventsLine!.slice(0, pointerEventsLine!.indexOf('pointer-events-none'))
  assert.doesNotMatch(
    beforePointerEvents,
    /\bactive\b/,
    `expected pointer-events-none itself to not be gated behind \`active\` (found line: ${JSON.stringify(pointerEventsLine)})`,
  )
})

test('MoonModel: ClusterMarker renders exactly one combined tap target (a single <button>) -- clustered hotspots must never leak individually-clickable sub-targets into the on-canvas cluster marker itself, even for the actively selected member', () => {
  const clusterMarkerStart = src.indexOf('function ClusterMarker(')
  assert.ok(clusterMarkerStart !== -1, 'expected a ClusterMarker function in MoonModel.tsx')
  const nextAnchorIdx = src.indexOf('export function MoonModel', clusterMarkerStart)
  assert.ok(nextAnchorIdx !== -1, 'expected ClusterMarker to be followed by the exported MoonModel function')
  const clusterMarkerSrc = src.slice(clusterMarkerStart, nextAnchorIdx)
  const buttonCount = (clusterMarkerSrc.match(/<button\b/g) ?? []).length
  assert.strictEqual(
    buttonCount,
    1,
    `expected ClusterMarker to render exactly one <button> element (found ${buttonCount}) -- a second button here would be an individually-clickable sub-target leaking into what must stay a single combined cluster target`,
  )
})
