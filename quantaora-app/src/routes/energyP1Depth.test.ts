import { readFileSync } from 'node:fs'
import assert from 'node:assert/strict'
import test from 'node:test'

test('Energy P1 depth missions keep a visible marker for every energy concept', () => {
    const source = readFileSync(new URL('./EnergyLab.tsx', import.meta.url), 'utf8')

    for (const id of [
      'conservation-of-energy',
      'kinetic-energy',
      'potential-energy',
      'work',
      'power',
      'efficiency',
    ]) {
      assert.ok(source.includes(`'${id}': {`) || source.includes(`  ${id}: {`))
    }

    assert.ok(source.includes('data-energy-mission="true"'))
    assert.ok(source.includes('<strong>Mission:</strong>'))
    assert.ok(source.includes('<strong>Change:</strong>'))
    assert.ok(source.includes('<strong>Observe:</strong>'))
    assert.ok(source.includes('<strong>Explain:</strong>'))
})
