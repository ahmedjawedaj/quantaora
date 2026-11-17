import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const BRANCH = 'Graphs And Functions'

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Kid test', value: 'Change one number, then predict and observe how the graph moves.' },
    { label: 'Math link', value: 'Connects tables, equations, and points on a coordinate plane.' },
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
      options: [answer, misconception, 'The graph changes randomly', 'Only the label color matters'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'How do you make a fair graph prediction?',
      options: ['Change one value and watch the graph', 'Change every value at once', 'Ignore the axes', 'Erase the scale'],
      correctIndex: 0,
      explanation: 'Changing one value makes the cause and effect easier to see.',
      misconception: 'Changing many values at once hides which value caused the graph to move.',
    },
    {
      prompt: 'What should you compare when two line graphs look different?',
      options: ['Slope and intercept', 'Only the title', 'Only the color', 'The thickness of the screen'],
      correctIndex: 0,
      explanation: 'Slope controls rate of change, while intercept controls the starting value.',
      misconception: 'Colors and titles can help reading, but they do not define the function.',
    },
    {
      prompt: 'What does a point on a graph represent?',
      options: ['A matching x and y value', 'A random decoration', 'Only an x value', 'Only a y value'],
      correctIndex: 0,
      explanation: 'Each plotted point pairs one input with one output.',
      misconception: 'A graph point needs both coordinates to say where it belongs.',
    },
  ]
}

type GraphControl = {
  title: string
  x: number
  y: number
  slope: number
  intercept: number
  compareSlope?: number
  compareIntercept?: number
  scenario: string
  controlFocus: 'point' | 'slope' | 'intercept' | 'function' | 'compare'
}

function graphControl(control: GraphControl) {
  return control
}

const axesHotspots: Hotspot[] = [
  {
    id: 'x-axis',
    label: 'x-axis',
    position: [0.55, -0.45, 0],
    color: '#2563EB',
    description: 'The horizontal axis shows the input or first coordinate.',
    function: 'Lets a learner predict what changes when the input moves left or right.',
  },
  {
    id: 'y-axis',
    label: 'y-axis',
    position: [-0.55, 0.45, 0],
    color: '#16A34A',
    description: 'The vertical axis shows the output or second coordinate.',
    function: 'Shows the result after the function rule acts on the input.',
  },
]

export const graphsAndFunctions: ComponentContent[] = [
  {
    id: 'math-graphs-coordinate-plane',
    name: 'Coordinate Plane',
    scientificName: 'Cartesian coordinate plane',
    subject: 'math',
    branch: BRANCH,
    system: 'Graphing Foundations',
    model: '',
    visual: {
      shape: 'point-on-plane',
      variables: ['x-coordinate', 'y-coordinate', 'quadrant'],
      graphControl: graphControl({
        title: 'Move the point, then read its address',
        x: 2,
        y: 3,
        slope: 1,
        intercept: 1,
        scenario: 'Point address: changing x slides sideways; changing y lifts or lowers the point.',
        controlFocus: 'point',
      }),
    },
    tagline: 'Two number lines that locate every point',
    summary:
      'A coordinate plane uses an x-axis and y-axis to locate points. Change x to move sideways, change y to move up or down, and the point lands at one exact address.',
    keyFacts: facts('A flat grid built from two crossing number lines', 'The x and y coordinates choose horizontal and vertical distance', 'A point moves to a precise location on the grid'),
    whyItMatters: 'Maps, video games, robots, and graphs all need a clear way to describe where something is.',
    didYouKnow: 'The point (0, 0) is called the origin because both axes start counting from there.',
    belongsTo: ['Math', 'Graphs And Functions', 'Coordinate Geometry'],
    conditions: ['Needs labeled axes', 'Scale must stay even', 'A point needs both coordinates'],
    hotspots: [
      ...axesHotspots,
      {
        id: 'origin',
        label: 'Origin',
        position: [0, 0, 0],
        color: '#F97316',
        description: 'The place where x = 0 and y = 0.',
        function: 'Anchors the whole grid so every point can be measured from the same start.',
      },
    ],
    lesson: lesson(
      'Predict where the point goes if x increases but y stays the same.',
      'Move the point from (1, 2) to (4, 2).',
      'The point slides right while staying at the same height.',
      'The x-coordinate causes sideways motion, and the y-coordinate controls height.',
    ),
    quiz: quiz('What changes when only the x-coordinate increases?', 'The point moves to the right.', 'The point must move upward.'),
    compareCandidate: 'math-graphs-slope',
    compareReason: 'The coordinate plane supplies the grid; slope describes how a line moves across that grid.',
  },
  {
    id: 'math-graphs-slope',
    name: 'Slope',
    scientificName: 'Rate of change',
    subject: 'math',
    branch: BRANCH,
    system: 'Linear Graphs',
    model: '',
    visual: {
      shape: 'slope-rise-run',
      variables: ['rise', 'run', 'steepness'],
      graphControl: graphControl({
        title: 'Change slope to change steepness',
        x: 4,
        y: 0,
        slope: 2,
        intercept: 0,
        scenario: 'Slope is the rate: each +1 in x changes y by the slope amount.',
        controlFocus: 'slope',
      }),
    },
    tagline: 'Rise over run tells how fast a line changes',
    summary:
      'Slope measures how much y changes for each step in x. A bigger slope makes a steeper line, and a negative slope makes the line go downward as x increases.',
    keyFacts: facts('The rate of change of a line', 'Changing rise or run changes steepness', 'The line tilts more, less, or in the opposite direction'),
    whyItMatters: 'Slope helps kids read speed, price per item, savings per week, and any steady change.',
    didYouKnow: 'A flat line has slope 0 because its height does not change as x moves.',
    belongsTo: ['Math', 'Graphs And Functions', 'Linear Graphs'],
    conditions: ['Compare two points', 'Count rise and run', 'Keep the axis scale even'],
    hotspots: [
      ...axesHotspots,
      {
        id: 'rise-run-step',
        label: 'Rise/run step',
        position: [0.45, 0.35, 0],
        color: '#DC2626',
        description: 'A vertical rise paired with a horizontal run.',
        function: 'Shows the cause of steepness: more rise for the same run makes a steeper line.',
      },
    ],
    lesson: lesson(
      'Predict what happens if the rise doubles while the run stays 1.',
      'Change the slope from 1 to 2 and keep the intercept fixed.',
      'The line tilts upward more sharply from the same starting point.',
      'A larger slope causes y to grow faster for each 1-step change in x.',
    ),
    quiz: quiz('What does a larger positive slope do to a line?', 'It makes the line climb faster as x increases.', 'It moves only the starting point up.'),
    compareCandidate: 'math-graphs-intercept',
    compareReason: 'Slope controls tilt, while intercept controls where the line starts on the y-axis.',
  },
  {
    id: 'math-graphs-intercept',
    name: 'Intercept',
    scientificName: 'Axis crossing',
    subject: 'math',
    branch: BRANCH,
    system: 'Linear Graphs',
    model: '',
    visual: {
      shape: 'intercept-axes',
      variables: ['y-intercept', 'x-intercept', 'starting value'],
      graphControl: graphControl({
        title: 'Slide b to move the starting value',
        x: 3,
        y: 0,
        slope: 1,
        intercept: 2,
        scenario: 'The intercept is y when x is 0, so it moves the whole line up or down.',
        controlFocus: 'intercept',
      }),
    },
    tagline: 'Where a line crosses an axis',
    summary:
      'An intercept is where a graph crosses an axis. In y = mx + b, the y-intercept b is the starting output when x is 0.',
    keyFacts: facts('A graph crossing point on an axis', 'Changing b shifts a line up or down', 'The starting value changes while slope can stay the same'),
    whyItMatters: 'Intercepts show starting amounts like base fees, initial height, or money already saved.',
    didYouKnow: 'A taxi fare often has a y-intercept because the ride can start with a fee before any miles are driven.',
    belongsTo: ['Math', 'Graphs And Functions', 'Linear Graphs'],
    conditions: ['Look where x is 0 for the y-intercept', 'Keep scale even', 'Do not confuse starting value with rate'],
    hotspots: [
      ...axesHotspots,
      {
        id: 'y-intercept',
        label: 'y-intercept',
        position: [0, 0.42, 0],
        color: '#9333EA',
        description: 'The place where the line crosses the y-axis.',
        function: 'Shows the output before the input has increased.',
      },
    ],
    lesson: lesson(
      'Predict what happens if b changes from 1 to 4 while the slope stays the same.',
      'Slide the line upward by changing only the y-intercept.',
      'The whole line moves up but keeps the same tilt.',
      'The intercept causes the starting value to change; the unchanged slope keeps the rate the same.',
    ),
    quiz: quiz('In y = mx + b, what does b usually show?', 'The y-intercept or starting value.', 'The steepness of the line.'),
    compareCandidate: 'math-graphs-linear-function',
    compareReason: 'A linear function combines slope and intercept into one rule.',
  },
  {
    id: 'math-graphs-linear-function',
    name: 'Linear Function',
    scientificName: 'First-degree function',
    subject: 'math',
    branch: BRANCH,
    system: 'Functions',
    model: '',
    visual: {
      shape: 'line-graph-poly',
      variables: ['input', 'output', 'rule'],
      graphControl: graphControl({
        title: 'Feed x into y = mx + b',
        x: 5,
        y: 0,
        slope: 2,
        intercept: 1,
        scenario: 'A function machine takes one input and makes exactly one output.',
        controlFocus: 'function',
      }),
    },
    tagline: 'A rule that makes a straight-line graph',
    summary:
      'A linear function gives one output for each input and graphs as a straight line. The slope sets the steady change, and the intercept sets the start.',
    keyFacts: facts('A function with a constant rate of change', 'The rule uses input, slope, and intercept', 'Outputs change by equal steps, making a straight line'),
    whyItMatters: 'Linear functions model everyday steady patterns such as earning allowance each week or filling a tank at a constant rate.',
    didYouKnow: 'If equal x-steps always create equal y-steps, the pattern is a strong clue that the graph is linear.',
    belongsTo: ['Math', 'Graphs And Functions', 'Functions'],
    conditions: ['Each input has one output', 'Rate stays constant', 'Straight line on the graph'],
    hotspots: [
      {
        id: 'input-value',
        label: 'Input',
        position: [-0.8, -0.35, 0],
        color: '#2563EB',
        description: 'The x-value fed into the rule.',
        function: 'Causes the rule to produce a matching output.',
      },
      {
        id: 'output-value',
        label: 'Output',
        position: [0.65, 0.45, 0],
        color: '#16A34A',
        description: 'The y-value produced by the rule.',
        function: 'Shows the effect of the input after the linear rule is applied.',
      },
      {
        id: 'straight-line',
        label: 'Straight line',
        position: [0.2, 0.15, 0],
        color: '#F97316',
        description: 'The graph has no bends because the rate stays constant.',
        function: 'Makes prediction possible: every equal x-step changes y by the same amount.',
      },
    ],
    lesson: lesson(
      'Predict the output for x = 5 if the rule is y = 2x + 1.',
      'Increase x one step at a time and record the matching outputs.',
      'The outputs rise by 2 each time, so the plotted points stay on a straight line.',
      'The constant slope causes equal input changes to create equal output changes.',
    ),
    quiz: quiz('Why does a linear function graph as a straight line?', 'Its rate of change stays constant.', 'Its output changes randomly each time.'),
    compareCandidate: 'math-graphs-comparing-lines',
    compareReason: 'One linear function explains a single rule; comparing lines shows how two rules differ.',
  },
  {
    id: 'math-graphs-comparing-lines',
    name: 'Graph Comparison',
    scientificName: 'Comparative linear graph analysis',
    subject: 'math',
    branch: BRANCH,
    system: 'Graph Interpretation',
    model: '',
    visual: {
      shape: 'line-graph-poly',
      variables: ['two slopes', 'two intercepts', 'intersection'],
      graphControl: graphControl({
        title: 'Compare two rules on one grid',
        x: 6,
        y: 0,
        slope: 2,
        intercept: 0,
        compareSlope: 1,
        compareIntercept: 4,
        scenario: 'Two lines can start differently, grow at different rates, and cross when outputs match.',
        controlFocus: 'compare',
      }),
    },
    tagline: 'Compare starts, rates, and crossing points',
    summary:
      'Comparing line graphs means checking which one starts higher, which one changes faster, and where they meet. Change slope or intercept and the winning line can switch.',
    keyFacts: facts('Reading two or more graphs against the same axes', 'Different slopes and intercepts create different paths', 'Lines can separate, stay parallel, or cross'),
    whyItMatters: 'Graph comparison helps kids choose better deals, compare speeds, and decide when one plan catches another.',
    didYouKnow: 'Two lines with the same slope never meet if their intercepts are different; they stay parallel.',
    belongsTo: ['Math', 'Graphs And Functions', 'Graph Interpretation'],
    conditions: ['Use the same scale', 'Compare intercepts first', 'Compare slopes over the same x-step'],
    hotspots: [
      {
        id: 'line-a',
        label: 'Line A',
        position: [-0.55, 0.15, 0],
        color: '#2563EB',
        description: 'One rule with its own starting value and rate.',
        function: 'Gives a baseline for comparing another function.',
      },
      {
        id: 'line-b',
        label: 'Line B',
        position: [0.55, 0.35, 0],
        color: '#DC2626',
        description: 'A second rule drawn on the same axes.',
        function: 'Shows how a different rate or start changes the result.',
      },
      {
        id: 'intersection',
        label: 'Intersection',
        position: [0.1, 0.25, 0],
        color: '#F59E0B',
        description: 'The point where both rules give the same output.',
        function: 'Marks the moment when two changing quantities match.',
      },
    ],
    lesson: lesson(
      'Predict which line will be higher after 10 steps if one starts lower but has a bigger slope.',
      'Increase the steeper line slope while keeping both graphs on the same axes.',
      'The steeper line can catch up and cross the line that started higher.',
      'A higher slope causes faster growth, while the intercept only controls the beginning.',
    ),
    quiz: quiz('What does an intersection of two line graphs mean?', 'Both rules have the same output at that input.', 'Both lines have disappeared.'),
    compareCandidate: 'math-graphs-linear-function',
    compareReason: 'Graph comparison uses the same slope-and-intercept parts that define a single linear function.',
  },
]

export const graphsAndFunctionsById = Object.fromEntries(
  graphsAndFunctions.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
