import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'math' as const
const branch = 'Calculus Foundations'

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Graph habit', value: 'Zoom in, compare small changes, and ask what stays predictable.' },
    { label: 'Core link', value: 'Calculus connects changing rates with accumulated totals.' },
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
      options: [answer, misconception, 'Calculus only studies static labels', 'The graph color gives the answer'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is a useful way to reason about calculus visually?',
      options: ['Change one input and watch the rate or total', 'Hide the axes', 'Change every graph feature at once', 'Ignore units'],
      correctIndex: 0,
      explanation: 'One changed input makes rate and accumulation easier to connect.',
      misconception: 'Changing many features at once hides the cause.',
    },
    {
      prompt: 'Why do small intervals matter?',
      options: ['They reveal local behavior more clearly', 'They erase the function', 'They make all curves straight forever', 'They remove the need for reasoning'],
      correctIndex: 0,
      explanation: 'Zooming in helps estimate what is happening near one point.',
      misconception: 'Local estimates help reasoning, but they still depend on the function.',
    },
    {
      prompt: 'What should units tell you?',
      options: ['Whether you are measuring a rate or a total', 'Only the font size', 'Nothing in math', 'Which answer is longest'],
      correctIndex: 0,
      explanation: 'Rates and accumulated totals often have different units.',
      misconception: 'Units are evidence about what a calculation means.',
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
    model: '',
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

export const calculusFoundations: ComponentContent[] = [
  component({
    id: 'math-calc-rate-of-change',
    name: 'Rate Of Change',
    scientificName: 'Average rate of change',
    system: 'Changing Quantities',
    visualShape: 'calc-rate-curve',
    visualVariables: ['input change', 'output change', 'rate'],
    tagline: 'How fast one quantity changes with another',
    summary: 'Rate of change compares how much an output changes for a matching change in input. It is the slope idea that prepares for derivatives.',
    keyFacts: facts('Output change divided by input change', 'Changing the interval changes what behavior is averaged', 'Steeper graph sections have larger rates'),
    whyItMatters: 'Rates describe speed, growth, price changes, temperature change, and many science graphs.',
    didYouKnow: 'Speed is a rate of change: distance changes over time.',
    belongsTo: ['Math', 'Calculus Foundations', 'Rates'],
    conditions: ['Measure two quantities', 'Compare matching changes', 'Keep track of units'],
    hotspots: [
      { id: 'input-run', label: 'Input change', position: [-0.75, -0.25, 0], color: '#2563eb', description: 'The run or change in x.', function: 'Sets the interval for comparison.' },
      { id: 'output-rise', label: 'Output change', position: [0.05, 0.25, 0], color: '#16a34a', description: 'The rise or change in y.', function: 'Shows how much the output responded.' },
      { id: 'rate-line', label: 'Rate line', position: [0.8, 0.05, 0], color: '#f97316', description: 'The slope connecting the change.', function: 'Summarizes output change per input change.' },
    ],
    prediction: 'Predict whether rate of change gets larger when the graph becomes steeper.',
    change: 'Increase the output change while keeping the input change the same.',
    observe: 'Observe that the rate value increases.',
    explain: 'Rate compares output change to input change, so more rise for the same run means a larger rate.',
    quizPrompt: 'What does rate of change compare?',
    quizAnswer: 'Output change with input change.',
    quizMisconception: 'Only the graph title with the axis color.',
    compareCandidate: 'math-calc-tangent-slope',
    compareReason: 'Average rate uses an interval; tangent slope focuses on the rate at one point.',
  }),
  component({
    id: 'math-calc-tangent-slope',
    name: 'Tangent Slope',
    scientificName: 'Instantaneous rate of change',
    system: 'Local Graph Behavior',
    visualShape: 'calc-tangent-curve',
    visualVariables: ['point', 'nearby interval', 'instant rate'],
    tagline: 'A one-point slope found by zooming in',
    summary: 'Tangent slope estimates the rate of change at one point on a curve. It comes from shrinking the interval around the point.',
    keyFacts: facts('The slope of a tangent line at a point', 'Shrinking the interval focuses on local behavior', 'The slope approaches the instant rate'),
    whyItMatters: 'Tangent slope helps predict instant speed, steepness, growth rate, and changing motion.',
    didYouKnow: 'On a smooth curve, zooming in near a point can make the curve look almost like a straight line.',
    belongsTo: ['Math', 'Calculus Foundations', 'Derivatives'],
    conditions: ['Choose a point on the graph', 'Use nearby points to estimate', 'Shrink the interval carefully'],
    hotspots: [
      { id: 'target-point', label: 'Target point', position: [-0.65, 0.1, 0], color: '#2563eb', description: 'The exact graph point being studied.', function: 'Anchors the local rate question.' },
      { id: 'nearby-points', label: 'Nearby points', position: [0.05, 0.25, 0], color: '#f97316', description: 'Points close to the target point.', function: 'Help estimate what slope the curve approaches.' },
      { id: 'tangent-line', label: 'Tangent line', position: [0.85, 0, 0], color: '#16a34a', description: 'A line matching the curve direction at the point.', function: 'Represents the instantaneous rate.' },
    ],
    prediction: 'Predict what happens to the estimated slope as two points move closer together on a smooth curve.',
    change: 'Shrink the interval around one point while watching the secant line.',
    observe: 'Observe that the secant slope approaches the tangent slope.',
    explain: 'A derivative asks what rate the average rates approach as the interval becomes tiny.',
    quizPrompt: 'What does tangent slope describe?',
    quizAnswer: 'The rate of change at one point.',
    quizMisconception: 'The total area under the whole graph.',
    compareCandidate: 'math-calc-limit',
    compareReason: 'Tangent slope depends on a limit: what nearby slopes approach as the interval shrinks.',
  }),
  component({
    id: 'math-calc-area-under-curve',
    name: 'Area Under Curve',
    scientificName: 'Definite integral area model',
    system: 'Accumulated Quantities',
    visualShape: 'calc-area-curve',
    visualVariables: ['rectangle width', 'height', 'total area'],
    tagline: 'Little pieces add into a total',
    summary: 'Area under a curve can represent an accumulated total. Thin rectangles can approximate the area, and more thinner rectangles usually improve the estimate.',
    keyFacts: facts('Accumulated area between a graph and axis', 'Changing rectangle width changes approximation accuracy', 'Smaller pieces can better match a curve'),
    whyItMatters: 'Area under graphs can represent distance from speed, total rainfall from rate, or total cost from changing price.',
    didYouKnow: 'If a graph shows speed over time, area under the curve can show distance traveled.',
    belongsTo: ['Math', 'Calculus Foundations', 'Integrals'],
    conditions: ['Know what the axes measure', 'Choose an interval', 'Add many small area pieces'],
    hotspots: [
      { id: 'curve-top', label: 'Curve height', position: [-0.7, 0.35, 0], color: '#2563eb', description: 'The graph height sets each slice height.', function: 'Controls how much each small area contributes.' },
      { id: 'slice-width', label: 'Slice width', position: [0.05, -0.25, 0], color: '#f97316', description: 'The interval width of each rectangle.', function: 'Changing width changes approximation quality.' },
      { id: 'total-area', label: 'Total area', position: [0.85, 0.05, 0], color: '#16a34a', description: 'All slice areas added together.', function: 'Represents the accumulated total.' },
    ],
    prediction: 'Predict whether the area estimate improves when rectangles become narrower.',
    change: 'Replace a few wide rectangles with many narrow rectangles over the same interval.',
    observe: 'Observe that the rectangles follow the curve more closely.',
    explain: 'Adding thinner pieces reduces overcounting and undercounting for many smooth curves.',
    quizPrompt: 'What can area under a rate graph represent?',
    quizAnswer: 'An accumulated total.',
    quizMisconception: 'Only the graph color.',
    compareCandidate: 'math-calc-accumulation',
    compareReason: 'Area under a curve is a visual method for understanding accumulation.',
  }),
  component({
    id: 'math-calc-limit',
    name: 'Limit',
    scientificName: 'Limit of a function',
    system: 'Approaching Behavior',
    visualShape: 'calc-limit-hole',
    visualVariables: ['input approach', 'output approach', 'target value'],
    tagline: 'What a pattern approaches',
    summary: 'A limit describes the value a function approaches as the input gets close to a target, even when the target point itself needs special attention.',
    keyFacts: facts('The value approached by nearby inputs', 'Moving inputs closer reveals a pattern', 'The approaching value can be predicted from both sides'),
    whyItMatters: 'Limits support derivatives, integrals, and careful reasoning about curves, jumps, and tiny changes.',
    didYouKnow: 'A limit can exist even if a graph has a small hole at the exact target point.',
    belongsTo: ['Math', 'Calculus Foundations', 'Limits'],
    conditions: ['Pick a target input', 'Check nearby values', 'Compare approach from both sides when needed'],
    hotspots: [
      { id: 'left-approach', label: 'Left approach', position: [-0.8, 0.05, 0], color: '#2563eb', description: 'Inputs moving toward the target from smaller values.', function: 'Tests one side of the approaching pattern.' },
      { id: 'right-approach', label: 'Right approach', position: [0.1, 0.05, 0], color: '#f97316', description: 'Inputs moving toward the target from larger values.', function: 'Tests the other side of the approaching pattern.' },
      { id: 'target-value', label: 'Target value', position: [0.85, 0.2, 0], color: '#16a34a', description: 'The output value the graph approaches.', function: 'Summarizes the limit when both sides agree.' },
    ],
    prediction: 'Predict whether the limit exists if left and right outputs approach the same value.',
    change: 'Move input values closer to the target from both sides.',
    observe: 'Observe whether the outputs close in on one shared value.',
    explain: 'A limit is about the approached value, so matching left and right behavior supports one limit.',
    quizPrompt: 'What does a limit describe?',
    quizAnswer: 'The value a function approaches near a target input.',
    quizMisconception: 'The biggest number printed on the graph.',
    compareCandidate: 'math-calc-tangent-slope',
    compareReason: 'Tangent slope uses limits to turn nearby average rates into an instantaneous rate.',
  }),
  component({
    id: 'math-calc-accumulation',
    name: 'Accumulation',
    scientificName: 'Cumulative total',
    system: 'Totals From Change',
    visualShape: 'calc-accumulation-bars',
    visualVariables: ['rate', 'time interval', 'cumulative total'],
    tagline: 'A running total built from small changes',
    summary: 'Accumulation is the growing total made by adding changes over an interval. If the rate is higher for longer, the accumulated total grows more.',
    keyFacts: facts('A total built by adding many changes', 'Increasing rate or interval increases the total', 'The graph of the total rises according to added change'),
    whyItMatters: 'Accumulation explains savings, distance traveled, medicine dose over time, rainfall, and energy use.',
    didYouKnow: 'A car odometer is an accumulation display: it adds distance over many trips.',
    belongsTo: ['Math', 'Calculus Foundations', 'Integrals'],
    conditions: ['Track a changing amount or rate', 'Add across an interval', 'Interpret the total with units'],
    hotspots: [
      { id: 'incoming-rate', label: 'Incoming rate', position: [-0.75, 0.25, 0], color: '#2563eb', description: 'How quickly the total is being added to.', function: 'Controls how fast accumulation grows.' },
      { id: 'time-span', label: 'Interval', position: [0.05, -0.2, 0], color: '#f97316', description: 'How long the adding continues.', function: 'Longer intervals allow more total to collect.' },
      { id: 'running-total', label: 'Running total', position: [0.85, 0.15, 0], color: '#16a34a', description: 'The cumulative amount so far.', function: 'Shows the result of adding many changes.' },
    ],
    prediction: 'Predict how the accumulated total changes when the rate stays high for a longer interval.',
    change: 'Extend the time interval while keeping the rate positive.',
    observe: 'Observe that the cumulative total grows larger.',
    explain: 'Accumulation adds rate over time, so more time at a positive rate adds more total.',
    quizPrompt: 'What is accumulation?',
    quizAnswer: 'A running total built by adding changes.',
    quizMisconception: 'A single point with no history.',
    compareCandidate: 'math-calc-area-under-curve',
    compareReason: 'Area under a curve is one way to calculate or visualize accumulation.',
  }),
]

export const calculusFoundationsById = Object.fromEntries(
  calculusFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
