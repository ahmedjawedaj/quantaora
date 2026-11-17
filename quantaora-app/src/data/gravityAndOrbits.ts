import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const BRANCH = 'Gravity And Orbits'
const authoredFoundationModel = (id: string) => `/models/foundations/authored/${id}.glb`

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Kid test', value: 'Change mass, distance, or speed, then predict the orbit change.' },
    { label: 'Space link', value: 'Gravity connects falling, orbiting, and escaping.' },
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
      options: [answer, misconception, 'The object stops having mass', 'Only the background color changes'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'Which change is best for testing cause and effect in an orbit model?',
      options: ['Change one variable, such as speed or distance', 'Change every variable at once', 'Hide the central body', 'Ignore the path shape'],
      correctIndex: 0,
      explanation: 'One variable at a time makes the orbit response easier to understand.',
      misconception: 'Changing everything at once makes it hard to know what caused the new path.',
    },
    {
      prompt: 'What happens to gravity when two objects are farther apart?',
      options: ['It gets weaker', 'It gets stronger forever', 'It becomes sound', 'It stops depending on mass'],
      correctIndex: 0,
      explanation: 'Gravity weakens with distance, so faraway objects tug less strongly.',
      misconception: 'Gravity reaches far, but it does not stay equally strong at every distance.',
    },
    {
      prompt: 'What keeps a satellite from simply falling straight down?',
      options: ['Sideways speed', 'No gravity at all', 'A hidden rope', 'The satellite being weightless in every way'],
      correctIndex: 0,
      explanation: 'A satellite is falling around the planet because sideways speed carries it forward while gravity pulls inward.',
      misconception: 'Orbit does not mean gravity disappeared; gravity is the inward pull making the path curve.',
    },
  ]
}

const orbitHotspots: Hotspot[] = [
  {
    id: 'central-mass',
    label: 'Central mass',
    position: [0, 0, 0],
    color: '#F59E0B',
    description: 'The larger body that pulls the orbiting object inward.',
    function: 'More central mass causes stronger gravity and can require faster orbital speed.',
  },
  {
    id: 'orbit-path',
    label: 'Orbit path',
    position: [0.75, 0.25, 0],
    color: '#38BDF8',
    description: 'The curved path followed by the moving object.',
    function: 'Shows the effect of gravity bending sideways motion into a loop or ellipse.',
  },
  {
    id: 'velocity-arrow',
    label: 'Sideways speed',
    position: [0.95, 0, 0],
    color: '#22C55E',
    description: 'The forward motion that keeps the object moving around instead of straight down.',
    function: 'Changing speed changes whether the path falls, orbits, or escapes.',
  },
]

export const gravityAndOrbits: ComponentContent[] = [
  {
    id: 'space-gravity-force',
    name: 'Gravity',
    scientificName: 'Gravitational attraction',
    subject: 'space',
    branch: BRANCH,
    system: 'Orbital Mechanics',
    model: authoredFoundationModel('space-gravity-force'),
    visual: { shape: 'gravity-field', variables: ['mass', 'distance', 'force strength'] },
    tagline: 'Mass pulling on mass across space',
    summary:
      'Gravity is the pull between objects with mass. More mass makes a stronger pull, while more distance makes the pull weaker.',
    keyFacts: facts('Attraction between objects with mass', 'Mass and distance set the strength of the pull', 'Objects accelerate toward each other or curve their paths'),
    whyItMatters: 'Gravity holds planets, moons, stars, and galaxies together and explains why orbits happen.',
    didYouKnow: 'You pull on Earth with gravity too, but Earth has so much more mass that its motion is too tiny to notice.',
    belongsTo: ['Space', 'Gravity And Orbits', 'Forces'],
    conditions: ['Every mass attracts every other mass', 'Stronger for larger masses', 'Weaker at larger distances'],
    hotspots: [
      {
        id: 'mass-source',
        label: 'Mass source',
        position: [0, 0, 0],
        color: '#F59E0B',
        description: 'A massive object creates a stronger gravitational pull.',
        function: 'Increasing mass causes nearby paths to curve more strongly.',
      },
      {
        id: 'field-lines',
        label: 'Field pattern',
        position: [0.65, 0.25, 0],
        color: '#38BDF8',
        description: 'A visual guide showing where gravity points inward.',
        function: 'Helps learners observe that gravity acts without contact.',
      },
      {
        id: 'distance-gap',
        label: 'Distance gap',
        position: [1.05, 0, 0],
        color: '#22C55E',
        description: 'Farther objects feel less gravitational pull.',
        function: 'Shows why changing distance changes acceleration and orbit shape.',
      },
    ],
    lesson: lesson(
      'Predict what happens to the pull if the planet mass doubles but distance stays the same.',
      'Increase the central mass while keeping the test object at the same distance.',
      'The field looks stronger and the path curves inward more quickly.',
      'More mass causes stronger gravity, so the same moving object changes direction faster.',
    ),
    quiz: quiz('What makes gravity stronger in this model?', 'More mass or shorter distance.', 'Painting the planet brighter.'),
    compareCandidate: 'space-orbit-path',
    compareReason: 'Gravity is the inward cause; an orbit is one visible effect of that inward pull.',
  },
  {
    id: 'space-orbit-path',
    name: 'Orbit',
    scientificName: 'Bound orbital path',
    subject: 'space',
    branch: BRANCH,
    system: 'Orbital Mechanics',
    model: authoredFoundationModel('space-orbit-path'),
    visual: { shape: 'orbit-loop', variables: ['sideways speed', 'gravity', 'path curve'] },
    tagline: 'Falling around instead of falling down',
    summary:
      'An orbit happens when sideways motion and gravity balance into a repeating curved path. Change speed or distance and the orbit can shrink, stretch, crash, or escape.',
    keyFacts: facts('A repeating path around a massive body', 'Sideways speed combines with inward gravity', 'The object keeps missing the ground and curves around'),
    whyItMatters: 'Orbits let moons circle planets, planets circle stars, and spacecraft stay useful above Earth.',
    didYouKnow: 'Astronauts in orbit are still pulled by Earth gravity; they feel weightless because they are continuously falling around Earth.',
    belongsTo: ['Space', 'Gravity And Orbits', 'Orbital Motion'],
    conditions: ['Needs gravity', 'Needs enough sideways speed', 'Path depends on distance from the central mass'],
    hotspots: orbitHotspots,
    lesson: lesson(
      'Predict what happens if sideways speed is too small for the current distance.',
      'Lower the orbiting object speed while keeping the planet mass the same.',
      'The path curves inward and may hit the central body instead of looping.',
      'Too little speed lets gravity pull the object down faster than it moves around.',
    ),
    quiz: quiz('Why is orbit often called falling around?', 'Gravity pulls inward while sideways speed carries the object forward.', 'There is no gravity in orbit.'),
    compareCandidate: 'space-orbital-speed',
    compareReason: 'The orbit path depends directly on having the right orbital speed for the distance and mass.',
  },
  {
    id: 'space-escape-speed',
    name: 'Escape Speed',
    scientificName: 'Escape velocity threshold',
    subject: 'space',
    branch: BRANCH,
    system: 'Orbital Mechanics',
    model: authoredFoundationModel('space-escape-speed'),
    visual: { shape: 'motion-vector', variables: ['launch speed', 'mass', 'escape path'] },
    tagline: 'Fast enough to leave and not fall back',
    summary:
      'Escape speed is the speed needed to leave a world without falling back. A more massive world or a closer starting point needs a higher escape speed.',
    keyFacts: facts('The minimum speed needed to escape gravity without more thrust', 'Mass and starting distance set the needed speed', 'The path opens instead of looping back'),
    whyItMatters: 'Rocket missions need enough energy to leave Earth, the Moon, or another planet and reach the next destination.',
    didYouKnow: 'Escape speed from Earth is much larger than from the Moon because Earth is more massive.',
    belongsTo: ['Space', 'Gravity And Orbits', 'Spaceflight'],
    conditions: ['Higher near massive bodies', 'Lower from farther away', 'Direction and atmosphere matter for real rockets'],
    hotspots: [
      ...orbitHotspots,
      {
        id: 'escape-arrow',
        label: 'Escape path',
        position: [1.25, 0.55, 0],
        color: '#EF4444',
        description: 'A path that does not close into an orbit.',
        function: 'Shows the effect of speed passing the escape threshold.',
      },
    ],
    lesson: lesson(
      'Predict whether escape speed rises or falls when the central mass increases.',
      'Increase the planet mass and keep the launch distance the same.',
      'The model needs a faster launch arrow before the path opens away.',
      'More mass causes stronger gravity, so escaping requires more starting speed.',
    ),
    quiz: quiz('What happens when speed is above escape speed?', 'The path can leave instead of closing into an orbit.', 'The object must stop immediately.'),
    compareCandidate: 'space-orbital-speed',
    compareReason: 'Orbital speed closes a path around a body; escape speed is high enough to open the path outward.',
  },
  {
    id: 'space-orbital-speed',
    name: 'Orbital Speed',
    scientificName: 'Circular orbital velocity',
    subject: 'space',
    branch: BRANCH,
    system: 'Orbital Mechanics',
    model: authoredFoundationModel('space-orbital-speed'),
    visual: { shape: 'speed-meter', variables: ['speed', 'orbit radius', 'central mass'] },
    tagline: 'The just-right speed for a steady orbit',
    summary:
      'Orbital speed is the sideways speed needed to keep circling at a certain distance. Close orbits around massive bodies usually need faster speeds.',
    keyFacts: facts('The speed needed to follow an orbit at a given distance', 'Mass and orbit radius set the needed speed', 'Too slow falls inward; too fast stretches or escapes'),
    whyItMatters: 'Satellites, space stations, and probes all need carefully chosen speeds to stay on their planned paths.',
    didYouKnow: 'The International Space Station moves fast enough to circle Earth about every 90 minutes.',
    belongsTo: ['Space', 'Gravity And Orbits', 'Orbital Motion'],
    conditions: ['Depends on central mass', 'Depends on distance', 'Must point mostly sideways for a stable orbit'],
    hotspots: orbitHotspots,
    lesson: lesson(
      'Predict whether a lower orbit needs faster or slower sideways speed.',
      'Move the satellite closer to the planet and adjust speed until the loop stays steady.',
      'The closer orbit needs faster motion to keep from falling inward.',
      'Closer distance causes stronger gravity, so orbital speed must increase to keep the path curved but stable.',
    ),
    quiz: quiz('What can happen if orbital speed is too low?', 'The object falls inward or crashes.', 'The object automatically escapes.'),
    compareCandidate: 'space-barycenter',
    compareReason: 'Orbital speed describes motion around a system; barycenter shows what point the bodies actually orbit.',
  },
  {
    id: 'space-barycenter',
    name: 'Center of Mass',
    scientificName: 'Barycenter',
    subject: 'space',
    branch: BRANCH,
    system: 'Multi-body Motion',
    model: authoredFoundationModel('space-barycenter'),
    visual: { shape: 'gravity-well', variables: ['two masses', 'balance point', 'orbit center'] },
    tagline: 'The balance point two worlds orbit around',
    summary:
      'The center of mass, or barycenter, is the balance point of two orbiting bodies. If one body is much more massive, the barycenter sits close to it; if masses are similar, the point moves between them.',
    keyFacts: facts('The shared balance point of a system', 'Mass distribution sets where the point sits', 'Both bodies orbit that point, though one wobble may be tiny'),
    whyItMatters: 'Barycenters help astronomers detect planets by watching stars wobble.',
    didYouKnow: 'The Sun also wobbles slightly because planets pull on it as they orbit.',
    belongsTo: ['Space', 'Gravity And Orbits', 'Barycenters'],
    conditions: ['Depends on both masses', 'Moves toward the heavier body', 'Can be inside or outside a body'],
    hotspots: [
      {
        id: 'heavy-body',
        label: 'Heavier body',
        position: [-0.45, 0, 0],
        color: '#F59E0B',
        description: 'The larger mass pulls the balance point closer.',
        function: 'Shows how mass controls the center of mass position.',
      },
      {
        id: 'lighter-body',
        label: 'Lighter body',
        position: [0.85, 0, 0],
        color: '#38BDF8',
        description: 'The smaller mass orbits farther from the shared balance point.',
        function: 'Makes the heavier body wobble instead of staying perfectly still.',
      },
      {
        id: 'balance-point',
        label: 'Barycenter',
        position: [-0.15, 0, 0],
        color: '#22C55E',
        description: 'The shared point both bodies orbit around.',
        function: 'Reveals that orbiting systems balance around mass, not always the center of the bigger object.',
      },
    ],
    lesson: lesson(
      'Predict where the barycenter moves if the smaller body gains mass.',
      'Increase the smaller body mass while keeping the distance the same.',
      'The balance point shifts away from the larger body and toward the space between them.',
      'Adding mass to one side causes the center of mass to move toward that side.',
    ),
    quiz: quiz('Where is the barycenter when one body is much more massive?', 'Close to the more massive body.', 'Always exactly halfway between the bodies.'),
    compareCandidate: 'space-gravity-force',
    compareReason: 'Gravity creates the mutual pull; the barycenter shows how two pulled bodies share motion.',
  },
]

export const gravityAndOrbitsById = Object.fromEntries(
  gravityAndOrbits.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
