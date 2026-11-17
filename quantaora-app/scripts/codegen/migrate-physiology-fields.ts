/**
 * F1 absorption migration — move app-layer fields OUT of the hand-written
 * src/data/physiologyProcesses.ts and INTO the authored content files, so content/
 * becomes the single source of truth and the codegen enrichment seed can be emptied.
 *
 * This is a one-time migration. It:
 *   1. module.json := scientificName, tagline, didYouKnow, conditions, compareCandidateId,
 *      compareReason (from the hand-written app data + verified enrichment seed).
 *   2. model-metadata.json: each hotspot gains `color` and `function`, matched to the
 *      hand-written hotspot by Exact position (positions are stable authoring pivots).
 *
 * Tech note: `compareCandidate` already carries label+description in content (which is the
 * richer, correct form); the seed's compareCandidate/compareReason are the two-paragraph app
 * value. We keep content's compareCandidate object and only add a `compareReason` (the app
 * one-liner) so codegen's compareReason has an authored home too.
 *
 * Usage:  node scripts/codegen/migrate-physiology-fields.ts
 * Run BEFORE emptying seeds/enrichment.ts. Idempotent: skips values already present.
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '../../../')
const appRoot = join(repoRoot, 'quantaora-app')
const contentRoot = join(repoRoot, 'content/subjects/biology/human-physiology')

// Hand-written (stale) app data carries the app-layer fields. Import it for the migration source.
const { physiologyProcesses } = await import(join(appRoot, 'src/data/physiologyProcesses.ts')) as any
const liveById = new Map(physiologyProcesses.map((c: any) => [c.id, c]))

// From seeds/enrichment.ts — the verified app-layer values untouched by content.
import { ENRICHMENT } from './seeds/enrichment.ts'

function readJson<T>(p: string): T { return JSON.parse(readFileSync(p, 'utf8')) as T }
function writeJson(p: string, o: unknown): void { writeFileSync(p, JSON.stringify(o, null, 2) + '\n') }
const posKey = (h: any) => JSON.stringify(h.position)

let changed = 0
for (const id of readdirSync(contentRoot)) {
  const dir = join(contentRoot, id)
  const modPath = join(dir, 'module.json')
  const metaPath = join(dir, 'model-metadata.json')
  if (!existsSync(modPath)) continue

  const live = liveById.get(id)
  const seed = ENRICHMENT[id]
  if (!live && !seed) continue

  // ── module.json: absorb 4-6 app-layer fields ─────────────────────────────
  const mod = readJson(modPath)
  let modChanged = false
  const setIf = (k: string, v: any) => {
    if ((v !== undefined && v !== null && v !== '') && (mod[k] === undefined || mod[k] === '')) {
      mod[k] = v
      modChanged = true
    }
  }
  setIf('scientificName', live?.scientificName ?? seed?.scientificName)
  setIf('tagline', live?.tagline ?? seed?.tagline)
  setIf('didYouKnow', live?.didYouKnow ?? seed?.didYouKnow)
  setIf('conditions', live?.conditions ?? seed?.conditions)
  setIf('compareCandidateId', seed?.compareCandidate)
  setIf('compareReason', seed?.compareReason ?? live?.compareReason)

  // ── model-metadata.json: absorb hotspot color + function by position ─────
  let metaChanged = false
  if (live && existsSync(metaPath)) {
    const meta = readJson(metaPath)
    const liveByPos = new Map(live.hotspots.map((h: any) => [posKey(h), h]))
    for (const h of meta.hotspots ?? []) {
      const l = liveByPos.get(posKey(h))
      if (!l) { console.log(`  ⚠ ${id}: no live match at pos ${posKey(h)} (${h.label})`); continue }
      if (h.color === undefined && l.color) { h.color = l.color; metaChanged = true }
      if (h.function === undefined && l.function) { h.function = l.function; metaChanged = true }
    }
    if (metaChanged) writeJson(metaPath, meta)
  }

  if (modChanged) {
    writeJson(modPath, mod)
    changed++
    console.log(`  ✓ ${id}: module.json fields ${['scientificName','tagline','didYouKnow','conditions','compareCandidateId','compareReason'].filter(k=>mod[k]).join(',')}`)
  } else {
    console.log(`  · ${id}: no module.json drift (already absorbed or nothing to add)`)
  }
}
console.log(`\nmigrated module.json for ${changed} component(s); hotspots colored/functions added inline.`)