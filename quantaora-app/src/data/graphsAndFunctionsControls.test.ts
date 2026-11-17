import { test } from 'node:test'
import assert from 'node:assert/strict'
import { graphsAndFunctions } from './graphsAndFunctions.ts'

const controlWords = ['slope', 'intercept', 'rate', 'x', 'y', 'input', 'point', 'line']

test('graphs-and-functions: every component authors live graph controls', () => {
  for (const component of graphsAndFunctions) {
    const control = component.visual?.graphControl as Record<string, unknown> | undefined

    assert.ok(control, `expected graphControl for ${component.id}`)
    assert.equal(typeof control.title, 'string', `expected control title for ${component.id}`)
    assert.equal(typeof control.scenario, 'string', `expected control scenario for ${component.id}`)
    assert.equal(typeof control.x, 'number', `expected numeric x for ${component.id}`)
    assert.equal(typeof control.slope, 'number', `expected numeric slope for ${component.id}`)
    assert.equal(typeof control.intercept, 'number', `expected numeric intercept for ${component.id}`)
    assert.match(String(control.controlFocus), /^(point|slope|intercept|function|compare)$/, `expected valid controlFocus for ${component.id}`)

    const explanatoryText = `${control.title} ${control.scenario}`.toLowerCase()
    assert.ok(
      controlWords.some((word) => explanatoryText.includes(word)),
      `expected kid-readable graph variable language for ${component.id}`,
    )
  }
})

test('graphs-and-functions: comparison model includes two line rules', () => {
  const comparison = graphsAndFunctions.find((component) => component.id === 'math-graphs-comparing-lines')
  const control = comparison?.visual?.graphControl as Record<string, unknown> | undefined

  assert.ok(control, 'expected comparison graphControl')
  assert.equal(control.controlFocus, 'compare')
  assert.equal(typeof control.compareSlope, 'number')
  assert.equal(typeof control.compareIntercept, 'number')
  assert.notEqual(control.compareSlope, control.slope, 'comparison should show different rates')
})
