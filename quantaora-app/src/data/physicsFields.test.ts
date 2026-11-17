import { test } from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { lightAndOptics } from './lightAndOptics.ts'
import { magnetism } from './magnetism.ts'
import { resolveAuthoredAsset } from './modelRegistry.ts'

const PUBLIC_ROOT = fileURLToPath(new URL('../../public', import.meta.url))
const BRANCH_MODULES_PATH = fileURLToPath(new URL('./branchModules.ts', import.meta.url))
const HIERARCHY_PATH = fileURLToPath(new URL('./hierarchy.ts', import.meta.url))
const ALL_CONTENT_PATH = fileURLToPath(new URL('./allContent.ts', import.meta.url))
const branchModulesSource = readFileSync(BRANCH_MODULES_PATH, 'utf8')
const hierarchySource = readFileSync(HIERARCHY_PATH, 'utf8')
const allContentSource = readFileSync(ALL_CONTENT_PATH, 'utf8')

const branchData = {
  'light-and-optics': {
    route: '/app/labs/branch/light-and-optics',
    components: lightAndOptics,
    importName: 'lightAndOptics',
  },
  magnetism: {
    route: '/app/labs/branch/magnetism',
    components: magnetism,
    importName: 'magnetism',
  },
} as const

function publicPathExists(model: string): boolean {
  return existsSync(`${PUBLIC_ROOT}${model}`)
}

// Mirrors the repo's BranchLab.test.ts convention: branchModules.ts/allContent.ts use Vite-style
// extensionless internal imports, which node --test cannot resolve directly. These tests therefore
// import the new leaf data modules and assert that the registry source wires them into
// branchComponents()/resolveContent().
for (const [branchId, branch] of Object.entries(branchData)) {
  test(`${branchId}: branch is live and routed through generic BranchLab`, () => {
    assert.match(hierarchySource, new RegExp(`id: '${branchId}', name: '[^']+', status: 'live', componentCount: ${branch.components.length}, route: '${branch.route}'`))
    assert.ok(branch.components.length >= 3, `expected ${branchId} to expose several components`)
  })

  test(`${branchId}: components are registered for branchComponents and resolveContent indexing`, () => {
    assert.match(branchModulesSource, new RegExp(`import \\{ ${branch.importName} \\} from './${branch.importName}'`))
    assert.match(branchModulesSource, new RegExp(`'${branchId}': ${branch.importName}|\\b${branch.importName},`))
    assert.match(branchModulesSource, /export function branchComponents\(branchId: string\): ComponentContent\[\]/)
    assert.match(allContentSource, /\.\.\.Object\.values\(BRANCH_COMPONENTS\)\.flat\(\)/, 'expected resolveContent index to include BRANCH_COMPONENTS')
    for (const component of branch.components) {
      assert.equal(component.subject, 'physics')
      assert.equal(component.id.length > 0, true)
    }
  })

  test(`${branchId}: lessons and quizzes are populated`, () => {
    for (const component of branch.components) {
      assert.ok(component.keyFacts.length >= 3, `expected keyFacts for ${component.id}`)
      assert.ok(component.hotspots.length > 0, `expected hotspots for ${component.id}`)
      assert.ok(component.lesson.steps.length >= 4, `expected Predict/Change/Observe/Explain steps for ${component.id}`)
      assert.deepEqual(component.lesson.steps.map((step) => step.title), ['Predict', 'Change', 'Observe', 'Explain'])
      assert.ok(component.quiz.length >= 3, `expected quiz questions for ${component.id}`)
      for (const question of component.quiz) {
        assert.ok(question.correctIndex >= 0 && question.correctIndex < question.options.length, `expected valid correctIndex for ${component.id}`)
      }
      assert.ok(component.compareCandidate.length > 0, `expected compareCandidate for ${component.id}`)
      assert.ok(branch.components.some((candidate) => candidate.id === component.compareCandidate), `expected compareCandidate ${component.compareCandidate} to resolve inside ${branchId}`)
    }
  })
}

test('physics field GLBs resolve through the model registry and exist on disk', () => {
  for (const model of [
    '/models/sourced/physics-fields/lens.glb',
    '/models/sourced/physics-fields/compass.glb',
    '/models/sourced/physics-fields/bulb.glb',
  ]) {
    const resolution = resolveAuthoredAsset(model)
    assert.equal(resolution.status, 'ready', `expected ${model} to resolve`)
    assert.equal(resolution.resolvedUrl, model)
    assert.equal(resolution.asset?.subject, 'physics')
    assert.ok(publicPathExists(model), `expected ${model} to exist under public/`)
  }
})
