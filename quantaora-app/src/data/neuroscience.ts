import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'biology' as const
const branch = 'Neuroscience'
const authoredBiologyModel = (id: string) => `/models/biology/authored/${id}.glb`
const NEURON_MODEL = '/models/cells/neuron-authored.glb'
const BRAIN_MODEL = '/models/brain.glb'
const EYEBALL_MODEL = '/models/eyeball.glb'

function neuroscienceModel(id: string) {
  if (
    id === 'biology-neuroscience-neuron' ||
    id === 'biology-neuroscience-synapse' ||
    id === 'biology-neuroscience-reflex-arc'
  ) {
    return NEURON_MODEL
  }
  if (id === 'biology-neuroscience-brain-regions') {
    return BRAIN_MODEL
  }
  if (id === 'biology-neuroscience-senses-signals') {
    return EYEBALL_MODEL
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
      options: [answer, misconception, 'Signals move because nerves are hollow pipes', 'Brain cells never communicate'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What should a learner track in a nervous-system model?',
      options: ['Signal path, timing, and response', 'Only color of the model', 'Only the biggest structure', 'Nothing after the first cell'],
      correctIndex: 0,
      explanation: 'Neuroscience explanations depend on where signals start, where they travel, and what changes.',
      misconception: 'Size or color alone does not explain how information moves.',
    },
    {
      prompt: 'Why are predictions useful when studying signals?',
      options: ['They reveal what outcome the explanation expects', 'They replace observation', 'They make the signal faster', 'They remove the need for evidence'],
      correctIndex: 0,
      explanation: 'A prediction can be checked against what the signal or behavior actually does.',
      misconception: 'Predictions are tested by observation; they do not replace it.',
    },
  ]
}

function facts(definition: string, evidence: string, test: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Evidence', value: evidence },
    { label: 'Test move', value: test },
    { label: 'Signal idea', value: 'Information changes when signals move through circuits' },
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
    model: neuroscienceModel(input.id),
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

export const neuroscience: ComponentContent[] = [
  component({
    id: 'biology-neuroscience-neuron',
    name: 'Neuron',
    scientificName: 'Nerve cell',
    system: 'Signal cell',
    tagline: 'A specialized cell for receiving and sending information',
    summary:
      'A neuron is a nerve cell with dendrites, a cell body, an axon, and terminals. It receives inputs, integrates them, and can send electrical and chemical signals to other cells.',
    keyFacts: facts('A specialized signaling cell', 'Dendrites receive and axons send signals', 'Change input strength and watch whether the signal fires'),
    whyItMatters:
      'Neurons are the basic units behind sensing, movement, learning, memory, and reflexes.',
    didYouKnow:
      'Some axons in the human body are over a meter long, carrying signals from the spinal cord toward the feet.',
    belongsTo: ['Neuroscience', 'Cells', 'Nervous system'],
    conditions: ['Receives input', 'Membrane voltage changes', 'Signal may travel along the axon'],
    visualShape: 'nerve-impulse',
    visualVariables: ['input strength', 'axon path', 'firing threshold'],
    hotspots: [
      { id: 'dendrites', label: 'Dendrites', position: [-0.8, 0.2, 0.1], color: '#2563eb', description: 'Branching input regions.', function: 'Collect signals from other cells.' },
      { id: 'soma', label: 'Cell body', position: [0, 0.1, 0.1], color: '#7c3aed', description: 'The main cell region with nucleus and integration machinery.', function: 'Combines inputs and supports cell life.' },
      { id: 'axon', label: 'Axon', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'A long output fiber.', function: 'Carries the nerve impulse toward targets.' },
    ],
    prediction: 'Predict whether a weak input or strong input is more likely to trigger a nerve impulse.',
    change: 'Change input strength while keeping the neuron threshold constant.',
    observe: 'Observe whether the signal travels down the axon.',
    explain: 'Explain why a neuron can receive many inputs but send a clear output signal.',
    quizPrompt: 'What is a neuron?',
    quizAnswer: 'A specialized nerve cell that receives and sends signals.',
    quizMisconception: 'A blood cell that carries oxygen.',
    compareCandidate: 'biology-neuroscience-synapse',
    compareReason: 'The neuron carries signals inside a cell; the synapse transfers signals between cells.',
  }),
  component({
    id: 'biology-neuroscience-synapse',
    name: 'Synapse',
    scientificName: 'Neuronal synapse',
    system: 'Cell-to-cell signaling',
    tagline: 'The tiny gap where one cell influences the next',
    summary:
      'A synapse is a communication site between a neuron and another cell. Many synapses use neurotransmitters that cross a small gap and bind receptors on the target cell.',
    keyFacts: facts('A signaling junction between cells', 'Neurotransmitter release and receptor binding change the target cell', 'Change neurotransmitter amount and observe target response'),
    whyItMatters:
      'Synapses explain how circuits can excite, inhibit, strengthen, weaken, and learn.',
    didYouKnow:
      'Learning can involve changes in synapse strength, not just making brand-new brain cells.',
    belongsTo: ['Neuroscience', 'Signals', 'Circuits'],
    conditions: ['Signal reaches terminal', 'Neurotransmitter is released', 'Target receptors respond'],
    visualShape: 'nerve-impulse',
    visualVariables: ['neurotransmitter', 'receptor', 'gap distance'],
    hotspots: [
      { id: 'terminal', label: 'Terminal', position: [-0.65, 0.15, 0.1], color: '#f97316', description: 'The sending end of a neuron.', function: 'Releases chemical messengers when a signal arrives.' },
      { id: 'gap', label: 'Synaptic gap', position: [0, 0, 0.1], color: '#0ea5e9', description: 'A tiny space between cells.', function: 'Separates sender and receiver while allowing chemical signaling.' },
      { id: 'receptor', label: 'Receptor', position: [0.7, -0.1, 0.1], color: '#16a34a', description: 'A matching target molecule.', function: 'Turns chemical binding into a response.' },
    ],
    prediction: 'Predict how the target cell response changes if less neurotransmitter is released.',
    change: 'Change neurotransmitter amount at the sending terminal.',
    observe: 'Observe whether fewer receptors activate on the target cell.',
    explain: 'Explain why a synapse can make a circuit response stronger or weaker.',
    quizPrompt: 'What happens at many synapses?',
    quizAnswer: 'Neurotransmitters cross a gap and bind receptors on a target cell.',
    quizMisconception: 'Cells fuse into one larger cell every time.',
    compareCandidate: 'biology-neuroscience-neuron',
    compareReason: 'Synapses connect neurons into circuits, while neurons are the signaling cells themselves.',
  }),
  component({
    id: 'biology-neuroscience-reflex-arc',
    name: 'Reflex Arc',
    scientificName: 'Spinal reflex circuit',
    system: 'Fast response circuit',
    tagline: 'A short circuit can respond before conscious planning',
    summary:
      'A reflex arc is a fast pathway from sensory neuron to spinal cord circuit to motor neuron. It can protect the body before slower conscious processing catches up.',
    keyFacts: facts('A fast sensory-to-motor pathway', 'Signals pass through the spinal cord and trigger a muscle response', 'Change stimulus strength and compare response timing'),
    whyItMatters:
      'Reflex arcs show that the nervous system includes fast local circuits, not only conscious choices.',
    didYouKnow:
      'The knee-jerk reflex tests a spinal circuit that helps maintain posture.',
    belongsTo: ['Neuroscience', 'Movement', 'Spinal cord'],
    conditions: ['Sensory receptor detects a stimulus', 'Circuit connects to motor neuron', 'Muscle responds quickly'],
    visualShape: 'motion-vector',
    visualVariables: ['stimulus', 'signal path', 'response time'],
    hotspots: [
      { id: 'sensor', label: 'Sensor', position: [-0.8, 0.15, 0.1], color: '#dc2626', description: 'A receptor detects stretch, heat, or pain.', function: 'Starts the reflex signal.' },
      { id: 'spinal-cord', label: 'Spinal cord', position: [0, 0.05, 0.1], color: '#7c3aed', description: 'A local circuit processes the signal.', function: 'Links sensory input to motor output quickly.' },
      { id: 'muscle', label: 'Muscle', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'The responding tissue.', function: 'Turns the nerve signal into movement.' },
    ],
    prediction: 'Predict whether a reflex response is faster than a planned response.',
    change: 'Change the pathway from spinal reflex to conscious decision path.',
    observe: 'Observe the difference in response timing.',
    explain: 'Explain why shorter pathways can protect the body before full conscious awareness.',
    quizPrompt: 'What is a reflex arc?',
    quizAnswer: 'A fast pathway linking sensory input to motor output, often through the spinal cord.',
    quizMisconception: 'A slow decision that always starts in the front of the brain.',
    compareCandidate: 'biology-neuroscience-neuron',
    compareReason: 'A reflex arc is built from neurons arranged into a fast circuit.',
  }),
  component({
    id: 'biology-neuroscience-brain-regions',
    name: 'Brain Regions',
    scientificName: 'Functional neuroanatomy',
    system: 'Regional specialization',
    tagline: 'Different regions specialize but work as networks',
    summary:
      'Brain regions specialize in functions such as movement, sensing, emotion, memory, language, and coordination. Real tasks usually use networks across several regions.',
    keyFacts: facts('Areas of the brain with specialized roles', 'Damage or activity patterns link regions to functions', 'Change the task and watch which region becomes more important'),
    whyItMatters:
      'Brain regions help learners map function to anatomy while avoiding the myth that only one isolated spot does an entire complex job.',
    didYouKnow:
      'The cerebellum is famous for coordination, but it also contributes to learning and timing.',
    belongsTo: ['Neuroscience', 'Brain', 'Systems'],
    conditions: ['Regions communicate in networks', 'Tasks recruit multiple areas', 'Evidence comes from imaging, behavior, and injury patterns'],
    visualShape: 'nucleus-orb',
    visualVariables: ['region', 'task demand', 'network link'],
    hotspots: [
      { id: 'cortex', label: 'Cortex', position: [-0.65, 0.25, 0.1], color: '#2563eb', description: 'Outer brain tissue involved in perception, action, and thinking.', function: 'Supports many flexible, learned tasks.' },
      { id: 'cerebellum', label: 'Cerebellum', position: [0.1, -0.2, 0.1], color: '#16a34a', description: 'A region important for coordination and timing.', function: 'Smooths movement and helps adjust actions.' },
      { id: 'brainstem', label: 'Brainstem', position: [0.7, -0.25, 0.1], color: '#f97316', description: 'A lower region connecting brain and spinal cord.', function: 'Supports vital automatic functions and signal traffic.' },
    ],
    prediction: 'Predict whether reading aloud uses one isolated brain spot or a network.',
    change: 'Change the task from simple movement to reading aloud.',
    observe: 'Observe that sensory, language, motor, and attention regions all contribute.',
    explain: 'Explain why brain regions specialize but still cooperate in networks.',
    quizPrompt: 'What is the best description of brain regions?',
    quizAnswer: 'Specialized areas that work together in networks.',
    quizMisconception: 'Separate boxes that each do one whole complex behavior alone.',
    compareCandidate: 'biology-neuroscience-senses-signals',
    compareReason: 'Senses deliver signals that brain regions interpret and combine.',
  }),
  component({
    id: 'biology-neuroscience-senses-signals',
    name: 'Senses and Signals',
    scientificName: 'Sensory transduction',
    system: 'Input coding',
    tagline: 'Sense organs convert energy into nerve signals',
    summary:
      'Senses detect forms of energy such as light, sound, pressure, chemicals, or temperature. Sensory receptors convert those inputs into nerve signals the brain can process.',
    keyFacts: facts('Detection and conversion of stimuli into nerve signals', 'Receptors respond to specific input types', 'Change stimulus intensity and observe signal rate'),
    whyItMatters:
      'Senses and signals explain how the nervous system turns the outside world into information for decisions and movement.',
    didYouKnow:
      'The brain does not receive light directly from the eyes; it receives nerve signals caused by light-sensitive cells.',
    belongsTo: ['Neuroscience', 'Senses', 'Signals'],
    conditions: ['Stimulus reaches receptor', 'Receptor converts energy', 'Nerve pathway carries coded signal'],
    visualShape: 'eye-ball',
    visualVariables: ['stimulus intensity', 'receptor type', 'signal rate'],
    hotspots: [
      { id: 'stimulus', label: 'Stimulus', position: [-0.75, 0.2, 0.1], color: '#f59e0b', description: 'Light, sound, pressure, chemical, or temperature input.', function: 'Starts sensory information flow.' },
      { id: 'receptor', label: 'Receptor', position: [0, 0.05, 0.1], color: '#2563eb', description: 'A specialized cell or ending that detects the stimulus.', function: 'Converts physical or chemical input into a biological signal.' },
      { id: 'signal', label: 'Signal path', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'Nerve activity sent toward the brain or spinal cord.', function: 'Carries coded information for processing.' },
    ],
    prediction: 'Predict what happens to signal rate when light intensity increases.',
    change: 'Change stimulus intensity while keeping the receptor type the same.',
    observe: 'Observe the signal rate or pathway response change.',
    explain: 'Explain why the brain needs coded nerve signals instead of raw light or sound.',
    quizPrompt: 'What do sensory receptors do?',
    quizAnswer: 'Convert a stimulus into nerve signals.',
    quizMisconception: 'Send raw light, sound, or smell directly into the brain unchanged.',
    compareCandidate: 'biology-neuroscience-brain-regions',
    compareReason: 'Senses create signals, and brain regions help interpret those signals.',
  }),
]

export const neuroscienceById = Object.fromEntries(
  neuroscience.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
