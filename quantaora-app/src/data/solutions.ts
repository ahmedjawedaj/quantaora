import type { ComponentContent, QuizQuestion } from './types'

const authoredChemistryModel = (id: string) => `/models/chemistry/authored/${id}.glb`

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

function quiz(prompt: string, answer: string, misconception: string, extra: QuizQuestion): QuizQuestion[] {
  return [
    {
      prompt,
      options: [answer, misconception, 'The particles are destroyed', 'The container creates new atoms'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What makes a solution look evenly mixed?',
      options: ['Solute particles spread among solvent particles', 'The solute particles disappear from matter', 'The solvent freezes instantly', 'The cup becomes heavier by magic'],
      correctIndex: 0,
      explanation: 'A solution looks uniform because dissolved particles are spread throughout the solvent.',
      misconception: 'Invisible dissolved particles are still present even when you cannot see grains anymore.',
    },
    {
      prompt: 'What is a good way to test cause and effect while dissolving?',
      options: ['Change one factor, like stirring or temperature', 'Change every factor at once', 'Never compare samples', 'Only look at the label'],
      correctIndex: 0,
      explanation: 'Changing one factor at a time shows whether that factor changes dissolving speed or amount.',
      misconception: 'If you stir, heat, and add more solute all at once, the cause is unclear.',
    },
    extra,
  ]
}

export const solutions: ComponentContent[] = [
  {
    id: 'chem-solutions-solute',
    name: 'Solute',
    scientificName: 'Dissolved substance',
    subject: 'chemistry',
    branch: 'Solutions',
    system: 'Mixtures',
    model: authoredChemistryModel('chem-solutions-solute'),
    tagline: 'The substance that gets dissolved',
    summary:
      'A solute is the substance that dissolves into another material. In salt water, salt is the solute.',
    keyFacts: [
      { label: 'Role', value: 'Gets dissolved' },
      { label: 'Example', value: 'Salt in salt water' },
      { label: 'Particle action', value: 'Breaks into spread-out particles' },
      { label: 'Amount', value: 'Controls concentration with solvent volume' },
      { label: 'Visibility', value: 'May disappear from sight but not from matter' },
    ],
    whyItMatters:
      'Solutes give solutions their taste, color, medicine dose, cleaning strength, or nutrient value.',
    didYouKnow:
      'Sugar in tea is still there after it dissolves. You know because the tea tastes sweet.',
    belongsTo: ['Chemistry', 'Solutions', 'Mixtures'],
    conditions: ['Needs a compatible solvent', 'Smaller pieces dissolve faster', 'Too much solute can leave undissolved solid'],
    visual: { shape: 'particle-trio', variables: ['solute amount', 'particle size', 'spreading'] },
    hotspots: [
      {
        id: 'hs-solute-grain',
        label: 'Solute grain',
        position: [-0.9, 1.2, 0.16],
        color: '#f59e0b',
        description: 'A piece of the substance before it fully dissolves.',
        function: 'Provides particles that can spread into the solvent.',
      },
      {
        id: 'hs-separated-particles',
        label: 'Separated particles',
        position: [0.15, 1.45, 0.16],
        color: '#ef4444',
        description: 'Solute particles separate from the grain.',
        function: 'Makes the solute become evenly distributed instead of clumped.',
      },
      {
        id: 'hs-even-spread',
        label: 'Even spread',
        position: [0.95, 0.65, 0.16],
        color: '#22c55e',
        description: 'Dissolved particles spread through the whole solution.',
        function: 'Explains why each sip or drop can have the same dissolved substance.',
      },
    ],
    lesson: lesson(
      'Predict what happens to salt grains when they are stirred into water.',
      'Add a small amount of salt, then stir and watch the visible grains shrink.',
      'The grains disappear from sight as salt particles spread through the water.',
      'The solute is not destroyed. Its particles separate and become too spread out to see individually.',
    ),
    quiz: quiz(
      'What is the solute in salt water?',
      'Salt is the solute because it gets dissolved.',
      'Water is the solute because there is more of it.',
      {
        prompt: 'What happens to solute particles when dissolving works?',
        options: ['They spread through the solvent', 'They vanish from the universe', 'They all become gas', 'They turn the solvent into a solid every time'],
        correctIndex: 0,
        explanation: 'Dissolving separates and spreads solute particles among solvent particles.',
        misconception: 'Not seeing grains does not mean the solute is gone.',
      },
    ),
    compareCandidate: 'chem-solutions-solvent',
    compareReason:
      'Solute and solvent are paired roles: the solute dissolves, and the solvent does the dissolving.',
  },
  {
    id: 'chem-solutions-solvent',
    name: 'Solvent',
    scientificName: 'Dissolving medium',
    subject: 'chemistry',
    branch: 'Solutions',
    system: 'Mixtures',
    model: authoredChemistryModel('chem-solutions-solvent'),
    tagline: 'The material that does the dissolving',
    summary:
      'A solvent is the substance that dissolves the solute. Water is a common solvent because its particles can pull many solutes apart and surround them.',
    keyFacts: [
      { label: 'Role', value: 'Does the dissolving' },
      { label: 'Common example', value: 'Water' },
      { label: 'In salt water', value: 'Water is the solvent' },
      { label: 'Particle action', value: 'Surrounds solute particles' },
      { label: 'Fit matters', value: 'Not every solvent dissolves every solute' },
    ],
    whyItMatters:
      'Solvents make drinks, medicines, paints, cleaners, and body fluids able to carry dissolved materials.',
    didYouKnow:
      'Water is called the universal solvent, but it does not dissolve everything. Oil and wax mostly resist mixing with water.',
    belongsTo: ['Chemistry', 'Solutions', 'Mixtures'],
    conditions: ['Solvent particles must interact with solute', 'Temperature can affect dissolving', 'Enough solvent must be present'],
    visual: { shape: 'molecule-balls', variables: ['solvent amount', 'solute fit', 'surrounding particles'] },
    hotspots: [
      {
        id: 'hs-solvent-particles',
        label: 'Solvent particles',
        position: [-0.75, 0.9, 0.16],
        color: '#0ea5e9',
        description: 'The main liquid particles move around the solute.',
        function: 'Carry and separate dissolved solute particles.',
      },
      {
        id: 'hs-surrounding-shell',
        label: 'Surrounding shell',
        position: [0.15, 1.3, 0.16],
        color: '#22c55e',
        description: 'Solvent particles cluster around separated solute particles.',
        function: 'Keeps dissolved particles spread instead of clumping back together.',
      },
      {
        id: 'hs-solvent-volume',
        label: 'Solvent amount',
        position: [0.95, 0.55, 0.16],
        color: '#2563eb',
        description: 'More solvent can usually hold more solute before saturation.',
        function: 'Connects solution amount to concentration and saturation.',
      },
    ],
    lesson: lesson(
      'Predict whether the same spoon of sugar tastes more concentrated in a small cup or a large pitcher of water.',
      'Keep solute amount the same, then increase the amount of solvent.',
      'The larger solvent amount spreads the same solute through more liquid, making each sip less concentrated.',
      'The solvent does not just hold the solute; its amount controls how crowded the dissolved particles are.',
    ),
    quiz: quiz(
      'What is the solvent in salt water?',
      'Water is the solvent because it does the dissolving.',
      'Salt is the solvent because it changes shape.',
      {
        prompt: 'Why does solvent amount matter?',
        options: ['It changes how crowded dissolved particles are', 'It destroys all solute particles', 'It makes pH always 7', 'It stops matter from moving'],
        correctIndex: 0,
        explanation: 'The same solute amount in more solvent makes a less concentrated solution.',
        misconception: 'Adding solvent changes spacing and concentration, not the identity of the solute.',
      },
    ),
    compareCandidate: 'chem-solutions-solute',
    compareReason:
      'The solvent role only makes sense next to the solute role: one dissolves, the other is dissolved.',
  },
  {
    id: 'chem-solutions-concentration',
    name: 'Concentration',
    scientificName: 'Solute amount per solution amount',
    subject: 'chemistry',
    branch: 'Solutions',
    system: 'Mixtures',
    model: authoredChemistryModel('chem-solutions-concentration'),
    tagline: 'How crowded the dissolved particles are',
    summary:
      'Concentration compares the amount of solute to the amount of solution or solvent. More solute in the same cup means a more concentrated solution.',
    keyFacts: [
      { label: 'Means', value: 'How much solute is in a given amount' },
      { label: 'More concentrated', value: 'More solute per cup' },
      { label: 'Less concentrated', value: 'More solvent or less solute' },
      { label: 'Observed as', value: 'Stronger taste, color, or effect' },
      { label: 'Controlled by', value: 'Solute amount and solvent amount' },
    ],
    whyItMatters:
      'Concentration controls medicine doses, sports drinks, cleaning strength, pollution levels, and recipe flavor.',
    didYouKnow:
      'A tiny amount of food coloring can make a whole glass colored because the dye particles are highly visible even when dilute.',
    belongsTo: ['Chemistry', 'Solutions', 'Mixtures'],
    conditions: ['Solute must be dissolved', 'Compare equal volumes for fairness', 'Adding solvent dilutes the solution'],
    visual: { shape: 'coefficient-multiples', variables: ['solute amount', 'solvent amount', 'particle crowding'] },
    hotspots: [
      {
        id: 'hs-low-concentration',
        label: 'Dilute side',
        position: [-1.0, 0.85, 0.16],
        color: '#93c5fd',
        description: 'Fewer solute particles are spread through the same space.',
        function: 'Represents a weaker or more dilute solution.',
      },
      {
        id: 'hs-high-concentration',
        label: 'Concentrated side',
        position: [0.25, 1.25, 0.16],
        color: '#ef4444',
        description: 'More solute particles crowd the same amount of solvent.',
        function: 'Represents a stronger solution.',
      },
      {
        id: 'hs-dilution-arrow',
        label: 'Dilution',
        position: [1.05, 0.65, 0.16],
        color: '#22c55e',
        description: 'Adding solvent spreads the same solute through more liquid.',
        function: 'Shows how concentration can decrease without removing solute.',
      },
    ],
    lesson: lesson(
      'Predict which cup tastes sweeter: one sugar cube in a small cup or one sugar cube in a large cup.',
      'Keep sugar the same, then change the water amount.',
      'The small cup is more concentrated because the same solute is packed into less solvent.',
      'Concentration is a ratio idea: solute amount must be judged together with solution amount.',
    ),
    quiz: quiz(
      'What makes a solution more concentrated?',
      'More solute in the same amount of solution.',
      'Less solute in more solvent.',
      {
        prompt: 'What is dilution?',
        options: ['Adding solvent to lower concentration', 'Adding solute to raise concentration', 'Freezing every particle', 'Turning a mixture into an element'],
        correctIndex: 0,
        explanation: 'Dilution spreads the same solute through more solvent, so each equal volume has less solute.',
        misconception: 'Dilution does not destroy solute; it spreads it out.',
      },
    ),
    compareCandidate: 'chem-solutions-saturation',
    compareReason:
      'Concentration asks how crowded dissolved particles are; saturation asks whether the solvent can hold any more.',
  },
  {
    id: 'chem-solutions-saturation',
    name: 'Saturation',
    scientificName: 'Maximum dissolved solute at given conditions',
    subject: 'chemistry',
    branch: 'Solutions',
    system: 'Mixtures',
    model: authoredChemistryModel('chem-solutions-saturation'),
    tagline: 'When the solvent cannot hold more solute',
    summary:
      'A saturated solution has dissolved as much solute as it can under the current conditions. Extra solute stays undissolved.',
    keyFacts: [
      { label: 'Means', value: 'No more solute dissolves at those conditions' },
      { label: 'Evidence', value: 'Extra solid remains at the bottom' },
      { label: 'Depends on', value: 'Temperature, solvent, solute type, amount of solvent' },
      { label: 'Unsaturated', value: 'Can still dissolve more solute' },
      { label: 'Change it', value: 'Heating often lets more solid dissolve' },
    ],
    whyItMatters:
      'Saturation explains rock candy crystals, salty seas, medicine limits, and why some powders stop dissolving no matter how long you stir.',
    didYouKnow:
      'Rock candy grows when a hot saturated sugar solution cools and can no longer keep all that sugar dissolved.',
    belongsTo: ['Chemistry', 'Solutions', 'Mixtures'],
    conditions: ['Enough solute added', 'Temperature held steady', 'Extra solute remains when limit is reached'],
    visual: { shape: 'product-vial', variables: ['solute limit', 'temperature', 'undissolved solid'] },
    hotspots: [
      {
        id: 'hs-dissolved-limit',
        label: 'Dissolved limit',
        position: [-0.45, 1.2, 0.16],
        color: '#0ea5e9',
        description: 'The solvent has surrounded as many solute particles as it can.',
        function: 'Marks the saturation point for these conditions.',
      },
      {
        id: 'hs-extra-solid',
        label: 'Extra solid',
        position: [0.15, 0.45, 0.16],
        color: '#f59e0b',
        description: 'Undissolved solute remains after the solution is saturated.',
        function: 'Provides visible evidence that no more is dissolving right now.',
      },
      {
        id: 'hs-temperature-effect',
        label: 'Temperature effect',
        position: [0.95, 1.35, 0.16],
        color: '#ef4444',
        description: 'Changing temperature can change how much solute the solvent can hold.',
        function: 'Shows why saturation is tied to conditions, not just the names of the substances.',
      },
    ],
    lesson: lesson(
      'Predict what happens if you keep adding sugar after no more seems to dissolve.',
      'Add solute one spoon at a time and stir after each spoon.',
      'At first the solute disappears; later, extra grains remain even after stirring.',
      'Once the solution is saturated, solvent particles cannot keep more solute separated under those conditions.',
    ),
    quiz: quiz(
      'What is a saturated solution?',
      'A solution that cannot dissolve more solute under the current conditions.',
      'A solution with no solute at all.',
      {
        prompt: 'What evidence can show saturation?',
        options: ['Extra solid remains undissolved', 'The container becomes invisible', 'The solvent turns into a new element', 'All particles stop moving'],
        correctIndex: 0,
        explanation: 'Undissolved solid can show that the solvent has reached its dissolving limit.',
        misconception: 'More stirring cannot always overcome saturation if the conditions stay the same.',
      },
    ),
    compareCandidate: 'chem-solutions-concentration',
    compareReason:
      'A solution can be concentrated without being saturated, so comparing these ideas prevents a common mix-up.',
  },
  {
    id: 'chem-solutions-dissolving-mixing',
    name: 'Dissolving And Mixing',
    scientificName: 'Solution formation',
    subject: 'chemistry',
    branch: 'Solutions',
    system: 'Mixtures',
    model: authoredChemistryModel('chem-solutions-dissolving-mixing'),
    tagline: 'Stirring spreads particles, dissolving separates them',
    summary:
      'Mixing moves materials together, while dissolving separates solute particles and spreads them evenly among solvent particles.',
    keyFacts: [
      { label: 'Mixing', value: 'Moves materials together' },
      { label: 'Dissolving', value: 'Separates solute particles into solvent' },
      { label: 'Stirring', value: 'Usually speeds dissolving' },
      { label: 'Temperature', value: 'Often changes dissolving speed and amount' },
      { label: 'Not always solution', value: 'Sand in water mixes but does not dissolve well' },
    ],
    whyItMatters:
      'Knowing the difference helps with cooking, medicines, cleaning, environmental tests, and choosing how to separate mixtures.',
    didYouKnow:
      'Stirring does not make salt chemically react with water. It just brings fresh water particles to the salt surface faster.',
    belongsTo: ['Chemistry', 'Solutions', 'Mixtures'],
    conditions: ['Solute and solvent must be compatible', 'Stirring increases contact', 'Particle size and temperature affect speed'],
    visual: { shape: 'reaction-flow', variables: ['stirring speed', 'particle size', 'dissolving speed'] },
    hotspots: [
      {
        id: 'hs-stirring-path',
        label: 'Stirring path',
        position: [-0.8, 1.15, 0.16],
        color: '#f97316',
        description: 'Stirring moves fresh solvent past the solute surface.',
        function: 'Speeds dissolving by increasing contact between particles.',
      },
      {
        id: 'hs-dissolving-front',
        label: 'Dissolving front',
        position: [0.1, 0.75, 0.16],
        color: '#06b6d4',
        description: 'Solute particles leave the solid and enter the solvent.',
        function: 'Turns visible grains into spread-out dissolved particles.',
      },
      {
        id: 'hs-undissolved-mixture',
        label: 'Undissolved mix',
        position: [0.95, 0.45, 0.16],
        color: '#64748b',
        description: 'Some materials mix with water but do not dissolve into it.',
        function: 'Shows why mixing and dissolving are related but not identical.',
      },
    ],
    lesson: lesson(
      'Predict whether crushed sugar or a sugar cube dissolves faster in the same water.',
      'Compare a large piece with crushed pieces while keeping water amount and temperature the same.',
      'The smaller pieces dissolve faster because more solute surface touches the solvent.',
      'Dissolving depends on particle contact. Stirring, warmth, and smaller pieces can speed the process without changing the solute identity.',
    ),
    quiz: quiz(
      'How is dissolving different from simple mixing?',
      'Dissolving separates solute particles and spreads them through the solvent.',
      'Dissolving always creates a brand-new substance.',
      {
        prompt: 'Why does crushing a sugar cube usually make it dissolve faster?',
        options: ['More surface touches the solvent', 'The sugar becomes water', 'The solvent disappears', 'The particles stop moving'],
        correctIndex: 0,
        explanation: 'Smaller pieces expose more surface area, so solvent particles can pull solute particles away faster.',
        misconception: 'Crushing changes size, not the chemical identity of sugar.',
      },
    ),
    compareCandidate: 'chem-solutions-saturation',
    compareReason:
      'Dissolving/mixing explains how particles enter solution; saturation explains why that process can stop.',
  },
]

export const solutionsById: Record<string, ComponentContent> = Object.fromEntries(
  solutions.map((component) => [component.id, component]),
)
