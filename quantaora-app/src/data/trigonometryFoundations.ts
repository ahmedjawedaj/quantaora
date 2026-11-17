import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const BRANCH = 'Trigonometry Foundations'

function facts(definition: string, cause: string, effect: string, modelCue: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Interactive test', value: 'Drag the angle slider, then read the sine, cosine, and tangent meters.' },
    { label: 'Model cue', value: modelCue },
    { label: 'Core idea', value: 'Angles and side lengths are connected by stable ratios.' },
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
      options: [answer, misconception, 'The triangle must become a circle', 'Only the color changes'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What should you change to see trigonometry cause and effect?',
      options: ['Change one angle and watch the sides or ratios', 'Change all labels at once', 'Hide the right angle', 'Ignore which side is hypotenuse'],
      correctIndex: 0,
      explanation: 'One angle change makes the side-ratio effect visible.',
      misconception: 'Changing many parts at once makes the ratio relationship harder to see.',
    },
    {
      prompt: 'Which side is always opposite the right angle?',
      options: ['Hypotenuse', 'Adjacent side', 'Opposite side to any chosen angle', 'The shortest side'],
      correctIndex: 0,
      explanation: 'The hypotenuse is the longest side and sits across from the right angle.',
      misconception: 'Adjacent and opposite depend on the chosen acute angle; hypotenuse does not.',
    },
    {
      prompt: 'Why are trig ratios useful?',
      options: ['They connect angles to side lengths', 'They remove the need for measuring', 'They work only for squares', 'They make every triangle identical'],
      correctIndex: 0,
      explanation: 'Trig ratios let people predict unknown sides or angles from known ones.',
      misconception: 'Ratios do not erase measurement; they organize it into a predictable relationship.',
    },
  ]
}

const triangleHotspots: Hotspot[] = [
  {
    id: 'right-angle',
    label: 'Right angle',
    position: [-0.55, -0.45, 0],
    color: '#2563EB',
    description: 'The 90-degree corner that makes the triangle a right triangle.',
    function: 'Creates the special side relationships used by sine, cosine, and tangent.',
  },
  {
    id: 'hypotenuse',
    label: 'Hypotenuse',
    position: [0.35, 0.2, 0],
    color: '#DC2626',
    description: 'The longest side, across from the right angle.',
    function: 'Acts as the comparison side for sine and cosine.',
  },
  {
    id: 'chosen-angle',
    label: 'Chosen angle',
    position: [-0.85, -0.35, 0],
    color: '#F59E0B',
    description: 'The acute angle used to name opposite and adjacent sides.',
    function: 'Changing this angle changes the side ratios.',
  },
]

export const trigonometryFoundations: ComponentContent[] = [
  {
    id: 'math-trig-right-triangle',
    name: 'Right Triangle',
    scientificName: 'Right-angled triangle',
    subject: 'math',
    branch: BRANCH,
    system: 'Triangle Ratios',
    model: '',
    visual: { shape: 'triangle-prism', variables: ['right angle', 'opposite side', 'hypotenuse'] },
    tagline: 'One square corner unlocks side ratios',
    summary:
      'A right triangle has one 90-degree angle. Once one acute angle is chosen, the sides can be named opposite, adjacent, and hypotenuse.',
    keyFacts: facts(
      'A triangle with one 90-degree angle',
      'Choosing an acute angle names the nearby and across sides',
      'The same side lengths can be read as useful ratios',
      'The slider keeps the hypotenuse at 1, so the opposite side matches sine and the adjacent side matches cosine.',
    ),
    whyItMatters: 'Right triangles help measure ramps, roofs, shadows, maps, and distances that are hard to reach directly.',
    didYouKnow: 'At 30 degrees, the opposite side is exactly half the hypotenuse in the classic 30-60-90 triangle.',
    belongsTo: ['Math', 'Trigonometry Foundations', 'Geometry'],
    conditions: ['Must have one right angle', 'Hypotenuse is across from the right angle', 'Opposite and adjacent depend on the chosen angle', 'Angle slider changes one acute angle at a time'],
    hotspots: triangleHotspots,
    lesson: lesson(
      'Predict which side gets longer if the chosen angle opens wider while the hypotenuse stays fixed.',
      'Increase the acute angle and keep the hypotenuse the same length.',
      'The opposite side grows and the adjacent side shrinks.',
      'Changing the angle causes the side balance to change while the right angle keeps the triangle structure stable.',
    ),
    quiz: quiz('What makes a right triangle special?', 'It has one 90-degree angle.', 'It has three equal sides.'),
    compareCandidate: 'math-trig-sine',
    compareReason: 'Sine starts with the right triangle and focuses on the opposite side compared with the hypotenuse.',
  },
  {
    id: 'math-trig-sine',
    name: 'Sine',
    scientificName: 'Sine ratio',
    subject: 'math',
    branch: BRANCH,
    system: 'Triangle Ratios',
    model: '',
    visual: { shape: 'angle-arc', variables: ['angle', 'opposite', 'hypotenuse'] },
    tagline: 'Opposite over hypotenuse',
    summary:
      'Sine compares the side opposite a chosen angle with the hypotenuse. As the angle grows, the opposite side becomes a bigger share of the hypotenuse.',
    keyFacts: facts(
      'A ratio: opposite side divided by hypotenuse',
      'Changing the angle changes the opposite-side share',
      'Sine grows from 0 toward 1 for angles from 0 to 90 degrees',
      'On the unit circle, sine is the point height, so the y-coordinate meter rises as the radius turns upward.',
    ),
    whyItMatters: 'Sine helps find heights, ramps, waves, and positions using an angle and a distance.',
    didYouKnow: 'The word sine comes from a long history of astronomers using triangles to study the sky.',
    belongsTo: ['Math', 'Trigonometry Foundations', 'Ratios'],
    conditions: ['Use a right triangle', 'Choose the angle first', 'Compare opposite to hypotenuse', 'Watch the y-coordinate on the unit circle match the opposite side'],
    hotspots: [
      ...triangleHotspots,
      {
        id: 'opposite-side',
        label: 'Opposite side',
        position: [0.55, -0.05, 0],
        color: '#16A34A',
        description: 'The side across from the chosen angle.',
        function: 'Its size compared with the hypotenuse is the sine ratio.',
      },
    ],
    lesson: lesson(
      'Predict what happens to sine when the angle changes from small to larger.',
      'Open the angle while keeping the hypotenuse fixed.',
      'The opposite side grows, so opposite divided by hypotenuse grows too.',
      'A larger angle causes the opposite side to take up more of the hypotenuse length.',
    ),
    quiz: quiz('Sine compares which sides?', 'Opposite divided by hypotenuse.', 'Adjacent divided by hypotenuse.'),
    compareCandidate: 'math-trig-cosine',
    compareReason: 'Sine and cosine use the same right triangle but compare different legs with the hypotenuse.',
  },
  {
    id: 'math-trig-cosine',
    name: 'Cosine',
    scientificName: 'Cosine ratio',
    subject: 'math',
    branch: BRANCH,
    system: 'Triangle Ratios',
    model: '',
    visual: { shape: 'angle-arc', variables: ['angle', 'adjacent', 'hypotenuse'] },
    tagline: 'Adjacent over hypotenuse',
    summary:
      'Cosine compares the side next to a chosen angle with the hypotenuse. As the angle grows, that adjacent side becomes a smaller share of the hypotenuse.',
    keyFacts: facts(
      'A ratio: adjacent side divided by hypotenuse',
      'Changing the angle changes the nearby-side share',
      'Cosine decreases from 1 toward 0 for angles from 0 to 90 degrees',
      'On the unit circle, cosine is the point x-position, so the horizontal meter shrinks as the radius turns upward.',
    ),
    whyItMatters: 'Cosine helps find horizontal distance, shadow direction, and parts of a slanted motion.',
    didYouKnow: 'Sine and cosine trade roles: when one grows in a right triangle, the other shrinks.',
    belongsTo: ['Math', 'Trigonometry Foundations', 'Ratios'],
    conditions: ['Use a right triangle', 'Choose the angle first', 'Compare adjacent to hypotenuse', 'Watch the x-coordinate on the unit circle match the adjacent side'],
    hotspots: [
      ...triangleHotspots,
      {
        id: 'adjacent-side',
        label: 'Adjacent side',
        position: [-0.05, -0.65, 0],
        color: '#9333EA',
        description: 'The leg touching the chosen angle that is not the hypotenuse.',
        function: 'Its size compared with the hypotenuse is the cosine ratio.',
      },
    ],
    lesson: lesson(
      'Predict what happens to cosine when the angle opens wider.',
      'Increase the angle while keeping the hypotenuse fixed.',
      'The adjacent side shrinks, so adjacent divided by hypotenuse gets smaller.',
      'A larger angle causes the triangle to stand taller and use less horizontal adjacent length.',
    ),
    quiz: quiz('Cosine compares which sides?', 'Adjacent divided by hypotenuse.', 'Opposite divided by hypotenuse.'),
    compareCandidate: 'math-trig-tangent',
    compareReason: 'Cosine compares adjacent to hypotenuse; tangent compares opposite directly to adjacent.',
  },
  {
    id: 'math-trig-tangent',
    name: 'Tangent',
    scientificName: 'Tangent ratio',
    subject: 'math',
    branch: BRANCH,
    system: 'Triangle Ratios',
    model: '',
    visual: { shape: 'slope-rise-run', variables: ['angle', 'opposite', 'adjacent'] },
    tagline: 'Opposite over adjacent, like slope',
    summary:
      'Tangent compares the opposite side with the adjacent side. It connects trigonometry to slope: steeper angles have larger tangent values.',
    keyFacts: facts(
      'A ratio: opposite side divided by adjacent side',
      'Opening the angle increases rise compared with run',
      'The slant becomes steeper as tangent grows',
      'The tangent meter compares the green rise to the purple run, so it changes fastest near steep angles.',
    ),
    whyItMatters: 'Tangent helps describe ramps, roof pitch, hills, and sight lines using the same idea as rise over run.',
    didYouKnow: 'A 45-degree right triangle has tangent 1 because its opposite and adjacent legs match.',
    belongsTo: ['Math', 'Trigonometry Foundations', 'Slope'],
    conditions: ['Use a right triangle', 'Choose the angle first', 'Compare rise-like opposite to run-like adjacent', 'Keep the run visible so steep angles do not hide why tangent grows'],
    hotspots: [
      ...triangleHotspots,
      {
        id: 'rise-run-ratio',
        label: 'Rise/run ratio',
        position: [0.2, -0.2, 0],
        color: '#0891B2',
        description: 'Opposite over adjacent acts like rise over run.',
        function: 'Shows why a larger angle makes a steeper line.',
      },
    ],
    lesson: lesson(
      'Predict whether tangent gets larger or smaller when a ramp angle increases.',
      'Make the angle steeper while keeping the adjacent run easy to compare.',
      'The opposite rise grows compared with the run, so tangent increases.',
      'The angle causes the rise/run balance to change, which is exactly what tangent measures.',
    ),
    quiz: quiz('Tangent is most like which graph idea?', 'Slope, because both compare rise to run.', 'Intercept, because both show a starting value.'),
    compareCandidate: 'math-trig-unit-circle',
    compareReason: 'Tangent grows from side ratios; the unit circle shows angle ratios as positions around a circle.',
  },
  {
    id: 'math-trig-unit-circle',
    name: 'Unit Circle Idea',
    scientificName: 'Unit circle',
    subject: 'math',
    branch: BRANCH,
    system: 'Circular Trigonometry',
    model: '',
    visual: { shape: 'disc-torus', variables: ['angle', 'x-value', 'y-value'] },
    tagline: 'A circle where angles point to coordinates',
    summary:
      'The unit circle is a circle with radius 1. At a child-readable level, it shows that changing an angle changes a point position, and the point gives cosine as x and sine as y.',
    keyFacts: facts(
      'A radius-1 circle centered at the origin',
      'Changing the angle rotates a radius around the circle',
      'The point moves, changing its x and y coordinates',
      'The circle and right triangle stay linked: cosine is x, sine is y, and tangent is y divided by x.',
    ),
    whyItMatters: 'The unit circle connects right-triangle ratios to waves, spinning motion, and coordinates.',
    didYouKnow: 'On the unit circle, a full turn brings the point back to the same coordinate.',
    belongsTo: ['Math', 'Trigonometry Foundations', 'Circular Models'],
    conditions: ['Radius stays 1', 'Angle turns from the positive x-axis', 'Point coordinates change with the angle', 'Coordinate readouts must update when the angle changes'],
    hotspots: [
      {
        id: 'radius-one',
        label: 'Radius 1',
        position: [0.45, 0, 0],
        color: '#2563EB',
        description: 'The distance from the center to the circle is always 1.',
        function: 'Makes sine and cosine fit neatly as coordinate values.',
      },
      {
        id: 'rotating-angle',
        label: 'Rotating angle',
        position: [0.25, 0.25, 0],
        color: '#F59E0B',
        description: 'The angle turns the radius around the circle.',
        function: 'Causes the point position to change.',
      },
      {
        id: 'circle-point',
        label: 'Circle point',
        position: [0.55, 0.55, 0],
        color: '#16A34A',
        description: 'The endpoint of the radius has an x and y coordinate.',
        function: 'Lets learners observe cosine as horizontal position and sine as vertical position.',
      },
    ],
    lesson: lesson(
      'Predict what happens to the point height when the angle turns from 0 degrees toward 90 degrees.',
      'Rotate the radius upward around the unit circle.',
      'The point moves higher while its horizontal position gets smaller.',
      'The changing angle causes the coordinates to trade off: sine rises while cosine falls.',
    ),
    quiz: quiz('On a simple unit circle model, what changes when the angle changes?', 'The point position and its x and y coordinates.', 'The circle radius becomes bigger each time.'),
    compareCandidate: 'math-trig-sine',
    compareReason: 'The unit circle gives a coordinate view of the same sine ratio first seen in a right triangle.',
  },
]

export const trigonometryFoundationsById = Object.fromEntries(
  trigonometryFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
