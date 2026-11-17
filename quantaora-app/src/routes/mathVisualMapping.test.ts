import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Regression guard for Wave 11 Worker 3's task: MathManipulativesLab rendered every geometry
// component (point, line, segment, ray, angle, triangle, quadrilateral, circle, perimeter, area,
// volume) through one shared `GeometryManipulative` function, and all 5 data/stats components
// (bar-chart, data-point, line-graph, probability, table) through one shared `DataManipulative`
// function -- both barely branching on `componentId` (a couple of conditional text/number labels),
// so nearly every one of those 16 ids rendered a visually identical generic block/bar-chart
// regardless of what it was actually supposed to teach. Worker 3's task is to give each id a
// distinct, purpose-built visual.
//
// This is a static source-text/structural check (no jsdom/canvas rendering -- see
// ../routes/BranchLab.test.ts's own comment on why this repo's tests are plain node:test rather
// than a render-based harness). It does not know Worker 3's exact final file layout in advance, so
// it scans MathManipulativesLab.tsx plus any sibling component files it imports that look
// math-visual-related, and mechanically extracts "what renderer identifier is associated with each
// id" via a few common dispatch shapes (lookup record, switch/case, or componentId === 'x' branch
// immediately followed by a distinct JSX component tag). It then asserts the ids don't all
// collapse onto the same single renderer identifier -- the exact bug this guards against.
//
// Run with: node --test src/routes/mathVisualMapping.test.ts

const GEOMETRY_IDS = [
  'point', 'line', 'segment', 'ray', 'angle', 'triangle', 'quadrilateral', 'circle', 'perimeter', 'area', 'volume',
]
const DATA_IDS = ['bar-chart', 'data-point', 'line-graph', 'probability', 'table']

function srcPath(relativeToThisFile: string): string {
  return fileURLToPath(new URL(relativeToThisFile, import.meta.url))
}

const routeDir = dirname(srcPath('./MathManipulativesLab.tsx'))
const componentsExplorerDir = srcPath('../components/explorer')
const componentsMathDir = join(dirname(componentsExplorerDir), 'math')

function safeReadDir(dir: string): string[] {
  try {
    return readdirSync(dir)
  } catch {
    return []
  }
}

/** Collects MathManipulativesLab.tsx plus any sibling file whose name suggests it's one of
 *  Worker 3's new per-component math visuals, wherever it plausibly landed (src/routes or a new
 *  src/components/math directory) -- so this test doesn't hardcode a file layout the fix hasn't
 *  necessarily used. */
function collectRelevantSource(): string {
  const files: string[] = [srcPath('./MathManipulativesLab.tsx')]
  for (const dir of [routeDir, componentsMathDir]) {
    for (const name of safeReadDir(dir)) {
      if (!/\.tsx?$/.test(name)) continue
      if (!/math|geometry|visual|manipulative|chart|stat/i.test(name)) continue
      const full = join(dir, name)
      if (!files.includes(full)) files.push(full)
    }
  }
  let combined = ''
  for (const file of files) {
    try {
      combined += `\n/* --- ${file} --- */\n${readFileSync(file, 'utf8')}`
    } catch {
      // file may not exist under this candidate dir; skip
    }
  }
  return combined
}

const combinedSrc = collectRelevantSource()

/** Identifiers imported from 'lucide-react' (this route's sidebar/switcher icon set, e.g.
 *  COMPONENT_ICONS mapping each id to a Lucide icon for the ContentNav list). These are cosmetic
 *  navigation icons, not the actual on-canvas visual for a component -- a lookup record that maps
 *  ids to *these* names (e.g. `COMPONENT_ICONS`) must not be mistaken by the heuristic below for
 *  the real per-id rendering dispatch, or every id would spuriously look "distinctly mapped"
 *  merely because it has its own sidebar icon, while the actual canvas visual stayed identical. */
function extractLucideIconNames(source: string): Set<string> {
  // `[^{}]*` (not `[\s\S]*?`) deliberately can't cross into a *different* import statement's
  // braces: with a lazy `[\s\S]*?`, this previously matched from the file's FIRST `import {`
  // (unrelated, e.g. the `react` import) all the way to the lucide-react import's own closing
  // brace, silently swallowing several other imports' specifiers in between and never actually
  // capturing real lucide names like `BarChart3`/`Hash`/`Percent` -- which made every icon lookup
  // (e.g. `bar-chart: BarChart3` in COMPONENT_ICONS) look like a "real", non-icon renderer match
  // instead of being filtered out, silently reintroducing exactly the false-collapse bug this
  // exclusion exists to prevent (caught when this test still under-counted distinct renderers
  // after Worker 3's real per-id switch/case fix had landed).
  const importBlockMatch = source.match(/import\s*\{([^{}]*)\}\s*from\s*['"]lucide-react['"]/)
  if (!importBlockMatch) return new Set()
  const names = importBlockMatch[1]
    .split(',')
    .map((entry) => entry.replace(/type\s+/, '').trim())
    .filter(Boolean)
  return new Set(names)
}

const lucideIconNames = extractLucideIconNames(combinedSrc)

/** Best-effort extraction of "what renders id X" as a short identifier string, trying a few
 *  common dispatch shapes, each scanned with a global regex so a banned (icon) match can be
 *  skipped in favor of a later, real one. Returns null if no non-icon match was found (id falls
 *  through to whatever the surrounding shared function renders, unresolved by this heuristic --
 *  treated as "not distinctly mapped" by the assertions below). */
function rendererForId(id: string, source: string): string | null {
  const attempts: RegExp[] = [
    // Shape 1: lookup record entry, e.g.  point: PointVisual   or   'point': PointVisual,
    new RegExp(`['"]?\\b${escapeRegExp(id)}\\b['"]?\\s*:\\s*(\\w+)`, 'g'),
    // Shape 2: switch/case returning or rendering a distinct component, e.g.
    //   case 'point': return <PointVisual .../>
    new RegExp(`case\\s+['"]${escapeRegExp(id)}['"]\\s*:[\\s\\S]{0,300}?<(\\w+)`, 'g'),
    // Shape 3: componentId === 'id' conditional immediately gating a distinct component tag, e.g.
    //   componentId === 'point' && <PointVisual .../>   or   componentId === 'point' ? <PointVisual .../> : ...
    new RegExp(`componentId\\s*===\\s*['"]${escapeRegExp(id)}['"][\\s\\S]{0,200}?<([A-Z]\\w+)`, 'g'),
  ]

  for (const pattern of attempts) {
    let match: RegExpExecArray | null
    while ((match = pattern.exec(source)) !== null) {
      const candidate = match[1]
      // Require a PascalCase, component-like identifier. This is what actually rules out false
      // matches, not the ad hoc keyword list it replaces: Shape 1's `'id': (\w+)` regex, run
      // against a `switch (componentId) { case 'id': return <XyzVisual ... /> }` dispatcher (the
      // shape this route's real fix uses), matches `'id':` followed by whitespace/newline and
      // then captures the *next word*, which is the keyword `return` -- not the JSX tag on the
      // following line -- because `\s*` spans the newline between the case label and its body.
      // Every id's case label matches this the same way, so without this guard every id
      // collapses onto the identical non-component word "return", masking real per-id variation
      // (discovered when this test still failed 0/2 after Worker 3's real per-id switch/case fix
      // landed). Requiring PascalCase throws out `return`/other lowercase keywords uniformly,
      // letting Shape 1 correctly fail through to Shape 2's `case ... <(\w+)` match instead.
      if (!/^[A-Z]\w*$/.test(candidate)) continue
      if (lucideIconNames.has(candidate)) continue // cosmetic sidebar icon, not the canvas visual
      return candidate
    }
  }

  return null
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function distinctRendererReport(ids: string[], source: string): { renderers: Map<string, string | null>; distinctCount: number } {
  const renderers = new Map<string, string | null>()
  for (const id of ids) renderers.set(id, rendererForId(id, source))
  const distinct = new Set([...renderers.values()].filter((v): v is string => v !== null))
  return { renderers, distinctCount: distinct.size }
}

test('MathManipulativesLab (+ sibling visual components): the 11 geometry ids do not all collapse onto one shared renderer', () => {
  const { renderers, distinctCount } = distinctRendererReport(GEOMETRY_IDS, combinedSrc)
  const unmapped = [...renderers.entries()].filter(([, v]) => v === null).map(([id]) => id)

  assert.ok(
    distinctCount > 1,
    `expected the 11 geometry ids (${GEOMETRY_IDS.join(', ')}) to resolve to more than one distinct renderer identifier -- found only ${distinctCount} distinct renderer(s) across resolvable ids (unmapped/ambiguous: ${unmapped.join(', ') || 'none'}), meaning most or all still funnel through the single shared generic block/angle visual (the Wave 11 P1 finding)`,
  )
  assert.ok(
    distinctCount >= Math.ceil(GEOMETRY_IDS.length / 2),
    `expected at least half of the 11 geometry ids to have a mechanically-distinguishable distinct renderer (found ${distinctCount}); a real per-component fix should give most ids their own visual, not just a couple`,
  )
})

test('MathManipulativesLab (+ sibling visual components): the 5 previously-broken data/stats ids do not all collapse onto one shared renderer', () => {
  const { renderers, distinctCount } = distinctRendererReport(DATA_IDS, combinedSrc)
  const unmapped = [...renderers.entries()].filter(([, v]) => v === null).map(([id]) => id)

  assert.ok(
    distinctCount > 1,
    `expected the 5 data/stats ids (${DATA_IDS.join(', ')}) to resolve to more than one distinct renderer identifier -- found only ${distinctCount} distinct renderer(s) across resolvable ids (unmapped/ambiguous: ${unmapped.join(', ') || 'none'}), meaning they still all funnel through the single shared DataManipulative bar-chart visual regardless of id (the Wave 11 P1 finding for bar-chart/data-point/line-graph/probability/table)`,
  )
  assert.equal(
    distinctCount,
    DATA_IDS.length,
    `expected all 5 previously-broken data ids to each get their own distinct renderer (found ${distinctCount} distinct of ${DATA_IDS.length}); unmapped/ambiguous: ${unmapped.join(', ') || 'none'}`,
  )
})
