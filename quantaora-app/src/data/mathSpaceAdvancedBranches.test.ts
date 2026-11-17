import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { ComponentContent } from './types.ts'
import { HIERARCHY } from './hierarchy.ts'
import { componentAssetResolution } from './modelRegistry.ts'
import { graphsAndFunctions, graphsAndFunctionsById } from './graphsAndFunctions.ts'
import { trigonometryFoundations, trigonometryFoundationsById } from './trigonometryFoundations.ts'
import { gravityAndOrbits, gravityAndOrbitsById } from './gravityAndOrbits.ts'
import { cosmologyFoundations, cosmologyFoundationsById } from './cosmologyFoundations.ts'
import { KNOWN_COMPOSITIONS } from '../lib/procedural/types.ts'

const BRANCH_MODULES_SOURCE = readFileSync(fileURLToPath(new URL('./branchModules.ts', import.meta.url)), 'utf8')
const ALL_CONTENT_SOURCE = readFileSync(fileURLToPath(new URL('./allContent.ts', import.meta.url)), 'utf8')

const knownShapes = new Set<string>(KNOWN_COMPOSITIONS)
const REAL_GLB_COMPONENT_IDS = new Set([
  'space-gravity-force',
  'space-orbit-path',
  'space-escape-speed',
  'space-orbital-speed',
  'space-barycenter',
  'space-cosmology-observable-universe',
  'space-cosmology-expansion',
  'space-cosmology-redshift',
  'space-cosmology-cmb',
  'space-cosmology-large-scale-structure',
])

const branchData = {
  'graphs-and-functions': {
    subject: 'math',
    branchName: 'Graphs And Functions',
    importName: 'graphsAndFunctions',
    moduleName: 'graphsAndFunctions',
    components: graphsAndFunctions,
    byId: graphsAndFunctionsById,
    variableWords: ['x', 'slope', 'intercept', 'input', 'graph', 'rise'],
  },
  'trigonometry-foundations': {
    subject: 'math',
    branchName: 'Trigonometry Foundations',
    importName: 'trigonometryFoundations',
    moduleName: 'trigonometryFoundations',
    components: trigonometryFoundations,
    byId: trigonometryFoundationsById,
    variableWords: ['angle', 'side', 'sine', 'cosine', 'tangent'],
  },
  'gravity-and-orbits': {
    subject: 'space',
    branchName: 'Gravity And Orbits',
    importName: 'gravityAndOrbits',
    moduleName: 'gravityAndOrbits',
    components: gravityAndOrbits,
    byId: gravityAndOrbitsById,
    variableWords: ['speed', 'mass', 'distance', 'orbit', 'gravity'],
  },
  'cosmology-foundations': {
    subject: 'space',
    branchName: 'Cosmology Foundations',
    importName: 'cosmologyFoundations',
    moduleName: 'cosmologyFoundations',
    components: cosmologyFoundations,
    byId: cosmologyFoundationsById,
    variableWords: ['distance', 'time', 'scale', 'redshift', 'expansion', 'wavelength', 'stretch'],
  },
} as const

function assertRequiredText(component: ComponentContent, field: keyof ComponentContent) {
  assert.equal(typeof component[field], 'string', `expected string ${String(field)} for ${component.id}`)
  assert.ok((component[field] as string).length > 0, `expected ${String(field)} for ${component.id}`)
}

function assertQuiz(component: ComponentContent) {
  assert.ok(component.quiz.length >= 4, `expected quiz coverage for ${component.id}`)
  for (const question of component.quiz) {
    assert.ok(question.prompt.length > 0, `expected quiz prompt for ${component.id}`)
    assert.ok(question.options.length >= 4, `expected quiz options for ${component.id}`)
    assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length, `expected valid correctIndex for ${component.id}`)
    assert.ok(question.explanation.length > 0, `expected quiz explanation for ${component.id}`)
    assert.ok(question.misconception.length > 0, `expected quiz misconception for ${component.id}`)
  }
}

function assertLesson(component: ComponentContent, variableWords: readonly string[]) {
  assert.deepEqual(
    component.lesson.steps.map((step) => step.title),
    ['Predict', 'Change', 'Observe', 'Explain'],
    `expected cause/effect lesson sequence for ${component.id}`,
  )
  for (const step of component.lesson.steps) {
    assert.ok(step.body.length > 0, `expected lesson body for ${component.id} ${step.title}`)
  }
  assert.match(component.lesson.predictionPrompt, /predict/i, `expected prediction prompt for ${component.id}`)
  assert.ok(
    variableWords.some((word) => component.lesson.predictionPrompt.toLowerCase().includes(word)),
    `expected prediction prompt to name a changed variable for ${component.id}`,
  )
  assert.ok(component.lesson.practiceItem.length > 0, `expected practice item for ${component.id}`)
  assert.ok(component.lesson.checkpoint.length > 0, `expected checkpoint for ${component.id}`)
}

for (const [branchId, branch] of Object.entries(branchData)) {
  test(`${branchId}: live hierarchy route and accurate component count`, () => {
    const subject = HIERARCHY[branch.subject]
    const metadata = subject.branches.find((candidate) => candidate.id === branchId)
    assert.ok(metadata, `expected hierarchy metadata for ${branchId}`)
    assert.equal(metadata.status, 'live')
    assert.equal(metadata.route, `/app/labs/branch/${branchId}`)
    assert.equal(metadata.componentCount, branch.components.length)
    assert.ok(branch.components.length >= 3 && branch.components.length <= 5, `expected focused component count for ${branchId}`)
  })

  test(`${branchId}: branchComponents and resolveContent registry wiring`, () => {
    assert.match(BRANCH_MODULES_SOURCE, new RegExp(`import \\{ ${branch.importName} \\} from './${branch.moduleName}'`))
    assert.match(BRANCH_MODULES_SOURCE, new RegExp(`'${branchId}': ${branch.importName}`))
    assert.match(BRANCH_MODULES_SOURCE, /export function branchComponents\(branchId: string\): ComponentContent\[\]/)
    assert.match(BRANCH_MODULES_SOURCE, /return BRANCH_COMPONENTS\[branchId\] \?\? \[\]/)
    assert.match(ALL_CONTENT_SOURCE, /\.\.\.Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)/, 'expected ALL_CONTENT to include registered branch components')
    assert.match(ALL_CONTENT_SOURCE, /Object\.fromEntries\(Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)\.map\(\(c\) => \[c\.id, c\]\)\)/, 'expected resolveContent index to include registered branch components')
  })

  test(`${branchId}: complete procedural components and resolving compare links`, () => {
    for (const component of branch.components) {
      assert.equal(component.subject, branch.subject)
      assert.equal(component.branch, branch.branchName)
      for (const field of ['id', 'name', 'scientificName', 'system', 'tagline', 'summary', 'whyItMatters', 'didYouKnow', 'compareReason'] as const) {
        assertRequiredText(component, field)
      }
      if (REAL_GLB_COMPONENT_IDS.has(component.id)) {
        const resolution = componentAssetResolution(component)
        assert.equal(resolution.status, 'ready', `expected registered GLB for ${component.id}`)
        assert.ok(resolution.asset, `expected asset metadata for ${component.id}`)
        assert.notEqual(resolution.asset.licenseStatus, 'REVIEW')
        assert.ok(existsSync(join(process.cwd(), 'public', resolution.asset.url.replace(/^\//, ''))), `expected GLB file to exist for ${component.id}`)
      } else {
        assert.equal(component.model, '', `expected ${component.id} to be procedural-only, not a fake GLB`)
      }
      assert.ok(component.visual, `expected procedural visual for ${component.id}`)
      assert.ok(knownShapes.has(component.visual!.shape), `expected known visual shape for ${component.id}: ${component.visual!.shape}`)
      assert.ok(component.keyFacts.length >= 5, `expected key facts for ${component.id}`)
      assert.ok(component.belongsTo.length >= 3, `expected belongsTo trail for ${component.id}`)
      assert.ok(component.conditions.length >= 3, `expected conditions for ${component.id}`)
      assert.ok(component.hotspots.length >= 3, `expected hotspots for ${component.id}`)
      for (const hotspot of component.hotspots) {
        assert.ok(hotspot.id.length > 0, `expected hotspot id for ${component.id}`)
        assert.ok(hotspot.label.length > 0, `expected hotspot label for ${component.id}`)
        assert.equal(hotspot.position.length, 3, `expected hotspot position for ${component.id}`)
        assert.ok(hotspot.description.length > 0, `expected hotspot description for ${component.id}`)
        assert.ok(hotspot.function.length > 0, `expected hotspot function for ${component.id}`)
      }
      assertLesson(component, branch.variableWords)
      assertQuiz(component)
      assert.ok(component.compareCandidate.length > 0, `expected compare candidate for ${component.id}`)
      assert.notEqual(component.compareCandidate, component.id, `expected ${component.id} not to compare with itself`)
      assert.equal(branch.byId[component.compareCandidate]?.id, component.compareCandidate, `expected compare link to resolve for ${component.id}`)
    }
  })
}

test('trigonometry-foundations: authored as an interactive P1 angle lab', () => {
  for (const component of trigonometryFoundations) {
    const searchable = [
      component.summary,
      component.whyItMatters,
      component.didYouKnow,
      ...component.conditions,
      ...component.keyFacts.flatMap((fact) => [fact.label, fact.value]),
      ...component.lesson.steps.map((step) => step.body),
    ].join(' ')

    assert.match(searchable, /angle slider|slider/i, `expected slider language for ${component.id}`)
    assert.match(searchable, /sine|cosine|tangent|unit circle|right triangle/i, `expected trig model language for ${component.id}`)
    assert.doesNotMatch(searchable, /coming soon|preview|placeholder/i, `expected no preview language for ${component.id}`)
  }

  const allTrigText = trigonometryFoundations
    .map((component) => [
      component.name,
      component.summary,
      component.whyItMatters,
      ...component.keyFacts.map((fact) => fact.value),
      ...component.conditions,
    ].join(' '))
    .join(' ')

  assert.match(allTrigText, /unit circle/i)
  assert.match(allTrigText, /right triangle/i)
  assert.match(allTrigText, /x-coordinate|x-position/i)
  assert.match(allTrigText, /y-coordinate|point height/i)
})
