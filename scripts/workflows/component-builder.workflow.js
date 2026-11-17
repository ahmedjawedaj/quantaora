export const meta = {
  name: 'component-builder',
  description: 'Author one STEM learning component end-to-end: 3D asset spec + full content, adversarially verified, written to content/subjects/',
  phases: [
    { title: 'Author', detail: '3D asset agent + content agent in parallel per component' },
    { title: 'Verify', detail: 'accuracy, pedagogy, schema, and visual-quality-vs-reference lenses' },
    { title: 'Synthesize', detail: 'merge + write module.json, lesson.md, quiz.json, model-metadata.json, glossary.json, standards.json' },
  ],
}

// args: array of component descriptors, e.g.
// [{ subject: "biology", subjectName: "Biology", branch: "human-anatomy", branchName: "Human Anatomy",
//    componentId: "heart", componentName: "Heart", belongsTo: ["Cardiovascular system", "Human Anatomy", "Biology"],
//    parts: ["Aorta", "Vena cava", ...], objectType: "Entity" }, ...]
//
// Each component in `args` becomes one independent pipeline chain (agent A and agent B run in
// parallel for that component; the next component's chain runs concurrently, not after this one
// finishes — that's what pipeline() buys us over parallel-then-parallel-then-parallel).

const ASSET_SCHEMA = {
  type: 'object',
  required: ['componentId', 'modelType', 'cameraDefault', 'hotspots', 'visualStyleNotes', 'assetBrief'],
  properties: {
    componentId: { type: 'string' },
    modelType: { type: 'string', enum: ['glb-authored', 'procedural-three'] },
    cameraDefault: {
      type: 'object',
      properties: {
        position: { type: 'array', items: { type: 'number' } },
        target: { type: 'array', items: { type: 'number' } },
      },
    },
    autoRotateDefault: { type: 'boolean' },
    crossSectionAvailable: { type: 'boolean' },
    layers: { type: 'array', items: { type: 'string' } },
    hotspots: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'label', 'conceptId', 'description'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          positionHint: { type: 'string' },
          conceptId: { type: 'string' },
          description: { type: 'string' },
        },
      },
    },
    visualStyleNotes: { type: 'string' },
    assetBrief: {
      type: 'string',
      description: 'Detailed brief a 3D artist or asset pipeline could execute against: proportions, material/shading direction, palette, reference matches, what NOT to do',
    },
  },
}

const CONTENT_SCHEMA = {
  type: 'object',
  required: ['componentId', 'plainLanguageExplanation', 'keyFacts', 'vocabulary', 'whyItMatters', 'lesson', 'quiz'],
  properties: {
    componentId: { type: 'string' },
    plainLanguageExplanation: { type: 'string' },
    keyFacts: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, value: { type: 'string' } } } },
    vocabulary: { type: 'array', items: { type: 'object', properties: { term: { type: 'string' }, definition: { type: 'string' } } } },
    whyItMatters: { type: 'string' },
    parts: { type: 'array', items: { type: 'string' } },
    processes: { type: 'array', items: { type: 'string' } },
    relatedItems: { type: 'array', items: { type: 'string' } },
    compareCandidate: { type: 'string', description: 'What this component is naturally compared against (spec Compare Mode)' },
    lesson: {
      type: 'object',
      properties: {
        steps: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 7 },
        predictionPrompt: { type: 'string' },
        practiceItem: { type: 'string' },
        checkpoint: { type: 'string' },
      },
    },
    quiz: {
      type: 'array',
      minItems: 3,
      items: {
        type: 'object',
        required: ['prompt', 'options', 'correctIndex', 'explanation', 'misconception'],
        properties: {
          prompt: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'number' },
          explanation: { type: 'string' },
          misconception: { type: 'string' },
        },
      },
    },
  },
}

const VERDICT_SCHEMA = {
  type: 'object',
  required: ['lens', 'pass', 'notes'],
  properties: {
    lens: { type: 'string' },
    pass: { type: 'boolean' },
    notes: { type: 'string' },
    requiredFixes: { type: 'array', items: { type: 'string' } },
  },
}

function assetPrompt(c) {
  return `You are designing the 3D interactive model spec for the STEM learning component "${c.componentName}" ` +
    `(id: ${c.componentId}), which belongs to ${c.belongsTo?.join(' -> ') ?? `${c.branchName} -> ${c.subjectName}`}.\n\n` +
    `Reference quality bar: Anatomy Atelier (see assets/reference/anatomy-atelier/*.png and ` +
    `https://anatomy-livid.vercel.app/) — warm off-white background, calm premium typography, ` +
    `large centered 3D object, minimal chrome, soft tactile cards, elegant clean 3D assets, ` +
    `colored hotspot dots that open structure cards. Do NOT produce gamey, cluttered, or ` +
    `glow/gradient-heavy visuals (spec section 12 explicitly rules this out).\n\n` +
    `Known parts/sub-structures to place hotspots on: ${JSON.stringify(c.parts ?? [])}.\n\n` +
    `Produce a ModelAsset spec (spec section 21): model type (glb-authored if it needs real ` +
    `anatomical/geometric fidelity, procedural-three if it can be built from primitives — e.g. ` +
    `planets, molecules, motion carts), default camera position/target, layers, hotspots (each ` +
    `mapped to a conceptId matching a part name), auto-rotate default, cross-section availability ` +
    `where relevant, and a detailed assetBrief a 3D artist or asset pipeline could execute against ` +
    `without further clarification. Call the StructuredOutput tool with this shape.`
}

function contentPrompt(c) {
  return `You are authoring the full learning content for the STEM component "${c.componentName}" ` +
    `(id: ${c.componentId}), which belongs to ${c.belongsTo?.join(' -> ') ?? `${c.branchName} -> ${c.subjectName}`}.\n\n` +
    `Follow the Component-Level Learning Flow exactly (spec section 6): See it, Touch it, Name it, ` +
    `Explain it, Belongs to, Compare it, Use it, Review it. Write for the target learner (ages 8-16, ` +
    `visual learners, struggles with abstract textbook explanations — spec section 5). Facts must be ` +
    `scientifically accurate; if you are not confident of a specific number/fact, omit it rather than ` +
    `inventing it.\n\n` +
    `Known parts/sub-structures: ${JSON.stringify(c.parts ?? [])}.\n\n` +
    `Produce: plain-language explanation, key facts, vocabulary, why-it-matters note, parts, related ` +
    `processes, a natural compare-mode candidate, a 3-7 step lesson with one prediction prompt and one ` +
    `practice item ending in a checkpoint, and a 3+ question quiz where every question has feedback ` +
    `explaining both why the correct answer is right and the common misconception behind wrong answers ` +
    `(spec section 13). Call the StructuredOutput tool with this shape.`
}

function verifyPrompt(lens, c, asset, content) {
  const lensInstructions = {
    accuracy: 'Verify every factual claim in the content draft is scientifically correct for the target age group. Flag anything you are not confident is true.',
    pedagogy: 'Verify the lesson/quiz actually teaches the concept: right difficulty, no jumps in reasoning, quiz questions test understanding not trivia, misconception explanations are genuinely instructive.',
    schema: 'Verify the asset and content drafts satisfy the spec\'s Component-Level Learning Flow and structure card fields (spec sections 6, 13, 21) — nothing required is missing.',
    visual: 'Verify the asset brief and hotspot/camera/style choices genuinely match the Anatomy Atelier reference quality bar (warm, calm, premium, clean 3D, not gamey/cluttered) — reject anything generic or AI-slop.',
  }
  return `Component: ${c.componentName} (${c.componentId}).\n` +
    `Asset draft: ${JSON.stringify(asset)}\n\n` +
    `Content draft: ${JSON.stringify(content)}\n\n` +
    `Lens: ${lens}. ${lensInstructions[lens]}\n` +
    `Default to pass=false if uncertain — this gate exists to keep quality high. ` +
    `Call the StructuredOutput tool with {lens: "${lens}", pass, notes, requiredFixes}.`
}

function synthesizePrompt(c, asset, content, verdicts) {
  const fixes = verdicts.filter(v => v && !v.pass).flatMap(v => v.requiredFixes ?? [])
  return `Write the final authored files for STEM component "${c.componentName}" (id: ${c.componentId}) ` +
    `to content/subjects/${c.subject}/${c.branch}/${c.componentId}/ :\n` +
    `  - module.json (LearningModule shape, spec section 23)\n` +
    `  - lesson.md\n` +
    `  - quiz.json\n` +
    `  - model-metadata.json (ModelAsset shape, spec section 21)\n` +
    `  - glossary.json\n` +
    `  - standards.json (leave standards array empty for now — no curriculum pack sourced yet)\n\n` +
    `Asset draft: ${JSON.stringify(asset)}\n\n` +
    `Content draft: ${JSON.stringify(content)}\n\n` +
    (fixes.length
      ? `Reviewer-required fixes to apply before writing, do not ignore these:\n- ${fixes.join('\n- ')}\n\n`
      : `All review lenses passed with no required fixes.\n\n`) +
    `Use the Write tool for each file. Return a short confirmation listing the files written.`
}

let components = []
if (Array.isArray(args)) {
  components = args
} else if (typeof args === 'string' && args.trim()) {
  try {
    const parsed = JSON.parse(args)
    if (Array.isArray(parsed)) components = parsed
  } catch {
    // fall through to empty
  }
}
if (!components.length) {
  log('No components passed via args — nothing to build. Pass an array of component descriptors from content/taxonomy/*.json.')
}

const results = await pipeline(
  components,
  // Stage 1: author asset + content in parallel for this component
  (c) => parallel([
    () => agent(assetPrompt(c), { label: `asset:${c.componentId}`, phase: 'Author', schema: ASSET_SCHEMA }),
    () => agent(contentPrompt(c), { label: `content:${c.componentId}`, phase: 'Author', schema: CONTENT_SCHEMA }),
  ]),
  // Stage 2: 4-lens adversarial verify, run in parallel
  ([asset, content], c) => {
    if (!asset || !content) return { c, asset, content, verdicts: [] }
    const lenses = ['accuracy', 'pedagogy', 'schema', 'visual']
    return parallel(lenses.map(lens => () =>
      agent(verifyPrompt(lens, c, asset, content), { label: `verify:${lens}:${c.componentId}`, phase: 'Verify', schema: VERDICT_SCHEMA })
    )).then(verdicts => ({ c, asset, content, verdicts: verdicts.filter(Boolean) }))
  },
  // Stage 3: synthesize + write files, folding in any required fixes from stage 2
  ({ c, asset, content, verdicts }) => {
    if (!asset || !content) {
      log(`Skipping synthesis for ${c?.componentId ?? 'unknown'} — asset or content authoring failed.`)
      return null
    }
    return agent(synthesizePrompt(c, asset, content, verdicts), { label: `write:${c.componentId}`, phase: 'Synthesize' })
  }
)

const written = results.filter(Boolean)
log(`Authored ${written.length}/${components.length} components.`)
return { requested: components.length, written: written.length, results: written }
