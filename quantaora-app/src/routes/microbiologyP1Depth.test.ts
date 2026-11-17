import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const MICROBIOLOGY_LAB_PATH = fileURLToPath(new URL('./MicrobiologyLab.tsx', import.meta.url))
const src = readFileSync(MICROBIOLOGY_LAB_PATH, 'utf8')

test('MicrobiologyLab: P1 guided missions cover every microbe with visible predict/change/observe/explain markers', () => {
  for (const microbe of ['bacteria', 'virus', 'fungus', 'protozoa', 'microbiome']) {
    assert.match(src, new RegExp(`${microbe}: \\{[\\s\\S]{0,1200}observe:`), `${microbe} needs an observe mission`)
    assert.match(src, new RegExp(`${microbe}: \\{[\\s\\S]{0,1200}predict:`), `${microbe} needs a predict mission`)
    assert.match(src, new RegExp(`${microbe}: \\{[\\s\\S]{0,1200}change:`), `${microbe} needs a change mission`)
    assert.match(src, new RegExp(`${microbe}: \\{[\\s\\S]{0,1200}explain:`), `${microbe} needs an explain mission`)
  }
  for (const marker of ['Observe —', 'Predict —', 'Change —', 'Explain —', 'Check —', 'Guided challenge']) {
    assert.match(src, new RegExp(marker.replace('—', '—?')), `missing visible challenge marker: ${marker}`)
  }
})

test('MicrobiologyLab: P1 missions name the structural and community changes children can make', () => {
  for (const marker of ['Peel the cell wall', 'Peel the protein coat', 'Peel the soil away', 'Show the flagellum', 'Show attachment spikes', 'Show drifting spores', 'Movement layer', 'Feeding layer', 'Show helpful jobs', 'Antibiotic use', 'Fiber-rich diet']) {
    assert.match(src, new RegExp(marker), `missing control marker: ${marker}`)
  }
  for (const outcome of ['flagellum moves', 'new viruses bursting', 'mycelium network spread or shrink', 'move and reach for food differently', 'community balance and colony glow change']) {
    assert.match(src, new RegExp(outcome), `missing visible outcome: ${outcome}`)
  }
})
