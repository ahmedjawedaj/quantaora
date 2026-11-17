import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

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

function facts(definition: string, variable: string, observation: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Change', value: variable },
    { label: 'Observe', value: observation },
    { label: 'Rule', value: 'Change one wave property at a time, then connect the pattern you see to the cause.' },
  ]
}

function quiz(prompt: string, answer: string, misconception: string): QuizQuestion[] {
  return [
    {
      prompt,
      options: [answer, misconception, 'The wave stops needing energy', 'Gravity disappears from the lab'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is the best way to test a wave idea?',
      options: ['Change one wave property and watch the pattern', 'Change every control at once', 'Hide the wave shape', 'Only count the colors'],
      correctIndex: 0,
      explanation: 'One controlled change makes the cause and effect visible.',
      misconception: 'Changing many properties at once hides which property caused the observation.',
    },
    {
      prompt: 'Which evidence matters most in this wave lab?',
      options: ['The position and timing of crests and troughs', 'The table color', 'The name of the button', 'The weight of the screen'],
      correctIndex: 0,
      explanation: 'Wave behavior is visible in repeated high and low parts and how quickly they move.',
      misconception: 'Decorations do not tell you how the wave is transferring energy.',
    },
  ]
}

const waveHotspots: Hotspot[] = [
  {
    id: 'crest',
    label: 'Crest',
    position: [-0.5, 0.55, 0],
    color: '#38bdf8',
    description: 'The highest part of the repeating wave pattern.',
    function: 'Marks one extreme displacement so height and spacing can be measured.',
  },
  {
    id: 'trough',
    label: 'Trough',
    position: [0.45, -0.55, 0],
    color: '#f97316',
    description: 'The lowest part of the repeating wave pattern.',
    function: 'Pairs with the crest to show the full up-and-down motion.',
  },
  {
    id: 'rest-line',
    label: 'Rest line',
    position: [0, 0, 0],
    color: '#a3e635',
    description: 'The middle position the wave would have without disturbance.',
    function: 'Gives a reference for measuring amplitude above or below the center.',
  },
]

export const waves: ComponentContent[] = [
  {
    id: 'physics-waves-crest-trough',
    name: 'Crest And Trough',
    scientificName: 'Wave extrema',
    subject: 'physics',
    branch: 'Waves',
    system: 'Wave Anatomy',
    model: '/models/physics/authored/physics-waves-crest-trough.glb',
    tagline: 'The high and low marks of a wave',
    summary: 'A crest is the high point of a wave and a trough is the low point. Tracking them makes the repeating pattern visible, so learners can tell whether the wave is getting taller, shorter, faster, or slower.',
    keyFacts: facts('Crests and troughs are the maximum and minimum displacements of a wave.', 'Move the disturbance up or down.', 'The crest and trough shift, but the rest line stays the reference.'),
    whyItMatters: 'Crests and troughs are the landmarks used to measure amplitude, wavelength, and frequency in water, sound, light, and earthquakes.',
    didYouKnow: 'On the ocean surface, water mostly moves in loops while the wave shape travels forward.',
    belongsTo: ['Physics', 'Waves', 'Wave Anatomy'],
    conditions: ['Needs a repeating disturbance', 'Measured from a rest position', 'Can appear in water, springs, strings, and fields'],
    visual: { shape: 'line-arrows', variables: ['crest height', 'trough depth', 'rest line'] },
    hotspots: waveHotspots,
    lesson: lesson(
      'Predict what happens to the crest and trough when the hand disturbance is made taller.',
      'Increase the up-and-down disturbance while keeping the wave spacing the same.',
      'The crest rises higher and the trough drops lower, but the distance between crests stays about the same.',
      'The change increased displacement, so the wave grew taller without changing its wavelength.',
    ),
    quiz: quiz('What are a crest and trough?', 'The highest and lowest parts of a wave pattern.', 'The places where a wave stores batteries.'),
    compareCandidate: 'physics-waves-amplitude',
    compareReason: 'Crests and troughs are the landmarks; amplitude measures how far those landmarks sit from the rest line.',
  },
  {
    id: 'physics-waves-amplitude',
    name: 'Amplitude',
    scientificName: 'Maximum displacement',
    subject: 'physics',
    branch: 'Waves',
    system: 'Wave Measurement',
    model: '/models/physics/authored/physics-waves-amplitude.glb',
    tagline: 'How far the wave moves from rest',
    summary: 'Amplitude is the distance from the rest line to a crest or trough. Bigger amplitude means a larger disturbance and often more energy carried by the wave.',
    keyFacts: facts('Amplitude is maximum displacement from the rest position.', 'Increase or decrease how strongly the source moves.', 'Crests and troughs move farther from or closer to the rest line.'),
    whyItMatters: 'Amplitude helps explain louder sounds, brighter light waves, stronger shaking, and taller water waves without confusing size with speed.',
    didYouKnow: 'Doubling a wave amplitude can more than double the energy carried by many kinds of waves.',
    belongsTo: ['Physics', 'Waves', 'Wave Measurement'],
    conditions: ['Needs a rest line reference', 'Can change without changing wavelength', 'Often connects to wave energy'],
    visual: { shape: 'segment-endpoints', variables: ['rest line', 'crest height', 'energy'] },
    hotspots: [
      ...waveHotspots,
      {
        id: 'amplitude-marker',
        label: 'Amplitude marker',
        position: [-0.5, 0.27, 0],
        color: '#fb7185',
        description: 'The vertical distance from the rest line to a crest.',
        function: 'Shows wave size without needing to measure crest-to-crest spacing.',
      },
    ],
    lesson: lesson(
      'Predict whether a taller wave must also have a shorter wavelength.',
      'Raise only the amplitude control while leaving the spacing control unchanged.',
      'The crests get taller, but crest-to-crest spacing does not have to change.',
      'Amplitude and wavelength are different properties, so one can change while the other stays fixed.',
    ),
    quiz: quiz('What changes when amplitude increases?', 'The wave moves farther from its rest position.', 'The distance between crests must shrink.'),
    compareCandidate: 'physics-waves-wavelength',
    compareReason: 'Amplitude measures height from rest; wavelength measures horizontal spacing between matching wave points.',
  },
  {
    id: 'physics-waves-wavelength',
    name: 'Wavelength',
    scientificName: 'Spatial period',
    subject: 'physics',
    branch: 'Waves',
    system: 'Wave Measurement',
    model: '/models/physics/authored/physics-waves-wavelength.glb',
    tagline: 'The spacing from one crest to the next',
    summary: 'Wavelength is the distance from one matching point on a wave to the next, such as crest to crest. Shorter wavelength means more wave cycles fit into the same space.',
    keyFacts: facts('Wavelength is the distance between matching points on neighboring cycles.', 'Compress or stretch the wave source pattern.', 'Crests move closer together or farther apart.'),
    whyItMatters: 'Wavelength separates low radio waves, visible colors, X-rays, ripples, and earthquake waves by their spacing.',
    didYouKnow: 'Visible red light has a longer wavelength than visible blue light.',
    belongsTo: ['Physics', 'Waves', 'Wave Measurement'],
    conditions: ['Needs repeated cycles', 'Measured along the direction the wave travels', 'Pairs with frequency and speed'],
    visual: { shape: 'distance-path', variables: ['crest spacing', 'cycle count', 'wave speed'] },
    hotspots: [
      waveHotspots[0],
      {
        id: 'next-crest',
        label: 'Next crest',
        position: [0.75, 0.55, 0],
        color: '#38bdf8',
        description: 'The next matching high point in the wave.',
        function: 'Creates the second endpoint needed to measure one wavelength.',
      },
      {
        id: 'wavelength-span',
        label: 'Wavelength span',
        position: [0.12, 0.68, 0],
        color: '#facc15',
        description: 'The crest-to-crest distance for one full cycle.',
        function: 'Shows how stretched or compressed the wave pattern is in space.',
      },
    ],
    lesson: lesson(
      'Predict how many crests fit on the screen when wavelength is shortened.',
      'Decrease the wavelength while keeping amplitude and speed steady.',
      'More crests fit into the same width of the screen.',
      'A shorter wavelength means each cycle takes less space, so the pattern repeats more often across the same distance.',
    ),
    quiz: quiz('What does wavelength measure?', 'The distance between matching points such as crest to crest.', 'How loud a wave sounds in air.'),
    compareCandidate: 'physics-waves-frequency',
    compareReason: 'Wavelength is spacing in space; frequency is how often cycles pass in time.',
  },
  {
    id: 'physics-waves-frequency',
    name: 'Frequency',
    scientificName: 'Cycles per second',
    subject: 'physics',
    branch: 'Waves',
    system: 'Wave Timing',
    model: '/models/physics/authored/physics-waves-frequency.glb',
    tagline: 'How often the wave repeats',
    summary: 'Frequency tells how many wave cycles pass a point each second. If speed stays the same, increasing frequency makes wavelength shorter.',
    keyFacts: facts('Frequency is the number of cycles per second.', 'Move the source back and forth more quickly.', 'More crests pass the marker each second.'),
    whyItMatters: 'Frequency explains musical pitch, radio tuning, colors of light, and how sensors detect repeated signals.',
    didYouKnow: 'A middle A musical note vibrates at 440 cycles per second.',
    belongsTo: ['Physics', 'Waves', 'Wave Timing'],
    conditions: ['Needs repeated cycles', 'Measured in hertz', 'Connected to wavelength by wave speed'],
    visual: { shape: 'speed-meter', variables: ['cycles per second', 'source motion', 'wavelength'] },
    hotspots: [
      {
        id: 'cycle-counter',
        label: 'Cycle counter',
        position: [0, 0.62, 0],
        color: '#22c55e',
        description: 'A marker that counts crests passing one point.',
        function: 'Turns repeated motion into a cycles-per-second measurement.',
      },
      {
        id: 'fast-source',
        label: 'Fast source',
        position: [-0.9, 0, 0],
        color: '#f97316',
        description: 'The vibrating source moves back and forth more times each second.',
        function: 'Raises frequency by creating cycles more often.',
      },
      {
        id: 'shorter-spacing',
        label: 'Shorter spacing',
        position: [0.55, 0.2, 0],
        color: '#38bdf8',
        description: 'Cycles bunch closer together when frequency rises at the same speed.',
        function: 'Shows the inverse link between frequency and wavelength when speed is fixed.',
      },
    ],
    lesson: lesson(
      'Predict what happens to wavelength when frequency increases but wave speed stays the same.',
      'Increase the frequency control while holding the medium and speed fixed.',
      'Crests pass the marker more often and sit closer together.',
      'At the same speed, more cycles per second must use less distance per cycle, so wavelength becomes shorter.',
    ),
    quiz: quiz('What does higher frequency mean?', 'More wave cycles pass a point each second.', 'The wave must have bigger amplitude.'),
    compareCandidate: 'physics-waves-wavelength',
    compareReason: 'Frequency counts cycles in time, while wavelength measures the distance used by each cycle.',
  },
]

export const wavesById = Object.fromEntries(
  waves.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
