/**
 * F1 codegen — content/(json|md) → generated src/data/*.ts
 *
 * Reads authored component dirs under content/subjects/<subject>/<branch>/<component>/,
 * filters to a focus branch (default 'human-physiology'), validates each authored file
 * against the shared Zod schema (src/lib/schema/content.ts), normalizes module.json +
 * lesson.md + model-metadata.json + quiz.json into a completed ComponentContent, and emits a
 * TS module under src/data/generated/.
 *
 * The enrichment seed (seeds/enrichment.ts) supplies the handful of app-layer fields authored
 * content does not yet carry — hotspot color, hotspot.function, didYouKnow, conditions,
 * scientificName, tagline, compareCandidate/compareReason. See docs/F1-AUDIT §(f). The seed is
 * the explicit placemark until those fields are absorbed into authored content.
 *
 * Usage:  npm run codegen [branch-or-id] [subject]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  moduleFileSchema,
  modelMetadataFileSchema,
  quizFileSchema,
  componentContentSchema,
} from '../../src/lib/schema/content.ts'
import { ENRICHMENT } from './seeds/enrichment.ts'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '../../../content/subjects')
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../../src/data/generated')
const DEFAULT_HOTSPOT = '#C08868'

function readJson<T>(p: string): T {
  return JSON.parse(readFileSync(p, 'utf8')) as T
}
function isDir(p: string): boolean {
  try {
    return statSync(p).isDirectory()
  } catch {
    return false
  }
}
function readDirs(p: string): string[] {
  return existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []
}

function humanize(s: string): string {
  return s.replace(/[-_]/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase())
}

function branchLabel(mod: Record<string, any>, fallback: string): string {
  return mod.branch ?? mod.hierarchyPath?.branch ?? humanize(fallback)
}

function splitBelongsTo(mod: Record<string, any>): string[] {
  if (Array.isArray(mod.belongsTo)) return mod.belongsTo
  if (typeof mod.belongsTo === 'string') {
    return mod.belongsTo.split('>').map((x: string) => x.trim()).reverse()
  }
  const h = mod.hierarchyPath
  const parts: string[] = []
  if (h?.systemOrGroup) parts.push(h.systemOrGroup)
  if (h?.branch) parts.push(h.branch)
  if (h?.subject) parts.push(h.subject)
  return parts.filter(Boolean)
}

/** Parse the §6 8-step lesson flow + predict/practice/checkpoint out of lesson.md. */
function parseLesson(md: string, fallbackTitle: string) {
  const steps: { title: string; body: string }[] = []
  const order = ['See it', 'Touch it', 'Name it', 'Explain what it does', 'See where it belongs', 'Compare it', 'Use it in a task', 'Review it later']
  const lines = md.split(/\r?\n/)
  let title: string | null = null
  let body: string[] = []
  let predictionPrompt = ''
  let practiceItem = ''
  let checkpoint = ''

  const flush = () => {
    if (title) steps.push({ title: title.startsWith('Step') ? title : title, body: body.join(' ').trim() })
    title = null
    body = []
  }

  for (const raw of lines) {
    const heading = raw.match(/^##\s+\d+\.\s+(.*)$/) // `## 1. See it`
    if (heading) {
      flush()
      title = heading[1].trim()
      continue
    }
    const predict = raw.match(/^\*\*\s*Prediction\s*prompt:\s*\*\*\s*(.*)$/i)
    if (predict) {
      predictionPrompt = predict[1].trim()
      continue
    }
    const practice = raw.match(/^\*\*\s*Practice\s*item:\s*\*\*\s*(.*)$/i)
    if (practice) {
      practiceItem = practice[1].trim()
      continue
    }
    const check = raw.match(/^\*\*\s*Checkpoint:\s*\*\*\s*(.*)$/i)
    if (check) {
      checkpoint = check[1].trim()
      continue
    }
    if (title && raw.trim() && !/^#{1,4}\s/.test(raw) && !/^\*\*/.test(raw) && raw.trim() !== '---') {
      body.push(raw.trim())
    }
  }
  flush()

  return {
    steps: steps.length ? steps : [{ title: fallbackTitle, body: md.split('\n').slice(0, 4).join(' ') }],
    predictionPrompt,
    practiceItem,
    checkpoint,
  }
}

function compose(dir: { subject: string; branch: string; id: string; path: string }) {
  const mod = moduleFileSchema.parse(readJson(join(dir.path, 'module.json')))
  const seed = ENRICHMENT[mod.id] ?? ENRICHMENT[dir.id] ?? {}

  const lessonMdPath = join(dir.path, 'lesson.md')
  const lessonMd = existsSync(lessonMdPath) ? readFileSync(lessonMdPath, 'utf8') : ''
  const lesson = lessonMd
    ? parseLesson(lessonMd, mod.title)
    : { steps: [], predictionPrompt: '', practiceItem: '', checkpoint: '' }

  const meta = existsSync(join(dir.path, 'model-metadata.json'))
    ? modelMetadataFileSchema.parse(readJson(join(dir.path, 'model-metadata.json')))
    : undefined
  const quiz = existsSync(join(dir.path, 'quiz.json'))
    ? quizFileSchema.parse(readJson(join(dir.path, 'quiz.json'))).questions
    : []

  const hotspots = (meta?.hotspots ?? []).map((h: any) => ({
    id: h.id,
    label: h.label,
    position: h.position,
    color: h.color ?? seed.hotspots?.[h.id]?.color ?? DEFAULT_HOTSPOT,
    description: h.description ?? '',
    function: h.function ?? seed.hotspots?.[h.id]?.function ?? `${h.label ?? h.id}.`,
  }))

  const compareRaw = typeof mod.compareCandidate === 'string' ? mod.compareCandidate : ''
  const compareObj = typeof mod.compareCandidate === 'object' && mod.compareCandidate
    ? mod.compareCandidate
    : null

  return componentContentSchema.parse({
    id: dir.id,
    name: mod.name ?? mod.title,
    scientificName: mod.scientificName ?? seed.scientificName ?? '',
    subject: mod.subject,
    branch: branchLabel(mod, dir.branch),
    system: mod.system ?? mod.hierarchyPath?.systemOrGroup ?? seed.system ?? '',
    model: typeof mod.model === 'string' ? mod.model : meta?.url ?? '',
    tagline: mod.tagline ?? seed.tagline ?? '',
    summary: mod.summary ?? '',
    keyFacts: mod.keyFacts ?? [],
    whyItMatters: mod.whyItMatters ?? seed.whyItMatters ?? '',
    didYouKnow: mod.didYouKnow ?? seed.didYouKnow ?? '',
    belongsTo: splitBelongsTo(mod),
    conditions: mod.conditions ?? seed.conditions ?? [],
    visual: meta?.visual,
    hotspots,
    lesson,
    quiz,
    compareCandidate: mod.compareCandidateId ?? seed.compareCandidate ?? compareRaw,
    compareReason: mod.compareReason ?? seed.compareReason ?? compareObj?.description ?? '',
  })
}

function main() {
  const subjectArg = process.argv[3]
  const branch = process.argv[2] ?? 'human-physiology'
  const focus = branch
  const found: { subject: string; branch: string; id: string; path: string }[] = []
  for (const subject of readDirs(ROOT)) {
    for (const b of readDirs(`${ROOT}/${subject}`)) {
      for (const id of readDirs(`${ROOT}/${subject}/${b}`)) {
        const path = `${ROOT}/${subject}/${b}/${id}`
        if (existsSync(join(path, 'module.json'))) found.push({ subject, branch: b, id, path })
      }
    }
  }

  const filtered = found.filter(
    (d) =>
      (d.branch === branch || d.id === branch) &&
      (subjectArg ? d.subject === subjectArg : true),
  ).sort((a, b) => a.id.localeCompare(b.id))

  if (!filtered.length) {
    console.error(`codegen: no authored components for branch/id "${branch}"${subjectArg ? ` (subject ${subjectArg})` : ''}`)
    console.error('available branches:', [...new Set(found.map((f) => f.branch))].join(', '))
    process.exit(1)
  }

  const components = filtered.map(compose)
  const varName = branch === 'human-physiology' ? 'physiologyProcesses' : branch.replace(/[-/]/g, '_')
  const byIdName = varName === 'physiologyProcesses' ? 'physiologyProcessById' : `${varName}ById`

  const code =
    `/* eslint-disable */\n// @generated by scripts/codegen — do not edit by hand.\n` +
    `// Source: content/subjects/** (content/ is the single source of truth). Available: npm run codegen\n\n` +
    `import type { ComponentContent } from '../types'\n\n` +
    `export const ${varName}: ComponentContent[] = [\n` +
    components.map((c) => '  ' + JSON.stringify(c, null, 2).replace(/\n/g, '\n  ')).join(',\n\n') +
    `\n];\n\n` +
    `export const ${byIdName} = Object.fromEntries(\n` +
    `  ${varName}.map((p) => [p.id, p]),\n` +
    `) as Record<string, ComponentContent>\n`

  mkdirSync(OUT_DIR, { recursive: true })
  const file = join(OUT_DIR, `${branch.replace(/[-/]/g, '_')}.ts`)
  writeFileSync(file, code)
  console.log(`codegen: wrote ${components.length} component(s) → ${file}`)
}

try {
  main()
} catch (e) {
  console.error('codegen:', (e as Error).message)
  process.exitCode = 1
}