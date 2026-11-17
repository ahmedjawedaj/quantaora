import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { healthAndDisease } from './healthAndDisease.ts'
import { componentAssetResolution } from './modelRegistry.ts'

const healthSource = readFileSync(new URL('./healthAndDisease.ts', import.meta.url), 'utf8')
const registrySource = readFileSync(new URL('./modelRegistry.ts', import.meta.url), 'utf8')
const WHOLE_INFLUENZA = '/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb'
const INFLUENZA_CUTAWAY = '/models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb'
const INTESTINE = '/models/intestine.glb'

test('Health And Disease pathogen uses the vetted NIH influenza hero asset', () => {
  assert.match(
    healthSource,
    /id === 'biology-health-pathogen' \|\| id === 'biology-health-epidemiology-spread'\) return INFLUENZA_WHOLE_MODEL/,
    'expected the pathogen component to use the sourced influenza GLB, not the authored placeholder',
  )

  assert.match(
    registrySource,
    /url: '\/models\/sourced\/biology-gaps-wave2\/virus-influenza-whole-nih\.glb'[\s\S]*?licenseStatus: 'CLEAR'[\s\S]*?qualityTier: 'hero'/,
    'expected the sourced influenza GLB to stay registered as a cleared hero asset',
  )

  assert.ok(
    existsSync(join(process.cwd(), 'public/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb')),
    'expected the sourced influenza GLB file to exist',
  )
  assert.ok(
    existsSync(join(process.cwd(), 'public/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.license.json')),
    'expected the sourced influenza GLB license sidecar to exist',
  )
})

test('Health And Disease immune and vaccine lessons use the vetted influenza cutaway support asset', () => {
  for (const id of ['biology-health-immune-response', 'biology-health-vaccine']) {
    const component = healthAndDisease.find((entry) => entry.id === id)
    assert.ok(component, `expected Health component ${id}`)
    assert.equal(component.model, INFLUENZA_CUTAWAY)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${id}`)
    assert.equal(resolution.asset.licenseStatus, 'ATTRIB')
    assert.equal(resolution.asset.sourceName, 'NIH 3D 3DPX-013373 (PathogenAR / NIAID Biovisualization Program)')
    assert.ok(
      existsSync(join(process.cwd(), 'public', INFLUENZA_CUTAWAY.replace(/^\//, ''))),
      `expected sourced cutaway influenza GLB file to exist for ${id}`,
    )
  }

  assert.equal(healthAndDisease.find((entry) => entry.id === 'biology-health-pathogen')?.model, WHOLE_INFLUENZA)
})

test('Health nutrition and spread use stronger local anatomy/NIH assets instead of weak placeholders', () => {
  const expected = [
    {
      id: 'biology-health-nutrition',
      model: INTESTINE,
      licenseStatus: 'REVIEW',
      branch: 'human-anatomy',
      note: /Replacement candidates: NIH 3D 3DPX-021005/,
    },
    {
      id: 'biology-health-epidemiology-spread',
      model: WHOLE_INFLUENZA,
      licenseStatus: 'CLEAR',
      branch: 'microbiology',
      note: /Whole influenza virion/,
    },
  ]

  for (const item of expected) {
    const component = healthAndDisease.find((entry) => entry.id === item.id)
    assert.ok(component, `expected Health component ${item.id}`)
    assert.equal(component.model, item.model)

    const resolution = componentAssetResolution(component)
    assert.equal(resolution.status, 'ready', `expected registered asset for ${item.id}`)
    assert.ok(resolution.asset, `expected asset metadata for ${item.id}`)
    assert.equal(resolution.asset.licenseStatus, item.licenseStatus)
    assert.equal(resolution.asset.branch, item.branch)
    assert.match(resolution.asset.notes, item.note)
    assert.ok(existsSync(join(process.cwd(), 'public', item.model.replace(/^\//, ''))))
  }
})
