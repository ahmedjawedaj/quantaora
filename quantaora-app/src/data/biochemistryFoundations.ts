import type { ComponentContent, Hotspot, KeyFact, QuizQuestion } from './types'

const subject = 'biology' as const
const branch = 'Biochemistry Foundations'
const authoredBiologyModel = (id: string) => `/models/biology/authored/${id}.glb`
const GLUCOSE_MODEL = '/models/sourced/chemistry-structure/glucose.glb'
const PROTEIN_MODEL = '/models/sourced/biochemistry-structure/hemoglobin-protein.glb'
const ENZYME_MODEL = '/models/sourced/biochemistry-structure/lysozyme-enzyme.glb'
const LIPID_MODEL = '/models/sourced/biochemistry-structure/phospholipid-membrane.glb'
const ATP_MODEL = '/models/sourced/biochemistry-structure/atp-cellular-energy.glb'

function biochemistryModel(id: string) {
  if (id === 'biology-biochemistry-protein') return PROTEIN_MODEL
  if (id === 'biology-biochemistry-enzyme') return ENZYME_MODEL
  if (id === 'biology-biochemistry-carbohydrate') return GLUCOSE_MODEL
  if (id === 'biology-biochemistry-lipid') return LIPID_MODEL
  if (id === 'biology-biochemistry-atp-cellular-energy') return ATP_MODEL
  return authoredBiologyModel(id)
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
      options: [answer, misconception, 'All molecules do the same job', 'Only large molecules matter'],
      correctIndex: 0,
      explanation: answer,
      misconception,
    },
    {
      prompt: 'What is a useful way to test a biochemistry explanation?',
      options: ['Change structure or conditions and observe function', 'Change only the molecule name', 'Ignore temperature and shape', 'Use no evidence'],
      correctIndex: 0,
      explanation: 'Biochemistry links molecular structure and conditions to what the molecule does.',
      misconception: 'Names alone do not explain molecular function.',
    },
    {
      prompt: 'Why does molecular shape matter?',
      options: ['Shape affects which molecules can interact', 'Shape never affects function', 'Only color decides reactions', 'Molecules stop moving in cells'],
      correctIndex: 0,
      explanation: 'Many biological molecules work because their shapes fit or expose particular chemical groups.',
      misconception: 'Color in a model is a teaching cue, not the main cause of molecular function.',
    },
  ]
}

function facts(definition: string, evidence: string, test: string): KeyFact[] {
  return [
    { label: 'Definition', value: definition },
    { label: 'Evidence', value: evidence },
    { label: 'Test move', value: test },
    { label: 'Cell link', value: 'Molecular structure supports cell function' },
  ]
}

function component(input: {
  id: string
  name: string
  scientificName: string
  system: string
  tagline: string
  summary: string
  keyFacts: KeyFact[]
  whyItMatters: string
  didYouKnow: string
  belongsTo: string[]
  conditions: string[]
  visualShape: string
  visualVariables: string[]
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
    model: biochemistryModel(input.id),
    tagline: input.tagline,
    summary: input.summary,
    keyFacts: input.keyFacts,
    whyItMatters: input.whyItMatters,
    didYouKnow: input.didYouKnow,
    belongsTo: input.belongsTo,
    conditions: input.conditions,
    visual: { shape: input.visualShape, variables: input.visualVariables },
    hotspots: input.hotspots,
    lesson: lesson(input.prediction, input.change, input.observe, input.explain),
    quiz: quiz(input.quizPrompt, input.quizAnswer, input.quizMisconception),
    compareCandidate: input.compareCandidate,
    compareReason: input.compareReason,
  }
}

export const biochemistryFoundations: ComponentContent[] = [
  component({
    id: 'biology-biochemistry-protein',
    name: 'Protein',
    scientificName: 'Polypeptide macromolecule',
    system: 'Macromolecule structure',
    tagline: 'A folded chain that performs cell jobs',
    summary:
      'A protein is a molecule made from amino acid chains that fold into working shapes. Proteins can build structures, move materials, send signals, or speed reactions.',
    keyFacts: facts('A folded amino acid chain', 'Sequence and folding affect function', 'Change amino acid sequence and observe shape or function'),
    whyItMatters:
      'Proteins connect DNA instructions to many visible traits and cell activities.',
    didYouKnow:
      'Hair keratin, blood hemoglobin, and digestive enzymes are all proteins with different shapes and jobs.',
    belongsTo: ['Biochemistry', 'Cells', 'Macromolecules'],
    conditions: ['Amino acids link by peptide bonds', 'Chain folds into a shape', 'Shape and chemistry support function'],
    visualShape: 'protein-chain',
    visualVariables: ['amino acid sequence', 'folding', 'function site'],
    hotspots: [
      { id: 'chain', label: 'Amino acid chain', position: [-0.75, 0.15, 0.1], color: '#2563eb', description: 'Linked amino acids form a polypeptide.', function: 'Provides the sequence that guides folding and function.' },
      { id: 'fold', label: 'Fold', position: [0.05, 0.1, 0.1], color: '#7c3aed', description: 'The chain bends into a three-dimensional shape.', function: 'Creates surfaces that can bind, support, or catalyze.' },
      { id: 'site', label: 'Function site', position: [0.75, -0.1, 0.1], color: '#16a34a', description: 'A region where the protein interacts with another molecule.', function: 'Connects structure to job.' },
    ],
    prediction: 'Predict whether changing one amino acid near a function site could change protein activity.',
    change: 'Change the sequence near the function site while keeping the rest of the protein similar.',
    observe: 'Observe whether folding or binding changes.',
    explain: 'Explain why protein function depends on both sequence and shape.',
    quizPrompt: 'What is a protein made from?',
    quizAnswer: 'Chains of amino acids that fold into working shapes.',
    quizMisconception: 'Only sugars linked in rings.',
    compareCandidate: 'biology-biochemistry-enzyme',
    compareReason: 'An enzyme is a protein job type, so comparing it to protein separates structure from one function.',
  }),
  component({
    id: 'biology-biochemistry-enzyme',
    name: 'Enzyme',
    scientificName: 'Biological catalyst',
    system: 'Reaction speed control',
    tagline: 'A catalyst that speeds a specific cell reaction',
    summary:
      'An enzyme is a biological catalyst, usually a protein, that speeds a reaction without being used up. Its active site fits specific reactants and lowers the energy barrier.',
    keyFacts: facts('A biological catalyst', 'Active-site fit changes reaction rate', 'Change temperature, pH, or substrate fit and observe rate'),
    whyItMatters:
      'Enzymes make cell chemistry fast enough for digestion, energy release, DNA copying, and repair.',
    didYouKnow:
      'Many enzyme names end in -ase, such as lactase, amylase, and DNA polymerase.',
    belongsTo: ['Biochemistry', 'Reactions', 'Proteins'],
    conditions: ['Substrate fits active site', 'Conditions support enzyme shape', 'Enzyme is not consumed by the reaction'],
    visualShape: 'protein-chain',
    visualVariables: ['active site', 'substrate fit', 'reaction rate'],
    hotspots: [
      { id: 'active-site', label: 'Active site', position: [-0.55, 0.15, 0.1], color: '#dc2626', description: 'A shaped region where the substrate binds.', function: 'Positions reactants so the reaction can happen more easily.' },
      { id: 'substrate', label: 'Substrate', position: [0.1, 0.05, 0.1], color: '#f97316', description: 'The reactant molecule an enzyme works on.', function: 'Fits the active site when shape and chemistry match.' },
      { id: 'product', label: 'Product', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'The molecule after the reaction.', function: 'Shows that the enzyme helps transform reactants.' },
    ],
    prediction: 'Predict whether the enzyme works faster when the substrate shape matches the active site.',
    change: 'Change the substrate from matching to mismatched shape.',
    observe: 'Observe whether binding and product formation slow down.',
    explain: 'Explain why enzymes are specific and why damaging their shape can reduce activity.',
    quizPrompt: 'What does an enzyme do?',
    quizAnswer: 'Speeds a specific reaction without being used up.',
    quizMisconception: 'Gets permanently consumed every time it helps.',
    compareCandidate: 'biology-biochemistry-protein',
    compareReason: 'Most enzymes are proteins, but not every protein is an enzyme.',
  }),
  component({
    id: 'biology-biochemistry-carbohydrate',
    name: 'Carbohydrate',
    scientificName: 'Saccharide molecule',
    system: 'Sugar and starch chemistry',
    tagline: 'Quick energy and structural chains from sugar units',
    summary:
      'Carbohydrates include sugars, starches, glycogen, and cellulose. Cells use some carbohydrates for energy and others for storage or structure.',
    keyFacts: facts('Molecules built from sugar units', 'Simple and complex carbohydrates differ in chain length and use', 'Change chain length and observe speed of energy release'),
    whyItMatters:
      'Carbohydrates link food, cell respiration, plant structure, and blood glucose regulation.',
    didYouKnow:
      'Cellulose is a carbohydrate that humans cannot digest well, but it forms strong plant cell walls.',
    belongsTo: ['Biochemistry', 'Energy', 'Macromolecules'],
    conditions: ['Sugar units contain carbon, hydrogen, and oxygen', 'Chains can be short or long', 'Cells break some carbohydrates for ATP'],
    visualShape: 'molecule-balls',
    visualVariables: ['sugar unit', 'chain length', 'energy release'],
    hotspots: [
      { id: 'sugar-unit', label: 'Sugar unit', position: [-0.75, 0.2, 0.1], color: '#f59e0b', description: 'A small carbohydrate building block.', function: 'Can be used quickly or linked into larger carbohydrates.' },
      { id: 'chain', label: 'Chain', position: [0.05, 0.05, 0.1], color: '#2563eb', description: 'Linked sugar units form starch, glycogen, or cellulose.', function: 'Changes storage, structure, and digestion speed.' },
      { id: 'energy', label: 'Energy release', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'Cells can break down glucose to help make ATP.', function: 'Connects carbohydrates to cell energy.' },
    ],
    prediction: 'Predict whether a single sugar or long starch chain is broken down more quickly.',
    change: 'Change the carbohydrate from simple sugar to long chain.',
    observe: 'Observe how chain length affects digestion or energy release speed.',
    explain: 'Explain why carbohydrates can be both energy sources and structural materials.',
    quizPrompt: 'What are carbohydrates often built from?',
    quizAnswer: 'Sugar units that can stand alone or link into chains.',
    quizMisconception: 'Amino acids folded into enzymes.',
    compareCandidate: 'biology-biochemistry-atp-cellular-energy',
    compareReason: 'Carbohydrates can fuel ATP production, while ATP is the immediate cell energy carrier.',
  }),
  component({
    id: 'biology-biochemistry-lipid',
    name: 'Lipid',
    scientificName: 'Hydrophobic biomolecule',
    system: 'Membrane and energy storage',
    tagline: 'Water-avoiding molecules build membranes and store energy',
    summary:
      'Lipids include fats, oils, phospholipids, and steroids. Many lipids avoid water, which makes them useful for membranes, long-term energy storage, insulation, and signaling.',
    keyFacts: facts('Hydrophobic or partly hydrophobic biomolecules', 'Phospholipids form membranes because heads and tails interact differently with water', 'Change water exposure and observe bilayer formation'),
    whyItMatters:
      'Lipids explain why cells have boundaries and why bodies can store concentrated energy.',
    didYouKnow:
      'Cell membranes are mostly a phospholipid bilayer with proteins embedded in it.',
    belongsTo: ['Biochemistry', 'Cell membranes', 'Energy storage'],
    conditions: ['Hydrophobic tails avoid water', 'Hydrophilic heads face water', 'Different lipid types have different jobs'],
    visualShape: 'membrane-bilayer',
    visualVariables: ['water exposure', 'phospholipid head', 'fatty acid tail'],
    hotspots: [
      { id: 'head', label: 'Water-loving head', position: [-0.6, 0.25, 0.1], color: '#0ea5e9', description: 'The polar part of a phospholipid.', function: 'Faces watery surroundings inside and outside the cell.' },
      { id: 'tail', label: 'Water-avoiding tail', position: [0.05, 0, 0.1], color: '#f97316', description: 'Fatty acid tails avoid water.', function: 'Drives bilayer formation and creates a barrier.' },
      { id: 'bilayer', label: 'Bilayer', position: [0.75, -0.1, 0.1], color: '#16a34a', description: 'Two layers arranged tail-to-tail.', function: 'Forms a flexible boundary around cells and organelles.' },
    ],
    prediction: 'Predict how phospholipids arrange when surrounded by water.',
    change: 'Change the environment from dry to watery.',
    observe: 'Observe heads face water while tails tuck inward.',
    explain: 'Explain why lipid structure makes membranes possible.',
    quizPrompt: 'Why are phospholipids useful in membranes?',
    quizAnswer: 'Their heads face water and their tails avoid water, forming a bilayer.',
    quizMisconception: 'They dissolve completely so no boundary forms.',
    compareCandidate: 'biology-biochemistry-protein',
    compareReason: 'Membranes use lipids for the barrier and proteins for many transport and signal jobs.',
  }),
  component({
    id: 'biology-biochemistry-atp-cellular-energy',
    name: 'ATP Cellular Energy',
    scientificName: 'Adenosine triphosphate',
    system: 'Immediate energy transfer',
    tagline: 'A small molecule cells use to transfer usable energy',
    summary:
      'ATP is a cell energy-transfer molecule. Cells build ATP during processes such as cellular respiration and then use ATP breakdown to power transport, movement, synthesis, and signaling.',
    keyFacts: facts('Adenosine triphosphate, a short-term energy carrier', 'ATP is made and used continuously in cells', 'Change ATP supply and observe which cell jobs slow'),
    whyItMatters:
      'ATP connects food energy to the immediate work cells must do every second.',
    didYouKnow:
      'Your body recycles ATP constantly; a single ATP molecule can be used and remade many times.',
    belongsTo: ['Biochemistry', 'Cellular respiration', 'Energy'],
    conditions: ['Energy from food or light is captured', 'ATP is built from ADP and phosphate', 'ATP breakdown powers cell work'],
    visualShape: 'energy-cycle',
    visualVariables: ['ATP supply', 'ADP recycling', 'cell work'],
    hotspots: [
      { id: 'phosphate', label: 'Phosphate group', position: [-0.75, 0.2, 0.1], color: '#f59e0b', description: 'One of the linked phosphate groups in ATP.', function: 'Participates in ATP breakdown and energy transfer.' },
      { id: 'recycling', label: 'Recycling', position: [0, 0.05, 0.1], color: '#2563eb', description: 'ADP and phosphate can be rebuilt into ATP.', function: 'Keeps energy transfer cycling in living cells.' },
      { id: 'cell-work', label: 'Cell work', position: [0.8, -0.1, 0.1], color: '#16a34a', description: 'Transport, movement, building molecules, and signaling.', function: 'Shows where ATP energy transfer is used.' },
    ],
    prediction: 'Predict which cell jobs slow when ATP supply drops.',
    change: 'Change ATP supply from high to low while keeping cell demands the same.',
    observe: 'Observe transport, movement, or building tasks slow as ATP becomes limited.',
    explain: 'Explain why ATP is a transfer molecule, not the original food energy itself.',
    quizPrompt: 'What is ATP used for in cells?',
    quizAnswer: 'Transferring usable energy to power cell work.',
    quizMisconception: 'Storing all body energy forever in one molecule.',
    compareCandidate: 'biology-biochemistry-carbohydrate',
    compareReason: 'Carbohydrates can feed energy pathways, while ATP directly powers many cell jobs.',
  }),
]

export const biochemistryFoundationsById = Object.fromEntries(
  biochemistryFoundations.map((component) => [component.id, component]),
) as Record<string, ComponentContent>
