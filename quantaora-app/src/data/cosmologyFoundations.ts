import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const BRANCH = 'Cosmology Foundations'
const authoredFoundationModel = (id: string) => `/models/foundations/authored/${id}.glb`

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Kid test', value: 'Change distance, time, or scale, then predict what the universe model shows.' },
    { label: 'Big idea', value: 'Cosmology studies the universe as one changing system.' },
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
      options: [answer, misconception, 'Only planets are involved', 'The model has no observations'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is the best way to test a cosmology model for kids?',
      options: ['Change one scale, distance, or time control and observe the pattern', 'Change all controls at once', 'Ignore the evidence', 'Use only one galaxy as the whole universe'],
      correctIndex: 0,
      explanation: 'One controlled change makes a large-scale cause and effect easier to read.',
      misconception: 'Cosmology depends on patterns across many observations, not one unlabeled change.',
    },
    {
      prompt: 'Why do faraway objects show us the past?',
      options: ['Their light took time to reach us', 'They are pretending to be old', 'They have no gravity', 'Their color erases time'],
      correctIndex: 0,
      explanation: 'Light travels fast but not instantly, so distant light left long ago.',
      misconception: 'Looking far away is not time travel for us; it is receiving old light now.',
    },
    {
      prompt: 'What kind of evidence do cosmologists compare?',
      options: ['Light patterns from many directions and distances', 'Only weather reports', 'Only one rock sample', 'Only spaceship fuel levels'],
      correctIndex: 0,
      explanation: 'Large-scale patterns in light, color, temperature, and galaxy positions are key evidence.',
      misconception: 'Cosmology uses observations across the sky, not just nearby objects.',
    },
  ]
}

const skyHotspots: Hotspot[] = [
  {
    id: 'observer',
    label: 'Observer',
    position: [0, 0, 0],
    color: '#38BDF8',
    description: 'Our viewpoint inside the universe, not outside it.',
    function: 'Shows that observations depend on light reaching us from many directions.',
  },
  {
    id: 'far-light',
    label: 'Far light',
    position: [0.85, 0.3, 0],
    color: '#F59E0B',
    description: 'Light from faraway space began traveling long ago.',
    function: 'Connects distance with lookback time.',
  },
]

export const cosmologyFoundations: ComponentContent[] = [
  {
    id: 'space-cosmology-observable-universe',
    name: 'Observable Universe',
    scientificName: 'Observable universe',
    subject: 'space',
    branch: BRANCH,
    system: 'Cosmic Scale',
    model: authoredFoundationModel('space-cosmology-observable-universe'),
    visual: { shape: 'solar-scale', variables: ['lookback time', 'light travel', 'horizon'] },
    tagline: 'The part of the universe whose light can reach us',
    summary:
      'The observable universe is everything we can detect because its light or signals have had time to reach us. Farther light shows earlier times.',
    keyFacts: facts('The region we can observe from Earth today', 'Light takes time and the universe has a finite age', 'There is a horizon beyond which light has not reached us yet'),
    whyItMatters: 'It helps kids separate the whole universe from the part we can actually study with telescopes.',
    didYouKnow: 'The observable universe is centered on every observer from their own viewpoint, because it depends on what light has reached them.',
    belongsTo: ['Space', 'Cosmology Foundations', 'Cosmic Scale'],
    conditions: ['Limited by light travel time', 'Depends on the observer', 'Grows as more ancient light reaches us'],
    hotspots: [
      ...skyHotspots,
      {
        id: 'horizon-edge',
        label: 'Horizon edge',
        position: [1.2, 0, 0],
        color: '#A855F7',
        description: 'The farthest boundary of what can be observed today.',
        function: 'Shows the effect of finite light travel time on what evidence is available.',
      },
    ],
    lesson: lesson(
      'Predict what happens to lookback time when a galaxy is placed farther away.',
      'Move a galaxy marker outward in the scale model.',
      'The light path becomes longer, so the model labels it as older light.',
      'Greater distance causes a longer travel time, so we observe the galaxy as it was in the past.',
    ),
    quiz: quiz('What does the observable universe include?', 'Objects whose light or signals can reach us today.', 'Only the planets in our Solar System.'),
    compareCandidate: 'space-cosmology-expansion',
    compareReason: 'The observable universe defines what we can see; expansion explains a major pattern in what that light reveals.',
  },
  {
    id: 'space-cosmology-expansion',
    name: 'Expansion',
    scientificName: 'Cosmic expansion',
    subject: 'space',
    branch: BRANCH,
    system: 'Expanding Universe',
    model: authoredFoundationModel('space-cosmology-expansion'),
    visual: { shape: 'galaxy-disk', variables: ['scale factor', 'galaxy distance', 'time'] },
    tagline: 'Space stretching between galaxy groups',
    summary:
      'Cosmic expansion means large-scale space is stretching, so faraway galaxy groups tend to get farther apart. It is not an explosion from one center into empty space.',
    keyFacts: facts('The stretching of large-scale space over time', 'The universe scale factor increases', 'Distant galaxies are carried farther apart on average'),
    whyItMatters: 'Expansion is one of the strongest clues that the universe has changed over time.',
    didYouKnow: 'Raisins in rising bread dough are a common model: the raisins move apart because the dough between them stretches.',
    belongsTo: ['Space', 'Cosmology Foundations', 'Expanding Universe'],
    conditions: ['Applies on very large scales', 'Bound systems like galaxies can stay together', 'No special center inside the universe is required'],
    hotspots: [
      {
        id: 'space-between',
        label: 'Space between',
        position: [0.2, 0.15, 0],
        color: '#38BDF8',
        description: 'The gap between faraway galaxy groups increases as the scale grows.',
        function: 'Shows that expansion acts on the space between distant structures.',
      },
      {
        id: 'near-galaxy',
        label: 'Near galaxy',
        position: [-0.45, -0.1, 0],
        color: '#F59E0B',
        description: 'A closer marker used to compare distance changes.',
        function: 'Helps learners observe that larger starting gaps grow more in the model.',
      },
      {
        id: 'far-galaxy',
        label: 'Far galaxy',
        position: [0.85, 0.25, 0],
        color: '#EF4444',
        description: 'A farther marker that separates more as the scale factor increases.',
        function: 'Reveals the distance effect: farther galaxies usually show stronger expansion signals.',
      },
    ],
    lesson: lesson(
      'Predict which pair of galaxy markers separates more when the scale factor increases.',
      'Stretch the model evenly so every large-scale gap grows.',
      'The pair that started farther apart gains more total distance.',
      'Expansion multiplies distances, so larger starting gaps cause larger observed changes.',
    ),
    quiz: quiz('What is cosmic expansion?', 'Large-scale space stretching between galaxy groups.', 'Every galaxy exploding away from Earth through empty space.'),
    compareCandidate: 'space-cosmology-redshift',
    compareReason: 'Expansion is the large-scale cause; redshift is one light-pattern effect that reveals it.',
  },
  {
    id: 'space-cosmology-redshift',
    name: 'Redshift',
    scientificName: 'Cosmological redshift',
    subject: 'space',
    branch: BRANCH,
    system: 'Light Evidence',
    model: authoredFoundationModel('space-cosmology-redshift'),
    visual: { shape: 'line-arrows', variables: ['wavelength', 'distance', 'stretch amount'] },
    tagline: 'Stretched light from a stretching universe',
    summary:
      'Redshift happens when light from faraway galaxies is stretched to longer, redder wavelengths. In cosmology, larger redshift usually means the light traveled while the universe expanded more.',
    keyFacts: facts('Light shifted toward longer wavelengths', 'Expansion stretches the wavelength during travel', 'The received color pattern moves toward red'),
    whyItMatters: 'Redshift lets astronomers estimate galaxy distances and reconstruct how the universe expanded.',
    didYouKnow: 'Astronomers measure redshift by comparing known spectral lines with where those lines appear in the received light.',
    belongsTo: ['Space', 'Cosmology Foundations', 'Light Evidence'],
    conditions: ['Needs identifiable light patterns', 'Stronger for more expansion during travel', 'Not the same as simply painting an object red'],
    hotspots: [
      {
        id: 'short-wave',
        label: 'Original wave',
        position: [-0.75, 0, 0],
        color: '#38BDF8',
        description: 'The light begins with a shorter wavelength pattern.',
        function: 'Gives a starting pattern to compare with the received light.',
      },
      {
        id: 'stretched-wave',
        label: 'Stretched wave',
        position: [0.25, 0, 0],
        color: '#F97316',
        description: 'Expansion stretches the wave while it travels.',
        function: 'Shows the cause of redshift: longer wavelength after travel.',
      },
      {
        id: 'red-end',
        label: 'Redder light',
        position: [0.9, 0, 0],
        color: '#EF4444',
        description: 'The received light pattern is shifted toward red.',
        function: 'Lets learners observe the evidence left by expansion.',
      },
    ],
    lesson: lesson(
      'Predict what happens to wavelength if the light travels while space stretches more.',
      'Increase the stretch amount between the galaxy and the observer.',
      'The wave crests spread farther apart and the model marks a larger redshift.',
      'More expansion during travel causes more wavelength stretching, so the received light shifts redder.',
    ),
    quiz: quiz('What causes cosmological redshift in this model?', 'Space expansion stretches light to longer wavelengths.', 'A galaxy is covered in red paint.'),
    compareCandidate: 'space-cosmology-cmb',
    compareReason: 'Redshift explains stretched galaxy light; the cosmic microwave background is ancient light stretched even farther.',
  },
  {
    id: 'space-cosmology-cmb',
    name: 'Cosmic Microwave Background',
    scientificName: 'Cosmic microwave background radiation',
    subject: 'space',
    branch: BRANCH,
    system: 'Early Universe Evidence',
    model: authoredFoundationModel('space-cosmology-cmb'),
    visual: { shape: 'solar-scale', variables: ['ancient light', 'temperature pattern', 'sky direction'] },
    tagline: 'Ancient afterglow from the early universe',
    summary:
      'The cosmic microwave background, or CMB, is ancient light from when the universe became transparent. Expansion stretched that light into microwaves, leaving a faint glow from every direction.',
    keyFacts: facts('Ancient light filling the sky in microwave wavelengths', 'The early universe cooled enough for light to travel freely', 'Telescopes observe a nearly even glow with tiny temperature differences'),
    whyItMatters: 'The CMB is a major evidence map of the early universe and helps explain how later structure began.',
    didYouKnow: 'The tiny temperature differences in the CMB are like early seeds for where matter later clumped into galaxies.',
    belongsTo: ['Space', 'Cosmology Foundations', 'Early Universe'],
    conditions: ['Comes from every direction', 'Very cold microwave glow today', 'Tiny differences carry important clues'],
    hotspots: [
      {
        id: 'all-sky-glow',
        label: 'All-sky glow',
        position: [0, 0, 0],
        color: '#38BDF8',
        description: 'A faint microwave signal comes from every direction in the sky.',
        function: 'Shows that the evidence is cosmic, not from one nearby object.',
      },
      {
        id: 'tiny-variation',
        label: 'Tiny variation',
        position: [0.55, 0.25, 0],
        color: '#F59E0B',
        description: 'Small temperature differences appear in the otherwise even glow.',
        function: 'Marks early unevenness that gravity could later grow into structure.',
      },
      {
        id: 'stretched-ancient-light',
        label: 'Stretched light',
        position: [-0.55, -0.2, 0],
        color: '#EF4444',
        description: 'Expansion stretched once-hot light into microwave wavelengths.',
        function: 'Connects cosmic expansion with the CMB we measure today.',
      },
    ],
    lesson: lesson(
      'Predict what happens to ancient light wavelength as the universe expands for billions of years.',
      'Stretch the universe timeline from early hot light to today.',
      'The light shifts from visible/infrared-like colors toward microwave wavelengths.',
      'Long expansion time causes large wavelength stretching, turning ancient light into the CMB signal.',
    ),
    quiz: quiz('What is the CMB?', 'Ancient light from the early universe, stretched into microwaves.', 'Light from one nearby planet.'),
    compareCandidate: 'space-cosmology-large-scale-structure',
    compareReason: 'The CMB shows tiny early unevenness; large-scale structure shows how unevenness grew later.',
  },
  {
    id: 'space-cosmology-large-scale-structure',
    name: 'Large-Scale Structure',
    scientificName: 'Cosmic web',
    subject: 'space',
    branch: BRANCH,
    system: 'Cosmic Structure',
    model: authoredFoundationModel('space-cosmology-large-scale-structure'),
    visual: { shape: 'galaxy-disk', variables: ['gravity clumping', 'voids', 'filaments'] },
    tagline: 'Galaxies arranged in a cosmic web',
    summary:
      'Large-scale structure is the universe-wide pattern of galaxy clusters, filaments, and voids. Gravity slowly grows small density differences into a web-like pattern.',
    keyFacts: facts('The biggest pattern of matter in the universe', 'Gravity amplifies small early density differences', 'Galaxies collect into clusters and filaments with large voids between'),
    whyItMatters: 'The cosmic web links early-universe evidence to the galaxy patterns telescopes map today.',
    didYouKnow: 'On the largest maps, galaxies are not spread like smooth dust; they form chains, sheets, clusters, and empty-looking voids.',
    belongsTo: ['Space', 'Cosmology Foundations', 'Cosmic Structure'],
    conditions: ['Visible on very large scales', 'Grows over billions of years', 'Gravity competes with expansion'],
    hotspots: [
      {
        id: 'cluster-node',
        label: 'Cluster node',
        position: [0.45, 0.3, 0],
        color: '#F59E0B',
        description: 'A dense region where many galaxies group together.',
        function: 'Shows the effect of gravity pulling matter into crowded areas.',
      },
      {
        id: 'filament-bridge',
        label: 'Filament',
        position: [0, 0.05, 0],
        color: '#38BDF8',
        description: 'A long chain of galaxies connecting clusters.',
        function: 'Reveals that structure grows as a web, not only isolated balls.',
      },
      {
        id: 'cosmic-void',
        label: 'Void',
        position: [-0.55, -0.25, 0],
        color: '#64748B',
        description: 'A vast region with far fewer galaxies.',
        function: 'Shows where matter did not collect as strongly.',
      },
    ],
    lesson: lesson(
      'Predict what happens to clumps if gravity has more time to act.',
      'Advance the model from early small differences to a later universe.',
      'Dense spots grow denser, bridges form, and emptier voids become clearer.',
      'More time lets gravity amplify small differences into clusters, filaments, and voids.',
    ),
    quiz: quiz('What causes large-scale structure to grow from tiny early differences?', 'Gravity pulling matter into denser regions over time.', 'Galaxies choosing colors randomly.'),
    compareCandidate: 'space-cosmology-cmb',
    compareReason: 'Large-scale structure is the later growth of tiny unevenness first mapped in the CMB.',
  },
]

export const cosmologyFoundationsById = Object.fromEntries(
  cosmologyFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
