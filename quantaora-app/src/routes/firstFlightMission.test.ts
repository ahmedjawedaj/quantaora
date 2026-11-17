import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function readSrc(relativePath: string): string {
  return readFileSync(fileURLToPath(new URL(relativePath, import.meta.url)), 'utf8')
}

const firstFlightSrc = readSrc('./FirstFlight.tsx')
const grownupsSrc = readSrc('./Grownups.tsx')
const storeSrc = readSrc('../store/useAppStore.ts')
const storageTypesSrc = readSrc('../lib/storage/types.ts')

test('First Flight stores a real recommended mission path, not only a single lab route', () => {
  assert.match(firstFlightSrc, /mission:\s*\{/, 'expected subject definitions to include mission data')
  assert.match(firstFlightSrc, /recommendedMission:\s*\{/, 'expected setLearnerProfile to persist recommendedMission')
  for (const phrase of [
    'Mission path',
    'Living Systems Launch',
    'Matter Builder Mission',
    'Math Objects Mission',
    'Cause And Effect Physics',
    'Space Motion Mission',
  ]) {
    assert.ok(firstFlightSrc.includes(phrase), `expected FirstFlight to include "${phrase}"`)
  }
})

test('Parent / Teacher Zone renders the saved mission as actionable linked steps', () => {
  assert.match(grownupsSrc, /learnerProfile\?\.recommendedMission/, 'expected Grownups to read the saved mission')
  assert.match(grownupsSrc, /learnerProfile\.recommendedMission\.steps\.map/, 'expected Grownups to render every mission step')
  assert.match(grownupsSrc, /to=\{step\.path\}/, 'expected each mission step to link to its real route')
})

test('local-progress profile types allow backward-compatible recommendedMission data', () => {
  assert.match(storeSrc, /recommendedMission\?: RecommendedMission/, 'expected Zustand profile to allow optional mission data')
  assert.match(storageTypesSrc, /recommendedMission\?: RecommendedMissionRecord/, 'expected Dexie profile type to allow optional mission data')
})
