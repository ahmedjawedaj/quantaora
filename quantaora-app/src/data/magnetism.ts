import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const COMPASS_MODEL = '/models/sourced/physics-fields/compass.glb'

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
      options: [answer, misconception, 'Only gravity changes', 'The compass glass makes magnetism'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What shows the effect of a magnetic field most directly?',
      options: ['A compass needle turning', 'A ruler getting longer', 'A bulb getting heavier', 'A shadow changing color'],
      correctIndex: 0,
      explanation: 'A compass needle is a tiny magnet, so it rotates to line up with the nearby magnetic field.',
      misconception: 'Magnetic fields are invisible, so we look for motion or alignment they cause.',
    },
    {
      prompt: 'How should a learner test a magnetism cause?',
      options: ['Move one magnet or current source and watch the compass', 'Shake every object at once', 'Cover the compass face', 'Ignore direction'],
      correctIndex: 0,
      explanation: 'Changing one cause makes the direction change easier to connect to the field.',
      misconception: 'Random movement hides the field pattern instead of revealing it.',
    },
  ]
}

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Kid test', value: 'Move the source, then watch whether the compass needle turns.' },
  ]
}

const compassHotspots: Hotspot[] = [
  {
    id: 'needle',
    label: 'Needle',
    position: [0, 0.08, 0.35],
    color: '#ef4444',
    description: 'The needle is a small magnet that can rotate.',
    function: 'It lines up with the strongest magnetic field direction at its location.',
  },
  {
    id: 'direction-card',
    label: 'Direction card',
    position: [0, -0.02, 0],
    color: '#38bdf8',
    description: 'The card helps compare the needle direction before and after a change.',
    function: 'Turns invisible field direction into a visible angle a learner can read.',
  },
]

export const magnetism: ComponentContent[] = [
  {
    id: 'magnetism-compass',
    name: 'Compass',
    scientificName: 'Magnetic compass',
    subject: 'physics',
    branch: 'Magnetism',
    system: 'Magnetic Fields',
    model: COMPASS_MODEL,
    tagline: 'A tiny magnet that points with the field',
    summary: 'A compass needle turns because it is a small magnet inside a larger magnetic field. Bring a magnet nearby and the needle swings toward the new field direction.',
    keyFacts: facts('A freely turning magnetic needle', 'Nearby magnetic fields push and twist the needle', 'The needle rotates until it lines up with the field'),
    whyItMatters: 'Compasses make invisible magnetic fields visible, from classroom magnets to Earth itself.',
    didYouKnow: 'Earth behaves like a giant weak magnet, which is why a compass can help with navigation.',
    belongsTo: ['Physics', 'Magnetism', 'Magnetic Fields'],
    conditions: ['Needle must be free to rotate', 'Nearby magnets can overpower Earth field', 'Metal objects can disturb the reading'],
    visual: { shape: 'line-arrows', variables: ['field direction', 'needle angle', 'magnet distance'] },
    hotspots: compassHotspots,
    lesson: lesson(
      'Predict which way the compass needle turns when a bar magnet moves closer.',
      'Move the magnet from far away to one side of the compass.',
      'The needle rotates away from north and lines up with the nearby magnet field.',
      'The stronger nearby field becomes the main cause, so the compass shows that local direction.',
    ),
    quiz: quiz('Why does a compass needle turn near a magnet?', 'The needle is a magnet and aligns with the nearby magnetic field.', 'The magnet blows air across the needle.'),
    compareCandidate: 'magnetism-field',
    compareReason: 'The compass is the detector; the magnetic field is the invisible pattern it detects.',
  },
  {
    id: 'magnetism-field',
    name: 'Magnetic Field',
    scientificName: 'Magnetic field vector pattern',
    subject: 'physics',
    branch: 'Magnetism',
    system: 'Magnetic Fields',
    model: COMPASS_MODEL,
    tagline: 'Invisible directions around a magnet',
    summary: 'A magnetic field is the region where magnetic forces can act. A compass at different places points in different directions, mapping the field line pattern.',
    keyFacts: facts('A region where magnetic forces affect magnets or moving charges', 'Magnets and electric currents create fields', 'Compass needles and iron filings line up with the field'),
    whyItMatters: 'Fields explain action at a distance: a magnet can move a needle without touching it.',
    didYouKnow: 'Iron filings form loops around a bar magnet because each filing becomes a tiny temporary magnet.',
    belongsTo: ['Physics', 'Magnetism', 'Magnetic Fields'],
    conditions: ['Stronger close to the source', 'Has direction at every point', 'Can add together with other fields'],
    visual: { shape: 'gravity-field', variables: ['field strength', 'distance', 'direction'] },
    hotspots: compassHotspots,
    lesson: lesson(
      'Predict whether the compass turns more near the magnet or far from it.',
      'Place the compass at three distances from the magnet.',
      'The needle deflects most when it is closest.',
      'Magnetic field strength decreases with distance, so the turning effect weakens farther away.',
    ),
    quiz: quiz('What does a magnetic field describe?', 'Where magnetic forces act and which direction they point.', 'The color painted on a magnet.'),
    compareCandidate: 'magnetism-compass',
    compareReason: 'The field is invisible until a detector like a compass reveals its direction.',
  },
  {
    id: 'magnetism-poles',
    name: 'Poles',
    scientificName: 'North and south magnetic poles',
    subject: 'physics',
    branch: 'Magnetism',
    system: 'Magnetic Forces',
    model: COMPASS_MODEL,
    tagline: 'The two ends that decide push or pull',
    summary: 'Every magnet has a north pole and a south pole. Opposite poles attract, while like poles repel, so flipping a magnet reverses the cause and the compass effect.',
    keyFacts: facts('The two named ends of a magnet', 'Pole orientation sets field direction', 'Opposite poles pull together and like poles push apart'),
    whyItMatters: 'Poles turn magnetism into a rule kids can predict: flip the magnet and the direction of force changes.',
    didYouKnow: 'Cutting a magnet in half does not make a north-only piece; each half gets a north and south pole.',
    belongsTo: ['Physics', 'Magnetism', 'Magnetic Forces'],
    conditions: ['Poles always come in pairs', 'Like poles repel', 'Opposite poles attract'],
    visual: { shape: 'force-push', variables: ['pole type', 'distance', 'force direction'] },
    hotspots: [
      ...compassHotspots,
      {
        id: 'north-end',
        label: 'North-seeking end',
        position: [0.3, 0.1, 0.35],
        color: '#ef4444',
        description: 'One end of the needle points toward magnetic north unless a nearby magnet changes the field.',
        function: 'Gives the learner a stable direction marker for attraction, repulsion, and field mapping.',
      },
    ],
    lesson: lesson(
      'Predict what happens when the nearby magnet is flipped end-for-end.',
      'Turn the magnet around without moving the compass.',
      'The compass needle swings toward a new direction.',
      'Flipping swaps the poles, so the field direction at the compass reverses.',
    ),
    quiz: quiz('What happens when like magnetic poles face each other?', 'They repel, pushing away from each other.', 'They always attract because all magnets stick.'),
    compareCandidate: 'magnetism-field',
    compareReason: 'Poles are the source pattern; the field shows how that pattern spreads through space.',
  },
  {
    id: 'magnetism-electromagnet',
    name: 'Electromagnet',
    scientificName: 'Current-carrying coil magnet',
    subject: 'physics',
    branch: 'Magnetism',
    system: 'Electricity And Magnetism',
    model: COMPASS_MODEL,
    tagline: 'Current that can switch magnetism on',
    summary: 'An electromagnet forms when electric current flows through a wire coil. Turn the current up and the compass turns more; reverse the current and the magnetic direction flips.',
    keyFacts: facts('A magnet made by electric current', 'Moving charges in a wire create a magnetic field', 'More current or more coil turns makes a stronger compass deflection'),
    whyItMatters: 'Motors, speakers, cranes, relays, and generators all use the link between electricity and magnetism.',
    didYouKnow: 'Some scrapyard cranes can drop metal by switching off the electromagnet current.',
    belongsTo: ['Physics', 'Magnetism', 'Electricity And Magnetism'],
    conditions: ['Requires a closed electric circuit', 'Current direction sets pole direction', 'Iron cores strengthen many classroom electromagnets'],
    visual: { shape: 'current-loop', variables: ['current', 'coil turns', 'compass deflection'] },
    hotspots: compassHotspots,
    lesson: lesson(
      'Predict what happens to the compass when current through a nearby coil increases.',
      'Raise the current while keeping the coil and compass in place.',
      'The compass turns farther from its starting direction.',
      'A larger current makes a stronger magnetic field, so the needle feels a stronger turning effect.',
    ),
    quiz: quiz('How can an electromagnet become stronger?', 'Increase the current or add more coil turns.', 'Paint the wire a brighter color.'),
    compareCandidate: 'magnetism-poles',
    compareReason: 'An electromagnet has poles like a bar magnet, but current can change their strength and direction.',
  },
]

export const magnetismById = Object.fromEntries(
  magnetism.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
