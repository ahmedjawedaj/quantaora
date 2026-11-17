#!/usr/bin/env node
// Quantaora 3D asset quality gate.
//
// Standalone, non-destructive inspection of every .glb under a root directory
// (default: <app>/public/models). Never deletes, moves, or rewrites any asset.
// Zero new dependencies -- built-ins only (fs/path/crypto), plus the manual GLB
// container parser and header-only image sniffer in ./lib.
//
// Usage (from quantaora-app/):
//   node scripts/asset-quality/validate-assets.mjs
//   node scripts/asset-quality/validate-assets.mjs --root public/models/sourced
//   node scripts/asset-quality/validate-assets.mjs --root /absolute/path
//   node scripts/asset-quality/validate-assets.mjs --no-json-report
//
// See docs/3D-ASSET-QUALITY-GATE.md (repo root) for the full write-up.

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

import { parseGLB, summarizeCounts, computeBoundingBox, extractImageBytes } from './lib/glb.mjs'
import { sniffImageDimensions } from './lib/image-dims.mjs'

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url))
const APP_ROOT = join(SCRIPT_DIR, '..', '..') // quantaora-app/
const REPO_ROOT = join(APP_ROOT, '..') // repo root (parent of quantaora-app/)
const ASSET_LICENSES_MD = join(REPO_ROOT, 'docs', 'ASSET-LICENSES.md')
const COVERAGE_AUDIT_MD = join(REPO_ROOT, 'docs', 'COVERAGE-AUDIT-2026-08-18.md')

const SIZE_WARN_BYTES = 15 * 1024 * 1024 // 15MB
const TEXTURE_WARN_PX = 2048
const REQUIRED_SIDECAR_FIELDS = [
  'sourceUrl',
  'license',
  'attributionRequired',
  'redistributionStatus',
  'dateSourced',
  'fileSizeBytes',
  'sha256',
]
const DOCUMENTED_DUPLICATE_GROUPS = [
  [
    'biology/ecology/ecosystem.glb',
    'nature/quaternius-ultimate-nature/CommonTree_Autumn_1.glb',
  ],
  [
    'biology/ecology/producer.glb',
    'nature/quaternius-ultimate-nature/CommonTree_1.glb',
  ],
]

// --- CLI args -----------------------------------------------------------

function parseArgs(argv) {
  const opts = { root: join(APP_ROOT, 'public', 'models'), jsonReport: true }
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]
    if (arg === '--root') {
      opts.root = argv[i + 1]
      i += 1
    } else if (arg === '--no-json-report') {
      opts.jsonReport = false
    }
  }
  if (opts.root && !opts.root.startsWith('/')) {
    opts.root = join(process.cwd(), opts.root)
  }
  return opts
}

// --- filesystem walk ------------------------------------------------------

function findGLBFiles(root) {
  if (!existsSync(root)) return []
  const results = []
  const stack = [root]
  while (stack.length) {
    const dir = stack.pop()
    let entries
    try {
      entries = readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      const full = join(dir, entry.name)
      if (entry.isDirectory()) {
        stack.push(full)
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.glb')) {
        results.push(full)
      }
    }
  }
  return results.sort()
}

function isUnderSourced(relPath) {
  const parts = relPath.split(sep)
  return parts.includes('sourced')
}

// --- per-file inspection ---------------------------------------------------

function inspectFile(absPath, root) {
  const relPath = relative(root, absPath)
  const findings = []
  const add = (level, message) => findings.push({ level, message })

  const buf = readFileSync(absPath)
  const fileSizeBytes = buf.length
  const sha256 = createHash('sha256').update(buf).digest('hex')

  const parsed = parseGLB(buf)
  if (!parsed.valid) {
    add('error', `Invalid/unparsable GLB: ${parsed.error}`)
  }
  if (parsed.lengthMismatch) {
    add('error', `Declared GLB length (${parsed.declaredLength}) does not match actual file size (${parsed.actualLength}).`)
  }

  if (fileSizeBytes > SIZE_WARN_BYTES) {
    add('warn', `File is ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB, exceeds the 15MB budget.`)
  }

  let counts = null
  let bbox = null
  const textures = []

  if (parsed.json) {
    counts = summarizeCounts(parsed.json)
    bbox = computeBoundingBox(parsed.json)
    if (bbox?.incomplete) {
      add('warn', 'Bounding box is incomplete: at least one mesh primitive is missing POSITION accessor min/max.')
    }
    if (!bbox && counts.meshes > 0) {
      add('warn', 'Could not derive a bounding box despite the file declaring meshes.')
    }

    const images = parsed.json.images ?? []
    for (let i = 0; i < images.length; i += 1) {
      const { bytes, note } = extractImageBytes(parsed.json, parsed.binChunk ?? null, i)
      if (!bytes) {
        textures.push({ index: i, note: note ?? 'no data' })
        continue
      }
      const dims = sniffImageDimensions(bytes)
      if (dims.width && dims.height) {
        textures.push({ index: i, width: dims.width, height: dims.height, format: dims.format })
        if (dims.width > TEXTURE_WARN_PX || dims.height > TEXTURE_WARN_PX) {
          add('warn', `Texture #${i} is ${dims.width}x${dims.height}px (format ${dims.format}), exceeds the ${TEXTURE_WARN_PX}px budget.`)
        }
      } else {
        textures.push({ index: i, note: dims.note ?? 'dimensions not derivable', format: dims.format })
      }
    }
  }

  return {
    relPath: relPath.split(sep).join('/'),
    absPath,
    fileSizeBytes,
    sha256,
    parseValid: parsed.valid,
    version: parsed.version,
    chunkSummary: parsed.chunkSummary,
    counts,
    bbox,
    textures,
    findings,
  }
}

// --- sourced/** sidecar check ------------------------------------------------

function checkSidecar(fileResult) {
  const sidecarPath = fileResult.absPath.replace(/\.glb$/i, '.license.json')
  if (!existsSync(sidecarPath)) {
    return { present: false, findings: [{ level: 'error', message: `sourced/** asset is missing its provenance sidecar: ${sidecarPath.split(sep).pop()}` }] }
  }

  let sidecar
  try {
    sidecar = JSON.parse(readFileSync(sidecarPath, 'utf8'))
  } catch (err) {
    return {
      present: true,
      findings: [{ level: 'error', message: `Sidecar exists but is not valid JSON: ${err instanceof Error ? err.message : String(err)}` }],
    }
  }

  const findings = []
  const missing = REQUIRED_SIDECAR_FIELDS.filter((field) => sidecar[field] === undefined || sidecar[field] === null || sidecar[field] === '')
  const hasCreatorOrOwner = sidecar.creator !== undefined || sidecar.owner !== undefined
  if (!hasCreatorOrOwner) missing.push('creator/owner')

  if (missing.length) {
    findings.push({ level: 'error', message: `Sidecar is missing required field(s): ${missing.join(', ')}.` })
  }

  if (typeof sidecar.attributionRequired !== 'boolean' && sidecar.attributionRequired !== undefined) {
    findings.push({ level: 'warn', message: `attributionRequired should be boolean, got ${typeof sidecar.attributionRequired}.` })
  }

  if (typeof sidecar.fileSizeBytes === 'number' && sidecar.fileSizeBytes !== fileResult.fileSizeBytes) {
    findings.push({
      level: 'warn',
      message: `Sidecar fileSizeBytes (${sidecar.fileSizeBytes}) does not match actual file size (${fileResult.fileSizeBytes}).`,
    })
  }

  if (typeof sidecar.sha256 === 'string' && sidecar.sha256.toLowerCase() !== fileResult.sha256.toLowerCase()) {
    findings.push({
      level: 'error',
      message: `Sidecar sha256 (${sidecar.sha256}) does not match computed hash (${fileResult.sha256}) -- file may have changed since sidecar was written.`,
    })
  }

  return { present: true, sidecar, findings }
}

// --- ASSET-LICENSES.md coverage (legacy, non-sourced assets) ---------------

function checkLicenseRegisterRow(fileResult, licenseRegisterText) {
  if (!licenseRegisterText) return { hasRow: false, checked: false }
  const needle = `public/models/${fileResult.relPath}`
  return { hasRow: licenseRegisterText.includes(needle), checked: true }
}

function duplicateGroupKey(paths) {
  return [...paths].sort().join('\n')
}

const DOCUMENTED_DUPLICATE_KEYS = new Set(
  DOCUMENTED_DUPLICATE_GROUPS.map((paths) => duplicateGroupKey(paths)),
)

function isDocumentedDuplicateGroup(group) {
  return DOCUMENTED_DUPLICATE_KEYS.has(duplicateGroupKey(group.map((result) => result.relPath)))
}

// --- main --------------------------------------------------------------

function main() {
  const opts = parseArgs(process.argv.slice(2))
  const root = opts.root

  console.log('Quantaora 3D asset quality gate')
  console.log(`Root: ${root}`)
  console.log('')

  const glbPaths = findGLBFiles(root)
  if (glbPaths.length === 0) {
    console.log('No .glb files found under root. Nothing to check.')
    process.exit(0)
  }

  const licenseRegisterText = existsSync(ASSET_LICENSES_MD) ? readFileSync(ASSET_LICENSES_MD, 'utf8') : ''
  const coverageAuditExists = existsSync(COVERAGE_AUDIT_MD)

  const results = []
  let errorCount = 0
  let warnCount = 0

  for (const absPath of glbPaths) {
    const result = inspectFile(absPath, root)
    const sourced = isUnderSourced(result.relPath)

    if (sourced) {
      const sidecarCheck = checkSidecar(result)
      result.sidecar = sidecarCheck
      result.findings.push(...sidecarCheck.findings)
    } else {
      const licenseCheck = checkLicenseRegisterRow(result, licenseRegisterText)
      result.licenseRegister = licenseCheck
      if (licenseCheck.checked && !licenseCheck.hasRow) {
        result.findings.push({ level: 'warn', message: 'No matching row found in docs/ASSET-LICENSES.md (pre-existing asset, exempt from sidecar requirement, but should still be registered).' })
      }
    }

    results.push(result)
  }

  // Duplicate hash detection (checks 6 + 8: same computation, two framings --
  // "reused content flag" and "route-level uniqueness check").
  const byHash = new Map()
  for (const result of results) {
    if (!byHash.has(result.sha256)) byHash.set(result.sha256, [])
    byHash.get(result.sha256).push(result)
  }
  const duplicateGroups = [...byHash.entries()].filter(([, group]) => group.length > 1)
  const undocumentedDuplicateGroups = duplicateGroups.filter(([, group]) => !isDocumentedDuplicateGroup(group))
  const documentedDuplicateGroups = duplicateGroups.filter(([, group]) => isDocumentedDuplicateGroup(group))

  // --- print per-file report ---
  for (const result of results) {
    console.log(`--- ${result.relPath} ---`)
    console.log(`  size: ${(result.fileSizeBytes / 1024 / 1024).toFixed(2)}MB  sha256: ${result.sha256.slice(0, 12)}...`)
    if (result.counts) {
      const c = result.counts
      console.log(`  scenes:${c.scenes} nodes:${c.nodes} meshes:${c.meshes} materials:${c.materials} textures:${c.textures} animations:${c.animations}`)
    }
    if (result.bbox && result.bbox.min) {
      const fmt = (arr) => arr.map((v) => v.toFixed(3)).join(', ')
      console.log(`  bbox min:[${fmt(result.bbox.min)}] max:[${fmt(result.bbox.max)}]${result.bbox.incomplete ? ' (incomplete)' : ''}`)
    }
    if (result.textures.length) {
      for (const tex of result.textures) {
        if (tex.width) console.log(`  texture[${tex.index}]: ${tex.width}x${tex.height} (${tex.format})`)
        else console.log(`  texture[${tex.index}]: ${tex.note}`)
      }
    }
    if (result.findings.length === 0) {
      console.log('  PASS')
    } else {
      for (const finding of result.findings) {
        const prefix = finding.level === 'error' ? 'ERROR' : 'WARN'
        console.log(`  ${prefix}: ${finding.message}`)
        if (finding.level === 'error') errorCount += 1
        else warnCount += 1
      }
    }
    console.log('')
  }

  // --- duplicate hash summary ---
  console.log('=== Duplicate content hashes (checks 6 & 8) ===')
  if (duplicateGroups.length === 0) {
    console.log('None found -- every scanned .glb has a unique sha256.')
  } else {
    for (const [hash, group] of undocumentedDuplicateGroups) {
      console.log(`ERROR: hash ${hash.slice(0, 12)}... is shared by ${group.length} files:`)
      for (const r of group) console.log(`  - ${r.relPath}`)
      errorCount += 1
    }
    for (const [hash, group] of documentedDuplicateGroups) {
      console.log(`WARN: documented duplicate hash ${hash.slice(0, 12)}... is shared by ${group.length} files:`)
      for (const r of group) console.log(`  - ${r.relPath}`)
      console.log('  Documented as intentional ecology set dressing in docs/ASSET-LICENSES.md and docs/COVERAGE-AUDIT-2026-08-18.md.')
      warnCount += 1
    }
  }
  if (coverageAuditExists) {
    console.log(`Note: docs/COVERAGE-AUDIT-2026-08-18.md is present -- cross-reference the groups above against its findings manually.`)
  } else {
    console.log('Note: docs/COVERAGE-AUDIT-2026-08-18.md not found yet -- reporting raw hash collisions only.')
  }
  console.log('')

  // --- overall summary ---
  const sourcedCount = results.filter((r) => isUnderSourced(r.relPath)).length
  console.log('=== Summary ===')
  console.log(`GLBs scanned: ${results.length} (${sourcedCount} under sourced/**, ${results.length - sourcedCount} pre-existing)`)
  console.log(`Errors: ${errorCount}`)
  console.log(`Warnings: ${warnCount}`)

  // --- optional JSON report ---
  if (opts.jsonReport) {
    const outDir = join(SCRIPT_DIR, 'report-output')
    mkdirSync(outDir, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const jsonPath = join(outDir, `asset-quality-report-${timestamp}.json`)
    const latestPath = join(outDir, 'latest.json')
    const payload = {
      generatedAt: new Date().toISOString(),
      root,
      errorCount,
      warnCount,
      duplicateGroups: duplicateGroups.map(([hash, group]) => ({
        hash,
        files: group.map((r) => r.relPath),
        documented: isDocumentedDuplicateGroup(group),
      })),
      results: results.map((r) => ({
        relPath: r.relPath,
        fileSizeBytes: r.fileSizeBytes,
        sha256: r.sha256,
        parseValid: r.parseValid,
        counts: r.counts,
        bbox: r.bbox,
        textures: r.textures,
        findings: r.findings,
        sidecar: r.sidecar ? { present: r.sidecar.present, findings: r.sidecar.findings } : undefined,
        licenseRegister: r.licenseRegister,
      })),
    }
    writeFileSync(jsonPath, JSON.stringify(payload, null, 2))
    writeFileSync(latestPath, JSON.stringify(payload, null, 2))
    console.log(`JSON report written to ${relative(process.cwd(), jsonPath)}`)
  }

  process.exit(errorCount > 0 ? 1 : 0)
}

main()
