import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const branchLabSource = readFileSync(new URL('./BranchLab.tsx', import.meta.url), 'utf8')
const cellLabSource = readFileSync(new URL('./CellLab.tsx', import.meta.url), 'utf8')
const physiologyLabSource = readFileSync(new URL('./PhysiologyLab.tsx', import.meta.url), 'utf8')
const panelSource = readFileSync(new URL('../components/labs/BranchCauseEffectPanel.tsx', import.meta.url), 'utf8')
const configSource = readFileSync(new URL('../data/branchCauseEffectConfigs.ts', import.meta.url), 'utf8')

test('BranchCauseEffectPanel is shared instead of embedded in BranchLab', () => {
  assert.match(panelSource, /export function BranchCauseEffectPanel/)
  assert.match(configSource, /export const BRANCH_CAUSE_EFFECT_CONFIGS/)
  assert.match(configSource, /DEFAULT_CELL_CONTROLS/)
  assert.match(configSource, /DEFAULT_PHYSIOLOGY_CONTROLS/)

  assert.match(branchLabSource, /@\/components\/labs\/BranchCauseEffectPanel/)
  assert.match(branchLabSource, /@\/data\/branchCauseEffectConfigs/)
  assert.doesNotMatch(branchLabSource, /function BranchCauseEffectPanel\(/)
  assert.doesNotMatch(branchLabSource, /const BRANCH_CAUSE_EFFECT_CONFIGS:/)
})

test('dedicated CellLab renders and saves the shared cell cause/effect panel', () => {
  assert.match(cellLabSource, /@\/components\/labs\/BranchCauseEffectPanel/)
  assert.match(cellLabSource, /BRANCH_CAUSE_EFFECT_CONFIGS\['cell-biology'\]/)
  assert.match(cellLabSource, /DEFAULT_CELL_CONTROLS/)
  assert.match(cellLabSource, /const \[cellControls, setCellControls\]/)
  assert.match(cellLabSource, /activeId=\{cellId\}/)
  assert.match(cellLabSource, /labState=\{\{ cellControls \}\}/)
})

test('dedicated PhysiologyLab renders and saves the shared physiology cause/effect panel', () => {
  assert.match(physiologyLabSource, /@\/components\/labs\/BranchCauseEffectPanel/)
  assert.match(physiologyLabSource, /BRANCH_CAUSE_EFFECT_CONFIGS\['human-physiology'\]/)
  assert.match(physiologyLabSource, /DEFAULT_PHYSIOLOGY_CONTROLS/)
  assert.match(physiologyLabSource, /const \[physiologyControls, setPhysiologyControls\]/)
  assert.match(physiologyLabSource, /activeId=\{processId\}/)
  assert.match(physiologyLabSource, /labState=\{\{ physiologyControls \}\}/)
})
