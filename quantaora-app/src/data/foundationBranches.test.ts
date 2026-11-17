import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { HIERARCHY } from './hierarchy.ts'
import { componentAssetResolution } from './modelRegistry.ts'
import { stoichiometryFoundations, stoichiometryFoundationsById } from './stoichiometryFoundations.ts'
import { organicChemistryFoundations, organicChemistryFoundationsById } from './organicChemistryFoundations.ts'
import { biochemistryLinks, biochemistryLinksById } from './biochemistryLinks.ts'
import { calculusFoundations, calculusFoundationsById } from './calculusFoundations.ts'
import { modernPhysicsFoundations, modernPhysicsFoundationsById } from './modernPhysicsFoundations.ts'
import { KNOWN_COMPOSITIONS } from '../lib/procedural/types.ts'
import type { ComponentContent, SubjectId } from './types.ts'

const BRANCH_MODULES_SOURCE = readFileSync(fileURLToPath(new URL('./branchModules.ts', import.meta.url)), 'utf8')
const ALL_CONTENT_SOURCE = readFileSync(fileURLToPath(new URL('./allContent.ts', import.meta.url)), 'utf8')
const knownShapes = new Set<string>(KNOWN_COMPOSITIONS)
const REAL_GLB_COMPONENT_IDS = new Set([
  'chem-organic-hydrocarbon',
  'chem-stoich-mole',
  'chem-stoich-molar-mass',
  'chem-stoich-balanced-ratio',
  'chem-stoich-limiting-reactant',
  'chem-stoich-yield',
  'chem-biolink-amino-acid',
  'chem-biolink-protein-folding',
  'chem-biolink-enzyme-substrate',
  'chem-biolink-carbohydrate',
  'chem-biolink-lipid-membrane',
  'physics-modern-photon',
  'physics-modern-energy-level',
  'physics-modern-radioactive-decay',
  'physics-modern-half-life',
  'physics-modern-wave-particle-model',
])

const branchData = {
  'stoichiometry-foundations': {
    subject: 'chemistry',
    branchName: 'Stoichiometry Foundations',
    importName: 'stoichiometryFoundations',
    moduleName: 'stoichiometryFoundations',
    components: stoichiometryFoundations,
    byId: stoichiometryFoundationsById,
  },
  'organic-chemistry-foundations': {
    subject: 'chemistry',
    branchName: 'Organic Chemistry Foundations',
    importName: 'organicChemistryFoundations',
    moduleName: 'organicChemistryFoundations',
    components: organicChemistryFoundations,
    byId: organicChemistryFoundationsById,
  },
  'biochemistry-links': {
    subject: 'chemistry',
    branchName: 'Biochemistry Links',
    importName: 'biochemistryLinks',
    moduleName: 'biochemistryLinks',
    components: biochemistryLinks,
    byId: biochemistryLinksById,
  },
  'calculus-foundations': {
    subject: 'math',
    branchName: 'Calculus Foundations',
    importName: 'calculusFoundations',
    moduleName: 'calculusFoundations',
    components: calculusFoundations,
    byId: calculusFoundationsById,
  },
  'modern-physics-foundations': {
    subject: 'physics',
    branchName: 'Modern Physics Foundations',
    importName: 'modernPhysicsFoundations',
    moduleName: 'modernPhysicsFoundations',
    components: modernPhysicsFoundations,
    byId: modernPhysicsFoundationsById,
  },
} as const satisfies Record<
  string,
  {
    subject: SubjectId
    branchName: string
    importName: string
    moduleName: string
    components: ComponentContent[]
    byId: Record<string, ComponentContent>
  }
>

function assertText(component: ComponentContent, field: keyof ComponentContent) {
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

function assertLesson(component: ComponentContent) {
  assert.deepEqual(
    component.lesson.steps.map((step) => step.title),
    ['Predict', 'Change', 'Observe', 'Explain'],
    `expected Predict -> Change -> Observe -> Explain lesson for ${component.id}`,
  )
  assert.match(component.lesson.predictionPrompt, /predict/i, `expected explicit prediction prompt for ${component.id}`)
  assert.ok(component.lesson.practiceItem.length > 0, `expected practice item for ${component.id}`)
  assert.ok(component.lesson.checkpoint.length > 0, `expected checkpoint for ${component.id}`)
  for (const step of component.lesson.steps) {
    assert.ok(step.body.length > 0, `expected lesson body for ${component.id} ${step.title}`)
  }
}

test('hierarchy has no branch still marked planned', () => {
  for (const subject of Object.values(HIERARCHY)) {
    for (const branch of subject.branches) {
      assert.notEqual(branch.status, 'planned', `expected ${subject.id}/${branch.id} to be live or authored-pending`)
    }
  }
})

test('calculus-foundations: premium calculus visuals and kid-readable interactions', () => {
  const expectedShapesById = new Map([
    ['math-calc-rate-of-change', 'calc-rate-curve'],
    ['math-calc-tangent-slope', 'calc-tangent-curve'],
    ['math-calc-area-under-curve', 'calc-area-curve'],
    ['math-calc-limit', 'calc-limit-hole'],
    ['math-calc-accumulation', 'calc-accumulation-bars'],
  ])
  const requiredWords = ['change', 'area', 'slope', 'limit']

  for (const component of calculusFoundations) {
    assert.equal(component.visual?.shape, expectedShapesById.get(component.id), `expected calculus-specific visual for ${component.id}`)

    const learningText = [
      component.tagline,
      component.summary,
      component.lesson.predictionPrompt,
      component.lesson.practiceItem,
      component.lesson.checkpoint,
      component.compareReason,
      ...component.keyFacts.map((fact) => fact.value),
      ...component.hotspots.flatMap((hotspot) => [hotspot.label, hotspot.description, hotspot.function]),
    ].join(' ')

    assert.doesNotMatch(learningText, /coming soon|placeholder|preview|static labels/i, `expected no preview wording for ${component.id}`)
    assert.match(learningText, /predict|watch|observe|change|move|shrink|replace|extend/i, `expected interactive cause/effect text for ${component.id}`)
  }

  const wholeBranchText = calculusFoundations
    .flatMap((component) => [
      component.name,
      component.summary,
      component.whyItMatters,
      component.lesson.practiceItem,
      component.lesson.checkpoint,
      ...component.keyFacts.map((fact) => fact.value),
    ])
    .join(' ')

  for (const word of requiredWords) {
    assert.match(wholeBranchText, new RegExp(word, 'i'), `expected branch to teach ${word}`)
  }
})

for (const [branchId, branch] of Object.entries(branchData)) {
  test(`${branchId}: live hierarchy route and component count`, () => {
    const metadata = HIERARCHY[branch.subject].branches.find((candidate) => candidate.id === branchId)
    assert.ok(metadata, `expected hierarchy metadata for ${branchId}`)
    assert.equal(metadata.status, 'live')
    assert.equal(metadata.route, `/app/labs/branch/${branchId}`)
    assert.equal(metadata.componentCount, branch.components.length)
    assert.ok(branch.components.length >= 4 && branch.components.length <= 5, `expected focused component count for ${branchId}`)
  })

  test(`${branchId}: branchComponents registry and resolveContent include the module`, () => {
    assert.match(BRANCH_MODULES_SOURCE, new RegExp(`import \\{ ${branch.importName} \\} from './${branch.moduleName}'`))
    assert.match(BRANCH_MODULES_SOURCE, new RegExp(`'${branchId}': ${branch.importName}`))
    assert.match(BRANCH_MODULES_SOURCE, /export function branchComponents\(branchId: string\): ComponentContent\[\]/)
    assert.match(BRANCH_MODULES_SOURCE, /return BRANCH_COMPONENTS\[branchId\] \?\? \[\]/)
    assert.match(ALL_CONTENT_SOURCE, /\.\.\.Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)/, 'expected ALL_CONTENT to include registered branch components')
    assert.match(
      ALL_CONTENT_SOURCE,
      /Object\.fromEntries\(Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)\.map\(\(c\) => \[c\.id, c\]\)\)/,
      'expected resolveContent index to include registered branch components',
    )
  })

  test(`${branchId}: complete procedural BranchLab content and compare links`, () => {
    assert.equal(Object.keys(branch.byId).length, branch.components.length)

    for (const component of branch.components) {
      assert.equal(component.subject, branch.subject)
      assert.equal(component.branch, branch.branchName)
      assert.equal(branch.byId[component.id]?.id, component.id, `expected local byId to resolve ${component.id}`)

      for (const field of ['id', 'name', 'scientificName', 'system', 'tagline', 'summary', 'whyItMatters', 'didYouKnow', 'compareReason'] as const) {
        assertText(component, field)
      }

      if (REAL_GLB_COMPONENT_IDS.has(component.id)) {
        const resolution = componentAssetResolution(component)
        assert.equal(resolution.status, 'ready', `expected registered GLB for ${component.id}`)
        assert.ok(resolution.asset, `expected asset metadata for ${component.id}`)
        assert.notEqual(resolution.asset.licenseStatus, 'REVIEW')
      } else {
        assert.equal(component.model, '', `expected procedural-only component ${component.id} not to claim a GLB`)
      }
      assert.ok(component.visual?.shape, `expected visual.shape for ${component.id}`)
      assert.ok(knownShapes.has(component.visual.shape), `expected known procedural shape for ${component.id}: ${component.visual.shape}`)
      assert.ok(component.visual.variables?.length && component.visual.variables.length >= 3, `expected visual variables for ${component.id}`)

      assert.ok(component.keyFacts.length >= 5, `expected key facts for ${component.id}`)
      assert.ok(component.belongsTo.length >= 3, `expected belongsTo trail for ${component.id}`)
      assert.ok(component.conditions.length >= 3, `expected conditions for ${component.id}`)
      assert.ok(component.hotspots.length >= 3, `expected hotspots for ${component.id}`)
      for (const hotspot of component.hotspots) {
        assert.ok(hotspot.id.length > 0, `expected hotspot id for ${component.id}`)
        assert.ok(hotspot.label.length > 0, `expected hotspot label for ${component.id}`)
        assert.equal(hotspot.position.length, 3, `expected 3D hotspot position for ${component.id}`)
        assert.ok(hotspot.color.length > 0, `expected hotspot color for ${component.id}`)
        assert.ok(hotspot.description.length > 0, `expected hotspot description for ${component.id}`)
        assert.ok(hotspot.function.length > 0, `expected hotspot function for ${component.id}`)
      }

      assertLesson(component)
      assertQuiz(component)

      assert.ok(component.compareCandidate.length > 0, `expected compareCandidate for ${component.id}`)
      assert.notEqual(component.compareCandidate, component.id, `expected ${component.id} not to compare with itself`)
      assert.equal(branch.byId[component.compareCandidate]?.id, component.compareCandidate, `expected compare link to resolve for ${component.id}`)

      const resolution = componentAssetResolution(component)
      if (REAL_GLB_COMPONENT_IDS.has(component.id)) {
        assert.equal(resolution.status, 'ready', `expected real GLB component ${component.id} to resolve`)
      } else {
        assert.equal(resolution.status, 'missing', `expected procedural-only component ${component.id} not to resolve a claimed GLB`)
      }
    }
  })
}

test('organic-chemistry-foundations: P1 content has visible model plan and cause-effect interactions', () => {
  const branch = branchData['organic-chemistry-foundations']
  const copy = JSON.stringify(branch.components).toLowerCase()

  assert.doesNotMatch(copy, /coming soon|premium glb sourcing needed|preview model/)

  for (const component of branch.components) {
    const hasVisibleModel =
      component.model.length > 0 ||
      (component.visual?.shape && knownShapes.has(component.visual.shape))
    assert.ok(hasVisibleModel, `expected visible 3D/procedural model for ${component.id}`)

    const factLabels = new Set(component.keyFacts.map((fact) => fact.label))
    assert.ok(factLabels.has('Cause'), `expected cause fact for ${component.id}`)
    assert.ok(factLabels.has('Effect'), `expected effect fact for ${component.id}`)
    assert.ok(factLabels.has('Evidence to watch'), `expected visible evidence fact for ${component.id}`)

    const interactionCopy = [
      component.summary,
      component.lesson.predictionPrompt,
      component.lesson.practiceItem,
      component.lesson.checkpoint,
      component.compareReason,
    ].join(' ')
    assert.match(interactionCopy, /tap|compare|pick|track|focus|follow|look/i, `expected interactive instruction for ${component.id}`)
    assert.match(component.lesson.predictionPrompt, /predict:\s*(if|when)/i, `expected cause/effect prediction for ${component.id}`)
    assert.match(component.lesson.checkpoint, /change|because|depend|interact/i, `expected explanatory checkpoint for ${component.id}`)
  }
})
