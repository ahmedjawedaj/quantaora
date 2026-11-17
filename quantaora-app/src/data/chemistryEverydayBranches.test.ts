import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { HIERARCHY } from './hierarchy.ts'
import { statesOfMatter, statesOfMatterById } from './statesOfMatter.ts'
import { acidsAndBases, acidsAndBasesById } from './acidsAndBases.ts'
import { solutions, solutionsById } from './solutions.ts'
import { componentAssetResolution } from './modelRegistry.ts'
import { KNOWN_COMPOSITIONS } from '../lib/procedural/types.ts'
import type { ComponentContent } from './types.ts'

const BRANCH_MODULES_PATH = fileURLToPath(new URL('./branchModules.ts', import.meta.url))
const ALL_CONTENT_PATH = fileURLToPath(new URL('./allContent.ts', import.meta.url))
const PUBLIC_ROOT = join(process.cwd(), 'public')
const branchModulesSource = readFileSync(BRANCH_MODULES_PATH, 'utf8')
const allContentSource = readFileSync(ALL_CONTENT_PATH, 'utf8')
const knownShapes = new Set<string>(KNOWN_COMPOSITIONS)

const branchData = {
  'states-of-matter': {
    name: 'States Of Matter',
    components: statesOfMatter,
    byId: statesOfMatterById,
    importName: 'statesOfMatter',
    importPath: './statesOfMatter',
    requiredTerms: ['solid', 'liquid', 'gas', 'melting', 'freezing', 'evaporation', 'condensation', 'particle motion'],
  },
  'acids-and-bases': {
    name: 'Acids And Bases',
    components: acidsAndBases,
    byId: acidsAndBasesById,
    importName: 'acidsAndBases',
    importPath: './acidsAndBases',
    requiredTerms: ['ph scale', 'acid', 'base', 'indicator', 'neutralization'],
  },
  solutions: {
    name: 'Solutions',
    components: solutions,
    byId: solutionsById,
    importName: 'solutions',
    importPath: './solutions',
    requiredTerms: ['solute', 'solvent', 'concentration', 'saturation', 'dissolving', 'mixing'],
  },
} as const

const allChemistryEverydayById: Record<string, ComponentContent> = {
  ...statesOfMatterById,
  ...acidsAndBasesById,
  ...solutionsById,
}

function searchableText(components: ComponentContent[]): string {
  return components
    .flatMap((component) => [
      component.id,
      component.name,
      component.scientificName,
      component.system,
      component.tagline,
      component.summary,
      component.whyItMatters,
      component.didYouKnow,
      ...component.keyFacts.flatMap((fact) => [fact.label, fact.value]),
      ...component.lesson.steps.flatMap((step) => [step.title, step.body]),
    ])
    .join(' ')
    .toLowerCase()
}

for (const [branchId, branch] of Object.entries(branchData)) {
  test(`${branchId}: branch is live and routes through generic BranchLab`, () => {
    const branchInfo = HIERARCHY.chemistry.branches.find((candidate) => candidate.id === branchId)
    assert.ok(branchInfo, `expected hierarchy entry for ${branchId}`)
    assert.equal(branchInfo.status, 'live')
    assert.equal(branchInfo.componentCount, branch.components.length)
    assert.equal(branchInfo.route, `/app/labs/branch/${branchId}`)
    assert.ok(branch.components.length >= 3 && branch.components.length <= 5, `expected ${branchId} to have 3-5 components`)
  })

  test(`${branchId}: branchComponents registry and resolveContent indexing include the module`, () => {
    assert.match(
      branchModulesSource,
      new RegExp(`import \\{ ${branch.importName} \\} from '${branch.importPath.replace('.', '\\.')}'`),
      `expected branchModules.ts to import ${branch.importName}`,
    )
    assert.match(
      branchModulesSource,
      new RegExp(branchId === 'solutions' ? '\\bsolutions,' : `'${branchId}': ${branch.importName}`),
      `expected branchModules.ts to register ${branchId}`,
    )
    assert.match(branchModulesSource, /export function branchComponents\(branchId: string\): ComponentContent\[\]/)
    assert.match(
      allContentSource,
      /\.\.\.Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)/,
      'expected resolveContent index to include BRANCH_COMPONENTS values',
    )
  })

  test(`${branchId}: planned concepts are represented in low-level content`, () => {
    const text = searchableText(branch.components)
    for (const term of branch.requiredTerms) {
      assert.ok(text.includes(term), `expected ${branchId} content to mention "${term}"`)
    }
  })

  test(`${branchId}: content resolves locally and is complete for BranchLab`, () => {
    assert.equal(Object.keys(branch.byId).length, branch.components.length)

    for (const component of branch.components) {
      assert.equal(component.subject, 'chemistry')
      assert.equal(component.branch, branch.name)
      assert.equal(branch.byId[component.id]?.id, component.id, `expected local byId to resolve ${component.id}`)

      assert.ok(component.id.length > 0, `expected id for ${component.name}`)
      assert.ok(component.name.length > 0, `expected name for ${component.id}`)
      assert.ok(component.scientificName.length > 0, `expected scientificName for ${component.id}`)
      assert.ok(component.system.length > 0, `expected system for ${component.id}`)
      assert.ok(component.tagline.length > 0, `expected tagline for ${component.id}`)
      assert.ok(component.summary.length > 0, `expected summary for ${component.id}`)
      assert.ok(component.keyFacts.length >= 5, `expected key facts for ${component.id}`)
      assert.ok(component.whyItMatters.length > 0, `expected whyItMatters for ${component.id}`)
      assert.ok(component.didYouKnow.length > 0, `expected didYouKnow for ${component.id}`)
      assert.ok(component.belongsTo.length >= 3, `expected belongsTo for ${component.id}`)
      assert.ok(component.conditions.length >= 3, `expected conditions for ${component.id}`)
      assert.ok(component.hotspots.length >= 3, `expected hotspots for ${component.id}`)

      assert.ok(component.visual?.shape, `expected procedural visual shape for ${component.id}`)
      assert.ok(knownShapes.has(component.visual.shape), `expected known procedural shape for ${component.id}`)
      assert.ok(Array.isArray(component.visual.variables), `expected visual variables for ${component.id}`)
      assert.ok(component.visual.variables.length >= 3, `expected cause/effect visual variables for ${component.id}`)

      assert.deepEqual(component.lesson.steps.map((step) => step.title), ['Predict', 'Change', 'Observe', 'Explain'])
      assert.ok(component.lesson.predictionPrompt.length > 0, `expected predictionPrompt for ${component.id}`)
      assert.ok(component.lesson.practiceItem.length > 0, `expected practiceItem for ${component.id}`)
      assert.ok(component.lesson.checkpoint.length > 0, `expected checkpoint for ${component.id}`)

      assert.ok(component.quiz.length >= 4, `expected quiz for ${component.id}`)
      for (const question of component.quiz) {
        assert.ok(question.prompt.length > 0, `expected quiz prompt for ${component.id}`)
        assert.ok(question.options.length >= 4, `expected quiz options for ${component.id}`)
        assert.ok(
          question.correctIndex >= 0 && question.correctIndex < question.options.length,
          `expected valid correctIndex for ${component.id}`,
        )
        assert.ok(question.explanation.length > 0, `expected quiz explanation for ${component.id}`)
        assert.ok(question.misconception.length > 0, `expected quiz misconception for ${component.id}`)
      }

      assert.ok(component.compareCandidate.length > 0, `expected compareCandidate for ${component.id}`)
      assert.notEqual(component.compareCandidate, component.id, `expected ${component.id} not to compare with itself`)
      assert.ok(
        allChemistryEverydayById[component.compareCandidate],
        `expected compareCandidate ${component.compareCandidate} to resolve for ${component.id}`,
      )
      assert.ok(component.compareReason.length > 0, `expected compareReason for ${component.id}`)
    }
  })

  test(`${branchId}: no GLB is claimed unless it resolves to a real file`, () => {
    for (const component of branch.components) {
      const resolution = componentAssetResolution(component)
      if (!component.model) {
        assert.equal(resolution.status, 'missing', `expected procedural-only component ${component.id} not to claim a GLB`)
        continue
      }

      assert.equal(resolution.status, 'ready', `expected claimed GLB to resolve for ${component.id}`)
      assert.ok(resolution.resolvedUrl, `expected resolved URL for ${component.id}`)
      assert.ok(existsSync(join(PUBLIC_ROOT, resolution.resolvedUrl!)), `expected ${resolution.resolvedUrl} to exist under public/`)
    }
  })
}
