import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'biology' as const
const branch = 'Health And Disease'
const authoredBiologyModel = (id: string) => `/models/biology/authored/${id}.glb`
const INFLUENZA_WHOLE_MODEL = '/models/sourced/biology-gaps-wave2/virus-influenza-whole-nih.glb'
const INFLUENZA_CUTAWAY_MODEL = '/models/sourced/biology-gaps-wave2/virus-influenza-pathogenar-cutaway-nih.glb'
const INTESTINE_MODEL = '/models/intestine.glb'

function healthModel(id: string) {
  if (id === 'biology-health-pathogen' || id === 'biology-health-epidemiology-spread') return INFLUENZA_WHOLE_MODEL
  if (id === 'biology-health-immune-response' || id === 'biology-health-vaccine') return INFLUENZA_CUTAWAY_MODEL
  if (id === 'biology-health-nutrition') return INTESTINE_MODEL
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
      options: [answer, misconception, 'Only luck decides health', 'The longest word is always right'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What makes a health claim stronger?',
      options: ['Evidence from a fair comparison', 'A scary story by itself', 'A bright diagram with no data', 'A guess that sounds certain'],
      correctIndex: 0,
      explanation: 'Health explanations should be checked against evidence from careful comparison.',
      misconception: 'A vivid story can be memorable but still incomplete or misleading.',
    },
    {
      prompt: 'Why should one variable be changed at a time in a health model?',
      options: ['So the cause and effect are easier to connect', 'So the model looks simpler only', 'So biology stops changing', 'So evidence is not needed'],
      correctIndex: 0,
      explanation: 'Changing one factor lets learners see whether that factor changes the outcome.',
      misconception: 'Changing many factors together can hide the real cause.',
    },
  ]
}

function facts(definition: string, evidence: string, test: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Evidence', value: evidence },
    { label: 'Test move', value: test },
    { label: 'Health lens', value: 'Cause, prevention, response, and recovery' },
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
    model: healthModel(input.id),
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

export const healthAndDisease: ComponentContent[] = [
  component({
    id: 'biology-health-pathogen',
    name: 'Pathogen',
    scientificName: 'Infectious agent',
    system: 'Disease cause',
    tagline: 'A disease-causing microbe or virus',
    summary:
      'A pathogen is a virus, bacterium, fungus, protist, or other agent that can cause disease. Infection depends on exposure, entry, dose, and the host response.',
    keyFacts: facts('An agent that can cause disease', 'Pathogens enter, reproduce, and trigger symptoms or immune response', 'Change exposure dose and watch infection risk'),
    whyItMatters:
      'Identifying pathogens helps people choose useful prevention and treatment instead of blaming vague bad air or random chance.',
    didYouKnow:
      'Not every microbe is a pathogen; many microbes live on or inside the body without causing disease.',
    belongsTo: ['Health', 'Disease', 'Microbiology'],
    conditions: ['Exposure occurs', 'Pathogen reaches an entry point', 'Host defenses may stop or slow it'],
    visualShape: 'virus-spikes',
    visualVariables: ['entry point', 'dose', 'replication'],
    hotspots: [
      { id: 'surface', label: 'Surface markers', position: [-0.6, 0.25, 0.1], color: '#dc2626', description: 'Molecules that help a pathogen attach to host cells.', function: 'Starts infection by matching a possible entry target.' },
      { id: 'entry', label: 'Entry route', position: [0.05, 0, 0.1], color: '#f97316', description: 'A path such as nose, mouth, wound, or bite.', function: 'Determines whether exposure can become infection.' },
      { id: 'replication', label: 'Replication', position: [0.75, -0.1, 0.1], color: '#7c3aed', description: 'The pathogen makes more copies or grows.', function: 'Can increase damage and immune activation.' },
    ],
    prediction: 'Predict whether a higher exposure dose raises or lowers infection risk.',
    change: 'Change the exposure dose while keeping the host defenses the same.',
    observe: 'Observe whether more pathogen copies reach cells and trigger a response.',
    explain: 'Explain why exposure alone is not the same as guaranteed disease.',
    quizPrompt: 'What is a pathogen?',
    quizAnswer: 'An infectious agent that can cause disease.',
    quizMisconception: 'Any microbe, even one that helps digestion.',
    compareCandidate: 'biology-health-immune-response',
    compareReason: 'A pathogen is the challenge; the immune response is one body defense against it.',
  }),
  component({
    id: 'biology-health-immune-response',
    name: 'Immune Response',
    scientificName: 'Host immune defense',
    system: 'Body defense',
    tagline: 'The body detects, attacks, remembers, and repairs',
    summary:
      'The immune response includes barriers, fast general defenses, targeted cells and antibodies, memory, and repair. It protects the body while balancing inflammation.',
    keyFacts: facts('Body defenses against infection and damage', 'White blood cells, antibodies, barriers, and inflammation work together', 'Change pathogen amount and watch response strength'),
    whyItMatters:
      'Immune response explains symptoms like swelling and fever as part of defense, while also showing why overreaction can be harmful.',
    didYouKnow:
      'Immune memory is why some infections are fought faster the second time.',
    belongsTo: ['Health', 'Immune system', 'Human physiology'],
    conditions: ['Barrier detects or blocks threat', 'Immune cells communicate', 'Response must be controlled'],
    visualShape: 'immune-shield',
    visualVariables: ['barrier', 'antibodies', 'memory cells'],
    hotspots: [
      { id: 'barrier', label: 'Barrier', position: [-0.75, 0.2, 0.1], color: '#2563eb', description: 'Skin, mucus, acid, and other first defenses.', function: 'Blocks many pathogens before deeper infection starts.' },
      { id: 'targeting', label: 'Targeting', position: [0.05, 0.05, 0.1], color: '#16a34a', description: 'Immune cells and antibodies recognize specific patterns.', function: 'Focuses the defense on the threat.' },
      { id: 'memory', label: 'Memory', position: [0.75, -0.15, 0.1], color: '#7c3aed', description: 'Cells that respond faster later.', function: 'Improves future protection after infection or vaccination.' },
    ],
    prediction: 'Predict what happens if immune memory recognizes the pathogen.',
    change: 'Change the model from first exposure to second exposure.',
    observe: 'Observe whether antibodies and memory cells respond faster.',
    explain: 'Explain why faster recognition can reduce disease severity.',
    quizPrompt: 'What is one job of the immune response?',
    quizAnswer: 'Recognize and fight threats while protecting body tissues.',
    quizMisconception: 'Make every symptom disappear instantly.',
    compareCandidate: 'biology-health-vaccine',
    compareReason: 'Vaccines train immune memory, so they connect directly to immune response.',
  }),
  component({
    id: 'biology-health-vaccine',
    name: 'Vaccine',
    scientificName: 'Immunization',
    system: 'Immune memory training',
    tagline: 'Practice for the immune system before the real threat',
    summary:
      'A vaccine safely exposes the immune system to a harmless piece, weakened form, or instructions for a pathogen marker. The goal is immune memory without the full disease.',
    keyFacts: facts('A tool that trains immune memory', 'Memory cells and antibodies can respond faster later', 'Compare first exposure with vaccinated exposure'),
    whyItMatters:
      'Vaccines reduce severe disease and can lower spread by making infections less likely or shorter.',
    didYouKnow:
      'Some vaccines need boosters because immune memory can fade or pathogens can change.',
    belongsTo: ['Health', 'Prevention', 'Immune system'],
    conditions: ['Contains a safe antigen or antigen instructions', 'Immune system responds', 'Memory must match the future pathogen well enough'],
    visualShape: 'immune-shield',
    visualVariables: ['antigen', 'memory', 'booster timing'],
    hotspots: [
      { id: 'antigen', label: 'Antigen', position: [-0.7, 0.25, 0.1], color: '#f97316', description: 'A harmless marker the immune system can learn.', function: 'Gives immune cells practice recognizing a pathogen pattern.' },
      { id: 'memory-cell', label: 'Memory cell', position: [0.05, 0.05, 0.1], color: '#7c3aed', description: 'A long-lasting immune cell after training.', function: 'Speeds up response during later exposure.' },
      { id: 'protection', label: 'Protection', position: [0.75, -0.1, 0.1], color: '#16a34a', description: 'Reduced chance or severity of disease.', function: 'Shows the result of faster immune response.' },
    ],
    prediction: 'Predict whether a vaccinated immune system responds faster to a matching pathogen.',
    change: 'Change the exposure history from untrained to vaccinated.',
    observe: 'Observe memory cells activate sooner and pathogen growth slow earlier.',
    explain: 'Explain why a vaccine is prevention training, not a cure after severe disease has already developed.',
    quizPrompt: 'What is the main purpose of a vaccine?',
    quizAnswer: 'Train immune memory before a dangerous exposure.',
    quizMisconception: 'Give someone the full disease on purpose.',
    compareCandidate: 'biology-health-immune-response',
    compareReason: 'A vaccine works by preparing the immune response ahead of time.',
  }),
  component({
    id: 'biology-health-nutrition',
    name: 'Nutrition',
    scientificName: 'Human nutrition',
    system: 'Nutrient balance',
    tagline: 'Food supplies energy, building blocks, and regulators',
    summary:
      'Nutrition is how the body gets and uses nutrients such as carbohydrates, proteins, fats, vitamins, minerals, water, and fiber. Health depends on patterns over time, not one perfect food.',
    keyFacts: facts('Getting and using nutrients from food', 'Different nutrients support energy, growth, repair, and regulation', 'Change meal balance and watch which needs are met'),
    whyItMatters:
      'Nutrition helps learners reason about energy, growth, focus, immunity, and disease risk without reducing health to simple food rules.',
    didYouKnow:
      'Fiber is not digested for energy like sugar, but it still supports gut health and steadier digestion.',
    belongsTo: ['Health', 'Digestion', 'Energy'],
    conditions: ['Food is digested and absorbed', 'Nutrients match body needs', 'Patterns matter across days and weeks'],
    visualShape: 'digestion-track',
    visualVariables: ['carbohydrate', 'protein', 'fat', 'micronutrients'],
    hotspots: [
      { id: 'energy-nutrients', label: 'Energy nutrients', position: [-0.75, 0.2, 0.1], color: '#f59e0b', description: 'Carbohydrates and fats supply much of the body energy.', function: 'Fuel movement, warmth, and cell work.' },
      { id: 'building-blocks', label: 'Building blocks', position: [0.05, 0.05, 0.1], color: '#2563eb', description: 'Proteins and minerals help build and repair tissues.', function: 'Support growth, enzymes, muscles, and structures.' },
      { id: 'regulators', label: 'Regulators', position: [0.75, -0.15, 0.1], color: '#16a34a', description: 'Vitamins, minerals, water, and fiber support body processes.', function: 'Keep systems working smoothly.' },
    ],
    prediction: 'Predict which body need is missed if a meal has energy but almost no protein or micronutrients.',
    change: 'Change the meal mix by adding protein, fiber, and micronutrient-rich foods.',
    observe: 'Observe which nutrient needs become covered and which are still low.',
    explain: 'Explain why healthy nutrition is about balanced patterns, not one magic food.',
    quizPrompt: 'What does nutrition supply to the body?',
    quizAnswer: 'Energy, building blocks, and regulators for body processes.',
    quizMisconception: 'Only calories, with no other body needs.',
    compareCandidate: 'biology-health-immune-response',
    compareReason: 'Nutrition supports immune function, while immune response handles threats directly.',
  }),
  component({
    id: 'biology-health-epidemiology-spread',
    name: 'Epidemiology Spread',
    scientificName: 'Disease transmission dynamics',
    system: 'Population health patterns',
    tagline: 'Spread depends on contacts, susceptibility, and prevention',
    summary:
      'Epidemiology studies health patterns in populations. For infectious disease, spread changes with contact rate, infectiousness, susceptibility, immunity, isolation, hygiene, ventilation, and vaccination.',
    keyFacts: facts('Study of disease patterns in populations', 'Case counts shift with contacts and prevention', 'Change contact rate and watch the curve'),
    whyItMatters:
      'Epidemiology helps communities choose actions that reduce spread while using evidence instead of panic.',
    didYouKnow:
      'A disease can be dangerous even if each person infects only a little more than one other person on average, because growth can compound.',
    belongsTo: ['Health', 'Public health', 'Populations'],
    conditions: ['People or hosts contact each other', 'Some are susceptible', 'Prevention changes transmission chances'],
    visualShape: 'population-cluster',
    visualVariables: ['contact rate', 'susceptibility', 'prevention'],
    hotspots: [
      { id: 'contacts', label: 'Contacts', position: [-0.75, 0.15, 0.1], color: '#dc2626', description: 'Close interactions where spread could happen.', function: 'Sets the number of chances for transmission.' },
      { id: 'susceptible', label: 'Susceptible', position: [0.05, 0.05, 0.1], color: '#f97316', description: 'People or hosts who can become infected.', function: 'Affects how far a pathogen can move through the population.' },
      { id: 'prevention', label: 'Prevention', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'Actions such as vaccination, ventilation, testing, or staying home when sick.', function: 'Reduces transmission chances or shortens infectious time.' },
    ],
    prediction: 'Predict whether the outbreak curve rises faster when contacts double.',
    change: 'Change contact rate while keeping pathogen infectiousness the same.',
    observe: 'Observe how case counts spread through the population cluster.',
    explain: 'Explain why population patterns can change even when individual biology is unchanged.',
    quizPrompt: 'What does epidemiology study?',
    quizAnswer: 'Patterns, causes, and spread of health events in populations.',
    quizMisconception: 'Only one person symptoms with no population data.',
    compareCandidate: 'biology-health-pathogen',
    compareReason: 'Pathogens cause infection, while epidemiology explains how infections spread through groups.',
  }),
]

export const healthAndDiseaseById = Object.fromEntries(
  healthAndDisease.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
