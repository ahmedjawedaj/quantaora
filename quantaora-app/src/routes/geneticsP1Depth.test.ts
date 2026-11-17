import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const LAB_PATH = fileURLToPath(new URL('./GeneticsLab.tsx', import.meta.url))
const source = readFileSync(LAB_PATH, 'utf8')

const requiredChallenges = [
  ['dna', 'base'],
  ['dna-replication', 'replication'],
  ['gene', 'gene'],
  ['mutation', 'mutation'],
  ['transcription-translation', 'mRNA'],
  ['protein', 'fold'],
  ['chromosome', 'chromosome'],
  ['allele', 'allele'],
  ['trait', 'trait'],
  ['inheritance-punnett-squares', 'Punnett'],
] as const

test('GeneticsLab has a kid-facing guided challenge for every P1 genetics concept', () => {
  for (const [id, marker] of requiredChallenges) {
    const block = source.match(new RegExp(`'${id}': \\{([\\s\\S]*?)\\n  \\},`))?.[1]
    assert.ok(block, `missing challenge for ${id}`)
    assert.match(block, /mission:/, `${id} should have a named mission`)
    assert.match(block, new RegExp(marker, 'i'), `${id} should name its concept`)
    for (const step of ['observe', 'predict', 'change', 'explain', 'check']) {
      assert.match(block, new RegExp(`${step}:`), `${id} should include a ${step} prompt`)
    }
    assert.match(block, /outcome:/, `${id} should state the visible learning outcome`)
  }
})

test('GeneticsLab challenges tell children what changes when controls change', () => {
  for (const marker of [
    'Changing one DNA base',
    'Changing the template base',
    'Changing a coding-region base',
    'substitution',
    'insertion/deletion',
    'Changing DNA changes the mRNA',
    'Changing an amino acid',
    'Changing chromosome structure',
    'Changing one allele',
    'Changing genotype',
    'Changing a parent allele',
  ]) {
    assert.match(source, new RegExp(marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'), `missing change outcome: ${marker}`)
  }
})
