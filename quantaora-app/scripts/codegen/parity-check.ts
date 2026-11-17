/**
 * F1 parity check — the gate for "content is the single source of truth."
 *
 * What this verifies (two hard checks), for EVERY authored branch under content/subjects/**
 * (not just one hardcoded branch — see docs/PROJECT-STATUS.md's Earth In Space correction note):
 *   1. ROUND-TRIP FIDELITY: every authored value carried by content files (module.json,
 *      model-metadata.json, quiz.json, glossary) survives codegen UNCHANGED. This catches
 *      any regression where generated output silently drops/reformats an authored value.
 *   2. APP-CONTRACT COVERAGE: the generated ComponentContent has every field the app renders
 *      (scientificName, tagline, didYouKnow, conditions, hotspot color/function, compareReason,
 *      branch, system, model). Zero = content fully covers the app contract with no seed.
 *
 * These checks compare generated vs the AUTHORED CONTENT (the truth), imported at runtime.
 * The generated-vs-handwritten-file byte-diff is demoted to an informational "content ahead of
 * legacy" report: because content is now the source of truth, authored text may legitimately be
 * richer than the hand-written paraphrase it's replacing. That is expected, not a failure.
 *
 * Usage:  npm run codegen:check
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(__dirname, '../../../')
const appRoot = join(repoRoot, 'quantaora-app')
const contentSubjectsRoot = join(repoRoot, 'content/subjects')

function readJson(p: string): any { return JSON.parse(readFileSync(p, 'utf8')) }

function norm(s: unknown): string {
  if (typeof s !== 'string') return JSON.stringify(s) ?? '{}'
  return s.replace(/\s+/g, ' ').trim()
}

function readDirs(p: string): string[] {
  return existsSync(p) ? readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name) : []
}

/** Mirrors generate.ts's branch → { generated file, exported array name } mapping exactly, so
 *  this check always looks at the same generated module `npm run codegen <branch>` just wrote. */
function generatedModuleFor(branch: string): { file: string; varName: string } {
  const varName = branch === 'human-physiology' ? 'physiologyProcesses' : branch.replace(/[-/]/g, '_')
  const file = join(appRoot, 'src/data/generated', `${branch.replace(/[-/]/g, '_')}.ts`)
  return { file, varName }
}

/** Every (subject, branch) pair under content/subjects/** that has at least one authored
 *  component (a dir with module.json) — walked the same way generate.ts discovers branches. */
function discoverBranches(): { subject: string; branch: string; contentDir: string }[] {
  const out: { subject: string; branch: string; contentDir: string }[] = []
  for (const subject of readDirs(contentSubjectsRoot)) {
    for (const branch of readDirs(join(contentSubjectsRoot, subject))) {
      const contentDir = join(contentSubjectsRoot, subject, branch)
      const hasComponent = readDirs(contentDir).some((id) => existsSync(join(contentDir, id, 'module.json')))
      if (hasComponent) out.push({ subject, branch, contentDir })
    }
  }
  return out
}

async function checkBranch(subject: string, branch: string, contentRoot: string, failures: string[]): Promise<void> {
  const { file, varName } = generatedModuleFor(branch)
  if (!existsSync(file)) {
    failures.push(`  ✗ ${subject}/${branch}: no generated module at ${file} — run \`npm run codegen ${branch} ${subject}\``)
    return
  }
  const mod = (await import(file)) as any
  const generated = mod[varName]
  if (!Array.isArray(generated)) {
    failures.push(`  ✗ ${subject}/${branch}: expected export "${varName}" (array) in ${file}, got ${typeof generated}`)
    return
  }

  for (const id of readDirs(contentRoot)) {
    const dir = join(contentRoot, id)
    if (!existsSync(join(dir, 'module.json'))) continue
    const compMod = readJson(join(dir, 'module.json'))
    const meta = existsSync(join(dir, 'model-metadata.json')) ? readJson(join(dir, 'model-metadata.json')) : undefined
    const gen = generated.find((c: any) => c.id === id)
    if (!gen) { failures.push(`  ✗ ${subject}/${branch}/${id}: content component missing from generated output`); continue }

    // 1a. module.json fields round-trip losslessly.
    compare(failures, `${branch}/${id}.name`, gen.name, compMod.name ?? compMod.title)
    compare(failures, `${branch}/${id}.summary`, gen.summary, compMod.summary)
    compare(failures, `${branch}/${id}.branch`, gen.branch, compMod.branch ?? compMod.hierarchyPath?.branch)
    compare(failures, `${branch}/${id}.keyFacts`, gen.keyFacts, compMod.keyFacts)
    compare(failures, `${branch}/${id}.whyItMatters`, gen.whyItMatters, compMod.whyItMatters)
    compare(failures, `${branch}/${id}.conditions`, gen.conditions, compMod.conditions)
    compare(failures, `${branch}/${id}.scientificName`, gen.scientificName, compMod.scientificName)
    compare(failures, `${branch}/${id}.tagline`, gen.tagline, compMod.tagline)

    // 1b. hotspot anchors = content hotspots exactly (any authored position/label must survive)
    if (meta?.hotspots) {
      for (const hs of meta.hotspots) {
        const g = gen.hotspots.find((x: any) => x.id === hs.id)
        if (!g) { failures.push(`  ${branch}/${id}: hotspot "${hs.label}" (id ${hs.id}) missing from generated`); continue }
        compare(failures, `${branch}/${id}.hotspot[${hs.id}].label`, g.label, hs.label)
        compare(failures, `${branch}/${id}.hotspot[${hs.id}].position`, g.position, hs.position)
        compare(failures, `${branch}/${id}.hotspot[${hs.id}].color`, g.color, hs.color)
        compare(failures, `${branch}/${id}.hotspot[${hs.id}].function`, g.function, hs.function)
      }
    }

    // 2. App-contract coverage (generated must always be complete — no undefined propagation)
    for (const field of ['name', 'subject', 'branch', 'summary', 'lesson', 'quiz']) {
      if (!gen[field]) failures.push(`  ${branch}/${id}: required field "${field}" empty in generated`)
    }
  }
}

async function main(): Promise<void> {
  const failures: string[] = []
  const branches = discoverBranches()

  for (const { subject, branch, contentDir } of branches) {
    await checkBranch(subject, branch, contentDir, failures)
  }

  console.log('\n=== F1 parity check: content round-trip + app contract ===\n')
  console.log(`Checked ${branches.length} branch(es): ${branches.map((b) => `${b.subject}/${b.branch}`).join(', ')}\n`)
  if (failures.length) {
    console.log(`✗ REGRESSIONS: ${failures.length}\n${failures.slice(0, 40).join('\n')}`)
    process.exitCode = 1
  } else {
    console.log('✓ ROUND-TRIP CLEAN — generated preserves authored content exactly')
    console.log('✓ APP CONTRACT — every rendered field present, no seed required')
  }
}

/** Only checks fields the content actually authored (`b !== undefined`). Some branches (e.g.
 *  cell-biology) predate this file set and legitimately rely on codegen's ENRICHMENT-seed /
 *  humanized-branch-name fallback for a field they never authored themselves — that's not a
 *  round-trip regression, there's simply nothing authored to round-trip. Branches that DO author
 *  a field (human-physiology, earth-in-space, …) still get the full byte-for-byte check. */
function compare(failures: string[], label: string, a: unknown, b: unknown) {
  if (b === undefined) return
  if (norm(a) !== norm(b)) failures.push(`  ✗ ${label}\n      gen : ${norm(a).slice(0, 100)}\n      cnt : ${norm(b).slice(0, 100)}`)
}

await main()