import { z } from 'zod'

// ── Public subject / grade contract (mirrors content taxonomy) ───────────────
export const subjectIdSchema = z.enum(['physics', 'chemistry', 'math', 'biology', 'space'])
export type SubjectId = z.infer<typeof subjectIdSchema>

// ── Vec3 (coordinates in the normalized 3D pivot space) ─────────────────────
export const zVec3 = z.tuple([z.number(), z.number(), z.number()])

// ── Raw authoring-file schemas (what content/ actually holds) ──────────────
// Deliberately permissive where the on-disk set is inconsistent (e.g. both
// `defaultCamera` and `cameraDefault`, layered `layers` union), since codegen
// must accept the shipped set, not a pipe-dream. `passthrough()` preserves
// authoring-only keys (visualStyleNotes, assetBrief, crossReferences…).

const zHierarchyPath = z
  .object({
    subject: z.string(),
    branch: z.string(),
    unit: z.string().optional(),
    systemOrGroup: z.string().optional(),
    component: z.string().optional(),
    displayPath: z.string().optional(),
  })
  .passthrough()

const zKeyFact = z.object({ label: z.string(), value: z.string() })

export const moduleFileSchema = z
  .object({
    id: z.string(),
    subject: subjectIdSchema,
    title: z.string(),
    summary: z.string(),
    gradeMin: z.number(),
    gradeMax: z.number(),
    skillIds: z.array(z.string()).default([]),
    type: z.enum(['module', 'model', 'process', 'simulation', 'manipulative', 'project']).optional(),
    estimatedMinutes: z.number().optional(),
    hierarchyPath: zHierarchyPath.optional(),
    crossReferences: z.array(z.any()).optional(),
    belongsTo: z.union([z.string(), z.array(z.string())]).optional(),
    parts: z.array(z.string()).optional(),
    processes: z.array(z.string()).optional(),
    plainLanguageExplanation: z.string().optional(),
    keyFacts: z.array(zKeyFact).optional(),
    whyItMatters: z.string().optional(),
    files: z.record(z.string(), z.string()).optional(),
    compareCandidate: z.union([z.string(), z.object({ label: z.string(), description: z.string() })]).optional(),
    // app-shaped keys — only a few modules author these today
    name: z.string().optional(),
    scientificName: z.string().optional(),
    branch: z.string().optional(),
    system: z.string().optional(),
    tagline: z.string().optional(),
    model: z.union([z.string(), z.record(z.string(), z.any())]).optional(),
    didYouKnow: z.string().optional(),
    conditions: z.array(z.string()).optional(),
    compareCandidateId: z.string().optional(),
    compareReason: z.string().optional(),
    lesson: z
      .object({
        steps: z.array(z.object({ title: z.string(), body: z.string() })).optional(),
        predictionPrompt: z.string().optional(),
        practiceItem: z.string().optional(),
        checkpoint: z.string().optional(),
      })
      .optional(),
  })
  .passthrough()

export type ModuleFile = z.infer<typeof moduleFileSchema>

// Compositions the generic viewer can render procedurally when no GLB exists
// (docs/PROCEDURAL-VISUALS.md L2). `shape` names a composition in
// src/components/explorer/procedural/compositions.tsx.
export const proceduralVisualSchema = z
  .object({
    shape: z.string(),
    variables: z.array(z.string()).optional(),
  })
  .passthrough()
export type ProceduralVisual = z.infer<typeof proceduralVisualSchema>

export const modelMetadataFileSchema = z
  .object({
    componentId: z.string(),
    modelType: z.string().optional(),
    url: z.union([z.string(), z.null()]).optional(),
    thumbnailUrl: z.union([z.string(), z.null()]).optional(),
    visual: proceduralVisualSchema.optional(),
    defaultCamera: z.object({ position: zVec3, target: zVec3 }).optional(),
    cameraDefault: z.object({ position: zVec3, target: zVec3 }).optional(),
    autoRotateDefault: z.boolean().optional(),
    crossSectionAvailable: z.boolean().optional(),
    hotspots: z
      .array(
        z
          .object({
            id: z.string(),
            label: z.string(),
            conceptId: z.string().optional(),
            position: zVec3,
            description: z.string().optional(),
            color: z.string().optional(),
            function: z.string().optional(),
          })
          .passthrough(),
      )
      .optional(),
    layers: z.any().optional(),
  })
  .passthrough()

// layers is union of string[] | object[] across files — keep loose, tighten in codegen.
export type ModelMetadataFile = z.infer<typeof modelMetadataFileSchema>

export const quizFileSchema = z.object({
  componentId: z.string(),
  questions: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
      misconception: z.string(),
    }),
  ),
})
export type QuizFile = z.infer<typeof quizFileSchema>

export const glossaryFileSchema = z.object({
  componentId: z.string(),
  terms: z.array(z.object({ term: z.string(), definition: z.string(), conceptId: z.string().optional() })),
})
export type GlossaryFile = z.infer<typeof glossaryFileSchema>

export const standardsFileSchema = z.object({
  componentId: z.string(),
  status: z.enum(['pending-sourcing', 'sourced']).default('pending-sourcing'),
  standards: z.array(z.any()).default([]),
})
export type StandardsFile = z.infer<typeof standardsFileSchema>

// ── The normalized, app-facing contract (generated output / types.ts family) ──
// This is the de-facto contract the app renders. `default()s` fill gaps so a
// generated component is always complete without silent undefined-propagation.

export const APP_DEFAULT_HOTSPOT = '#C08968'

export const hotpotSchema = z.object({
  id: z.string(),
  label: z.string(),
  position: zVec3,
  color: z.string().default(APP_DEFAULT_HOTSPOT),
  description: z.string().default(''),
  function: z.string().default(''),
})
export type Hotspot = z.infer<typeof hotpotSchema>

export const componentContentSchema = z.object({
  id: z.string(),
  name: z.string(),
  scientificName: z.string().default(''),
  subject: subjectIdSchema,
  branch: z.string(),
  system: z.string().default(''),
  model: z.string().default(''),
  tagline: z.string().default(''),
  summary: z.string(),
  keyFacts: z.array(zKeyFact),
  whyItMatters: z.string().default(''),
  didYouKnow: z.string().default(''),
  belongsTo: z.array(z.string()).default([]),
  conditions: z.array(z.string()).default([]),
  visual: proceduralVisualSchema.optional(),
  hotspots: z.array(hotpotSchema).default([]),
  lesson: z.object({
    steps: z.array(z.object({ title: z.string(), body: z.string() })),
    predictionPrompt: z.string().default(''),
    practiceItem: z.string().default(''),
    checkpoint: z.string().default(''),
  }),
  quiz: z.array(
    z.object({
      prompt: z.string(),
      options: z.array(z.string()),
      correctIndex: z.number(),
      explanation: z.string(),
      misconception: z.string(),
    }),
  ),
  compareCandidate: z.string().default(''),
  compareReason: z.string().default(''),
})
export type ComponentContent = z.infer<typeof componentContentSchema>