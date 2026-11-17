import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'biology' as const
const branch = 'Animals'
const authoredBiologyModel = (id: string) => `/models/biology/authored/${id}.glb`
const sourcedAnimalModel = (kind: 'deer' | 'fox') =>
  kind === 'deer'
    ? '/models/sourced/biology-life/ecology/consumer-deer/deer-optimized.glb'
    : '/models/sourced/biology-life/ecology/predator-fox/fox-optimized.glb'
const FISH_VERTEBRATE_MODEL = '/models/sourced/biology-animals/barramundi-fish-khronos.glb'

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
      options: [answer, misconception, 'Only the biggest animal is correct', 'Animal groups are decided by color'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is the best way to compare two animals scientifically?',
      options: ['Use structures, life needs, and evidence', 'Pick the one that looks friendlier', 'Use only size', 'Ignore the habitat'],
      correctIndex: 0,
      explanation: 'Animal comparisons should use observable evidence and body functions.',
      misconception: 'Appearance alone can be misleading because different animals can solve the same problem differently.',
    },
    {
      prompt: 'Why do animal traits need context?',
      options: ['A trait can help in one habitat but not another', 'All traits work the same everywhere', 'Habitats never affect animals', 'Behavior is not observable'],
      correctIndex: 0,
      explanation: 'A structure or behavior only makes sense when matched to the animal need and habitat.',
      misconception: 'Traits are not automatically helpful in every situation.',
    },
  ]
}

function facts(definition: string, evidence: string, test: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Evidence', value: evidence },
    { label: 'Test move', value: test },
    { label: 'Animal need', value: 'Survive, grow, sense, move, and reproduce' },
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
  model?: string
}): ComponentContent {
  return {
    id: input.id,
    name: input.name,
    scientificName: input.scientificName,
    subject,
    branch,
    system: input.system,
    model: input.model ?? authoredBiologyModel(input.id),
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

export const animals: ComponentContent[] = [
  component({
    id: 'biology-animals-vertebrate',
    name: 'Vertebrate and Invertebrate',
    scientificName: 'Vertebrata and Invertebrata',
    system: 'Backbone body plans',
    tagline: 'Backbone or no backbone is a core animal body-plan split',
    summary:
      'Vertebrates are animals with a backbone, while invertebrates are animals without one. Both groups solve support, protection, and movement needs with different body plans.',
    keyFacts: facts('Animal body plans sorted by presence or absence of a backbone', 'Backbones, shells, exoskeletons, and soft bodies provide different support evidence', 'Toggle backbone present or absent and compare support strategies'),
    whyItMatters:
      'The vertebrate/invertebrate split helps learners sort animals by body evidence instead of by size, habitat, or familiarity.',
    didYouKnow:
      'Most animal species are invertebrates, even though many familiar large animals are vertebrates.',
    belongsTo: ['Animals', 'Body plans', 'Classification'],
    conditions: ['Vertebrates have a backbone', 'Invertebrates lack a backbone', 'Both still meet animal life needs'],
    visualShape: 'bone-joint',
    visualVariables: ['backbone present', 'exoskeleton or shell', 'soft body support'],
    hotspots: [
      { id: 'backbone', label: 'Backbone', position: [-0.65, 0.2, 0.1], color: '#2563eb', description: 'A chain of vertebrae along a vertebrate body.', function: 'Supports the body and protects the spinal cord.' },
      { id: 'no-backbone', label: 'No backbone', position: [0.05, 0.05, 0.1], color: '#dc2626', description: 'Invertebrates do not have a vertebral column.', function: 'Separates invertebrate body plans from vertebrate body plans.' },
      { id: 'alternate-support', label: 'Alternate support', position: [0.75, -0.1, 0.1], color: '#16a34a', description: 'Shells, exoskeletons, fluid pressure, or soft tissues can support invertebrates.', function: 'Shows that no backbone does not mean no protection or movement.' },
    ],
    prediction: 'Predict whether a frog, worm, fish, and crab sort by habitat or by backbone evidence.',
    change: 'Change the body-plan view from backbone present to backbone absent.',
    observe: 'Observe which animals share vertebrae and which use other support strategies.',
    explain: 'Explain why vertebrate and invertebrate are evidence-based body-plan groups, not judgments about importance.',
    quizPrompt: 'What separates vertebrates from invertebrates?',
    quizAnswer: 'Vertebrates have a backbone; invertebrates do not.',
    quizMisconception: 'Vertebrates are always bigger and live only on land.',
    compareCandidate: 'biology-animals-body-systems',
    compareReason: 'Body-plan classification sorts support structures, while body systems show how animal organs coordinate life functions.',
    model: FISH_VERTEBRATE_MODEL,
  }),
  component({
    id: 'biology-animals-body-systems',
    name: 'Body Systems',
    scientificName: 'Integrated animal organ systems',
    system: 'Organ-system coordination',
    tagline: 'Animal systems work together to keep cells alive',
    summary:
      'Animal body systems divide jobs such as breathing, digestion, circulation, movement, sensing, and waste removal. The systems depend on each other instead of working alone.',
    keyFacts: facts('Groups of organs that perform life functions', 'Breathing, digestion, circulation, and movement link together', 'Remove one need and trace which systems are affected'),
    whyItMatters:
      'Body systems help learners explain animal survival as coordinated function, not as isolated body parts.',
    didYouKnow:
      'A running animal needs muscles, lungs or gills, blood flow, nerves, and digestion products all at once.',
    belongsTo: ['Animals', 'Anatomy', 'Physiology'],
    conditions: ['Systems exchange matter and energy', 'Cells need oxygen or another gas exchange strategy', 'Waste must be removed'],
    visualShape: 'blood-loop',
    visualVariables: ['oxygen flow', 'food energy', 'muscle demand'],
    hotspots: [
      { id: 'gas-exchange', label: 'Gas exchange', position: [-0.65, 0.25, 0.1], color: '#0ea5e9', description: 'Lungs, gills, or body surfaces trade gases.', function: 'Supplies oxygen or manages gases needed by cells.' },
      { id: 'transport', label: 'Transport', position: [0.05, 0.05, 0.1], color: '#dc2626', description: 'Circulation moves materials through the body.', function: 'Connects distant tissues to food, gases, and waste removal.' },
      { id: 'movement', label: 'Movement', position: [0.75, -0.15, 0.1], color: '#16a34a', description: 'Muscles and support structures create motion.', function: 'Uses energy and signals supplied by other systems.' },
    ],
    prediction: 'Predict what happens to muscle activity if oxygen delivery drops.',
    change: 'Change one system input, such as oxygen supply, while keeping the animal active.',
    observe: 'Observe which other systems become stressed or limited.',
    explain: 'Explain why animal body systems must be studied as connected parts.',
    quizPrompt: 'Why do animal body systems work together?',
    quizAnswer: 'Each system supplies or uses materials that other systems need.',
    quizMisconception: 'Each system survives completely by itself.',
    compareCandidate: 'biology-animals-life-cycle',
    compareReason: 'Body systems keep the animal alive each day, while life cycles show how animals develop across time.',
    model: sourcedAnimalModel('deer'),
  }),
  component({
    id: 'biology-animals-habitat-adaptation',
    name: 'Habitat Adaptation',
    scientificName: 'Animal ecological adaptation',
    system: 'Trait-habitat fit',
    tagline: 'Animal traits make sense in their habitat',
    summary:
      'Habitat adaptations are inherited structures or behaviors that help animals meet needs in a particular place. A beak, foot, covering, or timing behavior must be judged against the habitat challenge.',
    keyFacts: facts('A trait that helps an animal in a particular habitat', 'Trait performance changes when the habitat changes', 'Move the same trait between habitat layers'),
    whyItMatters:
      'Habitat adaptation turns animal features into evidence-based explanations about survival.',
    didYouKnow:
      'Desert animals often combine physical traits with behaviors, such as staying active at cooler times.',
    belongsTo: ['Animals', 'Ecology', 'Adaptation'],
    conditions: ['Habitat creates a challenge', 'Trait affects survival or reproduction', 'Evidence links trait to function'],
    visualShape: 'habitat-layers',
    visualVariables: ['habitat layer', 'body covering', 'feeding structure'],
    hotspots: [
      { id: 'habitat', label: 'Habitat', position: [-0.8, -0.15, 0.1], color: '#22c55e', description: 'The place where the animal meets its needs.', function: 'Sets the challenge a trait must solve.' },
      { id: 'trait', label: 'Trait', position: [0.05, 0.25, 0.1], color: '#f97316', description: 'A structure or behavior being tested.', function: 'Connects body form to survival evidence.' },
      { id: 'resource', label: 'Resource', position: [0.75, 0.05, 0.1], color: '#2563eb', description: 'Food, water, shelter, or mates in the habitat.', function: 'Shows what the trait helps the animal reach or protect.' },
    ],
    prediction: 'Predict which bird foot works better for swimming than perching.',
    change: 'Change the habitat from branch to pond and keep the foot shape the same.',
    observe: 'Observe whether movement or feeding becomes easier in one habitat.',
    explain: 'Explain why the same trait can be helpful in one habitat and less helpful in another.',
    quizPrompt: 'What makes an animal trait a habitat adaptation?',
    quizAnswer: 'Evidence shows it helps the animal meet needs in that habitat.',
    quizMisconception: 'It looks interesting to people.',
    compareCandidate: 'biology-animals-behavior',
    compareReason: 'Habitat adaptation can be structural or behavioral, so comparing behavior makes the idea concrete.',
    model: sourcedAnimalModel('deer'),
  }),
  component({
    id: 'biology-animals-life-cycle',
    name: 'Life Cycle',
    scientificName: 'Animal developmental cycle',
    system: 'Growth and reproduction',
    tagline: 'Animals change form and function across stages',
    summary:
      'An animal life cycle shows the stages from birth or hatching through growth, reproduction, and offspring. Some animals change gradually, while others transform through metamorphosis.',
    keyFacts: facts('Ordered stages in an animal life', 'Body form and needs may change by stage', 'Compare young and adult needs'),
    whyItMatters:
      'Life cycles help learners predict which resources and dangers matter at different stages of an animal life.',
    didYouKnow:
      'A tadpole uses gills and a tail, while an adult frog uses lungs and legs more strongly.',
    belongsTo: ['Animals', 'Development', 'Reproduction'],
    conditions: ['Begins with offspring', 'Includes growth and maturity', 'Can include metamorphosis'],
    visualShape: 'seed-sprout',
    visualVariables: ['stage order', 'body change', 'resource need'],
    hotspots: [
      { id: 'young-stage', label: 'Young stage', position: [-0.75, -0.1, 0.1], color: '#0ea5e9', description: 'An early life stage with its own needs.', function: 'Shows that young animals are not always small copies of adults.' },
      { id: 'growth', label: 'Growth', position: [0.05, 0.2, 0.1], color: '#16a34a', description: 'Body size and structures change over time.', function: 'Connects time to changing functions.' },
      { id: 'adult-stage', label: 'Adult stage', position: [0.8, 0.05, 0.1], color: '#f97316', description: 'A mature stage that can reproduce.', function: 'Completes the cycle by producing offspring.' },
    ],
    prediction: 'Predict whether the young stage needs the same food and habitat as the adult.',
    change: 'Change the stage from young to adult and compare body structures.',
    observe: 'Observe which structures appear, disappear, or become more useful.',
    explain: 'Explain why life-cycle stage changes can change an animal role in its habitat.',
    quizPrompt: 'What does an animal life cycle show?',
    quizAnswer: 'The ordered stages of growth, maturity, and reproduction.',
    quizMisconception: 'Only where the animal sleeps.',
    compareCandidate: 'biology-animals-body-systems',
    compareReason: 'Life cycles show how system needs and body functions shift as the animal develops.',
    model: sourcedAnimalModel('deer'),
  }),
  component({
    id: 'biology-animals-behavior',
    name: 'Behavior',
    scientificName: 'Animal behavior',
    system: 'Response and survival actions',
    tagline: 'Behavior is what animals do in response to needs and signals',
    summary:
      'Animal behavior includes actions such as feeding, migration, communication, courtship, defense, and care for young. Behaviors can be inherited, learned, or a mix of both.',
    keyFacts: facts('Observable animal actions', 'Actions change when signals, resources, or dangers change', 'Change one cue and watch the response'),
    whyItMatters:
      'Behavior helps learners see animals as active problem-solvers responding to real conditions.',
    didYouKnow:
      'Some birds learn songs from adults, while many spider web-building patterns are strongly inherited.',
    belongsTo: ['Animals', 'Senses', 'Ecology'],
    conditions: ['Animal receives a cue', 'Nervous and hormonal systems respond', 'Action affects survival or reproduction'],
    visualShape: 'predator-prey',
    visualVariables: ['cue', 'response speed', 'risk level'],
    hotspots: [
      { id: 'cue', label: 'Cue', position: [-0.7, 0.2, 0.1], color: '#dc2626', description: 'A signal such as danger, food odor, or daylight.', function: 'Starts a possible behavior response.' },
      { id: 'response', label: 'Response', position: [0.1, 0.05, 0.1], color: '#2563eb', description: 'The animal action after the cue.', function: 'Turns sensing into movement or communication.' },
      { id: 'outcome', label: 'Outcome', position: [0.75, -0.15, 0.1], color: '#16a34a', description: 'The result of the action.', function: 'Lets learners judge whether the behavior helped.' },
    ],
    prediction: 'Predict whether a prey animal freezes or runs when a predator cue appears.',
    change: 'Change the cue from safe sound to predator shadow.',
    observe: 'Observe the response speed and whether the animal reaches shelter.',
    explain: 'Explain how behavior can connect senses, movement, and survival.',
    quizPrompt: 'What is animal behavior?',
    quizAnswer: 'An observable action an animal does in response to needs or signals.',
    quizMisconception: 'Only body shape, not action.',
    compareCandidate: 'biology-animals-habitat-adaptation',
    compareReason: 'Behavior is one way animals fit their habitats, alongside body structures.',
    model: sourcedAnimalModel('fox'),
  }),
]

export const animalsById = Object.fromEntries(
  animals.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
