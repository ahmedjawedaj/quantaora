import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'chemistry' as const
const branch = 'Biochemistry Links'
const authoredChemistryModel = (id: string) => `/models/chemistry/authored/${id}.glb`
const GLUCOSE_MODEL = '/models/sourced/chemistry-structure/glucose.glb'
const PROTEIN_MODEL = '/models/sourced/biochemistry-structure/hemoglobin-protein.glb'
const ENZYME_MODEL = '/models/sourced/biochemistry-structure/lysozyme-enzyme.glb'
const LIPID_MODEL = '/models/sourced/biochemistry-structure/phospholipid-membrane.glb'

function facts(definition: string, cause: string, effect: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Cause', value: cause },
    { label: 'Effect', value: effect },
    { label: 'Life link', value: 'Molecular structure helps explain what living cells can do.' },
    { label: 'Evidence habit', value: 'Change shape, bonding, or conditions and observe function.' },
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
      options: [answer, misconception, 'Living molecules have no structure', 'Only model color controls function'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is the best evidence move in biochemistry?',
      options: ['Change one molecular feature and observe function', 'Change every condition at once', 'Ignore shape', 'Use only the molecule name'],
      correctIndex: 0,
      explanation: 'Biochemistry explains life by linking molecular features to function.',
      misconception: 'Names classify molecules, but evidence comes from structure and behavior.',
    },
    {
      prompt: 'Why can shape change function?',
      options: ['Shape affects which molecules can bind or interact', 'Shape never matters in cells', 'Large molecules are always useless', 'Atoms stop moving in water'],
      correctIndex: 0,
      explanation: 'Binding, folding, and barriers often depend on shape and attractions.',
      misconception: 'A small structural change can have a large biological effect.',
    },
    {
      prompt: 'What should you track when conditions change?',
      options: ['Structure and job together', 'Only spelling', 'Only screen brightness', 'Nothing, because cells are random'],
      correctIndex: 0,
      explanation: 'Conditions such as pH, temperature, and water exposure can change molecular behavior.',
      misconception: 'Cell chemistry is patterned enough to predict and test.',
    },
  ]
}

function component(input: {
  id: string
  name: string
  scientificName: string
  system: string
  model?: string
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
    model: input.model ?? authoredChemistryModel(input.id),
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

export const biochemistryLinks: ComponentContent[] = [
  component({
    id: 'chem-biolink-amino-acid',
    name: 'Amino Acid',
    scientificName: 'Amino acid monomer',
    system: 'Protein Building Blocks',
    visualShape: 'molecule-balls',
    visualVariables: ['amino group', 'carboxyl group', 'side chain'],
    tagline: 'A small unit that builds proteins',
    summary: 'An amino acid has a shared backbone and a variable side chain. Cells link amino acids to build proteins with different shapes and jobs.',
    keyFacts: facts('A protein-building monomer', 'Changing the side chain changes chemical behavior', 'Protein chains can fold differently'),
    whyItMatters: 'Amino acids connect nutrition, DNA instructions, enzymes, muscles, and many cell structures.',
    didYouKnow: 'Cells commonly use 20 amino acids to build many thousands of different proteins.',
    belongsTo: ['Chemistry', 'Biochemistry Links', 'Proteins'],
    conditions: ['Has amino and carboxyl groups', 'Side chain differs by amino acid', 'Can link by peptide bonds'],
    hotspots: [
      { id: 'amino-group', label: 'Amino group', position: [-0.75, 0.2, 0], color: '#2563eb', description: 'A nitrogen-containing part of the amino acid backbone.', function: 'Participates in peptide-bond formation.' },
      { id: 'carboxyl-group', label: 'Carboxyl group', position: [0.1, 0.25, 0], color: '#dc2626', description: 'An acid group on the other end of the backbone.', function: 'Links with another amino acid during protein building.' },
      { id: 'side-chain', label: 'Side chain', position: [0.8, -0.05, 0], color: '#16a34a', description: 'The variable group that differs among amino acids.', function: 'Helps determine folding and interactions.' },
    ],
    prediction: 'Predict how changing the side chain could change where an amino acid fits in a protein.',
    change: 'Swap a water-loving side chain for a water-avoiding side chain.',
    observe: 'Observe that the preferred position in a folded protein can change.',
    explain: 'Side-chain chemistry affects attractions, so sequence changes can alter folding.',
    quizPrompt: 'What part of an amino acid differs most among amino acids?',
    quizAnswer: 'The side chain.',
    quizMisconception: 'The molecule has no variable part.',
    compareCandidate: 'chem-biolink-protein-folding',
    compareReason: 'Amino acids are the units; protein folding shows what linked units can become.',
  }),
  component({
    id: 'chem-biolink-protein-folding',
    name: 'Protein Folding',
    scientificName: 'Polypeptide folding',
    system: 'Shape And Function',
    model: PROTEIN_MODEL,
    visualShape: 'protein-chain',
    visualVariables: ['amino acid sequence', 'water exposure', 'folded shape'],
    tagline: 'A chain bends into a working shape',
    summary: 'Protein folding is the process where an amino acid chain bends into a three-dimensional shape. That shape creates surfaces for structure, binding, or catalysis.',
    keyFacts: facts('A chain forming a functional 3D shape', 'Sequence and conditions guide folding', 'A changed shape can change or stop protein function'),
    whyItMatters: 'Protein folding explains enzymes, antibodies, muscles, and why heat or pH can damage some proteins.',
    didYouKnow: 'Cooking an egg changes protein folding, which is why the clear egg white turns solid and opaque.',
    belongsTo: ['Chemistry', 'Biochemistry Links', 'Proteins'],
    conditions: ['Amino acid sequence is present', 'Water and temperature affect attractions', 'Correct folding creates function sites'],
    hotspots: [
      { id: 'chain-path', label: 'Chain path', position: [-0.8, 0.15, 0], color: '#2563eb', description: 'The linked amino acid sequence.', function: 'Provides the order that influences folding.' },
      { id: 'fold-pocket', label: 'Fold pocket', position: [0.05, 0.3, 0], color: '#7c3aed', description: 'A shaped region made by bending the chain.', function: 'Can become a binding or active site.' },
      { id: 'condition-zone', label: 'Conditions', position: [0.85, -0.05, 0], color: '#f97316', description: 'Temperature and pH around the protein.', function: 'Can support or disturb the folded shape.' },
    ],
    prediction: 'Predict what happens to protein function if heat unfolds the chain.',
    change: 'Raise temperature enough to disturb weak attractions in the folded protein.',
    observe: 'Observe that the pocket shape changes and binding can fail.',
    explain: 'Function depends on shape, so unfolding can remove the surfaces needed for the job.',
    quizPrompt: 'Why does folding matter?',
    quizAnswer: 'It creates the shape a protein needs to work.',
    quizMisconception: 'It only makes the model look tidy.',
    compareCandidate: 'chem-biolink-enzyme-substrate',
    compareReason: 'Protein folding creates shapes; enzyme-substrate fit is one powerful use of a shaped protein.',
  }),
  component({
    id: 'chem-biolink-enzyme-substrate',
    name: 'Enzyme-Substrate Fit',
    scientificName: 'Enzyme-substrate complex',
    system: 'Reaction Catalysis',
    model: ENZYME_MODEL,
    visualShape: 'reaction-flow',
    visualVariables: ['active site', 'substrate fit', 'reaction rate'],
    tagline: 'A shaped pocket speeds one reaction',
    summary: 'An enzyme-substrate fit happens when a reactant binds to an enzyme active site. Good fit positions the reactant so the reaction happens faster.',
    keyFacts: facts('A substrate binding to an enzyme active site', 'Changing fit changes reaction speed', 'Matched substrates form products more easily'),
    whyItMatters: 'Enzyme-substrate fit explains digestion, DNA copying, cellular energy release, and many medicines.',
    didYouKnow: 'Lactase works on lactose; people with low lactase can have trouble digesting milk sugar.',
    belongsTo: ['Chemistry', 'Biochemistry Links', 'Enzymes'],
    conditions: ['Active site has the right shape', 'Substrate reaches the enzyme', 'Temperature and pH preserve enzyme shape'],
    hotspots: [
      { id: 'active-site', label: 'Active site', position: [-0.75, 0.2, 0], color: '#dc2626', description: 'The shaped pocket on the enzyme.', function: 'Positions the substrate for reaction.' },
      { id: 'substrate', label: 'Substrate', position: [0.05, 0.3, 0], color: '#f97316', description: 'The reactant molecule that binds.', function: 'Changes into product when the reaction proceeds.' },
      { id: 'product', label: 'Product', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The result after the enzyme-assisted reaction.', function: 'Shows the reaction outcome.' },
    ],
    prediction: 'Predict whether a mismatched substrate will react as quickly as a matched one.',
    change: 'Change the substrate shape while keeping the enzyme active site the same.',
    observe: 'Observe that poor fit slows binding and product formation.',
    explain: 'Enzymes are specific because shape and chemistry control how well the substrate fits.',
    quizPrompt: 'What binds at an enzyme active site?',
    quizAnswer: 'A matching substrate.',
    quizMisconception: 'Any random molecule equally well.',
    compareCandidate: 'chem-biolink-protein-folding',
    compareReason: 'Enzyme fit depends on the folded protein shape being maintained.',
  }),
  component({
    id: 'chem-biolink-carbohydrate',
    name: 'Carbohydrate',
    scientificName: 'Saccharide biomolecule',
    system: 'Sugars And Energy',
    model: GLUCOSE_MODEL,
    visualShape: 'molecule-balls',
    visualVariables: ['sugar unit', 'chain length', 'energy release'],
    tagline: 'Sugar units for energy and structure',
    summary: 'Carbohydrates are molecules built from sugar units. Cells use some for quick energy, some for storage, and some for structures like plant cell walls.',
    keyFacts: facts('A biomolecule made from sugar units', 'Changing chain length changes use and breakdown speed', 'Simple sugars and long starches behave differently'),
    whyItMatters: 'Carbohydrates link food, plant structure, blood sugar, and cell energy pathways.',
    didYouKnow: 'Cellulose is a carbohydrate that strengthens plant cell walls, even though humans cannot digest it well.',
    belongsTo: ['Chemistry', 'Biochemistry Links', 'Carbohydrates'],
    conditions: ['Contains carbon, hydrogen, and oxygen', 'Sugar units can be single or linked', 'Cells can break some carbohydrates for energy'],
    hotspots: [
      { id: 'sugar-ring', label: 'Sugar unit', position: [-0.75, 0.2, 0], color: '#f59e0b', description: 'A small carbohydrate building block.', function: 'Can be used directly or linked into larger molecules.' },
      { id: 'glycosidic-link', label: 'Chain link', position: [0.05, 0.25, 0], color: '#2563eb', description: 'A bond joining sugar units.', function: 'Creates starch, glycogen, or cellulose chains.' },
      { id: 'energy-path', label: 'Energy path', position: [0.85, -0.05, 0], color: '#16a34a', description: 'Cells can break glucose down for usable energy.', function: 'Connects carbohydrate structure to cell work.' },
    ],
    prediction: 'Predict whether a single sugar or long starch chain is available faster for energy.',
    change: 'Change from one glucose unit to a long chain of glucose units.',
    observe: 'Observe that the long chain must be broken apart before many cells can use the sugar units.',
    explain: 'Chain length changes how quickly carbohydrate energy becomes available.',
    quizPrompt: 'What are carbohydrates often built from?',
    quizAnswer: 'Sugar units.',
    quizMisconception: 'Only amino acid side chains.',
    compareCandidate: 'chem-biolink-lipid-membrane',
    compareReason: 'Carbohydrates often support energy or recognition, while lipid membranes create cell boundaries.',
  }),
  component({
    id: 'chem-biolink-lipid-membrane',
    name: 'Lipid Membrane',
    scientificName: 'Phospholipid bilayer',
    system: 'Cell Boundaries',
    model: LIPID_MODEL,
    visualShape: 'membrane-bilayer',
    visualVariables: ['water-facing heads', 'water-avoiding tails', 'barrier'],
    tagline: 'A double layer that makes a cell boundary',
    summary: 'A lipid membrane forms when phospholipids arrange with water-loving heads outward and water-avoiding tails inward. The bilayer becomes a flexible barrier.',
    keyFacts: facts('A bilayer made from phospholipids', 'Water exposure causes heads and tails to arrange differently', 'A selective cell boundary forms'),
    whyItMatters: 'Lipid membranes let cells keep an inside environment while exchanging selected materials with the outside.',
    didYouKnow: 'Cell membranes are fluid: many lipids and proteins can move sideways within the bilayer.',
    belongsTo: ['Chemistry', 'Biochemistry Links', 'Membranes'],
    conditions: ['Phospholipids have hydrophilic heads', 'Tails are hydrophobic', 'Watery surroundings drive bilayer arrangement'],
    hotspots: [
      { id: 'head-layer', label: 'Water-loving heads', position: [-0.75, 0.3, 0], color: '#0ea5e9', description: 'Polar heads face watery spaces.', function: 'Stabilizes the membrane surface in water.' },
      { id: 'tail-core', label: 'Water-avoiding tails', position: [0.05, 0.05, 0], color: '#f97316', description: 'Fatty acid tails tuck away from water.', function: 'Creates the inner barrier.' },
      { id: 'barrier', label: 'Selective barrier', position: [0.85, -0.05, 0], color: '#16a34a', description: 'The bilayer separates inside from outside.', function: 'Helps control what enters or leaves a cell.' },
    ],
    prediction: 'Predict how phospholipids arrange when placed in water.',
    change: 'Move loose phospholipids into a watery environment.',
    observe: 'Observe heads face water and tails gather inward to form a bilayer.',
    explain: 'Different attractions with water cause the membrane arrangement and create a boundary.',
    quizPrompt: 'What forms the main barrier of many cell membranes?',
    quizAnswer: 'A phospholipid bilayer.',
    quizMisconception: 'A solid wall made only of sugar crystals.',
    compareCandidate: 'chem-biolink-carbohydrate',
    compareReason: 'Lipid membranes form boundaries, while carbohydrates often provide energy, structure, or cell-surface tags.',
  }),
]

export const biochemistryLinksById = Object.fromEntries(
  biochemistryLinks.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
