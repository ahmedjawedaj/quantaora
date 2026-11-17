import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'physics' as const
const branch = 'Modern Physics Foundations'
const authoredFoundationModel = (id: string) => `/models/foundations/authored/${id}.glb`

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Evidence habit', value: 'Predict what a detector or graph should show, then compare observations.' },
    { label: 'Modern link', value: 'Tiny-scale behavior can be probabilistic and quantized.' },
  ]
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
      options: [answer, misconception, 'Tiny objects never need evidence', 'Only the diagram color matters'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'How should you test a modern physics claim?',
      options: ['Predict detector evidence and compare observations', 'Trust only the name', 'Ignore energy', 'Change every variable at once'],
      correctIndex: 0,
      explanation: 'Modern physics ideas are tested through measured patterns such as light, counts, or tracks.',
      misconception: 'The names are useful, but evidence decides whether the model works.',
    },
    {
      prompt: 'What does quantized mean?',
      options: ['Only certain amounts are allowed', 'Any amount is always allowed', 'The object is imaginary', 'The measurement has no units'],
      correctIndex: 0,
      explanation: 'Quantized systems change in allowed steps rather than any possible amount.',
      misconception: 'Small does not mean arbitrary; many tiny systems have strict allowed values.',
    },
    {
      prompt: 'Why do probability models appear in modern physics?',
      options: ['Some outcomes are predicted as chances over many trials', 'Physics gives up on patterns', 'Every single atom is visible to eyes', 'Graphs cannot help'],
      correctIndex: 0,
      explanation: 'Individual events can be uncertain while large groups show predictable patterns.',
      misconception: 'Probability can still make strong, testable predictions.',
    },
  ]
}

function component(input: {
  id: string
  name: string
  scientificName: string
  system: string
  visualShape: string
  visualVariables: string[]
  tagline: string
  summary: string
  keyFacts: KeyFact[]
  whyItMatters: string
  didYouKnow: string
  belongsTo: string[]
  conditions: string[]
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
    model: authoredFoundationModel(input.id),
    visual: { shape: input.visualShape, variables: input.visualVariables },
    tagline: input.tagline,
    summary: input.summary,
    keyFacts: input.keyFacts,
    whyItMatters: input.whyItMatters,
    didYouKnow: input.didYouKnow,
    belongsTo: input.belongsTo,
    conditions: input.conditions,
    hotspots: input.hotspots,
    lesson: lesson(input.prediction, input.change, input.observe, input.explain),
    quiz: quiz(input.quizPrompt, input.quizAnswer, input.quizMisconception),
    compareCandidate: input.compareCandidate,
    compareReason: input.compareReason,
  }
}

export const modernPhysicsFoundations: ComponentContent[] = [
  component({
    id: 'physics-modern-photon',
    name: 'Photon',
    scientificName: 'Quantum of electromagnetic radiation',
    system: 'Light Quanta',
    visualShape: 'ray-arrow',
    visualVariables: ['frequency', 'energy', 'detector click'],
    tagline: 'A packet of light energy',
    summary: 'A photon is a quantum packet of electromagnetic radiation. Higher-frequency photons carry more energy than lower-frequency photons.',
    keyFacts: facts('A quantum of light or electromagnetic radiation', 'Changing frequency changes photon energy', 'Detectors can register light in packet-like events'),
    whyItMatters: 'Photons explain cameras, solar panels, lasers, vision, and why ultraviolet light can be more damaging than visible light.',
    didYouKnow: 'A single photon can trigger a tiny detector event even though a bright beam contains enormous numbers of photons.',
    belongsTo: ['Physics', 'Modern Physics Foundations', 'Light'],
    conditions: ['Electromagnetic radiation is present', 'Energy depends on frequency', 'Interactions happen in quantized exchanges'],
    hotspots: [
      { id: 'wave-path', label: 'Light path', position: [-0.75, 0.1, 0], color: '#2563eb', description: 'The direction the light travels.', function: 'Shows the photon moving through space.' },
      { id: 'energy-step', label: 'Energy packet', position: [0.05, 0.3, 0], color: '#f97316', description: 'The photon carries a definite amount of energy.', function: 'Connects frequency to energy transfer.' },
      { id: 'detector-click', label: 'Detector click', position: [0.85, -0.05, 0], color: '#16a34a', description: 'A detector can register a photon interaction.', function: 'Makes packet-like evidence visible.' },
    ],
    prediction: 'Predict what happens to photon energy when frequency increases.',
    change: 'Change the light from red-like lower frequency to violet-like higher frequency.',
    observe: 'Observe that the photon energy increases.',
    explain: 'Photon energy is proportional to frequency, so higher frequency means a larger energy packet.',
    quizPrompt: 'What is a photon?',
    quizAnswer: 'A packet of electromagnetic radiation energy.',
    quizMisconception: 'A tiny solid bead that must sit still.',
    compareCandidate: 'physics-modern-wave-particle-model',
    compareReason: 'A photon is one object that motivates the wave-particle model of light.',
  }),
  component({
    id: 'physics-modern-energy-level',
    name: 'Energy Level',
    scientificName: 'Quantized atomic energy state',
    system: 'Atoms And Light',
    visualShape: 'shell-layers',
    visualVariables: ['electron state', 'energy jump', 'emitted photon'],
    tagline: 'Allowed energy steps inside atoms',
    summary: 'An energy level is an allowed energy state in an atom. Electrons absorb or emit specific photon energies when they move between levels.',
    keyFacts: facts('An allowed atomic energy state', 'Changing levels requires a matching energy difference', 'Atoms emit or absorb specific colors of light'),
    whyItMatters: 'Energy levels explain neon signs, spectroscopy, lasers, and how scientists identify elements in stars.',
    didYouKnow: 'Each element has a light fingerprint because its energy level gaps are different.',
    belongsTo: ['Physics', 'Modern Physics Foundations', 'Atomic Physics'],
    conditions: ['Atom has allowed energy states', 'Electron changes state by a specific gap', 'Photon energy matches the gap'],
    hotspots: [
      { id: 'lower-level', label: 'Lower level', position: [-0.7, -0.1, 0], color: '#2563eb', description: 'A lower allowed electron energy.', function: 'Acts as one endpoint of an energy jump.' },
      { id: 'upper-level', label: 'Upper level', position: [0.05, 0.35, 0], color: '#f97316', description: 'A higher allowed electron energy.', function: 'Requires added energy to reach.' },
      { id: 'photon-gap', label: 'Photon gap', position: [0.85, 0.05, 0], color: '#16a34a', description: 'The energy difference emitted or absorbed as light.', function: 'Links atomic steps to observed colors.' },
    ],
    prediction: 'Predict whether any photon energy can move an electron between two levels.',
    change: 'Try a photon below the energy gap, then a photon matching the gap.',
    observe: 'Observe that the matching photon is the one that causes the level change.',
    explain: 'Atomic energy levels are quantized, so transitions need specific energy differences.',
    quizPrompt: 'What happens when an electron drops to a lower energy level?',
    quizAnswer: 'A photon with the energy gap can be emitted.',
    quizMisconception: 'Energy vanishes without any transfer.',
    compareCandidate: 'physics-modern-photon',
    compareReason: 'Energy levels explain when atoms emit or absorb photons.',
  }),
  component({
    id: 'physics-modern-radioactive-decay',
    name: 'Radioactive Decay',
    scientificName: 'Nuclear decay process',
    system: 'Unstable Nuclei',
    visualShape: 'isotope-variants',
    visualVariables: ['unstable nucleus', 'decay event', 'daughter nucleus'],
    tagline: 'An unstable nucleus changes by chance',
    summary: 'Radioactive decay happens when an unstable atomic nucleus changes into a more stable form, emitting particles or energy. The exact atom that decays next is unpredictable.',
    keyFacts: facts('A spontaneous change in an unstable nucleus', 'Nuclear instability makes decay possible', 'Large groups decay in predictable patterns'),
    whyItMatters: 'Radioactive decay supports medical imaging, cancer treatment, archaeology dating, smoke detectors, and nuclear safety decisions.',
    didYouKnow: 'Carbon dating uses radioactive carbon-14 to estimate the age of once-living materials.',
    belongsTo: ['Physics', 'Modern Physics Foundations', 'Nuclear Physics'],
    conditions: ['Nucleus is unstable', 'Decay probability applies over time', 'Radiation type depends on the isotope'],
    hotspots: [
      { id: 'unstable-nucleus', label: 'Unstable nucleus', position: [-0.75, 0.2, 0], color: '#dc2626', description: 'A nucleus with an unstable combination of particles.', function: 'Creates the possibility of decay.' },
      { id: 'emission', label: 'Emission', position: [0.05, 0.3, 0], color: '#f97316', description: 'Particle or energy released during decay.', function: 'Carries away energy or changes nuclear makeup.' },
      { id: 'daughter', label: 'Daughter nucleus', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The nucleus after decay.', function: 'Shows that the original isotope has changed.' },
    ],
    prediction: 'Predict whether you can name the exact next atom that will decay in a sample.',
    change: 'Watch a group of identical unstable nuclei over a time interval.',
    observe: 'Observe random individual decay events but a steadier group pattern.',
    explain: 'Radioactive decay is probabilistic for single nuclei, yet predictable statistically for large samples.',
    quizPrompt: 'What changes during radioactive decay?',
    quizAnswer: 'An unstable nucleus changes and emits radiation.',
    quizMisconception: 'Only the atom label changes while the nucleus stays identical.',
    compareCandidate: 'physics-modern-half-life',
    compareReason: 'Radioactive decay is the event; half-life describes the group pattern over time.',
  }),
  component({
    id: 'physics-modern-half-life',
    name: 'Half-Life',
    scientificName: 'Radioactive half-life',
    system: 'Decay Patterns',
    visualShape: 'line-graph-poly',
    visualVariables: ['time', 'remaining nuclei', 'half amount'],
    tagline: 'Time for half a sample to remain',
    summary: 'Half-life is the time it takes for about half of a radioactive sample to decay. Each half-life cuts the remaining undecayed amount in half.',
    keyFacts: facts('Time for half the undecayed nuclei to decay', 'Longer time means more halves pass', 'The remaining amount follows a predictable curve'),
    whyItMatters: 'Half-life helps plan medical tracer doses, date old materials, store nuclear waste, and compare isotope safety.',
    didYouKnow: 'After two half-lives, about one quarter remains, not zero.',
    belongsTo: ['Physics', 'Modern Physics Foundations', 'Nuclear Physics'],
    conditions: ['Start with many unstable nuclei', 'Use the isotope half-life', 'Count remaining undecayed nuclei over time'],
    hotspots: [
      { id: 'start-amount', label: 'Start amount', position: [-0.75, 0.25, 0], color: '#2563eb', description: 'The original undecayed sample.', function: 'Sets the amount that future halves compare with.' },
      { id: 'half-mark', label: 'Half mark', position: [0.05, 0.1, 0], color: '#f97316', description: 'The point where about half remains.', function: 'Defines one half-life.' },
      { id: 'decay-curve', label: 'Decay curve', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The falling amount over time.', function: 'Shows repeated halving rather than a straight countdown to zero.' },
    ],
    prediction: 'Predict how much remains after two half-lives if the sample starts at 100 units.',
    change: 'Advance the sample through one half-life, then a second half-life.',
    observe: 'Observe 100 become about 50, then about 25.',
    explain: 'Each half-life halves the amount that remains, not the original amount again.',
    quizPrompt: 'What does one half-life mean?',
    quizAnswer: 'About half the undecayed sample remains.',
    quizMisconception: 'The whole sample disappears at once.',
    compareCandidate: 'physics-modern-radioactive-decay',
    compareReason: 'Half-life summarizes many radioactive decay events in a sample.',
  }),
  component({
    id: 'physics-modern-wave-particle-model',
    name: 'Wave-Particle Model',
    scientificName: 'Wave-particle duality',
    system: 'Quantum Models',
    visualShape: 'particle-trio',
    visualVariables: ['wave pattern', 'particle detection', 'experiment setup'],
    tagline: 'One model needs wave evidence and particle evidence',
    summary: 'The wave-particle model says tiny objects such as photons and electrons can show wave-like patterns and particle-like detections depending on the experiment.',
    keyFacts: facts('A model combining wave-like and particle-like evidence', 'Changing the experiment changes what evidence appears', 'Patterns and individual detections both need explaining'),
    whyItMatters: 'Wave-particle behavior underlies electron microscopes, quantum sensors, lasers, and semiconductor technology.',
    didYouKnow: 'Electrons can make interference patterns even though detectors register them one event at a time.',
    belongsTo: ['Physics', 'Modern Physics Foundations', 'Quantum Models'],
    conditions: ['Use tiny objects such as photons or electrons', 'Observe many events for a pattern', 'Match the model to the experiment evidence'],
    hotspots: [
      { id: 'wave-pattern', label: 'Wave pattern', position: [-0.75, 0.25, 0], color: '#2563eb', description: 'Spread-out interference evidence.', function: 'Shows wave-like behavior over many events.' },
      { id: 'single-click', label: 'Single click', position: [0.05, 0.1, 0], color: '#f97316', description: 'A localized detector event.', function: 'Shows particle-like detection.' },
      { id: 'setup-choice', label: 'Setup choice', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The experiment arrangement.', function: 'Determines which evidence is measured.' },
    ],
    prediction: 'Predict why a model must explain both an interference pattern and single detector clicks.',
    change: 'Compare a many-event interference setup with a detector that records individual hits.',
    observe: 'Observe a broad pattern built from separate clicks.',
    explain: 'Wave-particle duality is a model for evidence: spread-out probabilities and localized detections both appear.',
    quizPrompt: 'What evidence does the wave-particle model combine?',
    quizAnswer: 'Wave-like patterns and particle-like detections.',
    quizMisconception: 'Only one drawing style with no experiment evidence.',
    compareCandidate: 'physics-modern-photon',
    compareReason: 'Photons are a key example where light shows both packet-like and wave-like behavior.',
  }),
]

export const modernPhysicsFoundationsById = Object.fromEntries(
  modernPhysicsFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
