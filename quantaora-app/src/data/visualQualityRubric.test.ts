import assert from 'node:assert/strict'
import { test } from 'node:test'
import { HIERARCHY } from './hierarchy.ts'
import { branchVisualQualityProfile, BRANCH_VISUAL_QUALITY, visualQualityNeedsReplacement } from './visualQualityRubric.ts'

test('every live branch has an explicit visual quality profile', () => {
  const liveBranches = Object.values(HIERARCHY).flatMap((subject) =>
    subject.branches.filter((branch) => branch.status === 'live').map((branch) => ({ subjectId: subject.id, branch })),
  )

  const profileIds: Set<string> = new Set(BRANCH_VISUAL_QUALITY.map((profile) => profile.branchId))
  const missing = liveBranches.filter(({ branch }) => !profileIds.has(branch.id)).map(({ branch }) => branch.id)

  assert.deepEqual(missing, [])
})

test('visual quality profile subjects match the curriculum hierarchy', () => {
  const mismatches = Object.values(HIERARCHY).flatMap((subject) =>
    subject.branches
      .filter((branch) => branch.status === 'live')
      .map((branch) => ({ branch, profile: branchVisualQualityProfile(branch.id), expectedSubject: subject.id }))
      .filter(({ profile, expectedSubject }) => profile?.subject !== expectedSubject)
      .map(({ branch, profile, expectedSubject }) => `${branch.id}: expected ${expectedSubject}, got ${profile?.subject ?? 'missing'}`),
  )

  assert.deepEqual(mismatches, [])
})

test('rubric separates legal blockers, realism replacements, and flagship-ready branches', () => {
  assert.equal(branchVisualQualityProfile('human-anatomy')?.replacementPriority, 'P0 legal')
  assert.equal(branchVisualQualityProfile('animals')?.grade, 'replace')
  assert.equal(visualQualityNeedsReplacement(branchVisualQualityProfile('animals')), true)
  assert.equal(branchVisualQualityProfile('solar-system')?.grade, 'flagship')
  assert.equal(visualQualityNeedsReplacement(branchVisualQualityProfile('solar-system')), false)
})
