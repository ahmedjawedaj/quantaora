#!/usr/bin/env node
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative } from 'node:path'
import { spawnSync } from 'node:child_process'
import { tmpdir } from 'node:os'

const APP_ROOT = join(import.meta.dirname, '..', '..')
const REPO_ROOT = join(APP_ROOT, '..')
const DEFAULT_MANIFEST = join(REPO_ROOT, 'docs', 'assets', 'biology-animals-sourcing-candidates.json')
const PUBLIC_MODELS = join(APP_ROOT, 'public', 'models')

function argValue(name) {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

function hasArg(name) {
  return process.argv.includes(name)
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function assertAllowedLicense(candidate, allowAttrib) {
  const license = String(candidate.license ?? '')
  if (/NonCommercial|BY-NC|NC-/i.test(license)) {
    throw new Error(`${candidate.id} is not importable: non-commercial license "${license}".`)
  }
  if (!/CC0|Public Domain/i.test(license) && !allowAttrib) {
    throw new Error(`${candidate.id} uses "${license}". Re-run with --allow-attrib only after attribution copy is ready.`)
  }
}

async function sketchfabJson(url, token) {
  const response = await fetch(url, {
    headers: token ? { Authorization: `Token ${token}` } : {},
  })
  const body = await response.text()
  let data
  try {
    data = JSON.parse(body)
  } catch {
    throw new Error(`Non-JSON response from ${url}: ${body.slice(0, 160)}`)
  }
  if (!response.ok) {
    throw new Error(`${response.status} from ${url}: ${JSON.stringify(data)}`)
  }
  return data
}

async function downloadFile(url, dest) {
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`${response.status} downloading ${url}`)
  }
  const bytes = Buffer.from(await response.arrayBuffer())
  writeFileSync(dest, bytes)
}

function sha256(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function findFirstGlb(root) {
  const stack = [root]
  while (stack.length) {
    const dir = stack.pop()
    const entries = spawnSync('find', [dir, '-maxdepth', '1', '-mindepth', '1'], { encoding: 'utf8' })
    if (entries.status !== 0) continue
    for (const entry of entries.stdout.trim().split('\n').filter(Boolean)) {
      const stat = statSync(entry)
      if (stat.isDirectory()) stack.push(entry)
      if (stat.isFile() && entry.toLowerCase().endsWith('.glb')) return entry
    }
  }
  return null
}

function copyFile(src, dest) {
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, readFileSync(src))
}

async function main() {
  const manifestPath = argValue('--manifest') ?? DEFAULT_MANIFEST
  const candidateId = argValue('--candidate')
  const outRel = argValue('--out')
  const dryRun = hasArg('--dry-run')
  const allowAttrib = hasArg('--allow-attrib')
  const token = process.env.SKETCHFAB_TOKEN

  if (!candidateId) {
    throw new Error('Missing --candidate <candidate-id>.')
  }

  const manifest = readJson(manifestPath)
  const candidate = manifest.candidates.find((item) => item.id === candidateId)
  if (!candidate) {
    throw new Error(`Candidate not found in ${manifestPath}: ${candidateId}`)
  }

  assertAllowedLicense(candidate, allowAttrib)
  const modelInfo = await sketchfabJson(`https://api.sketchfab.com/v3/models/${candidate.uid}`, '')
  const apiLicense = modelInfo.license?.label ?? ''
  if (apiLicense !== candidate.license) {
    throw new Error(`Manifest license mismatch. Manifest "${candidate.license}", API "${apiLicense}".`)
  }

  const subjectSlug = String(manifest.subject ?? 'biology').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const branchSlug = String(manifest.branchId ?? 'animals').replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  const outputRel = outRel ?? `sourced/${subjectSlug}-${branchSlug}/${candidate.id}.glb`
  const outputAbs = join(PUBLIC_MODELS, outputRel)
  const sidecarAbs = outputAbs.replace(/\.glb$/i, '.license.json')

  console.log(`Candidate: ${candidate.assetName}`)
  console.log(`License: ${candidate.license} (${candidate.licenseRequirements})`)
  console.log(`Target: public/models/${outputRel}`)

  if (dryRun) {
    console.log('Dry run complete. No files written.')
    return
  }

  if (!token) {
    throw new Error('SKETCHFAB_TOKEN is required for downloads. Metadata dry runs do not require it.')
  }

  const downloadInfo = await sketchfabJson(`https://api.sketchfab.com/v3/models/${candidate.uid}/download`, token)
  const gltfDownload = downloadInfo.gltf
  if (!gltfDownload?.url) {
    throw new Error(`No glTF download URL available for ${candidate.id}.`)
  }

  const tempRoot = join(tmpdir(), `quantaora-sketchfab-${candidate.id}-${Date.now()}`)
  mkdirSync(tempRoot, { recursive: true })
  const archivePath = join(tempRoot, `${candidate.id}.zip`)
  await downloadFile(gltfDownload.url, archivePath)

  const unzip = spawnSync('unzip', ['-q', archivePath, '-d', tempRoot], { encoding: 'utf8' })
  if (unzip.status !== 0) {
    throw new Error(`unzip failed: ${unzip.stderr || unzip.stdout}`)
  }

  const glb = findFirstGlb(tempRoot)
  if (!glb) {
    throw new Error(
      `Downloaded archive did not contain a .glb. Convert the extracted .gltf with gltf-transform, then import manually from ${tempRoot}.`,
    )
  }

  copyFile(glb, outputAbs)
  const fileSizeBytes = statSync(outputAbs).size
  const hash = sha256(outputAbs)
  writeFileSync(
    sidecarAbs,
    `${JSON.stringify(
      {
        sourceUrl: candidate.sourceUrl,
        apiUrl: candidate.apiUrl,
        creator: candidate.creator,
        provider: candidate.provider,
        license: candidate.license,
        attributionRequired: !/CC0|Public Domain/i.test(candidate.license),
        redistributionStatus: 'Allowed by source license; verify final app terms before paid release.',
        dateSourced: new Date().toISOString().slice(0, 10),
        fileSizeBytes,
        sha256: hash,
        targetComponents: candidate.targetComponents,
        notes: candidate.fit,
      },
      null,
      2,
    )}\n`,
  )

  console.log(`Imported ${relative(APP_ROOT, outputAbs)}`)
  console.log(`Wrote ${relative(APP_ROOT, sidecarAbs)}`)
  rmSync(tempRoot, { recursive: true, force: true })
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
