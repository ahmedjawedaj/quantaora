import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const LENS_MODEL = '/models/sourced/physics-fields/lens.glb'
const BULB_MODEL = '/models/sourced/physics-fields/bulb.glb'

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
      options: [answer, misconception, 'The object becomes heavier', 'The air stops the experiment'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What should a learner change first to see cause and effect?',
      options: ['Change one variable and watch the light path', 'Change every control at once', 'Hide the light source', 'Ignore the screen'],
      correctIndex: 0,
      explanation: 'One change at a time makes the cause visible in the effect.',
      misconception: 'Changing many things at once makes it hard to know what caused the result.',
    },
    {
      prompt: 'Which observation is most useful in an optics lab?',
      options: ['Where the rays or bright image land', 'Only the color of the table', 'How loud the room is', 'The weight of the lens'],
      correctIndex: 0,
      explanation: 'Optics is about how light travels, bends, spreads, or is blocked.',
      misconception: 'The most important evidence is the path or pattern made by the light.',
    },
  ]
}

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Kid test', value: 'Move one part, then watch the bright spot, image, or shadow move.' },
  ]
}

const lensHotspots: Hotspot[] = [
  {
    id: 'curved-glass',
    label: 'Curved glass',
    position: [0, 0.15, 0],
    color: '#38bdf8',
    description: 'The curved transparent part changes the direction of light rays.',
    function: 'Bends light because each ray slows and speeds up as it enters and leaves the lens.',
  },
  {
    id: 'focal-side',
    label: 'Focus side',
    position: [0.9, 0.05, 0],
    color: '#facc15',
    description: 'Rays meet on this side when the object is farther than the focal length.',
    function: 'Shows the effect of refraction: many rays can be steered toward one small area.',
  },
]

export const lightAndOptics: ComponentContent[] = [
  {
    id: 'optics-lens',
    name: 'Lens',
    scientificName: 'Convex lens',
    subject: 'physics',
    branch: 'Light And Optics',
    system: 'Ray Optics',
    model: LENS_MODEL,
    tagline: 'Curved glass that steers light',
    summary: 'A lens bends light because rays change speed when they move between air and glass. Move the lens closer or farther from an object and the bright image shifts, grows, shrinks, or blurs.',
    keyFacts: facts('A transparent curved material that bends light rays', 'Light changes speed at the air-glass boundary', 'Rays change direction and can meet at a focus'),
    whyItMatters: 'Lenses make eyeglasses, cameras, microscopes, and telescopes work. The same cause/effect pattern explains why moving a lens changes focus.',
    didYouKnow: 'Your eye has a living lens that changes shape so near and far objects can focus on the retina.',
    belongsTo: ['Physics', 'Light And Optics', 'Ray Optics'],
    conditions: ['Works best with transparent material', 'Needs light from an object or source', 'Image sharpness depends on distance'],
    visual: { shape: 'ray-arrow', variables: ['object distance', 'lens position', 'focus distance'] },
    hotspots: lensHotspots,
    lesson: lesson(
      'Predict what happens to the bright spot when the lens moves farther from a paper screen.',
      'Slide the lens away from the screen while keeping the bulb in place.',
      'The bright spot changes size and can pass through one sharp position.',
      'The sharp position happens when refracted rays meet on the screen instead of crossing before or after it.',
    ),
    quiz: quiz('Why can a lens make a sharp bright spot?', 'Its curved surfaces bend many rays toward the same place.', 'A lens creates new light inside the glass.'),
    compareCandidate: 'optics-focus',
    compareReason: 'The lens is the object doing the bending; focus is the place where the bending effect becomes visible.',
  },
  {
    id: 'optics-refraction',
    name: 'Refraction',
    scientificName: 'Change in ray direction across media',
    subject: 'physics',
    branch: 'Light And Optics',
    system: 'Ray Optics',
    model: LENS_MODEL,
    tagline: 'Light bends when its speed changes',
    summary: 'Refraction happens when light crosses from one material into another and changes speed. A straw looking bent in water and a lens focusing light are both refraction effects.',
    keyFacts: facts('Bending of light as it crosses between materials', 'Light speed changes in glass, water, or plastic', 'The ray turns, so the seen position can shift'),
    whyItMatters: 'Refraction explains glasses, rainbows, camera lenses, and why underwater objects are not exactly where they appear.',
    didYouKnow: 'A swimming pool can look shallower than it is because refracted light shifts where the bottom appears to be.',
    belongsTo: ['Physics', 'Light And Optics', 'Ray Optics'],
    conditions: ['Needs two different transparent materials', 'Bending is stronger for larger speed changes', 'The incoming angle changes the outgoing angle'],
    visual: { shape: 'line-arrows', variables: ['incident angle', 'material', 'bend amount'] },
    hotspots: lensHotspots,
    lesson: lesson(
      'Predict whether a slanted ray bends more when it enters glass straight on or at an angle.',
      'Tilt the incoming ray so it strikes the lens surface at a steeper angle.',
      'The outgoing ray changes direction more clearly.',
      'At an angle, one side of the light wave slows first, so the ray pivots as it enters.',
    ),
    quiz: quiz('What causes refraction?', 'Light changes speed when it enters a different transparent material.', 'Light gets tired after traveling far.'),
    compareCandidate: 'optics-lens',
    compareReason: 'Refraction is the rule; the lens is a tool shaped to use that rule in a controlled way.',
  },
  {
    id: 'optics-focus',
    name: 'Focus',
    scientificName: 'Focal point',
    subject: 'physics',
    branch: 'Light And Optics',
    system: 'Image Formation',
    model: LENS_MODEL,
    tagline: 'Where bent rays meet',
    summary: 'Focus is the small region where light rays meet after a lens bends them. When the screen is at the focus, the image looks sharp; when it is not, the same light spreads into blur.',
    keyFacts: facts('The point or plane where rays meet most tightly', 'A lens bends separated rays inward', 'Light energy is concentrated into a sharper image'),
    whyItMatters: 'Focusing is why cameras need focusing rings and why a projector must sit the right distance from the screen.',
    didYouKnow: 'A magnifying glass can focus sunlight into a tiny hot spot because the light energy is squeezed into a small area.',
    belongsTo: ['Physics', 'Light And Optics', 'Image Formation'],
    conditions: ['Needs a converging lens or mirror', 'Sharp focus depends on distance', 'Too near or too far makes blur'],
    visual: { shape: 'ray-arrow', variables: ['screen distance', 'ray spread', 'sharpness'] },
    hotspots: [
      ...lensHotspots,
      {
        id: 'focus-point',
        label: 'Focus point',
        position: [1.3, 0, 0],
        color: '#fb7185',
        description: 'The place where the bent rays meet most tightly.',
        function: 'Turns a wide bundle of light into a clear image or a bright spot.',
      },
    ],
    lesson: lesson(
      'Predict what the image will look like if the screen is moved past the focus.',
      'Move the screen from before the focus to after the focus.',
      'The image becomes sharp near one distance, then spreads out again.',
      'After rays cross, they separate again, so the screen catches a blurred bundle.',
    ),
    quiz: quiz('Why does an image blur when the screen is not at focus?', 'The rays have not met yet or have already crossed and spread out.', 'The lens stops bending light after one second.'),
    compareCandidate: 'optics-image',
    compareReason: 'Focus is the meeting place for rays; image formation is the pattern those rays draw on the screen.',
  },
  {
    id: 'optics-image',
    name: 'Image',
    scientificName: 'Real optical image',
    subject: 'physics',
    branch: 'Light And Optics',
    system: 'Image Formation',
    model: BULB_MODEL,
    tagline: 'A pattern made by redirected light',
    summary: 'An image forms when light from each point on an object is redirected to a matching point on a screen or sensor. A bulb, lens, and screen let kids see that changing distance changes image size and sharpness.',
    keyFacts: facts('A light pattern that matches an object', 'Rays from object points are redirected by a lens', 'A screen or sensor receives a bright, organized pattern'),
    whyItMatters: 'Every photo, movie projector, and eye image depends on putting light from the world into an organized pattern.',
    didYouKnow: 'A simple convex lens can make an upside-down real image of a bright window on a white wall.',
    belongsTo: ['Physics', 'Light And Optics', 'Image Formation'],
    conditions: ['Needs a bright object', 'Needs a lens or small opening to organize rays', 'Needs a surface or sensor to catch the image'],
    visual: { shape: 'power-bulb', variables: ['object brightness', 'lens distance', 'image size'] },
    hotspots: [
      {
        id: 'light-source',
        label: 'Light source',
        position: [-0.5, 0.1, 0],
        color: '#f97316',
        description: 'The bulb sends light rays outward in many directions.',
        function: 'Provides the rays that a lens can redirect into an image.',
      },
      {
        id: 'screen-image',
        label: 'Screen image',
        position: [0.9, 0, 0],
        color: '#22c55e',
        description: 'A surface catches the organized light pattern.',
        function: 'Makes image size, sharpness, and brightness easy to observe.',
      },
    ],
    lesson: lesson(
      'Predict what happens to image brightness when the bulb is moved farther away.',
      'Move the bulb farther from the lens while leaving the screen fixed.',
      'Less light reaches the lens, so the image becomes dimmer and may need refocusing.',
      'Spreading light over a larger space means the lens catches a smaller share of the bulb rays.',
    ),
    quiz: quiz('What is an optical image made from?', 'A pattern of light rays landing in organized places.', 'A shadow painted onto the air.'),
    compareCandidate: 'optics-focus',
    compareReason: 'A focused ray bundle is what makes the image sharp enough to recognize.',
  },
]

export const lightAndOpticsById = Object.fromEntries(
  lightAndOptics.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
