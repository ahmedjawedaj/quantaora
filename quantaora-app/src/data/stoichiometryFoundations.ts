import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'chemistry' as const
const branch = 'Stoichiometry Foundations'
const authoredChemistryModel = (id: string) => `/models/chemistry/authored/${id}.glb`

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Think like a chemist', value: 'Change one amount, then predict what amount or product must change.' },
    { label: 'Conservation link', value: 'Atoms are counted and rearranged, not created from nothing.' },
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
      options: [answer, misconception, 'The reaction ignores particle count', 'Only the color of the model matters'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is the fairest way to test a stoichiometry prediction?',
      options: ['Change one reactant amount and track the atom count', 'Change every reactant and product at once', 'Ignore the balanced equation', 'Round all masses to the same number'],
      correctIndex: 0,
      explanation: 'Changing one amount makes the cause-and-effect count visible.',
      misconception: 'Changing many numbers at once hides which amount controlled the result.',
    },
    {
      prompt: 'Why does a balanced equation matter?',
      options: ['It gives the particle ratio for the reaction', 'It makes atoms disappear safely', 'It replaces measurement', 'It only decorates the page'],
      correctIndex: 0,
      explanation: 'The coefficients show how many particles or moles react together.',
      misconception: 'Balancing is not decoration; it is the count map for the reaction.',
    },
    {
      prompt: 'What should you check before claiming a product amount?',
      options: ['Whether a reactant runs out first', 'Only the product name', 'Only the container size', 'Whether the equation has long words'],
      correctIndex: 0,
      explanation: 'A limiting reactant can stop the reaction before the other reactants are used.',
      misconception: 'Extra reactant does not force extra product after another required reactant is gone.',
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
    model: authoredChemistryModel(input.id),
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

export const stoichiometryFoundations: ComponentContent[] = [
  component({
    id: 'chem-stoich-mole',
    name: 'Mole',
    scientificName: 'Amount of substance',
    system: 'Counting Particles',
    visualShape: 'coefficient-multiples',
    visualVariables: ['moles', 'particles', 'sample size'],
    tagline: 'A chemist dozen, but much larger',
    summary: 'A mole is a counting unit for atoms, molecules, or ions. One mole means the same huge number of particles no matter which substance is counted.',
    keyFacts: facts('A unit for counting tiny particles', 'Changing moles changes particle count', 'Twice as many moles means twice as many particles'),
    whyItMatters: 'The mole lets chemists connect invisible particles to amounts they can measure in a lab.',
    didYouKnow: 'A mole is about 602 sextillion particles, which is why chemists need the unit instead of counting one particle at a time.',
    belongsTo: ['Chemistry', 'Stoichiometry Foundations', 'Counting Particles'],
    conditions: ['Identify the particle type', 'Use a particle-to-mole conversion', 'Keep units attached to every number'],
    hotspots: [
      { id: 'particle-count', label: 'Particle count', position: [-0.8, 0.25, 0], color: '#2563eb', description: 'The invisible atoms, molecules, or ions being counted.', function: 'Shows what a mole is counting.' },
      { id: 'mole-stack', label: 'Mole amount', position: [0, 0.45, 0], color: '#f97316', description: 'A counted bundle of particles.', function: 'Connects a number of particles to a lab-scale amount.' },
      { id: 'double-amount', label: 'Double amount', position: [0.8, 0.1, 0], color: '#16a34a', description: 'Two equal mole bundles have twice the particles.', function: 'Makes proportional thinking visible.' },
    ],
    prediction: 'Predict what happens to particle count when the mole amount doubles.',
    change: 'Change the sample from 1 mole to 2 moles while keeping the substance the same.',
    observe: 'Observe that the particle count doubles too.',
    explain: 'A mole is a counting unit, so changing moles causes a proportional change in particles.',
    quizPrompt: 'What does a mole count?',
    quizAnswer: 'A fixed huge number of particles such as atoms or molecules.',
    quizMisconception: 'Only the mass of one single atom.',
    compareCandidate: 'chem-stoich-molar-mass',
    compareReason: 'The mole counts particles; molar mass connects that count to a measurable mass.',
  }),
  component({
    id: 'chem-stoich-molar-mass',
    name: 'Molar Mass',
    scientificName: 'Mass per mole',
    system: 'Mass Conversion',
    visualShape: 'mass-balance',
    visualVariables: ['grams', 'moles', 'formula mass'],
    tagline: 'The bridge from grams to moles',
    summary: 'Molar mass tells how many grams one mole of a substance has. It turns a scale reading into a mole amount that can be used in a balanced equation.',
    keyFacts: facts('The mass of one mole of a substance', 'Heavier formulas have larger molar masses', 'The same gram sample gives fewer moles when molar mass is larger'),
    whyItMatters: 'Molar mass is how a real balance measurement enters particle-count calculations.',
    didYouKnow: 'Water has a molar mass of about 18 grams per mole because two hydrogens and one oxygen add together.',
    belongsTo: ['Chemistry', 'Stoichiometry Foundations', 'Mass Conversion'],
    conditions: ['Know the chemical formula', 'Add atomic masses correctly', 'Divide grams by grams per mole to find moles'],
    hotspots: [
      { id: 'scale-pan', label: 'Gram mass', position: [-0.75, -0.1, 0], color: '#64748b', description: 'The amount measured on a balance.', function: 'Starts the conversion from lab measurement to mole count.' },
      { id: 'formula-mass', label: 'Formula mass', position: [0.05, 0.35, 0], color: '#7c3aed', description: 'The mass contribution from each atom in the formula.', function: 'Determines grams per mole.' },
      { id: 'mole-result', label: 'Mole result', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The calculated amount in moles.', function: 'Lets the sample be compared with equation ratios.' },
    ],
    prediction: 'Predict whether 18 grams of water or 18 grams of carbon dioxide contains more moles.',
    change: 'Change the substance while keeping the gram mass the same.',
    observe: 'Observe that the substance with the smaller molar mass gives more moles.',
    explain: 'Molar mass is grams per mole, so a fixed mass contains fewer moles when each mole is heavier.',
    quizPrompt: 'What does molar mass connect?',
    quizAnswer: 'Grams and moles for a specific substance.',
    quizMisconception: 'The color of a chemical to its smell.',
    compareCandidate: 'chem-stoich-mole',
    compareReason: 'Molar mass uses the mole as the counted amount and adds the measurable mass side.',
  }),
  component({
    id: 'chem-stoich-balanced-ratio',
    name: 'Balanced Equation Ratio',
    scientificName: 'Stoichiometric coefficient ratio',
    system: 'Reaction Ratios',
    visualShape: 'equation-balance',
    visualVariables: ['coefficients', 'reactant moles', 'product moles'],
    tagline: 'Coefficients tell the recipe of a reaction',
    summary: 'A balanced equation ratio uses coefficients to show how many particles or moles of each substance react or form together.',
    keyFacts: facts('A mole-to-mole ratio from balanced coefficients', 'Changing a coefficient changes the recipe count', 'Product predictions follow the same ratio'),
    whyItMatters: 'Balanced ratios help labs plan how much reactant to use and estimate how much product should form.',
    didYouKnow: 'The small numbers inside formulas are not adjusted during balancing; coefficients in front of formulas do the counting.',
    belongsTo: ['Chemistry', 'Stoichiometry Foundations', 'Reaction Ratios'],
    conditions: ['Equation must be balanced', 'Use coefficients as mole ratios', 'Keep formulas unchanged while balancing'],
    hotspots: [
      { id: 'reactant-coefficient', label: 'Reactant coefficient', position: [-0.85, 0.2, 0], color: '#2563eb', description: 'The front number for a reactant.', function: 'Tells how many moles of that reactant are needed.' },
      { id: 'arrow-ratio', label: 'Reaction arrow', position: [0, 0.15, 0], color: '#f97316', description: 'The arrow connects reactant counts to product counts.', function: 'Shows that atoms rearrange according to the ratio.' },
      { id: 'product-coefficient', label: 'Product coefficient', position: [0.85, 0.2, 0], color: '#16a34a', description: 'The front number for a product.', function: 'Tells how many moles of product can form in the recipe.' },
    ],
    prediction: 'Predict how many moles of product form if every coefficient amount is doubled.',
    change: 'Double the reactant moles while keeping the balanced ratio the same.',
    observe: 'Observe that the product moles double in the same ratio.',
    explain: 'The balanced equation is a recipe: multiplying the whole recipe keeps atom conservation true.',
    quizPrompt: 'Where does the mole ratio come from?',
    quizAnswer: 'The coefficients in a balanced equation.',
    quizMisconception: 'The alphabet order of the element symbols.',
    compareCandidate: 'chem-stoich-limiting-reactant',
    compareReason: 'Balanced ratios show the ideal recipe; the limiting reactant shows which ingredient runs out first.',
  }),
  component({
    id: 'chem-stoich-limiting-reactant',
    name: 'Limiting Reactant',
    scientificName: 'Limiting reagent',
    system: 'Reaction Completion',
    visualShape: 'reactant-vial',
    visualVariables: ['reactant A', 'reactant B', 'leftover excess'],
    tagline: 'The reactant that runs out first',
    summary: 'The limiting reactant is used up first and stops a reaction. Extra amounts of other reactants remain unused once the limiting reactant is gone.',
    keyFacts: facts('The reactant that caps product formation', 'Too little of one reactant stops the recipe early', 'Product amount depends on the limiting reactant'),
    whyItMatters: 'Finding the limiting reactant prevents waste and explains why extra material does not always make extra product.',
    didYouKnow: 'Making sandwiches is a limiting-reactant model: extra cheese cannot make more sandwiches after the bread runs out.',
    belongsTo: ['Chemistry', 'Stoichiometry Foundations', 'Reaction Completion'],
    conditions: ['Know starting moles of each reactant', 'Compare each amount to the balanced ratio', 'Identify leftover excess reactant'],
    hotspots: [
      { id: 'small-reactant', label: 'Runs out', position: [-0.7, 0.25, 0], color: '#dc2626', description: 'The reactant with too little amount for the recipe.', function: 'Limits how far the reaction can continue.' },
      { id: 'excess-reactant', label: 'Left over', position: [0.15, 0.25, 0], color: '#2563eb', description: 'A reactant still present after the reaction stops.', function: 'Shows that extra supply is not always useful.' },
      { id: 'product-cap', label: 'Product cap', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The maximum product set by the limiting reactant.', function: 'Connects the shortage to the final product amount.' },
    ],
    prediction: 'Predict which reactant will run out first when one amount is below the balanced ratio.',
    change: 'Decrease reactant A while keeping reactant B the same.',
    observe: 'Observe that product formation stops when reactant A is used up, with some B left over.',
    explain: 'A reaction needs the balanced ratio. When one required reactant is gone, the recipe cannot continue.',
    quizPrompt: 'What does the limiting reactant decide?',
    quizAnswer: 'The maximum amount of product that can form.',
    quizMisconception: 'Which container looks the biggest.',
    compareCandidate: 'chem-stoich-yield',
    compareReason: 'The limiting reactant predicts the theoretical maximum; yield compares that prediction with what is actually collected.',
  }),
  component({
    id: 'chem-stoich-yield',
    name: 'Reaction Yield',
    scientificName: 'Theoretical and percent yield',
    system: 'Product Measurement',
    visualShape: 'product-vial',
    visualVariables: ['theoretical yield', 'actual yield', 'percent yield'],
    tagline: 'Predicted product compared with collected product',
    summary: 'Yield compares how much product a reaction should make with how much is actually collected. Percent yield shows the actual amount as a fraction of the theoretical amount.',
    keyFacts: facts('A comparison between predicted and actual product', 'Losses and side reactions can lower actual yield', 'Percent yield shows how close the experiment came to the prediction'),
    whyItMatters: 'Yield helps chemists improve recipes for medicine, materials, food chemistry, and cleaner manufacturing.',
    didYouKnow: 'A perfect 100 percent yield is rare in real labs because transfers, impurities, and side reactions can reduce collected product.',
    belongsTo: ['Chemistry', 'Stoichiometry Foundations', 'Product Measurement'],
    conditions: ['Calculate theoretical yield first', 'Measure actual collected product', 'Compare using actual divided by theoretical'],
    hotspots: [
      { id: 'theoretical-fill', label: 'Predicted fill', position: [-0.7, 0.25, 0], color: '#2563eb', description: 'The product amount predicted from stoichiometry.', function: 'Sets the maximum comparison target.' },
      { id: 'actual-fill', label: 'Actual fill', position: [0.05, 0.1, 0], color: '#f97316', description: 'The amount collected after the reaction.', function: 'Records the real experiment result.' },
      { id: 'percent-label', label: 'Percent yield', position: [0.82, -0.05, 0], color: '#16a34a', description: 'Actual yield divided by theoretical yield, shown as a percent.', function: 'Makes the gap between prediction and result easy to compare.' },
    ],
    prediction: 'Predict whether percent yield rises or falls when actual product is lost during transfer.',
    change: 'Lower the collected actual yield while keeping the theoretical yield the same.',
    observe: 'Observe that percent yield decreases.',
    explain: 'Percent yield depends on actual divided by theoretical, so losing product makes the fraction smaller.',
    quizPrompt: 'What does percent yield compare?',
    quizAnswer: 'Actual product collected with theoretical product predicted.',
    quizMisconception: 'The temperature with the color of the liquid.',
    compareCandidate: 'chem-stoich-limiting-reactant',
    compareReason: 'Limiting reactant sets the theoretical product; yield evaluates the real product against that limit.',
  }),
]

export const stoichiometryFoundationsById = Object.fromEntries(
  stoichiometryFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
