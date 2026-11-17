import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'biology' as const
const branch = 'Evolution'
const authoredBiologyModel = (id: string) => `/models/biology/authored/${id}.glb`
const EVOLUTION_SPECIMEN_MODEL = '/models/biology/authored/evolution-fossil-specimen-suite.glb'
const SCATTERING_SKULL_MODEL = '/models/sourced/biology-evolution/scattering-skull-khronos.glb'

function evolutionModel(id: string) {
  if (id === 'biology-evolution-fossil-evidence') {
    return SCATTERING_SKULL_MODEL
  }
  if (
    id === 'biology-evolution-common-ancestry' ||
    id === 'biology-evolution-adaptation'
  ) {
    return EVOLUTION_SPECIMEN_MODEL
  }
  return authoredBiologyModel(id)
}

function lesson(predictionPrompt: string, change: string, observe: string, explain: string) {
  return {
    steps: [
      { title: 'Predict', body: predictionPrompt },
      { title: 'Change', body: change },
      { title: 'Observe', body: observe },
      { title: 'Explain', body: explain },
    ],
    predictionPrompt,
    practiceItem: change,
    checkpoint: explain,
  }
}

function quiz(prompt: string, answer: string, misconception: string): QuizQuestion[] {
  return [
    {
      prompt,
      options: [answer, misconception, 'The branch name decides the result', 'All individuals change on purpose'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What should a learner change to test this evolution idea?',
      options: ['One pressure or trait at a time', 'Every variable at once', 'Only the label colors', 'Nothing in the model'],
      correctIndex: 0,
      explanation: 'Changing one cause at a time makes the pattern easier to connect to evidence.',
      misconception: 'Changing everything at once hides which cause mattered.',
    },
    {
      prompt: 'Which kind of evidence is strongest for an evolutionary explanation?',
      options: ['A repeatable pattern across many organisms or fossils', 'A single guess', 'The biggest animal in the scene', 'A name that sounds scientific'],
      correctIndex: 0,
      explanation: 'Evolutionary claims are stronger when different lines of evidence point to the same explanation.',
      misconception: 'A scientific-sounding name is not evidence by itself.',
    },
  ]
}

function facts(definition: string, evidence: string, test: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Evidence', value: evidence },
    { label: 'Test move', value: test },
    { label: 'Timescale', value: 'Usually many generations, not one lifetime' },
  ]
}

function component(input: {
  id: string
  name: string
  scientificName: string
  system: string
  tagline: string
  summary: string
  keyFacts: KeyFact[]
  whyItMatters: string
  didYouKnow: string
  belongsTo: string[]
  conditions: string[]
  visualShape: string
  visualVariables: string[]
  hotspots: Hotspot[]
  prediction: string
  change: string
  observe: string
  explain: string
  quizPrompt: string
  quizAnswer: string
  quizMisconception: string
  compareCandidate: string
  compareReason: string
}): ComponentContent {
  return {
    id: input.id,
    name: input.name,
    scientificName: input.scientificName,
    subject,
    branch,
    system: input.system,
    model: evolutionModel(input.id),
    tagline: input.tagline,
    summary: input.summary,
    keyFacts: input.keyFacts,
    whyItMatters: input.whyItMatters,
    didYouKnow: input.didYouKnow,
    belongsTo: input.belongsTo,
    conditions: input.conditions,
    visual: { shape: input.visualShape, variables: input.visualVariables },
    hotspots: input.hotspots,
    lesson: lesson(input.prediction, input.change, input.observe, input.explain),
    quiz: quiz(input.quizPrompt, input.quizAnswer, input.quizMisconception),
    compareCandidate: input.compareCandidate,
    compareReason: input.compareReason,
  }
}

export const evolution: ComponentContent[] = [
  component({
    id: 'biology-evolution-variation',
    name: 'Variation',
    scientificName: 'Heritable variation',
    system: 'Population traits',
    tagline: 'Differences give selection something to sort',
    summary:
      'Variation means individuals in a population are not identical. Some differences are inherited, and those inherited differences can become more or less common over generations.',
    keyFacts: facts('Inherited differences among individuals', 'Trait counts vary inside one population', 'Sort the same population under two environments'),
    whyItMatters:
      'Without variation, natural selection has no useful differences to favor when environments change.',
    didYouKnow:
      'Even siblings can carry different combinations of alleles, which is one source of variation in a population.',
    belongsTo: ['Evolution', 'Genetics', 'Populations'],
    conditions: ['Traits must vary', 'Some variation must be inherited', 'A population contains many individuals'],
    visualShape: 'trait-cards',
    visualVariables: ['trait type', 'allele mix', 'population count'],
    hotspots: [
      { id: 'trait-a', label: 'Trait A', position: [-0.8, 0.2, 0.1], color: '#2563eb', description: 'One visible form of a trait.', function: 'Shows one option that can be counted in the population.' },
      { id: 'trait-b', label: 'Trait B', position: [0.15, 0.2, 0.1], color: '#16a34a', description: 'A second visible form of the same trait.', function: 'Lets learners compare frequencies instead of treating all individuals as identical.' },
      { id: 'population', label: 'Population', position: [0.75, -0.1, 0.1], color: '#f97316', description: 'Many individuals with mixed traits.', function: 'Makes evolution a population pattern, not a single-organism event.' },
    ],
    prediction: 'Predict which trait will become more common if the habitat becomes colder.',
    change: 'Change the environment label from warm to cold while keeping the starting population the same.',
    observe: 'Observe which trait cards survive or reproduce more often after several rounds.',
    explain: 'Explain why the population changed only because inherited variation already existed.',
    quizPrompt: 'Why is variation important for evolution?',
    quizAnswer: 'It gives populations inherited differences that selection can act on.',
    quizMisconception: 'It means every individual changes because it wants to survive.',
    compareCandidate: 'biology-evolution-natural-selection',
    compareReason: 'Variation supplies the differences; natural selection changes how common those differences become.',
  }),
  component({
    id: 'biology-evolution-natural-selection',
    name: 'Natural Selection',
    scientificName: 'Differential survival and reproduction',
    system: 'Selection pressure',
    tagline: 'Helpful inherited traits can become more common',
    summary:
      'Natural selection happens when individuals with certain inherited traits survive and reproduce more in a particular environment. Over generations, those traits can increase in the population.',
    keyFacts: facts('A change in trait frequency caused by survival and reproduction differences', 'Survivors leave more offspring with the trait', 'Switch the pressure and watch the winning trait change'),
    whyItMatters:
      'Natural selection explains how populations can become better matched to their environments without planning or purpose.',
    didYouKnow:
      'A trait that helps in one environment can be neutral or harmful in a different environment.',
    belongsTo: ['Evolution', 'Adaptation', 'Populations'],
    conditions: ['Inherited variation exists', 'Traits affect survival or reproduction', 'More than one generation passes'],
    visualShape: 'population-cluster',
    visualVariables: ['selection pressure', 'survival rate', 'offspring count'],
    hotspots: [
      { id: 'pressure', label: 'Pressure', position: [-0.9, 0.35, 0.1], color: '#dc2626', description: 'A condition such as cold, drought, or predators.', function: 'Creates unequal survival or reproduction for different traits.' },
      { id: 'survivors', label: 'Survivors', position: [0.05, 0.1, 0.1], color: '#16a34a', description: 'Individuals whose traits work better here.', function: 'Passes helpful inherited traits into the next generation more often.' },
      { id: 'next-gen', label: 'Next generation', position: [0.85, -0.1, 0.1], color: '#7c3aed', description: 'Offspring with a shifted trait mix.', function: 'Shows evolution as changing frequencies over time.' },
    ],
    prediction: 'Predict which trait will spread when predators catch the most visible individuals.',
    change: 'Change the selection pressure from no predator to predator present.',
    observe: 'Observe the next generation and count whether camouflage becomes more common.',
    explain: 'Explain why selection changes the population but does not make each individual transform.',
    quizPrompt: 'What does natural selection directly change over generations?',
    quizAnswer: 'The frequency of inherited traits in a population.',
    quizMisconception: 'The personal effort of each organism.',
    compareCandidate: 'biology-evolution-adaptation',
    compareReason: 'Natural selection is the process; adaptation is a trait pattern that can result from it.',
  }),
  component({
    id: 'biology-evolution-adaptation',
    name: 'Adaptation',
    scientificName: 'Adaptive trait',
    system: 'Trait-environment fit',
    tagline: 'A trait that improves fit in a specific environment',
    summary:
      'An adaptation is an inherited trait that improves survival or reproduction in a specific environment. Adaptations are judged by evidence, not by assuming every trait is useful.',
    keyFacts: facts('An inherited trait that helps in a particular environment', 'Better performance in that environment', 'Move the same trait to a different habitat'),
    whyItMatters:
      'Adaptations connect body structures and behaviors to real environmental challenges.',
    didYouKnow:
      'The same thick fur that helps in a cold climate may be a problem in a hot climate.',
    belongsTo: ['Evolution', 'Structure and function', 'Habitats'],
    conditions: ['Trait is inherited', 'Environment creates a challenge', 'Trait improves survival or reproduction'],
    visualShape: 'organism-island',
    visualVariables: ['habitat', 'trait benefit', 'fitness'],
    hotspots: [
      { id: 'trait', label: 'Trait', position: [-0.55, 0.25, 0.1], color: '#0ea5e9', description: 'A structure or behavior being tested.', function: 'Connects the visible feature to survival or reproduction evidence.' },
      { id: 'habitat', label: 'Habitat', position: [0.15, -0.15, 0.1], color: '#22c55e', description: 'The environment where the trait is useful or costly.', function: 'Reminds learners that adaptations are environment-specific.' },
      { id: 'benefit', label: 'Benefit', position: [0.8, 0.2, 0.1], color: '#f59e0b', description: 'The measured advantage.', function: 'Turns adaptation into an evidence claim.' },
    ],
    prediction: 'Predict whether webbed feet help more on dry rock or in water.',
    change: 'Move the same inherited trait between two habitats.',
    observe: 'Observe which habitat gives faster movement, better feeding, or better escape.',
    explain: 'Explain why a trait is called an adaptation only when evidence shows a benefit in that environment.',
    quizPrompt: 'What makes a trait an adaptation?',
    quizAnswer: 'It is inherited and improves survival or reproduction in a specific environment.',
    quizMisconception: 'It is any body part an organism happens to have.',
    compareCandidate: 'biology-evolution-variation',
    compareReason: 'Variation is the raw difference; adaptation is a helpful inherited difference in context.',
  }),
  component({
    id: 'biology-evolution-fossil-evidence',
    name: 'Fossil Evidence',
    scientificName: 'Paleontological evidence',
    system: 'Deep-time record',
    tagline: 'Layers preserve clues from past life',
    summary:
      'Fossils are preserved traces or remains of past organisms. Their positions in rock layers and their structures help scientists reconstruct change through deep time.',
    keyFacts: facts('Preserved remains, impressions, or traces of past life', 'Older and younger layers show ordered patterns', 'Compare traits across a fossil sequence'),
    whyItMatters:
      'Fossils let learners test evolutionary claims against physical evidence instead of relying only on living organisms.',
    didYouKnow:
      'Trace fossils such as footprints can reveal behavior even when bones are not preserved.',
    belongsTo: ['Evolution', 'Earth history', 'Evidence'],
    conditions: ['Organism leaves a preservable trace', 'Sediment buries it quickly', 'Rock layers can be compared'],
    visualShape: 'sun-timeline',
    visualVariables: ['layer age', 'trait sequence', 'fossil depth'],
    hotspots: [
      { id: 'older-layer', label: 'Older layer', position: [-0.85, -0.3, 0.1], color: '#92400e', description: 'A lower rock layer in an undisturbed sequence.', function: 'Provides an earlier reference point for comparing traits.' },
      { id: 'fossil-trait', label: 'Fossil trait', position: [0, 0, 0.1], color: '#2563eb', description: 'A preserved structure that can be compared.', function: 'Links physical form to evidence about past organisms.' },
      { id: 'newer-layer', label: 'Newer layer', position: [0.85, 0.3, 0.1], color: '#16a34a', description: 'A later layer with a different fossil pattern.', function: 'Helps show ordered change through time.' },
    ],
    prediction: 'Predict which layer should hold the older fossil before revealing the layer order.',
    change: 'Change the timeline from shallow to deep layers and place fossils by depth.',
    observe: 'Observe whether traits appear, disappear, or change in a consistent order.',
    explain: 'Explain how fossil order supports or challenges a story about evolutionary change.',
    quizPrompt: 'What do fossils provide for evolution?',
    quizAnswer: 'Physical evidence of organisms and traits from the past.',
    quizMisconception: 'Proof that all organisms lived at the same time.',
    compareCandidate: 'biology-evolution-common-ancestry',
    compareReason: 'Fossils provide time-ordered evidence that helps test common ancestry claims.',
  }),
  component({
    id: 'biology-evolution-common-ancestry',
    name: 'Common Ancestry',
    scientificName: 'Descent with modification',
    system: 'Shared descent',
    tagline: 'Shared traits can point to shared ancestors',
    summary:
      'Common ancestry means different species can descend from earlier shared populations. Similar structures, DNA patterns, and fossil sequences help scientists infer those relationships.',
    keyFacts: facts('Different species descending from shared ancestral populations', 'Shared structures and DNA patterns align with fossil evidence', 'Compare which traits are shared and which are derived'),
    whyItMatters:
      'Common ancestry organizes biodiversity into testable family-tree patterns rather than isolated lists of organisms.',
    didYouKnow:
      'Human arms, bat wings, and whale flippers contain related bone patterns even though they do different jobs.',
    belongsTo: ['Evolution', 'Biodiversity', 'Classification'],
    conditions: ['Shared traits are carefully compared', 'Multiple evidence lines agree', 'New traits can branch from older traits'],
    visualShape: 'dna-helix',
    visualVariables: ['shared DNA', 'branch point', 'derived trait'],
    hotspots: [
      { id: 'ancestor', label: 'Ancestor', position: [-0.75, -0.2, 0.1], color: '#7c3aed', description: 'A past population inferred from evidence.', function: 'Acts as the shared starting point for descendant branches.' },
      { id: 'shared-trait', label: 'Shared trait', position: [0, 0.25, 0.1], color: '#0ea5e9', description: 'A feature inherited by more than one descendant group.', function: 'Helps identify related branches.' },
      { id: 'derived-trait', label: 'Derived trait', position: [0.8, 0.05, 0.1], color: '#f97316', description: 'A newer feature found in one branch.', function: 'Shows descent with modification instead of identical copies.' },
    ],
    prediction: 'Predict which two organisms are more closely related based on shared bone patterns.',
    change: 'Change the evidence view from body structures to DNA sequence similarities.',
    observe: 'Observe whether the same relationship pattern appears in both evidence views.',
    explain: 'Explain why agreement between structures, DNA, and fossils strengthens a common ancestry claim.',
    quizPrompt: 'What does common ancestry explain?',
    quizAnswer: 'Different species can share traits because they descend from earlier shared populations.',
    quizMisconception: 'One modern species must have turned directly into another modern species.',
    compareCandidate: 'biology-evolution-fossil-evidence',
    compareReason: 'Common ancestry is the relationship claim; fossil evidence helps place that claim in time.',
  }),
]

export const evolutionById = Object.fromEntries(
  evolution.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
