import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { moonById } from '../../data/moons.ts'

// Regression guard for this wave's P0: on mobile, Enceladus's "tiger-stripes" and
// "south-polar-geysers" hotspot 44x44 tap targets overlapped on screen, and the later-DOM-order
// element always won the tap -- tapping one hotspot's own dot opened the OTHER hotspot's content,
// and the reverse tap silently closed the panel instead of opening the correct one. This is a
// DOM-order-dependent WRONG-CONTENT bug, not merely a visual crowding bug: two overlapping
// absolutely-positioned elements compete for the same screen coordinates, and whichever element
// happens to be later in DOM order intercepts the click regardless of which one the user actually
// meant to tap.
//
// The fix (see ./moonsHotspotLabelDeconfliction.test.ts and ./moonsHotspotLabelStageBounds.test.ts
// for the companion marker/cluster/stage-bounds guards) adds an external, accessible hotspot list
// (data-testid="moon-hotspot-list", items data-testid="moon-hotspot-item-<id>") rendered as plain,
// non-overlapping DOM rows -- structurally immune to the "two absolutely-positioned elements
// compete for the same pixel" failure mode, because list rows never occupy the same screen space.
// This file is the dedicated guard for that DOM-order-independence property: every hotspot must be
// reachable by its own exact id through that list, and clicking cluster markers (hotspots whose
// projected positions land close enough to collapse into one on-canvas marker) must never guess a
// specific hotspot.
//
// Static source-text checks only, matching this repo's plain node:test + native TS type-stripping
// convention (no jsdom/WebGL harness -- see ../../routes/BranchLab.test.ts's own comment on why).
// This file cannot literally simulate a click (no DOM), so it verifies the structural property that
// *guarantees* DOM-order-independent exact-id selection: each list row's click handler must close
// over that SAME row's own iterated hotspot value, not a shared/external/positional lookup.
//
// Run with: node --test src/components/explorer/moonsHotspotStructuralSelection.test.ts

const MOONS_LAB_PATH = fileURLToPath(new URL('../../routes/MoonsLab.tsx', import.meta.url))
const moonsLabSrc = readFileSync(MOONS_LAB_PATH, 'utf8')
const MOON_MODEL_PATH = fileURLToPath(new URL('./MoonModel.tsx', import.meta.url))
const moonModelSrc = readFileSync(MOON_MODEL_PATH, 'utf8')

// Matches either template-literal or string-concat form, and any loop-variable identifier (the
// real MoonsLab.tsx list uses `h`, e.g. `data-testid={`moon-hotspot-item-${h.id}`}` -- the exact
// identifier name isn't part of the contract, only the resulting testid/aria-label string is).
function attrRegex(attr: string, prefix: string, field: 'id' | 'label'): RegExp {
  const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const p = esc(prefix)
  const ident = '[a-zA-Z_$][\\w$]*'
  return new RegExp(
    `${esc(attr)}=\\{(?:\`${p}\\$\\{${ident}\\.${field}\\}\`|"${p}"\\s*\\+\\s*${ident}\\.${field}|'${p}'\\s*\\+\\s*${ident}\\.${field})\\}`,
  )
}

/** Extracts the loop-variable identifier from a matched `data-testid={`<prefix>${IDENT.id}`}`
 *  (or string-concat) attribute, so the click-handler check below can look for that SAME
 *  identifier's `.id` being passed to the select callback, regardless of what it's named. */
function extractIdent(attrValue: string): string | null {
  const m = attrValue.match(/([a-zA-Z_$][\w$]*)\.id/)
  return m ? m[1] : null
}

test('MoonsLab: every hotspot list item carries data-testid="moon-hotspot-item-<id>" and aria-label="Select <label>" built from its OWN hotspot, addressable by exact id independent of screen position', () => {
  assert.match(
    moonsLabSrc,
    attrRegex('data-testid', 'moon-hotspot-item-', 'id'),
    'expected each hotspot list row to carry data-testid built from "moon-hotspot-item-" + <hotspot>.id',
  )
  assert.match(
    moonsLabSrc,
    attrRegex('aria-label', 'Select ', 'label'),
    'expected each hotspot list row to carry aria-label built from "Select " + <hotspot>.label',
  )
})

test('MoonsLab: each list row\'s click handler selects its OWN hotspot.id from the row\'s own map() iteration, not a shared/external index -- the structural property that makes selection DOM-order-independent', () => {
  const itemMatch = moonsLabSrc.match(attrRegex('data-testid', 'moon-hotspot-item-', 'id'))
  assert.ok(itemMatch, 'expected a moon-hotspot-item-<id> element to inspect for its onClick handler')
  const ident = extractIdent(itemMatch![0])
  assert.ok(ident, `expected to extract the row's own loop-variable identifier from its testid attribute (got: ${itemMatch![0]})`)

  const idx = itemMatch!.index!
  const windowText = moonsLabSrc.slice(Math.max(0, idx - 500), idx + 500)

  assert.match(
    windowText,
    /\.map\(/,
    'expected the hotspot list item to be produced inside a .map(...) callback over the hotspot array (per-item closure), not built from a precomputed/flattened structure that could desync from real ids',
  )
  const clickRe = new RegExp(`onClick=\\{[^}]*\\(\\s*${ident}\\.id\\s*\\)[^}]*\\}`)
  assert.match(
    windowText,
    clickRe,
    `expected the list row's onClick to call some callback with exactly \`${ident}.id\` (the row's own map() variable, matching its data-testid) -- this is what guarantees clicking row A always resolves to hotspot A's id, regardless of any on-canvas DOM/paint order (window: ${JSON.stringify(windowText.slice(0, 300))}...)`,
  )
})

test('MoonModel: clicking a cluster marker never resolves to a single specific hotspot id -- clusters exist precisely because on-canvas position alone is not a reliable way to disambiguate which hotspot was meant', () => {
  const clusterIdsMatch = moonModelSrc.match(/data-cluster-hotspot-ids=/)
  if (!clusterIdsMatch) {
    // Covered more directly (with a hard failure if entirely absent) by
    // moonsHotspotLabelDeconfliction.test.ts; this file only adds the "does it guess an id"
    // behavioral check when the cluster marker is present to inspect.
    return
  }
  const idx = clusterIdsMatch.index!
  const windowText = moonModelSrc.slice(Math.max(0, idx - 600), idx + 600)
  const onClickMatch = windowText.match(/onClick=\{[^}]*\}/)
  if (onClickMatch) {
    assert.doesNotMatch(
      onClickMatch[0],
      /onSelect\w*\(\s*(?:hotspot\.id|ids\[0\]|clusterIds\[0\]|[a-zA-Z_$][\w$]*\.id)\s*\)/,
      `expected a cluster marker's onClick to never call a select-shaped callback with a single guessed id (found: ${onClickMatch[0]})`,
    )
  }
})

test('MoonsLab: the old always-on 44x44 tap-target-per-label-pill pattern is no longer the ONLY way to reach a hotspot by exact id -- the external list is now a second, DOM-order-independent path that exists regardless of on-canvas crowding', () => {
  assert.match(
    moonsLabSrc,
    /data-testid=(?:"moon-hotspot-list"|\{"moon-hotspot-list"\})/,
    'expected MoonsLab.tsx to mount the external moon-hotspot-list -- without it, exact-id selection still depends entirely on on-canvas tap-target geometry, which is exactly what caused the wave22 P0 (wrong hotspot opened due to overlapping DOM-order-dependent tap targets)',
  )
})

test('Regression: the real Enceladus tiger-stripes / south-polar-geysers pair -- the exact wave22 P0 hotspots -- are both individually addressable by exact id, distinct from each other', () => {
  const enceladus = moonById.enceladus
  assert.ok(enceladus, 'expected an "enceladus" entry in src/data/moons.ts')
  const tiger = enceladus.hotspots.find((h) => h.id === 'tiger-stripes')
  const geyser = enceladus.hotspots.find((h) => h.id === 'south-polar-geysers')
  assert.ok(tiger, 'expected the real "tiger-stripes" hotspot to still exist on Enceladus')
  assert.ok(geyser, 'expected the real "south-polar-geysers" hotspot to still exist on Enceladus')
  assert.notStrictEqual(tiger!.id, geyser!.id, 'the two real hotspots at the heart of the wave22 P0 must have distinct ids')
  assert.notStrictEqual(tiger!.label, geyser!.label, 'the two real hotspots must have distinct labels so their external list rows/aria-labels are unambiguous')

  // The list is built generically via `.hotspots.map(...)` (asserted above) using `hotspot.id`
  // directly in both the testid and the click handler -- so this pair is covered by construction,
  // without needing a hardcoded Enceladus-specific test path. This assertion documents that
  // reasoning is grounded in real, current data rather than an assumed/synthetic pair of ids.
  assert.match(
    moonsLabSrc,
    /\.hotspots\.map\(/,
    'expected the hotspot list to iterate the active moon\'s real .hotspots array, which for Enceladus includes exactly the tiger-stripes/south-polar-geysers pair this regression is about',
  )
})

// ─────────────────────────── Wave 24: distinct selected-hotspot feedback within a cluster ────────
//
// Wave 23 (above) fixed WHICH hotspot a tap/list-click resolves to, and gave the external list a
// DOM-order-independent way to reach any hotspot by exact id, including ones folded into an
// on-canvas cluster. It left one gap: MoonModel's HotspotMarker `showLabel` prop was gated by
// `!isClustered && labelHotspotId === h.id`, which unconditionally hides the single
// selected-hotspot label (and, via `isClustered && 'pointer-events-none opacity-0'`, the whole
// marker) for ANY clustered hotspot -- including the one the user just explicitly selected from the
// external list. Net effect: selecting a clustered hotspot by exact id changed application state
// correctly, but produced literally NO on-canvas feedback distinguishing which cluster member was
// now active. Wave 24 fixes this; these tests guard both the fix and the safety constraint that the
// fix must not leak a second, individually-clickable tap target for the active cluster member back
// into the scene (see moonsHotspotLabelDeconfliction.test.ts for the dedicated tap-target guard).

const MOON_VIEWER_PATH = fileURLToPath(new URL('./MoonViewer.tsx', import.meta.url))
const moonViewerSrc = readFileSync(MOON_VIEWER_PATH, 'utf8')

test('MoonModel/MoonViewer: the single "moon-selected-hotspot-label" element displays text pulled directly from the SAME per-item hotspot object that satisfies the id-equality selection gate (a "{<var>.label}"-shaped expression), not a generic/shared/cluster-wide string -- this is what guarantees two different hotspot ids selected one at a time always show two DIFFERENT label texts, even when both belong to the same on-canvas cluster', () => {
  const testidRe = /data-testid=(?:"moon-selected-hotspot-label"|\{"moon-selected-hotspot-label"\})/
  const modelIdx = moonModelSrc.search(testidRe)
  const viewerIdx = moonViewerSrc.search(testidRe)
  const [host, idx] = modelIdx !== -1 ? [moonModelSrc, modelIdx] : [moonViewerSrc, viewerIdx]
  assert.ok(idx !== -1, 'expected a moon-selected-hotspot-label element in MoonModel.tsx or MoonViewer.tsx')

  const closeIdx = host.indexOf('</span>', idx)
  assert.ok(closeIdx !== -1, 'expected the moon-selected-hotspot-label element to be a <span>...</span> with a closing tag somewhere after its testid')
  const block = host.slice(idx, closeIdx)
  assert.match(
    block,
    /\{\s*[a-zA-Z_$][\w$]*\.label\s*\}/,
    `expected the label's visible text to be a direct "{<hotspot>.label}"-shaped expression (found block: ${JSON.stringify(block)})`,
  )
})

test('MoonModel: a hotspot\'s selected-label is not unconditionally suppressed just because that hotspot currently happens to be folded into an on-canvas cluster -- when THAT specific hotspot is the actively selected one, its own showLabel condition must still be able to become true', () => {
  const showLabelMatch = moonModelSrc.match(/showLabel=\{([^}]*)\}/)
  assert.ok(showLabelMatch, 'expected a showLabel={...} prop passed from MoonModel to HotspotMarker')
  const expr = showLabelMatch[1]
  if (/isClustered/.test(expr)) {
    assert.match(
      expr,
      /\bactive\b/,
      `expected the showLabel expression to also account for the active-hotspot state wherever it still references isClustered (found: ${JSON.stringify(expr)}) -- an expression shaped like "!isClustered && labelHotspotId === h.id" blanket-vetoes the label for EVERY clustered hotspot, including the one just explicitly selected from the external hotspot list, which is the exact Wave 24 bug being fixed`,
    )
  }
})

test('MoonModel: the selected-hotspot-label fix does not re-expose a second, individually-clickable tap target for the active member of a cluster -- its own marker button\'s tabIndex must stay gated on isClustered alone, independent of whether it is also the active hotspot', () => {
  const hotspotMarkerStart = moonModelSrc.indexOf('function HotspotMarker(')
  const clusterMarkerStart = moonModelSrc.indexOf('function ClusterMarker(')
  assert.ok(
    hotspotMarkerStart !== -1 && clusterMarkerStart !== -1 && clusterMarkerStart > hotspotMarkerStart,
    'expected to locate the HotspotMarker function body ahead of ClusterMarker in MoonModel.tsx',
  )
  const hotspotMarkerSrc = moonModelSrc.slice(hotspotMarkerStart, clusterMarkerStart)

  const tabIndexMatch = hotspotMarkerSrc.match(/tabIndex=\{([^}]*)\}/)
  assert.ok(tabIndexMatch, 'expected a tabIndex={...} attribute on the individual hotspot marker button')
  assert.match(tabIndexMatch[1], /isClustered/, 'expected the marker\'s tabIndex to still be gated on isClustered')
  assert.doesNotMatch(
    tabIndexMatch[1],
    /\bactive\b/,
    `expected the marker's tabIndex gate to remain unconditioned on active (found: ${JSON.stringify(tabIndexMatch[1])}) -- making the active member of a cluster individually focusable/tappable again would reintroduce the wave22 P0 overlapping-hit-area bug among cluster siblings`,
  )
})
