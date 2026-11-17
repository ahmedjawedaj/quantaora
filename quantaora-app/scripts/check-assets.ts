import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { MODEL_ASSETS, type AssetLicenseStatus, type ModelAssetRecord } from '../src/data/modelRegistry.ts'

const ROOT = process.cwd()
const PUBLIC_ROOT = join(ROOT, 'public')
const LICENSE_REGISTER = join(ROOT, '..', 'docs', 'ASSET-LICENSES.md')
const PAID_RELEASE = process.env.PAID_RELEASE === '1' || process.env.PAID_RELEASE === 'true'

interface Finding {
  level: 'error' | 'warn'
  asset?: ModelAssetRecord
  message: string
}

const findings: Finding[] = []
const seenBasenames = new Map<string, ModelAssetRecord>()
const licenseRegister = existsSync(LICENSE_REGISTER) ? readFileSync(LICENSE_REGISTER, 'utf8') : ''

function add(level: Finding['level'], message: string, asset?: ModelAssetRecord) {
  findings.push({ level, message, asset })
}

function publicPath(asset: ModelAssetRecord) {
  return join(PUBLIC_ROOT, asset.url.replace(/^\//, ''))
}

function licenceRowExists(asset: ModelAssetRecord) {
  const exactPath = `public${asset.url}`
  return licenseRegister.includes(exactPath)
}

function statusCounts() {
  const counts: Record<AssetLicenseStatus, number> = {
    CLEAR: 0,
    ATTRIB: 0,
    'NC-RISK': 0,
    REVIEW: 0,
  }

  for (const asset of MODEL_ASSETS) counts[asset.licenseStatus] += 1
  return counts
}

for (const asset of MODEL_ASSETS) {
  if (!asset.url.endsWith('.glb')) {
    add('error', 'Asset URL must point to a .glb file.', asset)
  }

  if (!existsSync(publicPath(asset))) {
    add('error', `Missing file at ${relative(ROOT, publicPath(asset))}.`, asset)
  }

  const basename = asset.url.split('/').pop() ?? ''
  const duplicate = seenBasenames.get(basename)
  if (duplicate) {
    add('error', `Duplicate GLB basename "${basename}" also used by ${duplicate.url}.`, asset)
  } else {
    seenBasenames.set(basename, asset)
  }

  if (!asset.sourceName || !asset.license || !asset.licenseStatus || !asset.qualityTier) {
    add('error', 'Asset is missing source, license, status, or quality tier metadata.', asset)
  }

  if (!asset.componentIds.length) {
    add('error', 'Asset must list at least one component id it supports.', asset)
  }

  if (!licenceRowExists(asset)) {
    add('error', 'Asset is missing a matching row in docs/ASSET-LICENSES.md.', asset)
  }

  if (asset.licenseStatus === 'NC-RISK') {
    add(PAID_RELEASE ? 'error' : 'warn', 'NC-RISK asset must be replaced before paid launch.', asset)
  }

  if (asset.licenseStatus === 'REVIEW') {
    add(PAID_RELEASE ? 'error' : 'warn', 'REVIEW asset needs final provenance/legal clearance.', asset)
  }
}

const counts = statusCounts()
const errors = findings.filter((finding) => finding.level === 'error')
const warnings = findings.filter((finding) => finding.level === 'warn')

console.log(`Asset check: ${MODEL_ASSETS.length} registered GLBs`)
console.log(`Status: CLEAR ${counts.CLEAR}, ATTRIB ${counts.ATTRIB}, NC-RISK ${counts['NC-RISK']}, REVIEW ${counts.REVIEW}`)

for (const finding of findings) {
  const prefix = finding.level === 'error' ? 'ERROR' : 'WARN'
  const assetLabel = finding.asset ? ` ${finding.asset.url}:` : ''
  console.log(`${prefix}${assetLabel} ${finding.message}`)
}

if (PAID_RELEASE) {
  console.log('Paid-release mode enabled: NC-RISK and REVIEW assets are blocking.')
}

if (errors.length > 0) {
  console.error(`Asset check failed with ${errors.length} error${errors.length === 1 ? '' : 's'}.`)
  process.exit(1)
}

console.log(`Asset check passed with ${warnings.length} warning${warnings.length === 1 ? '' : 's'}.`)
