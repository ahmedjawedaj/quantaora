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
      options: [answer, misconception, 'It means the sample is pure water every time', 'It means particles stop moving'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'Why should acids and bases be tested carefully?',
      options: ['Strong samples can irritate or damage materials', 'They are always safe to taste', 'They have no effect on anything', 'They only exist in space'],
      correctIndex: 0,
      explanation: 'Some acids and bases are gentle, but strong ones can react with skin, eyes, metals, or fabrics.',
      misconception: 'Everyday examples like lemon juice or soap do not mean every acid or base is safe.',
    },
    {
      prompt: 'What is the best lab habit for comparing samples?',
      options: ['Change one sample or amount at a time', 'Mix everything first', 'Ignore color changes', 'Use no labels'],
      correctIndex: 0,
      explanation: 'One change at a time makes the cause of a pH or color change clear.',
      misconception: 'Changing many things at once makes the result hard to explain.',
    },
    extra,
  ]
}

export const acidsAndBases: ComponentContent[] = [
  {
    id: 'chem-acids-ph-scale',
    name: 'pH Scale',
    scientificName: 'Potential of hydrogen scale',
    subject: 'chemistry',
    branch: 'Acids And Bases',
    system: 'pH And Ions',
    model: authoredChemistryModel('chem-acids-ph-scale'),
    tagline: 'A number line for acid, neutral, and base',
    summary:
      'The pH scale compares how acidic or basic a solution is. Low pH means more acidic, pH 7 is neutral, and high pH means more basic.',
    keyFacts: [
      { label: 'Acid range', value: 'Below 7' },
      { label: 'Neutral', value: '7 for pure water at room temperature' },
      { label: 'Base range', value: 'Above 7' },
      { label: 'Scale type', value: 'Logarithmic: one pH step is a big change' },
      { label: 'Tracks', value: 'Hydrogen ion concentration' },
    ],
    whyItMatters:
      'pH helps people check pools, soil, food, medicine, cleaning products, and safe water conditions.',
    didYouKnow:
      'A drink at pH 3 is about ten times more acidic than a drink at pH 4, not just one tiny step lower.',
    belongsTo: ['Chemistry', 'Acids And Bases', 'pH And Ions'],
    conditions: ['Dissolved in water', 'Measured with indicator or meter', 'Temperature can slightly affect readings'],
    visual: { shape: 'period-row', variables: ['pH value', 'acid side', 'base side'] },
    hotspots: [
      {
        id: 'hs-acid-side',
        label: 'Acid side',
        position: [-1.1, 1.05, 0.14],
        color: '#ef4444',
        description: 'Low pH values show acidic solutions.',
        function: 'Marks samples with more hydrogen ions than neutral water.',
      },
      {
        id: 'hs-neutral-middle',
        label: 'Neutral 7',
        position: [0, 1.05, 0.14],
        color: '#22c55e',
        description: 'Pure water is near pH 7 at room temperature.',
        function: 'Separates acidic samples from basic samples on the scale.',
      },
      {
        id: 'hs-base-side',
        label: 'Base side',
        position: [1.1, 1.05, 0.14],
        color: '#2563eb',
        description: 'High pH values show basic solutions.',
        function: 'Marks samples with fewer hydrogen ions than neutral water.',
      },
    ],
    lesson: lesson(
      'Predict whether lemon juice belongs below 7, at 7, or above 7 on the pH scale.',
      'Place lemon juice, water, and soap solution on the pH row from low to high.',
      'Lemon juice lands on the acid side, water near neutral, and soap on the base side.',
      'The pH number summarizes ion balance: more hydrogen ions reads acidic, while basic solutions read higher.',
    ),
    quiz: quiz(
      'What does a pH below 7 usually mean?',
      'The solution is acidic.',
      'The solution is basic.',
      {
        prompt: 'Where is neutral water on the pH scale at room temperature?',
        options: ['About 7', 'Always 0', 'Always 14', 'Only below 3'],
        correctIndex: 0,
        explanation: 'Pure water is close to pH 7 at room temperature.',
        misconception: 'Neutral is the middle of the common pH scale, not the lowest or highest end.',
      },
    ),
    compareCandidate: 'chem-acids-indicator',
    compareReason:
      'The pH scale is the measurement idea; an indicator is one tool that reveals where a sample sits on that scale.',
  },
  {
    id: 'chem-acids-acid',
    name: 'Acid',
    scientificName: 'Hydrogen-ion donating solution',
    subject: 'chemistry',
    branch: 'Acids And Bases',
    system: 'pH And Ions',
    model: authoredChemistryModel('chem-acids-acid'),
    tagline: 'A solution with extra hydrogen-ion behavior',
    summary:
      'An acid is a substance that increases hydrogen ions in water. Many acids taste sour in foods, react with some metals, and turn many indicators warm colors.',
    keyFacts: [
      { label: 'pH', value: 'Usually below 7' },
      { label: 'Ion clue', value: 'Increases H+ in water' },
      { label: 'Everyday examples', value: 'Lemon juice, vinegar, stomach acid' },
      { label: 'Indicator clue', value: 'Often red, pink, or orange depending on indicator' },
      { label: 'Safety', value: 'Strength matters: some acids are mild, some are dangerous' },
    ],
    whyItMatters:
      'Acids help digest food, preserve flavors, clean minerals, and run batteries, but strong acids require careful handling.',
    didYouKnow:
      'Your stomach uses hydrochloric acid to help break down food, while a protective mucus layer helps keep the stomach wall safe.',
    belongsTo: ['Chemistry', 'Acids And Bases', 'pH And Ions'],
    conditions: ['Dissolves in water', 'Concentration affects strength', 'Can be neutralized by a base'],
    visual: { shape: 'electron-transfer', variables: ['hydrogen ions', 'acid concentration', 'indicator color'] },
    hotspots: [
      {
        id: 'hs-hydrogen-ion',
        label: 'H+ behavior',
        position: [-0.85, 1.3, 0.16],
        color: '#ef4444',
        description: 'Acids increase hydrogen-ion activity in water.',
        function: 'Drives low pH readings and many acid reactions.',
      },
      {
        id: 'hs-acid-particles',
        label: 'Acid particles',
        position: [0.15, 0.9, 0.16],
        color: '#f97316',
        description: 'Dissolved acid particles interact with water.',
        function: 'Creates the ion pattern measured by pH and indicators.',
      },
      {
        id: 'hs-reactive-surface',
        label: 'Reactive surface',
        position: [0.95, 0.55, 0.16],
        color: '#64748b',
        description: 'Some acids react with metals, minerals, or bases.',
        function: 'Shows why acid strength and material choice matter for safety.',
      },
    ],
    lesson: lesson(
      'Predict what happens to pH when more vinegar is added to water.',
      'Add a small amount of acid to water, then add a little more acid.',
      'The pH moves lower as the acid concentration increases.',
      'More acid particles increase hydrogen-ion activity, so the solution reads more acidic.',
    ),
    quiz: quiz(
      'What is one ion clue for an acid in water?',
      'It increases hydrogen-ion activity.',
      'It always removes all water particles.',
      {
        prompt: 'Which everyday sample is acidic?',
        options: ['Vinegar', 'Baking soda solution', 'Soap solution', 'Oven cleaner'],
        correctIndex: 0,
        explanation: 'Vinegar contains acetic acid, so it has a pH below 7.',
        misconception: 'Not every clear household liquid is neutral or safe; pH depends on dissolved particles.',
      },
    ),
    compareCandidate: 'chem-acids-base',
    compareReason:
      'Acids and bases are opposites on the pH scale and can react together in neutralization.',
  },
  {
    id: 'chem-acids-base',
    name: 'Base',
    scientificName: 'Hydroxide-ion accepting or producing solution',
    subject: 'chemistry',
    branch: 'Acids And Bases',
    system: 'pH And Ions',
    model: authoredChemistryModel('chem-acids-base'),
    tagline: 'A solution that pushes pH above neutral',
    summary:
      'A base is a substance that lowers hydrogen-ion activity in water, often by producing hydroxide ions or accepting hydrogen ions.',
    keyFacts: [
      { label: 'pH', value: 'Usually above 7' },
      { label: 'Ion clue', value: 'Often involves OH- or accepts H+' },
      { label: 'Everyday examples', value: 'Baking soda solution, soap, many cleaners' },
      { label: 'Feel', value: 'Slippery when dilute, but never test by touch' },
      { label: 'Safety', value: 'Strong bases can burn skin and eyes' },
    ],
    whyItMatters:
      'Bases help clean grease, bake foods, treat acid spills carefully, and control pH in pools and soil.',
    didYouKnow:
      'Soap feels slippery because basic particles and soap molecules interact with oils on skin and surfaces.',
    belongsTo: ['Chemistry', 'Acids And Bases', 'pH And Ions'],
    conditions: ['Dissolves or reacts in water', 'Concentration affects strength', 'Can be neutralized by an acid'],
    visual: { shape: 'ionic-transfer', variables: ['hydroxide ions', 'base concentration', 'pH value'] },
    hotspots: [
      {
        id: 'hs-hydroxide',
        label: 'OH- behavior',
        position: [-0.85, 0.75, 0.16],
        color: '#2563eb',
        description: 'Many bases add hydroxide ions or remove hydrogen ions from water.',
        function: 'Pushes the pH reading above neutral.',
      },
      {
        id: 'hs-base-particles',
        label: 'Base particles',
        position: [0.15, 1.2, 0.16],
        color: '#06b6d4',
        description: 'Dissolved base particles change the ion balance.',
        function: 'Creates the basic behavior detected by pH tests.',
      },
      {
        id: 'hs-grease-cleaning',
        label: 'Cleaning action',
        position: [0.95, 0.55, 0.16],
        color: '#22c55e',
        description: 'Basic cleaners can react with or loosen greasy materials.',
        function: 'Connects base chemistry to soaps and cleaning products.',
      },
    ],
    lesson: lesson(
      'Predict what happens to pH when baking soda solution is added to neutral water.',
      'Add a small amount of base, then compare the new pH with neutral water.',
      'The pH moves above 7 as the solution becomes more basic.',
      'Bases reduce hydrogen-ion activity or add hydroxide-ion behavior, which shifts pH upward.',
    ),
    quiz: quiz(
      'What does a pH above 7 usually mean?',
      'The solution is basic.',
      'The solution is acidic.',
      {
        prompt: 'Which sample is usually basic?',
        options: ['Soap solution', 'Lemon juice', 'Vinegar', 'Orange juice'],
        correctIndex: 0,
        explanation: 'Soap solutions are usually basic, while lemon juice, vinegar, and orange juice are acidic.',
        misconception: 'A familiar household material can still have a pH far from neutral.',
      },
    ),
    compareCandidate: 'chem-acids-acid',
    compareReason:
      'Bases and acids show opposite ion behavior, and comparing them makes pH direction easier to remember.',
  },
  {
    id: 'chem-acids-indicator',
    name: 'Indicator',
    scientificName: 'Acid-base color indicator',
    subject: 'chemistry',
    branch: 'Acids And Bases',
    system: 'pH Testing',
    model: authoredChemistryModel('chem-acids-indicator'),
    tagline: 'A color clue for pH',
    summary:
      'An indicator is a dye or paper strip that changes color depending on whether a solution is acidic, neutral, or basic.',
    keyFacts: [
      { label: 'Purpose', value: 'Shows pH range with color' },
      { label: 'Examples', value: 'Litmus, universal indicator, red cabbage juice' },
      { label: 'Acid clue', value: 'Often red or pink' },
      { label: 'Base clue', value: 'Often blue, green, or purple' },
      { label: 'Limit', value: 'Color estimates pH; meters give numbers' },
    ],
    whyItMatters:
      'Indicators let students and scientists test pH quickly without tasting or touching unknown solutions.',
    didYouKnow:
      'Red cabbage juice works as a kitchen indicator because its plant pigments change shape in acids and bases.',
    belongsTo: ['Chemistry', 'Acids And Bases', 'pH Testing'],
    conditions: ['Needs a small sample', 'Color must be compared to a chart', 'Very dark samples can hide the color'],
    visual: { shape: 'product-vial', variables: ['sample pH', 'indicator color', 'color chart'] },
    hotspots: [
      {
        id: 'hs-color-drop',
        label: 'Indicator drop',
        position: [-0.45, 1.35, 0.16],
        color: '#a855f7',
        description: 'A tiny amount of indicator is added to the sample.',
        function: 'Reacts to ion balance by changing color.',
      },
      {
        id: 'hs-sample',
        label: 'Sample',
        position: [0, 0.75, 0.16],
        color: '#0ea5e9',
        description: 'The solution being tested may be acid, neutral, or base.',
        function: 'Provides the pH condition the indicator responds to.',
      },
      {
        id: 'hs-color-chart',
        label: 'Color chart',
        position: [0.9, 1.1, 0.16],
        color: '#f59e0b',
        description: 'A chart connects color to pH range.',
        function: 'Turns a color observation into evidence about acidity or basicity.',
      },
    ],
    lesson: lesson(
      'Predict what color range an indicator might show for vinegar, water, and soap.',
      'Add the same indicator to each labeled sample and compare the colors to a chart.',
      'The acid, neutral, and base samples show different colors.',
      'Indicator molecules change form in different ion conditions, and the new form absorbs light differently.',
    ),
    quiz: quiz(
      'What does an acid-base indicator do?',
      'It changes color to show a pH range.',
      'It makes every solution neutral.',
      {
        prompt: 'Why is an indicator safer than tasting an unknown solution?',
        options: ['It gives pH evidence without putting the sample in your mouth', 'It makes acids turn into candy', 'It removes every hazard', 'It proves the sample is drinkable'],
        correctIndex: 0,
        explanation: 'Indicators let you observe pH without tasting or touching unknown chemicals.',
        misconception: 'A pretty color does not mean a solution is safe to drink or touch.',
      },
    ),
    compareCandidate: 'chem-acids-ph-scale',
    compareReason:
      'An indicator provides the observable color clue, while the pH scale provides the number range that clue points to.',
  },
  {
    id: 'chem-acids-neutralization',
    name: 'Neutralization',
    scientificName: 'Acid-base reaction',
    subject: 'chemistry',
    branch: 'Acids And Bases',
    system: 'Acid-Base Reactions',
    model: authoredChemistryModel('chem-acids-neutralization'),
    tagline: 'Acid plus base can move pH toward neutral',
    summary:
      'Neutralization is a reaction where acid and base particles combine, often forming water and a salt while the pH moves closer to 7.',
    keyFacts: [
      { label: 'Reactants', value: 'Acid + base' },
      { label: 'Products', value: 'Often water + salt' },
      { label: 'pH effect', value: 'Moves toward neutral when amounts match' },
      { label: 'Particle idea', value: 'H+ and OH- can form water' },
      { label: 'Care', value: 'Heat can be released, so mix slowly' },
    ],
    whyItMatters:
      'Neutralization helps treat acid spills, calm stomach acid, adjust soil pH, and control water chemistry.',
    didYouKnow:
      'An antacid tablet works because basic ingredients react with some of the acid in your stomach.',
    belongsTo: ['Chemistry', 'Acids And Bases', 'Acid-Base Reactions'],
    conditions: ['Acid and base both present', 'Amounts affect final pH', 'Mixing may release heat'],
    visual: { shape: 'reaction-flow', variables: ['acid amount', 'base amount', 'final pH'] },
    hotspots: [
      {
        id: 'hs-acid-reactant',
        label: 'Acid reactant',
        position: [-1.0, 0.8, 0.16],
        color: '#ef4444',
        description: 'The acid side contributes hydrogen-ion behavior.',
        function: 'Supplies one half of the neutralization pair.',
      },
      {
        id: 'hs-base-reactant',
        label: 'Base reactant',
        position: [-0.25, 0.8, 0.16],
        color: '#2563eb',
        description: 'The base side contributes hydroxide-ion behavior or accepts hydrogen ions.',
        function: 'Supplies the other half of the neutralization pair.',
      },
      {
        id: 'hs-products',
        label: 'Products',
        position: [1.0, 0.85, 0.16],
        color: '#22c55e',
        description: 'A matched acid-base reaction often forms water and a dissolved salt.',
        function: 'Shows why pH can move closer to neutral after mixing.',
      },
    ],
    lesson: lesson(
      'Predict whether adding small amounts of base to an acid moves the pH up, down, or not at all.',
      'Add base drop by drop to an acidic sample while watching the pH indicator.',
      'The color shifts toward the neutral range as the base amount catches up.',
      'Acid and base particles react with each other, so the leftover ion balance moves toward neutral when the amounts match.',
    ),
    quiz: quiz(
      'What usually happens to pH during careful neutralization of an acid with a base?',
      'The pH moves toward neutral as acid and base react.',
      'The pH must always become 0.',
      {
        prompt: 'What can H+ and OH- form during neutralization?',
        options: ['Water', 'Gold', 'Oxygen gas every time', 'A new planet'],
        correctIndex: 0,
        explanation: 'Hydrogen ions and hydroxide ions can combine to form water.',
        misconception: 'Neutralization changes ion combinations; it does not create unrelated materials.',
      },
    ),
    compareCandidate: 'chem-acids-acid',
    compareReason:
      'Neutralization is easiest to understand after seeing what an acid contributes and how a base can balance it.',
  },
]

export const acidsAndBasesById: Record<string, ComponentContent> = Object.fromEntries(
  acidsAndBases.map((component) => [component.id, component]),
)
